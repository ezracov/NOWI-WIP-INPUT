/**
 * STORE.JS - Central Data Store & Synchronization Manager
 * Supports: Google Sheets Web App API + LocalStorage Mock System
 */

const STORAGE_KEYS = {
  API_URL: 'opt_app_google_sheets_url',
  PLANS: 'opt_app_plans',
  ACHIEVEMENTS: 'opt_app_achievements',
  TOKENS: 'opt_app_tokens',
  ACTIVE_TOKEN: 'opt_app_active_token',
  THEME: 'opt_app_theme'
};

// Initial Seed Data (Data awal jika belum terkoneksi Google Sheets)
const SEED_DATA = {
  plans: [
    {
      id: 1,
      tanggalProduksi: "2026-07-28",
      shift: "Shift 1",
      namaOperator: "Budi Santoso",
      bagian: "Coating",
      nomorMesin: "CT-01",
      tipeLensa: "Progressif Freeform 1.67",
      planQty: 150,
      catatanTarget: "Target presisi AR coating anti-glare batch pagi"
    },
    {
      id: 2,
      tanggalProduksi: "2026-07-28",
      shift: "Shift 1",
      namaOperator: "Budi Santoso",
      bagian: "Coating",
      nomorMesin: "CT-02",
      tipeLensa: "Single Vision 1.56",
      planQty: 200,
      catatanTarget: "Batch reguler coating bening"
    },
    {
      id: 3,
      tanggalProduksi: "2026-07-28",
      shift: "Shift 1",
      namaOperator: "Ani Wijaya",
      bagian: "Polishing",
      nomorMesin: "POL-04",
      tipeLensa: "Photogromic BlueCut 1.60",
      planQty: 180,
      catatanTarget: "Perhatikan kehalusan permukaan minus tinggi"
    },
    {
      id: 4,
      tanggalProduksi: "2026-07-28",
      shift: "Shift 1",
      namaOperator: "Citra Lestari",
      bagian: "Grinding",
      nomorMesin: "GRD-02",
      tipeLensa: "Bifokal Flattop 1.50",
      planQty: 120,
      catatanTarget: "Penggosokan lensa bifokal segmen bawah"
    },
    {
      id: 5,
      tanggalProduksi: "2026-07-28",
      shift: "Shift 2",
      namaOperator: "Dedi Kurniawan",
      bagian: "Edging",
      nomorMesin: "EDG-01",
      tipeLensa: "High Index 1.74",
      planQty: 100,
      catatanTarget: "Pemotongan bevel khusus frame metal"
    }
  ],
  achievements: [
    {
      id: 1,
      timestamp: "2026-07-28T09:30:00",
      namaOperator: "Budi Santoso",
      bagian: "Coating",
      kondisi: "PRODUKSI",
      nomorMesin: "CT-01",
      tipeLensa: "Progressif Freeform 1.67",
      planQty: 150,
      siklus: "Siklus 1 (Pagi)",
      actualQty: 145,
      catatanScrap: "5 pcs bintik debu chamber",
      catatanKendala: "Vakum butuh waktu ekstra 5 menit"
    },
    {
      id: 2,
      timestamp: "2026-07-28T11:15:00",
      namaOperator: "Ani Wijaya",
      bagian: "Polishing",
      kondisi: "PRODUKSI",
      nomorMesin: "POL-04",
      tipeLensa: "Photogromic BlueCut 1.60",
      planQty: 180,
      siklus: "Siklus 1 (Pagi)",
      actualQty: 180,
      catatanScrap: "0",
      catatanKendala: "Lancar tanpa kendala"
    },
    {
      id: 3,
      timestamp: "2026-07-28T13:45:00",
      namaOperator: "Budi Santoso",
      bagian: "Coating",
      kondisi: "REPAIR",
      nomorMesin: "CT-02",
      tipeLensa: "Single Vision 1.56",
      planQty: 200,
      siklus: "Siklus 2 (Siang)",
      actualQty: 190,
      catatanScrap: "10 pcs coating terkelupas",
      catatanKendala: "Pembersihan ulang sebelum re-coat"
    },
    {
      id: 4,
      timestamp: "2026-07-28T14:20:00",
      namaOperator: "Citra Lestari",
      bagian: "Grinding",
      kondisi: "RWK",
      nomorMesin: "GRD-02",
      tipeLensa: "Bifokal Flattop 1.50",
      planQty: 120,
      siklus: "Siklus 1 (Pagi)",
      actualQty: 110,
      catatanScrap: "10 pcs tergores pad penggosok",
      catatanKendala: "Penggantian lapis penggosok haus"
    }
  ],
  tokens: [
    { token: "OP-BUDI-01", namaOperator: "Budi Santoso", bagian: "Coating" },
    { token: "OP-ANI-02", namaOperator: "Ani Wijaya", bagian: "Polishing" },
    { token: "OP-CITRA-03", namaOperator: "Citra Lestari", bagian: "Grinding" },
    { token: "OP-DEDI-04", namaOperator: "Dedi Kurniawan", bagian: "Edging" }
  ]
};

