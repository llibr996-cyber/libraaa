import React, { useState, useEffect, useCallback } from 'react';
import { supabase, type PostComment } from '../lib/supabase';
import { Loader2, MessageSquare } from 'lucide-react';

interface CommentsProps {
  postId: string;
}

const Comments: React.FC<CommentsProps> = ({ postId }) => {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [newComment, setNewComment] = useState('');
  const [commenterName, setCommenterName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('post_comments')
      .select('*')
      .eq('post_id', postId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      setError('Could not load comments.');
    } else {
      setComments(data);
    }
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !commenterName.trim()) {
      alert('Please provide your name and a comment.');
      return;
    }
    setIsSubmitting(true);
    
    const { error } = await supabase.from('post_comments').insert({
      post_id: postId,
      commenter_name: commenterName,
      content: newComment,
    });

    if (error) {
      alert('Failed to post comment. Please try again.');
    } else {
      alert('Comment submitted for approval. Thank you!');
      setNewComment('');
      // Keep commenter name for subsequent comments
    }
    setIsSubmitting(false);
  };

  return (
    <div className="mt-12 pt-8 border-t border-gray-200">
      <h3 className="text-2xl font-bold mb-6 text-gray-800">Comments ({comments.length})</h3>
      <div className="bg-gray-50 p-6 rounded-lg mb-8 border border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h4 className="font-semibold text-lg text-gray-700">Leave a Comment</h4>
          <div>
            <label htmlFor="commenterName" className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
            <input
              id="commenterName"
              type="text"
              value={commenterName}
              onChange={e => setCommenterName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label htmlFor="newComment" className="block text-sm font-medium text-gray-700 mb-1">Your Comment</label>
            <textarea
              id="newComment"
              rows={4}
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
              placeholder="Share your thoughts..."
            />
          </div>
          <div className="text-right">
            <button type="submit" disabled={isSubmitting} className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors">
              {isSubmitting ? <Loader2 className="animate-spin inline-block" /> : 'Post Comment'}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-6">
        {loading ? <div className="flex justify-center py-8"><Loader2 className="animate-spin text-purple-500" size={32} /></div> :
         error ? <p className="text-red-500 text-center">{error}</p> :
         comments.length > 0 ? comments.map(comment => (
          <div key={comment.id} className="flex gap-4 p-4 bg-white rounded-lg border border-gray-100">
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex-shrink-0 flex items-center justify-center">
              <span className="font-bold">{comment.commenter_name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p className="font-semibold text-gray-800">{comment.commenter_name} <span className="text-sm font-normal text-gray-500 ml-2">{new Date(comment.created_at).toLocaleDateString()}</span></p>
              <p className="text-gray-700 mt-1">{comment.content}</p>
            </div>
          </div>
         )) : (
          <div className="text-center text-gray-500 py-8">
            <MessageSquare size={32} className="mx-auto mb-2 text-gray-400" />
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
         )
        }
      </div>
    </div>
  );
};

export default Comments;
