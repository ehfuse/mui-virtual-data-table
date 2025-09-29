import { useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import {
    CssBaseline,
    Container,
    Typography,
    Box,
    Button,
    Switch,
    FormControlLabel,
    CircularProgress,
    Fade,
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

// 커스텀 로딩 컴포넌트
const CustomLoading = ({
    visible = true,
    onComplete,
}: {
    visible?: boolean;
    onComplete?: () => void;
}) => {
    return (
        <Fade in={visible} timeout={300} onExited={onComplete}>
            <Box
                sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                    bgcolor: "rgba(255, 255, 255, 0.9)",
                    p: 3,
                    borderRadius: 2,
                    boxShadow: 2,
                }}
            >
                <CircularProgress size={40} />
                <Typography variant="body2" color="text.secondary">
                    데이터를 불러오는 중...
                </Typography>
            </Box>
        </Fade>
    );
};

function App() {
    const [darkMode, setDarkMode] = useState(false);
    const [data, setData] = useState<User[]>(() => generateTestData(100));
    const [loading, setLoading] = useState(false);

    // MUI 테마 설정
    const theme = createTheme({
        palette: {
            mode: darkMode ? "dark" : "light",
        },
    });

    // 컬럼 정의
    const columns: DataColumn<User>[] = [
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
    ];

    // 더 많은 데이터 로드 시뮬레이션
    const loadMoreData = async () => {
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const newData = generateTestData(500);
        setData((prev) => [...prev, ...newData]);
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
                        <Typography variant="body2" color="text.secondary">
                            총 {data.length}개 항목
                        </Typography>
                    </Box>
                </Box>

                <Box
                    sx={{
                        height: 600,
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 1,
                    }}
                >
                    <VirtualDataTable<User>
                        data={data}
                        columns={columns}
                        totalCount={data.length}
                        loading={loading}
                        hasMore={false}
                        LoadingComponent={CustomLoading}
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
