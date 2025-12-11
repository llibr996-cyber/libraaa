import React, { useState, useEffect, useMemo } from 'react';
import { supabase, type ReadWithUs, type Language } from '../lib/supabase';
import Header from './Header';
import Pagination from './Pagination';
import { Search, Loader2, BookHeart } from 'lucide-react';
import PostCard from './PostCard';

const postCategories: (ReadWithUs['category'] | 'All')[] = ['All', 'Article', 'Book Review', 'Poem', 'Story'];
const languages: (Language | 'All')[] = ['All', 'English', 'Kannada', 'Malayalam', 'Arabic', 'Urdu'];

const ReadWithUsPage: React.FC = () => {
  const [posts, setPosts] = useState<ReadWithUs[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ReadWithUs['category'] | 'All'>('All');
  const [activeLanguage, setActiveLanguage] = useState<Language | 'All'>('All');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(12);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const { data } = await supabase.from('read_with_us').select('*').order('created_at', { ascending: false });
      setPosts(data || []);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  const filteredPosts = useMemo(() => posts
    .filter(post => activeCategory === 'All' || post.category === activeCategory)
    .filter(post => activeLanguage === 'All' || post.language === activeLanguage)
    .filter(post => 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase())
    ), [posts, activeCategory, activeLanguage, searchQuery]);

  const paginatedPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredPosts.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredPosts, currentPage, rowsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeCategory, activeLanguage]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-neutral-900 tracking-tight">Read With Us</h1>
          <p className="mt-3 text-lg text-neutral-600 max-w-2xl mx-auto">Discover stories, poems, and reviews from our talented community.</p>
        </div>

        <div className="mb-8 p-4 bg-white rounded-xl shadow-sm border border-neutral-200/80">
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
              <input
                type="text"
                placeholder="Search by title, author, or content..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-light"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full">
                    <label className="text-sm font-medium text-neutral-500 mb-1 block">Category</label>
                    <div className="flex flex-wrap gap-2">
                        {postCategories.map(cat => (
                            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors ${activeCategory === cat ? 'bg-primary text-white shadow' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}>{cat}</button>
                        ))}
                    </div>
                </div>
                <div className="w-full">
                    <label className="text-sm font-medium text-neutral-500 mb-1 block">Language</label>
                    <div className="flex flex-wrap gap-2">
                        {languages.map(lang => (
                            <button key={lang} onClick={() => setActiveLanguage(lang)} className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors ${activeLanguage === lang ? 'bg-primary text-white shadow' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}>{lang}</button>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
        ) : paginatedPosts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginatedPosts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalCount={filteredPosts.length}
              pageSize={rowsPerPage}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <div className="text-center py-20 text-neutral-500 bg-white rounded-lg border">
            <BookHeart size={48} className="mx-auto mb-4 text-neutral-300" />
            <p className="text-lg font-medium">No Posts Found</p>
            <p>No articles match your current filters. Try a different selection.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ReadWithUsPage;
