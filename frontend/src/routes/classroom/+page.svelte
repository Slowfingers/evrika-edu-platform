<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import ClassroomStudentPanel from '$lib/components/ClassroomStudentPanel.svelte';

  // ==================== CONSTANTS ====================
  const CANVAS_W = 760;
  const CANVAS_H = 480;

  const DESK_TYPES = {
    single:  { label: 'Одиночная', slots: 1, w: 64, h: 48, color: '#6366f1' },
    double:  { label: 'Двойная',   slots: 2, w: 110, h: 48, color: '#8b5cf6' },
    group2:  { label: 'Группа 2',  slots: 2, w: 90, h: 70, color: '#7c3aed', isGroup: true },
    group3:  { label: 'Группа 3',  slots: 3, w: 110, h: 70, color: '#9333ea', isGroup: true },
    group4:  { label: 'Группа 4',  slots: 4, w: 110, h: 86, color: '#a855f7', isGroup: true },
    group6:  { label: 'Группа 6',  slots: 6, w: 150, h: 86, color: '#c084fc', isGroup: true },
    teacher: { label: 'Учитель',   slots: 0, w: 130, h: 48, color: '#f59e0b' },
  };

  const STUDENT_TAGS = [
    { id: 'active',   label: 'Активный',    color: '#22c55e' },
    { id: 'quiet',    label: 'Тихий',       color: '#3b82f6' },
    { id: 'conflict', label: 'Конфликтный', color: '#ef4444' },
    { id: 'strong',   label: 'Сильный',     color: '#f59e0b' },
    { id: 'weak',     label: 'Слабый',      color: '#a855f7' },
  ];

  const GROUP_COLORS = ['#6366f1','#ec4899','#22c55e','#f59e0b','#3b82f6','#ef4444','#14b8a6','#f97316'];

  const TEMPLATES = [
    { id: 'rows',    label: 'Ряды' },
    { id: 'u-shape', label: 'U-образно' },
    { id: 'islands', label: 'Островки' },
    { id: 'circle',  label: 'Круг' },
  ];

  // ==================== STATE ====================
  let desks = [];
  let students = [];
  let seating = {};
  let nextDeskId = 1;
  let nextStudentId = 1;

  let mode = 'edit';
  let selectedTool = 'double';
  let showStudentPanel = false;
  let showMobilePanel = false;
  let showTemplates = false;
  let showImport = false;
  let importText = '';
  let animatingSeats = {};
  let groups = [];
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
  function startDeskDrag(e, desk) {
    if (mode !== 'edit') return;
    e.preventDefault();
    e.stopPropagation();
    draggingDesk = desk.id;
    selectedDeskId = desk.id;
    const rect = canvasEl.getBoundingClientRect();
    const p = getClientPos(e);
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
    students = [...students, { id: nextStudentId++, name: name.trim(), tags: [], absent: false }];
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
  function generateGroups() {
    let pool = students.filter(s => !s.absent); if (!pool.length) return;
    const sz = Math.max(2, groupSize);
    pool = [...pool].sort(() => Math.random() - 0.5);
    const res = [];
    for (let i = 0; i < pool.length; i += sz) res.push(pool.slice(i, i + sz));
    groups = res;
  }
  function clearGroups() { groups = []; }

  function seatGroupsOnDesks() {
    if (!groups.length || !desks.length) return;
    // Only seat onto group-type desks (isGroup flag)
    const groupDesks = desks.filter(d => DESK_TYPES[d.type].isGroup);
    if (!groupDesks.length) return;
    const ns = { ...seating };
    const anim = {};
    // Match groups to desks by best-fit size
    const usedDesks = new Set();
    for (const group of groups) {
      // Find best desk: slots >= group size, smallest fit first
      let bestDesk = null;
      let bestDiff = Infinity;
      for (const desk of groupDesks) {
        if (usedDesks.has(desk.id)) continue;
        const dt = DESK_TYPES[desk.type];
        const diff = dt.slots - group.length;
        if (diff >= 0 && diff < bestDiff) { bestDiff = diff; bestDesk = desk; }
      }
      // If no perfect fit, use any available group desk
      if (!bestDesk) {
        bestDesk = groupDesks.find(d => !usedDesks.has(d.id));
      }
      if (!bestDesk) break;
      usedDesks.add(bestDesk.id);
      const dt = DESK_TYPES[bestDesk.type];
      // Clear existing seating on this desk
      for (let si = 0; si < dt.slots; si++) {
        const key = sk(bestDesk.id, si);
        delete ns[key];
      }
      // Seat group members
      for (let si = 0; si < dt.slots && si < group.length; si++) {
        const key = sk(bestDesk.id, si);
        ns[key] = group[si].id;
        anim[key] = true;
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
      if (c) { const d = JSON.parse(c); if (d.desks?.length) { desks = d.desks; seating = d.seating || {}; students = d.students || []; nextDeskId = d.nextDeskId || 1; nextStudentId = d.nextStudentId || 1; } }
    } catch(e) {}
  }

  $: if (browser && (desks || seating || students)) persist();

  function checkMobile() {
    isMobile = browser && window.innerWidth < 768;
    showStudentPanel = !isMobile;
    if (isMobile && browser) {
      const availW = window.innerWidth - 16;
      canvasScale = Math.min(1, availW / CANVAS_W);
    } else {
      canvasScale = 1;
    }
  }

  onMount(() => {
    loadFromLocal();
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  });
</script>

<svelte:head>
  <title>Конструктор класса - EvrikaEdu</title>
</svelte:head>

<div class="h-[calc(100vh-3.5rem-4rem)] md:h-[calc(100vh-4rem)] flex flex-col overflow-hidden relative">

  <!-- ===== TOOLBAR ===== -->
  <div class="flex-shrink-0 backdrop-blur-xl px-2 md:px-3 py-1.5 md:py-2 flex items-center gap-1.5 md:gap-2 overflow-x-auto" style="background:rgba(255,255,255,0.7); border-bottom:1px solid rgba(255,255,255,0.3); scrollbar-width:none; -webkit-overflow-scrolling:touch;">

    <!-- Mode tabs -->
    <div class="flex bg-white bg-opacity-60 rounded-lg p-0.5 flex-shrink-0">
      {#each [['edit','Редактор'],['seat','Рассадка'],['groups','Группы']] as [m, label]}
        <button on:click={() => { mode = m; mobileSelectedStudent = null; }} class="px-2 md:px-3 py-1 md:py-1.5 rounded-md text-[11px] md:text-xs font-medium transition-all {mode === m ? 'bg-white shadow text-gray-900' : 'text-gray-500'}">
          {label}
        </button>
      {/each}
    </div>

    <div class="w-px h-5 bg-white bg-opacity-40 flex-shrink-0"></div>

    {#if mode === 'edit'}
      <!-- Desk type picker (scrollable on mobile) -->
      {#each Object.entries(DESK_TYPES) as [key, dt]}
        <button on:click={() => selectedTool = key} class="px-1.5 md:px-2 py-1 md:py-1.5 rounded-lg text-[10px] md:text-xs font-medium transition-all flex items-center gap-1 flex-shrink-0 whitespace-nowrap {selectedTool === key ? 'bg-white shadow text-gray-900 ring-1 ring-indigo-200' : 'text-gray-600'}">
          <div class="w-2.5 h-2.5 md:w-3 md:h-3 rounded" style="background:{dt.color};"></div>
          <span class="hidden sm:inline">{dt.label}</span>
          <span class="sm:hidden">{dt.label.split(' ')[0]}</span>
        </button>
      {/each}
      <button on:click={addDesk} class="px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[10px] md:text-xs font-medium bg-indigo-500 text-white hover:bg-indigo-600 transition-all flex items-center gap-1 flex-shrink-0">
        <svg class="w-3 h-3 md:w-3.5 md:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        <span class="hidden sm:inline">Добавить</span>
      </button>
      <div class="relative flex-shrink-0 z-50">
        <button on:click={() => showTemplates = !showTemplates} class="px-2 py-1 md:py-1.5 rounded-lg text-[10px] md:text-xs font-medium text-gray-600 hover:bg-white hover:bg-opacity-50 transition-all flex items-center gap-1">
          <svg class="w-3 h-3 md:w-3.5 md:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg>
          Шаблоны
        </button>
        {#if showTemplates}
          <div class="absolute top-full left-0 mt-1 z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-1 w-36">
            {#each TEMPLATES as t}
              <button on:click={() => applyTemplate(t.id)} class="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg">{t.label}</button>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    {#if mode === 'seat'}
      <button on:click={autoSeatRandom} class="px-2 py-1 md:py-1.5 rounded-lg text-[10px] md:text-xs font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all flex items-center gap-1 flex-shrink-0" title="Рассадить всех случайно по свободным местам">Случайно</button>
      <button on:click={autoSeatBalanced} class="px-2 py-1 md:py-1.5 rounded-lg text-[10px] md:text-xs font-medium bg-purple-50 text-purple-600 hover:bg-purple-100 transition-all flex items-center gap-1 flex-shrink-0" title="Сильные и слабые за одной партой, конфликтные разведены">Баланс</button>
      <button on:click={shuffleAll} class="px-2 py-1 md:py-1.5 rounded-lg text-[10px] md:text-xs font-medium bg-orange-50 text-orange-600 hover:bg-orange-100 transition-all flex items-center gap-1 flex-shrink-0">Встряхнуть</button>
      <button on:click={clearSeating} class="px-2 py-1 md:py-1.5 rounded-lg text-[10px] md:text-xs font-medium text-gray-500 hover:bg-white hover:bg-opacity-50 transition-all flex-shrink-0">Очистить</button>
    {/if}

    {#if mode === 'groups'}
      <span class="text-[10px] md:text-xs text-gray-500 flex-shrink-0">Чел. в группе:</span>
      {#each [2,3,4,5,6] as sz}
        <button on:click={() => groupSize = sz} class="w-6 h-6 md:w-7 md:h-7 rounded-lg text-[10px] md:text-xs font-bold transition-all flex-shrink-0 flex items-center justify-center {groupSize === sz ? 'bg-indigo-500 text-white shadow' : 'bg-white bg-opacity-60 text-gray-600 hover:bg-white'}">{sz}</button>
      {/each}
      <button on:click={generateGroups} class="px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[10px] md:text-xs font-medium bg-indigo-500 text-white hover:bg-indigo-600 transition-all flex-shrink-0">Разделить</button>
      {#if groups.length > 0}
        <div class="w-px h-5 bg-white bg-opacity-40 flex-shrink-0"></div>
        <span class="text-[10px] md:text-xs text-gray-500 flex-shrink-0">{groups.length} гр.</span>
        <button on:click={seatGroupsOnDesks} class="px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[10px] md:text-xs font-medium bg-green-500 text-white hover:bg-green-600 transition-all flex items-center gap-1 flex-shrink-0">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          За столы
        </button>
        <button on:click={clearGroups} class="px-2 py-1 rounded-lg text-[10px] md:text-xs font-medium text-red-400 hover:text-red-600 hover:bg-red-50 transition-all flex-shrink-0">Сбросить</button>
      {/if}
    {/if}

    <div class="flex-1"></div>

    <button on:click={() => showSaveDialog = true} class="p-1.5 rounded-lg text-gray-600 hover:bg-white hover:bg-opacity-50 transition-all flex-shrink-0" title="Сохранить">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
    </button>
    <button on:click={() => showHistory = !showHistory} class="p-1.5 rounded-lg text-gray-600 hover:bg-white hover:bg-opacity-50 transition-all flex-shrink-0" title="История">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
    </button>
    <!-- Desktop: toggle panel. Mobile: toggle bottom sheet -->
    <button on:click={() => { if (isMobile) showMobilePanel = !showMobilePanel; else showStudentPanel = !showStudentPanel; }} class="p-1.5 rounded-lg transition-all flex-shrink-0 {(showStudentPanel || showMobilePanel) ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:bg-white hover:bg-opacity-50'}" title="Ученики">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
    </button>
  </div>


  <!-- ===== MAIN CONTENT ===== -->
  <div class="flex-1 flex overflow-hidden">

    <!-- Canvas area -->
    <div bind:this={canvasEl} class="flex-1 overflow-auto p-2 md:p-4 flex items-start justify-center" style="-webkit-overflow-scrolling:touch;" on:click={() => { if (mode === 'edit') selectedDeskId = null; showTemplates = false; }}>
      <div class="relative rounded-2xl shadow-lg flex-shrink-0" style="width:{CANVAS_W}px; height:{CANVAS_H}px; transform:scale({canvasScale}); transform-origin:top center; {canvasScale < 1 ? `margin-bottom:-${Math.round(CANVAS_H * (1 - canvasScale))}px;` : ''} background:rgba(255,255,255,0.45); backdrop-filter:blur(16px); border:1px solid rgba(255,255,255,0.4);">

        <!-- Grid dots (edit mode) -->
        {#if mode === 'edit'}
          <svg class="absolute inset-0 w-full h-full pointer-events-none opacity-20">
            {#each Array(Math.floor(CANVAS_W / 40)) as _, cx}
              {#each Array(Math.floor(CANVAS_H / 40)) as _, cy}
                <circle cx={cx * 40 + 20} cy={cy * 40 + 20} r="1.2" fill="#94a3b8" />
              {/each}
            {/each}
          </svg>
        {/if}

        <!-- Desks -->
        {#each desks as desk (desk.id)}
          {@const dt = DESK_TYPES[desk.type]}
          {@const isSelected = selectedDeskId === desk.id}
          <div
            class="desk-wrapper absolute select-none {mode === 'edit' ? 'cursor-move' : ''} {draggingDesk === desk.id ? 'z-30 opacity-80' : 'z-10'} {isSelected ? 'z-20' : ''}"
            style="left:{desk.x}px; top:{desk.y}px; width:{dt.w}px; height:{dt.h}px; transform:rotate({desk.rotation || 0}deg); transform-origin:center center;"
            on:mousedown={(e) => startDeskDrag(e, desk)}
            on:touchstart={(e) => startDeskDrag(e, desk)}
            on:click|stopPropagation={() => { if (mode === 'edit') selectedDeskId = desk.id; }}
          >
            <!-- Inline controls above desk -->
            {#if mode === 'edit'}
              <div class="desk-controls absolute flex items-center gap-0.5 z-40 {isSelected ? 'desk-controls-visible' : ''}" style="bottom:calc(100% + 4px); left:50%; transform:translateX(-50%) rotate(-{desk.rotation || 0}deg); pointer-events:auto;">
                <div class="flex items-center gap-0.5 px-1 py-0.5 rounded-lg shadow-lg" style="background:rgba(255,255,255,0.92); border:1px solid rgba(0,0,0,0.08);">
                  <button on:click|stopPropagation={() => rotateDesk(desk.id, -45)} class="w-5 h-5 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors" title="−45°">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 10h4V6"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10a9 9 0 0117.5-2.5"/></svg>
                  </button>
                  <button on:click|stopPropagation={() => rotateDesk(desk.id, 45)} class="w-5 h-5 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors" title="+45°">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 10h-4V6"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10A9 9 0 003.5 7.5"/></svg>
                  </button>
                  <button on:click|stopPropagation={() => duplicateDesk(desk.id)} class="w-5 h-5 rounded-md bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors" title="Копировать">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                  </button>
                  <button on:click|stopPropagation={() => removeDesk(desk.id)} class="w-5 h-5 rounded-md bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors" title="Удалить">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>
            {/if}

            <div class="w-full h-full rounded-xl border-2 flex items-center justify-center relative transition-all duration-150 {isSelected ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}" style="background:{dt.color}18; border-color:{dt.color}{isSelected ? 'aa' : '50'};">

              {#if desk.type === 'teacher'}
                <span class="text-[10px] font-semibold pointer-events-none" style="color:{dt.color}; transform:rotate(-{desk.rotation || 0}deg);">Учитель</span>
              {/if}

              <!-- Slots -->
              {#each Array(dt.slots) as _, si}
                {@const pos = getSlotPos(desk.type, si)}
                {@const key = sk(desk.id, si)}
                {@const stu = stuAtSlot(desk.id, si)}
                {@const gc = stu ? groupColor(stu.id) : null}
                {#if pos}
                  <div
                    class="absolute flex items-center justify-center"
                    style="left:{pos.x * dt.w - 15}px; top:{pos.y * dt.h - 15}px; width:30px; height:30px; transform:rotate(-{desk.rotation || 0}deg);"
                    on:dragover|preventDefault={(e) => onSlotDragOver(e, key)}
                    on:dragleave={onSlotDragLeave}
                    on:drop|preventDefault={(e) => onSlotDrop(e, desk.id, si)}
                    on:click|stopPropagation={() => { if (mode === 'seat' && isMobile) mobilePlaceStudent(desk.id, si); }}
                  >
                    {#if stu}
                      <div
                        class="w-full h-full rounded-full flex items-center justify-center text-white text-[8px] font-bold leading-none text-center shadow-sm {animatingSeats[key] ? 'animate-pop' : ''}"
                        style="background:{gc || dt.color};"
                        draggable={mode === 'seat' && !isMobile}
                        on:dragstart={(e) => onStudentDragStart(e, stu.id)}
                        title={stu.name}
                      >
                        {stu.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                    {:else}
                      <div class="w-full h-full rounded-full border-2 border-dashed transition-colors {dragOverSlotKey === key ? 'border-indigo-400 bg-indigo-50' : mobileSelectedStudent != null && mode === 'seat' ? 'border-indigo-300 bg-indigo-50 bg-opacity-50 animate-pulse' : 'border-gray-300 bg-white bg-opacity-50'}"></div>
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
            <svg class="w-10 h-10 md:w-12 md:h-12 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"/></svg>
            <p class="text-xs md:text-sm">Выберите шаблон или добавьте парты</p>
          </div>
        {/if}
      </div>
    </div>

    <!-- ===== DESKTOP STUDENT PANEL ===== -->
    {#if showStudentPanel && !isMobile}
      <div class="w-60 xl:w-64 flex-shrink-0 flex flex-col overflow-hidden backdrop-blur-xl" style="background:rgba(255,255,255,0.7); border-left:1px solid rgba(255,255,255,0.3);">
        <ClassroomStudentPanel {students} {seating} {mode} {isMobile} {mobileSelectedStudent} {showImport} {importText} {newStudentName} {groups} {STUDENT_TAGS} {GROUP_COLORS}
          on:toggleImport={() => showImport = !showImport}
          on:addStudent={handleAddStudent}
          on:nameChange={(e) => newStudentName = e.detail}
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
    {/if}
  </div>

  <!-- ===== MOBILE BOTTOM SHEET ===== -->
  {#if showMobilePanel && isMobile}
    <div class="absolute bottom-0 left-0 right-0 z-40 max-h-[55vh] flex flex-col rounded-t-2xl shadow-2xl backdrop-blur-xl overflow-hidden" style="background:rgba(255,255,255,0.92); border-top:1px solid rgba(255,255,255,0.4);">
      <div class="flex items-center justify-center py-1.5">
        <div class="w-10 h-1 rounded-full bg-gray-300"></div>
      </div>
      <ClassroomStudentPanel {students} {seating} {mode} {isMobile} {mobileSelectedStudent} {showImport} {importText} {newStudentName} {groups} {STUDENT_TAGS} {GROUP_COLORS}
        on:toggleImport={() => showImport = !showImport}
        on:addStudent={handleAddStudent}
        on:nameChange={(e) => newStudentName = e.detail}
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
  {/if}

  <!-- ===== MODALS ===== -->
  {#if showSaveDialog}
    <div class="fixed inset-0 z-50 bg-black bg-opacity-30 flex items-center justify-center backdrop-blur-sm p-4" on:click={() => showSaveDialog = false}>
      <div class="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-xs" on:click|stopPropagation>
        <h3 class="text-base font-bold text-gray-800 mb-3">Сохранить рассадку</h3>
        <input bind:value={saveLayoutName} placeholder="Название..." class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 mb-3" on:keydown={(e) => e.key === 'Enter' && saveLayout()} />
        <div class="flex gap-2">
          <button on:click={() => showSaveDialog = false} class="flex-1 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">Отмена</button>
          <button on:click={saveLayout} class="flex-1 py-2 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600">Сохранить</button>
        </div>
      </div>
    </div>
  {/if}

  {#if showHistory}
    <div class="fixed inset-0 z-50 bg-black bg-opacity-30 flex items-center justify-center backdrop-blur-sm p-4" on:click={() => showHistory = false}>
      <div class="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm max-h-[70vh] overflow-y-auto" on:click|stopPropagation>
        <h3 class="text-base font-bold text-gray-800 mb-3">Сохранённые рассадки</h3>
        {#if savedLayouts.length === 0}
          <p class="text-sm text-gray-400 text-center py-6">Нет сохранённых рассадок</p>
        {:else}
          <div class="space-y-2">
            {#each savedLayouts as layout, i}
              <div class="flex items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all">
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-gray-800 truncate">{layout.name}</div>
                  <div class="text-[10px] text-gray-400">{new Date(layout.date).toLocaleDateString('ru-RU')} · {layout.students?.length || 0} уч.</div>
                </div>
                <button on:click={() => loadLayout(i)} class="px-2.5 py-1 rounded-lg bg-indigo-500 text-white text-[10px] font-medium hover:bg-indigo-600 flex-shrink-0">Загрузить</button>
                <button on:click={() => deleteLayout(i)} class="p-1 rounded-lg text-gray-400 hover:text-red-500 flex-shrink-0">
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
