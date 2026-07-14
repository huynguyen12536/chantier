/*
  # Ajout des champs panier repas et déplacement
  
  ## Description
  Ajout de champs pour suivre les paniers repas et les déplacements par jour,
  permettant une saisie simplifiée par les ouvriers.
  
  ## 1. Modifications de Tables
  
  ### `periodes_travail`
  - Ajout de `panier_repas` (boolean) - Panier repas pris ce jour
  - Ajout de `deplacement` (boolean) - Déplacement effectué ce jour
  
  ### `declarations_heures`
  - Ajout de `nb_deplacements` (integer) - Nombre de jours avec déplacement
  
  ## 2. Notes
  - Les champs sont optionnels avec des valeurs par défaut à false
  - La vue de synthèse sera recréée pour agréger ces informations
  - La fonction de synchronisation sera adaptée
*/

-- Ajout des colonnes à periodes_travail
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'periodes_travail' AND column_name = 'panier_repas'
  ) THEN
    ALTER TABLE periodes_travail ADD COLUMN panier_repas boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'periodes_travail' AND column_name = 'deplacement'
  ) THEN
    ALTER TABLE periodes_travail ADD COLUMN deplacement boolean DEFAULT false;
  END IF;
END $$;

-- Ajout de nb_deplacements à declarations_heures
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'declarations_heures' AND column_name = 'nb_deplacements'
  ) THEN
    ALTER TABLE declarations_heures ADD COLUMN nb_deplacements integer DEFAULT 0;
  END IF;
END $$;

-- Suppression et recréation de la vue de synthèse pour inclure les nouveaux champs
DROP VIEW IF EXISTS synthese_heures_journalieres CASCADE;

CREATE VIEW synthese_heures_journalieres AS
SELECT 
  user_id,
  chantier_id,
  date,
  -- Total des heures travaillées
  SUM(calculer_duree_periode(heure_debut, heure_fin)) as total_heures,
  -- Heures normales (max 7h par jour par chantier)
  LEAST(SUM(calculer_duree_periode(heure_debut, heure_fin)), 7.0) as heures_normales,
  -- Heures supplémentaires (au-delà de 7h)
  GREATEST(SUM(calculer_duree_periode(heure_debut, heure_fin)) - 7.0, 0.0) as heures_supplementaires,
  -- Nombre de paniers repas pour la journée
  CASE WHEN BOOL_OR(panier_repas) THEN 1 ELSE 0 END as nb_paniers,
  -- Nombre de déplacements pour la journée
  CASE WHEN BOOL_OR(deplacement) THEN 1 ELSE 0 END as nb_deplacements,
  -- Statut global
  CASE 
    WHEN BOOL_AND(statut = 'validee') THEN 'validee'
    WHEN BOOL_OR(statut = 'en_cours') THEN 'brouillon'
    ELSE 'soumise'
  END as statut,
  MAX(updated_at) as updated_at
FROM periodes_travail
WHERE statut != 'rejetee'
GROUP BY user_id, chantier_id, date;

-- Recréation de la fonction de synchronisation
CREATE OR REPLACE FUNCTION sync_declarations_from_periods()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertion ou mise à jour de la synthèse dans declarations_heures
  INSERT INTO declarations_heures (
    user_id, 
    chantier_id, 
    date, 
    heures_normales, 
    heures_supplementaires, 
    nb_paniers,
    nb_deplacements,
    statut,
    updated_at
  )
  SELECT 
    user_id,
    chantier_id,
    date,
    heures_normales,
    heures_supplementaires,
    nb_paniers,
    nb_deplacements,
    statut,
    NOW()
  FROM synthese_heures_journalieres
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    AND chantier_id = COALESCE(NEW.chantier_id, OLD.chantier_id)
    AND date = COALESCE(NEW.date, OLD.date)
  ON CONFLICT (user_id, chantier_id, date)
  DO UPDATE SET
    heures_normales = EXCLUDED.heures_normales,
    heures_supplementaires = EXCLUDED.heures_supplementaires,
    nb_paniers = EXCLUDED.nb_paniers,
    nb_deplacements = EXCLUDED.nb_deplacements,
    statut = EXCLUDED.statut,
    updated_at = NOW();
    
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Recréation du trigger
DROP TRIGGER IF EXISTS trigger_sync_declarations ON periodes_travail;
CREATE TRIGGER trigger_sync_declarations
  AFTER INSERT OR UPDATE OR DELETE ON periodes_travail
  FOR EACH ROW
  EXECUTE FUNCTION sync_declarations_from_periods();
