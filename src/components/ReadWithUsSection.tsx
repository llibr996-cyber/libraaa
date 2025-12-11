import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, type ReadWithUs } from '../lib/supabase';
import { BookHeart, Loader2, ArrowRight, Star } from 'lucide-react';
import PostCard from './PostCard';

const ReadWithUsSection: React.FC = () => {
  const [posts, setPosts] = useState<ReadWithUs[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('read_with_us')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);
      
      if (data) setPosts(data);
      if (error) console.error("Error fetching 'Read With Us' posts:", error);
      setLoading(false);
    };

    fetchPosts();

    const channel = supabase
      .channel('public:read_with_us:landing')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'read_with_us' }, fetchPosts)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <section id="read-with-us" className="py-24 bg-white relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-neutral-50/50 -z-10" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="max-w-2xl">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-2 text-primary font-bold tracking-wider uppercase text-sm mb-3"
                >
                    <BookHeart size={18} />
                    <span>Community Corner</span>
                </motion.div>
                <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl md:text-5xl font-extrabold text-neutral-900 leading-tight"
                >
                    Read With Us
                </motion.h2>
                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="mt-4 text-lg text-neutral-600"
                >
                    Dive into stories, reviews, and articles written by our vibrant community of readers.
                </motion.p>
            </div>
            
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
            >
                <Link to="/read-with-us" className="hidden md:inline-flex items-center gap-2 font-bold text-primary hover:text-primary-dark transition-colors text-lg group">
                    View All Posts <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                </Link>
            </motion.div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
        ) : posts.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
                visible: { transition: { staggerChildren: 0.1 } }
            }}
          >
            {posts.map((post, idx) => (
              <motion.div
                key={post.id}
                variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                }}
              >
                 <PostCard post={post} showStats={false} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-neutral-200">
            <BookHeart size={48} className="mx-auto mb-4 text-neutral-300" />
            <p className="text-xl font-medium text-neutral-900">No Posts Yet</p>
            <p className="text-neutral-500">Be the first to share your story!</p>
          </div>
        )}

        <div className="mt-12 text-center md:hidden">
            <Link to="/read-with-us" className="inline-flex items-center gap-2 font-bold text-primary hover:text-primary-dark transition-colors text-lg">
                View All Posts <ArrowRight size={20} />
            </Link>
        </div>
      </div>
    </section>
  );
};

export default ReadWithUsSection;
