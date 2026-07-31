// --- KONFIGURASI TOKEN DAN API ---
const USER_TOKENS = {
  "OBS-001": { name: "DASHBOARD", role: "OBSERVER" },
  "JST4312": { name: "KAZUHIRO SHIMAZU", role: "OPERATOR" },
  "AAE2965": { name: "KENJI SHIMAZU", role: "OPERATOR" },
  "CFT9096": { name: "KEISUKE KAWASAKI", role: "OPERATOR" },
  "PLO5789": { name: "REYNALDI PUTRA UTAMA", role: "OPERATOR" },
  "CKY5684": { name: "ARIEF MULYANA", role: "OPERATOR" },
  "IXZ6735": { name: "JOKO WIYANTO", role: "OPERATOR" },
  "DGV4155": { name: "SUTRISNO", role: "OPERATOR" },
  "EDK1342": { name: "ISMET RAHADIAN", role: "OPERATOR" },
  "GSQ6725": { name: "YULI ROSMANIAR", role: "OPERATOR" },
  "HDD1234": { name: "KAMALLUDIN", role: "OPERATOR" },
  "RZC8247": { name: "MOCH EZRA REYHANSYAH", role: "OPERATOR" },
  "PVF9925": { name: "ZUHDI SYAKURI", role: "OPERATOR" },
  "VEI6174": { name: "SUSANDI", role: "OPERATOR" },
  "KVE7845": { name: "INDRA HERMAWAN", role: "OPERATOR" },
  "SQM3780": { name: "JOKO SURYANTO", role: "OPERATOR" },
  "VMP5704": { name: "ASIH SUNARSIH", role: "OPERATOR" },
  "QQO3817": { name: "HERU ANDI MULYANTO", role: "OPERATOR" },
  "EMV1908": { name: "MANSYURAH HAMIDA KARSA", role: "OPERATOR" },
  "OTC8718": { name: "ETI HENRAWATI", role: "OPERATOR" },
  "SDF6608": { name: "ELIN DESRIYATI PRIYATNA", role: "OPERATOR" },
  "IWQ6151": { name: "KIKI SEPTIADI", role: "OPERATOR" },
  "UAA9265": { name: "SITI NURJANAH", role: "OPERATOR" },
  "QKN1285": { name: "VINA ERMANIA", role: "OPERATOR" },
  "MKB6092": { name: "WIDIA NINGSIH", role: "OPERATOR" },
  "WXP5911": { name: "RIZAL ZULFIKAR", role: "OPERATOR" },
  "TCB8495": { name: "ARIO MAULANA NUGROHO", role: "OPERATOR" },
  "CRF7098": { name: "M IRZI FAHROZI", role: "OPERATOR" },
  "PPW1429": { name: "RISKA", role: "OPERATOR" },
  "JOQ9412": { name: "SARINAH", role: "OPERATOR" },
  "WHG6291": { name: "SHELLY APRILLIANTI", role: "OPERATOR" },
  "LNE2413": { name: "LIA HASANAH", role: "OPERATOR" },
  "ZWI4004": { name: "WAHYU DARMAWAN", role: "OPERATOR" },
  "FEA2698": { name: "BAGAS FITRIANTO", role: "OPERATOR" },
  "MPR9149": { name: "ALVIN SOPYAN", role: "OPERATOR" },
  "AWP1397": { name: "FAJAR ADITYA PRATAMA ", role: "OPERATOR" }
};

// Ganti URL ini dengan Web App Deployment URL dari Google Apps Script Anda
const GAS_API_URL = "https://script.google.com/macros/s/AKfycby3gBdjKqx1NLOGxwhmoHyu5FQ5_cuX2SwdNXxJuFSPpKoTYa-3Y4yiEUshI4caSSKdKQ/exec";

// State Aplikasi
let currentUser = null;
let rawPlanData = [];
let rawAchievementData = [];

// Element References
const loginScreen = document.getElementById("login-screen");
const appScreen = document.getElementById("app-screen");
const loginForm = document.getElementById("login-form");
const tokenInput = document.getElementById("token-input");
const userNameDisplay = document.getElementById("user-name-display");
const userRoleBadge = document.getElementById("user-role-badge");
const logoutBtn = document.getElementById("logout-btn");

const operatorView = document.getElementById("operator-view");
const observerView = document.getElementById("observer-view");

const woInputModal = document.getElementById("wo-input-modal");
const operatorInputForm = document.getElementById("operator-input-form");

// --- INITIALIZATION & ROUTING ---
document.addEventListener("DOMContentLoaded", () => {
  // Cek parameter token di URL (misal: ?token=OPT-001)
  const urlParams = new URLSearchParams(window.location.search);
  const tokenParam = urlParams.get("token");

  if (tokenParam && USER_TOKENS[tokenParam]) {
    authenticateUser(tokenParam);
  } else {
    showLoginScreen();
  }

  setupEventListeners();
});

