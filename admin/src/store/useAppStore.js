import { create } from 'zustand';

export const useAppStore = create((set, get) => ({
  // Patients
  patients: [],
  addPatient: (patient) => set((s) => ({ patients: [...s.patients, { ...patient, id: Date.now() }] })),
  
  // Appointments
  appointments: [],
  addAppointment: (apt) => set((s) => ({ appointments: [...s.appointments, { ...apt, id: Date.now() }] })),
  updateAppointment: (id, data) => set((s) => ({
    appointments: s.appointments.map((a) => (a.id === id ? { ...a, ...data } : a)),
  })),
  
  // Reports
  reports: [],
  addReport: (report) => set((s) => ({ reports: [...s.reports, { ...report, id: Date.now() }] })),
  
  // Toasts
  toasts: [],
  addToast: (toast) => {
    const id = Date.now();
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  
  // Emergency
  emergencyActive: false,
  setEmergencyActive: (val) => set({ emergencyActive: val }),
  
  // Doctor verification queue
  doctorQueue: [],
  setDoctorQueue: (queue) => set({ doctorQueue: queue }),
  approveDoctor: (id) => set((s) => ({
    doctorQueue: s.doctorQueue.map((d) => (d.id === id ? { ...d, status: 'approved' } : d)),
  })),
  denyDoctor: (id, reason) => set((s) => ({
    doctorQueue: s.doctorQueue.map((d) => (d.id === id ? { ...d, status: 'denied', denyReason: reason } : d)),
  })),
}));
