/*
  # [Create Function] `return_book_by_id`
  Adds a new RPC function to return a book using its book ID. This is used by the QR code scanner for returns.

  ## Query Description:
  This operation creates a new PostgreSQL function `return_book_by_id`.
  - It finds an active circulation record ('issued' or 'overdue') for the given book ID.
  - It updates the circulation status to 'returned' and sets the return date.
  - It increments the `available_copies` of the book.
  - If no active circulation record is found for the book, it raises an exception.
  This is a safe operation and does not risk data loss.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (The function can be dropped)

  ## Structure Details:
  - Function: `public.return_book_by_id(p_book_id uuid)`

  ## Security Implications:
  - RLS Status: Not applicable to function definition.
  - Policy Changes: No.
  - Auth Requirements: The function is callable by `authenticated` users, which is the default for RPC. Permissions are handled by Supabase.

  ## Performance Impact:
  - Indexes: The function relies on existing indexes on `circulation(book_id, status)` and `books(id)`.
  - Triggers: No.
  - Estimated Impact: Low. The function performs targeted updates and should be fast.
*/
CREATE OR REPLACE FUNCTION public.return_book_by_id(p_book_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_circulation_id uuid;
  v_book_exists boolean;
BEGIN
  -- Check if the book exists at all
  SELECT EXISTS (SELECT 1 FROM public.books WHERE id = p_book_id) INTO v_book_exists;
  IF NOT v_book_exists THEN
    RAISE EXCEPTION 'Book with ID % not found.', p_book_id;
  END IF;

  -- Find the circulation record for the book that is currently issued or overdue
  SELECT id INTO v_circulation_id
  FROM public.circulation
  WHERE book_id = p_book_id AND status IN ('issued', 'overdue')
  LIMIT 1;

  -- If no such record is found, the book is not currently out.
  IF v_circulation_id IS NULL THEN
    RAISE EXCEPTION 'This book is not currently issued or is already returned.';
  END IF;

  -- Update the circulation record
  UPDATE public.circulation
  SET
    status = 'returned',
    return_date = now()
  WHERE id = v_circulation_id;

  -- Increment the available copies count for the book
  UPDATE public.books
  SET available_copies = available_copies + 1
  WHERE id = p_book_id;

END;
$$;

-- Grant execution rights to the authenticated role
GRANT EXECUTE ON FUNCTION public.return_book_by_id(uuid) TO authenticated;
