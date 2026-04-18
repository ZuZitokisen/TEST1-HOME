
window.TTBStorage = (() => {
  const APP_KEY = 'ttb.app.state.v1';
  const TOOL_KEYS = {
    treca: 'ttb.tool.treca.v1',
    timemarker: 'ttb.tool.timemarker.v1',
    settings: 'ttb.tool.settings.v1'
  };
  const canUseLocalStorage = (() => {
    try {
      const k = '__ttb_probe__';
      localStorage.setItem(k, '1'); localStorage.removeItem(k); return true;
    } catch { return false; }
  })();

  function loadRaw(key){
    if(!canUseLocalStorage) return null;
    const raw = localStorage.getItem(key);
    if(!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }
  function saveRaw(key, value){
    if(!canUseLocalStorage) return;
    localStorage.setItem(key, JSON.stringify(value));
  }
  function removeRaw(key){
    if(!canUseLocalStorage) return;
    localStorage.removeItem(key);
  }
  function defaultAppState(){
    return { lastToolScreen: 'home' };
  }
  function defaultSettings(){
    return {
      timeMarkerAutoSync: false,
      versions: { app: '0.1.0', treca: '2.3.5-shell', timemarker: '1.5.9-shell' }
    };
  }
  return {
    loadAppState(){ return loadRaw(APP_KEY) || defaultAppState(); },
    saveAppState(state){ saveRaw(APP_KEY, { ...defaultAppState(), ...state }); },
    loadToolState(tool){ return loadRaw(TOOL_KEYS[tool]) || {}; },
    saveToolState(tool, data){ saveRaw(TOOL_KEYS[tool], data); },
    removeToolState(tool){ removeRaw(TOOL_KEYS[tool]); },
    loadSettings(){ return { ...defaultSettings(), ...(loadRaw(TOOL_KEYS.settings) || {}) }; },
    saveSettings(data){ saveRaw(TOOL_KEYS.settings, { ...defaultSettings(), ...data }); },
    resetTool(tool){ removeRaw(TOOL_KEYS[tool]); if(tool === 'timemarker'){ try { localStorage.removeItem('ttb.calendar.sync.v1'); } catch(e){} } },
  };
})();
