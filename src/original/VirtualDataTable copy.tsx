/**
 * VirtualDataTable.tsx
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
    TableRow as MuiTableRow,
    TableSortLabel,
} from "@mui/material";
import { TableComponents, TableVirtuoso } from "react-virtuoso";
import { Paper } from "@/pages/elim/components/Paper";
import { EmptyDataIcon } from "@/icons/EmptyDataIcon";

import { Loading } from "@/pages/elim/components/Loading";
import { VirtuosoScrollbar } from "./VirtuosoScrollbar";

/**
 * 테이블 컬럼 정의 인터페이스
 */
export interface DataColumn<T> {
    /** 컬럼 식별자 (데이터 객체의 키) */
    id: keyof T | string;
    /** 컬럼 헤더에 표시될 레이블 */
    label: string | React.ReactNode;
    /** 컬럼 너비 (px 또는 %) */
    width?: string | number;
    /** 정렬 가능 여부 */
    sortable?: boolean;
    /** 텍스트 정렬 방향 */
    align?: "left" | "center" | "right";
    /** 추가 스타일 */
    style?: React.CSSProperties;
    /** 커스텀 렌더링 함수 */
    render?: (item: T, index: number) => React.ReactNode;
    /** 그룹 헤더명 */
    group?: string;
}

/** 정렬 방향 타입 */
export type SortDirection = "asc" | "desc";

export interface SortableFilter {
    sortBy?: string;
    sortDirection?: SortDirection;
}

/**
 * 데이터 기반 가상화 테이블 컴포넌트 Props
 */
export interface VirtualDataTableProps<T> {
    /** 표시할 데이터 배열 */
    data: T[];
    /** 총 데이터 개수 */
    totalCount: number;
    /** 로딩 상태 */
    loading?: boolean;
    /** 더 많은 데이터가 있는지 여부 */
    hasMore?: boolean;
    /** 테이블 컬럼 정의 */
    columns: DataColumn<T>[];
    /** 행 클릭 이벤트 핸들러 */
    onRowClick?: (item: T, index: number) => void;
    /** 행 높이 (px) */
    rowHeight?: number;
    /** 정렬 이벤트 핸들러 */
    onSort?: (columnId: string, direction: SortDirection) => void;
    /** 더 많은 데이터 로드 요청 핸들러 */
    onLoadMore?: (offset: number, limit: number) => void;
    /** 현재 정렬 상태 */
    sortBy?: string;
    sortDirection?: SortDirection;
    showPaper?: boolean;
}

/**
 * 데이터 기반 무한 스크롤 및 가상화를 지원하는 테이블 컴포넌트
 */
