# MUI Virtual Data Table

A high-performance virtual data table component for React with Material-UI integration, featuring virtualized rendering, infinite scroll, keyboard navigation, and customizable styling.

React와 Material-UI를 위한 고성능 가상화 데이터 테이블 컴포넌트입니다. 가상화 렌더링, 무한 스크롤, 키보드 탐색, 커스터마이징 가능한 스타일링을 제공합니다.

## Features

- 🚀 **High Performance**: Virtualized rendering with react-virtuoso for smooth scrolling with large datasets
- ♾️ **Infinite Scroll**: Built-in infinite scroll with automatic loading indicator
- ⌨️ **Keyboard Navigation**: Full keyboard support (Arrow keys, PageUp/Down, Home/End)
- 🎨 **Material-UI Integration**: Seamless integration with MUI components
- 🦓 **Zebra Striping**: Optional alternating row colors with custom color support
- 🔧 **TypeScript Support**: Full TypeScript support with comprehensive type definitions
- 🔄 **Sorting**: Built-in column sorting functionality
- 🎯 **Customizable**: Highly customizable columns, styling, and scrollbar options
- 📊 **Empty State**: Built-in empty state handling with custom message
- 🔍 **Loading State**: Smooth loading transitions with fade-out animation
- 📏 **Grouped Headers**: Support for grouped column headers with dynamic height calculation
- 🎨 **Custom Scrollbar**: Beautiful custom scrollbar with full customization options

## 주요 기능

- 🚀 **고성능**: react-virtuoso를 사용한 가상화 렌더링으로 대용량 데이터셋에서도 부드러운 스크롤
- ♾️ **무한 스크롤**: 자동 로딩 인디케이터가 포함된 무한 스크롤 기능
- ⌨️ **키보드 탐색**: 완전한 키보드 지원 (방향키, PageUp/Down, Home/End)
- 🎨 **Material-UI 통합**: MUI 컴포넌트와의 완벽한 통합
- 🦓 **얼룩말 줄무늬**: 사용자 지정 색상을 지원하는 선택적 행 교차 색상
- 🔧 **TypeScript 지원**: 포괄적인 타입 정의가 포함된 완전한 TypeScript 지원
- 🔄 **정렬**: 내장된 컬럼 정렬 기능
- 🎯 **커스터마이징**: 컬럼, 스타일링, 스크롤바 옵션의 높은 커스터마이징
- 📊 **빈 상태**: 커스텀 메시지를 지원하는 내장된 빈 상태 처리
- 🔍 **로딩 상태**: 페이드아웃 애니메이션이 적용된 부드러운 로딩 전환
- 📏 **그룹 헤더**: 동적 높이 계산을 지원하는 그룹화된 컬럼 헤더
- 🎨 **커스텀 스크롤바**: 완전한 커스터마이징 옵션을 갖춘 아름다운 커스텀 스크롤바

## Installation

```bash
npm install @ehfuse/mui-virtual-data-table
```

## Peer Dependencies

This package requires the following peer dependencies:

```bash
npm install react react-dom @mui/material react-virtuoso
```

## 📚 Documentation

For detailed API reference and usage examples:

- **[한국어 시작하기](./docs/ko/getting-started.md)** - API 설명 및 가이드
- **[한국어 예제 코드](./docs/ko/example.md)** - 다양한 사용 예제
- **[Getting Started (English)](./docs/en/getting-started.md)** - API reference and guide _(coming soon)_

## Quick Start

```tsx
import { VirtualDataTable } from "@ehfuse/mui-virtual-data-table";
import type { DataColumn } from "@ehfuse/mui-virtual-data-table";

interface User {
    id: number;
    name: string;
    email: string;
}

const columns: DataColumn<User>[] = [
    { id: "id", text: "ID", width: 80 },
    { id: "name", text: "Name", width: 200, sortable: true },
    { id: "email", text: "Email", width: 250 },
];

const data: User[] = [
    { id: 1, name: "John Doe", email: "john@example.com" },
    { id: 2, name: "Jane Smith", email: "jane@example.com" },
    // ... more data
];

function App() {
    return (
        <VirtualDataTable
            data={data}
            columns={columns}
            totalCount={data.length}
            loading={false}
        />
    );
}
```

