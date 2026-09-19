import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, getCurrentUser } from '../services/authService.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Synchronize and restore session on mount or token change
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      if (!token) {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const res = await getCurrentUser();
        if (isMounted) {
          setUser(res.data.user);
          setError(null);
        }
      } catch (err) {
        console.warn('Session restoration failed:', err.message);
        // Token invalid or expired: clear local token
        localStorage.removeItem('token');
        if (isMounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Handle Login
  const login = async (email, password) => {
    setError(null);
    try {
      const res = await loginUser(email, password);
      const receivedToken = res.data.token;
      const loggedUser = res.data.user;

      localStorage.setItem('token', receivedToken);
      setToken(receivedToken);
      setUser(loggedUser);
      return loggedUser;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Handle Register
  const register = async (name, email, password) => {
    setError(null);
    try {
      const res = await registerUser(name, email, password);
      // Auto login after successful registration or return user
      return res.data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Handle Logout
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setError(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        isAdmin,
        login,
        register,
        logout,
        setError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
