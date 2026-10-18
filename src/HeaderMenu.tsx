/**
 * HeaderMenu.tsx - 표 머리 메뉴 공용 부품(1.5.0)
 *
 * MIT License — Copyright (c) 2025 KIM YOUNG JIN (ehfuse@gmail.com)
 *
 * 머리 칸의 정렬 · 거르기 메뉴를 한 벌로 둔다. 화면마다(고객 · 계약 · 업무함 · 월별 표 …) 메뉴를 따로 만들어
 * 글자 크기 · 줄 높이 · 체크 모양이 제각각이었다(고객 목록 메뉴만 글자가 컸다). 크기 규칙은 이 파일의 상수 한 곳에서 정한다 —
 * 항목 글자 14px · 아이콘 18px · 줄 높이 34px · 좌우 여백 12px. 표의 내장 머리 메뉴(열 옵션 filterOptions)도 이 부품으로 그린다.
 */

import React, { useMemo, useState } from "react";
import { Box, Divider, InputBase, Menu, MenuItem, SvgIcon, type SxProps, type Theme } from "@mui/material";

/** 메뉴 크기 규칙 — 모든 머리 메뉴가 같은 값을 쓴다. */
export const HEADER_MENU_FONT_SIZE = 14;
export const HEADER_MENU_ICON_SIZE = 18;
export const HEADER_MENU_ITEM_HEIGHT = 34;

/** 메뉴 아이콘(Material 경로) — @mui/icons-material 을 의존성으로 들이지 않으려고 경로만 옮겨 둔다. */
export const HEADER_MENU_ICON_PATHS = {
    asc: "M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z",
    desc: "M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z",
    checked: "M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
    unchecked: "M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z",
    radioOn: "M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z",
    radioOff: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z",
    filter: "M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z",
    search: "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
};

/** 경로 하나로 그린 아이콘 — 크기 기본은 메뉴 아이콘 크기. */
export function HeaderMenuIcon({ d, size = HEADER_MENU_ICON_SIZE, color }: { d: string; size?: number; color?: string }) {
    return (
        <SvgIcon sx={{ fontSize: size, flexShrink: 0, color }}>
            <path d={d} />
        </SvgIcon>
    );
}

/**
 * 머리 칸의 거르기 표시(1.5.1) — @ehfuse/mui-filter-button 의 TuneIcon(선 두 줄 + 동그라미 두 개)과 같은 그림이다(출처: mui-filter-button
 * src/icons/TuneIcon.tsx). 머리 줄 필터 단추와 머리 칸 거르기가 같은 물건으로 읽히게 그 아이콘을 쓰되, 표가 그 패키지에 기대지 않게 경로를 옮겨 둔다.
 * 색은 글자색을 따른다(currentColor) — 평소 머리 글자색, 걸리면 강조색(active). 14px 에서는 1.5 굵기가 정렬 화살표(채운 아이콘)보다 가늘어 보여 1.8 로 둔다.
 */
