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
import type { SxProps, Theme } from "@mui/material";
import { OverlayScrollbarProps } from "@ehfuse/overlay-scrollbar";

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
    footer?: (data: T[]) => React.ReactNode; // 하단 합계(tfoot) 셀 렌더링 함수 (전체 표시 데이터 전달)
    footerColSpan?: number; // 하단 합계 셀이 차지할 컬럼 수 (이만큼 뒤 컬럼의 footer 셀은 생략됨)
    /**
     * 가로로 밀어도 왼쪽에 붙어 있는 열. 붙는 자리는 앞쪽 고정 열들의 width 합이라 고정 열은 width 를 숫자(px)로 준다.
     * 여러 앞 열(지원사업 · 대상자 …)을 함께 세워 두는 넓은 표에서 쓴다.
     */
    pinned?: "left";
    /** 머리 칸(th)에 그대로 얹을 속성 — 끌어서 열 순서 바꾸기(draggable · onDrop …)나 title 같은 것. style 은 기본 머리 모양 위에 덮인다. */
    headerProps?: Omit<React.ThHTMLAttributes<HTMLTableCellElement>, "align">;
    /** 본문 칸의 줄마다 다른 스타일(완료 줄 흐리게 · 칸 바탕 등). column.style 위에 덮인다. */
    cellStyle?: (item: T, index: number) => React.CSSProperties;
    /**
     * 본문 칸 안쪽 여백. 주면 기본(variant 별) 여백 대신 이 값을 쓴다 — 칸 안에 단추를 꽉 채워 넣는 열(회차 칸 등)처럼
     * 여백을 따로 줘야 하는 열에 쓴다.
     */
    cellPadding?: string | number;
    /** 줄의 대표 칸(이름 · 제목) — 본문 글자를 15px 로 키운다. 화면마다 첫 칸에 fontSize 15 를 적던 것을 대신한다. */
    primary?: boolean;
    /**
     * 칸 하나를 누르는 표(근태 주간 · 예약 아젠다 — 칸마다 다른 날 · 사람). 주면 그 칸에 호버 바탕이 생기고, 누르면 이 함수만 불린다
     * (줄의 onRowClick 은 불리지 않는다).
     */
    onCellClick?: (item: T, index: number, event: React.MouseEvent) => void;
    /**
     * 칸을 아래 줄까지 합친다 — 그 줄에서 합칠 줄 수를 돌려주고, 위 칸에 덮인 줄에서는 0 을 돌려준다(칸을 그리지 않는다).
     * 가상화로 보이는 줄만 그리면 덮은 칸이 사라질 수 있어 autoHeight 표 · 줄이 적은 표에서만 쓴다.
     */
    rowSpan?: (item: T, index: number) => number;
    /**
     * 칸을 오른쪽 열까지 합친다(1.3.0) — 그 줄에서 합칠 열 수를 돌려준다(1 = 합치지 않음). 덮인 오른쪽 열의 칸은 그리지 않는다.
     * 줄마다 칸 구성이 다른 표(일정 줄은 책임자 · 참조자 두 칸을 참석자 한 칸으로)에서 쓴다.
     */
    colSpan?: (item: T, index: number) => number;
    /**
     * width 를 비운 열(남는 폭을 나눠 갖는 열)의 최소 폭 px(1.3.0). 표의 최소 폭은 열마다 width(숫자) 또는 minWidth 의 합이 되고,
     * 틀이 그보다 좁으면 가로로 민다 — 제목처럼 남는 폭을 다 가져가되 좁은 화면에서 0 으로 접히면 안 되는 열.
     */
    minWidth?: number;
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

/** 뷰포트 바깥 미리 렌더링 버퍼 범위 타입이다. */
export interface ViewportBuffer {
    top?: number;
    bottom?: number;
}

/** 가상화 렌더링 overscan 범위 타입이다. */
export interface VDTOverscan {
    main?: number;
    reverse?: number;
}

/**
 * 데이터 기반 가상화 테이블 컴포넌트 Props
 */
