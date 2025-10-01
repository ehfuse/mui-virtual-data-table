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
import { OverlayScrollbarProps } from "./OverlayScrollbar";

/**
 * 테이블 컬럼 정의 인터페이스
 */
export interface DataColumn<T> {
    id: keyof T | string; // 컬럼 식별자 (데이터 객체의 키)
    text: string | React.ReactNode; // 컬럼 헤더에 표시될 텍스트
    width?: string | number; // 컬럼 너비 (px 또는 %)
    sortable?: boolean; // 정렬 가능 여부
    align?: "left" | "center" | "right"; // 텍스트 정렬 방향
    style?: React.CSSProperties; // 추가 스타일
    render?: (item: T, index: number) => React.ReactNode; // 커스텀 렌더링 함수
    group?: string; // 그룹 헤더명
}

/** 정렬 방향 타입 */
export type SortDirection = "asc" | "desc";

export interface SortableFilter {
    sortBy?: string;
    sortDirection?: SortDirection;
}

/**
 * OverlayScrollbarProps에서 children을 제외한 타입
 */
export type VDTOverlayScrollbarProps = Omit<OverlayScrollbarProps, "children">;

/**
 * 데이터 기반 가상화 테이블 컴포넌트 Props
 */
export interface VirtualDataTableProps<T> {
    data: T[]; // 표시할 데이터 배열
    totalCount: number; // 총 데이터 개수
    loading?: boolean; // 로딩 상태
    hasMore?: boolean; // 더 많은 데이터가 있는지 여부
    columns: DataColumn<T>[]; // 테이블 컬럼 정의
    onRowClick?: (item: T, index: number) => void; // 행 클릭 이벤트 핸들러
    rowHeight?: number; // 행 높이 (px)
    onSort?: (columnId: string, direction: SortDirection) => void; // 정렬 이벤트 핸들러
    onLoadMore?: (offset: number, limit: number) => void; // 더 많은 데이터 로드 요청 핸들러
    sortBy?: string; // 현재 정렬 필드
    sortDirection?: SortDirection; // 현재 정렬 방향
    showPaper?: boolean; // Paper 컴포넌트 표시 여부
    scrollbars?: VDTOverlayScrollbarProps; // 스크롤바 커스터마이징 옵션
    LoadingComponent?: React.ComponentType<{
        visible?: boolean;
        onComplete?: () => void;
    }>; // 외부 Loading 컴포넌트
}
