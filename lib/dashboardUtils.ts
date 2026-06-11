// Types et constantes partagés entre DashboardDesktop et DashboardMobile

export type EventTag = 'Match' | 'Entraînement' | 'Récupération' | 'Réunion';

// Styles Tailwind par type d'événement (bordure, badge, texte)
export const TAG_STYLE: Record<EventTag, { border: string; badge: string; text: string }> = {
  'Match':        { border: 'border-l-4 border-error',     badge: 'bg-error/10',          text: 'text-error' },
  'Entraînement': { border: 'border-l-4 border-primary',   badge: 'bg-primary/10',        text: 'text-primary' },
  'Récupération': { border: 'border-l-4 border-secondary', badge: 'bg-secondary/10',      text: 'text-secondary' },
  'Réunion':      { border: 'border-l-4 border-outline',   badge: 'bg-surface-container', text: 'text-on-surface' },
};

// Badge pour les joueurs non disponibles (pas de "Disponible" ici, inutile de l'afficher)
export const STATUS_BADGE: Record<string, string> = {
  'Blessé':    'bg-error/10 text-error',
  'Suspendu':  'bg-[#F97316]/10 text-[#F97316]',
  'Incertain': 'bg-primary/10 text-primary',
};

// Styles complets par statut joueur (badge + point indicateur + texte)
export const PLAYER_STATUS: Record<string, { badge: string; dot: string; text: string }> = {
  'Disponible': { badge: 'bg-secondary/10 text-secondary', dot: 'bg-secondary', text: 'text-secondary' },
  'Blessé':     { badge: 'bg-error/10 text-error',         dot: 'bg-error',     text: 'text-error' },
  'Suspendu':   { badge: 'bg-[#F97316]/10 text-[#F97316]', dot: 'bg-[#F97316]', text: 'text-[#F97316]' },
  'Incertain':  { badge: 'bg-primary/10 text-primary',     dot: 'bg-primary',   text: 'text-primary' },
};

// Badge par statut de saison
export const SS_SEASON: Record<string, string> = {
  'À venir':  'bg-[#F97316]/10 text-[#F97316]',
  'En cours': 'bg-secondary/10 text-secondary',
  'Terminée': 'bg-error/10 text-error',
};

// Convertit une date ISO (YYYY-MM-DD) en DD/MM/YYYY
export function fmtDate(iso?: string): string {
  return iso ? iso.split('-').reverse().join('/') : '—';
}

// Convertit une date ISO en DD/MM (pour l'affichage compact dans les événements)
export function fmtEventDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}
