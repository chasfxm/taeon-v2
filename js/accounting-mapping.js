(() => {

    let lastFields = {};


    const FEATURE_FIELDS = {

        "지출결의": [
            ["date", "지출일자", "date"],
            ["company", "업체명 / 지급처", "text"],
            ["amount", "지급금액", "number"],
            ["bank", "은행", "text"],
            ["account", "계좌번호", "text"],
            ["memo", "적요 / 메모", "textarea"]
        ],

        "입출금": [
            ["transactionType", "입출금 구분", "select"],
            ["date", "거래일자", "date"],
            ["amount", "금액", "number"],
            ["bank", "은행", "text"],
            ["account", "계좌번호", "text"],
            ["company", "거래처 / 상대방", "text"],
            ["memo", "적요 / 메모", "textarea"]
        ],

        "계좌잔액": [
            ["bank", "은행", "text"],
            ["account", "계좌번호", "text"],
            ["amount", "현재 잔액", "number"],
            ["company", "계좌 소유 법인", "text"],
            ["memo", "비고 / 메모", "textarea"]
        ],

        "급여": [
            ["month", "귀속월", "month"],
            ["employee", "성명", "text"],
            ["amount", "지급금액", "number"],
            ["bank", "은행", "text"],
            ["account", "계좌번호", "text"],
            ["memo", "급여 메모", "textarea"]
        ],

        "카드": [
            ["cardCompany", "카드사", "text"],
            ["cardNumber", "카드번호", "text"],
            ["amount", "사용금액", "number"],
            ["user", "사용자", "text"],
            ["date", "사용일자", "date"],
            ["memo", "사용내역 / 메모", "textarea"]
        ],

        "세금계산서": [
            ["company", "업체명", "text"],
            ["businessNumber", "사업자번호", "text"],
            ["supplyAmount", "공급가액", "number"],
            ["vat", "부가세", "number"],
            ["totalAmount", "합계금액", "number"],
            ["date", "작성일자", "date"],
            ["memo", "메모", "textarea"]
        ],

        "고정지출": [
            ["company", "지급처", "text"],
            ["amount", "고정지출 금액", "number"],
            ["bank", "은행", "text"],
            ["account", "계좌번호", "text"],
            ["date", "지급일", "date"],
            ["memo", "고정지출 메모", "textarea"]
        ]
    };


    function currentFeature() {

        return (
            window.__TAEON_SELECTED_FEATURE__ ||
            "지출결의"
        );
    }


    function panel() {

        return document.getElementById(
            "accountingMappingPanel"
        );
    }


    function grid() {

        return document.getElementById(
            "accountingMappingGrid"
        );
    }


    function escapeHtml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function normalizeValue(
        key,
        fields
    ) {

        if (
            key === "amount" &&
            fields.amount
        ) {
            return fields.amount;
        }


        if (
            key === "totalAmount" &&
            fields.totalAmount
        ) {
            return fields.totalAmount;
        }


        if (
            key === "supplyAmount" &&
            fields.supplyAmount
        ) {
            return fields.supplyAmount;
        }


        if (
            key === "vat" &&
            fields.vat
        ) {
            return fields.vat;
        }


        if (
            key === "company"
        ) {
            return fields.company || "";
        }


        if (
            key === "bank"
        ) {
            return fields.bank || "";
        }


        if (
            key === "account"
        ) {
            return fields.account || "";
        }


        if (
            key === "businessNumber"
        ) {
            return fields.businessNumber || "";
        }


        if (
            key === "date"
        ) {
            return fields.date || "";
        }


        return "";
    }


    function renderForm() {

        const feature =
            currentFeature();


        const definitions =
            FEATURE_FIELDS[
                feature
            ] || [];


        document.getElementById(
            "accountingMappingTarget"
        ).textContent =
            `현재 업무 : ${feature}`;


        grid().innerHTML =
            definitions.map(
                ([key, label, type]) => {

                    if (
                        type === "textarea"
                    ) {

                        return `
                            <div class="accounting-map-field full">
                                <label>${escapeHtml(label)}</label>
                                <textarea
                                    id="acc_${key}"
                                    data-accounting-key="${key}"
                                ></textarea>
                            </div>
                        `;
                    }


                    if (
                        type === "select"
                    ) {

                        return `
                            <div class="accounting-map-field">
                                <label>${escapeHtml(label)}</label>
                                <select
                                    id="acc_${key}"
                                    data-accounting-key="${key}"
                                >
                                    <option value="출금">출금</option>
                                    <option value="입금">입금</option>
                                </select>
                            </div>
                        `;
                    }


                    return `
                        <div class="accounting-map-field">
                            <label>${escapeHtml(label)}</label>
                            <input
                                id="acc_${key}"
                                data-accounting-key="${key}"
                                type="${type}"
                            >
                        </div>
                    `;
                }
            ).join("");


        fillFromExtraction(
            lastFields
        );
    }


    function fillFromExtraction(
        fields = {}
    ) {

        lastFields =
            fields || {};


        document
            .querySelectorAll(
                "[data-accounting-key]"
            )
            .forEach(
                element => {

                    const key =
                        element.dataset
                            .accountingKey;


                    const value =
                        normalizeValue(
                            key,
                            lastFields
                        );


                    if (
                        value !== "" &&
                        value !== null &&
                        value !== undefined
                    ) {

                        element.value =
                            value;
                    }
                }
            );


        const memo =
            document.getElementById(
                "acc_memo"
            );


        if (
            memo &&
            lastFields.documentType
        ) {

            memo.value =
                `자동판독: ${
                    lastFields.documentType
                }`;
        }


        const message =
            document.getElementById(
                "accountingMappingMessage"
            );


        if (
            message &&
            Object.keys(
                fields || {}
            ).length
        ) {

            message.textContent =
                "자동판독 결과를 현재 회계업무 입력란에 반영했습니다.";
        }
    }


    function readForm() {

        const result = {};


        document
            .querySelectorAll(
                "[data-accounting-key]"
            )
            .forEach(
                element => {

                    result[
                        element.dataset
                            .accountingKey
                    ] =
                        element.value;
                }
            );


        return result;
    }


    function numberText(value) {

        if (!value) {
            return "";
        }


        const number =
            Number(value);


        if (
            Number.isFinite(
                number
            )
        ) {

            return number
                .toLocaleString(
                    "ko-KR"
                ) + "원";
        }


        return value;
    }


    function applyToWorkForm() {

        const feature =
            currentFeature();


        const values =
            readForm();


        const title =
            document.getElementById(
                "eventTitle"
            );


        const company =
            document.getElementById(
                "eventCompany"
            );


        const content =
            document.getElementById(
                "eventContent"
            );


        const site =
            document.getElementById(
                "eventSite"
            );


        if (
            company &&
            values.company
        ) {

            company.value =
                values.company;
        }


        if (
            site &&
            lastFields.site
        ) {

            site.value =
                lastFields.site;
        }


        if (title) {

            if (
                feature === "계좌잔액"
            ) {

                title.value =
                    `${
                        values.bank || ""
                    } ${
                        values.account || ""
                    } 계좌잔액`
                    .trim();
            }
            else if (
                feature === "세금계산서"
            ) {

                title.value =
                    `${
                        values.company || ""
                    } 세금계산서`
                    .trim();
            }
            else {

                title.value =
                    `${
                        values.company || ""
                    } ${feature}`
                    .trim();
            }
        }


        const lines = [];


        Object.entries(
            values
        )
        .forEach(
            ([key, value]) => {

                if (!value) {
                    return;
                }


                const labels = {

                    transactionType:
                        "구분",

                    date:
                        "일자",

                    company:
                        "업체명",

                    amount:
                        feature === "계좌잔액"
                            ? "현재잔액"
                            : "금액",

                    bank:
                        "은행",

                    account:
                        "계좌번호",

                    employee:
                        "성명",

                    month:
                        "귀속월",

                    cardCompany:
                        "카드사",

                    cardNumber:
                        "카드번호",

                    user:
                        "사용자",

                    businessNumber:
                        "사업자번호",

                    supplyAmount:
                        "공급가액",

                    vat:
                        "부가세",

                    totalAmount:
                        "합계금액",

                    memo:
                        "메모"
                };


                let display =
                    value;


                if (
                    [
                        "amount",
                        "supplyAmount",
                        "vat",
                        "totalAmount"
                    ].includes(
                        key
                    )
                ) {

                    display =
                        numberText(
                            value
                        );
                }


                lines.push(
                    `${
                        labels[key] || key
                    } : ${display}`
                );
            }
        );


        if (content) {

            content.value =
                lines.join(
                    "\n"
                );
        }


        document.getElementById(
            "accountingMappingMessage"
        ).textContent =
            "아래 업무등록 입력란에 반영했습니다. 확인 후 업무등록을 누르세요.";
    }


    function clearForm() {

        document
            .querySelectorAll(
                "[data-accounting-key]"
            )
            .forEach(
                element => {

                    if (
                        element.tagName ===
                        "SELECT"
                    ) {

                        element.selectedIndex =
                            0;

                    } else {

                        element.value =
                            "";
                    }
                }
            );


        document.getElementById(
            "accountingMappingMessage"
        ).textContent =
            "";
    }


    window.addEventListener(
        "taeon:intake-preview",
        event => {

            const data =
                event.detail || {};


            fillFromExtraction(
                data.fields || {}
            );
        }
    );


    window.addEventListener(
        "taeon:feature-change",
        () => {

            renderForm();
        }
    );


    document
        .getElementById(
            "accountingApplyBtn"
        )
        .addEventListener(
            "click",
            applyToWorkForm
        );


    document
        .getElementById(
            "accountingClearBtn"
        )
        .addEventListener(
            "click",
            clearForm
        );


    window
        .addEventListener(
            "DOMContentLoaded",
            renderForm
        );


    renderForm();

})();
