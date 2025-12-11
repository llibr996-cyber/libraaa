import React, { useState, useEffect, useCallback } from 'react';
import { supabase, type Circulation } from '../lib/supabase';
import { Loader2, Printer, AlertTriangle, Search, Folder } from 'lucide-react';

type ActivityRecord = Circulation & {
  books: { title: string } | null;
  members: { name: string; class: string | null } | null;
};

const MemberActivityReport: React.FC = () => {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'issued' | 'returned' | 'overdue'>('all');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('circulation')
        .select('*, books(title), members(name, class)')
        .order('issue_date', { ascending: false });

      if (error) throw error;
      setActivities(data as ActivityRecord[] || []);
    } catch (err: any) {
      console.error('Error fetching member activity:', err);
      setError('Failed to load member activity data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePrint = () => {
    const printContent = document.getElementById('activity-report-printable')?.innerHTML;
    if (!printContent) return;

    const printWindow = window.open('', '', 'height=800,width=1000');
    if (printWindow) {
        printWindow.document.write('<html><head><title>Member Activity Report</title>');
        printWindow.document.write(`
            <style>
              body { font-family: sans-serif; padding: 2rem; }
              h1 { font-size: 24px; margin-bottom: 1rem; text-align: center; }
              table { width: 100%; border-collapse: collapse; font-size: 10px; }
              th, td { border: 1px solid #d1d5db; padding: 6px; text-align: left; }
              th { background-color: #f3f4f6; }
              .status-returned { color: #059669; }
              .status-issued { color: #3b82f6; }
              .status-overdue { color: #ef4444; font-weight: bold; }
              .no-print { display: none; }
            </style>
        `);
        printWindow.document.write('</head><body><h1>Member Activity Report</h1>');
        
        const table = document.getElementById('activity-report-printable')?.cloneNode(true) as HTMLElement;
        table.querySelectorAll('.no-print').forEach(el => el.remove());
        printWindow.document.write(table.innerHTML);

        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    }
  };

  const filteredActivities = activities
    .filter(item => {
      const isOverdue = item.status === 'issued' && new Date(item.due_date) < new Date();
      if (statusFilter === 'all') return true;
      if (statusFilter === 'overdue') return isOverdue;
      return item.status === statusFilter;
    })
    .filter(item => {
      if (!searchTerm) return true;
      const lowerSearch = searchTerm.toLowerCase();
      return (
        item.books?.title?.toLowerCase().includes(lowerSearch) ||
        item.members?.name?.toLowerCase().includes(lowerSearch) ||
        item.members?.class?.toLowerCase().includes(lowerSearch)
      );
    });

  const handleSelectRow = (id: string) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedRows(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === filteredActivities.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredActivities.map(item => item.id)));
    }
  };

  const getStatusElement = (item: ActivityRecord) => {
    const isOverdue = item.status === 'issued' && new Date(item.due_date) < new Date();
    if (isOverdue) {
      return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-accent/10 text-accent-dark status-overdue">Overdue</span>;
    }
    switch (item.status) {
      case 'returned':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary/10 text-primary-dark status-returned">Returned</span>;
      case 'issued':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 status-issued">Issued</span>;
      default:
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-neutral-100 text-neutral-800">{item.status}</span>;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-secondary-dark">Member Borrowing History</h3>
        <button onClick={handlePrint} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-primary-dark">
          <Printer size={16} /> Print Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 items-center mb-4 gap-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
          <input type="text" placeholder="Search by book, member, or class..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg"/>
        </div>
        <div className="flex items-center gap-2 bg-neutral-100 rounded-lg p-1 w-full sm:w-auto justify-self-start md:justify-self-end">
          {(['all', 'issued', 'returned', 'overdue'] as const).map(filter => (
            <button key={filter} onClick={() => setStatusFilter(filter)} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors capitalize w-full text-center ${statusFilter === filter ? 'bg-white text-primary shadow-sm' : 'text-neutral-600 hover:bg-neutral-200'}`}>{filter}</button>
          ))}
        </div>
      </div>

      <div id="activity-report-printable" className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center py-10"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : error ? (
          <div className="text-center py-10 text-red-500"><AlertTriangle className="mx-auto mb-2" />{error}</div>
        ) : filteredActivities.length > 0 ? (
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase no-print">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary"
                    checked={selectedRows.size === filteredActivities.length && filteredActivities.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">S.No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Book Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Issued Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Return Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Fine</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {filteredActivities.map((item, index) => (
                <tr key={item.id} className={selectedRows.has(item.id) ? 'bg-primary/5' : ''}>
                  <td className="px-4 py-4 whitespace-nowrap no-print">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary"
                      checked={selectedRows.has(item.id)}
                      onChange={() => handleSelectRow(item.id)}
                    />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-500">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">{item.books?.title || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{item.members?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{item.members?.class || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusElement(item)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{new Date(item.issue_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{item.return_date ? new Date(item.return_date).toLocaleDateString() : '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">₹{item.fine_amount?.toFixed(2) || '0.00'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-10"><Folder size={40} className="mx-auto text-neutral-300" /><p className="mt-2 text-neutral-500">No circulation history found for the selected criteria.</p></div>
        )}
      </div>
    </div>
  );
};

export default MemberActivityReport;
