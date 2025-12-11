import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import ActionCard from './ActionCard';
import LibraryCollection from './LibraryCollection';
import SuggestBookModal from './SuggestBookModal';
import WriteReviewModal from './WriteReviewModal';
import ReportsModal from './ReportsModal';
import { Lightbulb, Edit, BarChart3, ArrowLeft } from 'lucide-react';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);

  const actionCards = [
    {
      icon: Lightbulb,
      title: 'Suggest a Book',
      description: 'Let us know what books you want to see in our collection.',
      bgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      onClick: () => setShowSuggestModal(true),
    },
    {
      icon: Edit,
      title: 'Write a Review',
      description: 'Share your thoughts on books you have read.',
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      onClick: () => setShowReviewModal(true),
    },
    {
      icon: BarChart3,
      title: 'View Reports',
      description: 'Check out library statistics and popular books.',
      bgColor: 'bg-indigo-100',
      iconColor: 'text-primary',
      onClick: () => setShowReportsModal(true),
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark mb-6">
            <ArrowLeft size={16} /> Back to Landing Page
        </button>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {actionCards.map((card, index) => (
            <ActionCard
              key={index}
              icon={card.icon}
              title={card.title}
              description={card.description}
              bgColor={card.bgColor}
              iconColor={card.iconColor}
              onClick={card.onClick}
            />
          ))}
        </div>
        <LibraryCollection />
      </main>

      {showSuggestModal && <SuggestBookModal onClose={() => setShowSuggestModal(false)} />}
      {showReviewModal && <WriteReviewModal onClose={() => setShowReviewModal(false)} />}
      {showReportsModal && <ReportsModal onClose={() => setShowReportsModal(false)} />}
    </div>
  );
};

export default HomePage;
