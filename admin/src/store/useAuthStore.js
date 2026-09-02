import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  userType: null, // 'patient', 'doctor', 'admin'
  
  login: (user, type = 'patient') => set({
    user,
    isAuthenticated: true,
    userType: type,
  }),
  
  logout: () => set({
    user: null,
    isAuthenticated: false,
    userType: null,
  }),
  
  setUser: (user) => set({ user }),
}));
