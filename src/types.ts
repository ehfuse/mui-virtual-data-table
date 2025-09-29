/**
 * types.ts - Virtual Data Table Types
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

import React from "react";

/**
 * 테이블 컬럼 정의 인터페이스
 */
export interface DataColumn<T> {
    /** 컬럼 식별자 (데이터 객체의 키) */
    id: keyof T | string;
    /** 컬럼 헤더에 표시될 텍스트 */
    text: string | React.ReactNode;
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
    LoadingComponent?: React.ComponentType<{
        visible?: boolean;
        onComplete?: () => void;
    }>; // 외부 Loading 컴포넌트
}
