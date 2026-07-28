/* ==========================================================================
   PT NAGATA OPTO WORKS INDONESIA - NOAS APPLICATION LOGIC
   ========================================================================== */

const STORAGE_KEY = 'NAGATA_NOAS_ASSIGNMENTS_V2';

// Initial Realistic Sample Data (with multi-assignments per operator)
const DEFAULT_ASSIGNMENTS = [
  {
    id: 'WO-2026-001',
    tanggal: '2026-07-28',
    shift: '1',
    siklus: 'PRODUKSI',
    section: 'Fine Polishing',
    namaOperator: 'Budi Santoso',
    nomorMesin: 'POL-04',
    tipeLensa: 'R-Optic 50mm High-Precision',
    planQty: 500,
    token: 'opr-zq224',
    qtyList: [40, 45, 45, 50, 45, 0, 0, 0, 0, 0, 0, 0],
    scrapText: '3 pcs retak mikro pada pinggir kaca',
    kendala: 'Slurry polishing agak kental di jam ke-2, sudah dikalibrasi.',
    updatedAt: '2026-07-28 11:30'
  },
  {
    id: 'WO-2026-006',
    tanggal: '2026-07-28',
    shift: '1',
    siklus: 'REPAIR',
    section: 'Fine Polishing',
    namaOperator: 'Budi Santoso',
    nomorMesin: 'POL-05',
    tipeLensa: 'Flat-Mirror V2 30mm',
    planQty: 250,
    token: 'opr-zq224',
    qtyList: [30, 35, 30, 40, 0, 0, 0, 0, 0, 0, 0, 0],
    scrapText: '2 pcs scratch halus permukaan',
    kendala: '',
    updatedAt: '2026-07-28 11:00'
  },
  {
    id: 'WO-2026-002',
    tanggal: '2026-07-28',
    shift: '1',
    siklus: 'PRODUKSI',
    section: 'Grinding',
    namaOperator: 'Agus Kurniadi',
    nomorMesin: 'CG-01',
    tipeLensa: 'Aspheric Lens 35mm',
    planQty: 600,
    token: 'opr-ak992',
    qtyList: [60, 60, 55, 65, 60, 60, 50, 0, 0, 0, 0, 0],
    scrapText: '5 pcs chipping pada tepi lens',
    kendala: '',
    updatedAt: '2026-07-28 12:15'
  },
  {
    id: 'WO-2026-003',
    tanggal: '2026-07-28',
    shift: '1',
    siklus: 'REPAIR',
    section: 'Coating',
    namaOperator: 'M. Rizky',
    nomorMesin: 'COAT-02',
    tipeLensa: 'AR Coated Prism 20mm',
    planQty: 300,
    token: 'opr-mr551',
    qtyList: [25, 30, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    scrapText: '12 pcs bintik air coating (pinhole)',
    kendala: 'Tekanan chamber vacuum sempat drop 10 menit.',
    updatedAt: '2026-07-28 10:45'
  },
  {
    id: 'WO-2026-004',
    tanggal: '2026-07-28',
    shift: '2',
    siklus: 'PRODUKSI',
    section: 'QC Inspection',
    namaOperator: 'Siti Rahmawati',
    nomorMesin: 'ZYGO-01',
    tipeLensa: 'R-Optic 50mm High-Precision',
    planQty: 450,
    token: 'opr-qc108',
    qtyList: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    scrapText: '',
    kendala: 'Menunggu penyerahan batch dari Polishing line.',
    updatedAt: '2026-07-28 08:00'
  },
  {
    id: 'WO-2026-005',
    tanggal: '2026-07-28',
    shift: '1',
    siklus: 'RWK',
    section: 'Centering',
    namaOperator: 'Dedi Kurniawan',
    nomorMesin: 'CTR-03',
    tipeLensa: 'Cylindrical Lens 40mm',
    planQty: 250,
    token: 'opr-dk773',
    qtyList: [20, 25, 25, 30, 30, 25, 0, 0, 0, 0, 0, 0],
    scrapText: '1 pc axis deviation out-of-spec',
    kendala: '',
    updatedAt: '2026-07-28 12:00'
  }
];

let assignments = [];
let currentRole = 'ppic';
let currentToken = 'opr-zq224';
let activeAssignmentId = null; // Currently selected assignment in detail view

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  loadAssignments();
  setCurrentDateDefault();
  switchRole('ppic');
});

