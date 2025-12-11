import React, { useState } from 'react';
import { X, Check, Copy, Share2 } from 'lucide-react';
import { type ReadWithUs } from '../lib/supabase';
import { supabase } from '../lib/supabase';

interface ShareModalProps {
  post: ReadWithUs;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ post, onClose }) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/read-with-us/${post.id}`;
  const shareText = `Check out this article: "${post.title}" by ${post.author}`;

  const incrementShareCount = async () => {
    const { error } = await supabase.rpc('increment_share_count', { post_id_in: post.id });
    if (error) {
        console.error('Failed to increment share count:', error);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    incrementShareCount();
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOptions = [
    {
      name: 'WhatsApp',
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`,
      icon: 'https://static.cdnlogo.com/logos/w/29/whatsapp.svg',
    },
    {
      name: 'Facebook',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      icon: 'https://static.cdnlogo.com/logos/f/44/facebook.svg',
    },
    {
      name: 'Twitter / X',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      icon: 'https://static.cdnlogo.com/logos/x/83/x.svg',
    },
    {
      name: 'Instagram',
      url: `https://www.instagram.com`, // Instagram does not have a direct share URL
      icon: 'https://static.cdnlogo.com/logos/i/92/instagram.svg',
      isInfo: true,
    },
    {
      name: 'Email',
      url: `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent('I thought you might find this interesting:\n\n' + shareUrl)}`,
      icon: 'https://static.cdnlogo.com/logos/m/2/mail-ios.svg',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Share2 size={22} /> Share Post</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-gray-600">Share this post with your friends and colleagues!</p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 text-center">
            {shareOptions.map(option => (
              <a
                key={option.name}
                href={option.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={!option.isInfo ? incrementShareCount : undefined}
                title={option.isInfo ? "Open Instagram (sharing via DMs is recommended)" : `Share on ${option.name}`}
                className="flex flex-col items-center gap-2 group"
              >
                <img src={option.icon} alt={option.name} className="w-12 h-12 rounded-full p-1 border border-transparent group-hover:border-gray-200 transition-all" />
                <span className="text-xs text-gray-500 group-hover:text-gray-800">{option.name}</span>
              </a>
            ))}
          </div>

          <div className="relative">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="w-full bg-gray-100 border border-gray-200 rounded-lg pl-3 pr-12 py-2 text-sm text-gray-700"
            />
            <button
              onClick={copyToClipboard}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-md bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} className="text-gray-600" />}
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
