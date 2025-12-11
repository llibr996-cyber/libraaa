import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, type ReadWithUs } from '../lib/supabase';
import { useSession } from '../hooks/useSession';
import Header from './Header';
import Comments from './Comments';
import ShareModal from './ShareModal';
import { Loader2, ArrowLeft, AlertTriangle, User, Calendar, Tag, Globe, Heart, Share2, Eye } from 'lucide-react';
import Spinner from './Spinner';

const PostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const sessionId = useSession();
  
  const [post, setPost] = useState<ReadWithUs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [likeError, setLikeError] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) {
        setError('No post ID provided.');
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { error: readCountError } = await supabase.rpc('increment_read_count', { post_id_in: postId });
        if (readCountError) {
            console.error('Failed to increment read count:', readCountError);
        }

        const { data, error: fetchError } = await supabase
          .from('read_with_us')
          .select('*')
          .eq('id', postId)
          .single();

        if (fetchError) throw fetchError;
        
        setPost(data);
        setLikeCount(data.like_count);
      } catch (err: any) {
        setError(err.message || 'Post not found.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

  useEffect(() => {
    if (!postId || !sessionId || !post) return;

    const checkLikeStatus = async () => {
      const { data, error } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('session_id', sessionId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "exact one row not found"
        console.error("Error checking like status:", error);
        if (error.code === '42501') setLikeError(true);
      }
      if (data) setIsLiked(true);
    };
    checkLikeStatus();
  }, [postId, sessionId, post]);

  const handleLike = async () => {
    if (isLiked || isLiking || !sessionId || !post) return;
    
    setIsLiking(true);
    setLikeError(false);
    setIsLiked(true);
    setLikeCount(prev => prev + 1);

    const { error } = await supabase.rpc('increment_like', {
      post_id_in: post.id,
      session_id_in: sessionId
    });

    if (error) {
      setIsLiked(false);
      setLikeCount(prev => prev - 1);
      if (error.code === '42501' || error.message.includes('permission denied for function')) {
        setLikeError(true);
      } else {
        alert('Could not like post. Please try again.');
      }
      console.error(error);
    }
    setIsLiking(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Spinner className="h-12 w-12 text-primary" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 text-center px-4">
        <AlertTriangle className="text-red-500 mb-4" size={48} />
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">Error</h2>
        <p className="text-neutral-600 mb-6">{error || 'Could not load post details.'}</p>
        <Link to="/read-with-us" className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark">
          Back to All Posts
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/read-with-us" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark mb-6 group">
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" /> Back to All Posts
        </Link>

        <article>
          <header className="mb-8">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-2">
              <Tag size={16} />
              <span>{post.category}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-neutral-900 leading-tight tracking-tight">{post.title}</h1>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-6 p-4 bg-neutral-50 border border-neutral-200/80 rounded-xl">
                <div className="flex items-center gap-3 col-span-2 sm:col-span-1">
                    {post.author_image_url ? (
                        <img src={post.author_image_url} alt={post.author} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center">
                            <User size={24} className="text-neutral-500" />
                        </div>
                    )}
                    <div>
                        <p className="text-base font-bold text-neutral-800">{post.author}</p>
                        <p className="text-sm text-neutral-500">Author</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Calendar size={24} className="text-neutral-400 flex-shrink-0" />
                    <div>
                        <p className="font-semibold text-neutral-700">{new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
                        <p className="text-xs text-neutral-500">Published</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Globe size={24} className="text-neutral-400 flex-shrink-0" />
                    <div>
                        <p className="font-semibold text-neutral-700">{post.language}</p>
                        <p className="text-xs text-neutral-500">Language</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Eye size={24} className="text-neutral-400 flex-shrink-0" />
                    <div>
                        <p className="font-semibold text-neutral-700">{post.read_count}</p>
                        <p className="text-xs text-neutral-500">Reads</p>
                    </div>
                </div>
            </div>
          </header>
          
          {post.image_url && (
            <div className="aspect-video rounded-xl overflow-hidden my-8 shadow-lg border">
              <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}
          
          <div className="prose lg:prose-lg max-w-none whitespace-pre-wrap selection:bg-primary/20 selection:text-primary-dark">
            {post.content}
          </div>
        </article>

        <Comments postId={post.id} />
      </main>
      
      {likeError && (
        <div className="fixed bottom-28 right-6 sm:right-8 z-40 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg max-w-sm animate-fade-in">
          <p className="font-bold">Action Failed!</p>
          <p className="text-sm">There's a permission issue. Please follow the{' '}
            <Link to="/setup-guide" className="font-semibold underline hover:text-red-900">
              setup guide
            </Link>
            {' '}to fix it.
          </p>
        </div>
      )}

      <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 flex flex-col gap-3">
        <button
          onClick={handleLike}
          disabled={isLiked || isLiking}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 transform ${
            isLiked 
              ? 'bg-red-500 text-white cursor-not-allowed scale-110' 
              : 'bg-white text-red-500 hover:bg-red-50 hover:scale-110'
          }`}
          aria-label="Like this post"
        >
          <Heart className={`transition-transform duration-200 ${isLiked ? 'fill-current' : ''}`} />
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full px-2 py-0.5 border-2 border-white">{likeCount}</span>
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
