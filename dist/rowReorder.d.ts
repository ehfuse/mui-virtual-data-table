/**
 * rowReorder.tsx — 줄 끌어 옮기기(1.9.0)
 *
 * 첫 칸에 손잡이(⋮⋮)를 세우고, 손잡이를 끌면 놓을 자리에 선을 긋고 놓을 때 onReorder(from, to) 를 부른다. 표는 data 를 바꾸지 않는다 —
 * 소비처가 바꿔 넘기면 그대로 다시 그린다. 가상화 표에서도 되도록 줄 DOM 을 손대지 않는다: 끄는 동안은 포인터 아래 줄(elementFromPoint)의
 * 자리로 선 위치만 정하고, 끌던 줄은 data-vdt-dragging 속성으로 흐리게 보인다(React 재렌더 없음). 바깥 의존성(dnd-kit 등) 없이 포인터 이벤트로 한다.
 * 키보드: 손잡이에 초점 → Space(들기) → ↑ ↓ 로 한 칸씩(바로 onReorder) → Space · Enter · Esc 로 놓기.
 */
import React from "react";
import type { DataColumn, VDTRowReorderConfig } from "./types";
/** 손잡이 열의 id — 소비처 열과 겹치지 않게 */
export declare const REORDER_COLUMN_ID = "__vdt_reorder";
export interface UseRowReorderArgs<T> {
    config: VDTRowReorderConfig<T> | undefined;
    tableBoxRef: React.RefObject<HTMLElement | null>;
    getScroller: () => HTMLElement | null;
    dataLengthRef: React.RefObject<number>;
    anyPinned: boolean;
}
/**
 * 끌어 옮기기 — 손잡이 열 · 손잡이 렌더 · 표 상자에 넣을 선 요소를 돌려준다.
 * 모든 포인터 처리는 ref 로 해 끄는 동안 React 가 다시 그리지 않는다.
 */
export declare function useRowReorder<T>({ config, tableBoxRef, getScroller, dataLengthRef, anyPinned }: UseRowReorderArgs<T>): {
    on: boolean;
    handleColumn: DataColumn<T> | null;
    renderHandle: (item: T, index: number) => React.ReactNode;
    indicator: import("react/jsx-runtime").JSX.Element | null;
};
