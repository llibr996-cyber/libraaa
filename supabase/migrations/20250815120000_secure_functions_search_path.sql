/*
# [Secure Functions with Search Path]
This migration enhances security by explicitly setting the `search_path` for all custom PostgreSQL functions. This prevents potential hijacking attacks where a malicious user could create objects in a different schema to alter the function's behavior.

## Query Description:
This operation updates the configuration of existing functions to lock down their execution context to the `public` schema. It is a non-destructive security enhancement. No data will be modified, and the functions' logic remains unchanged. This change is safe to apply and is recommended for all production environments.

## Metadata:
- Schema-Category: "Safe"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
This migration affects the following functions:
- `public.issue_book(uuid, uuid, timestamp with time zone)`
- `public.return_book(uuid)`
- `public.return_book_by_id(uuid)`
- `public.add_category(text)`
- `public.delete_category(uuid)`

## Security Implications:
- RLS Status: Not applicable to function configuration.
- Policy Changes: No.
- Auth Requirements: Requires `supabase_admin` or equivalent privileges to alter functions.
- Security Improvement: Mitigates search path hijacking vulnerabilities by ensuring functions only resolve objects within the `public` schema.

## Performance Impact:
- Indexes: None.
- Triggers: None.
- Estimated Impact: Negligible. This is a metadata change and does not affect query performance.
*/

-- Secure the `issue_book` function
ALTER FUNCTION public.issue_book(p_book_id uuid, p_member_id uuid, p_due_date timestamp with time zone)
SET search_path = public;

-- Secure the `return_book` function
ALTER FUNCTION public.return_book(p_circulation_id uuid)
SET search_path = public;

-- Secure the `return_book_by_id` function
ALTER FUNCTION public.return_book_by_id(p_book_id uuid)
SET search_path = public;

-- Secure the `add_category` function
ALTER FUNCTION public.add_category(p_name text)
SET search_path = public;

-- Secure the `delete_category` function
ALTER FUNCTION public.delete_category(p_id uuid)
SET search_path = public;
