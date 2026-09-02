import { create } from 'zustand';

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem('mediconnect-theme') || 'dark',
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('mediconnect-theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      return { theme: newTheme };
    }),
  initTheme: () => {
    const saved = localStorage.getItem('mediconnect-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    set({ theme: saved });
  },
}));
