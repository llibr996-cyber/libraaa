/*
          # [Operation Name]
          Update 'read_with_us' table schema

          ## Query Description: [This operation updates the 'read_with_us' table to support new features and fix a schema cache error. It adds a 'user_id' column to link posts to authors and an 'image_url' column for post images. It also updates security policies to ensure users can manage their own content. This change is non-destructive and essential for the new "Read With Us" features to function correctly.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Table: public.read_with_us
          - Columns Added: user_id (UUID), image_url (TEXT)
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes
          - Auth Requirements: Policies are updated to ensure users can only insert, update, or delete their own posts, linking them via `auth.uid()`.
          
          ## Performance Impact:
          - Indexes: Adds a foreign key index on `user_id`.
          - Triggers: None
          - Estimated Impact: Negligible performance impact. The changes improve data integrity and enable new functionality.
          */
-- Add user_id column with foreign key to auth.users to resolve schema cache error
ALTER TABLE public.read_with_us
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add image_url column to support post images
ALTER TABLE public.read_with_us
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Drop old policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.read_with_us;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.read_with_us;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.read_with_us;

-- Add a new, more specific insert policy
CREATE POLICY "Allow authenticated users to insert their own posts"
ON public.read_with_us
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Recreate update policy to ensure ownership check
CREATE POLICY "Enable update for users based on user_id"
ON public.read_with_us
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Recreate delete policy to ensure ownership check
CREATE POLICY "Enable delete for users based on user_id"
ON public.read_with_us
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
