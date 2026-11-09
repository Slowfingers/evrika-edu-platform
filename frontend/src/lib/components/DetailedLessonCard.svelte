<script>
  import TechniqueIcon from './TechniqueIcon.svelte';
  import { displayCardTitle } from '#lib/utils/design-labels.js';
  import { createEventDispatcher } from 'svelte';
  import { lang } from '#lib/stores/lang.js';
  import { localizeCard } from '#lib/utils/localization.js';
  import { getAgeGroupNames, getSkillNames, getStageNames, getTypeNames } from '#lib/utils/localization.js';
  import { formatTimeDisplay } from '#lib/utils/time-intervals.js';
  
  const dispatch = createEventDispatcher();
  
  export let card;
  export let index;
  $: lcard = localizeCard(card, $lang);
  
  function handleRemove() {
    dispatch('remove', card.id);
  }
  
  // Функции для получения названий
  function getAgeGroupNamesForCard(ageGroups, language) {
    if (!ageGroups || ageGroups.length === 0) return 'Не указано';
    return getAgeGroupNames(ageGroups, language);
  }
  
  function getSkillNamesForCard(skills, language) {
    if (!skills || skills.length === 0) return 'Не указано';
    return getSkillNames(skills, language);
  }
  
  function getStageNamesForCard(stages, language) {
    if (!stages || stages.length === 0) return 'Не указано';
    return getStageNames(stages, language);
  }
  
  function getTypeNamesForCard(types, language) {
    if (!types || types.length === 0) return 'Не указано';
    return getTypeNames(types, language);
  }
</script>

<div class="card !p-4">
  <div class="flex items-start justify-between gap-3 mb-3">
    <div class="flex items-center gap-3">
      <div class="relative flex-shrink-0"><TechniqueIcon id={card.id} size={46}/><span class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-purple-100 text-purple-800 text-[9px] grid place-items-center">{index}</span></div>
      <div>
        <h3 class="text-sm font-bold text-gray-900 leading-tight">{displayCardTitle(lcard.title)}</h3>
        <p class="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {formatTimeDisplay(card.timeMinutes, $lang)}
        </p>
      </div>
    </div>
    <button on:click={handleRemove}
      class="w-7 h-7 rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 flex items-center justify-center flex-shrink-0 transition-colors"
      title={$lang === "uz" ? "O‘chirish" : $lang === "en" ? "Remove" : "Удалить"}>
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </button>
  </div>

  {#if lcard.description}
    <p class="text-xs text-gray-600 leading-relaxed mb-3">{lcard.description}</p>
  {/if}

  {#if lcard.content}
    <div class="text-xs text-gray-600 leading-relaxed mb-3 p-3 rounded-xl bg-white/50">
      <div class="whitespace-pre-wrap">{lcard.content}</div>
    </div>
  {/if}

  <div class="flex flex-wrap gap-1.5">
    {#if card.ageGroups?.length > 0}
      <span class="badge-count !text-[10px] !bg-blue-500/70">{getAgeGroupNamesForCard(card.ageGroups, $lang)}</span>
    {/if}
    {#if card.skillIds?.length > 0}
      <span class="badge-count !text-[10px] !bg-green-500/70">{getSkillNamesForCard(card.skillIds, $lang)}</span>
    {/if}
    {#if card.stageIds?.length > 0}
      <span class="badge-count !text-[10px] !bg-purple-500/70">{getStageNamesForCard(card.stageIds, $lang)}</span>
    {/if}
    {#if card.typeIds?.length > 0}
      <span class="badge-count !text-[10px] !bg-amber-500/70">{getTypeNamesForCard(card.typeIds, $lang)}</span>
    {/if}
  </div>
</div>
