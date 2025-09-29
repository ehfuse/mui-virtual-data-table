# Virtual Data Table 예제

React와 Material-UI를 위한 고성능 가상화 데이터 테이블 컴포넌트의 사용 예제입니다.

## 기본 사용법

### 1. 설치

```bash
npm install virtual-data-table
```

### 2. 피어 의존성 설치

이 패키지는 다음 피어 의존성이 필요합니다:

```bash
npm install react react-dom @mui/material react-virtuoso
```

### 3. 기본 테이블 예제

```tsx
import React from "react";
import { VirtualDataTable, DataColumn } from "virtual-data-table";

interface User {
    id: number;
    name: string;
    email: string;
    age: number;
    department: string;
}

const columns: DataColumn<User>[] = [
    {
        id: "id",
        text: "ID",
        width: 80,
        sortable: true,
        align: "center",
    },
    {
        id: "name",
        text: "이름",
        width: 150,
        sortable: true,
    },
    {
        id: "email",
        text: "이메일",
        width: 250,
        sortable: true,
        render: (user: User) => (
            <a href={`mailto:${user.email}`} style={{ color: "#1976d2" }}>
                {user.email}
            </a>
        ),
    },
    {
        id: "age",
        text: "나이",
        width: 100,
        sortable: true,
        align: "center",
        render: (user: User) => `${user.age}세`,
    },
    {
        id: "department",
        text: "부서",
        width: 150,
        sortable: true,
        render: (user: User) => (
            <span
                style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    backgroundColor:
                        user.department === "개발"
                            ? "#e3f2fd"
                            : user.department === "디자인"
                            ? "#f3e5f5"
                            : "#f5f5f5",
                    color:
                        user.department === "개발"
                            ? "#1976d2"
                            : user.department === "디자인"
                            ? "#7b1fa2"
                            : "#666",
                }}
            >
                {user.department}
            </span>
        ),
    },
];

const data: User[] = [
    {
        id: 1,
        name: "김철수",
        email: "kim@example.com",
        age: 30,
        department: "개발",
    },
    {
        id: 2,
        name: "이영희",
        email: "lee@example.com",
        age: 25,
        department: "디자인",
    },
    {
        id: 3,
        name: "박민수",
        email: "park@example.com",
        age: 35,
        department: "기획",
    },
    // ... 더 많은 데이터
];

function BasicExample() {
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

export default BasicExample;
```

## 고급 예제

### 1. 정렬 기능이 있는 테이블

```tsx
import React, { useState } from "react";
import {
    VirtualDataTable,
    DataColumn,
    SortDirection,
} from "virtual-data-table";

function SortableExample() {
    const [sortBy, setSortBy] = useState<string | undefined>();
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

    const handleSort = (columnId: string, direction: SortDirection) => {
        setSortBy(columnId);
        setSortDirection(direction);

        // 실제 데이터 정렬 로직
        console.log(`정렬: ${columnId} ${direction}`);
    };

    return (
        <VirtualDataTable<User>
            data={data}
            columns={columns}
            totalCount={data.length}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
            loading={false}
            hasMore={false}
        />
    );
}
```

### 2. 커스텀 렌더링

```tsx
import React from "react";
import { VirtualDataTable, DataColumn } from "virtual-data-table";
import { Chip, Avatar } from "@mui/material";

const columnsWithCustomRender: DataColumn<User>[] = [
    {
        id: "id",
        text: "ID",
        width: 80,
        align: "center",
    },
    {
        id: "name",
        text: "사용자",
        width: 200,
        render: (user: User) => (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar sx={{ width: 32, height: 32 }}>
                    {user.name.charAt(0)}
                </Avatar>
                <div>
                    <div>{user.name}</div>
                    <div style={{ fontSize: "0.8em", color: "#666" }}>
                        {user.email}
                    </div>
                </div>
            </div>
        ),
    },
    {
        id: "age",
        text: "나이",
        width: 100,
        align: "center",
        render: (user: User) => `${user.age}세`,
    },
    {
        id: "department",
        text: "부서",
        width: 150,
        render: (user: User) => (
            <Chip
                label={user.department}
                color={
                    user.department === "개발"
                        ? "primary"
                        : user.department === "디자인"
                        ? "secondary"
                        : "default"
                }
                size="small"
            />
        ),
    },
];

function CustomRenderExample() {
    return (
        <VirtualDataTable<User>
            data={data}
            columns={columnsWithCustomRender}
            totalCount={data.length}
            loading={false}
            hasMore={false}
        />
    );
}
```

