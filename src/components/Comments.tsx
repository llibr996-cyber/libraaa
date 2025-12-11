import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase, type PostComment } from '../lib/supabase';
import { Loader2, MessageSquare, Send } from 'lucide-react';

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
  const [submissionStatus, setSubmissionStatus] = useState<{type: 'error' | 'success', message: string} | null>(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('post_comments')
      .select('*')
      .eq('post_id', postId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      setError('Could not load comments. This might be a permissions issue.');
      console.error(error);
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
      setSubmissionStatus({ type: 'error', message: 'Please provide your name and a comment.' });
      return;
    }
    setIsSubmitting(true);
    setSubmissionStatus(null);
    
    const { error } = await supabase.from('post_comments').insert({
      post_id: postId,
      commenter_name: commenterName,
      content: newComment,
      is_approved: false,
    });

    if (error) {
      let message = 'Failed to post comment. Please try again.';
      if (error.code === '42501') { // RLS violation code
        message = 'Permissions error. Please follow the setup guide to enable comments.';
      }
      setSubmissionStatus({ type: 'error', message });
      console.error("Comment submission error:", error);
    } else {
      setSubmissionStatus({ type: 'success', message: 'Comment submitted for approval. Thank you!' });
      setNewComment('');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="mt-16 pt-12 border-t border-neutral-200">
      <h3 className="text-3xl font-bold mb-8 text-neutral-800">Join the Conversation ({comments.length})</h3>
      <div className="bg-neutral-50 p-6 rounded-xl mb-10 border border-neutral-200/80">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h4 className="font-semibold text-lg text-neutral-700">Leave a Comment</h4>
          
          {submissionStatus && (
            <div className={`px-4 py-3 rounded-lg text-sm ${submissionStatus.type === 'success' ? 'bg-green-100 border border-green-400 text-green-800' : 'bg-red-100 border border-red-400 text-red-700'}`}>
              {submissionStatus.message}{' '}
              {submissionStatus.message.includes('setup guide') && (
                <Link to="/setup-guide" className="font-bold underline hover:text-red-900">
                  View Guide
                </Link>
              )}
            </div>
          )}

          <div>
            <label htmlFor="commenterName" className="block text-sm font-medium text-neutral-700 mb-1">Your Name *</label>
            <input
              id="commenterName"
              type="text"
              value={commenterName}
              onChange={e => setCommenterName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-primary-light focus:border-primary-light"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label htmlFor="newComment" className="block text-sm font-medium text-neutral-700 mb-1">Your Comment *</label>
            <textarea
              id="newComment"
              rows={4}
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              required
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-primary-light focus:border-primary-light"
              placeholder="Share your thoughts..."
            />
          </div>
          <div className="text-right">
            <button type="submit" disabled={isSubmitting} className="bg-primary text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50 transition-colors flex items-center gap-2 ml-auto">
              {isSubmitting ? <Loader2 className="animate-spin" /> : <Send size={16} />}
              Post Comment
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-6">
        {loading ? <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" size={32} /></div> :
         error ? <p className="text-red-500 text-center">{error} <Link to="/setup-guide" className="font-bold underline hover:text-red-900">View Setup Guide</Link></p> :
         comments.length > 0 ? comments.map(comment => (
          <div key={comment.id} className="flex gap-4">
            <div className="w-11 h-11 bg-primary/10 text-primary rounded-full flex-shrink-0 flex items-center justify-center mt-1">
              <span className="font-bold text-lg">{comment.commenter_name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-grow bg-neutral-50 rounded-xl p-4 border border-neutral-200/60">
              <div className="flex items-baseline gap-3">
                <p className="font-semibold text-neutral-800">{comment.commenter_name}</p>
                <p className="text-xs text-neutral-500">{new Date(comment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
              <p className="text-neutral-700 mt-1">{comment.content}</p>
            </div>
          </div>
         )) : (
          <div className="text-center text-neutral-500 py-12 bg-neutral-50 rounded-xl border border-dashed">
            <MessageSquare size={32} className="mx-auto mb-2 text-neutral-400" />
            <p className="font-medium">No comments yet.</p>
            <p className="text-sm">Be the first to share your thoughts!</p>
          </div>
         )
        }
      </div>
    </div>
  );
};

export default Comments;
