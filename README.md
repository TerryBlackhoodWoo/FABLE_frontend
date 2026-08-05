# FABLE Frontend

FABLE의 Next.js(TypeScript) 프론트엔드 — 원전 근거 캐릭터 챗 UI + 로그인/로그 대시보드.

백엔드 저장소: [FABLE](https://github.com/TerryBlackhoodWoo/FABLE)

## 개요

질문을 입력하면 백엔드(`FastAPI`)의 `/ask`를 호출해, 신화 속 인물(호메로스 또는 핸드오프된 캐릭터)의 답변과 원전 출처(작품·챕터·유사도 점수), 그리고 그 장면을 그린 고전 미술/유물 이미지를 함께 보여주는 미니멀 채팅 UI입니다.

관리자가 발급한 아이디/비밀번호로 로그인하면, 해당 계정의 대화 로그와 사용량을 조회하는 대시보드도 제공합니다.

## 기술 스택

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS

## 페이지 구조

| 경로 | 설명 | 인증 방식 |
|---|---|---|
| `/` | 메인 채팅 화면 | `X-API-Key` 헤더 |
| `/login` | 대시보드 로그인 | — |
| `/logs` | 대화 로그·사용량 조회 | `Authorization: Bearer <JWT>` (localStorage) |

페이지 상단에서 서로 이동할 수 있는 링크가 연결되어 있습니다. `/`는 로그인 상태에 따라 "로그인" 또는 "대화 로그" 링크를 동적으로 표시합니다.

## 디자인 방향

FABLE 기획 초기부터 이어져 온 그리스 도자기(테라코타·브론즈·다크어스) 팔레트를 웹에도 그대로 적용했습니다.

| 토큰 | 값 | 용도 |
|---|---|---|
| Background | `#16110D` | 페이지 배경 |
| Panel | `#1F1712` | 카드/입력창 배경 |
| Terracotta | `#C1592F` | 버튼, 화자명 강조 |
| Bronze | `#B0894F` | 보더, 라벨 |
| Cream | `#EFE4D0` | 본문 텍스트 |

- **Display**: Noto Serif KR (타이틀, 화자명)
- **Body**: Noto Sans KR (본문)
- **Mono**: IBM Plex Mono (출처·유사도 점수 라벨)
- **시그니처 요소**: 그리스 문양(meander) SVG 패턴 — 카드 상단 hairline으로만 절제해서 사용

## 로컬 실행

### 요구 사항
- Node.js 18+
- 실행 중인 FABLE 백엔드 ([설정 가이드](https://github.com/TerryBlackhoodWoo/FABLE))
- 백엔드에서 발급받은 API 키 (`python create_account.py --type developer`)
- 대시보드 로그인 정보 (`python set_login.py`, 선택)

### 설치

```bash
git clone https://github.com/TerryBlackhoodWoo/FABLE_frontend.git
cd FABLE_frontend
npm install
```

### 환경변수

`.env.local` 파일 생성:

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_API_KEY=fbl_dev_...
```

> `NEXT_PUBLIC_*` 환경변수는 빌드 시점에 코드에 반영됩니다. 값을 바꾼 뒤에는 로컬은 재시작(`npm run dev` 재실행), 배포 환경은 재배포가 필요합니다.

### 실행

```bash
npm run dev
```

`http://localhost:3000`에서 확인합니다.

## 프로젝트 구조

```
src/app/
├── layout.tsx       # 폰트(Noto Serif/Sans KR, IBM Plex Mono) 설정
├── globals.css       # 전역 스타일, 색상 토큰
├── page.tsx           # 메인 채팅 UI ("/")
├── login/
│   └── page.tsx        # 로그인 폼 ("/login")
└── logs/
    └── page.tsx          # 로그·사용량 대시보드 ("/logs")
```

## 기능

- 질문 입력 → `X-API-Key` 헤더와 함께 `/ask` 호출 → 화자·답변·원전 출처·장면 이미지 표시
- 로그인 → JWT를 `localStorage`에 저장 → `/logs`에서 `Authorization: Bearer` 헤더로 로그·사용량 조회
- `/logs` 접근 시 토큰 없거나 만료(401)면 자동으로 `/login`으로 리다이렉트
- 에러 메시지 — HTTP 오류 응답(401/429 등)과 네트워크 연결 실패를 구분해서 실제 원인을 보여줌
- 이미지가 없는 응답(관련 명화를 못 찾은 경우)에도 자연스럽게 대응

## 배포 (Railway)

1. Railway에서 GitHub 저장소(`FABLE_frontend`) 연결 (Root Directory는 저장소 루트 그대로, 비워둠)
2. **Variables**에 `NEXT_PUBLIC_API_URL`(백엔드 배포 URL), `NEXT_PUBLIC_API_KEY` 등록
3. **Settings → Networking → Generate Domain**으로 공개 URL 생성
4. **백엔드의 `CORS_ALLOWED_ORIGINS`에 이 프론트 배포 도메인을 추가**해야 함 — 안 하면 `OPTIONS` 요청이 `400 Bad Request`로 거부됨
5. 환경변수를 나중에 추가/수정했다면 반드시 재배포(Redeploy)해야 반영됨 (`NEXT_PUBLIC_*`은 빌드 시점에 코드에 박히는 값이라 런타임에 바뀌지 않음)

## 백엔드 연동 시 주의사항

**CORS**: 백엔드가 다른 출처에서 도는 만큼, FastAPI 쪽 `CORS_ALLOWED_ORIGINS` 환경변수에 이 프론트의 출처(로컬은 `localhost:3000`, 배포는 Railway 도메인)가 등록되어 있어야 합니다.

**API 키 vs 로그인**: 메인 채팅(`/`)은 API 키(`X-API-Key`, 서버 간 인증 방식), 대시보드(`/logs`)는 JWT 로그인(사람이 직접 인증)로 완전히 다른 인증 트랙을 씁니다. 계정을 새로 발급해도 채팅 기능만 쓸 거라면 로그인 정보(`set_login.py`)까지 만들 필요는 없습니다.

**id vs API 키**: 계정 조회용 `id`(UUID)와 인증용 `API 키`는 다른 값입니다. `create_account.py` 실행 결과에서 맨 아래 출력되는 값(`fbl_dev_...`)이 실제 키이며, 발급 시점에만 표시되고 DB에는 해시만 저장되어 재조회가 불가능합니다.

## 다음 단계

- [ ] 대화 히스토리(멀티턴) UI
- [ ] 캐릭터 핸드오프 시각적 전환 효과