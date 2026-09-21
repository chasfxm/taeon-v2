(() => {

    function $(
        id
    ) {

        return document
            .getElementById(
                id
            );
    }


    function localToday() {

        const now =
            new Date();


        const year =
            now.getFullYear();


        const month =
            String(
                now.getMonth() + 1
            )
                .padStart(
                    2,
                    "0"
                );


        const day =
            String(
                now.getDate()
            )
                .padStart(
                    2,
                    "0"
                );


        return (
            `${year}-${month}-${day}`
        );
    }


    async function loadJournal() {

        const date =
            $("journalDate")
                .value;


        if (!date) {
            return;
        }


        $("status").textContent =
            "생성 중...";


        try {

            const response =
                await fetch(
                    `/api/journal/daily?date=${
                        encodeURIComponent(
                            date
                        )
                    }`
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "업무일지 생성 실패"
                );
            }


            $("total").textContent =
                data.summary.total;

            $("open").textContent =
                data.summary.open;

            $("done").textContent =
                data.summary.done;

            $("followUp").textContent =
                data.summary.followUp;

            $("documents").textContent =
                data.summary.documents;

            $("development").textContent =
                data.summary.development;

            $("journalText").value =
                data.journalText;


            $("status").textContent =
                "생성 완료";

        } catch (error) {

            $("status").textContent =
                error.message;
        }
    }


    async function copyJournal() {

        const text =
            $("journalText")
                .value;


        if (!text) {
            return;
        }


        await navigator
            .clipboard
            .writeText(
                text
            );


        $("status").textContent =
            "복사 완료";
    }


    $("journalDate").value =
        localToday();


    $("todayBtn")
        .addEventListener(
            "click",
            () => {

                $("journalDate").value =
                    localToday();

                loadJournal();
            }
        );


    $("loadBtn")
        .addEventListener(
            "click",
            loadJournal
        );


    $("copyBtn")
        .addEventListener(
            "click",
            copyJournal
        );


    loadJournal();

})();
