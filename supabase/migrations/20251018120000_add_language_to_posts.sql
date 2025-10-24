/*
  # [Feature] Enhance 'Read With Us' with Language and Author Image
  This migration adds language filtering and author image support to the 'read_with_us' table.

  ## Query Description:
  - Adds a 'language' column to store the language of the post.
  - Adds an 'author_image_url' column for an optional author avatar.
  This operation is safe and will not result in data loss. Existing posts will have NULL values for these new columns, which is expected.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true

  ## Structure Details:
  - Table: public.read_with_us
  - Columns Added:
    - language (TEXT)
    - author_image_url (TEXT)

  ## Security Implications:
  - RLS Status: Unchanged
  - Policy Changes: No
  - Auth Requirements: None for this migration.

  ## Performance Impact:
  - Indexes: None added.
  - Triggers: None added.
  - Estimated Impact: Negligible.
*/
ALTER TABLE public.read_with_us
ADD COLUMN language TEXT,
ADD COLUMN author_image_url TEXT;
