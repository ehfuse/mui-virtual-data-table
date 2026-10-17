# Changelog

## 1.2.0

### Added

- **노션풍 목록을 한 표로 — 넓은 피벗 · 묶음 · 페이지에 얹는 표를 지원합니다.** 모두 선택 옵션이라 기존 화면은 그대로입니다.
  - `framed={false}` — 노션풍 바깥 테두리 · 종이 여백 없이, 이미 테두리를 두른 상자에 표를 꽉 채웁니다.
  - `tableLayout="auto"` — 열 폭이 내용을 따르고 넘치면 가로로 밉니다. `rowHeightMode="auto"` — rowHeight 를 최소 높이로 두고 줄이 내용만큼 늘어납니다.
  - `autoHeight` — 가상화 · 자체 스크롤 없이 내용 높이만큼 그립니다(페이지가 굴리는 표).
  - `renderFullWidthRow` · `fullWidthRowSx` — 묶음 띠 줄(모든 열을 합친 한 칸). 접기는 소비처가 data 에서 뺍니다.
  - `onRowContextMenu`.
  - 열 옵션: `pinned: "left"`(첫 열 고정), `primary`(본문 15px), `onCellClick`(칸 단위 누르기 · 호버), `rowSpan`, `cellPadding`, `cellStyle`, `headerProps`.
- **노션풍 기본값** — 줄 높이 48, 선택 줄 모양(`selectedRowSx` 를 안 주면 `#dbeafe` 바탕 + 왼쪽 3px `#3b82f6`, 다크 포함),
  문자열 빈 목록은 머리 아래 옅은 글 한 줄, 합계 줄은 본문과 같은 여백 · 옅은 윗선.

### Fixed

- 가로 휠(트랙패드 옆 밀기 · Shift+휠)을 막지 않습니다 — 세로 휠만 직접 처리해 넓은 표를 옆으로 밀 수 없었습니다.


## 1.1.35

### Fixed

- **휠로 맨 위(또는 맨 아래)까지 올린 뒤 스크롤바가 사라지지 않던 문제를 고쳤습니다.** 표가 `@ehfuse/overlay-scrollbar` 를 번들에 품고 있어 빌드 당시의 옛 판이 굳어 있었습니다 — 스크롤바 패키지에서 고친 내용이 표에는 닿지 않았습니다. 이제 번들에 넣지 않고 의존성(`^1.7.30`)으로 앱의 한 벌을 씁니다.

  Fixed the scrollbar staying visible after wheeling to the top. The table used to bundle a stale copy of `@ehfuse/overlay-scrollbar`; it is now an external dependency (`^1.7.30`) so fixes there reach the table.

## 1.1.34

### Changed

- **`variant="notion"` 에 바깥 테두리와 종이 여백을 더했습니다.** 표 둘레에 1px 테두리(4px 모서리)를 긋고 종이 사방에 여백(좌우 `paddingX`, 상하 12px)을 둬 `@ehfuse/taskbox` 목록표와 같은 틀이 됩니다. 머리의 윗선·좌우선은 테두리가 대신합니다.

  `variant="notion"` now draws an outer 1px frame (4px radius) and pads the paper on all sides (horizontal `paddingX`, vertical 12px), matching `@ehfuse/taskbox` list tables.

## 1.1.33

> 1.1.32 는 npm 이 staged 상태로 잡아 두어(등록 뒤 목록에 안 보이고 같은 번호로 다시 못 올림) 1.1.33 으로 배포한다.

### Added

