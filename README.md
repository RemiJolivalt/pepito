# Pepito

Copilote IA agentique pour indépendants et TPE (kiné, plombier, installateur solaire, etc.) : des agents spécialisés proposent des actions pour accroître visibilité, communication et démarchage, validées par l'utilisateur avant exécution.

## Statut

5 agents (Paul, Nadia, Camille, Martine, Jean-Claude), plan d'action piloté par Paul avec validation/réorientation par le dirigeant, première exécution réelle (site d'une page publié sur `/site/[slug]`), rapport, connexions OAuth (code prêt, identifiants Google/Meta à fournir). Voir [docs/backlog.md](docs/backlog.md) pour le détail à jour.

Parcours : `/` (landing) → `/login` → `/onboarding` → `/dashboard` (plan de Paul, validations) · `/equipe` (agents en manuel) · `/rapport` · `/connexions`.

## Démarrer en local

Prérequis : Node.js, une clé API Anthropic (https://console.anthropic.com/).

1. Créer un fichier `.env` à la racine (non commité) avec :
   ```
   DATABASE_URL="file:./dev.db"
   ANTHROPIC_API_KEY="sk-ant-..."

   # Optionnel — connexions OAuth (voir docs/backlog.md #2quater pour la démarche d'enregistrement) :
   # GOOGLE_OAUTH_CLIENT_ID=""
   # GOOGLE_OAUTH_CLIENT_SECRET=""
   # META_APP_ID=""
   # META_APP_SECRET=""
   ```
2. Installer les dépendances : `npm install`
3. Générer le client Prisma et créer la base SQLite locale :
   ```
   npx prisma generate
   npx prisma db push
   ```
4. Lancer le serveur de dev : `npm run dev`
5. Ouvrir `http://localhost:3000` : se connecter (email), remplir l'onboarding, puis sur `/dashboard` générer le plan de Paul, lancer les agents et valider leurs propositions.

**Dev vs prod** : la base locale est SQLite (aucune infra externe requise). La décision d'architecture retient PostgreSQL pour la production — seule la variable `DATABASE_URL` (et le `provider` dans `prisma/schema.prisma`) changent, le schéma de données reste identique.

## Décisions clés (V1)

- **Multi-métier** dès la conception, via un cœur générique + "packs de contexte" par métier.
- **Douleur cible** : manque de temps et manque de compétence marketing/communication des indépendants.
- **Validation humaine obligatoire** avant toute exécution d'action par un agent (email envoyé, post publié, réponse à un avis, etc.). Pas d'autonomie totale en V1.
- **Prix de travail** : 15€/mois (hypothèse à valider avec Finance avant verrouillage — risque de coût d'inférence par agent actif à chiffrer).
- **Build du produit en mode agentique** : rôles inspirés d'une organisation (BA, Architecte/CTO, Dev, Test, Comm') utilisés comme agents de construction, chacun produisant un livrable vérifiable. Voir [docs/process-build-agentique.md](docs/process-build-agentique.md).

## Documents

- [docs/spec-contextualisation.md](docs/spec-contextualisation.md) — parcours d'onboarding / contextualisation de l'entreprise
- [docs/agents-roster.md](docs/agents-roster.md) — rôles, responsabilités et garde-fous des agents produit
- [docs/process-build-agentique.md](docs/process-build-agentique.md) — organisation du build en rôles agentiques
- [docs/backlog.md](docs/backlog.md) — backlog MVP priorisé, avec décisions de scope actées
