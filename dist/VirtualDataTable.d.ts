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
import React from "react";
import type { VirtualDataTableProps } from "./types";
/**
 * 데이터 기반 무한 스크롤 및 가상화를 지원하는 테이블 컴포넌트
 */
/**
 * 노션풍(variant="notion") 색 — @ehfuse/taskbox 의 목록표 팔레트(light: border/borderStrong/textSecondary/surfaceHover,
 * dark: 같은 이름의 다크 값)를 그대로 옮긴 것이다. 두 패키지가 서로를 참조하지 않아 값을 베껴 둔다 — 그쪽이 바뀌면 여기도 맞춘다.
 */
/**
 * 노션풍 선 색 하나(1.11.4) — 바깥 틀 · 머리줄 아래 · 칸 사이 선을 모두 이 색으로 그린다. 소비처가 표 밖의 선(달력 격자 등)도 같은 색으로 맞추게 내보낸다.
 * 1.11.3 에서 한 단계 진하게 했고(예전 #e6e6e3 · #dedddb 는 밝은 모니터에서 잘 안 보였다), 1.11.4 에서 두 단계를 하나로 합쳤다
 * (2026-11-03 사용자 지적 "머리 아래 선만 더 흐리다 — 통일").
 */
export declare const NOTION_LINE_COLOR = "#d9d8d5";
/** 어두운 화면의 노션풍 선 색. */
export declare const NOTION_LINE_COLOR_DARK = "#3b434e";
/**
 * 앱 전역 로딩 관문(1.11.0) — LoadingComponent 를 주지 않은 표 모두에 걸린다.
 * 관문은 { visible, onComplete, fallback } 을 받아, 기본 로딩 표시(fallback)를 그리거나 다른 것을 그린다.
 * visible 이 false 가 되면 onComplete 를 불러야 표가 로딩 표시를 걷는다(fallback 을 그렸으면 fallback 이 부른다).
 */
export interface VirtualDataTableLoadingGateProps {
    visible: boolean;
    onComplete: () => void;
    fallback: React.ReactNode;
}
export declare function setVirtualDataTableLoadingGate(gate: React.ComponentType<VirtualDataTableLoadingGateProps> | null): void;
export declare const VirtualDataTable: <T>(props: VirtualDataTableProps<T>) => React.JSX.Element;
