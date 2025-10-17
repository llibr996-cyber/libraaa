import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Bell, LogOut, Search, Plus, Star, Folder, BookOpen, QrCode, Printer, Users, Download, Loader2, DollarSign, Edit, Trash2 } from 'lucide-react';
import { supabase, type Book, type Circulation, type Member, type Feedback, type Category } from '../lib/supabase';
import MemberModal from './MemberModal';
import IssueBookModal from './IssueBookModal';
import AddBookForm from './AddBookForm';
import ManageCategoriesForm from './ManageCategoriesForm';
import ScanQRModal from './ScanQRModal';
import BookQRCodeModal from './BookQRCodeModal';
import BulkQRDownloadModal from './BulkQRDownloadModal';
import FinesPage from './FinesPage';
import BookModal from './BookModal';
import Pagination from './Pagination';

type TabType = 'Circulation' | 'Library' | 'Members' | 'Fines' | 'Feedback' | 'History';
type BookStatusFilter = 'Available' | 'Issued' | 'Overdue';
type ColumnKey = 'title' | 'author' | 'publisher' | 'category' | 'ddc' | 'price' | 'copies';


const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('Circulation');
  const [activeFilter, setActiveFilter] = useState<BookStatusFilter>('Available');
  const [circulationSearch, setCirculationSearch] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [circulation, setCirculation] = useState<Circulation[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ available: 0, issued: 0, overdue: 0 });

  // Modal states
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showBookQRModal, setShowBookQRModal] = useState(false);
  const [selectedBookForQR, setSelectedBookForQR] = useState<Book | null>(null);
  const [showBulkQRModal, setShowBulkQRModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  // Filter states
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'issued' | 'returned' | 'overdue'>('all');
  const [memberSearch, setMemberSearch] = useState('');

  // Book Collection Pagination
  const [bookCurrentPage, setBookCurrentPage] = useState(1);
  const [bookRowsPerPage, setBookRowsPerPage] = useState(10);

  // Print selection state
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>({
    title: true, author: true, publisher: true, category: true, ddc: true, price: true, copies: true
  });

  const tabs: TabType[] = ['Circulation', 'Library', 'Members', 'Fines', 'Feedback', 'History'];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: booksData },
        { data: membersData },
        { data: circulationData },
        { data: feedbackData },
        { data: categoriesData },
      ] = await Promise.all([
        supabase.from('books').select('*, categories(name)').order('created_at', { ascending: false }),
        supabase.from('members').select('*').order('name'),
        supabase.from('circulation').select('*, books(*), members(*)').order('updated_at', { ascending: false }),
        supabase.from('feedback').select('*, members(name), books(title)').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name'),
      ]);

      setBooks(booksData || []);
      setMembers(membersData || []);
      setCirculation(circulationData || []);
      setFeedback(feedbackData || []);
      setCategories(categoriesData || []);

      const availableCount = booksData?.reduce((sum, book) => sum + book.available_copies, 0) || 0;
      const issuedCount = circulationData?.filter(c => c.status === 'issued').length || 0;
      const overdueCount = circulationData?.filter(c => c.status === 'issued' && new Date(c.due_date) < new Date()).length || 0;

      setCounts({ available: availableCount, issued: issuedCount, overdue: overdueCount });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  useEffect(() => {
    setBookCurrentPage(1);
  }, [bookSearch, bookRowsPerPage]);

  const handlePrint = (title: string, tableId: string) => {
    const table = document.getElementById(tableId);
    if (!table) return;

    const printWindow = window.open('', '', 'height=800,width=1000');
    if (!printWindow) {
      alert('Could not open print window. Please disable your pop-up blocker.');
      return;
    }

    // Clone the table to avoid modifying the original
    const tableClone = table.cloneNode(true) as HTMLElement;

    // Remove non-visible columns from the clone for book collection
    if (tableId === 'book-collection-table') {
        Object.entries(visibleColumns).forEach(([key, value]) => {
          if (!value) {
            tableClone.querySelectorAll(`.col-${key}`).forEach(el => {
              (el as HTMLElement).style.display = 'none';
            });
          }
        });
    }
    
    // Remove action columns from clone
    tableClone.querySelectorAll('.no-print-in-popup').forEach(el => {
      (el as HTMLElement).style.display = 'none';
    });

    printWindow.document.write(`<html><head><title>${title}</title>`);
    printWindow.document.write(`
        <style>
            body { padding: 2rem; font-family: sans-serif; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            h1 { font-size: 24px; margin-bottom: 1rem; }
        </style>
    `);
    printWindow.document.write('</head><body>');
    printWindow.document.write(`<h1>${title}</h1>`);
    printWindow.document.write(tableClone.outerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();

    setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    }, 250);
  };

  const handleDeleteMember = async (memberId: string) => {
    if (window.confirm('Are you sure? This will delete the member and all associated records.')) {
      await supabase.from('members').delete().eq('id', memberId);
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (window.confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
        const { error } = await supabase.from('books').delete().eq('id', bookId);
        if (error) {
            alert('Error deleting book: ' + error.message);
        }
    }
  };
  
  const handleShowQR = (book: Book) => {
    setSelectedBookForQR(book);
    setShowBookQRModal(true);
  };

  const handleReturnBook = async (circulationId: string) => {
    const { error } = await supabase.rpc('return_book', { p_circulation_id: circulationId });
    if (error) alert('Error returning book.');
  };
  
  const updateFeedbackStatus = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase.from('feedback').update({ status }).eq('id', id);
    if (error) alert('Failed to update feedback status.');
  };

  const getCirculationData = () => {
    let data: (Book | Circulation)[] = [];
    switch (activeFilter) {
      case 'Available': data = books.filter(b => b.available_copies > 0); break;
      case 'Issued': data = circulation.filter(c => c.status === 'issued'); break;
      case 'Overdue': data = circulation.filter(c => c.status === 'issued' && new Date(c.due_date) < new Date()); break;
    }
    if (!circulationSearch) return data;
    const lowerSearch = circulationSearch.toLowerCase();
    return data.filter(item => {
      if ('title' in item) {
        return item.title.toLowerCase().includes(lowerSearch) || item.author.toLowerCase().includes(lowerSearch);
      }
      if ('book_id' in item) {
        return item.books?.title.toLowerCase().includes(lowerSearch) || item.members?.name.toLowerCase().includes(lowerSearch);
      }
      return false;
    });
  };

  const circulationData = getCirculationData();

  const filteredBooks = books.filter(book => {
    const lowerSearch = bookSearch.toLowerCase();
    return book.title.toLowerCase().includes(lowerSearch) ||
    book.author.toLowerCase().includes(lowerSearch) ||
    book.categories?.name?.toLowerCase().includes(lowerSearch) ||
    book.ddc_number?.toLowerCase().includes(lowerSearch)
  });

  const paginatedBooks = useMemo(() => {
    const startIndex = (bookCurrentPage - 1) * bookRowsPerPage;
    return filteredBooks.slice(startIndex, startIndex + bookRowsPerPage);
  }, [filteredBooks, bookCurrentPage, bookRowsPerPage]);

  const filteredHistory = circulation
    .filter(item => {
        if (historyStatusFilter === 'all') return true;
        if (historyStatusFilter === 'overdue') {
            return item.status === 'issued' && new Date(item.due_date) < new Date();
        }
        return item.status === historyStatusFilter;
    })
    .filter(item => {
        if (!historySearch) return true;
        const lowerSearch = historySearch.toLowerCase();
        return (
            item.books?.title.toLowerCase().includes(lowerSearch) ||
            item.members?.name.toLowerCase().includes(lowerSearch) ||
            item.members?.class?.toLowerCase().includes(lowerSearch)
        );
    });

  const filteredMembers = members
    .filter(member => {
      if (!memberSearch) return true;
      const lowerSearch = memberSearch.toLowerCase();
      return (
        member.name.toLowerCase().includes(lowerSearch) ||
        member.email.toLowerCase().includes(lowerSearch) ||
        member.register_number?.toLowerCase().includes(lowerSearch) ||
        member.class?.toLowerCase().includes(lowerSearch)
      );
    });

  const renderCirculationItem = (item: Book | Circulation) => {
    if (activeFilter === 'Available') {
      const book = item as Book;
      return (
        <div key={book.id} className="border rounded-lg p-4">
          <div>
            <h3 className="font-semibold">{book.title}</h3>
            <p>by {book.author}</p>
            <p>Available: {book.available_copies}</p>
          </div>
        </div>
      );
    }
    
    const circ = item as Circulation;
    return (
      <div key={circ.id} className="border rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold">{circ.books?.title}</h3>
            <p>by {circ.members?.name}</p>
            <p>Due: {new Date(circ.due_date).toLocaleDateString()}</p>
          </div>
          <button onClick={() => handleReturnBook(circ.id)} className="bg-green-600 text-white px-3 py-1 rounded text-sm">
            Return
          </button>
        </div>
      </div>
    );
  };
  
  const toggleColumn = (col: ColumnKey) => {
    setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <button className="text-gray-600 hover:text-gray-900"><BarChart3 size={20} /></button>
              <button className="text-gray-600 hover:text-gray-900"><Bell size={20} /></button>
              <button onClick={handleLogout} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <LogOut size={20} /> <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4 sm:space-x-8 overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`py-4 px-1 sm:px-2 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === tab ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'Circulation' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <h2 className="text-2xl font-bold">Borrow & Return Books</h2>
              <div className="flex gap-2">
                <button onClick={() => setShowScanModal(true)} className="bg-white border border-purple-600 text-purple-600 hover:bg-purple-50 px-4 py-2 rounded-lg flex items-center gap-2">
                  <QrCode size={20} /> Scan QR
                </button>
                <button onClick={() => setShowIssueModal(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                  <Plus size={20} /> Issue Book
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['Available', 'Issued', 'Overdue'] as BookStatusFilter[]).map(filter => (
                <button key={filter} onClick={() => setActiveFilter(filter)} className={`px-4 py-2 rounded-lg font-medium ${activeFilter === filter ? 'bg-purple-600 text-white' : 'bg-gray-100'}`}>
                  {filter} ({counts[filter.toLowerCase() as keyof typeof counts]})
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input type="text" placeholder="Search books, members..." value={circulationSearch} onChange={(e) => setCirculationSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg"/>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6 min-h-[400px]">
              {loading ? <p>Loading...</p> : (
                <div className="space-y-4">
                  {circulationData.map(renderCirculationItem)}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'Library' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
              <AddBookForm categories={categories} onSave={fetchData} />
              <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <BookOpen size={22} /> Book Collection
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setShowBulkQRModal(true)} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
                      <Download size={16} />
                      Bulk Download QRs
                    </button>
                    <button onClick={() => handlePrint('Book Collection', 'book-collection-table')} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
                      <Printer size={16} /> Print List
                    </button>
                  </div>
                </div>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input type="text" placeholder="Search by title, author, category, DDC..." value={bookSearch} onChange={(e) => setBookSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"/>
                </div>
                <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                        <label htmlFor="book-rows-per-page" className="text-sm text-gray-600">Rows per page:</label>
                        <select 
                            id="book-rows-per-page"
                            value={bookRowsPerPage}
                            onChange={e => setBookRowsPerPage(Number(e.target.value))}
                            className="px-2 py-1 border border-gray-300 rounded-md bg-white text-sm focus:ring-1 focus:ring-purple-400"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                        <p className="text-sm font-medium mb-2">Toggle columns for printing:</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                            {Object.keys(visibleColumns).map(key => (
                                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input type="checkbox" checked={visibleColumns[key as ColumnKey]} onChange={() => toggleColumn(key as ColumnKey)} className="rounded text-purple-600 focus:ring-purple-500" />
                                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                  <table id="book-collection-table" className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase col-title ${!visibleColumns.title && 'hidden'}`}>Title</th>
                        <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase col-author ${!visibleColumns.author && 'hidden'}`}>Author</th>
                        <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase col-publisher ${!visibleColumns.publisher && 'hidden'}`}>Publisher</th>
                        <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase col-category ${!visibleColumns.category && 'hidden'}`}>Category</th>
                        <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase col-ddc ${!visibleColumns.ddc && 'hidden'}`}>DDC</th>
                        <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase col-price ${!visibleColumns.price && 'hidden'}`}>Price</th>
                        <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase col-copies ${!visibleColumns.copies && 'hidden'}`}>Copies</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase no-print-in-popup">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedBooks.map((book) => (
                        <tr key={book.id}>
                          <td className={`px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 col-title ${!visibleColumns.title && 'hidden'}`}>{book.title}</td>
                          <td className={`px-4 py-4 whitespace-nowrap text-sm text-gray-500 col-author ${!visibleColumns.author && 'hidden'}`}>{book.author}</td>
                          <td className={`px-4 py-4 whitespace-nowrap text-sm text-gray-500 col-publisher ${!visibleColumns.publisher && 'hidden'}`}>{book.publisher || 'N/A'}</td>
                          <td className={`px-4 py-4 whitespace-nowrap text-sm text-gray-500 col-category ${!visibleColumns.category && 'hidden'}`}>{book.categories?.name || 'N/A'}</td>
                          <td className={`px-4 py-4 whitespace-nowrap text-sm text-gray-500 col-ddc ${!visibleColumns.ddc && 'hidden'}`}>{book.ddc_number || 'N/A'}</td>
                          <td className={`px-4 py-4 whitespace-nowrap text-sm text-gray-500 col-price ${!visibleColumns.price && 'hidden'}`}>{book.price ? `₹${book.price.toFixed(2)}` : 'N/A'}</td>
                          <td className={`px-4 py-4 whitespace-nowrap text-sm text-gray-500 col-copies ${!visibleColumns.copies && 'hidden'}`}>{book.available_copies} / {book.total_copies}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium no-print-in-popup">
                            <div className="flex items-center gap-4">
                              <button onClick={() => { setEditingBook(book); setShowBookModal(true); }} className="text-purple-600 hover:text-purple-900" title="Edit Book"><Edit size={18} /></button>
                              <button onClick={() => handleDeleteBook(book.id)} className="text-red-600 hover:text-red-900" title="Delete Book"><Trash2 size={18} /></button>
                              <button onClick={() => handleShowQR(book)} className="text-gray-500 hover:text-purple-600" title="Show QR Code"><QrCode size={18} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination 
                    currentPage={bookCurrentPage}
                    totalCount={filteredBooks.length}
                    pageSize={bookRowsPerPage}
                    onPageChange={page => setBookCurrentPage(page)}
                />
              </div>
            </div>
            <div className="lg:col-span-2">
              <ManageCategoriesForm onSave={fetchData} />
            </div>
          </div>
        )}

        {activeTab === 'Members' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-bold">Library Members</h2>
              <div className="flex gap-2">
                <button onClick={() => handlePrint('Library Members', 'member-list-printable')} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
                    <Printer size={16} /> Print List
                </button>
                <button onClick={() => { setEditingMember(null); setShowMemberModal(true); }} className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={20} /> Add Member</button>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="Search by name, email, register no, or class..." 
                    value={memberSearch} 
                    onChange={(e) => setMemberSearch(e.target.value)} 
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              
              {loading ? <p>Loading...</p> : filteredMembers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sl. No.</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Register No.</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase no-print-in-popup">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredMembers.map((member, index) => (
                        <tr key={member.id}>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.name}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{member.register_number || 'N/A'}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{member.class || 'N/A'}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium no-print-in-popup">
                            <div className="flex gap-4">
                              <button onClick={() => { setEditingMember(member); setShowMemberModal(true); }} className="text-purple-600 hover:text-purple-900"><Edit size={18} /></button>
                              <button onClick={() => handleDeleteMember(member.id)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <div className="text-center py-10"><Users size={40} className="mx-auto text-gray-300" /><p className="mt-2 text-gray-500">No members found.</p></div>}
            </div>
            <div id="member-list-printable" className="hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sl. No.</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Register No.</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Place</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredMembers.map((member, index) => (
                            <tr key={member.id}>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.name}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{member.register_number || 'N/A'}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{member.class || 'N/A'}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{member.place || 'N/A'}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{member.email}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{member.phone || 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        )}

        {activeTab === 'Fines' && <FinesPage />}

        {activeTab === 'Feedback' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Feedback & Suggestions</h2>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              {loading ? <p>Loading...</p> : feedback.length > 0 ? (
                <div className="space-y-4">
                  {feedback.map(item => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          {item.feedback_type === 'suggestion' ? (
                            <h3 className="font-semibold text-lg">Suggestion: "{item.suggestion_title}"</h3>
                          ) : (
                            <h3 className="font-semibold text-lg">Review for: "{item.books?.title}"</h3>
                          )}
                          <p className="text-sm text-gray-500">By: {item.members?.name || 'Unknown'}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : item.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.status}</span>
                      </div>
                      {item.feedback_type === 'book_review' && item.rating && (
                        <div className="flex items-center gap-1 mt-2">
                          {[...Array(5)].map((_, i) => (<Star key={i} size={16} className={i < item.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'} />))}
                        </div>
                      )}
                      {item.review && <p className="mt-2 text-gray-700">{item.review}</p>}
                      {item.suggestion_reason && <p className="mt-2 text-gray-700">{item.suggestion_reason}</p>}
                      {item.status === 'pending' && (
                        <div className="flex gap-2 mt-4">
                          <button onClick={() => updateFeedbackStatus(item.id, 'approved')} className="text-sm bg-green-600 text-white px-3 py-1 rounded">Approve</button>
                          <button onClick={() => updateFeedbackStatus(item.id, 'rejected')} className="text-sm bg-red-600 text-white px-3 py-1 rounded">Reject</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : <div className="text-center py-10"><Folder size={40} className="mx-auto text-gray-300" /><p className="mt-2 text-gray-500">No feedback submitted yet.</p></div>}
            </div>
          </div>
        )}

        {activeTab === 'History' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Circulation History</h2>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 items-center mb-4 gap-4">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="Search by book, member, or class..." 
                    value={historySearch} 
                    onChange={(e) => setHistorySearch(e.target.value)} 
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 justify-self-start md:justify-self-end w-full">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
                    {(['all', 'issued', 'returned', 'overdue'] as const).map(filter => (
                      <button 
                        key={filter} 
                        onClick={() => setHistoryStatusFilter(filter)} 
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors capitalize w-full text-center ${historyStatusFilter === filter ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => handlePrint('Circulation History', 'history-printable')} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm w-full sm:w-auto justify-center">
                    <Printer size={16} /> Print
                  </button>
                </div>
              </div>
              <div id="history-printable" className="overflow-x-auto">
                {loading ? <p>Loading...</p> : filteredHistory.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Book Title</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issued Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Return Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fine</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredHistory.map(item => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.books?.title || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.members?.name || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.members?.class || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'returned' ? 'bg-green-100 text-green-800' : new Date(item.due_date) < new Date() && item.status === 'issued' ? 'bg-red-100 text-red-800' : item.status === 'issued' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{new Date(item.due_date) < new Date() && item.status === 'issued' ? 'overdue' : item.status}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.issue_date).toLocaleDateString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.return_date ? new Date(item.return_date).toLocaleDateString() : '—'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.fine_amount?.toFixed(2) || '0.00'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <div className="text-center py-10"><Folder size={40} className="mx-auto text-gray-300" /><p className="mt-2 text-gray-500">No circulation history found for the selected criteria.</p></div>}
              </div>
            </div>
          </div>
        )}
      </main>

      {showMemberModal && <MemberModal member={editingMember} onClose={() => { setShowMemberModal(false); setEditingMember(null); }} onSave={() => { setShowMemberModal(false); setEditingMember(null); }} />}
      {showIssueModal && <IssueBookModal onClose={() => setShowIssueModal(false)} onSave={() => setShowIssueModal(false)} />}
      {showScanModal && <ScanQRModal onClose={() => setShowScanModal(false)} onSuccess={fetchData} />}
      {showBookQRModal && selectedBookForQR && <BookQRCodeModal book={selectedBookForQR} onClose={() => setShowBookQRModal(false)} />}
      {showBulkQRModal && <BulkQRDownloadModal onClose={() => setShowBulkQRModal(false)} />}
      {showBookModal && <BookModal book={editingBook} categories={categories} onClose={() => { setShowBookModal(false); setEditingBook(null); }} onSave={() => { setShowBookModal(false); setEditingBook(null); }} />}
    </div>
  );
};

export default AdminDashboard;
