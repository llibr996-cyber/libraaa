import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Edit, Trash2, Search, Loader2, BookHeart } from 'lucide-react';
import { supabase, type ReadWithUs } from '../lib/supabase';
import AddEditPostModal from './AddEditPostModal';
import Pagination from './Pagination';

const ReadWithUsManager: React.FC = () => {
  const [posts, setPosts] = useState<ReadWithUs[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<ReadWithUs | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from('read_with_us').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setPosts(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch posts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    const channel = supabase.channel('public:read_with_us').on('postgres_changes', { event: '*', schema: 'public', table: 'read_with_us' }, fetchPosts).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts]);

  const handleAddClick = () => {
    setEditingPost(null);
    setShowModal(true);
  };

  const handleEditClick = (post: ReadWithUs) => {
    setEditingPost(post);
    setShowModal(true);
  };

  const handleDeleteClick = async (postId: string) => {
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      const { error } = await supabase.from('read_with_us').delete().eq('id', postId);
      if (error) {
        alert(`Error deleting post: ${error.message}`);
      }
    }
  };

  const handleSave = () => {
    setShowModal(false);
    setEditingPost(null);
  };

  const filteredPosts = useMemo(() => posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.category.toLowerCase().includes(searchQuery.toLowerCase())
  ), [posts, searchQuery]);

  const paginatedPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredPosts.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredPosts, currentPage, rowsPerPage]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-neutral-200">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h3 className="text-xl font-bold text-neutral-800 flex items-center gap-2">
            <BookHeart size={22} /> Read With Us Manager
          </h3>
          <button onClick={handleAddClick} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
            <Plus size={16} /> Add Post
          </button>
        </div>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
          <input type="text" placeholder="Search by title, author, or category..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg"/>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-10"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">{error}</div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-10 text-neutral-500">No posts found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Author</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {paginatedPosts.map((post) => (
                    <tr key={post.id}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">{post.title}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-500">{post.author}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-500">{post.category}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-500">{new Date(post.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-4">
                          <button onClick={() => handleEditClick(post)} className="text-primary hover:text-primary-dark" title="Edit Post"><Edit size={18} /></button>
                          <button onClick={() => handleDeleteClick(post.id)} className="text-red-600 hover:text-red-900" title="Delete Post"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination 
              currentPage={currentPage}
              totalCount={filteredPosts.length}
              pageSize={rowsPerPage}
              onPageChange={page => setCurrentPage(page)}
            />
          </>
        )}
      </div>
      {showModal && <AddEditPostModal post={editingPost} onClose={() => setShowModal(false)} onSave={handleSave} />}
    </div>
  );
};

export default ReadWithUsManager;
