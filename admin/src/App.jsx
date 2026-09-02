import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RegionalAdminDashboard from './pages/admin/RegionalAdminDashboard';
import StateOfficerLogin from './pages/auth/StateOfficerLogin';

function App() {
  // Authentication State: null (shows Login) or 'uttar_pradesh' | 'uttarakhand' | 'maharashtra'
  // Default to 'uttar_pradesh' so dashboard is immediately ready, but officer can log out to State Login screen
  const [authStateId, setAuthStateId] = useState('uttar_pradesh');

  const handleLoginSuccess = (stateId) => {
    setAuthStateId(stateId);
  };

  const handleLogout = () => {
    setAuthStateId(null);
  };

  /* Yeh dashboard main site ke andar /regional-admin par chalta hai, isliye
     Router ko wahi basename dena zaroori hai — warna andar ke saare link
     '/' (main public site) par chale jayenge aur dashboard toot jayega.
     Dev server par basename '/' rehta hai taaki npm run dev bhi chale.      */
  const basename = import.meta.env.PROD ? '/regional-admin' : '/';

  return (
    <Router basename={basename}>
      <Routes>
        {/* Main Dashboard / Login Routing */}
        <Route 
          path="/" 
          element={
            authStateId ? (
              <RegionalAdminDashboard 
                authStateId={authStateId} 
                onLogout={handleLogout} 
              />
            ) : (
              <StateOfficerLogin onLoginSuccess={handleLoginSuccess} />
            )
          } 
        />

        <Route 
          path="/login" 
          element={<StateOfficerLogin onLoginSuccess={handleLoginSuccess} />} 
        />

        <Route 
          path="/admin" 
          element={
            authStateId ? (
              <RegionalAdminDashboard 
                authStateId={authStateId} 
                onLogout={handleLogout} 
              />
            ) : (
              <StateOfficerLogin onLoginSuccess={handleLoginSuccess} />
            )
          } 
        />

        <Route 
          path="/dashboard" 
          element={
            authStateId ? (
              <RegionalAdminDashboard 
                authStateId={authStateId} 
                onLogout={handleLogout} 
              />
            ) : (
              <StateOfficerLogin onLoginSuccess={handleLoginSuccess} />
            )
          } 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
