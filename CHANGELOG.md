# Changelog

## 1.9.2

### Fixed

- `autoHeight` + 노션풍 틀(`framed`, 기본값)에서 표가 늘 16px 가로로 넘쳐 가로 막대가 서던 것 — 표의 오른쪽 덧여백(가상 스크롤러용)을 autoHeight 상자에서는 0 으로 둔다.

## 1.9.0

### Added

- `rowReorder` — 줄 끌어 옮기기. 첫 칸에 손잡이(⋮⋮)가 서고, 끌어 놓으면 `onReorder(from, to, item)` 를 부른다(표는 data 를 바꾸지 않는다).
  끄는 동안 놓을 자리에 선을 긋고 끌던 줄은 흐려진다 — 줄 DOM 속성만 바꿔 React 가 다시 그리지 않으니 가상화 · 긴 목록에서도 가볍다.
  가장자리로 끌면 자동으로 굴린다(표 스크롤 · 바깥 스크롤 · 문서). 키보드: 손잡이에 초점 → Space → ↑ ↓ → Space · Enter · Esc.
- `rowReorder.canDrag` 로 줄마다 끌 수 있는지, `disabledReason` 으로 정렬 · 거르기 중 끌기 막기(손잡이 흐림 + title), `handleWidth` · `handleLabel`.
- 폰 목록(`mobile`)에서는 카드 왼쪽에 손잡이가 선다. 고정 열이 있으면 손잡이 열도 함께 고정된다. 머리 안 고정 줄(`pinnedRows`)은 옮길 수 없다.

## 1.8.1

### Fixed

- 남는 폭을 갖는 열이 없는 표(모든 열이 숫자 폭)에서 한 열을 끌면 표가 열 폭 합으로 줄며 다른 열이 모두 움찔하던 것 — 첫 끌기 때 지금 그려진 폭을 모든 열의 폭으로 붙잡습니다.

## 1.8.0

### Added

- `columnResize` — 머리 칸 오른쪽 경계를 끌어 열 폭을 바꾼다(호버 때 얇은 선, 두 번 누르면 처음 폭). 끄는 동안은 표 상자의 CSS 변수만 바꿔 줄을 다시 그리지 않는다.
- `columnWidths` · `onColumnWidthsChange` — 바꾼 폭을 소비처가 쥔다(놓을 때 한 번 알린다). 표는 저장소를 모른다.
- 폰 목록(`mobile`)으로 그릴 때는 손잡이도 바꾼 폭도 쓰지 않는다.

## 1.5.3

### Fixed

- `HeaderMenu` 의 `header` · `children` 을 Fragment 로 감싸 넣어 MUI Menu 가 개발 모드에서 Fragment 경고를 내던 것 — 풀어 넣습니다.

## 1.5.2

### Fixed

- 머리 메뉴 항목 높이가 34px 가 아니라 28px 이던 것 — MenuItem 의 넓은 화면 규칙(min-height: auto)이 이겼습니다. 줄 높이 20 + 위아래 7 로 정합니다.
- 노션풍 오른쪽 맞춤 정렬 칸(합계)의 정렬 화살표가 1.5.0 의 한 줄 말줄임(overflow hidden)에 잘리던 것 — 화살표 자리를 머리글 상자 안에 둡니다.

## 1.5.1

### Added

- `HeaderFilterIcon` — 머리 칸 거르기 표시. @ehfuse/mui-filter-button 의 TuneIcon 과 같은 그림의 작은 판(14px, 글자색을 따르고 `active` 면 강조색).
  머리 줄 필터 단추와 머리 칸 거르기가 같은 물건으로 읽히게 합니다.

### Changed

- 거를 수 있는 열(`filterOptions` + `onFilterChange`)의 머리글에 늘 거르기 아이콘이 붙습니다(걸리면 강조색 · 굵게). 1.4 는 걸렸을 때만 붙었습니다.

## 1.5.0

### Added

- **머리 메뉴 공용 부품 `HeaderMenu`** — 정렬(오름 · 내림 · 풀기) · 값 거르기(여러 개 체크 / 하나 라디오 · "비어 있음" · 값이 많으면 찾기 칸 · 거르기 풀기)를
  필요한 것만 그립니다. 화면이 직접 띄우는 머리 메뉴(머리글 단추 · 도구 줄 단추)도 같은 모양을 쓰게 export 합니다 —
  `HeaderMenuItem` · `HeaderMenuDivider` · `HeaderMenuIcon` · `headerMenuAnchor(요소)` · 크기 상수(`HEADER_MENU_FONT_SIZE` 14 · `HEADER_MENU_ICON_SIZE` 18 · `HEADER_MENU_ITEM_HEIGHT` 34 · `HEADER_MENU_ITEM_SX`).
  고를 값은 `icon`(색 점 · 아바타) · `render`(색 칩) · `count` 를 받습니다.
- 표의 내장 머리 메뉴도 `HeaderMenu` 로 그립니다(모양 통일). 열 옵션 `filterEmptyLabel` · `filterSearchable`, `filterOptions` 는 `HeaderMenuOption[]`.

### Changed

- 노션풍 머리 칸은 한 줄입니다 — 칸 폭보다 긴 머리글이 두 줄로 꺾여 머리 줄이 높아지던 것을 말줄임으로. 글자 머리는 `title` 툴팁으로 전체 이름을 보입니다.
- 하나만 고르는 거르기(`filterMultiple: false`)는 라디오 표시입니다(체크 표시 → 라디오).

## 1.4.3

### Fixed

