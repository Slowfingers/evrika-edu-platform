<script>
  import { createEventDispatcher } from 'svelte';
  import { createLessonStages, recalculateLesson, removeLessonCard, lessonHasContent, stageHasContent, worksheetFromLesson } from '#lib/utils/lesson-state.js';
  import { slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import ConstructorCard from './ConstructorCard.svelte';
  import DetailedLessonCard from './DetailedLessonCard.svelte';
  import { formatTimeDisplay } from '#lib/utils/time-intervals.js';
  import { exportLessonToPDF } from '#lib/utils/pdf-export.js';

  import { t, lang } from '#lib/stores/lang.js';
  import { localizeCard } from '#lib/utils/localization.js';
  import { normalizeSearch } from '#lib/api/base.api.js';

  import WorksheetBuilder from './WorksheetBuilder.svelte';
  import { lessonLabel, stageLabel } from '#lib/utils/lesson-labels.js';
  $: l = key => lessonLabel($lang, key);
  let exporting=null;
  let exportErrorText='';
  let lastExportedLesson='';
  let catalogueVisible=false;
  let worksheetOpened=false;
  let worksheetOpen=false;
  let worksheetSeed=null;
  function openWorksheet(){if(!worksheetOpened){worksheetSeed=worksheetFromLesson(lessonData,$lang);worksheetOpened=true;}worksheetOpen=true;}
  function updateStage(key,value){lessonData=recalculateLesson({...lessonData,lessonStages:{...lessonData.lessonStages,[currentLessonStage]:{...lessonData.lessonStages[currentLessonStage],[key]:value}}});}
  import { useUnsavedChanges } from '#lib/utils/unsaved.js';
  useUnsavedChanges(()=>((lessonHasContent(lessonData)||!!lessonData.topic.trim()||!!lessonData.subject.trim()||!!lessonData.grade.trim()||!!lessonData.description.trim()||!!lessonData.goals.trim()||lessonData.lessonDuration!==45||Object.values(lessonData.lessonStages).some((stage,index)=>stage.duration!==[3,12,10,15,5][index]))&&JSON.stringify(lessonData)!==lastExportedLesson)||worksheetOpened,()=>$lang);
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
    totalTime: 45,
    lessonDuration: 45,
    lessonStages: createLessonStages()
  };

  // Каталог карточек
  export let catalogCards = [];
  export let isLoading = false;
  export let catalogError=false;

  // Поиск и фильтрация
  let searchQuery = '';

  // Шаблонные цели урока
  let selectedGoals = [];
  let customGoal = '';
  let showGoalTemplates = false;

  // Определение шаблонов целей
  $: goalTemplates = {
    mastery: [
      { id: 'basic_understanding', label: $t('goal_basic_understanding') },
      { id: 'deepen_knowledge', label: $t('goal_deepen_knowledge') },
      { id: 'systematize', label: $t('goal_systematize') },
      { id: 'generalize', label: $t('goal_generalize') },
      { id: 'review_reinforce', label: $t('goal_review_reinforce') }
    ],
    activity: [
      { id: 'explain_new', label: $t('goal_explain_new') },
      { id: 'practice_skills', label: $t('goal_practice_skills') },
      { id: 'apply_knowledge', label: $t('goal_apply_knowledge') },
      { id: 'solve_problems', label: $t('goal_solve_problems') },
      { id: 'do_exercises', label: $t('goal_do_exercises') },
      { id: 'lab_research', label: $t('goal_lab_research') }
    ],
    skills: [
      { id: 'critical_thinking', label: $t('goal_critical_thinking') },
      { id: 'logic_analysis', label: $t('goal_logic_analysis') },
      { id: 'creativity', label: $t('goal_creativity') },
      { id: 'communication', label: $t('goal_communication') },
      { id: 'independence', label: $t('goal_independence') },
      { id: 'teamwork', label: $t('goal_teamwork') }
    ]
  };

  // Обновление поля goals при изменении выбранных целей
  $: {
    const goals = [...selectedGoals.map(id => {
      for (const category of Object.values(goalTemplates)) {
        const found = category.find(g => g.id === id);
        if (found) return found.label;
      }
      return '';
    }).filter(Boolean)];

    if (customGoal.trim()) {
      goals.push(customGoal.trim());
    }

    lessonData.goals = goals.join('; ');
  }

  // Текущий выбранный этап урока для добавления карточек
  let currentLessonStage = 'начало-урока';

  // Названия этапов урока для отображения
  $: lessonStageNames = Object.fromEntries(Object.keys(lessonData.lessonStages).map(id=>[id,stageLabel(id,$lang)]));
  let timeFilter = 'all'; // all, short (до 15 мин), medium (15-30 мин), long (30+ мин)
  let selectedAgeGroups = [];
  let selectedSkills = [];
  let selectedStages = [];
  let selectedTypes = [];
  let showFilters = false;
  let filteredCards = [];

  // Управление этапами урока на втором шаге
  let showStageCards = {}; // Для отображения карточек каждого этапа

  // Предопределенные данные для фильтров (реактивные при смене языка)
  $: predefinedAgeGroups = [
    { id: 'начальные-классы', name: $t('age_primary') },
    { id: 'старшие-классы', name: $t('age_secondary') }
  ];

  $: predefinedSkills = [
    { id: 'критическое-мышление', name: $t('skill_critical') },
    { id: 'командная-работа', name: $t('skill_team') },
    { id: 'рефлексия', name: $t('skill_reflection') },
    { id: 'креативное-мышление', name: $t('skill_creative') },
    { id: 'систематизация', name: $t('skill_systematization') },
    { id: 'коммуникация', name: $t('skill_communication') }
  ];

  $: predefinedStages = [
    { id: 'начало-урока', name: $t('stage_start') },
    { id: 'объяснение-нового-материала', name: $t('stage_explain') },
    { id: 'закрепление', name: $t('stage_consolidate') },
    { id: 'конец-урока', name: $t('stage_end') }
  ];

  $: predefinedTypes = [
    { id: 'индивидуальная', name: $t('type_individual') },
    { id: 'парная', name: $t('type_pair') },
    { id: 'командная', name: $t('type_team') },
    { id: 'фронтальная', name: $t('type_frontal') }
  ];

  // Улучшенная фильтрация карточек с расширенными фильтрами
  $: {
    let filtered = catalogCards;

    // Фильтр по поисковому запросу (все языки)
    if (searchQuery.trim()) {
      const query = normalizeSearch(searchQuery);
      filtered = filtered.filter(card =>
        normalizeSearch(card.title).includes(query) ||
        normalizeSearch(card.description).includes(query) ||
        normalizeSearch(card.content).includes(query) ||
        normalizeSearch(card.title_uz).includes(query) ||
        normalizeSearch(card.title_en).includes(query) ||
        normalizeSearch(card.description_uz).includes(query) ||
        normalizeSearch(card.description_en).includes(query)
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

  // Навигация по шагам
  function nextStep() {
    // Проверяем валидацию для текущего шага
    if (currentStep === 2 && !step2ButtonEnabled) {
      alert(l('emptyLesson'));
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

    lessonData=recalculateLesson({...lessonData,lessonStages:{...lessonData.lessonStages,[currentLessonStage]:{...lessonData.lessonStages[currentLessonStage],cards:[...lessonData.lessonStages[currentLessonStage].cards,card]}}});
  }

  function removeCard(cardId, stageId = null) {
    lessonData = removeLessonCard(lessonData, cardId, stageId);
  }

  // Экспорт PDF
  async function handleExportPDF() {
    if(exporting)return;exporting='pdf';exportErrorText='';
    const exportedSnapshot=JSON.stringify(lessonData);
    const exportData = {
      ...lessonData,
      language: $lang,
      lessonStages: Object.fromEntries(Object.entries(lessonData.lessonStages).map(([id, stage]) => [id, {
        ...stage, cards: stage.cards.map(card => localizeCard(catalogCards.find(item => item.id === card.id) || card, $lang))
      }])),
      cards: lessonData.selectedCards.map(card => localizeCard(catalogCards.find(item => item.id === card.id) || card, $lang)),
      totalTime: lessonData.totalTime
    };

    try {
      await exportLessonToPDF(exportData);
      lastExportedLesson=exportedSnapshot;
    } catch (error) {
      console.error('Error exporting PDF:', error);
      exportErrorText=$lang==='uz'?'Fayl yuklanmadi. Qayta urinib ko‘ring.':$lang==='en'?'Could not download the file. Please try again.':'Не удалось скачать файл. Попробуйте ещё раз.';
    } finally {exporting=null;}
  }

  // Экспорт DOCX
  async function handleExportDOCX() {
    if(exporting)return;exporting='docx';exportErrorText='';
    const exportedSnapshot=JSON.stringify(lessonData);
    const exportData = {
      ...lessonData,
      language: $lang,
      lessonStages: Object.fromEntries(Object.entries(lessonData.lessonStages).map(([id, stage]) => [id, {
        ...stage, cards: stage.cards.map(card => localizeCard(catalogCards.find(item => item.id === card.id) || card, $lang))
      }])),
      cards: lessonData.selectedCards.map(card => localizeCard(catalogCards.find(item => item.id === card.id) || card, $lang)),
      totalTime: lessonData.totalTime
    };

    try {
      const {exportLessonToDOCX}=await import('#lib/utils/docx-export.js');
      await exportLessonToDOCX(exportData);
      lastExportedLesson=exportedSnapshot;
    } catch (error) {
      console.error('Error exporting DOCX:', error);
      exportErrorText=$lang==='uz'?'Fayl yuklanmadi. Qayta urinib ko‘ring.':$lang==='en'?'Could not download the file. Please try again.':'Не удалось скачать файл. Попробуйте ещё раз.';
    } finally {exporting=null;}
  }

  // Валидация шагов
  function canProceedFromStep1() {
    return lessonData.subject.trim() && lessonData.grade.trim() && lessonData.topic.trim();
  }

  function canProceedFromStep2() {
    return lessonHasContent(lessonData);
  }

  // Реактивная переменная для состояния кнопки на шаге 2
  $: step2ButtonEnabled = lessonHasContent(lessonData);


</script>

<div class="max-w-4xl mx-auto pb-24 md:pb-8" class:hidden={worksheetOpen}>
  <p class="text-xs text-purple-800/70 mb-5">{l('memory')}</p>

  <!-- Прогресс-шаги -->
  <div class="mb-6">
    <div class="flex items-center justify-center gap-4 mb-3">
      {#each Array(totalSteps) as _, i}
        {@const stepNum = i + 1}
        {@const done = currentStep > stepNum}
        {@const active = currentStep === stepNum}
        <button
          type="button"
          disabled={stepNum===3&&!step2ButtonEnabled}
          on:click={() => goToStep(stepNum)}
          class="flex flex-col items-center gap-1.5 group disabled:opacity-40 disabled:cursor-not-allowed"
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
            {#if i === 0}{l('stepInfo')}{:else if i === 1}{l('stepFlow')}{:else}{l('stepPlan')}{/if}
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
        <h1 class="text-2xl font-bold text-gray-900 mb-1">{$t('wiz_create_lesson')}</h1>
        <p class="text-gray-500 text-sm">{$t('wiz_create_lesson_desc')}</p>
      </div>

      <div class="card mb-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5" for="subject">{$t('wiz_subject')}</label>
            <input id="subject" type="text" bind:value={lessonData.subject}
              placeholder={$t('wiz_subject_ph')} class="input" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5" for="grade">{$t('wiz_grade')}</label>
            <input id="grade" type="text" bind:value={lessonData.grade}
              placeholder={$t('wiz_grade_ph')} class="input" />
          </div>
        </div>
        <div class="mt-4">
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5" for="topic">{$t('wiz_topic')}</label>
          <input id="topic" type="text" bind:value={lessonData.topic}
            placeholder={$t('wiz_topic_ph')} class="input" />
        </div>
        <div class="mt-4">
          <div class="flex items-center justify-between mb-2">
            <span class="block text-xs font-semibold text-gray-500 uppercase tracking-wide">{$t('wiz_goals')}</span>
            <button type="button" on:click={() => showGoalTemplates = !showGoalTemplates}
              class="text-xs font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
              {$t('goal_templates_title')}
            </button>
          </div>

          {#if showGoalTemplates}
            <div transition:slide={{ duration: 200 }} class="mb-3 p-3 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100">
              <!-- По уровню освоения -->
              <div class="mb-3">
                <p class="text-xs font-bold text-gray-700 mb-2">{$t('goal_cat_mastery')}</p>
                <div class="flex flex-wrap gap-1.5">
                  {#each goalTemplates.mastery as goal}
                    <label class="cursor-pointer">
                      <input type="checkbox" bind:group={selectedGoals} value={goal.id} class="sr-only peer" />
                      <span class="inline-block px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all
                        peer-checked:bg-purple-600 peer-checked:text-white peer-checked:shadow-md
                        bg-white text-gray-700 hover:bg-purple-50 border border-gray-200 peer-checked:border-purple-600">
                        {goal.label}
                      </span>
                    </label>
                  {/each}
                </div>
              </div>

              <!-- По типу деятельности -->
              <div class="mb-3">
                <p class="text-xs font-bold text-gray-700 mb-2">{$t('goal_cat_activity')}</p>
                <div class="flex flex-wrap gap-1.5">
                  {#each goalTemplates.activity as goal}
                    <label class="cursor-pointer">
                      <input type="checkbox" bind:group={selectedGoals} value={goal.id} class="sr-only peer" />
                      <span class="inline-block px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all
                        peer-checked:bg-blue-600 peer-checked:text-white peer-checked:shadow-md
                        bg-white text-gray-700 hover:bg-blue-50 border border-gray-200 peer-checked:border-blue-600">
                        {goal.label}
                      </span>
                    </label>
                  {/each}
                </div>
              </div>

              <!-- По развитию навыков -->
              <div>
                <p class="text-xs font-bold text-gray-700 mb-2">{$t('goal_cat_skills')}</p>
                <div class="flex flex-wrap gap-1.5">
                  {#each goalTemplates.skills as goal}
                    <label class="cursor-pointer">
                      <input type="checkbox" bind:group={selectedGoals} value={goal.id} class="sr-only peer" />
                      <span class="inline-block px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all
                        peer-checked:bg-emerald-600 peer-checked:text-white peer-checked:shadow-md
                        bg-white text-gray-700 hover:bg-emerald-50 border border-gray-200 peer-checked:border-emerald-600">
                        {goal.label}
                      </span>
                    </label>
                  {/each}
                </div>
              </div>
            </div>
          {/if}

          <!-- Поле для своей цели -->
          <div class="mb-2">
            <input type="text" bind:value={customGoal}
              placeholder={$t('goal_custom')}
              class="input text-sm" />
          </div>

          <!-- Превью выбранных целей -->
          {#if lessonData.goals}
            <div class="p-3 rounded-lg bg-gray-50 border border-gray-200">
              <p class="text-xs text-gray-500 mb-1 font-medium">{$t('wiz_goals')}:</p>
              <p class="text-sm text-gray-900">{lessonData.goals}</p>
            </div>
          {/if}
        </div>
        <div class="mt-4">
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5" for="description">{$t('wiz_description')} <span class="font-normal text-gray-400">({$t('wiz_optional')})</span></label>
          <textarea id="description" bind:value={lessonData.description} rows="2"
            placeholder={$t('wiz_description_ph')} class="input resize-none"></textarea>
        </div>
      </div>

      <label class="lesson-length">{l('lessonDuration')}<input type="number" min="10" max="240" bind:value={lessonData.lessonDuration} on:change={()=>lessonData.lessonDuration=Math.max(10,Math.min(240,Number(lessonData.lessonDuration)||45))} /></label>

      <div class="flex justify-end">
        <button class="btn btn-primary" on:click={nextStep}>
          {l('nextFlow')}
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
            <h2 class="text-lg font-bold text-gray-900">{l('flow')}</h2>
            <p class="text-sm text-gray-500">{l('flowHint')}</p>
          </div>
          <div class="flex items-center gap-2 px-4 py-2 rounded-2xl" style="background: rgba(0,0,0,0.04)">
            <span class="text-sm font-bold text-gray-900">{lessonData.totalTime} {$t('wiz_min')}</span>
            <span class="text-gray-400 text-sm">/</span>
            <span class="text-sm text-gray-500">{lessonData.lessonDuration} {$t('wiz_min')}</span>
            <div class="w-20 h-1.5 rounded-full bg-gray-200 overflow-hidden">
              <div class="h-full rounded-full transition-all duration-500
                {lessonData.totalTime > lessonData.lessonDuration ? 'bg-red-400' : lessonData.totalTime > lessonData.lessonDuration * 0.8 ? 'bg-amber-400' : 'bg-gray-900'}"
                style="width: {Math.min(100, (lessonData.totalTime / lessonData.lessonDuration) * 100)}%"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Навигация по этапам -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
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
              {$t('wiz_n_techniques', stage.cards.length)} · {stage.totalTime} {$t('wiz_min')}
            </p>
          </button>
        {/each}
      </div>

      <div class="card mb-5 stage-editor">
        <div class="stage-editor-heading"><div><span class="stage-eyebrow">{l('flow')}</span><h3>{lessonStageNames[currentLessonStage]}</h3></div>
          <label class="stage-duration">{l('duration')}<input type="number" min="0" max="180" value={lessonData.lessonStages[currentLessonStage].duration} on:change={(e)=>updateStage('duration',Math.max(0,Math.min(180,Number(e.currentTarget.value)||0)))} /></label>
        </div>
        <label>{l('notes')}<textarea rows="7" maxlength="8000" value={lessonData.lessonStages[currentLessonStage].notes} placeholder={l('notesHint')} on:input={(e)=>updateStage('notes',e.currentTarget.value)}></textarea></label>
        <label>{l('task')}<textarea rows="4" maxlength="8000" value={lessonData.lessonStages[currentLessonStage].studentTask} placeholder={l('taskHint')} on:input={(e)=>updateStage('studentTask',e.currentTarget.value)}></textarea></label>
        <label>{l('resources')}<input maxlength="1500" value={lessonData.lessonStages[currentLessonStage].resources} placeholder={l('resourcesHint')} on:input={(e)=>updateStage('resources',e.currentTarget.value)} /></label>
        <p class="stage-help">{l('stageTimeHint')} {lessonData.lessonStages[currentLessonStage].cardTime||0} {$t('wiz_min')} · {l('cardTime')}</p>
      </div>
      {#if lessonData.totalTime>lessonData.lessonDuration}<p class="p-3 mb-4 bg-amber-50 rounded-xl text-sm text-amber-800" role="status">{l('overrun')}</p>{/if}

      <!-- Добавленные карточки текущего этапа -->
      {#if lessonData.lessonStages[currentLessonStage].cards.length > 0}
        <div class="card !p-4 mb-4" style="border-left: 3px solid #1f2937;">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {lessonStageNames[currentLessonStage]}
          </p>
          <div class="space-y-2">
            {#each lessonData.lessonStages[currentLessonStage].cards as card}
              <div class="flex items-center gap-3 py-2 px-3 rounded-xl bg-white/60">
                <span class="flex-1 text-sm font-medium text-gray-900 truncate">{localizeCard(card, $lang).title}</span>
                <span class="text-xs text-gray-400 flex-shrink-0">{formatTimeDisplay(card.timeMinutes || card.time_minutes, $lang)}</span>
                <button aria-label={`${$t('wiz_remove')}: ${localizeCard(card,$lang).title}`} on:click={() => removeCard(card.id, currentLessonStage)}
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

      <button class="btn btn-secondary w-full mb-4" aria-expanded={catalogueVisible} on:click={()=>catalogueVisible=!catalogueVisible}>＋ {l(catalogueVisible?'hideCatalog':'catalog')} <span class="text-xs ml-3 opacity-60">{l('optional')}</span></button>
      {#if catalogueVisible}
      <!-- Поиск и фильтры каталога -->
      <div class="card !p-4 mb-4">
        <div class="relative mb-3">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input type="text" bind:value={searchQuery} placeholder={$t('wiz_search_ph')}
            class="input !pl-10 !pr-10" />
          {#if searchQuery}
            <button aria-label={$lang==='uz'?'Qidiruvni tozalash':$lang==='en'?'Clear search':'Очистить поиск'} on:click={() => searchQuery = ''}
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          {/if}
        </div>

        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-gray-500">{$t('wiz_n_techniques', filteredCards.length)}</span>
          <button on:click={() => showFilters = !showFilters}
            class="text-xs font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z"/>
            </svg>
            {$t('filters')}
            <svg class="w-3 h-3 transition-transform {showFilters ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
        </div>

        {#if showFilters}
          <div transition:slide={{ duration: 200 }} class="pt-3 border-t border-white/30 space-y-3">
            <!-- Время -->
            <div>
              <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{$t('filter_time')}</p>
              <div class="flex gap-1.5 flex-wrap">
                {#each [['all',$t('wiz_time_all')],['short',$t('wiz_time_short')],['medium',$t('wiz_time_medium')],['long',$t('wiz_time_long')]] as [val, label]}
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
              <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{$t('filter_age')}</p>
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
              <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{$t('filter_skills')}</p>
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
              class="text-xs text-gray-400 hover:text-gray-600 transition-colors">{$t('reset_filters_btn')}</button>
          </div>
        {/if}
      </div>

      <!-- Сетка карточек -->
      {#if catalogError}
        <div class="card text-center py-6" role="alert"><p>{$lang==='uz'?'Katalog yuklanmadi. Darsga o‘z yozuvlaringizni qo‘shishingiz mumkin.':$lang==='en'?'Catalog could not load. You can still write your lesson.':'Каталог не загрузился. Вы можете продолжить писать урок самостоятельно.'}</p><button class="btn btn-secondary mt-3" on:click={()=>dispatch('retryCatalog')}>{$lang==='uz'?'Qayta urinish':$lang==='en'?'Retry':'Попробовать снова'}</button></div>
      {:else if isLoading}
        <div class="text-center py-12">
          <div class="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-3"></div>
          <p class="text-sm text-gray-500">{$t('wiz_loading')}</p>
        </div>
      {:else if filteredCards.length === 0}
        <div class="card text-center py-10">
          <p class="text-gray-400 text-sm">{$t('wiz_not_found')}</p>
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

      {/if}

      <!-- Навигация на десктопе -->
      <div class="hidden md:flex items-center justify-between gap-3">
        <button class="btn btn-secondary" on:click={prevStep}>
          <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          {$t('btn_back')}
        </button>
        <button class="btn btn-primary" disabled={!step2ButtonEnabled} on:click={nextStep}>
          {$t('wiz_create_plan')}
          <svg class="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>

      <!-- Фиксированная панель навигации на мобильных -->
      <div class="md:hidden mt-6 p-3 rounded-2xl border border-white/60" style="background: rgba(255,255,255,0.92); backdrop-filter: blur(20px); box-shadow: 0 -4px 30px rgba(200,168,233,0.2), 0 4px 20px rgba(0,0,0,0.08);">
        <div class="flex items-center gap-3">
          <button class="btn btn-secondary !px-5 !py-2.5 text-sm font-semibold" on:click={prevStep}>
            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/>
            </svg>
            {$t('btn_back')}
          </button>
          <button class="btn btn-primary flex-1 !py-2.5 text-sm font-semibold" disabled={!step2ButtonEnabled} on:click={nextStep}>
            {l('stepPlan')}
            <svg class="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>
      <!-- Отступ для фиксированной панели на мобильных -->

    </div>

  <!-- ШАГ 3: Готовый план -->
  {:else if currentStep === 3}
    <div transition:slide={{ duration: 250, easing: quintOut }}>

      <div class="card mb-4 text-center">
        <h1 class="text-2xl font-bold text-gray-900 mb-1">{$t('wiz_plan_ready')}</h1>
        <p class="text-gray-500 text-sm">«{lessonData.topic}»</p>
      </div>

      <!-- Сводка -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {#each [
          [$t('wiz_subject'), lessonData.subject],
          [$t('wiz_grade'), lessonData.grade],
          [$lang==='uz'?'Bosqichlar':$lang==='en'?'Stages':'Этапов', Object.keys(lessonData.lessonStages).length],
          [$t('wiz_time_label'), `${lessonData.totalTime} ${$t('wiz_min')}`]
        ] as [label, value]}
          <div class="card !p-3">
            <p class="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{label}</p>
            <p class="text-sm font-semibold text-gray-900 truncate">{value || '—'}</p>
          </div>
        {/each}
      </div>

      <!-- Цели и описание -->
      {#if lessonData.goals || lessonData.description}
        <div class="card mb-4 space-y-3">
          {#if lessonData.goals}
            <div>
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{$t('wiz_goals')}</p>
              <p class="text-sm text-gray-900 leading-relaxed">{lessonData.goals}</p>
            </div>
          {/if}
          {#if lessonData.description}
            <div>
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{$t('wiz_description')}</p>
              <p class="text-sm text-gray-700 leading-relaxed">{lessonData.description}</p>
            </div>
          {/if}
        </div>
      {/if}

      <!-- Этапы урока -->
      <div class="space-y-4 mb-6">
        {#each Object.keys(lessonData.lessonStages) as stageId}
          {#if stageHasContent(lessonData.lessonStages[stageId]) || lessonData.lessonStages[stageId].duration>0}
            <div>
              <div class="flex items-center gap-2 mb-2">
                <h3 class="text-sm font-bold text-gray-900">{lessonStageNames[stageId]}</h3>
                <span class="badge-count !text-xs">{lessonData.lessonStages[stageId].totalTime} {$t('wiz_min')}</span>
              </div>
              <div class="stage-review card mb-3">
                {#each ['notes','studentTask','resources'] as field}
                  {#if lessonData.lessonStages[stageId][field]?.trim()}<div class="stage-review-field"><h4>{l(field==='studentTask'?'task':field)}</h4><p>{lessonData.lessonStages[stageId][field]}</p></div>{/if}
                {/each}
              </div>
              <div class="space-y-2">
                {#each lessonData.lessonStages[stageId].cards as card, index (`${stageId}-${card.id}-${index}`)}
                  <DetailedLessonCard
                    card={localizeCard(catalogCards.find(item => item.id === card.id) || card, $lang)}
                    index={index + 1}
                    on:remove={() => removeCard(card.id, stageId)}
                  />
                {/each}
              </div>
            </div>
          {/if}
        {/each}
      </div>

      {#if exportErrorText}<p role="alert" class="p-3 mb-4 bg-rose-50 rounded-xl text-sm text-rose-700">{exportErrorText}</p>{/if}
      <div class="worksheet-invite card mb-6"><span class="worksheet-invite-icon">▤</span><div><h3>{l('worksheetTitle')} <span>{l('optional')}</span></h3><p>{l('worksheetHint')}</p><button class="btn btn-primary mt-4" on:click={openWorksheet}>{l(worksheetOpened?'openWorksheet':'createWorksheet')} ↗</button></div></div>

      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <button class="btn btn-secondary w-full md:w-auto" on:click={prevStep}>
          <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          {l('flow')}
        </button>
        <div class="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <button class="btn btn-primary w-full sm:w-auto" disabled={!!exporting} on:click={handleExportPDF}>
            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            </svg>
            {exporting==='pdf'?$t('loading'):$t('wiz_save_pdf')}
          </button>
          <button class="btn btn-primary w-full sm:w-auto" disabled={!!exporting} on:click={handleExportDOCX}>
            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            {exporting==='docx'?$t('loading'):$t('wiz_save_docx')}
          </button>
        </div>
      </div>
    </div>
  {/if}

</div>


{#if worksheetOpened}
  <section class:hidden={!worksheetOpen}>
    <button class="btn btn-secondary mb-5" on:click={()=>worksheetOpen=false}>← {l('returnLesson')}</button>
    <WorksheetBuilder initialSheet={worksheetSeed} embedded />
  </section>
{/if}

<style>
.stage-editor-heading{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:22px;}.stage-editor-heading h3{font-size:22px;font-weight:700;color:#473259;}.stage-eyebrow{font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#a08bb0;}.stage-editor label{display:block;font-size:12px;font-weight:600;color:#7e668e;margin:16px 0;}.stage-editor textarea,.stage-editor input,.lesson-length input{display:block;width:100%;border:1px solid #ddcfe8;border-radius:12px;background:#ffffffa6;padding:12px 14px;margin-top:8px;font-size:14px;line-height:1.7;font-weight:400;color:#42384b;}.stage-editor textarea{resize:vertical;min-height:100px;}.stage-editor textarea:focus,.stage-editor input:focus{outline:2px solid #c7aadf;outline-offset:2px;}.stage-editor .stage-duration{max-width:145px;flex-shrink:0;font-size:10px;}.stage-duration input{text-align:center;font-size:20px;font-weight:600;padding:7px;}.stage-help{font-size:11px;line-height:1.6;color:#9a84aa;}.stage-review-field+ .stage-review-field{margin-top:20px;}.stage-review h4{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#9a80af;margin-bottom:8px;}.stage-review p{white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px;line-height:1.8;color:#4d4357;}.stage-review:empty{display:none;}.worksheet-invite{display:flex;gap:20px;background:#f7f1fc!important;border:1px solid #e8dcf2;}.worksheet-invite-icon{font-size:40px;color:#aa84c4;}.worksheet-invite h3{font-size:18px;font-weight:700;color:#694b7f;}.worksheet-invite h3 span{font-size:9px;font-weight:500;background:white;border-radius:6px;padding:5px 7px;margin-left:8px;}.worksheet-invite p{font-size:13px;line-height:1.7;color:#947da4;margin-top:8px;}.lesson-length{display:flex;align-items:center;gap:16px;font-size:12px;color:#8f769f;padding:0 14px 20px;}.lesson-length input{width:90px;margin:0;padding:8px 12px;}
@media(max-width:600px){.stage-editor-heading h3{font-size:18px;}.stage-editor .stage-duration{max-width:100px;}.stage-editor textarea,.stage-editor input{font-size:16px;}.worksheet-invite{gap:12px;}.worksheet-invite h3{font-size:16px;}}
</style>
