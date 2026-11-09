<script>
  import TechniqueIcon from './TechniqueIcon.svelte';
  import { displayCardTitle } from '#lib/utils/design-labels.js';
  import { createEventDispatcher } from 'svelte';
  import { getSkillNames, getStageNames, getTypeNames, localizeCard } from '#lib/utils/localization.js';
  import { formatTimeDisplay } from '#lib/utils/time-intervals.js';
  import { t, lang } from '#lib/stores/lang.js';
  const dispatch = createEventDispatcher();
  export let card;
  export let isSelected = false;

  $: lcard = localizeCard(card, $lang);
  function handleAdd() { dispatch('add', card); }
  function handleRemove() { dispatch('remove', card.id); }
</script>

<div class="card-modern group flex flex-col h-full no-select {isSelected ? 'ring-2 ring-purple-300' : ''}" style="background: linear-gradient(140deg,#fff,#f5edfe);">
  <div class="flex items-center justify-between mb-3">
    <TechniqueIcon id={card.id} size={58}/>
    <span class="badge-count">{formatTimeDisplay(card.timeMinutes || card.time_minutes, $lang)}</span>
  </div>
  <h3 class="text-base font-bold text-gray-900 mb-1 line-clamp-2">{displayCardTitle(lcard.title)}</h3>
  {#if lcard.description}
    <p class="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">{lcard.description}</p>
  {/if}
  <div class="flex flex-wrap gap-1.5 mb-3">
    {#if card.skillIds?.length}
      {#each card.skillIds.slice(0,2) as id}
        <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-200/50 text-green-900">{getSkillNames([id], $lang)}</span>
      {/each}
    {/if}
    {#if card.stageIds?.length}
      {#each card.stageIds.slice(0,2) as id}
        <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-200/50 text-teal-900">{getStageNames([id], $lang)}</span>
      {/each}
    {/if}
    {#if card.typeIds?.length}
      {#each card.typeIds.slice(0,2) as id}
        <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-200/50 text-purple-900">{getTypeNames([id], $lang)}</span>
      {/each}
    {/if}
  </div>
  <div class="mt-auto">
    {#if isSelected}
      <button on:click={handleRemove} class="btn btn-secondary !py-2 !px-4 !text-xs w-full !text-red-700">
        <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        {$t('wiz_remove')}
      </button>
    {:else}
      <button on:click={handleAdd} class="btn btn-primary !py-2 !px-4 !text-xs w-full">
        <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
        {$t('wiz_add')}
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