export function HeaderFilterIcon({ size = 14, active, color }: { size?: number; active?: boolean; color?: string }) {
    const stroke = { stroke: "currentColor", strokeWidth: 1.8, strokeMiterlimit: 10, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
    return (
        <Box
            component="svg"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
            sx={{ width: size, height: size, flexShrink: 0, color: active ? "primary.main" : color ?? "currentColor", verticalAlign: "middle" }}
        >
            <path d="M2 17.5H7" {...stroke} />
            <path d="M22 6.5H17" {...stroke} />
            <path d="M13 17.5H22" {...stroke} />
            <path d="M11 6.5H2" {...stroke} />
            <path d="M10 20.3999C8.34315 20.3999 7 19.0568 7 17.3999C7 15.743 8.34315 14.3999 10 14.3999C11.6569 14.3999 13 15.743 13 17.3999C13 19.0568 11.6569 20.3999 10 20.3999Z" {...stroke} />
            <path d="M14 9.3999C15.6569 9.3999 17 8.05676 17 6.3999C17 4.74305 15.6569 3.3999 14 3.3999C12.3431 3.3999 11 4.74305 11 6.3999C11 8.05676 12.3431 9.3999 14 9.3999Z" {...stroke} />
        </Box>
    );
}

/** 항목 모양 — 다른 메뉴(도구 줄 단추 메뉴 등)도 이 sx 로 같은 크기를 쓴다. */
export const HEADER_MENU_ITEM_SX = {
    gap: 1,
    fontSize: HEADER_MENU_FONT_SIZE,
    // 높이는 줄 높이 + 위아래 여백으로 정한다(20 + 7 + 7 = 34) — MenuItem 의 넓은 화면 규칙(min-height: auto)이 미디어 쿼리라
    // sx 의 minHeight 를 이겨 28px 로 줄었다(1.5.2).
    lineHeight: "20px",
    minHeight: HEADER_MENU_ITEM_HEIGHT,
    py: "7px",
    px: 1.5,
} as const;

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
export function HeaderMenuItem({ icon, iconSpace, selected, disabled, muted, onClick, sx, children }: HeaderMenuItemProps) {
    return (
        <MenuItem
            selected={selected}
            disabled={disabled}
            onClick={onClick}
            sx={[HEADER_MENU_ITEM_SX, muted ? { color: "text.secondary" } : {}, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
        >
            {icon ?? (iconSpace ? <Box component="span" sx={{ width: HEADER_MENU_ICON_SIZE, flexShrink: 0 }} /> : null)}
            {children}
        </MenuItem>
    );
}

/** 메뉴 칸 나누는 선 — 위아래 여백을 줄인다(기본 8px 은 34px 줄 사이에서 헐겁다). */
export function HeaderMenuDivider() {
    return <Divider sx={{ my: "4px !important" }} />;
}

/** 머리 칸(또는 단추) 바로 아래 왼쪽 자리 — 메뉴는 요소가 아니라 좌표에 띄운다(표가 머리 칸을 다시 붙여도 메뉴가 튀지 않게). */
export function headerMenuAnchor(element: Element, x?: number): { left: number; top: number } {
    const rect = element.getBoundingClientRect();
    return { left: x ?? rect.left, top: rect.bottom };
}

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
    anchorPosition?: { left: number; top: number } | null;
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
export function HeaderMenu({
    open,
    anchorPosition,
    anchorEl,
    onClose,
    sort,
    filter,
    header,
    children,
    minWidth = 180,
    maxHeight = 420,
}: HeaderMenuProps) {
    const [query, setQuery] = useState("");
    const multiple = filter?.multiple !== false;
    const picked = filter?.value ?? [];
    const options = useMemo(() => {
        if (!filter) return [];
        const list = filter.options;
        return filter.emptyLabel && !list.some((option) => option.value === "")
            ? [...list, { value: "", label: filter.emptyLabel }]
            : list;
    }, [filter]);
    const searchable = Boolean(filter) && (filter?.searchable ?? options.length > 10);
    const keyword = query.trim().toLowerCase();
    const shown = keyword ? options.filter((option) => option.label.toLowerCase().includes(keyword)) : options;
    const close = () => {
        setQuery("");
        onClose();
    };

    const items: React.ReactNode[] = [];
    // 머리 · 덧붙일 항목은 Fragment 로 감싸지 않고 풀어 넣는다 — MUI Menu 는 Fragment 자식을 받지 않는다(개발 모드 경고, 1.5.3).
    if (header) items.push(...React.Children.toArray(header).map((node, i) => (React.isValidElement(node) ? React.cloneElement(node, { key: `h${i}` }) : node)));
    if (sort) {
        const pickSort = (direction: HeaderMenuSortDirection) => {
            close();
            sort.onChange(sort.active === direction && sort.clearable !== false ? null : direction);
        };
        items.push(
            <HeaderMenuItem
                key="sort-asc"
                selected={sort.active === "asc"}
                onClick={() => pickSort("asc")}
                icon={<HeaderMenuIcon d={HEADER_MENU_ICON_PATHS.asc} color="text.secondary" />}
            >
                오름차순 정렬
            </HeaderMenuItem>,
            <HeaderMenuItem
                key="sort-desc"
                selected={sort.active === "desc"}
                onClick={() => pickSort("desc")}
                icon={<HeaderMenuIcon d={HEADER_MENU_ICON_PATHS.desc} color="text.secondary" />}
            >
                내림차순 정렬
            </HeaderMenuItem>,
        );
        if (sort.active && sort.clearable !== false) {
            items.push(
                <HeaderMenuItem
                    key="sort-clear"
                    muted
                    iconSpace
                    onClick={() => {
                        close();
                        sort.onChange(null);
                    }}
                >
                    정렬 풀기
                </HeaderMenuItem>,
            );
        }
    }
    if (sort && filter) items.push(<HeaderMenuDivider key="div-sort" />);
    if (filter) {
        if (searchable) {
            items.push(
                <Box
                    key="search"
                    // 메뉴의 글자 찾아 가기(type-ahead)가 입력을 가로채지 않게 키는 여기서 멈춘다.
                    onKeyDown={(event) => event.stopPropagation()}
                    sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, pb: 0.5, minHeight: HEADER_MENU_ITEM_HEIGHT }}
                >
                    <HeaderMenuIcon d={HEADER_MENU_ICON_PATHS.search} color="text.secondary" />
                    <InputBase
                        autoFocus
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={filter.searchPlaceholder ?? "찾기"}
                        sx={{ flex: 1, fontSize: HEADER_MENU_FONT_SIZE }}
                    />
                </Box>,
            );
        }
        if (!multiple && filter.allLabel) {
            items.push(
                <HeaderMenuItem
                    key="f-all"
                    selected={picked.length === 0}
                    onClick={() => {
                        close();
                        filter.onChange([]);
                    }}
                    icon={<HeaderMenuIcon d={picked.length === 0 ? HEADER_MENU_ICON_PATHS.radioOn : HEADER_MENU_ICON_PATHS.radioOff} color={picked.length === 0 ? "primary.main" : "text.disabled"} />}
                >
                    {filter.allLabel}
                </HeaderMenuItem>,
            );
        }
        if (options.length === 0) {
            items.push(
                <HeaderMenuItem key="f-none" disabled iconSpace>
                    {filter.emptyText ?? "고를 값이 없습니다."}
                </HeaderMenuItem>,
            );
        }
        shown.forEach((option) => {
            const on = picked.includes(option.value);
            const toggle = () => {
                if (multiple) {
                    filter.onChange(on ? picked.filter((item) => item !== option.value) : [...picked, option.value]);
                    return;
                }
                close();
                filter.onChange(on ? [] : [option.value]);
            };
            const mark = multiple
                ? on
                    ? HEADER_MENU_ICON_PATHS.checked
                    : HEADER_MENU_ICON_PATHS.unchecked
                : on
                  ? HEADER_MENU_ICON_PATHS.radioOn
                  : HEADER_MENU_ICON_PATHS.radioOff;
            items.push(
                <HeaderMenuItem
                    key={`f:${option.value || "(empty)"}`}
                    selected={!multiple && on}
                    onClick={toggle}
                    icon={<HeaderMenuIcon d={mark} color={on ? "primary.main" : "text.disabled"} />}
                >
                    {option.icon}
                    <Box component="span" sx={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {option.render ?? option.label}
                    </Box>
                    {typeof option.count === "number" ? (
                        <Box component="span" sx={{ color: "text.secondary", ml: 1, fontVariantNumeric: "tabular-nums" }}>
                            {option.count}
                        </Box>
                    ) : null}
                </HeaderMenuItem>,
            );
        });
        if (searchable && keyword && shown.length === 0) {
            items.push(
                <HeaderMenuItem key="f-nohit" disabled iconSpace>
                    찾는 값이 없습니다.
                </HeaderMenuItem>,
            );
        }
        // 걸려 있을 때만 — 하나씩 끄지 않고 한 번에 푼다.
        if (picked.length > 0) {
            items.push(
                <HeaderMenuDivider key="div-filter" />,
                <HeaderMenuItem
                    key="f-clear"
                    muted
                    iconSpace
                    onClick={() => {
                        close();
                        filter.onChange([]);
                    }}
                >
                    {filter.clearLabel ?? "거르기 풀기"}
                </HeaderMenuItem>,
            );
        }
    }
    if (children) {
        if (items.length > 0) items.push(<HeaderMenuDivider key="div-children" />);
        items.push(...React.Children.toArray(children));
    }

    const useAnchorEl = !anchorPosition && Boolean(anchorEl);
    return (
        <Menu
            open={open && (Boolean(anchorPosition) || Boolean(anchorEl))}
            {...(useAnchorEl
                ? { anchorEl }
                : { anchorReference: "anchorPosition" as const, anchorPosition: anchorPosition ?? undefined })}
            onClose={close}
            transitionDuration={0}
            // 찾기 칸이 있으면 첫 항목 대신 그 칸에 초점을 둔다.
            disableAutoFocusItem={searchable}
            // 메뉴 안 우클릭에도 브라우저 메뉴를 띄우지 않는다. 누르기가 표(머리 칸 정렬)로 올라가지 않게 막는다.
            onContextMenu={(event) => event.preventDefault()}
            onClick={(event) => event.stopPropagation()}
            slotProps={{ paper: { sx: { maxHeight, minWidth } }, list: { sx: { py: 0.5 } } }}
        >
            {items}
        </Menu>
    );
}
