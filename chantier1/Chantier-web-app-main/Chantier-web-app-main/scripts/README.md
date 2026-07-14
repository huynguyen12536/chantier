# Guide de création des utilisateurs de test

## Méthode 1 : Via la console du navigateur (RECOMMANDÉ - Simple et rapide)

1. **Ouvrez votre application** dans le navigateur
2. **Ouvrez la console** (F12 ou clic droit > Inspecter > Console)
3. **Copiez-collez** le code suivant dans la console :

```javascript
const SUPABASE_URL = 'VOTRE_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'VOTRE_SUPABASE_ANON_KEY';

async function createUser(userData) {
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

// Créer tous les utilisateurs de test
async function createAll() {
  console.log('🚀 Création des utilisateurs...\n');

  await createUser({
    email: 'ouvrier@test.fr',
    password: 'Test123456!',
    nom: 'Dupont',
    prenom: 'Jean',
    matricule: 'OUV-001',
    role: 'ouvrier',
  });

  await createUser({
    email: 'chef@test.fr',
    password: 'Test123456!',
    nom: 'Martin',
    prenom: 'Pierre',
    matricule: 'CHEF-001',
    role: 'chef_equipe',
  });

  await createUser({
    email: 'admin@test.fr',
    password: 'Test123456!',
    nom: 'Durand',
    prenom: 'Sophie',
    matricule: 'ADMIN-001',
    role: 'admin',
  });

  console.log('\n✨ Terminé!');
}

// Lancer la création
createAll();
```

4. **Remplacez** `VOTRE_SUPABASE_URL` et `VOTRE_SUPABASE_ANON_KEY` par vos vraies valeurs (visibles dans le fichier `.env`)
5. **Appuyez sur Entrée**

---

## Méthode 2 : Avec cURL (pour les développeurs)

```bash
# Remplacez VOTRE_SUPABASE_URL et VOTRE_SUPABASE_ANON_KEY

# Créer un ouvrier
curl -X POST "VOTRE_SUPABASE_URL/functions/v1/create-user" \
  -H "Authorization: Bearer VOTRE_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ouvrier@test.fr",
    "password": "Test123456!",
    "nom": "Dupont",
    "prenom": "Jean",
    "matricule": "OUV-001",
    "role": "ouvrier"
  }'

# Créer un chef d'équipe
curl -X POST "VOTRE_SUPABASE_URL/functions/v1/create-user" \
  -H "Authorization: Bearer VOTRE_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "chef@test.fr",
    "password": "Test123456!",
    "nom": "Martin",
    "prenom": "Pierre",
    "matricule": "CHEF-001",
    "role": "chef_equipe"
  }'

# Créer un admin
curl -X POST "VOTRE_SUPABASE_URL/functions/v1/create-user" \
  -H "Authorization: Bearer VOTRE_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.fr",
    "password": "Test123456!",
    "nom": "Durand",
    "prenom": "Sophie",
    "matricule": "ADMIN-001",
    "role": "admin"
  }'
```

---

## Utilisateurs créés

Une fois le script exécuté, vous aurez 3 utilisateurs de test :

| Email | Mot de passe | Rôle | Matricule |
|-------|--------------|------|-----------|
| ouvrier@test.fr | Test123456! | Ouvrier | OUV-001 |
| chef@test.fr | Test123456! | Chef d'équipe | CHEF-001 |
| admin@test.fr | Test123456! | Administrateur | ADMIN-001 |

---

## Créer un utilisateur personnalisé

Pour créer un utilisateur avec des informations spécifiques :

```javascript
await createUser({
  email: 'votre.email@example.com',
  password: 'VotreMotDePasse123!',
  nom: 'Nom',
  prenom: 'Prénom',
  matricule: 'MAT-XXX',
  role: 'ouvrier', // ou 'chef_equipe', 'administratif', 'admin'
});
```

---

## Dépannage

### Erreur "User already exists"
L'utilisateur existe déjà. Utilisez un autre email ou supprimez l'utilisateur depuis le dashboard Supabase (Authentication > Users).

### Erreur "Matricule already exists"
Le matricule doit être unique. Changez le matricule pour un nouveau.

### Erreur de connexion
Vérifiez que vous avez bien remplacé `VOTRE_SUPABASE_URL` et `VOTRE_SUPABASE_ANON_KEY` par les vraies valeurs.
