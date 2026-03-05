<script>
  import { createEventDispatcher } from 'svelte';
  import { slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import ConstructorCard from './ConstructorCard.svelte';
  import DetailedLessonCard from './DetailedLessonCard.svelte';
  import { formatTimeDisplay } from '$lib/utils/time-intervals.js';
  import { exportLessonToPDF } from '$lib/utils/pdf-export.js';

  const dispatch = createEventDispatcher();

  // Состояние wizard'а
  let currentStep = 1;
  const totalSteps = 3;

  // Данные урока
  let lessonData = {
    subject: '',
    grade: '',
    topic: '',
    description: '',
    goals: '',
    selectedCards: [],
    totalTime: 0,
    lessonStages: {
      'начало-урока': { cards: [], totalTime: 0 },
      'объяснение-нового-материала': { cards: [], totalTime: 0 },
      'закрепление': { cards: [], totalTime: 0 },
      'конец-урока': { cards: [], totalTime: 0 }
    }
  };

  // Каталог карточек
  export let catalogCards = [];
  export let isLoading = false;

  // Поиск и фильтрация
  let searchQuery = '';
  
  // Текущий выбранный этап урока для добавления карточек
  let currentLessonStage = 'начало-урока';
  
  // Названия этапов урока для отображения
  const lessonStageNames = {
    'начало-урока': 'Начало урока',
    'объяснение-нового-материала': 'Объяснение нового материала',
    'закрепление': 'Закрепление',
    'конец-урока': 'Конец урока'
  };
  let timeFilter = 'all'; // all, short (до 15 мин), medium (15-30 мин), long (30+ мин)
  let selectedAgeGroups = [];
  let selectedSkills = [];
  let selectedStages = [];
  let selectedTypes = [];
  let showFilters = false;
  let filteredCards = [];
  
  // Управление этапами урока на втором шаге
  let showStageCards = {}; // Для отображения карточек каждого этапа
  
  // Предопределенные данные для фильтров (как в каталоге)
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
    { id: 'индивидуальная', name: 'Индивидуальная работа' },
    { id: 'парная', name: 'Парная работа' },
    { id: 'групповая', name: 'Групповая работа' },
    { id: 'фронтальная', name: 'Фронтальная работа' }
  ];

  // Улучшенная фильтрация карточек с расширенными фильтрами
  $: {
    let filtered = catalogCards;
    
    // Фильтр по поисковому запросу
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(card => 
        card.title?.toLowerCase().includes(query) ||
        card.description?.toLowerCase().includes(query) ||
        card.content?.toLowerCase().includes(query)
      );
    }
    
    // Фильтр по времени
    if (timeFilter !== 'all') {
      filtered = filtered.filter(card => {
        const time = card.timeMinutes || card.time_minutes || 0;
        switch (timeFilter) {
          case 'short': return time <= 15;
          case 'medium': return time > 15 && time <= 30;
          case 'long': return time > 30;
          default: return true;
        }
      });
    }
    
    // Фильтр по возрастным группам
    if (selectedAgeGroups.length > 0) {
      filtered = filtered.filter(card => {
        if (!card.ageGroups || !Array.isArray(card.ageGroups)) return false;
        return selectedAgeGroups.some(selectedId => 
          card.ageGroups.includes(selectedId)
        );
      });
    }
    
    // Фильтр по навыкам
    if (selectedSkills.length > 0) {
      filtered = filtered.filter(card => {
        if (!card.skillIds || !Array.isArray(card.skillIds)) return false;
        return selectedSkills.some(selectedId => 
          card.skillIds.includes(selectedId)
        );
      });
    }
    
    // Фильтр по этапам урока
    if (selectedStages.length > 0) {
      filtered = filtered.filter(card => {
        if (!card.stageIds || !Array.isArray(card.stageIds)) return false;
        return selectedStages.some(selectedId => 
          card.stageIds.includes(selectedId)
        );
      });
    }
    
    // Фильтр по типам работы
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(card => {
        if (!card.typeIds || !Array.isArray(card.typeIds)) return false;
        return selectedTypes.some(selectedId => 
          card.typeIds.includes(selectedId)
        );
      });
    }
    
    filteredCards = filtered;
  }

  // Вычисление общего времени (поддерживаем оба формата)
  $: lessonData.totalTime = lessonData.selectedCards.reduce((sum, card) => {
    const cardTime = card.timeMinutes || card.time_minutes || 0;
    return sum + cardTime;
  }, 0);



  // Навигация по шагам
  function nextStep() {
    // Проверяем валидацию для текущего шага
    if (currentStep === 2 && !step2ButtonEnabled) {
      alert('⚠️ Пожалуйста, выберите хотя бы одну карточку для создания плана урока.');
      return;
    }
    
    if (currentStep < totalSteps) {
      currentStep++;
    }
  }

  function prevStep() {
    if (currentStep > 1) {
      currentStep--;
    }
  }

  function goToStep(step) {
    currentStep = step;
  }

  // Работа с карточками
  function addCard(card) {
    const cardTime = card.timeMinutes || card.time_minutes || 0;
    
    // Проверяем, не добавлена ли уже карточка в текущий этап
    const isAlreadyInCurrentStage = lessonData.lessonStages[currentLessonStage].cards.some(c => c.id === card.id);
    if (isAlreadyInCurrentStage) {
      alert('Эта карточка уже добавлена в данный этап урока');
      return;
    }
    
    // Проверяем общий лимит времени
    if (lessonData.totalTime + cardTime > 45) {
      alert('Превышен лимит времени урока (45 минут)');
      return;
    }
    
    // Добавляем карточку к текущему этапу урока
    lessonData.lessonStages[currentLessonStage].cards = [...lessonData.lessonStages[currentLessonStage].cards, card];
    lessonData.lessonStages[currentLessonStage].totalTime += cardTime;
    
    // Обновляем общие данные (добавляем карточку в общий список, даже если она уже есть в других этапах)
    lessonData.selectedCards = [...lessonData.selectedCards, card];
    lessonData.totalTime += cardTime;
  }

  function removeCard(cardId, stageId = null) {
    // Находим карточку для получения времени
    const cardToRemove = lessonData.selectedCards.find(card => card.id === cardId);
    if (!cardToRemove) return;
    
    const cardTime = cardToRemove.timeMinutes || cardToRemove.time_minutes || 0;
    
    // Если указан этап, удаляем из конкретного этапа
    if (stageId && lessonData.lessonStages[stageId]) {
      lessonData.lessonStages[stageId].cards = lessonData.lessonStages[stageId].cards.filter(card => card.id !== cardId);
      lessonData.lessonStages[stageId].totalTime -= cardTime;
    } else {
      // Иначе ищем во всех этапах
      Object.keys(lessonData.lessonStages).forEach(stage => {
        const cardIndex = lessonData.lessonStages[stage].cards.findIndex(card => card.id === cardId);
        if (cardIndex !== -1) {
          lessonData.lessonStages[stage].cards.splice(cardIndex, 1);
          lessonData.lessonStages[stage].totalTime -= cardTime;
        }
      });
    }
    
    // Обновляем общие данные
    lessonData.selectedCards = lessonData.selectedCards.filter(card => card.id !== cardId);
    lessonData.totalTime -= cardTime;
  }

  // Экспорт PDF
  function handleExportPDF() {
    const exportData = {
      ...lessonData,
      cards: lessonData.selectedCards,
      totalTime: lessonData.totalTime
    };
    
    try {
      exportLessonToPDF(exportData);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Ошибка при экспорте в PDF: ' + error.message);
    }
  }

  // Валидация шагов
  function canProceedFromStep1() {
    return lessonData.subject.trim() && lessonData.grade.trim() && lessonData.topic.trim();
  }

  function canProceedFromStep2() {
    return lessonData.selectedCards.length > 0;
  }

  // Реактивная переменная для состояния кнопки на шаге 2
  $: step2ButtonEnabled = lessonData.selectedCards.length > 0;
  

