
window.TTBUI = (() => {
  const toastEl = () => document.getElementById('toast');
  const loadingEl = () => document.getElementById('loadingOverlay');
  let toastTimer;

  function showToast(message, timeout = 2200){
    const el = toastEl();
    el.textContent = message;
    el.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add('hidden'), timeout);
  }
  function setLoading(active, text = '出力中…'){
    const el = loadingEl();
    el.querySelector('.loading-box').textContent = text;
    el.classList.toggle('hidden', !active);
  }
  function animateTap(target, cb){
    target.classList.add('tap-animate');
    setTimeout(() => {
      target.classList.remove('tap-animate');
      cb?.();
    }, 220);
  }
  function showPermissionModal({ title, message, onOpenSettings }){
    const modal = document.getElementById('permissionModal');
    document.getElementById('permissionTitle').textContent = title;
    document.getElementById('permissionMessage').textContent = message;
    modal.classList.remove('hidden');
    const cancel = document.getElementById('permissionCancelBtn');
    const open = document.getElementById('permissionOpenSettingsBtn');
    cancel.onclick = () => modal.classList.add('hidden');
    open.onclick = () => {
      modal.classList.add('hidden');
      onOpenSettings?.();
    };
  }
  return { showToast, setLoading, animateTap, showPermissionModal };
})();
