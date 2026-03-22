<script>
  import { onMount } from 'svelte';
  import { cardsApi } from '$lib/api/cards.api.js';
  import { metadataApi } from '$lib/api/metadata.api.js';
  import CardItem from '$lib/components/CardItem.svelte';
  import FilterPanel from '$lib/components/FilterPanel.svelte';
  import { convertRussianToEnglishId } from '$lib/utils/localization.js';

  let cards = [];
  let ageGroups = [];
  let skills = [];
  let stages = [];
  let types = [];
  let loading = true;
  let error = null;

  // Фильтры
  let selectedAgeGroups = [];
  let selectedSkills = [];
  let selectedStages = [];
  let selectedTypes = [];
  let selectedTimeRange = '';
  let searchQuery = '';
  
  // Состояние спойлера фильтров для мобильных устройств
  let filtersExpanded = false;

  // Пагинация
  let currentPage = 1;
  let totalCards = 0;
  const cardsPerPage = 12;

  // Предопределенные данные с русскими ID
  const predefinedAgeGroups = [
    { id: 'начальные-классы', name: 'Начальные классы (1-4)' },
    { id: 'старшие-классы', name: 'Старшие классы (5-11)' }
  ];

  const predefinedSkills = [
    { id: 'критическое-мышление', name: 'Критическое мышление' },
    { id: 'командная-работа', name: 'Командная работа' },
    { id: 'рефлексия', name: 'Рефлексия' },
    { id: 'креативное-мышление', name: 'Креативное мышление' },
    { id: 'систематизация', name: 'Систематизация материала' },
    { id: 'коммуникация', name: 'Коммуникативные навыки' }
  ];

  const predefinedStages = [
    { id: 'начало-урока', name: 'Начало урока' },
    { id: 'объяснение-нового-материала', name: 'Объяснение нового материала' },
    { id: 'закрепление', name: 'Закрепление' },
    { id: 'конец-урока', name: 'Конец урока' }
  ];

  const predefinedTypes = [
    { id: 'индивидуальная', name: 'Индивидуальная' },
    { id: 'парная', name: 'Парная' },
    { id: 'командная', name: 'Командная' },
    { id: 'фронтальная', name: 'Фронтальная' }
  ];

  const timeRanges = [
    { id: 'up-to-2', name: 'до 2 минут' },
    { id: '3-5', name: '3-5 минут' },
    { id: '5-10', name: '5-10 минут' },
    { id: '15-20', name: '15-20 минут' },
    { id: '25-30', name: '25-30 минут' },
    { id: 'full-lesson', name: 'весь урок' }
  ];

  // Функция convertRussianToEnglishId теперь импортируется из localization.js

  onMount(async () => {
    await loadMetadata();
  });

  async function loadMetadata() {
    // Используем предопределенные данные вместо загрузки из API
    ageGroups = predefinedAgeGroups;
    skills = predefinedSkills;
    stages = predefinedStages;
    types = predefinedTypes;

  }

  async function loadCards() {
    loading = true;
    error = null;

    try {
      // Отправляем фильтры как есть — в базе уже русские значения
      const filters = {
        ageGroupIds: selectedAgeGroups && selectedAgeGroups.length > 0 ? selectedAgeGroups : undefined,
        skillIds: selectedSkills && selectedSkills.length > 0 ? selectedSkills : undefined,
        stageIds: selectedStages && selectedStages.length > 0 ? selectedStages : undefined,
        typeIds: selectedTypes && selectedTypes.length > 0 ? selectedTypes : undefined,
        timeRange: selectedTimeRange || undefined,
        search: searchQuery || undefined,
        limit: cardsPerPage,
        offset: (currentPage - 1) * cardsPerPage
      };

// Отправляем фильтры на backend
      const response = await cardsApi.getAllCards(filters);

      if (response.success) {
        cards = response.data;
        totalCards = response.total;
      }
    } catch (err) {
      error = err.message;
      console.error('Error loading cards:', err);
    } finally {
      loading = false;
    }
  }

  // Обработчики для поиска и очистки фильтров
  let searchTimeout;

  function handleSearch() {
    currentPage = 1;
    loadCards();
  }

  // Реактивный поиск с debounce
  $: {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      if (ageGroups.length > 0) {
        currentPage = 1;
        loadCards();
      }
    }, 300);
    searchQuery;
  }

  function clearFilters() {
    selectedAgeGroups = [];
    selectedSkills = [];
    selectedStages = [];
    selectedTypes = [];
    selectedTimeRange = '';
    searchQuery = '';
    currentPage = 1;
    loadCards();
  }

  // Реактивность для фильтров
  $: hasActiveFilters = 
    (selectedAgeGroups && selectedAgeGroups.length > 0) || 
    (selectedSkills && selectedSkills.length > 0) || 
    (selectedStages && selectedStages.length > 0) || 
    (selectedTypes && selectedTypes.length > 0) || 
    !!selectedTimeRange || 
    !!searchQuery;

  $: {
    // Перезагружаем карточки при любом изменении фильтров (кроме поиска)
    if (ageGroups.length > 0) {
      currentPage = 1;
      loadCards();
    }
    // Зависимости для реактивности
    selectedAgeGroups; selectedSkills; selectedStages; selectedTypes; selectedTimeRange;
  }

  // Пагинация
  $: totalPages = Math.ceil(totalCards / cardsPerPage);

  function goToPage(page) {
    currentPage = page;
    loadCards();
  }
