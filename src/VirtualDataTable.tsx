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
    useTheme,
    useMediaQuery,
    type SxProps,
    type Theme,
} from "@mui/material";
import { TableVirtuoso } from "react-virtuoso";
import type { TableComponents } from "react-virtuoso";
import { LoadingProgress } from "@ehfuse/mui-fadeout-loading-progress";
import { CssSpinner } from "./CssSpinner";
import { HeaderMenu, HeaderFilterIcon } from "./HeaderMenu";

import OverlayScrollbar from "@ehfuse/overlay-scrollbar";
import type { DataColumn, SortDirection, VirtualDataTableProps } from "./types";

// OverlayScrollbar 설정을 컴포넌트 외부에 상수로 선언 (재렌더링 시 동일한 참조 유지)
const OVERLAY_SCROLLBAR_TRACK_CONFIG = {
    alignment: "default" as const, // 옛 값 "right" 는 1.7 타입에서 사라졌다 — 동작은 같다("outside" 가 아니면 안쪽 정렬)
    margin: 0,
    radius: 0,
};
const ROW_CLICK_DRAG_THRESHOLD_PX = 5;

/**
 * 데이터 기반 무한 스크롤 및 가상화를 지원하는 테이블 컴포넌트
 */
/**
 * 노션풍(variant="notion") 색 — @ehfuse/taskbox 의 목록표 팔레트(light: border/borderStrong/textSecondary/surfaceHover,
 * dark: 같은 이름의 다크 값)를 그대로 옮긴 것이다. 두 패키지가 서로를 참조하지 않아 값을 베껴 둔다 — 그쪽이 바뀌면 여기도 맞춘다.
 */
const NOTION_LIGHT = {
    bg: "#ffffff",
    border: "#e6e6e3",
    borderStrong: "#dedddb",
    headerColor: "#787774",
    hoverBg: "#f8f8f7",
    emptyColor: "#9b9a97",
    selectedBg: "#dbeafe",
    selectedBar: "#3b82f6",
};
/** 노션풍 종이 위아래 여백 — 좌우 기본(12px)과 같다. */
const NOTION_PADDING_Y = "12px";
const NOTION_DARK = {
    bg: "#1e1e1e",
    border: "#2c333c",
    borderStrong: "#3b434e",
    headerColor: "#a3adbb",
    hoverBg: "#272d36",
    emptyColor: "#7d8590",
    selectedBg: "rgba(59, 130, 246, 0.22)",
    selectedBar: "#60a5fa",
};

/** 바깥 스크롤일 때의 스크롤 상자 자리 — 굴리지 않는 평범한 상자(1.7.0) */
const PlainScroller = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => <div {...props} ref={ref} />);
PlainScroller.displayName = "VdtPlainScroller";

/** 폰 목록으로 바꾸는 기본 폭 — MUI sm(600) 미만 */
const DEFAULT_MOBILE_QUERY = "(max-width:599.95px)";

/** 이 열이 머리 메뉴에 거르기 목록을 갖는지 — 값 목록과 바뀜 알림이 둘 다 있어야 한다. */
function hasColumnFilter<T>(col: DataColumn<T>): boolean {
    return Boolean(col.filterOptions && col.onFilterChange);
}

