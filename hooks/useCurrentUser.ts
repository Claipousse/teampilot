// TODO: remplacer par un vrai appel auth (session, JWT, contexte, etc.)
// Le hook doit retourner { role } à partir de la session utilisateur réelle.

export type UserRole = 'admin' | 'coach' | 'player';

export interface CurrentUser {
  role: UserRole;
}

export function useCurrentUser(): CurrentUser {
  return {
    role: 'admin',
  };
}