- **노션풍 머리 글자가 칸 가운데보다 살짝 위로 떠 보이던 것.** 아이콘 + 글자를 inline-flex 로 묶은 머리(월별 표 · 업무함 표 · 머리글 필터)가 기준선에 서서
  아래에 글자 내림 자리가 남았습니다. 머리 칸의 바로 아래 요소를 `vertical-align: middle` 로 세웁니다.

## 1.4.2

### Fixed

- **빈 목록에서 머리 칸 클릭 · 우클릭이 먹지 않던 것.** 빈 목록 안내 상자가 표 전체(머리 포함)를 덮어 정렬 · 머리 메뉴를 가로챘습니다.
  상자는 눌림을 통과시키고 가운데 내용만 눌립니다(노션풍 글 한 줄 안내는 통째로 통과).

## 1.4.1

### Added

- 열 옵션 `sortMenu` — 머리 우클릭 메뉴의 정렬 항목을 `sortable` 과 따로 켜고 끕니다. 머리를 직접 그리고 클릭을 `headerProps` 로 다는 열(@ehfuse/taskbox 목록표)은
  `sortable` 을 켜면 표의 정렬 표시 · 클릭이 겹쳐 두 번 뒤집히므로, `sortable` 없이 `sortMenu: true` 로 메뉴에만 정렬을 둡니다.

## 1.4.0

### Added

- **머리 칸 우클릭 메뉴.** 머리 칸(th)을 우클릭하면 브라우저 메뉴 대신 정렬 · 거르기 메뉴가 그 칸 아래(누른 가로 자리)에 바로 뜹니다.
  - 정렬 — `sortable` 열 + `onSort` 가 있으면 "오름차순 정렬 · 내림차순 정렬". `onSortClear` 를 주면 그 열로 정렬 중일 때 "정렬 풀기"(같은 방향을 다시 골라도 풉니다).
  - 거르기 — 열 옵션 `filterOptions` · `filterValues` · `onFilterChange` · `filterMultiple`(기본 여러 개). 고른 값이 있으면 "거르기 풀기", 머리글은 강조색 + 거르기 아이콘.
  - `onHeaderContextMenu(column, event)` — 화면이 이미 가진 머리 메뉴를 우클릭에도 열 때. true 를 돌려주거나 `preventDefault()` 하면 기본 메뉴를 띄우지 않습니다.
  - 열 옵션 `headerMenu: false` — 그 열은 메뉴를 띄우지 않습니다.

### Changed

- 머리 칸(묶음 머리 포함)에서는 브라우저 우클릭 메뉴가 뜨지 않습니다(정렬 · 거르기가 없는 열도). 왼쪽 클릭 정렬은 그대로입니다.

## 1.3.2

### Added

- `headerTopBorder` (노션풍 · `framed={false}`) — 머리 줄 윗선. 틀 없는 표를 도구 줄과 한 상자에 넣으면 표 머리 위가 경계 없이 붙던 것을 긋습니다.

## 1.3.1

### Fixed

- **`rowKeyFromId` 를 안 쓰는 가상 표가 그려지지 않던 것(1.3.0).** `computeItemKey={undefined}` 를 그대로 넘겨 react-virtuoso 의 기본 키 함수가 덮였다("n is not a function"). 쓸 때만 넘깁니다.

## 1.3.0

### Added

- **업무함 목록 표(@ehfuse/taskbox)를 VDT 로 그리기 위한 공용 옵션.** 모두 선택 옵션이라 기존 화면은 그대로입니다.
  - `pinnedRows` · `pinnedRowsMaxHeight` · `pinnedRowsSx` — 머리 줄 바로 아래 붙어 스크롤과 무관하게 늘 보이는 줄들("미확인 · 검수 대기").
    본문과 같은 열 · 칸 · 묶음 띠 줄 · 클릭 · 우클릭 · 선택 모양을 쓰고, 최대 높이를 넘으면 그 영역만 따로 굴립니다(휠도 그 영역부터).
  - 열 옵션 `colSpan(item, index)` — 줄마다 칸을 오른쪽 열까지 합칩니다(일정 줄의 참석자 칸이 책임자 · 참조자 두 칸을 차지).
  - 열 옵션 `minWidth` — width 를 비운(남는 폭을 가져가는) 열의 최소 폭. 표 최소 폭 = 열 폭 합, 좁으면 가로로 밉니다.
  - `resetScrollOnDataChange={false}` — 줄이 빠져도(묶음 접기 · 완료 숨기기) 맨 위로 튀지 않습니다. 조건이 바뀔 때는 표의 key 로 다시 그립니다.
  - `rowKeyFromId` — 줄 key 를 getRowId 로. 칸 안 입력 상태가 위에 줄이 끼어들 때 다른 줄로 옮겨 가지 않습니다.
  - `onEndReached` — 목록 끝에 닿을 때마다 그대로 알립니다(onLoadMore 의 최소 30개 · 같은 길이 막기 없음).
  - `colorMode="dark" | "light"` — 노션풍 색을 앱 MUI 테마와 따로 정합니다(앱은 밝은데 업무함만 다크).

### Changed

- 머리(thead) 높이 · 굵기 규칙이 바로 아래 머리 줄에만 걸립니다(`& > tr`) — 머리 안에 그리는 고정 줄 영역이 머리 높이를 받지 않게. 머리 줄 모양은 같습니다.

## 1.2.1

### Fixed

- **노션풍 마지막 줄 아래선이 틀 바닥과 겹쳐 이중선으로 보이던 것.** 틀 바닥(또는 합계 줄 윗선)과 맞닿을 때는 마지막 줄 아래선을 긋지 않습니다 —
  내용 높이만큼 서는 표(`autoHeight`), 줄이 영역보다 길어 끝까지 내리면 바닥에 닿는 표, 합계 줄이 있는 표. 줄이 적어 아래가 비는 표는 그대로 긋습니다.

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
