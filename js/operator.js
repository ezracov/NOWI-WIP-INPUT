/**
 * OPERATOR.JS - Operator Mobile View Controller (Fitur 2, Fitur 3, Fitur 4)
 */

class OperatorController {
  constructor() {
    this.currentOperator = null;
    this.selectedPlan = null;
    this.assignedPlans = [];
    this.historyList = [];
    this.activeTab = 'input'; // 'input' or 'history'
  }

  async init(operatorObj) {
    this.currentOperator = operatorObj;
    this.renderProfile();
    this.bindEvents();
    await this.loadOperatorPlans();
    await this.loadOperatorHistory();
    this.render();
  }

  renderProfile() {
    const avatarEl = document.getElementById('opAvatar');
    const nameEl = document.getElementById('opName');
    const deptEl = document.getElementById('opDept');
    const tokenEl = document.getElementById('opTokenChip');

    if (this.currentOperator) {
      const initials = this.currentOperator.namaOperator.split(' ').map(n => n[0]).join('').substring(0, 2);
      if (avatarEl) avatarEl.textContent = initials.toUpperCase();
      if (nameEl) nameEl.textContent = this.currentOperator.namaOperator;
      if (deptEl) deptEl.textContent = `Bagian: ${this.currentOperator.bagian}`;
      if (tokenEl) tokenEl.textContent = `TOKEN: ${this.currentOperator.token}`;
    } else {
      if (nameEl) nameEl.textContent = "Operator (Guest)";
      if (deptEl) deptEl.textContent = "Silakan login via URL Token";
      if (tokenEl) tokenEl.textContent = "NO TOKEN";
    }
  }

  bindEvents() {
    const form = document.getElementById('operatorAchievementForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmitAchievement(e));
    }

    // Touch Numpad buttons
    const btnDecSiklus = document.getElementById('btnDecSiklus');
    const btnIncSiklus = document.getElementById('btnIncSiklus');
    const inputSiklus = document.getElementById('opSiklusInput');

    if (btnDecSiklus && btnIncSiklus && inputSiklus) {
      btnDecSiklus.addEventListener('click', () => {
        let val = parseInt(inputSiklus.value.replace(/\D/g, '') || 1, 10);
        if (val > 1) val--;
        inputSiklus.value = `Siklus ${val}`;
      });
      btnIncSiklus.addEventListener('click', () => {
        let val = parseInt(inputSiklus.value.replace(/\D/g, '') || 1, 10);
        val++;
        inputSiklus.value = `Siklus ${val}`;
      });
    }

    const btnDecQty = document.getElementById('btnDecQty');
    const btnIncQty = document.getElementById('btnIncQty');
    const inputQty = document.getElementById('opActualQty');

    if (btnDecQty && btnIncQty && inputQty) {
      btnDecQty.addEventListener('click', () => {
        let val = parseInt(inputQty.value || 0, 10);
        if (val > 0) inputQty.value = val - 1;
      });
      btnIncQty.addEventListener('click', () => {
        let val = parseInt(inputQty.value || 0, 10);
        inputQty.value = val + 1;
      });
    }

    // Tabs
    const tabInput = document.getElementById('tabOpInput');
    const tabHistory = document.getElementById('tabOpHistory');

    if (tabInput && tabHistory) {
      tabInput.addEventListener('click', () => this.switchTab('input'));
      tabHistory.addEventListener('click', () => this.switchTab('history'));
    }
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    const tabInputBtn = document.getElementById('tabOpInput');
    const tabHistoryBtn = document.getElementById('tabOpHistory');
    const viewInput = document.getElementById('opViewInputContainer');
    const viewHistory = document.getElementById('opViewHistoryContainer');

    if (tabName === 'input') {
      tabInputBtn.classList.add('active');
      tabHistoryBtn.classList.remove('active');
      viewInput.style.display = 'block';
      viewHistory.style.display = 'none';
    } else {
      tabHistoryBtn.classList.add('active');
      tabInputBtn.classList.remove('active');
      viewInput.style.display = 'none';
      viewHistory.style.display = 'block';
      this.renderHistory();
    }
  }

  async loadOperatorPlans() {
    if (!this.currentOperator) return;
    this.assignedPlans = await window.appStore.fetchPlansForOperator(this.currentOperator.namaOperator);
    if (this.assignedPlans.length > 0) {
      this.selectedPlan = this.assignedPlans[0];
    }
  }

  async loadOperatorHistory() {
    if (!this.currentOperator) return;
    const allAchievements = await window.appStore.fetchAchievements();
    const cleanOpName = this.currentOperator.namaOperator.toLowerCase().trim();
    this.historyList = allAchievements.filter(a => a.namaOperator.toLowerCase().trim() === cleanOpName);
  }

  render() {
    this.renderPlanSelector();
    this.renderSelectedPlanFormDetails();
  }