function VirtualDataTableComponent<T>({
    data,
    loading = false,
    hasMore = false,
    columns,
    onRowClick,
    rowHeight = 50,
    onSort,
    onLoadMore,
    sortBy,
    sortDirection,
    showPaper = true,
}: VirtualDataTableProps<T>) {
    // console.log("VirtualDataTable 렌더링:", {
    //     dataLength: data.length,
    //     totalCount,
    //     hasMore,
    //     loading,
    //     columnsLength: columns.length,
    // });

    // 로딩 상태 관리
    const [internalLoading, setInternalLoading] = useState(loading);

    // 로딩 상태 변경 감지
    useEffect(() => {
        if (loading) {
            // 로딩이 시작되면 즉시 표시
            setInternalLoading(true);
        } else {
            // 로딩이 끝나도 internalLoading은 handleLoadingComplete에서만 false로 설정
            // Loading 컴포넌트에서는 visible={false}로 페이드아웃을 시작함
        }
    }, [loading]);

    // 로딩 완료 핸들러 - Loading 컴포넌트의 페이드아웃이 완료된 후 호출됨
    const handleLoadingComplete = useCallback(() => {
        setInternalLoading(false);
    }, []);

    // 초기 로딩 스피너 표시 조건
    const shouldShowInitialLoading = internalLoading;

    // 무한 스크롤 로딩 상태 (기존 VirtualDataTable 방식)
    const isLoadingMoreRef = useRef(false);

    // 드래그 스크롤 상태 (ref로만 관리하여 불필요한 리렌더링 방지)
    const isDraggingRef = useRef(false); // 드래그 중 여부
    const dragStartRef = useRef({ x: 0, y: 0, scrollTop: 0 }); // 드래그 시작 위치
    const isMouseDownRef = useRef(false); // 마우스 버튼 누름 여부
    const scrollContainerRef = useRef<HTMLElement | null>(null); // 스크롤 컨테이너 요소
    const initialScrollTopRef = useRef(0); // 드래그 시작 시 스크롤 위치
    const totalDragDistanceRef = useRef(0); // 누적 드래그 거리

    /**
     * 마우스 버튼 누름 이벤트 핸들러
     * 드래그 스크롤 기능의 시작점
     */
    const handleMouseDown = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (e.button !== 0) return; // 왼쪽 마우스 버튼만 처리

            const scrollElement = scrollContainerRef.current;
            if (!scrollElement) return;

            // 드래그 상태 초기화
            isDraggingRef.current = false;
            isMouseDownRef.current = true;

            // 드래그 시작 시점의 정보 저장
            const currentScrollTop = scrollElement.scrollTop;
            initialScrollTopRef.current = currentScrollTop;
            totalDragDistanceRef.current = 0;

            dragStartRef.current = {
                x: e.clientX,
                y: e.clientY,
                scrollTop: currentScrollTop,
            };
        },
        []
    );

    /**
     * 마우스 이동 이벤트 핸들러
     * 드래그 스크롤 기능의 핵심 로직
     */
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isMouseDownRef.current || !scrollContainerRef.current) return;

        const deltaY = e.clientY - dragStartRef.current.y;
        const threshold = 5; // 드래그 감지 임계값

        // 임계값을 넘어야 드래그로 인식
        if (!isDraggingRef.current && Math.abs(deltaY) > threshold) {
            isDraggingRef.current = true;

            // DOM 스타일 직접 변경 (리렌더링 방지)
            if (scrollContainerRef.current) {
                scrollContainerRef.current.style.userSelect = "none";
                scrollContainerRef.current.style.webkitUserSelect = "none";
            }
        }

        if (isDraggingRef.current) {
            // 드래그 거리 누적
            const dragDelta = deltaY * 2; // 감도 조절
            totalDragDistanceRef.current += -dragDelta; // 드래그 방향과 반대

            // 스크롤 위치 계산 (초기 위치 + 누적 드래그 거리)
            const scrollContainer = scrollContainerRef.current;
            const newScrollTop = Math.max(
                0,
                initialScrollTopRef.current + totalDragDistanceRef.current
            );

            // 스크롤 위치 설정
            scrollContainer.scrollTop = newScrollTop;

            // 드래그 시작점 업데이트 (연속적인 드래그를 위해)
            dragStartRef.current.y = e.clientY;
            e.preventDefault();
        }
    }, []);

    /**
     * 마우스 버튼 해제 이벤트 핸들러
     * 드래그 스크롤 종료 및 상태 초기화
     */
    const handleMouseUp = useCallback(() => {
        isMouseDownRef.current = false;

        // 드래그가 진행되었다면 최종 스크롤 위치 계산 및 설정
        if (isDraggingRef.current && scrollContainerRef.current) {
            const finalScrollTop = Math.max(
                0,
                initialScrollTopRef.current + totalDragDistanceRef.current
            );

            // 스크롤 위치를 여러 번 강제로 설정하여 확실히 고정
            const setScrollPosition = () => {
                if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTop = finalScrollTop;
                }
            };

            // 즉시 설정 및 지연 설정 (스크롤 안정화)
            setScrollPosition();
            setTimeout(setScrollPosition, 1);
            setTimeout(setScrollPosition, 5);
            setTimeout(setScrollPosition, 10);
        }

        // 드래그 상태 초기화 (리렌더링 방지를 위해 ref만 사용)
        isDraggingRef.current = false;
        totalDragDistanceRef.current = 0;

        // DOM 스타일 초기화
        if (scrollContainerRef.current) {
            scrollContainerRef.current.style.userSelect = "auto";
            scrollContainerRef.current.style.webkitUserSelect = "auto";
        }
    }, []);

    // 정렬이 변경될 때 모든 TableSortLabel의 hover 상태 초기화
    useEffect(() => {
        // sortBy가 변경되면 모든 TableSortLabel 요소의 hover 상태를 강제로 초기화
        const tableContainer = document.querySelector(
            '[data-testid="virtuoso-scroller"]'
        );
        if (tableContainer) {
            const sortLabels = tableContainer.querySelectorAll(
                ".MuiTableSortLabel-root"
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
        [onSort, sortBy, sortDirection]
    );

    // 가상화 스크롤 범위 변경 감지 핸들러 (기존 VirtualDataTable 방식)
    const handleRangeChange = useCallback(
        (range: { startIndex: number; endIndex: number }) => {
            // 더 이상 로드할 데이터가 없으면 중단
            if (!hasMore) {
                return;
            }

            // 이미 로딩 중이면 중단 (초기 로딩만 체크, 더 가져오기 로딩은 허용)
            if (loading && data.length === 0) {
                return;
            }

            // 추가 안전장치: 너무 빠른 연속 호출 방지 (100ms 내 중복 호출 무시)
            const now = Date.now();
            const lastTime = (window as any).lastRangeChangeTime || 0;
            if (now - lastTime < 100) {
                return;
            }
            (window as any).lastRangeChangeTime = now;

            // 더 보수적인 조건: 85% 지점에서 로드 (기존 VirtualDataTable 방식)
            const bufferSize = Math.max(10, Math.floor(data.length * 0.15)); // 데이터의 15% 또는 최소 10개
            const shouldLoadMore = range.endIndex >= data.length - bufferSize;

            // 추가 조건: 최소 30개 이상의 데이터에서만 더 가져오기 실행
            const hasMinimumData = data.length >= 30;

            if (
                shouldLoadMore &&
                hasMinimumData &&
                onLoadMore &&
                !isLoadingMoreRef.current
            ) {
                isLoadingMoreRef.current = true;
                const offset = data.length;
                const limit = 50;

                console.debug("VirtualDataTable: 더 많은 데이터 로드 요청", {
                    offset,
                    limit,
                    range,
                    dataLength: data.length,
                    bufferSize,
                    endIndex: range.endIndex,
                    threshold: data.length - bufferSize,
                });

                onLoadMore(offset, limit);
            }
        },
        [data.length, hasMore, loading, onLoadMore]
    );

    // 로딩 상태가 변경되면 isLoadingMoreRef 업데이트 (기존 VirtualDataTable 방식)
    useEffect(() => {
        if (!loading) {
            isLoadingMoreRef.current = false;
        }
    }, [loading]);

    /**
     * 전역 마우스 이벤트 리스너 설정
     * 드래그가 테이블 영역을 벗어나도 동작하도록 document에 이벤트 리스너 등록
     */
    useEffect(() => {
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

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
                                backgroundColor: "#ffffff",
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
                                        onClick={() =>
                                            handleSort(String(col.id))
                                        }
                                    >
                                        {col.label}
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
                                col.label
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
                        backgroundColor: "#ffffff",
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
                                {col.label}
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
                        col.label
                    )}
                </TableCell>
            )),
            ...Object.entries(groupMap).map(([group, cols]) => (
                <TableCell
                    key={group}
                    align="center"
                    colSpan={cols.length}
                    style={{
                        backgroundColor: "#ffffff",
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
                            backgroundColor: "#ffffff",
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
                                    {col.label}
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
                            col.label
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
    }, [columns, sortBy, sortDirection, handleSort, onSort]);

    /**
     * 테이블 행 컨텐츠 렌더링 함수 (기존 VirtualDataTable 스타일)
     * 각 데이터 항목에 대한 셀 내용을 정의
     */
    const rowContent = useCallback(
        (index: number, item: T) => {
            // console.log("rowContent 렌더링:", { index, item: item ? "있음" : "없음" });

            if (!item) {
                console.log("rowContent - 아이템 없음, 인덱스:", index);
                return null;
            }

            return (
                <>
                    {columns.map((column) => (
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
                            {column.render
                                ? column.render(item, index)
                                : String((item as any)[column.id] || "")}
                        </TableCell>
                    ))}
                </>
            );
        },
        [columns]
    );

    // 테이블 컴포넌트 정의 (기존 VirtualDataTable 스타일)
    const VirtuosoTableComponents: TableComponents<T> = useMemo(
        () => ({
            // 스크롤 컨테이너 (VirtuosoScrollbar 사용)
            Scroller: forwardRef<HTMLDivElement>((props, ref) => (
                <VirtuosoScrollbar>
                    <TableContainer
                        component={Box}
                        {...props}
                        ref={(node) => {
                            scrollContainerRef.current = node as HTMLElement;
                            if (typeof ref === "function") {
                                ref(node as HTMLDivElement);
                            } else if (ref) {
                                ref.current = node as HTMLDivElement;
                            }
                        }}
                        onMouseDown={handleMouseDown}
                        sx={{
                            userSelect: "auto",
                            WebkitUserSelect: "auto",
                            position: "relative",
                            // 기본 스크롤바 완전히 숨김
                            overflow: "auto",
                            scrollbarWidth: "none", // Firefox
                            msOverflowStyle: "none", // IE/Edge
                            "& .MuiTable-root": {
                                paddingRight: "16px",
                            },
                        }}
                    />
                </VirtuosoScrollbar>
            )),
            // 테이블 컴포넌트
            Table: (props) => (
                <Table
                    {...props}
                    sx={{
                        borderCollapse: "separate",
                        tableLayout: "fixed",
                        marginRight: "16px",
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
                                height: 56, // 헤더 높이 고정 (Material-UI 기본값)
                                "& th": {
                                    padding: "16px",
                                    backgroundColor: "#ffffff",
                                    position: "sticky",
                                    top: 0,
                                    zIndex: 2,
                                    fontWeight: "bold",
                                },
                            },
                        }}
                    />
                )
            ),
            // 테이블 행 (클릭 이벤트 및 호버 효과 포함)
            TableRow: forwardRef<HTMLTableRowElement, any>((props, ref) => {
                const { item, ...rest } = props as any;
                return (
                    <MuiTableRow
                        {...rest}
                        ref={ref}
                        onClick={() => {
                            if (!isDraggingRef.current && item && onRowClick) {
                                onRowClick(item, props.index || 0);
                            }
                        }}
                        onMouseEnter={(
                            e: React.MouseEvent<HTMLTableRowElement>
                        ) => {
                            // 행 클릭 가능한 경우에만 포인터 커서 표시
                            if (onRowClick) {
                                e.currentTarget.style.cursor = "pointer";
                            }
                        }}
                        onMouseLeave={(
                            e: React.MouseEvent<HTMLTableRowElement>
                        ) => {
                            // 기본 커서로 복원
                            e.currentTarget.style.cursor = "";
                        }}
                        sx={{
                            userSelect: "none",
                            height: rowHeight,
                            "& td, & th": { padding: "8px 16px" },
                            "&:hover": onRowClick
                                ? {
                                      backgroundColor: "#E3EEFA",
                                      transition: "background-color 0.2s ease",
                                  }
                                : {},
                        }}
                    />
                );
            }),
            // 테이블 바디
            TableBody: forwardRef<HTMLTableSectionElement>((props, ref) => (
                <MuiTableBody {...props} ref={ref} />
            )),
        }),
        [onRowClick, rowHeight, handleMouseDown]
    );

    // 데이터가 없을 때 표시할 컴포넌트 (기존 VirtualDataTable 방식)
    // 이 부분은 제거하고 return 부분에서 조건부 렌더링으로 처리

    // console.log("VirtualDataTable - 테이블 컴포넌트 렌더링", {
    //     dataLength: data.length,
    //     firstItem: data[0],
    //     columnsLength: columns.length,
    //     firstColumn: columns[0],
    //     loading,
    // });

    // 공통 테이블 내용
    const tableContent = (
        <Box sx={{ position: "relative", height: "100%", width: "100%" }}>
            {/* 데이터가 있고 로딩이 완료된 경우에만 테이블 표시 */}
            <TableVirtuoso
                data={data}
                totalCount={hasMore ? data.length + 1 : data.length}
                fixedHeaderContent={fixedHeaderContent}
                itemContent={rowContent}
                rangeChanged={handleRangeChange}
                components={VirtuosoTableComponents}
                style={{ height: "100%" }}
                increaseViewportBy={{ top: 100, bottom: 300 }}
                overscan={5}
            />

            {/* 빈 데이터 표시 */}
            {data.length === 0 && !loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <EmptyDataIcon />
                    <div className="font-suit" style={{ color: "#777777" }}>
                        NO DATA
                    </div>
                </div>
            )}

            {/* 초기 로딩 스피너 */}
            {shouldShowInitialLoading && (
                <div
                    className="absolute flex items-center justify-center"
                    style={{
                        top: "56px", // 헤더 높이만큼 아래에서 시작
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 10,
                    }}
                >
                    <Loading
                        visible={loading}
                        exitDelay={100}
                        onComplete={handleLoadingComplete}
                    />
                </div>
            )}
        </Box>
    );

    return showPaper ? (
        <Paper className="grow" style={{ padding: 0, paddingLeft: "1rem" }}>
            {tableContent}
        </Paper>
    ) : (
        tableContent
    );
}

export const VirtualDataTable = memo(VirtualDataTableComponent) as <T>(
    props: VirtualDataTableProps<T>
) => React.JSX.Element;
