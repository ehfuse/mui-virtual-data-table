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

import React, { useCallback, useRef, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { Box } from "@mui/material";

interface VirtuosoScrollbarProps {
    children: ReactNode;
    height?: string | number;
    width?: string | number;
    onScroll?: (event: Event) => void;
    hideDelay?: number; // 기본 auto hide 딜레이 (ms)
    hideDelayOnWheel?: number; // 스크롤/휠 후 auto hide 딜레이 (ms)
}

export const VirtuosoScrollbar: React.FC<VirtuosoScrollbarProps> = ({
    children,
    height = "100%",
    width = "100%",
    onScroll,
    hideDelay = 1500,
    hideDelayOnWheel = 700,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollbarRef = useRef<HTMLDivElement>(null);
    const thumbRef = useRef<HTMLDivElement>(null);
    const virtuosoRef = useRef<any>(null);

    const [scrollbarVisible, setScrollbarVisible] = useState(false);

    // 스크롤바 가시성 변경 로그
    useEffect(() => {
        console.log("👁️ 스크롤바 가시성 변경:", scrollbarVisible);
    }, [scrollbarVisible]);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartY, setDragStartY] = useState(0);
    const [dragStartScrollTop, setDragStartScrollTop] = useState(0);
    const [dragStartThumbTop, setDragStartThumbTop] = useState(0);

    // 타이머 관리
    const hideTimer = useRef<number | null>(null);
    const wheelHideTimer = useRef<number | null>(null);

    // 컴포넌트 마운트 로그
    useEffect(() => {
        console.log("🚀 VirtuosoScrollbar 컴포넌트 마운트됨");
        return () => {
            console.log("💥 VirtuosoScrollbar 컴포넌트 언마운트됨");
        };
    }, []);

    // Virtuoso 인스턴스 찾기
    const findVirtuosoScroller = useCallback(() => {
        const container = containerRef.current;
        console.log("🔍 컨테이너 찾기:", container);
        if (!container) return null;

        const virtuosoScroller = container.querySelector(
            '[data-virtuoso-scroller="true"]'
        ) as HTMLDivElement;
        console.log("🎯 Virtuoso 스크롤러 찾기:", virtuosoScroller);
        if (virtuosoScroller) {
            console.log(
                "✅ Virtuoso 스크롤러 발견 - scrollTop:",
                virtuosoScroller.scrollTop,
                "scrollHeight:",
                virtuosoScroller.scrollHeight
            );
            return virtuosoScroller;
        }
        console.log("❌ Virtuoso 스크롤러 없음");
        return null;
    }, []);

    // 스크롤바 위치 업데이트
    const updateScrollbar = useCallback(
        (scrollTop: number, scrollHeight: number, containerHeight: number) => {
            if (isDragging) {
                console.log("⏸️ 드래그 중 - 스크롤바 업데이트 건너뛰기");
                return;
            }

            const maxScrollTop = Math.max(0, scrollHeight - containerHeight);
            const scrollRatio = maxScrollTop > 0 ? scrollTop / maxScrollTop : 0;

            // 썸 높이를 컨테이너의 20% 또는 최소 30px로 설정
            const thumbHeight = Math.max(30, containerHeight * 0.2);
            const availableHeight = containerHeight - thumbHeight;
            const thumbTop = Math.max(
                0,
                Math.min(availableHeight, scrollRatio * availableHeight)
            );

            console.log("📊 스크롤바 업데이트:", {
                scrollTop: scrollTop.toFixed(1),
                scrollHeight: scrollHeight,
                containerHeight: containerHeight,
                maxScrollTop: maxScrollTop,
                thumbTop: thumbTop.toFixed(1),
                thumbHeight: thumbHeight.toFixed(1),
                scrollRatio: scrollRatio.toFixed(3),
            });

            if (thumbRef.current) {
                thumbRef.current.style.top = `${thumbTop}px`;
                thumbRef.current.style.height = `${thumbHeight}px`;
            }
        },
        [isDragging]
    );

    // 썸 드래그 시작
    const handleThumbMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();

            const currentVirtuoso = findVirtuosoScroller();
            if (!currentVirtuoso) return;

            const currentScrollTop = currentVirtuoso.scrollTop;
            const thumbElement = thumbRef.current;
            if (!thumbElement) return;

            const thumbTop = parseFloat(thumbElement.style.top) || 0;

            setIsDragging(true);
            setDragStartY(e.clientY);
            setDragStartScrollTop(currentScrollTop);
            setDragStartThumbTop(thumbTop);

            console.log("🟢 드래그 시작:", {
                clientY: e.clientY,
                scrollTop: currentScrollTop,
                thumbTop,
            });
        },
        [findVirtuosoScroller]
    );

    // 마우스 이동 처리
    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!isDragging) return;

            const currentVirtuoso = findVirtuosoScroller();
            if (!currentVirtuoso) return;

            const deltaY = e.clientY - dragStartY;
            const containerElement = containerRef.current;

            if (!containerElement) return;

            const containerHeight =
                containerElement.getBoundingClientRect().height;

            // 동적 썸 높이 계산
            const thumbHeight = Math.max(30, containerHeight * 0.2);
            const availableRange = containerHeight - thumbHeight;

            // 새로운 썸 위치 계산
            const newThumbTop = Math.max(
                0,
                Math.min(availableRange, dragStartThumbTop + deltaY)
            );
            const scrollRatio =
                availableRange > 0 ? newThumbTop / availableRange : 0;

            // 썸 위치 즉시 업데이트
            if (thumbRef.current) {
                thumbRef.current.style.top = `${newThumbTop}px`;
                thumbRef.current.style.height = `${thumbHeight}px`;
            }

            // 스크롤 위치 계산
            const scrollHeight = currentVirtuoso.scrollHeight;
            const maxScrollTop = Math.max(0, scrollHeight - containerHeight);
            const targetScrollTop = scrollRatio * maxScrollTop;

            console.log("🔵 드래그:", {
                deltaY,
                newThumbTop: newThumbTop.toFixed(1),
                scrollRatio: scrollRatio.toFixed(3),
                targetScrollTop: targetScrollTop.toFixed(1),
            });

            // 스크롤 실행
            currentVirtuoso.scrollTop = targetScrollTop;
        },
        [isDragging, dragStartY, dragStartThumbTop, findVirtuosoScroller]
    );

    // 타이머 설정
    const setHideTimer = useCallback((delay: number) => {
        if (hideTimer.current) {
            clearTimeout(hideTimer.current);
        }

        hideTimer.current = setTimeout(() => {
            setScrollbarVisible(false);
        }, delay);
    }, []);

    // 마우스 업 처리
    const handleMouseUp = useCallback(() => {
        if (!isDragging) return;

        console.log("🔴 드래그 종료");
        setIsDragging(false);

        // 드래그 종료 후에는 타이머를 시작하지 않음 (마우스가 스크롤바 영역에 있을 수 있음)
        // onMouseLeave 이벤트에서만 타이머 시작
    }, [isDragging]); // 트랙 클릭 처리
    const handleTrackClick = useCallback(
        (e: React.MouseEvent) => {
            console.log("🖱️ 트랙 클릭 이벤트 발생:", e.target);
            const currentVirtuoso = findVirtuosoScroller();
            console.log("🎯 트랙 클릭 - Virtuoso:", currentVirtuoso);
            console.log("📦 트랙 클릭 - 컨테이너:", containerRef.current);
            console.log("👆 트랙 클릭 - 썸 요소:", thumbRef.current);
            console.log(
                "🎯 클릭 타겟:",
                e.target === thumbRef.current ? "썸" : "트랙"
            );

            if (
                !currentVirtuoso ||
                !containerRef.current ||
                e.target === thumbRef.current
            ) {
                console.log("❌ 트랙 클릭 조건 실패");
                return;
            }

            const containerElement = containerRef.current;
            const containerRect = containerElement.getBoundingClientRect();
            const clickY = e.clientY - containerRect.top;
            const containerHeight = containerRect.height;

            // 동적 썸 높이 계산
            const thumbHeight = Math.max(30, containerHeight * 0.2);
            const availableHeight = containerHeight - thumbHeight;

            const targetRatio = Math.max(
                0,
                Math.min(1, (clickY - thumbHeight / 2) / availableHeight)
            );

            const scrollHeight = currentVirtuoso.scrollHeight;
            const maxScrollTop = Math.max(0, scrollHeight - containerHeight);
            const targetScrollTop = targetRatio * maxScrollTop;

            // 썸 위치 즉시 업데이트
            const newThumbTop = targetRatio * availableHeight;
            if (thumbRef.current) {
                thumbRef.current.style.top = `${newThumbTop}px`;
                thumbRef.current.style.height = `${thumbHeight}px`;
            }

            // 스크롤을 즉시 이동 (애니메이션 없음)
            currentVirtuoso.scrollTop = targetScrollTop;
        },
        [findVirtuosoScroller]
    );

    // 키보드 스크롤 처리
    const handleKeyboardScroll = useCallback(
        (direction: "up" | "down" | "home" | "end") => {
            const currentVirtuoso = findVirtuosoScroller();
            if (!currentVirtuoso) return;

            const scrollTop = currentVirtuoso.scrollTop;
            const scrollHeight = currentVirtuoso.scrollHeight;
            const containerHeight =
                containerRef.current?.getBoundingClientRect().height || 0;
            const maxScrollTop = Math.max(0, scrollHeight - containerHeight);

            let targetScrollTop = scrollTop;

            switch (direction) {
                case "up":
                    targetScrollTop = Math.max(
                        0,
                        scrollTop - containerHeight * 0.9
                    );
                    break;
                case "down":
                    targetScrollTop = Math.min(
                        maxScrollTop,
                        scrollTop + containerHeight * 0.9
                    );
                    break;
                case "home":
                    targetScrollTop = 0;
                    break;
                case "end":
                    targetScrollTop = maxScrollTop;
                    break;
            }

            currentVirtuoso.scrollTo({
                top: targetScrollTop,
                behavior: "auto",
            });

            // 썸 위치 즉시 업데이트
            const containerElement = containerRef.current;
            if (containerElement) {
                const containerHeight =
                    containerElement.getBoundingClientRect().height;
                const thumbHeight = Math.max(30, containerHeight * 0.2);
                const availableHeight = containerHeight - thumbHeight;
                const newScrollRatio =
                    maxScrollTop > 0 ? targetScrollTop / maxScrollTop : 0;
                const newThumbTop = Math.max(
                    0,
                    Math.min(availableHeight, newScrollRatio * availableHeight)
                );

                if (thumbRef.current) {
                    thumbRef.current.style.top = `${newThumbTop}px`;
                    thumbRef.current.style.height = `${thumbHeight}px`;
                }

                console.log("⌨️ 키보드 네비게이션:", {
                    direction,
                    targetScrollTop: targetScrollTop.toFixed(1),
                    newThumbTop: newThumbTop.toFixed(1),
                    scrollRatio: newScrollRatio.toFixed(3),
                });
            }
        },
        [findVirtuosoScroller]
    );

    // 마우스/키보드 이벤트 리스너 설정
    useEffect(() => {
        if (isDragging) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);

            return () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    // Virtuoso 이벤트 리스너 설정
    useEffect(() => {
        console.log("⚙️ Virtuoso 이벤트 리스너 설정 시작");
        const container = containerRef.current;
        if (!container) {
            console.log("❌ 컨테이너 없음");
            return;
        }

        const currentVirtuoso = findVirtuosoScroller();
        if (!currentVirtuoso) {
            console.log("❌ Virtuoso 스크롤러 없음");
            return;
        }

        console.log("✅ Virtuoso 이벤트 리스너 설정 완료");
        virtuosoRef.current = currentVirtuoso;

        const handleScroll = () => {
            const scrollTop = currentVirtuoso.scrollTop;
            const scrollHeight = currentVirtuoso.scrollHeight;
            const containerHeight = container.getBoundingClientRect().height;

            // 스크롤바 표시
            setScrollbarVisible(true);

            // 스크롤바 위치 업데이트
            updateScrollbar(scrollTop, scrollHeight, containerHeight);

            // 외부 콜백 호출
            if (onScroll) {
                onScroll(new Event("scroll"));
            }
        };

        const handleWheel = () => {
            console.log(`🎡 휠 스크롤 - ${hideDelayOnWheel}ms 후 숨김`);
            setScrollbarVisible(true);

            // 드래그 중이 아닐 때만 타이머 설정
            if (!isDragging) {
                if (wheelHideTimer.current) {
                    clearTimeout(wheelHideTimer.current);
                }

                wheelHideTimer.current = setTimeout(() => {
                    console.log("🎡 휠 스크롤 타이머 완료 - 스크롤바 숨김");
                    setScrollbarVisible(false);
                }, hideDelayOnWheel);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.code) {
                case "PageUp":
                    e.preventDefault();
                    handleKeyboardScroll("up");
                    break;
                case "PageDown":
                    e.preventDefault();
                    handleKeyboardScroll("down");
                    break;
                case "Home":
                    e.preventDefault();
                    handleKeyboardScroll("home");
                    break;
                case "End":
                    e.preventDefault();
                    handleKeyboardScroll("end");
                    break;
            }
        };

        // 이벤트 리스너 추가
        currentVirtuoso.addEventListener("scroll", handleScroll);
        container.addEventListener("wheel", handleWheel);
        container.addEventListener("keydown", handleKeyDown);

        // 초기 스크롤바 위치 설정
        handleScroll();

        return () => {
            currentVirtuoso.removeEventListener("scroll", handleScroll);
            container.removeEventListener("wheel", handleWheel);
            container.removeEventListener("keydown", handleKeyDown);
        };
    }, [
        updateScrollbar,
        handleKeyboardScroll,
        onScroll,
        hideDelayOnWheel,
        isDragging,
    ]);

    // 컨테이너 마우스 엔터/리브 이벤트 (비활성화)
    const handleMouseEnter = useCallback(() => {
        // 스크롤바 영역에서만 처리하므로 비활성화
        // console.log('🖱️ 컨테이너 마우스 엔터');
    }, []);

    // 정리
    useEffect(() => {
        return () => {
            if (hideTimer.current) clearTimeout(hideTimer.current);
            if (wheelHideTimer.current) clearTimeout(wheelHideTimer.current);
        };
    }, []);

    console.log("🎨 스크롤바 렌더링:", {
        scrollbarVisible,
        isDragging,
        height,
        width,
        containerRef: !!containerRef.current,
        thumbRef: !!thumbRef.current,
    });

    return (
        <Box
            ref={containerRef}
            className="virtuoso-scrollbar-container"
            sx={{
                position: "relative",
                height,
                width,
                overflow: "hidden",
            }}
            onMouseEnter={handleMouseEnter}
            tabIndex={0}
        >
            {children}

            {/* 커스텀 스크롤바 영역 */}
            <Box
                ref={scrollbarRef}
                className="virtuoso-scrollbar-area"
                onClick={handleTrackClick}
                onMouseEnter={() => {
                    console.log("🎯 스크롤바 영역 hover - 스크롤바 표시");
                    setScrollbarVisible(true);
                    if (hideTimer.current) {
                        clearTimeout(hideTimer.current);
                    }
                }}
                onMouseLeave={() => {
                    console.log(
                        `🎯 스크롤바 영역 leave - ${hideDelay}ms 후 숨김`
                    );
                    setHideTimer(hideDelay);
                }}
                sx={{
                    position: "absolute",
                    right: 0,
                    top: 0,
                    width: "16px", // 트랙 너비의 두 배
                    height: "100%",
                    zIndex: 1000,
                    cursor: "pointer",
                }}
            >
                {/* 스크롤바 트랙 */}
                <Box
                    className="virtuoso-scrollbar-track"
                    sx={{
                        position: "absolute",
                        right: 0, // 오른쪽에 붙임
                        width: "8px", // 실제 트랙 너비
                        height: "100%",
                        backgroundColor: "rgba(0, 0, 0, 0.05)", // 더 흐리게
                        borderRadius: "4px",
                        opacity: scrollbarVisible || isDragging ? 1 : 0,
                        transition: "opacity 0.2s ease",
                    }}
                />

                {/* 스크롤바 썸 */}
                <Box
                    ref={thumbRef}
                    className="virtuoso-scrollbar-thumb"
                    onMouseDown={handleThumbMouseDown}
                    sx={{
                        position: "absolute",
                        right: 0, // 오른쪽에 붙임
                        width: "8px", // 실제 썸 너비
                        height: "30px", // 기본값, JavaScript에서 동적 변경
                        backgroundColor: "rgba(0, 0, 0, 0.3)", // 더 흐리게
                        borderRadius: "4px",
                        cursor: "pointer",
                        opacity: scrollbarVisible || isDragging ? 1 : 0,
                        transition: isDragging
                            ? "none"
                            : "background-color 0.2s ease, opacity 0.2s ease",
                        "&:hover": {
                            backgroundColor: "rgba(0, 0, 0, 0.5)", // 더 흐리게
                        },
                        "&:active": {
                            cursor: "pointer",
                            backgroundColor: "rgba(0, 0, 0, 0.6)", // 더 흐리게
                        },
                    }}
                />
            </Box>
        </Box>
    );
};
