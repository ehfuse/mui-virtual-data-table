/**
 * rowReorder.tsx — 줄 끌어 옮기기(1.9.0)
 *
 * 첫 칸에 손잡이(⋮⋮)를 세우고, 손잡이를 끌면 놓을 자리에 선을 긋고 놓을 때 onReorder(from, to) 를 부른다. 표는 data 를 바꾸지 않는다 —
 * 소비처가 바꿔 넘기면 그대로 다시 그린다. 가상화 표에서도 되도록 줄 DOM 을 손대지 않는다: 끄는 동안은 포인터 아래 줄(elementFromPoint)의
 * 자리로 선 위치만 정하고, 끌던 줄은 data-vdt-dragging 속성으로 흐리게 보인다(React 재렌더 없음). 바깥 의존성(dnd-kit 등) 없이 포인터 이벤트로 한다.
 * 키보드: 손잡이에 초점 → Space(들기) → ↑ ↓ 로 한 칸씩(바로 onReorder) → Space · Enter · Esc 로 놓기.
 */
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import type { DataColumn, VDTRowReorderConfig } from "./types";

/** 손잡이 열의 id — 소비처 열과 겹치지 않게 */
export const REORDER_COLUMN_ID = "__vdt_reorder";
/** 자동 스크롤이 시작되는 가장자리 폭 px */
const EDGE_PX = 40;
/** 자동 스크롤 최대 속도 px/프레임 */
const EDGE_SPEED = 14;

/** 손잡이 그림(Material DragIndicator 경로) — @mui/icons-material 을 들이지 않으려고 경로만 둔다 */
const HANDLE_ICON = (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden focusable="false">
        <path fill="currentColor" d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
);

interface Drag {
    from: number; // 끌기 시작한 줄
    item: unknown;
    pointerId: number;
    x: number;
    y: number;
    to: number | null; // 놓으면 설 자리(data 순번) — null 이면 아직 모른다
    tr: HTMLElement | null; // 끌던 줄
}

/** 본문 줄들(고정 줄 제외) — 보이는 것만(가상화) */
const bodyRows = (box: HTMLElement) => Array.from(box.querySelectorAll<HTMLElement>("tbody tr[data-index]:not([data-vdt-pinned-row])"));

/** 가장 가까운 굴리는 조상(autoHeight 표가 쓴다) */
function nearestScrollable(el: HTMLElement | null): HTMLElement | null {
    for (let e = el; e; e = e.parentElement) {
        const { overflowY } = getComputedStyle(e);
        if ((overflowY === "auto" || overflowY === "scroll") && e.scrollHeight > e.clientHeight) return e;
    }
    return null;
}

export interface UseRowReorderArgs<T> {
    config: VDTRowReorderConfig<T> | undefined;
    tableBoxRef: React.RefObject<HTMLElement | null>; // 표 상자(position: relative) — 선을 이 안에 그린다
    getScroller: () => HTMLElement | null; // 표를 굴리는 요소(없으면 문서)
    dataLengthRef: React.RefObject<number>;
    anyPinned: boolean; // 고정 열이 있으면 손잡이 열도 고정한다(아니면 고정 열이 손잡이를 덮는다)
}

/**
 * 끌어 옮기기 — 손잡이 열 · 손잡이 렌더 · 표 상자에 넣을 선 요소를 돌려준다.
 * 모든 포인터 처리는 ref 로 해 끄는 동안 React 가 다시 그리지 않는다.
 */
