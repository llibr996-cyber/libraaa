/*
# [SECURITY] Set Function Search Path
This migration enhances security by explicitly setting the `search_path` for several database functions. This prevents potential hijacking attacks by ensuring functions do not resolve objects from schemas outside of `public`.

## Query Description: 
This operation alters existing database functions to make them more secure. It is a non-destructive change and will not impact existing data. It ensures that all function calls resolve to objects within the `public` schema, improving the security and predictability of your database.

## Metadata:
- Schema-Category: "Safe"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by removing the SET clause)

## Structure Details:
- Functions affected:
  - `add_category(p_name text)`
  - `delete_category(p_id uuid)`
  - `get_next_register_number()`
  - `issue_book(p_book_id uuid, p_member_id uuid, p_due_date timestamp with time zone)`
  - `return_book(p_circulation_id uuid)`
  - `return_book_by_id(p_book_id uuid)`

## Security Implications:
- RLS Status: Not applicable
- Policy Changes: No
- Auth Requirements: None
- Mitigates: "Function Search Path Mutable" security advisory.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible performance impact.
*/

-- Secure add_category function
ALTER FUNCTION public.add_category(p_name text)
SET search_path = public;

-- Secure delete_category function
ALTER FUNCTION public.delete_category(p_id uuid)
SET search_path = public;

-- Secure get_next_register_number function
ALTER FUNCTION public.get_next_register_number()
SET search_path = public;

-- Secure issue_book function
ALTER FUNCTION public.issue_book(p_book_id uuid, p_member_id uuid, p_due_date timestamp with time zone)
SET search_path = public;

-- Secure return_book function
ALTER FUNCTION public.return_book(p_circulation_id uuid)
SET search_path = public;

-- Secure return_book_by_id function
ALTER FUNCTION public.return_book_by_id(p_book_id uuid)
SET search_path = public;
