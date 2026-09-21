const API_BASE = "https://taeon-v2-api.onrender.com";


const MODULE_PATHS = {

    "01_회계경리":
        "./modules/01_회계경리.html",

    "02_현장관리":
        "./modules/02_현장관리.html",

    "03_계약법무":
        "./modules/03_계약법무.html",

    "04_입찰":
        "./modules/04_입찰.html",

    "05_대출금융":
        "./modules/05_대출금융.html",

    "06_차량":
        "./modules/06_차량.html",

    "07_토지부동산":
        "./modules/07_토지부동산.html",

    "08_정부지원행정":
        "./modules/08_정부지원행정.html",

    "09_기타자료":
        "./modules/09_기타자료.html"

};


const state = {
    events: []
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


function formatDateTime(value) {

    if (!value) {
        return "";
    }

    try {

        return new Date(value)
            .toLocaleString("ko-KR");

    } catch {

        return value;
    }
}


function getTodayString() {

    const now =
        new Date();

    const y =
        now.getFullYear();

    const m =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");

    const d =
        String(
            now.getDate()
        ).padStart(2, "0");

    return `${y}-${m}-${d}`;
}


function setCurrentDate() {

    const now =
        new Date();

    $("currentDate").textContent =
        now.toLocaleString(
            "ko-KR",
            {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "short"
            }
        );
}


async function apiGet(path) {

    const response =
        await fetch(
            API_BASE + path
        );


    if (!response.ok) {

        throw new Error(
            `HTTP ${response.status}`
        );
    }


    return await response.json();
}


async function checkHealth() {

    const el =
        $("apiStatus");


    try {

        await apiGet(
            "/api/health"
        );


        el.className =
            "status-value ok";

        el.textContent =
            "정상 연결";

    } catch {

        el.className =
            "status-value error";

        el.textContent =
            "API 서버 연결 안됨";
    }
}


function normalizeEvents(data) {

    if (Array.isArray(data)) {
        return data;
    }

    if (
        data &&
        Array.isArray(data.events)
    ) {
        return data.events;
    }

    return [];
}


function renderRecentEvents(events) {

    const el =
        $("recentEvents");


    if (!events.length) {

        el.innerHTML =
            '<div class="empty">등록된 업무이력이 없습니다.</div>';

        return;
    }


    const recent =
        [...events]
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
            )
            .slice(0, 10);


    el.innerHTML =
        recent.map(
            event => `

                <div class="list-item">

                    <div class="list-item-title">
                        ${escapeHtml(
                            event.title ||
                            "(제목없음)"
                        )}
                    </div>

                    <div class="list-item-meta">

                        ${escapeHtml(
                            event.typeLabel ||
                            event.type ||
                            ""
                        )}

                        ·

                        ${escapeHtml(
                            event.company ||
                            ""
                        )}

                        ·

                        ${escapeHtml(
                            event.site ||
                            ""
                        )}

                        <br>

                        ${escapeHtml(
                            formatDateTime(
                                event.occurredAt ||
                                event.createdAt
                            )
                        )}

                        · 상태:

                        ${escapeHtml(
                            event.status ||
                            ""
                        )}

                    </div>

                </div>
            `
        ).join("");
}


function renderFollowUps(events) {

    const el =
        $("followUpList");


    const items =
        events.filter(
            event =>
                event.followUp &&
                event.followUp.required === true &&
                event.followUp.status !== "DONE"
        );


    if (!items.length) {

        el.innerHTML =
            '<div class="empty">미완료 후속조치가 없습니다.</div>';

        return;
    }


    el.innerHTML =
        items
            .slice(0, 10)
            .map(
                event => `

                <div class="list-item">

                    <div class="list-item-title">
                        ${escapeHtml(
                            event.title ||
                            "후속조치"
                        )}
                    </div>

                    <div class="list-item-meta">

                        ${escapeHtml(
                            event.followUp?.action ||
                            ""
                        )}

                        <br>

                        예정:
                        ${escapeHtml(
                            formatDateTime(
                                event.followUp?.dueAt
                            ) ||
                            "-"
                        )}

                    </div>

                </div>
            `
            )
            .join("");
}


function renderDocuments(events) {

    const el =
        $("recentDocuments");


    const docs =
        events
            .filter(
                event =>
                    Array.isArray(
                        event.relatedDocumentIds
                    ) &&
                    event.relatedDocumentIds.length > 0
            )
            .slice(0, 10);


    if (!docs.length) {

        el.innerHTML =
            '<div class="empty">최근 등록 문서가 없습니다.</div>';

        return;
    }


    el.innerHTML =
        docs.map(
            event => `

            <div class="list-item">

                <div class="list-item-title">
                    ${escapeHtml(
                        event.title ||
                        "문서등록"
                    )}
                </div>

                <div class="list-item-meta">

                    문서 ID:
                    ${escapeHtml(
                        event.relatedDocumentIds.join(
                            ", "
                        )
                    )}

                    <br>

                    ${escapeHtml(
                        event.company ||
                        ""
                    )}

                    ·

                    ${escapeHtml(
                        event.site ||
                        ""
                    )}

                </div>

            </div>
        `
        ).join("");
}


function renderSummary(events) {

    const today =
        getTodayString();


    const todayEvents =
        events.filter(
            event => {

                const value =
                    event.occurredAt ||
                    event.createdAt ||
                    "";

                return String(value)
                    .startsWith(today);
            }
        );


    const openEvents =
        events.filter(
            event =>
                event.status !== "DONE"
        );


    const followUps =
        events.filter(
            event =>
                event.followUp &&
                event.followUp.required === true &&
                event.followUp.status !== "DONE"
        );


    $("todayCount").textContent =
        todayEvents.length;

    $("openCount").textContent =
        openEvents.length;

    $("followUpCount").textContent =
        followUps.length;

    $("eventCount").textContent =
        events.length;
}


async function loadEvents() {

    try {

        const data =
            await apiGet(
                "/api/events"
            );


        const events =
            normalizeEvents(
                data
            );


        state.events =
            events;


        renderSummary(events);

        renderRecentEvents(events);

        renderFollowUps(events);

        renderDocuments(events);

    } catch {

        $("recentEvents").innerHTML =
            '<div class="empty">이벤트 조회 실패</div>';

        $("followUpList").innerHTML =
            '<div class="empty">후속조치 조회 실패</div>';

        $("recentDocuments").innerHTML =
            '<div class="empty">문서 조회 실패</div>';
    }
}


function handleModuleClick(
    moduleName
) {

    if (
        moduleName ===
        "dashboard"
    ) {
        return;
    }


    const target =
        MODULE_PATHS[
            moduleName
        ];


    if (target) {

        window.location.href =
            target;
    }
}


function bindEvents() {

    $("refreshBtn")
        .addEventListener(
            "click",
            async () => {

                await checkHealth();
                await loadEvents();
            }
        );


    $("loadEventsBtn")
        .addEventListener(
            "click",
            loadEvents
        );


    document
        .querySelectorAll(
            "[data-module]"
        )
        .forEach(
            button => {

                button
                    .addEventListener(
                        "click",
                        () => {

                            handleModuleClick(
                                button.dataset.module
                            );
                        }
                    );
            }
        );
}


async function init() {

    setCurrentDate();

    bindEvents();

    await checkHealth();

    await loadEvents();
}


init();
