/*
          # Feature: Read With Us Interactions
          This migration adds support for likes, read counts, and comments to the "Read With Us" feature.

          ## Query Description: This operation adds two new columns ('likes', 'read_count') to the 'read_with_us' table and creates a new 'comments' table. It also creates secure functions to handle counter increments. This is a non-destructive operation, but it is essential for the new features to work.

          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true

          ## Structure Details:
          - Tables Modified: 'read_with_us'
          - Tables Created: 'comments'
          - Functions Created: 'increment_read_count', 'increment_likes'

          ## Security Implications:
          - RLS Status: Enabled on the new 'comments' table.
          - Policy Changes: New policies for 'comments' table to allow public read/write.
          - Auth Requirements: Functions are `SECURITY DEFINER` to allow safe, atomic updates from any user.

          ## Performance Impact:
          - Indexes: Default indexes on new primary and foreign keys.
          - Triggers: None.
          - Estimated Impact: Low. The changes are additive and well-indexed.
          */

-- Step 1: Add new columns to the 'read_with_us' table for likes and read counts.
ALTER TABLE public.read_with_us
ADD COLUMN IF NOT EXISTS likes INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS read_count INT NOT NULL DEFAULT 0;

-- Step 2: Create the 'comments' table to store user comments on posts.
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    post_id UUID NOT NULL REFERENCES public.read_with_us(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL CHECK (char_length(author_name) > 0 AND char_length(author_name) < 100),
    content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) < 2000)
);

-- Add an index on post_id for faster comment lookups.
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);

-- Step 3: Enable Row Level Security on the new 'comments' table.
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies for the 'comments' table.
-- Drop existing policies to ensure this script is re-runnable.
DROP POLICY IF EXISTS "Allow public read access to comments" ON public.comments;
DROP POLICY IF EXISTS "Allow public insert access to comments" ON public.comments;

-- Allow anyone to read all comments.
CREATE POLICY "Allow public read access to comments"
ON public.comments
FOR SELECT
USING (true);

-- Allow anyone to insert a comment.
CREATE POLICY "Allow public insert access to comments"
ON public.comments
FOR INSERT
WITH CHECK (true);

-- Step 5: Create secure functions to atomically increment counters.
-- These functions run with the permissions of the function owner, which is safer.
CREATE OR REPLACE FUNCTION increment_read_count(p_post_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.read_with_us
    SET read_count = read_count + 1
    WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_likes(p_post_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.read_with_us
    SET likes = likes + 1
    WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Grant execute permissions on the new functions to all users.
GRANT EXECUTE ON FUNCTION increment_read_count(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_likes(UUID) TO anon, authenticated;
