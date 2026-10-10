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
