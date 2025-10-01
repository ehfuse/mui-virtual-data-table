# MUI Virtual Data Table

A high-performance virtual data table component for React with Material-UI integration, featuring virtualized rendering, infinite scroll, keyboard navigation, and customizable styling.

React와 Material-UI를 위한 고성능 가상화 데이터 테이블 컴포넌트입니다. 가상화 렌더링, 무한 스크롤, 키보드 탐색, 커스터마이징 가능한 스타일링을 제공합니다.

## Features

-   🚀 **High Performance**: Virtualized rendering with react-virtuoso for smooth scrolling with large datasets
-   ♾️ **Infinite Scroll**: Built-in infinite scroll with automatic loading indicator
-   ⌨️ **Keyboard Navigation**: Full keyboard support (Arrow keys, PageUp/Down, Home/End)
-   🎨 **Material-UI Integration**: Seamless integration with MUI components
-   🦓 **Zebra Striping**: Optional alternating row colors with custom color support
-   🔧 **TypeScript Support**: Full TypeScript support with comprehensive type definitions
-   🔄 **Sorting**: Built-in column sorting functionality
-   🎯 **Customizable**: Highly customizable columns, styling, and scrollbar options
-   📊 **Empty State**: Built-in empty state handling with custom message
-   🔍 **Loading State**: Smooth loading transitions with fade-out animation
-   📏 **Grouped Headers**: Support for grouped column headers with dynamic height calculation
-   🎨 **Custom Scrollbar**: Beautiful custom scrollbar with full customization options

## 주요 기능

-   🚀 **고성능**: react-virtuoso를 사용한 가상화 렌더링으로 대용량 데이터셋에서도 부드러운 스크롤
-   ♾️ **무한 스크롤**: 자동 로딩 인디케이터가 포함된 무한 스크롤 기능
-   ⌨️ **키보드 탐색**: 완전한 키보드 지원 (방향키, PageUp/Down, Home/End)
-   🎨 **Material-UI 통합**: MUI 컴포넌트와의 완벽한 통합
-   🦓 **얼룩말 줄무늬**: 사용자 지정 색상을 지원하는 선택적 행 교차 색상
-   🔧 **TypeScript 지원**: 포괄적인 타입 정의가 포함된 완전한 TypeScript 지원
-   🔄 **정렬**: 내장된 컬럼 정렬 기능
-   🎯 **커스터마이징**: 컬럼, 스타일링, 스크롤바 옵션의 높은 커스터마이징
-   📊 **빈 상태**: 커스텀 메시지를 지원하는 내장된 빈 상태 처리
-   🔍 **로딩 상태**: 페이드아웃 애니메이션이 적용된 부드러운 로딩 전환
-   📏 **그룹 헤더**: 동적 높이 계산을 지원하는 그룹화된 컬럼 헤더
-   🎨 **커스텀 스크롤바**: 완전한 커스터마이징 옵션을 갖춘 아름다운 커스텀 스크롤바

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

-   **[한국어 시작하기](./docs/ko/getting-started.md)** - API 설명 및 가이드
-   **[한국어 예제 코드](./docs/ko/example.md)** - 다양한 사용 예제
-   **[Getting Started (English)](./docs/en/getting-started.md)** - API reference and guide _(coming soon)_

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
    rowHeight={number}                      // Row height in px (default: 50)
    columnHeight={number}                   // Header height in px (default: 56, auto 2x for grouped headers)
    showPaper={boolean}                     // Wrap in Paper component (default: true)
    paddingX={string | number}              // Horizontal padding (default: "1rem")

    // Optional - Infinite Scroll
    loading={boolean}                       // Loading state (default: false)
    onLoadMore={(offset, limit) => void}    // Load more callback (enables infinite scroll when provided)

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
/>
```

## License

MIT © KIM YOUNG JIN (ehfuse@gmail.com)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For support, email ehfuse@gmail.com or create an issue on GitHub.
