# Backlog MVP — rôle Business Analyst / CEO

Source : cahier des charges proposé par un tiers (OpenAI), challengé et ajusté le 2026-10-05.
Décision CEO actée : garder l'esprit ("équipe virtuelle IA qui agit, pas qui conseille") sans construire la plateforme complète proposée — cf. [process-build-agentique.md](process-build-agentique.md) pour l'historique des décisions.

## KPI MVP (nouveau, retenu du cahier des charges tiers)

> Est-ce que le dirigeant considère que Pépito a réellement travaillé pour son entreprise et veut continuer à l'utiliser/payer ?

Tout ajout au backlog doit se justifier par rapport à ce KPI, pas par exhaustivité fonctionnelle.

## Déjà livré

- Landing page, login minimal (email, cookie de session), onboarding, dashboard, navigation (`AppHeader` : Dashboard / Connexions / Mon profil / Déconnexion)
- Agent **Audit** (Nadia — diagnostic de présence en ligne via `web_fetch`)
- Agent **Visibilité locale** (Camille — fiche Google, avis clients)
- Agent **Communication / réseaux sociaux** (Martine — posts à partir d'une actualité déclarée)
- Agent **Démarchage / prospection** (Jean-Claude — templates génériques, aucune liste réelle)
- Agent **Co-CEO** (Paul — point de contact conversationnel, orchestre les 4 agents)
- Objectif business à l'onboarding, injecté dans tous les prompts agents
- Avatars illustratifs par agent (pas de photos de personnes réelles — cf. note ci-dessous)
- Page "Connexions" : statut par canal (Google Business Profile, Instagram, Facebook), bouton honnête "bientôt — OAuth" plutôt qu'un faux bouton fonctionnel
- Garde-fou commun : validation humaine obligatoire avant toute exécution réelle (niveau d'autonomie 1 = "Assistant")
- Correctif critique (2026-10-05) : Paul affirmait parfois qu'une action avait été faite sans l'avoir réellement déclenchée (hallucination détectée via un test utilisateur réel). Corrigé par un outil `get_current_status` obligatoire avant toute affirmation sur l'état des propositions/audits — revérifié sur le scénario exact qui l'avait révélé.

## Backlog ajusté (ordre de priorité)

### 1. Objectif business à l'onboarding — ✅ livré (2026-10-05)
### 2. Personnification des agents — ✅ livré (2026-10-05)
### 2bis. Agent "Co-CEO" (Paul) — ✅ livré (2026-10-05, ajouté hors backlog initial à la demande du CEO)
Point de contact conversationnel unique, délègue aux 4 agents via function calling, jamais d'exécution directe. Historique persisté (`ChatMessage`) par entreprise.

### 2ter. Navigation et avatars — ✅ livré (2026-10-05)
Header de navigation commun (Dashboard / Connexions / Mon profil / Déconnexion) sur toutes les pages post-login. Avatars illustratifs (silhouette + couleur) par agent — **décision délibérée de ne pas utiliser de vraies photos de personnes** : Nadia/Camille/Martine/Jean-Claude/Paul sont des IA, pas des employés réels ; une photo réaliste serait trompeuse si elle apparaît un jour hors du dashboard (ex: dans un email envoyé en leur nom).

### 2quater. Connexions aux plateformes externes (Google/Instagram/Facebook) — ⚠️ cadrage posé, implémentation non fonctionnelle
Demande initiale reformulée pour raison de sécurité : **on ne collecte jamais le mot de passe de l'utilisateur** pour ces plateformes (interdit par leurs conditions d'utilisation, risque de fuite, aucune nécessité technique). La bonne approche est OAuth — l'utilisateur autorise Pepito depuis l'écran officiel Google/Meta.
Livré : page `/connexions` avec statut par canal (`ChannelConnection`), bouton explicitement non fonctionnel ("bientôt — OAuth") plutôt qu'un faux flux.
**Reste à faire avant que ça fonctionne réellement** : enregistrer une application développeur chez Google (Google Business Profile API) et Meta (Graph API Instagram/Facebook), avec vérification business — démarche à lancer par le CEO, délai hors de notre contrôle (cf. [architecture-technique.md](architecture-technique.md) § intégrations). Tant que ce n'est pas fait, les agents restent en mode "propose un contenu que vous recopiez vous-même".

### 3. Déclenchement quotidien programmé (version dégradée de la "boucle quotidienne")
Un job programmé (1x/jour) qui relance les agents pertinents pour chaque entreprise active et alimente le dashboard de nouvelles propositions — **mais qui propose, ne décide ni n'exécute jamais seul**. Ce n'est pas la boucle autonome complète du cahier des charges tiers (observer→décider→agir→mesurer→apprendre sans validation), qu'on rejette tant qu'on est aux niveaux d'autonomie 1-2.
**Pourquoi maintenant** : répond au principe "le système doit réellement faire quelque chose chaque jour", sans rouvrir le débat sur l'autonomie déjà tranché.

### 4. Rapport quotidien par email
Email court envoyé chaque jour : propositions en attente, constats d'audit récents, recommandation du jour. Réutilise l'intégration email déjà identifiée comme prioritaire en architecture.
**Pourquoi maintenant** : différenciant, techniquement simple, dépend du point 3 (il faut qu'il se passe quelque chose chaque jour pour avoir un rapport à envoyer).

### 5. `web_search` pour l'agent Audit (recherche concurrents) — ✅ livré (2026-10-05)
Nadia utilise désormais `web_search` pour identifier 2-3 concurrents locaux réels (nom, positionnement, source citée) en plus de l'audit du site/réseaux. Testé en conditions réelles sur un cas concret (installateur solaire à Cabriès) : 4 concurrents réels identifiés avec recommandations actionnables.

### 7. US du 2026-10-05 — extension des capacités des agents (demande CEO)

- **Camille devient "technique"** — ✅ livré. Nouveau type de proposition `site_web_content` : un brief de contenu de site web d'une page (textes, structure), généré automatiquement quand aucun site n'est déclaré. **Limite assumée** : Camille ne construit jamais de site réel (pas de code, pas d'hébergement) — elle fournit un brief que le dirigeant fait construire (Wix, freelance...). "Aide à la connexion des outils" couverte par Paul en conversation, qui renvoie vers `/connexions` sans jamais demander de mot de passe.
- **Nadia fait un rapport de positionnement concurrentiel** — ✅ livré, voir point 5.
- **Martine génère du contenu automatiquement** — ✅ livré partiellement. `newsContext` devient optionnel : sans actualité fournie, Martine propose ses propres idées génériques (conseil, FAQ, présentation de service) au lieu d'exiger une actualité réelle à chaque fois.
  - **"...et le publie sur les différentes plateformes" — ❌ refusé.** La publication automatique sans validation contredit directement la règle "validation humaine obligatoire" actée depuis le début du projet ([agents-roster.md](agents-roster.md)) et nécessiterait de toute façon les connexions OAuth (point 2quater), pas encore fonctionnelles. Chaque post généré par Martine reste une proposition à valider dans le dashboard.
- **Jean-Claude trouve des pistes de croissance** (news, événements, opportunités) — ✅ livré. Nouvel outil `propose_growth_lead` + `web_search`, distinct des templates de prospection. **Garde-fou RGPD renforcé** : uniquement des informations publiques et professionnelles (entreprises, événements), jamais de donnée personnelle d'un particulier — consigne explicite de refus si on lui demande de cibler des particuliers (ex: "trouve-moi les propriétaires de maison avec piscine", refusé par construction). Testé en conditions réelles : piste réelle et sourcée trouvée (projet solaire local), avec rappel explicite de ne contacter que par voie professionnelle publique.

### 6. Pilote avec 5 vraies entreprises (2 semaines)
Reprise telle quelle du cahier des charges tiers : condition de validation avant d'aller plus loin. Doit s'appuyer sur les points 1-4 au minimum.

## Explicitement reporté / rejeté (et pourquoi)

| Proposition du cahier des charges tiers | Décision | Raison |
|---|---|---|
| Boucle quotidienne 100% autonome (décision + action sans validation) | Rejeté pour le MVP | Contredit la validation humaine obligatoire déjà actée ([agents-roster.md](agents-roster.md)) |
| Crédits + changement de pricing (20€ + crédits) | Reporté | Décision Finance, pas produit — aucune donnée de coût d'inférence réelle pour la justifier encore |
| Architecture MCP générique pour les tools | Rejeté | Aucun client MCP externe à servir ; sur-ingénierie par rapport au besoin actuel |
| Intégration CRM | Reporté | Pas justifié avant validation des agents existants avec de vrais clients |
| Intégration calendrier | Reporté | Idem |
| Chat direct avec chaque agent | Partiellement livré | Le chat avec Paul (Co-CEO) qui délègue est en place ; un chat direct avec Camille/Martine/Jean-Claude individuellement reste reporté |
| Connexion aux comptes via identifiants (mot de passe) utilisateur | **Refusé — ligne rouge sécurité** | Credential harvesting interdit par les CGU des plateformes, risque de fuite, aucune nécessité technique. Remplacé par une approche OAuth (cf. point 2quater) |
| Agent "Acquisition" dédié (concurrents/partenaires) | Fusionné | Absorbé dans l'extension `web_search` de l'agent Audit (point 5) plutôt qu'un agent de plus |
