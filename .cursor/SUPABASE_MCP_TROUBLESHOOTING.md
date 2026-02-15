# Supabase MCP 연결 오류 해결 (ENOTFOUND mcp.supabase.com)

`getaddrinfo ENOTFOUND mcp.supabase.com` 는 **DNS가 `mcp.supabase.com` 주소를 찾지 못할 때** 발생합니다.

## 1. 설정 확인

- `.cursor/mcp.json` 에 **전체 URL** 이 들어가 있어야 합니다.
- 이 프로젝트에는 이미 `https://mcp.supabase.com/mcp?project_ref=sgxdpkzyprrxwfcutoqm` 로 설정되어 있습니다.
- Cursor **재시작** 후: Settings → Cursor Settings → Tools & MCP 에서 Supabase 서버가 보이는지 확인하세요.

## 2. DNS/네트워크 확인

터미널에서 다음을 실행해 보세요.

```bash
# 1) 호스트가 해석되는지 확인
nslookup mcp.supabase.com

# 또는
ping -c 2 mcp.supabase.com
```

- **해석이 안 되면**: PC/맥의 DNS 설정을 바꿔 보세요 (예: 8.8.8.8, 1.1.1.1).
- **회사/학교 네트워크**라면 방화벽에서 `mcp.supabase.com` 이 막혀 있을 수 있으니, 다른 네트워크(예: 집, 핫스팟)에서 시도해 보세요.
- **VPN** 사용 중이면 끄고 다시 시도해 보세요.

## 3. 로컬 Supabase 사용 시 (선택)

Supabase CLI 로 **로컬** Supabase를 쓰는 경우에는 원격 MCP 대신 로컬 MCP를 쓸 수 있습니다.

```bash
supabase start
```

실행 후 `.cursor/mcp.json` 의 Supabase 서버 URL을 다음으로 바꿉니다.

```json
"url": "http://localhost:54321/mcp"
```

이때 MCP는 **로컬 프로젝트**에만 연결되며, 호스팅된 프로젝트(현재 사용 중인 DB)와는 별개입니다.

## 4. 요약

| 증상 | 조치 |
|------|------|
| ENOTFOUND mcp.supabase.com | DNS/네트워크 확인, 다른 DNS 또는 네트워크에서 재시도 |
| 설정이 안 보임 | `.cursor/mcp.json` 확인 후 Cursor 재시작 |
| 호스팅 DB 대신 로컬만 사용 | `supabase start` 후 URL을 `http://localhost:54321/mcp` 로 변경 |
