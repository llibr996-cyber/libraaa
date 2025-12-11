import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase, type Member } from '../lib/supabase';
import { User, KeyRound, Mail, Phone, LogOut, Loader2, ArrowLeft, BookCheck, History } from 'lucide-react';

const MyAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMemberData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: memberData, error } = await supabase
          .from('members')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error("Error fetching member profile:", error);
          // If profile doesn't exist, maybe log them out or show an error
          await supabase.auth.signOut();
          navigate('/login');
        } else {
          setMember(memberData);
        }
      } else {
        navigate('/login');
      }
      setLoading(false);
    };

    fetchMemberData();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <p>Could not load your account details. Please try logging in again.</p>
        <Link to="/login" className="ml-4 text-primary font-semibold">Login</Link>
      </div>
    );
  }

  const DetailItem: React.FC<{ icon: React.ElementType; label: string; value?: string | null }> = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-4 py-4 border-b border-neutral-200">
      <Icon size={20} className="text-neutral-500 mt-1" />
      <div>
        <p className="text-sm text-neutral-500">{label}</p>
        <p className="font-medium text-neutral-800">{value || 'Not Provided'}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <Link to="/home" className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark">
                <ArrowLeft size={16} /> Back to Home
            </Link>
            <h1 className="text-xl font-bold text-neutral-800">My Account</h1>
            <button onClick={handleLogout} className="text-neutral-500 hover:text-accent flex items-center gap-2 text-sm font-medium">
                <LogOut size={16} /> Logout
            </button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-neutral-200">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center">
              <User size={40} />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-neutral-900">{member.name}</h2>
              <p className="text-neutral-500">Welcome to your library dashboard.</p>
            </div>
          </div>
          
          <div>
            <DetailItem icon={KeyRound} label="Library ID" value={member.register_number} />
            <DetailItem icon={Mail} label="Email Address" value={member.email} />
            <DetailItem icon={Phone} label="Phone Number" value={member.phone} />
            <DetailItem icon={BookCheck} label="Membership Type" value={member.membership_type} />
            <DetailItem icon={History} label="Member Since" value={new Date(member.membership_date).toLocaleDateString()} />
          </div>

        </div>
      </main>
    </div>
  );
};

export default MyAccountPage;
