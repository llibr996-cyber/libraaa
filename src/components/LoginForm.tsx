import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { KeyRound, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    libraryId: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // 1. Find the user's email from their library ID
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('email')
      .eq('register_number', credentials.libraryId)
      .single();

    if (memberError || !member) {
      setError('Invalid credentials — please check your Library ID and password.');
      setLoading(false);
      return;
    }

    // 2. Attempt to sign in with the found email and provided password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: member.email,
      password: credentials.password,
    });

    if (signInError) {
      setError('Invalid credentials — please check your Library ID and password.');
    } else {
      navigate('/account'); // Redirect to account page on success
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-neutral-900">
            Member Login
          </h2>
          <p className="mt-2 text-center text-sm text-neutral-600">
            Access your Muhimmath Library account.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="library-id" className="font-medium text-neutral-700">
                Library ID
              </label>
              <div className="relative mt-1">
                <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
                <input
                  id="library-id"
                  name="libraryId"
                  type="text"
                  required
                  className="pl-10 appearance-none rounded-md relative block w-full px-3 py-3 border border-neutral-300 placeholder-neutral-500 text-neutral-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                  placeholder="Enter your Library ID (e.g., LIB-0001)"
                  value={credentials.libraryId}
                  onChange={(e) => setCredentials({ ...credentials, libraryId: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="font-medium text-neutral-700">
                Password
              </label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="pl-10 appearance-none rounded-md relative block w-full px-3 py-3 border border-neutral-300 placeholder-neutral-500 text-neutral-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <a href="#" className="font-medium text-primary hover:text-primary-dark">
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Sign in'}
            </button>
          </div>
        </form>
        <div className="text-center">
          <Link
            to="/"
            className="font-medium text-primary hover:text-primary-dark flex items-center justify-center w-full gap-2"
          >
            <ArrowLeft size={16} />
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
