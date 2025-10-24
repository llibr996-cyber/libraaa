import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, type ReadWithUs, type Language } from '../lib/supabase';
import { BookHeart, Loader2 } from 'lucide-react';
import PostCard from './PostCard';

const postCategories: (ReadWithUs['category'] | 'All')[] = ['All', 'Article', 'Book Review', 'Poem', 'Story'];
const languages: (Language | 'All')[] = ['All', 'English', 'Kannada', 'Malayalam', 'Arabic', 'Urdu'];

const ReadWithUsSection: React.FC = () => {
  const [posts, setPosts] = useState<ReadWithUs[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ReadWithUs['category'] | 'All'>('All');
  const [activeLanguage, setActiveLanguage] = useState<Language | 'All'>('All');

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('read_with_us')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20); // Fetch a bit more to have enough for filtering
      
      if (data) setPosts(data);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    const filtered = posts
      .filter(p => activeTab === 'All' || p.category === activeTab)
      .filter(p => activeLanguage === 'All' || p.language === activeLanguage);
    return filtered.slice(0, 4);
  }, [posts, activeTab, activeLanguage]);

  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <motion.section
      id="read-with-us"
      className="py-16 lg:py-24 bg-white"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-neutral-900">Read With Us</h2>
          <p className="mt-2 text-neutral-600 max-w-2xl mx-auto">Explore creative content contributed by our institution’s talented students.</p>
        </div>

        <div className="flex flex-col md:flex-row justify-center items-center gap-8 mb-10">
          <div className="flex flex-col items-center gap-2">
            <h4 className="text-sm font-semibold text-gray-500">Category</h4>
            <div className="flex justify-center flex-wrap gap-2">
              {postCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                    activeTab === cat ? 'bg-purple-600 text-white' : 'bg-gray-100 text-neutral-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <h4 className="text-sm font-semibold text-gray-500">Language</h4>
            <div className="flex justify-center flex-wrap gap-2">
              {languages.map(lang => (
                <button
                  key={lang}
                  onClick={() => setActiveLanguage(lang)}
                  className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                    activeLanguage === lang ? 'bg-purple-600 text-white' : 'bg-gray-100 text-neutral-600 hover:bg-gray-200'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center"><Loader2 className="animate-spin text-purple-600" size={32} /></div>
        ) : filteredPosts.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            initial="hidden"
            animate="visible"
          >
            {filteredPosts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-10 text-neutral-500">
            <BookHeart size={40} className="mx-auto mb-2" />
            <p>No posts match the selected filters. Check back soon!</p>
          </div>
        )}

        <div className="text-center mt-12">
          <Link to="/read-with-us" className="font-semibold text-purple-600 hover:text-purple-800 transition-colors inline-flex items-center gap-2">
            View All Posts
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </motion.section>
  );
};

export default ReadWithUsSection;
