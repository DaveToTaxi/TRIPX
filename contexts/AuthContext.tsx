import React, { createContext, useState, ReactNode } from 'react';

export type UserRole = 'pasajero' | 'conductor';

export interface MockUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: MockUser | null;
  isLoggedIn: boolean;
  login: (role: UserRole) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USERS: Record<UserRole, MockUser> = {
  pasajero: {
    id: 'user-chelo-001',
    name: 'Chelo M.',
    phone: '+34 611 222 333',
    email: 'chelo@example.com',
    role: 'pasajero',
  },
  conductor: {
    id: 'drv-david',
    name: 'David',
    phone: '+34 600 000 000',
    email: 'david@madridtaxis.com',
    role: 'conductor',
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(MOCK_USERS.pasajero);

  const login = (role: UserRole) => {
    setUser(MOCK_USERS[role]);
  };

  const logout = () => {
    setUser(null);
  };

  const switchRole = (role: UserRole) => {
    setUser(MOCK_USERS[role]);
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}
