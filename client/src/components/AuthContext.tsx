import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';  // Add this import

interface AuthContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  handleAuth: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();  // Add this
  const location = useLocation();  // Add this

  // Listen for messages from the popup window
  useEffect(() => {
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.origin !== 'http://localhost:8000') return;

      if (event.data.type === 'spotify-auth-success') {
        setIsAuthenticated(true);
        checkAuthStatus();
      }
    };

    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, []);

  // Replace your refresh handler with this one
  useEffect(() => {
    const handleRefresh = () => {
      const isPageRefresh = (
        window.performance &&
        window.performance.navigation.type === window.performance.navigation.TYPE_RELOAD
      );

      if (isPageRefresh) {
        console.log('Page was refreshed, clearing auth state...');
        setIsAuthenticated(false);
        
        // Use navigate instead of window.location
        if (location.pathname !== '/') {
          navigate('/');
        }
      }
    };

    handleRefresh();
  }, [navigate, location]);

  // Update your auth status check
  const checkAuthStatus = async () => {
    try {
      const response = await fetch('http://localhost:8000/auth-status');
      const data = await response.json();
      setIsAuthenticated(data.isAuthenticated);
      
      // Add this check
      if (!data.isAuthenticated && location.pathname !== '/') {
        navigate('/');
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setIsAuthenticated(false);
      if (location.pathname !== '/') {
        navigate('/');
      }
    }
  };

  // Keep your existing handleAuth function

  const handleAuth = async () => {
        try {
          console.log('Attempting to connect to Spotify...');
          const response = await fetch('http://localhost:8000/login');
          const data = await response.json();
          
          // Open a popup window for authentication
          const width = 450;
          const height = 730;
          const left = window.screen.width / 2 - width / 2;
          const top = window.screen.height / 2 - height / 2;
    
          window.open(
            data.url,
            'Spotify Login',
            `width=${width},height=${height},left=${left},top=${top}`
          );
        } catch (err) {
          console.error('Auth error:', err);
          throw new Error('Failed to initiate authentication');
        }
      };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      setIsAuthenticated, 
      handleAuth,
      checkAuthStatus 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};