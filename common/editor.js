(() => {

    function pageKey() {

        return (
            document.body.dataset.pageKey ||
            decodeURI(location.pathname)
        );
    }


    function storageKey(
        type
    ) {

        return (
            "TAEON_PAGE_" +
            type +
            "_" +
            pageKey()
        );
    }


    function get(
        id
    ) {

        return document.getElementById(
            id
        );
    }


    function showStatus(
        id,
        text
    ) {

        const target =
            get(id);

        if (!target) {
            return;
        }

        target.textContent =
            text;

        setTimeout(
            () => {

                target.textContent =
                    "";
            },
            1500
        );
    }


    // =====================================================
    // 오른쪽 3개 박스 생성
    // =====================================================

    function buildRightTools() {

        const aside =
            document.querySelector(
                ".memo-area"
            );

        if (!aside) {
            return;
        }


        aside.innerHTML = `

            <div class="side-tool-box">

                <div class="side-tool-title">
                    1. 업무 메모
                </div>

                <div class="side-tool-body">

                    <textarea
                        id="workMemo"
                        placeholder="업무 메모를 입력하세요."
                    ></textarea>

                    <button
                        id="saveMemo"
                        class="btn btn-primary"
                        type="button"
                    >
                        메모 저장
                    </button>

                    <div
                        id="memoStatus"
                        class="editor-status"
                    ></div>

                </div>

            </div>


            <div class="side-tool-box">

                <div class="side-tool-title">
                    2. 페이지 편집
                </div>

                <div class="side-tool-body">

                    <div class="editor-help">
                        현재 페이지의 제목과 설명을 수정합니다.
                    </div>

                    <input
                        id="pageEditTitle"
                        type="text"
                        placeholder="페이지 제목"
                    >

                    <textarea
                        id="pageEditDescription"
                        placeholder="페이지 설명"
                    ></textarea>

                    <div class="editor-button-row">

                        <button
                            id="pageEditSave"
                            class="btn btn-primary"
                            type="button"
                        >
                            저장
                        </button>

                        <button
                            id="pageEditReset"
                            class="btn"
                            type="button"
                        >
                            기본값
                        </button>

                    </div>

                    <div
                        id="pageEditStatus"
                        class="editor-status"
                    ></div>

                </div>

            </div>


            <div class="side-tool-box">

                <div class="side-tool-title">
                    3. 코드 편집
                </div>

                <div class="side-tool-body">

                    <div class="editor-help">
                        GPT에서 만든 HTML / CSS / JS 코드를
                        그대로 붙여넣을 수 있습니다.
                    </div>

                    <textarea
                        id="pageCodeEditor"
                        class="editor-code-area"
                        placeholder="<h2>업무화면</h2>

<style>
...
</style>

<script>
...
<\/script>"
                    ></textarea>

                    <div class="editor-button-row">

                        <button
                            id="codePreviewBtn"
                            class="btn"
                            type="button"
                        >
                            미리보기
                        </button>

                        <button
                            id="codeSaveBtn"
                            class="btn btn-primary"
                            type="button"
                        >
                            저장
                        </button>

                        <button
                            id="codeResetBtn"
                            class="btn"
                            type="button"
                        >
                            코드 삭제
                        </button>

                    </div>

                    <div
                        id="codeStatus"
                        class="editor-status"
                    ></div>

                </div>

            </div>
        `;
    }


    // =====================================================
    // 업무 메모
    // =====================================================

    function initMemo() {

        const memo =
            get(
                "workMemo"
            );

        const button =
            get(
                "saveMemo"
            );


        if (
            !memo ||
            !button
        ) {

            return;
        }


        memo.value =
            localStorage.getItem(
                storageKey(
                    "MEMO"
                )
            ) || "";


        button.addEventListener(
            "click",
            () => {

                localStorage.setItem(
                    storageKey(
                        "MEMO"
                    ),
                    memo.value
                );

                showStatus(
                    "memoStatus",
                    "메모 저장 완료"
                );
            }
        );
    }


    // =====================================================
    // 페이지 제목 / 설명 편집
    // =====================================================

    function initPageEditor() {

        const titleElement =
            document.querySelector(
                ".page-title"
            );

        const descriptionElement =
            document.querySelector(
                ".page-description"
            );


        if (
            !titleElement ||
            !descriptionElement
        ) {

            return;
        }


        const originalTitle =
            titleElement.textContent.trim();

        const originalDescription =
            descriptionElement.textContent.trim();


        const saved =
            JSON.parse(
                localStorage.getItem(
                    storageKey(
                        "PAGE_EDIT"
                    )
                ) || "{}"
            );


        const currentTitle =
            saved.title ||
            originalTitle;

        const currentDescription =
            saved.description ||
            originalDescription;


        titleElement.textContent =
            currentTitle;

        descriptionElement.textContent =
            currentDescription;


        get(
            "pageEditTitle"
        ).value =
            currentTitle;


        get(
            "pageEditDescription"
        ).value =
            currentDescription;


        get(
            "pageEditSave"
        ).addEventListener(
            "click",
            () => {

                const data = {

                    title:
                        get(
                            "pageEditTitle"
                        ).value.trim(),

                    description:
                        get(
                            "pageEditDescription"
                        ).value.trim()
                };


                localStorage.setItem(
                    storageKey(
                        "PAGE_EDIT"
                    ),
                    JSON.stringify(
                        data
                    )
                );


                titleElement.textContent =
                    data.title ||
                    originalTitle;


                descriptionElement.textContent =
                    data.description ||
                    originalDescription;


                showStatus(
                    "pageEditStatus",
                    "페이지 설정 저장 완료"
                );
            }
        );


        get(
            "pageEditReset"
        ).addEventListener(
            "click",
            () => {

                localStorage.removeItem(
                    storageKey(
                        "PAGE_EDIT"
                    )
                );


                titleElement.textContent =
                    originalTitle;

                descriptionElement.textContent =
                    originalDescription;


                get(
                    "pageEditTitle"
                ).value =
                    originalTitle;

                get(
                    "pageEditDescription"
                ).value =
                    originalDescription;


                showStatus(
                    "pageEditStatus",
                    "기본값 복원 완료"
                );
            }
        );
    }


    // =====================================================
    // 코드 렌더링
    // =====================================================

    function createCodePanel() {

        const workArea =
            document.querySelector(
                ".work-area"
            );

        if (!workArea) {
            return null;
        }


        let panel =
            document.getElementById(
                "customCodePanel"
            );


        if (panel) {
            return panel;
        }


        panel =
            document.createElement(
                "section"
            );


        panel.id =
            "customCodePanel";

        panel.className =
            "panel custom-code-panel";


        const toolbar =
            workArea.querySelector(
                ".toolbar"
            );


        if (toolbar) {

            toolbar.insertAdjacentElement(
                "afterend",
                panel
            );
        }
        else {

            workArea.appendChild(
                panel
            );
        }


        return panel;
    }


    function renderCode(
        code
    ) {

        const panel =
            createCodePanel();


        if (!panel) {
            return;
        }


        if (
            !code ||
            !code.trim()
        ) {

            panel.style.display =
                "none";

            return;
        }


        panel.style.display =
            "block";


        panel.innerHTML = "";


        const frame =
            document.createElement(
                "iframe"
            );


        frame.className =
            "custom-code-frame";

        frame.setAttribute(
            "sandbox",
            "allow-scripts allow-forms allow-modals"
        );


        frame.srcdoc =
            code;


        panel.appendChild(
            frame
        );
    }


    // =====================================================
    // 코드 미리보기
    // =====================================================

    function createPreview() {

        let overlay =
            document.getElementById(
                "editorPreviewOverlay"
            );


        if (overlay) {
            return overlay;
        }


        overlay =
            document.createElement(
                "div"
            );


        overlay.id =
            "editorPreviewOverlay";

        overlay.className =
            "editor-preview-overlay";


        overlay.innerHTML = `

            <div class="editor-preview-window">

                <div class="editor-preview-top">

                    <strong>
                        코드 미리보기
                    </strong>

                    <button
                        id="editorPreviewClose"
                        class="btn"
                        type="button"
                    >
                        닫기
                    </button>

                </div>

                <iframe
                    id="editorPreviewFrame"
                    class="editor-preview-frame"
                    sandbox="allow-scripts allow-forms allow-modals"
                ></iframe>

            </div>
        `;


        document.body.appendChild(
            overlay
        );


        get(
            "editorPreviewClose"
        ).addEventListener(
            "click",
            () => {

                overlay.classList.remove(
                    "open"
                );
            }
        );


        return overlay;
    }


    // =====================================================
    // 코드 편집
    // =====================================================

    function initCodeEditor() {

        const editor =
            get(
                "pageCodeEditor"
            );


        if (!editor) {
            return;
        }


        const savedCode =
            localStorage.getItem(
                storageKey(
                    "CODE"
                )
            ) || "";


        editor.value =
            savedCode;


        renderCode(
            savedCode
        );


        get(
            "codePreviewBtn"
        ).addEventListener(
            "click",
            () => {

                const overlay =
                    createPreview();


                const frame =
                    get(
                        "editorPreviewFrame"
                    );


                frame.srcdoc =
                    editor.value;


                overlay.classList.add(
                    "open"
                );
            }
        );


        get(
            "codeSaveBtn"
        ).addEventListener(
            "click",
            () => {

                const code =
                    editor.value;


                localStorage.setItem(
                    storageKey(
                        "CODE"
                    ),
                    code
                );


                renderCode(
                    code
                );


                showStatus(
                    "codeStatus",
                    "코드 저장 완료"
                );
            }
        );


        get(
            "codeResetBtn"
        ).addEventListener(
            "click",
            () => {

                const ok =
                    confirm(
                        "현재 페이지에 저장된 코드를 삭제하시겠습니까?"
                    );


                if (!ok) {
                    return;
                }


                localStorage.removeItem(
                    storageKey(
                        "CODE"
                    )
                );


                editor.value =
                    "";


                renderCode(
                    ""
                );


                showStatus(
                    "codeStatus",
                    "코드 삭제 완료"
                );
            }
        );
    }


    // =====================================================
    // 시작
    // =====================================================

    window.addEventListener(
        "DOMContentLoaded",
        () => {

            buildRightTools();

            initMemo();

            initPageEditor();

            initCodeEditor();
        }
    );

})();
