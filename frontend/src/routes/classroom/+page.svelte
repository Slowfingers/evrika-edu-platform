<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import ClassroomStudentPanel from '$lib/components/ClassroomStudentPanel.svelte';
  import { t } from '$lib/stores/lang.js';

  // ==================== CONSTANTS ====================
  const CANVAS_W = 760;
  const CANVAS_H = 480;

  $: DESK_TYPES = {
    single:  { label: $t('desk_single'),  slots: 1, w: 64,  h: 48, color: '#6366f1' },
    double:  { label: $t('desk_double'),  slots: 2, w: 110, h: 48, color: '#8b5cf6' },
    group2:  { label: $t('desk_group2'),  slots: 2, w: 90,  h: 70, color: '#7c3aed', isGroup: true },
    group3:  { label: $t('desk_group3'),  slots: 3, w: 110, h: 70, color: '#9333ea', isGroup: true },
    group4:  { label: $t('desk_group4'),  slots: 4, w: 110, h: 86, color: '#a855f7', isGroup: true },
    group6:  { label: $t('desk_group6'),  slots: 6, w: 150, h: 86, color: '#c084fc', isGroup: true },
    teacher: { label: $t('desk_teacher'), slots: 0, w: 130, h: 48, color: '#f59e0b' },
  };

  $: STUDENT_TAGS = [
    { id: 'active',   label: $t('tag_active'),   color: '#22c55e' },
    { id: 'quiet',    label: $t('tag_quiet'),    color: '#3b82f6' },
    { id: 'conflict', label: $t('tag_conflict'), color: '#ef4444' },
    { id: 'strong',   label: $t('tag_strong'),   color: '#f59e0b' },
    { id: 'weak',     label: $t('tag_weak'),     color: '#a855f7' },
  ];

  const GROUP_COLORS = ['#6366f1','#ec4899','#22c55e','#f59e0b','#3b82f6','#ef4444','#14b8a6','#f97316'];

  $: TEMPLATES = [
    { id: 'rows',    label: $t('tmpl_rows') },
    { id: 'u-shape', label: $t('tmpl_u') },
    { id: 'islands', label: $t('tmpl_islands') },
    { id: 'circle',  label: $t('tmpl_circle') },
  ];

  // ==================== STATE ====================
  let desks = [];
  let students = [];
  let seating = {};
  let nextDeskId = 1;
  let nextStudentId = 1;

  let mode = 'edit';
  let selectedTool = 'double';
  let showSidebar = true;
  let showTemplates = false;
  let showImport = false;
  let importText = '';
  let animatingSeats = {};
  let groupSize = 2;
  let savedLayouts = [];
  let showSaveDialog = false;
  let saveLayoutName = '';
  let showHistory = false;
  let newStudentName = '';
  let selectedDeskId = null;

  // Drag state
  let draggingDesk = null;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let dragStudentId = null;
  let dragOverSlotKey = null;

  let canvasEl;
  let isMobile = false;
  let canvasScale = 1;

  // ==================== HELPERS ====================
  function getSlotPos(type, idx) {
    const map = {
      single: [{ x: 0.5, y: 0.5 }],
      double: [{ x: 0.28, y: 0.5 }, { x: 0.72, y: 0.5 }],
      group2: [{ x: 0.5, y: 0.28 }, { x: 0.5, y: 0.72 }],
      group3: [{ x: 0.25, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 0.75, y: 0.5 }],
      group4: [{ x: 0.28, y: 0.3 }, { x: 0.72, y: 0.3 }, { x: 0.28, y: 0.7 }, { x: 0.72, y: 0.7 }],
      group6: [{ x: 0.2, y: 0.3 }, { x: 0.5, y: 0.3 }, { x: 0.8, y: 0.3 }, { x: 0.2, y: 0.7 }, { x: 0.5, y: 0.7 }, { x: 0.8, y: 0.7 }],
    };
    return (map[type] || [])[idx] || null;
  }

  function sk(did, idx) { return `${did}_${idx}`; }

  function stuAtSlot(did, idx) {
    const sid = seating[sk(did, idx)];
    return sid != null ? students.find(s => s.id === sid) : null;
  }

  function unseated() {
    const s = new Set(Object.values(seating));
    return students.filter(st => !s.has(st.id) && !st.absent);
  }

  function emptySlots() {
    const r = [];
    desks.forEach(d => {
      const dt = DESK_TYPES[d.type];
      for (let i = 0; i < dt.slots; i++) { const k = sk(d.id, i); if (!seating[k]) r.push(k); }
    });
    return r;
  }

  function groupColor(sid) {
    const stu = students.find(s => s.id === sid);
    if (stu?.groupColor) return stu.groupColor;
    const i = groups.findIndex(g => g.some(s => s.id === sid));
    return i >= 0 ? GROUP_COLORS[i % GROUP_COLORS.length] : null;
  }

  function getClientPos(e) {
    if (e.touches && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    if (e.changedTouches && e.changedTouches.length > 0) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }

  // ==================== TEMPLATES ====================
  function applyTemplate(tid) {
    desks = []; seating = {}; nextDeskId = 1; selectedDeskId = null;
    if (tid === 'rows') {
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++)
        desks.push({ id: nextDeskId++, type: 'double', x: 60 + c * 220, y: 90 + r * 130, rotation: 0 });
      desks.push({ id: nextDeskId++, type: 'teacher', x: 310, y: 15, rotation: 0 });
    } else if (tid === 'u-shape') {
      for (let i = 0; i < 3; i++) {
        desks.push({ id: nextDeskId++, type: 'double', x: 20, y: 60 + i * 120, rotation: 90 });
        desks.push({ id: nextDeskId++, type: 'double', x: 630, y: 60 + i * 120, rotation: 90 });
      }
      for (let i = 0; i < 3; i++)
        desks.push({ id: nextDeskId++, type: 'double', x: 160 + i * 170, y: 400, rotation: 0 });
      desks.push({ id: nextDeskId++, type: 'teacher', x: 310, y: 15, rotation: 0 });
    } else if (tid === 'islands') {
      [[80,70],[440,70],[80,270],[440,270],[260,170]].forEach(([x,y]) =>
        desks.push({ id: nextDeskId++, type: 'group4', x, y, rotation: 0 }));
      desks.push({ id: nextDeskId++, type: 'teacher', x: 310, y: 15, rotation: 0 });
    } else if (tid === 'circle') {
      for (let i = 0; i < 8; i++) {
        const a = (2 * Math.PI * i) / 8 - Math.PI / 2;
        desks.push({ id: nextDeskId++, type: 'single',
          x: Math.round(340 + 160 * Math.cos(a)) - 32,
          y: Math.round(240 + 160 * Math.sin(a)) - 24,
          rotation: Math.round((a * 180) / Math.PI + 90) });
      }
      desks.push({ id: nextDeskId++, type: 'teacher', x: 310, y: 210, rotation: 0 });
    }
    desks = desks; showTemplates = false;
  }

  // ==================== DESK OPS ====================
  function addDesk() {
    const dt = DESK_TYPES[selectedTool]; if (!dt) return;
    const x = canvasEl ? Math.max(0, canvasEl.scrollLeft + canvasEl.clientWidth / 2 - dt.w / 2) : CANVAS_W / 2 - dt.w / 2;
    const y = canvasEl ? Math.max(0, canvasEl.scrollTop + canvasEl.clientHeight / 2 - dt.h / 2) : CANVAS_H / 2 - dt.h / 2;
    const nd = { id: nextDeskId++, type: selectedTool, x, y, rotation: 0 };
    desks = [...desks, nd];
    selectedDeskId = nd.id;
  }

  function removeDesk(id) {
    const ns = { ...seating };
    Object.keys(ns).forEach(k => { if (k.startsWith(`${id}_`)) delete ns[k]; });
    seating = ns;
    desks = desks.filter(d => d.id !== id);
    if (selectedDeskId === id) selectedDeskId = null;
  }

  function rotateDesk(id, step = 45) {
    desks = desks.map(d => d.id === id ? { ...d, rotation: ((d.rotation || 0) + step) % 360 } : d);
  }

  function duplicateDesk(id) {
    const src = desks.find(d => d.id === id); if (!src) return;
    const nd = { ...src, id: nextDeskId++, x: src.x + 30, y: src.y + 30 };
    desks = [...desks, nd];
    selectedDeskId = nd.id;
  }

  // ==================== DESK DRAGGING (mouse + touch) ====================
  let pendingDrag = null; // { desk, startX, startY } — ждем движения прежде чем начать drag

  function startDeskDrag(e, desk) {
    if (mode !== 'edit') return;
    // Если тап попал на кнопку управления — не начинаем drag
    if (e.target && e.target.closest && e.target.closest('.desk-controls')) return;

    selectedDeskId = desk.id;

    const p = getClientPos(e);

    if (e.type === 'touchstart') {
      // Не вызываем preventDefault сразу — иначе блокируем тапы по кнопкам
      // Запоминаем потенциальный drag, начнём его только при движении
      pendingDrag = { desk, startX: p.x, startY: p.y };
      window.addEventListener('touchmove', onTouchMoveMaybeStartDrag, { passive: false });
      window.addEventListener('touchend', cancelPendingDrag);
    } else {
      // Mouse — сразу начинаем drag
      e.preventDefault();
      e.stopPropagation();
      _beginDrag(desk, p);
    }
  }

  function onTouchMoveMaybeStartDrag(e) {
    if (!pendingDrag) return;
    const p = getClientPos(e);
    const dx = p.x - pendingDrag.startX;
    const dy = p.y - pendingDrag.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      // Движение подтверждено — начинаем drag
      e.preventDefault();
      window.removeEventListener('touchmove', onTouchMoveMaybeStartDrag);
      window.removeEventListener('touchend', cancelPendingDrag);
      // Передаём начальную позицию тапа (startX/startY), не текущую
      _beginDrag(pendingDrag.desk, { x: pendingDrag.startX, y: pendingDrag.startY });
      pendingDrag = null;
      moveDeskDrag(e);
    }
  }

  function cancelPendingDrag() {
    pendingDrag = null;
    window.removeEventListener('touchmove', onTouchMoveMaybeStartDrag);
    window.removeEventListener('touchend', cancelPendingDrag);
  }

  function _beginDrag(desk, p) {
    draggingDesk = desk.id;
    const rect = canvasEl.getBoundingClientRect();
    dragOffsetX = p.x - rect.left + canvasEl.scrollLeft - desk.x;
    dragOffsetY = p.y - rect.top + canvasEl.scrollTop - desk.y;
    window.addEventListener('mousemove', moveDeskDrag);
    window.addEventListener('mouseup', endDeskDrag);
    window.addEventListener('touchmove', moveDeskDrag, { passive: false });
    window.addEventListener('touchend', endDeskDrag);
  }

  function moveDeskDrag(e) {
    if (draggingDesk == null) return;
    e.preventDefault();
    const rect = canvasEl.getBoundingClientRect();
    const p = getClientPos(e);
    const s = canvasScale || 1;
    const nx = (p.x - rect.left + canvasEl.scrollLeft) / s - dragOffsetX;
    const ny = (p.y - rect.top + canvasEl.scrollTop) / s - dragOffsetY;
    desks = desks.map(d => d.id === draggingDesk ? { ...d, x: Math.max(0, Math.min(nx, CANVAS_W - DESK_TYPES[d.type].w)), y: Math.max(0, Math.min(ny, CANVAS_H - DESK_TYPES[d.type].h)) } : d);
  }

  function endDeskDrag() {
    draggingDesk = null;
    window.removeEventListener('mousemove', moveDeskDrag);
    window.removeEventListener('mouseup', endDeskDrag);
    window.removeEventListener('touchmove', moveDeskDrag);
    window.removeEventListener('touchend', endDeskDrag);
  }

  // ==================== STUDENT MANAGEMENT ====================
  function addStudent(name) {
    if (!name.trim()) return;
    students = [...students, { id: nextStudentId++, name: name.trim(), tags: [], absent: false, groupColor: null }];
  }
  function removeStudent(id) {
    const ns = { ...seating }; Object.keys(ns).forEach(k => { if (ns[k] === id) delete ns[k]; }); seating = ns;
    students = students.filter(s => s.id !== id);
  }
  function toggleTag(sid, tid) {
    students = students.map(s => s.id !== sid ? s : { ...s, tags: s.tags.includes(tid) ? s.tags.filter(t => t !== tid) : [...s.tags, tid] });
  }
  function toggleAbsent(sid) {
    students = students.map(s => s.id === sid ? { ...s, absent: !s.absent } : s);
    if (students.find(s => s.id === sid)?.absent) {
      const ns = { ...seating }; Object.keys(ns).forEach(k => { if (ns[k] === sid) delete ns[k]; }); seating = ns;
    }
  }
  function importStudents() {
    importText.split('\n').map(n => n.replace(/[",;]/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean).forEach(addStudent);
    importText = ''; showImport = false;
  }
  function handleAddStudent() { addStudent(newStudentName); newStudentName = ''; }
  function cycleColor(sid) {
    const stu = students.find(s => s.id === sid); if (!stu) return;
    const idx = GROUP_COLORS.indexOf(stu.groupColor);
    const next = idx >= 0 && idx < GROUP_COLORS.length - 1 ? GROUP_COLORS[idx + 1] : (idx === GROUP_COLORS.length - 1 ? null : GROUP_COLORS[0]);
    students = students.map(s => s.id === sid ? { ...s, groupColor: next } : s);
  }

  // ==================== STUDENT DRAG TO SLOTS ====================
  function onStudentDragStart(e, sid) { dragStudentId = sid; e.dataTransfer.effectAllowed = 'move'; }
  function onSlotDragOver(e, key) { e.preventDefault(); dragOverSlotKey = key; }
  function onSlotDragLeave() { dragOverSlotKey = null; }
  function onSlotDrop(e, did, idx) {
    e.preventDefault(); dragOverSlotKey = null;
    if (dragStudentId == null) return;
    const key = sk(did, idx);
    const existing = seating[key];
    const ns = { ...seating };
    const oldKey = Object.keys(ns).find(k => ns[k] === dragStudentId);
    if (oldKey) delete ns[oldKey];
    if (existing && existing !== dragStudentId && oldKey) ns[oldKey] = existing;
    ns[key] = dragStudentId;
    seating = ns; dragStudentId = null;
  }
  function onUnseatDrop(e) {
    e.preventDefault();
    if (dragStudentId == null) return;
    const ns = { ...seating }; Object.keys(ns).forEach(k => { if (ns[k] === dragStudentId) delete ns[k]; }); seating = ns;
    dragStudentId = null;
  }

  // Mobile: tap student then tap slot
  let mobileSelectedStudent = null;
  function mobileSelectStudent(sid) { mobileSelectedStudent = sid; }
  function mobilePlaceStudent(did, idx) {
    if (mobileSelectedStudent == null) return;
    const key = sk(did, idx);
    const ns = { ...seating };
    Object.keys(ns).forEach(k => { if (ns[k] === mobileSelectedStudent) delete ns[k]; });
    ns[key] = mobileSelectedStudent;
    seating = ns;
    mobileSelectedStudent = null;
  }

  // ==================== AUTO-SEAT ====================
  function autoSeatRandom() {
    const pool = unseated().sort(() => Math.random() - 0.5);
    const empty = emptySlots();
    const ns = { ...seating }; const anim = {};
    pool.forEach((s, i) => { if (i < empty.length) { ns[empty[i]] = s.id; anim[empty[i]] = true; } });
    animatingSeats = anim; seating = ns;
    setTimeout(() => { animatingSeats = {}; }, 700);
  }

  function autoSeatBalanced() {
    // Per-desk balanced: each desk gets a mix of strong/weak/active/quiet
    const pool = unseated();
    if (!pool.length) return;
    const strong = pool.filter(s => s.tags.includes('strong')).sort(() => Math.random() - 0.5);
    const weak = pool.filter(s => s.tags.includes('weak')).sort(() => Math.random() - 0.5);
    const active = pool.filter(s => s.tags.includes('active') && !s.tags.includes('strong') && !s.tags.includes('weak')).sort(() => Math.random() - 0.5);
    const conflict = pool.filter(s => s.tags.includes('conflict') && !s.tags.includes('strong') && !s.tags.includes('weak') && !s.tags.includes('active')).sort(() => Math.random() - 0.5);
    const rest = pool.filter(s => !strong.includes(s) && !weak.includes(s) && !active.includes(s) && !conflict.includes(s)).sort(() => Math.random() - 0.5);

    // Collect desks with their empty slot keys
    const deskSlots = [];
    desks.forEach(d => {
      const dt = DESK_TYPES[d.type];
      const slots = [];
      for (let i = 0; i < dt.slots; i++) { const k = sk(d.id, i); if (!seating[k]) slots.push(k); }
      if (slots.length > 0) deskSlots.push(slots);
    });
    if (!deskSlots.length) return;

    // Round-robin distribute categories across desks
    const ns = { ...seating }; const anim = {};
    const deskFill = deskSlots.map(() => 0);
    const buckets = [strong, weak, active, conflict, rest];
    for (const bucket of buckets) {
      for (const s of bucket) {
        // Find desk with most remaining capacity
        let best = -1, bestCap = 0;
        for (let di = 0; di < deskSlots.length; di++) {
          const cap = deskSlots[di].length - deskFill[di];
          if (cap > bestCap) { bestCap = cap; best = di; }
        }
        if (best < 0 || bestCap <= 0) break;
        const key = deskSlots[best][deskFill[best]];
        ns[key] = s.id; anim[key] = true;
        deskFill[best]++;
      }
    }
    animatingSeats = anim; seating = ns;
    setTimeout(() => { animatingSeats = {}; }, 700);
  }

  function shuffleAll() { seating = {}; setTimeout(autoSeatRandom, 50); }
  function clearSeating() { seating = {}; animatingSeats = {}; }

  // ==================== GROUPS ====================
  // groups строится реактивно из groupColor студентов — единственный источник правды
  $: groups = (() => {
    const pool = students.filter(s => !s.absent && s.groupColor);
    if (!pool.length) return [];
    const map = new Map();
    pool.forEach(s => {
      if (!map.has(s.groupColor)) map.set(s.groupColor, []);
      map.get(s.groupColor).push(s);
    });
    return [...map.values()];
  })();

  // Случайное разбиение: назначает цвета студентам → groups обновится реактивно
  function generateGroups() {
    const pool = students.filter(s => !s.absent);
    if (!pool.length) return;
    const sz = Math.max(2, groupSize);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const updated = new Map();
    for (let i = 0; i < shuffled.length; i++) {
      const color = GROUP_COLORS[Math.floor(i / sz) % GROUP_COLORS.length];
      updated.set(shuffled[i].id, color);
    }
    students = students.map(s => ({ ...s, groupColor: updated.has(s.id) ? updated.get(s.id) : s.groupColor }));
  }

  function clearGroups() {
    students = students.map(s => ({ ...s, groupColor: null }));
  }

  function seatGroupsOnDesks() {
    if (!groups.length || !desks.length) return;
    // Группируем парты: сначала isGroup, потом остальные с slots>0
    const seatable = desks.filter(d => DESK_TYPES[d.type].slots > 0);
    const sorted = [
      ...seatable.filter(d => DESK_TYPES[d.type].isGroup),
      ...seatable.filter(d => !DESK_TYPES[d.type].isGroup),
    ];
    if (!sorted.length) return;
    const ns = { ...seating };
    const anim = {};
    const usedDesks = new Set();
    for (const group of groups) {
      // Лучший стол: slots >= размер группы, минимальный остаток
      let bestDesk = null;
      let bestDiff = Infinity;
      for (const desk of sorted) {
        if (usedDesks.has(desk.id)) continue;
        const dt = DESK_TYPES[desk.type];
        const diff = dt.slots - group.length;
        if (diff >= 0 && diff < bestDiff) { bestDiff = diff; bestDesk = desk; }
      }
      // Если идеального нет — берём любой свободный
      if (!bestDesk) bestDesk = sorted.find(d => !usedDesks.has(d.id));
      if (!bestDesk) break;
      usedDesks.add(bestDesk.id);
      const dt = DESK_TYPES[bestDesk.type];
      // Очищаем стол
      for (let si = 0; si < dt.slots; si++) delete ns[sk(bestDesk.id, si)];
      // Рассаживаем группу
      for (let si = 0; si < dt.slots && si < group.length; si++) {
        // Убираем студента с прежнего места
        const oldKey = Object.keys(ns).find(k => ns[k] === group[si].id);
        if (oldKey) delete ns[oldKey];
        ns[sk(bestDesk.id, si)] = group[si].id;
        anim[sk(bestDesk.id, si)] = true;
      }
    }
    animatingSeats = anim;
    seating = ns;
    setTimeout(() => { animatingSeats = {}; }, 700);
  }

  // ==================== SAVE/LOAD ====================
  function saveLayout() {
    if (!saveLayoutName.trim()) return;
    savedLayouts = [...savedLayouts, { name: saveLayoutName.trim(), date: new Date().toISOString(), desks: JSON.parse(JSON.stringify(desks)), seating: { ...seating }, students: JSON.parse(JSON.stringify(students)), nextDeskId, nextStudentId }];
    persist(); saveLayoutName = ''; showSaveDialog = false;
  }
  function loadLayout(i) {
    const l = savedLayouts[i]; if (!l) return;
    desks = l.desks; seating = { ...l.seating }; students = l.students; nextDeskId = l.nextDeskId; nextStudentId = l.nextStudentId;
    showHistory = false;
  }
  function deleteLayout(i) { savedLayouts = savedLayouts.filter((_, j) => j !== i); persist(); }

  let _mounted = false;

  function persist() {
    if (!browser) return;
    try {
      localStorage.setItem('classroom_layouts', JSON.stringify(savedLayouts));
      localStorage.setItem('classroom_current', JSON.stringify({ desks, seating, students, nextDeskId, nextStudentId }));
    } catch(e) {}
  }
  function loadFromLocal() {
    if (!browser) return;
    try {
      const l = localStorage.getItem('classroom_layouts'); if (l) savedLayouts = JSON.parse(l);
      const c = localStorage.getItem('classroom_current');
      if (c) { const d = JSON.parse(c); desks = d.desks || []; seating = d.seating || {}; students = d.students || []; nextDeskId = d.nextDeskId || 1; nextStudentId = d.nextStudentId || 1; }
    } catch(e) {}
  }

  $: if (_mounted && browser && (desks || seating || students)) persist();

  function checkMobile() {
    isMobile = browser && window.innerWidth < 768;
    showSidebar = !isMobile;
    if (isMobile && browser) {
      const availW = window.innerWidth - 16;
      canvasScale = Math.min(1, availW / CANVAS_W);
    } else {
      canvasScale = 1;
    }
  }

  onMount(() => {
    loadFromLocal();
    _mounted = true;
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  });
</script>

<svelte:head>
  <title>{$t('title_classroom')}</title>
</svelte:head>

<div class="h-[calc(100vh-3.5rem-3.5rem)] md:h-[calc(100vh-4rem)] flex overflow-hidden relative">

  <!-- Mobile backdrop -->
  {#if isMobile && showSidebar}
    <div class="absolute inset-0 z-30 bg-black/30 backdrop-blur-sm"
      on:click={() => showSidebar = false}></div>
  {/if}

  <!-- ===== LEFT SIDEBAR ===== -->
  <aside
    class="flex-shrink-0 w-72 flex flex-col overflow-hidden z-40 transition-transform duration-300
      {isMobile ? 'absolute inset-y-0 left-0' : 'relative'}
      {isMobile && !showSidebar ? '-translate-x-full' : 'translate-x-0'}"
    style="background:rgba(255,255,255,0.78); backdrop-filter:blur(20px); border-right:1px solid rgba(255,255,255,0.35);">

    <!-- Header -->
    <div class="flex items-center gap-1.5 px-3 py-2 flex-shrink-0 border-b" style="border-color:rgba(0,0,0,0.08);">
      <span class="flex-1 text-sm font-bold text-gray-800">{$t('classroom_title')}</span>
      <button on:click={() => showSaveDialog = true} title={$t('classroom_save')}
        class="p-1.5 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
      </button>
      <button on:click={() => showHistory = !showHistory} title={$t('classroom_saved_layouts')}
        class="p-1.5 rounded-xl transition-all {showHistory ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50'}">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      </button>
      {#if isMobile}
        <button on:click={() => showSidebar = false}
          class="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 transition-all">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      {/if}
    </div>

    <!-- Mode tabs -->
    <div class="px-3 pt-2 pb-1.5 flex-shrink-0">
      <div class="grid grid-cols-3 bg-gray-100/70 rounded-2xl p-1 gap-0.5">
        {#each [['edit','✏️', $t('mode_edit')],['seat','🪑', $t('mode_seat')],['groups','👥', $t('mode_groups')]] as [m, icon, label]}
          <button on:click={() => { mode = m; mobileSelectedStudent = null; }}
            class="flex flex-col items-center py-2 rounded-xl text-center transition-all
              {mode === m ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'}">
            <span class="text-base leading-none">{icon}</span>
            <span class="text-[10px] font-bold mt-1">{label}</span>
          </button>
        {/each}
      </div>
    </div>

    <!-- Mode tools -->
    <div class="px-3 pb-2 flex-shrink-0 border-b max-h-40 overflow-y-auto" style="border-color:rgba(0,0,0,0.07);">

      {#if mode === 'edit'}
        <div class="grid grid-cols-4 gap-1 mb-2">
          {#each Object.entries(DESK_TYPES) as [key, dt]}
            <button on:click={() => selectedTool = key} title={dt.label}
              class="flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all
                {selectedTool === key ? 'bg-white shadow-md ring-1 ring-indigo-200' : 'bg-white/40 hover:bg-white/80'}">
              <div class="w-5 h-3.5 rounded shadow-sm" style="background:{dt.color};"></div>
              <span class="text-[9px] text-gray-600 leading-tight text-center">{dt.label}</span>
            </button>
          {/each}
        </div>
        <div class="flex gap-2">
          <button on:click={addDesk}
            class="flex-1 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
            {$t('tool_add_desk')}
          </button>
          <div class="relative z-10">
            <button on:click|stopPropagation={() => showTemplates = !showTemplates}
              class="py-2 px-3 rounded-xl text-xs font-bold shadow-sm transition-all
                {showTemplates ? 'bg-indigo-100 text-indigo-700' : 'bg-white/70 text-gray-700 hover:bg-white'}">
              {$t('tool_template')}
            </button>
            {#if showTemplates}
              <div class="absolute bottom-full right-0 mb-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-1.5 w-40">
                {#each TEMPLATES as t}
                  <button on:click={() => applyTemplate(t.id)}
                    class="w-full px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-colors">
                    {t.label}
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        </div>

      {:else if mode === 'seat'}
        <div class="grid grid-cols-2 gap-1.5">
          <button on:click={autoSeatRandom}
            class="py-2.5 rounded-xl bg-white/70 text-indigo-700 hover:bg-white transition-all shadow-sm text-xs font-bold flex items-center justify-center gap-1.5">
            {$t('tool_random')}
          </button>
          <button on:click={autoSeatBalanced}
            class="py-2.5 rounded-xl bg-white/70 text-purple-700 hover:bg-white transition-all shadow-sm text-xs font-bold flex items-center justify-center gap-1.5">
            {$t('tool_balance')}
          </button>
          <button on:click={shuffleAll}
            class="py-2.5 rounded-xl bg-white/70 text-orange-600 hover:bg-white transition-all shadow-sm text-xs font-bold flex items-center justify-center gap-1.5">
            {$t('tool_shuffle')}
          </button>
          <button on:click={clearSeating}
            class="py-2.5 rounded-xl bg-white/70 text-gray-600 hover:bg-white transition-all shadow-sm text-xs font-bold flex items-center justify-center gap-1.5">
            {$t('tool_clear_seat')}
          </button>
        </div>

      {:else}
        <!-- Случайное разбиение по размеру -->
        <div class="flex items-center gap-1 mb-2 flex-wrap">
          <span class="text-[11px] text-gray-400 font-medium">{$t('tool_per')}</span>
          {#each [2,3,4,5,6] as sz}
            <button on:click={() => groupSize = sz}
              class="w-8 h-8 rounded-xl text-xs font-bold transition-all shadow-sm
                {groupSize === sz ? 'bg-indigo-500 text-white' : 'bg-white/70 text-gray-600 hover:bg-white'}">
              {sz}
            </button>
          {/each}
          <span class="text-[11px] text-gray-400 font-medium">{$t('tool_people')}</span>
        </div>
        <div class="flex gap-1.5">
          <button on:click={generateGroups}
            class="flex-1 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold shadow-sm hover:shadow-md transition-all">
            {$t('tool_split')}
          </button>
          {#if groups.length > 0}
            <button on:click={seatGroupsOnDesks}
              class="flex-1 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 shadow-sm transition-all">
              {$t('tool_to_seats')}
            </button>
            <button on:click={clearGroups}
              class="py-2 px-3 rounded-xl bg-white/70 text-rose-500 hover:bg-white transition-all shadow-sm text-xs font-bold">✕</button>
          {/if}
        </div>
        {#if groups.length > 0}
          <p class="text-[10px] text-gray-400 mt-1.5">{$t('tool_groups_info', groups.length, students.filter(s=>!s.absent).length)}</p>
        {:else}
          <p class="text-[10px] text-gray-400 mt-1.5">{$t('tool_color_groups_hint')}</p>
        {/if}
      {/if}
    </div>

    <!-- Student panel (flex-1) -->
    <div class="flex-1 overflow-hidden flex flex-col min-h-0">
      <ClassroomStudentPanel {students} {seating} {mode} {isMobile} {mobileSelectedStudent} {showImport} {importText} {newStudentName} {groups} {STUDENT_TAGS} {GROUP_COLORS}
        on:toggleImport={() => showImport = !showImport}
        on:addStudent={handleAddStudent}
        on:nameChange={(e) => newStudentName = e.detail}
        on:clearName={() => newStudentName = ''}
        on:cycleColor={(e) => cycleColor(e.detail)}
        on:importTextChange={(e) => importText = e.detail}
        on:import={importStudents}
        on:unseatDrop={(e) => onUnseatDrop(e.detail)}
        on:studentDragStart={(e) => onStudentDragStart(e.detail.e, e.detail.id)}
        on:mobileSelect={(e) => mobileSelectStudent(e.detail)}
        on:toggleTag={(e) => toggleTag(e.detail.sid, e.detail.tid)}
        on:toggleAbsent={(e) => toggleAbsent(e.detail)}
        on:removeStudent={(e) => removeStudent(e.detail)}
      />
    </div>
  </aside>

  <!-- ===== CANVAS AREA ===== -->
  <div class="flex-1 flex flex-col overflow-hidden">

    <!-- Mobile mini-bar -->
    {#if isMobile}
      <div class="flex-shrink-0 flex items-center gap-2 px-3 py-2 backdrop-blur-xl"
        style="background:rgba(255,255,255,0.85); border-bottom:1px solid rgba(255,255,255,0.3);">
        <button on:click={() => showSidebar = true}
          class="p-2 rounded-xl bg-white/70 text-gray-700 hover:bg-white transition-all shadow-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6h16M4 12h16M4 18h7"/></svg>
        </button>
        <span class="text-sm font-bold text-gray-700 flex-1">
          {mode === 'edit' ? `✏️ ${$t('mode_edit')}` : mode === 'seat' ? `🪑 ${$t('mode_seat')}` : `👥 ${$t('mode_groups')}`}
        </span>
        {#if mode === 'seat' && mobileSelectedStudent != null}
          <span class="text-xs text-indigo-600 font-medium animate-pulse">{$t('mode_select_seat')}</span>
        {/if}
      </div>
    {/if}

    <!-- Canvas scroll area -->
    <div bind:this={canvasEl}
      class="flex-1 overflow-auto p-3 md:p-6 flex items-start justify-center"
      style="-webkit-overflow-scrolling:touch;"
      on:click={() => { if (mode === 'edit') selectedDeskId = null; showTemplates = false; }}>

      <div class="relative rounded-2xl shadow-xl flex-shrink-0"
        style="width:{CANVAS_W}px; height:{CANVAS_H}px;
               transform:scale({canvasScale}); transform-origin:top center;
               {canvasScale < 1 ? `margin-bottom:-${Math.round(CANVAS_H*(1-canvasScale))}px;` : ''}
               background:rgba(255,255,255,0.5); backdrop-filter:blur(16px);
               border:1px solid rgba(255,255,255,0.45);">

        <!-- Grid dots (edit mode) -->
        {#if mode === 'edit'}
          <svg class="absolute inset-0 w-full h-full pointer-events-none opacity-20">
            {#each Array(Math.floor(CANVAS_W/40)) as _, cx}
              {#each Array(Math.floor(CANVAS_H/40)) as _, cy}
                <circle cx={cx*40+20} cy={cy*40+20} r="1.2" fill="#94a3b8"/>
              {/each}
            {/each}
          </svg>
        {/if}

        <!-- Desks -->
        {#each desks as desk (desk.id)}
          {@const dt = DESK_TYPES[desk.type]}
          {@const isSelected = selectedDeskId === desk.id}
          <div
            class="desk-wrapper absolute select-none {mode==='edit'?'cursor-move':''} {draggingDesk===desk.id?'z-30 opacity-80':'z-10'} {isSelected?'z-20':''}"
            style="left:{desk.x}px; top:{desk.y}px; width:{dt.w}px; height:{dt.h}px; transform:rotate({desk.rotation||0}deg); transform-origin:center center;"
            on:mousedown={(e) => startDeskDrag(e, desk)}
            on:touchstart={(e) => startDeskDrag(e, desk)}
            on:click|stopPropagation={() => { if (mode==='edit') selectedDeskId = desk.id; }}
          >
            {#if mode === 'edit'}
              <div class="desk-controls absolute flex items-center gap-0.5 z-40 {isSelected?'desk-controls-visible':''}"
                style="bottom:calc(100% + 4px); left:50%; transform:translateX(-50%) rotate(-{desk.rotation||0}deg); pointer-events:auto;">
                <div class="flex items-center gap-0.5 px-1 py-0.5 rounded-lg shadow-lg" style="background:rgba(255,255,255,0.95); border:1px solid rgba(0,0,0,0.08);">
                  <button on:click|stopPropagation={() => rotateDesk(desk.id,-45)} on:touchend|stopPropagation|preventDefault={() => rotateDesk(desk.id,-45)} class="w-5 h-5 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors" title="−45°">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 10h4V6"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10a9 9 0 0117.5-2.5"/></svg>
                  </button>
                  <button on:click|stopPropagation={() => rotateDesk(desk.id,45)} on:touchend|stopPropagation|preventDefault={() => rotateDesk(desk.id,45)} class="w-5 h-5 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors" title="+45°">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 10h-4V6"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10A9 9 0 003.5 7.5"/></svg>
                  </button>
                  <button on:click|stopPropagation={() => duplicateDesk(desk.id)} on:touchend|stopPropagation|preventDefault={() => duplicateDesk(desk.id)} class="w-5 h-5 rounded-md bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors" title="Копировать">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                  </button>
                  <button on:click|stopPropagation={() => removeDesk(desk.id)} on:touchend|stopPropagation|preventDefault={() => removeDesk(desk.id)} class="w-5 h-5 rounded-md bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors" title="Удалить">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>
            {/if}

            <div class="w-full h-full rounded-xl border-2 flex items-center justify-center relative transition-all duration-150 {isSelected?'ring-2 ring-indigo-400 ring-offset-1':''}"
              style="background:{dt.color}18; border-color:{dt.color}{isSelected?'aa':'50'};">
              {#if desk.type === 'teacher'}
                <span class="text-[10px] font-semibold pointer-events-none" style="color:{dt.color}; transform:rotate(-{desk.rotation||0}deg);">{$t('desk_teacher')}</span>
              {/if}
              {#each Array(dt.slots) as _, si}
                {@const pos = getSlotPos(desk.type, si)}
                {@const key = sk(desk.id, si)}
                {@const stu = stuAtSlot(desk.id, si)}
                {@const gc = stu ? groupColor(stu.id) : null}
                {#if pos}
                  <div class="absolute flex items-center justify-center"
                    style="left:{pos.x*dt.w-15}px; top:{pos.y*dt.h-15}px; width:30px; height:30px; transform:rotate(-{desk.rotation||0}deg);"
                    on:dragover|preventDefault={(e) => onSlotDragOver(e, key)}
                    on:dragleave={onSlotDragLeave}
                    on:drop|preventDefault={(e) => onSlotDrop(e, desk.id, si)}
                    on:click|stopPropagation={() => { if (mode==='seat') mobilePlaceStudent(desk.id, si); }}
                    on:touchend|stopPropagation|preventDefault={() => { if (mode==='seat') mobilePlaceStudent(desk.id, si); }}>
                    {#if stu}
                      <div class="w-full h-full rounded-full flex items-center justify-center text-white text-[8px] font-bold leading-none text-center shadow-sm {animatingSeats[key]?'animate-pop':''}"
                        style="background:{gc||dt.color};"
                        draggable={mode==='seat' && !isMobile}
                        on:dragstart={(e) => onStudentDragStart(e, stu.id)}
                        title={stu.name}>
                        {stu.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                    {:else}
                      <div class="w-full h-full rounded-full border-2 border-dashed transition-colors
                        {dragOverSlotKey===key?'border-indigo-400 bg-indigo-50':mobileSelectedStudent!=null&&mode==='seat'?'border-indigo-300 bg-indigo-50/50 animate-pulse':'border-gray-300 bg-white/50'}"></div>
                    {/if}
                  </div>
                {/if}
              {/each}
            </div>
          </div>
        {/each}

        <!-- Empty state -->
        {#if desks.length === 0}
          <div class="absolute inset-0 flex flex-col items-center justify-center text-gray-400 pointer-events-none">
            <svg class="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"/></svg>
            <p class="text-sm text-gray-500">{$t('classroom_empty')}</p>
            <p class="text-xs mt-1 text-gray-400">{$t('classroom_empty_hint')}</p>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- ===== MODALS ===== -->
  {#if showSaveDialog}
    <div class="fixed inset-0 z-50 bg-black/30 flex items-center justify-center backdrop-blur-sm p-4"
      on:click={() => showSaveDialog = false}>
      <div class="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-xs" on:click|stopPropagation>
        <h3 class="text-base font-bold text-gray-800 mb-3">{$t('classroom_save_layout')}</h3>
        <input bind:value={saveLayoutName} placeholder={$t('classroom_name_ph')}
          class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 mb-3"
          on:keydown={(e) => e.key === 'Enter' && saveLayout()} />
        <div class="flex gap-2">
          <button on:click={() => showSaveDialog = false}
            class="flex-1 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">{$t('classroom_cancel')}</button>
          <button on:click={saveLayout}
            class="flex-1 py-2 rounded-xl bg-indigo-500 text-white text-sm font-bold hover:bg-indigo-600">{$t('classroom_save')}</button>
        </div>
      </div>
    </div>
  {/if}

  {#if showHistory}
    <div class="fixed inset-0 z-50 bg-black/30 flex items-center justify-center backdrop-blur-sm p-4"
      on:click={() => showHistory = false}>
      <div class="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm max-h-[70vh] overflow-y-auto"
        on:click|stopPropagation>
        <h3 class="text-base font-bold text-gray-800 mb-3">{$t('classroom_saved_layouts')}</h3>
        {#if savedLayouts.length === 0}
          <p class="text-sm text-gray-400 text-center py-6">{$t('classroom_no_layouts')}</p>
        {:else}
          <div class="space-y-2">
            {#each savedLayouts as layout, i}
              <div class="flex items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all">
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-gray-800 truncate">{layout.name}</div>
                  <div class="text-[10px] text-gray-400">{$t('classroom_date_students', new Date(layout.date).toLocaleDateString(), layout.students?.length||0)}</div>
                </div>
                <button on:click={() => loadLayout(i)}
                  class="px-2.5 py-1 rounded-lg bg-indigo-500 text-white text-[10px] font-bold hover:bg-indigo-600 flex-shrink-0">{$t('classroom_load')}</button>
                <button on:click={() => deleteLayout(i)}
                  class="p-1 rounded-lg text-gray-400 hover:text-red-500 flex-shrink-0">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>


<style>
  @keyframes pop {
    0% { transform: scale(0); opacity: 0; }
    60% { transform: scale(1.25); }
    100% { transform: scale(1); opacity: 1; }
  }
  .animate-pop { animation: pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

  /* Desk controls: hidden by default, visible on hover or when selected */
  .desk-controls {
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s ease;
  }
  .desk-wrapper:hover > .desk-controls,
  .desk-controls-visible {
    opacity: 1;
    pointer-events: auto;
  }
</style>