## Basic Props Signature

```tsx
<VirtualDataTable
    // Required
    data={T[]}                              // Data array
    columns={DataColumn<T>[]}               // Column definitions
    totalCount={number}                     // Total data count

    // Optional - Styling
    striped={boolean | string}              // Zebra striping (true: default gray (#f5f5f5), string: custom color, default: false)
    rowDivider={boolean}                    // Show row borders (default: true)
    rowHeight={number}                      // Fixed row height in px (default: 50) — rows keep this height even when showFooter fills a taller container
    columnHeight={number}                   // Header height in px (default: 56, auto 2x for grouped headers)
    showPaper={boolean}                     // Wrap in Paper component (default: true)
    paddingX={string | number}              // Horizontal padding (default: "1rem")
    paddingTop={string | number}            // Top padding (default: 0)
    paddingBottom={string | number}         // Bottom padding (default: 0)
    variant={"default" | "notion"}          // Table look. "notion": Notion-like (40px header, 13px grey header text, cell dividers, flat hover) — matches @ehfuse/taskbox tables
    rowHoverColor={string}                  // Row hover background color (default: "#000000", auto-inverted brightness in dark mode)
    rowHoverOpacity={number}                // Row hover opacity 0-1 (default: 0.06)
    viewportBuffer={number | { top, bottom }} // Viewport outside pre-render buffer in px (default: rowHeight-based auto buffer)

    // Optional - Infinite Scroll
    loading={boolean}                       // Loading state (default: false)
    onLoadMore={(offset, limit) => void}    // Load more callback (enables infinite scroll when provided)
    // ⚠️ onLoadMore 계약: 호출되면 반드시 이행해서 data 가 늘어나거나 loading 이 토글돼야 합니다.
    //    (정렬/검색/필터로 목록을 1페이지로 되돌리면 컴포넌트가 자동으로 더보기 잠금을 풀어 재개합니다.)

    // Optional - Sorting
    sortBy={string}                         // Current sort field
    sortDirection={"asc" | "desc"}          // Current sort direction
    onSort={(id, direction) => void}        // Sort callback

    // Optional - Interactions
    onRowClick={(item, index) => void}      // Row click handler

    // Optional - Customization
    emptyMessage={string | React.ReactNode} // Empty state message (default: "NO DATA")
    scrollbars={VDTOverlayScrollbarProps}   // Custom scrollbar options
    LoadingComponent={React.ComponentType}  // Custom loading component

    // Optional - Layout (1.2.0)
    framed={boolean}                        // notion: outer border + paper padding (default: true). false = fill an already-bordered box
    headerTopBorder={boolean}               // notion + framed=false: draw a top line on the header row (table shares a box with a toolbar above)
    tableLayout={"fixed" | "auto"}          // "auto": column widths follow content, wide tables scroll horizontally
    rowHeightMode={"fixed" | "auto"}        // "auto": rowHeight becomes a minimum, rows grow with content
    autoHeight={boolean}                    // No virtualization / no own scroll — the table is as tall as its rows (page scrolls)
    renderFullWidthRow={(item, index) => ReactNode | null} // Group band row: one cell spanning all columns (null = normal row)
    fullWidthRowSx={SxProps}                // Style of the band row cell (background, padding)
    onRowContextMenu={(item, index, event) => void}

    // Optional - 1.3.0
    pinnedRows={T[]}                        // Rows pinned under the header (always visible, same columns/cells/band rows)
    pinnedRowsMaxHeight={number}            // Max height of the pinned area in px — it scrolls on its own beyond that
    pinnedRowsSx={SxProps}                  // Pinned area style (default: 1px strong bottom border)
    resetScrollOnDataChange={boolean}       // false: keep the scroll position when rows are removed (collapse groups); remount with key to reset
    rowKeyFromId={boolean}                  // Use getRowId as the React key of rows (rows with inline editors)
    onEndReached={() => void}               // Fired every time the end is reached (no minimum / no same-length latch)
    colorMode={"light" | "dark"}            // notion colors independent of the MUI palette mode
    mobile={boolean | { query?, renderRow? }} // 1.6.0 card list on narrow screens (see "Mobile list")
    scrollParent={HTMLElement | null}         // 1.7.0 virtualize against an outer (page) scroller
    columnResize={boolean | { minWidth? }}    // 1.8.0 drag the header's right edge to resize a column (see "Column resize")
    columnWidths={Record<string, number>}     // 1.8.0 resized widths by column id (you store them)
    onColumnWidthsChange={(widths) => void}   // 1.8.0 fired once on release / on double-click reset

    // Optional - 1.4.0 header context menu (right-click on th never shows the browser menu)
    onSortClear={() => void}                // adds "정렬 풀기" to the header menu (and re-picking the active direction clears)
    onHeaderContextMenu={(column, event) => boolean | void} // custom header menu — return true or preventDefault() to skip the built-in one
/>
```

