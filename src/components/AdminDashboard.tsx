import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Bell, LogOut, Search, Plus, Star, Folder, BookOpen, QrCode, Printer, Users, Download, DollarSign, Edit, Trash2, X, BookHeart } from 'lucide-react';
import { supabase, type Book, type Circulation, type Member, type Feedback, type Category, type ReadWithUs } from '../lib/supabase';
import MemberModal from './MemberModal';
import IssueBookModal from './IssueBookModal';
import AddBookForm from './AddBookForm';
import CategoryManager from './CategoryManager';
import ScanQRModal from './ScanQRModal';
import BookQRCodeModal from './BookQRCodeModal';
import BulkQRDownloadModal from './BulkQRDownloadModal';
import BookModal from './BookModal';
import Pagination from './Pagination';
import ReadWithUsManager from './ReadWithUsManager';
import PrintModal from './PrintModal';

type TabType = 'Circulation' | 'Book Collection' | 'Members' | 'Fines' | 'Feedback' | 'History' | 'Read With Us';
type BookStatusFilter = 'Available' | 'Issued' | 'Overdue';
type ColumnKey = 'title' | 'author' | 'publisher' | 'category' | 'ddc' | 'price' | 'copies';
type FineRecord = Circulation & { books: { title: string } | null; members: { name: string } | null; };

