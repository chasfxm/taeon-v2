(() => {

    const API_BASE = "https://taeon-v2-api.onrender.com";


    const state = {
        stagedId:
            sessionStorage.getItem(
                "TAEON_STAGED_ID"
            ),

        stagedFileName: "",
        selectedFile: null,
        previewReady: false
    };


    function $(id) {
        return document.getElementById(id);
    }


    function escapeHtml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    async function request(
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
                `HTTP ${response.status}`
            );
        }


        return data;
    }


    function fileToBase64(file) {

        return new Promise(
            (resolve, reject) => {

                const reader =
                    new FileReader();


                reader.onload =
                    () => {

                        const result =
                            String(
                                reader.result || ""
                            );

                        const comma =
                            result.indexOf(",");


                        resolve(
                            comma >= 0
                                ? result.substring(
                                    comma + 1
                                )
                                : result
                        );
                    };


                reader.onerror =
                    reject;


                reader.readAsDataURL(
                    file
                );
            }
        );
    }


    function setStatus(
        type,
        text
    ) {

        const badge =
            $("intakeStatusBadge");


        if (!badge) {
            return;
        }


        badge.className =
            `intake-status-badge ${type}`;


        badge.textContent =
            text;
    }


    function updateApplyButton() {

        const button =
            $("applyIntakeBtn");


        if (!button) {
            return;
        }


        button.disabled =
            !state.previewReady;


        button.classList.toggle(
            "disabled",
            !state.previewReady
        );
    }


    function setFile(file) {

        state.selectedFile =
            file || null;


        const name =
            $("intakeFileName");


        if (name) {

            name.textContent =
                file
                    ? `${file.name} (${Math.round(
                        file.size / 1024
                    )} KB)`
                    : "선택된 파일 없음";
        }


        state.previewReady =
            false;


        updateApplyButton();


        setStatus(
            "waiting",
            "판독 대기"
        );
    }


    function showResult(
        text,
        ok = true
    ) {

        const el =
            $("intakeResult");


        if (!el) {
            return;
        }


        el.textContent =
            text;


        el.className =
            ok
                ? "intake-result ok"
                : "intake-result error";
    }


    function formatMoney(value) {

        if (
            value === "" ||
            value === null ||
            value === undefined
        ) {
            return "";
        }


        const number =
            Number(value);


        if (!Number.isFinite(number)) {
            return String(value);
        }


        return number
            .toLocaleString("ko-KR") +
            "원";
    }


    function renderStructuredFields(
        fields = {}
    ) {

        const container =
            $("intakeStructuredFields");


        if (!container) {
            return;
        }


        const definitions = [

            ["문서종류", fields.documentType],
            ["은행", fields.bank],
            ["계좌번호", fields.account],
            ["금액", formatMoney(fields.amount)],
            ["공급가액", formatMoney(fields.supplyAmount)],
            ["부가세", formatMoney(fields.vat)],
            ["합계금액", formatMoney(fields.totalAmount)],
            ["업체명", fields.company],
            ["날짜", fields.date],
            ["사업자번호", fields.businessNumber],
            ["현장", fields.site]

        ];


        container.innerHTML = `

            <div class="intake-fields-title">
                자동 추출 결과
            </div>

            <div class="intake-field-grid">

                ${
                    definitions
                        .map(
                            ([label, value]) => `

                            <div
                                class="intake-field ${
                                    value
                                        ? "detected"
                                        : "empty-value"
                                }"
                            >

                                <div class="intake-field-label">
                                    ${escapeHtml(label)}
                                </div>

                                <div class="intake-field-value">
                                    ${
                                        escapeHtml(
                                            value ||
                                            "미검출"
                                        )
                                    }
                                </div>

                            </div>

                        `
                        )
                        .join("")
                }

            </div>
        `;
    }


    function renderPreview(data) {

        state.stagedId =
            data.stagedId ||
            null;


        state.stagedFileName =
            data.fileName ||
            "";


        state.previewReady =
            Boolean(
                state.stagedId
            );


        if (state.stagedId) {

            sessionStorage.setItem(
                "TAEON_STAGED_ID",
                state.stagedId
            );
        }


        const preview =
            $("intakePreview");


        if (preview) {

            preview.classList
                .add("show");
        }


        $("previewFile").textContent =
            data.fileName ||
            "텍스트 직접입력";


        $("previewType").textContent =
            data.extension ||
            "TEXT";


        $("previewLength").textContent =
            String(
                data.textLength || 0
            ) + "자";


        $("previewTarget").textContent =
            `${window.TAEON_MODULE.folder} > ${
                window.__TAEON_SELECTED_FEATURE__ ||
                window.TAEON_MODULE.features[0]
            }`;


        $("previewText").textContent =
            data.previewText ||
            "(추출된 텍스트 없음)";


        renderStructuredFields(
            data.fields ||
            {}
        );


        window.dispatchEvent(
            new CustomEvent(
                "taeon:intake-preview",
                {
                    detail: data
                }
            )
        );


        updateApplyButton();


        setStatus(
            "ready",
            "판독 완료"
        );
    }


    async function previewFile() {

        const file =
            state.selectedFile;


        if (!file) {

            showResult(
                "먼저 파일을 선택하세요.",
                false
            );

            return;
        }


        setStatus(
            "working",
            "판독 중"
        );


        showResult(
            "파일을 읽고 있습니다..."
        );


        try {

            const base64 =
                await fileToBase64(
                    file
                );


            const result =
                await request(
                    "/api/intake/preview",
                    {
                        method: "POST",

                        body:
                            JSON.stringify({
                                mode: "FILE",
                                fileName: file.name,
                                mimeType: file.type,
                                base64
                            })
                    }
                );


            renderPreview(
                result
            );


            if (result.manualRequired) {

                state.previewReady =
                    false;

                updateApplyButton();

                setStatus(
                    "error",
                    "자동인식 실패"
                );

                showResult(
                    result.message ||
                    "자동인식 실패. 수기 입력 또는 텍스트 붙여넣기로 진행해 주세요.",
                    false
                );

                return;
            }


            showResult(
                "자동 판독 완료. 내용을 확인한 뒤 적용하세요."
            );

        } catch (error) {

            setStatus(
                "error",
                "판독 오류"
            );


            showResult(
                error.message,
                false
            );
        }
    }


    async function previewText() {

        const text =
            $("intakeText")
                .value
                .trim();


        if (!text) {

            showResult(
                "판독할 텍스트를 입력하세요.",
                false
            );

            return;
        }


        setStatus(
            "working",
            "판독 중"
        );


        showResult(
            "텍스트를 분석하고 있습니다..."
        );


        try {

            const result =
                await request(
                    "/api/intake/preview",
                    {
                        method: "POST",

                        body:
                            JSON.stringify({
                                mode: "TEXT",
                                text,
                                fileName:
                                    "직접입력.txt"
                            })
                    }
                );


            renderPreview(
                result
            );


            showResult(
                "텍스트 판독 완료. 내용을 확인한 뒤 적용하세요."
            );

        } catch (error) {

            setStatus(
                "error",
                "판독 오류"
            );


            showResult(
                error.message,
                false
            );
        }
    }


    async function pasteClipboard() {

        try {

            const text =
                await navigator
                    .clipboard
                    .readText();


            $("intakeText").value =
                text;


            state.previewReady =
                false;


            updateApplyButton();


            setStatus(
                "waiting",
                "판독 대기"
            );


            showResult(
                "클립보드 내용을 가져왔습니다."
            );

        } catch {

            showResult(
                "클립보드 읽기가 허용되지 않았습니다. Ctrl+V로 붙여넣으세요.",
                false
            );
        }
    }


    async function applyIntake() {

        if (!state.stagedId) {

            state.stagedId =
                sessionStorage.getItem(
                    "TAEON_STAGED_ID"
                );
        }


        if (!state.stagedId) {

            showResult(
                "먼저 파일 또는 텍스트를 판독하세요.",
                false
            );

            return;
        }


        const config =
            window.TAEON_MODULE;


        const feature =
            window.__TAEON_SELECTED_FEATURE__ ||
            config.features[0];


        setStatus(
            "working",
            "적용 중"
        );


        showResult(
            "현재 업무에 적용 중..."
        );


        try {

            const result =
                await request(
                    "/api/intake/apply",
                    {
                        method: "POST",

                        body:
                            JSON.stringify({

                                stagedId:
                                    state.stagedId,

                                title:
                                    $("documentTitle")
                                        ?.value
                                        ?.trim() ||
                                    `${feature} 자료`,

                                content:
                                    $("documentMemo")
                                        ?.value
                                        ?.trim() ||
                                    "",

                                company:
                                    $("eventCompany")
                                        ?.value
                                        ?.trim() ||
                                    "주식회사 태온종합건설",

                                site:
                                    $("eventSite")
                                        ?.value
                                        ?.trim() ||
                                    "",

                                eventId:
                                    (
                                        sessionStorage.getItem(
                                            "TAEON_CURRENT_EVENT_MODULE"
                                        ) === config.code &&
                                        sessionStorage.getItem(
                                            "TAEON_CURRENT_EVENT_FEATURE"
                                        ) === feature
                                    )
                                        ? sessionStorage.getItem(
                                            "TAEON_CURRENT_EVENT_ID"
                                        )
                                        : null,

                                moduleCode:
                                    config.code,

                                moduleName:
                                    config.name,

                                moduleFolder:
                                    config.folder,

                                feature
                            })
                    }
                );


            const documentId =
                result.document
                    ?.documentId ||
                result.documentId ||
                "";


            showResult(
                `적용 완료 : ${documentId}`
            );


            setStatus(
                "done",
                "적용 완료"
            );


            const apply =
                $("applyIntakeBtn");


            if (apply) {

                apply.disabled =
                    true;

                apply.classList
                    .add("disabled");
            }


            if (
                typeof window
                    .__TAEON_RELOAD_EVENTS__ ===
                "function"
            ) {

                await window
                    .__TAEON_RELOAD_EVENTS__();
            }

        } catch (error) {

            setStatus(
                "error",
                "적용 오류"
            );


            showResult(
                error.message,
                false
            );
        }
    }


    function resetIntake() {

        const hasData =
            Boolean(
                state.selectedFile ||
                $("intakeText")?.value?.trim() ||
                state.stagedId
            );


        if (hasData) {

            const ok =
                window.confirm(
                    "현재 자료를 지우고 새 자료를 입력하시겠습니까?"
                );


            if (!ok) {
                return;
            }
        }


        state.stagedId =
            null;

        state.stagedFileName =
            "";

        state.selectedFile =
            null;

        state.previewReady =
            false;


        sessionStorage.removeItem(
            "TAEON_STAGED_ID"
        );


        const fileInput =
            $("intakeFile");


        if (fileInput) {
            fileInput.value = "";
        }


        const fileName =
            $("intakeFileName");


        if (fileName) {

            fileName.textContent =
                "선택된 파일 없음";
        }


        const textInput =
            $("intakeText");


        if (textInput) {
            textInput.value = "";
        }


        const preview =
            $("intakePreview");


        if (preview) {

            preview.classList
                .remove("show");
        }


        const fields =
            $("intakeStructuredFields");


        if (fields) {
            fields.innerHTML = "";
        }


        $("previewFile").textContent = "";
        $("previewType").textContent = "";
        $("previewLength").textContent = "";
        $("previewTarget").textContent = "";
        $("previewText").textContent = "";


        showResult(
            "새 자료를 입력하세요."
        );


        setStatus(
            "waiting",
            "새 자료 대기"
        );


        updateApplyButton();
    }


    function prepareActionBar() {

        const applyButton =
            $("applyIntakeBtn");


        if (!applyButton) {
            return;
        }


        const parent =
            applyButton.parentElement;


        parent.classList.add(
            "intake-main-actions"
        );


        let newButton =
            $("newIntakeBtn");


        if (!newButton) {

            newButton =
                document.createElement(
                    "button"
                );


            newButton.id =
                "newIntakeBtn";

            newButton.type =
                "button";

            newButton.className =
                "btn intake-new-button";

            newButton.textContent =
                "새 자료 입력";


            parent.appendChild(
                newButton
            );
        }


        newButton
            .addEventListener(
                "click",
                resetIntake
            );


        if (
            !$("intakeStatusBadge")
        ) {

            const badge =
                document.createElement(
                    "span"
                );


            badge.id =
                "intakeStatusBadge";

            badge.className =
                "intake-status-badge waiting";

            badge.textContent =
                "판독 대기";


            parent.insertBefore(
                badge,
                newButton
            );
        }


        updateApplyButton();
    }


    function bind() {

        prepareActionBar();


        const fileInput =
            $("intakeFile");


        const drop =
            $("intakeDrop");


        fileInput.addEventListener(
            "change",
            () => {

                setFile(
                    fileInput.files?.[0]
                );
            }
        );


        $("chooseFileBtn")
            .addEventListener(
                "click",
                () =>
                    fileInput.click()
            );


        $("previewFileBtn")
            .addEventListener(
                "click",
                previewFile
            );


        $("previewTextBtn")
            .addEventListener(
                "click",
                previewText
            );


        $("clipboardBtn")
            .addEventListener(
                "click",
                pasteClipboard
            );


        $("applyIntakeBtn")
            .addEventListener(
                "click",
                applyIntake
            );


        ["dragenter", "dragover"]
            .forEach(
                name => {

                    drop.addEventListener(
                        name,
                        event => {

                            event.preventDefault();

                            drop.classList
                                .add("drag");
                        }
                    );
                }
            );


        ["dragleave", "drop"]
            .forEach(
                name => {

                    drop.addEventListener(
                        name,
                        event => {

                            event.preventDefault();

                            drop.classList
                                .remove("drag");
                        }
                    );
                }
            );


        drop.addEventListener(
            "drop",
            event => {

                const file =
                    event.dataTransfer
                        ?.files?.[0];


                if (file) {
                    setFile(file);
                }
            }
        );
    }



    // =====================================================
    // TAEON V2 : 자동판독 결과 → 업무등록 폼 자동채움
    // =====================================================

    function taeonExtractValue(text, labels) {

        const source =
            String(text || "");

        for (const label of labels) {

            const escaped =
                label.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                );

            const pattern =
                new RegExp(
                    "(?:^|\\n)\\s*" +
                    escaped +
                    "\\s*[:：]\\s*([^\\r\\n]+)",
                    "i"
                );

            const match =
                source.match(pattern);

            if (match && match[1]) {
                return match[1].trim();
            }
        }

        return "";
    }


    function taeonFillBusinessForm(data) {

        const fields =
            data.fields || {};

        const sourceText =
            String(
                data.previewText ||
                document.getElementById("intakeText")?.value ||
                ""
            ).trim();


        const payee =
            taeonExtractValue(
                sourceText,
                [
                    "지급대상",
                    "지급처",
                    "수령인",
                    "대상자"
                ]
            );


        const salaryMonth =
            taeonExtractValue(
                sourceText,
                [
                    "급여월",
                    "급여 월"
                ]
            );


        const memoTitle =
            taeonExtractValue(
                sourceText,
                [
                    "적요",
                    "업무명",
                    "제목"
                ]
            );


        let title =
            memoTitle;


        if (!title && payee && salaryMonth) {

            title =
                payee +
                " " +
                salaryMonth +
                " 급여 지급";
        }


        if (!title && payee) {

            title =
                payee +
                " " +
                (
                    window.__TAEON_SELECTED_FEATURE__ ||
                    "업무"
                );
        }


        if (!title) {

            title =
                (
                    window.__TAEON_SELECTED_FEATURE__ ||
                    fields.documentType ||
                    "업무"
                ) +
                " 자료";
        }


        const company =
            fields.company ||
            taeonExtractValue(
                sourceText,
                [
                    "회사",
                    "업체명"
                ]
            ) ||
            "주식회사 태온종합건설";


        const site =
            fields.site ||
            taeonExtractValue(
                sourceText,
                [
                    "현장",
                    "관련장소"
                ]
            ) ||
            "";


        const eventTitle =
            document.getElementById(
                "eventTitle"
            );

        const eventCompany =
            document.getElementById(
                "eventCompany"
            );

        const eventSite =
            document.getElementById(
                "eventSite"
            );

        const eventContent =
            document.getElementById(
                "eventContent"
            );

        const documentTitle =
            document.getElementById(
                "documentTitle"
            );

        const documentMemo =
            document.getElementById(
                "documentMemo"
            );


        if (eventTitle) {
            eventTitle.value = title;
        }

        if (eventCompany) {
            eventCompany.value = company;
        }

        if (eventSite) {
            eventSite.value = site;
        }

        if (eventContent) {
            eventContent.value = sourceText;
        }

        /*
         * 기존 intake/apply가 이 두 필드를 사용하므로
         * 문서 + 이벤트 제목/내용도 실제 업무명으로 저장됨
         */
        if (documentTitle) {
            documentTitle.value = title;
        }

        if (documentMemo) {
            documentMemo.value = sourceText;
        }
    }


    window.addEventListener(
        "taeon:intake-preview",
        event => {

            taeonFillBusinessForm(
                event.detail || {}
            );
        }
    );

    bind();

})();