function loadAssignments() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      assignments = JSON.parse(data);
    } catch (e) {
      assignments = JSON.parse(JSON.stringify(DEFAULT_ASSIGNMENTS));
    }
  } else {
    assignments = JSON.parse(JSON.stringify(DEFAULT_ASSIGNMENTS));
    saveToStorage();
  }
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
}

function resetDefaultData() {
  if (confirm('Kembalikan data sampel awal PT Nagata Opto Works Indonesia?')) {
    assignments = JSON.parse(JSON.stringify(DEFAULT_ASSIGNMENTS));
    saveToStorage();
    renderCurrentView();
  }
}

function setCurrentDateDefault() {
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('filterTanggal');
  if (dateInput) dateInput.value = today;
  const newDateInput = document.getElementById('newTanggal');
  if (newDateInput) newDateInput.value = today;
}

// Role Switcher & Token Simulation
function switchRole(role, token = '') {
  currentRole = role;
  if (token) currentToken = token;

  // Reset detail view state when switching role
  activeAssignmentId = null;

  document.querySelectorAll('.role-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.role === role);
  });

  const activeUrlCode = document.getElementById('activeUrlCode');
  if (role === 'ppic') {
    activeUrlCode.textContent = 'https://docs.google.com/spreadsheets/d/nagata-ppic-wo-2026/edit';
  } else if (role === 'operator') {
    activeUrlCode.textContent = `https://noas.nagata-opto.co.id/?token=${currentToken}`;
  } else if (role === 'observer') {
    activeUrlCode.textContent = `https://noas.nagata-opto.co.id/dashboard?token=${currentToken}`;
  }

  document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
  const activeSec = document.getElementById(`view-${role}`);
  if (activeSec) activeSec.classList.add('active');

  renderCurrentView();
}

function renderCurrentView() {
  if (currentRole === 'ppic') renderPPICView();
  else if (currentRole === 'operator') renderOperatorView();
  else if (currentRole === 'observer') renderObserverView();
}

