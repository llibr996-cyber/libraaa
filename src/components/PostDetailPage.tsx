import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, type ReadWithUs } from '../lib/supabase';
import Header from './Header';
import { Loader2, ArrowLeft, AlertTriangle, User, Calendar, Tag, Globe } from 'lucide-react';

const PostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<ReadWithUs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) {
        setError('No post ID provided.');
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase.from('read_with_us').select('*').eq('id', postId).single();

      if (error) {
        setError('Post not found.');
      } else {
        setPost(data);
      }
      setLoading(false);
    };
    fetchPost();
  }, [postId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-purple-600" size={48} />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
        <AlertTriangle className="text-red-500 mb-4" size={48} />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
        <p className="text-gray-600 mb-6">{error || 'Could not load post details.'}</p>
        <Link to="/read-with-us" className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700">
          Back to All Posts
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/read-with-us" className="flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-800 mb-6">
          <ArrowLeft size={16} /> Back to All Posts
        </Link>

        <article className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          {post.image_url && (
            <div className="aspect-w-16 aspect-h-9">
              <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-6 md:p-10">
            <header className="mb-8 border-b border-gray-200 pb-6">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">{post.title}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-4 text-sm text-gray-500">
                <div className="flex items-center gap-3">
                  {post.author_image_url ? (
                    <img src={post.author_image_url} alt={post.author} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <User size={20} className="text-gray-500" />
                    </div>
                  )}
                  <div>
                    <span className="text-xs">Author</span>
                    <span className="block font-semibold text-gray-700">{post.author}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-gray-400" />
                  <div>
                    <span className="text-xs">Published</span>
                    <span className="block font-semibold text-gray-700">{new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Tag size={16} className="text-gray-400" />
                  <div>
                    <span className="text-xs">Category</span>
                    <span className="block font-semibold text-purple-600">{post.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Globe size={16} className="text-gray-400" />
                  <div>
                    <span className="text-xs">Language</span>
                    <span className="block font-semibold text-gray-700">{post.language}</span>
                  </div>
                </div>
              </div>
            </header>
            
            <div className="prose prose-lg max-w-none text-gray-700 whitespace-pre-wrap">
              {post.content}
            </div>
          </div>
        </article>
      </main>
    </div>
  );
};

export default PostDetailPage;
