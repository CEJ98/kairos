import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Cargar estado persistido al inicializar
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const [authState, onboardingState] = await Promise.all([
          AsyncStorage.getItem('isAuthenticated'),
          AsyncStorage.getItem('hasCompletedOnboarding')
        ]);
        
        if (authState === 'true') setIsAuthenticated(true);
        if (onboardingState === 'true') setHasCompletedOnboarding(true);
      } catch (error) {
        console.error('Error loading auth state:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAuthState();
  }, []);
  
  const login = async () => {
    setIsAuthenticated(true);
    await AsyncStorage.setItem('isAuthenticated', 'true');
  };
  
  const logout = async () => {
    setIsAuthenticated(false);
    await AsyncStorage.removeItem('isAuthenticated');
  };
  
  const completeOnboarding = async () => {
    setHasCompletedOnboarding(true);
    await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
  };
  
  const value: AuthContextType = {
    isAuthenticated,
    hasCompletedOnboarding,
    isLoading,
    login,
    logout,
    completeOnboarding,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};