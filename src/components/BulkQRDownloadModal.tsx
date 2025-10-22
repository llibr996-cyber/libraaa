import React, { useState, useEffect } from 'react';
import { X, Loader2, Search, Printer } from 'lucide-react';
import { supabase, type Book } from '../lib/supabase';
import { QRCodeCanvas } from 'qrcode.react';

interface BulkQRDownloadModalProps {
  onClose: () => void;
}

const BulkQRDownloadModal: React.FC<BulkQRDownloadModalProps> = ({ onClose }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printPages, setPrintPages] = useState<Book[][]>([]);

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('books')
        .select('id, title, ddc_number')
        .order('created_at', { ascending: false })
        .limit(10000);
      
      if (data) setBooks(data);
      setLoading(false);
    };
    fetchBooks();
  }, []);

  const handleToggleSelect = (bookId: string) => {
    const newSelection = new Set(selectedBooks);
    if (newSelection.has(bookId)) {
      newSelection.delete(bookId);
    } else {
      newSelection.add(bookId);
    }
    setSelectedBooks(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedBooks.size === filteredBooks.length) {
      setSelectedBooks(new Set());
    } else {
      const allBookIds = new Set(filteredBooks.map(b => b.id));
      setSelectedBooks(allBookIds);
    }
  };

  const handleGeneratePrint = () => {
    if (selectedBooks.size === 0) {
      alert('Please select at least one book to print QR codes.');
      return;
    }
    setIsPrinting(true);

    const booksToPrint = books.filter(b => selectedBooks.has(b.id));
    const pages: Book[][] = [];
    const chunkSize = 25; // 5x5 grid

    for (let i = 0; i < booksToPrint.length; i += chunkSize) {
      pages.push(booksToPrint.slice(i, i + chunkSize));
    }
    
    setPrintPages(pages);

    setTimeout(() => {
      window.print();
      setIsPrinting(false);
      setPrintPages([]);
    }, 500); // Wait for state to update and render
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.ddc_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 print:hidden">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-xl font-semibold">Bulk Download QR Codes</h2>
            <button onClick={onClose}><X /></button>
          </div>

          <div className="p-6 space-y-4 flex-grow overflow-y-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search books by title or DDC..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>

            <div className="flex justify-between items-center">
              <button onClick={handleSelectAll} className="text-sm font-medium text-purple-600">
                {selectedBooks.size === filteredBooks.length ? 'Deselect All' : 'Select All'} ({selectedBooks.size} selected)
              </button>
            </div>

            <div className="border rounded-lg max-h-80 overflow-y-auto">
              {loading ? <div className="p-4 text-center">Loading books...</div> :
                filteredBooks.map(book => (
                  <div key={book.id} className="flex items-center gap-3 p-3 border-b last:border-b-0">
                    <input
                      type="checkbox"
                      checked={selectedBooks.has(book.id)}
                      onChange={() => handleToggleSelect(book.id)}
                      className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <p className="font-medium">{book.title}</p>
                      <p className="text-sm text-gray-500">DDC: {book.ddc_number || 'N/A'}</p>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          <div className="p-6 border-t flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-md">Cancel</button>
            <button onClick={handleGeneratePrint} disabled={isPrinting || selectedBooks.size === 0} className="px-4 py-2 bg-purple-600 text-white rounded-md flex items-center gap-2 disabled:opacity-50">
              {isPrinting ? <Loader2 className="animate-spin" /> : <Printer size={18} />}
              Generate & Print
            </button>
          </div>
        </div>
      </div>
      
      {isPrinting && (
        <div id="qr-print-area">
          {printPages.map((page, pageIndex) => (
            <div key={pageIndex} className="a4-page">
              {page.map(book => (
                <div key={book.id} className="qr-item">
                  <QRCodeCanvas value={`${window.location.origin}/book/${book.id}`} size={128} />
                  <p className="qr-item-title">{book.title}</p>
                  <p className="qr-item-ddc">{book.ddc_number || 'N/A'}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default BulkQRDownloadModal;