- **`variant="notion"` — 노션풍 표 모양을 추가했습니다.** `@ehfuse/taskbox` 목록표와 같은 값(머리 40px · 13px 회색 머리글 · 칸 사이 세로선 · 옅은 가로선 `#e6e6e3` · 단색 호버 `#f8f8f7`, 다크는 같은 이름의 다크 값)이라, 업무함 표와 나란히 쓰이는 목록(전자결재·게시판)이 다른 제품처럼 보이지 않습니다. 기본값 `"default"` 는 종전 모양 그대로이고, `columnHeight`·`paddingX`·`rowHoverColor`·`rowHoverOpacity` 를 직접 주면 그 값이 이깁니다.

  Added `variant="notion"`: a Notion-like table look (40px header, 13px grey header text, vertical cell dividers, light row borders, flat hover) matching `@ehfuse/taskbox` list tables. `"default"` is unchanged; explicit `columnHeight`/`paddingX`/`rowHoverColor`/`rowHoverOpacity` still win.

## 1.1.31

### Fixed

- **정렬/검색/필터로 목록을 1페이지로 되돌린 뒤 무한 스크롤이 영구히 멈추던 문제를 수정했습니다.** (1.1.29 회귀)
  - 1.1.29 가 "바닥 떨림"(서버 소진 후 `onLoadMore` 무한 반복)을 막으려고 넣은 더보기 잠금(`lastLoadMoreLengthRef`)이, 목록 교체로 길이가 우연히 같아지면(예: page2 로 늘렸다가 정렬로 다시 50건) `요청한 길이 === 현재 길이`가 되어 `onLoadMore` 를 다시 호출하지 않고 데드락됐습니다.
  - 이미 있던 '진짜 교체' 판별(첫 행 식별자 + 길이)에 맞춰, **교체가 감지되면 더보기 잠금을 함께 해제**하도록 했습니다. append·서버 소진(빈 응답)은 교체로 보지 않으므로 1.1.29 가 고친 바닥 떨림은 재발하지 않습니다.

  Fixed a deadlock (regression from 1.1.29) where infinite scroll permanently stopped after sort/search/filter reset the list to page 1: the load-more latch is now released when a genuine data replacement is detected (first-row id / length), while append and exhausted-server (empty) responses still keep the latch so the 1.1.29 bottom-jitter fix stays intact.

> 참고: npm 에 1.1.30 이 있었으나 1.1.29 와 동일 커밋의 버전업(코드 변경 없음)이라, 이 수정은 1.1.31 로 배포합니다.

## 1.1.29

### Fixed

- **무한 스크롤 바닥에서 목록이 떨리고 맨 위로 튀던 문제를 수정했습니다.**
  - `data` 참조가 바뀌면 길이만 보고 "정렬/필터로 교체됐다"고 오판해 `scrollToIndex(0)`(맨 위)로 스크롤하던 로직을, **첫 행 식별자(`getRowId`)와 길이로 '진짜 교체' 여부를 판별**하도록 바꿨습니다. 체크박스 토글·무한 스크롤 빈 결과·부모 리렌더로 같은 목록의 새 배열이 내려와도 스크롤 위치를 유지합니다. (정렬/필터 등 실제 교체 시에는 그대로 맨 위로 이동)
  - 바닥에 도달한 뒤 서버에 더 이상 데이터가 없어도 `endReached ↔ onLoadMore`가 무한 반복되던 문제를 막았습니다. **직전 요청 이후 데이터 길이가 늘지 않았으면 같은 길이로는 `onLoadMore`를 다시 호출하지 않습니다.**

  Fixed list jitter / jump-to-top at the bottom of infinite scroll: the scroll-to-top on data change now only triggers on a genuine replacement (first-row id or length change) instead of any new same-length array, and `onLoadMore` is no longer called repeatedly at the bottom once the data length stops growing.

> 참고: 1.1.27 / 1.1.28 은 git 커밋 없이 npm 에만 배포된 버전으로, 데이터 행 높이의 서브픽셀로 인해 sticky 합계행(`<tfoot>`)이 1px 떨리던 문제를 수정(행 높이를 `estimatedItemHeight` 로 정수 고정, footer 셀 높이 고정 및 border→inset box-shadow)한 내용이었습니다. 이 1.1.29 릴리스에 해당 수정이 함께 포함되어 git 과 npm 이 다시 일치합니다.
