(() => {
    "use strict";

    const API_BASE =
        "https://taeon-v2-api.onrender.com";

    const CODE_PIN =
        "2739";

    /*
     * 현재 개발 단계:
     * 관리자 영역을 표시한다.
     *
     * 향후 로그인/권한시스템 적용 후
     * window.TAEON_ADMIN_MODE = false
     * 로 일반사용자에게 관리자 영역을 숨길 수 있다.
     */
    const ADMIN_MODE =
        window.TAEON_ADMIN_MODE !== false;


    const config =
        window.TAEON_MODULE || {};


    const state = {

        feature:
            window.__TAEON_SELECTED_FEATURE__ ||
            (config.features || [])[0] ||
            "",

        /*
         * 웹페이지용 HTML 박스
         */
        blocks: [],

        activeBlockId: "",


        /*
         * 실제 업무처리 박스
         */
        workBoxes: [],

        activeWorkBoxId: "",


        /*
         * 관리자 코드 잠금
         */
        codeUnlocked: false,


        /*
         * 일반 페이지 데이터
         */
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


    function nl2br(value) {

        return escapeHtml(
            value || ""
        )
            .replace(
                /\r?\n/g,
                "<br>"
            );
    }


    function money(value) {

        if (
            value === "" ||
            value === null ||
            value === undefined
        ) {

            return "";
        }


        const number =
            Number(value);


        return Number.isFinite(number)
            ? number.toLocaleString("ko-KR")
            : String(value);
    }


    function makeId(prefix) {

        return (
            prefix +
            "-" +
            Date.now()
                .toString(36)
                .toUpperCase() +
            "-" +
            Math.random()
                .toString(36)
                .slice(2,7)
                .toUpperCase()
        );
    }


    function selectedFeature() {

        return (

            window.__TAEON_SELECTED_FEATURE__ ||

            state.feature ||

            (config.features || [])[0] ||

            ""
        );
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


    function setStatus(
        id,
        text,
        error = false
    ) {

        const element =
            $(id);


        if (!element) {

            return;
        }


        element.textContent =
            text;


        element.classList.toggle(
            "error",
            error
        );


        if (!error) {

            window.setTimeout(
                () => {

                    if (
                        element.textContent ===
                        text
                    ) {

                        element.textContent =
                            "";
                    }

                },
                1800
            );
        }
    }


    function latestHistory(
        type
    ) {

        return state.historyItems
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
                (a,b) =>

                    new Date(
                        b.createdAt || 0
                    ) -

                    new Date(
                        a.createdAt || 0
                    )
            )[0] || null;
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
            latestHistory(
                "PAGE_LAYOUT"
            );


        const pageData =
            latestHistory(
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

            pageData &&
            pageData.data &&
            typeof pageData.data ===
                "object"

                ? pageData.data
                : {};


        state.blocks =
            Array.isArray(
                layoutData.blocks
            )
                ? layoutData.blocks
                : [];


        state.workBoxes =
            Array.isArray(
                layoutData.workBoxes
            )
                ? layoutData.workBoxes
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


        state.activeWorkBoxId =
            state.workBoxes[0]?.id ||
            "";
    }


    async function saveLayout() {

        await saveHistory(
            "PAGE_LAYOUT",
            "업무페이지 구성 저장",
            {

                blocks:
                    state.blocks,

                workBoxes:
                    state.workBoxes,

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


        setStatus(
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


    function formValue(id) {

        const element =
            $(id);


        return element
            ? String(
                element.value ||
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


        const data = {

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

                Number(
                    $("moduleEventCount")
                        ?.textContent ||
                    0
                ),


            open:

                Number(
                    $("moduleOpenCount")
                        ?.textContent ||
                    0
                ),


            done:

                Number(
                    $("moduleDoneCount")
                        ?.textContent ||
                    0
                )
        };


        data.amountText =
            money(
                data.amount
            );


        data.supplyAmountText =
            money(
                data.supplyAmount
            );


        data.vatText =
            money(
                data.vat
            );


        data.totalAmountText =
            money(
                data.totalAmount
            );


        return data;
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


            state.latestEvent =
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
                        (a,b) =>

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
                    )[0] ||
                null;

        }
        catch (error) {

            console.warn(
                "[TAEON] EVENT LOAD",
                error.message
            );
        }


        exposeData();

        renderDataPanel();

        renderHtmlBlocks();
    }


    function templateValue(
        data,
        path
    ) {

        const keys =
            String(
                path ||
                ""
            ).split(".");


        let value =
            data;


        for (const key of keys) {

            if (
                value === null ||
                value === undefined
            ) {

                return "";
            }


            value =
                value[key];
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


    /*
     * ========================================================
     * HTML IFRAME 자동 높이
     * ========================================================
     *
     * iframe 안의 콘텐츠가 길어지면
     * ResizeObserver → parent.postMessage
     * 방식으로 실제 높이를 부모페이지에 전달한다.
     */
    function iframeDocument(
        blockId,
        code,
        data
    ) {

        const safeData =
            JSON.stringify(
                data
            )
            .replace(
                /</g,
                "\\u003c"
            );


        const safeBlockId =
            JSON.stringify(
                String(blockId)
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
html,
body{
    margin:0;
    padding:0;
    width:100%;
    overflow:hidden;
    background:transparent;
    font-family:Arial,"Noto Sans KR",sans-serif;
    color:#111827;
}
*{
    box-sizing:border-box;
}
</style>
</head>

<body>

<script>
window.TAEON_DATA=${safeData};
<\/script>

${renderTemplate(code,data)}

<script>
(() => {

    const blockId =
        ${safeBlockId};

    let lastReportedHeight =
        0;

    let reportTimer =
        null;


    function measureHeight(){

        const body =
            document.body;

        const html =
            document.documentElement;


        const height =
            Math.max(
                body
                    ? body.scrollHeight
                    : 0,

                body
                    ? body.offsetHeight
                    : 0,

                html
                    ? html.scrollHeight
                    : 0,

                html
                    ? html.offsetHeight
                    : 0,

                80
            );


        return Math.ceil(
            height
        );
    }


    function reportHeight(){

        window.clearTimeout(
            reportTimer
        );


        reportTimer =
            window.setTimeout(
                () => {

                    const height =
                        measureHeight();


                    /*
                     * 동일 높이는 다시 부모로 보내지 않는다.
                     * iframe 높이 변경 →
                     * ResizeObserver →
                     * 동일 높이 재전송 루프를 차단한다.
                     */
                    if (
                        Math.abs(
                            height -
                            lastReportedHeight
                        ) <= 1
                    ) {

                        return;
                    }


                    lastReportedHeight =
                        height;


                    parent.postMessage(
                        {
                            type:
                                "TAEON_HTML_HEIGHT",

                            blockId,

                            height
                        },
                        "*"
                    );

                },
                40
            );
    }


    window.addEventListener(
        "load",
        reportHeight
    );


    /*
     * 브라우저 창 폭 변경 시에만 재측정
     */
    window.addEventListener(
        "resize",
        reportHeight
    );


    /*
     * 콘텐츠 자체의 실제 크기 변경 감지
     */
    if (
        typeof ResizeObserver !==
        "undefined"
    ) {

        const observer =
            new ResizeObserver(
                () => {

                    reportHeight();
                }
            );


        if (
            document.body
        ) {

            observer.observe(
                document.body
            );
        }
    }


    /*
     * 이미지 등 지연 렌더링 대응
     */
    document.querySelectorAll(
        "img"
    )
    .forEach(
        image => {

            image.addEventListener(
                "load",
                reportHeight,
                {
                    once:
                        true
                }
            );
        }
    );


    reportHeight();


    window.setTimeout(
        reportHeight,
        150
    );


    window.setTimeout(
        reportHeight,
        600
    );

})();
<\/script>

</body>
</html>`;
    }


    function defaultHtmlBlock() {

        return {

            id:
                makeId(
                    "HTML"
                ),

            title:
                "새 HTML 박스",

            code:
`<div style="padding:14px;border:1px solid #e5e7eb;border-radius:10px;background:#fff;">
    <strong>{{title}}</strong>
    <div style="margin-top:6px;">회사 : {{company}}</div>
    <div style="margin-top:6px;">업무 : {{feature}}</div>
    <div style="margin-top:6px;">금액 : {{amountText}}</div>
</div>`
        };
    }


    function renderHtmlBlocks() {

        const host =
            $("taeonHtmlBlocks");


        if (!host) {

            return;
        }


        const data =
            currentData();


        host.innerHTML =
            "";


        if (!state.blocks.length) {

            host.innerHTML =
`
<div class="taeon-empty-block">

    HTML 업무웹페이지 박스가 없습니다.

    <br>

    <b>+ HTML 박스 추가</b>를 눌러
    필요한 화면을 추가할 수 있습니다.

</div>
`;


            syncWebEditor();

            return;
        }


        state.blocks.forEach(
            (
                block,
                index
            ) => {

                const section =
                    document.createElement(
                        "section"
                    );


                section.className =
                    "taeon-html-block";


                section.dataset.blockId =
                    block.id;


                section.innerHTML =
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
            data-action="up"
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
            data-action="down"
            ${
                index ===
                state.blocks.length - 1
                    ? "disabled"
                    : ""
            }
        >
            ↓
        </button>

        ${
            ADMIN_MODE
                ? `
        <button
            type="button"
            data-action="edit"
        >
            웹페이지 변경
        </button>

        <button
            type="button"
            data-action="delete"
            class="danger"
        >
            삭제
        </button>
        `
                : ""
        }

    </div>

</div>

<iframe
    class="taeon-html-frame"
    data-block-id="${escapeHtml(
        block.id
    )}"
    scrolling="no"
    sandbox="allow-scripts"
></iframe>
`;


                const frame =
                    section.querySelector(
                        "iframe"
                    );


                frame.srcdoc =
                    iframeDocument(
                        block.id,
                        block.code,
                        data
                    );


                section.addEventListener(
                    "click",
                    async event => {

                        const action =
                            event.target
                                ?.dataset
                                ?.action;


                        if (!action) {

                            return;
                        }


                        if (
                            action === "up" &&
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


                            await saveLayout();

                            renderHtmlBlocks();
                        }


                        if (
                            action === "down" &&
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


                            await saveLayout();

                            renderHtmlBlocks();
                        }


                        if (
                            action ===
                            "edit"
                        ) {

                            state.activeBlockId =
                                block.id;


                            syncWebEditor();


                            $("taeonWebPageAdmin")
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
                            action ===
                            "delete"
                        ) {

                            const ok =
                                window.confirm(
                                    `'${block.title || "HTML 박스"}'를 삭제할까요?`
                                );


                            if (!ok) {

                                return;
                            }


                            state.blocks =
                                state.blocks.filter(
                                    item =>
                                        item.id !==
                                        block.id
                                );


                            state.activeBlockId =
                                state.blocks[0]?.id ||
                                "";


                            await saveLayout();

                            renderHtmlBlocks();
                        }
                    }
                );


                host.appendChild(
                    section
                );
            }
        );


        syncWebEditor();
    }


    /*
     * ========================================================
     * 실제 업무박스
     * ========================================================
     */
    function defaultWorkBox() {

        return {

            id:
                makeId(
                    "WORK"
                ),

            title:
                "새 업무박스",

            description:
                "업무 설명을 입력하세요.",

            instructions:
`1. 필요한 자료를 확인합니다.
2. 내용을 검토합니다.
3. 업무를 처리합니다.
4. 완료 여부를 확인합니다.`,

            requiredDocuments:
                "",

            completion:
                "업무 처리 후 완료 상태를 확인합니다.",

            api:
                "",

            enabled:
                true
        };
    }


    function activeWorkBox() {

        return state.workBoxes.find(
            item =>
                item.id ===
                state.activeWorkBoxId
        ) || null;
    }


    function renderWorkBoxes() {

        const host =
            $("taeonWorkBoxGrid");


        if (!host) {

            return;
        }


        host.innerHTML =
            "";


        const visible =
            state.workBoxes.filter(
                item =>
                    item.enabled !== false
            );


        if (!visible.length) {

            host.innerHTML =
`
<div class="taeon-workbox-empty">

    등록된 업무박스가 없습니다.

    <br>

    필요한 업무박스는 오른쪽
    <b>업무박스추가요청</b>에서 요청할 수 있습니다.

</div>
`;


            renderWorkGuide();

            syncWorkBoxEditor();

            return;
        }


        visible.forEach(
            box => {

                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";


                button.className =
                    "taeon-workbox-button";


                if (
                    box.id ===
                    state.activeWorkBoxId
                ) {

                    button.classList.add(
                        "active"
                    );
                }


                button.innerHTML =
`
<strong>
    ${escapeHtml(
        box.title
    )}
</strong>

<small>
    ${escapeHtml(
        box.description ||
        ""
    )}
</small>
`;


                button.addEventListener(
                    "click",
                    () => {

                        state.activeWorkBoxId =
                            box.id;


                        renderWorkBoxes();

                        renderWorkGuide();

                        syncWorkBoxEditor();
                    }
                );


                host.appendChild(
                    button
                );
            }
        );


        if (
            !state.activeWorkBoxId &&
            visible[0]
        ) {

            state.activeWorkBoxId =
                visible[0].id;
        }


        renderWorkGuide();

        syncWorkBoxEditor();
    }


    function renderWorkGuide() {

        const host =
            $("taeonWorkGuide");


        if (!host) {

            return;
        }


        const box =
            activeWorkBox();


        if (!box) {

            host.innerHTML =
`
<div class="taeon-guide-empty">

    중앙의 업무박스를 선택하면

    <br>

    해당 업무의 처리방법이 여기에 표시됩니다.

</div>
`;

            return;
        }


        const instructions =
            String(
                box.instructions ||
                ""
            )
            .split(/\r?\n/)
            .map(
                line =>
                    line.trim()
            )
            .filter(Boolean);


        const documents =
            String(
                box.requiredDocuments ||
                ""
            )
            .split(/\r?\n|,/)
            .map(
                line =>
                    line.trim()
            )
            .filter(Boolean);


        host.innerHTML =
`
<div class="taeon-guide-selected">

    <strong>
        ${escapeHtml(
            box.title
        )}
    </strong>

    ${
        box.description
            ? `
    <p>
        ${nl2br(
            box.description
        )}
    </p>
    `
            : ""
    }

</div>


<div class="taeon-guide-section">

    <b>
        처리방법
    </b>

    ${
        instructions.length
            ? `
    <ol>
        ${
            instructions
                .map(
                    line =>
                        `<li>${escapeHtml(
                            line.replace(
                                /^\d+[\.\)]\s*/,
                                ""
                            )
                        )}</li>`
                )
                .join("")
        }
    </ol>
    `
            : `
    <p class="taeon-muted">
        등록된 처리방법이 없습니다.
    </p>
    `
    }

</div>


<div class="taeon-guide-section">

    <b>
        필요문서
    </b>

    ${
        documents.length
            ? `
    <ul>
        ${
            documents
                .map(
                    item =>
                        `<li>${escapeHtml(
                            item
                        )}</li>`
                )
                .join("")
        }
    </ul>
    `
            : `
    <p class="taeon-muted">
        별도 등록된 필요문서 없음
    </p>
    `
    }

</div>


<div class="taeon-guide-section">

    <b>
        완료조건
    </b>

    <p>
        ${nl2br(
            box.completion ||
            "완료조건 미등록"
        )}
    </p>

</div>


${
    box.api
        ? `
<div class="taeon-guide-section">

    <b>
        관련 API
    </b>

    <code>
        ${escapeHtml(
            box.api
        )}
    </code>

</div>
`
        : ""
}
`;
    }


    /*
     * ========================================================
     * 고정 데이터 표시
     * ========================================================
     */
    function renderDataPanel() {

        const host =
            $("taeonDataGrid");


        if (!host) {

            return;
        }


        const data =
            currentData();


        const definitions = [

            ["업무",data.feature],
            ["제목",data.title],
            ["회사",data.company],
            ["현장",data.site],
            ["문서종류",data.documentType],
            ["금액",data.amountText],
            ["은행",data.bank],
            ["계좌",data.account],
            ["날짜",data.date],
            ["상태",data.status],
            ["EVENT",data.eventId],
            ["DOCUMENT",data.documentId]

        ];


        host.innerHTML =
            definitions
                .map(
                    (
                        [
                            label,
                            value
                        ]
                    ) =>
`
<div class="taeon-data-cell ${
    value
        ? "has-value"
        : ""
}">

    <span>
        ${escapeHtml(
            label
        )}
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
                "HTML 사용값: {{title}} {{company}} {{amountText}} {{bank}} {{account}} {{date}} {{status}} · JS: TAEON_DATA";
        }


        exposeData();
    }


    /*
     * ========================================================
     * 4. 업무박스변경
     * ========================================================
     */
    function syncWorkBoxEditor() {

        const select =
            $("taeonWorkBoxSelect");


        if (!select) {

            return;
        }


        select.innerHTML =
            state.workBoxes
                .map(
                    box =>
`
<option
    value="${escapeHtml(
        box.id
    )}"
>
    ${escapeHtml(
        box.title
    )}
</option>
`
                )
                .join("");


        if (
            !state.activeWorkBoxId &&
            state.workBoxes[0]
        ) {

            state.activeWorkBoxId =
                state.workBoxes[0].id;
        }


        select.value =
            state.activeWorkBoxId;


        const box =
            activeWorkBox();


        $("taeonWorkBoxTitle").value =
            box?.title ||
            "";


        $("taeonWorkBoxDescription").value =
            box?.description ||
            "";


        $("taeonWorkBoxInstructions").value =
            box?.instructions ||
            "";


        $("taeonWorkBoxDocuments").value =
            box?.requiredDocuments ||
            "";


        $("taeonWorkBoxCompletion").value =
            box?.completion ||
            "";


        $("taeonWorkBoxApi").value =
            box?.api ||
            "";


        $("taeonWorkBoxEnabled").checked =
            box
                ? box.enabled !== false
                : true;
    }


    async function addWorkBox() {

        const box =
            defaultWorkBox();


        state.workBoxes.push(
            box
        );


        state.activeWorkBoxId =
            box.id;


        await saveLayout();


        renderWorkBoxes();

        syncWorkBoxEditor();
    }


    async function saveWorkBox() {

        const box =
            activeWorkBox();


        if (!box) {

            window.alert(
                "먼저 업무박스를 추가하세요."
            );

            return;
        }


        box.title =
            formValue(
                "taeonWorkBoxTitle"
            ) ||
            "업무박스";


        box.description =
            formValue(
                "taeonWorkBoxDescription"
            );


        box.instructions =
            $("taeonWorkBoxInstructions")
                ?.value ||
            "";


        box.requiredDocuments =
            $("taeonWorkBoxDocuments")
                ?.value ||
            "";


        box.completion =
            $("taeonWorkBoxCompletion")
                ?.value ||
            "";


        box.api =
            formValue(
                "taeonWorkBoxApi"
            );


        box.enabled =
            Boolean(
                $("taeonWorkBoxEnabled")
                    ?.checked
            );


        await saveLayout();


        renderWorkBoxes();


        setStatus(
            "taeonWorkBoxAdminStatus",
            "업무박스 저장됨"
        );
    }


    async function deleteWorkBox() {

        const box =
            activeWorkBox();


        if (!box) {

            return;
        }


        if (
            !window.confirm(
                `'${box.title}' 업무박스를 삭제할까요?`
            )
        ) {

            return;
        }


        state.workBoxes =
            state.workBoxes.filter(
                item =>
                    item.id !==
                    box.id
            );


        state.activeWorkBoxId =
            state.workBoxes[0]?.id ||
            "";


        await saveLayout();


        renderWorkBoxes();

        syncWorkBoxEditor();
    }


    /*
     * ========================================================
     * 5. 업무웹페이지 변경
     * ========================================================
     */
    function syncWebEditor() {

        const select =
            $("taeonBlockSelect");


        if (!select) {

            return;
        }


        select.innerHTML =
            state.blocks
                .map(
                    block =>
`
<option
    value="${escapeHtml(
        block.id
    )}"
>
    ${escapeHtml(
        block.title ||
        block.id
    )}
</option>
`
                )
                .join("");


        if (
            !state.activeBlockId &&
            state.blocks[0]
        ) {

            state.activeBlockId =
                state.blocks[0].id;
        }


        select.value =
            state.activeBlockId;


        const block =
            state.blocks.find(
                item =>
                    item.id ===
                    state.activeBlockId
            );


        const disabled =

            !state.codeUnlocked ||

            !block;


        $("taeonBlockTitle").value =
            block?.title ||
            "";


        $("taeonCodeEditor").value =
            block?.code ||
            "";


        $("taeonBlockTitle").disabled =
            disabled;


        $("taeonCodeEditor").disabled =
            disabled;


        $("taeonCodeSave").disabled =
            disabled;
    }


    async function saveWebCode() {

        if (
            !state.codeUnlocked
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
            formValue(
                "taeonBlockTitle"
            ) ||
            "HTML 박스";


        block.code =
            $("taeonCodeEditor")
                ?.value ||
            "";


        await saveLayout();


        renderHtmlBlocks();


        setStatus(
            "taeonWebCodeStatus",
            "웹페이지 저장됨"
        );
    }


    /*
     * ========================================================
     * 요청사항
     * ========================================================
     */
    async function submitSystemRequest() {

        const requestType =
            formValue(
                "taeonSystemRequestType"
            );


        const content =
            formValue(
                "taeonSystemRequestText"
            );


        if (!content) {

            setStatus(
                "taeonSystemRequestStatus",
                "요청내용을 입력하세요.",
                true
            );

            return;
        }


        await saveHistory(
            "SYSTEM_REQUEST",
            "시스템 요청사항",
            {

                requestType,

                content,

                module:
                    config.name ||
                    "",

                feature:
                    selectedFeature(),

                status:
                    "REQUESTED",

                createdAt:
                    new Date()
                        .toISOString()
            }
        );


        $("taeonSystemRequestText").value =
            "";


        setStatus(
            "taeonSystemRequestStatus",
            "요청 등록 완료"
        );
    }


    async function submitWorkBoxRequest() {

        const name =
            formValue(
                "taeonWorkBoxRequestName"
            );


        const content =
            formValue(
                "taeonWorkBoxRequestText"
            );


        if (
            !name &&
            !content
        ) {

            setStatus(
                "taeonWorkBoxRequestStatus",
                "추가할 업무박스를 입력하세요.",
                true
            );

            return;
        }


        await saveHistory(
            "WORKBOX_REQUEST",
            "업무박스 추가 요청",
            {

                name,

                content,

                module:
                    config.name ||
                    "",

                feature:
                    selectedFeature(),

                status:
                    "REQUESTED",

                createdAt:
                    new Date()
                        .toISOString()
            }
        );


        $("taeonWorkBoxRequestName").value =
            "";


        $("taeonWorkBoxRequestText").value =
            "";


        setStatus(
            "taeonWorkBoxRequestStatus",
            "추가 요청 완료"
        );
    }


    /*
     * ========================================================
     * 공통 Shell 생성
     * ========================================================
     */
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

            console.warn(
                "[TAEON] Workspace shell target missing"
            );

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


    <!-- 고정 데이터 -->

    <section
        class="taeon-fixed-card taeon-data-card"
    >

        <div class="taeon-card-head">

            <div>

                <b>
                    고정 데이터 적용
                </b>

                <small>
                    API · 자동판독 데이터를 HTML 업무웹페이지에 공급
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



    <!-- HTML 업무웹페이지 -->

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


        ${
            ADMIN_MODE
                ? `
        <button
            type="button"
            id="taeonAddHtmlBlock"
            class="taeon-primary"
        >
            + HTML 박스 추가
        </button>
        `
                : ""
        }

    </section>


    <div
        id="taeonHtmlBlocks"
    ></div>



    <!-- 실제 업무박스 -->

    <section
        class="taeon-workbox-area"
    >

        <div class="taeon-workbox-head">

            <div>

                <b>
                    업무박스
                </b>

                <small>
                    업무박스를 클릭하면 오른쪽에 처리방법이 표시됩니다.
                </small>

            </div>

        </div>


        <div
            id="taeonWorkBoxGrid"
            class="taeon-workbox-grid"
        ></div>

    </section>



    <!-- 기존 업무등록 -->

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



    <!-- 업무이력 -->

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



<!-- =====================================================
     우측 고정영역
     ===================================================== -->

<aside
    class="taeon-workspace-side"
>


    <!-- 1. 업무 메모 -->

    <section
        class="taeon-side-card"
    >

        <h3>
            <span class="taeon-side-number">
                1
            </span>

            업무 메모
        </h3>


        <textarea
            id="taeonMemo"
            placeholder="현재 업무와 관련된 메모를 입력하세요."
        ></textarea>


        <div class="taeon-side-actions">

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



    <!-- 2. 시스템 요청사항 -->

    <section
        class="taeon-side-card"
    >

        <h3>
            <span class="taeon-side-number">
                2
            </span>

            시스템 요청사항
        </h3>


        <select
            id="taeonSystemRequestType"
        >
            <option value="기능추가">
                기능추가
            </option>

            <option value="수정">
                수정
            </option>

            <option value="삭제">
                삭제
            </option>

            <option value="오류">
                오류
            </option>

            <option value="기타">
                기타
            </option>
        </select>


        <textarea
            id="taeonSystemRequestText"
            placeholder="시스템에서 추가·수정·삭제할 내용을 입력하세요."
        ></textarea>


        <div class="taeon-side-actions">

            <button
                id="taeonSystemRequestSave"
                type="button"
                class="taeon-dark-button"
            >
                요청 등록
            </button>

            <span
                id="taeonSystemRequestStatus"
            ></span>

        </div>

    </section>



    <!-- 업무박스 추가 요청 -->

    <section
        class="taeon-side-card taeon-request-card"
    >

        <h3>
            업무박스추가요청
        </h3>


        <input
            id="taeonWorkBoxRequestName"
            type="text"
            placeholder="추가할 업무박스명"
        >


        <textarea
            id="taeonWorkBoxRequestText"
            placeholder="필요한 기능과 처리방법을 적어주세요."
        ></textarea>


        <div class="taeon-side-actions">

            <button
                id="taeonWorkBoxRequestSave"
                type="button"
                class="taeon-request-button"
            >
                추가 요청
            </button>

            <span
                id="taeonWorkBoxRequestStatus"
            ></span>

        </div>

    </section>



    <!-- 3. 업무박스 안내 -->

    <section
        class="taeon-side-card taeon-guide-card"
    >

        <h3>
            <span class="taeon-side-number">
                3
            </span>

            업무박스 안내
        </h3>


        <div
            id="taeonWorkGuide"
            class="taeon-work-guide"
        ></div>

    </section>



    ${
        ADMIN_MODE
            ? `

    <!-- 4. 업무박스변경 -->

    <section
        class="taeon-side-card taeon-admin-card"
        id="taeonWorkBoxAdmin"
        data-admin-panel="true"
    >

        <h3>
            <span class="taeon-side-number admin">
                4
            </span>

            업무박스변경

            <small class="taeon-admin-label">
                관리자 전용
            </small>
        </h3>


        <div class="taeon-admin-toolbar">

            <button
                id="taeonAddWorkBox"
                type="button"
            >
                + 업무박스 추가
            </button>

            <button
                id="taeonDeleteWorkBox"
                type="button"
                class="danger"
            >
                삭제
            </button>

        </div>


        <label>
            업무박스 선택

            <select
                id="taeonWorkBoxSelect"
            ></select>
        </label>


        <label>
            업무박스명

            <input
                id="taeonWorkBoxTitle"
                type="text"
            >
        </label>


        <label>
            설명

            <textarea
                id="taeonWorkBoxDescription"
            ></textarea>
        </label>


        <label>
            처리방법

            <textarea
                id="taeonWorkBoxInstructions"
                class="taeon-admin-large"
                placeholder="한 줄에 한 단계씩 입력"
            ></textarea>
        </label>


        <label>
            필요문서

            <textarea
                id="taeonWorkBoxDocuments"
                placeholder="한 줄 또는 쉼표로 구분"
            ></textarea>
        </label>


        <label>
            완료조건

            <textarea
                id="taeonWorkBoxCompletion"
            ></textarea>
        </label>


        <label>
            관련 API

            <input
                id="taeonWorkBoxApi"
                type="text"
                placeholder="/api/..."
            >
        </label>


        <label class="taeon-check-label">

            <input
                id="taeonWorkBoxEnabled"
                type="checkbox"
                checked
            >

            사용
        </label>


        <div class="taeon-side-actions">

            <button
                id="taeonWorkBoxSave"
                type="button"
                class="taeon-dark-button"
            >
                업무박스 저장
            </button>

            <span
                id="taeonWorkBoxAdminStatus"
            ></span>

        </div>

    </section>



    <!-- 5. 업무웹페이지 변경 -->

    <section
        class="taeon-side-card taeon-admin-card taeon-code-card"
        id="taeonWebPageAdmin"
        data-admin-panel="true"
    >

        <h3>
            <span class="taeon-side-number admin">
                5
            </span>

            업무웹페이지 변경

            <small class="taeon-admin-label">
                관리자 전용
            </small>
        </h3>


        <div
            id="taeonCodeLock"
            class="taeon-code-lock"
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

            <label>
                웹페이지 HTML 박스

                <select
                    id="taeonBlockSelect"
                ></select>
            </label>


            <label>
                박스 제목

                <input
                    id="taeonBlockTitle"
                    type="text"
                    disabled
                >
            </label>


            <label>
                HTML / CSS / JS

                <textarea
                    id="taeonCodeEditor"
                    spellcheck="false"
                    disabled
                ></textarea>
            </label>


            <button
                id="taeonCodeSave"
                type="button"
                disabled
            >
                웹페이지 코드 저장
            </button>


            <span
                id="taeonWebCodeStatus"
            ></span>


            <small>
                HTML 데이터:
                {{title}},
                {{company}},
                {{amountText}},
                {{bank}},
                {{account}},
                {{date}},
                {{status}}
                · JS: TAEON_DATA
            </small>

        </div>

    </section>
`
            : ""
    }

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


    function applySettings() {

        if (
            $("taeonMemo")
        ) {

            $("taeonMemo").value =
                state.memo ||
                "";
        }


        if (
            $("taeonPageHeading")
        ) {

            $("taeonPageHeading").textContent =
                state.pageTitle ||
                selectedFeature();
        }


        if (
            $("taeonPageDescription")
        ) {

            $("taeonPageDescription").textContent =
                state.pageDescription ||
                "";
        }
    }


    function bindEvents() {

        /*
         * HTML iframe 자동높이 수신
         */
        window.addEventListener(
            "message",
            event => {

                const data =
                    event.data;


                if (
                    !data ||
                    data.type !==
                        "TAEON_HTML_HEIGHT"
                ) {

                    return;
                }


                const frames =
                    document.querySelectorAll(
                        ".taeon-html-frame"
                    );


                frames.forEach(
                    frame => {

                        if (
                            frame.dataset.blockId ===
                            String(
                                data.blockId
                            )
                        ) {

                            const height =
                                Math.max(
                                    80,
                                    Math.ceil(
                                        Number(
                                            data.height
                                        ) || 80
                                    )
                                );


                            const currentHeight =
                                Math.ceil(
                                    parseFloat(
                                        frame.style.height
                                    ) || 0
                                );


                            /*
                             * 같은 높이는 다시 적용하지 않는다.
                             * 기존 +4px 누적 증가를 완전히 제거한다.
                             */
                            if (
                                Math.abs(
                                    currentHeight -
                                    height
                                ) <= 1
                            ) {

                                return;
                            }


                            frame.style.height =
                                height +
                                "px";
                        }
                    }
                );
            }
        );


        /*
         * HTML 박스 추가
         */
        $("taeonAddHtmlBlock")
            ?.addEventListener(
                "click",
                async () => {

                    const block =
                        defaultHtmlBlock();


                    state.blocks.push(
                        block
                    );


                    state.activeBlockId =
                        block.id;


                    await saveLayout();

                    renderHtmlBlocks();
                }
            );


        /*
         * 업무메모
         */
        $("taeonMemoSave")
            ?.addEventListener(
                "click",
                async () => {

                    state.memo =
                        $("taeonMemo")
                            .value;


                    await saveLayout();


                    setStatus(
                        "taeonMemoStatus",
                        "저장됨"
                    );
                }
            );


        /*
         * 시스템 요청사항
         */
        $("taeonSystemRequestSave")
            ?.addEventListener(
                "click",
                async () => {

                    try {

                        await submitSystemRequest();

                    }
                    catch (error) {

                        setStatus(
                            "taeonSystemRequestStatus",
                            error.message,
                            true
                        );
                    }
                }
            );


        /*
         * 업무박스 추가 요청
         */
        $("taeonWorkBoxRequestSave")
            ?.addEventListener(
                "click",
                async () => {

                    try {

                        await submitWorkBoxRequest();

                    }
                    catch (error) {

                        setStatus(
                            "taeonWorkBoxRequestStatus",
                            error.message,
                            true
                        );
                    }
                }
            );


        /*
         * 관리자 업무박스
         */
        $("taeonAddWorkBox")
            ?.addEventListener(
                "click",
                addWorkBox
            );


        $("taeonDeleteWorkBox")
            ?.addEventListener(
                "click",
                deleteWorkBox
            );


        $("taeonWorkBoxSave")
            ?.addEventListener(
                "click",
                saveWorkBox
            );


        $("taeonWorkBoxSelect")
            ?.addEventListener(
                "change",
                event => {

                    state.activeWorkBoxId =
                        event.target.value;


                    renderWorkBoxes();

                    renderWorkGuide();

                    syncWorkBoxEditor();
                }
            );


        /*
         * 웹페이지 코드 인증
         */
        $("taeonCodeUnlock")
            ?.addEventListener(
                "click",
                () => {

                    if (
                        $("taeonCodePin")
                            .value !==
                        CODE_PIN
                    ) {

                        window.alert(
                            "인증번호가 맞지 않습니다."
                        );

                        return;
                    }


                    state.codeUnlocked =
                        true;


                    $("taeonCodePin").value =
                        "";


                    $("taeonCodeLock")
                        ?.classList
                        .add(
                            "unlocked"
                        );


                    syncWebEditor();
                }
            );


        $("taeonBlockSelect")
            ?.addEventListener(
                "change",
                event => {

                    state.activeBlockId =
                        event.target.value;


                    syncWebEditor();
                }
            );


        $("taeonCodeSave")
            ?.addEventListener(
                "click",
                saveWebCode
            );


        /*
         * 자동판독
         */
        window.addEventListener(
            "taeon:intake-preview",
            async event => {

                state.previewData =
                    event.detail ||
                    {};


                renderDataPanel();

                renderHtmlBlocks();


                try {

                    await saveDataSnapshot(
                        currentData()
                    );


                    setStatus(
                        "taeonDataSaveStatus",
                        "API 저장"
                    );

                }
                catch (error) {

                    console.warn(
                        "[TAEON] DATA SAVE",
                        error.message
                    );
                }
            }
        );


        /*
         * 업무탭 변경
         */
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


                state.codeUnlocked =
                    false;


                try {

                    await loadHistory();

                }
                catch (error) {

                    console.warn(
                        "[TAEON] HISTORY",
                        error.message
                    );
                }


                applySettings();

                renderDataPanel();

                renderHtmlBlocks();

                renderWorkBoxes();

                syncWorkBoxEditor();

                syncWebEditor();

                await loadLatestEvent();
            }
        );


        /*
         * 업무입력값 변화 → HTML 데이터 즉시 반영
         */
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

                            renderHtmlBlocks();
                        }
                    );
            }
        );


        /*
         * intake 적용 후 최신 이벤트 재호출
         */
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

                            }
                            catch {}
                        },
                        1200
                    );
                }
            );


        /*
         * 기존 업무이력 변경 감지
         */
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

        }
        catch (error) {

            console.warn(
                "[TAEON] HISTORY INIT",
                error.message
            );


            state.pageTitle =
                selectedFeature();
        }


        applySettings();

        bindEvents();

        renderDataPanel();

        renderHtmlBlocks();

        renderWorkBoxes();

        syncWorkBoxEditor();

        syncWebEditor();

        await loadLatestEvent();


        console.log(
            "[PASS] TAEON V2 WORKSPACE BUILDER V2"
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

    }
    else {

        init();
    }

})();