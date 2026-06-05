import { useAuth } from '@/contexts/AuthContext';

export interface CurrentUser {
  isAdmin: boolean;
  type: 'player' | 'staff';
  playerId?: number;
}

export function useCurrentUser(): CurrentUser {
  const { user } = useAuth();
  return {
    isAdmin: user?.isAdmin ?? false,
    type: user?.type ?? 'staff',
    playerId: user?.playerId,
  };
}
