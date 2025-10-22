import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase, type ReadWithUs } from '../lib/supabase';
import Header from './Header';
import Pagination from './Pagination';
import { Search, Loader2, BookHeart } from 'lucide-react';

const postCategories: (ReadWithUs['category'] | 'All')[] = ['All', 'Article', 'Book Review', 'Poem', 'Story'];

const ReadWithUsPage: React.FC = () => {
  const [posts, setPosts] = useState<ReadWithUs[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ReadWithUs['category'] | 'All'>('All');
  
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
    .filter(post => activeTab === 'All' || post.category === activeTab)
    .filter(post => 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase())
    ), [posts, activeTab, searchQuery]);

  const paginatedPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredPosts.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredPosts, currentPage, rowsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-neutral-900">Read With Us</h1>
          <p className="mt-2 text-lg text-neutral-600">Discover stories, poems, and reviews from our community.</p>
        </div>

        <div className="mb-8 p-4 bg-white rounded-lg shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by title, author, or content..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <select
              value={activeTab}
              onChange={e => setActiveTab(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
            >
              {postCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
        ) : paginatedPosts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginatedPosts.map(post => (
                <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col group">
                  <div className="p-6 flex-grow">
                    <p className="text-xs font-semibold uppercase text-primary mb-2">{post.category}</p>
                    <h3 className="text-xl font-bold text-neutral-900 mb-2 truncate group-hover:text-primary-dark transition-colors">{post.title}</h3>
                    <p className="text-sm text-neutral-500 mb-4">by {post.author}</p>
                    <p className="text-neutral-600 text-sm leading-relaxed line-clamp-4">{post.content}</p>
                  </div>
                  <div className="p-6 pt-0 mt-auto">
                    <Link to={`/read-with-us/${post.id}`} className="font-semibold text-primary hover:text-primary-dark transition-colors">
                      Read More &rarr;
                    </Link>
                  </div>
                </div>
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
          <div className="text-center py-20 text-neutral-500">
            <BookHeart size={48} className="mx-auto mb-4" />
            <p className="text-lg">No posts match your criteria.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ReadWithUsPage;
