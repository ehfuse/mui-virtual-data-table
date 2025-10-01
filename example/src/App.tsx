import { useState, useEffect, useMemo, useCallback } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import {
    CssBaseline,
    Container,
    Typography,
    Box,
    Button,
    Switch,
    FormControlLabel,
} from "@mui/material";
import { VirtualDataTable } from "../../src/VirtualDataTable";
import type { DataColumn } from "../../src/types";
import "./App.css";

// 테스트용 사용자 데이터 타입
interface User {
    id: number;
    name: string;
    email: string;
    age: number;
    city: string;
    isActive: boolean;
}

// 테스트용 데이터 생성
const generateTestData = (count: number): User[] => {
    const cities = [
        "서울",
        "부산",
        "대구",
        "인천",
        "광주",
        "대전",
        "울산",
        "수원",
        "용인",
        "창원",
    ];
    const names = [
        "김철수",
        "이영희",
        "박민수",
        "정수진",
        "최영수",
        "한미영",
        "장성호",
        "윤지영",
        "임동현",
        "배수정",
    ];

    return Array.from({ length: count }, (_, index) => ({
        id: index + 1,
        name: names[index % names.length],
        email: `user${index + 1}@example.com`,
        age: 20 + (index % 50),
        city: cities[index % cities.length],
        isActive: Math.random() > 0.3,
    }));
};

// 빈 데이터 생성 (테스트용)
const generateEmptyData = (): User[] => {
    return [];
};

