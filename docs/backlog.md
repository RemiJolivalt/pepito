# Backlog MVP — rôle Business Analyst / CEO

Source : cahier des charges proposé par un tiers (OpenAI), challengé et ajusté le 2026-10-05.
Décision CEO actée : garder l'esprit ("équipe virtuelle IA qui agit, pas qui conseille") sans construire la plateforme complète proposée — cf. [process-build-agentique.md](process-build-agentique.md) pour l'historique des décisions.

## KPI MVP (nouveau, retenu du cahier des charges tiers)

> Est-ce que le dirigeant considère que Pépito a réellement travaillé pour son entreprise et veut continuer à l'utiliser/payer ?

Tout ajout au backlog doit se justifier par rapport à ce KPI, pas par exhaustivité fonctionnelle.

## Déjà livré

- Landing page, login minimal (email, cookie de session), onboarding, dashboard
- Agent **Audit** (diagnostic de présence en ligne via `web_fetch`)
- Agent **Visibilité locale** (fiche Google, avis clients)
- Agent **Communication / réseaux sociaux** (posts à partir d'une actualité déclarée)
- Agent **Démarchage / prospection** (templates génériques, aucune liste réelle)
- Garde-fou commun : validation humaine obligatoire avant toute exécution réelle (niveau d'autonomie 1 = "Assistant")

## Backlog ajusté (ordre de priorité)

### 1. Objectif business à l'onboarding — ✅ livré (2026-10-05)
Champ "objectif" collecté à l'onboarding, injecté dans le system prompt de chaque agent (y compris le Co-CEO) pour orienter les propositions.

### 2. Personnification des agents — ✅ livré (2026-10-05)
Noms et rôles centralisés dans [src/lib/agents/personas.ts](../src/lib/agents/personas.ts) : Nadia (Audit), Camille (Visibilité locale), Martine (Communication), Jean-Claude (Démarchage). Affichés dans le dashboard (cartes "Agent Overview") et dans les contenus générés.

### 2bis. Agent "Co-CEO" — ✅ livré (2026-10-05, ajouté hors backlog initial à la demande du CEO)
Point de contact conversationnel unique (encart chat sur le dashboard), qui délègue aux 4 agents existants via des outils (function calling), jamais d'exécution directe. Testé en conditions réelles : délègue correctement à Audit et Visibilité locale sans information manquante, mais demande l'information requise (actualité, type de prospects) avant de déléguer à Communication/Démarchage plutôt que d'inventer — garde-fou respecté.
Historique conversationnel persisté (`ChatMessage`), par entreprise.

### 3. Déclenchement quotidien programmé (version dégradée de la "boucle quotidienne")
Un job programmé (1x/jour) qui relance les agents pertinents pour chaque entreprise active et alimente le dashboard de nouvelles propositions — **mais qui propose, ne décide ni n'exécute jamais seul**. Ce n'est pas la boucle autonome complète du cahier des charges tiers (observer→décider→agir→mesurer→apprendre sans validation), qu'on rejette tant qu'on est aux niveaux d'autonomie 1-2.
**Pourquoi maintenant** : répond au principe "le système doit réellement faire quelque chose chaque jour", sans rouvrir le débat sur l'autonomie déjà tranché.

### 4. Rapport quotidien par email
Email court envoyé chaque jour : propositions en attente, constats d'audit récents, recommandation du jour. Réutilise l'intégration email déjà identifiée comme prioritaire en architecture.
**Pourquoi maintenant** : différenciant, techniquement simple, dépend du point 3 (il faut qu'il se passe quelque chose chaque jour pour avoir un rapport à envoyer).

### 5. `web_search` pour l'agent Audit (recherche concurrents)
Étendre l'agent Audit avec l'outil serveur `web_search` (déjà disponible côté Claude, pas encore utilisé) pour identifier 2-3 concurrents locaux et leur positionnement — reprend l'intention de l'agent "Acquisition" du cahier des charges tiers sans créer un agent séparé.
**Pourquoi pas avant** : priorité plus faible que les points 1-4, qui touchent directement l'engagement quotidien.

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
| Chat direct avec chaque agent | Reporté | Chantier UX/conversationnel à part entière, pas un ajustement de backlog |
| Agent "Acquisition" dédié (concurrents/partenaires) | Fusionné | Absorbé dans l'extension `web_search` de l'agent Audit (point 5) plutôt qu'un agent de plus |
