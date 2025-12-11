import React, { useState } from 'react';
import { supabase, type Member } from '../lib/supabase';
import { Search, Loader2, User, BookOpen, AlertTriangle, KeyRound, Calendar, Check, XCircle, Clock, DollarSign } from 'lucide-react';
import Header from './Header';

interface HistoryItem {
    id: string;
    issue_date: string;
    due_date: string;
    return_date?: string;
    status: 'issued' | 'returned' | 'overdue' | 'lost';
    fine_amount: number;
    fine_status?: string;
    books: {
        title: string;
        author: string;
    } | null;
}

const MemberLookupPage: React.FC = () => {
    const [registerNumber, setRegisterNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [member, setMember] = useState<Member | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!registerNumber.trim()) return;

        setLoading(true);
        setError(null);
        setMember(null);
        setHistory([]);

        try {
            // Fetch member details
            const { data: memberData, error: memberError } = await supabase
                .from('members')
                .select('*')
                .eq('register_number', registerNumber.trim())
                .single();

            if (memberError || !memberData) {
                setError('No member found with this Register Number.');
                setLoading(false);
                return;
            }
            setMember(memberData);

            // Fetch COMPLETE history
            const { data: historyData, error: historyError } = await supabase
                .from('circulation')
                .select('id, issue_date, due_date, return_date, status, fine_amount, fine_status, books(title, author)')
                .eq('member_id', memberData.id)
                .order('issue_date', { ascending: false });
            
            if (historyError) throw historyError;
            setHistory(historyData as HistoryItem[]);

        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-100">
            <Header />
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-neutral-200">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-neutral-900">Member Status</h1>
                        <p className="mt-2 text-neutral-600">Enter your Register Number to view your complete borrowing history.</p>
                    </div>

                    <form onSubmit={handleSearch} className="mt-8 max-w-lg mx-auto">
                        <div className="relative">
                            <KeyRound className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
                            <input
                                type="text"
                                value={registerNumber}
                                onChange={(e) => setRegisterNumber(e.target.value)}
                                placeholder="Enter your Register Number (e.g., LIB-0001)"
                                className="w-full pl-12 pr-28 py-3 border border-neutral-300 rounded-full focus:ring-2 focus:ring-primary-light shadow-sm"
                            />
                            <button type="submit" disabled={loading} className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-white px-4 py-2 rounded-full font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50">
                                {loading ? <Loader2 className="animate-spin" /> : <Search size={20} />}
                            </button>
                        </div>
                    </form>
                </div>

                {error && (
                    <div className="mt-6 bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg flex items-center gap-3 animate-fade-in">
                        <AlertTriangle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                {member && (
                    <div className="mt-6 space-y-6 animate-fade-in">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
                            <h2 className="text-xl font-bold text-neutral-800 mb-4 flex items-center gap-3"><User className="text-primary" /> Member Details</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div className="bg-neutral-50 p-3 rounded-lg border"><strong>Name:</strong> <div className="text-lg">{member.name}</div></div>
                                <div className="bg-neutral-50 p-3 rounded-lg border"><strong>Register No:</strong> <div className="text-lg">{member.register_number}</div></div>
                                <div className="bg-neutral-50 p-3 rounded-lg border"><strong>Class:</strong> <div className="text-lg">{member.class || 'N/A'}</div></div>
                                <div className="bg-neutral-50 p-3 rounded-lg border"><strong>Status:</strong> <div className={`text-lg font-bold ${member.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>{member.status.toUpperCase()}</div></div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
                            <h2 className="text-xl font-bold text-neutral-800 mb-6 flex items-center gap-3"><Clock className="text-primary" /> Borrowing History ({history.length})</h2>
                            {history.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-neutral-200">
                                        <thead className="bg-neutral-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Book</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Issue Date</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Due Date</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Return Date</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Penalty</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-neutral-200">
                                            {history.map((item) => {
                                                const isOverdue = item.status === 'issued' && new Date(item.due_date) < new Date();
                                                const hasFine = item.fine_amount > 0;
                                                return (
                                                    <tr key={item.id} className="hover:bg-neutral-50">
                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                            <div className="font-medium text-neutral-900">{item.books?.title}</div>
                                                            <div className="text-xs text-neutral-500">{item.books?.author}</div>
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-500">{new Date(item.issue_date).toLocaleDateString()}</td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-500">{new Date(item.due_date).toLocaleDateString()}</td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-500">{item.return_date ? new Date(item.return_date).toLocaleDateString() : '-'}</td>
                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                            {item.status === 'returned' ? (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                    <Check size={12} /> Returned
                                                                </span>
                                                            ) : isOverdue ? (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                    <XCircle size={12} /> Overdue
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                    <BookOpen size={12} /> Issued
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                            {hasFine ? (
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-red-600">₹{item.fine_amount}</span>
                                                                    <span className="text-[10px] text-neutral-500 uppercase">{item.fine_status}</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-neutral-400">-</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-10 bg-neutral-50 rounded-lg border border-dashed">
                                    <BookOpen className="mx-auto h-10 w-10 text-neutral-300" />
                                    <p className="mt-2 text-neutral-500">No borrowing history found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default MemberLookupPage;
