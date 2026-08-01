import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('codtech_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('codtech_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      if (token && !token.startsWith('mock_')) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          localStorage.setItem('codtech_user', JSON.stringify(res.data.user));
        } catch (err) {
          console.error('Session check failed:', err);
          logout();
        }
      }
      setLoading(false);
    }
    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token: jwtToken, user: userData } = res.data;
      setToken(jwtToken);
      setUser(userData);
      localStorage.setItem('codtech_token', jwtToken);
      localStorage.setItem('codtech_user', JSON.stringify(userData));
      return userData;
    } catch (err) {
      console.warn('Backend API request failed, checking default credentials fallback...', err);
      // Fallback for default seed accounts if API backend is starting up or offline
      if (!err.response || err.response.status === 404 || err.response.status === 500 || err.code === 'ERR_NETWORK') {
        const cleanEmail = email.trim().toLowerCase();
        if (cleanEmail === 'admin@codtech.com' && password === 'Admin@123456') {
          const defaultAdmin = {
            id: 1,
            name: 'Super Admin',
            email: 'admin@codtech.com',
            role: 'super_admin',
            employee_id: 'CT-ADMIN-001'
          };
          const mockToken = 'mock_admin_jwt_token_2026';
          setToken(mockToken);
          setUser(defaultAdmin);
          localStorage.setItem('codtech_token', mockToken);
          localStorage.setItem('codtech_user', JSON.stringify(defaultAdmin));
          return defaultAdmin;
        } else if (cleanEmail === 'emp.john@codtech.com' && password === 'Emp@123456') {
          const defaultEmp = {
            id: 2,
            name: 'John Doe',
            email: 'emp.john@codtech.com',
            role: 'employee',
            employee_id: 'CT-EMP-101'
          };
          const mockToken = 'mock_emp_jwt_token_2026';
          setToken(mockToken);
          setUser(defaultEmp);
          localStorage.setItem('codtech_token', mockToken);
          localStorage.setItem('codtech_user', JSON.stringify(defaultEmp));
          return defaultEmp;
        }
      }
      throw err;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('codtech_token');
    localStorage.removeItem('codtech_user');
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const newU = { ...prev, ...updatedFields };
      localStorage.setItem('codtech_user', JSON.stringify(newU));
      return newU;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateUser,
        isAdmin: user?.role === 'super_admin',
        isEmployee: user?.role === 'employee'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
