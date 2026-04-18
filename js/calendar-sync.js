window.TTBCalendarSync = (() => {
  const KEY = 'ttb.calendar.sync.v1';
  const CALENDAR_NAME = 'Time Marker Sync';

  function loadRaw(){
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
  }
  function saveRaw(next){
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  }
  function state(){
    return {
      calendarName: CALENDAR_NAME,
      calendarCreated: false,
      mappings: {},
      ...loadRaw()
    };
  }
  function update(next){ saveRaw({ ...state(), ...next }); }
  function markSynced(eventIds){
    const current = state();
    const mappings = { ...(current.mappings || {}) };
    const stamped = new Date().toISOString();
    eventIds.forEach(id => { mappings[id] = { syncedAt: stamped, calendarName: CALENDAR_NAME }; });
    update({ calendarCreated: true, mappings });
  }
  function unmarkSynced(eventId){
    const current = state();
    const mappings = { ...(current.mappings || {}) };
    delete mappings[eventId];
    update({ mappings });
  }
  function isNativeAvailable(){
    return !!(window.Capacitor && (window.Capacitor.isNativePlatform?.() || window.Capacitor.getPlatform?.() === 'ios'));
  }
  async function ensurePermission(){
    const status = await window.TTBPermissions.requestPermission('calendar');
    if(status !== '許可') throw new Error('calendar-permission-denied');
    return status;
  }
  async function ensureCalendar(){
    const current = state();
    if(current.calendarCreated) return current.calendarName || CALENDAR_NAME;
    update({ calendarCreated: true, calendarName: CALENDAR_NAME });
    return CALENDAR_NAME;
  }
  async function syncEvents(events, { source = 'manual' } = {}){
    const syncable = (events || []).filter(ev => ev && ev.id && ev.date && ev.startTime);
    if(!syncable.length){
      return { ok:false, reason:'no-syncable-events', syncedIds:[], skippedIds:[] };
    }
    await ensurePermission();
    const calendarName = await ensureCalendar();
    if(isNativeAvailable()){
      // Native plugin wiring point.
      // For now the shared contract is ready and falls through to the same local bookkeeping.
    }
    markSynced(syncable.map(ev => ev.id));
    return {
      ok:true,
      calendarName,
      source,
      syncedIds: syncable.map(ev => ev.id),
      skippedIds: (events || []).filter(ev => !syncable.includes(ev)).map(ev => ev.id)
    };
  }
  async function removeEvent(eventId){
    if(!eventId) return { ok:false };
    unmarkSynced(eventId);
    return { ok:true, removedId:eventId };
  }
  function getStatus(){
    const current = state();
    return {
      calendarName: current.calendarName || CALENDAR_NAME,
      calendarCreated: !!current.calendarCreated,
      syncedCount: Object.keys(current.mappings || {}).length
    };
  }
  return { syncEvents, removeEvent, getStatus, CALENDAR_NAME };
})();
