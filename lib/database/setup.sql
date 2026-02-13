-- Thumbnails 테이블 생성
CREATE TABLE IF NOT EXISTS public.thumbnails (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    prompt TEXT NOT NULL,
    image_url TEXT,
    storage_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.thumbnails ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 썸네일만 볼 수 있음
CREATE POLICY "Users can view their own thumbnails"
    ON public.thumbnails
    FOR SELECT
    USING (auth.uid() = user_id);

-- 사용자는 자신의 썸네일만 생성할 수 있음
CREATE POLICY "Users can insert their own thumbnails"
    ON public.thumbnails
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 썸네일만 업데이트할 수 있음
CREATE POLICY "Users can update their own thumbnails"
    ON public.thumbnails
    FOR UPDATE
    USING (auth.uid() = user_id);

-- 사용자는 자신의 썸네일만 삭제할 수 있음
CREATE POLICY "Users can delete their own thumbnails"
    ON public.thumbnails
    FOR DELETE
    USING (auth.uid() = user_id);

-- updated_at 자동 업데이트를 위한 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거 생성
CREATE TRIGGER update_thumbnails_updated_at
    BEFORE UPDATE ON public.thumbnails
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_thumbnails_user_id ON public.thumbnails(user_id);
CREATE INDEX IF NOT EXISTS idx_thumbnails_created_at ON public.thumbnails(created_at DESC);
