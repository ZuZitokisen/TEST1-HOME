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
  function goHome(){
    const active = document.querySelector('.screen.active');
    if(window.TTBUI?.animateScreenFadeOut){
      window.TTBUI.animateScreenFadeOut(active, () => window.TTBRouter.go('home'));
    } else {
      window.TTBRouter.go('home');
    }
  }

  function setupToolDom(tool){
    // Tools now own their own 44SETTING and HOME wiring.
    // App shell only provides routing, settings modal, and shared state.
    return;
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
window.addEventListener('message', (event) => {
  const data = event.data;
  if(!data || data.source !== 'TTB_TOOL') return;
  if(data.type === 'TTB_PERMISSION_STATUS_UPDATED') {
    try {
      const settings = window.TTBStorage.loadSettings();
      if(data.permission === 'calendar') settings.calendarPermissionStatus = data.status;
      if(data.permission === 'photo') settings.photoPermissionStatus = data.status;
      window.TTBStorage.saveSettings(settings);
    } catch(e){}
  }
});
