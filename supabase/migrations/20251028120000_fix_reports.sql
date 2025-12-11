-- Run this script in your Supabase SQL Editor to fix the Reports error

-- 1. Function to get the most read books
CREATE OR REPLACE FUNCTION get_most_read_books(time_filter text)
RETURNS TABLE(book_id uuid, title text, author text, ddc_number text, read_count bigint)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id as book_id,
    b.title,
    b.author,
    b.ddc_number,
    count(c.id) as read_count
  FROM
    circulation c
  JOIN
    books b ON c.book_id = b.id
  WHERE
    c.status = 'returned' OR c.status = 'issued' AND
    CASE
      WHEN time_filter = 'week' THEN c.issue_date >= now() - interval '7 days'
      WHEN time_filter = 'month' THEN c.issue_date >= now() - interval '1 month'
      WHEN time_filter = 'year' THEN c.issue_date >= now() - interval '1 year'
      ELSE true
    END
  GROUP BY
    b.id
  ORDER BY
    read_count DESC
  LIMIT 10;
END;
$$;

-- 2. Function to get the most active members
CREATE OR REPLACE FUNCTION get_most_active_members(time_filter text)
RETURNS TABLE(member_id uuid, name text, class text, register_number text, book_count bigint)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id as member_id,
    m.name,
    m.class,
    m.register_number,
    count(c.id) as book_count
  FROM
    circulation c
  JOIN
    members m ON c.member_id = m.id
  WHERE
    CASE
      WHEN time_filter = 'week' THEN c.issue_date >= now() - interval '7 days'
      WHEN time_filter = 'month' THEN c.issue_date >= now() - interval '1 month'
      WHEN time_filter = 'year' THEN c.issue_date >= now() - interval '1 year'
      ELSE true
    END
  GROUP BY
    m.id
  ORDER BY
    book_count DESC
  LIMIT 10;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_most_read_books(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_most_active_members(text) TO authenticated, anon;