// Helper untuk merapikan format Timestamp UTC/ISO menjadi waktu lokal Indonesia (WIB)
function formatTimestamp(isoString) {
  if (!isoString) return "-";
  
  const date = new Date(isoString);
  
  // Cek jika penanganan tanggal invalid
  if (isNaN(date.getTime())) return isoString;

  // Format menjadi: YYYY-MM-DD HH:mm:ss (Waktu Lokal)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function setupEventListeners() {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const token = tokenInput.value.trim();
    if (USER_TOKENS[token]) {
      authenticateUser(token);
    } else {
      alert("Token tidak ditemukan / tidak valid!");
    }
  });

  logoutBtn.addEventListener("click", () => {
    currentUser = null;
    window.history.replaceState({}, document.title, window.location.pathname);
    showLoginScreen();
  });

  // Tab operator Navigation
  document.getElementById("tab-wo-btn").addEventListener("click", (e) => {
    switchTab("tab-wo-content", e.target);
  });
  document.getElementById("tab-history-btn").addEventListener("click", (e) => {
    switchTab("tab-history-content", e.target);
  });

  // Modal Controls
  document.getElementById("modal-close-btn").addEventListener("click", closeModal);
  document.getElementById("modal-cancel-btn").addEventListener("click", closeModal);
  operatorInputForm.addEventListener("submit", handleOperatorSubmit);

  // Observer Filter
  document.getElementById("btn-apply-filter").addEventListener("click", renderObserverDashboard);
}

function switchTab(tabContentId, targetBtn) {
  document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(el => el.classList.remove("active"));
  
  document.getElementById(tabContentId).classList.add("active");
  targetBtn.classList.add("active");
}

function showLoginScreen() {
  loginScreen.classList.remove("hidden");
  appScreen.classList.add("hidden");
}

function authenticateUser(token) {
  currentUser = { token: token, ...USER_TOKENS[token] };
  
  userNameDisplay.textContent = currentUser.name;
  userRoleBadge.textContent = currentUser.role;

  loginScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");

  fetchDataAndRender();
}

// --- FETCH DATA DARI GOOGLE SHEETS ---
async function fetchDataAndRender() {
  try {
    const [planRes, achRes] = await Promise.all([
      fetch(`${GAS_API_URL}?action=getPlanData`),
      fetch(`${GAS_API_URL}?action=getAchievementData`)
    ]);

    const planJson = await planRes.json();
    const achJson = await achRes.json();

    rawPlanData = planJson.data || [];
    rawAchievementData = achJson.data || [];

    if (currentUser.role === "OPERATOR") {
      observerView.classList.add("hidden");
      operatorView.classList.remove("hidden");
      renderOperatorWOList();
      renderOperatorHistory();
    } else if (currentUser.role === "OBSERVER") {
      operatorView.classList.add("hidden");
      observerView.classList.remove("hidden");
      populateBagianDropdown();
      renderObserverDashboard();
    }
  } catch (error) {
    console.error("Gagal mengambil data:", error);
    alert("Gagal terhubung ke database Google Sheets.");
  }
}

// --- LOGIC OPERATOR (REVISI) ---
function renderOperatorWOList() {
  const container = document.getElementById("wo-list-container");
  container.innerHTML = "";

  // Filter WO sesuai Nama Operator
  const myWorkOrders = rawPlanData.filter(item => 
    String(item["Nama Operator"]).toLowerCase() === currentUser.name.toLowerCase()
  );

  if (myWorkOrders.length === 0) {
    container.innerHTML = "<p>Tidak ada penugasan Work Order untuk Anda saat ini.</p>";
    return;
  }

  myWorkOrders.forEach(item => {
    const woId = item["Work Order"];
    const planQty = Number(item["Plan Qty"]) || 0;

    // Hitung akumulasi Actual Qty yang sudah pernah di-submit untuk Work Order ini
    const totalActual = rawAchievementData
      .filter(ach => String(ach["Work Order"]).trim() === String(woId).trim())
      .reduce((sum, ach) => sum + (Number(ach["Actual Qty"]) || 0), 0);

    // Hitung persentase ketercapaian
    const percentage = planQty > 0 ? ((totalActual / planQty) * 100).toFixed(1) : 0;

    // Tentukan warna status ketercapaian
    let statusClass = "status-red";
    let badgeBgClass = "badge-red";
    if (percentage >= 100) {
      statusClass = "status-green";
      badgeBgClass = "badge-green";
    } else if (percentage >= 80) {
      statusClass = "status-yellow";
      badgeBgClass = "badge-yellow";
    }

    const card = document.createElement("div");
    card.className = "wo-card";
    card.innerHTML = `
      <div class="wo-card-header">
        <span>${item["Work Order"]}</span>
        <span class="badge ${badgeBgClass}">${percentage}%</span>
      </div>
      <div class="wo-card-body">
        <p><strong>Tipe Lensa:</strong> ${item["Tipe Lensa"]}</p>
        <p><strong>No. Mesin:</strong> ${item["Nomor Mesin"]} | <strong>Bagian:</strong> ${item["Bagian"]}</p>
        <p><strong>Pencapaian:</strong> <span class="${statusClass}">${percentage}%</span> (${totalActual} / ${planQty} pcs)</p>
      </div>
    `;
    card.addEventListener("click", () => openModalWithWO(item, totalActual, percentage));
    container.appendChild(card);
  });
}

