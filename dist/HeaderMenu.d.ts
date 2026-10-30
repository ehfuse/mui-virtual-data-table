/**
 * HeaderMenu.tsx - 표 머리 메뉴 공용 부품(1.5.0)
 *
 * MIT License — Copyright (c) 2025 KIM YOUNG JIN (ehfuse@gmail.com)
 *
 * 머리 칸의 정렬 · 거르기 메뉴를 한 벌로 둔다. 화면마다(고객 · 계약 · 업무함 · 월별 표 …) 메뉴를 따로 만들어
 * 글자 크기 · 줄 높이 · 체크 모양이 제각각이었다(고객 목록 메뉴만 글자가 컸다). 크기 규칙은 이 파일의 상수 한 곳에서 정한다 —
 * 항목 글자 14px · 아이콘 18px · 줄 높이 34px · 좌우 여백 12px. 표의 내장 머리 메뉴(열 옵션 filterOptions)도 이 부품으로 그린다.
 */
import React from "react";
import { type SxProps, type Theme } from "@mui/material";
/** 메뉴 크기 규칙 — 모든 머리 메뉴가 같은 값을 쓴다. */
export declare const HEADER_MENU_FONT_SIZE = 14;
export declare const HEADER_MENU_ICON_SIZE = 18;
export declare const HEADER_MENU_ITEM_HEIGHT = 34;
/** 메뉴 아이콘(Material 경로) — @mui/icons-material 을 의존성으로 들이지 않으려고 경로만 옮겨 둔다. */
export declare const HEADER_MENU_ICON_PATHS: {
    asc: string;
    desc: string;
    checked: string;
    unchecked: string;
    radioOn: string;
    radioOff: string;
    filter: string;
    search: string;
};
/** 경로 하나로 그린 아이콘 — 크기 기본은 메뉴 아이콘 크기. */
export declare function HeaderMenuIcon({ d, size, color }: {
    d: string;
    size?: number;
    color?: string;
}): import("react/jsx-runtime").JSX.Element;
/**
 * 머리 칸의 거르기 표시(1.5.1) — @ehfuse/mui-filter-button 의 TuneIcon(선 두 줄 + 동그라미 두 개)과 같은 그림이다(출처: mui-filter-button
 * src/icons/TuneIcon.tsx). 머리 줄 필터 단추와 머리 칸 거르기가 같은 물건으로 읽히게 그 아이콘을 쓰되, 표가 그 패키지에 기대지 않게 경로를 옮겨 둔다.
 * 색은 글자색을 따른다(currentColor) — 평소 머리 글자색, 걸리면 강조색(active). 14px 에서는 1.5 굵기가 정렬 화살표(채운 아이콘)보다 가늘어 보여 1.8 로 둔다.
 */
