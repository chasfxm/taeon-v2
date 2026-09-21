(() => {

    const SETTINGS_KEY =
        "TAEON_UI_SETTINGS_V1";


    const defaults = {
        fontSize: 14,
        sidebarWidth: 220,
        memoWidth: 300,
        memoVisible: true,
        sidebarVisible: true
    };


    function loadSettings() {

        try {

            const saved =
                JSON.parse(
                    localStorage.getItem(
                        SETTINGS_KEY
                    ) || "{}"
                );

            return {
                ...defaults,
                ...saved
            };

        }
        catch {

            return {
                ...defaults
            };
        }
    }


    function saveSettings(
        settings
    ) {

        localStorage.setItem(
            SETTINGS_KEY,
            JSON.stringify(
                settings
            )
        );
    }


    function applySettings(
        settings
    ) {

        document.documentElement
            .style
            .setProperty(
                "--font-size",
                `${settings.fontSize}px`
            );

        document.documentElement
            .style
            .setProperty(
                "--sidebar-width",
                `${settings.sidebarWidth}px`
            );

        document.documentElement
            .style
            .setProperty(
                "--memo-width",
                `${settings.memoWidth}px`
            );


        document.body
            .classList
            .toggle(
                "memo-hidden",
                !settings.memoVisible
            );

        document.body
            .classList
            .toggle(
                "sidebar-hidden",
                !settings.sidebarVisible
            );
    }


    function memoKey() {

        const pageKey =
            document.body.dataset.pageKey ||
            location.pathname;

        return (
            "TAEON_MEMO_" +
            pageKey
        );
    }


    function initMemo() {

        const memo =
            document.getElementById(
                "workMemo"
            );

        const save =
            document.getElementById(
                "saveMemo"
            );

        if (
            !memo ||
            !save
        ) {

            return;
        }


        memo.value =
            localStorage.getItem(
                memoKey()
            ) || "";


        save.addEventListener(
            "click",
            () => {

                localStorage.setItem(
                    memoKey(),
                    memo.value
                );

                save.textContent =
                    "저장됨";

                setTimeout(
                    () => {

                        save.textContent =
                            "메모 저장";
                    },
                    1000
                );
            }
        );
    }


    function initSettings() {

        let settings =
            loadSettings();

        applySettings(
            settings
        );


        const panel =
            document.getElementById(
                "settingsPanel"
            );

        const open =
            document.getElementById(
                "settingsBtn"
            );

        const apply =
            document.getElementById(
                "settingsApply"
            );

        const reset =
            document.getElementById(
                "settingsReset"
            );


        if (
            !panel ||
            !open
        ) {

            return;
        }


        function fill() {

            document.getElementById(
                "settingFontSize"
            ).value =
                settings.fontSize;

            document.getElementById(
                "settingSidebarWidth"
            ).value =
                settings.sidebarWidth;

            document.getElementById(
                "settingMemoWidth"
            ).value =
                settings.memoWidth;

            document.getElementById(
                "settingMemoVisible"
            ).checked =
                settings.memoVisible;

            document.getElementById(
                "settingSidebarVisible"
            ).checked =
                settings.sidebarVisible;
        }


        fill();


        open.addEventListener(
            "click",
            () => {

                panel.classList.toggle(
                    "open"
                );
            }
        );


        apply.addEventListener(
            "click",
            () => {

                settings = {

                    fontSize:
                        Number(
                            document.getElementById(
                                "settingFontSize"
                            ).value
                        ) || 14,

                    sidebarWidth:
                        Number(
                            document.getElementById(
                                "settingSidebarWidth"
                            ).value
                        ) || 220,

                    memoWidth:
                        Number(
                            document.getElementById(
                                "settingMemoWidth"
                            ).value
                        ) || 300,

                    memoVisible:
                        document.getElementById(
                            "settingMemoVisible"
                        ).checked,

                    sidebarVisible:
                        document.getElementById(
                            "settingSidebarVisible"
                        ).checked
                };


                saveSettings(
                    settings
                );

                applySettings(
                    settings
                );

                panel.classList.remove(
                    "open"
                );
            }
        );


        reset.addEventListener(
            "click",
            () => {

                settings = {
                    ...defaults
                };

                saveSettings(
                    settings
                );

                applySettings(
                    settings
                );

                fill();
            }
        );
    }


    window.addEventListener(
        "DOMContentLoaded",
        () => {

            initMemo();
            initSettings();
        }
    );

})();
