# Domaines BienDecider

Le backlog est réparti en douze domaines fonctionnels. Chaque US porte un label `domaine:*`, en plus de ses labels de type, de priorité, de statut et de zone décrits dans [github-tracking.md](github-tracking.md). Les Issues GitHub restent la source de vérité du suivi ; ce document donne la carte d'ensemble et la trajectoire qui la justifie.

## Carte des domaines

État du catalogue [github-backlog.json](github-backlog.json) au 2026-10-10 : 121 US.

| Domaine | Label | Périmètre | US | P0 | P1 | P2 | P3 |
|---|---|---|---|---|---|---|---|
| Dirigeant | `domaine:dirigeant` | Compte, objectif, tableau de bord, validation | 5 | 0 | 5 | 0 | 0 |
| Moteur et agents | `domaine:moteur` | Paul et les agents, de comprendre à arbitrer | 10 | 0 | 5 | 4 | 1 |
| Délégation et garde-fous | `domaine:delegation` | Niveaux, budget, autorisations, risque, transparence | 10 | 0 | 7 | 3 | 0 |
| Connecteurs | `domaine:connecteurs` | Gmail, Google, Meta, site : ce qui exécute | 14 | 0 | 13 | 1 | 0 |
| Mesure | `domaine:mesure` | Résultats, bilan, apprentissage | 8 | 0 | 2 | 6 | 0 |
| Monétisation | `domaine:monetisation` | Prix, crédits, paiement, facturation | 8 | 0 | 5 | 3 | 0 |
| Sécurité et conformité | `domaine:securite` | Accès, sessions, données personnelles, légal | 10 | 4 | 5 | 1 | 0 |
| Administration BienDecider | `domaine:admin` | Back-office, quotas, support, pilote | 7 | 1 | 3 | 3 | 0 |
| Plateforme technique | `domaine:plateforme` | Fiabilité, base de données, tests, documentation | 10 | 3 | 3 | 4 | 0 |
| Marque | `domaine:marque` | Landing, domaine, logo, tarifs | 6 | 0 | 1 | 5 | 0 |
| Expérience utilisateur | `domaine:ux` | Clarté du parcours, attente, mobile, accessibilité, cohérence visuelle | 18 | 0 | 6 | 11 | 1 |
| Entreprise | `domaine:entreprise` | Démarches des pères fondateurs : société BienOuBien, banque, contrats, assurances | 15 | 5 | 3 | 6 | 1 |

Vue par domaine : `https://github.com/RemiJolivalt/pepito/issues?q=is%3Aissue%20is%3Aopen%20label%3Adomaine%3Amoteur` (remplacer `moteur` par le domaine voulu).

## Focus actuel : délégation P1

