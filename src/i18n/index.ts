/**
 * mui-virtual-data-table 화면 문구 다국어(2026-10-26).
 *
 * 문구는 ./mui-virtual-data-table/<언어>.json(평평한 { 열쇠: 글 }). ko · en 은 손으로, 나머지는 업무함 www/scripts/i18n-translate.mjs 로 채운다.
 * 기본 언어는 한국어 — 앱이 setMuiVirtualDataTableLocale(lang) 을 부르면 그 언어로 바꾸고, 그 문구를 쓰는 컴포넌트를 다시 그린다.
 * 모르는 언어면 영어. 열쇠가 그 언어에 없으면 영어 → 한국어 → 열쇠 순으로 찾는다.
 */
import { useCallback, useSyncExternalStore } from "react";
import ko from "./mui-virtual-data-table/ko.json";
import en from "./mui-virtual-data-table/en.json";
import ja from "./mui-virtual-data-table/ja.json";
import zh from "./mui-virtual-data-table/zh.json";
import de from "./mui-virtual-data-table/de.json";
import fr from "./mui-virtual-data-table/fr.json";
import it from "./mui-virtual-data-table/it.json";
import vi from "./mui-virtual-data-table/vi.json";

/** 이 패키지가 아는 화면 언어 */
export type MuiVirtualDataTableLang = "ko" | "en" | "ja" | "zh" | "de" | "fr" | "it" | "vi";

type Dict = Record<string, string>;
const DICTS: Record<MuiVirtualDataTableLang, Dict> = { ko, en, ja, zh, de, fr, it, vi };
const INTL_TAGS: Record<MuiVirtualDataTableLang, string> = { ko: "ko-KR", en: "en-US", ja: "ja-JP", zh: "zh-CN", de: "de-DE", fr: "fr-FR", it: "it-IT", vi: "vi-VN" };

let current: MuiVirtualDataTableLang = "ko";
const listeners = new Set<() => void>();

/** "en-US" · "zh_CN" 같은 값을 아는 언어로 — 모르면 영어 */
export function normalizeLang(lang?: string | null): MuiVirtualDataTableLang {
    const base = String(lang ?? "").toLowerCase().split(/[-_]/)[0];
    return (base in DICTS ? base : "en") as MuiVirtualDataTableLang;
}

/** 화면 언어를 정한다(앱 전역 — 앱이 언어를 바꿀 때마다 부른다). */
export function setMuiVirtualDataTableLocale(lang: string): void {
    const next = normalizeLang(lang);
    if (next === current) return;
    current = next;
    listeners.forEach((fn) => fn());
}

/** 지금 화면 언어 */
export function getMuiVirtualDataTableLocale(): MuiVirtualDataTableLang {
    return current;
}

function subscribe(fn: () => void): () => void {
    listeners.add(fn);
    return () => {
        listeners.delete(fn);
    };
}

export type TParams = Record<string, string | number | null | undefined>;

/** 열쇠 → 글. lang 을 주면 그 언어(컴포넌트 locale prop), 아니면 전역 언어. {{x}} 에 params 를 넣는다. */
export function t(key: string, params?: TParams, lang?: string | null): string {
    const l = lang ? normalizeLang(lang) : current;
    const raw = DICTS[l][key] ?? DICTS.en[key] ?? DICTS.ko[key] ?? key;
    if (!params) return raw;
    return raw.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, name) => (params[name] == null ? m : String(params[name])));
}

/** Intl 에 줄 언어 태그(날짜 · 숫자) */
export function intlTag(lang?: string | null): string {
    return INTL_TAGS[lang ? normalizeLang(lang) : current];
}

/** 컴포넌트용 — 전역 언어가 바뀌면 다시 그린다. localeProp 을 주면 그것이 이긴다. */
export function useI18n(localeProp?: string | null) {
    const globalLang = useSyncExternalStore(subscribe, getMuiVirtualDataTableLocale, getMuiVirtualDataTableLocale);
    const lang: MuiVirtualDataTableLang = localeProp ? normalizeLang(localeProp) : globalLang;
    const tt = useCallback((key: string, params?: TParams) => t(key, params, lang), [lang]);
    return { t: tt, lang, intlTag: INTL_TAGS[lang] };
}
