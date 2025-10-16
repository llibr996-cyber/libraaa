import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Mic, MicOff, Globe } from 'lucide-react';
import { supabase, type Book } from '../lib/supabase';
import useSpeechRecognition from '../hooks/useSpeechRecognition';

const LibraryCollection: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [borrowersMap, setBorrowersMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [speechLang, setSpeechLang] = useState('en-US');

  const {
    isListening,
    transcript,
    isSupported: isSpeechRecognitionSupported,
    startListening
  } = useSpeechRecognition({ lang: speechLang });

  useEffect(() => {
    if (transcript) {
      setSearchQuery(transcript);
    }
  }, [transcript]);

  const fetchBooksAndCirculation = async () => {
    setLoading(true);
    const [{ data: booksData }, { data: circulationData }] = await Promise.all([
      supabase.from('books').select('*, categories(name)').order('title'),
      supabase.from('circulation').select('book_id, members(name)').eq('status', 'issued')
    ]);
    
    setBooks(booksData || []);

    if (circulationData) {
      const newBorrowersMap = new Map<string, string>();
      circulationData.forEach((circ: any) => {
        if (circ.book_id && circ.members?.name) {
          newBorrowersMap.set(circ.book_id, circ.members.name);
        }
      });
      setBorrowersMap(newBorrowersMap);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchBooksAndCirculation();

    const channel = supabase.channel('public-db-changes-collection')
      .on('postgres_changes', { event: '*', schema: 'public' }, fetchBooksAndCirculation)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.ddc_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const BookStatus: React.FC<{ book: Book }> = ({ book }) => {
    const borrowerName = borrowersMap.get(book.id);

    if (borrowerName) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
          <span className="font-semibold text-sm text-yellow-700">Borrowed by {borrowerName}</span>
        </div>
      );
    }
    
    if (book.available_copies > 0) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
          <span className="font-semibold text-sm text-green-700">Available</span>
        </div>
      );
    }

    return (
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
          <span className="font-semibold text-sm text-red-700">All copies issued</span>
        </div>
      );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-neutral-900">Library Collection</h2>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
        <input
          type="text"
          placeholder={isListening ? "Listening..." : "Search by title, author, or DDC..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-28 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition-shadow"
        />
        {isSpeechRecognitionSupported && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            <div className="relative group">
              <Globe size={20} className="text-neutral-500 cursor-pointer"/>
              <select 
                value={speechLang}
                onChange={e => setSpeechLang(e.target.value)}
                className="absolute right-0 top-0 opacity-0 cursor-pointer h-full w-full"
                title="Select voice search language"
              >
                <option value="en-US">English</option>
                <option value="kn-IN">Kannada</option>
                <option value="ml-IN">Malayalam</option>
              </select>
            </div>
            <button 
              onClick={startListening}
              className={`p-1.5 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-neutral-500 hover:bg-neutral-100'}`}
              title="Search with voice"
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-neutral-500">Loading books...</div>
      ) : filteredBooks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-neutral-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Sl. No.</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Title</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Author</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Category</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">DDC</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredBooks.map((book, index) => (
                  <tr key={book.id} className="hover:bg-neutral-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">{book.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{book.author}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                        {book.categories?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{book.ddc_number || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm"><BookStatus book={book} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16">
          <BookOpen size={48} className="text-neutral-300 mb-4" />
          <p className="text-neutral-500 text-lg">
            {searchQuery ? 'No books match your search.' : 'No books available in the library.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default LibraryCollection;