const AddBookModal = ({ categories, onSave, onClose }: { categories: Category[], onSave: () => void, onClose: () => void }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
      <div className="flex justify-between items-center p-5 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">Add New Book</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X size={24} />
        </button>
      </div>
      <div className="flex-grow overflow-y-auto p-6">
        <AddBookForm categories={categories} onSave={() => { onSave(); onClose(); }} />
      </div>
    </div>
  </div>
);

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
  const [fines, setFines] = useState<FineRecord[]>([]);
  const [readWithUsPosts, setReadWithUsPosts] = useState<ReadWithUs[]>([]);
  
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
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showManageCategoriesModal, setShowManageCategoriesModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Filter states
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'issued' | 'returned' | 'overdue'>('all');
  const [memberSearch, setMemberSearch] = useState('');
  const [fineFilter, setFineFilter] = useState<'all' | 'pending' | 'paid'>('pending');
  const [fineSearchTerm, setFineSearchTerm] = useState('');

  // Book Collection Pagination
  const [bookCurrentPage, setBookCurrentPage] = useState(1);
  const [bookRowsPerPage, setBookRowsPerPage] = useState(50);

  // Print selection state
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>({
    title: true, author: true, publisher: true, category: true, ddc: true, price: true, copies: true
  });

  const tabs: TabType[] = ['Circulation', 'Book Collection', 'Members', 'Fines', 'Feedback', 'History', 'Read With Us'];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: booksData }, { data: membersData }, { data: circulationData },
        { data: feedbackData }, { data: categoriesData }, { data: finesData },
        { data: readWithUsData }
      ] = await Promise.all([
        supabase.from('books').select('*, categories(name)').order('created_at', { ascending: false }).limit(10000),
        supabase.from('members').select('*').order('register_number', { ascending: true }),
        supabase.from('circulation').select('*, books(*), members(*)').order('updated_at', { ascending: false }),
        supabase.from('feedback').select('*, members(name), books(title)').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name'),
        supabase.from('circulation').select('*, books(title), members(name)').gt('fine_amount', 0).order('due_date', { ascending: false }),
        supabase.from('read_with_us').select('*').order('created_at', { ascending: false })
      ]);

      setBooks(booksData || []);
      setMembers(membersData || []);
      setCirculation(circulationData || []);
      setFeedback(feedbackData || []);
      setCategories(categoriesData || []);
      setFines((finesData as FineRecord[]) || []);
      setReadWithUsPosts(readWithUsData || []);

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
    const channel = supabase.channel('db-changes').on('postgres_changes', { event: '*', schema: 'public' }, fetchData).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  useEffect(() => { setBookCurrentPage(1); }, [bookSearch, bookRowsPerPage]);

  const handlePrint = (selections: Record<string, boolean>) => {
    const printWindow = window.open('', '', 'height=800,width=1000');
    if (!printWindow) {
      alert('Could not open print window. Please disable your pop-up blocker.');
      return;
    }

    let content = `<html><head><title>Library Reports</title><style>
        body { padding: 2rem; font-family: sans-serif; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 2rem; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        h1, h2 { font-size: 24px; margin-bottom: 1rem; page-break-before: always; }
        h1:first-of-type, h2:first-of-type { page-break-before: auto; }
        .no-print-in-popup { display: none; }
    </style></head><body><h1>Library Reports</h1>`;

    const sectionMapping: Record<string, { title: string, tableId: string }> = {
      books: { title: 'Book Collection', tableId: 'book-collection-table' },
      members: { title: 'Library Members', tableId: 'member-list-printable' },
      history: { title: 'Circulation History', tableId: 'history-printable' },
      fines: { title: 'Fines Report', tableId: 'fines-printable' }
    };

    Object.entries(selections).forEach(([key, value]) => {
      if (value) {
        const section = sectionMapping[key];
        const table = document.getElementById(section.tableId);
        if (table) {
          const tableClone = table.cloneNode(true) as HTMLElement;
          if (key === 'books') {
            Object.entries(visibleColumns).forEach(([colKey, isVisible]) => {
              if (!isVisible) tableClone.querySelectorAll(`.col-${colKey}`).forEach(el => { (el as HTMLElement).style.display = 'none'; });
            });
          }
          tableClone.querySelectorAll('.no-print-in-popup').forEach(el => { (el as HTMLElement).style.display = 'none'; });
          content += `<h2>${section.title}</h2>${tableClone.outerHTML}`;
        }
      }
    });

    content += '</body></html>';
    printWindow.document.write(content);
    printWindow.document.close();
    setTimeout(() => { printWindow.focus(); printWindow.print(); printWindow.close(); }, 250);
  };

  const handleDeleteMember = async (memberId: string) => {
    if (window.confirm('Are you sure? This will delete the member and all associated records.')) {
      await supabase.from('members').delete().eq('id', memberId);
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (window.confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
        const { error } = await supabase.from('books').delete().eq('id', bookId);
        if (error) alert('Error deleting book: ' + error.message);
    }
  };
  
  const handleShowQR = (book: Book) => { setSelectedBookForQR(book); setShowBookQRModal(true); };
  const handleReturnBook = async (circulationId: string) => {
    const { error } = await supabase.rpc('return_book', { p_circulation_id: circulationId });
    if (error) alert('Error returning book.');
  };
  
  const updateFeedbackStatus = async (id: string, status: 'approved' | 'rejected') => {
    await supabase.from('feedback').update({ status }).eq('id', id);
  };

  const handleMarkFineAsPaid = async (circulationId: string) => {
    if (window.confirm('Are you sure you want to mark this fine as paid?')) {
      await supabase.from('circulation').update({ fine_amount: 0 }).eq('id', circulationId);
    }
  };

  const circulationData = useMemo(() => {
    let data: (Book | Circulation)[] = [];
    switch (activeFilter) {
      case 'Available': data = books.filter(b => b.available_copies > 0); break;
      case 'Issued': data = circulation.filter(c => c.status === 'issued'); break;
      case 'Overdue': data = circulation.filter(c => c.status === 'issued' && new Date(c.due_date) < new Date()); break;
    }
    if (!circulationSearch) return data;
    const lowerSearch = circulationSearch.toLowerCase();
    return data.filter(item => 
      ('title' in item && (item.title.toLowerCase().includes(lowerSearch) || item.author.toLowerCase().includes(lowerSearch))) ||
      ('book_id' in item && (item.books?.title.toLowerCase().includes(lowerSearch) || item.members?.name.toLowerCase().includes(lowerSearch)))
    );
  }, [activeFilter, books, circulation, circulationSearch]);

  const filteredBooks = useMemo(() => books.filter(book => {
    const lowerSearch = bookSearch.toLowerCase();
    return book.title.toLowerCase().includes(lowerSearch) ||
           book.author.toLowerCase().includes(lowerSearch) ||
           book.categories?.name?.toLowerCase().includes(lowerSearch) ||
           book.ddc_number?.toLowerCase().includes(lowerSearch);
  }), [books, bookSearch]);

  const paginatedBooks = useMemo(() => {
    const startIndex = (bookCurrentPage - 1) * bookRowsPerPage;
    return filteredBooks.slice(startIndex, startIndex + bookRowsPerPage);
  }, [filteredBooks, bookCurrentPage, bookRowsPerPage]);

  const filteredHistory = useMemo(() => circulation
    .filter(item => historyStatusFilter === 'all' || (historyStatusFilter === 'overdue' ? item.status === 'issued' && new Date(item.due_date) < new Date() : item.status === historyStatusFilter))
    .filter(item => !historySearch || (item.books?.title.toLowerCase().includes(historySearch.toLowerCase()) || item.members?.name.toLowerCase().includes(historySearch.toLowerCase()) || item.members?.class?.toLowerCase().includes(historySearch.toLowerCase()))), 
  [circulation, historyStatusFilter, historySearch]);

  const filteredMembers = useMemo(() => members.filter(member => 
    !memberSearch || (member.name.toLowerCase().includes(memberSearch.toLowerCase()) || member.email.toLowerCase().includes(memberSearch.toLowerCase()) || member.register_number?.toLowerCase().includes(memberSearch.toLowerCase()) || member.class?.toLowerCase().includes(memberSearch.toLowerCase()))
  ), [members, memberSearch]);

  const filteredFines = useMemo(() => fines
    .filter(fine => fineFilter === 'paid' ? false : true)
    .filter(fine => !fineSearchTerm || (fine.members?.name?.toLowerCase().includes(fineSearchTerm.toLowerCase()) || fine.books?.title?.toLowerCase().includes(fineSearchTerm.toLowerCase()))),
  [fines, fineFilter, fineSearchTerm]);

  const renderCirculationItem = (item: Book | Circulation) => {
    if (activeFilter === 'Available') {
      const book = item as Book;
      return (
        <div key={book.id} className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div><h3 className="font-semibold text-gray-800">{book.title}</h3><p className="text-sm text-gray-600">by {book.author}</p><p className="text-sm text-gray-500">Available: <span className="font-medium text-green-600">{book.available_copies}</span></p></div>
          </div>
        </div>
      );
    }
    const circ = item as Circulation;
    return (
      <div key={circ.id} className="border rounded-lg p-4 bg-white shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div><h3 className="font-semibold text-gray-800">{circ.books?.title}</h3><p className="text-sm text-gray-600">by <span className="font-medium">{circ.members?.name}</span></p><p className={`text-sm ${new Date(circ.due_date) < new Date() ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>Due: {new Date(circ.due_date).toLocaleDateString()}</p></div>
          <button onClick={() => handleReturnBook(circ.id)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors self-start sm:self-auto">Return</button>
        </div>
      </div>
    );
  };
  
  const toggleColumn = (col: ColumnKey) => setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <button onClick={() => setShowPrintModal(true)} className="text-gray-600 hover:text-gray-900"><Printer size={20} /></button>
              <button className="text-gray-600 hover:text-gray-900"><Bell size={20} /></button>
              <button onClick={handleLogout} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"><LogOut size={20} /> <span className="hidden sm:inline">Logout</span></button>
            </div>
          </div>
        </div>
      </header>
      <nav className="bg-white border-b"><div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8"><div className="flex space-x-2 sm:space-x-8 overflow-x-auto">{tabs.map(tab => <button key={tab} onClick={() => setActiveTab(tab)} className={`py-4 px-1 sm:px-2 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === tab ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{tab}</button>)}</div></div></nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'Circulation' && (<div className="space-y-6"><div className="flex justify-between items-center flex-wrap gap-4"><h2 className="text-2xl font-bold">Borrow & Return Books</h2><div className="flex gap-2"><button onClick={() => setShowScanModal(true)} className="bg-white border border-purple-600 text-purple-600 hover:bg-purple-50 px-4 py-2 rounded-lg flex items-center gap-2"><QrCode size={20} /> Scan QR</button><button onClick={() => setShowIssueModal(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={20} /> Issue Book</button></div></div><div className="flex flex-wrap gap-2">{(['Available', 'Issued', 'Overdue'] as BookStatusFilter[]).map(filter => <button key={filter} onClick={() => setActiveFilter(filter)} className={`px-4 py-2 rounded-lg font-medium ${activeFilter === filter ? 'bg-purple-600 text-white' : 'bg-gray-100'}`}>{filter} ({counts[filter.toLowerCase() as keyof typeof counts]})</button>)}</div><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} /><input type="text" placeholder="Search books, members..." value={circulationSearch} onChange={(e) => setCirculationSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg"/></div><div className="bg-gray-100 rounded-lg p-4 sm:p-6 min-h-[400px]">{loading ? <p>Loading...</p> : <div className="space-y-4">{circulationData.map(renderCirculationItem)}</div>}</div></div>)}
        {activeTab === 'Book Collection' && (<div className="space-y-6"><div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200"><div className="flex justify-between items-center mb-4 flex-wrap gap-2"><h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><BookOpen size={22} /> Book Collection</h3><div className="flex gap-2 flex-wrap"><button onClick={() => setShowAddBookModal(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"><Plus size={16} /> Add Book</button><button onClick={() => setShowManageCategoriesModal(true)} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"><Folder size={16} /> Manage Categories</button><button onClick={() => setShowBulkQRModal(true)} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"><Download size={16} /> Bulk Download QRs</button></div></div><div className="relative mb-4"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} /><input type="text" placeholder="Search by title, author, category, DDC..." value={bookSearch} onChange={(e) => setBookSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"/></div><div className="flex justify-between items-center mb-4 flex-wrap gap-4"><div className="flex items-center gap-2"><label htmlFor="book-rows-per-page" className="text-sm text-gray-600">Rows per page:</label><select id="book-rows-per-page" value={bookRowsPerPage} onChange={e => setBookRowsPerPage(Number(e.target.value))} className="px-2 py-1 border border-gray-300 rounded-md bg-white text-sm focus:ring-1 focus:ring-purple-400"><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option><option value={200}>200</option><option value={400}>400</option></select></div><div className="p-3 bg-gray-50 rounded-lg border w-full"><p className="text-sm font-medium mb-2">Toggle columns for printing:</p><div className="flex flex-wrap gap-x-4 gap-y-2">{Object.keys(visibleColumns).map(key => (<label key={key} className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={visibleColumns[key as ColumnKey]} onChange={() => toggleColumn(key as ColumnKey)} className="rounded text-purple-600 focus:ring-purple-500" />{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>))}</div></div></div><div className="overflow-x-auto"><table id="book-collection-table" className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50 sticky top-0"><tr><th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase col-title ${!visibleColumns.title && 'hidden'}`}>Title</th><th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase col-author ${!visibleColumns.author && 'hidden'}`}>Author</th><th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase col-publisher ${!visibleColumns.publisher && 'hidden'}`}>Publisher</th><th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase col-category ${!visibleColumns.category && 'hidden'}`}>Category</th><th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase col-ddc ${!visibleColumns.ddc && 'hidden'}`}>DDC</th><th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase col-price ${!visibleColumns.price && 'hidden'}`}>Price</th><th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase col-copies ${!visibleColumns.copies && 'hidden'}`}>Copies</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase no-print-in-popup">Actions</th></tr></thead><tbody className="bg-white divide-y divide-gray-200">{paginatedBooks.map((book) => (<tr key={book.id}><td className={`px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 col-title ${!visibleColumns.title && 'hidden'}`}>{book.title}</td><td className={`px-4 py-4 whitespace-nowrap text-sm text-gray-500 col-author ${!visibleColumns.author && 'hidden'}`}>{book.author}</td><td className={`px-4 py-4 whitespace-nowrap text-sm text-gray-500 col-publisher ${!visibleColumns.publisher && 'hidden'}`}>{book.publisher || 'N/A'}</td><td className={`px-4 py-4 whitespace-nowrap text-sm text-gray-500 col-category ${!visibleColumns.category && 'hidden'}`}>{book.categories?.name || 'N/A'}</td><td className={`px-4 py-4 whitespace-nowrap text-sm text-gray-500 col-ddc ${!visibleColumns.ddc && 'hidden'}`}>{book.ddc_number || 'N/A'}</td><td className={`px-4 py-4 whitespace-nowrap text-sm text-gray-500 col-price ${!visibleColumns.price && 'hidden'}`}>{book.price ? `₹${book.price.toFixed(2)}` : 'N/A'}</td><td className={`px-4 py-4 whitespace-nowrap text-sm text-gray-500 col-copies ${!visibleColumns.copies && 'hidden'}`}>{book.available_copies} / {book.total_copies}</td><td className="px-4 py-4 whitespace-nowrap text-sm font-medium no-print-in-popup"><div className="flex items-center gap-4"><button onClick={() => { setEditingBook(book); setShowBookModal(true); }} className="text-purple-600 hover:text-purple-900" title="Edit Book"><Edit size={18} /></button><button onClick={() => handleDeleteBook(book.id)} className="text-red-600 hover:text-red-900" title="Delete Book"><Trash2 size={18} /></button><button onClick={() => handleShowQR(book)} className="text-gray-500 hover:text-purple-600" title="Show QR Code"><QrCode size={18} /></button></div></td></tr>))}</tbody></table></div><Pagination currentPage={bookCurrentPage} totalCount={filteredBooks.length} pageSize={bookRowsPerPage} onPageChange={page => setBookCurrentPage(page)} /></div></div>)}
        {activeTab === 'Members' && (<div className="space-y-6"><div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"><h2 className="text-2xl font-bold">Library Members</h2><button onClick={() => { setEditingMember(null); setShowMemberModal(true); }} className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={20} /> Add Member</button></div><div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6"><div className="mb-4"><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} /><input type="text" placeholder="Search by name, email, register no, or class..." value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"/></div></div>{loading ? <p>Loading...</p> : filteredMembers.length > 0 ? (<div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Register ID</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase no-print-in-popup">Actions</th></tr></thead>
          <tbody className="bg-white divide-y divide-gray-200">{filteredMembers.map((member) => (<tr key={member.id}><td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.register_number || 'N/A'}</td><td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{member.name}</td><td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{member.phone || 'N/A'}</td><td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{member.class || 'N/A'}</td><td className="px-4 py-4 whitespace-nowrap text-sm font-medium no-print-in-popup"><div className="flex gap-4"><button onClick={() => { setEditingMember(member); setShowMemberModal(true); }} className="text-purple-600 hover:text-purple-900"><Edit size={18} /></button><button onClick={() => handleDeleteMember(member.id)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button></div></td></tr>))}</tbody></table></div>) : <div className="text-center py-10"><Users size={40} className="mx-auto text-gray-300" /><p className="mt-2 text-gray-500">No members found.</p></div>}</div>
        <div id="member-list-printable" className="hidden"><table className="min-w-full divide-y divide-gray-200"><thead><tr><th>Register ID</th><th>Name</th><th>Phone</th><th>Class</th><th>Place</th><th>Email</th></tr></thead><tbody>{filteredMembers.map(member => (<tr key={member.id}><td>{member.register_number || 'N/A'}</td><td>{member.name}</td><td>{member.phone || 'N/A'}</td><td>{member.class || 'N/A'}</td><td>{member.place || 'N/A'}</td><td>{member.email}</td></tr>))}</tbody></table></div></div>)}
        {activeTab === 'Fines' && (<div className="space-y-6"><h2 className="text-2xl font-bold text-gray-800">Fines Management</h2><div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"><div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4"><div className="relative w-full md:w-1/2"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} /><input type="text" placeholder="Search by member name, book title..." value={fineSearchTerm} onChange={(e) => setFineSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"/></div><div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">{(['all', 'pending', 'paid'] as const).map(f => <button key={f} onClick={() => setFineFilter(f)} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${fineFilter === f ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}>{f}</button>)}</div></div>
        <div className="overflow-x-auto">{loading && fines.length === 0 ? <div className="flex justify-center items-center py-10"><Loader2 className="animate-spin text-purple-600" size={32} /></div> : filteredFines.length === 0 ? <div className="text-center py-10 text-gray-500"><DollarSign size={40} className="mx-auto text-gray-300 mb-2" />{fineFilter === 'paid' ? 'Paid fine records are not available.' : 'No pending fines found.'}</div> : <table id="fines-printable" className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Book Title</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fine Amount</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase no-print-in-popup">Action</th></tr></thead><tbody className="bg-white divide-y divide-gray-200">{filteredFines.map(fine => (<tr key={fine.id}><td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{fine.members?.name || 'N/A'}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fine.books?.title || 'N/A'}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{fine.fine_amount.toFixed(2)}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(fine.due_date).toLocaleDateString()}</td><td className="px-6 py-4 whitespace-nowrap"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Pending</span></td><td className="px-6 py-4 whitespace-nowrap text-sm font-medium no-print-in-popup"><button onClick={() => handleMarkFineAsPaid(fine.id)} disabled={loading} className="text-white bg-green-600 hover:bg-green-700 font-semibold py-1 px-3 rounded-md text-xs disabled:bg-green-300">Mark as Paid</button></td></tr>))}</tbody></table>}</div></div></div>)}
        {activeTab === 'Feedback' && (<div className="space-y-6"><h2 className="text-2xl font-bold">Feedback & Suggestions</h2><div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">{loading ? <p>Loading...</p> : feedback.length > 0 ? (<div className="space-y-4">{feedback.map(item => (<div key={item.id} className="border rounded-lg p-4"><div className="flex justify-between items-start"><div>{item.feedback_type === 'suggestion' ? <h3 className="font-semibold text-lg">Suggestion: "{item.suggestion_title}"</h3> : <h3 className="font-semibold text-lg">Review for: "{item.books?.title}"</h3>}<p className="text-sm text-gray-500">By: {item.members?.name || 'Unknown'}</p></div><span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : item.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.status}</span></div>{item.feedback_type === 'book_review' && item.rating && (<div className="flex items-center gap-1 mt-2">{[...Array(5)].map((_, i) => (<Star key={i} size={16} className={i < item.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'} />))}</div>)}{item.review && <p className="mt-2 text-gray-700">{item.review}</p>}{item.suggestion_reason && <p className="mt-2 text-gray-700">{item.suggestion_reason}</p>}{item.status === 'pending' && (<div className="flex gap-2 mt-4"><button onClick={() => updateFeedbackStatus(item.id, 'approved')} className="text-sm bg-green-600 text-white px-3 py-1 rounded">Approve</button><button onClick={() => updateFeedbackStatus(item.id, 'rejected')} className="text-sm bg-red-600 text-white px-3 py-1 rounded">Reject</button></div>)}</div>))}</div>) : <div className="text-center py-10"><Folder size={40} className="mx-auto text-gray-300" /><p className="mt-2 text-gray-500">No feedback submitted yet.</p></div>}</div></div>)}
        {activeTab === 'History' && (<div className="space-y-6"><h2 className="text-2xl font-bold">Circulation History</h2><div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6"><div className="grid grid-cols-1 md:grid-cols-2 items-center mb-4 gap-4"><div className="relative w-full"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} /><input type="text" placeholder="Search by book, member, or class..." value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"/></div><div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 w-full sm:w-auto justify-self-start md:justify-self-end">{(['all', 'issued', 'returned', 'overdue'] as const).map(filter => <button key={filter} onClick={() => setHistoryStatusFilter(filter)} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors capitalize w-full text-center ${historyStatusFilter === filter ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}>{filter}</button>)}</div></div><div id="history-printable" className="overflow-x-auto">{loading ? <p>Loading...</p> : filteredHistory.length > 0 ? (<table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Book Title</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issued Date</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Return Date</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fine</th></tr></thead><tbody className="bg-white divide-y divide-gray-200">{filteredHistory.map(item => (<tr key={item.id}><td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.books?.title || 'N/A'}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.members?.name || 'N/A'}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.members?.class || 'N/A'}</td><td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'returned' ? 'bg-green-100 text-green-800' : new Date(item.due_date) < new Date() && item.status === 'issued' ? 'bg-red-100 text-red-800' : item.status === 'issued' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{new Date(item.due_date) < new Date() && item.status === 'issued' ? 'overdue' : item.status}</span></td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.issue_date).toLocaleDateString()}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.return_date ? new Date(item.return_date).toLocaleDateString() : '—'}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.fine_amount?.toFixed(2) || '0.00'}</td></tr>))}</tbody></table>) : <div className="text-center py-10"><Folder size={40} className="mx-auto text-gray-300" /><p className="mt-2 text-gray-500">No circulation history found for the selected criteria.</p></div>}</div></div></div>)}
        {activeTab === 'Read With Us' && <ReadWithUsManager />}
      </main>
      {showMemberModal && <MemberModal member={editingMember} onClose={() => { setShowMemberModal(false); setEditingMember(null); }} onSave={() => { setShowMemberModal(false); setEditingMember(null); }} />}
      {showIssueModal && <IssueBookModal onClose={() => setShowIssueModal(false)} onSave={() => setShowIssueModal(false)} />}
      {showScanModal && <ScanQRModal onClose={() => setShowScanModal(false)} onSuccess={fetchData} />}
      {showBookQRModal && selectedBookForQR && <BookQRCodeModal book={selectedBookForQR} onClose={() => setShowBookQRModal(false)} />}
      {showBulkQRModal && <BulkQRDownloadModal onClose={() => setShowBulkQRModal(false)} />}
      {showBookModal && <BookModal book={editingBook} categories={categories} onClose={() => { setShowBookModal(false); setEditingBook(null); }} onSave={() => { setShowBookModal(false); setEditingBook(null); }} />}
      {showAddBookModal && <AddBookModal categories={categories} onSave={fetchData} onClose={() => setShowAddBookModal(false)} />}
      {showManageCategoriesModal && <CategoryManager onClose={() => setShowManageCategoriesModal(false)} onSave={fetchData} />}
      {showPrintModal && <PrintModal onClose={() => setShowPrintModal(false)} onPrint={handlePrint} />}
    </div>
  );
};

export default AdminDashboard;
