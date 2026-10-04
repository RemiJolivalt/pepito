# Roster des agents produit (V1)

Principe commun à tous les agents : **proposer, jamais exécuter sans validation humaine explicite.** Chaque agent produit des propositions d'action visibles dans le cockpit ; l'utilisateur valide, modifie ou rejette avant toute exécution réelle (envoi d'email, publication, mise à jour de fiche).

La personnification (nom, ton propre à chaque agent) est un choix UX à traiter en V2 une fois le fonctionnel validé — cette version se concentre sur les responsabilités et garde-fous.

## Orchestrateur

- Non visible comme "agent" pour l'utilisateur ; agrège les propositions des agents spécialisés et les priorise dans le cockpit.
- V1 : logique de priorisation simple (ex: actions à fort impact / faible effort de validation en premier), pas de négociation inter-agents complexe.

## Agent "Visibilité locale"

- **Inputs** : métier, zone de chalandise, état de la fiche Google Business Profile (si connectée), avis clients existants.
- **Propositions typiques** : mise à jour d'informations de fiche (horaires, description, photos), réponse suggérée à un nouvel avis client.
- **Garde-fou spécifique** : toute réponse à un avis négatif doit être systématiquement soumise à validation, jamais auto-publiée même en mode "autonomie étendue" futur.

## Agent "Communication / réseaux sociaux"

- **Inputs** : ton de communication défini à l'onboarding, métier, actualité simple déclarée par l'utilisateur (ex: nouvelle offre, événement).
- **Propositions typiques** : post Instagram/Facebook avec visuel suggéré et légende, calendrier de publication suggéré.
- **Garde-fou spécifique** : aucune publication sans validation visuelle ET textuelle complète par l'utilisateur (pas de validation "en bloc" d'un calendrier entier sans aperçu individuel).

## Agent "Démarchage / prospection"

- **Inputs** : zone de chalandise, métier, liste de prospects fournie ou ciblage par zone (source à définir en phase architecture).
- **Propositions typiques** : email de prospection personnalisé, relance.
- **Garde-fou spécifique** : le plus sensible du roster (RGPD, image de marque). Validation obligatoire ligne par ligne du contenu ET de la liste de destinataires avant tout envoi. Fonctionnalité à sortir en dernier dans la roadmap, après validation conformité.

## Hors scope V1 (roadmap future)

- Agents supplémentaires par métier (ex: agent "prise de rendez-vous" pour les kinés).
- Autonomie étendue (exécution directe sans validation) sur des catégories d'actions à très faible risque, une fois la confiance installée avec les utilisateurs pilotes.
- Coordination inter-agents avancée (un agent qui déclenche une action chez un autre).
