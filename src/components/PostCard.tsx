import React from 'react';
import { Link } from 'react-router-dom';
import { type ReadWithUs } from '../lib/supabase';
import { BookText, User } from 'lucide-react';

interface PostCardProps {
  post: ReadWithUs;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col group transition-transform duration-300 hover:-translate-y-1">
      <Link to={`/read-with-us/${post.id}`} className="block">
        <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
          {post.image_url ? (
            <img src={post.image_url} alt={post.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <BookText size={48} className="text-gray-400" />
          )}
        </div>
      </Link>
      <div className="p-5 flex flex-col flex-grow">
        <p className="text-xs font-semibold uppercase text-purple-600 mb-2">{post.category}</p>
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-700 transition-colors">
          <Link to={`/read-with-us/${post.id}`}>{post.title}</Link>
        </h3>
        
        <div className="flex items-center gap-2 mb-4">
          {post.author_image_url ? (
            <img src={post.author_image_url} alt={post.author} className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
              <User size={14} className="text-gray-500" />
            </div>
          )}
          <p className="text-sm text-gray-500">by {post.author}</p>
        </div>
        
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 flex-grow">{post.content}</p>
        <div className="mt-4 pt-4 border-t border-gray-100">
           <Link to={`/read-with-us/${post.id}`} className="font-semibold text-sm text-purple-600 hover:text-purple-800 transition-colors">
            Read More &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
