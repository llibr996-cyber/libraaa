import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, type ReadWithUs } from '../lib/supabase';
import { useSession } from '../hooks/useSession';
import Header from './Header';
import Comments from './Comments';
import ShareModal from './ShareModal';
import { Loader2, ArrowLeft, AlertTriangle, User, Calendar, Tag, Globe, Heart, Share2, Eye } from 'lucide-react';

const PostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const sessionId = useSession();
  
  const [post, setPost] = useState<ReadWithUs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) {
        setError('No post ID provided.');
        setLoading(false);
        return;
      }
      setLoading(true);
      
      supabase.rpc('increment_read_count', { post_id_in: postId }).catch(console.error);

      const { data, error } = await supabase.from('read_with_us').select('*').eq('id', postId).single();

      if (error) {
        setError('Post not found.');
      } else {
        setPost(data);
        setLikeCount(data.like_count);
      }
      setLoading(false);
    };
    fetchPost();
  }, [postId]);

  useEffect(() => {
    if (!postId || !sessionId || !post) return;

    const checkLikeStatus = async () => {
      const { data } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('session_id', sessionId)
        .single();
      
      if (data) setIsLiked(true);
    };
    checkLikeStatus();
  }, [postId, sessionId, post]);

  const handleLike = async () => {
    if (isLiked || isLiking || !sessionId || !post) return;
    
    setIsLiking(true);
    setIsLiked(true);
    setLikeCount(prev => prev + 1);

    const { error } = await supabase.rpc('increment_like', {
      post_id_in: post.id,
      session_id_in: sessionId
    });

    if (error) {
      setIsLiked(false);
      setLikeCount(prev => prev - 1);
      alert('Could not like post. Please try again.');
      console.error(error);
    }
    setIsLiking(false);
  };

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
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/read-with-us" className="flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-800 mb-6">
          <ArrowLeft size={16} /> Back to All Posts
        </Link>

        <article>
          {post.image_url && (
            <div className="aspect-w-16 aspect-h-9 rounded-xl overflow-hidden mb-8 shadow-lg">
              <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}
          <header className="mb-8 border-b border-gray-200 pb-6">
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight">{post.title}</h1>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4 text-sm text-gray-500">
              <div className="flex items-center gap-3">
                {post.author_image_url ? (
                  <img src={post.author_image_url} alt={post.author} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <User size={24} className="text-gray-500" />
                  </div>
                )}
                <div>
                  <span className="text-xs">Author</span>
                  <span className="block font-semibold text-gray-700 text-base">{post.author}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-gray-400" />
                <div><span className="text-xs">Published</span><span className="block font-semibold text-gray-700">{new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
              </div>
              <div className="flex items-center gap-2">
                <Tag size={18} className="text-gray-400" />
                <div><span className="text-xs">Category</span><span className="block font-semibold text-purple-600">{post.category}</span></div>
              </div>
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-gray-400" />
                <div><span className="text-xs">Language</span><span className="block font-semibold text-gray-700">{post.language}</span></div>
              </div>
            </div>
          </header>
          
          <div className="prose prose-lg lg:prose-xl max-w-none text-gray-800 leading-relaxed whitespace-pre-wrap selection:bg-purple-100">
            {post.content}
          </div>
        </article>

        <Comments postId={post.id} />
      </main>
      
      <div className="fixed bottom-8 right-8 z-40 flex flex-col gap-3">
        <button
          onClick={handleLike}
          disabled={isLiked || isLiking}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
            isLiked 
              ? 'bg-red-500 text-white cursor-not-allowed' 
              : 'bg-white text-red-500 hover:bg-red-50 hover:scale-110'
          }`}
          aria-label="Like this post"
        >
          <Heart className={`transition-transform duration-200 ${isLiked ? 'fill-current' : ''}`} />
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full px-2 py-0.5">{likeCount}</span>
        </button>
        <button
          onClick={() => setShowShareModal(true)}
          className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 bg-white text-blue-500 hover:bg-blue-50 hover:scale-110"
          aria-label="Share this post"
        >
          <Share2 />
        </button>
      </div>

      {showShareModal && <ShareModal post={post} onClose={() => setShowShareModal(false)} />}
    </div>
  );
};

export default PostDetailPage;
