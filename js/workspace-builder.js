(() => {
    "use strict";

    const API_BASE =
        "https://taeon-v2-api.onrender.com";

    const PIN =
        "2739";

    const config =
        window.TAEON_MODULE || {};

    const state = {

        feature:
            window.__TAEON_SELECTED_FEATURE__ ||
            (config.features || [])[0] ||
            "",

        blocks: [],

        activeBlockId: "",

        unlocked: false,

        memo: "",

        pageTitle: "",

        pageDescription: "",

        remoteData: {},

        previewData: {},

        latestEvent: null,

        historyItems: []
    };


    function $(id) {

        return document.getElementById(
            id
        );
    }


    function escapeHtml(value) {

        return String(
            value ?? ""
        )
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function money(value) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {

            return "";
        }


        const n =
            Number(value);


        return Number.isFinite(n)
            ? n.toLocaleString("ko-KR")
            : String(value);
    }


    async function api(
        path,
        options = {}
    ) {

        const response =
            await fetch(
                API_BASE + path,
                {
                    headers: {

                        "Content-Type":
                            "application/json",

                        ...(options.headers || {})
                    },

                    ...options
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                data.error ||
                `HTTP ${response.status}`
            );
        }


        return data;
    }


    function selectedFeature() {

        return (

            window.__TAEON_SELECTED_FEATURE__ ||

            state.feature ||

            (config.features || [])[0] ||

            ""
        );
    }


    function defaultBlock() {

        return {

            id:
                "HTML-" +
                Date.now()
                    .toString(36)
                    .toUpperCase(),

            title:
                "새 HTML 박스",

            code:
`<div style="font-family:Arial,sans-serif;padding:14px;border:1px solid #e5e7eb;border-radius:10px;background:#fff;">
  <strong>{{title}}</strong>
  <div style="margin-top:6px;color:#475569;">{{company}}</div>
  <div style="margin-top:6px;">업무: {{feature}}</div>
  <div style="margin-top:6px;">금액: {{amountText}}</div>
</div>`
        };
    }


    function latest(
        items,
        type
    ) {

        return items
            .filter(
                item =>
                    item &&
                    item.type === type &&
                    item.group ===
                        (config.folder || "") &&
                    item.page ===
                        selectedFeature()
            )
            .sort(
                (a, b) =>
                    new Date(
                        b.createdAt || 0
                    ) -
                    new Date(
                        a.createdAt || 0
                    )
            )[0] || null;
    }


    async function loadHistory() {

        const result =
            await api(
                "/api/pages/history"
            );


        state.historyItems =
            Array.isArray(
                result.items
            )
                ? result.items
                : [];


        const layout =
            latest(
                state.historyItems,
                "PAGE_LAYOUT"
            );


        const dataItem =
            latest(
                state.historyItems,
                "PAGE_DATA"
            );


        const layoutData =

            layout &&
            layout.data &&
            typeof layout.data ===
                "object"

                ? layout.data
                : {};


        const remoteData =

            dataItem &&
            dataItem.data &&
            typeof dataItem.data ===
                "object"

                ? dataItem.data
                : {};


        state.blocks =
            Array.isArray(
                layoutData.blocks
            )
                ? layoutData.blocks
                : [];


        state.memo =
            layoutData.memo ||
            "";


        state.pageTitle =
            layoutData.pageTitle ||
            selectedFeature();


        state.pageDescription =
            layoutData.pageDescription ||
            "";


        state.remoteData =
            remoteData;


        state.activeBlockId =
            state.blocks[0]?.id ||
            "";
    }


    async function saveHistory(
        type,
        title,
        data
    ) {

        return api(
            "/api/pages/history",
            {
                method:
                    "POST",

                body:
                    JSON.stringify({

                        type,

                        title,

                        page:
                            selectedFeature(),

                        group:
                            config.folder ||
                            "",

                        data
                    })
            }
        );
    }


    async function saveLayout() {

        await saveHistory(

            "PAGE_LAYOUT",

            "페이지 레이아웃 저장",

            {

                blocks:
                    state.blocks,

                memo:
                    state.memo,

                pageTitle:
                    state.pageTitle,

                pageDescription:
                    state.pageDescription,

                savedAt:
                    new Date()
                        .toISOString()
            }
        );


        setTinyStatus(
            "taeonLayoutStatus",
            "저장됨"
        );
    }


    async function saveDataSnapshot(
        data
    ) {

        state.remoteData = {

            ...state.remoteData,

            ...data
        };


        await saveHistory(

            "PAGE_DATA",

            "고정 데이터 적용",

            {

                ...state.remoteData,

                module:
                    config.name ||
                    "",

                folder:
                    config.folder ||
                    "",

                feature:
                    selectedFeature(),

                savedAt:
                    new Date()
                        .toISOString()
            }
        );
    }


    function setTinyStatus(
        id,
        text
    ) {

        const el =
            $(id);


        if (!el) {

            return;
        }


        el.textContent =
            text;


        window.setTimeout(
            () => {

                if (
                    el.textContent ===
                    text
                ) {

                    el.textContent =
                        "";
                }
            },
            1400
        );
    }


    function formValue(id) {

        const el =
            $(id);


        return el
            ? String(
                el.value ||
                ""
            ).trim()
            : "";
    }


    function currentData() {

        const fields =
            state.previewData.fields ||
            {};


        const event =
            state.latestEvent ||
            {};


        const summaryTotal =
            Number(
                $("moduleEventCount")
                    ?.textContent ||
                0
            );


        const summaryOpen =
            Number(
                $("moduleOpenCount")
                    ?.textContent ||
                0
            );


        const summaryDone =
            Number(
                $("moduleDoneCount")
                    ?.textContent ||
                0
            );


        const merged = {

            module:
                config.name ||
                "",

            folder:
                config.folder ||
                "",

            feature:
                selectedFeature(),

            title:

                formValue(
                    "eventTitle"
                ) ||

                event.title ||

                state.remoteData.title ||

                "",

            company:

                formValue(
                    "eventCompany"
                ) ||

                event.company ||

                fields.company ||

                state.remoteData.company ||

                "",

            site:

                formValue(
                    "eventSite"
                ) ||

                event.site ||

                fields.site ||

                state.remoteData.site ||

                "",

            people:

                formValue(
                    "eventPeople"
                ) ||

                (
                    Array.isArray(
                        event.people
                    )
                        ? event.people.join(
                            ", "
                        )
                        : ""
                ) ||

                state.remoteData.people ||

                "",

            content:

                formValue(
                    "eventContent"
                ) ||

                event.content ||

                state.remoteData.content ||

                "",

            documentTitle:

                formValue(
                    "documentTitle"
                ) ||

                state.remoteData.documentTitle ||

                "",

            documentMemo:

                formValue(
                    "documentMemo"
                ) ||

                state.remoteData.documentMemo ||

                "",

            documentType:

                fields.documentType ||

                state.remoteData.documentType ||

                "",

            bank:

                fields.bank ||

                state.remoteData.bank ||

                "",

            account:

                fields.account ||

                state.remoteData.account ||

                "",

            amount:

                fields.amount ??

                state.remoteData.amount ??

                "",

            supplyAmount:

                fields.supplyAmount ??

                state.remoteData.supplyAmount ??

                "",

            vat:

                fields.vat ??

                state.remoteData.vat ??

                "",

            totalAmount:

                fields.totalAmount ??

                state.remoteData.totalAmount ??

                "",

            date:

                fields.date ||

                state.remoteData.date ||

                "",

            businessNumber:

                fields.businessNumber ||

                state.remoteData.businessNumber ||

                "",

            status:

                event.status ||

                state.remoteData.status ||

                "",

            eventId:

                event.eventId ||

                state.remoteData.eventId ||

                "",

            documentId:

                (
                    event.relatedDocumentIds ||
                    []
                )[0] ||

                state.remoteData.documentId ||

                "",

            total:
                summaryTotal,

            open:
                summaryOpen,

            done:
                summaryDone
        };


        merged.amountText =
            money(
                merged.amount
            );


        merged.totalAmountText =
            money(
                merged.totalAmount
            );


        merged.supplyAmountText =
            money(
                merged.supplyAmount
            );


        merged.vatText =
            money(
                merged.vat
            );


        return merged;
    }


    function exposeData() {

        window.TAEON_PAGE_DATA =
            currentData();


        window.dispatchEvent(

            new CustomEvent(
                "taeon:page-data",
                {
                    detail:
                        window.TAEON_PAGE_DATA
                }
            )
        );
    }


    async function loadLatestEvent() {

        try {

            const result =
                await api(
                    "/api/events"
                );


            const events =
                Array.isArray(
                    result.events
                )
                    ? result.events
                    : [];


            const feature =
                selectedFeature();


            const candidates =
                events
                    .filter(
                        event => {

                            const tags =
                                Array.isArray(
                                    event.tags
                                )
                                    ? event.tags
                                    : [];


                            const moduleMatch =

                                tags.includes(
                                    config.code
                                ) ||

                                tags.includes(
                                    config.name
                                ) ||

                                tags.includes(
                                    config.folder
                                );


                            return (

                                moduleMatch &&

                                (
                                    !feature ||
                                    tags.includes(
                                        feature
                                    )
                                )
                            );
                        }
                    )
                    .sort(
                        (a, b) =>

                            new Date(
                                b.occurredAt ||
                                b.createdAt ||
                                0
                            ) -

                            new Date(
                                a.occurredAt ||
                                a.createdAt ||
                                0
                            )
                    );


            state.latestEvent =
                candidates[0] ||
                null;

        } catch (error) {

            console.warn(
                "[TAEON BUILDER] event load failed",
                error.message
            );
        }


        exposeData();

        renderDataPanel();

        renderBlocks();
    }


    function templateValue(
        data,
        path
    ) {

        const parts =
            String(
                path ||
                ""
            ).split(".");


        let value =
            data;


        for (
            const part
            of parts
        ) {

            if (
                value === null ||
                value === undefined
            ) {

                return "";
            }


            value =
                value[part];
        }


        return value ??
            "";
    }


    function renderTemplate(
        code,
        data
    ) {

        return String(
            code ||
            ""
        )
            .replace(
                /{{\s*([\w.]+)\s*}}/g,

                (
                    _,
                    key
                ) =>
                    escapeHtml(
                        templateValue(
                            data,
                            key
                        )
                    )
            );
    }


    function iframeDocument(
        code,
        data
    ) {

        const safeJson =
            JSON.stringify(
                data
            )
            .replace(
                /</g,
                "\\u003c"
            );


        return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta
    name="viewport"
    content="width=device-width,initial-scale=1"
>
<style>
html,body{
    margin:0;
    padding:0;
    background:transparent;
    font-family:Arial,sans-serif;
    color:#111827;
}
*{
    box-sizing:border-box;
}
</style>
</head>
<body>
<script>
window.TAEON_DATA=${safeJson};
<\/script>
${renderTemplate(code,data)}
</body>
</html>`;
    }


    function renderBlocks() {

        const zone =
            $("taeonHtmlBlocks");


        if (!zone) {

            return;
        }


        const data =
            currentData();


        zone.innerHTML =
            "";


        if (
            !state.blocks.length
        ) {

            zone.innerHTML =
`<div class="taeon-empty-block">
HTML 박스가 없습니다.
아래의 <b>+ HTML 박스 추가</b>를 눌러 추가하세요.
</div>`;


            syncCodeEditor();

            return;
        }


        state.blocks.forEach(
            (
                block,
                index
            ) => {

                const wrap =
                    document.createElement(
                        "section"
                    );


                wrap.className =
                    "taeon-html-block";


                wrap.dataset.blockId =
                    block.id;


                wrap.innerHTML =
`
<div class="taeon-html-toolbar">

    <strong>
        ${escapeHtml(
            block.title ||
            "HTML 박스"
        )}
    </strong>

    <div class="taeon-html-actions">

        <button
            type="button"
            data-act="up"
            ${
                index === 0
                    ? "disabled"
                    : ""
            }
        >
            ↑
        </button>

        <button
            type="button"
            data-act="down"
            ${
                index ===
                state.blocks.length - 1
                    ? "disabled"
                    : ""
            }
        >
            ↓
        </button>

        <button
            type="button"
            data-act="edit"
        >
            코드
        </button>

        <button
            type="button"
            data-act="delete"
            class="danger"
        >
            삭제
        </button>

    </div>

</div>

<iframe
    class="taeon-html-frame"
    sandbox="allow-scripts"
></iframe>
`;


                const frame =
                    wrap.querySelector(
                        "iframe"
                    );


                frame.srcdoc =
                    iframeDocument(
                        block.code,
                        data
                    );


                wrap.addEventListener(
                    "click",
                    event => {

                        const act =
                            event.target
                                ?.dataset
                                ?.act;


                        if (!act) {

                            return;
                        }


                        if (
                            act === "up" &&
                            index > 0
                        ) {

                            [
                                state.blocks[
                                    index - 1
                                ],
                                state.blocks[
                                    index
                                ]
                            ] =

                            [
                                state.blocks[
                                    index
                                ],
                                state.blocks[
                                    index - 1
                                ]
                            ];


                            saveLayout()
                                .then(
                                    renderBlocks
                                );
                        }


                        if (
                            act === "down" &&
                            index <
                            state.blocks.length - 1
                        ) {

                            [
                                state.blocks[
                                    index + 1
                                ],
                                state.blocks[
                                    index
                                ]
                            ] =

                            [
                                state.blocks[
                                    index
                                ],
                                state.blocks[
                                    index + 1
                                ]
                            ];


                            saveLayout()
                                .then(
                                    renderBlocks
                                );
                        }


                        if (
                            act ===
                            "edit"
                        ) {

                            state.activeBlockId =
                                block.id;


                            syncCodeEditor();


                            $("taeonCodeCard")
                                ?.scrollIntoView(
                                    {
                                        behavior:
                                            "smooth",

                                        block:
                                            "start"
                                    }
                                );
                        }


                        if (
                            act ===
                            "delete"
                        ) {

                            if (
                                !window.confirm(
                                    `'${block.title || "HTML 박스"}' 박스를 삭제할까요?`
                                )
                            ) {

                                return;
                            }


                            state.blocks =
                                state.blocks.filter(
                                    item =>
                                        item.id !==
                                        block.id
                                );


                            if (
                                state.activeBlockId ===
                                block.id
                            ) {

                                state.activeBlockId =
                                    state.blocks[0]
                                        ?.id ||
                                    "";
                            }


                            saveLayout()
                                .then(
                                    renderBlocks
                                );
                        }
                    }
                );


                zone.appendChild(
                    wrap
                );
            }
        );


        syncCodeEditor();
    }


    function renderDataPanel() {

        const host =
            $("taeonDataGrid");


        if (!host) {

            return;
        }


        const data =
            currentData();


        const defs = [

            [
                "업무",
                data.feature
            ],

            [
                "제목",
                data.title
            ],

            [
                "회사",
                data.company
            ],

            [
                "현장",
                data.site
            ],

            [
                "문서종류",
                data.documentType
            ],

            [
                "금액",
                data.amountText
            ],

            [
                "은행",
                data.bank
            ],

            [
                "계좌",
                data.account
            ],

            [
                "날짜",
                data.date
            ],

            [
                "상태",
                data.status
            ],

            [
                "EVENT",
                data.eventId
            ],

            [
                "DOCUMENT",
                data.documentId
            ]
        ];


        host.innerHTML =
            defs
                .map(
                    (
                        [
                            label,
                            value
                        ]
                    ) =>
`
<div
    class="taeon-data-cell ${
        value
            ? "has-value"
            : ""
    }"
>

    <span>
        ${escapeHtml(label)}
    </span>

    <b>
        ${escapeHtml(
            value ||
            "-"
        )}
    </b>

</div>
`
                )
                .join("");


        const keys =
            $("taeonDataKeys");


        if (keys) {

            keys.textContent =
                "사용값: {{title}} {{company}} {{amountText}} {{bank}} {{account}} {{date}} {{status}} · JS: TAEON_DATA";
        }


        exposeData();
    }


    function syncCodeEditor() {

        const selector =
            $("taeonBlockSelect");


        const editor =
            $("taeonCodeEditor");


        const titleInput =
            $("taeonBlockTitle");


        if (
            !selector ||
            !editor ||
            !titleInput
        ) {

            return;
        }


        selector.innerHTML =
            state.blocks
                .map(
                    block =>
`<option
    value="${escapeHtml(block.id)}"
>
${escapeHtml(
    block.title ||
    block.id
)}
</option>`
                )
                .join("");


        if (
            !state.activeBlockId &&
            state.blocks[0]
        ) {

            state.activeBlockId =
                state.blocks[0].id;
        }


        selector.value =
            state.activeBlockId;


        const block =
            state.blocks.find(
                item =>
                    item.id ===
                    state.activeBlockId
            );


        titleInput.value =
            block?.title ||
            "";


        editor.value =
            block?.code ||
            "";


        const disabled =

            !state.unlocked ||

            !block;


        editor.disabled =
            disabled;


        titleInput.disabled =
            disabled;


        $("taeonCodeSave").disabled =
            disabled;
    }


    function createShell() {

        if (
            $("taeonWorkspaceShell")
        ) {

            return;
        }


        const main =
            document.querySelector(
                "main.main"
            );


        const intake =
            document.querySelector(
                ".intake-panel"
            );


        const formArea =
            document.querySelector(
                ".two-column"
            );


        const eventList =
            $("eventList");


        const historyPanel =
            eventList
                ?.closest(
                    "section.panel"
                );


        const summaryPanel =
            $("selectedFeature")
                ?.closest(
                    "section.panel"
                );


        if (
            !main ||
            !intake ||
            !summaryPanel
        ) {

            return;
        }


        const shell =
            document.createElement(
                "section"
            );


        shell.id =
            "taeonWorkspaceShell";


        shell.className =
            "taeon-workspace-shell";


        shell.innerHTML =
`
<div
    class="taeon-workspace-main"
    id="taeonWorkspaceMain"
>

    <section
        class="taeon-fixed-card taeon-data-card"
    >

        <div class="taeon-card-head">

            <div>

                <b>
                    고정 데이터 적용
                </b>

                <small>
                    API · 자동판독 데이터를 HTML 박스에 공급
                </small>

            </div>

            <span
                id="taeonDataSaveStatus"
            ></span>

        </div>

        <div
            id="taeonDataGrid"
            class="taeon-data-grid"
        ></div>

        <div
            id="taeonDataKeys"
            class="taeon-data-keys"
        ></div>

    </section>


    <section
        class="taeon-page-heading"
    >

        <div>

            <h2
                id="taeonPageHeading"
            ></h2>

            <p
                id="taeonPageDescription"
            ></p>

        </div>

        <button
            type="button"
            id="taeonAddBlock"
            class="taeon-primary"
        >
            + HTML 박스 추가
        </button>

    </section>


    <div
        id="taeonHtmlBlocks"
    ></div>


    <details
        class="taeon-system-box"
        open
    >

        <summary>
            기본 업무 입력 · 문서 등록
        </summary>

        <div
            id="taeonSystemForms"
        ></div>

    </details>


    <details
        class="taeon-system-box"
        open
    >

        <summary>
            업무이력 조회
        </summary>

        <div
            id="taeonSystemHistory"
        ></div>

    </details>

</div>


<aside
    class="taeon-workspace-side"
>

    <section
        class="taeon-side-card"
    >

        <h3>
            업무 메모
        </h3>

        <textarea
            id="taeonMemo"
            placeholder="현재 업무 메모"
        ></textarea>

        <div
            class="taeon-side-actions"
        >

            <button
                id="taeonMemoSave"
                type="button"
            >
                메모 저장
            </button>

            <span
                id="taeonMemoStatus"
            ></span>

        </div>

    </section>


    <section
        class="taeon-side-card"
    >

        <h3>
            페이지 설정
        </h3>

        <label>

            표시 제목

            <input
                id="taeonPageTitleInput"
                type="text"
            >

        </label>

        <label>

            설명

            <textarea
                id="taeonPageDescInput"
            ></textarea>

        </label>

        <div
            class="taeon-side-actions"
        >

            <button
                id="taeonLayoutSave"
                type="button"
            >
                설정 저장
            </button>

            <span
                id="taeonLayoutStatus"
            ></span>

        </div>

    </section>


    <section
        class="taeon-side-card taeon-code-card"
        id="taeonCodeCard"
    >

        <h3>
            코드 편집
        </h3>

        <div
            id="taeonCodeLock"
        >

            <input
                id="taeonCodePin"
                type="password"
                inputmode="numeric"
                placeholder="인증번호"
            >

            <button
                id="taeonCodeUnlock"
                type="button"
            >
                인증
            </button>

        </div>

        <div
            class="taeon-code-editor-wrap"
        >

            <select
                id="taeonBlockSelect"
            ></select>

            <input
                id="taeonBlockTitle"
                type="text"
                placeholder="박스 제목"
                disabled
            >

            <textarea
                id="taeonCodeEditor"
                spellcheck="false"
                placeholder="HTML / CSS / JS"
                disabled
            ></textarea>

            <button
                id="taeonCodeSave"
                type="button"
                disabled
            >
                코드 저장
            </button>

            <small>
                HTML: {{title}}, {{company}}, {{amountText}}
                · JS: TAEON_DATA
            </small>

        </div>

    </section>

</aside>
`;


        summaryPanel
            .insertAdjacentElement(
                "afterend",
                shell
            );


        const mainHost =
            $("taeonWorkspaceMain");


        mainHost.insertBefore(
            intake,
            mainHost.firstChild
        );


        if (formArea) {

            $("taeonSystemForms")
                .appendChild(
                    formArea
                );
        }


        if (historyPanel) {

            $("taeonSystemHistory")
                .appendChild(
                    historyPanel
                );
        }
    }


    function applyPageSettings() {

        $("taeonMemo").value =
            state.memo ||
            "";


        $("taeonPageTitleInput").value =
            state.pageTitle ||
            selectedFeature();


        $("taeonPageDescInput").value =
            state.pageDescription ||
            "";


        $("taeonPageHeading").textContent =
            state.pageTitle ||
            selectedFeature();


        $("taeonPageDescription").textContent =
            state.pageDescription ||
            "";
    }


    function bindBuilderEvents() {

        $("taeonAddBlock")
            ?.addEventListener(
                "click",
                async () => {

                    const block =
                        defaultBlock();


                    state.blocks.push(
                        block
                    );


                    state.activeBlockId =
                        block.id;


                    await saveLayout();


                    renderBlocks();
                }
            );


        $("taeonMemoSave")
            ?.addEventListener(
                "click",
                async () => {

                    state.memo =
                        $("taeonMemo")
                            .value;


                    await saveLayout();


                    setTinyStatus(
                        "taeonMemoStatus",
                        "저장됨"
                    );
                }
            );


        $("taeonLayoutSave")
            ?.addEventListener(
                "click",
                async () => {

                    state.pageTitle =

                        $("taeonPageTitleInput")
                            .value
                            .trim() ||

                        selectedFeature();


                    state.pageDescription =

                        $("taeonPageDescInput")
                            .value
                            .trim();


                    await saveLayout();


                    applyPageSettings();
                }
            );


        $("taeonCodeUnlock")
            ?.addEventListener(
                "click",
                () => {

                    if (
                        $("taeonCodePin")
                            .value !==
                        PIN
                    ) {

                        window.alert(
                            "인증번호가 맞지 않습니다."
                        );

                        return;
                    }


                    state.unlocked =
                        true;


                    $("taeonCodePin").value =
                        "";


                    $("taeonCodeLock")
                        .classList
                        .add(
                            "unlocked"
                        );


                    syncCodeEditor();
                }
            );


        $("taeonBlockSelect")
            ?.addEventListener(
                "change",
                event => {

                    state.activeBlockId =
                        event.target.value;


                    syncCodeEditor();
                }
            );


        $("taeonCodeSave")
            ?.addEventListener(
                "click",
                async () => {

                    if (
                        !state.unlocked
                    ) {

                        return;
                    }


                    const block =
                        state.blocks.find(
                            item =>
                                item.id ===
                                state.activeBlockId
                        );


                    if (!block) {

                        return;
                    }


                    block.title =

                        $("taeonBlockTitle")
                            .value
                            .trim() ||

                        "HTML 박스";


                    block.code =
                        $("taeonCodeEditor")
                            .value;


                    await saveLayout();


                    renderBlocks();
                }
            );


        window.addEventListener(

            "taeon:intake-preview",

            async event => {

                state.previewData =
                    event.detail ||
                    {};


                renderDataPanel();

                renderBlocks();


                try {

                    await saveDataSnapshot(
                        currentData()
                    );


                    setTinyStatus(
                        "taeonDataSaveStatus",
                        "API 저장"
                    );

                } catch (error) {

                    console.warn(
                        "[TAEON BUILDER] data snapshot save failed",
                        error.message
                    );
                }
            }
        );


        window.addEventListener(

            "taeon:feature-change",

            async event => {

                state.feature =
                    event.detail
                        ?.feature ||
                    selectedFeature();


                state.previewData =
                    {};


                state.latestEvent =
                    null;


                state.unlocked =
                    false;


                try {

                    await loadHistory();

                } catch (error) {

                    console.warn(
                        "[TAEON BUILDER] history load failed",
                        error.message
                    );
                }


                applyPageSettings();

                renderBlocks();

                await loadLatestEvent();
            }
        );


        [
            "eventTitle",
            "eventCompany",
            "eventSite",
            "eventPeople",
            "eventContent",
            "documentTitle",
            "documentMemo"
        ]
        .forEach(
            id => {

                $(id)
                    ?.addEventListener(
                        "input",
                        () => {

                            renderDataPanel();

                            renderBlocks();
                        }
                    );
            }
        );


        $("applyIntakeBtn")
            ?.addEventListener(
                "click",
                () => {

                    window.setTimeout(
                        async () => {

                            await loadLatestEvent();


                            try {

                                await saveDataSnapshot(
                                    currentData()
                                );

                            } catch {}
                        },
                        1200
                    );
                }
            );


        const eventList =
            $("eventList");


        if (eventList) {

            const observer =
                new MutationObserver(
                    () => {

                        window.clearTimeout(
                            observer._timer
                        );


                        observer._timer =
                            window.setTimeout(
                                loadLatestEvent,
                                350
                            );
                    }
                );


            observer.observe(
                eventList,
                {
                    childList:
                        true,

                    subtree:
                        true
                }
            );
        }
    }


    async function init() {

        createShell();


        if (
            !$(
                "taeonWorkspaceShell"
            )
        ) {

            return;
        }


        try {

            await loadHistory();

        } catch (error) {

            console.warn(
                "[TAEON BUILDER] history init failed",
                error.message
            );


            state.pageTitle =
                selectedFeature();
        }


        applyPageSettings();

        bindBuilderEvents();

        renderDataPanel();

        renderBlocks();

        await loadLatestEvent();


        console.log(
            "[PASS] TAEON V2 WORKSPACE BUILDER"
        );
    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init,
            {
                once:
                    true
            }
        );

    } else {

        init();
    }

})();