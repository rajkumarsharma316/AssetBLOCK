import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  // Check for existing session on mount
  useEffect(() => {
    const token = sessionStorage.getItem('cpe_token');
    const savedUser = sessionStorage.getItem('cpe_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      fetchMe();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchMe = async () => {
    try {
      const { data } = await authApi.getMe();
      const userData = {
        publicKey: data.publicKey,
        userId: data.userId,
        balance: data.balance,
        balances: data.balances,
      };
      setUser(userData);
      sessionStorage.setItem('cpe_user', JSON.stringify(userData));
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async ({ publicKey, secretKey, signedChallenge }) => {
    const { data } = await authApi.login({ publicKey, secretKey, signedChallenge });
    sessionStorage.setItem('cpe_token', data.token);
    const userData = { publicKey: data.user.publicKey, userId: data.user.id };
    sessionStorage.setItem('cpe_user', JSON.stringify(userData));

    // If using secret key, store for signing (testnet only)
    if (secretKey) {
      sessionStorage.setItem('cpe_secret', secretKey);
    }

    setUser(userData);
    await fetchMe();
    return data;
  };

  const logout = () => {
    sessionStorage.removeItem('cpe_token');
    sessionStorage.removeItem('cpe_user');
    sessionStorage.removeItem('cpe_secret');
    setUser(null);
    setNotifications([]);
  };

  const refreshBalance = async () => {
    await fetchMe();
  };

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await authApi.getNotifications();
      setNotifications(data.notifications || []);
    } catch {
      // ignore
    }
  }, [user]);

  // Poll notifications
  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  const value = {
    user,
    loading,
    login,
    logout,
    refreshBalance,
    notifications,
    fetchNotifications,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
