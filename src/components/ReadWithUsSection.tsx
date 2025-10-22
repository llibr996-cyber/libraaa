import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, type ReadWithUs } from '../lib/supabase';
import { BookHeart, Loader2 } from 'lucide-react';

const postCategories: (ReadWithUs['category'] | 'All')[] = ['All', 'Article', 'Book Review', 'Poem', 'Story'];

const ReadWithUsSection: React.FC = () => {
  const [posts, setPosts] = useState<ReadWithUs[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ReadWithUs['category'] | 'All'>('All');

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('read_with_us')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(12); // Fetch a few more to ensure all tabs have content
      
      if (data) setPosts(data);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    const filtered = activeTab === 'All' ? posts : posts.filter(p => p.category === activeTab);
    return filtered.slice(0, 4); // Display up to 4 posts
  }, [posts, activeTab]);

  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.section
      id="read-with-us"
      className="py-16 lg:py-20 bg-neutral-50"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">Read With Us</h2>
          <p className="text-neutral-600 max-w-2xl mx-auto">Explore creative content contributed by our institution’s talented students.</p>
        </div>

        <div className="flex justify-center flex-wrap gap-2 mb-10">
          {postCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                activeTab === cat ? 'bg-primary text-white' : 'bg-white text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : filteredPosts.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            initial="hidden"
            animate="visible"
          >
            {filteredPosts.map(post => (
              <motion.div key={post.id} variants={cardVariants} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col group">
                <div className="p-6 flex-grow">
                  <p className="text-xs font-semibold uppercase text-primary mb-2">{post.category}</p>
                  <h3 className="text-lg font-bold text-neutral-900 mb-2 truncate group-hover:text-primary-dark transition-colors">{post.title}</h3>
                  <p className="text-sm text-neutral-500 mb-4">by {post.author}</p>
                  <p className="text-neutral-600 text-sm leading-relaxed line-clamp-3">{post.content}</p>
                </div>
                <div className="p-6 pt-0 mt-auto">
                  <Link to={`/read-with-us/${post.id}`} className="font-semibold text-primary hover:text-primary-dark transition-colors">
                    Read More &rarr;
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-10 text-neutral-500">
            <BookHeart size={40} className="mx-auto mb-2" />
            <p>No posts in this category yet. Check back soon!</p>
          </div>
        )}

        <div className="text-center mt-12">
          <Link to="/read-with-us" className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors">
            View All Posts
          </Link>
        </div>
      </div>
    </motion.section>
  );
};

export default ReadWithUsSection;
