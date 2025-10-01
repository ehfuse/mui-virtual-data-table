/**
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

import { DragScrollConfig } from "../OverlayScrollbar";

// 드래그 스크롤을 제외할 클래스들 (자신 또는 부모 요소에서 확인)
const DEFAULT_EXCLUDE_CLASSES = [
    // 기본 입력 요소들
    "editor",
    "textarea",
    "input",
    "select",
    "textfield",
    "form-control",
    "contenteditable",

    // Material-UI 컴포넌트들
    "MuiInputBase-input",
    "MuiSelect-select",
    "MuiOutlinedInput-input",
    "MuiFilledInput-input",
    "MuiInput-input",
    "MuiFormControl-root",
    "MuiTextField-root",
    "MuiSelect-root",
    "MuiOutlinedInput-root",
    "MuiFilledInput-root",
    "MuiInput-root",
    "MuiAutocomplete-input",
    "MuiDatePicker-input",
    "MuiSlider-thumb",
    "MuiSlider-rail",
    "MuiSlider-track",
    "MuiSlider-mark",
    "MuiSlider-markLabel",
    "MuiSlider-root",
    "MuiSlider-colorPrimary",
    "MuiSlider-sizeMedium",
    "MuiIconButton-root",
    "MuiButton-root",
    "MuiButtonBase-root",
    "MuiTouchRipple-root",
    "MuiCheckbox-root",
    "MuiRadio-root",
    "MuiSwitch-root",
    "PrivateSwitchBase-root",

    // Ant Design 컴포넌트들
    "ant-input",
    "ant-input-affix-wrapper",
    "ant-input-group-addon",
    "ant-input-number",
    "ant-input-number-handler",
    "ant-select",
    "ant-select-selector",
    "ant-select-selection-search",
    "ant-select-dropdown",
    "ant-cascader",
    "ant-cascader-input",
    "ant-picker",
    "ant-picker-input",
    "ant-time-picker",
    "ant-calendar-picker",
    "ant-slider",
    "ant-slider-track",
    "ant-slider-handle",
    "ant-switch",
    "ant-checkbox",
    "ant-checkbox-wrapper",
    "ant-radio",
    "ant-radio-wrapper",
    "ant-rate",
    "ant-upload",
    "ant-upload-drag",
    "ant-form-item",
    "ant-form-item-control",
    "ant-btn",
    "ant-dropdown",
    "ant-dropdown-trigger",
    "ant-menu",
    "ant-menu-item",
    "ant-tooltip",
    "ant-popover",
    "ant-modal",
    "ant-drawer",
    "ant-tree-select",
    "ant-auto-complete",
    "ant-mentions",
    "ant-transfer",

    // Shadcn/ui 컴포넌트들
    "ui-input",
    "ui-textarea",
    "ui-select",
    "ui-select-trigger",
    "ui-select-content",
    "ui-select-item",
    "ui-button",
    "ui-checkbox",
    "ui-radio-group",
    "ui-switch",
    "ui-slider",
    "ui-range-slider",
    "ui-calendar",
    "ui-date-picker",
    "ui-combobox",
    "ui-command",
    "ui-command-input",
    "ui-popover",
    "ui-dialog",
    "ui-sheet",
    "ui-dropdown-menu",
    "ui-context-menu",
    "ui-menubar",
    "ui-navigation-menu",
    "ui-form",
    "ui-form-control",
    "ui-form-item",
    "ui-form-field",
    "ui-label",
    // Radix UI 기본 클래스들 (Shadcn 기반)
    "radix-ui",
    "radix-select",
    "radix-dropdown",
    "radix-dialog",
    "radix-popover",
    "radix-accordion",
    "radix-tabs",
    "radix-slider",
    "radix-switch",
    "radix-checkbox",
    "radix-radio",

    // Quill Editor
    "ql-editor",
    "ql-container",
    "ql-toolbar",
    "ql-picker",
    "ql-picker-label",
    "ql-picker-options",
    "ql-formats",
    "ql-snow",
    "ql-bubble",
    "quill",
    "quilleditor",

    // Monaco Editor
    "monaco-editor",
    "monaco-editor-background",
    "view-lines",
    "decorationsOverviewRuler",
    "monaco-scrollable-element",

    // CodeMirror
    "CodeMirror",
    "CodeMirror-code",
    "CodeMirror-lines",
    "CodeMirror-scroll",
    "CodeMirror-sizer",
    "cm-editor",
    "cm-focused",
    "cm-content",

    // TinyMCE
    "tox-editor-container",
    "tox-editor-header",
    "tox-edit-area",
    "tox-tinymce",
    "mce-content-body",

    // CKEditor
    "ck-editor",
    "ck-content",
    "ck-toolbar",
    "ck-editor__editable",
    "ck-widget",

    // Slate.js
    "slate-editor",
    "slate-content",

    // Draft.js
    "DraftEditor-root",
    "DraftEditor-editorContainer",
    "public-DraftEditor-content",

    // EhfuseEditor
    "ehfuse-editor",
    "ehfuse-editor-wrapper",
    "ehfuse-editor-content",
    "ehfuse-toolbar",
    "ehfuse-toolbar-group",
    "ehfuse-cursor",

    // 기타 에디터들
    "text-editor",
    "rich-text-editor",
    "wysiwyg",
    "ace_editor",
    "ace_content",
];

/**
 * 드래그 스크롤이 허용되지 않는 요소들인지 확인
 */
