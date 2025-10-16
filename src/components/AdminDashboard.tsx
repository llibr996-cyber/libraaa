import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, Bell, LogOut, Search, Plus, Edit, Trash2, Star, Folder, BookOpen, QrCode, Printer, Users, Download, Loader2 } from 'lucide-react';
import { supabase, type Book, type Circulation, type Member, type Feedback, type Category } from '../lib/supabase';
import MemberModal from './MemberModal';
import IssueBookModal from './IssueBookModal';
import AddBookForm from './AddBookForm';
import ManageCategoriesForm from './ManageCategoriesForm';
import BookModal from './BookModal';
import ScanQRModal from './ScanQRModal';
import BookQRCodeModal from './BookQRCodeModal';
import BulkQRDownloadModal from './BulkQRDownloadModal';

interface AdminDashboardProps {
  onLogout: () => void;
}

type TabType = 'Circulation' | 'Library' | 'Members' | 'Feedback' | 'History';
type BookStatusFilter = 'Available' | 'Issued' | 'Overdue';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
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
  const [showBookModal, setShowBookModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showBookQRModal, setShowBookQRModal] = useState(false);
  const [selectedBookForQR, setSelectedBookForQR] = useState<Book | null>(null);
  const [showBulkQRModal, setShowBulkQRModal] = useState(false);


  // History filters
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'issued' | 'returned' | 'overdue'>('all');

  const tabs: TabType[] = ['Circulation', 'Library', 'Members', 'Feedback', 'History'];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: booksData },
        { data: membersData },
        { data: circulationData },
        { data: feedbackData },
        { data: categoriesData }
      ] = await Promise.all([
        supabase.from('books').select('*, categories(name)').order('title'),
        supabase.from('members').select('*').order('name'),
        supabase.from('circulation').select('*, books(*), members(*)').order('updated_at', { ascending: false }),
        supabase.from('feedback').select('*, members(name), books(title)').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name')
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

  const handlePrint = (title: string, sectionId: string) => {
    const printContent = document.getElementById(sectionId);
    if (!printContent) return;

    const printWindow = window.open('', '', 'height=800,width=1000');
    if (!printWindow) {
        alert('Could not open print window. Please disable your pop-up blocker.');
        return;
    }

    printWindow.document.write(`<html><head><title>${title}</title>`);
    
    Array.from(document.styleSheets).forEach(styleSheet => {
        if (styleSheet.href) {
            printWindow.document.write(`<link rel="stylesheet" href="${styleSheet.href}">`);
        }
    });

    printWindow.document.write(`
        <style>
            body { padding: 2rem; font-family: sans-serif; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .no-print-in-popup { display: none !important; }
            @media print {
                .no-print-in-popup { display: none !important; }
            }
        </style>
    `);

    printWindow.document.write('</head><body>');
    printWindow.document.write(`<h1>${title}</h1>`);
    printWindow.document.write(printContent.innerHTML);
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
  
  const handleEditBook = (book: Book) => {
    setEditingBook(book);
    setShowBookModal(true);
  };
  
  const handleShowQR = (book: Book) => {
    setSelectedBookForQR(book);
    setShowBookQRModal(true);
  };

  const handleDeleteBook = async (bookId: string) => {
    const { data: circulationData, error: circulationError } = await supabase
      .from('circulation')
      .select('id')
      .eq('book_id', bookId)
      .in('status', ['issued', 'overdue']);

    if (circulationError) {
        alert('Could not verify book status. Deletion failed.');
        return;
    }
    if (circulationData && circulationData.length > 0) {
        alert('This book has copies currently issued. Return them before deleting.');
        return;
    }

    if (window.confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
        const { error } = await supabase.from('books').delete().eq('id', bookId);
        if (error) {
            alert('Error deleting book: ' + error.message);
        }
    }
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

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
    book.author.toLowerCase().includes(bookSearch.toLowerCase()) ||
    book.ddc_number?.toLowerCase().includes(bookSearch.toLowerCase())
  );

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
            item.members?.name.toLowerCase().includes(lowerSearch)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <button className="text-gray-600 hover:text-gray-900"><BarChart3 size={20} /></button>
              <button className="text-gray-600 hover:text-gray-900"><Bell size={20} /></button>
              <button onClick={onLogout} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <LogOut size={20} /> <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`py-4 px-2 border-b-2 font-medium text-sm ${activeTab === tab ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
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
                    <button onClick={() => handlePrint('Book Collection', 'book-collection-printable')} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
                      <Printer size={16} /> Print List
                    </button>
                  </div>
                </div>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input type="text" placeholder="Search books by title, author, DDC..." value={bookSearch} onChange={(e) => setBookSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"/>
                </div>
                <div id="book-collection-printable">
                  <div className="overflow-x-auto max-h-[500px]">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sl. No.</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Author</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">DDC</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Copies</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase no-print-in-popup">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredBooks.map((book, index) => (
                          <tr key={book.id}>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{book.title}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{book.author}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{book.categories?.name || 'N/A'}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{book.ddc_number || 'N/A'}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{book.available_copies} / {book.total_copies}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium no-print-in-popup">
                              <div className="flex gap-4">
                                <button onClick={() => handleShowQR(book)} disabled={!book.ddc_number} className="text-gray-500 hover:text-purple-600 disabled:text-gray-300 disabled:cursor-not-allowed"><QrCode size={18} /></button>
                                <button onClick={() => handleEditBook(book)} className="text-purple-600 hover:text-purple-900"><Edit size={18} /></button>
                                <button onClick={() => handleDeleteBook(book.id)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-2">
              <ManageCategoriesForm onSave={fetchData} />
            </div>
          </div>
        )}

        {activeTab === 'Members' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Library Members</h2>
              <div className="flex gap-2">
                <button onClick={() => handlePrint('Library Members', 'member-list-printable')} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
                    <Printer size={16} /> Print List
                </button>
                <button onClick={() => { setEditingMember(null); setShowMemberModal(true); }} className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={20} /> Add Member</button>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              {loading ? <p>Loading...</p> : members.length > 0 ? (
                <div className="space-y-4">
                  {members.map(member => (
                    <div key={member.id} className="border rounded-lg p-4 flex justify-between items-start">
                      <div><h3 className="font-semibold">{member.name}</h3><p>{member.email}</p></div>
                      <div className="flex gap-2 no-print-in-popup">
                        <button onClick={() => { setEditingMember(member); setShowMemberModal(true); }}><Edit size={18} /></button>
                        <button onClick={() => handleDeleteMember(member.id)}><Trash2 size={18} /></button>
                      </div>
                    </div>
                  ))}
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
                        {members.map((member, index) => (
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
              <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <div className="relative w-full md:w-1/2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="Search by book title or member name..." 
                    value={historySearch} 
                    onChange={(e) => setHistorySearch(e.target.value)} 
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                    {(['all', 'issued', 'returned', 'overdue'] as const).map(filter => (
                      <button 
                        key={filter} 
                        onClick={() => setHistoryStatusFilter(filter)} 
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors capitalize ${historyStatusFilter === filter ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => handlePrint('Circulation History', 'history-printable')} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
                    <Printer size={16} /> Print
                  </button>
                </div>
              </div>
              <div id="history-printable">
                {loading ? <p>Loading...</p> : filteredHistory.length > 0 ? (
                  <div className="overflow-x-auto">
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
                  </div>
                ) : <div className="text-center py-10"><Folder size={40} className="mx-auto text-gray-300" /><p className="mt-2 text-gray-500">No circulation history found.</p></div>}
              </div>
            </div>
          </div>
        )}
      </main>

      {showMemberModal && <MemberModal member={editingMember} onClose={() => { setShowMemberModal(false); setEditingMember(null); }} onSave={() => { setShowMemberModal(false); setEditingMember(null); }} />}
      {showIssueModal && <IssueBookModal onClose={() => setShowIssueModal(false)} onSave={() => setShowIssueModal(false)} />}
      {showBookModal && <BookModal book={editingBook} categories={categories} onClose={() => { setShowBookModal(false); setEditingBook(null); }} onSave={() => { setShowBookModal(false); setEditingBook(null); }} />}
      {showScanModal && <ScanQRModal onClose={() => setShowScanModal(false)} onSuccess={fetchData} />}
      {showBookQRModal && selectedBookForQR && <BookQRCodeModal bookDdcNumber={selectedBookForQR.ddc_number} bookTitle={selectedBookForQR.title} onClose={() => setShowBookQRModal(false)} />}
      {showBulkQRModal && <BulkQRDownloadModal onClose={() => setShowBulkQRModal(false)} />}
    </div>
  );
};

export default AdminDashboard;
