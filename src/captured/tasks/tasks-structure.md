# NRS 할 일 (Tasks) 페이지 컴포넌트 구조

**URL:** https://hrp.newrrow.com/nrs/working-station/tasks  
**캡처일:** 2026-04-17  
**베이스:** 목표(Goals) 페이지와 동일한 MUIX 디자인 시스템

---

## 1. 페이지 레이아웃 (Layout)

```
<PageLayout>
  ├── <GlobalNav>            (좌측 사이드바 - 목표 페이지와 동일)
  ├── <TasksMainPanel>       (중앙 메인 콘텐츠 영역)
  │     ├── <PageHeader>
  │     ├── <RecommendationPanel>
  │     └── <GoalGroupList>
  └── <WeeklyCalendarPanel>  (우측 캘린더 패널 - Tasks 페이지 신규)
```

---

## 2. GlobalNav (좌측 사이드바)

목표 페이지와 동일한 구조. 생략.

- 로고 + "NRS" 텍스트
- NRS 포인트 배지 (331P)
- 메뉴: 홈, 목표, **할 일** (현재 활성), 팀, 회의, 대시보드, 그라운드룰, 성과 진단, 포인트
- 하단: NRS 에이전트, 헬프 데스크, 사용자 정보

---

## 3. TasksMainPanel (중앙 패널)

### 3-1. PageHeader

```
<PageHeader>
  ├── <Title>할 일</Title>
  └── <CompletedFilterButton>완료 목표, 업무</CompletedFilterButton>
```

| 속성 | 값 |
|------|-----|
| 타이틀 폰트 | 20~24px, bold |
| 필터 버튼 | 우측 정렬, stroke 스타일 버튼 |

---

### 3-2. RecommendationPanel (오늘의 업무 추천)

```
<RecommendationPanel collapsible={true}>
  ├── <Header>
  │     ├── <ChevronIcon /> (토글)
  │     └── <Label>오늘의 업무 추천</Label>
  └── <Content>
        └── <EmptyState>오늘은 추천할 업무가 없어요.</EmptyState>
              (또는 추천 업무 리스트)
```

| 속성 | 값 |
|------|-----|
| 배경 | 연한 회색/흰색 카드 |
| 빈 상태 | 일러스트 아이콘 + 텍스트 |

---

### 3-3. GoalGroupList (목표별 그룹 리스트)

```
<GoalGroupList>
  ├── <GoalSection goalId="...">             // 목표에 연결된 섹션 (반복)
  │     ├── <GoalSectionHeader>
  │     │     ├── <ChevronIcon />            // 접기/펼치기
  │     │     ├── <GoalTitle>               // (일잘사)목표명 or (일잘팀)목표명
  │     │     ├── <ProgressCounter>9/34</ProgressCounter>
  │     │     └── <AddTaskButton>+ 업무 추가</AddTaskButton>
  │     └── <TaskItemList>
  │           └── <TaskItem> × N            // 할 일 아이템 (반복)
  │
  └── <GoalSection goalId="unlinked">       // 목표 미연결 섹션
        ├── <GoalSectionHeader>
        │     ├── <GoalTitle>목표 미연결</GoalTitle>
        │     ├── <ProgressCounter>69/342</ProgressCounter>
        │     └── <AddTaskButton>+ 업무 추가</AddTaskButton>
        └── <TaskItemList>
              └── <TaskItem> × N
```

**목표 섹션 헤더 스타일:**
| 속성 | 값 |
|------|-----|
| GoalTitle 폰트 | 14px, font-weight: 600 |
| GoalTitle 색상 | rgb(71, 71, 71) |
| ProgressCounter | 12px, 회색 계열 |
| AddTaskButton | 텍스트 버튼, 파란색 |

---

### 3-4. TaskItem (할 일 아이템)

```
<TaskItem>
  ├── <DragHandle />              // 드래그 핸들 (좌측 grip 아이콘)
  ├── <CheckboxArea>
  │     └── <Checkbox />          // 완료 체크박스 (circle 스타일)
  ├── <TaskTitle>                 // 할 일 제목 텍스트
  │     └── (optional) <SubtaskCounter>N</SubtaskCounter>  // 하위 업무 수
  ├── <KeyTaskBadge>핵심 업무</KeyTaskBadge>  // (옵션) 핵심 업무 배지
  ├── <EditButton />              // 수정 버튼 (hover 시 노출)
  ├── <MoreOptionsButton />       // 더보기 버튼 (hover 시 노출)
  ├── <StatusBadge>              // 상태 배지 (대기/진행/완료)
  ├── <DueDateField>             // 마감일 (📅 26.07.25 or 미지정)
  ├── [빈 공간]                  // 보기/숨기기 버튼 위치
  ├── <PriorityBadge>            // 우선순위 (낮음/보통/높음)
  └── <AchievementButton>
        └── <Icon /> 성과 등록
```

**TaskItem 필드 스타일:**

