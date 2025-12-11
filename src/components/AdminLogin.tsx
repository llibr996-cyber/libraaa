import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, Loader2, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

// List of allowed admin emails
const ADMIN_EMAILS = ['admin@muhimmath.com', 'darkmod261@gmail.com'];

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = location.state?.from?.pathname || '/admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (signInError) {
      setError('Invalid admin credentials. Please try again.');
      setLoading(false);
    } else {
      // On successful login, check if the user is actually an admin before redirecting
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.email && ADMIN_EMAILS.includes(user.email)) {
        navigate(from, { replace: true });
      } else {
        await supabase.auth.signOut();
        setError('This account does not have admin privileges.');
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-neutral-100">
        <div>
          <div className="mx-auto h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
             <Shield className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-neutral-900">
            Admin Access
          </h2>
          <p className="mt-2 text-center text-sm text-neutral-600">
            Please sign in to manage the library.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm font-medium text-center" role="alert">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-neutral-700 mb-1">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="pl-10 block w-full px-3 py-3 border border-neutral-300 rounded-lg placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-shadow"
                  placeholder="admin@example.com"
                  value={credentials.email}
                  onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="pl-10 block w-full px-3 py-3 border border-neutral-300 rounded-lg placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-shadow"
                  placeholder="••••••••"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Sign in'}
            </button>
          </div>
        </form>
        <div className="text-center pt-4">
          <Link
            to="/"
            className="font-medium text-primary hover:text-primary-dark flex items-center justify-center w-full gap-2 hover:underline"
          >
            <ArrowLeft size={16} />
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
