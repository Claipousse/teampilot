// Types, constantes et fonctions partagés entre JoueursDesktop et JoueursMobile

// ─── Types ────────────────────────────────────────────────────────────────────

export type PlayerStatus = 'Disponible' | 'Blessé' | 'Suspendu' | 'Incertain';

export type Player = {
  id: number;
  firstName: string;
  lastName: string;
  initials: string;
  number: number;
  name: string;           // format "Nom P."
  position: string;
  positionShort: 'GK' | 'DEF' | 'MIL' | 'ATT';
  nationality?: string;
  flag?: string;          // code ISO 2 lettres pour le drapeau (ex: "fr")
  dob?: string;
  height?: string;
  weight?: string;
  foot?: string;
  status: PlayerStatus;
  injury?: string;
  returnDate?: string;
  contract?: string;
  academy?: string;
  photoUrl?: string;
  stats?: {
    matches?: number; goals?: number; assists?: number;
    yellowCards?: number; redCards?: number; minutes?: number;
    cleanSheets?: number; goalsConceded?: number;
  };
  notes?: string;
};

export type PlayerForm = {
  prenom: string; nom: string; number: string;
  position: string; positionShort: 'GK' | 'DEF' | 'MIL' | 'ATT' | '';
  nationality: string; flag: string;
  status: PlayerStatus | '';
  dob: string; height: string; weight: string; foot: string;
  injury: string; returnDate: string;
  contract: string; academy: string;
  notes: string; photoUrl: string;
};

export type FormErrors = Partial<Record<'prenom' | 'nom' | 'number' | 'position' | 'nationality' | 'status', string>>;

export type Credentials = { username: string; temp_password: string };

// ─── Constantes ───────────────────────────────────────────────────────────────

export const EMPTY_FORM: PlayerForm = {
  prenom: '', nom: '', number: '',
  position: '', positionShort: '',
  nationality: '', flag: '',
  status: 'Disponible' as PlayerStatus,
  dob: '', height: '', weight: '', foot: '',
  injury: '', returnDate: '',
  contract: '', academy: '',
  notes: '', photoUrl: '',
};

export const POSITION_OPTIONS: { label: string; short: 'GK' | 'DEF' | 'MIL' | 'ATT' }[] = [
  { label: 'Gardien de but',    short: 'GK' },
  { label: 'Défenseur Central', short: 'DEF' },
  { label: 'Arrière Droit',     short: 'DEF' },
  { label: 'Arrière Gauche',    short: 'DEF' },
  { label: 'Milieu Défensif',   short: 'MIL' },
  { label: 'Milieu Central',    short: 'MIL' },
  { label: 'Milieu Offensif',   short: 'MIL' },
  { label: 'Ailier Droit',      short: 'ATT' },
  { label: 'Ailier Gauche',     short: 'ATT' },
  { label: 'Attaquant Centre',  short: 'ATT' },
];

export const STATUSES_FORM: PlayerStatus[] = ['Disponible', 'Blessé', 'Suspendu', 'Incertain'];
export const FOOT_OPTIONS = ['Droit', 'Gauche', 'Les deux'] as const;
export const POSITIONS = ['Tous', 'GK', 'DEF', 'MIL', 'ATT'] as const;
export const STATUSES: (PlayerStatus | 'Tous')[] = ['Tous', 'Disponible', 'Blessé', 'Suspendu', 'Incertain'];

// Styles Tailwind par statut joueur (badge, point indicateur, fond, texte)
export const S: Record<PlayerStatus, { badge: string; dot: string; bg: string; text: string }> = {
  'Disponible': { badge: 'bg-secondary/10 text-secondary',  dot: 'bg-secondary', bg: 'bg-secondary/5 border-secondary/20',  text: 'text-secondary' },
  'Blessé':     { badge: 'bg-error/10 text-error',          dot: 'bg-error',     bg: 'bg-error/5 border-error/20',          text: 'text-error' },
  'Suspendu':   { badge: 'bg-[#F97316]/10 text-[#F97316]',  dot: 'bg-[#F97316]', bg: 'bg-[#F97316]/5 border-[#F97316]/20', text: 'text-[#F97316]' },
  'Incertain':  { badge: 'bg-primary/10 text-primary',      dot: 'bg-primary',   bg: 'bg-primary/5 border-primary/20',      text: 'text-primary' },
};

