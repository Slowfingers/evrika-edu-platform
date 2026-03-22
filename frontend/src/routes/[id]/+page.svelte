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
    <div class="glass-card mb-4 animate-pulse">
      <div class="h-7 bg-white/40 rounded-full w-3/4 mb-4"></div>
      <div class="h-4 bg-white/40 rounded-full w-full mb-2"></div>
      <div class="h-4 bg-white/40 rounded-full w-5/6"></div>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      {#each Array(4) as _}
        <div class="glass-card-sm animate-pulse">
          <div class="h-2 bg-white/40 rounded-full w-1/2 mb-2"></div>
          <div class="h-3 bg-white/40 rounded-full w-3/4"></div>
        </div>
      {/each}
    </div>
    <div class="glass-card animate-pulse h-48"></div>
  </div>
{:else if notFound}
  <div class="max-w-3xl mx-auto text-center py-16">
    <div class="glass-card inline-block">
      <p class="text-gray-700 font-medium mb-4">Приём не найден</p>
      <a href="/" class="btn btn-secondary">← Назад к каталогу</a>
    </div>
  </div>
{:else if card}
<div class="max-w-3xl mx-auto pb-24 md:pb-8">

  <!-- Кнопка назад -->
  <a href="/" class="inline-flex items-center gap-2 text-purple-700 hover:text-purple-900 font-medium mb-4 transition-colors group">
    <svg class="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
    </svg>
    Назад к каталогу
  </a>

  <!-- Заголовок и бейдж времени -->
  <div class="glass-card mb-4">
    <div class="flex items-start justify-between gap-4 mb-4">
      <h1 class="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{card.title}</h1>
      <span class="glass-badge flex-shrink-0 mt-1">
        <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        {formatTimeDisplay(card.time_minutes)}
      </span>
    </div>
    <p class="text-gray-600 leading-relaxed text-base">{card.description}</p>
  </div>

  <!-- Метаданные — glassmorphism карточки -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
    <!-- Возраст -->
    <div class="glass-card-sm group hover:scale-[1.02] transition-transform">
      <div class="flex items-center gap-2 mb-2">
        <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400/30 to-blue-500/20 flex items-center justify-center backdrop-blur-sm border border-blue-200/50">
          <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
        <p class="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Возраст</p>
      </div>
      <p class="text-sm text-gray-800 font-medium leading-snug">{getAgeGroupNames(card.age_groups)}</p>
    </div>
    <!-- Навыки -->
    <div class="glass-card-sm group hover:scale-[1.02] transition-transform">
      <div class="flex items-center gap-2 mb-2">
        <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-green-400/30 to-green-500/20 flex items-center justify-center backdrop-blur-sm border border-green-200/50">
          <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
          </svg>
        </div>
        <p class="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Навыки</p>
      </div>
      <p class="text-sm text-gray-800 font-medium leading-snug">{getSkillNames(card.skills)}</p>
    </div>
    <!-- Этап урока -->
    <div class="glass-card-sm group hover:scale-[1.02] transition-transform">
      <div class="flex items-center gap-2 mb-2">
        <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-400/30 to-purple-500/20 flex items-center justify-center backdrop-blur-sm border border-purple-200/50">
          <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
        </div>
        <p class="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Этап</p>
      </div>
      <p class="text-sm text-gray-800 font-medium leading-snug">{getStageNames(card.stages)}</p>
    </div>
    <!-- Тип работы -->
    <div class="glass-card-sm group hover:scale-[1.02] transition-transform">
      <div class="flex items-center gap-2 mb-2">
        <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400/30 to-amber-500/20 flex items-center justify-center backdrop-blur-sm border border-amber-200/50">
          <svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
          </svg>
        </div>
        <p class="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Тип</p>
      </div>
      <p class="text-sm text-gray-800 font-medium leading-snug">{getTypeNames(card.types)}</p>
    </div>
  </div>

  <!-- Содержание приёма -->
  <div class="glass-card overflow-hidden">
    <div class="flex items-center gap-3 mb-5">
      <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-400/30 to-pink-400/20 flex items-center justify-center backdrop-blur-sm border border-purple-200/50">
        <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
      </div>
      <h2 class="text-lg font-bold text-gray-900">Содержание приёма</h2>
    </div>

    {#if card.content}
      <div class="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm md:text-base overflow-hidden break-words max-w-full bg-white/30 rounded-2xl p-4 md:p-5 border border-white/50">
        {card.content}
      </div>
    {:else}
      <p class="text-gray-600 font-medium italic text-sm bg-white/30 rounded-2xl p-4 border border-white/50">Содержание пока не добавлено</p>
    {/if}

    {#if card.file_url}
      <div class="mt-6 pt-5 border-t border-white/30">
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

<style>
  .glass-card {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.8);
    box-shadow: 0 8px 32px rgba(200, 168, 233, 0.15);
    padding: 1.5rem;
  }

  .glass-card-sm {
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-radius: 1.25rem;
    border: 1px solid rgba(255, 255, 255, 0.7);
    box-shadow: 0 4px 20px rgba(200, 168, 233, 0.1);
    padding: 1rem;
  }

  .glass-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-radius: 1rem;
    border: 1px solid rgba(200, 168, 233, 0.3);
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: #6b21a8;
  }
</style>
