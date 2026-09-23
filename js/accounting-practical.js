(() => {
  "use strict";

  const API_BASE =
    (location.hostname === "127.0.0.1" || location.hostname === "localhost")
      ? "http://127.0.0.1:3215"
      : "https://taeon-v2-api.onrender.com";

  const state = {
    dateKey: "10",
    task: "expense",
    lastIntake: null
  };

  const taskMap = {
    expense: {
      label: "지출결의",
      page: "../pages/01_회계경리/expense.html",
      steps: ["지급 대상과 금액 확인","회사 계좌잔액 확인","증빙자료 확인","은행에서 지급 처리","완료 및 이력 저장"],
      links: [
        ["국민은행","https://obiz.kbstar.com"],
        ["홈택스","https://www.hometax.go.kr"],
        ["4대보험","https://www.4insure.or.kr"]
      ]
    },
    payroll: {
      label: "일반급여",
      page: "../pages/01_회계경리/payroll.html",
      steps: ["급여대장 확인","지급 대상과 계좌 확인","공제/실지급액 확인","은행에서 지급 처리","지급결과 저장"],
      links: [
        ["국민은행","https://obiz.kbstar.com"],
        ["4대보험","https://www.4insure.or.kr"],
        ["홈택스","https://www.hometax.go.kr"]
      ]
    },
    daily: {
      label: "일용직",
      page: "../pages/01_회계경리/payroll.html?task=daily",
      steps: ["일용직 명단 확인","근무일수와 지급액 확인","원천징수/공제 확인","계좌 확인","지급 및 이력 저장"],
      links: [
        ["홈택스","https://www.hometax.go.kr"],
        ["4대보험","https://www.4insure.or.kr"]
      ]
    },
    cards: {
      label: "카드",
      page: "../pages/01_회계경리/cards.html",
      steps: ["카드 청구내역 확인","통장 출금예정 확인","증빙/사용처 확인","결제상태 확인","완료 저장"],
      links: [
        ["국민은행","https://obiz.kbstar.com"]
      ]
    },
    fixed: {
      label: "고정지출",
      page: "../pages/01_회계경리/fixed-expense.html",
      steps: ["고정지출 목록 확인","금액 변동 확인","계좌/자동이체 확인","지출결의 반영","완료 저장"],
      links: [
        ["국민은행","https://obiz.kbstar.com"]
      ]
    },
    vendor: {
      label: "업체정산",
      page: "../pages/01_회계경리/vendors.html",
      steps: ["총 공사대금 확인","수수료/인건비/자재비 확인","보험료/기타공제 확인","최종 정산액 확인","지급결의 및 완료"],
      links: [
        ["홈택스","https://www.hometax.go.kr"],
        ["국민은행","https://obiz.kbstar.com"]
      ]
    },
    transactions: {
      label: "입출금",
      page: "../pages/01_회계경리/transactions.html",
      steps: ["통장 거래내역 확인","관련 업무/증빙 대조","미분류 거래 확인","분류 저장","월별 누적 확인"],
      links: [["국민은행","https://obiz.kbstar.com"]]
    },
    balance: {
      label: "계좌잔액",
      page: "../pages/01_회계경리/bank-balance.html",
      steps: ["회사별 계좌 확인","현재 잔액 입력/확인","이전 잔액과 비교","메모 저장","보고자료 반영"],
      links: [["국민은행","https://obiz.kbstar.com"]]
    },
    taxinvoice: {
      label: "세금계산서",
      page: "../pages/01_회계경리/tax-invoice.html",
      steps: ["매입/매출 구분","공급가/세액 확인","거래처 확인","홈택스 대조","업무이력 저장"],
      links: [["홈택스","https://www.hometax.go.kr"]]
    }
  };

  const $ = id => document.getElementById(id);

  function toast(message) {
    const el = $("toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(window.__taeonToastTimer);
    window.__taeonToastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }

  function setApiStatus(message, ok = true) {
    const el = $("apiStatus");
    el.textContent = message;
    el.style.color = ok ? "#765a00" : "#b91c1c";
  }

  async function api(path, options = {}) {
    const res = await fetch(API_BASE + path, options);
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : {}; }
    catch { data = { raw: text }; }
    if (!res.ok) {
      throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
    }
    return data;
  }

  async function healthCheck() {
    try {
      const data = await api("/api/health");
      setApiStatus(`API 정상 · ${data.storage || data.status || "READY"}`, true);
      $("systemCheck").textContent = `API 정상 / Document·Event 연결 확인`;
      return true;
    } catch (err) {
      setApiStatus(`API 연결 실패: ${err.message}`, false);
      $("systemCheck").textContent = `API 연결 실패`;
      return false;
    }
  }

  function selectDate(value, button) {
    state.dateKey = value;
    document.querySelectorAll("[data-date]").forEach(x => x.classList.remove("selected"));
    button.classList.add("selected");
    localStorage.setItem("taeon.accounting.date", value);
    updateCenterTitle();
  }

  function selectTask(key, button) {
    state.task = key;
    document.querySelectorAll("[data-task]").forEach(x => x.classList.remove("selected"));
    button.classList.add("selected");
    localStorage.setItem("taeon.accounting.task", key);
    renderTaskSupport();
    loadWorkPage();
  }

  function updateCenterTitle() {
    const task = taskMap[state.task];
    $("centerContext").textContent = `${state.dateKey}일 · ${task?.label || ""}`;
  }

  function renderTaskSupport() {
    const task = taskMap[state.task];
    if (!task) return;

    $("guideList").innerHTML = task.steps.map(s => `<li>${escapeHtml(s)}</li>`).join("");
    $("linkList").innerHTML = task.links.map(([name, url]) =>
      `<li><a href="${url}" target="_blank" rel="noopener">${escapeHtml(name)}</a></li>`
    ).join("");

    updateCenterTitle();
  }

  function loadWorkPage() {
    const task = taskMap[state.task];
    const frame = $("workFrame");
    if (!task?.page) {
      frame.style.display = "none";
      $("emptyResult").style.display = "flex";
      return;
    }
    $("emptyResult").style.display = "none";
    frame.style.display = "block";
    frame.src = task.page;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function showModal(title, kind, initialText = "") {
    $("modalTitle").textContent = title;
    $("requestKind").value = kind;
    $("requestText").value = initialText;
    $("modalBackdrop").classList.add("show");
    setTimeout(() => $("requestText").focus(), 50);
  }

  function hideModal() {
    $("modalBackdrop").classList.remove("show");
  }

  async function submitRequest() {
    const kind = $("requestKind").value;
    const text = $("requestText").value.trim();
    if (!text) {
      toast("요청 내용을 입력하세요.");
      return;
    }

    const kindLabel = {
      NEW_WORK_REQUEST: "신규 업무 추가 요청",
      WORK_CHANGE_REQUEST: "기존 업무 변경 요청",
      EMAIL_INTAKE: "이메일 업무접수"
    }[kind] || kind;

    const body = {
      title: kindLabel,
      type: kind,
      company: "주식회사 태온종합건설",
      status: "OPEN",
      occurredAt: new Date().toISOString(),
      tags: ["ACCOUNTING","01_회계경리",kind],
      source: "WEB",
      data: {
        requestKind: kind,
        requestText: text,
        module: "01_회계경리",
        selectedDate: state.dateKey,
        selectedTask: state.task
      }
    };

    try {
      const result = await api("/api/events", {
        method: "POST",
        headers: {"Content-Type":"application/json; charset=utf-8"},
        body: JSON.stringify(body)
      });
      hideModal();
      $("requestLog").textContent = `${kindLabel} 접수 완료 · ${result.eventId || "저장완료"}`;
      toast("요청이 접수되었습니다.");
    } catch (err) {
      $("requestLog").textContent = `요청 저장 실패 · ${err.message}`;
      toast("요청 저장 실패");
    }
  }

  async function sendTextIntake(text) {
    setApiStatus("텍스트 판독 중...");
    try {
      const result = await api("/api/intake/text", {
        method: "POST",
        headers: {"Content-Type":"application/json; charset=utf-8"},
        body: JSON.stringify({
          text,
          pageId: "accounting-practical",
          pageName: "01 회계경리"
        })
      });

      state.lastIntake = result.result || result;
      const r = state.lastIntake || {};
      const summary = [
        r.documentType && `문서:${r.documentType}`,
        r.company && `회사:${r.company}`,
        (r.totalAmount || r.amount) && `금액:${Number(r.totalAmount || r.amount).toLocaleString()}원`,
        r.bank && `은행:${r.bank}`,
        r.account && `계좌:${r.account}`,
        r.recommendedPage && `추천:${r.recommendedPage}`
      ].filter(Boolean).join(" · ");

      setApiStatus(summary || "텍스트 판독 완료", true);
      $("relatedData").innerHTML = `<li>최근 텍스트 판독 결과 저장됨</li>${summary ? `<li>${escapeHtml(summary)}</li>` : ""}`;
      toast("텍스트 자동판독 완료");
    } catch (err) {
      setApiStatus("텍스트 판독 실패: " + err.message, false);
    }
  }

  async function sendFile(file) {
    setApiStatus(`${file.name} 업로드/판독 중...`);

    try {
      const bytes = await file.arrayBuffer();
      const uploadPath = `/api/intake/upload?filename=${encodeURIComponent(file.name)}`;
      let result;

      try {
        result = await api(uploadPath, {
          method:"POST",
          headers:{"Content-Type":"application/octet-stream"},
          body:bytes
        });
      } catch (firstError) {
        const form = new FormData();
        form.append("file", file, file.name);
        result = await api("/api/intake/preview", {
          method:"POST",
          body:form
        });
      }

      state.lastIntake = result.result || result.preview || result;
      setApiStatus(`${file.name} 판독 완료`, true);
      $("relatedData").innerHTML =
        `<li>${escapeHtml(file.name)}</li><li>문서/API 판독결과 연결됨</li>`;
      toast("파일 판독 완료");
    } catch (err) {
      setApiStatus("파일 판독 실패: " + err.message, false);
    }
  }

  function chooseFile(accept) {
    const input = $("fileInput");
    input.accept = accept || "*/*";
    input.value = "";
    input.click();
  }

  function saveMemo() {
    localStorage.setItem("taeon.accounting.memo", $("memo").value);
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-date]").forEach(btn => {
      btn.addEventListener("click", () => selectDate(btn.dataset.date, btn));
    });

    document.querySelectorAll("[data-task]").forEach(btn => {
      btn.addEventListener("click", () => selectTask(btn.dataset.task, btn));
    });

    $("newRequestBtn").addEventListener("click", () => showModal("신규 업무 추가 요청","NEW_WORK_REQUEST"));
    $("changeRequestBtn").addEventListener("click", () => showModal("기존 업무 변경 요청","WORK_CHANGE_REQUEST"));
    $("emailRequestBtn").addEventListener("click", () => showModal("이메일 업무접수","EMAIL_INTAKE"));
    $("waveBtn").addEventListener("click", healthCheck);
    $("modalClose").addEventListener("click", hideModal);
    $("modalSubmit").addEventListener("click", submitRequest);

    $("filePdf").addEventListener("click", () => chooseFile(".pdf,.doc,.docx,.hwp,.hwpx"));
    $("fileExcel").addEventListener("click", () => chooseFile(".xls,.xlsx,.csv"));
    $("fileImage").addEventListener("click", () => chooseFile("image/*"));
    $("fileText").addEventListener("click", () => {
      showModal("텍스트 자동판독","TEXT_INTAKE");
      $("modalSubmit").onclick = async () => {
        const text = $("requestText").value.trim();
        if (!text) return toast("텍스트를 입력하세요.");
        hideModal();
        await sendTextIntake(text);
        $("modalSubmit").onclick = submitRequest;
      };
    });

    $("autoClassify").addEventListener("click", () => {
      const r = state.lastIntake;
      if (!r) return toast("먼저 자료를 판독하세요.");
      const recommended = String(r.recommendedPage || r.documentType || "");
      const map = {
        "급여":"payroll",
        "지출결의":"expense",
        "세금계산서":"taxinvoice",
        "카드":"cards",
        "입출금":"transactions",
        "계좌잔액":"balance"
      };
      const key = map[recommended];
      if (key) {
        const btn = document.querySelector(`[data-task="${key}"]`);
        if (btn) selectTask(key, btn);
        toast(`업무분류: ${recommended}`);
      } else {
        toast(`추천업무: ${recommended || "확인 필요"}`);
      }
    });

    $("fileInput").addEventListener("change", e => {
      const file = e.target.files?.[0];
      if (file) sendFile(file);
    });

    $("memo").value = localStorage.getItem("taeon.accounting.memo") || "";
    $("memo").addEventListener("input", saveMemo);

    const savedDate = localStorage.getItem("taeon.accounting.date");
    const savedTask = localStorage.getItem("taeon.accounting.task");
    if (savedDate) {
      const btn = document.querySelector(`[data-date="${savedDate}"]`);
      if (btn) selectDate(savedDate, btn);
    }
    if (savedTask && taskMap[savedTask]) {
      const btn = document.querySelector(`[data-task="${savedTask}"]`);
      if (btn) selectTask(savedTask, btn);
    } else {
      renderTaskSupport();
      loadWorkPage();
    }

    healthCheck();
  });
})();