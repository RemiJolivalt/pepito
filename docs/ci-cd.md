# CI/CD BienDecider : prototype à deux développeurs

## En une minute

**Une seule version partagée** : https://www.biendecider.com, hébergée par le projet Vercel `pepito`, avec sa base PostgreSQL actuelle. Vercel appelle cet environnement **Production**, même si le produit reste un prototype. Pas de staging, pas de branche `develop`, pas de base supplémentaire provisionnée par la CI.

**Le parcours de chaque changement :**

```text
main à jour → petite branche → travail local → pull request vers main
           → CI verte + relecture rapide → Squash and merge
           → Vercel déploie main → vérification sur biendecider.com
```

Les branches de travail ne sont pas déployées par Vercel : `vercel.json` désactive les déploiements Git de toutes les branches sauf `main`. Il reste possible de lancer manuellement un déploiement Vercel ; ne pas le faire pour une branche de travail dans ce processus.

## Ce qui est automatisé

| Quand | Qui | Actions |
|---|---|---|
| PR ouverte ou mise à jour vers `main` | GitHub Actions, workflow `CI`, job `Checks` | Node 24, `npm ci`, lint, tests Gmail locaux, build Next.js avec contrôle TypeScript |
| Fusion ou push sur `main` | GitHub Actions | Les mêmes contrôles, pour détecter une régression sur la branche partagée |
| Fusion ou push sur `main` | Intégration GitHub de Vercel | Installation, build et publication sur le domaine du prototype |
| Relance manuelle de la CI | GitHub > Actions > CI > Run workflow | Contrôles seulement, aucun déploiement ni changement de base |

Workflow : [../.github/workflows/ci.yml](../.github/workflows/ci.yml). Déploiement : [../vercel.json](../vercel.json).

Un seul job CI, cache du téléchargement npm et annulation des anciennes exécutions sur la même PR. Timeout de 15 minutes. Objectif : quelques minutes, sans appel IA, navigateur à installer, service PostgreSQL, ni secret GitHub à fournir.

La CI utilise une URL PostgreSQL fictive pour compiler/générer Prisma, **pas la base du prototype**. Aucun serveur PostgreSQL n'est démarré. Si un build tente de lire cette base, il échoue : une compilation ne doit pas modifier ni dépendre des données partagées.

Les tests `test:gmail` vérifient scope, chiffrement et MIME sans contacter Google. Les tests navigateur `test:brand` et `test:ux` restent des contrôles locaux ciblés, pas des étapes CI obligatoires pour chaque PR. Le build inclut TypeScript : pas de second typecheck redondant dans la CI. Les avertissements ESLint sont visibles mais non bloquants ; les erreurs bloquent.

## Réglages à faire une seule fois

Ces réglages de comptes ne sont pas appliqués par les fichiers du dépôt. Un administrateur doit les confirmer.

### GitHub

