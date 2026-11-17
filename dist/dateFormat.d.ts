/**
 * 날짜 칸 서식(1.15.0) — 열에 `format` 을 주면 어떤 날짜 값이 와도 같은 모양으로 그린다(앱마다 · 화면마다 서식이 갈리지 않게).
 *
 * 받는 값
 *  - 벽시계 문자열 "2026-08-27" · "2026-08-27 10:18(:00)" · "2026-08-27T10:18" — 시간대를 옮기지 않고 적힌 그대로 읽는다.
 *  - 시간대가 붙은 문자열("…Z" · "…+09:00") · Date · 숫자(ms 타임스탬프) — 이 기기의 시각으로 바꿔 읽는다.
 *  - "10:18(:00)" — 시각만(format "time").
 *  - 그 밖(빈 값 · 읽지 못하는 값)은 빈 칸 또는 받은 글 그대로.
 *
 * 서식 글자: YYYY · YY · MM · M · DD · D · HH · H · mm · ss. 기본값은 setVirtualDataTableDateFormats 로 앱에서 한 번 바꾼다.
 * 다르게 보여야 하는 칸만 render 로 직접 그린다(render 가 있으면 format 은 쓰지 않는다).
 */
export type VDTDateFormat = "date" | "datetime" | "time" | "month";
/** 앱 전체 날짜 서식을 바꾼다(앱 시작 때 한 번). */
export declare function setVirtualDataTableDateFormats(next: Partial<Record<VDTDateFormat, string>>): void;
export declare function getVirtualDataTableDateFormat(kind: VDTDateFormat): string;
/** 날짜 값을 서식대로 — kind 는 앱 서식("date" 등), pattern 을 주면 그 꼴로. 읽지 못하면 받은 글 그대로(빈 값은 ""). */
export declare function formatVdtDate(value: unknown, kind?: VDTDateFormat, pattern?: string): string;
