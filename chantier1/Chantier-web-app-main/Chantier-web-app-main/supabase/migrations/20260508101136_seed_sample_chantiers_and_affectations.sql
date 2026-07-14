/*
  # Seed sample chantiers and chef affectations

  1. Insert 3 sample chantiers matching the mockup design
  2. Create affectations_chantiers linking chef_equipe to these chantiers
*/

-- Insert sample chantiers (skip if code already exists)
INSERT INTO chantiers (id, nom, code, adresse, actif, date_debut, date_fin)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Chantier Centre-Ville', 'CV-001', '12 Rue de la Paix, Paris', true, '2026-01-01', null),
  ('c1000000-0000-0000-0000-000000000002', 'Résidence Les Jardins', 'RJ-002', '45 Avenue des Fleurs, Lyon', true, '2026-02-01', null),
  ('c1000000-0000-0000-0000-000000000003', 'ZAC Nord', 'ZN-003', 'Zone Industrielle Nord, Lille', true, '2026-03-01', null)
ON CONFLICT (id) DO NOTHING;

-- Link chef_equipe to all 3 chantiers
INSERT INTO affectations_chantiers (user_id, chantier_id, chef_equipe_id, date_debut, date_fin)
VALUES
  ('abf6ad8b-8878-439a-b22b-a55ab1c4df49', 'c1000000-0000-0000-0000-000000000001', 'abf6ad8b-8878-439a-b22b-a55ab1c4df49', '2026-01-01', null),
  ('abf6ad8b-8878-439a-b22b-a55ab1c4df49', 'c1000000-0000-0000-0000-000000000002', 'abf6ad8b-8878-439a-b22b-a55ab1c4df49', '2026-02-01', null),
  ('abf6ad8b-8878-439a-b22b-a55ab1c4df49', 'c1000000-0000-0000-0000-000000000003', 'abf6ad8b-8878-439a-b22b-a55ab1c4df49', '2026-03-01', null)
ON CONFLICT DO NOTHING;
