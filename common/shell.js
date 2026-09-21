(() => {

    function escapeHtml(
        value
    ) {

        return String(
            value || ""
        )
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }


    function renderHeader() {

        const target =
            document.getElementById(
                "commonHeader"
            );

        if (!target) {

            return;
        }


        target.innerHTML = `
            <div class="taeon-brand">
                태온 V2 통합관리
            </div>

            <div class="taeon-header-actions">

                <a
                    class="btn"
                    href="/"
                >
                    통합 대시보드
                </a>

                <button
                    id="settingsBtn"
                    class="btn"
                    type="button"
                >
                    화면 설정
                </button>

            </div>
        `;
    }


    async function renderNavigation() {

        const target =
            document.getElementById(
                "commonNavigation"
            );

        if (!target) {

            return;
        }


        try {

            const response =
                await fetch(
                    "/config/page-config.json",
                    {
                        cache:
                            "no-store"
                    }
                );


            const groups =
                await response.json();


            const path =
                decodeURI(
                    location.pathname
                );


            target.innerHTML = `
                <div class="sidebar-title">
                    업무 메뉴
                </div>

                ${
                    groups
                        .map(
                            group => {

                                const groupPath =
                                    `/pages/${group.folder}/`;

                                const open =
                                    path.includes(
                                        groupPath
                                    );


                                return `
                                    <details
                                        class="nav-group"
                                        ${open ? "open" : ""}
                                    >

                                        <summary>
                                            ${escapeHtml(
                                                group.title
                                            )}
                                        </summary>

                                        <div class="nav-children">

                                            <a
                                                class="nav-child"
                                                href="/pages/${encodeURI(
                                                    group.folder
                                                )}/index.html"
                                            >
                                                전체
                                            </a>

                                            ${
                                                group.pages
                                                    .map(
                                                        page => `
                                                            <a
                                                                class="nav-child"
                                                                href="/pages/${encodeURI(
                                                                    group.folder
                                                                )}/${encodeURI(
                                                                    page.file
                                                                )}"
                                                            >
                                                                ${escapeHtml(
                                                                    page.title
                                                                )}
                                                            </a>
                                                        `
                                                    )
                                                    .join("")
                                            }

                                        </div>

                                    </details>
                                `;
                            }
                        )
                        .join("")
                }

                <hr class="nav-divider">

                <a
                    class="nav-item"
                    href="/journal.html"
                >
                    업무일지
                </a>

                <a
                    class="nav-item"
                    href="/followups.html"
                >
                    일정·후속조치
                </a>
            `;

        }
        catch (
            error
        ) {

            target.innerHTML = `
                <div class="sidebar-title">
                    업무 메뉴
                </div>

                <div>
                    메뉴 구성파일을 불러오지 못했습니다.
                </div>
            `;

            console.error(
                error
            );
        }
    }


    window.addEventListener(
        "DOMContentLoaded",
        () => {

            renderHeader();
            renderNavigation();
        }
    );

})();
