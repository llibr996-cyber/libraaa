import React from 'react';
import { Link } from 'react-router-dom';
import { type ReadWithUs } from '../lib/supabase';
import { BookText, User, Heart, Eye, Calendar, Star } from 'lucide-react';

interface PostCardProps {
  post: ReadWithUs;
  showStats?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, showStats = true }) => {
  return (
    <Link 
      to={`/read-with-us/${post.id}`} 
      className="block bg-white rounded-xl shadow-md border border-neutral-200/60 overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
    >
      <div className="relative overflow-hidden aspect-[3/4]">
        {post.image_url ? (
          <img src={post.image_url} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
            <BookText size={48} className="text-neutral-300" />
          </div>
        )}
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-md font-bold text-neutral-800 mb-1 line-clamp-2 transition-colors group-hover:text-primary-dark">{post.title}</h3>
        <p className="text-sm text-neutral-500 mb-3">by {post.author}</p>
        
        {showStats ? (
          <div className="mt-auto pt-3 border-t border-neutral-100 flex justify-between items-center text-sm text-neutral-500">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-neutral-400" />
              <span>{new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5" title="Likes">
                <Heart size={16} className="text-accent" />
                <span className="font-medium">{post.like_count}</span>
              </div>
              <div className="flex items-center gap-1.5" title="Reads">
                <Eye size={16} className="text-blue-400" />
                <span className="font-medium">{post.read_count}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-auto flex items-center" title="Rating">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} className={i < 4 ? "text-yellow-400 fill-current" : "text-neutral-300"} />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
};

export default PostCard;