export function useRowReorder<T>({ config, tableBoxRef, getScroller, dataLengthRef, anyPinned }: UseRowReorderArgs<T>) {
    const configRef = useRef(config);
    configRef.current = config;
    const on = Boolean(config);
    const dragRef = useRef<Drag | null>(null);
    const rafRef = useRef(0);
    const indicatorRef = useRef<HTMLDivElement | null>(null);
    const liftedRef = useRef<number | null>(null); // 키보드로 든 줄

    const hideIndicator = () => {
        if (indicatorRef.current) indicatorRef.current.style.display = "none";
    };

    /** 포인터 자리로 놓을 자리를 정하고 선을 긋는다 */
    const updateTarget = useCallback(() => {
        const d = dragRef.current;
        const box = tableBoxRef.current;
        if (!d || !box) return;
        const rows = bodyRows(box);
        if (rows.length === 0) return;
        const under = document.elementFromPoint(d.x, d.y)?.closest<HTMLElement>("tr[data-index]");
        let row: HTMLElement | null = under && box.contains(under) && !under.hasAttribute("data-vdt-pinned-row") ? under : null;
        let edge: "before" | "after";
        if (row) {
            const r = row.getBoundingClientRect();
            edge = d.y < r.top + r.height / 2 ? "before" : "after";
        } else {
            const first = rows[0].getBoundingClientRect();
            const last = rows[rows.length - 1].getBoundingClientRect();
            if (d.y < first.top) {
                row = rows[0];
                edge = "before";
            } else if (d.y > last.bottom) {
                row = rows[rows.length - 1];
                edge = "after";
            } else return; // 줄 사이 틈(구분선) — 지난 자리를 지킨다
        }
        const idx = Number(row.dataset.index);
        const insertAt = edge === "before" ? idx : idx + 1;
        const to = insertAt > d.from ? insertAt - 1 : insertAt;
        d.to = to;
        const ind = indicatorRef.current;
        if (!ind) return;
        if (to === d.from) {
            ind.style.display = "none";
            return;
        }
        const r = row.getBoundingClientRect();
        const b = box.getBoundingClientRect();
        const y = (edge === "before" ? r.top : r.bottom) - b.top;
        ind.style.top = `${Math.max(0, Math.min(b.height - 2, Math.round(y) - 1))}px`;
        ind.style.display = "block";
    }, [tableBoxRef]);

    /** 가장자리 자동 스크롤 — 포인터가 끝 가까이에 있는 동안 프레임마다 굴린다 */
    const autoScroll = useCallback(() => {
        cancelAnimationFrame(rafRef.current);
        const step = () => {
            const d = dragRef.current;
            if (!d) return;
            const scroller = getScroller() ?? nearestScrollable(tableBoxRef.current) ?? null;
            const target: HTMLElement | null = scroller ?? (document.scrollingElement as HTMLElement | null);
            if (!target) return;
            const top = scroller ? scroller.getBoundingClientRect().top : 0;
            const bottom = scroller ? scroller.getBoundingClientRect().bottom : window.innerHeight;
            let dy = 0;
            if (d.y < top + EDGE_PX) dy = -Math.ceil(((top + EDGE_PX - d.y) / EDGE_PX) * EDGE_SPEED);
            else if (d.y > bottom - EDGE_PX) dy = Math.ceil(((d.y - (bottom - EDGE_PX)) / EDGE_PX) * EDGE_SPEED);
            if (dy !== 0) {
                target.scrollTop += dy;
                updateTarget();
                rafRef.current = requestAnimationFrame(step);
            }
        };
        rafRef.current = requestAnimationFrame(step);
    }, [getScroller, tableBoxRef, updateTarget]);

    const finish = useCallback(
        (commit: boolean) => {
            const d = dragRef.current;
            if (!d) return;
            dragRef.current = null;
            cancelAnimationFrame(rafRef.current);
            hideIndicator();
            d.tr?.removeAttribute("data-vdt-dragging");
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
            if (commit && d.to !== null && d.to !== d.from) configRef.current?.onReorder(d.from, d.to, d.item as T);
        },
        [],
    );

    // 창 단위 이벤트 — 끄는 동안만 듣는다(포인터를 손잡이가 붙잡아도 window 까지 올라온다)
    useEffect(() => {
        if (!on) return;
        const move = (e: PointerEvent) => {
            const d = dragRef.current;
            if (!d || e.pointerId !== d.pointerId) return;
            d.x = e.clientX;
            d.y = e.clientY;
            updateTarget();
            autoScroll();
        };
        const up = (e: PointerEvent) => {
            const d = dragRef.current;
            if (!d || e.pointerId !== d.pointerId) return;
            finish(e.type === "pointerup");
        };
        const key = (e: KeyboardEvent) => {
            if (e.key === "Escape" && dragRef.current) finish(false);
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
        window.addEventListener("pointercancel", up);
        window.addEventListener("keydown", key);
        return () => {
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", up);
            window.removeEventListener("pointercancel", up);
            window.removeEventListener("keydown", key);
            finish(false);
        };
    }, [on, updateTarget, autoScroll, finish]);

    /** 키보드로 든 줄 표시를 다시 붙인다(줄이 다시 그려진 뒤) */
    const markLifted = useCallback(
        (index: number | null) => {
            const box = tableBoxRef.current;
            if (!box) return;
            box.querySelectorAll("tbody tr[data-vdt-dragging]").forEach((tr) => tr.removeAttribute("data-vdt-dragging"));
            box.querySelectorAll(".vdt-reorder-handle[aria-pressed=\"true\"]").forEach((h) => h.setAttribute("aria-pressed", "false"));
            if (index === null) return;
            const tr = box.querySelector<HTMLElement>(`tbody tr[data-index="${index}"]:not([data-vdt-pinned-row])`);
            tr?.setAttribute("data-vdt-dragging", "");
            tr?.querySelector(".vdt-reorder-handle")?.setAttribute("aria-pressed", "true");
        },
        [tableBoxRef],
    );

    const onHandlePointerDown = useCallback(
        (e: React.PointerEvent<HTMLButtonElement>, index: number, item: T) => {
            e.stopPropagation();
            if (e.button !== 0 && e.pointerType === "mouse") return;
            if (configRef.current?.disabledReason) return;
            const tr = e.currentTarget.closest<HTMLElement>("tr");
            if (tr?.hasAttribute("data-vdt-pinned-row")) return;
            e.preventDefault();
            if (liftedRef.current !== null) {
                liftedRef.current = null;
                markLifted(null);
            }
            try {
                e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
                /* 포인터를 못 붙잡아도 window 이벤트로 이어 간다 */
            }
            dragRef.current = { from: index, item, pointerId: e.pointerId, x: e.clientX, y: e.clientY, to: null, tr };
            tr?.setAttribute("data-vdt-dragging", "");
            document.body.style.cursor = "grabbing";
            document.body.style.userSelect = "none";
        },
        [markLifted],
    );

    const onHandleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLButtonElement>, index: number, item: T) => {
            const cfg = configRef.current;
            if (!cfg || cfg.disabledReason) return;
            const lifted = liftedRef.current;
            if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                liftedRef.current = lifted === null ? index : null;
                markLifted(liftedRef.current);
                return;
            }
            if (e.key === "Escape" && lifted !== null) {
                e.preventDefault();
                liftedRef.current = null;
                markLifted(null);
                return;
            }
            if ((e.key === "ArrowUp" || e.key === "ArrowDown") && lifted !== null) {
                e.preventDefault();
                e.stopPropagation();
                const to = Math.max(0, Math.min((dataLengthRef.current ?? 1) - 1, index + (e.key === "ArrowUp" ? -1 : 1)));
                if (to === index) return;
                cfg.onReorder(index, to, item);
                liftedRef.current = to;
                // 줄이 다시 그려진 뒤 옮긴 줄의 손잡이로 초점을 옮기고 든 표시를 다시 붙인다
                requestAnimationFrame(() =>
                    requestAnimationFrame(() => {
                        const box = tableBoxRef.current;
                        const h = box?.querySelector<HTMLButtonElement>(`tbody tr[data-index="${to}"]:not([data-vdt-pinned-row]) .vdt-reorder-handle`);
                        h?.focus({ preventScroll: false });
                        markLifted(to);
                    }),
                );
            }
        },
        [dataLengthRef, markLifted, tableBoxRef],
    );

    /** 손잡이 단추 — 칸 · 폰 카드가 함께 쓴다 */
    const renderHandle = useCallback(
        (item: T, index: number): React.ReactNode => {
            const cfg = configRef.current;
            if (!cfg) return null;
            if (cfg.canDrag && !cfg.canDrag(item, index)) return null;
            const label = cfg.handleLabel ?? "순서 옮기기";
            return (
                <button
                    type="button"
                    className="vdt-reorder-handle"
                    aria-label={label}
                    title={cfg.disabledReason ?? label}
                    disabled={Boolean(cfg.disabledReason)}
                    onPointerDown={(e) => onHandlePointerDown(e, index, item)}
                    onKeyDown={(e) => onHandleKeyDown(e, index, item)}
                    // 줄 누름(onRowClick) · 끌어서 굴리기 감지로 번지지 않게
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    onContextMenu={(e) => e.stopPropagation()}
                >
                    {HANDLE_ICON}
                </button>
            );
        },
        [onHandlePointerDown, onHandleKeyDown],
    );

    const handleWidth = config?.handleWidth ?? 36;
    // 막는 이유가 바뀌면 열을 새로 만들어 줄이 다시 그려지게 한다 — 손잡이의 disabled · title 은 그릴 때 읽는다
    const disabledReason = config?.disabledReason;
    /** 표 맨 앞에 끼울 손잡이 열 — 폰 카드에서는 열 대신 카드 왼쪽에 손잡이를 세운다(mobile: false) */
    const handleColumn = useMemo<DataColumn<T> | null>(
        () =>
            on
                ? {
                      id: REORDER_COLUMN_ID,
                      text: "",
                      width: handleWidth,
                      align: "center",
                      cellPadding: 0,
                      headerMenu: false,
                      mobile: false,
                      ...(anyPinned ? { pinned: "left" as const } : {}),
                      render: renderHandle,
                  }
                : null,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [on, handleWidth, anyPinned, renderHandle, disabledReason],
    );

    /** 놓을 자리 선 — 표 상자(position: relative) 안에 둔다 */
    const indicator = on ? (
        <div
            ref={indicatorRef}
            data-vdt-drop-indicator=""
            aria-hidden
            style={{ position: "absolute", left: 0, right: 0, height: 2, display: "none", zIndex: 4, pointerEvents: "none" }}
        />
    ) : null;

    return { on, handleColumn, renderHandle, indicator };
}
