/*
          # [Operation Name]
          Create 'read_with_us' table

          ## Query Description: [This script creates a new table named 'read_with_us' to store student-contributed content like articles, poems, and reviews. It includes columns for title, author, content, and category. It also sets up Row Level Security (RLS) to allow public read access while restricting write permissions to authenticated users, ensuring data integrity and security.]

          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Table: public.read_with_us
          - Columns: id, created_at, title, author, content, category, image_url
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [Admin access for write operations]
          
          ## Performance Impact:
          - Indexes: [Primary key index on 'id']
          - Triggers: [None]
          - Estimated Impact: [Low, as it's a new table with standard indexing.]
          */

CREATE TABLE public.read_with_us (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Book Review', 'Poem', 'Article', 'Story')),
    image_url TEXT
);

-- Enable Row Level Security
ALTER TABLE public.read_with_us ENABLE ROW LEVEL SECURITY;

-- Policies for read_with_us
-- 1. Allow public read access
CREATE POLICY "Allow public read access" ON public.read_with_us
FOR SELECT USING (true);

-- 2. Allow admin users to insert
CREATE POLICY "Allow admin insert" ON public.read_with_us
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. Allow admin users to update
CREATE POLICY "Allow admin update" ON public.read_with_us
FOR UPDATE USING (auth.role() = 'authenticated');

-- 4. Allow admin users to delete
CREATE POLICY "Allow admin delete" ON public.read_with_us
FOR DELETE USING (auth.role() = 'authenticated');

COMMENT ON TABLE public.read_with_us IS 'Stores student-contributed content like poems, articles, and reviews.';
