window.TTBBridge = (() => {
  const frames = {
    treca: () => document.querySelector('#trecaScreen .tool-frame')?.contentWindow,
    timemarker: () => document.querySelector('#timeMarkerScreen .tool-frame')?.contentWindow,
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

  function handleToolMessage(data){
    if(!data || data.source !== 'TTB_TOOL') return;
    if(data.type === 'TTB_TOOL_READY') {
      postToTool(data.tool, { type: 'TTB_SETTINGS', settings: window.TTBStorage.loadSettings() });
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
    if(data.type === 'TTB_RESET_DONE') {
      window.TTBRouter.go('home');
      window.TTBUI.showToast(data.message || '初期化しました。');
      return;
    }
  }

  window.addEventListener('message', (event) => handleToolMessage(event.data));
  window.addEventListener('DOMContentLoaded', () => {
    const t = document.querySelector('#trecaScreen .tool-frame');
    const m = document.querySelector('#timeMarkerScreen .tool-frame');
    [t, m].forEach(frame => frame?.addEventListener('load', broadcastSettings));
  });

  return { postToTool, broadcastSettings };
})();
