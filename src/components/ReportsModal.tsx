import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { X, Loader2, BarChart2, Users, BookOpen, AlertTriangle, Search, ArrowLeft, TrendingUp, Trophy, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface ReportsModalProps {
  onClose: () => void;
}

type ReportTab = 'Most Read' | 'Most Active';
type TimeFilter = 'all' | 'year' | 'month' | 'week';

interface DetailView {
  type: 'book' | 'member';
  item: any;
}

const ReportsModal: React.FC<ReportsModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('Most Read');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSetupError, setIsSetupError] = useState(false);
  
  const [mostRead, setMostRead] = useState<any[]>([]);
  const [mostActive, setMostActive] = useState<any[]>([]);

  const [detailView, setDetailView] = useState<DetailView | null>(null);
  const [detailData, setDetailData] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchReportData = useCallback(async () => {
    if (detailView) return;

    setLoading(true);
    setError(null);
    setIsSetupError(false);

    try {
      const functionName = activeTab === 'Most Read' ? 'get_most_read_books' : 'get_most_active_members';
      const { data, error } = await supabase.rpc(functionName, { time_filter: timeFilter });

      if (error) throw error;

      if (activeTab === 'Most Read') {
        setMostRead(data || []);
      } else {
        setMostActive(data || []);
      }

    } catch (err: any) {
      console.error(`Error fetching ${activeTab} report:`, err);
      
      if (
        err.message.includes('Could not find the function') || 
        err.message.includes('does not exist') || 
        err.code === '42883' || // Undefined function
        err.code === '42501'    // Permission denied
      ) {
        setError("Reporting features are not fully set up.");
        setIsSetupError(true);
      } else {
        setError(err.message || `Failed to fetch ${activeTab} report.`);
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab, timeFilter, detailView]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const fetchDetailData = useCallback(async () => {
    if (!detailView) return;
    
    setDetailLoading(true);
    setError(null);
    try {
      if (detailView.type === 'book') {
        const { data, error } = await supabase
            .from('circulation')
            .select('id, issue_date, members(name, class, register_number)')
            .eq('book_id', detailView.item.book_id)
            .order('issue_date', { ascending: false });
        if (error) throw error;
        setDetailData(data || []);
      } else { // 'member'
        const { data, error } = await supabase
            .from('circulation')
            .select('id, issue_date, books(title, author, ddc_number)')
            .eq('member_id', detailView.item.member_id)
            .order('issue_date', { ascending: false });
        if (error) throw error;
        setDetailData(data || []);
      }
    } catch (err: any) {
      console.error('Error fetching detail data:', err);
      setError(err.message || 'Failed to fetch details.');
    } finally {
      setDetailLoading(false);
    }
  }, [detailView]);

  useEffect(() => {
    fetchDetailData();
  }, [fetchDetailData]);

  const handleItemClick = (type: 'book' | 'member', item: any) => {
    setDetailView({ type, item });
  };
  
  const handleBack = () => {
    setDetailView(null);
    setDetailData([]);
    setError(null);
    setSearchTerm('');
  };

  const EmptyState = ({ icon: Icon, message }: { icon: React.ElementType, message: string }) => (
    <div className="text-center text-neutral-400 py-12 flex flex-col items-center h-full justify-center animate-fade-in">
      <div className="bg-neutral-800 p-4 rounded-full mb-4">
        <Icon className="w-8 h-8 text-neutral-500" />
      </div>
      <p className="text-lg font-medium">{message}</p>
    </div>
  );

  const filterData = (data: any[]) => {
    if (!searchTerm) return data;
    const lowerSearch = searchTerm.toLowerCase();

    if (activeTab === 'Most Read' || (detailView?.type === 'member')) {
      return data.filter(item => item.title?.toLowerCase().includes(lowerSearch) || item.books?.title?.toLowerCase().includes(lowerSearch) || item.author?.toLowerCase().includes(lowerSearch) || item.books?.author?.toLowerCase().includes(lowerSearch));
    }
    if (activeTab === 'Most Active' || (detailView?.type === 'book')) {
      return data.filter(item => item.name?.toLowerCase().includes(lowerSearch) || item.members?.name?.toLowerCase().includes(lowerSearch) || item.class?.toLowerCase().includes(lowerSearch) || item.members?.class?.toLowerCase().includes(lowerSearch) || item.register_number?.toLowerCase().includes(lowerSearch) || item.members?.register_number?.toLowerCase().includes(lowerSearch));
    }
    return data;
  };
  
  const renderListView = () => {
    let data, emptyIcon, emptyMessage;
    switch (activeTab) {
      case 'Most Read':
        data = mostRead; emptyIcon = BarChart2; emptyMessage = "No borrowing data available for this period.";
        break;
      case 'Most Active':
        data = mostActive; emptyIcon = Users; emptyMessage = "No active readers found for this period.";
        break;
    }

    const filteredData = filterData(data);

    if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" size={40} /></div>;
    
    if (error) return (
      <div className="text-center text-accent-light py-10 flex flex-col items-center justify-center h-64 animate-fade-in">
        <div className="bg-red-900/20 p-4 rounded-full mb-4">
            <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <p className="font-bold text-white text-xl mb-2">Setup Required</p>
        <p className="text-sm text-neutral-400 mb-6 max-w-md px-4">
            {isSetupError 
                ? "The database functions for reports are missing or need permissions." 
                : error}
        </p>
        
        {isSetupError && (
          <Link 
            to="/setup-guide" 
            onClick={onClose}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-bold transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            Fix Database Setup
          </Link>
        )}
      </div>
    );

    if (filteredData.length === 0) return <EmptyState icon={emptyIcon} message={searchTerm ? "No results match your search." : emptyMessage} />;

    return (
      <ul className="space-y-3">
        {filteredData.map((item, index) => {
          const isTop3 = index < 3;
          const rankColor = index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-amber-600' : 'text-neutral-500';
          
          if (activeTab === 'Most Read') {
            return (
              <motion.li 
                key={item.book_id || index} 
                onClick={() => handleItemClick('book', item)} 
                className={`flex items-center justify-between p-4 rounded-xl transition-all cursor-pointer border group ${isTop3 ? 'bg-neutral-800/80 border-neutral-700 hover:bg-neutral-700' : 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800'}`}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex items-center justify-center w-8 h-8 font-bold text-lg ${rankColor}`}>
                    {isTop3 ? <Trophy size={20} /> : index + 1}
                  </div>
                  <div className="p-3 bg-neutral-800 rounded-lg group-hover:bg-neutral-700 transition-colors">
                    <BookOpen className="text-primary" size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-neutral-100 text-lg group-hover:text-primary transition-colors">{item.title}</p>
                    <p className="text-sm text-neutral-400">by {item.author}</p>
                  </div>
                </div>
                <div className="text-right pl-4">
                    <div className="flex flex-col items-end">
                        <span className="font-bold text-2xl text-white">{item.read_count}</span>
                        <span className="text-xs font-medium text-primary uppercase tracking-wider">Reads</span>
                    </div>
                </div>
              </motion.li>
            );
          }
          if (activeTab === 'Most Active') {
            return (
              <motion.li 
                key={item.member_id || index} 
                onClick={() => handleItemClick('member', item)} 
                className={`flex items-center justify-between p-4 rounded-xl transition-all cursor-pointer border group ${isTop3 ? 'bg-neutral-800/80 border-neutral-700 hover:bg-neutral-700' : 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800'}`}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex items-center justify-center w-8 h-8 font-bold text-lg ${rankColor}`}>
                    {isTop3 ? <Trophy size={20} /> : index + 1}
                  </div>
                  <div className="p-3 bg-neutral-800 rounded-lg group-hover:bg-neutral-700 transition-colors">
                    <Users className="text-accent" size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-neutral-100 text-lg group-hover:text-accent transition-colors">{item.name}</p>
                    <p className="text-sm text-neutral-400 flex items-center gap-2">
                        <span className="bg-neutral-800 px-2 py-0.5 rounded text-xs">{item.class || 'N/A'}</span>
                        <span>#{item.register_number || 'N/A'}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right pl-4">
                    <div className="flex flex-col items-end">
                        <span className="font-bold text-2xl text-white">{item.book_count}</span>
                        <span className="text-xs font-medium text-accent uppercase tracking-wider">Books</span>
                    </div>
                </div>
              </motion.li>
            );
          }
          return null;
        })}
      </ul>
    );
  };

  const renderDetailView = () => {
    if (!detailView) return null;
    const filteredDetailData = filterData(detailData);

    if (detailLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" size={40} /></div>;
    if (error) return <div className="text-center text-accent-light py-10 flex flex-col items-center"><AlertTriangle className="w-12 h-12 text-accent mb-4" /><p className="font-semibold text-white">An Error Occurred</p><p className="text-sm text-neutral-400">{error}</p></div>;
    if (filteredDetailData.length === 0) return <EmptyState icon={Users} message={searchTerm ? "No results match your search." : "No activity data found."} />;

    return (
      <ul className="space-y-2">
        {filteredDetailData.map((item, index) => (
          <motion.li 
            key={item.id || index} 
            className="flex items-center justify-between p-4 bg-neutral-800/40 border border-neutral-800 rounded-lg hover:bg-neutral-800 transition-colors"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
          >
            {detailView.type === 'book' ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-neutral-700 rounded-full flex items-center justify-center text-neutral-300 font-bold">
                    {item.members.name.charAt(0)}
                </div>
                <div>
                    <p className="font-semibold text-neutral-200">{item.members.name}</p>
                    <p className="text-sm text-neutral-500">{item.members.class || 'N/A'} • Reg: {item.members.register_number || 'N/A'}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-neutral-700 rounded-lg flex items-center justify-center text-neutral-300">
                    <BookOpen size={18} />
                </div>
                <div>
                    <p className="font-semibold text-neutral-200">{item.books.title}</p>
                    <p className="text-sm text-neutral-500">by {item.books.author}</p>
                </div>
              </div>
            )}
            <div className="text-right text-sm text-neutral-400 flex items-center gap-2">
                <Calendar size={14} />
                {new Date(item.issue_date).toLocaleDateString()}
            </div>
          </motion.li>
        ))}
      </ul>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-neutral-900 border border-neutral-700 text-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="flex justify-between items-center p-6 border-b border-neutral-800 bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-lg">
                <TrendingUp className="text-primary" size={24}/>
            </div>
            <div>
                <h2 className="text-xl font-bold text-white">Library Insights</h2>
                <p className="text-xs text-neutral-400">Real-time analytics and reports</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-full transition-colors text-neutral-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        <AnimatePresence mode="wait">
        {!detailView ? (
          <motion.div key="list-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="border-b border-neutral-800 bg-neutral-900/30">
              <nav className="flex gap-6 px-6">
                {(['Most Read', 'Most Active'] as ReportTab[]).map(tab => (
                  <button 
                    key={tab} 
                    onClick={() => { setActiveTab(tab); setSearchTerm(''); }} 
                    className={`py-4 px-2 font-medium text-sm transition-all relative ${activeTab === tab ? 'text-primary' : 'text-neutral-400 hover:text-white'}`}
                  >
                    {tab}
                    {activeTab === tab && (
                        <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </motion.div>
        ) : (
          <motion.div key="detail-view-header" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 border-b border-neutral-800 bg-neutral-900/30">
            <button onClick={handleBack} className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-light px-2 py-1 rounded hover:bg-primary/10 transition-colors w-fit">
                <ArrowLeft size={16} /> Back to Reports
            </button>
          </motion.div>
        )}
        </AnimatePresence>

        <div className="p-6 flex-grow overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
          <motion.div
            key={detailView ? `detail-${detailView.type}-${detailView.item.id}` : `list-${activeTab}-${timeFilter}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {detailView ? (
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-1">{detailView.type === 'book' ? detailView.item.title : detailView.item.name}</h3>
                <p className="text-neutral-400">{detailView.type === 'book' ? 'Reader History' : 'Reading History'}</p>
              </div>
            ) : null}

            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
              <div className="relative w-full md:w-1/2 group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 group-focus-within:text-primary transition-colors" size={20} />
                <input 
                    type="text" 
                    placeholder="Search in results..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                />
              </div>
              {!detailView && (
                <div className="flex items-center gap-1 bg-neutral-800 p-1 rounded-xl w-full sm:w-auto">
                  {(['all', 'year', 'month', 'week'] as TimeFilter[]).map(filter => (
                    <button 
                        key={filter} 
                        onClick={() => setTimeFilter(filter)} 
                        className={`flex-1 px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${timeFilter === filter ? 'bg-neutral-700 text-white shadow-md' : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-700/50'}`}
                    >
                        {filter}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="mt-4">
              {detailView ? renderDetailView() : renderListView()}
            </div>
          </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default ReportsModal;
