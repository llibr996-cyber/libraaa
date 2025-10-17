import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Menu, X, Facebook, Twitter, Instagram } from 'lucide-react';
import { supabase, type Book } from '../lib/supabase';
import WebsiteQRCode from './WebsiteQRCode';

interface LandingPageProps {
  onNavigate: (view: 'home' | 'login') => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [collection, setCollection] = useState<Book[]>([]);
  const [loadingCollection, setLoadingCollection] = useState(true);

  useEffect(() => {
    const fetchCollectionPreview = async () => {
      setLoadingCollection(true);
      const { data } = await supabase.from('books').select('*').limit(6).order('created_at', { ascending: false });
      setCollection(data || []);
      setLoadingCollection(false);
    };
    fetchCollectionPreview();
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Collection', href: '#collection' },
    { name: 'Contact', href: '#contact' },
  ];

  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const StaggeredChild = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="bg-white text-neutral-800">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <BookOpen className="text-primary" />
              <span className="text-xl font-bold text-neutral-900">MUHIMMATH LIBRARY</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map(link => (
                <a key={link.name} href={link.href} className="font-medium text-neutral-600 hover:text-primary transition-colors">{link.name}</a>
              ))}
            </nav>
            <div className="flex items-center gap-4">
              <button onClick={() => onNavigate('login')} className="hidden md:block bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors">
                Login
              </button>
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-neutral-600">
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>
        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden px-4 pt-2 pb-4 space-y-2"
          >
            {navLinks.map(link => (
              <a key={link.name} href={link.href} onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 hover:bg-neutral-100">{link.name}</a>
            ))}
            <button onClick={() => { onNavigate('login'); setIsMenuOpen(false); }} className="w-full text-left bg-primary text-white px-3 py-2 rounded-md font-semibold">
              Login
            </button>
          </motion.div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section id="home" className="relative h-screen flex items-center justify-center text-white">
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=2070&auto=format&fit=crop')" }}
          ></div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 text-center px-4"
          >
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight drop-shadow-lg">MUHIMMATH LIBRARY</h1>
            <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto drop-shadow">Where every book is a new adventure</p>
            <button onClick={() => onNavigate('home')} className="mt-8 bg-primary text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-primary-dark transition-transform hover:scale-105 shadow-lg">
              Get Started
            </button>
          </motion.div>
        </section>

        {/* About Us Section */}
        <motion.section
          id="about"
          className="py-20 bg-neutral-50"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="rounded-lg overflow-hidden shadow-xl">
                <img src="https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=1887&auto=format&fit=crop" alt="Person reading a book" className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-neutral-900 mb-4">About Us</h2>
                <p className="text-neutral-600 leading-relaxed mb-4">
                  Welcome to Muhimmath Library, a cornerstone of our community's intellectual and cultural life. Established with the vision to foster a love for reading and lifelong learning, we offer a vast collection of books across all genres and for all ages.
                </p>
                <p className="text-neutral-600 leading-relaxed">
                  Our mission is to provide free and equitable access to information, support education, and create a welcoming space for discovery and creativity. Whether you're a student, a researcher, or a casual reader, our doors are always open for you.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Our Collection Section */}
        <motion.section
          id="collection"
          className="py-20"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-neutral-900 mb-12">Our Collection</h2>
            {loadingCollection ? (
              <div className="flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
            ) : (
              <motion.div
                className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12"
                variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
              >
                {collection.map(book => (
                  <motion.div key={book.id} variants={StaggeredChild} className="bg-neutral-100 rounded-lg overflow-hidden shadow-md group">
                    <div className="h-48 bg-neutral-200 flex items-center justify-center text-neutral-400">
                      <BookOpen size={40} />
                    </div>
                    <div className="p-3 text-left">
                      <h3 className="font-semibold text-sm truncate group-hover:text-primary">{book.title}</h3>
                      <p className="text-xs text-neutral-500 truncate">{book.author}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
            <button onClick={() => onNavigate('home')} className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors">
              View All
            </button>
          </div>
        </motion.section>

        {/* QR Code Access Section */}
        <motion.section
          id="access"
          className="py-20 bg-neutral-50"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
            <WebsiteQRCode />
          </div>
        </motion.section>

        {/* Contact Us Section */}
        <motion.section
          id="contact"
          className="py-20"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">Contact Us</h2>
            <p className="text-neutral-600 mb-8">Have a question or suggestion? We'd love to hear from you.</p>
            <form className="space-y-6 text-left">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">Name</label>
                <input type="text" id="name" className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                <input type="email" id="email" className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-neutral-700 mb-1">Message</label>
                <textarea id="message" rows={4} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-primary focus:border-primary"></textarea>
              </div>
              <div className="text-center">
                <button type="submit" onClick={(e) => e.preventDefault()} className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors">
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="bg-neutral-800 text-neutral-300 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center gap-6 mb-4">
            <a href="#" className="hover:text-white"><Facebook /></a>
            <a href="#" className="hover:text-white"><Twitter /></a>
            <a href="#" className="hover:text-white"><Instagram /></a>
          </div>
          <p>&copy; 2025 Muhimmath Library. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