function renderOperatorHistory() {
  const container = document.getElementById("operator-history-container");
  container.innerHTML = "";

  const myHistory = rawAchievementData.filter(item => 
    String(item["Nama Operator"]).toLowerCase() === currentUser.name.toLowerCase()
  );

  if (myHistory.length === 0) {
    container.innerHTML = "<p>Belum ada riwayat input achievement.</p>";
    return;
  }

  myHistory.reverse().forEach(item => {
    const card = document.createElement("div");
    card.className = "history-card";
    card.innerHTML = `
      <div class="wo-card-header">
        <span>WO: ${item["Work Order"]}</span>
        <span class="badge">${item["Siklus"]}</span>
      </div>
      <div class="wo-card-body">
        <p><strong>Actual Qty:</strong> ${item["Actual Qty"]} pcs</p>
        <p><strong>Tanggal Input:</strong> ${formatTimestamp(item["Timestamp"])}</p>
        ${item["Catatan Scrap"] ? `<p><strong>Scrap:</strong> ${item["Catatan Scrap"]}</p>` : ""}
        ${item["catatan kendala"] ? `<p><strong>Kendala:</strong> ${item["catatan kendala"]}</p>` : ""}
      </div>
    `;
    container.appendChild(card);
  });
}

function openModalWithWO(woItem, totalActual = 0, percentage = 0) {
  document.getElementById("form-wo-id").value = woItem["Work Order"];
  document.getElementById("form-bagian").value = woItem["Bagian"];
  document.getElementById("form-nomor-mesin").value = woItem["Nomor Mesin"];
  document.getElementById("form-tipe-lensa").value = woItem["Tipe Lensa"];

  document.getElementById("info-wo").textContent = woItem["Work Order"];
  document.getElementById("info-lensa").textContent = woItem["Tipe Lensa"];
  document.getElementById("info-mesin").textContent = woItem["Nomor Mesin"];
  document.getElementById("info-plan").textContent = woItem["Plan Qty"];
  document.getElementById("info-catatan-target").textContent = woItem["catatan target"] || "-";

  // Tampilkan info pencapaian saat ini di dalam modal
  const infoProgress = document.getElementById("info-progress");
  if (infoProgress) {
    infoProgress.textContent = `${totalActual} / ${woItem["Plan Qty"]} pcs (${percentage}%)`;
  }

  operatorInputForm.reset();
  woInputModal.classList.remove("hidden");
}

function closeModal() {
  woInputModal.classList.add("hidden");
}

