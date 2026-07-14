# 🗄️ Guide Setup Database BTP

## 📋 **Étapes de configuration**

### **Étape 1: Créer les utilisateurs Auth**

Allez dans votre **Supabase Dashboard** → **Authentication** → **Users** → **Add user**

Créez ces 5 utilisateurs avec les UUIDs exacts:

| Email | Password | User ID | Role |
|-------|----------|---------|------|
| `admin@test.fr` | `Test123456!` | `00000000-0000-0000-0000-000000000001` | Admin |
| `chef@test.fr` | `Test123456!` | `00000000-0000-0000-0000-000000000002` | Chef d'équipe |
| `ouvrier@test.fr` | `Test123456!` | `00000000-0000-0000-0000-000000000003` | Ouvrier |
| `admin-paie@test.fr` | `Test123456!` | `00000000-0000-0000-0000-000000000004` | Administratif |
| `ouvrier2@test.fr` | `Test123456!` | `00000000-0000-0000-0000-000000000005` | Ouvrier |

⚠️ **IMPORTANT**: 
- Cochez **"Auto Confirm User"** pour chaque utilisateur
- Utilisez exactement les UUIDs ci-dessus

### **Étape 2: Exécuter la migration**

1. Allez dans **Supabase Dashboard** → **SQL Editor**
2. Cliquez sur **"New query"**
3. Copiez le contenu du fichier `supabase/migrations/insert_sample_data.sql`
4. Cliquez sur **"Run"**

### **Étape 3: Vérifier les données**

Exécutez cette requête pour vérifier:

```sql
-- Vérifier les données
SELECT 'Profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'Chantiers', COUNT(*) FROM chantiers
UNION ALL
SELECT 'Affectations', COUNT(*) FROM affectations_chantiers
UNION ALL
SELECT 'Périodes', COUNT(*) FROM periodes_travail
UNION ALL
SELECT 'Déclarations', COUNT(*) FROM declarations_heures;
```

Vous devriez voir:
- **Profiles**: 5
- **Chantiers**: 3  
- **Affectations**: 5
- **Périodes**: 8
- **Déclarations**: 8

## 🎯 **Données créées**

### 🏗️ **3 Chantiers**
- **CV-001**: Construction Villa Moderne (Paris)
- **RJ-002**: Rénovation Immeuble Haussmann (Paris)
- **ECC-003**: Extension Centre Commercial (Lyon)

### 👥 **5 Utilisateurs avec rôles**
- **Sophie Durand** (Admin) - Accès complet
- **Pierre Martin** (Chef) - Gestion équipe + validation
- **Jean Dupont** (Ouvrier) - Déclaration heures
- **Marie Moreau** (Administratif) - Export données
- **Paul Bernard** (Ouvrier) - Déclaration heures

### 📋 **Affectations**
- Pierre (Chef) gère CV-001 et RJ-002
- Jean (Ouvrier) travaille sur CV-001 et RJ-002
- Paul (Ouvrier) travaille sur CV-001

### ⏰ **Données de test**
- **8 périodes de travail** (semaine dernière + cette semaine)
- **Statuts variés**: validee, terminee (en attente)
- **Heures réalistes**: 7h30-9h par jour
- **Paniers et déplacements** inclus

## 🚀 **Test de l'application**

Après setup, vous pouvez tester avec:

### **Connexions**
- `admin@test.fr` / `Test123456!` → Voir tous les modules
- `chef@test.fr` / `Test123456!` → Dashboard chef + validation
- `ouvrier@test.fr` / `Test123456!` → Déclaration heures
- `admin-paie@test.fr` / `Test123456!` → Export données

### **Fonctionnalités testables**
- ✅ Login avec différents rôles
- ✅ Dashboard adapté par rôle
- ✅ Déclaration heures (ouvriers)
- ✅ Validation équipe (chef)
- ✅ Export données (administratif)
- ✅ Calculs automatiques (heures normales/supp)

## 🔧 **Troubleshooting**

### Erreur "User already exists"
- L'utilisateur existe déjà dans Auth
- Supprimez-le ou utilisez un autre email

### Erreur "Matricule already exists"
- Le matricule doit être unique
- Modifiez le matricule dans la migration

### Pas de données visibles
- Vérifiez que RLS (Row Level Security) est bien configuré
- Les policies doivent permettre l'accès aux données

### Erreur de permissions
- Vérifiez que les UUIDs correspondent exactement
- Les affectations doivent lier correctement users et chantiers