import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';
import LoginForm from './components/LoginForm';
import AdminDashboard from './components/AdminDashboard';
import HomePage from './components/HomePage';
import LandingPage from './components/LandingPage';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [view, setView] = useState<'landing' | 'home' | 'login'>('landing');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setView('landing'); // If user logs out, return to landing page
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleNavigate = (newView: 'home' | 'login') => {
    setView(newView);
  };
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    // The onAuthStateChange listener will handle setting the view to 'landing'
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-500">Loading Application...</p>
        </div>
      </div>
    );
  }

  if (session) {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  if (view === 'login') {
    return <LoginForm onReturn={() => setView('landing')} />;
  }
  
  if (view === 'home') {
    return <HomePage onAdminLoginClick={() => setView('login')} onReturnHome={() => setView('landing')} />;
  }

  return <LandingPage onNavigate={handleNavigate} />;
}

export default App;