### Column options (1.2.0)

```tsx
{ id: "name", text: "이름", width: 160, pinned: "left" }     // sticky left (numeric width needed for the next pinned column)
{ id: "name", text: "이름", primary: true }                  // 15px body text for the row's main cell
{ id: "d1", text: "월", onCellClick: (item, i, e) => {} }    // per-cell click + cell hover (row click is not fired)
{ id: "who", text: "담당", rowSpan: (item, i) => 2 }         // merge down; return 0 on covered rows (use with autoHeight / short tables)
{ id: "m1", text: "1월", cellPadding: "4px 0" }              // body padding override
{ id: "t", text: "업무", cellStyle: (item) => ({ color: "#999" }) } // per-row cell style
{ id: "c", text: "열", headerProps: { draggable: true, onDrop } }  // extra th attributes (drag to reorder, title…)
{ id: "who", text: "책임자", width: 110, colSpan: (item) => (item.isEvent ? 2 : 1) } // 1.3.0: merge right (the covered column is not drawn)
{ id: "title", text: "제목", minWidth: 220 }                // 1.3.0: flexible column (no width) with a minimum — table min width = sum, scrolls sideways
```

Header context menu (1.4.0) — right-click a header cell:

```tsx
// sort items appear for sortable columns when onSort is given
{ id: "name", text: "이름", sortable: true }
// filter checklist (multi by default; filterMultiple: false = pick one)
{
    id: "status", text: "상태",
    filterOptions: [{ value: "open", label: "진행" }, { value: "done", label: "완료" }],
    filterValues: status,                 // string[] — non-empty → header turns primary + filter icon
    onFilterChange: (values) => setStatus(values),
}
{ id: "memo", text: "메모", headerMenu: false } // no menu on this column (browser menu still blocked)
{ id: "due", text: <MyHeader />, sortMenu: true } // 1.4.1: sort items in the menu without VDT's sort label/click (custom-drawn header)

// open your own header menu instead
<VirtualDataTable onHeaderContextMenu={(col, e) => (col.id === "owner" ? (openOwnerMenu(e), true) : false)} … />
```

Shared header menu (1.5.0) — open it yourself from a custom header button / toolbar button:

```tsx
import { HeaderMenu, headerMenuAnchor } from "@ehfuse/mui-virtual-data-table";

const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
<button onClick={(e) => setPos(headerMenuAnchor(e.currentTarget))}>상태</button>
<HeaderMenu
    open={Boolean(pos)}
    anchorPosition={pos}
    onClose={() => setPos(null)}
    sort={{ active: sortDir, onChange: (d) => setSortDir(d) }}           // null = 풀기
    filter={{
        options: [{ value: "open", label: "진행", icon: <Dot color="green" /> }],
        value: picked, onChange: setPicked,
        multiple: true,                 // false = radio (closes on pick), allLabel: "전체"
        emptyLabel: "비어 있음",        // adds value ""
        searchable: undefined,          // default: > 10 options
    }}
>
    {/* extra items */}
</HeaderMenu>
```

