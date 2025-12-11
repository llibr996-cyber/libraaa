import React, { useState, useEffect, useCallback } from 'react';
import { supabase, type Book, type Category } from '../lib/supabase';
import { Loader2, Printer, AlertTriangle, BookOpen, Folder } from 'lucide-react';

interface CategoryWithCount extends Category {
  book_count: number;
}

const CompleteLibraryReport: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .rpc('get_categories_with_book_counts');
      
      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      const { data: booksData, error: booksError } = await supabase
        .from('books')
        .select('*, categories(name)')
        .order('title', { ascending: true });

      if (booksError) throw booksError;
      setBooks(booksData || []);

    } catch (err: any) {
      console.error('Error fetching library report:', err);
      setError('Failed to load library report data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePrint = () => {
    const printContent = document.getElementById('library-report-printable')?.innerHTML;
    if (!printContent) return;

    const printWindow = window.open('', '', 'height=800,width=1000');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Complete Library Report</title>');
      printWindow.document.write(`
        <style>
          body { font-family: sans-serif; padding: 2rem; }
          h1, h2 { color: #111827; }
          h1 { font-size: 24px; margin-bottom: 1rem; text-align: center; }
          h2 { font-size: 18px; margin-top: 2rem; margin-bottom: 1rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
          th { background-color: #f3f4f6; }
          .grid-container { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem; }
          .grid-item { background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 1rem; border-radius: 0.5rem; }
          .grid-item strong { font-size: 1.5rem; color: #10B981; }
        </style>
      `);
      printWindow.document.write('</head><body>');
      printWindow.document.write(printContent);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center py-10"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500"><AlertTriangle className="mx-auto mb-2" />{error}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-secondary-dark">Library Overview</h3>
        <button onClick={handlePrint} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-primary-dark">
          <Printer size={16} /> Print Report
        </button>
      </div>

      <div id="library-report-printable">
        <h1>Complete Library Report</h1>
        
        <h2>Summary</h2>
        <div className="grid-container">
          <div className="grid-item">
            <strong>{categories.length}</strong>
            <p>Total Categories</p>
          </div>
          <div className="grid-item">
            <strong>{books.length}</strong>
            <p>Total Books</p>
          </div>
        </div>

        <h2>Books by Category</h2>
        <table>
          <thead>
            <tr>
              <th>Category Name</th>
              <th>Number of Books</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat.id}>
                <td>{cat.name}</td>
                <td>{cat.book_count}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>Full Book List</h2>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>DDC</th>
              <th>Category</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {books.map(book => (
              <tr key={book.id}>
                <td>{book.title}</td>
                <td>{book.author}</td>
                <td>{book.ddc_number || 'N/A'}</td>
                <td>{book.categories?.name || 'N/A'}</td>
                <td>{book.available_copies > 0 ? `${book.available_copies} Available` : 'All Issued'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompleteLibraryReport;
