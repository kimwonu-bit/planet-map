# DevUniverse 🌌

GitHub 활동을 3D 태양계로 시각화하는 개발자 성장 대시보드

- **항성**: 나의 GitHub 계정
- **행성**: 사용하는 프로그래밍 언어 (커밋 수 → 크기·밝기)
- **위성**: 사용하는 프레임워크 / 라이브러리
- **미개척 행성**: AI가 추천하는 다음 학습 언어

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 16, React 19, Three.js (@react-three/fiber) |
| Backend | Next.js App Router API Routes |
| 인증/DB | Supabase (선택사항) |
| 데이터 | GitHub GraphQL API, GitHub REST API |
| AI | Anthropic Claude API (선택사항) |
| 스타일 | Tailwind CSS v4, shadcn/ui |

## 시작하기

### 1. 저장소 클론 및 의존성 설치

```bash
git clone https://github.com/your-username/planet-map.git
cd planet-map
pnpm install
```

### 2. 환경변수 설정

```bash
cp .env.local.example .env.local
```

`.env.local`을 열어 아래 값을 입력합니다.

| 변수 | 필수 | 설명 |
|------|------|------|
| `GITHUB_TOKEN` | ✅ | GitHub PAT (`read:user`, `repo` 스코프) |
| `NEXT_PUBLIC_SUPABASE_URL` | ❌ | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ❌ | Supabase anon key |
| `ANTHROPIC_API_KEY` | ❌ | Claude AI 로드맵 생성용 |

> Supabase 미설정 시 로그인 없이 GitHub 사용자명을 직접 입력해 사용할 수 있습니다.  
> Anthropic API 미설정 시 내장 설명으로 자동 대체됩니다.

### 3. 개발 서버 실행

```bash
pnpm dev
```

[http://localhost:3000](http://localhost:3000)에서 확인

### 4. (선택) Supabase DB 설정

Supabase 대시보드 SQL Editor에서 `lib/db/schema.sql`을 실행하면 캐시 테이블이 생성됩니다.

## 주요 기능

- **실시간 GitHub 데이터 연동**: 커밋 수, 연속 커밋 일수, 오늘 커밋 집계
- **자동 프레임워크 감지**: `package.json`, `requirements.txt`, `go.mod`, `Cargo.toml` 파싱
- **궤도 자동 배치**: 커밋 비율에 따라 행성 크기·궤도 반지름 자동 계산
- **AI 로드맵**: Claude가 현재 스택을 분석해 다음 학습 언어와 학습 방법 제안
- **6시간 캐싱**: GitHub Rate Limit 절약 (Supabase 설정 시)

## 프로젝트 구조

```
app/
  api/users/[username]/
    universe/route.ts   # GET /api/users/{username}/universe
    activity/route.ts   # GET /api/users/{username}/activity
  auth/                 # Supabase OAuth 흐름
  universe/             # 3D 뷰어 페이지
lib/
  github/               # GitHub API 클라이언트 (GraphQL + 의존성 파싱)
  universe/             # 궤도 계산, 데이터 매핑, AI 로드맵, 캐시
  db/schema.sql         # Supabase 테이블 정의
components/
  space/                # Three.js 3D 컴포넌트 (항성, 행성, 위성)
  ui/                   # shadcn/ui 기반 패널 컴포넌트
```

## GitHub Token 발급

[https://github.com/settings/tokens/new](https://github.com/settings/tokens/new)에서 **Classic token** 생성 시 아래 스코프를 선택하세요.

- `read:user` — 프로필 정보
- `public_repo` — 공개 레포 데이터 (비공개 레포까지 분석하려면 `repo`)
