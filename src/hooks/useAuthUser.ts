import { onAuthStateChanged, type User } from 'firebase/auth';
import { useEffect, useState } from 'react';

import { auth } from '../lib/firebase';

type AuthState = {
  user: User | null;
  isAdmin: boolean;
  isAuthLoading: boolean;
};

export function useAuthUser(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);

      if (!nextUser) {
        setIsAdmin(false);
        setIsAuthLoading(false);
        return;
      }

      const tokenResult = await nextUser.getIdTokenResult(true);

      setIsAdmin(tokenResult.claims.admin === true);
      setIsAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  return {
    user,
    isAdmin,
    isAuthLoading,
  };
}