1. Donner aux deux développeurs l'accès au dépôt `RemiJolivalt/pepito` et vérifier que GitHub Actions est autorisé.
2. Après la première exécution de CI, aller dans **Settings > Rules > Rulesets**, ou **Branches > Branch protection rules**, et cibler `main`.
3. Exiger une pull request et le contrôle obligatoire **`Checks`** du workflow **`CI`** (choisir le contrôle apparu dans l'interface). Exiger une branche à jour avant fusion : après mise à jour avec `main`, les contrôles doivent repasser.
4. Exiger **une approbation**, celle de l'autre développeur ; invalider les approbations après de nouveaux commits. Aucun comité de validation supplémentaire.
5. Interdire force-push et suppression de `main`, et appliquer les règles aussi aux administrateurs si l'option existe. Ne pas configurer de bypass pour les changements ordinaires.
6. Activer **Squash merging** et la suppression automatique des branches fusionnées dans **Settings > General**. Un changement = un commit lisible dans `main`.

Si les protections ne sont pas disponibles avec le forfait/visibilité du dépôt, la CI fonctionne, mais le blocage des fusions est seulement une règle d'équipe : décider d'un forfait compatible si un verrou technique est nécessaire.

**Important :** Vercel ne patiente pas pour le job CI lancé après un push sur `main`. Le garde-fou est la **CI obligatoire avant fusion**. Un push direct ou un bypass peut déployer du code non validé : c'est pourquoi il faut protéger `main`. Ne pas exiger le statut `Vercel` sur les PR, puisque leurs previews sont volontairement désactivées.

### Vercel

1. Conserver un seul projet `pepito`, connecté au dépôt, avec **Production Branch = main**. Selon l'interface, ce réglage se trouve dans **Settings > Environments > Production** ou dans la configuration Git.
2. Utiliser Node.js **24.x** comme dans la CI, `npm ci` pour l'installation et `npm run build` pour le build ; aucun appel à `prisma db push` dans les commandes Vercel.
3. Conserver le domaine et les variables actuelles dans **Production**. Aucun token Vercel ni credential PostgreSQL/Google/Anthropic n'est nécessaire dans GitHub Actions.
4. Vérifier que les commits des deux développeurs sont autorisés par Vercel : leur email Git doit être associé à leur compte GitHub. Selon le plan Vercel, un accès à l'équipe ou un plan compatible peut être requis pour le second auteur ; un accès GitHub seul ne le garantit pas.
5. Après la première fusion, vérifier qu'un déploiement de `main` se termine et que le domaine présente la nouvelle version. Aucun transfert de projet ou de domaine n'est nécessaire.

## Travail quotidien

### 1. Commencer depuis main à jour

Avec un arbre de travail propre :

```sh
git switch main
git pull --ff-only origin main
git switch -c feat/description-courte
npm ci
npm run dev
```

Utiliser `feat/...`, `fix/...` ou `docs/...`. Petites PR, une intention claire. Se prévenir avant de modifier les mêmes fichiers ou le schéma Prisma. Ne pas changer de branche avec du travail non enregistré ; le commiter sur la bonne branche ou le mettre de côté explicitement.

Le fichier local `.env` reste ignoré par Git. Partager les accès par un gestionnaire de secrets, jamais par chat, PR ou commit. Ne pas copier les secrets de Vercel dans le workflow CI.

### 2. Contrôler puis pousser la branche

```sh
npm run lint
npm run test:gmail
npm run build
git add <fichiers-du-changement>
git commit -m "Description du changement"
git push -u origin feat/description-courte
```

Ouvrir la PR vers `main`. Indiquer ce qui change, comment c'est testé et si un réglage Vercel ou une modification de base est nécessaire. Pour un changement UI, ajouter une capture desktop/mobile ; pour OAuth ou l'envoi email, préciser si les appels ont été simulés ou réellement effectués.

Pour `test:brand`, lancer le serveur et Chromium comme indiqué dans [../README.md](../README.md). `test:ux` crée et supprime des entreprises de test dans la base pointée par `DATABASE_URL` : **ne pas le lancer automatiquement sur la base du prototype**. Utiliser une base locale/de test disponible, ou coordonner explicitement une exécution contrôlée. La CI ne lance jamais cette suite.

### 3. Relire et fusionner

L'autre développeur fait une relecture courte et approuve. Attendre **Checks vert** ; si `main` a évolué, mettre à jour la branche via GitHub, résoudre les conflits et attendre la nouvelle CI. Fusionner avec **Squash and merge**. Le développeur qui fusionne vérifie le déploiement Vercel et le parcours touché sur le domaine. Le second repart de `main` à jour pour son prochain changement.

Pas de push de branche après fusion pour republier : la fusion déclenche déjà le déploiement. Les commits de documentation sur `main` peuvent aussi déclencher un build Vercel ; c'est assumé pour conserver un processus uniforme.

## Base et configuration : exception coordonnée

Le prototype a une seule base partagée. La CI/CD **ne modifie jamais son schéma**. Pas de migration automatique, pas de `db push` au déploiement.

- Ajouter un champ/table compatible avec le code actuel : préparer le changement dans la PR, sauvegarder la base, faire appliquer le schéma par un seul développeur désigné, puis fusionner/déployer le code qui l'utilise.
- Supprimer/renommer un champ ou changer sa signification : convenir d'une fenêtre et prévoir deux changements compatibles si possible (nouveau champ + bascule du code, suppression plus tard). Pas de `--accept-data-loss` routinier.
- Le projet utilise encore `prisma db push` pour le prototype. L'exécuter uniquement après revue du changement et vérification de la base ciblée ; préférer des migrations versionnées dès que les changements deviennent fréquents ou les données importantes.
- Ajouter une variable : indiquer son **nom** dans la PR/doc, la saisir dans Vercel avant le déploiement qui en dépend, sans révéler sa valeur. Redéployer après une modification de variable.

## Si quelque chose échoue

| Incident | Action |
|---|---|
| CI rouge sur la PR | Ouvrir GitHub > Actions > CI > Checks, lire l'étape rouge, corriger et pousser sur la même branche. Ne pas fusionner malgré l'échec. |
| Conflit avec l'autre développeur | Mettre à jour avec `main`, résoudre ensemble si nécessaire et rejouer les contrôles. |
| Build Vercel échoué | Lire les logs du déploiement : version Node, variables, installation et erreur de build. La dernière version publiée reste normalement servie. |
| Push non déployé | Vérifier la branche (`main` uniquement), les règles Vercel et l'autorisation de l'auteur du commit. |
| Bug déjà en ligne | Depuis Vercel, utiliser le rollback vers la dernière version saine si disponible. Ensuite créer une PR de correction ou de revert pour que Git corresponde à la version voulue. |
| Rollback avec changement de base | Le rollback Vercel ne restaure ni données ni schéma. Vérifier la compatibilité avant retour arrière ; une correction compatible peut être préférable. |

Une urgence ne doit pas devenir le chemin normal. Si un administrateur utilise exceptionnellement un bypass, prévenir l'autre développeur et vérifier immédiatement CI, déploiement et données.

## Checklist d'installation

- [x] Workflow CI versionné, un job court, sans secrets réels.
- [x] Déploiements Git limités à `main`, cron existant conservé.
- [x] Guide commun et lien depuis le README.
- [ ] Administrateur : activer les protections `main`, contrôle Checks obligatoire et une approbation.
- [ ] Administrateur : vérifier Node 24, branche Production main et accès Vercel des deux auteurs.
- [ ] Confirmer le premier Checks GitHub vert et le déploiement de main réussi.

La configuration versionnée définit le processus ; les cases d'administration doivent être cochées après vérification dans les consoles, pas déduites d'un commit.