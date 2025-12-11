import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import SearchableSelect from './SearchableSelect';
import { useNotification } from '../contexts/NotificationContext';

interface IssueBookModalProps {
  onClose: () => void;
  onSave: () => void;
}

const IssueBookModal: React.FC<IssueBookModalProps> = ({ onClose, onSave }) => {
  const { addNotification } = useNotification();
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [days, setDays] = useState(14);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook || !selectedMember) {
      addNotification('Please select both a book and a member.', 'error');
      return;
    }
    setIsSubmitting(true);

    try {
      const dueDate = new Date();
      dueDate.setDate(new Date().getDate() + days);

      const { error } = await supabase.rpc('issue_book', {
        p_book_id: selectedBook.value,
        p_member_id: selectedMember.value,
        p_due_date: dueDate.toISOString(),
      });

      if (error) throw error;
      
      addNotification(`Successfully issued "${selectedBook.label}" to ${selectedMember.label}.`, 'success');
      onSave();
    } catch (error: any) {
      console.error('Error issuing book:', error);
      addNotification(`Error issuing book: ${error.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-900">Issue Book</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Select Book *</label>
            <SearchableSelect
              value={selectedBook}
              onChange={setSelectedBook}
              placeholder="Type DDC or book title..."
              tableName="books"
              labelField="title"
              searchFields={['title', 'ddc_number']}
              onlyAvailableBooks={true}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Select Member *</label>
            <SearchableSelect
              value={selectedMember}
              onChange={setSelectedMember}
              placeholder="Type register no. or member name..."
              tableName="members"
              labelField="name"
              searchFields={['name', 'register_number']}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Loan Period (Days) *</label>
            <select value={days} onChange={(e) => setDays(parseInt(e.target.value))} className="w-full px-3 py-2 border border-neutral-300 rounded-md bg-white">
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={21}>21 days</option>
              <option value={30}>30 days</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-neutral-100 rounded-md">Cancel</button>
            <button type="submit" disabled={isSubmitting || !selectedBook || !selectedMember} className="px-4 py-2 bg-primary text-white rounded-md disabled:opacity-50 flex items-center justify-center min-w-[110px]">
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Issue Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IssueBookModal;
