/**
 * ADMIN.JS - Admin Plan Input & Token Manager (Fitur 1 & Fitur 4)
 */

class AdminController {
  constructor() {
    this.planForm = null;
    this.planTableBody = null;
    this.tokenTableBody = null;
  }

  init() {
    this.planForm = document.getElementById('adminPlanForm');
    this.planTableBody = document.getElementById('adminPlanTableBody');
    this.tokenTableBody = document.getElementById('adminTokenTableBody');

    if (this.planForm) {
      this.planForm.addEventListener('submit', (e) => this.handleSavePlan(e));
    }

    const tokenForm = document.getElementById('adminTokenForm');
    if (tokenForm) {
      tokenForm.addEventListener('submit', (e) => this.handleSaveToken(e));
    }

    // Set default date to today
    const dateInput = document.getElementById('planTanggalProduksi');
    if (dateInput) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }

    this.render();
  }

  async render() {
    await this.renderPlanTable();
    this.renderTokenTable();
  }

  async handleSavePlan(e) {
    e.preventDefault();

    const planData = {
      tanggalProduksi: document.getElementById('planTanggalProduksi').value,
      shift: document.getElementById('planShift').value,
      namaOperator: document.getElementById('planNamaOperator').value.trim(),
      bagian: document.getElementById('planBagian').value,
      nomorMesin: document.getElementById('planNomorMesin').value.trim(),
      tipeLensa: document.getElementById('planTipeLensa').value.trim(),
      planQty: parseInt(document.getElementById('planQty').value, 10) || 0,
      catatanTarget: document.getElementById('planCatatanTarget').value.trim()
    };

    if (!planData.namaOperator || !planData.bagian || !planData.tipeLensa || planData.planQty <= 0) {
      window.showToast("Mohon lengkapi semua field wajib!", "error");
      return;
    }

    await window.appStore.savePlan(planData);
    window.showToast(`Plan untuk ${planData.namaOperator} berhasil disimpan ke sheet "plan"!`, "success");
    
    // Auto add token if not exist
    this.autoCreateTokenForOperator(planData.namaOperator, planData.bagian);

    this.planForm.reset();
    document.getElementById('planTanggalProduksi').value = new Date().toISOString().split('T')[0];
    this.render();
  }

  autoCreateTokenForOperator(namaOperator, bagian) {
    const tokens = window.appStore.getTokens();
    const cleanName = namaOperator.toLowerCase().trim();
    const existing = tokens.find(t => t.namaOperator.toLowerCase().trim() === cleanName);
    if (!existing) {
      const namePart = cleanName.split(' ')[0].toUpperCase();
      const randomNum = Math.floor(10 + Math.random() * 90);
      const newTokenStr = `OP-${namePart}-${randomNum}`;
      window.appStore.addToken({
        token: newTokenStr,
        namaOperator: namaOperator,
        bagian: bagian
      });
    }
  }

  handleSaveToken(e) {
    e.preventDefault();
    const tokenStr = document.getElementById('tokenCode').value.trim().toUpperCase();
    const namaOp = document.getElementById('tokenNamaOperator').value.trim();
    const bagian = document.getElementById('tokenBagian').value;

    if (!tokenStr || !namaOp) {
      window.showToast("Token dan Nama Operator wajib diisi!", "error");
      return;
    }

    window.appStore.addToken({ token: tokenStr, namaOperator: namaOp, bagian: bagian });
    window.showToast(`Token URL ${tokenStr} dibuat untuk ${namaOp}`, "success");
    
    document.getElementById('adminTokenForm').reset();
    this.renderTokenTable();
  }

  async renderPlanTable() {
    if (!this.planTableBody) return;
    this.planTableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;">Memuat data plan...</td></tr>`;

    const plans = await window.appStore.fetchPlans();

    if (plans.length === 0) {
      this.planTableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; color: var(--text-muted);">Belum ada data plan di sheet "plan".</td></tr>`;
      return;
    }

    this.planTableBody.innerHTML = plans.map(p => `
      <tr>
        <td><strong>${p.tanggalProduksi || '-'}</strong></td>
        <td><span class="badge badge-info">${p.shift || '-'}</span></td>
        <td><strong>${p.namaOperator}</strong></td>
        <td>${p.bagian}</td>
        <td><code>${p.nomorMesin}</code></td>
        <td>${p.tipeLensa}</td>
        <td><strong>${p.planQty} Pcs</strong></td>
        <td><small class="text-muted">${p.catatanTarget || '-'}</small></td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="window.adminController.quickSelectOperator('${p.namaOperator}')">
            📋 Link Token
          </button>
        </td>
      </tr>
    `).join('');
  }

  renderTokenTable() {
    if (!this.tokenTableBody) return;
    const tokens = window.appStore.getTokens();

    const baseUrl = window.location.origin + window.location.pathname;

    this.tokenTableBody.innerHTML = tokens.map(t => {
      const fullUrl = `${baseUrl}?token=${t.token}`;
      return `
        <tr>
          <td><span class="token-chip">${t.token}</span></td>
          <td><strong>${t.namaOperator}</strong></td>
          <td>${t.bagian}</td>
          <td><input type="text" readonly class="form-control" value="${fullUrl}" style="font-size:0.75rem;"></td>
          <td>
            <button class="btn btn-sm btn-primary" onclick="window.adminController.copyUrl('${fullUrl}')">
              📋 Salin URL
            </button>
            <a href="${fullUrl}" target="_blank" class="btn btn-sm btn-secondary">🚀 Buka</a>
          </td>
        </tr>
      `;
    }).join('');
  }

  copyUrl(url) {
    navigator.clipboard.writeText(url).then(() => {
      window.showToast("URL Token berhasil disalin ke clipboard!", "success");
    }).catch(() => {
      window.showToast("URL: " + url, "info");
    });
  }

  quickSelectOperator(operatorName) {
    const tokens = window.appStore.getTokens();
    const tokenObj = tokens.find(t => t.namaOperator.toLowerCase().trim() === operatorName.toLowerCase().trim());
    if (tokenObj) {
      const baseUrl = window.location.origin + window.location.pathname;
      const fullUrl = `${baseUrl}?token=${tokenObj.token}`;
      this.copyUrl(fullUrl);
    } else {
      window.showToast(`Token untuk ${operatorName} belum ada. Silakan buat di form token.`, "info");
    }
  }
}

window.adminController = new AdminController();
