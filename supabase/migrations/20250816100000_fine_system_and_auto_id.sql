/*
          # [Operation Name]
          Implement Fine System and Auto-Generated Member Register Numbers

          ## Query Description: This migration introduces two key features. First, it updates the book return functions to automatically calculate and apply a fine of ₹1 per day for overdue books. Second, it adds a new function to generate sequential, unique register numbers for new library members (e.g., ALTHBT1001, ALTHBT1002). These changes improve the automation and integrity of the library's records. No existing data will be lost, but the new fine logic will apply to all future returns.
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Medium"
          - Requires-Backup: false
          - Reversible: false
          
          ## Structure Details:
          - Functions Modified: public.return_book, public.return_book_by_id
          - Functions Added: public.get_next_register_number
          
          ## Security Implications:
          - RLS Status: Not changed
          - Policy Changes: No
          - Auth Requirements: Admin privileges to execute functions
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Negligible. Function logic is lightweight.
          */

-- Function to get the next available register number for a member
CREATE OR REPLACE FUNCTION get_next_register_number()
RETURNS TEXT AS $$
DECLARE
    last_number INT;
    new_number INT;
BEGIN
    -- Find the highest number from register_number like 'ALTHBT1001'
    -- COALESCE ensures that if no members exist, we start from 1000.
    SELECT COALESCE(MAX(SUBSTRING(register_number FROM 'ALTHBT(\d+)')::INT), 1000)
    INTO last_number
    FROM public.members
    WHERE register_number ~ '^ALTHBT\d+$';

    new_number := last_number + 1;
    RETURN 'ALTHBT' || new_number::TEXT;
END;
$$ LANGUAGE plpgsql;


-- Updated function to return a book using its circulation ID, with fine calculation
CREATE OR REPLACE FUNCTION return_book(p_circulation_id uuid)
RETURNS void AS $$
DECLARE
    v_book_id UUID;
    v_due_date DATE;
    v_fine_amount NUMERIC := 0;
    days_overdue INT;
BEGIN
    -- Get book_id and due_date from circulation record
    SELECT book_id, due_date INTO v_book_id, v_due_date
    FROM public.circulation
    WHERE id = p_circulation_id AND status = 'issued';

    IF v_book_id IS NULL THEN
        RAISE EXCEPTION 'Circulation record not found or already returned.';
    END IF;

    -- Calculate overdue days and fine (₹1 per day)
    days_overdue := (CURRENT_DATE - v_due_date);
    IF days_overdue > 14 THEN
        v_fine_amount := (days_overdue - 14) * 1.00;
    END IF;

    -- Update circulation record with return status and fine
    UPDATE public.circulation
    SET
        status = 'returned',
        return_date = CURRENT_TIMESTAMP,
        fine_amount = v_fine_amount,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_circulation_id;

    -- Increment available copies for the book
    UPDATE public.books
    SET available_copies = available_copies + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_book_id;
END;
$$ LANGUAGE plpgsql;


-- Updated function to return a book using its book ID, with fine calculation
CREATE OR REPLACE FUNCTION return_book_by_id(p_book_id uuid)
RETURNS void AS $$
DECLARE
    v_circulation_id UUID;
    v_due_date DATE;
    v_fine_amount NUMERIC := 0;
    days_overdue INT;
BEGIN
    -- Find the active circulation record for the given book
    SELECT id, due_date INTO v_circulation_id, v_due_date
    FROM public.circulation
    WHERE book_id = p_book_id AND status = 'issued'
    LIMIT 1;

    IF v_circulation_id IS NULL THEN
        RAISE EXCEPTION 'No active circulation record found for this book.';
    END IF;

    -- Calculate overdue days and fine (₹1 per day)
    days_overdue := (CURRENT_DATE - v_due_date);
    IF days_overdue > 14 THEN
        v_fine_amount := (days_overdue - 14) * 1.00;
    END IF;
    
    -- Update circulation record
    UPDATE public.circulation
    SET
        status = 'returned',
        return_date = CURRENT_TIMESTAMP,
        fine_amount = v_fine_amount,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_circulation_id;

    -- Increment available copies for the book
    UPDATE public.books
    SET available_copies = available_copies + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_book_id;
END;
$$ LANGUAGE plpgsql;
