# 시작하기

MUI Virtual Data Table을 사용하여 고성능 가상화 테이블을 구축하는 방법을 안내합니다.

## 설치

```bash
npm install @ehfuse/mui-virtual-data-table
```

## 필수 의존성

다음 peer dependencies가 필요합니다:

```bash
npm install react react-dom @mui/material @emotion/react @emotion/styled react-virtuoso
```

## 기본 사용법

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
    { id: "name", text: "Name", width: 200 },
    { id: "email", text: "Email", width: 250 },
];

const data: User[] = [
    { id: 1, name: "홍길동", email: "hong@example.com" },
    { id: 2, name: "김철수", email: "kim@example.com" },
];

function App() {
    return (
        <VirtualDataTable
            data={data}
            columns={columns}
            totalCount={data.length}
        />
    );
}
```

## API 참조

### VirtualDataTableProps

#### 필수 속성 (Required)

| 속성         | 타입              | 설명               |
| ------------ | ----------------- | ------------------ |
| `data`       | `T[]`             | 표시할 데이터 배열 |
| `columns`    | `DataColumn<T>[]` | 컬럼 정의 배열     |
| `totalCount` | `number`          | 전체 데이터 개수   |

#### 선택 속성 - 스타일링

| 속성              | 타입                | 기본값      | 설명                                                                           |
| ----------------- | ------------------- | ----------- | ------------------------------------------------------------------------------ |
| `striped`         | `boolean \| string` | `false`     | 얼룩말 줄무늬 활성화. `true`면 기본 회색(#f5f5f5), 문자열이면 해당 색상 사용   |
| `rowDivider`      | `boolean`           | `true`      | 행 구분선 표시 여부                                                            |
| `rowHeight`       | `number`            | `50`        | 행 높이 (px)                                                                   |
| `columnHeight`    | `number`            | `56`        | 컬럼 헤더 높이 (px). 그룹 헤더가 있으면 자동으로 2배 적용                      |
| `showPaper`       | `boolean`           | `true`      | Material-UI Paper 컴포넌트로 감쌀지 여부                                       |
| `paddingX`        | `string \| number`  | `"1rem"`    | 테이블 좌우 패딩. `0`으로 설정하면 패딩 없음                                   |
| `paddingTop`      | `string \| number`  | `0`         | 테이블 상단 패딩                                                               |
| `paddingBottom`   | `string \| number`  | `0`         | 테이블 하단 패딩                                                               |
| `rowHoverColor`   | `string`            | `"#000000"` | 행 호버 시 배경색. 다크 모드에서 자동으로 밝기 반전 (예: 검정→흰색)            |
| `rowHoverOpacity` | `number`            | `0.06`      | 행 호버 시 투명도 (0-1). `rowHoverColor`와 함께 사용하여 은은한 호버 효과 적용 |

#### 선택 속성 - 무한 스크롤

| 속성         | 타입                                      | 기본값  | 설명                                                                             |
| ------------ | ----------------------------------------- | ------- | -------------------------------------------------------------------------------- |
| `loading`    | `boolean`                                 | `false` | 로딩 상태 표시                                                                   |
| `onLoadMore` | `(offset: number, limit: number) => void` | -       | 더 많은 데이터를 로드하는 콜백. 이 속성이 있으면 무한 스크롤이 자동으로 활성화됨 |

> **참고**: `onLoadMore`를 제공하면 자동으로 무한 스크롤이 활성화됩니다. 더 이상 로드할 데이터가 없으면 `onLoadMore={undefined}`를 전달하세요.

#### 선택 속성 - 정렬

| 속성            | 타입                                                   | 기본값 | 설명                       |
| --------------- | ------------------------------------------------------ | ------ | -------------------------- |
| `sortBy`        | `string`                                               | -      | 현재 정렬 중인 컬럼 ID     |
| `sortDirection` | `"asc" \| "desc"`                                      | -      | 현재 정렬 방향             |
| `onSort`        | `(columnId: string, direction: SortDirection) => void` | -      | 정렬 변경 시 호출되는 콜백 |

#### 선택 속성 - 상호작용

| 속성         | 타입                               | 설명                     |
| ------------ | ---------------------------------- | ------------------------ |
| `onRowClick` | `(item: T, index: number) => void` | 행 클릭 시 호출되는 콜백 |

#### 선택 속성 - 커스터마이징

| 속성               | 타입                                                                | 기본값      | 설명                                                                                                             |
| ------------------ | ------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------- |
| `emptyMessage`     | `string \| React.ReactNode`                                         | `"NO DATA"` | 데이터가 없을 때 표시할 메시지                                                                                   |
| `scrollbars`       | `VDTOverlayScrollbarProps`                                          | -           | 커스텀 스크롤바 옵션 ([@ehfuse/overlay-scrollbar](https://www.npmjs.com/package/@ehfuse/overlay-scrollbar) 참조) |
| `LoadingComponent` | `React.ComponentType<{visible?: boolean; onComplete?: () => void}>` | -           | 커스텀 로딩 컴포넌트                                                                                             |

### DataColumn\<T\>

컬럼 정의 인터페이스입니다.

| 속성       | 타입                                          | 필수 | 기본값   | 설명                                                                  |
| ---------- | --------------------------------------------- | ---- | -------- | --------------------------------------------------------------------- |
| `id`       | `keyof T \| string`                           | ✅   | -        | 컬럼 식별자. 데이터 객체의 키와 일치해야 함                           |
| `text`     | `string \| React.ReactNode`                   | ✅   | -        | 컬럼 헤더에 표시될 텍스트                                             |
| `width`    | `string \| number`                            |      | -        | 컬럼 너비 (px 또는 %)                                                 |
| `sortable` | `boolean`                                     |      | `false`  | 정렬 가능 여부                                                        |
| `align`    | `"left" \| "center" \| "right"`               |      | `"left"` | 텍스트 정렬 방향                                                      |
| `style`    | `React.CSSProperties`                         |      | -        | 추가 스타일                                                           |
| `render`   | `(item: T, index: number) => React.ReactNode` |      | -        | 커스텀 렌더링 함수                                                    |
| `group`    | `string`                                      |      | -        | 그룹 헤더명. 같은 그룹명을 가진 컬럼들이 하나의 그룹 헤더 아래 표시됨 |

### SortDirection

정렬 방향을 나타내는 타입입니다.

```typescript
type SortDirection = "asc" | "desc";
```

## 주요 기능

### 1. 가상화 렌더링

react-virtuoso를 사용하여 대용량 데이터셋(수천~수만 개 행)도 부드럽게 스크롤할 수 있습니다.

### 2. 무한 스크롤

`onLoadMore` 콜백을 제공하면 자동으로 무한 스크롤이 활성화됩니다:

```tsx
<VirtualDataTable
    data={data}
    columns={columns}
    totalCount={data.length}
    loading={loading}
    onLoadMore={(offset, limit) => {
        // 추가 데이터 로드
        fetchMoreData(offset, limit);
    }}
