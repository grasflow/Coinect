-- Create storage bucket for logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true, -- public bucket for easy access in PDFs
  2097152, -- 2MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Users can upload their own logo
CREATE POLICY "Users can upload own logo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own logo
CREATE POLICY "Users can update own logo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own logo
CREATE POLICY "Users can delete own logo"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can read their own logo
CREATE POLICY "Users can read own logo"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to read logos (for PDF generation)
-- This is needed if invoices are shared or for internal processing
CREATE POLICY "Authenticated users can read all logos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'logos');
