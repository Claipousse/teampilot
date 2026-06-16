# Frontend — Composants et structure

> Les fichiers côté navigateur (Next.js / React), leur rôle et ce qu'ils contiennent. Expliqué simplement.

---

## Comment fonctionne le frontend en 3 lignes

Le navigateur charge Next.js, qui affiche les pages. Pour obtenir ou envoyer des données, les pages appellent des routes `/api/backend/...` qui transmettent la requête à FastAPI (le backend Python) en ajoutant le token d'authentification. La réponse revient au composant qui met à jour l'affichage.

---

## `proxy.ts` — Le gardien des pages

Fichier spécial Next.js qui s'exécute **avant chaque chargement de page**. Il lit le cookie `token` et décide :
- Pas de token + page protégée → redirige vers `/login`
- Token présent + page `/login` → redirige vers `/dashboard`
- Sinon → laisse passer

Les routes `/api/...` et les fichiers statiques sont exclus du contrôle (le `matcher` les ignore).

---

## `app/api/` — Routes serveur Next.js

Ces fichiers tournent côté serveur Next.js, pas dans le navigateur. Ils sont invisibles pour l'utilisateur.

### `app/api/backend/[...path]/route.ts` — Le proxy universel

Reçoit **toutes** les requêtes vers `/api/backend/...`, lit le cookie `token`, ajoute `Authorization: Bearer <token>` au header, et redirige vers FastAPI (`http://localhost:8000/api/v1/...`). C'est nécessaire parce que le cookie JWT est `httpOnly` — JavaScript côté navigateur ne peut pas le lire directement.

### `app/api/auth/login/route.ts`
Reçoit `username + password` du formulaire de login, les transmet à FastAPI, et si la connexion réussit, pose le cookie JWT sécurisé (`httpOnly`, `maxAge: 86400`, `sameSite: lax`).

### `app/api/auth/me/route.ts`
Lit le cookie `token` et le transmet à FastAPI `/auth/me` pour savoir quel utilisateur est connecté — retourne l'utilisateur ou null.

### `app/api/auth/logout/route.ts`
Supprime le cookie `token`. Sans cookie, toutes les requêtes suivantes seront rejetées.

### `app/api/nationalities/route.ts`
Fournit la liste des nationalités avec codes ISO (pour les drapeaux). Appelle une API externe au premier chargement, met en cache le résultat en mémoire pour ne plus l'appeler ensuite.

---

## `contexts/` — Données partagées dans toute l'app

Un Context React, c'est un moyen de partager une donnée avec tous les composants de l'app sans avoir à la passer manuellement de parent en enfant.

### `contexts/AuthContext.tsx`

Partage l'utilisateur connecté partout dans l'app. Au chargement, il appelle `/api/auth/me` pour savoir qui est connecté. Si `mustChangePassword = true` et qu'on n'est pas sur `/change-password`, il redirige immédiatement.

Fournit via `useAuth()` :
- `user` — l'objet utilisateur (`id`, `username`, `firstName`, `lastName`, `isAdmin`, `type`, `mustChangePassword`, `playerId`, `staffId`)
- `loading` — vrai pendant le chargement initial
- `logout()` — supprime le cookie et redirige vers `/login`

### `contexts/LanguageContext.tsx`

Partage la langue courante (`fr` ou `en`) et les traductions. Le hook `useT()` retourne l'objet de traductions de la langue active — ex: `useT().nav.dashboard` retourne `"Tableau de bord"` en français ou `"Dashboard"` en anglais.

---

## `hooks/` — Logique réutilisable

Un hook React est une fonction réutilisable qui encapsule de la logique. Le nom commence toujours par `use`. Évite de dupliquer le même code dans les versions Desktop et Mobile.

### `hooks/useCurrentUser.ts`

Raccourci vers les trois infos les plus utilisées pour les vérifications de droits :

```typescript
const { isAdmin, type, playerId } = useCurrentUser();
```

