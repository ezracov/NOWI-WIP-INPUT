/**
 * APP.JS - Main Application Launcher & Router
 */

document.addEventListener('DOMContentLoaded', () => {
  window.app = new MainApp();
  window.app.init();
});

class MainApp {
  constructor() {
    this.activeRole = 'operator'; // 'operator', 'observer', 'admin'
    this.currentToken = null;
    this.activeOperator = null;
  }

  async init() {
    this.parseUrlParameters();
    this.bindGlobalEvents();
    this.initSettingsModal();
    this.updateOnlineBadge();

    // Initialize Active View
    this.switchRole(this.activeRole);
  }

  parseUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    const roleParam = urlParams.get('role');

    if (tokenParam) {
      this.currentToken = tokenParam;
      const op = window.appStore.getOperatorByToken(tokenParam);
      if (op) {
        this.activeOperator = op;
        this.activeRole = 'operator';
      } else {
        // Fallback default operator if token not found
        this.activeOperator = {
          token: tokenParam,
          namaOperator: `Operator (${tokenParam})`,
          bagian: 'Production'
        };
        this.activeRole = 'operator';
      }
    } else if (roleParam) {
      this.activeRole = roleParam.toLowerCase();
    } else {
      // Default fallback: load first token operator
      const tokens = window.appStore.getTokens();
      if (tokens.length > 0) {
        this.activeOperator = tokens[0];
        this.currentToken = tokens[0].token;
      }
    }
  }

  bindGlobalEvents() {
    // Role Navigation Buttons
    const navBtns = document.querySelectorAll('.nav-btn[data-role]');
    navBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const role = e.currentTarget.getAttribute('data-role');
        this.switchRole(role);
      });
    });

    // Theme Switcher
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => this.toggleTheme());
    }

    // Settings Modal Trigger
    const settingsBtn = document.getElementById('settingsModalBtn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.openSettingsModal());
    }
  }

  switchRole(role) {
    this.activeRole = role;

    // Update Nav Buttons State
    document.querySelectorAll('.nav-btn[data-role]').forEach(btn => {
      if (btn.getAttribute('data-role') === role) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Toggle Section Views
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });

    const targetSec = document.getElementById(`view-${role}`);
    if (targetSec) {
      targetSec.classList.add('active');
    }

    // Trigger Role Controllers
    if (role === 'operator') {
      window.operatorController.init(this.activeOperator);
    } else if (role === 'observer') {
      window.observerController.init();
    } else if (role === 'admin') {
      window.adminController.init();
    }
  }

  toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
  }

  initSettingsModal() {
    const saveBtn = document.getElementById('saveSettingsBtn');
    const inputUrl = document.getElementById('googleSheetsUrlInput');
    const closeBtn = document.getElementById('closeSettingsModalBtn');

    if (inputUrl) {
      inputUrl.value = window.appStore.getApiUrl();
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const url = inputUrl.value.trim();
        window.appStore.setApiUrl(url);
        window.showToast("URL Google Sheets Web App berhasil disimpan!", "success");
        this.closeSettingsModal();
        this.updateOnlineBadge();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeSettingsModal());
    }
  }

  openSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.add('active');
  }

  closeSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.remove('active');
  }

  updateOnlineBadge() {
    const badge = document.getElementById('dbSyncStatusBadge');
    if (!badge) return;
    const url = window.appStore.getApiUrl();
    if (url) {
      badge.className = "badge badge-produksi";
      badge.innerHTML = "⚡ Google Sheets Live";
    } else {
      badge.className = "badge badge-repair";
      badge.innerHTML = "💾 Local Mode (Pengujian)";
    }
  }
}

// Global Toast System
window.showToast = function(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';

  toast.innerHTML = `<span>${icon}</span> <div>${message}</div>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};
