/**
 * VirtualDataTable.tsx
 *
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

import React, {
    forwardRef,
    useCallback,
    useMemo,
    useRef,
    useEffect,
    memo,
    useState,
} from "react";
import {
    Box,
    Table,
    TableBody as MuiTableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableFooter as MuiTableFooter,
    TableRow as MuiTableRow,
    TableSortLabel,
    Paper,
    Typography,
    type SxProps,
    type Theme,
} from "@mui/material";
import { TableVirtuoso } from "react-virtuoso";
import type { TableComponents } from "react-virtuoso";
import { LoadingProgress } from "@ehfuse/mui-fadeout-loading-progress";
import { CssSpinner } from "./CssSpinner";

import OverlayScrollbar from "@ehfuse/overlay-scrollbar";
import type { DataColumn, SortDirection, VirtualDataTableProps } from "./types";

// OverlayScrollbar 설정을 컴포넌트 외부에 상수로 선언 (재렌더링 시 동일한 참조 유지)
const OVERLAY_SCROLLBAR_TRACK_CONFIG = {
    alignment: "right" as const,
    margin: 0,
    radius: 0,
};
const ROW_CLICK_DRAG_THRESHOLD_PX = 5;

/**
 * 데이터 기반 무한 스크롤 및 가상화를 지원하는 테이블 컴포넌트
 */
