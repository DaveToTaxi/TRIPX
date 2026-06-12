import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/services/supabase';

export type UserRole = 'pasajero' | 'conductor';

export interface Conductor {
  id: string;
  nombre: string;
  telefono: string;
  is_despachador: boolean;
  disponible: boolean;
  session_token: string;
}

export interface MockUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  avatar?: string;
  conductor?: Conductor;
}

interface AuthContextType {
  user: MockUser | null;
  isLoggedIn: boolean;
  conductor: Conductor | null;
  login: (role: UserRole) => void;
  loginConductor: (pin: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const STORAGE_KEY_CONDUCTOR = 'onspace_conductor_session';

const MOCK_PASAJERO: MockUser = {
  id: 'user-pasajero',
  name: 'Chelo',
  phone: '+34 611 222 333',
  email: 'cliente@example.com',
  role: 'pasajero',
};

function loadConductorSession(): Conductor | null {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_CONDUCTOR) : null;
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      localStorage.removeItem(STORAGE_KEY_CONDUCTOR);
      return null;
    }
    return data.conductor;
  } catch {
    return null;
  }
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(MOCK_PASAJERO);
  const [conductor, setConductor] = useState<Conductor | null>(null);

  useEffect(() => {
    const saved = loadConductorSession();
    if (saved) {
      setConductor(saved);
    }
  }, []);

  const loginConductor = async (pin: string): Promise<{ ok: boolean; error?: string }> => {
    const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? 'https://madridtaxis.es';

    // Intenta MT primero (funciona en producción y móvil nativo)
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (data.ok) {
        const conductorData: Conductor = { ...data.conductor, session_token: data.session_token };
        setConductor(conductorData);
        setUser({ ...MOCK_PASAJERO, role: 'conductor', name: data.conductor.nombre, conductor: conductorData });
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEY_CONDUCTOR, JSON.stringify({ conductor: conductorData, expires_at: data.expires_at }));
        }
        return { ok: true };
      }
      return { ok: false, error: data.error ?? 'PIN incorrecto' };
    } catch {
      // CORS bloqueó (localhost dev) — fallback a Supabase RPC directa
    }

    try {
      const { data, error } = await supabase.rpc('login_conductor', { p_pin: pin });
      if (error || !data || data.length === 0) return { ok: false, error: 'PIN incorrecto' };
      const row = data[0];
      const sessionToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
      const conductorData: Conductor = {
        id: row.id, nombre: row.nombre, telefono: row.telefono ?? '',
        is_despachador: row.is_despachador ?? false, disponible: true, session_token: sessionToken,
      };
      setConductor(conductorData);
      setUser({ ...MOCK_PASAJERO, role: 'conductor', name: row.nombre, conductor: conductorData });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_CONDUCTOR, JSON.stringify({ conductor: conductorData, expires_at: expiresAt }));
      }
      return { ok: true };
    } catch {
      return { ok: false, error: 'Error de conexión' };
    }
  };

  const login = (role: UserRole) => {
    if (role === 'conductor' && conductor) {
      setUser(prev => prev ? { ...prev, role: 'conductor' } : null);
    } else {
      setUser({ ...MOCK_PASAJERO, role });
    }
  };

  const logout = () => {
    setUser(MOCK_PASAJERO);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_CONDUCTOR);
    }
    setConductor(null);
  };

  const switchRole = (role: UserRole) => {
    if (role === 'conductor' && conductor) {
      setUser(prev => prev ? { ...prev, role: 'conductor', name: conductor.nombre } : null);
    } else {
      setUser({ ...MOCK_PASAJERO, role });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, conductor, login, loginConductor, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}
