import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('stockwatch_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('stockwatch_token');
    if (!token) {
      setLoading(false);
      return;
    }
    authService
      .fetchMe()
      .then((freshUser) => {
        setUser(freshUser);
        localStorage.setItem('stockwatch_user', JSON.stringify(freshUser));
      })
      .catch(() => {
        localStorage.removeItem('stockwatch_token');
        localStorage.removeItem('stockwatch_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const { user: loggedInUser, token } = await authService.login(email, password);
    localStorage.setItem('stockwatch_token', token);
    localStorage.setItem('stockwatch_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    return loggedInUser;
  }

  async function logout() {
    await authService.logout();
    localStorage.removeItem('stockwatch_token');
    localStorage.removeItem('stockwatch_user');
    setUser(null);
  }

  async function updateProfile(payload) {
    const updatedUser = await authService.updateProfile(payload);
    localStorage.setItem('stockwatch_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    return updatedUser;
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
