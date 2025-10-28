import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Menu, X, Facebook, Twitter, Instagram, Search, CheckCircle } from 'lucide-react';
import { supabase, type Book } from '../lib/supabase';
import ReadWithUsSection from './ReadWithUsSection';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [heroSearchQuery, setHeroSearchQuery] = useState('');

  useEffect(() => {
    const fetchFeaturedBooks = async () => {
      setLoadingBooks(true);
      const { data } = await supabase.from('books').select('*').limit(4).order('created_at', { ascending: false });
      setFeaturedBooks(data || []);
      setLoadingBooks(false);
    };
    fetchFeaturedBooks();
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearchQuery.trim()) {
      navigate(`/home?search=${encodeURIComponent(heroSearchQuery)}`);
    } else {
      navigate('/home');
    }
  };

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Featured', href: '#featured' },
    { name: 'Read With Us', href: '#read-with-us' },
    { name: 'Contact', href: '#contact' },
  ];
  
  const highlights = ["Access Anytime", "Multilingual", "Reviews & Articles", "Student-Friendly"];

  return (
    <div className="bg-white text-neutral-800 font-sans">
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <a href="#home" className="flex items-center gap-2 cursor-pointer">
              <BookOpen className="text-purple-600" />
              <span className="text-xl font-bold text-neutral-900">MUHIMMATH LIBRARY</span>
            </a>
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map(link => (
                <a key={link.name} href={link.href} className="font-medium text-neutral-600 hover:text-purple-600 transition-colors">{link.name}</a>
              ))}
            </nav>
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/login')} className="hidden md:block bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                Admin Login
              </button>
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-neutral-600">
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>
        {isMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="md:hidden px-4 pt-2 pb-4 space-y-2">
            {navLinks.map(link => (
              <a key={link.name} href={link.href} onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 hover:bg-neutral-100">{link.name}</a>
            ))}
            <button onClick={() => { navigate('/login'); setIsMenuOpen(false); }} className="w-full text-left bg-purple-600 text-white px-3 py-2 rounded-md font-semibold">
              Admin Login
            </button>
          </motion.div>
        )}
      </header>

      <main>
        <section id="home" className="relative min-h-screen flex items-center justify-center text-white bg-gray-800">
          <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=2070&auto=format&fit=crop')" }}></div>
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900/60 to-gray-900/80"></div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8 }} 
            className="relative z-10 text-center px-4 py-20"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight drop-shadow-lg leading-tight">
              6000+ Books, Available in 6 Different Languages
            </h1>
            <p className="mt-4 text-lg md:text-xl max-w-3xl mx-auto text-gray-200 drop-shadow">
              A modern digital library built for readers, students, and book lovers.
            </p>
            <div className="mt-8 flex flex-wrap justify-center items-center gap-x-4 gap-y-2">
              {highlights.map(highlight => (
                <div key={highlight} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white text-sm font-medium px-3 py-1.5 rounded-full">
                  <CheckCircle size={16} className="text-green-300" />
                  {highlight}
                </div>
              ))}
            </div>
            <form onSubmit={handleHeroSearch} className="mt-10 max-w-xl mx-auto">
              <div className="relative">
                <input
                  type="search"
                  value={heroSearchQuery}
                  onChange={(e) => setHeroSearchQuery(e.target.value)}
                  placeholder="Search for books, authors, or categories..."
                  className="w-full pl-5 pr-28 py-4 rounded-full text-gray-800 border-2 border-transparent focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-purple-700 transition-colors">
                  <Search size={20} />
                </button>
              </div>
            </form>
          </motion.div>
        </section>

        <section id="featured" className="py-16 lg:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-neutral-900">Featured Books</h2>
              <p className="mt-2 text-neutral-600">A glimpse into our newest and most popular additions.</p>
            </div>
            {loadingBooks ? (
              <div className="flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {featuredBooks.map(book => (
                  <div key={book.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col group transition-transform duration-300 hover:-translate-y-1">
                    <div className="h-56 bg-gray-200 flex items-center justify-center">
                      <BookOpen size={48} className="text-gray-300" />
                    </div>
                    <div className="p-5 flex flex-col flex-grow">
                      <h3 className="text-md font-bold text-gray-900 line-clamp-2 group-hover:text-purple-700">{book.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">by {book.author}</p>
                      <button onClick={() => navigate(`/book/${book.id}`)} className="mt-auto pt-4 font-semibold text-sm text-purple-600 hover:text-purple-800 self-start">
                        View Details &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="text-center mt-12">
              <button onClick={() => navigate('/home')} className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-transform hover:scale-105 shadow-lg">
                Explore Full Collection
              </button>
            </div>
          </div>
        </section>

        <ReadWithUsSection />

        <section id="contact" className="py-16 lg:py-24 bg-gray-800 text-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Get In Touch</h2>
            <p className="text-neutral-300 mb-8">Have a question or suggestion? We'd love to hear from you.</p>
            <div className="mt-8 flex justify-center gap-4">
                <a href="#" className="bg-white/10 p-3 rounded-full hover:bg-white/20 transition-colors"><Facebook /></a>
                <a href="#" className="bg-white/10 p-3 rounded-full hover:bg-white/20 transition-colors"><Twitter /></a>
                <a href="#" className="bg-white/10 p-3 rounded-full hover:bg-white/20 transition-colors"><Instagram /></a>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-neutral-900 text-neutral-400 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Muhimmath Library. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
