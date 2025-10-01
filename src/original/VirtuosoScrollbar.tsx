/**
 * VirtuosoScrollbar.tsx
 * 
 * @license Proprietary License (독점 라이선스)
 * @copyright 2025 김영진 (Kim Young Jin)
 * @author 김영진 (ehfuse@gmail.com)
 * @contact 010-3094-9944
 * 
 * IMPORTANT NOTICE (중요 공지):
 * This code is the intellectual property of 김영진 (Kim Young Jin).
 * All rights reserved. Unauthorized copying, modification, distribution,
 * or use of this code is strictly prohibited without prior written
 * permission from the copyright holder.
 * 
 * 이 코드는 김영진의 지적재산권입니다.
 * 모든 권리가 보호됩니다. 저작권자의 사전 서면 허가 없이
 * 무단 복사, 수정, 배포 또는 사용을 엄격히 금지합니다.
 * 
 * For licensing inquiries, please contact (라이선스 문의):
 * Email: ehfuse@gmail.com
 * Phone: 010-3094-9944
 */

import React, { useRef, useEffect, useState, useCallback, ReactNode } from "react";
import { Box } from "@mui/material";

interface VirtuosoScrollbarProps {
    children: ReactNode;
    height?: string | number;
    width?: string | number;
    onScroll?: (event: Event) => void;
}

