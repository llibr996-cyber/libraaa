import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Search, Plus, Star, Folder, BookOpen, QrCode, Printer, Users, Download, DollarSign, Edit, Trash2, X, BookHeart, FileText, MessageSquare, RefreshCw } from 'lucide-react';
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
import PrintMembersModal from './PrintMembersModal';
import ReportsPage from './ReportsPage';
import FinesPage from './FinesPage';
import ConfirmationModal from './ConfirmationModal';
import { useNotification } from '../contexts/NotificationContext';
import Spinner from './Spinner';

type TabType = 'Circulation' | 'Book Collection' | 'Members' | 'Penalty' | 'Feedback' | 'Reports' | 'Read With Us';
type BookStatusFilter = 'Available' | 'Issued' | 'Overdue';

interface ConfirmationState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => Promise<void>;
}

const AddBookModal = ({ categories, onSave, onClose }: { categories: Category[], onSave: () => void, onClose: () => void }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
      <div className="flex justify-between items-center p-5 border-b border-neutral-200">
        <h2 className="text-xl font-bold text-neutral-800">Add New Book</h2>
        <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 transition-colors">
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
  const { addNotification } = useNotification();
  const [activeTab, setActiveTab] = useState<TabType>('Circulation');
  const [activeFilter, setActiveFilter] = useState<BookStatusFilter>('Available');
  
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
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showManageCategoriesModal, setShowManageCategoriesModal] = useState(false);
  const [showPrintMembersModal, setShowPrintMembersModal] = useState(false);

  // Search and Filter states
  const [circulationSearch, setCirculationSearch] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  
  // Pagination
  const [bookCurrentPage, setBookCurrentPage] = useState(1);
  const [bookRowsPerPage, setBookRowsPerPage] = useState(50);
  
  // Confirmation Modal State
  const [confirmation, setConfirmation] = useState<ConfirmationState>({ isOpen: false, title: '', message: '', onConfirm: async () => {} });
  const [isConfirming, setIsConfirming] = useState(false);

  const tabs: { id: TabType, icon: React.ElementType }[] = [
    { id: 'Circulation', icon: RefreshCw },
    { id: 'Book Collection', icon: BookOpen },
    { id: 'Members', icon: Users },
    { id: 'Penalty', icon: DollarSign },
    { id: 'Feedback', icon: MessageSquare },
    { id: 'Reports', icon: FileText },
    { id: 'Read With Us', icon: BookHeart }
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: booksData, error: booksError }, 
        { data: membersData, error: membersError }, 
        { data: circulationData, error: circError },
        { data: feedbackData, error: feedbackError }, 
        { data: categoriesData, error: catError },
      ] = await Promise.all([
        supabase.from('books').select('*, categories(name)').order('created_at', { ascending: false }).limit(10000),
        supabase.from('members').select('*').order('register_number', { ascending: true }),
        supabase.from('circulation').select('*, books(*), members(*)').order('updated_at', { ascending: false }),
        supabase.from('feedback').select('*, members(name), books(title)').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name'),
      ]);

      if (booksError || membersError || circError || feedbackError || catError) {
        throw new Error('Failed to fetch initial data. Please check your connection and permissions.');
      }

      const allCirculation = circulationData || [];
      const finesData = allCirculation.filter(c => c.status === 'issued' && new Date(c.due_date) < new Date());

      setBooks(booksData || []);
      setMembers(membersData || []);
      setCirculation(allCirculation);
      setFeedback(feedbackData || []);
      setCategories(categoriesData || []);

      const availableCount = booksData?.reduce((sum, book) => sum + book.available_copies, 0) || 0;
      const issuedCount = allCirculation.filter(c => c.status === 'issued').length || 0;
      const overdueCount = finesData.length;

      setCounts({ available: availableCount, issued: issuedCount, overdue: overdueCount });
    } catch (error: any) {
      addNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('db-changes').on('postgres_changes', { event: '*', schema: 'public' }, fetchData).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  useEffect(() => { setBookCurrentPage(1); }, [bookSearch, bookRowsPerPage]);

  const confirmAction = (title: string, message: string, onConfirm: () => Promise<void>) => {
    setConfirmation({ isOpen: true, title, message, onConfirm });
  };

  const handleConfirmation = async () => {
    setIsConfirming(true);
    await confirmation.onConfirm();
    setIsConfirming(false);
    setConfirmation({ isOpen: false, title: '', message: '', onConfirm: async () => {} });
  };

  const handleDeleteMember = (memberId: string) => {
    confirmAction(
      'Delete Member?',
      'Are you sure? This will delete the member and all associated records. This action cannot be undone.',
      async () => {
        const { error } = await supabase.from('members').delete().eq('id', memberId);
        if (error) addNotification(`Error deleting member: ${error.message}`, 'error');
        else addNotification('Member deleted successfully.', 'success');
      }
    );
  };

  const handleDeleteBook = (bookId: string) => {
    confirmAction(
      'Delete Book?',
      'Are you sure you want to delete this book? This action cannot be undone.',
      async () => {
        const { error } = await supabase.from('books').delete().eq('id', bookId);
        if (error) addNotification(`Error deleting book: ${error.message}`, 'error');
        else addNotification('Book deleted successfully.', 'success');
      }
    );
  };
  
  const handleShowQR = (book: Book) => { setSelectedBookForQR(book); setShowBookQRModal(true); };
  
  const handleReturnBook = async (circulationId: string) => {
    const { error } = await supabase.rpc('return_book', { p_circulation_id: circulationId });
    if (error) addNotification('Error returning book.', 'error');
    else addNotification('Book returned successfully.', 'success');
  };

  const handleRenewBook = (circulationId: string) => {
    confirmAction(
        'Renew Book?',
        'Are you sure you want to renew this book for 14 more days?',
        async () => {
            const newDueDate = new Date();
            newDueDate.setDate(newDueDate.getDate() + 14);
            const { error } = await supabase.from('circulation').update({ due_date: newDueDate.toISOString() }).eq('id', circulationId);
            if (error) addNotification(`Error renewing book: ${error.message}`, 'error');
            else addNotification('Book renewed successfully!', 'success');
        }
    );
  };
  
  const updateFeedbackStatus = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase.from('feedback').update({ status }).eq('id', id);
    if (error) addNotification(`Failed to update feedback: ${error.message}`, 'error');
    else addNotification('Feedback status updated.', 'success');
  };

  const circulationData = useMemo(() => {
    let data: (Book | Circulation)[] = [];
    switch (activeFilter) {
      case 'Available': data = books.filter(b => b.available_copies > 0); break;
      case 'Issued': data = circulation.filter(c => c.status === 'issued' && new Date(c.due_date) >= new Date()); break;
      case 'Overdue': data = circulation.filter(c => c.status === 'issued' && new Date(c.due_date) < new Date()); break;
    }
    if (!circulationSearch) return data;
    const lowerSearch = circulationSearch.toLowerCase();
    return data.filter(item => 
      ('title' in item && (item.title.toLowerCase().includes(lowerSearch) || item.author.toLowerCase().includes(lowerSearch) || item.ddc_number?.toLowerCase().includes(lowerSearch))) ||
      ('book_id' in item && (item.books?.title.toLowerCase().includes(lowerSearch) || item.members?.name.toLowerCase().includes(lowerSearch) || item.books?.ddc_number?.toLowerCase().includes(lowerSearch)))
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

  const filteredMembers = useMemo(() => members.filter(member => 
    !memberSearch || (member.name.toLowerCase().includes(memberSearch.toLowerCase()) || member.email.toLowerCase().includes(memberSearch.toLowerCase()) || member.register_number?.toLowerCase().includes(memberSearch.toLowerCase()) || member.class?.toLowerCase().includes(memberSearch.toLowerCase()))
  ), [members, memberSearch]);

  const renderCirculationItem = (item: Book | Circulation) => {
    if (activeFilter === 'Available') {
      const book = item as Book;
      return (
        <div key={book.id} className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h3 className="font-semibold text-neutral-800">{book.title}</h3>
              <p className="text-sm text-neutral-600">by {book.author}</p>
              <p className="text-sm text-neutral-500">DDC: <span className="font-medium">{book.ddc_number || 'N/A'}</span> | Available: <span className="font-medium text-green-600">{book.available_copies}</span></p>
            </div>
          </div>
        </div>
      );
    }
    const circ = item as Circulation;
    return (
      <div key={circ.id} className="border rounded-lg p-4 bg-white shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h3 className="font-semibold text-neutral-800">{circ.books?.title}</h3>
            <p className="text-sm text-neutral-600">by <span className="font-medium">{circ.members?.name}</span></p>
            <p className="text-sm text-neutral-500">DDC: <span className="font-medium">{circ.books?.ddc_number || 'N/A'}</span></p>
            <p className={`text-sm ${new Date(circ.due_date) < new Date() ? 'text-accent-dark font-semibold' : 'text-neutral-500'}`}>Due: {new Date(circ.due_date).toLocaleDateString()}</p>
          </div>
          <div className="flex gap-2 self-start sm:self-auto">
            <button onClick={() => handleRenewBook(circ.id)} className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors flex items-center gap-1"><RefreshCw size={14}/> Renew</button>
            <button onClick={() => handleReturnBook(circ.id)} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors">Return</button>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-neutral-50">
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        title={confirmation.title}
        message={confirmation.message}
        onConfirm={handleConfirmation}
        onCancel={() => setConfirmation({ ...confirmation, isOpen: false })}
        isConfirming={isConfirming}
      />
      <header className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-secondary-dark flex items-center gap-2">
                <div className="bg-primary p-1.5 rounded text-white"><BookOpen size={20} /></div>
                Admin Dashboard
            </h1>
            <div className="flex items-center gap-4">
              <button onClick={() => setShowPrintMembersModal(true)} className="text-neutral-600 hover:text-neutral-900" title="Print Members"><Printer size={20} /></button>
              <button onClick={handleLogout} className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"><LogOut size={18} /> <span className="hidden sm:inline">Logout</span></button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="flex flex-col md:flex-row max-w-screen-2xl mx-auto">
        {/* Sidebar Navigation */}
        <nav className="w-full md:w-64 bg-white border-r border-neutral-200 min-h-[calc(100vh-64px)] hidden md:block">
            <div className="p-4 space-y-1">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                            activeTab === tab.id 
                            ? 'bg-primary/10 text-primary-dark' 
                            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                        }`}
                    >
                        <tab.icon size={18} />
                        {tab.id === 'Penalty' ? 'Penalty Management' : tab.id}
                    </button>
                ))}
            </div>
        </nav>

        {/* Mobile Navigation */}
        <nav className="md:hidden bg-white border-b overflow-x-auto">
            <div className="flex p-2 space-x-2 min-w-max">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                            activeTab === tab.id 
                            ? 'bg-primary text-white' 
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                    >
                        <tab.icon size={16} />
                        {tab.id === 'Penalty' ? 'Penalty' : tab.id}
                    </button>
                ))}
            </div>
        </nav>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {activeTab === 'Circulation' && (<div className="space-y-6"><div className="flex justify-between items-center flex-wrap gap-4"><h2 className="text-2xl font-bold">Borrow & Return Books</h2><div className="flex gap-2"><button onClick={() => setShowScanModal(true)} className="bg-white border border-primary text-primary hover:bg-primary/10 px-4 py-2 rounded-lg flex items-center gap-2"><QrCode size={20} /> Scan QR</button><button onClick={() => setShowIssueModal(true)} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={20} /> Issue Book</button></div></div><div className="flex flex-wrap gap-2">{(['Available', 'Issued', 'Overdue'] as BookStatusFilter[]).map(filter => <button key={filter} onClick={() => setActiveFilter(filter)} className={`px-4 py-2 rounded-lg font-medium ${activeFilter === filter ? 'bg-primary text-white' : 'bg-neutral-200'}`}>{filter} ({counts[filter.toLowerCase() as keyof typeof counts]})</button>)}</div><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} /><input type="text" placeholder="Search books, members, DDC..." value={circulationSearch} onChange={(e) => setCirculationSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg"/></div><div className="bg-neutral-100 rounded-lg p-4 sm:p-6 min-h-[400px]">{loading ? <div className="flex justify-center pt-10"><Spinner /></div> : <div className="space-y-4">{circulationData.map(renderCirculationItem)}</div>}</div></div>)}
            
            {activeTab === 'Book Collection' && (<div className="space-y-6"><div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-neutral-200"><div className="flex justify-between items-center mb-4 flex-wrap gap-2"><h3 className="text-xl font-bold text-secondary-dark flex items-center gap-2"><BookOpen size={22} /> Book Collection</h3><div className="flex gap-2 flex-wrap"><button onClick={() => setShowAddBookModal(true)} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"><Plus size={16} /> Add Book</button><button onClick={() => setShowManageCategoriesModal(true)} className="bg-secondary hover:bg-secondary-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"><Folder size={16} /> Manage Categories</button><button onClick={() => setShowBulkQRModal(true)} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"><Download size={16} /> Bulk Download QRs</button></div></div><div className="relative mb-4"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} /><input type="text" placeholder="Search by title, author, category, DDC..." value={bookSearch} onChange={(e) => setBookSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg"/></div><div className="flex justify-between items-center mb-4 flex-wrap gap-4"><div className="flex items-center gap-2"><label htmlFor="book-rows-per-page" className="text-sm text-neutral-600">Rows per page:</label><select id="book-rows-per-page" value={bookRowsPerPage} onChange={e => setBookRowsPerPage(Number(e.target.value))} className="px-2 py-1 border border-neutral-300 rounded-md bg-white text-sm focus:ring-1 focus:ring-primary-light"><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option><option value={200}>200</option><option value={400}>400</option></select></div></div><div className="overflow-x-auto">{loading ? <div className="flex justify-center pt-10"><Spinner /></div> : <><table id="book-collection-table" className="min-w-full divide-y divide-neutral-200"><thead className="bg-neutral-50 sticky top-0"><tr><th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">S.No.</th><th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Title</th><th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Author</th><th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Category</th><th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">DDC</th><th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Copies</th><th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase no-print-in-popup">Actions</th></tr></thead><tbody className="bg-white divide-y divide-neutral-200">{paginatedBooks.map((book, index) => (<tr key={book.id}><td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-500">{(bookCurrentPage - 1) * bookRowsPerPage + index + 1}</td><td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">{book.title}</td><td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-500">{book.author}</td><td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-500">{book.categories?.name || 'N/A'}</td><td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-500">{book.ddc_number || 'N/A'}</td><td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-500">{book.available_copies} / {book.total_copies}</td><td className="px-4 py-4 whitespace-nowrap text-sm font-medium no-print-in-popup"><div className="flex items-center gap-4"><button onClick={() => { setEditingBook(book); setShowBookModal(true); }} className="text-primary hover:text-primary-dark" title="Edit Book"><Edit size={18} /></button><button onClick={() => handleDeleteBook(book.id)} className="text-accent hover:text-accent-dark" title="Delete Book"><Trash2 size={18} /></button><button onClick={() => handleShowQR(book)} className="text-neutral-500 hover:text-primary" title="Show QR Code"><QrCode size={18} /></button></div></td></tr>))}</tbody></table><Pagination currentPage={bookCurrentPage} totalCount={filteredBooks.length} pageSize={bookRowsPerPage} onPageChange={page => setBookCurrentPage(page)} /></>}</div></div></div>)}
            
            {activeTab === 'Members' && (<div className="space-y-6"><div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"><h2 className="text-2xl font-bold">Library Members</h2><div className="flex gap-2"><button onClick={() => setShowPrintMembersModal(true)} className="bg-white border border-primary text-primary hover:bg-primary/10 px-4 py-2 rounded-lg flex items-center gap-2"><Printer size={20} /> Print List</button><button onClick={() => { setEditingMember(null); setShowMemberModal(true); }} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={20} /> Add Member</button></div></div><div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6"><div className="mb-4"><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} /><input type="text" placeholder="Search by name, email, register no, or class..." value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg"/></div></div>{loading ? <div className="flex justify-center pt-10"><Spinner /></div> : filteredMembers.length > 0 ? (<div className="overflow-x-auto"><table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Register ID</th><th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Name</th><th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Phone</th><th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Class</th><th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase no-print-in-popup">Actions</th></tr></thead>
            <tbody className="bg-white divide-y divide-neutral-200">{filteredMembers.map((member) => (<tr key={member.id}><td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">{member.register_number || 'N/A'}</td><td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-500">{member.name}</td><td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-500">{member.phone || 'N/A'}</td><td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-500">{member.class || 'N/A'}</td><td className="px-4 py-4 whitespace-nowrap text-sm font-medium no-print-in-popup"><div className="flex gap-4"><button onClick={() => { setEditingMember(member); setShowMemberModal(true); }} className="text-primary hover:text-primary-dark"><Edit size={18} /></button><button onClick={() => handleDeleteMember(member.id)} className="text-accent hover:text-accent-dark"><Trash2 size={18} /></button></div></td></tr>))}</tbody></table></div>) : <div className="text-center py-10"><Users size={40} className="mx-auto text-neutral-300" /><p className="mt-2 text-neutral-500">No members found.</p></div>}</div></div>)}
            
            {activeTab === 'Penalty' && <FinesPage />}
            
            {activeTab === 'Feedback' && (<div className="space-y-6"><h2 className="text-2xl font-bold">Feedback & Suggestions</h2><div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">{loading ? <div className="flex justify-center pt-10"><Spinner /></div> : feedback.length > 0 ? (<div className="space-y-4">{feedback.map(item => (<div key={item.id} className="border rounded-lg p-4"><div className="flex justify-between items-start"><div>{item.feedback_type === 'suggestion' ? <h3 className="font-semibold text-lg">Suggestion: "{item.suggestion_title}"</h3> : <h3 className="font-semibold text-lg">Review for: "{item.books?.title}"</h3>}<p className="text-sm text-neutral-500">By: {item.members?.name || 'Unknown'}</p></div><span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : item.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.status}</span></div>{item.feedback_type === 'book_review' && item.rating && (<div className="flex items-center gap-1 mt-2">{[...Array(5)].map((_, i) => (<Star key={i} size={16} className={i < item.rating! ? 'text-yellow-400 fill-current' : 'text-neutral-300'} />))}</div>)}{item.review && <p className="mt-2 text-neutral-700">{item.review}</p>}{item.suggestion_reason && <p className="mt-2 text-neutral-700">{item.suggestion_reason}</p>}{item.status === 'pending' && (<div className="flex gap-2 mt-4"><button onClick={() => updateFeedbackStatus(item.id, 'approved')} className="text-sm bg-green-600 text-white px-3 py-1 rounded">Approve</button><button onClick={() => updateFeedbackStatus(item.id, 'rejected')} className="text-sm bg-red-600 text-white px-3 py-1 rounded">Reject</button></div>)}</div>))}</div>) : <div className="text-center py-10"><Folder size={40} className="mx-auto text-neutral-300" /><p className="mt-2 text-neutral-500">No feedback submitted yet.</p></div>}</div></div>)}
            
            {activeTab === 'Reports' && <ReportsPage books={books} members={members} circulation={circulation} categories={categories} />}
            
            {activeTab === 'Read With Us' && <ReadWithUsManager />}
        </main>
      </div>

      {showMemberModal && <MemberModal member={editingMember} onClose={() => { setShowMemberModal(false); setEditingMember(null); }} onSave={() => { setShowMemberModal(false); setEditingMember(null); }} />}
      {showIssueModal && <IssueBookModal onClose={() => setShowIssueModal(false)} onSave={() => setShowIssueModal(false)} />}
      {showScanModal && <ScanQRModal onClose={() => setShowScanModal(false)} onSuccess={fetchData} />}
      {showBookQRModal && selectedBookForQR && <BookQRCodeModal book={selectedBookForQR} onClose={() => setShowBookQRModal(false)} />}
      {showBulkQRModal && <BulkQRDownloadModal onClose={() => setShowBulkQRModal(false)} />}
      {showBookModal && <BookModal book={editingBook} categories={categories} onClose={() => { setShowBookModal(false); setEditingBook(null); }} onSave={() => { setShowBookModal(false); setEditingBook(null); }} />}
      {showAddBookModal && <AddBookModal categories={categories} onSave={fetchData} onClose={() => setShowAddBookModal(false)} />}
      {showManageCategoriesModal && <CategoryManager onClose={() => setShowManageCategoriesModal(false)} onSave={fetchData} />}
      {showPrintMembersModal && <PrintMembersModal onClose={() => setShowPrintMembersModal(false)} allMembers={members} />}
    </div>
  );
};

export default AdminDashboard;
