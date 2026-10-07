# Pepito

Copilote IA agentique pour indépendants et TPE (kiné, plombier, installateur solaire, etc.) : des agents spécialisés proposent des actions pour accroître visibilité, communication et démarchage, validées par l'utilisateur avant exécution.

## Statut

4 agents (Paul, Martine, Camille, Jean-Claude), plan d'action piloté par Paul avec validation/réorientation par le dirigeant, première exécution réelle (site d'une page publié sur `/site/[slug]`), rapport, vue admin (coûts/usage), connexions OAuth (code prêt, identifiants Google/Meta à fournir), login par email + mot de passe. Base de données : PostgreSQL (plus de SQLite). Voir [docs/backlog.md](docs/backlog.md) pour le détail à jour.

Parcours : `/` → `/login` → `/onboarding`, puis :

- `/diagnostic` : constats de Martine et recommandations à ajouter au plan.
- `/dashboard` (Aujourd'hui) : prochaine décision, plan à lancer, file unique de validation (`?view=validation`) et historique (`?view=historique`). Les productions du plan et les demandes ponctuelles suivent la même file. Une production approuvée n'est pas nécessairement exécutée ; les sites approuvés restent à publier dans la file.
- `/prospection` : suivi opérationnel des contacts et rendez-vous.
- `/rapport` (Résultats) : objectif chiffré, progression commerciale déclarée et réalisations effectives, sans duplication des analyses.
- `/equipe` : rôles et demandes ponctuelles ; aucun second point de validation.
- `/connexions`, `/onboarding`, `/admin` : configuration et administration.

## Démarrer en local

Prérequis : Node.js, une clé API Anthropic (https://console.anthropic.com/), une base PostgreSQL (ex: [Neon](https://neon.tech) ou [Vercel Postgres](https://vercel.com/storage/postgres), toutes deux ont un plan gratuit suffisant pour le dev/pilote).

1. Créer un fichier `.env` à la racine (non commité) avec :
   ```
   DATABASE_URL="postgres://..."
   ANTHROPIC_API_KEY="sk-ant-..."
   # Obligatoire — signe les cookies de session (générer une fois : node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
   SESSION_SECRET="..."

   # Optionnel — connexions OAuth (voir docs/oauth-setup.md pour la démarche d'enregistrement) :
   # GOOGLE_OAUTH_CLIENT_ID=""
   # GOOGLE_OAUTH_CLIENT_SECRET=""
   # META_APP_ID=""
   # META_APP_SECRET=""

   # Optionnel — referme la vue /admin à une liste d'emails (sinon ouverte à tout connecté) :
   # ADMIN_EMAILS="vous@exemple.com"
   ```
2. Installer les dépendances : `npm install` (génère aussi le client Prisma via `postinstall`)
3. Créer les tables dans la base : `npx prisma db push`
4. Lancer le serveur de dev : `npm run dev`
5. Ouvrir `http://localhost:3000` : se connecter (email + mot de passe — le compte est créé à la première connexion), remplir l'onboarding, puis sur `/dashboard` générer le plan de Paul, lancer les agents et valider leurs propositions.

## Tests du parcours

Avec le serveur local actif : `npx playwright install chromium`, puis `npm run test:ux`.
Les tests utilisent `DATABASE_URL` et `SESSION_SECRET` du fichier `.env`. Ils créent uniquement des entreprises fictives `ux-test-…@example.invalid`, supprimées en fin de test. Utiliser de préférence une base de développement. Les appels aux agents et la publication sont simulés ; les décisions et l'ajout au plan utilisent les vraies API. `UX_TEST_BASE_URL` permet de changer le port (défaut : `http://localhost:3000`). Captures desktop/mobile dans `test-results/` (ignoré par Git).

## Déploiement (Vercel)

1. Sur [vercel.com](https://vercel.com), importer le repo GitHub `RemiJolivalt/pepito` — aucune clé API Vercel n'est nécessaire, la connexion se fait directement via l'intégration GitHub native (sécurisé, zéro secret à partager).
2. Onglet **Storage** du projet Vercel → créer une base **Postgres** → Vercel injecte automatiquement `DATABASE_URL` dans les variables d'environnement du projet.
3. Onglet **Settings → Environment Variables** → ajouter `ANTHROPIC_API_KEY` et `SESSION_SECRET` (même valeur qu'en local, sinon les sessions existantes deviennent invalides). Clés OAuth si prêtes. Laisser `ADMIN_EMAILS` non défini tant que l'admin doit rester ouvert à tous.
4. Premier déploiement : Vercel lance `npm install` (génère le client Prisma) puis `next build` automatiquement.
5. Créer les tables en prod : exécuter une fois `npx prisma db push` avec la `DATABASE_URL` de production dans l'environnement (copiée depuis l'onglet Storage de Vercel vers votre terminal local — jamais partagée ailleurs).
6. Chaque `git push` sur la branche connectée redéploie automatiquement — aucune action supplémentaire.

## Décisions clés (V1)

- **Multi-métier** dès la conception, via un cœur générique + "packs de contexte" par métier.
- **Douleur cible** : manque de temps et manque de compétence marketing/communication des indépendants.
- **Validation humaine obligatoire** avant toute exécution d'action par un agent (email envoyé, post publié, réponse à un avis, etc.). Pas d'autonomie totale en V1.
- **Prix de travail** : 15€/mois (hypothèse à valider avec Finance avant verrouillage — risque de coût d'inférence par agent actif à chiffrer).
- **Build du produit en mode agentique** : rôles inspirés d'une organisation (BA, Architecte/CTO, Dev, Test, Comm') utilisés comme agents de construction, chacun produisant un livrable vérifiable. Voir [docs/process-build-agentique.md](docs/process-build-agentique.md).

## Documents

- **[docs/architecture.md](docs/architecture.md) — logique inter-agents et stack technique à jour (diagrammes)**
- [docs/spec-contextualisation.md](docs/spec-contextualisation.md) — parcours d'onboarding / contextualisation de l'entreprise
- [docs/agents-roster.md](docs/agents-roster.md) — rôles, responsabilités et garde-fous des agents produit
- [docs/process-build-agentique.md](docs/process-build-agentique.md) — organisation du build en rôles agentiques
- [docs/backlog.md](docs/backlog.md) — backlog MVP priorisé, avec décisions de scope actées
- [docs/oauth-setup.md](docs/oauth-setup.md) — démarches externes Google/Meta pour activer les connexions OAuth
