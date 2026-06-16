# Tactical AI — Comment ça marche

> Explication complète du chatbot IA intégré dans la messagerie de Teampilot.

---

## Vue d'ensemble

Tactical AI est un assistant IA intégré dans la messagerie comme une conversation normale. Chaque utilisateur a sa propre conversation IA persistée en base de données. Le chatbot connaît le club en temps réel parce qu'on lui envoie les données à chaque message.

---

## Architecture générale

```
Utilisateur écrit un message
        │
        ▼
POST /api/backend/ai/chat  (frontend → proxy Next.js → FastAPI)
        │
        ▼
routers/ai.py
  1. Stocke le message utilisateur en base
  2. Charge les 40 derniers messages (historique)
  3. Appelle chat_with_ai()
        │
        ▼
services/ai_service.py
  1. build_context() → interroge la BDD, construit le system prompt
  2. Essaie Groq (llama-3.3-70b-versatile)
     └── Si échec → essaie Ollama (llama3.2:3b)
         └── Si échec → RuntimeError "Aucun fournisseur IA disponible"
        │
        ▼
  Réponse texte retournée au router
        │
        ▼
routers/ai.py
  4. Stocke la réponse en base (sender_id = null)
  5. Retourne les deux messages au frontend
        │
        ▼
Frontend affiche la réponse avec rendu Markdown (react-markdown)
```

---

## Comment le chatbot "connaît" le club — `build_context(db)`

À chaque message, `build_context()` interroge la base de données en temps réel et injecte les données dans le system prompt. Le modèle n'a aucune connaissance du club en dehors de ce contexte.

**Ce qui est injecté :**

1. **Club** — Nom, ligue, ville (table `clubs`, id=1)
2. **Saison active** — Label (ex: 2025/2026), statut, compétitions, objectif (table `seasons` où `is_active=True`)
3. **Effectif complet** — Tous les joueurs actifs, répartis en 4 groupes : Disponibles, Blessés, Suspendus, Incertains
4. **Prochain événement** — Le premier événement dont la date est >= aujourd'hui (tables `events`)
5. **Staff actif** — Tous les membres du staff avec leur rôle (table `staff_members`)

**Format des joueurs dans le contexte :**

Chaque joueur est formaté en une ligne compacte qui tient dans le contexte sans trop de tokens :

```
Thomas Laurent (#10, ATT) | 22mj | 14b | 8pd | 1820min | ratio 64% | 3j/1r
```

- `#10` = numéro de maillot
- `ATT/DEF/MIL/GK` = poste abrégé
- `mj` = matchs joués
- `b` = buts (ou `cln/enc` pour les gardiens : clean sheets / buts encaissés)
- `pd` = passes décisives (absentes pour les GK)
- `min` = minutes jouées
- `ratio` = buts/matchs × 100 (absent pour les GK)
- `j/r` = cartons jaunes / rouges (omis si 0)

---

## Le system prompt