/>
```

더 이상 데이터가 없으면:

```tsx
<VirtualDataTable
    data={data}
    columns={columns}
    totalCount={data.length}
    onLoadMore={hasMoreData ? handleLoadMore : undefined}
/>
```

### 3. 키보드 탐색

테이블이 포커스되면 키보드로 탐색할 수 있습니다:

-   `↑` / `↓`: 50px씩 스크롤
-   `PageUp` / `PageDown`: 한 페이지씩 스크롤
-   `Home` / `End`: 맨 위/아래로 이동

테이블은 마운트 시 자동으로 포커스됩니다.

### 4. 얼룩말 줄무늬 (Zebra Striping)

홀수 행에 배경색을 적용할 수 있습니다:

```tsx
// 기본 회색 사용
<VirtualDataTable striped={true} ... />

// 커스텀 색상 사용
<VirtualDataTable striped="#e3f2fd" ... />
```

### 5. 그룹 헤더

관련된 컬럼들을 그룹화할 수 있습니다:

```tsx
const columns: DataColumn<User>[] = [
    { id: "id", text: "ID", width: 80 },
    { id: "firstName", text: "이름", width: 150, group: "개인정보" },
    { id: "lastName", text: "성", width: 150, group: "개인정보" },
    { id: "email", text: "이메일", width: 200, group: "연락처" },
    { id: "phone", text: "전화번호", width: 150, group: "연락처" },
];
```

그룹 헤더가 있으면 `columnHeight`가 자동으로 2배 적용됩니다.

### 6. 커스텀 렌더링

`render` 함수로 셀 내용을 자유롭게 커스터마이징할 수 있습니다:

```tsx
{
    id: "status",
    text: "상태",
    width: 100,
    render: (user) => (
        <Chip
            label={user.status}
            color={user.status === "active" ? "success" : "default"}
        />
    )
}
```

### 7. 빈 데이터 메시지 커스터마이징

데이터가 없을 때 표시할 메시지를 커스터마이징할 수 있습니다:

```tsx
// 문자열 사용
<VirtualDataTable
    data={[]}
    columns={columns}
    totalCount={0}
    emptyMessage="데이터가 없습니다"
/>

// ReactNode 사용
<VirtualDataTable
    data={[]}
    columns={columns}
    totalCount={0}
    emptyMessage={
        <Box>
            <ErrorIcon fontSize="large" />
            <Typography>데이터를 불러올 수 없습니다</Typography>
            <Button onClick={reload}>다시 시도</Button>
        </Box>
    }
/>
```

### 8. 커스텀 스크롤바

`scrollbars` 속성으로 스크롤바 모양을 커스터마이징할 수 있습니다:

```tsx
<VirtualDataTable
    scrollbars={{
        thumb: {
            background: "#1976d2",
            width: 8,
            radius: 4,
        },
        track: {
            background: "#f5f5f5",
        },
    }}
    ...
/>
```

## 다음 단계

-   **[예제 코드 보기](./example.md)** - 다양한 사용 예제
-   **[API 상세 문서](./api.md)** - 전체 API 레퍼런스 _(작성 예정)_

## 문제 해결

### 스크롤이 부드럽지 않아요

-   `rowHeight`를 명시적으로 설정하세요
-   데이터 객체에 고유한 `key` 속성이 있는지 확인하세요

### 무한 스크롤이 작동하지 않아요

-   `onLoadMore` 콜백이 제대로 전달되었는지 확인하세요
-   더 이상 데이터가 없을 때 `onLoadMore={undefined}`를 전달했는지 확인하세요

### 그룹 헤더 높이가 이상해요

-   `columnHeight`를 조정하세요 (기본값: 56px)
-   그룹 헤더가 있으면 자동으로 2배가 적용됩니다

## 라이센스

MIT © KIM YOUNG JIN (ehfuse@gmail.com)
