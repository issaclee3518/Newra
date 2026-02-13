# 데이터베이스 설정 가이드

## Thumbnails 테이블 생성

1. Supabase 대시보드에 로그인
2. SQL Editor로 이동
3. `setup.sql` 파일의 내용을 복사하여 실행

또는 Supabase CLI 사용:
```bash
supabase db push
```

## 스토리지 버킷 생성

### 방법 1: Supabase 대시보드 사용
1. Storage → New bucket 클릭
2. Bucket name: `images`
3. Public bucket: `false` (또는 `true` - 필요에 따라)
4. File size limit: `5242880` (5MB)
5. Allowed MIME types: `image/*`
6. Create 버튼 클릭

### 방법 2: Supabase CLI 사용
```bash
supabase storage create images --public false
```

## 스토리지 정책 설정

Supabase 대시보드 → Storage → Policies에서:
- `setup-storage.ts` 파일의 `storagePolicies` 내용을 참고하여 정책 생성

또는 SQL Editor에서:
```sql
-- setup-storage.ts의 storagePolicies 내용 실행
```

## 테이블 구조

### thumbnails 테이블
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key → auth.users)
- `prompt`: TEXT (사용자가 입력한 프롬프트)
- `image_url`: TEXT (생성된 이미지의 URL)
- `storage_path`: TEXT (스토리지 내 경로)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

## RLS (Row Level Security)
- 사용자는 자신이 생성한 썸네일만 조회/수정/삭제 가능
- 모든 정책이 `auth.uid() = user_id` 조건을 사용