export declare function HeaderFilterIcon({ size, active, color }: {
    size?: number;
    active?: boolean;
    color?: string;
}): import("react/jsx-runtime").JSX.Element;
/** 항목 모양 — 다른 메뉴(도구 줄 단추 메뉴 등)도 이 sx 로 같은 크기를 쓴다. */
export declare const HEADER_MENU_ITEM_SX: {
    readonly gap: 1;
    readonly fontSize: 14;
    readonly lineHeight: "20px";
    readonly minHeight: 34;
    readonly py: "7px";
    readonly px: 1.5;
};
export interface HeaderMenuItemProps {
    /** 앞 아이콘 자리(18px). 없으면 비우지 않는다 — 아이콘 줄을 맞추려면 iconSpace 를 켠다. */
    icon?: React.ReactNode;
    /** 아이콘이 없는 줄도 아이콘 폭만큼 비워 글자 줄을 맞춘다. */
    iconSpace?: boolean;
    selected?: boolean;
    disabled?: boolean;
    /** 흐린 글자(풀기 · 해제 같은 보조 동작). */
    muted?: boolean;
    onClick?: (event: React.MouseEvent<HTMLLIElement>) => void;
    sx?: SxProps<Theme>;
    children?: React.ReactNode;
}
/** 머리 메뉴 항목 한 줄 — 크기 규칙(14px · 34px)을 지킨 MenuItem. */
export declare function HeaderMenuItem({ icon, iconSpace, selected, disabled, muted, onClick, sx, children }: HeaderMenuItemProps): import("react/jsx-runtime").JSX.Element;
/** 메뉴 칸 나누는 선 — 위아래 여백을 줄인다(기본 8px 은 34px 줄 사이에서 헐겁다). */
export declare function HeaderMenuDivider(): import("react/jsx-runtime").JSX.Element;
/** 머리 칸(또는 단추) 바로 아래 왼쪽 자리 — 메뉴는 요소가 아니라 좌표에 띄운다(표가 머리 칸을 다시 붙여도 메뉴가 튀지 않게). */
export declare function headerMenuAnchor(element: Element, x?: number): {
    left: number;
    top: number;
};
export type HeaderMenuSortDirection = "asc" | "desc";
/** 고를 값 하나. render 를 주면 글자 자리에 그대로 그린다(색 칩 · 아바타 + 이름). */
export interface HeaderMenuOption {
    value: string;
    label: string;
    /** 글자 앞에 붙는 작은 표시(색 점 · 아바타). */
    icon?: React.ReactNode;
    /** 글자 자리를 통째로 바꾼다(색 칩). 찾기는 label 로 한다. */
    render?: React.ReactNode;
    /** 오른쪽 옅은 숫자(그 값의 줄 수). */
    count?: number;
}
export interface HeaderMenuSortConfig {
    /** 지금 이 칸의 정렬 방향(이 칸으로 정렬 중이 아니면 null). */
    active: HeaderMenuSortDirection | null | undefined;
    /** 고른 방향 — 풀면 null. */
    onChange: (direction: HeaderMenuSortDirection | null) => void;
    /** "정렬 풀기" 항목을 둔다(정렬 중일 때만 보인다). 같은 방향을 다시 고르면 풀린다. 기본 true. */
    clearable?: boolean;
}
export interface HeaderMenuFilterConfig {
    options: HeaderMenuOption[];
    /** 지금 고른 값들(빈 배열 = 거르지 않음). */
    value: string[];
    onChange: (values: string[]) => void;
    /** 여러 개 고르기(체크 목록, 기본) / false = 하나만(라디오, 고르면 닫힌다). */
    multiple?: boolean;
    /** 값 ""(비어 있음) 항목을 끝에 더한다 — 그 이름. options 에 "" 가 이미 있으면 더하지 않는다. */
    emptyLabel?: string;
    /** 하나 고르기에서 맨 위 "전체" 항목(고르면 값 []). */
    allLabel?: string;
    /** 맨 위 찾기 칸 — 기본: 값이 10개를 넘으면. */
    searchable?: boolean;
    searchPlaceholder?: string;
    /** 풀기 항목 이름(기본 "거르기 풀기"). 걸려 있을 때만 보인다. */
    clearLabel?: string;
    /** 고를 값이 없을 때 글(기본 "고를 값이 없습니다."). */
    emptyText?: string;
}
export interface HeaderMenuProps {
    open: boolean;
    /** 띄울 자리(좌표) — headerMenuAnchor(요소) 로 만든다. anchorEl 보다 이것을 권한다. */
    anchorPosition?: {
        left: number;
        top: number;
    } | null;
    /** 요소에 붙여 띄울 때(요소가 다시 붙지 않는 곳만). */
    anchorEl?: HTMLElement | null;
    onClose: () => void;
    sort?: HeaderMenuSortConfig;
    filter?: HeaderMenuFilterConfig;
    /** 정렬 · 거르기 앞에 둘 항목(HeaderMenuItem 들). */
    header?: React.ReactNode;
    /** 맨 뒤에 둘 항목(HeaderMenuItem 들 · 범위 입력 등). */
    children?: React.ReactNode;
    minWidth?: number;
    maxHeight?: number;
}
/**
 * 머리 메뉴 — 정렬(오름 · 내림 · 풀기) · 값 거르기(여러 개 체크 / 하나 라디오 · 비어 있음 · 찾기 · 풀기)를 필요한 것만 그린다.
 * 누른 자리에서 바로 뜬다(transitionDuration 0 — 펼침 애니메이션은 메뉴가 늦게 따라오는 것처럼 보인다).
 */
export declare function HeaderMenu({ open, anchorPosition, anchorEl, onClose, sort, filter, header, children, minWidth, maxHeight, }: HeaderMenuProps): import("react/jsx-runtime").JSX.Element;
