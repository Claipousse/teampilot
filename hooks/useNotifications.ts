'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotifKind = 'added' | 'rescheduled' | 'cancelled' | 'message';

export type Notification = {
  id: number;
  kind: NotifKind;
  title: string;
  tag: string | null;       // type d'événement ("Match", "Entraînement"…) ou rôle expéditeur
  event_id: number | null;  // pour naviguer vers l'événement depuis la notification
  event_date: string | null;
  created_at: string;
};

// ─── Fonctions visuelles ──────────────────────────────────────────────────────

// Couleur du point indicateur selon le type d'événement
export function evtDotClass(tag: string | null): string {
  if (tag === 'Match')        return 'bg-error';
  if (tag === 'Entraînement') return 'bg-primary';
  if (tag === 'Récupération') return 'bg-secondary';
  return 'bg-outline';
}

// Couleur du point indicateur selon le rôle de l'expéditeur
export function msgDotClass(tag: string | null): string {
  if (tag === 'coach')  return 'bg-primary';
  if (tag === 'player') return 'bg-secondary';
  return 'bg-[#F97316]'; // staff / autre
}

// Formatte le temps écoulé depuis la notification
export function fmtNotifTime(createdAt: string): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffM = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffM < 1)   return "À l'instant";
  if (diffH < 1)   return `Il y a ${diffM} min`;
  if (diffH < 24)  return `Il y a ${diffH}h`;
  if (diffD === 1) return 'Hier';
  return `Il y a ${diffD}j`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

// Hook partagé entre Header (desktop) et MobileHeader
// Gère le chargement, la suppression et le dismiss automatique des notifications
export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Charge les notifications depuis l'API au montage (et si l'utilisateur change)
  useEffect(() => {
    if (!user?.id) return;
    fetch('/api/backend/notifications')
      .then(r => r.ok ? r.json() : [])
      .then((data: Notification[]) => setNotifications(data))
      .catch(() => {});
  }, [user?.id]);

  // Supprime automatiquement les notifications de message d'une conversation
  // quand l'utilisateur l'ouvre (événement déclenché par MessagerieDesktop/Mobile)
  useEffect(() => {
    const handler = (e: Event) => {
      const { convName } = (e as CustomEvent<{ convName: string }>).detail;
      setNotifications(prev => {
        const prefix = convName + ' : ';
        const toDelete = prev.filter(n => n.kind === 'message' && n.title.startsWith(prefix));
        toDelete.forEach(n =>
          fetch(`/api/backend/notifications/${n.id}`, { method: 'DELETE' }).catch(() => {})
        );
        return prev.filter(n => !(n.kind === 'message' && n.title.startsWith(prefix)));
      });
    };
    window.addEventListener('dismiss-message-notifs', handler);
    return () => window.removeEventListener('dismiss-message-notifs', handler);
  }, []);

  // Supprime une notification (optimistic : retire de l'UI immédiatement)
  const remove = async (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    await fetch(`/api/backend/notifications/${id}`, { method: 'DELETE' }).catch(() => {});
  };

  const evtNotifs  = notifications.filter(n => n.kind !== 'message');
  const msgNotifs  = notifications.filter(n => n.kind === 'message');
  const totalUnread = notifications.length;

  return { evtNotifs, msgNotifs, totalUnread, remove };
}
