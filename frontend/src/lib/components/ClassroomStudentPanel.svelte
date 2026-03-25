<script>
  import { createEventDispatcher } from 'svelte';

  export let students = [];
  export let seating = {};
  export let mode = 'edit';
  export let isMobile = false;
  export let mobileSelectedStudent = null;
  export let showImport = false;
  export let importText = '';
  export let newStudentName = '';
  export let newStudentGroupColor = null;
  export let groups = [];
  export let STUDENT_TAGS = [];
  export let GROUP_COLORS = [];

  const dispatch = createEventDispatcher();

  $: unseatedList = (() => {
    const s = new Set(Object.values(seating));
    return students.filter(st => !s.has(st.id) && !st.absent);
  })();

  $: seatedList = (() => {
    const s = new Set(Object.values(seating));
    return students.filter(st => s.has(st.id));
  })();

  function ini(name) {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }
</script>

<!-- Header -->
<div class="px-3 pt-3 pb-2.5 flex items-center justify-between flex-shrink-0 border-b" style="border-color:rgba(0,0,0,0.07);">
  <span class="text-sm font-bold text-gray-800">
    Ученики <span class="text-xs font-normal text-gray-400">({students.length})</span>
  </span>
  <button on:click={() => dispatch('toggleImport')} title="Импортировать список"
    class="p-1.5 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all">
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
    </svg>
  </button>
</div>

