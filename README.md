# Virtual Data Table

A high-performance virtual data table component for React with Material-UI integration.

React와 Material-UI 통합을 위한 고성능 가상화 데이터 테이블 컴포넌트입니다.

## Features

-   🚀 **High Performance**: Virtualized rendering for large datasets
-   🎨 **Material-UI Integration**: Seamless integration with MUI components
-   🔧 **TypeScript Support**: Full TypeScript support with type definitions
-   📱 **Responsive Design**: Mobile-friendly and responsive
-   🔄 **Sorting**: Built-in sorting functionality
-   🎯 **Customizable**: Highly customizable columns and styling
-   📊 **Empty State**: Built-in empty state handling
-   🔍 **Loading State**: Loading indicator support

## 주요 기능

-   🚀 **고성능**: 대용량 데이터셋을 위한 가상화 렌더링
-   🎨 **Material-UI 통합**: MUI 컴포넌트와의 완벽한 통합
-   🔧 **TypeScript 지원**: 타입 정의가 포함된 완전한 TypeScript 지원
-   📱 **반응형 디자인**: 모바일 친화적이고 반응형
-   🔄 **정렬**: 내장된 정렬 기능
-   🎯 **커스터마이징**: 컬럼과 스타일링의 높은 커스터마이징
-   📊 **빈 상태**: 내장된 빈 상태 처리
-   🔍 **로딩 상태**: 로딩 인디케이터 지원

## Installation

```bash
npm install virtual-data-table
```

## Peer Dependencies

This package requires the following peer dependencies:

```bash
npm install react react-dom @mui/material react-virtuoso
```

## Usage

```tsx
import React from "react";
import { VirtualDataTable, DataColumn } from "virtual-data-table";

interface User {
    id: number;
    name: string;
    email: string;
    age: number;
}

const columns: DataColumn<User>[] = [
    {
        id: "id",
        text: "ID",
        width: 80,
        sortable: true,
    },
    {
        id: "name",
        text: "Name",
        width: 200,
        sortable: true,
    },
    {
        id: "email",
        text: "Email",
        width: 250,
        sortable: true,
        render: (user: User) => (
            <a href={`mailto:${user.email}`}>{user.email}</a>
        ),
    },
    {
        id: "age",
        text: "Age",
        width: 100,
        sortable: true,
        render: (user: User) => `${user.age} years old`,
    },
];

const data: User[] = [
    { id: 1, name: "John Doe", email: "john@example.com", age: 30 },
    { id: 2, name: "Jane Smith", email: "jane@example.com", age: 25 },
    // ... more data
];

function App() {
    return (
        <VirtualDataTable<User>
            data={data}
            columns={columns}
            totalCount={data.length}
            loading={false}
            hasMore={false}
        />
    );
}

export default App;
```

## Examples

For more detailed examples and advanced usage patterns, check out our example documentation:

-   [한국어 예제 문서](./docs/ko/example.md) - Korean examples with detailed explanations
-   [English Examples](./docs/en/example.md) - Comprehensive examples in English (coming soon)

## API Reference

### VirtualDataTableProps

| Prop            | Type                                                      | Default | Description                      |
| --------------- | --------------------------------------------------------- | ------- | -------------------------------- |
| `data`          | `T[]`                                                     | -       | Array of data objects to display |
| `columns`       | `DataColumn<T>[]`                                         | -       | Column definitions               |
| `height`        | `number \| string`                                        | `400`   | Table height                     |
| `loading`       | `boolean`                                                 | `false` | Show loading state               |
| `onSort`        | `(sortBy: keyof T, sortDirection: SortDirection) => void` | -       | Sort callback function           |
| `sortBy`        | `keyof T`                                                 | -       | Current sort column              |
| `sortDirection` | `SortDirection`                                           | -       | Current sort direction           |

### DataColumn

| Property   | Type                                                     | Default  | Description                    |
| ---------- | -------------------------------------------------------- | -------- | ------------------------------ |
| `id`       | `keyof T \| string`                                      | -        | Column identifier              |
| `text`     | `string \| React.ReactNode`                              | -        | Column header text             |
| `width`    | `number \| string`                                       | -        | Column width                   |
| `sortable` | `boolean`                                                | `false`  | Enable sorting for this column |
| `align`    | `'left' \| 'center' \| 'right'`                          | `'left'` | Text alignment                 |
| `render`   | `(value: any, row: T, index: number) => React.ReactNode` | -        | Custom render function         |

## License

MIT © KIM YOUNG JIN (ehfuse@gmail.com)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For support, email ehfuse@gmail.com or create an issue on GitHub.
