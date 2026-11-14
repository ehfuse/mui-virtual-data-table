/**
 * columnReorder.tsx — 머리 칸 길게 눌러 열 순서 바꾸기(1.12.0, 2026-11-14)
 *
 * 머리 칸(th)을 holdMs(기본 400ms) 동안 누르고 있으면 그 열을 들고, 좌우로 끌면 놓을 자리에 세로선을 긋고, 놓으면 새 순서를 알린다.
 * 누른 채 holdMs 전에 손이 THRESHOLD_PX 넘게 움직이면 끌기가 아니다 — 정렬 클릭 · 글자 고르기 · 손가락 굴리기가 예전 그대로 된다.
 * 끄는 동안은 th 속성 · 선 요소 style 만 바꾼다(React 가 다시 그리지 않는다). 놓을 때 한 번 새 순서를 넘긴다.
 * 옮길 수 없는 열: 줄 손잡이 열 · 고정 열(pinned) · reorderable: false 열(선택 칸 등). 묶음 머리(group)가 있으면 같은 묶음 안에서만 옮긴다.
 */
import React, { useCallback, useEffect, useRef } from "react";
import type { DataColumn, VDTColumnReorderConfig } from "./types";
import { REORDER_COLUMN_ID } from "./rowReorder";

/** 길게 누르기 기본 시간 ms */
const DEFAULT_HOLD_MS = 400;
/** 길게 누르기 전에 이만큼 움직이면 끌기를 그만둔다(클릭 · 고르기 · 굴리기로 본다) px */
const THRESHOLD_PX = 6;
/** 자동 가로 스크롤이 시작되는 가장자리 폭 px */
const EDGE_PX = 40;
/** 자동 가로 스크롤 최대 속도 px/프레임 */
const EDGE_SPEED = 14;
/** 끌기를 마친 뒤 뒤따르는 click 을 삼키는 시간 ms(터치는 click 이 늦게 온다) */
const SWALLOW_CLICK_MS = 400;

/** 열 키 — 순서 배열 · th 속성에 쓴다 */
export const columnKey = (col: DataColumn<unknown> | DataColumn<any>) => String(col.id);

/** 이 열을 옮길 수 있나 — 손잡이 열 · 고정 열 · reorderable: false 는 제자리 */
export function isColumnMovable<T>(col: DataColumn<T>): boolean {
    return col.id !== REORDER_COLUMN_ID && col.pinned !== "left" && col.reorderable !== false;
}

/**
 * 순서 배열을 열에 입힌다. 옮길 수 있는 열이 서 있던 자리들을, 같은 묶음(group) 안에서 순서 배열 순으로 다시 채운다 —
 * 순서 배열에 없는 열 · 옮길 수 없는 열은 제자리에 남고, 모르는 키는 버린다. 순서 배열이 같은 결과면 원래 배열을 그대로 돌려준다.
 */
export function applyColumnOrder<T>(columns: DataColumn<T>[], order: string[] | null | undefined): DataColumn<T>[] {
    if (!order || order.length === 0) return columns;
    const rank = new Map<string, number>();
    order.forEach((key, i) => {
        if (!rank.has(key)) rank.set(key, i);
    });
    const result = columns.slice();
    const groups = new Map<string, number[]>(); // 묶음 → 옮길 열이 선 자리들
    columns.forEach((col, i) => {
        if (!isColumnMovable(col) || !rank.has(columnKey(col))) return;
        const g = col.group ?? "";
        const slots = groups.get(g);
        if (slots) slots.push(i);
        else groups.set(g, [i]);
    });
    let changed = false;
    groups.forEach((slots) => {
        const sorted = slots
            .map((i) => columns[i])
            .sort((a, b) => (rank.get(columnKey(a)) as number) - (rank.get(columnKey(b)) as number));
        slots.forEach((slot, k) => {
            if (result[slot] !== sorted[k]) changed = true;
            result[slot] = sorted[k];
        });
    });
    return changed ? result : columns;
}

/** 가장 가까운 가로로 굴리는 조상 */
function nearestScrollableX(el: HTMLElement | null): HTMLElement | null {
    for (let e = el; e; e = e.parentElement) {
        const { overflowX } = getComputedStyle(e);
        if ((overflowX === "auto" || overflowX === "scroll") && e.scrollWidth > e.clientWidth) return e;
    }
    return null;
}

