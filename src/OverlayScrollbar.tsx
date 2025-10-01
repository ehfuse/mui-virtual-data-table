/**
 * OverlayScrollbar.tsx
 *
 * @copyright 2025 KIM YOUNG JIN (ehfuse@gmail.com)
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

import React, {
    useRef,
    useEffect,
    useState,
    useCallback,
    useMemo,
    ReactNode,
    forwardRef,
    useImperativeHandle,
} from "react";
import { isTextInputElement } from "./utils/dragScrollUtils";

// thumb 관련 설정
export interface ThumbConfig {
    width?: number; // 썸의 너비 (기본가: 8px)
    minHeight?: number; // 썸의 최소 높이 (기본가: 50px)
    radius?: number; // 썸의 border-radius (기본가: width / 2)
    color?: string; // 썸 색상 (기본가: "#606060")
    opacity?: number; // 기본 투명도 (기본가: 0.6)
    hoverColor?: string; // 호버 시 색상 (기본값: color 동일)
    hoverOpacity?: number; // 호버 시 투명도 (기본가: 1.0)
}

// track 관련 설정
export interface TrackConfig {
    width?: number; // 호버 영역인 트랙의 너비 (기본값: 16px)
    color?: string; // 트랙 배경 색상 (기본값: "rgba(128, 128, 128, 0.1)")
    visible?: boolean; // 트랙 배경 표시 여부 (기본값: true)
    alignment?: "center" | "right"; // 트랙 내부 정렬 (기본가: "center")
    radius?: number; // 트랙 배경의 border-radius (기본값: thumb.radius 또는 4px)
    margin?: number; // 트랙 상하 마진 (기본값: 4px)
}

// arrows 관련 설정
export interface ArrowsConfig {
    visible?: boolean; // 화살표 표시 여부 (기본가: false)
    step?: number; // 화살표 클릭시 스크롤 이동 거리 (기본가: 50px)
    color?: string; // 화살표 색상 (기본가: "#808080")
    opacity?: number; // 기본 투명도 (기본가: 0.6)
    hoverColor?: string; // 호버 시 색상 (기본가: color 동일)
    hoverOpacity?: number; // 호버 시 투명도 (기본가: 1.0)
}

// 드래그 스크롤 관련 설정
export interface DragScrollConfig {
    enabled?: boolean; // 드래그 스크롤 활성화 여부 (기본값: true)
    excludeClasses?: string[]; // 드래그 스크롤을 제외할 추가 클래스들 (자신 또는 부모 요소 확인, 최대 5단계)
    excludeSelectors?: string[]; // 드래그 스크롤을 제외할 추가 CSS 셀렉터들 (element.matches() 사용)
}

// 자동 숨김 관련 설정
export interface AutoHideConfig {
    enabled?: boolean; // 자동 숨김 활성화 여부 (기본값: true)
    delay?: number; // 기본 자동 숨김 시간 (기본값: 1500ms)
    delayOnWheel?: number; // 휠 스크롤 후 자동 숨김 시간 (기본가: 700ms)
}

export interface OverlayScrollbarProps {
    className?: string;
    style?: React.CSSProperties;
    children: ReactNode;
    onScroll?: (event: Event) => void;

    // 그룹화된 설정 객체들
    thumb?: ThumbConfig; // 썸 관련 설정
    track?: TrackConfig; // 트랙 관련 설정
    arrows?: ArrowsConfig; // 화살표들 관련 설정
    dragScroll?: DragScrollConfig; // 드래그 스크롤 관련 설정
    autoHide?: AutoHideConfig; // 자동 숨김 관련 설정

    // 기타 설정들
    showScrollbar?: boolean; // 스크롤바 표시 여부 (기본값: true)
}

// OverlayScrollbar가 노출할 메서드들
export interface OverlayScrollbarRef {
    getScrollContainer: () => HTMLDivElement | null;
    scrollTo: (options: ScrollToOptions) => void;
    scrollTop: number;
    scrollHeight: number;
    clientHeight: number;
}

// 기본 설정 객체들을 컴포넌트 외부에 상수로 선언 (재렌더링 시 동일한 참조 유지)
const DEFAULT_THUMB_CONFIG: ThumbConfig = {};
const DEFAULT_TRACK_CONFIG: TrackConfig = {};
const DEFAULT_ARROWS_CONFIG: ArrowsConfig = {};
const DEFAULT_DRAG_SCROLL_CONFIG: DragScrollConfig = {};
const DEFAULT_AUTO_HIDE_CONFIG: AutoHideConfig = {};

const OverlayScrollbar = forwardRef<OverlayScrollbarRef, OverlayScrollbarProps>(
    (
        {
            className = "",
            style = {},
            children,
            onScroll,

            // 그룹화된 설정 객체들
            thumb = DEFAULT_THUMB_CONFIG,
            track = DEFAULT_TRACK_CONFIG,
            arrows = DEFAULT_ARROWS_CONFIG,
            dragScroll = DEFAULT_DRAG_SCROLL_CONFIG,
            autoHide = DEFAULT_AUTO_HIDE_CONFIG,

            // 기타 설정들
            showScrollbar = true,
        },
        ref
    ) => {
        // props 변경 추적용 ref
        const prevPropsRef = useRef<{
            children?: ReactNode;
            onScroll?: (event: Event) => void;
            showScrollbar?: boolean;
            thumb?: ThumbConfig;
            track?: TrackConfig;
            arrows?: ArrowsConfig;
            dragScroll?: DragScrollConfig;
            autoHide?: AutoHideConfig;
        }>({});

        // 렌더링 시 어떤 prop이 변경되었는지 체크
        useEffect(() => {
            const prev = prevPropsRef.current;
            const changes: string[] = [];

            if (prev.children !== children) changes.push("children");
            if (prev.onScroll !== onScroll) changes.push("onScroll");
            if (prev.showScrollbar !== showScrollbar)
                changes.push("showScrollbar");
            if (prev.thumb !== thumb) changes.push("thumb");
            if (prev.track !== track) changes.push("track");
            if (prev.arrows !== arrows) changes.push("arrows");
            if (prev.dragScroll !== dragScroll) changes.push("dragScroll");
            if (prev.autoHide !== autoHide) changes.push("autoHide");

            console.log("*** OverlayScrollbar 렌더링 ***", {
                hasChildren: !!children,
                showScrollbar,
                changedProps: changes.length > 0 ? changes : "none",
                timestamp: new Date().toISOString(),
            });

            // 현재 props 저장
            prevPropsRef.current = {
                children,
                onScroll,
                showScrollbar,
                thumb,
                track,
                arrows,
                dragScroll,
                autoHide,
            };
        });

        const containerRef = useRef<HTMLDivElement>(null);
        const contentRef = useRef<HTMLDivElement>(null);
        const scrollbarRef = useRef<HTMLDivElement>(null);
        const thumbRef = useRef<HTMLDivElement>(null);

        // 스크롤 컨테이너 캐싱용 ref (성능 최적화)
        const cachedScrollContainerRef = useRef<HTMLElement | null>(null);

        // 기본 상태들
        const [scrollbarVisible, setScrollbarVisible] = useState(false);
        const [isDragging, setIsDragging] = useState(false);
        const [isThumbHovered, setIsThumbHovered] = useState(false);
        const [dragStart, setDragStart] = useState({ y: 0, scrollTop: 0 });
        const [thumbHeight, setThumbHeight] = useState(0);
        const [thumbTop, setThumbTop] = useState(0);

        // 드래그 스크롤 상태
        const [isDragScrolling, setIsDragScrolling] = useState(false);
        const [dragScrollStart, setDragScrollStart] = useState({
            x: 0,
            y: 0,
            scrollTop: 0,
            scrollLeft: 0,
        });
        const [activeArrow, setActiveArrow] = useState<"up" | "down" | null>(
            null
        );
        const [hoveredArrow, setHoveredArrow] = useState<"up" | "down" | null>(
            null
        );

        // 초기 마운트 시 hover 방지용
        const [isInitialized, setIsInitialized] = useState(false);

        // 휠 스크롤 감지용
        const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null);
        const [isWheelScrolling, setIsWheelScrolling] = useState(false);

        // 숨김 타이머
        const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

        // 그룹화된 설정 객체들에 기본값 설정
        const finalThumbConfig = useMemo(() => {
            const baseColor = thumb.color ?? "#606060";
            return {
                width: thumb.width ?? 8,
                minHeight: thumb.minHeight ?? 50,
                radius: thumb.radius ?? (thumb.width ?? 8) / 2,
                color: baseColor,
                opacity: thumb.opacity ?? 0.6,
                hoverColor: thumb.hoverColor ?? baseColor,
                hoverOpacity: thumb.hoverOpacity ?? 1.0,
            };
        }, [thumb]);

        const finalTrackConfig = useMemo(
            () => ({
                width: track.width ?? 16,
                color: track.color ?? "rgba(128, 128, 128, 0.1)",
                visible: track.visible ?? true,
                alignment: track.alignment ?? "center",
                radius: track.radius ?? finalThumbConfig.radius ?? 4,
                margin: track.margin ?? 4,
            }),
            [track, finalThumbConfig.radius]
        );

        const finalArrowsConfig = useMemo(() => {
            const baseColor = arrows.color ?? "#808080";
            return {
                visible: arrows.visible ?? false,
                step: arrows.step ?? 50,
                color: baseColor,
                opacity: arrows.opacity ?? 0.6,
                hoverColor: arrows.hoverColor ?? baseColor,
                hoverOpacity: arrows.hoverOpacity ?? 1.0,
            };
        }, [arrows]);

        const finalDragScrollConfig = useMemo(
            () => ({
                enabled: dragScroll.enabled ?? true,
                excludeClasses: dragScroll.excludeClasses ?? [],
                excludeSelectors: dragScroll.excludeSelectors ?? [],
            }),
            [dragScroll]
        );

        const finalAutoHideConfig = useMemo(
            () => ({
                enabled: autoHide.enabled ?? true,
                delay: autoHide.delay ?? 1500,
                delayOnWheel: autoHide.delayOnWheel ?? 700,
            }),
            [autoHide]
        );

        // 호환성을 위한 변수들 (자주 사용되는 변수들만 유지)
        const finalThumbWidth = finalThumbConfig.width;
        const finalTrackWidth = finalTrackConfig.width;
        const thumbMinHeight = finalThumbConfig.minHeight;
        const showArrows = finalArrowsConfig.visible;
        const arrowStep = finalArrowsConfig.step;

        // ref를 통해 외부에서 스크롤 컨테이너에 접근할 수 있도록 함
        useImperativeHandle(
            ref,
            () => ({
                getScrollContainer: () => containerRef.current,
                scrollTo: (options: ScrollToOptions) => {
                    if (containerRef.current) {
                        containerRef.current.scrollTo(options);
                    }
                },
                get scrollTop() {
                    return containerRef.current?.scrollTop || 0;
                },
                get scrollHeight() {
                    return containerRef.current?.scrollHeight || 0;
                },
                get clientHeight() {
                    return containerRef.current?.clientHeight || 0;
                },
            }),
            []
        );

        // 실제 스크롤 가능한 요소 찾기 (캐싱 최적화)
        const findScrollableElement = useCallback((): HTMLElement | null => {
            // 캐시된 요소가 여전히 유효한지 확인
            if (cachedScrollContainerRef.current) {
                const cached = cachedScrollContainerRef.current;
                // DOM에 연결되어 있고 여전히 스크롤 가능한지 확인
                if (
                    document.contains(cached) &&
                    cached.scrollHeight > cached.clientHeight + 2
                ) {
                    return cached;
                }
                // 캐시 무효화
                cachedScrollContainerRef.current = null;
            }

            if (!containerRef.current) {
                return null;
            }

            // 내부 컨테이너의 스크롤 가능 여부 확인
            if (
                contentRef.current &&
                contentRef.current.scrollHeight >
                    containerRef.current.clientHeight + 2
            ) {
                cachedScrollContainerRef.current = containerRef.current;
                return containerRef.current;
            }

            // children 요소에서 스크롤 가능한 요소 찾기
            const childScrollableElements =
                containerRef.current.querySelectorAll(
                    '[data-virtuoso-scroller], [style*="overflow"], .virtuoso-scroller, [style*="overflow: auto"], [style*="overflow:auto"]'
                );
            for (const child of childScrollableElements) {
                const element = child as HTMLElement;
                if (element.scrollHeight > element.clientHeight + 2) {
                    cachedScrollContainerRef.current = element;
                    return element;
                }
            }

            return null;
        }, []);

        // 스크롤 가능 여부 체크
        const isScrollable = useCallback(() => {
            return findScrollableElement() !== null;
        }, [findScrollableElement]);

        // 타이머 정리
        const clearHideTimer = useCallback(() => {
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
                hideTimeoutRef.current = null;
            }
        }, []);

        // 스크롤바 숨기기 타이머
        const setHideTimer = useCallback(
            (delay: number) => {
                // 자동 숨김이 비활성화되어 있으면 타이머를 설정하지 않음
                if (!finalAutoHideConfig.enabled) {
                    return;
                }
                clearHideTimer();
                hideTimeoutRef.current = setTimeout(() => {
                    setScrollbarVisible(false);
                    hideTimeoutRef.current = null;
                }, delay);
            },
            [clearHideTimer, finalAutoHideConfig.enabled]
        );

        // 스크롤바 위치 및 크기 업데이트
        const updateScrollbar = useCallback(() => {
            if (!scrollbarRef.current) return;

            const scrollableElement = findScrollableElement();
            if (!scrollableElement) {
                // 스크롤 불가능하면 숨김
                setScrollbarVisible(false);
                clearHideTimer();
                return;
            }

            // 자동 숨김이 비활성화되어 있으면 스크롤바를 항상 표시
            if (!finalAutoHideConfig.enabled) {
                setScrollbarVisible(true);
                clearHideTimer();
            }

            const containerHeight = scrollableElement.clientHeight;
            const contentHeight = scrollableElement.scrollHeight;
            const scrollTop = scrollableElement.scrollTop;

            // 화살표와 간격 공간 계산 (화살표 + 위아래 마진, 화살표 없어도 위아래 마진)
            const arrowSpace = showArrows
                ? finalThumbWidth * 2 + finalTrackConfig.margin * 4
                : finalTrackConfig.margin * 2;

            // 썸 높이 계산 (사용자 설정 최소 높이 사용, 화살표 공간 제외)
            const availableHeight = containerHeight - arrowSpace;
            const scrollRatio = containerHeight / contentHeight;
            const calculatedThumbHeight = Math.max(
                availableHeight * scrollRatio,
                thumbMinHeight
            );

            // 썸 위치 계산 (화살표와 간격 공간 제외)
            const scrollableHeight = contentHeight - containerHeight;
            const thumbScrollableHeight =
                availableHeight - calculatedThumbHeight;
            const calculatedThumbTop =
                scrollableHeight > 0
                    ? (scrollTop / scrollableHeight) * thumbScrollableHeight
                    : 0;

            setThumbHeight(calculatedThumbHeight);
            setThumbTop(calculatedThumbTop);
        }, [
            findScrollableElement,
            clearHideTimer,
            showArrows,
            finalThumbWidth,
            thumbMinHeight,
            finalAutoHideConfig.enabled,
        ]);

        // 썸 드래그 시작
        const handleThumbMouseDown = useCallback(
            (event: React.MouseEvent) => {
                event.preventDefault();
                event.stopPropagation();

                const actualScrollContainer = findScrollableElement();
                if (!actualScrollContainer) {
                    return;
                }

                setIsDragging(true);
                setDragStart({
                    y: event.clientY,
                    scrollTop: actualScrollContainer.scrollTop,
                });

                clearHideTimer();
                setScrollbarVisible(true);

                // 포커스 유지 (키보드 입력이 계속 작동하도록)
                containerRef.current?.focus();
            },
            [findScrollableElement, clearHideTimer]
        );

        // 썸 드래그 중
        const handleMouseMove = useCallback(
            (event: MouseEvent) => {
                if (!isDragging) return;

                const actualScrollContainer = findScrollableElement();
                if (!actualScrollContainer) {
                    return;
                }

                const containerHeight = actualScrollContainer.clientHeight;
                const contentHeight = actualScrollContainer.scrollHeight;
                const scrollableHeight = contentHeight - containerHeight;

                const deltaY = event.clientY - dragStart.y;
                const thumbScrollableHeight = containerHeight - thumbHeight;
                const scrollDelta =
                    (deltaY / thumbScrollableHeight) * scrollableHeight;

                const newScrollTop = Math.max(
                    0,
                    Math.min(
                        scrollableHeight,
                        dragStart.scrollTop + scrollDelta
                    )
                );

                actualScrollContainer.scrollTop = newScrollTop;
                updateScrollbar();
            },
            [
                isDragging,
                dragStart,
                thumbHeight,
                updateScrollbar,
                findScrollableElement,
            ]
        );

        // 썸 드래그 종료
        const handleMouseUp = useCallback(() => {
            setIsDragging(false);
            if (isScrollable()) {
                setHideTimer(finalAutoHideConfig.delay); // 기본 숨김 시간 적용
            }
        }, [isScrollable, setHideTimer, finalAutoHideConfig.delay]);

        // 트랙 클릭으로 스크롤 점프
        const handleTrackClick = useCallback(
            (event: React.MouseEvent) => {
                if (!scrollbarRef.current) {
                    return;
                }

                const scrollbar = scrollbarRef.current;
                const rect = scrollbar.getBoundingClientRect();
                const clickY = event.clientY - rect.top;

                const actualScrollContainer = findScrollableElement();
                if (!actualScrollContainer) {
                    return;
                }

                const containerHeight = actualScrollContainer.clientHeight;
                const contentHeight = actualScrollContainer.scrollHeight;

                const scrollRatio = clickY / containerHeight;
                const newScrollTop =
                    scrollRatio * (contentHeight - containerHeight);

                actualScrollContainer.scrollTop = Math.max(
                    0,
                    Math.min(contentHeight - containerHeight, newScrollTop)
                );
                updateScrollbar();

                setScrollbarVisible(true);
                setHideTimer(finalAutoHideConfig.delay);

                // 포커스 유지 (키보드 입력이 계속 작동하도록)
                containerRef.current?.focus();
            },
            [
                updateScrollbar,
                setHideTimer,
                finalAutoHideConfig.delay,
                findScrollableElement,
            ]
        );

        // 위쪽 화살표 클릭 핸들러
        const handleUpArrowClick = useCallback(
            (event: React.MouseEvent) => {
                event.preventDefault();
                event.stopPropagation();

                if (!containerRef.current) return;

                const newScrollTop = Math.max(
                    0,
                    containerRef.current.scrollTop - arrowStep
                );

                containerRef.current.scrollTop = newScrollTop;
                updateScrollbar();

                setScrollbarVisible(true);
                setHideTimer(finalAutoHideConfig.delay);

                // 포커스 유지 (키보드 입력이 계속 작동하도록)
                containerRef.current?.focus();
            },
            [
                updateScrollbar,
                setHideTimer,
                arrowStep,
                finalAutoHideConfig.delay,
            ]
        );

        // 아래쪽 화살표 클릭 핸들러
        const handleDownArrowClick = useCallback(
            (event: React.MouseEvent) => {
                event.preventDefault();
                event.stopPropagation();

                if (!containerRef.current || !contentRef.current) return;

                const container = containerRef.current;
                const content = contentRef.current;
                const maxScrollTop =
                    content.scrollHeight - container.clientHeight;
                const newScrollTop = Math.min(
                    maxScrollTop,
                    container.scrollTop + arrowStep
                );

                container.scrollTop = newScrollTop;
                updateScrollbar();

                setScrollbarVisible(true);
                setHideTimer(finalAutoHideConfig.delay);

                // 포커스 유지 (키보드 입력이 계속 작동하도록)
                containerRef.current?.focus();
            },
            [
                updateScrollbar,
                setHideTimer,
                arrowStep,
                finalAutoHideConfig.delay,
            ]
        );

        // 드래그 스크롤 시작
        const handleDragScrollStart = useCallback(
            (event: React.MouseEvent) => {
                // 드래그 스크롤이 비활성화된 경우
                if (!finalDragScrollConfig.enabled) return;

                // 텍스트 입력 요소나 제외 대상이면 드래그 스크롤 하지 않음
                const target = event.target as Element;
                if (isTextInputElement(target, finalDragScrollConfig)) {
                    return;
                }

                // 오른쪽 클릭이나 휠 클릭은 제외
                if (event.button !== 0) return;

                const scrollableElement = findScrollableElement();
                if (!scrollableElement) return;

                // 스크롤 가능한 영역이 아니면 제외
                if (
                    scrollableElement.scrollHeight <=
                    scrollableElement.clientHeight
                )
                    return;

                event.preventDefault();
                setIsDragScrolling(true);
                setDragScrollStart({
                    x: event.clientX,
                    y: event.clientY,
                    scrollTop: scrollableElement.scrollTop,
                    scrollLeft: scrollableElement.scrollLeft || 0,
                });

                // 스크롤바 표시
                clearHideTimer();
                setScrollbarVisible(true);
            },
            [
                finalDragScrollConfig,
                isTextInputElement,
                findScrollableElement,
                clearHideTimer,
            ]
        );

        // 드래그 스크롤 중
        const handleDragScrollMove = useCallback(
            (event: MouseEvent) => {
                if (!isDragScrolling) return;

                const scrollableElement = findScrollableElement();
                if (!scrollableElement) return;

                const deltaX = dragScrollStart.x - event.clientX;
                const deltaY = dragScrollStart.y - event.clientY;

                // 세로 스크롤만 처리 (가로 스크롤은 필요시 나중에 추가)
                const newScrollTop = Math.max(
                    0,
                    Math.min(
                        scrollableElement.scrollHeight -
                            scrollableElement.clientHeight,
                        dragScrollStart.scrollTop + deltaY
                    )
                );

                scrollableElement.scrollTop = newScrollTop;
                updateScrollbar();
            },
            [
                isDragScrolling,
                dragScrollStart,
                findScrollableElement,
                updateScrollbar,
            ]
        );

        // 드래그 스크롤 종료
        const handleDragScrollEnd = useCallback(() => {
            setIsDragScrolling(false);
            if (isScrollable()) {
                setHideTimer(finalAutoHideConfig.delay);
            }
        }, [isScrollable, setHideTimer, finalAutoHideConfig.delay]);

        // 스크롤 이벤트 리스너 (externalScrollContainer 우선 사용)
        useEffect(() => {
            const handleScroll = (event: Event) => {
                const target = event.target as HTMLElement;
                console.log("🟢 scroll 이벤트", {
                    scrollTop: target.scrollTop,
                    scrollHeight: target.scrollHeight,
                    clientHeight: target.clientHeight,
                    scrollPercentage:
                        (
                            (target.scrollTop /
                                (target.scrollHeight - target.clientHeight)) *
                            100
                        ).toFixed(2) + "%",
                });
                updateScrollbar();

                // 스크롤 중에는 스크롤바 표시
                clearHideTimer();
                setScrollbarVisible(true);

                // 휠 스크롤 중이면 빠른 숨김, 아니면 기본 숨김 시간 적용
                const delay = isWheelScrolling
                    ? finalAutoHideConfig.delayOnWheel
                    : finalAutoHideConfig.delay;
                setHideTimer(delay);

                if (onScroll) {
                    onScroll(event);
                }
            };

            const handleWheel = () => {
                // 휠 스크롤 상태 표시
                setIsWheelScrolling(true);

                // 기존 휠 타이머 제거
                if (wheelTimeoutRef.current) {
                    clearTimeout(wheelTimeoutRef.current);
                }

                // 300ms 후 휠 스크롤 상태 해제 (휠 스크롤이 끝났다고 간주)
                wheelTimeoutRef.current = setTimeout(() => {
                    setIsWheelScrolling(false);
                }, 300);

                clearHideTimer();
                setScrollbarVisible(true);
            };

            const elementsToWatch: HTMLElement[] = [];

            // 실제 스크롤 가능한 요소 찾기
            const scrollableElement = findScrollableElement();
            if (scrollableElement) {
                elementsToWatch.push(scrollableElement);
            }

            // fallback: 내부 컨테이너와 children 요소도 감지
            const container = containerRef.current;
            if (container && !scrollableElement) {
                elementsToWatch.push(container);

                // children 요소들의 스크롤도 감지
                const childScrollableElements = container.querySelectorAll(
                    '[data-virtuoso-scroller], [style*="overflow"], .virtuoso-scroller, [style*="overflow: auto"], [style*="overflow:auto"]'
                );
                childScrollableElements.forEach((child) => {
                    elementsToWatch.push(child as HTMLElement);
                });
            }

            // 모든 요소에 이벤트 리스너 등록
            elementsToWatch.forEach((element) => {
                element.addEventListener("scroll", handleScroll, {
                    passive: true,
                });
                element.addEventListener("wheel", handleWheel, {
                    passive: true,
                });
            });

            return () => {
                // 모든 이벤트 리스너 제거
                elementsToWatch.forEach((element) => {
                    element.removeEventListener("scroll", handleScroll);
                    element.removeEventListener("wheel", handleWheel);
                });

                if (wheelTimeoutRef.current) {
                    clearTimeout(wheelTimeoutRef.current);
                }
            };
        }, [
            findScrollableElement,
            updateScrollbar,
            onScroll,
            clearHideTimer,
            setHideTimer,
            finalAutoHideConfig,
            isWheelScrolling,
        ]);

        // 드래그 스크롤 전역 마우스 이벤트 리스너
        useEffect(() => {
            if (isDragScrolling) {
                document.addEventListener("mousemove", handleDragScrollMove);
                document.addEventListener("mouseup", handleDragScrollEnd);
                return () => {
                    document.removeEventListener(
                        "mousemove",
                        handleDragScrollMove
                    );
                    document.removeEventListener(
                        "mouseup",
                        handleDragScrollEnd
                    );
                };
            }
        }, [isDragScrolling, handleDragScrollMove, handleDragScrollEnd]);

        // 전역 마우스 이벤트 리스너
        useEffect(() => {
            if (isDragging) {
                document.addEventListener("mousemove", handleMouseMove);
                document.addEventListener("mouseup", handleMouseUp);
                return () => {
                    document.removeEventListener("mousemove", handleMouseMove);
                    document.removeEventListener("mouseup", handleMouseUp);
                };
            }
        }, [isDragging, handleMouseMove, handleMouseUp]);

        // 초기 스크롤바 업데이트
        useEffect(() => {
            // 즉시 업데이트
            updateScrollbar();
            // 약간의 지연 후에도 업데이트 (DOM이 완전히 렌더링된 후)
            const timer = setTimeout(() => {
                updateScrollbar();
            }, 100);
            return () => clearTimeout(timer);
        }, [updateScrollbar]);

        // 컴포넌트 초기화 완료 표시 (hover 이벤트 활성화용)
        useEffect(() => {
            const timer = setTimeout(() => {
                setIsInitialized(true);
                console.log("OverlayScrollbar 초기화 완료 (initialization)", {
                    containerRef: !!containerRef.current,
                    contentRef: !!contentRef.current,
                    isScrollable: isScrollable(),
                    autoHideEnabled: finalAutoHideConfig.enabled,
                });
                // 초기화 후 스크롤바 업데이트 (썸 높이 정확하게 계산)
                updateScrollbar();
                // 자동 숨김이 비활성화되어 있으면 스크롤바를 항상 표시
                if (!finalAutoHideConfig.enabled && isScrollable()) {
                    setScrollbarVisible(true);
                }
            }, 100);

            return () => clearTimeout(timer);
        }, [isScrollable, updateScrollbar, finalAutoHideConfig.enabled]);

        // Resize observer로 크기 변경 감지
        useEffect(() => {
            const resizeObserver = new ResizeObserver(() => {
                updateScrollbar();
            });

            const elementsToObserve: HTMLElement[] = [];

            // 내부 컨테이너들 관찰
            if (containerRef.current) {
                elementsToObserve.push(containerRef.current);
            }
            if (contentRef.current) {
                elementsToObserve.push(contentRef.current);
            }

            // 캐시된 스크롤 컨테이너도 관찰
            if (
                cachedScrollContainerRef.current &&
                document.contains(cachedScrollContainerRef.current)
            ) {
                elementsToObserve.push(cachedScrollContainerRef.current);
            }

            // 모든 요소들 관찰 시작
            elementsToObserve.forEach((element) => {
                resizeObserver.observe(element);
            });

            return () => resizeObserver.disconnect();
        }, [updateScrollbar]);

        // MutationObserver로 DOM 변경 감지
        useEffect(() => {
            if (!containerRef.current) {
                return;
            }

            const observer = new MutationObserver(() => {
                // 캐시 초기화하여 새로운 스크롤 컨테이너 감지
                cachedScrollContainerRef.current = null;
                updateScrollbar();
            });

            observer.observe(containerRef.current, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ["style"],
            });

            return () => observer.disconnect();
        }, [updateScrollbar]);

        // trackWidth가 thumbWidth보다 작으면 thumbWidth와 같게 설정
        const adjustedTrackWidth = Math.max(finalTrackWidth, finalThumbWidth);

        // 웹킷 스크롤바 숨기기용 CSS 동적 주입
        useEffect(() => {
            const styleId = "overlay-scrollbar-webkit-hide";

            // 이미 스타일이 있으면 제거
            const existingStyle = document.getElementById(styleId);
            if (existingStyle) {
                existingStyle.remove();
            }

            const style = document.createElement("style");
            style.id = styleId;
            style.textContent = `
                .overlay-scrollbar-container::-webkit-scrollbar {
                    display: none !important;
                    width: 0 !important;
                    height: 0 !important;
                }
                .overlay-scrollbar-container::-webkit-scrollbar-track {
                    display: none !important;
                }
                .overlay-scrollbar-container::-webkit-scrollbar-thumb {
                    display: none !important;
                }
                .overlay-scrollbar-container:focus {
                    outline: 2px solid rgba(0, 123, 255, 0.3);
                    outline-offset: -2px;
                }
                .overlay-scrollbar-container:focus-visible {
                    outline: 2px solid rgba(0, 123, 255, 0.5);
                    outline-offset: -2px;
                }
            `;
            document.head.appendChild(style);

            return () => {
                const styleToRemove = document.getElementById(styleId);
                if (styleToRemove) {
                    styleToRemove.remove();
                }
            };
        }, []);

        return (
            <div
                className={`overlay-scrollbar-wrapper ${className}`}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    minHeight: 0, // shrink 가능하도록
                    height: "100%", // 부모의 전체 높이 사용
                    flex: "1 1 0%", // 기본적으로 flex item으로 동작
                    ...style, // 사용자가 flex를 override 할 수 있도록 style을 뒤에 배치
                }}
            >
                {/* 스크롤 컨테이너 */}
                <div
                    ref={containerRef}
                    className="overlay-scrollbar-container"
                    tabIndex={-1} // 키보드 포커스 가능하게 함
                    onMouseDown={handleDragScrollStart}
                    style={{
                        width: "100%", // 명시적 너비 설정
                        height: "100%", // 부모의 전체 높이 사용
                        flex: "1 1 auto", // flex item으로 설정하여 높이를 자동으로 계산
                        minHeight: 0, // 최소 높이 보장
                        overflow: "auto", // 네이티브 스크롤 기능 유지
                        // 브라우저 기본 스크롤바만 숨기기
                        scrollbarWidth: "none", // Firefox
                        msOverflowStyle: "none", // IE/Edge
                        // 키보드 포커스 스타일 (접근성)
                        outline: "none", // 기본 아웃라인 제거
                        userSelect: isDragScrolling ? "none" : "auto", // 드래그 중 텍스트 선택 방지
                    }}
                >
                    <div
                        ref={contentRef}
                        className="overlay-scrollbar-content"
                        style={{
                            height: "100%", // min-height 대신 height 사용
                            minHeight: 0, // flex shrink 허용
                            display: "flex", // flex 컨테이너로 설정
                            flexDirection: "column", // 세로 방향 정렬
                        }}
                    >
                        {children}
                    </div>
                </div>

                {/* 커스텀 스크롤바 */}
                {showScrollbar && (
                    <div
                        ref={scrollbarRef}
                        className="overlay-scrollbar-track"
                        onMouseEnter={() => {
                            clearHideTimer();
                            setScrollbarVisible(true);
                        }}
                        onMouseLeave={() => {
                            if (!isDragging) {
                                setHideTimer(finalAutoHideConfig.delay);
                            }
                        }}
                        style={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            width: `${adjustedTrackWidth}px`,
                            height: "100%",
                            opacity: scrollbarVisible ? 1 : 0,
                            transition: "opacity 0.2s ease-in-out",
                            cursor: "pointer",
                            zIndex: 1000,
                            pointerEvents: "auto",
                        }}
                    >
                        {/* 스크롤바 트랙 배경 */}
                        {finalTrackConfig.visible && (
                            <div
                                className="overlay-scrollbar-track-background"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleTrackClick(e);
                                }}
                                style={{
                                    position: "absolute",
                                    top: showArrows
                                        ? `${
                                              finalThumbConfig.width +
                                              finalTrackConfig.margin * 2
                                          }px`
                                        : `${finalTrackConfig.margin}px`,
                                    right:
                                        finalTrackConfig.alignment === "right"
                                            ? "0px"
                                            : `${
                                                  (adjustedTrackWidth -
                                                      finalThumbConfig.width) /
                                                  2
                                              }px`, // 트랙 정렬
                                    width: `${finalThumbConfig.width}px`,
                                    height: showArrows
                                        ? `calc(100% - ${
                                              finalThumbConfig.width * 2 +
                                              finalTrackConfig.margin * 4
                                          }px)`
                                        : `calc(100% - ${
                                              finalTrackConfig.margin * 2
                                          }px)`,
                                    backgroundColor: finalTrackConfig.color,
                                    borderRadius: `${finalTrackConfig.radius}px`,
                                    cursor: "pointer",
                                }}
                            />
                        )}

                        {/* 스크롤바 썸 */}
                        <div
                            ref={thumbRef}
                            className="overlay-scrollbar-thumb"
                            onMouseDown={handleThumbMouseDown}
                            onMouseEnter={() => setIsThumbHovered(true)}
                            onMouseLeave={() => setIsThumbHovered(false)}
                            style={{
                                position: "absolute",
                                top: `${
                                    (showArrows
                                        ? finalThumbWidth +
                                          finalTrackConfig.margin * 2
                                        : finalTrackConfig.margin) + thumbTop
                                }px`,
                                right:
                                    finalTrackConfig.alignment === "right"
                                        ? "0px"
                                        : `${
                                              (adjustedTrackWidth -
                                                  finalThumbWidth) /
                                              2
                                          }px`, // 트랙 정렬
                                width: `${finalThumbWidth}px`,
                                height: `${Math.max(
                                    thumbHeight,
                                    thumbMinHeight
                                )}px`,
                                backgroundColor:
                                    isThumbHovered || isDragging
                                        ? finalThumbConfig.hoverColor
                                        : finalThumbConfig.color,
                                opacity:
                                    isThumbHovered || isDragging
                                        ? finalThumbConfig.hoverOpacity
                                        : finalThumbConfig.opacity,
                                borderRadius: `${finalThumbConfig.radius}px`,
                                cursor: "pointer",
                                transition:
                                    "background-color 0.2s ease-in-out, opacity 0.2s ease-in-out",
                            }}
                        />
                    </div>
                )}

                {/* 위쪽 화살표 버튼 */}
                {showScrollbar && showArrows && (
                    <div
                        className="overlay-scrollbar-up-arrow"
                        onClick={handleUpArrowClick}
                        onMouseEnter={() => setHoveredArrow("up")}
                        onMouseLeave={() => setHoveredArrow(null)}
                        style={{
                            position: "absolute",
                            top: `${finalTrackConfig.margin}px`,
                            right:
                                finalTrackConfig.alignment === "right"
                                    ? "0px"
                                    : `${
                                          (adjustedTrackWidth -
                                              finalThumbWidth) /
                                          2
                                      }px`, // 트랙 정렬
                            width: `${finalThumbWidth}px`,
                            height: `${finalThumbWidth}px`,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: `${Math.max(
                                finalThumbWidth * 0.75,
                                8
                            )}px`,
                            color:
                                hoveredArrow === "up"
                                    ? finalArrowsConfig.hoverColor
                                    : finalArrowsConfig.color,
                            userSelect: "none",
                            zIndex: 1001,
                            opacity: scrollbarVisible
                                ? hoveredArrow === "up"
                                    ? finalArrowsConfig.hoverOpacity
                                    : finalArrowsConfig.opacity
                                : 0,
                            transition:
                                "opacity 0.2s ease-in-out, color 0.15s ease-in-out",
                        }}
                    >
                        ▲
                    </div>
                )}

                {/* 아래쪽 화살표 버튼 */}
                {showScrollbar && showArrows && (
                    <div
                        className="overlay-scrollbar-down-arrow"
                        onClick={handleDownArrowClick}
                        onMouseEnter={() => setHoveredArrow("down")}
                        onMouseLeave={() => setHoveredArrow(null)}
                        style={{
                            position: "absolute",
                            bottom: `${finalTrackConfig.margin}px`,
                            right:
                                finalTrackConfig.alignment === "right"
                                    ? "0px"
                                    : `${
                                          (adjustedTrackWidth -
                                              finalThumbWidth) /
                                          2
                                      }px`, // 트랙 정렬
                            width: `${finalThumbWidth}px`,
                            height: `${finalThumbWidth}px`,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: `${Math.max(
                                finalThumbWidth * 0.75,
                                8
                            )}px`,
                            color:
                                hoveredArrow === "down"
                                    ? finalArrowsConfig.hoverColor
                                    : finalArrowsConfig.color,
                            userSelect: "none",
                            zIndex: 1001,
                            opacity: scrollbarVisible
                                ? hoveredArrow === "down"
                                    ? finalArrowsConfig.hoverOpacity
                                    : finalArrowsConfig.opacity
                                : 0,
                            transition:
                                "opacity 0.2s ease-in-out, color 0.15s ease-in-out",
                        }}
                    >
                        ▼
                    </div>
                )}
            </div>
        );
    }
);

export default OverlayScrollbar;
export { OverlayScrollbar };