function VirtualDataTableComponent<T>({
    data,
    loading = false,
    columns,
    onRowClick,
    getRowId,
    selectedRowId,
    selectedRowSx: selectedRowSxProp,
    rowHeight: rowHeightProp,
    columnHeight: columnHeightProp,
    striped,
    rowDivider = true,
    onSort,
    onSortClear,
    onHeaderContextMenu,
    onLoadMore,
    sortBy,
    sortDirection,
    showPaper = true,
    paddingX: paddingXProp,
    paddingTop = 0,
    paddingBottom = 0,
    rowHoverColor: rowHoverColorProp,
    rowHoverOpacity: rowHoverOpacityProp,
    viewportBuffer,
    overscan,
    scrollbars,
    emptyMessage = "NO DATA",
    autoHeight = false,
    LoadingComponent,
    showFooter,
    footerHeight,
    footerSx,
    variant = "default",
    framed = true,
    headerTopBorder = false,
    rowHeightMode = "fixed",
    tableLayout = "fixed",
    renderFullWidthRow,
    fullWidthRowSx,
    onRowContextMenu,
    pinnedRows,
    pinnedRowsMaxHeight,
    pinnedRowsSx,
    resetScrollOnDataChange = true,
    rowKeyFromId = false,
    onEndReached,
    colorMode,
    mobile,
    scrollParent,
}: VirtualDataTableProps<T>) {
    // 노션풍(variant="notion") — @ehfuse/taskbox 목록표와 같은 값이다. 기본값만 바꾸고 직접 준 prop 이 이긴다.
    const notion = variant === "notion";
    const muiTheme = useTheme();
    // colorMode 를 주면 앱 테마와 달리 이 표만 그 모드로 칠한다(앱은 밝은데 업무함만 어두운 경우).
    const notionTokens = (colorMode ?? muiTheme.palette.mode) === "dark" ? NOTION_DARK : NOTION_LIGHT;
    const hasPinnedRows = (pinnedRows?.length ?? 0) > 0;
    const columnHeight = columnHeightProp ?? (notion ? 40 : 56);
    // 노션풍 줄 높이 기본 48 — 업무함 목록 표 · 전자결재 표가 쓰는 값이다.
    const rowHeight = rowHeightProp ?? (notion ? 48 : 50);
    // 틀 없이(framed=false) 그릴 때는 바깥 상자가 이미 테두리를 둘렀다 — 좌우 여백 없이 표가 상자에 꽉 찬다.
    const paddingX = framed ? (paddingXProp ?? (notion ? "12px" : "1rem")) : 0;
    // 폰 목록(1.6.0) — 켠 표만, 화면이 좁을 때만 카드 줄로 그린다
    const mobileConfig = mobile === true ? {} : mobile || null;
    const mobileMatch = useMediaQuery(mobileConfig?.query ?? DEFAULT_MOBILE_QUERY, { noSsr: true });
    const mobileList = Boolean(mobileConfig) && mobileMatch;
    // 바깥 스크롤(1.7.0) — 페이지가 굴리고 표는 그 스크롤에 맞춰 보이는 줄만 그린다(높이는 내용만큼)
    const external = Boolean(scrollParent);
    // 높이를 내용에 맡기는가 — autoHeight(가상화 없음) · 바깥 스크롤(가상화 있음)
    const sizeAuto = autoHeight || external;
    // 카드 줄은 내용만큼 높아진다(rowHeight 는 최소 높이)
    const autoRowHeight = rowHeightMode === "auto" || mobileList;
    // 호버는 단색(불투명) — 기본 모양의 반투명 검정은 흰 종이 위에서 회색이 아니라 탁한 색으로 보인다.
    const rowHoverColor = rowHoverColorProp ?? (notion ? notionTokens.hoverBg : undefined);
    const rowHoverOpacity = rowHoverOpacityProp ?? (notion ? 1 : undefined);
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
    // 노션풍은 선택 줄 모양을 기본으로 갖는다 — 옅은 파란 바탕 + 왼쪽 파란 띠 3px(목록 표의 "지금 열어 둔 줄").
    // 띠는 줄(tr)의 그림자가 브라우저마다 그려지지 않아 첫 칸 안쪽 그림자로 긋는다. 고정 열 칸은 제 바탕을 칠하므로 같은 색을 준다.
    const notionSelectedSx = useMemo(
        () =>
            notion
                ? {
                      backgroundColor: notionTokens.selectedBg,
                      "& > td:first-of-type": { boxShadow: `inset 3px 0 0 ${notionTokens.selectedBar}` },
                      "& > td[data-vdt-pinned]": { backgroundColor: notionTokens.selectedBg },
                  }
                : undefined,
        [notion, notionTokens],
    );
    const selectedRowSx = selectedRowSxProp ?? notionSelectedSx;
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
                        // 가로 휠(트랙패드 옆 밀기 · Shift+휠)은 브라우저에 맡긴다 — 아래에서 세로로만 옮기므로 막으면
                        // 열이 많은 표(tableLayout="auto")를 옆으로 밀 수 없다.
                        if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                            return;
                        }
                        // 머리 아래 고정 줄 영역(pinnedRows)처럼 안에서 따로 굴리는 상자 위에서는 그 상자를 먼저 굴린다 —
                        // 여기서 막으면 그 영역의 6번째 줄부터는 볼 방법이 없다. 끝에 닿았으면 본문을 굴린다.
                        const inner = (e.target as HTMLElement | null)?.closest?.("[data-vdt-inner-scroll]") as HTMLElement | null;
                        if (inner && el.contains(inner)) {
                            const canScroll =
                                e.deltaY < 0
                                    ? inner.scrollTop > 0
                                    : inner.scrollTop + inner.clientHeight < inner.scrollHeight - 1;
                            if (canScroll) return;
                        }
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
                                    // 노션풍은 좌우 여백을 종이(Paper/Box) 쪽에 준다 — 테두리가 여백 안쪽에 그려져야 한다.
                                    paddingRight: notion ? 0 : paddingX,
                                    // px 로 준다 — sx 에 숫자를 그대로 넣으면 MUI 가 간격 단위(×8)로 읽어 106 이 848px 가 됐다(1.7.1)
                                    paddingTop: `${paddingTop}px`,
                                    paddingBottom: `${paddingBottom}px`,
                                },
                            }}
                        />
                    </OverlayScrollbar>
                );
            }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [], // 빈 배열: 최초 마운트 시에만 생성, scrollbars, paddingX, paddingTop, paddingBottom, notion 은 클로저로 고정
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
    // 직전에 loadMore 를 요청한 시점의 데이터 길이. 요청 후 길이가 늘지 않았다면
    // (= 서버에 더 이상 데이터 없음) 같은 길이로는 다시 요청하지 않아, 바닥에서
    // endReached ↔ onLoadMore 가 무한 반복되는 것을 막는다.
    const lastLoadMoreLengthRef = useRef<number>(-1);
    const virtuosoRef = useRef<any>(null); // TableVirtuoso ref
    // 줄들이 스크롤 영역보다 긴가 — 길면 맨 끝 줄이 틀 바닥에 닿으므로 그 줄의 아래선을 뺀다(아래 노션 스타일).
    const scrollerElRef = useRef<HTMLElement | null>(null);
    const [listOverflows, setListOverflows] = useState(false);
    const checkListOverflow = useCallback(() => {
        const el = scrollerElRef.current;
        if (el) setListOverflows(el.scrollHeight > el.clientHeight + 1);
    }, []);
    useEffect(() => {
        const el = scrollerElRef.current;
        if (!el || typeof ResizeObserver === "undefined") return;
        const observer = new ResizeObserver(() => checkListOverflow());
        observer.observe(el);
        return () => observer.disconnect();
    }, [checkListOverflow, autoHeight]);

    // 소비처가 인라인으로 넘기는 콜백(onRowClick/getRowId)은 매 렌더마다 identity 가 바뀐다.
    // 이를 ref 로 잡아 두면 VirtuosoTableComponents(memo)를 재생성하지 않아도 최신 콜백을 쓸 수 있어,
    // 검색/필터로 부모가 리렌더돼도 행(및 이미지)이 리마운트되지 않는다(사진 깜빡임 방지).
    const onRowClickRef = useRef(onRowClick);
    onRowClickRef.current = onRowClick;
    const getRowIdRef = useRef(getRowId);
    getRowIdRef.current = getRowId;
    const onRowContextMenuRef = useRef(onRowContextMenu);
    onRowContextMenuRef.current = onRowContextMenu;
    const onEndReachedRef = useRef(onEndReached);
    onEndReachedRef.current = onEndReached;
    // 고정 줄(pinnedRows)은 머리 안에 그리는데 머리 내용이 줄 부품보다 먼저 만들어진다 — 줄 부품은 ref 로 늦게 잡는다.
    const rowComponentRef = useRef<React.ComponentType<any> | null>(null);

    // 고정 열(pinned: "left")이 붙을 왼쪽 자리 — 앞쪽 고정 열 폭의 합. 고정 열이 아니면 없다.
    const pinnedLeft = useMemo(() => {
        const map = new Map<string, number>();
        let left = 0;
        columns.forEach((col) => {
            if (col.pinned !== "left") return;
            map.set(String(col.id), left);
            left += typeof col.width === "number" ? col.width : 0;
        });
        return map;
    }, [columns]);
    // 표 최소 폭 — minWidth 를 준 열이 있을 때만. 열마다 width(숫자) 또는 minWidth 의 합이고, 틀이 좁으면 가로로 민다.
    const tableMinWidth = useMemo(() => {
        if (!columns.some((col) => typeof col.minWidth === "number")) return undefined;
        return columns.reduce(
            (sum, col) =>
                sum + (typeof col.width === "number" ? col.width : typeof col.minWidth === "number" ? col.minWidth : 0),
            0,
        );
    }, [columns]);
    /** 고정 열 칸의 sticky 자리. 머리 칸은 본문 고정 칸보다 위(zIndex 3)에 선다. */
    const pinnedStyle = useCallback(
        (col: DataColumn<T>, head: boolean): React.CSSProperties => {
            const left = pinnedLeft.get(String(col.id));
            if (left === undefined) return {};
            return { position: "sticky", left, zIndex: head ? 3 : 1 };
        },
        [pinnedLeft],
    );
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

    /**
     * 머리 우클릭 메뉴(1.4.0). 열은 요소가 아니라 id 로 쥔다 — 값을 고르면 소비처가 columns 를 새로 만들어 머리 칸이 다시 그려지는데,
     * 요소를 쥐면 옛 요소에 붙어 메뉴가 엉뚱한 데로 가거나 닫힌다. 자리도 좌표로 둔다(누른 x · 머리 칸 바닥 y).
     */
    const [headerMenu, setHeaderMenu] = useState<{ colId: string; x: number; y: number } | null>(null);
    const onHeaderContextMenuRef = useRef(onHeaderContextMenu);
    onHeaderContextMenuRef.current = onHeaderContextMenu;
    const onSortRef = useRef(onSort);
    onSortRef.current = onSort;

    /**
     * 머리 칸 우클릭 — 브라우저 메뉴는 늘 막는다(머리에서 "뒤로 · 새로고침" 메뉴는 쓸 데가 없고, 정렬 · 거르기 메뉴와 겹쳐 뜬다).
     * 소비처 처리(headerProps.onContextMenu · onHeaderContextMenu)가 먼저다 — 그쪽이 preventDefault 했거나 true 를 돌려주면 기본 메뉴를 띄우지 않는다.
     * 그래서 막는 preventDefault 는 소비처를 부른 뒤에 한다(먼저 막으면 "처리했다" 를 가려낼 수 없다).
     */
    const handleHeaderContextMenu = useCallback(
        (col: DataColumn<T> | null, event: React.MouseEvent<HTMLTableCellElement>) => {
            if (!col) {
                event.preventDefault();
                return;
            }
            col.headerProps?.onContextMenu?.(event);
            let handled = event.defaultPrevented;
            if (!handled) handled = onHeaderContextMenuRef.current?.(col, event) === true || event.defaultPrevented;
            event.preventDefault();
            if (handled || col.headerMenu === false) return;
            const canSort = Boolean((col.sortMenu ?? col.sortable) && onSortRef.current);
            if (!canSort && !hasColumnFilter(col)) return;
            const rect = event.currentTarget.getBoundingClientRect();
            setHeaderMenu({ colId: String(col.id), x: event.clientX, y: rect.bottom });
        },
        [],
    );

    /** 머리글 — 거를 수 있는 열은 거르기 아이콘을 붙이고, 걸려 있으면 강조색으로 선다(걸린 줄 모르고 "왜 몇 줄 없지" 하지 않게). */
    const renderHeaderText = useCallback(
        (col: DataColumn<T>) => {
            if (!hasColumnFilter(col)) return col.text;
            const active = Boolean(col.filterValues && col.filterValues.length > 0);
            return (
                <Box
                    component="span"
                    sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.5,
                        maxWidth: "100%",
                        color: active ? "primary.main" : undefined,
                        fontWeight: active ? 600 : undefined,
                        verticalAlign: "middle",
                    }}
                >
                    <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {col.text}
                    </Box>
                    <HeaderFilterIcon active={active} />
                </Box>
            );
        },
        [],
    );

    // 스크롤 끝 근처에서만 추가 로드를 실행해 scroll 핫패스 부담을 줄인다.
    const handleEndReached = useCallback(
        (endIndex: number) => {
            const rangeStart = perfDebugEnabled ? performance.now() : 0;
            onEndReachedRef.current?.();
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

            // 직전 요청 이후 길이가 그대로면(서버에 더 이상 데이터 없음) 재요청하지 않는다.
            const alreadyRequestedAtThisLength =
                lastLoadMoreLengthRef.current === data.length;

            if (
                nearEnd &&
                hasMinimumData &&
                !isLoadingMoreRef.current &&
                !alreadyRequestedAtThisLength
            ) {
                isLoadingMoreRef.current = true;
                lastLoadMoreLengthRef.current = data.length;
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

    const resetScrollOnDataChangeRef = useRef(resetScrollOnDataChange);
    resetScrollOnDataChangeRef.current = resetScrollOnDataChange;
    // 이전 데이터 길이 / 첫 행 식별자를 추적
    const prevDataLengthRef = useRef(data.length);
    const prevFirstRowKeyRef = useRef<unknown>(undefined);

    // 데이터가 '진짜로 교체'된 경우(정렬/필터/재조회)에만 스크롤을 맨 위로 이동한다.
    // 단순히 같은 목록의 항목이 in-place 로 바뀌었을 뿐(체크박스 토글, 무한 스크롤
    // 빈 결과, 부모 리렌더로 인한 새 배열 참조 등)인데도 맨 위로 튀던 문제를 막는다.
    // → 첫 행 식별자(getRowId)와 길이로 '교체' 여부를 판별한다.
    useEffect(() => {
        const prevLength = prevDataLengthRef.current;
        const currentLength = data.length;

        // 첫 행 키: getRowId 가 있으면 값 기반(참조가 매번 바뀌어도 안정), 없으면 객체 참조.
        const firstRowKey =
            currentLength > 0
                ? getRowIdRef.current
                    ? getRowIdRef.current(data[0], 0)
                    : (data[0] as unknown)
                : undefined;
        const prevFirstRowKey = prevFirstRowKeyRef.current;

        // 데이터 길이가 증가한 경우 (무한 스크롤) - 스크롤 위치 유지
        if (currentLength > prevLength && prevLength > 0) {
            prevDataLengthRef.current = currentLength;
            prevFirstRowKeyRef.current = firstRowKey;
            return;
        }

        // '교체'로 판단: 길이가 줄었거나, 첫 행 식별자가 바뀐 경우에만 맨 위로.
        // (같은 길이 + 같은 첫 행 = in-place 업데이트 → 스크롤 유지)
        const dataReplaced =
            currentLength < prevLength ||
            (prevLength > 0 && firstRowKey !== prevFirstRowKey);

        // 목록이 교체(정렬/검색/필터로 1페이지 재조회)되면 더보기 래치를 풀어 무한 스크롤이
        // 다시 동작하게 한다. 래치는 "요청한 길이에서 안 늘면 서버 소진"이라는 전제인데,
        // 교체로 길이가 우연히 같아지면(예: 100→50 이 아니라 소진 후 다른 검색이 50) 그 전제가
        // 깨져 onLoadMore 가 영구히 멈춘다. append/빈응답은 위 early-return·동일 firstRowKey 로
        // 걸러지므로(=dataReplaced=false) 1.1.29 가 고친 "바닥 떨림"은 되살아나지 않는다.
        if (dataReplaced) {
            lastLoadMoreLengthRef.current = -1;
        }

        if (virtuosoRef.current && currentLength > 0 && dataReplaced && resetScrollOnDataChangeRef.current) {
            virtuosoRef.current.scrollToIndex({
                index: 0,
                align: "start",
                behavior: "auto",
            });
        }

        prevDataLengthRef.current = currentLength;
        prevFirstRowKeyRef.current = firstRowKey;
    }, [data]);

    /**
     * 테이블 고정 헤더 컨텐츠 정의 (기존 VirtualDataTable 스타일)
     * 정렬 기능이 포함된 컬럼 헤더를 렌더링
     */
    const headerRowsContent = useCallback(() => {
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
                            // 노션풍 머리는 한 줄 말줄임이라 글자 머리는 전체 이름을 툴팁으로 보인다(headerProps.title 이 있으면 그것이 이긴다).
                            title={typeof col.text === "string" ? col.text : undefined}
                            {...col.headerProps}
                            onContextMenu={(e: React.MouseEvent<HTMLTableCellElement>) => handleHeaderContextMenu(col, e)}
                            style={{
                                width: col.width,
                                minWidth: col.width ?? col.minWidth,
                                ...col.style,
                                fontWeight: "bold",
                                position: "sticky",
                                top: 0,
                                zIndex: 2,
                                padding: "16px",
                                ...pinnedStyle(col, true),
                                ...col.headerProps?.style,
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
                                        className="vdt-sort-box"
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
                                        {renderHeaderText(col)}
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
                                renderHeaderText(col)
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
                    // 노션풍 머리는 한 줄 말줄임이라 글자 머리는 전체 이름을 툴팁으로 보인다(headerProps.title 이 있으면 그것이 이긴다).
                    title={typeof col.text === "string" ? col.text : undefined}
                    {...col.headerProps}
                    onContextMenu={(e: React.MouseEvent<HTMLTableCellElement>) => handleHeaderContextMenu(col, e)}
                    style={{
                        width: col.width,
                        minWidth: col.width,
                        ...col.style,
                        fontWeight: "bold",
                        position: "sticky",
                        top: 0,
                        zIndex: 2,
                        padding: "16px",
                        ...pinnedStyle(col, true),
                        ...col.headerProps?.style,
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
                                className="vdt-sort-box"
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
                                {renderHeaderText(col)}
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
                        renderHeaderText(col)
                    )}
                </TableCell>
            )),
            ...Object.entries(groupMap).map(([group, cols]) => (
                <TableCell
                    key={group}
                    align="center"
                    colSpan={cols.length}
                    onContextMenu={(e: React.MouseEvent<HTMLTableCellElement>) => handleHeaderContextMenu(null, e)}
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
                        // 노션풍 머리는 한 줄 말줄임이라 글자 머리는 전체 이름을 툴팁으로 보인다(headerProps.title 이 있으면 그것이 이긴다).
                        title={typeof col.text === "string" ? col.text : undefined}
                        {...col.headerProps}
                        onContextMenu={(e: React.MouseEvent<HTMLTableCellElement>) => handleHeaderContextMenu(col, e)}
                        style={{
                            width: col.width,
                            minWidth: col.width,
                            ...col.style,
                            fontWeight: "bold",
                            position: "sticky",
                            top: 0,
                            zIndex: 2,
                            padding: "16px",
                            ...pinnedStyle(col, true),
                            ...col.headerProps?.style,
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
                                    className="vdt-sort-box"
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
                                    {renderHeaderText(col)}
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
                            renderHeaderText(col)
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
    }, [columns, sortBy, sortDirection, handleSort, onSort, columnHeight, pinnedStyle, handleHeaderContextMenu, renderHeaderText]);

    /**
     * 테이블 행 컨텐츠 렌더링 함수 (기존 VirtualDataTable 스타일)
     * 각 데이터 항목에 대한 셀 내용을 정의
     */
    /** 폰 목록의 열 자리 — 열의 mobile 힌트로 나눈다(없으면 첫 열은 제목, 나머지는 정보 줄) */
    const mobileSlots = useMemo(() => {
        const shown = columns.filter((c) => c.mobile !== false);
        const title = shown.find((c) => c.mobile === "title") ?? shown.find((c) => !c.mobile);
        return {
            title,
            thumb: shown.filter((c) => c.mobile === "thumb"),
            badge: shown.filter((c) => c.mobile === "badge"),
            sub: shown.filter((c) => c.mobile === "sub"),
            meta: shown.filter((c) => c !== title && (!c.mobile || c.mobile === "meta")),
        };
    }, [columns]);

    /** 폰 목록 카드 한 줄 — [사진] [제목 · 칩 / 아래 한 줄 / 머리글 값 묶음] */
    const renderMobileRow = useCallback(
        (item: T, index: number): React.ReactNode => {
            if (mobileConfig?.renderRow) return mobileConfig.renderRow(item, index);
            const cell = (c: DataColumn<T>) => (c.render ? c.render(item, index) : String((item as any)[c.id] ?? ""));
            const { title, thumb, badge, sub, meta } = mobileSlots;
            return (
                <Box sx={{ display: "flex", gap: "12px", alignItems: "flex-start", py: "12px", px: "14px", minWidth: 0 }}>
                    {thumb.map((c) => (
                        <Box key={String(c.id)} sx={{ flexShrink: 0 }}>
                            {cell(c)}
                        </Box>
                    ))}
                    <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
                        {(title || badge.length > 0) && (
                            <Box sx={{ display: "flex", alignItems: "flex-start", gap: "8px", minWidth: 0 }}>
                                <Box sx={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 500, overflowWrap: "anywhere" }}>
                                    {title ? cell(title) : null}
                                </Box>
                                {badge.map((c) => (
                                    <Box key={String(c.id)} sx={{ flexShrink: 0 }}>
                                        {cell(c)}
                                    </Box>
                                ))}
                            </Box>
                        )}
                        {sub.map((c) => (
                            <Box key={String(c.id)} sx={{ fontSize: 13, color: notionTokens.headerColor, minWidth: 0 }}>
                                {cell(c)}
                            </Box>
                        ))}
                        {meta.length > 0 && (
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: "2px 12px", fontSize: 13, minWidth: 0 }}>
                                {meta.map((c) => {
                                    const label = c.mobileLabel === false ? null : (c.mobileLabel ?? (typeof c.text === "string" ? c.text : null));
                                    return (
                                        <Box key={String(c.id)} sx={{ display: "inline-flex", alignItems: "center", gap: "4px", minWidth: 0, maxWidth: "100%" }}>
                                            {label ? <Box component="span" sx={{ color: notionTokens.headerColor, flexShrink: 0 }}>{label}</Box> : null}
                                            <Box component="span" sx={{ minWidth: 0, "& > *": { width: "auto !important", textAlign: "left !important" } }}>
                                                {cell(c)}
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>
                        )}
                    </Box>
                </Box>
            );
        },
        [mobileConfig, mobileSlots, notionTokens],
    );

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

            // 폰 목록 — 모든 열을 합친 칸 하나에 카드(머리 줄이 없어 열 폭은 의미가 없다)
            if (mobileList) {
                return (
                    <TableCell colSpan={columns.length} data-vdt-pad="" sx={{ padding: 0 }}>
                        {renderMobileRow(item, index)}
                    </TableCell>
                );
            }

            // 한 칸 줄(묶음 머리 등) — 모든 열을 합친 칸 하나. 여백 · 바탕은 fullWidthRowSx 가 정한다.
            const fullWidth = renderFullWidthRow
                ? renderFullWidthRow(item, index)
                : null;
            if (fullWidth !== null && fullWidth !== undefined) {
                return (
                    <TableCell
                        colSpan={columns.length}
                        data-vdt-pad=""
                        sx={[
                            { padding: notion ? "0 14px" : "8px 16px" },
                            ...(Array.isArray(fullWidthRowSx)
                                ? fullWidthRowSx
                                : fullWidthRowSx
                                  ? [fullWidthRowSx]
                                  : []),
                        ]}
                    >
                        {fullWidth}
                    </TableCell>
                );
            }

            // 오른쪽으로 합친 칸(colSpan)에 덮인 열 수 — 그만큼 다음 열들의 칸을 그리지 않는다.
            let coveredByColSpan = 0;
            const cells = columns.map((column, columnIndex) => {
                if (coveredByColSpan > 0) {
                    coveredByColSpan -= 1;
                    return null;
                }
                const colSpan = column.colSpan
                    ? Math.max(1, Math.min(column.colSpan(item, index), columns.length - columnIndex))
                    : 1;
                coveredByColSpan = colSpan - 1;
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

                const pinned = pinnedLeft.has(String(column.id));
                const customPadding = column.cellPadding !== undefined;
                // 아래로 합친 칸에 덮인 줄은 칸을 그리지 않는다.
                const span = column.rowSpan ? column.rowSpan(item, index) : 1;
                if (span <= 0) return null;
                const onCellClick = column.onCellClick;
                return (
                    <TableCell
                        key={String(column.id)}
                        align={column.align || "left"}
                        rowSpan={span > 1 ? span : undefined}
                        colSpan={colSpan > 1 ? colSpan : undefined}
                        data-vdt-pad={customPadding ? "" : undefined}
                        data-vdt-pinned={pinned ? "" : undefined}
                        data-vdt-cell-click={onCellClick ? "" : undefined}
                        onClick={
                            onCellClick
                                ? (e: React.MouseEvent) => {
                                      // 끌어서 민 뒤의 클릭은 칸 누름으로 치지 않는다(줄 클릭과 같은 기준).
                                      const dx = e.clientX - mouseDownPositionRef.current.x;
                                      const dy = e.clientY - mouseDownPositionRef.current.y;
                                      e.stopPropagation();
                                      if (Math.sqrt(dx * dx + dy * dy) > ROW_CLICK_DRAG_THRESHOLD_PX) return;
                                      onCellClick(item, index, e);
                                  }
                                : undefined
                        }
                        style={{
                            // 합친 칸은 폭을 박지 않는다 — 열 폭은 머리 줄이 정하고, 박으면 합친 폭이 한 열 폭으로 줄어든다.
                            ...(colSpan > 1 ? {} : { width: column.width, minWidth: column.width ?? column.minWidth }),
                            ...(column.primary ? { fontSize: 15 } : {}),
                            ...column.style,
                            ...(column.cellStyle ? column.cellStyle(item, index) : {}),
                            padding: customPadding ? column.cellPadding : "8px 16px",
                            ...pinnedStyle(column, false),
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
        [columns, perfDebugEnabled, renderFullWidthRow, fullWidthRowSx, notion, pinnedLeft, pinnedStyle, mobileList, renderMobileRow],
    );

    /**
     * 머리 내용 = 머리 줄 + (있으면) 고정 줄 영역. 고정 줄은 머리(thead)와 함께 위에 붙어 본문 스크롤과 무관하게 보인다.
     * 머리 안에 본문 칸을 그리려면 한 칸(colSpan 전체) 안에 같은 열 구성의 표를 하나 더 둔다 — 열 폭은 colgroup 으로 바깥 표와 맞추고
     * (첫 줄이 묶음 띠 줄이면 그 줄로는 열 폭을 못 정한다), 가로로 밀면 바깥 표와 함께 움직인다.
     * 안쪽 tbody 를 MUI TableBody 로 감싸야 칸이 머리 칸(th)이 아니라 본문 칸(td)으로 그려진다.
     */
    const fixedHeaderContent = useCallback(() => {
        const headerRows = headerRowsContent();
        if (!pinnedRows || pinnedRows.length === 0) return headerRows;
        const RowComponent = rowComponentRef.current;
        return (
            <>
                {headerRows}
                <tr data-vdt-pinned-area="">
                    <td colSpan={columns.length} style={{ padding: 0, border: 0 }}>
                        <Box
                            data-vdt-inner-scroll=""
                            sx={[
                                {
                                    maxHeight: pinnedRowsMaxHeight,
                                    overflowY: pinnedRowsMaxHeight ? "auto" : "visible",
                                    overflowX: "hidden",
                                    scrollbarWidth: "thin",
                                    borderBottom: `1px solid ${notion ? notionTokens.borderStrong : "rgba(224, 224, 224, 1)"}`,
                                    // 영역 아랫선이 경계를 맡는다 — 마지막 줄 아래선까지 그으면 이중선이다.
                                    "& tbody tr:last-of-type > td": { borderBottom: "none" },
                                },
                                ...(Array.isArray(pinnedRowsSx) ? pinnedRowsSx : pinnedRowsSx ? [pinnedRowsSx] : []),
                            ]}
                        >
                            <table
                                style={{
                                    width: "100%",
                                    tableLayout,
                                    borderCollapse: "separate",
                                    borderSpacing: 0,
                                }}
                            >
                                <colgroup>
                                    {columns.map((col) => (
                                        <col key={String(col.id)} style={{ width: col.width, minWidth: col.width ?? col.minWidth }} />
                                    ))}
                                </colgroup>
                                <MuiTableBody>
                                    {pinnedRows.map((item, index) =>
                                        RowComponent ? (
                                            <RowComponent
                                                key={getRowId ? String(getRowId(item, index)) : `p${index}`}
                                                item={item}
                                                data-index={index}
                                                data-vdt-pinned-row=""
                                            >
                                                {rowContent(index, item)}
                                            </RowComponent>
                                        ) : null,
                                    )}
                                </MuiTableBody>
                            </table>
                        </Box>
                    </td>
                </tr>
            </>
        );
    }, [headerRowsContent, pinnedRows, pinnedRowsMaxHeight, pinnedRowsSx, columns, rowContent, tableLayout, getRowId, notion, notionTokens]);

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
                        // 노션풍은 본문 칸과 같은 좌우 여백 · 세로 0(줄 높이로 가운데) — 16px 이면 합계 줄만 높고 글자가 칸과 어긋났다.
                        padding: notion ? "0 14px" : "16px",
                    }}
                >
                    {col.footer ? col.footer(data) : null}
                </TableCell>,
            );

            // colSpan 으로 덮인 뒤 컬럼은 건너뛴다.
            i += colSpan - 1;
        }

        return <MuiTableRow>{cells}</MuiTableRow>;
    }, [hasFooter, columns, data, notion]);

    // 테이블 컴포넌트 정의 (기존 VirtualDataTable 스타일)
    const VirtuosoTableComponents: TableComponents<T> = useMemo(
        () => ({
            // 스크롤 컨테이너 (외부에서 한 번만 생성된 안정적인 컴포넌트 사용)
            // 바깥 스크롤이면 자기 스크롤 상자(OverlayScrollbar) 없이 평범한 상자 — 굴리는 것은 바깥이다
            Scroller: external ? PlainScroller : VirtuosoScroller,
            // 테이블 컴포넌트
            Table: (props) => (
                <Table
                    {...props}
                    sx={{
                        borderCollapse: "separate",
                        tableLayout,
                        // 폰 목록은 칸 하나라 열 폭 합(최소 폭)을 두지 않는다 — 두면 화면 밖으로 밀린다
                        ...(tableMinWidth && !mobileList ? { minWidth: tableMinWidth } : {}),
                        // 틀 없이 그릴 때는 오른쪽 덧여백이 가로 넘침(가로 막대)을 만든다 — 표가 상자 폭에 꼭 맞게 둔다.
                        marginRight: framed ? "16px" : 0,
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
                            // 바로 아래 줄(머리 줄)만 — 머리 안 고정 줄 영역(pinnedRows)의 줄까지 머리 높이 · 굵기를 받으면 안 된다.
                            "& > tr": {
                                height: columnHeight,
                                "& > th": {
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
                        onContextMenu={(e: React.MouseEvent) => {
                            if (item && onRowContextMenuRef.current) {
                                onRowContextMenuRef.current(item, rowIndex, e);
                            }
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
                                // 행 높이를 estimatedItemHeight(=rowHeight + divider) 로 정확히
                                // 고정한다. react-virtuoso 는 fixedItemHeight 를 줘도
                                // ResizeObserver 로 실제 행 높이를 재측정해 반영하는데, 셀
                                // 폰트/라인의 서브픽셀 때문에 측정값이 정수에서 어긋나면
                                // 하단 filler row 높이(offsetBottom)가 스크롤마다 소수점으로
                                // 흔들리고, 그 위에 sticky 로 붙은 <tfoot> 합계행이 1px 떨린다.
                                // height/maxHeight 를 정수로 박고 overflow:hidden 으로 막아
                                // 측정값이 항상 estimatedItemHeight 가 되게 한다.
                                // 줄 높이 "auto" 는 내용만큼 늘어난다 — 칸 높이(rowHeight)가 최소 높이로 동작한다.
                                ...(autoRowHeight
                                    ? { "& > td": { height: estimatedItemHeight } }
                                    : {
                                          height: estimatedItemHeight,
                                          maxHeight: estimatedItemHeight,
                                      }),
                                boxSizing: "border-box",
                                backgroundColor:
                                    isOddRow && stripedRowColor
                                        ? stripedRowColor
                                        : "transparent",
                                // 여백을 따로 받은 칸(cellPadding · 한 칸 줄)은 기본 여백에서 뺀다.
                                "& td:not([data-vdt-pad])": {
                                    padding: "8px 16px",
                                },
                                "& td": {
                                    boxSizing: "border-box",
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
                                // 떨림의 근본 원인(데이터 행 측정 높이의 서브픽셀)은 TableRow
                                // 에서 height/maxHeight 정수 고정으로 잡는다. 여기서는 합계행
                                // 셀 스타일만 둔다(virtuoso 가 <tfoot> 에 직접 sticky 를 건다).
                                // 합계행 높이를 footerHeight(미지정 시 rowHeight) 로 정확히
                                // 고정한다. 그래야 로딩 오버레이의 하단 컷오프(bottom:
                                // footerHeight ?? rowHeight)와 실제 footer 높이가 일치해
                                // 오버레이가 footer 위까지만 내려오고 footer 를 덮지 않는다.
                                "& tr": {
                                    height: footerHeight ?? rowHeight,
                                    maxHeight: footerHeight ?? rowHeight,
                                    boxSizing: "border-box",
                                },
                                "& td": {
                                    height: footerHeight ?? rowHeight,
                                    boxSizing: "border-box",
                                    backgroundColor: (theme) =>
                                        theme.palette.mode === "dark"
                                            ? "#1e1e1e"
                                            : "#ffffff",
                                    // 세로 padding 을 0 으로 두고 행 높이로 정렬을 맡긴다.
                                    // (가로 16px 유지) — 16px 세로 padding 이면 실제 footer 가
                                    // footerHeight 보다 커져 오버레이 컷오프와 어긋난다.
                                    padding: "0 16px",
                                    color: "inherit",
                                    fontSize: "0.875rem",
                                    // 구분선은 실제 border 대신 inset box-shadow 로 그린다.
                                    // collapsed-border 픽셀 경계 공유로 인한 깜빡임을 피한다.
                                    border: "none",
                                    // 노션풍은 머리 아래 선과 같은 진한 회색 선 — 검은 선은 옅은 표에서 혼자 튀었다.
                                    boxShadow: `inset 0 1px 0 0 ${notion ? notionTokens.borderStrong : "#000000"}`,
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
            notion,
            notionTokens,
            // spacer 행의 colSpan 계산에 사용 (컬럼 구조 변경 시 components 재생성)
            columns,
            tableLayout,
            framed,
            autoRowHeight,
            tableMinWidth,
            mobileList,
            external,
        ],
    );
    rowComponentRef.current = (VirtuosoTableComponents as Record<string, unknown>).TableRow as React.ComponentType<any>;

    const resolvedVirtuosoComponents = VirtuosoTableComponents;
    // autoHeight 는 같은 표 부품(머리 · 줄 · 합계)을 가상화 없이 그대로 쓴다 — 칸 모양이 가상 표와 같다.
    const autoParts = VirtuosoTableComponents as Record<string, unknown>;
    const AutoTable = autoParts.Table as React.ComponentType<any>;
    const AutoTableHead = autoParts.TableHead as React.ComponentType<any>;
    const AutoTableBody = autoParts.TableBody as React.ComponentType<any>;
    const AutoTableRow = autoParts.TableRow as React.ComponentType<any>;
    const AutoTableFoot = autoParts.TableFoot as React.ComponentType<any>;

    // 머리 우클릭 메뉴 — 열은 매 렌더 columns 에서 다시 찾는다(고른 값 · 정렬 표시가 바로 따라오게). 열이 사라졌으면 그리지 않는다.
    const menuColumn = headerMenu ? columns.find((col) => String(col.id) === headerMenu.colId) : undefined;
    const closeHeaderMenu = () => setHeaderMenu(null);
    let headerMenuNode: React.ReactNode = null;
    if (headerMenu && menuColumn) {
        const colId = String(menuColumn.id);
        const canSort = Boolean((menuColumn.sortMenu ?? menuColumn.sortable) && onSort);
        const canFilter = hasColumnFilter(menuColumn);
        const activeSort = sortBy === colId ? sortDirection : undefined;
        // 메뉴 모양은 공용 HeaderMenu 한 벌이다(1.5.0) — 화면이 직접 띄우는 머리 메뉴와 같은 크기 · 체크 모양.
        headerMenuNode = (
            <HeaderMenu
                open
                anchorPosition={{ left: headerMenu.x, top: headerMenu.y }}
                onClose={closeHeaderMenu}
                sort={
                    canSort
                        ? {
                              active: activeSort ?? null,
                              clearable: Boolean(onSortClear),
                              onChange: (direction) => {
                                  if (direction) onSort?.(colId, direction);
                                  else onSortClear?.();
                              },
                          }
                        : undefined
                }
                filter={
                    canFilter
                        ? {
                              options: menuColumn.filterOptions ?? [],
                              value: menuColumn.filterValues ?? [],
                              onChange: (values) => menuColumn.onFilterChange?.(values),
                              multiple: menuColumn.filterMultiple !== false,
                              emptyLabel: menuColumn.filterEmptyLabel,
                              searchable: menuColumn.filterSearchable,
                          }
                        : undefined
                }
            />
        );
    }

    // 공통 테이블 내용
    const tableContent = (
        <Box
            sx={
                {
                    position: "relative",
                    height: sizeAuto ? "auto" : "100%",
                    width: "100%",
                    "& .MuiTableHead-root": {
                        backgroundColor: (theme: Theme) =>
                            notion
                                ? `${notionTokens.bg} !important`
                                : theme.palette.mode === "dark"
                                  ? "#1e1e1e !important"
                                  : "#ffffff !important",
                    },
                    // 선택 행 CSS 하이라이트 (selectedRowId 변경 시 이 컨테이너만 갱신, 행 재렌더 없음).
                    ...(selectedRowCssSx ?? {}),
                    // 고정 열 칸은 뒤로 지나가는 칸을 가려야 해 바탕을 칠한다. 줄 호버 색은 줄(tr)에 칠해지므로 고정 칸에도 같은 색을 준다.
                    "& tbody td[data-vdt-pinned]": {
                        backgroundColor: notion
                            ? notionTokens.bg
                            : muiTheme.palette.background.paper,
                    },
                    // 칸 단위로 누르는 칸 — 칸에만 호버 바탕.
                    "& tbody td[data-vdt-cell-click]": { cursor: "pointer" },
                    "& tbody td[data-vdt-cell-click]:hover": {
                        backgroundColor: notion
                            ? notionTokens.hoverBg
                            : muiTheme.palette.mode === "dark"
                              ? "rgba(255, 255, 255, 0.06)"
                              : "rgba(0, 0, 0, 0.04)",
                    },
                    ...(notion && hasRowClick
                        ? {
                              "& tbody tr:hover td[data-vdt-pinned]": {
                                  backgroundColor: notionTokens.hoverBg,
                              },
                          }
                        : {}),
                    // 노션풍 — 머리·칸의 인라인 style(padding·fontWeight)을 덮어야 해서 !important 다.
                    // 셀렉터를 컨테이너에서 내리는 것은 행 컴포넌트를 건드리지 않기 위해서다(행 재렌더 비용).
                    ...(notion
                        ? {
                              // 바깥 테두리 — 업무함 표(border 1px + radius 4px)와 같다. 가상화라 내용 높이에 맞춰 줄이지 못하고
                              // 종이 안쪽 여백 안에서 세로를 꽉 채운다. 머리의 윗선·좌우선은 이 테두리가 대신한다.
                              ...(framed
                                  ? {
                                        border: `1px solid ${notionTokens.borderStrong}`,
                                        borderRadius: "4px",
                                    }
                                  : {
                                        // 틀 없이 — 바깥 상자 바탕이 비치지 않게 표를 종이 색으로 칠한다.
                                        "& table": { backgroundColor: notionTokens.bg },
                                    }),
                              overflow: "hidden",
                              // 머리 칸 안의 인라인 상자(아이콘 + 글자를 묶은 inline-flex 머리 · 머리글 필터 단추)는 기준선에 서서 아래에
                              // 글자 내림 자리가 남아 글자가 1~3px 위로 떠 보였다(1.4.3) — 칸 가운데에 세운다.
                              "& thead tr th > *": { verticalAlign: "middle" },
                              // 머리 칸은 한 줄(1.5.0) — 칸 폭보다 긴 머리글 · 아이콘이 두 줄로 꺾여 머리 줄이 높아졌다(조직 칸이 많은 계약 목록).
                              // 넘치면 말줄임, 전체 이름은 title(글자 머리) 툴팁으로 본다. 높이는 columnHeight 그대로다.
                              "& thead > tr > th": { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
                              "& thead > tr > th > *": { maxWidth: "100%" },
                              // 정렬 화살표는 머리글 오른쪽 밖(left: 100%)에 떠 있어, 오른쪽 맞춤 칸에서는 칸 여백(14px)을 넘어 위의 overflow 에 잘렸다(합계 칸).
                              // 노션풍은 화살표 자리를 머리글 상자 안에 두고(오른쪽 20px) 화살표를 그 자리 끝에 세운다.
                              "& thead .vdt-sort-box": { paddingRight: "20px" },
                              "& thead .vdt-sort-box > .MuiTableSortLabel-root": { left: "auto !important", right: 0, marginLeft: "0 !important" },
                              "& thead tr th": {
                                  height: columnHeight,
                                  boxSizing: "border-box",
                                  padding: "0 14px !important",
                                  fontSize: 13,
                                  fontWeight: "500 !important",
                                  color: notionTokens.headerColor,
                                  backgroundColor: `${notionTokens.bg} !important`,
                                  // 틀 없는 표를 도구 줄과 한 상자에 넣으면 머리 위 경계가 없다 — 그때만 윗선(headerTopBorder).
                                  borderTop: !framed && headerTopBorder ? `1px solid ${notionTokens.borderStrong}` : "none",
                                  borderBottom: `1px solid ${notionTokens.borderStrong}`,
                                  // 칸 사이 세로선 — 마지막 칸 뒤에는 긋지 않는다(바깥 테두리와 겹쳐 두 줄로 보인다).
                                  borderRight: `1px solid ${notionTokens.border}`,
                                  "&:last-of-type": { borderRight: "none" },
                              },
                              "& tbody tr td:not([data-vdt-pad])": {
                                  padding: "0 14px !important",
                              },
                              "& tbody tr td": {
                                  fontSize: 14,
                                  borderBottom: `1px solid ${notionTokens.border}`,
                              },
                              // 마지막 줄 아래선 — 틀 바닥(또는 합계 줄의 윗선)과 맞닿으면 긋지 않는다. 두 선이 겹쳐 굵은 이중선으로 보였다(2026-10-17).
                              // 맞닿는 경우: 내용 높이만큼 서는 표(autoHeight), 줄이 영역보다 길어 끝까지 내리면 바닥에 닿는 표, 합계 줄이 있는 표.
                              // 줄이 적어 아래가 비는 표는 그대로 긋는다 — 줄이 어디서 끝나는지 보여야 한다.
                              ...(data.length > 0 && (sizeAuto || listOverflows || hasFooter)
                                  ? { [`& tbody tr[data-index="${data.length - 1}"]:not([data-vdt-pinned-row]) td`]: { borderBottom: "none" } }
                                  : {}),
                          }
                        : {}),
                } as SxProps<Theme>
            }
        >
            {/* 테이블 — autoHeight 면 가상화 없이 모든 줄을 그리고 높이는 내용을 따른다(페이지가 굴린다). */}
            {autoHeight ? (
                <Box sx={{ overflowX: "auto", width: "100%" }}>
                    <AutoTable>
                        {mobileList ? null : <AutoTableHead>{fixedHeaderContent()}</AutoTableHead>}
                        <AutoTableBody>
                            {data.map((item, index) => (
                                <AutoTableRow
                                    key={getRowId ? String(getRowId(item, index)) : index}
                                    item={item}
                                    data-index={index}
                                >
                                    {rowContent(index, item)}
                                </AutoTableRow>
                            ))}
                        </AutoTableBody>
                        {hasFooter && !mobileList ? <AutoTableFoot>{fixedFooterContent()}</AutoTableFoot> : null}
                    </AutoTable>
                </Box>
            ) : scrollParent === null ? null : ( // 바깥 스크롤 요소를 아직 못 얻었으면 기다린다
                <TableVirtuoso
                    key={tableKey}
                    ref={virtuosoRef}
                    data={data}
                    totalCount={onLoadMore ? data.length + 1 : data.length}
                    defaultItemHeight={estimatedItemHeight}
                    fixedItemHeight={autoRowHeight ? undefined : estimatedItemHeight}
                    // 폰 목록은 머리 줄 · 합계 줄 없이 카드만
                    fixedHeaderContent={mobileList ? undefined : fixedHeaderContent}
                    fixedFooterContent={hasFooter && !mobileList ? fixedFooterContent : undefined}
                    itemContent={rowContent}
                    // 키 함수는 쓸 때만 넘긴다 — computeItemKey={undefined} 를 그대로 넘기면 react-virtuoso 의 기본 키 함수가 undefined 로 덮여
                    // "n is not a function" 으로 표 전체가 그려지지 않았다(1.3.0, 2026-10-18).
                    {...(rowKeyFromId && getRowId
                        ? { computeItemKey: (index: number, item: T) => (item ? getRowId(item, index) : `vdt-${index}`) }
                        : {})}
                    endReached={handleEndReached}
                    scrollerRef={(el) => {
                        scrollerElRef.current = el instanceof HTMLElement ? el : null;
                        checkListOverflow();
                    }}
                    totalListHeightChanged={checkListOverflow}
                    style={external ? undefined : { height: "100%" }}
                    // 바깥 스크롤(1.7.0) — 앱 셸처럼 페이지가 굴리는 화면(머리 접기 · 맨 위로 · 당겨서 새로고침은 바깥 것이 그대로 한다)
                    {...(external ? { customScrollParent: scrollParent as HTMLElement } : {})}
                    increaseViewportBy={{
                        top: viewportBufferTop,
                        bottom: viewportBufferBottom,
                    }}
                    overscan={virtuosoOverscan}
                    followOutput={false}
                    components={resolvedVirtuosoComponents}
                />
            )}

            {/* 빈 데이터 표시 — 노션풍은 머리 아래에 옅은 글 한 줄(업무함 목록 표의 빈 목록과 같은 모양). */}
            {data.length === 0 && !loading && !hasPinnedRows && notion && typeof emptyMessage === "string" && (
                <Box
                    sx={{
                        position: sizeAuto ? "static" : "absolute",
                        top: mobileList ? 0 : columnHeight,
                        left: 0,
                        right: 0,
                        py: 6,
                        // 좌우 16px — 틀 없는 표(framed=false · 폰 목록)는 안쪽 여백이 없어 긴 안내 글이 화면 끝까지 닿았다(1.6.1)
                        px: 2,
                        textAlign: "center",
                        fontSize: 14,
                        color: notionTokens.emptyColor,
                        // 글 한 줄뿐이라 누를 것이 없다 — 머리 칸 클릭 · 우클릭을 가로채지 않게.
                        pointerEvents: "none",
                    }}
                >
                    {emptyMessage}
                </Box>
            )}
            {data.length === 0 && !loading && !hasPinnedRows && !(notion && typeof emptyMessage === "string") && (
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
                        px: 2, // 틀 없는 표에서도 안내 글이 화면 끝에 닿지 않게(1.6.1)
                        textAlign: "center",
                        // 표 전체(머리 포함)를 덮는 상자라 빈 목록에서 머리 칸 정렬 · 우클릭 메뉴가 먹지 않았다(1.4.2) —
                        // 상자는 통과시키고 가운데 내용(안내 · 단추)만 눌리게 한다.
                        pointerEvents: "none",
                        "& > *": { pointerEvents: "auto" },
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

            {headerMenuNode}

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

    // 노션풍은 사방 여백 — 업무함처럼 표가 종이 가장자리에 붙지 않는다(좌우 paddingX, 상하 NOTION_PADDING_Y).
    const notionFramePadding = notion && framed
        ? { paddingRight: paddingX, paddingTop: NOTION_PADDING_Y, paddingBottom: NOTION_PADDING_Y }
        : {};

    return showPaper ? (
        <Paper
            className="grow"
            elevation={1}
            sx={{
                padding: 0,
                paddingLeft: paddingX,
                ...notionFramePadding,
                boxSizing: "border-box",
                height: sizeAuto ? "auto" : "100%",
                minHeight: 0,
                flex: sizeAuto ? "none" : 1,
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
                ...notionFramePadding,
                boxSizing: "border-box",
                height: sizeAuto ? "auto" : "100%",
                minHeight: 0,
                flex: sizeAuto ? "none" : 1,
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
