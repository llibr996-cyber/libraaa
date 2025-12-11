import React, { useState, useEffect, useCallback } from 'react';
import { supabase, type Circulation } from '../lib/supabase';
import { Search, Loader2, DollarSign, AlertCircle, CheckCircle2, Calendar, Printer } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import ConfirmationModal from './ConfirmationModal';

type FineRecord = Circulation & {
  books: { title: string } | null;
  members: { name: string, phone?: string, register_number?: string } | null;
};

const FinesPage: React.FC = () => {
  const { addNotification } = useNotification();
  const [fines, setFines] = useState<FineRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'paid'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Confirmation for payment
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedFine, setSelectedFine] = useState<FineRecord | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchFines = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('circulation')
        .select('*, books(title), members(name, phone, register_number)')
        .order('due_date', { ascending: false });

      if (error) throw error;
      setFines(data as FineRecord[] || []);
    } catch (err: any) {
      console.error("Error fetching fines:", err);
      addNotification("Failed to load fines data.", 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchFines();
    const subscription = supabase.channel('public:circulation:fines')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'circulation' }, fetchFines)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchFines]);

  const calculateDynamicFine = (dueDateStr: string) => {
    const today = new Date();
    const due = new Date(dueDateStr);
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    if (today > due) {
      const diffTime = Math.abs(today.getTime() - due.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays * 1; // 1 Rupee per day
    }
    return 0;
  };

  const filteredFines = fines.filter(fine => {
    const isOverdue = new Date(fine.due_date) < new Date();
    const dynamicFine = calculateDynamicFine(fine.due_date);
    
    // Determine if a fine is pending
    // 1. Issued and overdue
    // 2. Returned but fine_status is 'unpaid' (and fine_amount > 0)
    const isPending = (fine.status === 'issued' && isOverdue && dynamicFine > 0) || 
                      (fine.status === 'returned' && fine.fine_amount > 0 && fine.fine_status === 'unpaid');

    // Determine if a fine is paid
    const isPaid = fine.fine_status === 'paid';

    if (activeTab === 'pending') {
      return isPending;
    } else {
      return isPaid;
    }
  }).filter(fine => {
    if (!searchTerm) return true;
    const lowerSearch = searchTerm.toLowerCase();
    return (
      fine.members?.name?.toLowerCase().includes(lowerSearch) ||
      fine.members?.register_number?.toLowerCase().includes(lowerSearch) ||
      fine.books?.title?.toLowerCase().includes(lowerSearch)
    );
  });

  const totalPendingAmount = fines
    .filter(f => (f.status === 'issued' && new Date(f.due_date) < new Date()) || (f.status === 'returned' && f.fine_amount > 0 && f.fine_status === 'unpaid'))
    .reduce((sum, f) => {
        if (f.status === 'issued') return sum + calculateDynamicFine(f.due_date);
        return sum + (f.fine_amount || 0);
    }, 0);

  const handlePayFine = async () => {
    if (!selectedFine) return;
    setIsProcessing(true);
    
    try {
      // If book is still issued, we can't fully close it, but user wants to pay.
      // Usually, you return the book first. But if they pay fine while book is issued, 
      // we might need complex logic. For simplicity, we assume they return book first or we just mark fine paid.
      // However, the requirement says "book return maaduvaga fine clear aagvudu beda" (fine shouldn't clear on return).
      // So the flow is: Return Book -> Fine Calculated & Stored as 'unpaid' -> Pay Fine here.
      
      if (selectedFine.status === 'issued') {
        addNotification("Please return the book before paying the fine.", 'error');
        setIsProcessing(false);
        setConfirmOpen(false);
        return;
      }

      const { error } = await supabase
        .from('circulation')
        .update({ fine_status: 'paid' })
        .eq('id', selectedFine.id);

      if (error) throw error;
      addNotification("Fine marked as paid.", 'success');
      fetchFines();
    } catch (error: any) {
      addNotification(`Error paying fine: ${error.message}`, 'error');
    } finally {
      setIsProcessing(false);
      setConfirmOpen(false);
      setSelectedFine(null);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('fine-print-area')?.innerHTML;
    if (!printContent) return;
    const printWindow = window.open('', '', 'height=800,width=1000');
    if (printWindow) {
        printWindow.document.write('<html><head><title>Penalty Report</title>');
        printWindow.document.write('<style>body{font-family:sans-serif;padding:20px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ddd;padding:8px;text-align:left;}th{background-color:#f2f2f2;}h1{text-align:center;}</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(`<h1>Penalty Report - ${activeTab === 'pending' ? 'Pending' : 'Paid'}</h1>`);
        printWindow.document.write(printContent);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      <ConfirmationModal 
        isOpen={confirmOpen}
        title="Confirm Payment"
        message={`Are you sure you want to mark the fine of ₹${selectedFine?.fine_amount} for "${selectedFine?.books?.title}" as PAID?`}
        onConfirm={handlePayFine}
        onCancel={() => setConfirmOpen(false)}
        isConfirming={isProcessing}
        confirmText="Mark as Paid"
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-neutral-800">Penalty Management</h2>
            <p className="text-neutral-500 text-sm">Track overdue books and collected penalties.</p>
        </div>
        <div className="flex gap-4">
            <button onClick={handlePrint} className="bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm">
                <Printer size={20} /> Print
            </button>
            <div className="bg-red-50 border border-red-100 px-4 py-2 rounded-lg flex items-center gap-3">
                <div className="bg-red-100 p-2 rounded-full text-red-600"><AlertCircle size={20} /></div>
                <div>
                    <p className="text-xs text-red-600 font-semibold uppercase">Total Pending</p>
                    <p className="text-xl font-bold text-red-700">₹{totalPendingAmount.toFixed(2)}</p>
                </div>
            </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex bg-neutral-100 p-1 rounded-lg w-full md:w-auto">
            <button 
                onClick={() => setActiveTab('pending')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'pending' ? 'bg-white text-red-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
                Pending Penalties
            </button>
            <button 
                onClick={() => setActiveTab('paid')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'paid' ? 'bg-white text-green-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
                Paid History
            </button>
          </div>

          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
            <input
              type="text"
              placeholder="Search member or book..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>
        </div>

        <div className="overflow-x-auto" id="fine-print-area">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : filteredFines.length === 0 ? (
            <div className="text-center py-16 bg-neutral-50 rounded-lg border border-dashed border-neutral-200">
              <DollarSign size={48} className="mx-auto text-neutral-300 mb-3" />
              <p className="text-lg font-medium text-neutral-600">No records found</p>
              <p className="text-neutral-400 text-sm">
                {activeTab === 'pending' ? 'Great! No pending penalties.' : 'No payment history available.'}
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Member Details</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Book Title</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    {activeTab === 'pending' ? 'Days Overdue' : 'Returned On'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Fine Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider no-print">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {filteredFines.map(fine => {
                    const dynamicFine = calculateDynamicFine(fine.due_date);
                    // If returned, use stored fine amount. If issued, use dynamic.
                    const displayAmount = fine.status === 'returned' ? fine.fine_amount : dynamicFine;
                    const daysOverdue = Math.ceil(Math.abs(new Date().getTime() - new Date(fine.due_date).getTime()) / (1000 * 60 * 60 * 24));

                    return (
                      <tr key={fine.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                                <span className="font-semibold text-neutral-900">{fine.members?.name || 'Unknown'}</span>
                                <span className="text-xs text-neutral-500">{fine.members?.register_number}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{fine.books?.title || 'Unknown Book'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 flex items-center gap-2">
                            <Calendar size={14} className="text-neutral-400"/>
                            {new Date(fine.due_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                            {fine.status === 'issued' ? `${daysOverdue} Days (Issued)` : (fine.return_date ? new Date(fine.return_date).toLocaleDateString() : '-')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-lg font-bold text-neutral-800">₹{displayAmount.toFixed(2)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap no-print">
                          {activeTab === 'pending' ? (
                            fine.status === 'returned' ? (
                                <button 
                                    onClick={() => { setSelectedFine(fine); setConfirmOpen(true); }}
                                    className="px-4 py-1.5 bg-green-600 text-white text-xs font-bold rounded-md hover:bg-green-700 shadow-sm transition-colors"
                                >
                                    Pay Now
                                </button>
                            ) : (
                                <span className="text-xs text-neutral-400 italic">Return book first</span>
                            )
                          ) : (
                            <span className="flex items-center gap-1 text-green-600 font-semibold text-sm">
                              <CheckCircle2 size={16} /> Paid
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinesPage;
