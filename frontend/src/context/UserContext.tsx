import { createContext, useContext, useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_BASE_URL || '';

export interface UserProfile {
  userId: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
}

interface UserContextType {
  user: UserProfile | null;
  token: string | null;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  updateProfile: (updates: Partial<Pick<UserProfile, 'name' | 'phone' | 'address'>>) => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null, token: null,
  login: () => {}, logout: () => {}, updateProfile: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('userToken'));
  const [user, setUser] = useState<UserProfile | null>(() => {
    try { return JSON.parse(localStorage.getItem('userProfile') || 'null'); } catch { return null; }
  });

  useEffect(() => {
    if (token && !user) {
      fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setUser(data); else logout(); })
        .catch(() => logout());
    }
  }, []);

  const login = (newToken: string, newUser: UserProfile) => {
    localStorage.setItem('userToken', newToken);
    localStorage.setItem('userProfile', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userProfile');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (updates: Partial<Pick<UserProfile, 'name' | 'phone' | 'address'>>) => {
    const res = await fetch(`${API}/api/auth/me`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const updated = await res.json();
      setUser(updated);
      localStorage.setItem('userProfile', JSON.stringify(updated));
    }
  };

  return (
    <UserContext.Provider value={{ user, token, login, logout, updateProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() { return useContext(UserContext); }
