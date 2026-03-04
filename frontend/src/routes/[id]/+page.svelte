<script>
  import { onMount } from 'svelte';
  import { formatTimeDisplay } from '$lib/utils/time-intervals.js';
  import { cardsApi } from '$lib/api/cards.api.js';

  export let data;

  let card = null;
  let loading = true;
  let notFound = false;

  onMount(async () => {
    try {
      card = await cardsApi.getCardById(data.id);
      if (!card) notFound = true;
    } catch (err) {
      notFound = true;
    } finally {
      loading = false;
    }
  });

  // Маппинг ID возрастных групп в русские названия
  const ageGroupMapping = {
    // Русские ID
    'начальные-классы': 'Начальные классы (1-4)',
    'старшие-классы': 'Старшие классы (5-11)',
    // Обратная совместимость с английскими ID
    'primary': 'Начальные классы (1-4)',
    'secondary': 'Старшие классы (5-11)',
    'preschool': 'Дошкольники',
    'adult': 'Взрослые'
  };

  // Получение названий возрастных групп
  function getAgeGroupNames(ageGroups) {
    if (!ageGroups || ageGroups.length === 0) return 'Не указано';
    return ageGroups.map(group => {
      // Если group - это объект с полем name, используем его
      if (typeof group === 'object' && group.name) {
        return group.name;
      }
      // Если group - это строка (ID), переводим через маппинг
      return ageGroupMapping[group] || group;
    }).join(', ');
  }

  // Маппинг ID навыков в русские названия
  const skillMapping = {
    // Русские ID
    'критическое-мышление': 'Критическое мышление',
    'командная-работа': 'Командная работа',
    'рефлексия': 'Рефлексия',
    'креативное-мышление': 'Креативное мышление',
    'систематизация': 'Систематизация материала',
    'коммуникация': 'Коммуникативные навыки',
    // Обратная совместимость с английскими ID
    'critical': 'Критическое мышление',
    'teamwork': 'Командная работа',
    'reflection': 'Рефлексия',
    'creative': 'Креативное мышление',
    'systematization': 'Систематизация материала',
    'communication': 'Коммуникативные навыки'
  };

  // Получение названий навыков
  function getSkillNames(skills) {
    if (!skills || skills.length === 0) return 'Не указано';
    return skills.map(skill => {
      // Если skill - это объект с полем name, используем его
      if (typeof skill === 'object' && skill.name) {
        return skill.name;
      }
      // Если skill - это строка (ID), переводим через маппинг
      return skillMapping[skill] || skill;
    }).join(', ');
  }

  // Маппинг ID этапов урока в русские названия
  const stageMapping = {
    // Русские ID
    'начало-урока': 'Начало урока',
    'объяснение-нового-материала': 'Объяснение нового материала',
    'закрепление': 'Закрепление',
    'конец-урока': 'Конец урока',
    // Обратная совместимость со старыми русскими ID
    'мотивация': 'Мотивация',
    'объяснение': 'Объяснение',
    'практика': 'Практика',
    'рефлексия': 'Рефлексия',
    // Обратная совместимость с английскими ID
    'motivation': 'Мотивация',
    'explanation': 'Объяснение',
    'practice': 'Практика',
    'reflection': 'Рефлексия'
  };

  // Получение названий этапов урока
  function getStageNames(stages) {
    if (!stages || stages.length === 0) return 'Не указано';
    return stages.map(stage => {
      // Если stage - это объект с полем name, используем его
      if (typeof stage === 'object' && stage.name) {
        return stage.name;
      }
      // Если stage - это строка (ID), переводим через маппинг
      return stageMapping[stage] || stage;
    }).join(', ');
  }

  // Маппинг ID типов работы в русские названия
  const typeMapping = {
    // Русские ID
    'индивидуальная': 'Индивидуальная',
    'парная': 'Парная',
    'командная': 'Командная',
    'фронтальная': 'Фронтальная',
    // Обратная совместимость с английскими ID
    'individual': 'Индивидуальная',
    'pair': 'Парная',
    'team': 'Командная',
    'frontal': 'Фронтальная'
  };

  // Получение названий типов работы
  function getTypeNames(types) {
    if (!types || types.length === 0) return 'Не указано';
    return types.map(type => {
      // Если type - это объект с полем name, используем его
      if (typeof type === 'object' && type.name) {
        return type.name;
      }
      // Если type - это строка (ID), переводим через маппинг
      return typeMapping[type] || type;
    }).join(', ');
  }
