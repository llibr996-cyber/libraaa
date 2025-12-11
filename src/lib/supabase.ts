import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database tables
export interface Category {
  id: string;
  name: string;
  created_at: string;
}

export type Language = 'English' | 'Kannada' | 'Malayalam' | 'Arabic' | 'Urdu';

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  ddc_number?: string;
  publication_year?: number;
  publisher?: string;
  total_copies: number;
  available_copies: number;
  status: 'available' | 'issued' | 'maintenance' | 'lost';
  created_at: string;
  updated_at: string;
  category_id?: string;
  language?: Language;
  price?: number;
  categories?: Category;
  register_date: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  membership_date: string;
  membership_type: 'regular' | 'premium' | 'student';
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
  place?: string;
  register_number?: string;
  class?: string;
}

export interface Circulation {
  id: string;
  book_id: string;
  member_id: string;
  issue_date: string;
  due_date: string;
  return_date?: string;
  status: 'issued' | 'returned' | 'overdue' | 'lost';
  fine_amount: number;
  fine_status?: 'paid' | 'unpaid' | 'none'; // Added fine_status
  created_at: string;
  updated_at: string;
  books?: Book;
  members?: Member;
}

export interface Feedback {
  id: string;
  member_id: string;
  book_id?: string;
  rating?: number;
  review?: string;
  feedback_type: 'book_review' | 'service_feedback' | 'suggestion';
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  suggestion_title?: string;
  suggestion_author?: string;
  suggestion_reason?: string;
  members?: Member;
  books?: Book;
}

export interface ReadWithUs {
  id: string;
  created_at: string;
  title: string;
  author: string;
  content: string;
  category: 'Book Review' | 'Poem' | 'Article' | 'Story';
  user_id?: string | null;
  image_url?: string | null;
  language: Language;
  author_image_url?: string | null;
  like_count: number;
  read_count: number;
  share_count: number;
}

export interface PostComment {
  id: string;
  created_at: string;
  post_id: string;
  commenter_name: string;
  content: string;
  is_approved: boolean;
}