| 필드 | 색상 | 폰트 크기 | 비고 |
|------|------|----------|------|
| 할 일 제목 | rgb(33, 33, 33) | 14px | 완료 시 취소선 처리 추정 |
| 핵심 업무 배지 | rgb(244, 107, 29) = #f46b1d | 12px, 600 | 오렌지 색상 |
| 상태: 대기 | rgb(71, 71, 71) = #474747 | 12px, 600 | 중간 회색 |
| 상태: 진행 | rgb(44, 164, 251) = #2ca4fb | 12px, 600 | 파란색 |
| 상태: 완료 | rgb(8, 191, 82) = #08bf52 | 12px, 600 | 초록색 |
| 우선순위: 보통 | rgb(44, 164, 251) = #2ca4fb | 12px, 600 | 파란색 (진행 동일) |
| 우선순위: 높음 | rgb(253, 73, 63) = #fd493f | 12px, 600 | 빨간색 |
| 마감일 | rgb(107, 114, 128) (추정) | 12px | 캘린더 아이콘 선행 |
| 하위 업무 수 | 중간 회색 | 11~12px | 숫자 badge |
| 성과 등록 버튼 | 파란색 계열 | 12px | icon + text |

---

## 4. WeeklyCalendarPanel (우측 캘린더)

> 목표 페이지에는 없는 Tasks 페이지 전용 우측 패널

```
<WeeklyCalendarPanel>
  ├── <CalendarHeader>
  │     ├── <MonthTitle>2026.04</MonthTitle>
  │     ├── <PrevButton />
  │     ├── <WeekDayHeaders>  // 일 월 화 수 목 금 토
  │     │     └── <DayButton>N</DayButton> × 7  // 날짜 버튼 (오늘: 파란 원형)
  │     ├── <NextButton />
  │     └── <FocusModeButton>업무 집중 모드</FocusModeButton>
  ├── <AllDayRow>종일</AllDayRow>
  ├── <TimelineBody>
  │     ├── <TimeSlotList>      // 00:00 ~ 23:50 (10분 단위)
  │     │     └── <TimeSlot label="HH:MM AM/PM" />
  │     └── <EventBlockList>
  │           └── <EventBlock>  // 할 일과 연동된 일정 블록
  │                 ├── <EventTitle>최종진단 차트 제작</EventTitle>
  │                 └── <EventTime>09:00 - 10:00</EventTime>
  └── <Footer>
        ├── <DailySummaryButton>하루 정리하기</DailySummaryButton>
        └── <SettingsButton />
```

**캘린더 이벤트 블록 스타일:**
| 속성 | 값 |
|------|-----|
| 배경색 | rgb(191, 219, 254) = #bfdbfe (연한 파란색) |
| 폰트 크기 | 12~13px |
| 테두리 | 좌측 강조 선 (파란색) 추정 |
| 오늘 날짜 강조 | rgb(44, 164, 251) = #2ca4fb 원형 배경 |

---

## 5. 하단 고정 영역 (Quick Add)

```
<QuickAddBar fixed="bottom">
  ├── <GoalSelector>목표 미연결 ▼</GoalSelector>  // 목표 선택 드롭다운
  ├── <TaskInput placeholder="목표를 선택한 후 업무를 등록해 주세요." />
  └── <SubmitButton />
```

---

## 6. 필드 존재 여부 체크리스트

| 필드 | 존재 여부 | 비고 |
|------|----------|------|
| 목표(Goal) 연결 | ✅ 있음 | 섹션 그룹핑 방식. 각 섹션 헤더 = 연결된 목표명 |
| 우선순위 (priority) | ✅ 있음 | 낮음 / 보통 / 높음 (3단계) |
| 핵심 업무 플래그 | ✅ 있음 | 별도 배지로 표시 (#f46b1d 오렌지) |
| 마감일 (due date) | ✅ 있음 | YY.MM.DD 형식, 미지정 가능 |
| 상태 (status) | ✅ 있음 | 대기 / 진행 / 완료 |
| 하위 업무 수 | ✅ 있음 | 숫자 배지로 표시 |
| 성과 등록 | ✅ 있음 | 각 아이템마다 액션 버튼 |
| 시간 추정 (estimated time) | ❌ 미확인 | 현재 화면에서 별도 필드 미발견 |
| 영향력 / 중요도 | ❌ 미확인 | 현재 화면에서 별도 필드 미발견 |
| 진행률 카운터 | ✅ 있음 | 완료수/전체수 (예: 9/34) |
| 드래그 정렬 | ✅ 있음 | 아이템 드래그 앤 드롭 가능 |
| 오늘의 업무 추천 | ✅ 있음 | AI 기반 추천 패널 (상단) |
| 캘린더 연동 | ✅ 있음 | 우측 주간 캘린더 (Tasks 전용 기능) |
| 업무 집중 모드 | ✅ 있음 | 캘린더 패널 상단 버튼 |
| 하루 정리하기 | ✅ 있음 | 캘린더 패널 하단 버튼 |

---

## 7. 목표(Goals) 페이지 대비 차이점

| 구분 | 목표 페이지 | 할 일 페이지 |
|------|-----------|------------|
| 우측 패널 | 없음 (또는 다른 패널) | 주간 캘린더 패널 |
| 그룹핑 기준 | 목표 자체 계층 | 목표별 할 일 그룹 |
| 핵심 필드 | OKR 지표, 달성률 | 상태, 우선순위, 마감일, 핵심업무 |
| 하단 퀵 추가 | 목표 추가 | 업무 추가 (목표 선택 후) |
| 오늘 추천 | 없음 | 오늘의 업무 추천 패널 있음 |
| 성과 등록 버튼 | 목표 레벨 | 각 할 일 아이템 레벨 |