export interface VirtualDataTableProps<T> {
    data: T[]; // 표시할 데이터 배열
    totalCount: number; // 총 데이터 개수
    loading?: boolean; // 로딩 상태
    columns: DataColumn<T>[]; // 테이블 컬럼 정의
    onRowClick?: (item: T, index: number) => void; // 행 클릭 이벤트 핸들러
    getRowId?: (item: T, index: number) => string | number; // 행 식별자 반환 함수
    selectedRowId?: string | number | null; // 강조 표시할 선택 행 식별자
    selectedRowSx?:
        | SxProps<Theme>
        | ((item: T, index: number) => SxProps<Theme>); // 선택 행 스타일 (기본값: 없음)
    rowHeight?: number; // 행 높이 (px)
    columnHeight?: number; // 컬럼 헤더 높이 (px, 기본값: 56)
    striped?: string | boolean; // Zebra striping (true: 기본 회색, string: 지정 색상, false: 없음)
    rowDivider?: boolean; // 행 구분선 표시 여부 (기본값: true)
    onSort?: (columnId: string, direction: SortDirection) => void; // 정렬 이벤트 핸들러
    onLoadMore?: (offset: number, limit: number) => void; // 더 많은 데이터 로드 요청 핸들러
    sortBy?: string; // 현재 정렬 필드
    sortDirection?: SortDirection; // 현재 정렬 방향
    showPaper?: boolean; // Paper 컴포넌트 표시 여부
    paddingX?: string | number; // 테이블 좌우 패딩 (기본값: "1rem")
    paddingTop?: string | number; // 테이블 상단 패딩 (기본값: 0)
    paddingBottom?: string | number; // 테이블 하단 패딩 (기본값: 0)
    rowHoverColor?: string; // 행 hover 시 배경색 (기본값: "#000000", 다크 모드에서 밝기만 자동 반전)
    rowHoverOpacity?: number; // 행 hover 시 배경 투명도 0-1 (기본값: 0.06)
    viewportBuffer?: number | ViewportBuffer; // 뷰포트 위/아래 미리 렌더링 버퍼 px (기본값: rowHeight 기반 자동 계산)
    overscan?: number | VDTOverscan; // 가상화 overscan 범위 px (기본값: rowHeight 기반 자동 계산)
    scrollbars?: VDTOverlayScrollbarProps; // 스크롤바 커스터마이징 옵션
    emptyMessage?: string | React.ReactNode; // 데이터가 없을 때 표시할 메시지 (기본값: "NO DATA")
    LoadingComponent?: React.ComponentType<{
        visible?: boolean;
        onComplete?: () => void;
    }>; // 외부 Loading 컴포넌트
    showFooter?: boolean; // 하단 합계 행(tfoot) 표시 여부 (기본값: 컬럼에 footer 가 하나라도 있으면 자동 표시)
    footerHeight?: number; // 하단 합계 행 높이 (px, 기본값: rowHeight)
    footerSx?: SxProps<Theme>; // 하단 합계 행(tfoot) 스타일
    /**
     * 표 생김새. "notion" 은 @ehfuse/taskbox 목록표와 같은 노션풍이다 — 낮은 머리(40px)·13px 회색 머리글·칸 사이 세로선·
     * 옅은 가로선·단색 호버. 업무함 표와 나란히 쓰이는 목록(전자결재·게시판)이 다른 제품처럼 보이지 않게 둔 값이다.
     * 기본값 "default" 는 종전 모양 그대로다. columnHeight·paddingX·rowHoverColor 를 따로 주면 그 값이 이긴다.
     */
    variant?: "default" | "notion";
    /**
     * 노션풍 바깥 틀(1px 테두리 · 4px 모서리 · 종이 사방 여백)을 그린다(기본 true). 이미 테두리를 두른 상자 안에 표를 꽉 채워 넣을 때 false —
     * 테두리 · 여백 없이 표만 그리고 표 바탕을 종이 색으로 칠한다.
     */
    framed?: boolean;
    /**
     * 줄 높이 방식. "fixed"(기본)는 모든 줄을 rowHeight 로 박는다(합계 줄 떨림 방지). "auto" 는 rowHeight 를 최소 높이로 두고
     * 내용(여러 줄 글 · 칸 안 단추 두 줄)만큼 늘어난다.
     */
    rowHeightMode?: "fixed" | "auto";
    /**
     * 열 폭 방식. "fixed"(기본)는 column.width 대로, "auto" 는 내용에 맞춰 열 폭이 정해지고 표가 틀보다 넓어지면 가로로 민다.
     * 열 수가 데이터마다 달라지는 표(피벗 · 월별 표)에서 쓴다. 가상화로 보이는 줄만 그리므로 줄이 아주 많은 표에는 맞지 않는다.
     */
    tableLayout?: "fixed" | "auto";
    /**
     * 이 줄을 칸 나눔 없이 한 칸(모든 열 병합)으로 그린다 — 묶음 머리 줄(업체 이름 · 소계)처럼. null/undefined 를 돌려주면 보통 줄이다.
     * 누르면 onRowClick 이 같은 item 으로 불린다(접기 · 펴기는 소비처가).
     */
    renderFullWidthRow?: (item: T, index: number) => React.ReactNode | null | undefined;
    /** renderFullWidthRow 줄의 칸(td) 스타일 — 바탕색 · 여백. */
    fullWidthRowSx?: SxProps<Theme>;
    /**
     * 표 자체 스크롤 없이 내용 높이만큼 그린다(가상화 없음) — 페이지에 얹어 페이지가 굴리는 표(근태 표 등).
     * 머리 줄은 페이지 기준으로 붙지 않는다(가로로 넘치면 표 상자가 옆으로 민다). onLoadMore 는 쓰지 않는다.
     */
    autoHeight?: boolean;
    /** 줄 우클릭 — 끌어서 민 뒤가 아니면 부른다. */
    onRowContextMenu?: (item: T, index: number, event: React.MouseEvent) => void;
    /**
     * 머리 줄 바로 아래 붙어 스크롤과 무관하게 늘 보이는 줄들(1.3.0) — "미확인 · 검수 대기" 처럼 놓치면 안 되는 줄을 목록 위에 세운다.
     * 본문(data)과 같은 열 · 칸 렌더 · 묶음 띠 줄(renderFullWidthRow) · 클릭 · 우클릭 · 선택 줄 모양을 쓴다(onRowClick 의 index 는 이 배열 안의 순번).
     * 같은 줄을 data 에도 넣으면 두 번 보이니 소비처가 뺀다.
     */
    pinnedRows?: T[];
    /** pinnedRows 영역의 최대 높이 px — 넘치면 그 영역만 따로 굴린다(기본: 제한 없음). */
    pinnedRowsMaxHeight?: number;
    /** pinnedRows 영역(본문과의 경계선 등) 스타일. 기본은 노션풍 진한 회색 아랫선 1px. */
    pinnedRowsSx?: SxProps<Theme>;
    /**
     * data 가 "바뀌면"(길이가 줄거나 첫 줄이 달라지면) 맨 위로 되돌릴지(기본 true). 묶음 접기 · 완료 숨기기처럼 줄이 빠져도
     * 보던 자리를 지켜야 하는 목록은 false 로 두고, 조건이 바뀔 때 맨 위로 보내려면 표에 key 를 바꿔 다시 그린다(1.3.0).
     */
    resetScrollOnDataChange?: boolean;
    /**
     * 줄의 React key 를 getRowId 값으로 둔다(기본 false = 순번). 줄 안에 입력 중인 칸(인라인 편집)이 있는 목록은 켠다 —
     * 순번 key 면 위에 줄이 끼어들 때 입력 상태가 다른 줄로 옮겨 간다(1.3.0). getRowId 가 줄마다 달라야 한다.
     */
    rowKeyFromId?: boolean;
    /** 목록 끝에 닿을 때마다 부른다(1.3.0) — onLoadMore 와 달리 최소 개수 · 같은 길이 재요청 막기 없이 그대로 알린다(소비처가 중복을 거른다). */
    onEndReached?: () => void;
    /**
     * 노션풍 색 모드(1.3.0). 기본은 MUI 테마의 palette.mode 를 따른다 — 앱 테마는 밝은데 이 화면만 어둡게 그리는 경우(업무함 다크 스위치) 준다.
     */
    colorMode?: "light" | "dark";
}
