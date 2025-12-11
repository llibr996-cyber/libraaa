import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Mail, Phone, ArrowLeft, Loader2, KeyRound, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const RegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ libraryId: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      // 1. Create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Registration failed: no user created.");

      // 2. Get the next available library ID
      const { data: nextIdData, error: rpcError } = await supabase.rpc('get_next_register_number');
      if (rpcError) throw rpcError;
      
      const libraryId = nextIdData;

      // 3. Create the corresponding member profile
      const { error: profileError } = await supabase.from('members').insert({
        id: authData.user.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        register_number: libraryId,
        membership_date: new Date().toISOString(),
      });

      if (profileError) throw profileError;

      setSuccessData({ libraryId });

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-neutral-900">
            Registration Successful!
          </h2>
          <p className="mt-2 text-neutral-600">
            Your account has been created. Please save your Library ID. You will need it to log in.
          </p>
          <div className="bg-green-50 border-2 border-dashed border-green-300 rounded-lg p-6">
            <p className="text-sm text-green-800 font-medium">Your Library ID is:</p>
            <p className="text-2xl font-bold text-green-900 tracking-widest mt-2">{successData.libraryId}</p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark"
          >
            Proceed to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-neutral-900">
            Create a New Account
          </h2>
          <p className="mt-2 text-center text-sm text-neutral-600">
            Join the Muhimmath Library community.
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
              <label htmlFor="name" className="sr-only">Full Name</label>
              <div className="relative"><User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} /><input id="name" type="text" required className="pl-10 w-full px-3 py-3 border rounded-md" placeholder="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
            </div>
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <div className="relative"><Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} /><input id="email" type="email" required className="pl-10 w-full px-3 py-3 border rounded-md" placeholder="Email Address" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
            </div>
            <div>
              <label htmlFor="phone" className="sr-only">Phone (Optional)</label>
              <div className="relative"><Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} /><input id="phone" type="tel" className="pl-10 w-full px-3 py-3 border rounded-md" placeholder="Phone Number (Optional)" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
            </div>
            <div>
              <label htmlFor="password" class="sr-only">Password</label>
              <div className="relative"><Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} /><input id="password" type="password" required className="pl-10 w-full px-3 py-3 border rounded-md" placeholder="Password (min. 6 characters)" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} /></div>
            </div>
            <div>
              <label htmlFor="confirm-password" class="sr-only">Confirm Password</label>
              <div className="relative"><Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} /><input id="confirm-password" type="password" required className="pl-10 w-full px-3 py-3 border rounded-md" placeholder="Confirm Password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} /></div>
            </div>
          </div>

          <div>
            <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" /> : 'Register'}
            </button>
          </div>
        </form>
        <div className="text-center">
          <Link to="/login" className="font-medium text-primary hover:text-primary-dark flex items-center justify-center w-full gap-2">
            Already have an account? Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;
