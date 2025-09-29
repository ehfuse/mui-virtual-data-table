/**
 * MIT License
 *
 * Copyright (c) 2025 KIM YOUNG JIN (ehfuse@gmail.com)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { useEffect, useRef } from "react";
import { CircularProgress, Box } from "@mui/material";

interface LoadingProps {
    visible?: boolean;
    onComplete?: () => void;
}

export const Loading = ({ visible = true, onComplete }: LoadingProps) => {
    const prevVisibleRef = useRef<boolean>(visible);

    useEffect(() => {
        // visible이 true에서 false로 변경될 때만 onComplete 호출
        if (
            prevVisibleRef.current === true &&
            visible === false &&
            onComplete
        ) {
            onComplete();
        }
        prevVisibleRef.current = visible;
    }, [visible, onComplete]);

    if (!visible) return null;

    return (
        <Box display="flex" justifyContent="center" alignItems="center" p={2}>
            <CircularProgress />
        </Box>
    );
};
