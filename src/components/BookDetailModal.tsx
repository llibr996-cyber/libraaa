import React from 'react';
import { X, BookOpen, User, Tag, Hash, Calendar, DollarSign, Package, Globe, Info } from 'lucide-react';
import { type Book } from '../lib/supabase';

interface BookDetailModalProps {
  book: Book | null;
  onClose: () => void;
}

const DetailItem: React.FC<{ icon: React.ElementType; label: string; value?: string | number | null }> = ({ icon: Icon, label, value }) => {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="bg-gray-100 p-2 rounded-full mt-1">
        <Icon size={16} className="text-gray-600" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-medium text-gray-800">{value}</p>
      </div>
    </div>
  );
};

const BookDetailModal: React.FC<BookDetailModalProps> = ({ book, onClose }) => {
  if (!book) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 truncate pr-4">{book.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3 flex-shrink-0">
              <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center">
                <BookOpen size={60} className="text-gray-300" />
              </div>
            </div>
            <div className="w-full md:w-2/3 space-y-4">
              <p className="text-lg font-semibold text-gray-600">by {book.author}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5 pt-2">
                <DetailItem icon={Tag} label="Category" value={book.categories?.name} />
                <DetailItem icon={Hash} label="DDC Number" value={book.ddc_number} />
                <DetailItem icon={User} label="Publisher" value={book.publisher} />
                <DetailItem icon={Calendar} label="Published Year" value={book.publication_year} />
                <DetailItem icon={DollarSign} label="Price" value={book.price ? `₹${book.price.toFixed(2)}` : null} />
                <DetailItem icon={Globe} label="Language" value={book.language} />
                <DetailItem icon={Package} label="Copies" value={`${book.available_copies} available / ${book.total_copies} total`} />
                <DetailItem icon={Info} label="ISBN" value={book.isbn} />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookDetailModal;