<!-- Add student -->
<div class="px-3 py-2.5 border-b flex-shrink-0" style="border-color:rgba(0,0,0,0.07);">

  <!-- Group color picker -->
  <div class="flex items-center gap-1.5 mb-2.5">
    <span class="text-[10px] font-semibold text-gray-400 tracking-wide uppercase">Группа:</span>
    <!-- No group -->
    <button on:click={() => dispatch('colorChange', null)} title="Без группы"
      class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0
        {newStudentGroupColor === null ? 'border-gray-500 bg-gray-200 scale-110' : 'border-gray-200 bg-gray-100 hover:border-gray-400'}">
      {#if newStudentGroupColor === null}
        <svg class="w-2.5 h-2.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
        </svg>
      {/if}
    </button>
    {#each GROUP_COLORS as color}
      <button on:click={() => dispatch('colorChange', color)} title="Группа {color}"
        class="w-5 h-5 rounded-full border-2 transition-all flex-shrink-0
          {newStudentGroupColor === color ? 'border-gray-800 scale-125 shadow-md' : 'border-transparent hover:scale-110 hover:shadow-sm'}"
        style="background:{color};"></button>
    {/each}
  </div>

  <!-- Name input + submit -->
  <form on:submit|preventDefault={() => dispatch('addStudent')} class="flex gap-2">
    <div class="relative flex-1 min-w-0">
      <input bind:value={newStudentName}
        on:input={() => dispatch('nameChange', newStudentName)}
        placeholder="Имя ученика..."
        class="w-full pl-3 pr-8 py-2 text-xs border border-gray-200 rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition-all" />
      {#if newStudentName}
        <button type="button" on:click={() => dispatch('clearName')} title="Очистить"
          class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-all flex-shrink-0">
          <svg class="w-2.5 h-2.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      {/if}
    </div>
    <button type="submit"
      class="px-3 py-2 rounded-xl text-white text-xs font-bold transition-all flex-shrink-0 shadow-sm"
      style="background:{newStudentGroupColor || '#6366f1'}; opacity:{newStudentName.trim() ? 1 : 0.4}; cursor:{newStudentName.trim() ? 'pointer' : 'not-allowed'};">
      +
    </button>
  </form>

  <!-- Import block -->
  {#if showImport}
    <div class="mt-2.5 p-2.5 bg-gray-50/80 rounded-xl border border-gray-100">
      <p class="text-[10px] text-gray-400 mb-1.5">Каждое имя с новой строки</p>
      <textarea bind:value={importText} on:input={() => dispatch('importTextChange', importText)}
        placeholder={"Иван Иванов\nМария Петрова\n..."}
        class="w-full h-20 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg resize-none bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300 block"></textarea>
      <div class="flex gap-2 mt-2">
        <button on:click={() => dispatch('toggleImport')}
          class="flex-1 py-1.5 border border-gray-200 text-gray-500 rounded-lg text-xs font-medium hover:bg-gray-50 transition-all">
          Отмена
        </button>
        <button on:click={() => dispatch('import')}
          class="flex-1 py-1.5 bg-indigo-500 text-white rounded-lg text-xs font-bold hover:bg-indigo-600 transition-all">
          Импорт
        </button>
      </div>
    </div>
  {/if}
</div>

<!-- Student list -->
<div class="flex-1 overflow-y-auto" style="scrollbar-width:thin; -webkit-overflow-scrolling:touch;"
  on:dragover|preventDefault
  on:drop={(e) => dispatch('unseatDrop', e)}>

  {#if mode === 'seat'}
    <div class="p-2 space-y-0.5">
      {#if unseatedList.length > 0}
        <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 pt-2 pb-1">
          Не рассажены · {unseatedList.length}
        </div>
        {#each unseatedList as s (s.id)}
          <div class="flex items-center gap-2 px-2.5 py-2 rounded-xl border transition-all select-none
            {mobileSelectedStudent === s.id
              ? 'bg-indigo-100 border-indigo-300 ring-1 ring-indigo-300 shadow-sm'
              : 'bg-white/70 border-white/60 hover:bg-white hover:border-gray-200 hover:shadow-sm'}
            {isMobile ? 'active:scale-95' : 'cursor-grab active:cursor-grabbing'}"
            draggable={!isMobile}
            on:dragstart={(e) => dispatch('studentDragStart', { e, id: s.id })}
            on:click={() => isMobile && dispatch('mobileSelect', s.id)}>
            <div class="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0 shadow-sm"
              style="background:{s.groupColor || '#6366f1'};">
              {ini(s.name)}
            </div>
            <span class="text-xs text-gray-700 truncate flex-1">{s.name}</span>
            <div class="flex gap-0.5 flex-shrink-0">
              {#each s.tags as tid}
                {@const tag = STUDENT_TAGS.find(t => t.id === tid)}
                {#if tag}<div class="w-2 h-2 rounded-full" style="background:{tag.color};" title={tag.label}></div>{/if}
              {/each}
            </div>
          </div>
        {/each}
      {:else if students.length > 0}
        <div class="py-4 text-center text-xs text-gray-400">Все ученики рассажены ✓</div>
      {/if}

      {#if seatedList.length > 0}
        <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 pt-3 pb-1">
          Рассажены · {seatedList.length}
        </div>
        {#each seatedList as s (s.id)}
          <div class="flex items-center gap-2 px-2.5 py-2 rounded-xl border border-gray-100/80 bg-gray-50/40 opacity-50
            {isMobile ? '' : 'cursor-grab'}"
            draggable={!isMobile}
            on:dragstart={(e) => dispatch('studentDragStart', { e, id: s.id })}>
            <div class="w-7 h-7 rounded-full bg-gray-300 text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0">
              {ini(s.name)}
            </div>
            <span class="text-xs text-gray-500 truncate">{s.name}</span>
          </div>
        {/each}
      {/if}
    </div>

  {:else}
    <!-- Edit / groups mode -->
    {#if students.length === 0}
      <div class="flex flex-col items-center justify-center py-10 text-gray-400 px-4 text-center">
        <svg class="w-8 h-8 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
        </svg>
        <p class="text-xs">Добавьте первого ученика</p>
      </div>
    {:else}
      <div class="p-2 space-y-0.5">
        {#each students as s (s.id)}
          <div class="group flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-white/80 transition-all {s.absent ? 'opacity-40' : ''}">
            <div class="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0 shadow-sm"
              style="background:{s.groupColor || '#94a3b8'};">
              {ini(s.name)}
            </div>
            <span class="text-xs text-gray-700 truncate flex-1 min-w-0">{s.name}</span>
            <!-- Tags -->
            <div class="flex gap-0.5 flex-shrink-0 items-center">
              {#each STUDENT_TAGS as tag}
                <button on:click={() => dispatch('toggleTag', { sid: s.id, tid: tag.id })}
                  class="w-3.5 h-3.5 rounded-full border transition-all {s.tags.includes(tag.id) ? 'scale-110' : 'opacity-20 hover:opacity-50'}"
                  style="background:{s.tags.includes(tag.id) ? tag.color : 'transparent'}; border-color:{tag.color};"
                  title={tag.label}></button>
              {/each}
            </div>
            <!-- Absent -->
            <button on:click={() => dispatch('toggleAbsent', s.id)}
              class="p-0.5 flex-shrink-0 rounded-lg transition-all {s.absent ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'}"
              title={s.absent ? 'Отметить присутствующим' : 'Отметить отсутствующим'}>
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
              </svg>
            </button>
            <!-- Remove -->
            <button on:click={() => dispatch('removeStudent', s.id)}
              class="p-0.5 flex-shrink-0 rounded-lg text-gray-300 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<!-- Groups summary (groups mode) -->
{#if mode === 'groups' && groups.length > 0}
  <div class="border-t flex-shrink-0 overflow-y-auto max-h-52" style="border-color:rgba(0,0,0,0.07); scrollbar-width:thin;">
    <div class="p-2.5">
      <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
        Группы · {groups.length}
      </div>
      <div class="space-y-1.5">
        {#each groups as group, gi}
          {@const gc = GROUP_COLORS[gi % GROUP_COLORS.length]}
          <div class="p-2 rounded-xl" style="background:{gc}12; border:1px solid {gc}35;">
            <div class="flex items-center gap-1.5 mb-1.5">
              <div class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background:{gc};"></div>
              <span class="text-[10px] font-bold" style="color:{gc};">Группа {gi + 1}</span>
              <span class="text-[9px] text-gray-400">· {group.length} чел.</span>
            </div>
            <div class="flex flex-wrap gap-1">
              {#each group as st}
                <span class="text-[9px] px-2 py-0.5 rounded-full text-white font-medium shadow-sm"
                  style="background:{gc};">{st.name}</span>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}
