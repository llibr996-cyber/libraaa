import React, { useState, useEffect, useMemo } from 'react';
import { Search, BookOpen, Mic, MicOff } from 'lucide-react';
import { supabase, type Book, type Category } from '../lib/supabase';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import Pagination from './Pagination';
import BookDetailModal from './BookDetailModal';

const LibraryCollection: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [borrowersMap, setBorrowersMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<'none' | 'category'>('none');
  
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [categories, setCategories] = useState<Category[]>([]);

  const [voiceLang, setVoiceLang] = useState('en-US');

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const {
    isListening,
    transcript,
    isSupported: isSpeechRecognitionSupported,
    startListening
  } = useSpeechRecognition({ lang: voiceLang });

  useEffect(() => {
    if (transcript) {
      setSearchQuery(transcript);
    }
  }, [transcript]);

  const fetchBooksAndCirculation = async () => {
    setLoading(true);
    const [
      { data: booksData }, 
      { data: circulationData },
      { data: categoriesData }
    ] = await Promise.all([
      supabase.from('books').select('*, categories(name)').order('created_at', { ascending: false }),
      supabase.from('circulation').select('book_id, members(name)').eq('status', 'issued'),
      supabase.from('categories').select('id, name').order('name')
    ]);
    
    setBooks(booksData || []);
    setCategories(categoriesData || []);

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

  const filteredBooks = useMemo(() => books
    .filter(book => {
        const lowerSearch = searchQuery.toLowerCase();
        return book.title.toLowerCase().includes(lowerSearch) ||
        book.author.toLowerCase().includes(lowerSearch) ||
        book.publisher?.toLowerCase().includes(lowerSearch) ||
        book.categories?.name?.toLowerCase().includes(lowerSearch) ||
        book.ddc_number?.toLowerCase().includes(lowerSearch)
    })
    .filter(book => filterCategory === 'all' || book.category_id === filterCategory)
  , [books, searchQuery, filterCategory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory, groupBy, rowsPerPage]);

  const paginatedBooks = useMemo(() => {
    const indexOfLastBook = currentPage * rowsPerPage;
    const indexOfFirstBook = indexOfLastBook - rowsPerPage;
    return filteredBooks.slice(indexOfFirstBook, indexOfLastBook);
  }, [filteredBooks, currentPage, rowsPerPage]);

  const groupedBooks = useMemo(() => {
    if (groupBy === 'none') {
      return null;
    }
    
    return filteredBooks.reduce((acc, book) => {
      const key = book.categories?.name || 'Uncategorized';

      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(book);
      return acc;
    }, {} as Record<string, Book[]>);
  }, [filteredBooks, groupBy]);


  const BookStatus: React.FC<{ book: Book }> = ({ book }) => {
    const borrowerName = borrowersMap.get(book.id);

    if (borrowerName) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
          <span className="font-semibold text-xs text-yellow-700 truncate">Borrowed by {borrowerName}</span>
        </div>
      );
    }
    
    if (book.available_copies > 0) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
          <span className="font-semibold text-xs text-green-700">Available</span>
        </div>
      );
    }

    return (
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
          <span className="font-semibold text-xs text-red-700">All copies issued</span>
        </div>
      );
  };

  const BookCard: React.FC<{ book: Book }> = ({ book }) => (
    <div 
      className="border border-neutral-200 rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col bg-white cursor-pointer"
      onClick={() => setSelectedBook(book)}
    >
        <div className="h-48 bg-neutral-100 flex items-center justify-center rounded-t-lg">
            <BookOpen size={40} className="text-neutral-300" />
        </div>
        <div className="p-4 flex flex-col flex-grow">
            <h3 className="font-semibold text-neutral-800 text-base leading-tight truncate" title={book.title}>{book.title}</h3>
            <p className="text-sm text-neutral-500 truncate" title={book.author}>by {book.author}</p>
            {book.categories?.name && (
              <p className="text-xs text-purple-600 font-medium mt-1 truncate" title={book.categories.name}>{book.categories.name}</p>
            )}
            <div className="mt-auto pt-3">
                <BookStatus book={book} />
            </div>
        </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-neutral-900">Library Collection</h2>
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <span className="text-sm font-medium text-gray-600 px-2 hidden sm:inline">Group by:</span>
          {(['none', 'category'] as const).map(group => (
            <button 
              key={group} 
              onClick={() => setGroupBy(group)} 
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors capitalize ${groupBy === group ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              {group === 'none' ? 'All' : group}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-8">
        <div className={`relative ${isSpeechRecognitionSupported ? 'lg:col-span-7' : 'lg:col-span-8'}`}>
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
          <input
            type="text"
            placeholder={isListening ? "Listening..." : "Search collection..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-12 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition-shadow"
          />
          {isSpeechRecognitionSupported && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
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

        {isSpeechRecognitionSupported && (
          <select 
            value={voiceLang} 
            onChange={e => setVoiceLang(e.target.value)} 
            className="lg:col-span-2 w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-300"
            aria-label="Select voice typing language"
          >
            <option value="en-US">English</option>
            <option value="kn-IN">Kannada</option>
            <option value="ml-IN">Malayalam</option>
            <option value="ar-SA">Arabic</option>
          </select>
        )}

        <select 
          value={filterCategory} 
          onChange={e => setFilterCategory(e.target.value)} 
          className={`w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-300 ${isSpeechRecognitionSupported ? 'lg:col-span-3' : 'lg:col-span-4'}`}
        >
          <option value="all">All Categories</option>
          {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <label htmlFor="rows-per-page" className="text-sm text-neutral-600">Rows per page:</label>
        <select 
          id="rows-per-page"
          value={rowsPerPage}
          onChange={e => setRowsPerPage(Number(e.target.value))}
          className="px-2 py-1 border border-neutral-300 rounded-md bg-white text-sm focus:ring-1 focus:ring-purple-400"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-neutral-500">Loading books...</div>
      ) : filteredBooks.length > 0 ? (
          <>
            {groupBy === 'none' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                    {paginatedBooks.map(book => <BookCard key={book.id} book={book} />)}
                </div>
            ) : (
                <div className="space-y-8">
                {Object.entries(groupedBooks!).sort(([a], [b]) => a.localeCompare(b)).map(([groupName, booksInGroup]) => (
                    <div key={groupName}>
                        <h3 className="px-1 py-3 font-bold text-purple-800 text-lg border-b-2 border-purple-100 mb-4">
                            {groupName} <span className="text-base font-medium text-neutral-500">({booksInGroup.length})</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                            {booksInGroup.map(book => <BookCard key={book.id} book={book} />)}
                        </div>
                    </div>
                ))}
                </div>
            )}
            { groupBy === 'none' && <Pagination 
                currentPage={currentPage}
                totalCount={filteredBooks.length}
                pageSize={rowsPerPage}
                onPageChange={page => setCurrentPage(page)}
            /> }
          </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16">
          <BookOpen size={48} className="text-neutral-300 mb-4" />
          <p className="text-neutral-500 text-lg">
            {searchQuery || filterCategory !== 'all' ? 'No books match your criteria.' : 'No books available in the library.'}
          </p>
        </div>
      )}
      <BookDetailModal book={selectedBook} onClose={() => setSelectedBook(null)} />
    </div>
  );
};

export default LibraryCollection;