</script>

<div class="max-w-4xl mx-auto pb-24 md:pb-8">

  <!-- Прогресс-шаги -->
  <div class="mb-6">
    <div class="flex items-center justify-center gap-4 mb-3">
      {#each Array(totalSteps) as _, i}
        {@const stepNum = i + 1}
        {@const done = currentStep > stepNum}
        {@const active = currentStep === stepNum}
        <button
          type="button"
          on:click={() => goToStep(stepNum)}
          class="flex flex-col items-center gap-1.5 group"
        >
          <div class="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300
            {done ? 'bg-gray-900 text-white' : active ? 'bg-gray-900 text-white scale-110 shadow-lg' : 'bg-white/60 text-gray-400 border border-gray-200'}">
            {#if done}
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
            {:else}{stepNum}{/if}
          </div>
          <span class="text-[10px] font-medium {active ? 'text-gray-900' : 'text-gray-400'}">
            {#if i === 0}Инфо{:else if i === 1}Приёмы{:else}План{/if}
          </span>
        </button>
        {#if i < totalSteps - 1}
          <div class="flex-1 h-px max-w-16 {currentStep > stepNum ? 'bg-gray-900' : 'bg-gray-200'} transition-colors duration-300 mb-4"></div>
        {/if}
      {/each}
    </div>
  </div>

  <!-- ШАГ 1: Информация об уроке -->
  {#if currentStep === 1}
    <div transition:slide={{ duration: 250, easing: quintOut }}>
      <div class="card mb-4 text-center">
        <h1 class="text-2xl font-bold text-gray-900 mb-1">Создание урока</h1>
        <p class="text-gray-500 text-sm">Расскажите об уроке — заполните основную информацию</p>
      </div>

      <div class="card mb-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5" for="subject">Предмет</label>
            <input id="subject" type="text" bind:value={lessonData.subject}
              placeholder="Математика, История..." class="input" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5" for="grade">Класс</label>
            <input id="grade" type="text" bind:value={lessonData.grade}
              placeholder="5А, 8-9 классы..." class="input" />
          </div>
        </div>
        <div class="mt-4">
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5" for="topic">Тема урока</label>
          <input id="topic" type="text" bind:value={lessonData.topic}
            placeholder="Решение квадратных уравнений..." class="input" />
        </div>
        <div class="mt-4">
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5" for="goals">Цели урока</label>
          <textarea id="goals" bind:value={lessonData.goals} rows="2"
            placeholder="Развить навыки критического мышления..." class="input resize-none"></textarea>
        </div>
        <div class="mt-4">
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5" for="description">Описание <span class="font-normal text-gray-400">(необязательно)</span></label>
          <textarea id="description" bind:value={lessonData.description} rows="2"
            placeholder="Краткое описание хода урока..." class="input resize-none"></textarea>
        </div>
      </div>

      <div class="flex justify-end">
        <button class="btn btn-primary" on:click={nextStep}>
          Выбрать приёмы
          <svg class="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>

  <!-- ШАГ 2: Выбор приёмов -->
  {:else if currentStep === 2}
    <div transition:slide={{ duration: 250, easing: quintOut }}>

      <!-- Шапка шага -->
      <div class="card mb-4">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 class="text-lg font-bold text-gray-900">Выбор приёмов по этапам</h2>
            <p class="text-sm text-gray-500">Добавьте приёмы для каждого этапа урока</p>
          </div>
          <div class="flex items-center gap-2 px-4 py-2 rounded-2xl" style="background: rgba(0,0,0,0.04)">
            <span class="text-sm font-bold text-gray-900">{lessonData.totalTime} мин</span>
            <span class="text-gray-400 text-sm">/</span>
            <span class="text-sm text-gray-500">45 мин</span>
            <div class="w-20 h-1.5 rounded-full bg-gray-200 overflow-hidden">
              <div class="h-full rounded-full transition-all duration-500
                {lessonData.totalTime > 40 ? 'bg-red-400' : lessonData.totalTime > 30 ? 'bg-amber-400' : 'bg-gray-900'}"
                style="width: {Math.min(100, (lessonData.totalTime / 45) * 100)}%"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Навигация по этапам -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {#each Object.keys(lessonData.lessonStages) as stageId}
          {@const stage = lessonData.lessonStages[stageId]}
          <button
            on:click={() => currentLessonStage = stageId}
            class="card !p-3 text-left transition-all duration-200 cursor-pointer
              {currentLessonStage === stageId ? '!bg-gray-900 shadow-lg' : 'hover:shadow-md'}"
          >
            <p class="text-xs font-semibold leading-tight mb-1
              {currentLessonStage === stageId ? 'text-white' : 'text-gray-800'}">
              {lessonStageNames[stageId]}
            </p>
            <p class="text-[10px] {currentLessonStage === stageId ? 'text-white/70' : 'text-gray-400'}">
              {stage.cards.length} приёмов · {stage.totalTime} мин
            </p>
          </button>
        {/each}
      </div>

      <!-- Добавленные карточки текущего этапа -->
      {#if lessonData.lessonStages[currentLessonStage].cards.length > 0}
        <div class="card !p-4 mb-4" style="border-left: 3px solid #1f2937;">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {lessonStageNames[currentLessonStage]}
          </p>
          <div class="space-y-2">
            {#each lessonData.lessonStages[currentLessonStage].cards as card}
              <div class="flex items-center gap-3 py-2 px-3 rounded-xl bg-white/60">
                <span class="flex-1 text-sm font-medium text-gray-900 truncate">{card.title}</span>
                <span class="text-xs text-gray-400 flex-shrink-0">{formatTimeDisplay(card.timeMinutes || card.time_minutes)}</span>
                <button on:click={() => removeCard(card.id, currentLessonStage)}
                  class="w-6 h-6 rounded-full bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center flex-shrink-0 transition-colors">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Поиск и фильтры каталога -->
      <div class="card !p-4 mb-4">
        <div class="relative mb-3">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input type="text" bind:value={searchQuery} placeholder="Поиск приёмов..."
            class="input !pl-10 !pr-10" />
          {#if searchQuery}
            <button on:click={() => searchQuery = ''}
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          {/if}
        </div>

        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-gray-500">{filteredCards.length} приёмов</span>
          <button on:click={() => showFilters = !showFilters}
            class="text-xs font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z"/>
            </svg>
            Фильтры
            <svg class="w-3 h-3 transition-transform {showFilters ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
        </div>

        {#if showFilters}
          <div transition:slide={{ duration: 200 }} class="pt-3 border-t border-white/30 space-y-3">
            <!-- Время -->
            <div>
              <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Время</p>
              <div class="flex gap-1.5 flex-wrap">
                {#each [['all','Все'],['short','≤ 15м'],['medium','15-30м'],['long','≥ 30м']] as [val, label]}
                  <button on:click={() => timeFilter = val}
                    class="px-3 py-1.5 rounded-xl text-xs font-medium transition-all
                      {timeFilter === val ? 'bg-gray-900 text-white' : 'bg-white/60 text-gray-600 hover:bg-white/80'}">
                    {label}
                  </button>
                {/each}
              </div>
            </div>
            <!-- Возраст -->
            <div>
              <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Возраст</p>
              <div class="flex gap-1.5 flex-wrap">
                {#each predefinedAgeGroups as g}
                  <label class="px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all
                    {selectedAgeGroups.includes(g.id) ? 'bg-gray-900 text-white' : 'bg-white/60 text-gray-600 hover:bg-white/80'}">
                    <input type="checkbox" bind:group={selectedAgeGroups} value={g.id} class="sr-only"/>
                    {g.name.replace(' классы', '')}
                  </label>
                {/each}
              </div>
            </div>
            <!-- Навыки -->
            <div>
              <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Навыки</p>
              <div class="flex gap-1.5 flex-wrap">
                {#each predefinedSkills as s}
                  <label class="px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all
                    {selectedSkills.includes(s.id) ? 'bg-gray-900 text-white' : 'bg-white/60 text-gray-600 hover:bg-white/80'}">
                    <input type="checkbox" bind:group={selectedSkills} value={s.id} class="sr-only"/>
                    {s.name}
                  </label>
                {/each}
              </div>
            </div>
            <!-- Сброс -->
            <button on:click={() => { searchQuery=''; timeFilter='all'; selectedAgeGroups=[]; selectedSkills=[]; selectedStages=[]; selectedTypes=[]; }}
              class="text-xs text-gray-400 hover:text-gray-600 transition-colors">Сбросить фильтры</button>
          </div>
        {/if}
      </div>

      <!-- Сетка карточек -->
      {#if isLoading}
        <div class="text-center py-12">
          <div class="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-3"></div>
          <p class="text-sm text-gray-500">Загрузка приёмов...</p>
        </div>
      {:else if filteredCards.length === 0}
        <div class="card text-center py-10">
          <p class="text-gray-400 text-sm">Приёмы не найдены</p>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {#each filteredCards as card (card.id)}
            <ConstructorCard
              {card}
              isSelected={lessonData.lessonStages[currentLessonStage].cards.some(c => c.id === card.id)}
              on:add={() => addCard(card)}
              on:remove={() => removeCard(card.id, currentLessonStage)}
            />
          {/each}
        </div>
      {/if}

      <!-- Навигация на десктопе -->
      <div class="hidden md:flex items-center justify-between gap-3">
        <button class="btn btn-secondary" on:click={prevStep}>
          <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Назад
        </button>
        <button class="btn btn-primary" disabled={!step2ButtonEnabled} on:click={nextStep}>
          Создать план урока
          <svg class="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>

      <!-- Фиксированная панель навигации на мобильных -->
      <div class="md:hidden fixed bottom-20 left-3 right-3 z-[60] p-2.5 rounded-2xl" style="background: rgba(255,255,255,0.95); backdrop-filter: blur(20px); box-shadow: 0 4px 30px rgba(200,168,233,0.15);">
        <div class="flex items-center justify-between gap-2">
          <button class="btn btn-secondary !px-4 !py-2 text-sm" on:click={prevStep}>
            <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/>
            </svg>
            Назад
          </button>
          <button class="btn btn-primary flex-1 !py-2 text-sm" disabled={!step2ButtonEnabled} on:click={nextStep}>
            Далее
            <span class="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">{lessonData.selectedCards.length}</span>
            <svg class="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>
      <!-- Отступ для фиксированной панели на мобильных -->
      <div class="md:hidden h-32"></div>
    </div>

  <!-- ШАГ 3: Готовый план -->
  {:else if currentStep === 3}
    <div transition:slide={{ duration: 250, easing: quintOut }}>

      <div class="card mb-4 text-center">
        <h1 class="text-2xl font-bold text-gray-900 mb-1">План урока готов!</h1>
        <p class="text-gray-500 text-sm">«{lessonData.topic}»</p>
      </div>

      <!-- Сводка -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {#each [
          ['Предмет', lessonData.subject],
          ['Класс', lessonData.grade],
          ['Приёмов', lessonData.selectedCards.length],
          ['Время', `${lessonData.totalTime} мин`]
        ] as [label, value]}
          <div class="card !p-3">
            <p class="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{label}</p>
            <p class="text-sm font-semibold text-gray-900 truncate">{value || '—'}</p>
          </div>
        {/each}
      </div>

      <!-- Этапы урока -->
      <div class="space-y-4 mb-6">
        {#each Object.keys(lessonData.lessonStages) as stageId}
          {#if lessonData.lessonStages[stageId].cards.length > 0}
            <div>
              <div class="flex items-center gap-2 mb-2">
                <h3 class="text-sm font-bold text-gray-900">{lessonStageNames[stageId]}</h3>
                <span class="badge-count !text-xs">{lessonData.lessonStages[stageId].totalTime} мин</span>
              </div>
              <div class="space-y-2">
                {#each lessonData.lessonStages[stageId].cards as card, index (`${stageId}-${card.id}-${index}`)}
                  <DetailedLessonCard
                    {card}
                    index={index + 1}
                    on:remove={() => removeCard(card.id, stageId)}
                  />
                {/each}
              </div>
            </div>
          {/if}
        {/each}
      </div>

      <div class="flex items-center justify-between gap-3">
        <button class="btn btn-secondary" on:click={prevStep}>
          <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Изменить приёмы
        </button>
        <button class="btn btn-primary" on:click={handleExportPDF}>
          <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
          </svg>
          Сохранить в PDF
        </button>
      </div>
    </div>
  {/if}

</div>

