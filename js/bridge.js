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

  function settingsWithStatus(){
    const settings = window.TTBStorage.loadSettings();
    return {
      ...settings,
      calendarPermissionStatus: window.TTBPermissions.getPermission('calendar'),
      photoPermissionStatus: window.TTBPermissions.getPermission('photo'),
      calendarSyncStatus: window.TTBCalendarSync?.getStatus?.() || null
    };
  }

  function broadcastSettings(){
    const settings = settingsWithStatus();
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

  async function handlePermissionRequest(data){
    const permission = data.permission;
    const tool = data.tool;
    const label = window.TTBPermissions.getLabel(permission);
    const status = await window.TTBPermissions.requestPermission(permission);
    if(status !== '許可'){
      window.TTBUI.showPermissionModal({
        title: label.title,
        message: label.message,
        onOpenSettings: window.TTBPermissions.openAppSettings
      });
    }
    postToTool(tool, { type:'TTB_PERMISSION_STATUS', permission, status });
    broadcastSettings();
  }

  async function handlePermissionSet(data){
    const permission = data.permission;
    const tool = data.tool;
    const status = data.enabled ? await window.TTBPermissions.requestPermission(permission) : await window.TTBPermissions.revokePermission(permission);
    if(status !== '許可' && data.enabled){
      const label = window.TTBPermissions.getLabel(permission);
      window.TTBUI.showPermissionModal({
        title: label.title,
        message: label.message,
        onOpenSettings: window.TTBPermissions.openAppSettings
      });
    }
    postToTool(tool, { type:'TTB_PERMISSION_STATUS', permission, status });
    broadcastSettings();
  }

  async function handleSyncRequest(data){
    const events = Array.isArray(data.events) ? data.events : [];
    try {
      const result = await window.TTBCalendarSync.syncEvents(events, { source: data.source || 'manual' });
      postToTool('timemarker', { type:'TTB_SYNC_RESULT', ...result });
      if(result.ok){
        const msg = result.source === 'auto'
          ? `${result.syncedIds.length}件を自動同期しました`
          : `${result.syncedIds.length}件を Time Marker Sync に同期しました`;
        window.TTBUI.showToast(msg);
      } else if(result.reason === 'no-syncable-events') {
        window.TTBUI.showToast('同期対象がありません。');
      }
    } catch(err){
      if(String(err?.message || '').includes('permission')){
        const label = window.TTBPermissions.getLabel('calendar');
        window.TTBUI.showPermissionModal({
          title: label.title,
          message: label.message,
          onOpenSettings: window.TTBPermissions.openAppSettings
        });
        postToTool('timemarker', { type:'TTB_SYNC_RESULT', ok:false, reason:'calendar-permission-denied', syncedIds:[], skippedIds:[] });
      } else {
        postToTool('timemarker', { type:'TTB_SYNC_RESULT', ok:false, reason:'sync-failed', syncedIds:[], skippedIds:[] });
        window.TTBUI.showToast('同期に失敗しました。');
      }
    }
    broadcastSettings();
  }

  async function handleEventDeleted(data){
    await window.TTBCalendarSync.removeEvent(data.eventId);
    postToTool('timemarker', { type:'TTB_EVENT_DELETED_RESULT', eventId:data.eventId, ok:true });
    broadcastSettings();
  }

  function handleSettingsUpdated(data){
    const current = window.TTBStorage.loadSettings();
    window.TTBStorage.saveSettings({ ...current, ...data.settings });
    broadcastSettings();
  }

  function handleToolMessage(data){
    if(!data || data.source !== 'TTB_TOOL') return;
    if(data.type === 'TTB_TOOL_READY') {
      postToTool(data.tool, { type: 'TTB_SETTINGS', settings: settingsWithStatus() });
      return;
    }
    if(data.type === 'TTB_SHOW_TOAST') {
      window.TTBUI.showToast(data.message || '');
      return;
    }
    if(data.type === 'TTB_OPEN_PERMISSION') {
      const label = data.permission ? window.TTBPermissions.getLabel(data.permission) : { title:data.title || '権限が必要です', message:data.message || '' };
      window.TTBUI.showPermissionModal({
        title: data.title || label.title,
        message: data.message || label.message,
        onOpenSettings: window.TTBPermissions.openAppSettings
      });
      return;
    }
    if(data.type === 'TTB_REQUEST_PERMISSION') { handlePermissionRequest(data); return; }
    if(data.type === 'TTB_SET_PERMISSION') { handlePermissionSet(data); return; }
    if(data.type === 'TTB_OPEN_SETTINGS') { openSettings(data.tool); return; }
    if(data.type === 'TTB_GO_HOME') { goHome(); return; }
    if(data.type === 'TTB_RESET_DONE') {
      window.TTBRouter.go('home');
      window.TTBUI.showToast(data.message || '初期化しました。');
      return;
    }
    if(data.type === 'TTB_SETTINGS_UPDATED') { handleSettingsUpdated(data); return; }
    if(data.type === 'TTB_SYNC_REQUEST') { handleSyncRequest(data); return; }
    if(data.type === 'TTB_EVENT_DELETED') { handleEventDeleted(data); return; }
  }

  window.addEventListener('message', (event) => handleToolMessage(event.data));
  window.addEventListener('DOMContentLoaded', () => {
    Object.keys(frameEls).forEach(tool => {
      const frame = frameEls[tool]?.();
      frame?.addEventListener('load', () => {
        setTimeout(() => broadcastSettings(), 80);
      });
    });
  });

  return { postToTool, broadcastSettings };
})();
