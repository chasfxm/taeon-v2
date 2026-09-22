(() => {

    function $(
        id
    ) {

        return document
            .getElementById(
                id
            );
    }


    function today() {

        const d =
            new Date();


        return [
            d.getFullYear(),

            String(
                d.getMonth() + 1
            )
                .padStart(
                    2,
                    "0"
                ),

            String(
                d.getDate()
            )
                .padStart(
                    2,
                    "0"
                )
        ].join("-");
    }


    function escapeHtml(
        value
    ) {

        return String(
            value || ""
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            );
    }


    function renderGroup(
        title,
        items
    ) {

        if (
            !items.length
        ) {

            return `
                <div class="group">

                    <h2>
                        ${escapeHtml(title)}
                    </h2>

                    <div class="empty">
                        해당 업무 없음
                    </div>

                </div>
            `;
        }


        return `
            <div class="group">

                <h2>
                    ${escapeHtml(title)}
                </h2>

                ${
                    items
                        .map(
                            item => {

                                const place =
                                    [
                                        item.company,
                                        item.site
                                    ]
                                        .filter(Boolean)
                                        .join(" / ");


                                return `
                                    <div class="item">

                                        <div class="item-title">
                                            ${escapeHtml(
                                                item.title
                                            )}
                                        </div>

                                        ${
                                            item.followUp.action
                                                ? `
                                                    <div>
                                                        ${escapeHtml(
                                                            item.followUp.action
                                                        )}
                                                    </div>
                                                `
                                                : ""
                                        }

                                        ${
                                            place
                                                ? `
                                                    <div class="meta">
                                                        ${escapeHtml(
                                                            place
                                                        )}
                                                    </div>
                                                `
                                                : ""
                                        }

                                        ${
                                            item.followUp.dueAt
                                                ? `
                                                    <div class="meta">
                                                        예정일 :
                                                        ${escapeHtml(
                                                            item.followUp.dueAt
                                                        )}
                                                    </div>
                                                `
                                                : ""
                                        }

                                        ${
                                            item.relatedDocumentIds.length
                                                ? `
                                                    <div class="meta">
                                                        연결문서 :
                                                        ${
                                                            item.relatedDocumentIds.length
                                                        }건
                                                    </div>
                                                `
                                                : ""
                                        }

                                    </div>
                                `;
                            }
                        )
                        .join("")
                }

            </div>
        `;
    }


    async function load() {

        const date =
            $("targetDate")
                .value;


        const response =
            await fetch(
                `https://taeon-v2-api.onrender.com/api/followups?date=${
                    encodeURIComponent(
                        date
                    )
                }`
            );


        const data =
            await response.json();


        $("overdueCount")
            .textContent =
            data.summary.overdue;


        $("todayCount")
            .textContent =
            data.summary.today;


        $("upcomingCount")
            .textContent =
            data.summary.upcoming;


        $("unscheduledCount")
            .textContent =
            data.summary.unscheduled;


        $("completedCount")
            .textContent =
            data.summary.completed;


        $("content")
            .innerHTML =
                renderGroup(
                    "지연 업무",
                    data.items.overdue
                ) +

                renderGroup(
                    "오늘 할 일",
                    data.items.today
                ) +

                renderGroup(
                    "예정 업무",
                    data.items.upcoming
                ) +

                renderGroup(
                    "날짜 미정",
                    data.items.unscheduled
                );
    }


    $("targetDate").value =
        today();


    $("todayBtn")
        .addEventListener(
            "click",
            () => {

                $("targetDate").value =
                    today();

                load();
            }
        );


    $("loadBtn")
        .addEventListener(
            "click",
            load
        );


    load();

})();
