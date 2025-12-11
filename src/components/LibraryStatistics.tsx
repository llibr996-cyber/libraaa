import React, { useMemo } from 'react';
import { Printer, Book, Users, Folder, AlertCircle, User, Star } from 'lucide-react';
import { type Book, type Member, type Circulation, type Category } from '../lib/supabase';

interface LibraryStatisticsProps {
  books: Book[];
  members: Member[];
  circulation: Circulation[];
  categories: Category[];
}

const StatCard: React.FC<{ icon: React.ElementType, value: string | number, label: string, color: string }> = ({ icon: Icon, value, label, color }) => (
  <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4">
    <div className={`p-3 rounded-full ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-neutral-800">{value}</p>
      <p className="text-sm font-medium text-neutral-500">{label}</p>
    </div>
  </div>
);

const LibraryStatistics: React.FC<LibraryStatisticsProps> = ({ books, members, circulation, categories }) => {
  const stats = useMemo(() => {
    const totalBooks = books.length;
    const totalCategories = categories.length;
    const totalMembers = members.length;
    
    const booksIssued = circulation.filter(c => c.status === 'issued').length;
    const booksOverdue = circulation.filter(c => c.status === 'issued' && new Date(c.due_date) < new Date()).length;
    
    const booksPerCategory = categories.map(cat => {
        const count = books.filter(b => b.category_id === cat.id).length;
        return { name: cat.name, count };
    }).sort((a, b) => b.count - a.count);

    const memberActivity = circulation.reduce((acc, curr) => {
        if (curr.member_id) {
            acc[curr.member_id] = (acc[curr.member_id] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const topMemberEntry = Object.entries(memberActivity).sort(([, a], [, b]) => b - a)[0];
    const topMember = topMemberEntry ? members.find(m => m.id === topMemberEntry[0]) : null;
    const topMemberCount = topMemberEntry ? topMemberEntry[1] : 0;

    const bookActivity = circulation.reduce((acc, curr) => {
        if (curr.book_id) {
            acc[curr.book_id] = (acc[curr.book_id] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const topBookEntry = Object.entries(bookActivity).sort(([, a], [, b]) => b - a)[0];
    const topBook = topBookEntry ? books.find(b => b.id === topBookEntry[0]) : null;
    const topBookCount = topBookEntry ? topBookEntry[1] : 0;

    return {
        totalBooks,
        totalCategories,
        totalMembers,
        booksIssued,
        booksOverdue,
        booksPerCategory,
        topMember: topMember ? { ...topMember, count: topMemberCount } : null,
        topBook: topBook ? { ...topBook, count: topBookCount } : null,
    };
  }, [books, members, circulation, categories]);

  const handlePrint = () => {
    const printContent = document.getElementById('statistics-printable-area')?.innerHTML;
    if (!printContent) return;

    const printWindow = window.open('', '', 'height=800,width=1000');
    if (printWindow) {
        printWindow.document.write('<html><head><title>Library Statistics Report</title>');
        printWindow.document.write(`
            <style>
              body { font-family: sans-serif; padding: 2rem; color: #334155; }
              h1 { font-size: 24px; margin-bottom: 2rem; text-align: center; color: #0f172a; }
              h2 { font-size: 18px; margin-top: 2rem; margin-bottom: 1rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; }
              .grid-container { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem; }
              .grid-item { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 1rem; border-radius: 0.5rem; text-align: center; }
              .grid-item strong { font-size: 2rem; color: #14B8A6; display: block; }
              table { width: 100%; border-collapse: collapse; font-size: 12px; }
              th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
              th { background-color: #f1f5f9; }
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-secondary-dark">Library Statistics</h3>
        <button onClick={handlePrint} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-primary-dark">
          <Printer size={16} /> Print Report
        </button>
      </div>

      <div id="statistics-printable-area">
        <h1 style={{ display: 'none' }}>Library Statistics Report</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard icon={Book} value={stats.totalBooks} label="Total Books" color="bg-primary" />
            <StatCard icon={Folder} value={stats.totalCategories} label="Total Categories" color="bg-blue-500" />
            <StatCard icon={Users} value={stats.totalMembers} label="Total Members" color="bg-yellow-500" />
            <StatCard icon={Book} value={stats.booksIssued} label="Books Currently Issued" color="bg-indigo-500" />
            <StatCard icon={AlertCircle} value={stats.booksOverdue} label="Books Overdue" color="bg-accent" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <div className="bg-white rounded-lg">
                <h2 className="text-lg font-semibold mb-4">Top Reader</h2>
                {stats.topMember ? (
                    <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg border">
                        <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full"><User size={24} /></div>
                        <div>
                            <p className="font-bold text-lg">{stats.topMember.name}</p>
                            <p className="text-sm text-neutral-500">{stats.topMember.class || 'N/A'} - Reg: {stats.topMember.register_number || 'N/A'}</p>
                        </div>
                        <p className="ml-auto text-2xl font-bold text-yellow-600">{stats.topMember.count} <span className="text-sm font-medium">books</span></p>
                    </div>
                ) : <p className="text-neutral-500">No borrowing activity recorded.</p>}
            </div>
            <div className="bg-white rounded-lg">
                <h2 className="text-lg font-semibold mb-4">Most Borrowed Book</h2>
                {stats.topBook ? (
                    <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg border">
                        <div className="p-3 bg-primary/20 text-primary-dark rounded-full"><Star size={24} /></div>
                        <div>
                            <p className="font-bold text-lg">{stats.topBook.title}</p>
                            <p className="text-sm text-neutral-500">by {stats.topBook.author}</p>
                        </div>
                        <p className="ml-auto text-2xl font-bold text-primary">{stats.topBook.count} <span className="text-sm font-medium">times</span></p>
                    </div>
                ) : <p className="text-neutral-500">No borrowing activity recorded.</p>}
            </div>
        </div>

        <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Books per Category</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Number of Books</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                        {stats.booksPerCategory.map(cat => (
                            <tr key={cat.name}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">{cat.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{cat.count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LibraryStatistics;
