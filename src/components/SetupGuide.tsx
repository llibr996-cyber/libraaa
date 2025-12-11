import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Database, Terminal, AlertTriangle, CheckCircle, ShieldCheck } from 'lucide-react';

const CodeBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <pre className="bg-neutral-800 text-white p-4 rounded-lg overflow-x-auto text-sm font-mono shadow-inner border border-neutral-700">
    <code>{children}</code>
  </pre>
);

const SetupGuide: React.FC = () => {
  const fixCountersSQL = `-- 1. Drop existing functions to ensure clean slate
DROP FUNCTION IF EXISTS increment_read_count(uuid);
DROP FUNCTION IF EXISTS increment_like(uuid, text);
DROP FUNCTION IF EXISTS increment_share_count(uuid);

-- 2. Create Read Count Function (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION increment_read_count(post_id_in uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE read_with_us
  SET read_count = read_count + 1
  WHERE id = post_id_in;
END;
$$;

-- 3. Create Like Function (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION increment_like(post_id_in uuid, session_id_in text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert like record if not exists
  INSERT INTO post_likes (post_id, session_id)
  VALUES (post_id_in, session_id_in)
  ON CONFLICT (post_id, session_id) DO NOTHING;

  -- Update count
  UPDATE read_with_us
  SET like_count = (SELECT count(*) FROM post_likes WHERE post_id = post_id_in)
  WHERE id = post_id_in;
END;
$$;

-- 4. Create Share Function (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION increment_share_count(post_id_in uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE read_with_us
  SET share_count = share_count + 1
  WHERE id = post_id_in;
END;
$$;

-- 5. Grant Permissions to Public (Anon) and Authenticated users
GRANT EXECUTE ON FUNCTION increment_read_count(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION increment_like(uuid, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION increment_share_count(uuid) TO anon, authenticated, service_role;

-- 6. Ensure RLS policies exist for Likes table
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'post_likes' AND policyname = 'Allow public insert likes'
    ) THEN
        CREATE POLICY "Allow public insert likes" ON post_likes FOR INSERT WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'post_likes' AND policyname = 'Allow public select likes'
    ) THEN
        CREATE POLICY "Allow public select likes" ON post_likes FOR SELECT USING (true);
    END IF;
END
$$;

NOTIFY pgrst, 'reload schema';
`;

const reportsSQL = `-- Enable Library Reports
CREATE OR REPLACE FUNCTION get_most_read_books(time_filter text)
RETURNS TABLE(book_id uuid, title text, author text, ddc_number text, read_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
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

CREATE OR REPLACE FUNCTION get_most_active_members(time_filter text)
RETURNS TABLE(member_id uuid, name text, class text, register_number text, book_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
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

GRANT EXECUTE ON FUNCTION get_most_read_books(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_most_active_members(text) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
`;

  return (
    <div className="min-h-screen bg-neutral-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark mb-6 group">
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" /> Back to Home
        </Link>
        
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-neutral-200">
          <div className="flex items-center gap-4 mb-8 border-b border-neutral-100 pb-6">
            <div className="bg-primary/10 p-4 rounded-full">
              <Database size={32} className="text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Database Setup Guide</h1>
              <p className="text-neutral-600 mt-1 text-lg">Run these scripts to fix errors and enable features.</p>
            </div>
          </div>
          
          <div className="space-y-12">
            {/* Section 1: Fix Counters */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-100 text-red-700 font-bold w-8 h-8 flex items-center justify-center rounded-full">1</div>
                <h2 className="text-xl font-bold text-neutral-800">Fix "Read With Us" Errors (Likes/Views)</h2>
              </div>
              
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg mb-4">
                <div className="flex">
                  <div className="flex-shrink-0"><AlertTriangle className="h-5 w-5 text-red-500" /></div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800 font-medium">
                      Critical: Run this script to fix the "Permission denied" or "Function not found" errors when liking posts.
                    </p>
                  </div>
                </div>
              </div>
              
              <CodeBlock>{fixCountersSQL}</CodeBlock>
            </section>

            {/* Section 2: Reports */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 text-blue-700 font-bold w-8 h-8 flex items-center justify-center rounded-full">2</div>
                <h2 className="text-xl font-bold text-neutral-800">Enable Library Reports</h2>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg mb-4">
                <div className="flex">
                  <div className="flex-shrink-0"><ShieldCheck className="h-5 w-5 text-blue-500" /></div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-800 font-medium">
                      Run this to enable the "Most Read" and "Most Active" reports on the dashboard.
                    </p>
                  </div>
                </div>
              </div>
              
              <CodeBlock>{reportsSQL}</CodeBlock>
            </section>

            <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-start gap-4">
              <CheckCircle className="text-green-500 h-6 w-6 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-green-800 font-bold text-lg">How to run these scripts:</h4>
                <ol className="list-decimal list-inside space-y-1 text-green-700 mt-2">
                  <li>Go to your <b>Supabase Dashboard</b>.</li>
                  <li>Open the <b>SQL Editor</b> (<Terminal size={16} className="inline-block" />).</li>
                  <li>Click <b>New Query</b>.</li>
                  <li>Copy the code above, paste it into the editor, and click <b className="font-bold">RUN</b>.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SetupGuide;