### 3. 무한 스크롤

```tsx
import React, { useState, useCallback } from "react";
import { VirtualDataTable, DataColumn } from "virtual-data-table";

function InfiniteScrollExample() {
    const [data, setData] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const loadMoreData = useCallback(async (offset: number, limit: number) => {
        setLoading(true);

        try {
            // API 호출 시뮬레이션
            const response = await fetch(
                `/api/users?offset=${offset}&limit=${limit}`
            );
            const newData = await response.json();

            if (newData.length === 0) {
                setHasMore(false);
            } else {
                setData((prevData) => [...prevData, ...newData]);
            }
        } catch (error) {
            console.error("데이터 로드 실패:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    return (
        <VirtualDataTable<User>
            data={data}
            columns={columns}
            totalCount={data.length}
            loading={loading}
            hasMore={hasMore}
            onLoadMore={loadMoreData}
        />
    );
}
```

### 4. 행 클릭 이벤트

```tsx
import React from "react";
import { VirtualDataTable, DataColumn } from "virtual-data-table";

function RowClickExample() {
    const handleRowClick = (user: User, index: number) => {
        console.log("클릭된 사용자:", user);
        alert(`${user.name}님을 클릭하셨습니다.`);
    };

    return (
        <VirtualDataTable<User>
            data={data}
            columns={columns}
            totalCount={data.length}
            onRowClick={handleRowClick}
            loading={false}
            hasMore={false}
        />
    );
}
```

### 5. 그룹 헤더

```tsx
import React from "react";
import { VirtualDataTable, DataColumn } from "virtual-data-table";

const columnsWithGroups: DataColumn<User>[] = [
    {
        id: "id",
        text: "ID",
        width: 80,
        align: "center",
    },
    {
        id: "name",
        text: "이름",
        width: 150,
        group: "개인정보",
    },
    {
        id: "age",
        text: "나이",
        width: 100,
        align: "center",
        group: "개인정보",
    },
    {
        id: "email",
        text: "이메일",
        width: 250,
        group: "연락처",
    },
    {
        id: "department",
        text: "부서",
        width: 150,
        group: "회사정보",
    },
];

function GroupedHeaderExample() {
    return (
        <VirtualDataTable<User>
            data={data}
            columns={columnsWithGroups}
            totalCount={data.length}
            loading={false}
            hasMore={false}
        />
    );
}
```

## 스타일링

### 1. 커스텀 스타일

```tsx
const styledColumns: DataColumn<User>[] = [
    {
        id: "name",
        text: "이름",
        width: 150,
        style: {
            fontWeight: "bold",
            backgroundColor: "#f5f5f5",
        },
    },
    {
        id: "email",
        text: "이메일",
        width: 250,
        style: {
            fontFamily: "monospace",
        },
    },
];
```

### 2. Paper 없는 테이블

```tsx
function NoPaperExample() {
    return (
        <VirtualDataTable<User>
            data={data}
            columns={columns}
            totalCount={data.length}
            showPaper={false}
            loading={false}
            hasMore={false}
        />
    );
}
```

## 성능 최적화 팁

1. **메모이제이션 사용**: `useMemo`를 사용하여 컬럼 정의를 메모이제이션하세요.
2. **적절한 행 높이 설정**: `rowHeight` 속성을 사용하여 성능을 최적화하세요.
3. **가상화 활용**: 대용량 데이터에서는 무한 스크롤을 사용하세요.
4. **커스텀 렌더링 최적화**: 복잡한 렌더링은 `React.memo`로 최적화하세요.

## 문제 해결

### 자주 묻는 질문

**Q: 테이블이 렌더링되지 않아요.**
A: `data`와 `columns` 속성이 올바르게 전달되었는지 확인하세요.

**Q: 정렬이 작동하지 않아요.**
A: `onSort` 콜백 함수를 구현하고 `sortBy`, `sortDirection` 상태를 관리하세요.

**Q: 무한 스크롤이 트리거되지 않아요.**
A: `hasMore`가 `true`이고 `onLoadMore` 콜백이 구현되어 있는지 확인하세요.

## 타입 정의

모든 타입 정의는 `virtual-data-table/types`에서 가져올 수 있습니다:

```tsx
import type {
    DataColumn,
    SortDirection,
    SortableFilter,
    VirtualDataTableProps,
} from "virtual-data-table";
```
