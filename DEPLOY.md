# Guide de déploiement sur Vercel

## 🔐 Authentification

L'application utilise NextAuth.js pour protéger l'accès. Tous les visiteurs non authentifiés seront automatiquement redirigés vers la page de connexion.

### Utilisateurs de démo

Mot de passe pour tous les utilisateurs : **`demo123`**

| Email | Nom | Rôle |
|-------|-----|------|
| sophie.leclerc@entreprise.fr | Sophie Leclerc | Employé |
| jean.dupont@entreprise.fr | Jean Dupont | RH |
| claire.rousseau@entreprise.fr | Claire Rousseau | DRH |
| luc.moreau@entreprise.fr | Luc Moreau | Paie |

## 🚀 Déploiement sur Vercel

### 1. Préparer le projet

Assurez-vous que tous les fichiers sont commités dans Git :

```bash
git add .
git commit -m "Ajout de l'authentification"
git push
```

### 2. Déployer sur Vercel

1. Connectez-vous sur [vercel.com](https://vercel.com)
2. Cliquez sur "Import Project"
3. Sélectionnez votre repository GitHub
4. Configurez le projet :
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: .next

### 3. Configurer les variables d'environnement

Dans les paramètres du projet Vercel, ajoutez les variables d'environnement suivantes :

#### Variables requises :

1. **AUTH_SECRET**
   - Valeur : Générer une clé secrète sécurisée
   - Pour générer : `openssl rand -base64 32`
   - Exemple : `your-random-32-character-secret-key-here`

2. **NEXTAUTH_URL** (optionnel pour Vercel)
   - Valeur : Votre URL de production
   - Exemple : `https://votre-app.vercel.app`
   - Note : Vercel configure automatiquement cette variable

#### Étapes dans Vercel :

1. Allez dans **Settings** > **Environment Variables**
2. Ajoutez `AUTH_SECRET` avec votre clé générée
3. Sélectionnez "Production", "Preview" et "Development"
4. Cliquez sur "Save"

### 4. Redéployer

Une fois les variables ajoutées, redéployez l'application :

1. Allez dans l'onglet **Deployments**
2. Cliquez sur les trois points du dernier déploiement
3. Sélectionnez "Redeploy"

## 🧪 Tester l'authentification

1. Visitez votre URL Vercel
2. Vous serez redirigé vers `/login`
3. Sélectionnez un utilisateur dans le dropdown
4. Entrez le mot de passe : `demo123`
5. Vous serez connecté et redirigé vers l'application

## 🔒 Sécurité

Pour la production, considérez :

1. **Changer les mots de passe** : Remplacez "demo123" par des vrais mots de passe hashés
2. **AUTH_SECRET fort** : Utilisez une clé secrète longue et aléatoire
3. **HTTPS obligatoire** : Vercel fournit automatiquement HTTPS
4. **Rate limiting** : Considérez ajouter une protection contre les attaques par force brute

## 📝 Développement local

Pour tester localement :

```bash
# Installer les dépendances
npm install

# Copier les variables d'environnement
cp .env.example .env.local

# Modifier AUTH_SECRET dans .env.local avec une clé sécurisée

# Lancer le serveur de développement
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 🐛 Dépannage

### Erreur "No session found"
- Vérifiez que `AUTH_SECRET` est bien configuré dans Vercel
- Redéployez après avoir ajouté les variables

### Erreur 500 sur la page de login
- Vérifiez que le fichier `/public/data/users.json` existe
- Vérifiez les logs Vercel pour plus de détails

### Redirection infinie
- Vérifiez que `NEXTAUTH_URL` correspond à votre URL de production
- Vérifiez que le middleware est bien configuré
