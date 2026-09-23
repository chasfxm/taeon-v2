(() => {
  "use strict";

  const API_BASE =
    (location.hostname === "127.0.0.1" || location.hostname === "localhost")
      ? "http://127.0.0.1:3215"
      : "https://taeon-v2-api.onrender.com";

  const HQ_KEY = "taeon.hq.display.settings.v1";

  const defaultSettings = {
    globalFont: '"Malgun Gothic","Noto Sans KR",Arial,sans-serif',
    globalBase: 13,
    sidebarFont: "",
    sidebarSize: 11,
    topFont: "",
    titleSize: 16,
    actionSize: 11,
    dateFont: "",
    dateSize: 12,
    taskFont: "",
    taskSize: 12,
    rightFont: "",
    rightTitleSize: 12,
    rightBodySize: 12,
    bottomFont: "",
    bottomSize: 11
  };

  const state = {
    dateKey: "10",
    task: "payroll",
    lastIntake: null,
    settings: {...defaultSettings}
  };

  const taskMap = {
    expense:{label:"지출결의",page:"../pages/01_회계경리/expense.html",
      steps:["지급 대상과 금액 확인","회사 계좌잔액 확인","증빙자료 확인","은행에서 지급 처리","완료 및 이력 저장"]},
    payroll:{label:"일반급여",page:"../pages/01_회계경리/payroll.html",
      steps:["급여대장 확인","지급 대상과 계좌 확인","공제/실지급액 확인","은행에서 지급 처리","지급결과 저장"]},
    daily:{label:"일용직",page:"../pages/01_회계경리/payroll.html?task=daily",
      steps:["일용직 명단 확인","근무일수와 지급액 확인","공제 확인","계좌 확인","지급 및 이력 저장"]},
    cards:{label:"카드",page:"../pages/01_회계경리/cards.html",
      steps:["카드 청구내역 확인","출금예정 확인","사용처/증빙 확인","결제상태 확인","완료 저장"]},
    fixed:{label:"고정지출",page:"../pages/01_회계경리/fixed-expense.html",
      steps:["고정지출 목록 확인","금액 변동 확인","자동이체 확인","지출결의 반영","완료 저장"]},
    vendor:{label:"업체정산",page:"../pages/01_회계경리/vendors.html",
      steps:["총 공사대금 확인","수수료·인건비·자재비 확인","보험료·기타공제 확인","최종 정산액 확인","지급 및 완료"]},
    transactions:{label:"입출금",page:"../pages/01_회계경리/transactions.html",
      steps:["거래내역 확인","업무·증빙 대조","미분류 확인","분류 저장","월별 누적 확인"]},
    balance:{label:"계좌잔액",page:"../pages/01_회계경리/bank-balance.html",
      steps:["회사별 계좌 확인","현재 잔액 확인","이전 잔액 비교","메모 저장","보고 반영"]},
    taxinvoice:{label:"세금계산서",page:"../pages/01_회계경리/tax-invoice.html",
      steps:["매입·매출 구분","공급가·세액 확인","거래처 확인","홈택스 대조","이력 저장"]}
  };

  const $ = id => document.getElementById(id);
  const css = () => document.documentElement.style;

  function escapeHtml(v){
    return String(v ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  function toast(msg){
    const el=$("toast"); el.textContent=msg; el.classList.add("show");
    clearTimeout(window.__toast); window.__toast=setTimeout(()=>el.classList.remove("show"),2200);
  }

  function isHqMode(){
    const qs=new URLSearchParams(location.search);
    return qs.get("hq")==="1" || localStorage.getItem("taeon.hq.mode")==="1";
  }

  function applySettings(s){
    state.settings={...defaultSettings,...s};
    const x=state.settings;
    css().setProperty("--font-global",x.globalFont);
    css().setProperty("--size-base",x.globalBase+"px");
    css().setProperty("--font-sidebar",x.sidebarFont||x.globalFont);
    css().setProperty("--size-sidebar",x.sidebarSize+"px");
    css().setProperty("--font-top",x.topFont||x.globalFont);
    css().setProperty("--size-title",x.titleSize+"px");
    css().setProperty("--size-action",x.actionSize+"px");
    css().setProperty("--font-date",x.dateFont||x.globalFont);
    css().setProperty("--size-date",x.dateSize+"px");
    css().setProperty("--font-task",x.taskFont||x.globalFont);
    css().setProperty("--size-task",x.taskSize+"px");
    css().setProperty("--font-right",x.rightFont||x.globalFont);
    css().setProperty("--size-right-title",x.rightTitleSize+"px");
    css().setProperty("--size-right-body",x.rightBodySize+"px");
    css().setProperty("--font-bottom",x.bottomFont||x.globalFont);
    css().setProperty("--size-bottom",x.bottomSize+"px");
  }

  function loadSettings(){
    try{
      const saved=JSON.parse(localStorage.getItem(HQ_KEY)||"null");
      applySettings(saved||defaultSettings);
    }catch{ applySettings(defaultSettings); }
  }

  function bindSettingsForm(){
    if(!isHqMode()) return;
    document.body.classList.add("hq-mode");

    const mapping={
      hqGlobalFont:"globalFont",hqGlobalBase:"globalBase",
      hqSidebarSize:"sidebarSize",hqTitleSize:"titleSize",
      hqActionSize:"actionSize",hqDateSize:"dateSize",
      hqTaskSize:"taskSize",hqRightTitleSize:"rightTitleSize",
      hqRightBodySize:"rightBodySize",hqBottomSize:"bottomSize",
      hqSidebarFont:"sidebarFont",hqTopFont:"topFont",
      hqDateFont:"dateFont",hqTaskFont:"taskFont",
      hqRightFont:"rightFont",hqBottomFont:"bottomFont"
    };

    for(const [id,key] of Object.entries(mapping)){
      const el=$(id); if(!el) continue;
      el.value=state.settings[key] ?? "";
      el.addEventListener("input",()=>{
        const numeric=el.type==="number";
        state.settings[key]=numeric?Number(el.value):el.value;
        applySettings(state.settings);
      });
    }

    $("hqSave").addEventListener("click",()=>{
      localStorage.setItem(HQ_KEY,JSON.stringify(state.settings));
      toast("본사 화면설정 저장 완료");
    });

    $("hqReset").addEventListener("click",()=>{
      localStorage.removeItem(HQ_KEY);
      state.settings={...defaultSettings};
      applySettings(state.settings);
      location.reload();
    });
  }

  function cleanEmbeddedPage(){
    const frame=$("workFrame");
    try{
      const doc=frame.contentDocument;
      if(!doc) return;

      const style=doc.createElement("style");
      style.textContent=`
        body{margin:0!important;background:#fff!important}
        header,.topbar,.sidebar,.side-bar,.left-menu,.page-menu,.workspace-menu,
        nav,.global-nav,.module-nav,.taeon-sidebar,.taeon-menu,
        .editor-panel,.page-editor,.code-editor,.workspace-editor,
        [data-role="page-editor"],[data-role="code-editor"]{
          display:none!important
        }
        main,.main,.content,.page-content,.workspace,.workspace-main{
          margin:0!important;padding:0!important;width:100%!important;max-width:none!important
        }
      `;
      doc.head.appendChild(style);

      const candidates=[...doc.querySelectorAll("body *")];
      for(const el of candidates){
        const text=(el.textContent||"").trim();
        if(text==="업무 메뉴" || text==="2. 페이지 편집" || text==="3. 코드 편집"){
          const box=el.closest("section,aside,div");
          if(box) box.style.display="none";
        }
      }
    }catch(err){
      console.warn("[TAEON] embedded cleanup",err);
    }
  }

  function renderSupport(){
    const t=taskMap[state.task];
    $("centerContext").textContent=`${state.dateKey} · ${t.label}`;
    $("guideList").innerHTML=t.steps.map(s=>`<li>${escapeHtml(s)}</li>`).join("");
  }

  function loadTask(){
    const t=taskMap[state.task];
    $("workFrame").src=t.page;
    renderSupport();
  }

  function selectDate(btn){
    state.dateKey=btn.dataset.date;
    document.querySelectorAll("[data-date]").forEach(x=>x.classList.remove("selected"));
    btn.classList.add("selected"); renderSupport();
  }

  function selectTask(btn){
    state.task=btn.dataset.task;
    document.querySelectorAll("[data-task]").forEach(x=>x.classList.remove("selected"));
    btn.classList.add("selected"); loadTask();
  }

  async function api(path,opts={}){
    const r=await fetch(API_BASE+path,opts);
    const tx=await r.text();
    let data={}; try{data=tx?JSON.parse(tx):{}}catch{data={raw:tx}}
    if(!r.ok) throw new Error(data.message||data.error||`HTTP ${r.status}`);
    return data;
  }

  async function health(){
    try{
      const d=await api("/api/health");
      $("apiStatus").textContent=`API 정상 · ${d.storage||d.status||"READY"}`;
      $("systemCheck").textContent="API 정상";
    }catch(e){
      $("apiStatus").textContent="API 연결 실패";
      $("systemCheck").textContent="API 연결 실패";
    }
  }

  function showModal(title,kind){
    $("modalTitle").textContent=title; $("requestKind").value=kind;
    $("requestText").value=""; $("modalBackdrop").classList.add("show");
  }
  function hideModal(){ $("modalBackdrop").classList.remove("show"); }

  async function saveRequest(){
    const kind=$("requestKind").value;
    const text=$("requestText").value.trim();
    if(!text) return toast("내용을 입력하세요");
    try{
      const result=await api("/api/events",{
        method:"POST",headers:{"Content-Type":"application/json; charset=utf-8"},
        body:JSON.stringify({
          title:kind,status:"OPEN",type:kind,company:"주식회사 태온종합건설",
          occurredAt:new Date().toISOString(),
          tags:["ACCOUNTING","01_회계경리",kind],
          data:{text,selectedDate:state.dateKey,selectedTask:state.task}
        })
      });
      $("requestLog").textContent=`접수 완료 · ${result.eventId||"저장완료"}`;
      hideModal(); toast("요청 접수 완료");
    }catch(e){toast("요청 저장 실패")}
  }

  async function sendText(){
    const text=prompt("판독할 텍스트를 붙여넣으세요.");
    if(!text) return;
    try{
      const d=await api("/api/intake/text",{
        method:"POST",headers:{"Content-Type":"application/json; charset=utf-8"},
        body:JSON.stringify({text,pageId:"accounting-practical",pageName:"01 회계경리"})
      });
      state.lastIntake=d.result||d;
      $("apiStatus").textContent=`판독완료 · ${state.lastIntake.recommendedPage||state.lastIntake.documentType||"분류대기"}`;
    }catch(e){$("apiStatus").textContent="텍스트 판독 실패"}
  }

  function chooseFile(accept){
    const f=$("fileInput"); f.accept=accept; f.value=""; f.click();
  }

  async function sendFile(file){
    $("apiStatus").textContent=`${file.name} 판독 중...`;
    try{
      const bytes=await file.arrayBuffer();
      await api(`/api/intake/upload?filename=${encodeURIComponent(file.name)}`,{
        method:"POST",headers:{"Content-Type":"application/octet-stream"},body:bytes
      });
      $("apiStatus").textContent=`${file.name} 판독 완료`;
      $("relatedData").innerHTML=`<li>${escapeHtml(file.name)}</li>`;
    }catch(e){$("apiStatus").textContent=`파일 판독 실패`}
  }

  document.addEventListener("DOMContentLoaded",()=>{
    loadSettings();
    bindSettingsForm();

    document.querySelectorAll("[data-date]").forEach(b=>b.addEventListener("click",()=>selectDate(b)));
    document.querySelectorAll("[data-task]").forEach(b=>b.addEventListener("click",()=>selectTask(b)));

    $("workFrame").addEventListener("load",()=>{
      setTimeout(cleanEmbeddedPage,50);
      setTimeout(cleanEmbeddedPage,350);
    });

    $("newRequestBtn").addEventListener("click",()=>showModal("신규 업무 추가 요청","NEW_WORK_REQUEST"));
    $("changeRequestBtn").addEventListener("click",()=>showModal("기존 업무 변경 요청","WORK_CHANGE_REQUEST"));
    $("emailRequestBtn").addEventListener("click",()=>showModal("이메일 업무접수","EMAIL_INTAKE"));
    $("modalClose").addEventListener("click",hideModal);
    $("modalSubmit").addEventListener("click",saveRequest);

    $("filePdf").addEventListener("click",()=>chooseFile(".pdf,.doc,.docx,.hwp,.hwpx"));
    $("fileExcel").addEventListener("click",()=>chooseFile(".xls,.xlsx,.csv"));
    $("fileImage").addEventListener("click",()=>chooseFile("image/*"));
    $("fileText").addEventListener("click",sendText);
    $("fileInput").addEventListener("change",e=>{const f=e.target.files?.[0]; if(f) sendFile(f)});

    $("memo").value=localStorage.getItem("taeon.accounting.memo")||"";
    $("memo").addEventListener("input",()=>localStorage.setItem("taeon.accounting.memo",$("memo").value));

    loadTask(); health();
  });
})();