Retourne des valeurs sécuritaires par défaut (`isAdmin: false`) si l'utilisateur n'est pas encore chargé.

### `hooks/useDashboard.ts`

Charge toutes les données du tableau de bord en une fois. Partagé entre `DashboardDesktop` et `DashboardMobile`.

- Pour tout le monde (en parallèle) : KPIs, prochains événements, joueurs indisponibles, conversations récentes
- Si admin : résumé club + saison + staff
- Si joueur : profil propre et liste des coéquipiers

Retourne : `{ kpis, upcoming, unavailable, summary, recentConvs, myPlayer, teammates, auth, authLoading, isAdmin }`

### `hooks/useNotifications.ts`

Charge les notifications depuis l'API, écoute l'événement DOM `dismiss-message-notifs` (déclenché quand on ouvre une conversation en messagerie pour supprimer les notifications de message correspondantes).

Retourne :
- `evtNotifs` — notifications d'événements (added, rescheduled, cancelled)
- `msgNotifs` — notifications de messages
- `totalUnread` — nombre total (pour le badge rouge)
- `remove(id)` — supprime une notification en local immédiatement et envoie le DELETE en arrière-plan

Exporte aussi des fonctions utilitaires :
- `evtDotClass(tag)` — couleur du point selon le type d'événement
- `msgDotClass(tag)` — couleur selon le rôle de l'expéditeur
- `fmtNotifTime(createdAt)` — temps relatif ("À l'instant", "Il y a 5 min", "Hier", etc.)

---

## `lib/` — Fonctions et constantes partagées

### `lib/playerUtils.ts`

Types, constantes et fonctions liés aux joueurs. Partagé entre `JoueursDesktop` et `JoueursMobile`.

**Types :**
- `Player` — la fiche joueur côté frontend (champs en camelCase : `firstName`, `shirtNumber`, etc.)
- `PlayerForm` — les données d'un formulaire de création/édition
- `FormErrors` — les erreurs de validation par champ
- `Credentials` — `{ username, temp_password }` affichés après création d'un compte

**Constantes :**
- `EMPTY_FORM` — valeurs initiales d'un formulaire vide
- `POSITION_OPTIONS` — les 10 postes possibles avec abréviation
- `STATUSES_FORM` — `['Disponible', 'Blessé', 'Suspendu', 'Incertain']`
- `FOOT_OPTIONS`, `POSITIONS`, `STATUSES` — listes pour les filtres
- `S` — map statut → classes Tailwind pour les badges colorés

**Fonctions :**
- `playerFromApi(data)` — convertit la réponse API (snake_case) en objet `Player` (camelCase), calcule initiales et nom formaté
- `validateForm(form)` — vérifie les champs obligatoires et retourne un objet d'erreurs
- `contractColor(contract?)` — couleur selon l'urgence de la fin de contrat (< 6 mois = rouge, < 12 mois = orange, sinon vert)
- `ph(v?)` — retourne la valeur ou `"—"` si vide
- `inputCls(err?)` — classes CSS pour un champ de formulaire (rouge si erreur)
- `labelCls` — classes CSS fixes pour les labels

### `lib/dashboardUtils.ts`

Types, constantes et fonctions liés au tableau de bord. Partagé entre `DashboardDesktop` et `DashboardMobile`.

**Constantes (maps de couleurs Tailwind) :**
- `TAG_STYLE` — bordure, badge et texte par type d'événement (Match=rouge, Entraînement=bleu, etc.)
- `STATUS_BADGE` — badge couleur pour les joueurs non-disponibles
- `PLAYER_STATUS` — badge + point + texte par statut joueur
- `SS_SEASON` — couleur par statut de saison

**Fonctions :**
- `fmtDate("2026-06-11")` → `"11/06/2026"` — date complète formatée
- `fmtEventDate("2026-06-11")` → `"11/06"` — format court pour les événements

---

## `locales/translations.ts`