Pinned rows example (1.3.0):

```tsx
<VirtualDataTable
    variant="notion"
    data={rows}                                   // without the pinned ones
    pinnedRows={[{ kind: "band", label: "미확인" }, ...unconfirmed]}
    pinnedRowsMaxHeight={49 * 6}                  // band + 5 rows, then it scrolls
    renderFullWidthRow={(r) => (r.kind === "band" ? r.label : null)}
    getRowId={(r) => r.id}
    rowKeyFromId
    resetScrollOnDataChange={false}
    ...
/>
```

notion defaults (1.2.0): rowHeight 48, header text 13px, selected row (`selectedRowId`) = `#dbeafe` + 3px `#3b82f6` left bar (dark values included),
string `emptyMessage` = one light grey line under the header, footer cells use the body padding.

### Page scroll (1.7.0)

`scrollParent={element}` virtualizes against an outer scroller (react-virtuoso `customScrollParent`) — the table has no scroller of its own
and grows with the page, so things bound to the page scroller (collapsing app bar, scroll-to-top, pull-to-refresh) keep working.
Pass `null` while the element is not known yet (nothing is drawn until then). Works with `mobile` and `onEndReached`.

### Column resize (1.8.0)

`columnResize` puts a grip on each header cell's right edge (`col-resize` cursor, a thin line on hover). Drag it to resize that column,
double-click it to go back to the column's own `width`. The table does not store anything — keep the widths where you like
(account settings, localStorage …) and pass them back with `columnWidths`. Without `columnWidths` the table only remembers them until it remounts.

```tsx
const [widths, setWidths] = useAccountSetting("customer.list"); // Record<columnId, px>
<VirtualDataTable
    columnResize                              // or { minWidth: 60 } — default minimum 48px (a column's own minWidth wins)
    columnWidths={isPhone ? undefined : widths}
    onColumnWidthsChange={setWidths}          // once on release; double-click → the key is removed
    ...
/>
```

- While dragging only CSS variables on the table box change — rows are not re-rendered, virtualization and horizontal scroll stay as they are.
- The click that follows a drag is swallowed, so releasing over a header never sorts / opens the header menu.
- A flexible column (no `width`) keeps a minimum of its `minWidth` (or the resize minimum) once anything was resized; when every column ends up
  with a pixel width the table is as wide as their sum (no stretching that would make drawn widths differ from the dragged ones).
- Works with `pinned: "left"` (sticky offsets follow), `autoHeight`, `framed`, `tableLayout`, `variant="notion"`, `pinnedRows`, footer.
  In the `mobile` card list there is no grip and `columnWidths` is ignored.

### Mobile list (1.6.0)

`mobile` turns the table into a card list on narrow screens (default query `(max-width:599.95px)`): no header row, one card per row,
virtualization / `onLoadMore` / `onRowClick` / `selectedRowId` work the same. Header menu, footer and pinned rows are not drawn there.

```tsx
<VirtualDataTable
    mobile                                   // or { query: "(max-width:899.95px)", renderRow: (item, index) => <MyCard/> }
    columns={[
        { id: "thumb", text: "", mobile: "thumb", render: (r) => <img src={r.image} width={56} /> },
        { id: "title", text: "작품", mobile: "title" },
        { id: "status", text: "상태", mobile: "badge", render: (r) => <Chip label={r.status} /> },
        { id: "artist", text: "작가", mobile: "sub" },
        { id: "price", text: "판매가" },              // no hint → meta line "판매가 1,000,000원"
        { id: "memo", text: "메모", mobile: false },  // hidden on mobile
    ]}
    ...
/>
```

Slots: `title` (bold first line — default: the first column), `thumb` (left), `badge` (right of the title), `sub` (line under the title),
`meta` ("header value" pairs that wrap — default for the other columns), `false` (hidden). `mobileLabel` overrides the meta label (`false` = value only).

## License

MIT © KIM YOUNG JIN (ehfuse@gmail.com)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For support, email ehfuse@gmail.com or create an issue on GitHub.
