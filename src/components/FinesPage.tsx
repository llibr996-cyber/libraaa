import React, { useState, useEffect, useCallback } from 'react';
import { supabase, type Circulation } from '../lib/supabase';
import { Search, Loader2, DollarSign } from 'lucide-react';

type FineRecord = Circulation & {
  books: { title: string } | null;
  members: { name: string } | null;
};

type FineFilter = 'all' | 'pending' | 'paid';

const FinesPage: React.FC = () => {
  const [fines, setFines] = useState<FineRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FineFilter>('pending');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchFines = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // For this implementation, "Pending" fines are those with a fine amount > 0.
      // "Paid" fines are not represented in the current DB schema, so that tab will be empty.
      // We only need to fetch records with a positive fine amount.
      const { data, error } = await supabase
        .from('circulation')
        .select('*, books(title), members(name)')
        .gt('fine_amount', 0)
        .order('due_date', { ascending: false });

      if (error) throw error;
      setFines(data as FineRecord[] || []);
    } catch (err: any) {
      console.error("Error fetching fines:", err);
      setError("Failed to load fines data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFines();
    const subscription = supabase.channel('public:circulation:fines')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'circulation' }, fetchFines)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchFines]);

  const handleMarkAsPaid = async (circulationId: string) => {
    if (window.confirm('Are you sure you want to mark this fine as paid? This will set the fine amount to zero.')) {
      setLoading(true);
      const { error } = await supabase
        .from('circulation')
        .update({ fine_amount: 0 })
        .eq('id', circulationId);
      
      if (error) {
        alert('Failed to update fine status: ' + error.message);
      }
      // The real-time subscription will handle refetching.
      setLoading(false);
    }
  };

  const filteredFines = fines
    .filter(fine => {
      if (filter === 'paid') return false; // No data for paid fines
      return true; // 'all' and 'pending' show the same data
    })
    .filter(fine => {
      if (!searchTerm) return true;
      const lowerSearch = searchTerm.toLowerCase();
      return (
        fine.members?.name?.toLowerCase().includes(lowerSearch) ||
        fine.books?.title?.toLowerCase().includes(lowerSearch)
      );
    });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Fines Management</h2>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
          <div className="relative w-full md:w-1/2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by member name, book title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            {(['all', 'pending', 'paid'] as FineFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${filter === f ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading && fines.length === 0 ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="animate-spin text-purple-600" size={32} />
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-500">{error}</div>
          ) : filteredFines.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <DollarSign size={40} className="mx-auto text-gray-300 mb-2" />
              {filter === 'paid' ? 'Paid fine records are not available.' : 'No pending fines found.'}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Book Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fine Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFines.map(fine => (
                  <tr key={fine.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{fine.members?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fine.books?.title || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{fine.fine_amount.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(fine.due_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Pending
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleMarkAsPaid(fine.id)}
                        disabled={loading}
                        className="text-white bg-green-600 hover:bg-green-700 font-semibold py-1 px-3 rounded-md text-xs disabled:bg-green-300"
                      >
                        Mark as Paid
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinesPage;
