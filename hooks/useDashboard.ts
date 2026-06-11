'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentUser } from '@/hooks/useCurrentUser';

// Structure des KPIs renvoyés par le backend
type KPIs = {
  total_players: number;
  available_players: number;
  upcoming_events_count: number;
  unread_messages: number;
};

// Hook partagé entre DashboardDesktop et DashboardMobile
// Centralise tous les appels API et l'état du tableau de bord
export function useDashboard() {
  const { isAdmin } = useCurrentUser();
  const { user: auth, loading: authLoading } = useAuth();

  const [kpis,        setKpis]        = useState<KPIs>({ total_players: 0, available_players: 0, upcoming_events_count: 0, unread_messages: 0 });
  const [upcoming,    setUpcoming]    = useState<any[]>([]);
  const [unavailable, setUnavailable] = useState<any[]>([]);
  const [summary,     setSummary]     = useState<any>(null);      // résumé club/saison/staff, admin uniquement
  const [recentConvs, setRecentConvs] = useState<any[]>([]);
  const [myPlayer,    setMyPlayer]    = useState<any>(null);      // profil du joueur connecté
  const [teammates,   setTeammates]   = useState<any[]>([]);

  // Charge en parallèle les 4 endpoints communs + l'admin-summary si admin
  const fetchAll = useCallback(async () => {
    const [kRes, uRes, unRes, mRes] = await Promise.all([
      fetch('/api/backend/dashboard/kpis'),
      fetch('/api/backend/dashboard/upcoming-events'),
      fetch('/api/backend/dashboard/unavailable-players'),
      fetch('/api/backend/messages/conversations'),
    ]);
    if (kRes.ok)  setKpis(await kRes.json());
    if (uRes.ok)  setUpcoming(await uRes.json());
    if (unRes.ok) setUnavailable(await unRes.json());
    if (mRes.ok)  setRecentConvs((await mRes.json()).slice(0, 3));
    if (isAdmin) {
      const sRes = await fetch('/api/backend/dashboard/admin-summary');
      if (sRes.ok) setSummary(await sRes.json());
    }
  }, [isAdmin]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Pour les joueurs : charge le profil et la liste des coéquipiers
  // La correspondance par ID est prioritaire ; sinon, on cherche par nom
  useEffect(() => {
    if (auth?.type !== 'player') return;
    fetch('/api/backend/players')
      .then(r => r.ok ? r.json() : [])
      .then((ps: any[]) => {
        const me = auth.playerId
          ? (ps.find((p: any) => p.id === auth.playerId) ??
             ps.find((p: any) =>
               p.first_name?.toLowerCase() === auth.firstName?.toLowerCase() &&
               p.last_name?.toLowerCase() === auth.lastName?.toLowerCase()))
          : ps.find((p: any) =>
              p.first_name?.toLowerCase() === auth.firstName?.toLowerCase() &&
              p.last_name?.toLowerCase() === auth.lastName?.toLowerCase());
        setMyPlayer(me ?? null);
        setTeammates(ps.filter((p: any) => p.id !== me?.id));
      });
  }, [auth?.type, auth?.playerId, auth?.firstName, auth?.lastName]);

  return { kpis, upcoming, unavailable, summary, recentConvs, myPlayer, teammates, auth, authLoading, isAdmin };
}
