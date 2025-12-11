import React from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header className="w-full bg-white shadow-sm border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 cursor-pointer" onClick={() => navigate('/')}>
            Muhimmath Library
          </h1>
          <div className="flex items-center gap-2">
             <button
                onClick={() => navigate('/member-status')}
                className="bg-neutral-100 text-neutral-700 hover:bg-neutral-200 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
              >
                <Search size={20} />
                <span className="hidden sm:inline">Member Status</span>
              </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
