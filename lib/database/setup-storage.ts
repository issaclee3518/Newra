/**
 * Supabase 스토리지 설정 스크립트
 * 
 * 이 스크립트는 Supabase 대시보드에서 수동으로 실행하거나
 * Supabase CLI를 사용하여 실행할 수 있습니다.
 * 
 * 스토리지 버킷 생성:
 * 1. Supabase 대시보드 → Storage → New bucket
 * 2. Bucket name: images
 * 3. Public bucket: false (또는 true, 필요에 따라)
 * 4. File size limit: 원하는 크기 (예: 5MB)
 * 5. Allowed MIME types: image/*
 * 
 * 또는 Supabase CLI 사용:
 * supabase storage create images --public false
 */

export const storageBucketConfig = {
    name: 'images',
    public: false,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
};

/**
 * 스토리지 정책 설정 (RLS)
 * 
 * Supabase 대시보드 → Storage → Policies에서 설정하거나
 * 아래 SQL을 실행하세요:
 */

export const storagePolicies = `
-- 사용자는 자신의 이미지를 업로드할 수 있음
CREATE POLICY "Users can upload their own images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'images' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- 사용자는 자신의 이미지를 볼 수 있음
CREATE POLICY "Users can view their own images"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'images' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- 사용자는 자신의 이미지를 삭제할 수 있음
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'images' AND
    auth.uid()::text = (storage.foldername(name))[1]
);
`;
