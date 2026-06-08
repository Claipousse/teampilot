'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export type AuthUser = {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  type: 'player' | 'staff';
  mustChangePassword: boolean;
  playerId?: number;
  staffId?: number;
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