État vérifié dans les Issues ouvertes le **2026-10-10** : [7 US `domaine:delegation` en P1](https://github.com/RemiJolivalt/pepito/issues?q=is%3Aissue%20is%3Aopen%20label%3Adomaine%3Adelegation%20label%3Apriority%3Ap1), 3 US en P2. Les priorités sont déjà correctement étiquetées ; ne pas promouvoir automatiquement les P2.

**Attention au vocabulaire :** ce domaine concerne l'autonomie de BienDecider dans les actions des entreprises. Ce n'est pas la délégation de revue des PR aux développeurs après 4 secondes, documentée dans [ci-cd.md](ci-cd.md).

Ordre fondé sur les dépendances des US :

| Étape | Issue | Travail | État à suivre |
|---|---:|---|---|
| Décision des fondateurs | [#35](https://github.com/RemiJolivalt/pepito/issues/35) `del-1` | Définir par type d'action ce qui peut partir sans validation, puis faire valider la politique par les deux fondateurs. | À prendre en premier (`status:ready`) ; bloque le code du domaine. |
| Garde-fous parallélisables après la décision | [#36](https://github.com/RemiJolivalt/pepito/issues/36) `del-2`, [#38](https://github.com/RemiJolivalt/pepito/issues/38) `del-4`, [#39](https://github.com/RemiJolivalt/pepito/issues/39) `del-5` | Niveau par action, limites/budget, évaluation du risque fondée sur des règles. | Débloquer après #35 (`status:ready`). |
| Contrôle opérateur | [#41](https://github.com/RemiJolivalt/pepito/issues/41) `del-7`, [#42](https://github.com/RemiJolivalt/pepito/issues/42) `del-8` | Journal complet et pause immédiate avant toute action autonome. | Débloquer après #35 (`status:ready`), en priorité avant la première exécution autonome. |
| Agir dans le cadre | [#40](https://github.com/RemiJolivalt/pepito/issues/40) `del-6` | Exécuter seulement si niveau, risque, autorisation et budget le permettent ; sinon demander validation. | Après #35, #36, #38 et #39 ; `status:blocked` jusque-là. |
| P2, volontairement hors focus immédiat | [#37](https://github.com/RemiJolivalt/pepito/issues/37) `del-3`, [#43](https://github.com/RemiJolivalt/pepito/issues/43) `del-9`, [#44](https://github.com/RemiJolivalt/pepito/issues/44) `del-10` | Mode Conseiller, annulation/réversibilité, fusion du réglage de prospection. | Garder en P2 jusqu'à replanification. |

La validation humaine demeure le défaut tant que #35 n'est pas approuvée par les deux fondateurs et que les garde-fous P1 ne sont pas livrés et testés. La demande d'autonomie ne vaut pas autorisation de publier ou d'envoyer pendant cette phase.

### Tranche `del-5` livrée le 2026-10-10

- [x] Classification déterministe par `kind` de proposition, indépendante du contenu généré par le modèle ; justification visible sur la carte de proposition.
- [x] Types inconnus classés à risque élevé par défaut ; seuls `piste_croissance` est faible et `prospect` modéré dans le catalogue actuel.
- [x] Publications, réponses publiques, prospection, contenu de site et email Gmail classés élevés.
- [x] Tests du classificateur et vérification navigateur du badge sur des propositions à risque élevé.
- [ ] Compléter les règles métier (réversibilité, exposition publique, dépense, données de tiers) par action, avec validation des deux fondateurs dans #35.
- [ ] Appliquer le seuil au futur mode `Déléguer` côté serveur : au-dessus du seuil, forcer la validation même si l'interface est contournée. Aucun mode autonome n'est activé par cette tranche ; aujourd'hui toute action réelle reste à confirmer.

Implémentation : [src/lib/delegation-risk.ts](../src/lib/delegation-risk.ts), affichage : [ProposalCard](../src/components/proposal-card.tsx), tests : [delegation.spec.ts](../tests/delegation.spec.ts). La PR classe les types connus ; ce n'est pas encore le moteur complet d'autorisation de #39.

## Trajectoire cible

Promesse : *vous fixez l'objectif, l'IA trouve comment agir, vous gardez le contrôle.* Le moteur enchaîne sept étapes. Le tableau situe le code du 2026-10-09 face à cette cible.

| Étape | Aujourd'hui | Écart | Domaine |
|---|---|---|---|
| Comprendre | Formulaire d'onboarding | Pas d'objectif exprimé en langage naturel | `dirigeant`, `ux` |
| Diagnostiquer | Martine, page Diagnostic | Couvert | `moteur` |
| Planifier | Plan de Paul | Ni coût estimé ni impact attendu par action | `moteur`, `monetisation` |
| Arbitrer | Rien | Une seule action proposée, pas d'options ni de critères | `moteur` |
| Déléguer | Tout est validé à la main | Un seul niveau sur trois ; pas de budget, d'autorisations ni d'évaluation du risque | `delegation` |
| Exécuter | Site, email Gmail manuel | Fiche Google et Meta bloqués ; publicité et administratif à cadrer | `connecteurs` |
| Mesurer | Suivi des prospects, objectif chiffré | Rien sur les posts, le site, la fiche Google | `mesure` |
| Adapter | Paul lit le suivi des prospects | Pas de proposition de réorientation | `mesure`, `moteur` |

Les trois niveaux de délégation visés sont Conseiller (je reçois des recommandations et je décide), Accompagner (je valide les actions importantes) et Déléguer (BienDecider agit dans mes limites). Le niveau Déléguer lève la règle historique de validation humaine obligatoire : l'US `del-1` acte cette décision, type d'action par type d'action, avant tout développement du domaine.

## Règles de classement

- **Une US, un domaine.** En cas de doute, choisir le domaine de la personne qui en bénéficie, pas celui du fichier modifié.
- **`ux`** couvre la façon dont le dirigeant vit le produit, quel que soit l'écran ; la fonction elle-même reste dans son domaine.
- **`securite`** prime sur `connecteurs` et `plateforme` quand l'enjeu est la protection des comptes ou des données.
- **`admin`** regroupe ce que voient les pères fondateurs dans le back-office ; **`entreprise`** regroupe leurs démarches hors du code (société, banque, contrats).
- **`priority:p3`** marque ce qui est gardé pour mémoire, sans date.

## Identifiants

Les US ajoutées le 2026-10-10 ont un identifiant de catalogue par domaine (`dir-1`, `mot-3`, `del-6`, `ent-5`...) ; les 18 premières gardent le leur (`legal`, `gmail-live`...). L'identifiant figure dans le marqueur en tête de chaque Issue et sert aux dépendances ; le numéro GitHub reste la référence au quotidien.

Origine des US ajoutées, rappelée dans chaque Issue : la trajectoire cible ci-dessus, l'audit du code du 2026-10-09, [backlog.md](backlog.md), ou une demande directe des pères fondateurs.

## Après le premier import

L'import crée les Issues manquantes sans modifier les existantes. Les 18 Issues déjà ouvertes ne reçoivent donc pas leur label de domaine automatiquement ; il se pose une fois à la main, d'après le champ `domain` du catalogue :

| Domaine | Issues |
|---|---|
| `domaine:plateforme` | 1 |
| `domaine:securite` | 2, 7 |
| `domaine:marque` | 3, 4 |
| `domaine:connecteurs` | 5, 6, 8 à 15 |
| `domaine:mesure` | 16, 17 |
| `domaine:admin` | 18 |
