
window.TTBShare = (() => {
  function beginTrecaExportDemo(){
    window.TTBUI.setLoading(true, '高解像度で出力中…');
    setTimeout(() => {
      window.TTBUI.setLoading(false);
      window.TTBUI.showToast('高解像度出力の接続先はアプリ実装時に反映します。');
    }, 1200);
  }
  return { beginTrecaExportDemo };
})();