function App() {
    const [darkMode, setDarkMode] = useState(false);
    const [data, setData] = useState<User[]>([]);
    const [loading, setLoading] = useState(true); // 초기 로딩 상태
    const [sortBy, setSortBy] = useState<string>();
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

    // MUI 테마 설정
    const theme = createTheme({
        palette: {
            mode: darkMode ? "dark" : "light",
        },
    });

    // 컴럼 정의 - useMemo로 메모이제이션하여 불필요한 재렌더링 방지
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
                text: "이름",
                width: 120,
                sortable: true,
            },
            {
                id: "email",
                text: "이메일",
                width: 200,
                sortable: true,
            },
            {
                id: "age",
                text: "나이",
                width: 80,
                sortable: true,
                align: "center",
            },
            {
                id: "city",
                text: "도시",
                width: 100,
                sortable: true,
            },
            {
                id: "isActive",
                text: "활성",
                width: 80,
                sortable: true,
                align: "center",
                render: (user: User) => (
                    <span style={{ color: user.isActive ? "green" : "red" }}>
                        {user.isActive ? "활성" : "비활성"}
                    </span>
                ),
            },
        ],
        []
    );

    // 정렬 핸들러 - useCallback으로 메모이제이션
    const handleSort = useCallback(
        (columnId: string, direction: "asc" | "desc") => {
            console.log(`정렬: ${columnId} ${direction}`);
            setSortBy(columnId);
            setSortDirection(direction);

            // 실제 데이터 정렬
            const sortedData = [...data].sort((a, b) => {
                const aValue = a[columnId as keyof User];
                const bValue = b[columnId as keyof User];

                if (typeof aValue === "string" && typeof bValue === "string") {
                    return direction === "asc"
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);
                }

                if (typeof aValue === "number" && typeof bValue === "number") {
                    return direction === "asc"
                        ? aValue - bValue
                        : bValue - aValue;
                }

                if (
                    typeof aValue === "boolean" &&
                    typeof bValue === "boolean"
                ) {
                    return direction === "asc"
                        ? (aValue ? 1 : 0) - (bValue ? 1 : 0)
                        : (bValue ? 1 : 0) - (aValue ? 1 : 0);
                }

                return 0;
            });

            setData(sortedData);
        },
        [data]
    );

    // 초기 데이터 로딩
    useEffect(() => {
        const initialLoad = async () => {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            const initialData = generateTestData(50);
            setData(initialData);
            setLoading(false);
        };
        initialLoad();
    }, []);

    // 무한 스크롤 - 더 많은 데이터 로드 - useCallback으로 메모이제이션
    const handleLoadMore = useCallback(
        async (offset: number, limit: number) => {
            console.log(`무한 스크롤: offset=${offset}, limit=${limit}`);
            setLoading(true);

            // 네트워크 지연 시뮬레이션
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // 50개씩 추가로 로드
            const newData = generateTestData(50);
            const updatedData = newData.map((item, index) => ({
                ...item,
                id: data.length + index + 1, // ID 중복 방지
            }));

            setData((prev) => [...prev, ...updatedData]);
            setLoading(false);
        },
        [data.length]
    );

    // 수동 데이터 추가 (기존 버튼용)
    const loadMoreData = async () => {
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const newData = generateTestData(500);
        const updatedData = newData.map((item, index) => ({
            ...item,
            id: data.length + index + 1,
        }));
        setData((prev) => [...prev, ...updatedData]);
        setLoading(false);
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h3" component="h1" gutterBottom>
                        Virtual Data Table 예제
                    </Typography>
                    <Typography
                        variant="subtitle1"
                        color="text.secondary"
                        gutterBottom
                    >
                        대용량 데이터를 효율적으로 렌더링하는 가상화된 테이블
                        컴포넌트
                    </Typography>

                    <Box
                        sx={{
                            display: "flex",
                            gap: 2,
                            alignItems: "center",
                            mt: 2,
                            flexWrap: "wrap",
                        }}
                    >
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={darkMode}
                                    onChange={(e) =>
                                        setDarkMode(e.target.checked)
                                    }
                                />
                            }
                            label="다크 모드"
                        />
                        <Button
                            variant="outlined"
                            onClick={loadMoreData}
                            disabled={loading}
                        >
                            {loading ? "로딩 중..." : "데이터 추가 (500개)"}
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => {
                                setData(generateEmptyData());
                            }}
                        >
                            데이터 비우기
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={async () => {
                                setLoading(true);
                                await new Promise((resolve) =>
                                    setTimeout(resolve, 1000)
                                );
                                setData(generateTestData(50));
                                setLoading(false);
                            }}
                        >
                            데이터 초기화 (50개)
                        </Button>
                        <Typography variant="body2" color="text.secondary">
                            총 {data.length}개 항목
                        </Typography>
                    </Box>
                </Box>

                <Box
                    sx={{
                        height: 600,
                        width: 1000,
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 1,
                        mx: "auto", // 가운데 정렬
                    }}
                >
                    <VirtualDataTable<User>
                        data={data}
                        columns={columns}
                        totalCount={data.length}
                        loading={loading}
                        onLoadMore={
                            data.length >= 500 ? undefined : handleLoadMore
                        }
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        // striped={true}
                        // rowDivider={false}
                        // showPaper={true}
                        // paddingX={0}
                        emptyMessage="데이터가 없습니다"
                        onRowClick={(item: User) => {
                            console.log("Row clicked:", item);
                            alert(
                                `선택된 사용자: ${item.name} (${item.email})`
                            );
                        }}
                    />
                </Box>

                <Box sx={{ mt: 4 }}>
                    <Typography variant="h5" gutterBottom>
                        기능 설명
                    </Typography>
                    <ul>
                        <li>
                            🚀 <strong>가상화</strong>: 수천 개의 행도 부드럽게
                            스크롤
                        </li>
                        <li>
                            📊 <strong>정렬</strong>: 컬럼 헤더를 클릭하여
                            데이터 정렬
                        </li>
                        <li>
                            🎨 <strong>사용자 정의 렌더링</strong>: render
                            함수로 셀 내용 커스터마이징
                        </li>
                        <li>
                            📱 <strong>반응형</strong>: 다양한 화면 크기에 대응
                        </li>
                        <li>
                            ⚡ <strong>고성능</strong>: react-virtuoso 기반
                            최적화
                        </li>
                        <li>
                            🎭 <strong>테마 지원</strong>: 라이트/다크 모드 지원
                        </li>
                    </ul>
                </Box>
            </Container>
        </ThemeProvider>
    );
}

export default App;
