import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, type Book } from '../lib/supabase';
import { Loader2, ArrowLeft, BookOpen, User, Tag, Hash, Calendar, DollarSign, Package, Globe, Info, AlertTriangle } from 'lucide-react';
import Header from './Header';

const DetailItem: React.FC<{ icon: React.ElementType; label: string; value?: string | number | null }> = ({ icon: Icon, label, value }) => {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-4">
      <div className="bg-neutral-100 p-3 rounded-full mt-1">
        <Icon size={18} className="text-neutral-600" />
      </div>
      <div>
        <p className="text-sm text-neutral-500">{label}</p>
        <p className="font-semibold text-neutral-800 text-lg">{value}</p>
      </div>
    </div>
  );
};


const BookDetailPage: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBook = async () => {
      if (!bookId) {
        setError('No book ID provided.');
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from('books')
        .select('*, categories(name)')
        .eq('id', bookId)
        .single();

      if (error) {
        setError('Book not found.');
        console.error(error);
      } else {
        setBook(data);
      }
      setLoading(false);
    };
    fetchBook();
  }, [bookId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 text-center px-4">
        <AlertTriangle className="text-red-500 mb-4" size={48} />
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">Error</h2>
        <p className="text-neutral-600 mb-6">{error || 'Could not load book details.'}</p>
        <Link to="/home" className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark">
          Back to Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Link to="/home" className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark mb-6">
          <ArrowLeft size={16} /> Back to Collection
        </Link>

        <div className="bg-white rounded-xl shadow-md border border-neutral-200 overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-1/3 flex-shrink-0">
                <div className="aspect-[3/4] bg-neutral-100 rounded-lg flex items-center justify-center">
                  <BookOpen size={80} className="text-neutral-300" />
                </div>
              </div>
              <div className="w-full md:w-2/3">
                <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 leading-tight">{book.title}</h1>
                <p className="text-xl font-medium text-neutral-500 mt-1">by {book.author}</p>
                
                <div className="mt-6 pt-6 border-t border-neutral-200 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
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
        </div>
      </main>
    </div>
  );
};

export default BookDetailPage;
