# Cloudflare 배포 (Workers)

Next.js 앱은 **API 라우트·서버 렌더링**을 쓰기 때문에, 정적 파일만 올리는 **Cloudflare Pages** 방식으로는 루트(`/`) 접속 시 404가 납니다.  
**Cloudflare Workers**에 올려야 전체 앱이 동작합니다.

## 왜 Pages에서 404가 나왔는지

- **Pages (정적)** 는 빌드 결과에서 `index.html` 같은 **정적 파일**만 배포합니다.
- Next.js 기본 빌드(`next build`)는 **Node 서버용**이라 루트에 `index.html`을 만들지 않습니다.
- 그래서 Pages에 올리면 `/` 요청에 줄 파일이 없어 **404**가 납니다.

## 해결: Workers로 배포

이 프로젝트에는 **OpenNext** (`@opennextjs/cloudflare`)로 Workers 배포 설정이 들어가 있습니다.

### 1. 패키지 설치 (한 번만)

```bash
npm install
```

(이미 `@opennextjs/cloudflare`, `wrangler` 가 devDependencies에 있음)

### 2. 환경 변수 (배포 시)

Cloudflare 대시보드에서 Workers 프로젝트 → **Settings** → **Variables** 에서 다음을 설정하세요.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`
- `POLAR_ACCESS_TOKEN`
- `POLAR_PRO_PRODUCT_ID`
- `POLAR_ULTRA_PRODUCT_ID`
- `POLAR_WEBHOOK_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`

(이름은 `.env.local`과 동일하게 맞추면 됩니다.)

### 3. 배포

#### 로컬/터미널에서 배포

```bash
npm run deploy
```

처음 실행 시 Wrangler가 브라우저를 띄워 Cloudflare 로그인을 요청할 수 있습니다.  
배포가 끝나면 **`https://<worker-name>.<your-subdomain>.workers.dev`** 형태의 URL이 나옵니다.

#### Git 연결(Cloudflare Builds)로 배포할 때

**"Missing entry-point to Worker script or to assets directory"** 가 나오면, 빌드 단계에서 **OpenNext**가 실행되지 않은 상태로 `wrangler deploy`만 돌아간 것입니다. Worker 진입점(`.open-next/worker.js`)은 **OpenNext 빌드**가 만들어 줍니다.

Cloudflare 대시보드 → **Workers & Pages** → 해당 프로젝트 → **Settings** → **Builds** (또는 Build configuration)에서 아래처럼 맞춰 주세요.

| 설정 | 값 |
|------|-----|
| **Build command** | `npx @opennextjs/cloudflare build` |
| **Deploy command** | `npx wrangler deploy` |

- **Build command**를 `npm run build`나 `next build`로 두면 `.open-next` 폴더가 생기지 않아, deploy 시 entry-point 오류가 납니다.
- `npx @opennextjs/cloudflare build`는 설치된 `@opennextjs/cloudflare` 패키지의 CLI를 실행합니다 (스코프 패키지명을 반드시 포함).

#### "Missing ... from lock file" (npm ci 실패)

Cloudflare는 **`npm ci`**(clean-install)로 의존성을 설치합니다. `npm ci`는 **package.json과 package-lock.json이 완전히 일치**할 때만 성공합니다.

- **원인**: `package.json`에 `@opennextjs/cloudflare`, `wrangler` 등을 추가한 뒤, 로컬에서만 `npm install`을 했고 **package-lock.json을 커밋/푸시하지 않은 경우**.
- **해결**:
  1. 로컬에서 한 번: `npm install` (lock 파일 갱신)
  2. **package-lock.json** 을 반드시 커밋하고 푸시:
     ```bash
     git add package.json package-lock.json
     git commit -m "Add Cloudflare Workers deps and update lock file"
     git push
     ```

### 4. (선택) 로컬에서 Workers와 비슷하게 실행

```bash
npm run preview
```

### 5. (선택) 기존 Pages 대신 Workers 사용

- Cloudflare 대시보드 → **Workers & Pages**
- **Workers** 쪽에 새로 만든 Worker가 보입니다.
- **Custom domain**을 연결하면 `newra-9ay.pages.dev` 대신 그 도메인으로 서비스할 수 있습니다.
- Pages 프로젝트는 더 이상 사용하지 않거나, 정적 사이트용으로만 두면 됩니다.

## 참고

- [OpenNext Cloudflare](https://opennext.js.org/cloudflare)
- [Cloudflare Workers - Next.js](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