</script>

<svelte:head>
  <title>Каталог педагогических приемов — EvrikaEdu</title>
</svelte:head>

<!-- Мобильная шторка фильтров -->
{#if filtersExpanded}
  <div class="fixed inset-0 z-40 md:hidden">
    <button class="absolute inset-0 bg-black/30 backdrop-blur-sm w-full h-full" on:click={() => filtersExpanded = false} aria-label="Закрыть фильтры"></button>
    <div class="absolute bottom-20 left-0 right-0 rounded-3xl mx-3 max-h-[70vh] flex flex-col" style="background: rgba(255,255,255,0.95); backdrop-filter: blur(20px); box-shadow: 0 -4px 30px rgba(200,168,233,0.15);">
      <div class="flex items-center justify-between p-6 pb-4">
        <h2 class="text-lg font-bold text-purple-900">Фильтры</h2>
        <button on:click={() => filtersExpanded = false} class="p-2 rounded-full hover:bg-purple-50">
          <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      <div class="flex-1 overflow-y-auto px-6 pb-4">
        <div class="space-y-6">
          <FilterPanel
            {ageGroups} {skills} {stages} {types} {timeRanges}
            bind:selectedAgeGroups bind:selectedSkills bind:selectedStages
            bind:selectedTypes bind:selectedTimeRange
          />
        </div>
      </div>
      <div class="p-3 flex gap-2 border-t border-purple-100/50" style="background: rgba(255,255,255,0.9);">
        <button on:click={() => { clearFilters(); filtersExpanded = false; }} class="btn btn-secondary !px-4 !py-2 text-sm">
          <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
          Сбросить
        </button>
        <button on:click={() => filtersExpanded = false} class="btn btn-primary flex-1 !py-2 text-sm">
          <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          Применить
        </button>
      </div>
    </div>
  </div>
{/if}

<div class="flex gap-6 items-start">

  <!-- Сайдбар с фильтрами (только десктоп) -->
  <aside class="hidden md:flex flex-col gap-4 w-64 flex-shrink-0 sticky top-24">
    <div class="card-modern !p-5">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-bold text-purple-900">Фильтры</h2>
        {#if hasActiveFilters}
          <button on:click={clearFilters} class="text-xs text-purple-700 font-bold hover:text-purple-900 transition-colors">
          Сбросить
        </button>
        {/if}
      </div>
      <div class="space-y-6">
        <FilterPanel
          {ageGroups} {skills} {stages} {types} {timeRanges}
          bind:selectedAgeGroups bind:selectedSkills bind:selectedStages
          bind:selectedTypes bind:selectedTimeRange
        />
      </div>
    </div>
  </aside>

  <!-- Основной контент -->
  <div class="flex-1 min-w-0">

    <!-- Поиск + мобильная кнопка фильтров -->
    <div class="flex gap-3 mb-6">
      <div class="relative flex-1">
        <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Поиск приемов..."
          class="input pl-10"
          on:keydown={(e) => e.key === 'Enter' && handleSearch()}
        />
      </div>
      <!-- Кнопка фильтров — только на мобильных -->
      <button
        on:click={() => filtersExpanded = true}
        class="md:hidden btn btn-secondary relative flex-shrink-0 px-4"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"></path>
        </svg>
        {#if hasActiveFilters}
          <span class="absolute -top-1 -right-1 w-4 h-4 bg-gray-900 rounded-full text-white text-[10px] flex items-center justify-center">
            {[...selectedAgeGroups, ...selectedSkills, ...selectedStages, ...selectedTypes].length + (selectedTimeRange ? 1 : 0)}
          </span>
        {/if}
      </button>
    </div>

    <!-- Счётчик результатов -->
    <div class="flex items-center justify-between mb-4">
      <p class="text-sm font-bold text-gray-700">
        {#if loading}Загрузка...{:else}{totalCards} приемов{/if}
      </p>
      <!-- Активные теги фильтров -->
      {#if hasActiveFilters}
        <button on:click={clearFilters} class="text-xs text-gray-700 font-bold hover:text-indigo-600 md:hidden transition-colors">
          Сбросить всё
        </button>
      {/if}
    </div>

    <!-- Карточки -->
    {#if loading}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each Array(6) as _}
          <div class="card-modern animate-pulse !p-6 h-48">
            <div class="h-4 bg-gray-200/60 rounded-full w-3/4 mb-3"></div>
            <div class="h-3 bg-gray-200/60 rounded-full w-full mb-2"></div>
            <div class="h-3 bg-gray-200/60 rounded-full w-5/6"></div>
          </div>
        {/each}
      </div>
    {:else if error}
      <div class="card text-center py-12">
        <p class="text-gray-600 mb-4">Ошибка: {error}</p>
        <button on:click={loadCards} class="btn btn-primary">Повторить</button>
      </div>
    {:else if cards.length === 0}
      <div class="card text-center py-16">
        <svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <p class="text-gray-700 font-medium mb-4">Ничего не найдено</p>
        <button on:click={clearFilters} class="btn btn-secondary">Сбросить фильтры</button>
      </div>
    {:else}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {#each cards as card (card.id)}
          <CardItem {card} />
        {/each}
      </div>

      {#if totalPages > 1}
        <div class="flex justify-center items-center gap-1.5 md:gap-2 pb-24 md:pb-8">
          <!-- Кнопка назад -->
          <button
            on:click={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            class="w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2 rounded-xl flex items-center justify-center btn btn-secondary disabled:opacity-40"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          
          <!-- Мобильная версия: текущая/всего -->
          <div class="flex md:hidden items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-xl border border-white/50">
            <span class="text-sm font-bold text-purple-700">{currentPage}</span>
            <span class="text-gray-400">/</span>
            <span class="text-sm text-gray-600">{totalPages}</span>
          </div>
          
          <!-- Десктоп версия: все страницы -->
          <div class="hidden md:flex items-center gap-1.5">
            {#if totalPages <= 7}
              {#each Array(totalPages) as _, i}
                <button
                  on:click={() => goToPage(i + 1)}
                  class="btn {currentPage === i + 1 ? 'btn-primary' : 'btn-secondary'} !px-4 !py-2"
                >
                  {i + 1}
                </button>
              {/each}
            {:else}
              <!-- Первая страница -->
              <button on:click={() => goToPage(1)} class="btn {currentPage === 1 ? 'btn-primary' : 'btn-secondary'} !px-4 !py-2">1</button>
              
              {#if currentPage > 3}
                <span class="px-2 text-gray-400">...</span>
              {/if}
              
              <!-- Страницы вокруг текущей -->
              {#each Array(totalPages) as _, i}
                {#if i + 1 > 1 && i + 1 < totalPages && Math.abs(i + 1 - currentPage) <= 1}
                  <button on:click={() => goToPage(i + 1)} class="btn {currentPage === i + 1 ? 'btn-primary' : 'btn-secondary'} !px-4 !py-2">{i + 1}</button>
                {/if}
              {/each}
              
              {#if currentPage < totalPages - 2}
                <span class="px-2 text-gray-400">...</span>
              {/if}
              
              <!-- Последняя страница -->
              <button on:click={() => goToPage(totalPages)} class="btn {currentPage === totalPages ? 'btn-primary' : 'btn-secondary'} !px-4 !py-2">{totalPages}</button>
            {/if}
          </div>
          
          <!-- Кнопка вперёд -->
          <button
            on:click={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            class="w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2 rounded-xl flex items-center justify-center btn btn-secondary disabled:opacity-40"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      {/if}
    {/if}

  </div>
</div>

