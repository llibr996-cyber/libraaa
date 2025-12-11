import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';
import AdminDashboard from './components/AdminDashboard';
import HomePage from './components/HomePage';
import LandingPage from './components/LandingPage';
import BookDetailPage from './components/BookDetailPage';
import ReadWithUsPage from './components/ReadWithUsPage';
import PostDetailPage from './components/PostDetailPage';
import SetupGuide from './components/SetupGuide';
import AdminLogin from './components/AdminLogin';
import MemberLookupPage from './components/MemberLookupPage';
import Spinner from './components/Spinner';

// List of allowed admin emails
const ADMIN_EMAILS = ['admin@muhimmath.com', 'darkmod261@gmail.com'];

const AdminRoute = ({ session, children }: { session: Session | null, children: JSX.Element }) => {
  const location = useLocation();
  
  // Check if the user's email is in the allowed list
  const isAdmin = session?.user?.email && ADMIN_EMAILS.includes(session.user.email);

  if (!session || !isAdmin) {
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }
  return children;
};

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Spinner />
          <p className="text-gray-500">Loading Application...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/book/:bookId" element={<BookDetailPage />} />
      <Route path="/read-with-us" element={<ReadWithUsPage />} />
      <Route path="/read-with-us/:postId" element={<PostDetailPage />} />
      <Route path="/setup-guide" element={<SetupGuide />} />
      <Route path="/member-status" element={<MemberLookupPage />} />
      
      {/* Auth Routes */}
      <Route 
        path="/admin-login" 
        element={
          session && session.user.email && ADMIN_EMAILS.includes(session.user.email) 
            ? <Navigate to="/admin" /> 
            : <AdminLogin />
        } 
      />
      
      {/* Protected Routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute session={session}>
            <AdminDashboard />
          </AdminRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