</script>

<svelte:head>
  <title>{card ? `${card.title} | EvrikaEdu` : 'EvrikaEdu'}</title>
  {#if card}<meta name="description" content={card.description} />{/if}
</svelte:head>

{#if loading}
  <div class="max-w-3xl mx-auto pb-24 md:pb-8">
    <div class="card mb-4 animate-pulse">
      <div class="h-7 bg-gray-200/60 rounded-full w-3/4 mb-4"></div>
      <div class="h-4 bg-gray-200/60 rounded-full w-full mb-2"></div>
      <div class="h-4 bg-gray-200/60 rounded-full w-5/6"></div>
    </div>
    <div class="flex gap-3 mb-4">
      {#each Array(4) as _}
        <div class="card flex-shrink-0 !p-3 !rounded-2xl min-w-[120px] h-16 animate-pulse">
          <div class="h-2 bg-gray-200/60 rounded-full w-1/2 mb-2"></div>
          <div class="h-3 bg-gray-200/60 rounded-full w-3/4"></div>
        </div>
      {/each}
    </div>
    <div class="card animate-pulse h-48"></div>
  </div>
{:else if notFound}
  <div class="max-w-3xl mx-auto text-center py-16">
    <p class="text-gray-500 mb-4">Приём не найден</p>
    <a href="/" class="btn btn-secondary">← Назад к каталогу</a>
  </div>
{:else if card}
<div class="max-w-3xl mx-auto pb-24 md:pb-8">

  <!-- Заголовок и бейдж времени -->
  <div class="card mb-4">
    <div class="flex items-start justify-between gap-4 mb-4">
      <h1 class="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{card.title}</h1>
      <span class="badge-count flex-shrink-0 mt-1">
        {formatTimeDisplay(card.time_minutes)}
      </span>
    </div>
    <p class="text-gray-600 leading-relaxed">{card.description}</p>
  </div>

  <!-- Метаданные — компактные табы -->
  <div class="card mb-4 !p-4">
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
      <!-- Возраст -->
      <div class="flex items-start gap-2">
        <div class="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
          <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
        <div class="min-w-0">
          <p class="text-[10px] text-gray-400 uppercase tracking-wide">Возраст</p>
          <p class="text-xs text-gray-800 font-medium leading-snug">{getAgeGroupNames(card.age_groups)}</p>
        </div>
      </div>
      <!-- Навыки -->
      <div class="flex items-start gap-2">
        <div class="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
          <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
          </svg>
        </div>
        <div class="min-w-0">
          <p class="text-[10px] text-gray-400 uppercase tracking-wide">Навыки</p>
          <p class="text-xs text-gray-800 font-medium leading-snug">{getSkillNames(card.skills)}</p>
        </div>
      </div>
      <!-- Этап урока -->
      <div class="flex items-start gap-2">
        <div class="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
          <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
        </div>
        <div class="min-w-0">
          <p class="text-[10px] text-gray-400 uppercase tracking-wide">Этап</p>
          <p class="text-xs text-gray-800 font-medium leading-snug">{getStageNames(card.stages)}</p>
        </div>
      </div>
      <!-- Тип работы -->
      <div class="flex items-start gap-2">
        <div class="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
          <svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
          </svg>
        </div>
        <div class="min-w-0">
          <p class="text-[10px] text-gray-400 uppercase tracking-wide">Тип</p>
          <p class="text-xs text-gray-800 font-medium leading-snug">{getTypeNames(card.types)}</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Содержание приёма -->
  <div class="card overflow-hidden">
    <h2 class="text-lg font-bold mb-4 text-gray-900">Содержание приёма</h2>

    {#if card.content}
      <div class="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm md:text-base overflow-hidden break-words max-w-full">
        {card.content}
      </div>
    {:else}
      <p class="text-gray-400 italic text-sm">Содержание пока не добавлено</p>
    {/if}

    {#if card.file_url}
      <div class="mt-6 pt-5 border-t border-gray-100">
        <a href={card.file_url} download class="btn btn-primary inline-flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          Скачать материалы
        </a>
      </div>
    {/if}
  </div>

</div>
{/if}
