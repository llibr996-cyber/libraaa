import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Menu, X, MessageSquare, Heart, Zap, Search, ArrowRight, Library, ChevronDown } from 'lucide-react';
import ReadWithUsSection from './ReadWithUsSection';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.querySelector(id);
    element?.scrollIntoView({ behavior: 'smooth' });
    if (isMenuOpen) setIsMenuOpen(false);
  };

  return (
    <div className="bg-white text-neutral-800 font-sans min-h-screen flex flex-col">
      {/* Navbar */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-primary p-2 rounded-xl text-white shadow-lg shadow-primary/20 group-hover:bg-primary-dark transition-colors">
                <Library size={24} />
              </div>
              <span className="text-xl font-bold text-neutral-900 tracking-tight">MUHIMMATH</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#home" onClick={(e) => handleSmoothScroll(e, '#home')} className="font-medium text-neutral-600 hover:text-primary transition-colors">Home</a>
              <a href="#read-with-us" onClick={(e) => handleSmoothScroll(e, '#read-with-us')} className="font-medium text-neutral-600 hover:text-primary transition-colors">Read With Us</a>
              <a href="#features" onClick={(e) => handleSmoothScroll(e, '#features')} className="font-medium text-neutral-600 hover:text-primary transition-colors">Features</a>
            </nav>

            <div className="hidden md:flex items-center gap-4">
              <button onClick={() => navigate('/member-status')} className="text-neutral-600 hover:text-primary font-medium px-4 py-2 transition-colors">
                Check Status
              </button>
              <button onClick={() => navigate('/home')} className="bg-primary text-white px-6 py-2.5 rounded-full font-semibold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 transform hover:-translate-y-0.5 flex items-center gap-2">
                Enter Library <ArrowRight size={16} />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-neutral-600">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            className="md:hidden bg-white border-t border-neutral-100 shadow-lg"
          >
            <div className="px-4 py-6 space-y-4">
              <a href="#home" onClick={(e) => handleSmoothScroll(e, '#home')} className="block text-lg font-medium text-neutral-700">Home</a>
              <a href="#read-with-us" onClick={(e) => handleSmoothScroll(e, '#read-with-us')} className="block text-lg font-medium text-neutral-700">Read With Us</a>
              <div className="pt-4 border-t border-neutral-100 space-y-3">
                <button onClick={() => navigate('/member-status')} className="w-full text-left px-4 py-3 rounded-lg bg-neutral-50 text-neutral-700 font-semibold">
                  Check Member Status
                </button>
                <button onClick={() => navigate('/home')} className="w-full text-left px-4 py-3 rounded-lg bg-primary text-white font-semibold">
                  Enter Library
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section id="home" className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent -z-10" />
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent skew-x-12 transform origin-top -z-10 hidden lg:block" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-center lg:text-left"
              >
                <div className="inline-flex items-center gap-2 bg-white border border-neutral-200 rounded-full px-4 py-1.5 mb-8 shadow-sm animate-fade-in">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm font-medium text-neutral-600">Smart Library Management</span>
                </div>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-neutral-900 leading-tight mb-6">
                  Unlock the <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-dark relative">
                    World of Books
                  </span>
                </h1>
                <p className="text-lg sm:text-xl text-neutral-600 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  Seamlessly manage your reading journey. Access thousands of resources, track your history, and join a community of learners.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <button onClick={() => navigate('/home')} className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-xl font-bold text-lg shadow-xl shadow-primary/20 hover:bg-primary-dark hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                    Explore Collection <ArrowRight size={20} />
                  </button>
                  <button onClick={() => navigate('/member-status')} className="w-full sm:w-auto px-8 py-4 bg-white text-neutral-700 border border-neutral-200 rounded-xl font-bold text-lg hover:border-primary hover:text-primary hover:shadow-lg transition-all">
                    My Status
                  </button>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 1, delay: 0.2, type: "spring" }}
                className="relative hidden lg:block"
              >
                <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-4 border border-neutral-100">
                  <img 
                    src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                    alt="Library" 
                    className="rounded-2xl w-full h-[500px] object-cover"
                  />
                  
                  {/* Floating Stats Card */}
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="absolute -bottom-8 -left-8 bg-white p-6 rounded-2xl shadow-xl border border-neutral-100 max-w-xs"
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <div className="bg-green-100 p-3 rounded-xl text-green-600">
                        <BookOpen size={28} />
                      </div>
                      <div>
                        <p className="text-sm text-neutral-500 font-medium">Total Collection</p>
                        <p className="text-2xl font-bold text-neutral-900">5,000+</p>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 w-3/4 rounded-full" />
                    </div>
                  </motion.div>
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
                <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-accent/10 rounded-full blur-3xl -z-10" />
              </motion.div>
            </div>
          </div>
          
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce text-neutral-400">
            <ChevronDown size={32} />
          </div>
        </section>

        {/* Read With Us Section - Enhanced */}
        <ReadWithUsSection />

        {/* Features Section */}
        <section id="features" className="py-24 bg-neutral-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <span className="text-primary font-bold tracking-wider uppercase text-sm bg-primary/10 px-3 py-1 rounded-full">Features</span>
              <h2 className="text-4xl font-bold text-neutral-900 mt-4 mb-4">Everything you need</h2>
              <p className="text-neutral-600 max-w-2xl mx-auto text-lg">A complete solution for managing library resources efficiently and effectively.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              {[
                {
                  icon: <Search size={32} />,
                  title: "Smart Search",
                  desc: "Instantly find books by title, author, or DDC number with our powerful search engine.",
                  color: "bg-blue-500"
                },
                {
                  icon: <Zap size={32} />,
                  title: "Real-time Status",
                  desc: "Check availability and your borrowing status instantly without logging in.",
                  color: "bg-amber-500"
                },
                {
                  icon: <MessageSquare size={32} />,
                  title: "Community Hub",
                  desc: "Engage with other readers through reviews, ratings, and discussions.",
                  color: "bg-rose-500"
                }
              ].map((feature, idx) => (
                <motion.div 
                  key={idx}
                  whileHover={{ y: -10 }}
                  className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-100 hover:shadow-xl transition-all duration-300"
                >
                  <div className={`${feature.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-${feature.color}/30`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-3">{feature.title}</h3>
                  <p className="text-neutral-600 leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-neutral-900 text-white py-16 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2.5 rounded-xl">
                <Library size={28} />
              </div>
              <div>
                <span className="text-2xl font-bold block">Muhimmath</span>
                <span className="text-xs text-neutral-400 tracking-widest uppercase">Library System</span>
              </div>
            </div>
            <div className="text-neutral-400 text-sm text-center md:text-right">
              <p>&copy; {new Date().getFullYear()} Muhimmath Library. All Rights Reserved.</p>
              <div className="mt-2 space-x-6">
                <Link to="/admin-login" className="hover:text-white transition-colors">Admin Login</Link>
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors">Terms</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