// Styles du bouton statut quand il est sélectionné
export const STATUS_ACTIVE: Record<PlayerStatus, string> = {
  'Disponible': 'bg-secondary/10 text-secondary border-secondary',
  'Blessé':     'bg-error/10 text-error border-error',
  'Suspendu':   'bg-[#F97316]/10 text-[#F97316] border-[#F97316]',
  'Incertain':  'bg-primary/10 text-primary border-primary',
};

// Styles hover du bouton statut quand il n'est pas sélectionné
export const STATUS_HOVER: Record<PlayerStatus, string> = {
  'Disponible': 'hover:text-secondary hover:border-secondary',
  'Blessé':     'hover:text-error hover:border-error',
  'Suspendu':   'hover:text-[#F97316] hover:border-[#F97316]',
  'Incertain':  'hover:text-primary hover:border-primary',
};

// ─── Fonctions utilitaires ────────────────────────────────────────────────────

// Convertit un objet brut de l'API en Player typé
export function playerFromApi(p: any): Player {
  return {
    id: p.id,
    firstName: p.first_name,
    lastName: p.last_name,
    initials: (p.first_name[0] + p.last_name[0]).toUpperCase(),
    name: `${p.last_name} ${p.first_name.charAt(0)}.`,
    number: p.shirt_number,
    position: p.position,
    positionShort: p.position_short as Player['positionShort'],
    nationality: p.nationality,
    flag: p.nationality_flag ?? undefined,
    dob: p.date_of_birth ?? undefined,
    height: p.height_cm ? `${p.height_cm} cm` : undefined,
    weight: p.weight_kg ? `${p.weight_kg} kg` : undefined,
    foot: p.preferred_foot ?? undefined,
    status: p.status as PlayerStatus,
    injury: p.injury_description ?? undefined,
    returnDate: p.return_date_estimate ?? undefined,
    contract: p.contract_end_date ?? undefined,
    academy: p.academy ?? undefined,
    photoUrl: p.photo_url ?? undefined,
    notes: p.notes ?? undefined,
    stats: {
      matches: p.matches, goals: p.goals, assists: p.assists,
      yellowCards: p.yellow_cards, redCards: p.red_cards,
      minutes: p.minutes_played, cleanSheets: p.clean_sheets,
      goalsConceded: p.goals_conceded,
    },
  };
}

// Retourne la classe couleur pour une date de fin de contrat
// < 0 mois = expiré (rouge), < 12 mois = bientôt (orange), sinon = ok (vert)
export function contractColor(date?: string): string {
  if (!date) return 'text-on-surface-variant';
  const [y, m] = date.split('-').map(Number);
  const now = new Date();
  const months = (y - now.getFullYear()) * 12 + (m - (now.getMonth() + 1));
  if (months < 0)  return 'text-error font-bold';
  if (months < 12) return 'text-[#F97316] font-bold';
  return 'text-secondary font-semibold';
}

// Renvoie '—' si la valeur est vide ou undefined
export const ph = (v: string | number | undefined): string =>
  v !== undefined && v !== '' ? String(v) : '—';

// Classe CSS pour un champ de saisie, avec état d'erreur optionnel
export const inputCls = (err?: string) =>
  `w-full px-4 py-3 bg-surface-container border ${err ? 'border-error' : 'border-outline-variant'} rounded-xl text-base text-on-surface outline-none focus:ring-2 focus:ring-primary transition-all`;

// Classe CSS pour les labels de formulaire
export const labelCls = 'text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block';

// Valide les champs obligatoires du formulaire joueur et retourne les erreurs
export function validateForm(form: PlayerForm): FormErrors {
  const e: FormErrors = {};
  if (!form.prenom.trim())      e.prenom      = 'Champ obligatoire';
  if (!form.nom.trim())         e.nom         = 'Champ obligatoire';
  if (!form.number.trim())      e.number      = 'Champ obligatoire';
  if (!form.position)           e.position    = 'Champ obligatoire';
  if (!form.nationality.trim()) e.nationality = 'Champ obligatoire';
  if (!form.status)             e.status      = 'Champ obligatoire';
  return e;
}
