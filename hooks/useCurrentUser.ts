import { useAuth } from '@/contexts/AuthContext';

export interface CurrentUser {
  isAdmin: boolean;
  type: 'player' | 'staff';
  playerId?: number;
}

// Wrapper léger sur useAuth() qui n'expose que les champs utiles aux vérifications de droits.
// Évite de propager le AuthUser complet partout où on n'a besoin que de isAdmin/type.
export function useCurrentUser(): CurrentUser {
  const { user } = useAuth();
  return {
    isAdmin:  user?.isAdmin  ?? false,
    type:     user?.type     ?? 'staff',
    playerId: user?.playerId,
  };
}
