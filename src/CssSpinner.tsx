/**
 * 순수 CSS 로딩 스피너. MUI CircularProgress 대신 LoadingProgress 의 indicator 로 주입한다.
 *
 * 스타일은 자체 <style> 클래스로 주입한다(외부 스타일 의존 없음). 배경 링(연한 트랙)과
 * 회전 호(상단 색)를 한 클래스에 담는다. 앱 초기 스피너 및 대시보드 레이아웃 스피너와 동일한 모양.
 */
export interface CssSpinnerProps {
    /** 스피너 지름(px). 기본 54 */
    size?: number;
}

const SPINNER_CSS = `
.vdt-css-spinner{box-sizing:border-box;border-radius:50%;border:4px solid rgba(28,64,125,0.14);border-top-color:#1c407d;animation:vdt-css-spinner-spin .75s linear infinite}
@keyframes vdt-css-spinner-spin{to{transform:rotate(360deg)}}
`;

export function CssSpinner({ size = 54 }: CssSpinnerProps) {
    return (
        <>
            <style>{SPINNER_CSS}</style>
            <span
                className="vdt-css-spinner"
                role="progressbar"
                aria-label="loading"
                style={{ display: "inline-block", width: size, height: size }}
            />
        </>
    );
}

export default CssSpinner;
