# Polar 체크아웃 시 hCaptcha 401 (Unauthorized) 오류

결제 버튼 클릭 후 Polar 체크아웃 페이지에서 `POST https://api.hcaptcha.com/authenticate 401 (Unauthorized)` 가 나오면, **Polar가 사용하는 hCaptcha 인증**에서 거절된 상태입니다. 우리 앱 코드가 아니라 **Polar 쪽 설정/환경** 문제입니다.

## 가능한 원인

1. **Polar 대시보드 hCaptcha 설정**
   - Organization → **Settings** 또는 **Checkout / Security** 메뉴에서 CAPTCHA(hCaptcha) 설정 확인
   - 사이트 키/시크릿이 잘못되었거나, 사용 중인 **도메인**(예: localhost, 배포 URL)이 hCaptcha에 등록되지 않았을 수 있음

2. **localhost / 테스트 도메인**
   - 로컬(`http://localhost:...`)에서 체크아웃하면 hCaptcha가 해당 도메인을 허용하지 않아 401이 날 수 있음
   - **해결**: 배포한 URL(예: Vercel URL)에서 결제 플로우를 테스트해 보기

3. **브라우저/네트워크**
   - 광고 차단기, 보안 확장 프로그램이 hCaptcha 요청을 막는 경우
   - 회사/학교 방화벽이 `api.hcaptcha.com` 차단
   - **해결**: 시크릿 창, 다른 브라우저, 다른 네트워크에서 시도

## 해결 순서 (권장)

1. **Polar 대시보드**
   - [Polar Dashboard](https://polar.sh) 로그인 → 해당 Organization 선택
   - **Settings** 또는 **Checkout / Security** 에서 CAPTCHA / hCaptcha / “Under Attack Mode” 등 관련 옵션 확인
   - 가능하면 **테스트/개발용으로 CAPTCHA 비활성화** 또는 **사용 도메인 추가** (localhost, 스테이징 URL 등)

2. **배포 URL에서 테스트**
   - 로컬이 아닌 **배포된 URL**에서 “결제하기” → Polar 체크아웃까지 진행해 보기

3. **Polar 지원**
   - 위로도 해결되지 않으면 [Polar 지원](https://polar.sh/support) 또는 문서에서 “checkout”, “captcha”, “hCaptcha” 관련 안내 확인

## 참고

- 401은 `api.hcaptcha.com` 에 대한 요청이 **인증/허용에 실패**했다는 뜻입니다.
- 체크아웃 페이지는 Polar가 호스팅하므로, hCaptcha 키/도메인/설정은 **Polar 대시보드**에서만 변경할 수 있습니다.
