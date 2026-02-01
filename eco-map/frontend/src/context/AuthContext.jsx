import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Configure Axios
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Check user logged in
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          // Verify token
          const response = await axios.get('http://localhost:8000/users/me');
          setUser(response.data);
        } catch (error) {
          console.error("Session expired");
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (username, password) => {
    // Get Token 
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await axios.post('http://localhost:8000/token', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token } = response.data;

    // Save Token
    localStorage.setItem('token', access_token);
    setToken(access_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

    // Get User Details
    const userResponse = await axios.get('http://localhost:8000/users/me');
    setUser(userResponse.data);
    
    return userResponse.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);