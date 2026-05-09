let deferredPrompt;
const showInstallBanner = () => {
  const banner = document.getElementById('install-banner');
  if (!banner) return;
  banner.style.display = 'flex';
};

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallBanner();
  // enable persistent install button when prompt is available
  const actionBtn = document.getElementById('install-action-btn');
  if (actionBtn) actionBtn.style.display = 'flex';
});

window.addEventListener('load', () => {
  const installBtn = document.getElementById('install-btn');
  const dismissBtn = document.getElementById('install-dismiss');
  const actionBtn = document.getElementById('install-action-btn');
  const manual = document.getElementById('manual-install');
  const manualClose = document.getElementById('manual-close');
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      deferredPrompt = null;
      document.getElementById('install-banner').style.display = 'none';
    });
  }
  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      const banner = document.getElementById('install-banner');
      if (banner) banner.style.display = 'none';
    });
  }
  // persistent action button behaviour
  if (actionBtn) {
    // show disabled state until beforeinstallprompt fires
    actionBtn.style.display = 'none';
    actionBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
        if (manual) manual.style.display = 'none';
        const banner = document.getElementById('install-banner');
        if (banner) banner.style.display = 'none';
      } else {
        // show manual instructions if browser won't prompt
        if (manual) manual.style.display = 'block';
      }
    });
  }
  if (manualClose) {
    manualClose.addEventListener('click', () => {
      if (manual) manual.style.display = 'none';
    });
  }
});
