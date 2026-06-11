'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Représente l'utilisateur connecté, tel que renvoyé par /api/auth/me
export type AuthUser = {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  type: 'player' | 'staff';
  mustChangePassword: boolean; // vrai pour les nouveaux comptes avec mot de passe temporaire
  playerId?: number;           // défini uniquement si type === 'player'
  staffId?: number;            // défini uniquement si type === 'staff'
};

type AuthCtxType = {
  user: AuthUser | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthCtx = createContext<AuthCtxType>({
  user: null,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Vérifie la session dès le montage en appelant l'API /me
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data) {
          const u: AuthUser = {
            id: data.id,
            username: data.username ?? '',
            firstName: data.first_name,
            lastName: data.last_name,
            isAdmin: data.is_admin,
            type: data.type,
            mustChangePassword: data.must_change_password ?? false,
            playerId: data.player_id ?? undefined,
            staffId: data.staff_id ?? undefined,
          };
          setUser(u);
          // Redirige immédiatement si le mot de passe temporaire n'a pas encore été changé
          // Sauf si on est déjà sur /change-password, pour éviter la boucle infinie
          if (u.mustChangePassword) {
            const path = window.location.pathname;
            if (!path.includes('/change-password')) {
              router.push('/change-password');
            }
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthCtx.Provider value={{ user, loading, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
