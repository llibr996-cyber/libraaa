import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit, Check, Loader2 } from 'lucide-react';
import { supabase, type Category } from '../lib/supabase';
import { useNotification } from '../contexts/NotificationContext';
import ConfirmationModal from './ConfirmationModal';

interface CategoryManagerProps {
  onClose: () => void;
  onSave: () => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ onClose, onSave }) => {
  const { addNotification } = useNotification();
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editedName, setEditedName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmCallback, setConfirmCallback] = useState<() => void>(() => {});

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (error) {
      setError('Failed to load categories.');
      console.error(error);
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const { error: rpcError } = await supabase.rpc('add_category', { p_name: newCategory.trim() });
    
    if (rpcError) {
      addNotification(`Error adding category: ${rpcError.message}`, 'error');
    } else {
      setNewCategory('');
      await fetchCategories();
      onSave();
      addNotification('Category added.', 'success');
    }
    setIsSubmitting(false);
  };

  const confirmDelete = (id: string) => {
    setConfirmCallback(() => () => handleDeleteCategory(id));
    setIsConfirmOpen(true);
  };

  const handleDeleteCategory = async (id: string) => {
    const { error: rpcError } = await supabase.rpc('delete_category', { p_id: id });
    
    if (rpcError) {
      addNotification(`Error deleting category: ${rpcError.message}. It might be in use.`, 'error');
    } else {
      await fetchCategories();
      onSave();
      addNotification('Category deleted.', 'success');
    }
    setIsConfirmOpen(false);
  };

  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
    setEditedName(category.name);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditedName('');
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editedName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const { error } = await supabase
      .from('categories')
      .update({ name: editedName.trim() })
      .eq('id', editingCategory.id);

    if (error) {
      addNotification(`Error updating category: ${error.message}`, 'error');
    } else {
      handleCancelEdit();
      await fetchCategories();
      onSave();
      addNotification('Category updated.', 'success');
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <ConfirmationModal
        isOpen={isConfirmOpen}
        title="Delete Category?"
        message="Are you sure? This might affect existing books."
        onConfirm={confirmCallback}
        onCancel={() => setIsConfirmOpen(false)}
        confirmText="Delete"
      />
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-xl font-semibold">Manage Categories</h2>
            <button onClick={onClose}><X /></button>
          </div>
          <div className="p-6 space-y-4">
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="New category name"
                className="flex-grow px-3 py-2 border rounded-md"
              />
              <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary text-white rounded-md flex items-center gap-2 disabled:opacity-50">
                {isSubmitting && !editingCategory ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} Add
              </button>
            </form>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="max-h-64 overflow-y-auto space-y-2">
              {loading ? <p>Loading...</p> : categories.map(cat => (
                <div key={cat.id} className="flex justify-between items-center p-2 bg-neutral-50 rounded-md">
                  {editingCategory?.id === cat.id ? (
                    <div className="flex-grow flex items-center gap-2">
                      <input 
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="flex-grow px-2 py-1 border border-primary-light rounded-md"
                        autoFocus
                      />
                      <button onClick={handleUpdateCategory} disabled={isSubmitting} className="text-green-500 hover:text-green-700 disabled:opacity-50">
                        {isSubmitting && editingCategory?.id === cat.id ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                      </button>
                      <button onClick={handleCancelEdit} className="text-red-500 hover:text-red-700"><X size={20} /></button>
                    </div>
                  ) : (
                    <>
                      <span>{cat.name}</span>
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleEditClick(cat)} className="text-neutral-400 hover:text-primary"><Edit size={16} /></button>
                        <button onClick={() => confirmDelete(cat.id)} className="text-neutral-400 hover:text-red-500">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CategoryManager;
