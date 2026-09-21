const API_BASE = "https://taeon-v2-api.onrender.com";


const config =
    window.TAEON_MODULE;


const state = {
    events: [],
    selectedFeature:
        config.features[0]
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


function formatDate(value) {

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


function eventBelongsToModule(event) {

    const tags =
        Array.isArray(event.tags)
            ? event.tags
            : [];


    return (
        tags.includes(config.code) ||
        tags.includes(config.name) ||
        tags.includes(config.folder)
    );
}


function eventMatchesFeature(event) {

    if (!state.selectedFeature) {
        return true;
    }

    const tags =
        Array.isArray(event.tags)
            ? event.tags
            : [];


    return tags.includes(
        state.selectedFeature
    );
}


function selectFeature(feature) {

    state.selectedFeature =
        feature;

    window.__TAEON_SELECTED_FEATURE__ =
        feature;


    window.dispatchEvent(
        new CustomEvent(
            "taeon:feature-change",
            {
                detail: {
                    feature
                }
            }
        )
    );


    $("selectedFeature").textContent =
        feature;


    document
        .querySelectorAll(
            "[data-feature]"
        )
        .forEach(
            element => {

                element.classList.toggle(
                    "active",
                    element.dataset.feature ===
                        feature
                );
            }
        );


    renderEvents();
}


function buildFeatureButtons() {

    const top =
        $("featureGrid");

    const side =
        $("featureNav");


    top.innerHTML = "";
    side.innerHTML = "";


    config.features.forEach(
        feature => {

            const topButton =
                document.createElement(
                    "button"
                );

            topButton.className =
                "feature-card";

            topButton.dataset.feature =
                feature;

            topButton.textContent =
                feature;

            topButton.addEventListener(
                "click",
                () =>
                    selectFeature(
                        feature
                    )
            );

            top.appendChild(
                topButton
            );


            const sideButton =
                document.createElement(
                    "button"
                );

            sideButton.className =
                "feature-side-button";

            sideButton.dataset.feature =
                feature;

            sideButton.textContent =
                feature;

            sideButton.addEventListener(
                "click",
                () =>
                    selectFeature(
                        feature
                    )
            );

            side.appendChild(
                sideButton
            );
        }
    );


    selectFeature(
        state.selectedFeature
    );
}


async function checkHealth() {

    try {

        await request(
            "/api/health"
        );

        $("apiStatus").textContent =
            "API · DOCUMENT · EVENT 정상";

        $("apiStatus").className =
            "status ok";

    } catch {

        $("apiStatus").textContent =
            "서버 연결 실패";

        $("apiStatus").className =
            "status error";
    }
}


async function createBusinessEvent() {

    const title =
        $("eventTitle")
            .value
            .trim();

    const content =
        $("eventContent")
            .value
            .trim();


    if (!title) {

        showMessage(
            "eventMessage",
            "업무 제목을 입력하세요.",
            false
        );

        return;
    }


    const isFollowUp =
        state.selectedFeature ===
            "후속조치";


    const payload = {

        type:
            isFollowUp
                ? "FOLLOWUP"
                : (
                    config.code === "SITE"
                        ? "SITE"
                        : "JOURNAL"
                ),

        title,

        content,

        company:
            $("eventCompany")
                .value
                .trim(),

        site:
            $("eventSite")
                .value
                .trim(),

        people:
            $("eventPeople")
                .value
                .split(",")
                .map(
                    x => x.trim()
                )
                .filter(Boolean),

        status:
            "OPEN",

        tags: [
            config.code,
            config.name,
            config.folder,
            state.selectedFeature
        ],

        source:
            `TAEON_V2_UI_${config.code}`
    };


    if (isFollowUp) {

        payload.followUp = {
            required: true,
            dueAt:
                $("followUpDate")
                    .value || null,
            action:
                content ||
                title,
            status:
                "OPEN"
        };
    }


    try {

        const result =
            await request(
                "/api/events",
                {
                    method:
                        "POST",

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


        showMessage(
            "eventMessage",
            `등록 완료 : ${
                result.eventId ||
                result.event?.eventId ||
                ""
            }`,
            true
        );


        $("eventTitle").value =
            "";

        $("eventContent").value =
            "";


        await loadEvents();

    } catch (error) {

        showMessage(
            "eventMessage",
            error.message,
            false
        );
    }
}


async function registerDocument() {

    const filePath =
        $("documentPath")
            .value
            .trim();


    if (!filePath) {

        showMessage(
            "documentMessage",
            "문서의 전체 경로를 입력하세요.",
            false
        );

        return;
    }


    const payload = {

        filePath,

        title:
            $("documentTitle")
                .value
                .trim() ||
            `${state.selectedFeature} 문서`,

        content:
            $("documentMemo")
                .value
                .trim(),

        company:
            $("eventCompany")
                .value
                .trim(),

        site:
            $("eventSite")
                .value
                .trim(),

        tags: [
            config.code,
            config.name,
            config.folder,
            state.selectedFeature
        ]
    };


    try {

        const result =
            await request(
                "/api/documents/register",
                {
                    method:
                        "POST",

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


        const documentId =
            result.document?.documentId ||
            result.documentId ||
            "";


        showMessage(
            "documentMessage",
            `문서 등록 완료 : ${documentId}`,
            true
        );


        $("documentPath").value =
            "";

        $("documentTitle").value =
            "";

        $("documentMemo").value =
            "";


        await loadEvents();

    } catch (error) {

        showMessage(
            "documentMessage",
            error.message,
            false
        );
    }
}


function showMessage(
    id,
    message,
    ok
) {

    const element =
        $(id);

    element.textContent =
        message;

    element.className =
        ok
            ? "message ok"
            : "message error";
}


async function loadEvents() {

    const data =
        await request(
            "/api/events"
        );


    state.events =
        normalizeEvents(data)
            .filter(
                eventBelongsToModule
            );


    renderSummary();
    renderEvents();
}


function renderSummary() {

    const open =
        state.events.filter(
            event =>
                event.status !==
                    "DONE"
        ).length;


    const done =
        state.events.filter(
            event =>
                event.status ===
                    "DONE"
        ).length;


    $("moduleEventCount").textContent =
        state.events.length;

    $("moduleOpenCount").textContent =
        open;

    $("moduleDoneCount").textContent =
        done;
}


function renderEvents() {

    const keyword =
        $("searchKeyword")
            .value
            .trim()
            .toLowerCase();


    const status =
        $("searchStatus")
            .value;


    let events =
        state.events
            .filter(
                eventMatchesFeature
            );


    if (status) {

        events =
            events.filter(
                event =>
                    event.status ===
                        status
            );
    }


    if (keyword) {

        events =
            events.filter(
                event => {

                    const text =
                        [
                            event.title,
                            event.content,
                            event.company,
                            event.site,
                            ...(event.people || []),
                            ...(event.tags || [])
                        ]
                        .join(" ")
                        .toLowerCase();


                    return text.includes(
                        keyword
                    );
                }
            );
    }


    events =
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
            );


    const container =
        $("eventList");


    if (!events.length) {

        container.innerHTML =
            '<div class="empty">해당 업무이력이 없습니다.</div>';

        return;
    }


    container.innerHTML =
        events
            .slice(0, 100)
            .map(
                event => {

                    const isDone =
                        event.status ===
                            "DONE";


                    return `

                    <div class="event-item">

                        <div class="event-title">
                            ${escapeHtml(
                                event.title ||
                                "(제목없음)"
                            )}
                        </div>

                        <div class="event-meta">

                            ${escapeHtml(
                                event.typeLabel ||
                                event.type ||
                                ""
                            )}

                            · 상태:
                            ${escapeHtml(
                                event.status ||
                                ""
                            )}

                            ·
                            ${escapeHtml(
                                formatDate(
                                    event.occurredAt ||
                                    event.createdAt
                                )
                            )}

                            <br>

                            ${escapeHtml(
                                event.company ||
                                ""
                            )}

                            ${
                                event.site
                                    ? " · " +
                                      escapeHtml(
                                          event.site
                                      )
                                    : ""
                            }

                        </div>

                        ${
                            event.content
                                ? `
                                <div class="event-content">
                                    ${escapeHtml(
                                        event.content
                                    )}
                                </div>
                                `
                                : ""
                        }

                        <div class="event-actions">

                            <button
                                class="btn small"
                                type="button"
                                onclick="selectCurrentEvent(
                                    '${escapeHtml(
                                        event.eventId
                                    )}'
                                )"
                            >
                                ${
                                    sessionStorage.getItem(
                                        "TAEON_CURRENT_EVENT_ID"
                                    ) === event.eventId
                                        ? "현재 업무 선택됨"
                                        : "현재 업무로 선택"
                                }
                            </button>

                            <button
                                class="btn small"
                                onclick="changeStatus(
                                    '${escapeHtml(
                                        event.eventId
                                    )}',
                                    '${
                                        isDone
                                            ? "OPEN"
                                            : "DONE"
                                    }'
                                )"
                            >
                                ${
                                    isDone
                                        ? "미완료로 변경"
                                        : "완료처리"
                                }
                            </button>

                        </div>

                    </div>
                `;
                }
            )
            .join("");
}



function selectCurrentEvent(
    eventId
) {

    const event =
        state.events.find(
            item =>
                item.eventId ===
                eventId
        );


    if (!event) {

        alert(
            "선택할 업무를 찾지 못했습니다."
        );

        return;
    }


    const feature =
        window.__TAEON_SELECTED_FEATURE__ ||
        config.features[0];


    sessionStorage.setItem(
        "TAEON_CURRENT_EVENT_ID",
        event.eventId
    );


    sessionStorage.setItem(
        "TAEON_CURRENT_EVENT_TITLE",
        event.title || ""
    );


    sessionStorage.setItem(
        "TAEON_CURRENT_EVENT_MODULE",
        config.code
    );


    sessionStorage.setItem(
        "TAEON_CURRENT_EVENT_FEATURE",
        feature
    );


    showMessage(
        "eventMessage",
        `현재 업무 선택 : ${
            event.title || event.eventId
        }`,
        true
    );


    renderEvents();
}

async function changeStatus(
    eventId,
    status
) {

    try {

        await request(
            `/api/events/${encodeURIComponent(
                eventId
            )}/status`,
            {
                method:
                    "PATCH",

                body:
                    JSON.stringify({
                        status
                    })
            }
        );


        await loadEvents();

    } catch (error) {

        alert(
            error.message
        );
    }
}


function bindEvents() {

    $("createEventBtn")
        .addEventListener(
            "click",
            createBusinessEvent
        );


    $("registerDocumentBtn")
        .addEventListener(
            "click",
            registerDocument
        );


    $("searchBtn")
        .addEventListener(
            "click",
            renderEvents
        );


    $("searchKeyword")
        .addEventListener(
            "input",
            renderEvents
        );


    $("searchStatus")
        .addEventListener(
            "change",
            renderEvents
        );


    $("reloadBtn")
        .addEventListener(
            "click",
            loadEvents
        );
}


async function init() {

    $("moduleTitle").textContent =
        `${config.folder}`;

    $("moduleSubtitle").textContent =
        `${config.name} 업무관리`;

    buildFeatureButtons();

    bindEvents();

    await checkHealth();

    try {

        await loadEvents();

    } catch (error) {

        $("eventList").innerHTML =
            `<div class="empty">
                조회 실패 : ${escapeHtml(
                    error.message
                )}
             </div>`;
    }
}


window.__TAEON_RELOAD_EVENTS__ =
    loadEvents;


window.selectCurrentEvent =
    selectCurrentEvent;


window.changeStatus =
    changeStatus;


init();



