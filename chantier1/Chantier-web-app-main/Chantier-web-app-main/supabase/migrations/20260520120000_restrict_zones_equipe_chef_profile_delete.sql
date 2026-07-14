-- Empêcher la suppression d'un profil s'il dirige encore une zone d'équipe.
-- Avant ce changement : ON DELETE CASCADE sur zones_equipe.chef_equipe_id supprimait
-- tout le périmètre zone (zones_chantiers, zones_ouvriers) lors de la suppression
-- d'un utilisateur chef — ce qui cassait les données des chantiers liés sans message clair.

ALTER TABLE zones_equipe
  DROP CONSTRAINT IF EXISTS zones_equipe_chef_equipe_id_fkey;

ALTER TABLE zones_equipe
  ADD CONSTRAINT zones_equipe_chef_equipe_id_fkey
    FOREIGN KEY (chef_equipe_id)
    REFERENCES profiles(id)
    ON DELETE RESTRICT;
