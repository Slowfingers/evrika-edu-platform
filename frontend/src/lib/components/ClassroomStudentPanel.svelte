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
  export let groups = [];
  export let STUDENT_TAGS = [];
  export let GROUP_COLORS = [];

  const dispatch = createEventDispatcher();

  function unseated() {
    const s = new Set(Object.values(seating));
    return students.filter(st => !s.has(st.id) && !st.absent);
  }
</script>

<div class="p-3 border-b flex-shrink-0" style="border-color:rgba(0,0,0,0.06);">
  <div class="flex items-center justify-between mb-2">
    <h3 class="text-sm font-semibold text-gray-800">Ученики ({students.length})</h3>
    <button on:click={() => dispatch('toggleImport')} class="p-1 rounded text-gray-400 hover:text-gray-600 transition-colors" title="Импорт">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
    </button>
  </div>
  <form on:submit|preventDefault={() => dispatch('addStudent')} class="flex gap-1">
    <input bind:value={newStudentName} on:input={() => dispatch('nameChange', newStudentName)} placeholder="Имя ученика..." class="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white bg-opacity-70 focus:outline-none focus:ring-1 focus:ring-indigo-300" />
    <button type="submit" class="px-2.5 py-1.5 bg-indigo-500 text-white rounded-lg text-xs font-medium hover:bg-indigo-600">+</button>
  </form>
  {#if showImport}
    <div class="mt-2 p-2 bg-white bg-opacity-50 rounded-lg">
      <textarea bind:value={importText} on:input={() => dispatch('importTextChange', importText)} placeholder="Список имён (каждое с новой строки)..." class="w-full h-16 px-2 py-1.5 text-xs border border-gray-200 rounded-lg resize-none bg-white bg-opacity-70 focus:outline-none focus:ring-1 focus:ring-indigo-300"></textarea>
      <button on:click={() => dispatch('import')} class="mt-1 w-full py-1.5 bg-indigo-500 text-white rounded-lg text-xs font-medium hover:bg-indigo-600">Импортировать</button>
    </div>
  {/if}
</div>

<div class="flex-1 overflow-y-auto p-2 space-y-1" style="scrollbar-width:thin; -webkit-overflow-scrolling:touch;" on:dragover|preventDefault on:drop={(e) => dispatch('unseatDrop', e)}>
  {#if mode === 'seat'}
    {@const uns = unseated()}
    {#if uns.length > 0}
      <div class="text-[10px] font-medium text-gray-400 uppercase tracking-wider px-1 mb-1">Не рассажены ({uns.length})</div>
      {#each uns as s (s.id)}
        <div
          class="flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all {mobileSelectedStudent === s.id ? 'bg-indigo-100 border-indigo-300 ring-1 ring-indigo-300' : 'bg-indigo-50 bg-opacity-80 border-indigo-100'} {isMobile ? 'active:scale-95' : 'cursor-grab active:cursor-grabbing'}"
          draggable={!isMobile}
          on:dragstart={(e) => dispatch('studentDragStart', { e, id: s.id })}
          on:click={() => dispatch('mobileSelect', s.id)}
        >
          <div class="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0">{s.name.split(' ').map(w => w[0]).join('').slice(0,2)}</div>
          <span class="text-xs text-gray-700 truncate">{s.name}</span>
          {#each s.tags as tid}
            {@const tag = STUDENT_TAGS.find(t => t.id === tid)}
            {#if tag}<div class="w-2 h-2 rounded-full flex-shrink-0" style="background:{tag.color};" title={tag.label}></div>{/if}
          {/each}
        </div>
      {/each}
    {/if}
    {@const seatedIds = new Set(Object.values(seating))}
    {@const seated = students.filter(s => seatedIds.has(s.id))}
    {#if seated.length > 0}
      <div class="text-[10px] font-medium text-gray-400 uppercase tracking-wider px-1 mt-2 mb-1">Рассажены ({seated.length})</div>
      {#each seated as s (s.id)}
        <div class="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50 bg-opacity-60 border border-gray-100 opacity-50 {isMobile ? '' : 'cursor-grab'}" draggable={!isMobile} on:dragstart={(e) => dispatch('studentDragStart', { e, id: s.id })}>
          <div class="w-6 h-6 rounded-full bg-gray-400 text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0">{s.name.split(' ').map(w => w[0]).join('').slice(0,2)}</div>
          <span class="text-xs text-gray-500 truncate">{s.name}</span>
        </div>
      {/each}
    {/if}
  {:else}
    {#each students as s (s.id)}
      <div class="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-white hover:bg-opacity-50 transition-colors group {s.absent ? 'opacity-40' : ''}">
        <div class="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0">{s.name.split(' ').map(w => w[0]).join('').slice(0,2)}</div>
        <span class="text-xs text-gray-700 truncate flex-1">{s.name}</span>
        <div class="flex gap-0.5 flex-shrink-0">
          {#each STUDENT_TAGS as tag}
            <button on:click={() => dispatch('toggleTag', { sid: s.id, tid: tag.id })} class="w-3.5 h-3.5 rounded-full border transition-all {s.tags.includes(tag.id) ? 'scale-110' : 'opacity-25 hover:opacity-60'}" style="background:{s.tags.includes(tag.id) ? tag.color : 'transparent'}; border-color:{tag.color};" title={tag.label}></button>
          {/each}
        </div>
        <button on:click={() => dispatch('toggleAbsent', s.id)} class="p-0.5 rounded transition-colors flex-shrink-0 {s.absent ? 'text-red-400' : 'text-gray-300 hover:text-gray-500'}" title={s.absent ? 'Присутствует' : 'Отсутствует'}>
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
        </button>
        <button on:click={() => dispatch('removeStudent', s.id)} class="p-0.5 rounded text-gray-300 hover:text-red-500 transition-colors md:opacity-0 md:group-hover:opacity-100 flex-shrink-0">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
    {/each}
  {/if}
</div>

{#if mode === 'groups' && groups.length > 0}
  <div class="border-t p-3 overflow-y-auto max-h-40 flex-shrink-0" style="border-color:rgba(0,0,0,0.06); scrollbar-width:thin;">
    <h4 class="text-xs font-semibold text-gray-600 mb-2">Группы ({groups.length})</h4>
    <div class="space-y-1.5">
      {#each groups as group, gi}
        <div class="p-2 rounded-lg" style="border:1px solid {GROUP_COLORS[gi % GROUP_COLORS.length]}30; background:{GROUP_COLORS[gi % GROUP_COLORS.length]}0a;">
          <div class="flex items-center gap-1 mb-1">
            <div class="w-2.5 h-2.5 rounded-full" style="background:{GROUP_COLORS[gi % GROUP_COLORS.length]};"></div>
            <span class="text-[10px] font-bold text-gray-600">Группа {gi + 1}</span>
          </div>
          <div class="flex flex-wrap gap-1">
            {#each group as st}
              <span class="text-[9px] px-1.5 py-0.5 rounded-full text-white font-medium" style="background:{GROUP_COLORS[gi % GROUP_COLORS.length]};">{st.name}</span>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}