export const VirtuosoScrollbar: React.FC<VirtuosoScrollbarProps> = ({
    children,
    height = "100%",
    width = "100%",
    onScroll,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollbarRef = useRef<HTMLDivElement>(null);
    const thumbRef = useRef<HTMLDivElement>(null);

    const [scrollbarVisible, setScrollbarVisible] = useState(false);
    const [trackVisible, setTrackVisible] = useState(false); // 트랙 표시 상태 추가
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ y: 0, scrollTop: 0 });
    const [thumbHeight, setThumbHeight] = useState(0);
    const [thumbTop, setThumbTop] = useState(0);

    // 스크롤바 표시/숨김 타이머
    const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Virtuoso 스크롤 요소 참조
    const virtuosoScrollerRef = useRef<HTMLDivElement | null>(null);

    // 타이머 관리 함수들
    const clearHideTimer = useCallback(() => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
    }, []);

    const setHideTimer = useCallback(
        (delay: number) => {
            hideTimeoutRef.current = setTimeout(() => {
                if (!isDragging) {
                    setScrollbarVisible(false);
                }
            }, delay);
        },
        [isDragging]
    ); // Virtuoso 스크롤 요소 찾기
    const findVirtuosoScroller = useCallback(() => {
        if (!containerRef.current) return null;

        // Virtuoso의 스크롤 컨테이너 찾기 (data-testid 또는 클래스명으로)
        const scroller = containerRef.current.querySelector('[data-testid="virtuoso-scroller"]') as HTMLDivElement;
        if (scroller) {
            virtuosoScrollerRef.current = scroller;
            return scroller;
        }

        // 대안: TableContainer 내부의 첫 번째 div 요소
        const tableContainer = containerRef.current.querySelector(".MuiTableContainer-root");
        if (tableContainer) {
            const scrollElement = tableContainer as HTMLDivElement;
            virtuosoScrollerRef.current = scrollElement;
            return scrollElement;
        }

        return null;
    }, []);

    // 스크롤바 크기 및 위치 계산 (Virtuoso 전용)
    const updateScrollbar = useCallback(() => {
        const scroller = virtuosoScrollerRef.current || findVirtuosoScroller();
        if (!scroller || !containerRef.current) return;

        const containerHeight = containerRef.current.clientHeight;
        const scrollTop = scroller.scrollTop;
        const scrollHeight = scroller.scrollHeight;

        // 스크롤 가능한 콘텐츠가 있는지 확인
        if (scrollHeight <= containerHeight) {
            setScrollbarVisible(false);
            return;
        }

        // 썸 높이 계산 (Virtuoso의 가상화를 고려)
        const thumbHeightRatio = containerHeight / scrollHeight;
        const calculatedThumbHeight = Math.max(30, Math.min(containerHeight * 0.8, containerHeight * thumbHeightRatio));

        // 썸 위치 계산
        const scrollRatio = scrollTop / (scrollHeight - containerHeight);
        const maxThumbTop = containerHeight - calculatedThumbHeight;
        const calculatedThumbTop = Math.max(0, Math.min(maxThumbTop, scrollRatio * maxThumbTop));

        setThumbHeight(calculatedThumbHeight);
        setThumbTop(calculatedThumbTop);
    }, [findVirtuosoScroller]);

    // 마우스 엔터 이벤트 (즉시 표시)
    const handleMouseEnter = useCallback(() => {
        setScrollbarVisible(true);
        setTrackVisible(true); // hover 시 트랙 표시
        clearHideTimer(); // 기존 타이머 취소
    }, [clearHideTimer]);

    // 마우스 리브 이벤트 (타이머 시작)
    const handleMouseLeave = useCallback(() => {
        if (!isDragging) {
            setTrackVisible(false); // hover 해제 시 트랙 숨김
            setHideTimer(2000); // 2초로 변경
        }
    }, [isDragging, setHideTimer]);

    // 썸 드래그 시작
    const handleThumbMouseDown = useCallback(
        (event: React.MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();

            const scroller = virtuosoScrollerRef.current || findVirtuosoScroller();
            if (!scroller) return;

            setIsDragging(true);
            setDragStart({
                y: event.clientY,
                scrollTop: scroller.scrollTop,
            });

            setScrollbarVisible(true);
            setTrackVisible(true); // 드래그 시 트랙 표시
            clearHideTimer(); // 드래그 중에는 타이머 취소
        },
        [findVirtuosoScroller, clearHideTimer]
    );

    // 썸 드래그 중
    const handleMouseMove = useCallback(
        (event: MouseEvent) => {
            if (!isDragging) return;

            const scroller = virtuosoScrollerRef.current || findVirtuosoScroller();
            if (!scroller || !containerRef.current) return;

            event.preventDefault();

            const containerHeight = containerRef.current.clientHeight;
            const scrollHeight = scroller.scrollHeight;

            const deltaY = event.clientY - dragStart.y;
            const scrollableHeight = scrollHeight - containerHeight;
            const maxThumbTop = containerHeight - thumbHeight;

            // 드래그 거리를 스크롤 거리로 변환
            const scrollDelta = (deltaY / maxThumbTop) * scrollableHeight;
            const newScrollTop = Math.max(0, Math.min(scrollableHeight, dragStart.scrollTop + scrollDelta));

            scroller.scrollTop = newScrollTop;
            updateScrollbar();
        },
        [isDragging, dragStart, thumbHeight, updateScrollbar, findVirtuosoScroller]
    );

    // 썸 드래그 종료
    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setTrackVisible(false); // 드래그 종료 시 트랙 숨김
        setHideTimer(2000);
    }, [setHideTimer]);

    // 스크롤바 트랙 클릭
    const handleTrackClick = useCallback(
        (event: React.MouseEvent) => {
            const scroller = virtuosoScrollerRef.current || findVirtuosoScroller();
            if (!scroller || !containerRef.current || !scrollbarRef.current) return;

            const scrollbar = scrollbarRef.current;
            const rect = scrollbar.getBoundingClientRect();
            const clickY = event.clientY - rect.top;

            const container = containerRef.current;
            const containerHeight = container.clientHeight;
            const scrollHeight = scroller.scrollHeight;

            const scrollRatio = clickY / containerHeight;
            const newScrollTop = scrollRatio * (scrollHeight - containerHeight);

            scroller.scrollTop = Math.max(0, Math.min(scrollHeight - containerHeight, newScrollTop));
            updateScrollbar();

            setScrollbarVisible(true);
            setTrackVisible(true); // 클릭 시 트랙 표시
            setHideTimer(2000); // 클릭 후 2초간 유지
        },
        [updateScrollbar, findVirtuosoScroller, setHideTimer]
    );

    // Virtuoso 스크롤 이벤트 리스너 등록
    useEffect(() => {
        const setupScrollListener = () => {
            const scroller = findVirtuosoScroller();
            if (!scroller) {
                // 스크롤러를 찾지 못하면 잠시 후 다시 시도
                const retryTimeout = setTimeout(setupScrollListener, 100);
                return () => clearTimeout(retryTimeout);
            }

            const handleWheel = () => {
                clearHideTimer(); // 먼저 기존 타이머 취소
                setScrollbarVisible(true);
                updateScrollbar();
                setHideTimer(700); // 0.7초로 변경
            };

            // 스크롤 이벤트 디바운스
            const debouncedScroll = (event: Event) => {
                clearHideTimer(); // 먼저 기존 타이머 취소
                setScrollbarVisible(true);
                updateScrollbar();
                setHideTimer(700); // 0.7초로 변경

                if (onScroll) {
                    onScroll(event);
                }
            };

            scroller.addEventListener("scroll", debouncedScroll, { passive: true });
            scroller.addEventListener("wheel", handleWheel, { passive: true });

            return () => {
                scroller.removeEventListener("scroll", debouncedScroll);
                scroller.removeEventListener("wheel", handleWheel);
            };
        };

        const cleanup = setupScrollListener();
        return cleanup;
    }, [updateScrollbar, isDragging, onScroll, findVirtuosoScroller]);

    // 마우스 이벤트 리스너 등록 (드래그)
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

    // 초기 스크롤바 설정
    useEffect(() => {
        const initializeScrollbar = () => {
            const scroller = findVirtuosoScroller();
            if (!scroller) {
                const retryTimeout = setTimeout(initializeScrollbar, 200);
                return () => clearTimeout(retryTimeout);
            }

            // 초기 계산만 수행, 표시하지 않음
            updateScrollbar();

            return () => {};
        };

        const cleanup = initializeScrollbar();
        return cleanup;
    }, [updateScrollbar, findVirtuosoScroller, children]);

    // 리사이즈 옵저버 (Virtuoso 스크롤러 감지용)
    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver(() => {
            updateScrollbar();
        });

        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, [updateScrollbar]);

    // 컴포넌트 언마운트 시 타이머 정리
    useEffect(() => {
        return () => {
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }
        };
    }, []);

    return (
        <Box
            ref={containerRef}
            className="overlay-scrollbar-container"
            sx={{
                position: "relative",
                height,
                width,
                overflow: "hidden",
            }}
        >
            {/* Virtuoso 콘텐츠 영역 */}
            {children}

            {/* 커스텀 스크롤바 */}
            <Box
                ref={scrollbarRef}
                onClick={handleTrackClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                sx={{
                    position: "absolute",
                    top: 0,
                    right: 0, // 오른쪽 끝까지
                    width: 16, // 감지 영역을 넓게
                    height: "100%",
                    opacity: scrollbarVisible ? 1 : 0,
                    transition: "opacity 0.15s ease-in-out", // 더 빠르고 부드러운 전환
                    pointerEvents: "auto", // 항상 이벤트 감지
                    zIndex: 1000, // Virtuoso보다 높은 z-index
                    cursor: "pointer",
                    borderRadius: "4px",
                    backgroundColor: "transparent",
                    display: "flex",
                    justifyContent: "flex-end", // 스크롤바를 오른쪽 정렬
                    alignItems: "stretch",
                    paddingRight: "2px",
                }}
            >
                {/* 스크롤바 트랙 (배경) */}
                <Box
                    sx={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        width: "8px", // thumb와 같은 너비
                        height: "100%",
                        backgroundColor: "rgba(128, 128, 128, 0.15)", // 흐린 회색 배경
                        borderRadius: "4px",
                        opacity: trackVisible ? 1 : 0, // 트랙 표시 상태에 따라 조절
                        transition: "opacity 0.15s ease-in-out", // 전환 시간 일치
                    }}
                />

                {/* 스크롤바 썸 */}
                <Box
                    ref={thumbRef}
                    onMouseDown={handleThumbMouseDown}
                    sx={{
                        position: "absolute",
                        top: `${thumbTop}px`,
                        right: 0,
                        width: "8px", // 실제 스크롤바 너비
                        height: `${Math.max(thumbHeight, 30)}px`,
                        backgroundColor: isDragging ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.3)", // 더 흐리게 조정
                        borderRadius: "4px",
                        cursor: "pointer",
                        minHeight: "30px",
                        transition: isDragging ? "none" : "background-color 0.2s ease, transform 0.1s ease",
                        transform: isDragging ? "scaleX(1.2)" : "scaleX(1)",
                        opacity: 0.7,
                        "&:hover": {
                            transform: "scaleX(1.1)",
                            opacity: 1,
                        },
                    }}
                />
            </Box>
        </Box>
    );
};

export default VirtuosoScrollbar;
