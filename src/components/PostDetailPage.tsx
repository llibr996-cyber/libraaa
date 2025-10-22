import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, type ReadWithUs } from '../lib/supabase';
import Header from './Header';
import { Loader2, ArrowLeft, AlertTriangle, User, Calendar, Tag } from 'lucide-react';

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

        <article className="bg-white rounded-xl shadow-md border border-gray-200 p-6 md:p-10">
          <header className="mb-8 border-b border-gray-200 pb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">{post.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <User size={14} />
                <span>By {post.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} />
                <span>{new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Tag size={14} />
                <span className="font-semibold text-purple-600">{post.category}</span>
              </div>
            </div>
          </header>
          
          <div className="prose prose-lg max-w-none text-gray-700 whitespace-pre-wrap">
            {post.content}
          </div>
        </article>
      </main>
    </div>
  );
};

export default PostDetailPage;
