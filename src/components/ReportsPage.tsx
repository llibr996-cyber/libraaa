import React, { useState } from 'react';
import LibraryStatistics from './LibraryStatistics';
import MemberActivityReport from './MemberActivityReport';
import { FileText, Users } from 'lucide-react';
import { type Book, type Member, type Circulation, type Category } from '../lib/supabase';

interface ReportsPageProps {
  books: Book[];
  members: Member[];
  circulation: Circulation[];
  categories: Category[];
}

type ReportTab = 'Statistics' | 'Member Activity';

const ReportsPage: React.FC<ReportsPageProps> = (props) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('Statistics');

  const tabs: { name: ReportTab, icon: React.ElementType }[] = [
    { name: 'Statistics', icon: FileText },
    { name: 'Member Activity', icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-secondary-dark">Comprehensive Reports</h2>
      </div>
      
      <div className="flex border-b border-neutral-200">
        {tabs.map(tab => (
          <button
            key={tab.name}
            onClick={() => setActiveTab(tab.name)}
            className={`flex items-center gap-2 py-3 px-4 font-medium text-sm transition-colors ${
              activeTab === tab.name
                ? 'border-b-2 border-primary text-primary'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <tab.icon size={16} />
            {tab.name}
          </button>
        ))}
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-neutral-200">
        {activeTab === 'Statistics' && <LibraryStatistics {...props} />}
        {activeTab === 'Member Activity' && <MemberActivityReport />}
      </div>
    </div>
  );
};

export default ReportsPage;