interface Pending {
    key: string;
    group: string;
    th: HTMLElement;
    pointerId: number;
    startX: number;
    startY: number;
    x: number;
    dragging: boolean; // 길게 누르기가 끝나 열을 들었나
    cancelled: boolean; // Esc 로 그만뒀다 — 놓을 때 click 만 삼킨다
    before: string | null; // 놓으면 이 열 앞에 선다(null 이면 끝 — afterLast)
    afterLast: string | null; // 같은 묶음 마지막 열 키
    timer: number;
}

export interface UseColumnReorderArgs<T> {
    /** 켜졌나(폰 목록이면 끈다) */
    on: boolean;
    config: VDTColumnReorderConfig | null;
    tableBoxRef: React.RefObject<HTMLElement | null>; // 표 상자(position: relative) — 선을 이 안에 그린다
    /** 지금 그려진 순서의 소비처 열(손잡이 열 제외) */
    columnsRef: React.RefObject<DataColumn<T>[]>;
    /** 놓았을 때 — 새 순서(모든 열 키) */
    onCommit: (order: string[]) => void;
}

/**
 * 머리 칸 길게 눌러 열 옮기기 — 머리 칸에 얹을 속성과 표 상자에 넣을 선 요소를 돌려준다.
 * 포인터 처리는 ref 로 해 끄는 동안 React 가 다시 그리지 않는다.
 */