function VirtualDataTableComponent<T>({
    data,
    loading = false,
    columns,
    onRowClick,
    getRowId,
    selectedRowId,
    selectedRowSx,
    rowHeight = 50,
    columnHeight = 56,
    striped,
    rowDivider = true,
    onSort,
    onLoadMore,
    sortBy,
    sortDirection,
    showPaper = true,
    paddingX = "1rem",
    paddingTop = 0,
    paddingBottom = 0,
    rowHoverColor,
    rowHoverOpacity,
    viewportBuffer,
    overscan,
    scrollbars,
    emptyMessage = "NO DATA",
    LoadingComponent,
    showFooter,
    footerHeight,
    footerSx,
}: VirtualDataTableProps<T>) {
    const defaultViewportBufferTop = Math.max(rowHeight * 12, 480);
    const defaultViewportBufferBottom = Math.max(rowHeight * 12, 480);
    const viewportBufferTop =
        typeof viewportBuffer === "number"
            ? viewportBuffer
            : (viewportBuffer?.top ?? defaultViewportBufferTop);
    const viewportBufferBottom =
        typeof viewportBuffer === "number"
            ? viewportBuffer
            : (viewportBuffer?.bottom ?? defaultViewportBufferBottom);
    const defaultOverscanMain = Math.max(rowHeight * 8, 420);
    const defaultOverscanReverse = Math.max(rowHeight * 10, 520);
    const virtuosoOverscan =
        typeof overscan === "number"
            ? overscan
            : {
                  main: overscan?.main ?? defaultOverscanMain,
                  reverse: overscan?.reverse ?? defaultOverscanReverse,
              };
    const estimatedItemHeight = rowHeight + (rowDivider ? 1 : 0);

    // 선택 행 하이라이트는 selectedRowSx 가 객체(또는 미지정)면 CSS 셀렉터로 처리한다.
    // 컨테이너 sx 에 `tr[data-row-id="..."]` 규칙을 넣으면 selectedRowId 변경 시 components/행을
    // 재렌더하지 않고(컨테이너 1개만 갱신) CSS 로만 강조돼 row 클릭 반응이 즉각적이다.
    // 함수형 selectedRowSx(행마다 동적)는 CSS 로 표현 불가하므로 기존 per-row 경로를 유지한다.
    const useCssRowHighlight = !selectedRowSx || typeof selectedRowSx !== "function";
    const selectedRowCssSx = useMemo<Record<string, unknown> | null>(() => {
        if (
            !useCssRowHighlight ||
            selectedRowId === null ||
            selectedRowId === undefined ||
            !selectedRowSx
        ) {
            return null;
        }
        const escaped = String(selectedRowId).replace(/["\\]/g, "\\$&");
        return {
            [`& tbody tr[data-row-id="${escaped}"]`]: selectedRowSx,
        };
    }, [useCssRowHighlight, selectedRowId, selectedRowSx]);

    const isDev =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1");

    const [perfDebugEnabled] = useState(() => {
        if (typeof window === "undefined") {
            return false;
        }
        return window.localStorage.getItem("vdt-perf-debug") === "1";
    });
    const perfStatsRef = useRef({
        wheelEvents: 0,
        wheelInputPx: 0,
        wheelHandlerMs: 0,
        wheelRafFlushes: 0,
        wheelRafMs: 0,
        rangeChangedCalls: 0,
        rangeChangedMs: 0,
        rowContentCalls: 0,
        rowContentMs: 0,
        rowContentMaxMs: 0,
        cellRenderCalls: 0,
        cellRenderMs: 0,
        cellRenderMaxMs: 0,
    });

    // 누적된 성능 통계를 콘솔에 주기적으로 출력한다.
    const flushPerfStats = useCallback(
        (reason: string) => {
            if (!perfDebugEnabled) {
                return;
            }
            const stats = perfStatsRef.current;
            const hasData =
                stats.wheelEvents > 0 ||
                stats.rangeChangedCalls > 0 ||
                stats.rowContentCalls > 0 ||
                stats.cellRenderCalls > 0;
            if (!hasData) {
                return;
            }

            const rowAvgMs =
                stats.rowContentCalls > 0
                    ? stats.rowContentMs / stats.rowContentCalls
                    : 0;
            const cellAvgMs =
                stats.cellRenderCalls > 0
                    ? stats.cellRenderMs / stats.cellRenderCalls
                    : 0;

            console.log("[VDT perf]", {
                reason,
                wheel: {
                    events: stats.wheelEvents,
                    inputPx: Math.round(stats.wheelInputPx),
                    handlerMs: Number(stats.wheelHandlerMs.toFixed(2)),
                    rafFlushes: stats.wheelRafFlushes,
                    rafMs: Number(stats.wheelRafMs.toFixed(2)),
                },
                rangeChanged: {
                    calls: stats.rangeChangedCalls,
                    totalMs: Number(stats.rangeChangedMs.toFixed(2)),
                },
                rowContent: {
                    calls: stats.rowContentCalls,
                    totalMs: Number(stats.rowContentMs.toFixed(2)),
                    avgMs: Number(rowAvgMs.toFixed(3)),
                    maxMs: Number(stats.rowContentMaxMs.toFixed(3)),
                },
                cellRender: {
                    calls: stats.cellRenderCalls,
                    totalMs: Number(stats.cellRenderMs.toFixed(2)),
                    avgMs: Number(cellAvgMs.toFixed(3)),
                    maxMs: Number(stats.cellRenderMaxMs.toFixed(3)),
                },
            });

            perfStatsRef.current = {
                wheelEvents: 0,
                wheelInputPx: 0,
                wheelHandlerMs: 0,
                wheelRafFlushes: 0,
                wheelRafMs: 0,
                rangeChangedCalls: 0,
                rangeChangedMs: 0,
                rowContentCalls: 0,
                rowContentMs: 0,
                rowContentMaxMs: 0,
                cellRenderCalls: 0,
                cellRenderMs: 0,
                cellRenderMaxMs: 0,
            };
        },
        [perfDebugEnabled],
    );

    useEffect(() => {
        if (!perfDebugEnabled || typeof window === "undefined") {
            return;
        }

        console.log("[VDT perf] enabled (localStorage vdt-perf-debug=1)");

        const intervalId = window.setInterval(() => {
            flushPerfStats("interval");
        }, 1500);

        return () => {
            window.clearInterval(intervalId);
            flushPerfStats("cleanup");
        };
    }, [flushPerfStats, perfDebugEnabled]);

    // 각 테이블 인스턴스별로 Scroller 컴포넌트 생성 (scrollbars, paddingX를 초기값으로 고정)
    const VirtuosoScroller = useMemo(
        () =>
            forwardRef<HTMLDivElement, any>((props, ref) => {
                const scrollContainerRef = useRef<HTMLElement | null>(null);
                const wheelDeltaRef = useRef(0);
                const wheelRafRef = useRef<number | null>(null);

                // 휠 이벤트를 직접 제어해 브라우저 smooth-scroll 보간 없이 즉시 scrollTop 반영
                useEffect(() => {
                    const el = scrollContainerRef.current;
                    if (!el) return;

                    // 휠 델타를 프레임 단위로 합산 반영해 과도한 scrollTop 갱신을 줄인다.
                    const handleWheel = (e: WheelEvent) => {
                        const wheelStart = perfDebugEnabled
                            ? performance.now()
                            : 0;
                        e.preventDefault();
                        let delta = e.deltaY;
                        // deltaMode 1 = 라인 단위, 2 = 페이지 단위 변환
                        if (e.deltaMode === 1) {
                            delta *= 40;
                        } else if (e.deltaMode === 2) {
                            delta *= el.clientHeight;
                        }

                        if (perfDebugEnabled) {
                            perfStatsRef.current.wheelEvents += 1;
                            perfStatsRef.current.wheelInputPx += delta;
                        }

                        wheelDeltaRef.current += delta;
                        if (wheelRafRef.current !== null) {
                            return;
                        }

                        wheelRafRef.current = requestAnimationFrame(() => {
                            const rafStart = perfDebugEnabled
                                ? performance.now()
                                : 0;
                            const maxStep = Math.max(
                                el.clientHeight * 0.4,
                                160,
                            );
                            const batchedDelta = Math.max(
                                -maxStep,
                                Math.min(maxStep, wheelDeltaRef.current),
                            );
                            wheelDeltaRef.current = 0;
                            wheelRafRef.current = null;
                            if (batchedDelta !== 0) {
                                el.scrollTop += batchedDelta;
                            }
                            if (perfDebugEnabled) {
                                perfStatsRef.current.wheelRafFlushes += 1;
                                perfStatsRef.current.wheelRafMs +=
                                    performance.now() - rafStart;
                            }
                        });

                        if (perfDebugEnabled) {
                            perfStatsRef.current.wheelHandlerMs +=
                                performance.now() - wheelStart;
                        }
                    };

                    el.addEventListener("wheel", handleWheel, {
                        passive: false,
                    });
                    return () => {
                        el.removeEventListener("wheel", handleWheel);
                        if (wheelRafRef.current !== null) {
                            cancelAnimationFrame(wheelRafRef.current);
                            wheelRafRef.current = null;
                        }
                        wheelDeltaRef.current = 0;
                    };
                }, []);

                return (
                    <OverlayScrollbar
                        detectInnerScroll={true}
                        track={OVERLAY_SCROLLBAR_TRACK_CONFIG}
                        {...scrollbars}
                    >
                        <TableContainer
                            component={Box}
                            {...props}
                            ref={(node) => {
                                scrollContainerRef.current =
                                    node as HTMLElement;
                                if (typeof ref === "function") {
                                    ref(node as HTMLDivElement);
                                } else if (ref) {
                                    ref.current = node as HTMLDivElement;
                                }
                            }}
                            sx={{
                                userSelect: "auto",
                                WebkitUserSelect: "auto",
                                position: "relative",
                                width: "100%",
                                height: "100%",
                                overflow: "auto",
                                display: "flex",
                                flexDirection: "column",
                                scrollbarWidth: "none",
                                msOverflowStyle: "none",
                                // 깜박임 방지를 위한 GPU 가속
                                transform: "translateZ(0)",
                                backfaceVisibility: "hidden",
                                willChange: "scroll-position",
                                "&::-webkit-scrollbar": {
                                    display: "none",
                                },
                                "& .MuiTable-root": {
                                    paddingRight: paddingX,
                                    paddingTop: paddingTop,
                                    paddingBottom: paddingBottom,
                                },
                            }}
                        />
                    </OverlayScrollbar>
                );
            }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [], // 빈 배열: 최초 마운트 시에만 생성, scrollbars, paddingX, paddingTop, paddingBottom은 클로저로 고정
    );

    // Striped row 배경색 계산
    const stripedRowColor = useMemo(() => {
        if (striped === true) {
            return "#f5f5f5"; // 기본 회색
        } else if (typeof striped === "string") {
            return striped; // 사용자 지정 색상
        }
        return undefined; // 배경색 없음
    }, [striped]);

    // 로딩 상태 관리 (원본 방식)
    const [internalLoading, setInternalLoading] = useState(loading);

    // 테이블 재마운트를 위한 키 (데이터가 비워지면 재마운트)
    const [tableKey, setTableKey] = useState(0);

    // 로딩 상태 변경 감지
    useEffect(() => {
        if (loading) {
            // 로딩이 시작되면 즉시 표시
            setInternalLoading(true);
        }
        // 로딩이 끝나도 internalLoading은 handleLoadingComplete에서만 false로 설정
        // LoadingProgress에서는 visible={false}로 페이드아웃을 시작함
    }, [loading]);

    // 로딩 완료 핸들러 - LoadingProgress의 페이드아웃이 완료된 후 호출됨
    const handleLoadingComplete = useCallback(() => {
        setInternalLoading(false);
    }, []);

    // 로딩 오버레이 표시 조건
    const shouldShowLoading = internalLoading;

    // 더보기 로딩 여부 (데이터가 있고 로딩 중이면 더보기 로딩)
    const isLoadMoreLoading = loading && data.length > 0;

    // 무한 스크롤 로딩 상태 (기존 VirtualDataTable 방식)
    const isLoadingMoreRef = useRef(false);
    const virtuosoRef = useRef<any>(null); // TableVirtuoso ref

    // 소비처가 인라인으로 넘기는 콜백(onRowClick/getRowId)은 매 렌더마다 identity 가 바뀐다.
    // 이를 ref 로 잡아 두면 VirtuosoTableComponents(memo)를 재생성하지 않아도 최신 콜백을 쓸 수 있어,
    // 검색/필터로 부모가 리렌더돼도 행(및 이미지)이 리마운트되지 않는다(사진 깜빡임 방지).
    const onRowClickRef = useRef(onRowClick);
    onRowClickRef.current = onRowClick;
    const getRowIdRef = useRef(getRowId);
    getRowIdRef.current = getRowId;
    // truthiness 가 바뀌면(클릭 가능 여부) hover/cursor 스타일이 달라지므로 deps 에는 boolean 만 넣는다.
    const hasRowClick = !!onRowClick;

    // 스크롤 컨테이너 참조 (OverlayScrollbar용)
    const isScrollDraggingRef = useRef(false); // OverlayScrollbar 드래그 스크롤 감지용
    const mouseDownPositionRef = useRef({ x: 0, y: 0 }); // 마우스 다운 시작 위치

    useEffect(() => {
        const handleDocumentMouseMove = (event: MouseEvent) => {
            const dx = event.clientX - mouseDownPositionRef.current.x;
            const dy = event.clientY - mouseDownPositionRef.current.y;
            if (Math.sqrt(dx * dx + dy * dy) > ROW_CLICK_DRAG_THRESHOLD_PX) {
                isScrollDraggingRef.current = true;
            }
        };

        document.addEventListener("mousemove", handleDocumentMouseMove);
        return () => {
            document.removeEventListener("mousemove", handleDocumentMouseMove);
        };
    }, []);

    // 정렬이 변경될 때 모든 TableSortLabel의 hover 상태 초기화
    useEffect(() => {
        // sortBy가 변경되면 모든 TableSortLabel 요소의 hover 상태를 강제로 초기화
        const tableContainer = document.querySelector(
            '[data-testid="virtuoso-scroller"]',
        );
        if (tableContainer) {
            const sortLabels = tableContainer.querySelectorAll(
                ".MuiTableSortLabel-root",
            );
            sortLabels.forEach((label) => {
                // 마우스 이벤트를 시뮬레이션하여 hover 상태 해제
                const mouseLeaveEvent = new MouseEvent("mouseleave", {
                    bubbles: true,
                    cancelable: true,
                });
                label.dispatchEvent(mouseLeaveEvent);
            });
        }
    }, [sortBy]);

    // 정렬 핸들러
    const handleSort = useCallback(
        (columnId: string) => {
            if (!onSort) return;

            const newDirection: SortDirection =
                sortBy === columnId && sortDirection === "asc" ? "desc" : "asc";

            onSort(columnId, newDirection);
        },
        [onSort, sortBy, sortDirection],
    );

    // 스크롤 끝 근처에서만 추가 로드를 실행해 scroll 핫패스 부담을 줄인다.
    const handleEndReached = useCallback(
        (endIndex: number) => {
            const rangeStart = perfDebugEnabled ? performance.now() : 0;
            if (!onLoadMore) {
                if (perfDebugEnabled) {
                    perfStatsRef.current.rangeChangedCalls += 1;
                    perfStatsRef.current.rangeChangedMs +=
                        performance.now() - rangeStart;
                }
                return;
            }

            if (loading && data.length === 0) {
                if (perfDebugEnabled) {
                    perfStatsRef.current.rangeChangedCalls += 1;
                    perfStatsRef.current.rangeChangedMs +=
                        performance.now() - rangeStart;
                }
                return;
            }

            const hasMinimumData = data.length >= 30;
            const nearEnd = endIndex >= data.length - 1;

            if (nearEnd && hasMinimumData && !isLoadingMoreRef.current) {
                isLoadingMoreRef.current = true;
                const offset = data.length;
                const limit = 50;
                onLoadMore(offset, limit);
            }

            if (perfDebugEnabled) {
                perfStatsRef.current.rangeChangedCalls += 1;
                perfStatsRef.current.rangeChangedMs +=
                    performance.now() - rangeStart;
            }
        },
        [data.length, loading, onLoadMore, perfDebugEnabled],
    );

    // 로딩 상태가 변경되면 isLoadingMoreRef 업데이트 (기존 VirtualDataTable 방식)
    useEffect(() => {
        if (!loading) {
            isLoadingMoreRef.current = false;
        }
    }, [loading]);

    // 데이터가 비워지면 테이블을 재마운트하여 스크롤을 맨 위로 이동
    useEffect(() => {
        if (data.length === 0) {
            setTableKey((prev) => prev + 1);
        }
    }, [data.length]);

    // 이전 데이터 길이를 추적
    const prevDataLengthRef = useRef(data.length);

    // 데이터가 변경되면(정렬, 필터 등) 스크롤을 맨 위로 이동
    // 단, 무한 스크롤로 데이터가 추가될 때(길이만 증가)는 스크롤 위치 유지
    useEffect(() => {
        const prevLength = prevDataLengthRef.current;
        const currentLength = data.length;

        // 데이터 길이가 증가한 경우 (무한 스크롤) - 스크롤 위치 유지
        if (currentLength > prevLength && prevLength > 0) {
            prevDataLengthRef.current = currentLength;
            return;
        }

        // 데이터가 교체된 경우 (정렬, 필터 등) - 스크롤을 맨 위로
        if (
            virtuosoRef.current &&
            currentLength > 0 &&
            currentLength <= prevLength
        ) {
            virtuosoRef.current.scrollToIndex({
                index: 0,
                align: "start",
                behavior: "auto",
            });
        }

        prevDataLengthRef.current = currentLength;
    }, [data]);

    /**
     * 테이블 고정 헤더 컨텐츠 정의 (기존 VirtualDataTable 스타일)
     * 정렬 기능이 포함된 컬럼 헤더를 렌더링
     */
    const fixedHeaderContent = useCallback(() => {
        // 1. 그룹 정보 추출
        const groupMap: { [group: string]: DataColumn<T>[] } = {};
        const noGroupColumns: DataColumn<T>[] = [];

        columns.forEach((col) => {
            if (col.group) {
                if (!groupMap[col.group]) {
                    groupMap[col.group] = [];
                }
                groupMap[col.group].push(col);
            } else {
                noGroupColumns.push(col);
            }
        });

        // 그룹이 있는 경우 2줄 헤더, 없는 경우 1줄 헤더
        const hasGroups = Object.keys(groupMap).length > 0;

        if (!hasGroups) {
            // 단일 행 헤더
            return (
                <MuiTableRow>
                    {columns.map((col) => (
                        <TableCell
                            key={String(col.id)}
                            align={col.align || "left"}
                            style={{
                                width: col.width,
                                minWidth: col.width,
                                ...col.style,
                                fontWeight: "bold",
                                position: "sticky",
                                top: 0,
                                zIndex: 2,
                                padding: "16px",
                            }}
                        >
                            {col.sortable ? (
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent:
                                            col.align === "center"
                                                ? "center"
                                                : col.align === "right"
                                                  ? "flex-end"
                                                  : "flex-start",
                                        position: "relative",
                                        width: "100%",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            position: "relative",
                                            cursor: "default",
                                            "&:hover .MuiTableSortLabel-root": {
                                                opacity: "1 !important",
                                                "& .MuiSvgIcon-root": {
                                                    color: "#000",
                                                    opacity: "1 !important",
                                                },
                                            },
                                        }}
                                        onClick={() =>
                                            handleSort(String(col.id))
                                        }
                                    >
                                        {col.text}
                                        <TableSortLabel
                                            active={sortBy === col.id}
                                            direction={
                                                sortBy === col.id
                                                    ? sortDirection
                                                    : "desc"
                                            }
                                            sx={{
                                                position: "absolute",
                                                left: "100%",
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                marginLeft: "4px",
                                                minWidth: "auto",
                                                width: "16px",
                                                height: "16px",
                                                cursor: "default",
                                                opacity:
                                                    sortBy === col.id ? 1 : 0,
                                                transition: "opacity 0.2s ease",
                                                "& .MuiTableSortLabel-icon": {
                                                    position: "relative",
                                                    marginLeft: 0,
                                                    marginRight: 0,
                                                    opacity: 1,
                                                    transition:
                                                        "color 0.2s ease",
                                                },
                                                "& .MuiTableSortLabel-iconDirectionAsc":
                                                    {
                                                        transform:
                                                            "rotate(180deg)",
                                                    },
                                                "& .MuiTableSortLabel-iconDirectionDesc":
                                                    {
                                                        transform:
                                                            "rotate(0deg)",
                                                    },
                                            }}
                                        />
                                    </Box>
                                </div>
                            ) : (
                                col.text
                            )}
                        </TableCell>
                    ))}
                </MuiTableRow>
            );
        }

        // 2줄 헤더 (그룹이 있는 경우)
        const firstRowCells = [
            ...noGroupColumns.map((col) => (
                <TableCell
                    key={String(col.id)}
                    rowSpan={2}
                    align={col.align || "left"}
                    style={{
                        width: col.width,
                        minWidth: col.width,
                        ...col.style,
                        fontWeight: "bold",
                        position: "sticky",
                        top: 0,
                        zIndex: 2,
                        padding: "16px",
                    }}
                >
                    {col.sortable && onSort ? (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent:
                                    col.align === "center"
                                        ? "center"
                                        : col.align === "right"
                                          ? "flex-end"
                                          : "flex-start",
                                position: "relative",
                                width: "100%",
                            }}
                        >
                            <Box
                                sx={{
                                    position: "relative",
                                    cursor: "default",
                                    "&:hover .MuiTableSortLabel-root": {
                                        opacity: "1 !important",
                                        "& .MuiSvgIcon-root": {
                                            color: "#000",
                                            opacity: "1 !important",
                                        },
                                    },
                                }}
                                onClick={() => handleSort(String(col.id))}
                            >
                                {col.text}
                                <TableSortLabel
                                    active={sortBy === col.id}
                                    direction={
                                        sortBy === col.id
                                            ? sortDirection
                                            : "desc"
                                    }
                                    sx={{
                                        position: "absolute",
                                        left: "100%",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        marginLeft: "4px",
                                        minWidth: "auto",
                                        width: "16px",
                                        height: "16px",
                                        cursor: "default",
                                        opacity: sortBy === col.id ? 1 : 0,
                                        transition: "opacity 0.2s ease",
                                        "&:hover": {
                                            opacity: "1 !important",
                                            "& .MuiSvgIcon-root": {
                                                color: "#000",
                                                opacity: "1 !important",
                                            },
                                        },
                                        "& .MuiTableSortLabel-icon": {
                                            position: "relative",
                                            marginLeft: 0,
                                            marginRight: 0,
                                            opacity: 1,
                                            transition: "color 0.2s ease",
                                        },
                                        "& .MuiTableSortLabel-iconDirectionAsc":
                                            {
                                                transform: "rotate(180deg)",
                                            },
                                        "& .MuiTableSortLabel-iconDirectionDesc":
                                            {
                                                transform: "rotate(0deg)",
                                            },
                                    }}
                                />
                            </Box>
                        </div>
                    ) : (
                        col.text
                    )}
                </TableCell>
            )),
            ...Object.entries(groupMap).map(([group, cols]) => (
                <TableCell
                    key={group}
                    align="center"
                    colSpan={cols.length}
                    style={{
                        fontWeight: "bold",
                        position: "sticky",
                        top: 0,
                        zIndex: 2,
                        padding: "16px",
                    }}
                >
                    {group}
                </TableCell>
            )),
        ];

        const secondRowCells = [
            ...Object.values(groupMap)
                .flat()
                .map((col) => (
                    <TableCell
                        key={String(col.id)}
                        align={col.align || "left"}
                        style={{
                            width: col.width,
                            minWidth: col.width,
                            ...col.style,
                            fontWeight: "bold",
                            position: "sticky",
                            top: 0,
                            zIndex: 2,
                            padding: "16px",
                        }}
                    >
                        {col.sortable && onSort ? (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent:
                                        col.align === "center"
                                            ? "center"
                                            : col.align === "right"
                                              ? "flex-end"
                                              : "flex-start",
                                    position: "relative",
                                    width: "100%",
                                }}
                            >
                                <Box
                                    sx={{
                                        position: "relative",
                                        cursor: "default",
                                        "&:hover .MuiTableSortLabel-root": {
                                            opacity: "1 !important",
                                            "& .MuiSvgIcon-root": {
                                                color: "#000",
                                                opacity: "1 !important",
                                            },
                                        },
                                    }}
                                    onClick={() => handleSort(String(col.id))}
                                >
                                    {col.text}
                                    <TableSortLabel
                                        active={sortBy === col.id}
                                        direction={
                                            sortBy === col.id
                                                ? sortDirection
                                                : "desc"
                                        }
                                        sx={{
                                            position: "absolute",
                                            left: "100%",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            marginLeft: "4px",
                                            minWidth: "auto",
                                            width: "16px",
                                            height: "16px",
                                            cursor: "default",
                                            opacity: sortBy === col.id ? 1 : 0,
                                            transition: "opacity 0.2s ease",
                                            "&:hover": {
                                                opacity: "1 !important",
                                                "& .MuiSvgIcon-root": {
                                                    color: "#000",
                                                    opacity: "1 !important",
                                                },
                                            },
                                            "& .MuiTableSortLabel-icon": {
                                                position: "relative",
                                                marginLeft: 0,
                                                marginRight: 0,
                                                opacity: 1,
                                                transition: "color 0.2s ease",
                                            },
                                            "& .MuiTableSortLabel-iconDirectionAsc":
                                                {
                                                    transform: "rotate(0deg)",
                                                },
                                            "& .MuiTableSortLabel-iconDirectionDesc":
                                                {
                                                    transform: "rotate(180deg)",
                                                },
                                        }}
                                    />
                                </Box>
                            </div>
                        ) : (
                            col.text
                        )}
                    </TableCell>
                )),
        ];

        return (
            <>
                <MuiTableRow>{firstRowCells}</MuiTableRow>
                <MuiTableRow>{secondRowCells}</MuiTableRow>
            </>
        );
    }, [columns, sortBy, sortDirection, handleSort, onSort, columnHeight]);

    /**
     * 테이블 행 컨텐츠 렌더링 함수 (기존 VirtualDataTable 스타일)
     * 각 데이터 항목에 대한 셀 내용을 정의
     */
    const rowContent = useCallback(
        (index: number, item: T) => {
            const rowStart = perfDebugEnabled ? performance.now() : 0;
            // console.log("rowContent 렌더링:", { index, item: item ? "있음" : "없음" });

            if (!item) {
                if (perfDebugEnabled) {
                    perfStatsRef.current.rowContentCalls += 1;
                    const rowDuration = performance.now() - rowStart;
                    perfStatsRef.current.rowContentMs += rowDuration;
                    perfStatsRef.current.rowContentMaxMs = Math.max(
                        perfStatsRef.current.rowContentMaxMs,
                        rowDuration,
                    );
                }
                return null;
            }

            const cells = columns.map((column) => {
                const cellStart = perfDebugEnabled ? performance.now() : 0;
                const cellValue = column.render
                    ? column.render(item, index)
                    : String((item as any)[column.id] || "");

                if (perfDebugEnabled) {
                    const cellDuration = performance.now() - cellStart;
                    perfStatsRef.current.cellRenderCalls += 1;
                    perfStatsRef.current.cellRenderMs += cellDuration;
                    perfStatsRef.current.cellRenderMaxMs = Math.max(
                        perfStatsRef.current.cellRenderMaxMs,
                        cellDuration,
                    );
                }

                return (
                    <TableCell
                        key={String(column.id)}
                        align={column.align || "left"}
                        style={{
                            width: column.width,
                            minWidth: column.width,
                            ...column.style,
                            padding: "8px 16px",
                        }}
                    >
                        {cellValue}
                    </TableCell>
                );
            });

            if (perfDebugEnabled) {
                perfStatsRef.current.rowContentCalls += 1;
                const rowDuration = performance.now() - rowStart;
                perfStatsRef.current.rowContentMs += rowDuration;
                perfStatsRef.current.rowContentMaxMs = Math.max(
                    perfStatsRef.current.rowContentMaxMs,
                    rowDuration,
                );
            }

            return <>{cells}</>;
        },
        [columns, perfDebugEnabled],
    );

    // 컬럼에 footer 렌더러가 하나라도 있거나 showFooter 가 명시되면 하단 합계 행을 표시한다.
    const hasFooter =
        showFooter ?? columns.some((col) => typeof col.footer === "function");

    /**
     * 테이블 하단 고정 합계 행(tfoot) 컨텐츠 정의
     * 각 컬럼의 footer(data) 결과를 셀로 렌더링한다. (footer 없는 컬럼은 빈 셀)
     * tableLayout: fixed 라 헤더/바디와 동일한 컬럼 너비로 자동 정렬된다.
     */
    const fixedFooterContent = useCallback(() => {
        if (!hasFooter) {
            return null;
        }

        // footerColSpan 으로 셀을 병합한다. 앞 컬럼이 colSpan 으로 덮은 컬럼은 셀을 생략한다.
        const cells: React.ReactNode[] = [];
        for (let i = 0; i < columns.length; i += 1) {
            const col = columns[i];
            const colSpan =
                col.footerColSpan && col.footerColSpan > 1
                    ? Math.min(col.footerColSpan, columns.length - i)
                    : 1;

            cells.push(
                <TableCell
                    key={String(col.id)}
                    align={col.align || "left"}
                    colSpan={colSpan > 1 ? colSpan : undefined}
                    style={{
                        // 병합 시 너비 고정을 풀어 colSpan 이 실제로 늘어나게 한다.
                        ...(colSpan > 1
                            ? {}
                            : { width: col.width, minWidth: col.width }),
                        ...col.style,
                        fontWeight: "bold",
                        padding: "16px",
                    }}
                >
                    {col.footer ? col.footer(data) : null}
                </TableCell>,
            );

            // colSpan 으로 덮인 뒤 컬럼은 건너뛴다.
            i += colSpan - 1;
        }

        return <MuiTableRow>{cells}</MuiTableRow>;
    }, [hasFooter, columns, data]);

    // 테이블 컴포넌트 정의 (기존 VirtualDataTable 스타일)
    const VirtuosoTableComponents: TableComponents<T> = useMemo(
        () => ({
            // 스크롤 컨테이너 (외부에서 한 번만 생성된 안정적인 컴포넌트 사용)
            Scroller: VirtuosoScroller,
            // 테이블 컴포넌트
            Table: (props) => (
                <Table
                    {...props}
                    sx={{
                        borderCollapse: "separate",
                        tableLayout: "fixed",
                        marginRight: "16px",
                        // 하단 합계 행이 있으면 데이터가 적어도 테이블이 컨테이너를 채우게 한다.
                        // (실제 바닥 정렬은 tbody 가 늘어나며 처리 — 행 높이는 그대로 유지)
                        ...(hasFooter ? { height: "100%" } : {}),
                    }}
                />
            ),
            // 테이블 헤더 (고정 위치)
            TableHead: forwardRef<HTMLTableSectionElement, any>(
                (props, ref) => (
                    <TableHead
                        {...props}
                        ref={ref}
                        sx={{
                            userSelect: "none",
                            "& tr": {
                                height: columnHeight,
                                "& th": {
                                    padding: "16px",
                                    position: "sticky",
                                    top: 0,
                                    zIndex: 2,
                                    fontWeight: "bold",
                                },
                            },
                        }}
                    />
                ),
            ),
            // 테이블 행 (클릭 이벤트 및 호버 효과 포함)
            // 테이블 행 (클릭 이벤트 및 호버 효과 포함)
            TableRow: (props: any) => {
                const {
                    item,
                    selected: _selected,
                    "aria-selected": _ariaSelected,
                    className,
                    ...rest
                } = props as any;
                // react-virtuoso는 'data-index' 속성으로 index를 전달합니다
                const rowIndex = rest["data-index"] ?? 0;
                const isOddRow = rowIndex % 2 === 1;
                const rowId =
                    item && getRowIdRef.current
                        ? getRowIdRef.current(item, rowIndex)
                        : rowIndex;
                // CSS 하이라이트 모드에서는 행 자체에서 선택을 계산하지 않는다(컨테이너 CSS 가 처리).
                // → selectedRowId 변경이 행 재렌더로 이어지지 않는다.
                const isSelected =
                    !useCssRowHighlight &&
                    selectedRowId !== null &&
                    selectedRowId !== undefined &&
                    rowId === selectedRowId;
                const resolvedSelectedRowSx =
                    isSelected && selectedRowSx
                        ? typeof selectedRowSx === "function"
                            ? selectedRowSx(item, rowIndex)
                            : selectedRowSx
                        : undefined;
                const sanitizedClassName = String(className ?? "")
                    .split(/\s+/)
                    .filter(
                        (token) =>
                            token !== "Mui-selected" &&
                            token !== "Mui-focusVisible",
                    )
                    .join(" ");

                return (
                    <MuiTableRow
                        {...rest}
                        data-row-id={rowId !== null && rowId !== undefined ? String(rowId) : undefined}
                        className={sanitizedClassName || undefined}
                        selected={isSelected}
                        onMouseDown={(e: any) => {
                            // 마우스 다운 시 드래그 플래그 초기화 및 시작 위치 저장
                            isScrollDraggingRef.current = false;
                            mouseDownPositionRef.current = {
                                x: e.clientX,
                                y: e.clientY,
                            };
                        }}
                        onClick={(e: React.MouseEvent) => {
                            // mousedown 시작 위치와 click 위치 차이로 드래그 여부 판별
                            const dx =
                                e.clientX - mouseDownPositionRef.current.x;
                            const dy =
                                e.clientY - mouseDownPositionRef.current.y;
                            const wasDrag =
                                Math.sqrt(dx * dx + dy * dy) >
                                    ROW_CLICK_DRAG_THRESHOLD_PX ||
                                isScrollDraggingRef.current;
                            if (wasDrag) {
                                e.preventDefault();
                                e.stopPropagation();
                                isScrollDraggingRef.current = false;
                                return;
                            }
                            if (item && onRowClickRef.current) {
                                onRowClickRef.current(item, rowIndex);
                            }
                            isScrollDraggingRef.current = false;
                        }}
                        sx={[
                            {
                                userSelect: "none",
                                height: rowHeight,
                                backgroundColor:
                                    isOddRow && stripedRowColor
                                        ? stripedRowColor
                                        : "transparent",
                                "& td": {
                                    padding: "8px 16px",
                                    borderBottom: rowDivider
                                        ? "1px solid rgba(224, 224, 224, 1)"
                                        : "none",
                                },
                                "& th": {
                                    padding: "8px 16px",
                                    borderBottom: "none",
                                },
                                "&:hover":
                                    hasRowClick && !isSelected
                                        ? {
                                              backgroundColor: (theme) => {
                                                  const isDark =
                                                      theme.palette.mode ===
                                                      "dark";
                                                  const defaultColor =
                                                      "#000000";
                                                  const color =
                                                      rowHoverColor ??
                                                      defaultColor;
                                                  const opacity =
                                                      rowHoverOpacity ?? 0.06;

                                                  if (!rowHoverColor) {
                                                      return isDark
                                                          ? `rgba(255, 255, 255, ${opacity})`
                                                          : `rgba(0, 0, 0, ${opacity})`;
                                                  }

                                                  const hex = color
                                                      .replace("#", "")
                                                      .trim();
                                                  if (hex.length !== 6) {
                                                      return color;
                                                  }

                                                  const r = parseInt(
                                                      hex.substring(0, 2),
                                                      16,
                                                  );
                                                  const g = parseInt(
                                                      hex.substring(2, 4),
                                                      16,
                                                  );
                                                  const b = parseInt(
                                                      hex.substring(4, 6),
                                                      16,
                                                  );

                                                  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
                                              },
                                          }
                                        : undefined,
                                cursor: hasRowClick ? "pointer" : undefined,
                            },
                            resolvedSelectedRowSx,
                        ]}
                    />
                );
            },
            // 테이블 바디 — 하단 합계 행이 있으면 row-group 을 늘려 빈 공간이 마지막 행 '아래'로 가게 한다.
            // (개별 행 높이는 그대로 유지되고, tfoot 은 그 아래 바닥에 붙는다)
            TableBody: forwardRef<HTMLTableSectionElement>((props, ref) => {
                const { children, ...rest } =
                    props as React.HTMLAttributes<HTMLTableSectionElement>;
                return (
                    <MuiTableBody
                        {...rest}
                        ref={ref}
                        sx={hasFooter ? { height: "100%" } : undefined}
                    >
                        {children}
                        {/* fill 모드(hasFooter)에서 table/tbody 의 height:100% 때문에 남는 높이가
                            데이터 <tr> 에 분배되어 행이 rowHeight 보다 커지는 문제를 막는 spacer.
                            유연한 빈 행이 남는 공간을 흡수 → 데이터 행은 rowHeight 로 고정되고,
                            sticky footer 는 그 아래 바닥에 붙는다. 스크롤이 생기면 0 으로 접힌다. */}
                        {hasFooter && (
                            <tr aria-hidden style={{ height: "100%" }}>
                                <td
                                    colSpan={columns.length}
                                    style={{ padding: 0, border: 0 }}
                                />
                            </tr>
                        )}
                    </MuiTableBody>
                );
            }),
            // 테이블 하단 합계 행(tfoot) — 바닥에 고정
            TableFoot: forwardRef<HTMLTableSectionElement, any>(
                (props, ref) => (
                    <MuiTableFooter
                        {...props}
                        ref={ref}
                        sx={[
                            {
                                position: "sticky",
                                bottom: 0,
                                zIndex: 2,
                                backgroundColor: (theme) =>
                                    theme.palette.mode === "dark"
                                        ? "#1e1e1e"
                                        : "#ffffff",
                                "& tr": {
                                    height: footerHeight ?? rowHeight,
                                },
                                "& td": {
                                    padding: "16px",
                                    color: "inherit",
                                    fontSize: "0.875rem",
                                    borderTop: "1px solid #000000",
                                    borderBottom: "none",
                                },
                            },
                            ...(Array.isArray(footerSx)
                                ? footerSx
                                : footerSx
                                  ? [footerSx]
                                  : []),
                        ]}
                    />
                ),
            ),
        }),
        [
            // onRowClick/getRowId 는 ref 로 처리하므로 deps 에서 제외(인라인 콜백이어도 행 리마운트 안 됨).
            hasRowClick,
            // CSS 하이라이트 모드에서는 selectedRowId 가 components 를 재생성하지 않게 한다(행 재렌더 방지).
            // 함수형 selectedRowSx(per-row) 일 때만 selectedRowId 변경으로 components 를 갱신한다.
            useCssRowHighlight ? null : selectedRowId,
            selectedRowSx,
            rowHeight,
            stripedRowColor,
            rowDivider,
            columnHeight,
            rowHoverColor,
            rowHoverOpacity,
            VirtuosoScroller,
            footerHeight,
            footerSx,
            hasFooter,
            // spacer 행의 colSpan 계산에 사용 (컬럼 구조 변경 시 components 재생성)
            columns,
        ],
    );

    const resolvedVirtuosoComponents = VirtuosoTableComponents;

    // 공통 테이블 내용
    const tableContent = (
        <Box
            sx={
                {
                    position: "relative",
                    height: "100%",
                    width: "100%",
                    "& .MuiTableHead-root": {
                        backgroundColor: (theme: Theme) =>
                            theme.palette.mode === "dark"
                                ? "#1e1e1e !important"
                                : "#ffffff !important",
                    },
                    // 선택 행 CSS 하이라이트 (selectedRowId 변경 시 이 컨테이너만 갱신, 행 재렌더 없음).
                    ...(selectedRowCssSx ?? {}),
                } as SxProps<Theme>
            }
        >
            {/* 테이블 */}
            <TableVirtuoso
                key={tableKey}
                ref={virtuosoRef}
                data={data}
                totalCount={onLoadMore ? data.length + 1 : data.length}
                defaultItemHeight={estimatedItemHeight}
                fixedItemHeight={estimatedItemHeight}
                fixedHeaderContent={fixedHeaderContent}
                fixedFooterContent={hasFooter ? fixedFooterContent : undefined}
                itemContent={rowContent}
                endReached={handleEndReached}
                style={{ height: "100%" }}
                increaseViewportBy={{
                    top: viewportBufferTop,
                    bottom: viewportBufferBottom,
                }}
                overscan={virtuosoOverscan}
                followOutput={false}
                components={resolvedVirtuosoComponents}
            />

            {/* 빈 데이터 표시 */}
            {data.length === 0 && !loading && (
                <Box
                    sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 2,
                    }}
                >
                    {typeof emptyMessage === "string" ? (
                        <>
                            <Box
                                sx={{
                                    width: 48,
                                    height: 48,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderRadius: "50%",
                                    backgroundColor: "#f5f5f5",
                                    color: "#999",
                                }}
                            >
                                📄
                            </Box>
                            <Typography
                                variant="body1"
                                sx={{ color: "text.secondary" }}
                            >
                                {emptyMessage}
                            </Typography>
                        </>
                    ) : (
                        emptyMessage
                    )}
                </Box>
            )}

            {/* 로딩 스피너 */}
            {shouldShowLoading && (
                <>
                    {LoadingComponent ? (
                        <LoadingComponent
                            visible={loading}
                            onComplete={handleLoadingComplete}
                        />
                    ) : (
                        <LoadingProgress
                            visible={loading}
                            onComplete={handleLoadingComplete}
                            size={40}
                            indicator={<CssSpinner />}
                            sx={{
                                top: `${
                                    columns.some((col) => col.group)
                                        ? columnHeight * 2
                                        : columnHeight
                                }px`,
                                // 푸터(합계 행)가 있으면 그 높이만큼 아래를 잘라, 헤더~푸터 사이 내용 영역 중앙에 스피너를 둔다.
                                bottom: `${hasFooter ? footerHeight ?? rowHeight : 0}px`,
                            }}
                            background={{
                                show: data.length === 0, // 최초 로딩에만 배경 표시
                                opacity: 0.8,
                            }}
                        />
                    )}
                </>
            )}
        </Box>
    );

    return showPaper ? (
        <Paper
            className="grow"
            elevation={1}
            sx={{
                padding: 0,
                paddingLeft: paddingX,
                height: "100%",
                minHeight: 0,
                flex: 1,
                display: "flex",
                flexDirection: "column",
            }}
        >
            {tableContent}
        </Paper>
    ) : (
        <Box
            className="grow"
            style={{
                padding: 0,
                paddingLeft: paddingX,
                height: "100%",
                minHeight: 0,
                flex: 1,
                display: "flex",
                flexDirection: "column",
            }}
        >
            {tableContent}
        </Box>
    );
}

export const VirtualDataTable = memo(VirtualDataTableComponent) as <T>(
    props: VirtualDataTableProps<T>,
) => React.JSX.Element;
