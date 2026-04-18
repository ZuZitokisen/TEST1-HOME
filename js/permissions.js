window.TTBPermissions = (() => {
  const KEY = 'ttb.permission.state.v1';
  const LABELS = {
    calendar: {
      title: 'カレンダーの権限が必要です',
      message: '本体カレンダーへ反映するにはカレンダーアクセスを許可してください。'
    },
    photo: {
      title: '写真ライブラリの権限が必要です',
      message: '画像を選択するには写真ライブラリへのアクセスを許可してください。'
    }
  };
  function load(){
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
  }
  function save(next){
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  }
  function getPermission(type){
    const current = load();
    return current[type] || '未許可';
  }
  function setPermission(type, status){
    const current = load();
    current[type] = status;
    save(current);
    return status;
  }
  async function requestPermission(type){
    const existing = getPermission(type);
    if(existing === '許可') return existing;
    if(window.Capacitor && window.Capacitor.isNativePlatform?.()){
      // Capacitor plugin wiring point.
      // Until the native layer is attached, keep the same shared contract and mark allowed.
    }
    return setPermission(type, '許可');
  }
  async function revokePermission(type){
    return setPermission(type, '未許可');
  }
  async function checkPermission(type){
    return getPermission(type);
  }
  function getLabel(type){ return LABELS[type] || { title:'権限が必要です', message:'' }; }
  function openAppSettings(){
    if(window.Capacitor?.Plugins?.App?.openSettings){
      window.Capacitor.Plugins.App.openSettings();
      return;
    }
    window.TTBUI.showToast('設定アプリを開く処理はアプリ実装時に接続します。');
  }
  return { openAppSettings, getPermission, setPermission, requestPermission, revokePermission, checkPermission, getLabel };
})();
