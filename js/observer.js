/**
 * OBSERVER.JS - Observer PC Dashboard Controller (Fitur 5 & Fitur 6)
 */

class ObserverController {
  constructor() {
    this.selectedBagian = 'ALL'; // 'ALL' or specific section like 'Coating', 'Polishing', etc.
    this.allAchievements = [];
    this.allPlans = [];
    this.availableBagianList = ['Coating', 'Polishing', 'Grinding', 'Edging', 'Final QC'];
  }

  async init() {
    this.bindEvents();
    await this.refreshData();
  }

  bindEvents() {
    const btnRefresh = document.getElementById('btnRefreshObserver');
    if (btnRefresh) {
      btnRefresh.addEventListener('click', () => this.refreshData());
    }

    const searchInput = document.getElementById('observerSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.renderDetailedLogsTable());
    }
  }

  async refreshData() {
    window.showToast("Memuat data summary Observer...", "info");
    this.allPlans = await window.appStore.fetchPlans();
    this.allAchievements = await window.appStore.fetchAchievements();

    // Extract dynamic Bagian list if available
    const setBagian = new Set(this.availableBagianList);
    this.allPlans.forEach(p => { if (p.bagian) setBagian.add(p.bagian); });
    this.allAchievements.forEach(a => { if (a.bagian) setBagian.add(a.bagian); });
    this.availableBagianList = Array.from(setBagian);

    this.renderBagianFilterPills();
    this.renderKpiCards();
    this.renderSummaryMatrixTable();
    this.renderDetailedLogsTable();
  }

  renderBagianFilterPills() {
    const container = document.getElementById('bagianFilterPills');
    if (!container) return;

    let html = `
      <div class="bagian-pill ${this.selectedBagian === 'ALL' ? 'active' : ''}" 
           onclick="window.observerController.setFilterBagian('ALL')">
        🌟 Semua Bagian
      </div>
    `;

    this.availableBagianList.forEach(bagian => {
      const isActive = this.selectedBagian === bagian;
      html += `
        <div class="bagian-pill ${isActive ? 'active' : ''}" 
             onclick="window.observerController.setFilterBagian('${bagian}')">
          ${bagian}
        </div>
      `;
    });

    container.innerHTML = html;
  }

  setFilterBagian(bagian) {
    this.selectedBagian = bagian;
    this.renderBagianFilterPills();
    this.renderKpiCards();
    this.renderSummaryMatrixTable();
    this.renderDetailedLogsTable();
  }

  getFilteredAchievements() {
    if (this.selectedBagian === 'ALL') {
      return this.allAchievements;
    }
    return this.allAchievements.filter(a => a.bagian === this.selectedBagian);
  }

  getFilteredPlans() {
    if (this.selectedBagian === 'ALL') {
      return this.allPlans;
    }
    return this.allPlans.filter(p => p.bagian === this.selectedBagian);
  }

  renderKpiCards() {
    const plans = this.getFilteredPlans();
    const achievements = this.getFilteredAchievements();

    const totalPlanQty = plans.reduce((acc, p) => acc + (Number(p.planQty) || 0), 0);
    const totalActualQty = achievements.reduce((acc, a) => acc + (Number(a.actualQty) || 0), 0);

    const overallPct = totalPlanQty > 0 ? ((totalActualQty / totalPlanQty) * 100).toFixed(1) : '0.0';

    let scrapCount = 0;
    achievements.forEach(a => {
      if (a.catatanScrap && a.catatanScrap !== '0' && a.catatanScrap !== '-') scrapCount++;
    });

    let rwkCount = achievements.filter(a => a.kondisi === 'RWK').length;
    let repairCount = achievements.filter(a => a.kondisi === 'REPAIR').length;
    let produksiCount = achievements.filter(a => a.kondisi === 'PRODUKSI').length;

    // Update DOM
    const kpiTotalTarget = document.getElementById('kpiTotalTarget');
    const kpiTotalActual = document.getElementById('kpiTotalActual');
    const kpiAchievementRate = document.getElementById('kpiAchievementRate');
    const kpiScrapAlerts = document.getElementById('kpiScrapAlerts');

    if (kpiTotalTarget) kpiTotalTarget.textContent = `${totalPlanQty.toLocaleString('id-ID')} Pcs`;
    if (kpiTotalActual) kpiTotalActual.textContent = `${totalActualQty.toLocaleString('id-ID')} Pcs`;
    if (kpiAchievementRate) kpiAchievementRate.textContent = `${overallPct}%`;
    if (kpiScrapAlerts) kpiScrapAlerts.textContent = `${produksiCount} Prod | ${repairCount} Rep | ${rwkCount} RWK`;
  }

