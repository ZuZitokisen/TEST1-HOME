(function(){
  const settingsBody = document.getElementById('settingsBody');
  const settingsModal = document.getElementById('settingsModal');
  const settingsTitle = document.getElementById('settingsTitle');
  let currentTool = null;

  function buildSettings(tool){
    const settings = window.TTBStorage.loadSettings();
    const isTimeMarker = tool === 'timemarker';
    const isTreca = tool === 'treca';
    settingsTitle.textContent = isTreca ? 'Tokimeki Toreca Maker 設定' : 'Tokimeki Time Marker 設定';
    settingsBody.innerHTML = '';
    const rows = [];

    if (isTreca) {
      rows.push({
        label: '写真ライブラリ権限',
        note: '初回画像選択時に要求します。拒否時は設定アプリへ誘導します。',
        actions: [{ label: '権限案内を表示', type: 'secondary', onClick: () => window.TTBUI.showPermissionModal({
          title: '写真ライブラリの権限が必要です',
          message: '画像を選択するには写真ライブラリへのアクセスを許可してください。',
          onOpenSettings: window.TTBPermissions.openAppSettings
        }) }]
      });
      rows.push({
        label: '出力',
        note: '共有優先 / 高解像度 / 失敗時は通常解像度へフォールバック。',
        actions: [{ label: '出力デモ', type: 'primary', onClick: () => window.TTBShare.beginTrecaExportDemo() }]
      });
    }

    if (isTimeMarker) {
      rows.push({
        label: 'カレンダー権限',
        note: '初回同期時に要求します。拒否時は設定アプリへ誘導します。',
        actions: [{ label: '権限案内を表示', type: 'secondary', onClick: () => window.TTBUI.showPermissionModal({
          title: 'カレンダーの権限が必要です',
          message: '本体カレンダーへ反映するにはカレンダーアクセスを許可してください。',
          onOpenSettings: window.TTBPermissions.openAppSettings
        }) }]
      });
      rows.push({
        label: '自動同期',
        note: settings.timeMarkerAutoSync ? '現在オンです。保存時に自動同期します。' : '現在オフです。25CONECTで手動同期できます。',
        custom: (() => {
          const wrap = document.createElement('div');
          wrap.className = 'settings-actions';
          const toggle = document.createElement('button');
          toggle.className = settings.timeMarkerAutoSync ? 'primary-btn' : 'secondary-btn';
          toggle.textContent = settings.timeMarkerAutoSync ? '自動同期 オン' : '自動同期 オフ';
          toggle.onclick = () => {
            window.TTBStorage.saveSettings({ ...settings, timeMarkerAutoSync: !settings.timeMarkerAutoSync });
            window.TTBBridge?.broadcastSettings();
            buildSettings(tool);
          };
          const retry = document.createElement('button');
          retry.className = 'secondary-btn';
          retry.textContent = '再同期';
          retry.onclick = () => window.TTBUI.showToast('オフライン時は同期できません。接続後に再試行してください。');
          wrap.append(toggle, retry);
          return wrap;
        })()
      });
      rows.push({
        label: '専用カレンダー',
        note: '反映先は Time Marker Sync です。初回同期時に自動作成します。'
      });
    }

    rows.push({
      label: 'バージョン',
      note: `App ${settings.versions.app} / Treca ${settings.versions.treca} / Time Marker ${settings.versions.timemarker}`
    });

    rows.push({
      label: isTreca ? 'Tokimeki Toreca Maker 初期化' : 'Tokimeki Time Marker 初期化',
      note: '保存データと表示状態を削除します。元に戻せません。',
      actions: [{
        label: '初期化',
        type: 'danger',
        onClick: () => {
          const ok = confirm('この操作は元に戻せません。初期化しますか？');
          if (!ok) return;
          window.TTBStorage.resetTool(tool);
          window.TTBBridge?.postToTool(tool, { type: 'TTB_RESET_TOOL' });
          settingsModal.classList.add('hidden');
          setTimeout(() => {
            window.TTBRouter.go('home');
            window.TTBUI.showToast('初期化しました。');
          }, 80);
        }
      }]
    });

    rows.forEach(row => {
      const el = document.createElement('section');
      el.className = 'settings-row';
      const label = document.createElement('div');
      label.className = 'settings-label';
      label.textContent = row.label;
      el.append(label);
      if (row.note) {
        const note = document.createElement('div');
        note.className = 'settings-note';
        note.textContent = row.note;
        el.append(note);
      }
      if (row.custom) el.append(row.custom);
      if (row.actions?.length) {
        const actions = document.createElement('div');
        actions.className = 'settings-actions';
        row.actions.forEach(action => {
          const btn = document.createElement('button');
          btn.className = action.type === 'primary' ? 'primary-btn' : action.type === 'danger' ? 'danger-btn' : 'secondary-btn';
          btn.textContent = action.label;
          btn.onclick = action.onClick;
          actions.append(btn);
        });
        el.append(actions);
      }
      settingsBody.append(el);
    });
  }

  function openSettings(tool){
    currentTool = tool;
    buildSettings(tool);
    settingsModal.classList.remove('hidden');
  }
  function closeSettings(){ settingsModal.classList.add('hidden'); }
  window.TTBApp = { openSettings, closeSettings };

  window.addEventListener('DOMContentLoaded', () => {
    window.TTBRouter.init();
    window.TTBRouter.go('home');

    const homeBtn = document.getElementById('home33Button');
    const tool38 = document.getElementById('tool38Button');
    const tool40 = document.getElementById('tool40Button');
    const toolScreen = document.getElementById('toolSelectScreen');

    homeBtn.addEventListener('click', e => {
      window.TTBUI.animateTap(e.currentTarget, () => window.TTBRouter.go('tools'), 430);
    });
    tool38.addEventListener('click', e => {
      window.TTBUI.animateToolChoice(toolScreen, e.currentTarget, tool40, () => window.TTBRouter.go('treca'));
    });
    tool40.addEventListener('click', e => {
      window.TTBUI.animateToolChoice(toolScreen, e.currentTarget, tool38, () => window.TTBRouter.go('timemarker'));
    });

    document.getElementById('settingsCloseBtn').addEventListener('click', closeSettings);
  });
})();