Le modèle reçoit le prompt suivant en tant que message "system" (avant l'historique de conversation) :

```
Tu es Tactical AI, l'assistant IA de {club_name}.
Tu es un expert en football et gestion de club. Tu aides le staff et les joueurs.

=== CLUB ===
{club_name} | {league} | {city}

=== SAISON {season_label} ({season_status}) ===
Compétitions : {competitions}
Objectif : {objective}

=== EFFECTIF ({players_total} joueurs) ===
Format stats : mj=matchs joués | b=buts | pd=passes décisives | min=minutes jouées |
ratio=buts/matchs×100 | j/r=cartons jaunes/rouges | cln=clean sheets | enc=buts encaissés (GK)

Disponibles ({available_count}) : {available_list}
Blessés ({injured_count}) : {injured_list}
Suspendus ({suspended_count}) : {suspended_list}
Incertains ({uncertain_count}) : {uncertain_list}

=== PROCHAIN ÉVÉNEMENT ===
{next_event}

=== STAFF ({staff_count} membres) ===
{staff_list}

Réponds en français, de façon concise et professionnelle.
Base-toi sur les données ci-dessus pour les informations factuelles du club.
Pour les questions tactiques ou générales sur le football, tu peux utiliser tes connaissances générales.
N'invente aucune information sur les joueurs ou événements non listés.
```

---

## Gestion de l'historique

Pour que le chatbot se souvienne de ce qui a été dit plus tôt dans la conversation, on envoie l'historique des messages avec chaque requête.

- Les 40 derniers messages sont chargés depuis la BDD
- Ils sont envoyés au modèle sous forme de tableau `[{"role": "user"/"assistant", "content": "..."}]`
- Le message actuel de l'utilisateur est ajouté à la fin

Structure complète envoyée au modèle :
```json
[
  {"role": "system", "content": "<contexte complet du club>"},
  {"role": "user", "content": "Qui sont nos blessés ?"},
  {"role": "assistant", "content": "Vous avez 2 blessés : ..."},
  {"role": "user", "content": "<message actuel>"}
]
```

---

## Les deux fournisseurs IA

### Groq (principal)

- **Modèle** : `llama-3.3-70b-versatile` (LLM open source de Meta, 70 milliards de paramètres)
- **Limite gratuite** : 30 requêtes/minute, 14 400 requêtes/jour
- **Latence** : < 1 seconde (matériel spécialisé LPU de Groq)
- **Configuration** : `GROQ_API_KEY` dans le fichier `.env`
- **Client Python** : `AsyncGroq` (bibliothèque `groq`)

### Ollama (fallback)

- **Modèle** : `llama3.2:3b` (modèle local, 3 milliards de paramètres)
- **Limite** : aucune (tourne sur la machine)
- **Latence** : 2-5 secondes selon le matériel
- **Configuration** : `OLLAMA_URL` dans le `.env` (défaut : `http://localhost:11434`)
- **Appel** : requête HTTP POST vers l'API REST d'Ollama via `httpx`

La bascule est automatique : si Groq lève n'importe quelle exception, on essaie Ollama. Si Ollama échoue aussi, une `RuntimeError` est levée et le frontend affiche "Je suis temporairement indisponible."

---

## La conversation virtuelle (id = -1)

Avant qu'un utilisateur envoie son premier message, aucune conversation IA n'existe en base. Le frontend affiche une conversation "virtuelle" avec `id = -1` dans la liste des conversations pour que Tactical AI apparaisse toujours, même au premier usage.

Dès le premier message envoyé :
1. Le backend crée la vraie conversation en base (`_get_or_create_ai_conv`)
2. Le frontend rafraîchit la liste des conversations
3. La conversation virtuelle est remplacée par la vraie (avec son vrai id)

---

## Stockage des messages

- **Messages utilisateur** : stockés normalement avec `sender_id = user.id`
- **Messages IA** : stockés avec `sender_id = null` — il n'y a pas de compte utilisateur pour l'IA

Côté frontend, un `sender_id = null` est reconnu comme un message reçu (pas envoyé), et les initiales de la conversation (`✦`) sont utilisées comme avatar à la place d'initiales d'utilisateur.

---

## Affichage des réponses (react-markdown)

Groq retourne ses réponses en Markdown : titres (`##`), listes (`-`), texte **en gras**, etc. Pour afficher ce formatage correctement dans l'interface, le composant `react-markdown` est utilisé avec des styles Tailwind explicites sur chaque élément (`ul`, `li`, `strong`, `h3`, etc.).

Seuls les messages IA (ceux dont `sender_id = null`) sont rendus via `react-markdown`. Les messages normaux entre utilisateurs restent en texte brut.

---

## Sécurité de la clé API

La clé Groq (`GROQ_API_KEY`) est stockée uniquement dans `backend/.env`, un fichier exclu du git via `.gitignore` (patterns `.env*` et `backend/.env`). Elle n'est jamais exposée dans le code committé, jamais envoyée au frontend.

---

## Identité de l'assistant

L'assistant est présenté dans l'interface comme :
- **Nom** : `Tactical AI`
- **Initiales** : `✦` (symbole unicode, pas des lettres)
- **Couleur d'avatar** : `bg-primary` (bleu principal)
- **Rôle** : `ai` (valeur du champ `role_type` dans `Conversation`)

Ces constantes sont définies dans `routers/ai.py` : `_AI_NAME`, `_AI_BG`, `_AI_INITIALS`.
