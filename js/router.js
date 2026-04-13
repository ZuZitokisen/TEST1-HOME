
window.TTBRouter = (() => {
  const screens = {};
  function init(){
    document.querySelectorAll('.screen').forEach(el => screens[el.dataset.screen] = el);
  }
  function go(name){
    Object.values(screens).forEach(el => {
      const active = el.dataset.screen === name;
      el.classList.toggle('active', active);
      el.setAttribute('aria-hidden', String(!active));
    });
    window.TTBStorage.saveAppState({ lastToolScreen: name });
  }
  return { init, go };
})();
