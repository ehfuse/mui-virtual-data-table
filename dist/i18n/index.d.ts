/** 이 패키지가 아는 화면 언어 */
export type MuiVirtualDataTableLang = "ko" | "en" | "ja" | "zh" | "de" | "fr" | "it" | "vi";
/** "en-US" · "zh_CN" 같은 값을 아는 언어로 — 모르면 영어 */
export declare function normalizeLang(lang?: string | null): MuiVirtualDataTableLang;
/** 화면 언어를 정한다(앱 전역 — 앱이 언어를 바꿀 때마다 부른다). */
export declare function setMuiVirtualDataTableLocale(lang: string): void;
/** 지금 화면 언어 */
export declare function getMuiVirtualDataTableLocale(): MuiVirtualDataTableLang;
export type TParams = Record<string, string | number | null | undefined>;
/** 열쇠 → 글. lang 을 주면 그 언어(컴포넌트 locale prop), 아니면 전역 언어. {{x}} 에 params 를 넣는다. */
export declare function t(key: string, params?: TParams, lang?: string | null): string;
/** Intl 에 줄 언어 태그(날짜 · 숫자) */
export declare function intlTag(lang?: string | null): string;
/** 컴포넌트용 — 전역 언어가 바뀌면 다시 그린다. localeProp 을 주면 그것이 이긴다. */
export declare function useI18n(localeProp?: string | null): {
    t: (key: string, params?: TParams) => string;
    lang: MuiVirtualDataTableLang;
    intlTag: string;
};
