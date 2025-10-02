import { useState, useMemo } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import {
    CssBaseline,
    Container,
    Typography,
    Box,
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

// 5개의 테스트 데이터 생성
const generateSimpleData = (): User[] => {
    return [
        {
            id: 1,
            name: "김철수",
            email: "kim@example.com",
            age: 28,
            city: "서울",
            isActive: true,
        },
        {
            id: 2,
            name: "이영희",
            email: "lee@example.com",
            age: 32,
            city: "부산",
            isActive: true,
        },
        {
            id: 3,
            name: "박민수",
            email: "park@example.com",
            age: 25,
            city: "대구",
            isActive: false,
        },
        {
            id: 4,
            name: "정수진",
            email: "jung@example.com",
            age: 35,
            city: "인천",
            isActive: true,
        },
        {
            id: 5,
            name: "최영수",
            email: "choi@example.com",
            age: 29,
            city: "광주",
            isActive: false,
        },
    ];
};

function SimpleExample() {
    const [darkMode, setDarkMode] = useState(false);
    const [data] = useState<User[]>(generateSimpleData());

    // MUI 테마 설정
    const theme = createTheme({
        palette: {
            mode: darkMode ? "dark" : "light",
        },
    });

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

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h3" component="h1" gutterBottom>
                        간단한 테이블 예제
                    </Typography>
                    <Typography
                        variant="subtitle1"
                        color="text.secondary"
                        gutterBottom
                    >
                        5개의 데이터로 테이블의 기본 기능 확인
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
                        <Typography variant="body2" color="text.secondary">
                            총 {data.length}개 항목
                        </Typography>
                    </Box>
                </Box>

                <Box
                    sx={{
                        height: 600,
                        width: 1000,
                        borderRadius: 1,
                        mx: "auto",
                    }}
                >
                    <VirtualDataTable<User>
                        data={data}
                        columns={columns}
                        totalCount={data.length}
                        loading={false}
                        showPaper={true}
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
                        기능 확인
                    </Typography>
                    <ul>
                        <li>
                            📊 <strong>기본 렌더링</strong>: 5개의 데이터 표시
                        </li>
                        <li>
                            🎨 <strong>커스텀 렌더링</strong>: 활성 상태 컬러
                            표시
                        </li>
                        <li>
                            🖱️ <strong>행 클릭</strong>: 행을 클릭하면 알림 표시
                        </li>
                        <li>
                            🎭 <strong>테마 지원</strong>: 다크 모드 토글 가능
                        </li>
                    </ul>
                </Box>
            </Container>
        </ThemeProvider>
    );
}

export default SimpleExample;