class DataStore {
  constructor() {
    this.apiUrl = localStorage.getItem(STORAGE_KEYS.API_URL) || "";
    this.isOnline = false;
    this.initLocalData();
  }

  initLocalData() {
    if (!localStorage.getItem(STORAGE_KEYS.PLANS)) {
      localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(SEED_DATA.plans));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS)) {
      localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(SEED_DATA.achievements));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TOKENS)) {
      localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(SEED_DATA.tokens));
    }
  }

  setApiUrl(url) {
    this.apiUrl = url.trim();
    localStorage.setItem(STORAGE_KEYS.API_URL, this.apiUrl);
  }

  getApiUrl() {
    return this.apiUrl;
  }

  // --- TOKENS MANAGEMENT ---
  getTokens() {
    const data = localStorage.getItem(STORAGE_KEYS.TOKENS);
    return data ? JSON.parse(data) : SEED_DATA.tokens;
  }

  getOperatorByToken(tokenStr) {
    if (!tokenStr) return null;
    const tokens = this.getTokens();
    return tokens.find(t => t.token.toLowerCase() === tokenStr.toLowerCase().trim()) || null;
  }

  addToken(tokenObj) {
    const tokens = this.getTokens();
    tokens.push(tokenObj);
    localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens));
  }

  // --- PLANS (FITUR 1 & FITUR 2) ---
  async fetchPlans() {
    if (this.apiUrl) {
      try {
        const response = await fetch(`${this.apiUrl}?action=getPlan`);
        if (response.ok) {
          const resJson = await response.json();
          if (resJson.status === "success" && Array.isArray(resJson.data)) {
            this.isOnline = true;
            localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(resJson.data));
            return resJson.data;
          }
        }
      } catch (err) {
        console.warn("Gagal terhubung ke Google Sheets, menggunakan data lokal", err);
        this.isOnline = false;
      }
    }
    // Local fallback
    const data = localStorage.getItem(STORAGE_KEYS.PLANS);
    return data ? JSON.parse(data) : [];
  }

  async fetchPlansForOperator(operatorName) {
    const allPlans = await this.fetchPlans();
    if (!operatorName) return allPlans;
    const cleanName = operatorName.toLowerCase().trim();
    return allPlans.filter(p => p.namaOperator.toLowerCase().trim() === cleanName);
  }

  async savePlan(planData) {
    // Format: Tanggal Produksi, Shift, Nama Operator, Bagian, Nomor Mesin, Tipe Lensa, Plan Qty, catatan target
    const plans = JSON.parse(localStorage.getItem(STORAGE_KEYS.PLANS) || "[]");
    const newId = plans.length > 0 ? Math.max(...plans.map(p => p.id || 0)) + 1 : 1;
    const newPlan = { id: newId, ...planData };
    plans.push(newPlan);
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(plans));

    // Kirim ke Google Sheets jika URL API diatur
    if (this.apiUrl) {
      try {
        await fetch(this.apiUrl, {
          method: 'POST',
          mode: 'no-cors', // Google Apps Script Web App requirement
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'addPlan', ...planData })
        });
      } catch (e) {
        console.error("Gagal sinkronisasi plan ke Google Sheets", e);
      }
    }
    return newPlan;
  }

  // --- ACHIEVEMENTS (FITUR 2 & FITUR 3 & FITUR 5) ---
  async fetchAchievements() {
    if (this.apiUrl) {
      try {
        const response = await fetch(`${this.apiUrl}?action=getAchievement`);
        if (response.ok) {
          const resJson = await response.json();
          if (resJson.status === "success" && Array.isArray(resJson.data)) {
            this.isOnline = true;
            localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(resJson.data));
            return resJson.data;
          }
        }
      } catch (err) {
        console.warn("Gagal terhubung ke Google Sheets untuk achievements, menggunakan data lokal", err);
        this.isOnline = false;
      }
    }
    // Local fallback
    const data = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
    return data ? JSON.parse(data) : [];
  }

  async saveAchievement(achievementData) {
    // Format: [Timestamp, Nama Operator, Bagian, Kondisi, Nomor Mesin, Tipe Lensa, Plan Qty, Siklus, Actual Qty, Catatan Scrap, catatan kendala]
    const achievements = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS) || "[]");
    const newId = achievements.length > 0 ? Math.max(...achievements.map(a => a.id || 0)) + 1 : 1;
    const fullEntry = {
      id: newId,
      timestamp: new Date().toISOString(),
      ...achievementData
    };

    achievements.unshift(fullEntry);
    localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));

    // Async sync to Google Sheets
    if (this.apiUrl) {
      try {
        await fetch(this.apiUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'addAchievement', ...fullEntry })
        });
      } catch (err) {
        console.error("Gagal sync achievement ke Google Sheets", err);
      }
    }

    return fullEntry;
  }
}

// Global Store Instance
window.appStore = new DataStore();
