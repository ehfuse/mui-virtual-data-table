import { useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import {
    CssBaseline,
    Container,
    Box,
    Tabs,
    Tab,
    Typography,
} from "@mui/material";
import BasicTest from "./BasicTest";
import SimpleExample from "./SimpleExample";
import "./App.css";

function App() {
    const [currentTab, setCurrentTab] = useState(0);

    // MUI 테마 설정 (기본 라이트 모드, 각 탭에서 독립적으로 다크모드 설정)
    const theme = createTheme({
        palette: {
            mode: "light",
        },
    });

    const handleTabChange = (
        _event: React.SyntheticEvent,
        newValue: number
    ) => {
        setCurrentTab(newValue);
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
                        다양한 기능을 테스트할 수 있는 예제 페이지
                    </Typography>

                    <Box
                        sx={{ borderBottom: 1, borderColor: "divider", mt: 3 }}
                    >
                        <Tabs
                            value={currentTab}
                            onChange={handleTabChange}
                            aria-label="example tabs"
                        >
                            <Tab label="기본 테스트" />
                            <Tab label="간단한 예제" />
                        </Tabs>
                    </Box>
                </Box>

                <Box>
                    {currentTab === 0 && <BasicTest />}
                    {currentTab === 1 && <SimpleExample />}
                </Box>
            </Container>
        </ThemeProvider>
    );
}

export default App;
