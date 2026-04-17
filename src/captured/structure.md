# NRS 목표 페이지 — 컴포넌트 구조

## 페이지 URL
`https://hrp.newrrow.com/nrs/working-station/goals`

## 레이아웃 최상위 트리
```
App (React, TanStack Router)
└── div#root
    └── div#tanstack-router-root
        └── div.muix-tw                        # MUI X + Tailwind 래퍼
            └── PageFrameBase                  # 전체 레이아웃 컨테이너 (flex row)
                ├── SidePanel                  # 왼쪽 사이드바 (200px 고정)
                │   ├── SideHeader             # 로고 + 앱명 + 알림 아이콘
                │   ├── NrsPointBanner         # 포인트 배너 (그라디언트)
                │   ├── LnbList                # 네비게이션 메뉴 목록
                │   │   └── LnbSingleMenuItem  # 단일 메뉴 아이템 (active: bg #f5f5f5)
                │   │       (홈, 목표★, 할 일, 팀, 회의, 대시보드, 그라운드룰, 성과 진단, 포인트)
                │   ├── NrsAgentButton         # NRS 에이전트 + BETA 배지
                │   ├── HelpDeskButton         # 헬프 데스크
                │   └── UserProfile            # 아바타 + 이름 + 이메일
                │
                └── MainContent                # 오른쪽 메인 (flex: 1)
                    ├── GoalsTopPanel          # 상단 툴바 (height: 48px)
                    │   ├── OkitButton         # "전사 OKIT" (그라디언트, radius: 20px)
                    │   ├── ViewToggle         # 맵 | 리스트★ (toggle button group)
                    │   ├── SearchBox          # 검색 입력 필드
                    │   └── RightTools
                    │       ├── CompleteToggle # "완료 목표 포함" 체크박스
                    │       ├── PeriodSelect   # 누적/기간 셀렉트
                    │       └── CreateButton   # "+ 목표 생성" (dark button)
                    │
                    └── GoalListView           # 트리 테이블 (flex: 1, overflow-y: auto)
                        ├── GoalListViewTreeHeader  # 고정 헤더 (bg: #eaeaea)
                        │   └── Columns: [목표 유형 | 목표명 | 상태 | 기간 | 담당자 | 팀 | 목표 | 진행률 | 달성률 | 성과 등록]
                        │
                        └── GoalTreeRow (n개, 트리 인덴트 3단계)
                            ├── TypeBadge       # Objective / Key Result / Initiative
                            ├── GoalName        # 목표 텍스트 (font-weight: 400)
                            ├── StatusBadge     # 진행 / 완료 (colored chip)
                            ├── DateRange       # "26.01.01 ~ 26.06.30"
                            ├── AssigneeAvatar  # 담당자 아바타 + 이름
                            ├── TeamName        # 팀명
                            ├── TargetValue     # 목표값
                            ├── ProgressCell    # 진행률 % + 프로그레스바
                            ├── AchievRate      # 달성률 %
                            └── RegisterButton  # "성과 등록" 버튼 (rollup 행은 "↻ 성과 불입정")
```

## 컴포넌트 상세

### TypeBadge (목표 유형)
| 유형 | bg | text |
|------|-----|------|
| Objective | `#fff0f3` | `#ef2e62` |
| Key Result | `#f2f1fe` | `#6358d5` |
| Initiative | `#e9fafb` | `#00b6c7` |
- 공통: `border-radius: 4px`, `font-size: 12px`, `font-weight: 600`, `padding: 2px 6px`

### StatusBadge (상태)
| 상태 | bg | text |
|------|-----|------|
| 진행 | `#f0f9ff` | `#2ca4fb` |
| 완료 | `#e6fef0` | `#08bf52` |

### Button 종류
| 버튼 | bg | radius | 용도 |
|------|-----|--------|------|
| Primary (목표 생성) | `#343434` | `6px` | 주요 액션 |
| OKIT | gradient `#20c997→#01c3d5` | `20px` | 전사 OKR 보기 |
| Toggle Active (리스트) | `#343434` | `4px` | 뷰 전환 |
| Toggle Default (맵) | `transparent` | `4px` | 뷰 전환 |
| Register (성과 등록) | `#ffffff` + border `#d2d2d2` | `4px` | 성과 입력 |

### 트리 인덴트 구조
- Depth 0 (Objective): indent 없음
- Depth 1 (Key Result): padding-left `24px`
- Depth 2 (Initiative): padding-left `48px`

### 특수 상태
- **조회할 수 없는 목표** (`okitType === null`): 회색 텍스트 + ℹ️ 아이콘. 권한 없는 목표.
- **Rollup 활성 행** (`rollupEnabled === true`): "성과 등록" 대신 "↻ 성과 불입정" — 자녀에서 자동 롤업됨.

## 기술 스택 (원본 페이지)
- React (TanStack Router)
- MUI X (muix 클래스)
- Tailwind CSS (utility classes)
- CSS Modules (BEM-style hashed class names e.g. `GoalTreeRow-module__row--3P8ho`)
- 폰트: Pretendard (primary), Noto Sans KR (fallback)

## 재구현 스택 (이 프로젝트)
- React 19 + TypeScript + Vite
- Tailwind CSS v4 (`@theme` + CSS 변수로 토큰 단일 소스)
- React Router v7
- 상태: useState (프로토타이핑이라 외부 store 미사용)
- 데이터: `src/captured/api-mock.json` 직접 import (네트워크 X)