export function useColumnReorder<T>({ on, config, tableBoxRef, columnsRef, onCommit }: UseColumnReorderArgs<T>) {
    const holdMs = config?.holdMs ?? DEFAULT_HOLD_MS;
    const holdMsRef = useRef(holdMs);
    holdMsRef.current = holdMs;
    const onCommitRef = useRef(onCommit);
    onCommitRef.current = onCommit;
    const pendingRef = useRef<Pending | null>(null);
    const indicatorRef = useRef<HTMLDivElement | null>(null);
    const rafRef = useRef(0);
    const detachRef = useRef<(() => void) | null>(null);

    /** 같은 묶음의 옮길 수 있는 머리 칸들(왼쪽부터) */
    const candidateCells = useCallback(
        (group: string) => {
            const box = tableBoxRef.current;
            if (!box) return [] as { key: string; th: HTMLElement; rect: DOMRect }[];
            return Array.from(box.querySelectorAll<HTMLElement>("thead th[data-vdt-colkey]"))
                .filter((th) => (th.getAttribute("data-vdt-colgroup") ?? "") === group)
                .map((th) => ({ key: th.getAttribute("data-vdt-colkey") as string, th, rect: th.getBoundingClientRect() }))
                .sort((a, b) => a.rect.left - b.rect.left);
        },
        [tableBoxRef],
    );

    /** 포인터 x 로 놓을 자리를 정하고 세로선을 긋는다 */
    const updateTarget = useCallback(() => {
        const p = pendingRef.current;
        const box = tableBoxRef.current;
        const ind = indicatorRef.current;
        if (!p || !p.dragging || !box) return;
        const cells = candidateCells(p.group);
        if (cells.length === 0) return;
        let idx = cells.findIndex((c) => p.x < c.rect.left + c.rect.width / 2);
        if (idx < 0) idx = cells.length;
        p.before = idx < cells.length ? cells[idx].key : null;
        p.afterLast = cells[cells.length - 1].key;
        // 제자리(자기 앞 · 자기 바로 뒤)면 선을 감춘다
        const self = cells.findIndex((c) => c.key === p.key);
        if (!ind) return;
        if (idx === self || idx === self + 1) {
            ind.style.display = "none";
            return;
        }
        const b = box.getBoundingClientRect();
        const x = idx < cells.length ? cells[idx].rect.left : cells[cells.length - 1].rect.right;
        ind.style.left = `${Math.max(0, Math.min(b.width - 2, Math.round(x - b.left) - 1))}px`;
        ind.style.display = "block";
    }, [tableBoxRef, candidateCells]);

    /** 가장자리 자동 가로 스크롤 — 넓은 표에서 보이지 않는 자리로 옮길 때 */
    const autoScroll = useCallback(() => {
        cancelAnimationFrame(rafRef.current);
        const step = () => {
            const p = pendingRef.current;
            if (!p || !p.dragging) return;
            const scroller = nearestScrollableX(p.th);
            if (!scroller) return;
            const r = scroller.getBoundingClientRect();
            let dx = 0;
            if (p.x < r.left + EDGE_PX) dx = -Math.ceil(((r.left + EDGE_PX - p.x) / EDGE_PX) * EDGE_SPEED);
            else if (p.x > r.right - EDGE_PX) dx = Math.ceil(((p.x - (r.right - EDGE_PX)) / EDGE_PX) * EDGE_SPEED);
            if (dx === 0) return;
            const before = scroller.scrollLeft;
            scroller.scrollLeft += dx;
            if (scroller.scrollLeft === before) return;
            updateTarget();
            rafRef.current = requestAnimationFrame(step);
        };
        rafRef.current = requestAnimationFrame(step);
    }, [updateTarget]);

    /** 끝 — 들었던 열이면 뒤따르는 click(정렬 · 머리 클릭)을 한 번 삼킨다 */
    const finish = useCallback((commit: boolean) => {
        const p = pendingRef.current;
        if (!p) return;
        pendingRef.current = null;
        window.clearTimeout(p.timer);
        cancelAnimationFrame(rafRef.current);
        detachRef.current?.();
        detachRef.current = null;
        if (indicatorRef.current) indicatorRef.current.style.display = "none";
        p.th.removeAttribute("data-vdt-col-dragging");
        tableBoxRef.current?.removeAttribute("data-vdt-col-reordering");
        if (!p.dragging) return;
        document.body.style.userSelect = "";
        if (commit) {
            const swallow = (ce: MouseEvent) => {
                ce.stopPropagation();
                ce.preventDefault();
                window.removeEventListener("click", swallow, true);
            };
            window.addEventListener("click", swallow, true);
            window.setTimeout(() => window.removeEventListener("click", swallow, true), SWALLOW_CLICK_MS);
            const target = p.before ?? null;
            if (target === p.key) return;
            const keys = (columnsRef.current ?? []).map((c) => String(c.id));
            const from = keys.indexOf(p.key);
            if (from < 0) return;
            const next = keys.slice();
            next.splice(from, 1);
            if (target !== null) {
                const at = next.indexOf(target);
                if (at < 0) return;
                next.splice(at, 0, p.key);
            } else {
                const at = p.afterLast ? next.indexOf(p.afterLast) : -1;
                if (at < 0) return;
                next.splice(at + 1, 0, p.key);
            }
            // 옮길 수 없는 열은 제자리 — 실제로 그려질 순서로 맞춰 알린다
            const ordered = applyColumnOrder(columnsRef.current ?? [], next).map((c) => String(c.id));
            if (ordered.join("\u0000") === keys.join("\u0000")) return;
            onCommitRef.current(ordered);
        }
    }, [tableBoxRef, columnsRef]);

    // 표가 사라지거나 기능이 꺼지면 하던 것을 접는다
    useEffect(() => {
        if (!on) finish(false);
        return () => finish(false);
    }, [on, finish]);

    /** 머리 칸 pointerdown — 길게 누르기를 잰다. 기본 동작(클릭 · 고르기)은 막지 않는다 */
    const onHeaderPointerDown = useCallback(
        (col: DataColumn<T>, e: React.PointerEvent<HTMLTableCellElement>) => {
            if (pendingRef.current) finish(false);
            if (e.pointerType === "mouse" && e.button !== 0) return;
            if (e.defaultPrevented) return;
            const target = e.target as HTMLElement | null;
            // 열 폭 손잡이 · 입력 칸은 제 일을 한다
            if (target?.closest?.("[data-vdt-resize], input, textarea, select, [contenteditable='true']")) return;
            const th = e.currentTarget;
            const p: Pending = {
                key: String(col.id),
                group: col.group ?? "",
                th,
                pointerId: e.pointerId,
                startX: e.clientX,
                startY: e.clientY,
                x: e.clientX,
                dragging: false,
                cancelled: false,
                before: null,
                afterLast: null,
                timer: 0,
            };
            pendingRef.current = p;

            const move = (ev: PointerEvent) => {
                if (ev.pointerId !== p.pointerId || pendingRef.current !== p) return;
                if (!p.dragging) {
                    if (Math.hypot(ev.clientX - p.startX, ev.clientY - p.startY) > THRESHOLD_PX) finish(false);
                    return;
                }
                if (p.cancelled) return;
                p.x = ev.clientX;
                updateTarget();
                autoScroll();
            };
            const up = (ev: PointerEvent) => {
                if (ev.pointerId !== p.pointerId || pendingRef.current !== p) return;
                // Esc 로 그만뒀어도 놓을 때 click 은 삼킨다(정렬이 되지 않게) — 순서는 그대로
                if (p.cancelled) p.before = p.key;
                finish(ev.type === "pointerup");
            };
            const key = (ev: KeyboardEvent) => {
                if (ev.key !== "Escape" || pendingRef.current !== p) return;
                if (!p.dragging) {
                    finish(false);
                    return;
                }
                ev.preventDefault();
                p.cancelled = true;
                if (indicatorRef.current) indicatorRef.current.style.display = "none";
                p.th.removeAttribute("data-vdt-col-dragging");
                tableBoxRef.current?.removeAttribute("data-vdt-col-reordering");
                cancelAnimationFrame(rafRef.current);
            };
            // 터치 길게 누르기는 브라우저 메뉴(머리 우클릭 메뉴)를 부른다 — 누르는 동안은 막는다
            const ctx = (ev: Event) => {
                if (pendingRef.current !== p) return;
                if (p.dragging || e.pointerType !== "mouse") {
                    ev.preventDefault();
                    ev.stopPropagation();
                }
            };
            // 든 뒤에는 손가락 굴리기 · 글자 고르기를 막는다
            const touchMove = (ev: TouchEvent) => {
                if (pendingRef.current === p && p.dragging) ev.preventDefault();
            };
            const selectStart = (ev: Event) => {
                if (pendingRef.current === p && p.dragging) ev.preventDefault();
            };
            window.addEventListener("pointermove", move);
            window.addEventListener("pointerup", up);
            window.addEventListener("pointercancel", up);
            window.addEventListener("keydown", key, true);
            window.addEventListener("contextmenu", ctx, true);
            window.addEventListener("touchmove", touchMove, { passive: false });
            document.addEventListener("selectstart", selectStart);
            detachRef.current = () => {
                window.removeEventListener("pointermove", move);
                window.removeEventListener("pointerup", up);
                window.removeEventListener("pointercancel", up);
                window.removeEventListener("keydown", key, true);
                window.removeEventListener("contextmenu", ctx, true);
                window.removeEventListener("touchmove", touchMove);
                document.removeEventListener("selectstart", selectStart);
            };

            p.timer = window.setTimeout(() => {
                if (pendingRef.current !== p) return;
                p.dragging = true;
                th.setAttribute("data-vdt-col-dragging", "");
                tableBoxRef.current?.setAttribute("data-vdt-col-reordering", "");
                document.body.style.userSelect = "none";
                try {
                    window.getSelection()?.removeAllRanges();
                } catch {
                    /* 고르기를 못 지워도 끌기는 이어 간다 */
                }
                updateTarget();
            }, holdMsRef.current);
        },
        [finish, updateTarget, autoScroll, tableBoxRef],
    );

    /** 머리 칸에 얹을 속성 — 옮길 수 없는 열이면 없다(소비처 headerProps 를 그대로 둔다) */
    const headerCellProps = useCallback(
        (col: DataColumn<T>): {
            "data-vdt-colkey"?: string;
            "data-vdt-colgroup"?: string;
            onPointerDown?: React.PointerEventHandler<HTMLTableCellElement>;
        } => {
            if (!on || !isColumnMovable(col)) return {};
            const own = col.headerProps?.onPointerDown;
            return {
                "data-vdt-colkey": String(col.id),
                "data-vdt-colgroup": col.group ?? "",
                onPointerDown: (e: React.PointerEvent<HTMLTableCellElement>) => {
                    own?.(e);
                    onHeaderPointerDown(col, e);
                },
            };
        },
        [on, onHeaderPointerDown],
    );

    /** 놓을 자리 세로선 — 표 상자(position: relative) 안에 둔다 */
    const indicator = on ? (
        <div
            ref={indicatorRef}
            data-vdt-col-drop-indicator=""
            aria-hidden
            style={{ position: "absolute", top: 0, bottom: 0, width: 2, display: "none", zIndex: 5, pointerEvents: "none" }}
        />
    ) : null;

    return { on, headerCellProps, indicator };
}