  renderSummaryMatrixTable() {
    const tableBody = document.getElementById('observerSummaryTableBody');
    if (!tableBody) return;

    const achievements = this.getFilteredAchievements();
    const plans = this.getFilteredPlans();

    // Grouping by [Bagian, Tipe Lensa]
    const matrix = {};

    // 1. Seed matrix from Plans
    plans.forEach(p => {
      const key = `${p.bagian}||${p.tipeLensa}`;
      if (!matrix[key]) {
        matrix[key] = {
          bagian: p.bagian,
          tipeLensa: p.tipeLensa,
          planQty: 0,
          actualQty: 0,
          produksiCount: 0,
          repairCount: 0,
          rwkCount: 0,
          entriesCount: 0
        };
      }
      matrix[key].planQty += (Number(p.planQty) || 0);
    });

    // 2. Accumulate achievements
    achievements.forEach(a => {
      const key = `${a.bagian}||${a.tipeLensa}`;
      if (!matrix[key]) {
        matrix[key] = {
          bagian: a.bagian,
          tipeLensa: a.tipeLensa,
          planQty: Number(a.planQty) || 0,
          actualQty: 0,
          produksiCount: 0,
          repairCount: 0,
          rwkCount: 0,
          entriesCount: 0
        };
      }
      matrix[key].actualQty += (Number(a.actualQty) || 0);
      matrix[key].entriesCount += 1;

      if (a.kondisi === 'PRODUKSI') matrix[key].produksiCount++;
      else if (a.kondisi === 'REPAIR') matrix[key].repairCount++;
      else if (a.kondisi === 'RWK') matrix[key].rwkCount++;
      else matrix[key].produksiCount++;
    });

    const rows = Object.values(matrix);

    if (rows.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:24px; color:var(--text-muted);">
            Tidak ada data ketercapaian untuk Bagian "${this.selectedBagian}".
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = rows.map(r => {
      const pctVal = r.planQty > 0 ? ((r.actualQty / r.planQty) * 100) : 0;
      const pctFormatted = pctVal.toFixed(1);

      let fillClass = 'fill-high';
      if (pctVal < 75) fillClass = 'fill-low';
      else if (pctVal < 95) fillClass = 'fill-medium';

      return `
        <tr>
          <td><strong style="color:var(--text-primary);">${r.bagian}</strong></td>
          <td><strong style="color:var(--accent-blue);">${r.tipeLensa}</strong></td>
          <td><strong>${r.planQty.toLocaleString('id-ID')} Pcs</strong></td>
          <td><strong style="color:var(--accent-teal);">${r.actualQty.toLocaleString('id-ID')} Pcs</strong></td>
          <td>
            <div class="progress-container">
              <div class="progress-bar-bg">
                <div class="progress-bar-fill ${fillClass}" style="width: ${Math.min(pctVal, 100)}%;"></div>
              </div>
              <span class="progress-text">${pctFormatted}%</span>
            </div>
          </td>
          <td>
            <div class="condition-breakdown">
              <span class="cond-chip badge-produksi">${r.produksiCount} Prod</span>
              <span class="cond-chip badge-repair">${r.repairCount} Rep</span>
              <span class="cond-chip badge-rwk">${r.rwkCount} RWK</span>
            </div>
          </td>
          <td>
            ${pctVal >= 100 
              ? '<span class="badge badge-produksi">✓ Tuntas Target</span>' 
              : pctVal >= 80 
                ? '<span class="badge badge-repair">⏳ On Progress</span>' 
                : '<span class="badge badge-rwk">⚠️ Di Bawah Target</span>'}
          </td>
        </tr>
      `;
    }).join('');
  }

  renderDetailedLogsTable() {
    const tableBody = document.getElementById('observerLogsTableBody');
    if (!tableBody) return;

    let achievements = this.getFilteredAchievements();

    const searchInput = document.getElementById('observerSearchInput');
    if (searchInput && searchInput.value.trim()) {
      const q = searchInput.value.toLowerCase().trim();
      achievements = achievements.filter(a => 
        a.namaOperator.toLowerCase().includes(q) ||
        a.bagian.toLowerCase().includes(q) ||
        a.tipeLensa.toLowerCase().includes(q) ||
        a.nomorMesin.toLowerCase().includes(q) ||
        (a.kondisi && a.kondisi.toLowerCase().includes(q))
      );
    }

    if (achievements.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align:center; padding:20px; color:var(--text-muted);">
            Tidak ada riwayat input achievement yang cocok.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = achievements.map(a => {
      let badgeClass = 'badge-produksi';
      if (a.kondisi === 'REPAIR') badgeClass = 'badge-repair';
      if (a.kondisi === 'RWK') badgeClass = 'badge-rwk';

      const timeStr = a.timestamp ? new Date(a.timestamp).toLocaleString('id-ID') : '-';

      return `
        <tr>
          <td><small class="text-muted">${timeStr}</small></td>
          <td><strong>${a.namaOperator}</strong></td>
          <td>${a.bagian}</td>
          <td><span class="badge ${badgeClass}">${a.kondisi || 'PRODUKSI'}</span></td>
          <td><code>${a.nomorMesin}</code></td>
          <td>${a.tipeLensa}</td>
          <td>${a.planQty} Pcs</td>
          <td><strong style="color:var(--accent-teal);">${a.actualQty} Pcs</strong></td>
          <td><small>${a.catatanScrap || '-'}</small></td>
          <td><small class="text-muted">${a.catatanKendala || '-'}</small></td>
        </tr>
      `;
    }).join('');
  }
}

window.observerController = new ObserverController();
