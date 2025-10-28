import React from 'react';
import { Link } from 'react-router-dom';
import { type ReadWithUs } from '../lib/supabase';
import { BookText, User, Heart, Eye, Share2 } from 'lucide-react';

interface PostCardProps {
  post: ReadWithUs;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200/80 overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
      <Link to={`/read-with-us/${post.id}`} className="block overflow-hidden">
        <div className="aspect-w-16 aspect-h-9 bg-gray-100 flex items-center justify-center">
          {post.image_url ? (
            <img src={post.image_url} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
          ) : (
            <BookText size={48} className="text-gray-300" />
          )}
        </div>
      </Link>
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-2 text-xs">
            <p className="font-semibold uppercase text-purple-600">{post.category}</p>
            <span className="bg-gray-100 text-gray-600 font-medium px-2 py-0.5 rounded-full">{post.language}</span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-700 transition-colors">
          <Link to={`/read-with-us/${post.id}`}>{post.title}</Link>
        </h3>
        
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
          {post.author_image_url ? (
            <img src={post.author_image_url} alt={post.author} className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
              <User size={14} className="text-gray-500" />
            </div>
          )}
          <span>{post.author}</span>
          <span className="text-gray-300">&bull;</span>
          <span>{new Date(post.created_at).toLocaleDateString()}</span>
        </div>
        
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 flex-grow">{post.content}</p>
        
        <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
           <Link to={`/read-with-us/${post.id}`} className="font-semibold text-purple-600 hover:text-purple-800 transition-colors">
            Read More &rarr;
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5" title="Likes">
              <Heart size={16} className="text-red-400" />
              <span>{post.like_count}</span>
            </div>
            <div className="flex items-center gap-1.5" title="Reads">
              <Eye size={16} className="text-blue-400" />
              <span>{post.read_count}</span>
            </div>
            <div className="flex items-center gap-1.5" title="Shares">
              <Share2 size={16} className="text-green-400" />
              <span>{post.share_count}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