/* ==================== 1. PPIC GOOGLE SHEETS VIEW ==================== */
function renderPPICView() {
  const tbody = document.getElementById('ppicTableBody');
  if (!tbody) return;

  tbody.innerHTML = assignments.map((item, index) => {
    const totalActual = (item.qtyList || []).reduce((a, b) => Number(a) + Number(b), 0);
    const siklusClass = item.siklus === 'REPAIR' ? 'repair' : (item.siklus === 'RWK' ? 'rwk' : '');

    return `
      <tr>
        <td><strong>${index + 1}</strong></td>
        <td>${item.tanggal}</td>
        <td><span class="badge badge-shift">Shift ${item.shift}</span></td>
        <td><span class="badge badge-siklus ${siklusClass}">${item.siklus}</span></td>
        <td><span class="badge badge-section">${item.section}</span></td>
        <td><strong>${item.namaOperator}</strong></td>
        <td><code>${item.nomorMesin}</code></td>
        <td>${item.tipeLensa}</td>
        <td><strong>${item.planQty}</strong></td>
        <td><span style="color: var(--success-color); font-weight:700;">${totalActual}</span></td>
        <td>
          <span class="token-link" onclick="switchRole('operator', '${item.token}')" title="Klik untuk simulasi link token operator">
            ?token=${item.token}
          </span>
        </td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="deleteAssignment('${item.id}')" title="Hapus">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

function openAddAssignmentModal() {
  document.getElementById('addModal').classList.add('active');
}

function closeAddAssignmentModal() {
  document.getElementById('addModal').classList.remove('active');
}

function handleAddAssignment(e) {
  e.preventDefault();
  const randomId = 'WO-2026-' + String(Math.floor(100 + Math.random() * 900));
  const customToken = document.getElementById('newToken').value.trim();
  const randomToken = customToken || ('opr-' + Math.random().toString(36).substring(2, 7));

  const newItem = {
    id: randomId,
    tanggal: document.getElementById('newTanggal').value,
    shift: document.getElementById('newShift').value,
    siklus: document.getElementById('newSiklus').value,
    section: document.getElementById('newSection').value,
    namaOperator: document.getElementById('newNama').value,
    nomorMesin: document.getElementById('newMesin').value,
    tipeLensa: document.getElementById('newTipeLensa').value,
    planQty: Number(document.getElementById('newPlanQty').value) || 500,
    token: randomToken,
    qtyList: [0,0,0,0,0,0,0,0,0,0,0,0],
    scrapText: '',
    kendala: '',
    updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
  };

  assignments.unshift(newItem);
  saveToStorage();
  closeAddAssignmentModal();
  renderPPICView();
  alert(`Penugasan baru tersimpan di Google Sheets! Token Operator: ${randomToken}`);
}

function deleteAssignment(id) {
  if (confirm('Hapus penugasan ini dari Google Sheets PPIC?')) {
    assignments = assignments.filter(item => item.id !== id);
    saveToStorage();
    renderPPICView();
  }
}

/* ==================== 2. OPERATOR SMARTPHONE VIEW (2-STAGE NAVIGATION) ==================== */
function renderOperatorView() {
  // Populate token dropdown selector
  const select = document.getElementById('operatorTokenSelect');
  if (select) {
    // Unique tokens
    const uniqueTokens = Array.from(new Set(assignments.map(a => a.token)));
    select.innerHTML = uniqueTokens.map(t => {
      const firstAssign = assignments.find(a => a.token === t);
      const count = assignments.filter(a => a.token === t).length;
      return `
        <option value="${t}" ${t === currentToken ? 'selected' : ''}>
          ${firstAssign.namaOperator} (${count} Penugasan) [?token=${t}]
        </option>
      `;
    }).join('');
  }

  // Get all assignments for current token
  const userAssignments = assignments.filter(a => a.token === currentToken);

  if (userAssignments.length === 0) {
    document.getElementById('operatorSummaryScreen').style.display = 'block';
    document.getElementById('operatorDetailScreen').style.display = 'none';
    document.getElementById('oprTaskSummaryList').innerHTML = '<p style="color: var(--text-muted); text-align: center;">Tidak ada penugasan untuk token ini.</p>';
    return;
  }

  const operatorName = userAssignments[0].namaOperator;

  // Decide whether to show Summary List screen or Detail screen
  if (!activeAssignmentId || !userAssignments.some(a => a.id === activeAssignmentId)) {
    // SHOW TAHAP 1: SUMMARY LIST SCREEN
    document.getElementById('operatorSummaryScreen').style.display = 'block';
    document.getElementById('operatorDetailScreen').style.display = 'none';

    document.getElementById('oprWelcomeName').textContent = `Penugasan ${operatorName}`;
    document.getElementById('oprTaskCountSub').textContent = `Ditemukan ${userAssignments.length} penugasan kerja untuk Anda hari ini:`;

    const summaryListContainer = document.getElementById('oprTaskSummaryList');
    summaryListContainer.innerHTML = userAssignments.map(item => {
      const actSum = (item.qtyList || []).reduce((a, b) => Number(a) + Number(b), 0);
      const pct = item.planQty > 0 ? Math.round((actSum / item.planQty) * 100) : 0;
      const siklusClass = item.siklus === 'REPAIR' ? 'repair' : (item.siklus === 'RWK' ? 'rwk' : '');

      return `
        <div class="summary-task-card" onclick="openOperatorDetail('${item.id}')">
          <div class="summary-card-header">
            <div class="summary-task-title">Mesin ${item.nomorMesin}</div>
            <span class="badge badge-shift">Shift ${item.shift}</span>
          </div>
          <div class="summary-lens-type">📦 ${item.tipeLensa}</div>
          <div class="tags-row" style="margin-bottom: 0.5rem;">
            <span class="badge badge-siklus ${siklusClass}">${item.siklus}</span>
            <span class="badge badge-section">${item.section}</span>
          </div>
          <div class="summary-card-bottom">
            <div style="font-size: 0.78rem; color: var(--text-muted);">
              Progress: <strong style="color: #38bdf8;">${actSum} / ${item.planQty} pcs (${pct}%)</strong>
            </div>
            <span class="action-link-btn">Buka & Input ➔</span>
          </div>
        </div>
      `;
    }).join('');

  } else {
    // SHOW TAHAP 2: DETAIL INPUT SCREEN FOR SELECTED ASSIGNMENT
    document.getElementById('operatorSummaryScreen').style.display = 'none';
    document.getElementById('operatorDetailScreen').style.display = 'block';

    const item = userAssignments.find(a => a.id === activeAssignmentId);
    if (!item) return;

    document.getElementById('oprTokenChip').textContent = `Token: ${item.token}`;
    document.getElementById('oprShiftBadge').textContent = `Shift ${item.shift}`;
    document.getElementById('oprSiklusBadge').textContent = item.siklus;
    document.getElementById('oprSiklusBadge').className = `badge badge-siklus ${item.siklus.toLowerCase()}`;
    document.getElementById('oprSectionBadge').textContent = item.section;

    document.getElementById('oprTanggal').textContent = item.tanggal;
    document.getElementById('oprNama').textContent = item.namaOperator;
    document.getElementById('oprMesin').textContent = item.nomorMesin;
    document.getElementById('oprTipeLensa').textContent = item.tipeLensa;
    document.getElementById('oprPlanQty').textContent = `${item.planQty} pcs`;

    // Populate Qty 1..12 inputs
    for (let i = 1; i <= 12; i++) {
      const qtyInput = document.getElementById(`qty${i}`);
      if (qtyInput) {
        qtyInput.value = (item.qtyList && item.qtyList[i - 1] !== undefined) ? item.qtyList[i - 1] : 0;
      }
    }

    // Populate Free-Text Scrap & Kendala (As Requested by User)
    const scrapTextarea = document.getElementById('oprScrapText');
    if (scrapTextarea) scrapTextarea.value = item.scrapText || '';

    const kendalaInput = document.getElementById('oprKendala');
    if (kendalaInput) kendalaInput.value = item.kendala || '';

    calculateOperatorTotals();
  }
}

function openOperatorDetail(assignmentId) {
  activeAssignmentId = assignmentId;
  renderOperatorView();
}

function backToOperatorSummary() {
  activeAssignmentId = null;
  renderOperatorView();
}

function onOperatorSelectChange(token) {
  currentToken = token;
  activeAssignmentId = null;
  switchRole('operator', token);
}

function calculateOperatorTotals() {
  const item = assignments.find(a => a.id === activeAssignmentId) || assignments.find(a => a.token === currentToken);
  const planQty = item ? item.planQty : 500;

  let totalActual = 0;
  for (let i = 1; i <= 12; i++) {
    const val = Number(document.getElementById(`qty${i}`).value) || 0;
    totalActual += val;
  }

  const percent = planQty > 0 ? Math.round((totalActual / planQty) * 100) : 0;

  // Update Small Progress Percentage Badge
  document.getElementById('oprPercentText').textContent = `${percent}%`;
  document.getElementById('oprRatioText').textContent = `${totalActual} / ${planQty} pcs`;
  document.getElementById('oprMiniBarFill').style.width = `${Math.min(percent, 100)}%`;

  // Update Calc Summary
  document.getElementById('oprTotalActual').textContent = `${totalActual} pcs`;
  document.getElementById('oprCalcRatio').textContent = `${totalActual} / ${planQty} pcs (${percent}%)`;
}

function saveOperatorReport() {
  const item = assignments.find(a => a.id === activeAssignmentId);
  if (!item) return;

  const newQtyList = [];
  for (let i = 1; i <= 12; i++) {
    newQtyList.push(Number(document.getElementById(`qty${i}`).value) || 0);
  }

  item.qtyList = newQtyList;
  item.scrapText = document.getElementById('oprScrapText').value || '';
  item.kendala = document.getElementById('oprKendala').value || '';
  item.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);

  saveToStorage();

  const toast = document.getElementById('saveToast');
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

/* ==================== 3. OBSERVER DESKTOP PC VIEW ==================== */
function renderObserverView() {
  populateLensTypeFilter();
  applyObserverFilters();
}

function populateLensTypeFilter() {
  const select = document.getElementById('filterTipeLensa');
  if (!select) return;

  const currentVal = select.value;
  const lensTypes = Array.from(new Set(assignments.map(a => a.tipeLensa)));

  select.innerHTML = '<option value="ALL">Semua Tipe Lensa</option>' + 
    lensTypes.map(t => `<option value="${t}">${t}</option>`).join('');

  if (currentVal) select.value = currentVal;
}

function applyObserverFilters() {
  const fTanggal = document.getElementById('filterTanggal')?.value;
  const fShift = document.getElementById('filterShift')?.value || 'ALL';
  const fSiklus = document.getElementById('filterSiklus')?.value || 'ALL';
  const fSection = document.getElementById('filterSection')?.value || 'ALL';
  const fTipeLensa = document.getElementById('filterTipeLensa')?.value || 'ALL';

  const filtered = assignments.filter(item => {
    if (fTanggal && item.tanggal !== fTanggal) return false;
    if (fShift !== 'ALL' && item.shift !== fShift) return false;
    if (fSiklus !== 'ALL' && item.siklus !== fSiklus) return false;
    if (fSection !== 'ALL' && item.section !== fSection) return false;
    if (fTipeLensa !== 'ALL' && item.tipeLensa !== fTipeLensa) return false;
    return true;
  });

  let totalPlan = 0;
  let totalActual = 0;

  filtered.forEach(item => {
    totalPlan += item.planQty;
    const act = (item.qtyList || []).reduce((a, b) => Number(a) + Number(b), 0);
    totalActual += act;
  });

  const overallPercent = totalPlan > 0 ? Math.round((totalActual / totalPlan) * 100) : 0;

  document.getElementById('kpiPlan').textContent = totalPlan.toLocaleString('id-ID');
  document.getElementById('kpiActual').textContent = totalActual.toLocaleString('id-ID');
  document.getElementById('kpiPercent').textContent = `${overallPercent}%`;
  document.getElementById('kpiAssignments').textContent = filtered.length.toLocaleString('id-ID');

  document.getElementById('recordCounterBadge').textContent = `${filtered.length} Penugasan Tampil`;

  const tbody = document.getElementById('observerTableBody');
  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="14" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          Tidak ada data penugasan yang sesuai dengan filter.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map((item, idx) => {
    const actSum = (item.qtyList || []).reduce((a, b) => Number(a) + Number(b), 0);
    const pct = item.planQty > 0 ? Math.round((actSum / item.planQty) * 100) : 0;
    const siklusClass = item.siklus === 'REPAIR' ? 'repair' : (item.siklus === 'RWK' ? 'rwk' : '');

    const qtyPills = (item.qtyList || []).map((q, i) => `
      <span class="qty-pill ${q > 0 ? 'has-val' : ''}" title="Jam ${i+1}: ${q} pcs">J${i+1}:${q}</span>
    `).join('');

    const statusBadge = item.kendala
      ? `<span class="status-badge issue">⚠️ Ada Kendala</span>`
      : (pct >= 100 ? `<span class="status-badge on-track">✅ Target Achieved</span>` : `<span class="status-badge on-track">In Progress</span>`);

    return `
      <tr>
        <td><strong>${idx + 1}</strong></td>
        <td><span class="badge badge-shift">Shift ${item.shift}</span></td>
        <td><span class="badge badge-siklus ${siklusClass}">${item.siklus}</span></td>
        <td><span class="badge badge-section">${item.section}</span></td>
        <td><strong>${item.namaOperator}</strong></td>
        <td><code>${item.nomorMesin}</code></td>
        <td>${item.tipeLensa}</td>
        <td><strong>${item.planQty}</strong></td>
        <td><div class="qty-breakdown">${qtyPills}</div></td>
        <td><strong style="color: var(--success-color); font-size: 0.95rem;">${actSum}</strong></td>
        <td>
          <div style="font-weight: 700; color: #38bdf8;">${pct}%</div>
          <div class="mini-bar-bg" style="width: 60px; margin-top: 2px;">
            <div class="mini-bar-fill" style="width: ${Math.min(pct, 100)}%;"></div>
          </div>
        </td>
        <!-- Free-Text Scrap Note Column -->
        <td>
          ${item.scrapText ? `<span style="color: #fb923c; font-size: 0.8rem;">${item.scrapText}</span>` : `<span style="color: var(--text-muted); font-size: 0.78rem;">-</span>`}
        </td>
        <td>
          ${item.kendala ? `<div class="issue-highlight">${item.kendala}</div>` : `<span style="color: var(--text-muted); font-size: 0.78rem;">-</span>`}
        </td>
        <td>${statusBadge}</td>
      </tr>
    `;
  }).join('');
}
