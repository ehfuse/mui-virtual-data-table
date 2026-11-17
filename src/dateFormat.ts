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

const formats: Record<VDTDateFormat, string> = {
    // 2026-11-17 사용자 지정 "yy-mm-dd"(마침표는 숫자 사이에 묻혀 잘 안 보였다).
    date: "YY-MM-DD",
    datetime: "YY-MM-DD HH:mm",
    time: "HH:mm",
    month: "YYYY-MM",
};

/** 앱 전체 날짜 서식을 바꾼다(앱 시작 때 한 번). */
export function setVirtualDataTableDateFormats(next: Partial<Record<VDTDateFormat, string>>): void {
    Object.assign(formats, next);
}

export function getVirtualDataTableDateFormat(kind: VDTDateFormat): string {
    return formats[kind];
}

type Parts = { y: number; mo: number; d: number; h: number; mi: number; s: number; hasDate: boolean; hasTime: boolean };

const WALL = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?)?$/;
const MONTH = /^(\d{4})-(\d{1,2})$/;
const TIME_ONLY = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;

function fromDate(date: Date): Parts | null {
    if (Number.isNaN(date.getTime())) return null;
    return { y: date.getFullYear(), mo: date.getMonth() + 1, d: date.getDate(), h: date.getHours(), mi: date.getMinutes(), s: date.getSeconds(), hasDate: true, hasTime: true };
}

function parse(value: unknown): Parts | null {
    if (value === null || value === undefined || value === "") return null;
    if (value instanceof Date) return fromDate(value);
    if (typeof value === "number") return Number.isFinite(value) && value > 0 ? fromDate(new Date(value)) : null;
    const text = String(value).trim();
    const wall = WALL.exec(text);
    if (wall) {
        return { y: +wall[1], mo: +wall[2], d: +wall[3], h: +(wall[4] ?? 0), mi: +(wall[5] ?? 0), s: +(wall[6] ?? 0), hasDate: true, hasTime: wall[4] !== undefined };
    }
    const month = MONTH.exec(text);
    if (month) {
        return { y: +month[1], mo: +month[2], d: 1, h: 0, mi: 0, s: 0, hasDate: true, hasTime: false };
    }
    const time = TIME_ONLY.exec(text);
    if (time) return { y: 0, mo: 0, d: 0, h: +time[1], mi: +time[2], s: +(time[3] ?? 0), hasDate: false, hasTime: true };
    // 시간대가 붙은 ISO 등 — 브라우저가 읽을 수 있는 것만.
    if (/^\d{4}-\d{2}-\d{2}T/.test(text)) return fromDate(new Date(text));
    return null;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** 날짜 값을 서식대로 — kind 는 앱 서식("date" 등), pattern 을 주면 그 꼴로. 읽지 못하면 받은 글 그대로(빈 값은 ""). */
export function formatVdtDate(value: unknown, kind: VDTDateFormat = "date", pattern?: string): string {
    const p = parse(value);
    if (!p) return value === null || value === undefined ? "" : value instanceof Date || typeof value === "number" ? "" : String(value);
    if (!p.hasDate && kind !== "time") return String(value);
    if (!p.hasTime && kind === "time") return "";
    // 시각이 없는 값(날짜만)을 datetime 으로 그리면 날짜 서식만 — "00:00" 을 붙이지 않는다.
    const useKind: VDTDateFormat = !p.hasTime && kind === "datetime" ? "date" : kind;
    return (pattern ?? formats[useKind]).replace(/YYYY|YY|MM|M|DD|D|HH|H|mm|ss/g, (token) => {
        switch (token) {
            case "YYYY": return String(p.y);
            case "YY": return pad(p.y % 100);
            case "MM": return pad(p.mo);
            case "M": return String(p.mo);
            case "DD": return pad(p.d);
            case "D": return String(p.d);
            case "HH": return pad(p.h);
            case "H": return String(p.h);
            case "mm": return pad(p.mi);
            default: return pad(p.s);
        }
    });
}