Contient tous les textes de l'application en français et en anglais. Utilisé via `useT()` (voir `LanguageContext`).

---

## `components/layout/` — Structure visuelle commune

Ces composants forment la "coquille" visible sur toutes les pages.

### `components/layout/Sidebar.tsx`
Navigation verticale côté gauche, visible uniquement sur desktop (`hidden lg:flex`). Filtre les items `adminOnly` selon `isAdmin`. L'item actif a un fond bleu (`bg-primary`). L'item Administration a un style rouge distinct.

### `components/layout/Header.tsx`
Barre du haut sur desktop. Affiche le nom de la page et le panneau de notifications (deux onglets : Événements / Messages, max 5 notifs affichées, bouton "Voir X de plus").

### `components/layout/MobileHeader.tsx`
Même fonctionnalité que `Header.tsx`, adaptée pour mobile. Le panneau de notifications s'ouvre en slide depuis le haut. Utilise le même hook `useNotifications`.

### `components/layout/BottomNav.tsx`
Barre fixe en bas de l'écran sur mobile (`lg:hidden`). Même logique que `Sidebar.tsx`.

### `components/NationalitySelect.tsx`
Sélecteur de nationalité avec drapeaux et recherche textuelle. Utilisé dans les formulaires joueur et staff. Charge la liste via `/api/nationalities` et affiche un menu déroulant filtré par la saisie.

---

## `app/(app)/layout.tsx` — Structure des pages connectées

Enveloppe toutes les pages protégées dans `AuthProvider` et `LanguageProvider`. Affiche `Sidebar` + `Header` sur desktop, `MobileHeader` + `BottomNav` sur mobile. La zone de contenu principale (`main`) s'y insère.

---

## `app/(auth)/login/page.tsx` — Page de connexion

Accessible sans être connecté. Formulaire avec identifiant (`username.trim().toLowerCase()`) et mot de passe. Si la réponse contient `must_change_password = true`, redirige vers `/change-password`, sinon vers `/dashboard`.

---

## `app/(app)/change-password/page.tsx`

Deux modes : **forcé** (premier login, pas de champ "mot de passe actuel") et **volontaire** (champ "mot de passe actuel" requis + bouton retour). `isForced` est initialisé à `true` par défaut pour éviter un flash visuel pendant le chargement de l'utilisateur.

---

## `app/(app)/dashboard/` — Tableau de bord

Utilise `useDashboard()`. Vue différente selon le rôle :
- **Admin** : panneau club/saison/staff, KPIs (4 compteurs), événements à venir, joueurs indisponibles, conversations récentes
- **Joueur** : profil personnel, coéquipiers, événements à venir, conversations récentes

---

## `app/(app)/joueurs/` — Gestion des joueurs

Importe depuis `lib/playerUtils.ts`. Filtres : position, statut, recherche textuelle. Panel ou modal de détail au clic sur un joueur. Pour les admins : création (affiche les credentials dans une modal), modification, suppression (countdown 3s avant confirmation).

---

## `app/(app)/calendrier/` — Calendrier

- **Desktop** : vue mensuelle (grille 6×7), flèches de navigation par mois, panel de détail à droite
- **Mobile** : vue semaine (7 jours), navigation semaine par semaine

Pour les admins : créer, modifier, supprimer un événement.

---

## `app/(app)/messagerie/` — Messagerie

- **Desktop** : deux colonnes (liste conversations + chat)
- **Mobile** : vue alternée (soit la liste, soit le chat)

Inclut la conversation Tactical AI. Les messages IA (sender_id=null) sont rendus via `react-markdown`. Polling toutes les 5 secondes pour récupérer les nouveaux messages.

---

## `app/(app)/administration/` — Administration

*Réservé aux admins.* Trois panneaux : Club (nom, ligue, coordonnées), Saison (dates, compétitions, objectif, statut), Staff (liste + création + suppression). Prévisualisation de l'identifiant généré en temps réel dans les formulaires de création.
