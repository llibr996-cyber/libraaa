import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase, type ReadWithUs, type Language } from '../lib/supabase';

interface AddEditPostModalProps {
  post?: ReadWithUs | null;
  onClose: () => void;
  onSave: () => void;
}

const postCategories: ReadWithUs['category'][] = ['Article', 'Book Review', 'Poem', 'Story'];
const languages: Language[] = ['English', 'Kannada', 'Malayalam', 'Arabic', 'Urdu'];

const AddEditPostModal: React.FC<AddEditPostModalProps> = ({ post, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: 'Article' as ReadWithUs['category'],
    content: '',
    image_url: '',
    language: 'English' as Language,
    author_image_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title,
        author: post.author,
        category: post.category,
        content: post.content,
        image_url: post.image_url || '',
        language: post.language || 'English',
        author_image_url: post.author_image_url || '',
      });
    } else {
      setFormData({ title: '', author: '', category: 'Article', content: '', image_url: '', language: 'English', author_image_url: '' });
    }
  }, [post]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to perform this action.");

      const postData = { 
        ...formData, 
        user_id: user.id,
        image_url: formData.image_url || null,
        author_image_url: formData.author_image_url || null,
      };

      let response;
      if (post) {
        response = await supabase.from('read_with_us').update(postData).eq('id', post.id);
      } else {
        response = await supabase.from('read_with_us').insert(postData);
      }

      if (response.error) throw response.error;
      
      onSave();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };
  
  const isReview = formData.category === 'Book Review';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-neutral-200">
          <h2 className="text-xl font-bold text-neutral-800">{post ? 'Edit Post' : 'Add New Post'}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-6">
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
          
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-neutral-700 mb-1">Title *</label>
            <input id="title" type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-primary-light focus:border-primary-light" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="author" className="block text-sm font-medium text-neutral-700 mb-1">Author *</label>
              <input id="author" type="text" required value={formData.author} onChange={(e) => setFormData({ ...formData, author: e.target.value })} className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-primary-light focus:border-primary-light" />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-neutral-700 mb-1">Category *</label>
              <select id="category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value as ReadWithUs['category'] })} className="w-full px-3 py-2 border border-neutral-300 rounded-md bg-white focus:ring-primary-light focus:border-primary-light">
                {postCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-neutral-700 mb-1">Language *</label>
              <select id="language" value={formData.language} onChange={(e) => setFormData({ ...formData, language: e.target.value as Language })} className="w-full px-3 py-2 border border-neutral-300 rounded-md bg-white focus:ring-primary-light focus:border-primary-light">
                {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="author_image_url" className="block text-sm font-medium text-neutral-700 mb-1">Author Image URL (Optional)</label>
              <input id="author_image_url" type="url" value={formData.author_image_url} onChange={(e) => setFormData({ ...formData, author_image_url: e.target.value })} className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-primary-light focus:border-primary-light" placeholder="https://example.com/author.png" />
            </div>
          </div>

          <div>
            <label htmlFor="image_url" className="block text-sm font-medium text-neutral-700 mb-1">
              Post Image URL {isReview ? '*' : '(Optional)'}
            </label>
            <input 
              id="image_url" 
              type="url" 
              required={isReview} 
              value={formData.image_url} 
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} 
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-primary-light focus:border-primary-light" 
              placeholder="https://example.com/image.png"
            />
            {isReview && <p className="text-xs text-neutral-500 mt-1">An image is required for book reviews.</p>}
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-neutral-700 mb-1">Content *</label>
            <textarea id="content" required rows={8} value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-primary-light focus:border-primary-light" />
          </div>
        </form>

        <div className="p-4 border-t border-neutral-200 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2 bg-neutral-100 text-neutral-700 font-semibold rounded-lg hover:bg-neutral-200 transition-colors">
            Cancel
          </button>
          <button type="submit" onClick={handleSubmit} disabled={loading} className="px-5 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark disabled:opacity-50 flex items-center justify-center min-w-[120px]">
            {loading ? <Loader2 className="animate-spin" /> : 'Save Post'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddEditPostModal;