/**
 * 드래그 스크롤이 허용되지 않는 요소들인지 확인
 */
export const isTextInputElement = (
    element: Element,
    config?: DragScrollConfig
): boolean => {
    const tagName = element.tagName.toLowerCase();
    const inputTypes = [
        "text",
        "password",
        "email",
        "number",
        "search",
        "tel",
        "url",
        "checkbox",
        "radio",
    ];

    // input 태그이면서 텍스트 입력 타입이나 체크박스/라디오인 경우
    if (tagName === "input") {
        const type = (element as HTMLInputElement).type;
        return inputTypes.includes(type);
    }

    // textarea, select, 편집 가능한 요소들
    if (["textarea", "select", "button"].includes(tagName)) {
        return true;
    }

    // SVG 요소들 (아이콘들)
    if (
        [
            "svg",
            "path",
            "circle",
            "rect",
            "line",
            "polygon",
            "polyline",
        ].includes(tagName)
    ) {
        return true;
    }

    // contenteditable 속성이 있는 요소
    if (element.getAttribute("contenteditable") === "true") {
        return true;
    }

    // 추가 셀렉터 체크
    if (config?.excludeSelectors) {
        for (const selector of config.excludeSelectors) {
            if (element.matches(selector)) {
                return true;
            }
        }
    }

    return checkElementAndParents(element, config);
};

/**
 * 자신 또는 부모 요소들을 확인하여 드래그 스크롤을 제외할 요소인지 판단
 */
const checkElementAndParents = (
    element: Element,
    config?: DragScrollConfig
): boolean => {
    // 모든 제외 클래스들 합치기 (기본 클래스 + 사용자 추가 클래스)
    const allExcludeClasses = [
        ...DEFAULT_EXCLUDE_CLASSES,
        ...(config?.excludeClasses || []),
    ];

    let currentElement: Element | null = element;
    let depth = 0;
    const maxDepth = 5; // 최대 5단계까지 부모 요소 확인

    while (currentElement && depth <= maxDepth) {
        // 현재 요소가 제외 클래스를 가지고 있는지 확인
        if (
            allExcludeClasses.some((cls) =>
                currentElement!.classList.contains(cls)
            )
        ) {
            return true;
        }

        // 다이얼로그 루트에 도달하면 중단
        if (currentElement.classList.contains("MuiDialogContent-root")) {
            break;
        }

        currentElement = currentElement.parentElement;
        depth++;
    }

    return false;
};

/**
 * 다른 다이얼로그나 모달이 상위에 있는지 확인
 */
export const hasUpperModal = (scrollContainer: Element): boolean => {
    const currentDialog = scrollContainer.closest(
        ".MuiDialog-root"
    ) as HTMLElement;
    if (!currentDialog) return false;

    const allModals = document.querySelectorAll(
        ".MuiDialog-root, .MuiModal-root, .MuiPopover-root"
    );
    const currentZIndex = parseInt(
        window.getComputedStyle(currentDialog).zIndex || "0"
    );

    for (const modal of allModals) {
        if (modal !== currentDialog) {
            const modalElement = modal as HTMLElement;
            const modalZIndex = parseInt(
                window.getComputedStyle(modalElement).zIndex || "0"
            );

            if (
                modalZIndex > currentZIndex &&
                modalElement.style.display !== "none"
            ) {
                return true;
            }
        }
    }

    return false;
};

/**
 * 클릭한 요소가 다른 다이얼로그 내부인지 확인
 */
export const isClickInOtherDialog = (
    clickedElement: Element,
    currentDialog: Element | null
): boolean => {
    const parentDialog = clickedElement.closest(
        ".MuiDialog-root, .MuiPopover-root, .MuiModal-root"
    );
    return parentDialog !== null && parentDialog !== currentDialog;
};
