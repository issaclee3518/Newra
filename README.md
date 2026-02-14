# Thumbnail Generator

AI 기반 유튜브 썸네일 생성 서비스입니다. 사용자가 텍스트 프롬프트를 입력하면 OpenAI DALL-E 3 API를 사용하여 고품질 썸네일 이미지를 생성합니다.

## 주요 기능

- 🔐 **사용자 인증**: Supabase Auth를 통한 이메일/비밀번호 및 OAuth (Google, GitHub) 로그인
- 🎨 **AI 이미지 생성**: OpenAI DALL-E 3 API를 사용한 고품질 이미지 생성
- 💾 **이미지 저장**: 생성된 이미지를 Supabase Storage에 저장하고 데이터베이스에 메타데이터 기록
- 📱 **반응형 대시보드**: 모던하고 직관적인 사용자 인터페이스
- ⚡ **3D 로딩 애니메이션**: Three.js 기반 로딩 애니메이션

## 기술 스택

### Frontend
- Next.js 16
- TypeScript
- Tailwind CSS
- Framer Motion
- Three.js / @react-three/fiber

### Backend
- Next.js API Routes
- Supabase (Authentication, Database, Storage)
- OpenAI API (DALL-E 3)

## 시작하기

### 필수 요구사항

- Node.js 18 이상
- npm 또는 yarn
- Supabase 프로젝트
- OpenAI API 키

### 설치

1. 저장소 클론
```bash
git clone https://github.com/issaclee3518/Newra.git
cd paint-game
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 변수를 설정하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

4. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 프로젝트 구조

```
app/
  ├── Dashboard/          # 대시보드 페이지 (로그인 필요)
  ├── auth/               # 인증 페이지
  └── api/
      └── thumbnail/
          └── generate/   # 썸네일 생성 API 엔드포인트

components/
  ├── dashboard/          # 대시보드 전용 컴포넌트
  │   ├── navbar.tsx      # 대시보드 네비게이션 바
  │   ├── PromptArea.tsx  # 프롬프트 입력 영역
  │   └── BlobLoader.tsx  # 3D 로딩 애니메이션
  └── main/               # 메인 페이지 컴포넌트

lib/
  ├── auth/               # 인증 관련 함수들
  ├── openai/             # OpenAI API 이미지 생성
  ├── thumbnail/          # 썸네일 생성 로직
  └── supabase-server.ts  # 서버 사이드 Supabase 클라이언트
```

## 데이터베이스 설정

Supabase에서 다음을 설정해야 합니다:

1. **Thumbnails 테이블 생성**: `lib/database/setup.sql` 참고
2. **Storage Bucket 생성**: `images` 버킷을 public으로 생성
3. **Storage Policy 설정**: 모든 사용자가 이미지를 볼 수 있도록 정책 설정

자세한 내용은 `lib/database/README.md`를 참고하세요.

## 사용 방법

1. 회원가입 또는 로그인
2. 대시보드에서 프롬프트 입력
3. Enter 키를 누르거나 제출 버튼 클릭
4. AI가 이미지를 생성하는 동안 로딩 애니메이션 표시
5. 생성된 썸네일 이미지 확인

## 향후 개선 사항

- [ ] 프롬프트 자동 개선 (유튜브 썸네일 가이드라인 적용)
- [ ] 16:9 비율 이미지 생성 지원
- [ ] 썸네일 갤러리 기능
- [ ] 이미지 편집 기능 (텍스트 추가, 필터 등)
- [ ] 썸네일 템플릿 제공

## 라이선스

MIT
