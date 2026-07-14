/*
  # Replace fake seeded chantiers with real ones

  1. Remove affectations pointing to fake seeded chantiers
  2. Remove fake seeded chantiers
  3. Create affectations linking chef_equipe to the 3 real chantiers
*/

-- Remove fake affectations
DELETE FROM affectations_chantiers
WHERE chantier_id IN (
  'c1000000-0000-0000-0000-000000000001',
  'c1000000-0000-0000-0000-000000000002',
  'c1000000-0000-0000-0000-000000000003'
);

-- Remove fake chantiers
DELETE FROM chantiers
WHERE id IN (
  'c1000000-0000-0000-0000-000000000001',
  'c1000000-0000-0000-0000-000000000002',
  'c1000000-0000-0000-0000-000000000003'
);

-- Link chef_equipe to the 3 real chantiers
INSERT INTO affectations_chantiers (user_id, chantier_id, chef_equipe_id, date_debut, date_fin)
SELECT
  'abf6ad8b-8878-439a-b22b-a55ab1c4df49',
  id,
  'abf6ad8b-8878-439a-b22b-a55ab1c4df49',
  date_debut,
  null
FROM chantiers
ON CONFLICT DO NOTHING;