  renderPlanSelector() {
    const container = document.getElementById('opPlanListContainer');
    if (!container) return;

    if (this.assignedPlans.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align:center; padding:20px;">
          <p style="color:var(--text-secondary);">Belum ada penugasan (Plan) untuk nama Anda: <strong>${this.currentOperator ? this.currentOperator.namaOperator : 'Guest'}</strong>.</p>
          <small style="color:var(--text-muted);">Admin dapat memasukkan plan baru di tab Admin.</small>
        </div>
      `;
      return;
    }

    container.innerHTML = this.assignedPlans.map(plan => {
      const isSelected = this.selectedPlan && this.selectedPlan.id === plan.id;
      return `
        <div class="wo-card ${isSelected ? 'selected' : ''}" onclick="window.operatorController.selectPlan(${plan.id})">
          <div class="wo-header">
            <div>
              <div class="wo-title">${plan.tipeLensa}</div>
              <div class="wo-subtitle">Mesin: ${plan.nomorMesin} | ${plan.shift}</div>
            </div>
            <span class="badge badge-info">${plan.planQty} Pcs</span>
          </div>
          <div class="wo-specs-grid">
            <div class="wo-spec-item">
              <label>Tanggal</label>
              <span>${plan.tanggalProduksi || '-'}</span>
            </div>
            <div class="wo-spec-item">
              <label>Bagian</label>
              <span>${plan.bagian}</span>
            </div>
          </div>
          ${plan.catatanTarget ? `<small style="color:var(--accent-teal); font-style:italic;">Target Note: ${plan.catatanTarget}</small>` : ''}
        </div>
      `;
    }).join('');
  }

  selectPlan(planId) {
    this.selectedPlan = this.assignedPlans.find(p => p.id === planId);
    this.renderPlanSelector();
    this.renderSelectedPlanFormDetails();
  }

  renderSelectedPlanFormDetails() {
    const targetBadge = document.getElementById('selectedPlanQtyBadge');
    const autoQty = document.getElementById('opActualQty');

    if (this.selectedPlan) {
      if (targetBadge) targetBadge.textContent = `Target: ${this.selectedPlan.planQty} Pcs`;
      if (autoQty && !autoQty.value) {
        autoQty.value = this.selectedPlan.planQty;
      }
    }
  }

  async handleSubmitAchievement(e) {
    e.preventDefault();

    if (!this.currentOperator) {
      window.showToast("Anda belum login menggunakan Token Operator!", "error");
      return;
    }

    if (!this.selectedPlan) {
      window.showToast("Pilih salah satu Work Order / Plan terlebih dahulu!", "error");
      return;
    }

    // Capture Form Values
    const siklus = document.getElementById('opSiklusInput').value.trim() || "Siklus 1";
    const actualQty = parseInt(document.getElementById('opActualQty').value, 10) || 0;
    
    // Kondisi: PRODUKSI, REPAIR, RWK (dikirim langsung sesuai pilihan radio)
    const kondisiEls = document.getElementsByName('opKondisi');
    let kondisiVal = "PRODUKSI";
    for (const el of kondisiEls) {
      if (el.checked) {
        kondisiVal = el.value;
        break;
      }
    }

    const catatanScrap = document.getElementById('opCatatanScrap').value.trim();
    const catatanKendala = document.getElementById('opCatatanKendala').value.trim();

    // Construct achievement payload matching requirement:
    // [Timestamp, Nama Operator, Bagian, Kondisi, Nomor Mesin, Tipe Lensa, Plan Qty, Siklus, Actual Qty, Catatan Scrap, catatan kendala]
    const achievementData = {
      namaOperator: this.currentOperator.namaOperator,
      bagian: this.selectedPlan.bagian,
      kondisi: kondisiVal, // PRODUKSI, REPAIR, RWK
      nomorMesin: this.selectedPlan.nomorMesin,
      tipeLensa: this.selectedPlan.tipeLensa,
      planQty: this.selectedPlan.planQty,
      siklus: siklus,
      actualQty: actualQty,
      catatanScrap: catatanScrap,
      catatanKendala: catatanKendala
    };

    window.showToast("Menyimpan data pencapaian ke sheet achievement...", "info");
    
    await window.appStore.saveAchievement(achievementData);

    window.showToast("Data pencapaian berhasil disimpan!", "success");

    // Reset Form & Update History
    document.getElementById('opCatatanScrap').value = '';
    document.getElementById('opCatatanKendala').value = '';
    
    await this.loadOperatorHistory();
    this.switchTab('history');
  }

  renderHistory() {
    const container = document.getElementById('opHistoryListContainer');
    if (!container) return;

    if (this.historyList.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align:center; padding:20px; color: var(--text-muted);">
          Belum ada riwayat pencapaian yang diinput untuk ${this.currentOperator ? this.currentOperator.namaOperator : 'Operator'}.
        </div>
      `;
      return;
    }

    container.innerHTML = this.historyList.map(h => {
      let badgeClass = 'badge-produksi';
      if (h.kondisi === 'REPAIR') badgeClass = 'badge-repair';
      if (h.kondisi === 'RWK') badgeClass = 'badge-rwk';

      const timeStr = h.timestamp ? new Date(h.timestamp).toLocaleString('id-ID') : '-';

      return `
        <div class="history-item">
          <div class="history-header">
            <span class="history-time">🕒 ${timeStr}</span>
            <span class="badge ${badgeClass}">${h.kondisi || 'PRODUKSI'}</span>
          </div>
          <div style="font-weight:700; font-size:0.95rem; margin-bottom:4px;">${h.tipeLensa}</div>
          <div style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:8px;">
            Mesin ${h.nomorMesin} | ${h.bagian} | Target: ${h.planQty} Pcs
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(15,23,42,0.4); padding:6px 10px; border-radius:6px;">
            <span style="font-size:0.85rem; font-weight:600;">Actual Qty: <strong style="color:var(--accent-teal);">${h.actualQty} Pcs</strong></span>
            <small style="color:var(--text-muted);">${h.siklus || 'Siklus 1'}</small>
          </div>
          ${h.catatanScrap ? `<div style="font-size:0.78rem; color:var(--status-rwk-text); margin-top:6px;">🗑️ Scrap: ${h.catatanScrap}</div>` : ''}
          ${h.catatanKendala ? `<div style="font-size:0.78rem; color:var(--status-repair-text); margin-top:4px;">⚠️ Kendala: ${h.catatanKendala}</div>` : ''}
        </div>
      `;
    }).join('');
  }
}

window.operatorController = new OperatorController();
