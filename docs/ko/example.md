# 예제 코드

MUI Virtual Data Table의 다양한 사용 예제를 소개합니다.

> **참고**: 기본 사용법과 API 설명은 [시작하기](./getting-started.md) 문서를 참조하세요.

## 목차

-   [기본 예제](#기본-예제)
-   [무한 스크롤](#무한-스크롤)
-   [정렬 기능](#정렬-기능)
-   [커스텀 렌더링](#커스텀-렌더링)
-   [그룹 헤더](#그룹-헤더)
-   [얼룩말 줄무늬](#얼룩말-줄무늬)
-   [행 클릭 처리](#행-클릭-처리)
-   [빈 데이터 메시지](#빈-데이터-메시지)
-   [커스텀 스크롤바](#커스텀-스크롤바)
-   [전체 예제](#전체-예제)

## 기본 예제

가장 간단한 형태의 테이블입니다.

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
    { id: "name", text: "이름", width: 200 },
    { id: "email", text: "이메일", width: 250 },
];

const data: User[] = [
    { id: 1, name: "홍길동", email: "hong@example.com" },
    { id: 2, name: "김철수", email: "kim@example.com" },
    { id: 3, name: "이영희", email: "lee@example.com" },
];

function BasicExample() {
    return (
        <VirtualDataTable
            data={data}
            columns={columns}
            totalCount={data.length}
        />
    );
}
```

## 무한 스크롤

스크롤이 끝에 도달하면 자동으로 추가 데이터를 로드합니다.

```tsx
import { useState, useCallback } from "react";
import { VirtualDataTable } from "@ehfuse/mui-virtual-data-table";

function InfiniteScrollExample() {
    const [data, setData] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    const handleLoadMore = useCallback(
        async (offset: number, limit: number) => {
            setLoading(true);

            // API 호출 시뮬레이션
            const response = await fetch(
                `/api/users?offset=${offset}&limit=${limit}`
            );
            const newData = await response.json();

            setData((prev) => [...prev, ...newData]);
            setLoading(false);
        },
        []
    );

    return (
        <VirtualDataTable
            data={data}
            columns={columns}
            totalCount={data.length}
            loading={loading}
            onLoadMore={data.length >= 500 ? undefined : handleLoadMore}
        />
    );
}
```

**핵심 포인트**:

-   `onLoadMore`가 있으면 자동으로 무한 스크롤 활성화
-   더 이상 로드할 데이터가 없으면 `onLoadMore={undefined}` 전달
-   `loading` 상태로 로딩 인디케이터 표시

## 정렬 기능

컬럼 헤더를 클릭하여 데이터를 정렬합니다.

```tsx
import { useState, useCallback } from "react";
import type { SortDirection } from "@ehfuse/mui-virtual-data-table";

function SortableExample() {
    const [data, setData] = useState<User[]>(initialData);
    const [sortBy, setSortBy] = useState<string>();
    const [sortDirection, setSortDirection] = useState<SortDirection>();

    const columns: DataColumn<User>[] = [
        { id: "id", text: "ID", width: 80, sortable: true },
        { id: "name", text: "이름", width: 200, sortable: true },
        { id: "email", text: "이메일", width: 250, sortable: true },
    ];

    const handleSort = useCallback(
        (columnId: string, direction: SortDirection) => {
            setSortBy(columnId);
            setSortDirection(direction);

            // 데이터 정렬
            const sorted = [...data].sort((a, b) => {
                const aValue = a[columnId as keyof User];
                const bValue = b[columnId as keyof User];

                if (direction === "asc") {
                    return aValue > bValue ? 1 : -1;
                } else {
                    return aValue < bValue ? 1 : -1;
                }
            });

            setData(sorted);
        },
        [data]
    );

    return (
        <VirtualDataTable
            data={data}
            columns={columns}
            totalCount={data.length}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
        />
    );
}
```

## 커스텀 렌더링

`render` 함수로 셀 내용을 자유롭게 커스터마이징합니다.

```tsx
import { Chip, Avatar, Box } from "@mui/material";

function CustomRenderExample() {
    const columns: DataColumn<User>[] = [
        {
            id: "id",
            text: "ID",
            width: 80,
        },
        {
            id: "name",
            text: "사용자",
            width: 250,
            render: (user) => (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar sx={{ width: 32, height: 32 }}>
                        {user.name[0]}
                    </Avatar>
                    <Box>
                        <div>{user.name}</div>
                        <div style={{ fontSize: "0.875rem", color: "#666" }}>
                            {user.email}
                        </div>
                    </Box>
                </Box>
            ),
        },
        {
            id: "status",
            text: "상태",
            width: 120,
            align: "center",
            render: (user) => (
                <Chip
                    label={user.status}
                    color={user.status === "active" ? "success" : "default"}
                    size="small"
                />
            ),
        },
        {
            id: "age",
            text: "나이",
            width: 100,
            align: "right",
            render: (user) => `${user.age}세`,
        },
    ];

    return (
        <VirtualDataTable
            data={data}
            columns={columns}
            totalCount={data.length}
        />
    );
}
```

## 그룹 헤더

관련된 컬럼들을 그룹으로 묶어 표시합니다.

```tsx
function GroupedHeaderExample() {
    const columns: DataColumn<User>[] = [
        {
            id: "id",
            text: "ID",
            width: 80,
        },
        {
            id: "firstName",
            text: "이름",
            width: 150,
            group: "개인정보",
        },
        {
            id: "lastName",
            text: "성",
            width: 150,
            group: "개인정보",
        },
        {
            id: "age",
            text: "나이",
            width: 100,
            group: "개인정보",
        },
        {
            id: "email",
            text: "이메일",
            width: 200,
            group: "연락처",
        },
        {
            id: "phone",
            text: "전화번호",
            width: 150,
            group: "연락처",
        },
    ];

    return (
        <VirtualDataTable
            data={data}
            columns={columns}
            totalCount={data.length}
            columnHeight={56} // 그룹 헤더가 있으면 자동으로 2배(112px) 적용
        />
    );
}
```

## 얼룩말 줄무늬

홀수 행에 배경색을 적용하여 가독성을 높입니다.

```tsx
function StripedExample() {
    return (
        <>
            {/* 기본 회색 줄무늬 */}
            <VirtualDataTable
                data={data}
                columns={columns}
                totalCount={data.length}
                striped={true}
            />

            {/* 커스텀 색상 줄무늬 */}
            <VirtualDataTable
                data={data}
                columns={columns}
                totalCount={data.length}
                striped="#e3f2fd" // 파란색 계열
            />

            {/* 줄무늬 없음 (기본값) */}
            <VirtualDataTable
                data={data}
                columns={columns}
                totalCount={data.length}
                striped={false}
            />

            {/* 행 구분선 제거 */}
            <VirtualDataTable
                data={data}
                columns={columns}
                totalCount={data.length}
                striped={true}
                rowDivider={false}
            />
        </>
    );
}
```

## 행 클릭 처리

행을 클릭했을 때 이벤트를 처리합니다.

```tsx
import { useNavigate } from "react-router-dom";

function RowClickExample() {
    const navigate = useNavigate();

    const handleRowClick = (user: User, index: number) => {
        console.log("클릭한 행:", user, "인덱스:", index);

        // 상세 페이지로 이동
        navigate(`/users/${user.id}`);

        // 또는 모달 열기
        // setSelectedUser(user);
        // setModalOpen(true);
    };

    return (
        <VirtualDataTable
            data={data}
            columns={columns}
            totalCount={data.length}
            onRowClick={handleRowClick}
        />
    );
}
```

## 빈 데이터 메시지

데이터가 없을 때 표시할 메시지를 커스터마이징합니다.

```tsx
import { Box, Typography, Button } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

function EmptyMessageExample() {
    return (
        <>
            {/* 기본 문자열 메시지 */}
            <VirtualDataTable
                data={[]}
                columns={columns}
                totalCount={0}
                emptyMessage="데이터가 없습니다"
            />

            {/* 커스텀 ReactNode */}
            <VirtualDataTable
                data={[]}
                columns={columns}
                totalCount={0}
                emptyMessage={
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 2,
                        }}
                    >
                        <ErrorOutlineIcon
                            sx={{ fontSize: 64, color: "warning.main" }}
                        />
                        <Typography variant="h6" color="text.secondary">
                            데이터를 불러올 수 없습니다
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            네트워크 연결을 확인하고 다시 시도해주세요
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={() => window.location.reload()}
                        >
                            다시 시도
                        </Button>
                    </Box>
                }
            />
        </>
    );
}
```

**특징**:

-   데이터가 비워지면 자동으로 스크롤이 맨 위로 이동
-   문자열 또는 ReactNode 모두 사용 가능
-   기본값: "NO DATA"

## 커스텀 스크롤바

스크롤바의 모양을 커스터마이징합니다.

```tsx
function CustomScrollbarExample() {
    return (
        <VirtualDataTable
            data={data}
            columns={columns}
            totalCount={data.length}
            scrollbars={{
                thumb: {
                    background: "#1976d2", // 파란색 썸
                    width: 8,
                    radius: 4,
                },
                track: {
                    background: "#f5f5f5", // 연한 회색 트랙
                    alignment: "right",
                    margin: 0,
                    radius: 0,
                },
            }}
        />
    );
}
```

더 많은 스크롤바 옵션은 [@ehfuse/overlay-scrollbar](https://www.npmjs.com/package/@ehfuse/overlay-scrollbar) 문서를 참조하세요.

## 전체 예제

모든 기능을 통합한 완전한 예제입니다.

```tsx
import { useState, useCallback, useMemo } from "react";
import { VirtualDataTable } from "@ehfuse/mui-virtual-data-table";
import type { DataColumn, SortDirection } from "@ehfuse/mui-virtual-data-table";
import { Chip, Avatar, Box, ThemeProvider, createTheme } from "@mui/material";

interface User {
    id: number;
    name: string;
    email: string;
    age: number;
    status: "active" | "inactive";
}

function CompleteExample() {
    const [data, setData] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [sortBy, setSortBy] = useState<string>();
    const [sortDirection, setSortDirection] = useState<SortDirection>();

    // 컬럼 정의
    const columns: DataColumn<User>[] = useMemo(
        () => [
            {
                id: "id",
                text: "ID",
                width: 80,
                sortable: true,
            },
            {
                id: "name",
                text: "사용자",
                width: 250,
                sortable: true,
                render: (user) => (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                            {user.name[0]}
                        </Avatar>
                        <Box>
                            <div>{user.name}</div>
                            <div
                                style={{ fontSize: "0.875rem", color: "#666" }}
                            >
                                {user.email}
                            </div>
                        </Box>
                    </Box>
                ),
            },
            {
                id: "age",
                text: "나이",
                width: 100,
                align: "center",
                sortable: true,
                render: (user) => `${user.age}세`,
            },
            {
                id: "status",
                text: "상태",
                width: 120,
                align: "center",
                sortable: true,
                render: (user) => (
                    <Chip
                        label={user.status === "active" ? "활성" : "비활성"}
                        color={user.status === "active" ? "success" : "default"}
                        size="small"
                    />
                ),
            },
        ],
        []
    );

    // 무한 스크롤 핸들러
    const handleLoadMore = useCallback(
        async (offset: number, limit: number) => {
            setLoading(true);

            // API 호출 시뮬레이션
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const newData: User[] = Array.from({ length: limit }, (_, i) => ({
                id: offset + i + 1,
                name: `사용자 ${offset + i + 1}`,
                email: `user${offset + i + 1}@example.com`,
                age: 20 + Math.floor(Math.random() * 40),
                status: Math.random() > 0.5 ? "active" : "inactive",
            }));

            setData((prev) => [...prev, ...newData]);
            setLoading(false);
        },
        []
    );

    // 정렬 핸들러
    const handleSort = useCallback(
        (columnId: string, direction: SortDirection) => {
            setSortBy(columnId);
            setSortDirection(direction);

            const sorted = [...data].sort((a, b) => {
                const aValue = a[columnId as keyof User];
                const bValue = b[columnId as keyof User];

                if (direction === "asc") {
                    return aValue > bValue ? 1 : -1;
                } else {
                    return aValue < bValue ? 1 : -1;
                }
            });

            setData(sorted);
        },
        [data]
    );

    // 행 클릭 핸들러
    const handleRowClick = useCallback((user: User, index: number) => {
        console.log("클릭한 사용자:", user);
        alert(`${user.name}을(를) 클릭했습니다.`);
    }, []);

    return (
        <Box sx={{ height: "600px", width: "100%" }}>
            <VirtualDataTable
                data={data}
                columns={columns}
                totalCount={data.length}
                loading={loading}
                onLoadMore={data.length >= 500 ? undefined : handleLoadMore}
                sortBy={sortBy}
                sortDirection={sortDirection}
                onSort={handleSort}
                onRowClick={handleRowClick}
                striped="#f8f9fa"
                rowDivider={true}
                rowHeight={60}
                columnHeight={56}
                scrollbars={{
                    thumb: {
                        background: "#1976d2",
                        width: 8,
                        radius: 4,
                    },
                }}
            />
        </Box>
    );
}

export default CompleteExample;
```

## 다음 단계

-   **[시작하기](./getting-started.md)** - API 상세 설명
-   **[API 레퍼런스](./api.md)** - 전체 API 문서 _(작성 예정)_

## 문의

문제가 발생하거나 질문이 있으시면:

-   이메일: ehfuse@gmail.com
-   GitHub Issues: [mui-virtual-data-table](https://github.com/ehfuse/mui-virtual-data-table)

## 라이센스

MIT © KIM YOUNG JIN (ehfuse@gmail.com)
