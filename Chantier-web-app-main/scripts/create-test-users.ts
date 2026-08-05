/**
 * Script pour créer des utilisateurs de test via l'Edge Function
 *
 * Usage:
 * 1. Ouvrez la console du navigateur (F12)
 * 2. Copiez-collez ce script dans la console
 * 3. Exécutez: await createTestUsers()
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function createUser(userData: {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  matricule: string;
  role: string;
}) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/create-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(userData),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error(`❌ Erreur pour ${userData.email}:`, result.error);
    return null;
  }

  console.log(`✅ Utilisateur créé: ${userData.email} (${userData.role})`);
  return result;
}

export async function createTestUsers() {
  console.log('🚀 Création des utilisateurs de test...\n');

  // 1. Créer un ouvrier
  await createUser({
    email: 'ouvrier@test.fr',
    password: 'Test123456!',
    nom: 'Dupont',
    prenom: 'Jean',
    matricule: 'OUV-001',
    role: 'ouvrier',
  });

  // 2. Créer un chef d'équipe
  await createUser({
    email: 'chef@test.fr',
    password: 'Test123456!',
    nom: 'Martin',
    prenom: 'Pierre',
    matricule: 'CHEF-001',
    role: 'chef_equipe',
  });

  // 3. Créer un administratif
  await createUser({
    email: 'admin@test.fr',
    password: 'Test123456!',
    nom: 'Durand',
    prenom: 'Sophie',
    matricule: 'ADMIN-001',
    role: 'admin',
  });

  console.log('\n✨ Terminé! Vous pouvez maintenant vous connecter avec:');
  console.log('- ouvrier@test.fr / Test123456!');
  console.log('- chef@test.fr / Test123456!');
  console.log('- admin@test.fr / Test123456!');
}

// Pour utiliser dans la console du navigateur:
// await createTestUsers()
