
window.TTBPermissions = (() => {
  function openAppSettings(){
    // Stub for Capacitor App.openSettings()
    window.TTBUI.showToast('設定アプリを開く処理はアプリ実装時に接続します。');
  }
  return { openAppSettings };
})();
