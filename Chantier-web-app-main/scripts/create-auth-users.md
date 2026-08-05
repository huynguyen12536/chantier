# Guide de création des utilisateurs Auth dans Supabase

## Étape 1: Créer les utilisateurs dans Supabase Auth

Allez dans votre dashboard Supabase → Authentication → Users → "Add user"

### 1. Administrateur
- **Email**: `admin@test.fr`
- **Password**: `Test123456!`
- **User ID**: `00000000-0000-0000-0000-000000000001`
- ✅ **Auto Confirm User** (important!)

### 2. Chef d'équipe
- **Email**: `chef@test.fr`
- **Password**: `Test123456!`
- **User ID**: `00000000-0000-0000-0000-000000000002`
- ✅ **Auto Confirm User**

### 3. Ouvrier 1
- **Email**: `ouvrier@test.fr`
- **Password**: `Test123456!`
- **User ID**: `00000000-0000-0000-0000-000000000003`
- ✅ **Auto Confirm User**

### 4. Administratif (Paie)
- **Email**: `admin-paie@test.fr`
- **Password**: `Test123456!`
- **User ID**: `00000000-0000-0000-0000-000000000004`
- ✅ **Auto Confirm User**

### 5. Ouvrier 2
- **Email**: `ouvrier2@test.fr`
- **Password**: `Test123456!`
- **User ID**: `00000000-0000-0000-0000-000000000005`
- ✅ **Auto Confirm User**

## Étape 2: Exécuter la migration

Après avoir créé les utilisateurs Auth, exécutez la migration SQL:

```sql
-- Dans Supabase SQL Editor
-- Copiez et exécutez le contenu du fichier create_sample_data.sql
```

## Étape 3: Vérification

Vérifiez que les données ont été créées:

```sql
-- Vérifier les profils
SELECT * FROM profiles;

-- Vérifier les chantiers
SELECT * FROM chantiers;

-- Vérifier les affectations
SELECT 
  p.nom, p.prenom, p.role,
  c.nom as chantier_nom,
  a.date_debut
FROM affectations_chantiers a
JOIN profiles p ON a.user_id = p.id
JOIN chantiers c ON a.chantier_id = c.id;
```

## Comptes de test créés

| Email | Mot de passe | Rôle | Accès |
|-------|--------------|------|-------|
| admin@test.fr | Test123456! | Administrateur | Tous les modules |
| chef@test.fr | Test123456! | Chef d'équipe | Validation, gestion équipe |
| ouvrier@test.fr | Test123456! | Ouvrier | Déclaration heures |
| admin-paie@test.fr | Test123456! | Administratif | Export données |
| ouvrier2@test.fr | Test123456! | Ouvrier | Déclaration heures |

## Données créées

### 🏗️ **3 Chantiers**
- **CV-001**: Construction Villa Moderne (Paris)
- **RJ-002**: Rénovation Immeuble Haussmann (Paris)  
- **ECC-003**: Extension Centre Commercial (Lyon)

### 👥 **Affectations**
- Chef d'équipe: Gérant CV-001 et RJ-002
- Ouvrier 1: Affecté à CV-001 et RJ-002
- Ouvrier 2: Affecté à CV-001

### ⏰ **Données de test**
- Périodes de travail de la semaine dernière
- Déclarations en attente et validées
- Données pour tester tous les modules

## Troubleshooting

### Erreur "User already exists"
- L'utilisateur existe déjà dans Auth
- Utilisez un autre email ou supprimez l'utilisateur existant

### Erreur "Matricule already exists"  
- Le matricule doit être unique
- Modifiez le matricule dans la migration

### Erreur de permissions
- Vérifiez que RLS est bien configuré
- Les policies doivent permettre l'insertion des données