# Démarches OAuth — Google Business Profile & Meta (Facebook/Instagram)

Le code est prêt ([backlog.md #2quater](backlog.md)) ; ce qui manque est entièrement externe, à faire par le CEO dans les consoles Google et Meta. Aucune de ces étapes ne peut être automatisée depuis le code.

## 1. Google (fiche Google Business Profile)

**Durée estimée : 30-60 minutes, pas d'attente de validation pour démarrer en mode test.**

1. Aller sur [console.cloud.google.com](https://console.cloud.google.com/) et créer un nouveau projet (ex: "Pepito").
2. Menu **API et services → Bibliothèque** → rechercher *"Business Profile API"* (ou *"My Business Business Information API"*) → **Activer**.
3. Menu **API et services → Écran de consentement OAuth** :
   - Type d'utilisateur : *Externe*.
   - Nom de l'application : "Pepito", email de support, logo (optionnel au départ).
   - Champs d'application (scopes) : ajouter `https://www.googleapis.com/auth/business.manage`.
   - Tant que l'app est en statut **Test**, seuls les comptes Google que vous ajoutez explicitement comme "utilisateurs test" peuvent se connecter — suffisant pour le pilote, pas besoin de validation Google immédiatement.
4. Menu **API et services → Identifiants** → **Créer des identifiants → ID client OAuth** :
   - Type d'application : *Application Web*.
   - URI de redirection autorisée : `https://<votre-domaine>/api/oauth/google/callback` (et `http://localhost:3000/api/oauth/google/callback` pour tester en local).
5. Récupérer le **Client ID** et le **Client Secret**, les mettre dans `.env` :
   ```
   GOOGLE_OAUTH_CLIENT_ID="..."
   GOOGLE_OAUTH_CLIENT_SECRET="..."
   ```
6. Redémarrer l'app. Sur `/connexions`, le bouton "Connecter" devient actif pour Google Business Profile.

**Pour sortir du mode Test** (accepter n'importe quel utilisateur, pas seulement les comptes test ajoutés manuellement) : revenir à l'écran de consentement OAuth et cliquer *Publier l'application*. Pour un scope sensible comme `business.manage`, Google peut demander une **vérification** (quelques jours) avant la mise en production réelle à grande échelle — mais le mode Test suffit largement pour le pilote à 5 entreprises.

## 2. Meta (Facebook + Instagram)

**Durée estimée : 1-2h de configuration, puis plusieurs jours à plusieurs semaines d'attente pour l'App Review — hors de notre contrôle.**

1. Aller sur [developers.facebook.com](https://developers.facebook.com/) → **Mes apps → Créer une app** → type "Entreprise".
2. Ajouter le produit **Facebook Login** (sidebar → Ajouter un produit).
3. Dans **Facebook Login → Paramètres** : ajouter l'URI de redirection `https://<votre-domaine>/api/oauth/meta/callback`.
4. Récupérer **App ID** et **App Secret** (menu Paramètres → Général), les mettre dans `.env` :
   ```
   META_APP_ID="..."
   META_APP_SECRET="..."
   ```
5. **Mode développement** : tant que l'app n'est pas passée en App Review, seuls les comptes ayant un rôle sur l'app (admin, développeur, testeur — à ajouter dans Rôles de l'app) peuvent se connecter. Suffisant pour tester vous-même et avec vos 5 entreprises pilotes *si vous les ajoutez comme testeurs*.
6. **Pour publier réellement sur Instagram/Facebook au nom d'un vrai client externe** (pas juste vous) : demander en **App Review** les permissions `pages_manage_posts` et `instagram_content_publish` (menu *Vérification de l'app → Autorisations et fonctionnalités*). Il faut fournir :
   - Une démonstration vidéo du flux d'usage réel dans Pepito.
   - Une politique de confidentialité publique (URL).
   - Une justification métier claire de l'usage de chaque permission.
   - Compter plusieurs jours à plusieurs semaines de délai, et un refus possible si le dossier est incomplet.
7. Le compte Instagram du client doit être un **compte professionnel ou créateur**, lié à une Page Facebook — sinon `instagram_content_publish` échoue même une fois l'app validée.

## Ce que je peux faire dès que vous avez les identifiants

Rien à recoder : ajoutez les 4 variables dans `.env`, redémarrez, le flux `/connexions` devient actif. La prochaine étape de développement (brancher l'exécution réelle sur la fiche Google une fois connectée) est déjà identifiée dans le backlog, point D.2.