async function handleOperatorSubmit(e) {
  e.preventDefault();
  
  const submitBtn = document.getElementById("modal-submit-btn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Menyimpan...";

  const payload = {
    action: "addAchievement",
    data: {
      workOrder: document.getElementById("form-wo-id").value,
      namaOperator: currentUser.name,
      bagian: document.getElementById("form-bagian").value,
      nomorMesin: document.getElementById("form-nomor-mesin").value,
      tipeLensa: document.getElementById("form-tipe-lensa").value,
      siklus: document.getElementById("input-siklus").value,
      actualQty: document.getElementById("input-actual-qty").value,
      catatanScrap: document.getElementById("input-catatan-scrap").value,
      catatanKendala: document.getElementById("input-catatan-kendala").value
    }
  };

  try {
    const res = await fetch(GAS_API_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const result = await res.json();

    if (result.status === "success") {
      alert("Achievement berhasil disimpan!");
      closeModal();
      fetchDataAndRender();
    } else {
      alert("Gagal menyimpan data: " + result.message);
    }
  } catch (error) {
    console.error("Submit Error:", error);
    alert("Terjadi kesalahan sistem.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Simpan Achievement";
  }
}

// --- LOGIC OBSERVER ---
function populateBagianDropdown() {
  const select = document.getElementById("filter-bagian");
  select.innerHTML = '<option value="">-- Semua Bagian --</option>';

  const bagianSet = new Set(rawPlanData.map(item => item["Bagian"]).filter(Boolean));
  bagianSet.forEach(bagian => {
    const opt = document.createElement("option");
    opt.value = bagian;
    opt.textContent = bagian;
    select.appendChild(opt);
  });
}

function renderObserverDashboard() {
  const selectedDate = document.getElementById("filter-date").value; // Format HTML input date: YYYY-MM-DD
  const selectedBagian = document.getElementById("filter-bagian").value;

  // Filter Plan Data
  let filteredPlan = rawPlanData.filter(item => {
    let matchDate = true;
    let matchBagian = true;

    if (selectedDate && item["Tanggal Produksi"]) {
      matchDate = item["Tanggal Produksi"].startsWith(selectedDate);
    }
    if (selectedBagian) {
      matchBagian = item["Bagian"] === selectedBagian;
    }
    return matchDate && matchBagian;
  });

  // Filter Achievement Data (PERBAIKAN DI SINI)
  let filteredAchievement = rawAchievementData.filter(item => {
    let matchDate = true;
    let matchBagian = true;

    // Cek jika filter tanggal diisi
    if (selectedDate) {
      // Menggunakan "Tanggal Produksi" jika ada di Achievement,
      // ATAU mengecek awal string "Timestamp" (misal: "2026-05-20...")
      const achDate = item["Tanggal Produksi"] || item["Timestamp"];
      if (achDate) {
        matchDate = String(achDate).startsWith(selectedDate);
      }
    }

    if (selectedBagian) {
      matchBagian = item["Bagian"] === selectedBagian;
    }

    return matchDate && matchBagian;
  });

  renderSummaryTable(filteredPlan, filteredAchievement);
  renderDetailTable(filteredAchievement);
}

function renderSummaryTable(planList, achievementList) {
  const tbody = document.querySelector("#summary-table tbody");
  tbody.innerHTML = "";

  const summaryMap = {};

  // 1. Akumulasi Plan Qty
  planList.forEach(p => {
    const bagian = p["Bagian"] || "-";
    const tipeLensa = p["Tipe Lensa"] || "-";
    const key = `${bagian}|||${tipeLensa}`;

    if (!summaryMap[key]) {
      summaryMap[key] = {
        bagian: bagian,
        tipeLensa: tipeLensa,
        totalPlan: 0,
        totalActual: 0
      };
    }
    summaryMap[key].totalPlan += Number(p["Plan Qty"]) || 0;
  });

  // 2. Akumulasi Actual Qty (Sudah terfilter tanggal dari caller)
  achievementList.forEach(a => {
    const bagian = a["Bagian"] || "-";
    const tipeLensa = a["Tipe Lensa"] || "-";
    const key = `${bagian}|||${tipeLensa}`;

    // Buat entry baru jika misal ada Actual di tanggal tsb tapi Plan-nya 0
    if (!summaryMap[key]) {
      summaryMap[key] = {
        bagian: bagian,
        tipeLensa: tipeLensa,
        totalPlan: 0,
        totalActual: 0
      };
    }
    summaryMap[key].totalActual += Number(a["Actual Qty"]) || 0;
  });

  const keys = Object.keys(summaryMap);
  if (keys.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Data tidak ditemukan.</td></tr>';
    return;
  }

  // 3. Render Baris Tabel
  keys.forEach(key => {
    const item = summaryMap[key];
    const percentage = item.totalPlan > 0 
      ? ((item.totalActual / item.totalPlan) * 100).toFixed(1) 
      : 0;

    let statusClass = "status-red";
    if (percentage >= 100) statusClass = "status-green";
    else if (percentage >= 80) statusClass = "status-yellow";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.bagian}</td>
      <td>${item.tipeLensa}</td>
      <td>${item.totalPlan}</td>
      <td>${item.totalActual}</td>
      <td class="${statusClass}">${percentage}%</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderDetailTable(achievementList) {
  const tbody = document.querySelector("#detail-table tbody");
  tbody.innerHTML = "";

  if (achievementList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;">Belum ada log achievement.</td></tr>';
    return;
  }

  achievementList.slice().reverse().forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${formatTimestamp(item["Timestamp"])}</td>
      <td>${item["Work Order"] || "-"}</td>
      <td>${item["Nama Operator"] || "-"}</td>
      <td>${item["Bagian"] || "-"}</td>
      <td>${item["Nomor Mesin"] || "-"}</td>
      <td>${item["Tipe Lensa"] || "-"}</td>
      <td>${item["Siklus"] || "-"}</td>
      <td>${item["Actual Qty"] || 0}</td>
      <td>${item["Catatan Scrap"] || "-"}</td>
      <td>${item["catatan kendala"] || "-"}</td>
    `;
    tbody.appendChild(tr);
  });
}