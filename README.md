# Pepito

Copilote IA agentique pour indépendants et TPE (kiné, plombier, installateur solaire, etc.) : des agents spécialisés proposent des actions pour accroître visibilité, communication et démarchage, validées par l'utilisateur avant exécution.

## Statut

Phase d'idéation / cadrage du MVP. Aucun code applicatif pour l'instant — voir [docs/](docs/) pour les décisions produit et les specs en cours.

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
