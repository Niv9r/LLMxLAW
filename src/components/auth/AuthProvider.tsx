'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import type { User } from 'firebase/auth';

// A mock user object for demonstration purposes.
const mockUser = {
  uid: 'mock-user-123',
  email: 'test@dialogue.case',
  displayName: 'Test User',
  photoURL: null,
  // The rest of the properties are to satisfy the 'User' type from firebase/auth
  emailVerified: true,
  isAnonymous: false,
  metadata: {},
  providerData: [],
  providerId: 'mock',
  tenantId: null,
  delete: async () => {},
  getIdToken: async () => 'mock-token',
  getIdTokenResult: async () => ({ token: 'mock-token' } as any),
  reload: async () => {},
  toJSON: () => ({}),
} as User;


type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // loading is false because we don't have an async check on startup.
  const [loading, setLoading] = useState(false); 

  const login = useCallback(() => {
    setUser(mockUser);
  }, []);
  
  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const value = { user, loading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
