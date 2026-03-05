<script>
  import { createEventDispatcher } from 'svelte';
  import { getSkillNames, getStageNames, getTypeNames } from '$lib/utils/localization.js';
  import { formatTimeDisplay } from '$lib/utils/time-intervals.js';
  const dispatch = createEventDispatcher();
  export let card;
  export let isSelected = false;
  function handleAdd() { dispatch('add', card); }
  function handleRemove() { dispatch('remove', card.id); }
  const gradients = [
    'linear-gradient(135deg, rgba(224,195,252,0.4), rgba(142,197,252,0.4))',
    'linear-gradient(135deg, rgba(142,197,252,0.4), rgba(168,237,234,0.4))',
    'linear-gradient(135deg, rgba(168,237,234,0.4), rgba(254,214,227,0.4))',
    'linear-gradient(135deg, rgba(254,214,227,0.4), rgba(255,209,163,0.4))',
    'linear-gradient(135deg, rgba(255,209,163,0.4), rgba(224,195,252,0.4))',
  ];
  const gradient = gradients[Math.floor(Math.random() * gradients.length)];
</script>

<div class="card-modern group flex flex-col h-full no-select {isSelected ? 'ring-2 ring-purple-300' : ''}" style="background: {gradient};">
  <div class="flex items-center justify-between mb-3">
    <div class="icon-box">
      <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
      </svg>
    </div>
    <span class="badge-count">{formatTimeDisplay(card.timeMinutes || card.time_minutes)}</span>
  </div>
  <h3 class="text-base font-bold text-gray-900 mb-1 line-clamp-2">{card.title}</h3>
  {#if card.description}
    <p class="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">{card.description}</p>
  {/if}
  <div class="flex flex-wrap gap-1.5 mb-3">
    {#if card.skillIds?.length}
      {#each card.skillIds.slice(0,2) as id}
        <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-200/50 text-green-900">{getSkillNames([id])}</span>
      {/each}
    {/if}
    {#if card.stageIds?.length}
      {#each card.stageIds.slice(0,2) as id}
        <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-200/50 text-teal-900">{getStageNames([id])}</span>
      {/each}
    {/if}
    {#if card.typeIds?.length}
      {#each card.typeIds.slice(0,2) as id}
        <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-200/50 text-purple-900">{getTypeNames([id])}</span>
      {/each}
    {/if}
  </div>
  <div class="mt-auto">
    {#if isSelected}
      <button on:click={handleRemove} class="btn btn-secondary !py-2 !px-4 !text-xs w-full !text-red-700">
        <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        Убрать
      </button>
    {:else}
      <button on:click={handleAdd} class="btn btn-primary !py-2 !px-4 !text-xs w-full">
        <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
        Добавить
      </button>
    {/if}
  </div>
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
