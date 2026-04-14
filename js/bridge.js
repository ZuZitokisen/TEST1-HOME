window.TTBBridge = (() => {
  const frameEls = {
    treca: () => document.querySelector('#trecaScreen .tool-frame'),
    timemarker: () => document.querySelector('#timeMarkerScreen .tool-frame'),
  };
  const frames = {
    treca: () => frameEls.treca()?.contentWindow,
    timemarker: () => frameEls.timemarker()?.contentWindow,
  };

  function postToTool(tool, payload){
    const win = frames[tool]?.();
    if(!win) return;
    win.postMessage({ source: 'TTB_APP', tool, ...payload }, '*');
  }

  function broadcastSettings(){
    const settings = window.TTBStorage.loadSettings();
    postToTool('treca', { type: 'TTB_SETTINGS', settings });
    postToTool('timemarker', { type: 'TTB_SETTINGS', settings });
  }

  function openSettings(tool){ window.TTBApp?.openSettings(tool); }
  function goHome(){ window.TTBRouter.go('home'); }

  function wireTreca(doc){
    if(!doc) return;
    const target = doc.querySelector('#brand35TopCard') || doc.querySelector('#brand35Top');
    if(target && !target.dataset.ttbHomeWired){
      target.dataset.ttbHomeWired = '1';
      target.style.cursor = 'pointer';
      target.addEventListener('click', () => goHome());
    }
    if(!doc.getElementById('ttbInjectedTrecaSetting')){
      const style = doc.createElement('style');
      style.textContent = `
        #ttbInjectedTrecaSetting{position:fixed;top:calc(env(safe-area-inset-top) + 12px);right:calc(env(safe-area-inset-right) + 12px);z-index:9999;width:44px;height:44px;border:none;border-radius:14px;background:rgba(255,255,255,.92);border:1px solid rgba(255,255,255,.96);box-shadow:0 6px 18px rgba(15,23,42,.10);display:flex;align-items:center;justify-content:center;padding:0;cursor:pointer}
        #ttbInjectedTrecaSetting img{width:20px;height:20px;object-fit:contain;display:block}
      `;
      doc.head.appendChild(style);
      const btn = doc.createElement('button');
      btn.id = 'ttbInjectedTrecaSetting';
      btn.type = 'button';
      btn.setAttribute('aria-label','44SETTING');
      btn.innerHTML = '<img src="../assets/icons/icon 0405-44-SETTING.png" alt="44SETTING">';
      btn.addEventListener('click', () => openSettings('treca'));
      doc.body.appendChild(btn);
    }
  }

  function ensureTimeMarkerButtons(doc){
    if(!doc) return;
    doc.querySelectorAll('.header-brand').forEach(el => {
      if(el.dataset.ttbHomeWired) return;
      el.dataset.ttbHomeWired = '1';
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => goHome());
    });
    ['calendarResetSlot','listResetSlot','registerResetSlot'].forEach(id => {
      const slot = doc.getElementById(id);
      if(!slot || slot.querySelector('.ttb-setting-btn-injected')) return;
      const btn = doc.createElement('button');
      btn.type = 'button';
      btn.className = 'topbar-reset-btn ttb-setting-btn-injected';
      btn.setAttribute('aria-label','44SETTING');
      btn.innerHTML = '<img src="../assets/icons/icon 0405-44-SETTING.png" alt="44SETTING">';
      btn.addEventListener('click', () => openSettings('timemarker'));
      slot.insertBefore(btn, slot.firstChild);
    });
  }

  function setupToolDom(tool){
    const frame = frameEls[tool]?.();
    const doc = frame?.contentDocument;
    if(!doc) return;
    if(tool === 'treca') wireTreca(doc);
    if(tool === 'timemarker') ensureTimeMarkerButtons(doc);
  }

  function handleToolMessage(data){
    if(!data || data.source !== 'TTB_TOOL') return;
    if(data.type === 'TTB_TOOL_READY') {
      postToTool(data.tool, { type: 'TTB_SETTINGS', settings: window.TTBStorage.loadSettings() });
      setupToolDom(data.tool);
      return;
    }
    if(data.type === 'TTB_SHOW_TOAST') {
      window.TTBUI.showToast(data.message || '');
      return;
    }
    if(data.type === 'TTB_OPEN_PERMISSION') {
      window.TTBUI.showPermissionModal({
        title: data.title || '権限が必要です',
        message: data.message || '',
        onOpenSettings: window.TTBPermissions.openAppSettings
      });
      return;
    }
    if(data.type === 'TTB_OPEN_SETTINGS') {
      openSettings(data.tool);
      return;
    }
    if(data.type === 'TTB_GO_HOME') {
      goHome();
      return;
    }
    if(data.type === 'TTB_RESET_DONE') {
      window.TTBRouter.go('home');
      window.TTBUI.showToast(data.message || '初期化しました。');
      return;
    }
  }

  window.addEventListener('message', (event) => handleToolMessage(event.data));
  window.addEventListener('DOMContentLoaded', () => {
    Object.keys(frameEls).forEach(tool => {
      const frame = frameEls[tool]?.();
      frame?.addEventListener('load', () => {
        broadcastSettings();
        setTimeout(() => setupToolDom(tool), 120);
        setTimeout(() => setupToolDom(tool), 600);
      });
    });
  });

  return { postToTool, broadcastSettings, setupToolDom };
})();