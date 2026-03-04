<script>
  import { onMount, onDestroy } from 'svelte';
  
  let stages = [
    { id: 1, name: 'Вводная', duration: 3, color: '#4ade80' },
    { id: 2, name: 'Актуализация', duration: 5, color: '#facc15' },
    { id: 3, name: 'Объяснение', duration: 10, color: '#60a5fa' },
    { id: 4, name: 'Практика', duration: 15, color: '#f472b6' },
    { id: 5, name: 'Рефлексия', duration: 7, color: '#a78bfa' },
    { id: 6, name: 'Итог', duration: 5, color: '#fb7185' }
  ];
  
  const COLORS = [
    { label: 'Зеленый', value: '#4ade80' },
    { label: 'Синий', value: '#60a5fa' },
    { label: 'Желтый', value: '#facc15' },
    { label: 'Оранжевый', value: '#fb923c' },
    { label: 'Красный', value: '#f87171' },
    { label: 'Фиолетовый', value: '#a78bfa' },
    { label: 'Розовый', value: '#f472b6' },
    { label: 'Бирюзовый', value: '#2dd4bf' }
  ];
  
  let currentStageIndex = 0;
  let timeRemaining = stages[0].duration * 60;
  let isRunning = false;
  let isFinished = false;
  let interval = null;
  let isEditing = false;
  let backgroundColor = '#4ade80';
  let isFullscreen = false;
  let showMobileStages = false;
  
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      isFullscreen = true;
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        isFullscreen = false;
      }
    }
  }
  
  $: currentStage = stages[currentStageIndex] || stages[0];
  $: nextStage = stages[currentStageIndex + 1];
  
  // Фон всегда соответствует цвету текущего этапа
  $: backgroundColor = currentStage?.color || '#4ade80';
  
  $: totalDuration = stages.reduce((sum, stage) => sum + stage.duration, 0) * 60;
  $: elapsedTotal = stages.slice(0, currentStageIndex).reduce((sum, stage) => sum + stage.duration, 0) * 60 + (currentStage.duration * 60 - timeRemaining);
  $: progressPercent = (elapsedTotal / totalDuration) * 100;
  $: stageProgressPercent = ((currentStage.duration * 60 - timeRemaining) / (currentStage.duration * 60)) * 100;
  
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  // Timer management
  function startTimer() {
    if (interval) clearInterval(interval);
    
    interval = setInterval(() => {
      if (timeRemaining <= 0) {
        const nextIndex = currentStageIndex + 1;
        if (nextIndex < stages.length) {
          currentStageIndex = nextIndex;
          timeRemaining = stages[nextIndex].duration * 60;
        } else {
          timeRemaining = 0;
          isRunning = false;
          isFinished = true;
          if (interval) {
            clearInterval(interval);
            interval = null;
          }
        }
      } else {
        timeRemaining--;
      }
    }, 1000);
  }
  
  function stopTimer() {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  }
  
  // Watch isRunning changes
  $: {
    if (isRunning && !isFinished) {
      startTimer();
    } else {
      stopTimer();
    }
  }
  
  function togglePlay() {
    if (isFinished) return;
    isRunning = !isRunning;
  }
  
  function resetStage() {
    if (isFinished) {
      currentStageIndex = 0;
      timeRemaining = stages[0].duration * 60;
      isRunning = false;
      isFinished = false;
      return;
    }
    timeRemaining = stages[currentStageIndex].duration * 60;
  }
  
  function skipStage() {
    const nextIndex = currentStageIndex + 1;
    if (nextIndex < stages.length) {
      currentStageIndex = nextIndex;
      timeRemaining = stages[nextIndex].duration * 60;
    } else {
      isFinished = true;
      isRunning = false;
      timeRemaining = 0;
    }
  }
  
  function adjustTime(seconds) {
    timeRemaining = Math.max(0, timeRemaining + seconds);
  }
  
  function updateStage(index, updatedStage) {
    stages[index] = updatedStage;
    stages = [...stages];
  }
  
  function removeStage(index) {
    if (stages.length <= 1) return;
    stages = stages.filter((_, i) => i !== index);
    if (currentStageIndex >= stages.length) {
      currentStageIndex = 0;
      timeRemaining = stages[0].duration * 60;
      isRunning = false;
    }
  }
  
  function addStage() {
    const newStage = {
      id: Date.now(),
      name: 'Новый этап',
      duration: 5,
      color: '#fb923c'
    };
    stages = [...stages, newStage];
  }
  
  function toggleEditMode() {
    isEditing = !isEditing;
  }
  
  onDestroy(() => {
    if (interval) clearInterval(interval);
  });
</script>

<svelte:head>
  <title>Таймер урока - EvrikaEdu</title>
  <meta name="description" content="Таймер для управления этапами урока" />
</svelte:head>


{#if isFinished}
  <!-- Экран завершения урока -->
  <div class="min-h-screen flex flex-col items-center justify-center p-6 text-center text-white font-sans" style="background-color: {backgroundColor};">
    <div class="fixed inset-0 bg-gradient-to-br from-black from-opacity-5 to-black to-opacity-30 pointer-events-none"></div>
    <div class="relative bg-white bg-opacity-10 backdrop-blur-xl p-10 rounded-3xl border border-white border-opacity-20 shadow-2xl max-w-md w-full">
      <h1 class="text-4xl md:text-5xl font-bold mb-4">Урок завершен!</h1>
      <p class="text-lg md:text-xl text-white text-opacity-80 mb-8">Отличная работа!</p>
      <button 
        on:click={resetStage}
        class="bg-white text-rose-500 px-8 py-3 rounded-full font-bold text-base md:text-lg hover:bg-rose-50 transition-colors shadow-lg"
      >
        Начать новый урок
      </button>
    </div>
  </div>
{:else}
  <!-- Динамический фон (общий) -->
  <div class="fixed inset-0 -z-50 transition-colors duration-[1500ms] ease-in-out" style="background-color: {backgroundColor};"></div>
  <div class="fixed inset-0 -z-40 bg-gradient-to-br from-black from-opacity-5 to-black to-opacity-30 pointer-events-none"></div>

  <!-- ========== МОБИЛЬНЫЙ ТАЙМЕР (полноэкранный) ========== -->
  <div class="md:hidden h-[calc(100vh-3.5rem-4rem)] flex flex-col items-center justify-between font-sans text-white overflow-hidden px-4 py-4 relative">
    
    <!-- Верхняя панель: настройки + заголовок + полноэкран -->
    <div class="w-full flex items-center justify-between flex-shrink-0">
      <button on:click={toggleEditMode} class="p-2 rounded-full hover:bg-white hover:bg-opacity-10 text-white text-opacity-80 transition-colors">
        {#if isEditing}
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
        {:else}
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
        {/if}
      </button>
      <div class="text-center">
        <h1 class="text-lg font-bold tracking-tight">Таймер урока</h1>
        <p class="text-white text-opacity-50 text-[10px]">EvrikaEdu</p>
      </div>
      <button on:click={toggleFullscreen} class="p-2 rounded-full hover:bg-white hover:bg-opacity-10 text-white text-opacity-80 transition-colors" title="Полноэкранный режим">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
      </button>
    </div>

    <!-- Круговой таймер (большой, по центру) -->
    <div class="flex-1 flex items-center justify-center">
      <div class="relative flex items-center justify-center">
        <svg class="transform -rotate-90 drop-shadow-2xl w-[280px] h-[280px]" viewBox="0 0 340 340">
          <circle stroke="rgba(255,255,255,0.1)" stroke-width="12" fill="transparent" r="120" cx="170" cy="170" />
          <circle stroke={backgroundColor} stroke-width="12" stroke-linecap="round" fill="transparent" r="120" cx="170" cy="170"
            style="stroke-dasharray: {2 * Math.PI * 120}; stroke-dashoffset: {2 * Math.PI * 120 * (1 - stageProgressPercent / 100)}; transition: stroke-dashoffset 0.5s linear;" />
          <circle stroke="rgba(255,255,255,0.05)" stroke-width="6" fill="transparent" r="162" cx="170" cy="170" />
          <circle stroke="white" stroke-width="6" stroke-linecap="round" fill="transparent" r="162" cx="170" cy="170" opacity="0.6"
            style="stroke-dasharray: {2 * Math.PI * 162}; stroke-dashoffset: {2 * Math.PI * 162 * (1 - progressPercent / 100)}; transition: stroke-dashoffset 1s linear;" />
        </svg>
        <div class="absolute flex flex-col items-center justify-center text-center">
          <span class="text-white text-opacity-70 text-xs font-semibold tracking-widest uppercase mb-1">Текущий этап</span>
          <h1 class="text-5xl font-bold text-white tabular-nums tracking-tight drop-shadow-lg">{formatTime(timeRemaining)}</h1>
          <div class="mt-2 px-4 py-1 rounded-full bg-white bg-opacity-20 backdrop-blur-md border border-white border-opacity-10">
            <span class="text-white font-semibold text-sm">{currentStage.name}</span>
          </div>
          {#if nextStage}
            <div class="mt-2 flex items-center gap-1.5 text-white text-opacity-60 text-xs">
              <span>Далее:</span>
              <span class="font-semibold text-white">{nextStage.name}</span>
            </div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Управление (внизу) -->
    <div class="flex flex-col items-center gap-3 flex-shrink-0 w-full pb-1">
      <!-- Кнопки play -->
      <div class="flex items-center justify-center gap-8">
        <button on:click={resetStage} class="w-12 h-12 flex items-center justify-center rounded-full bg-white bg-opacity-10 text-white active:scale-95 transition-all" title="Перезапустить">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
        </button>
        <button on:click={togglePlay} class="w-16 h-16 flex items-center justify-center rounded-full bg-white text-rose-500 shadow-xl active:scale-95 transition-all">
          {#if isRunning}
            <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
          {:else}
            <svg class="w-8 h-8 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          {/if}
        </button>
        <button on:click={skipStage} class="w-12 h-12 flex items-center justify-center rounded-full bg-white bg-opacity-10 text-white active:scale-95 transition-all" title="Пропустить">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
        </button>
      </div>
      <!-- Быстрые действия -->
      <div class="flex items-center justify-center gap-3">
        <button on:click={() => adjustTime(-60)} class="px-5 py-2 rounded-xl bg-white bg-opacity-5 border border-white border-opacity-10 text-white text-sm font-medium flex items-center gap-2 transition-colors active:bg-white active:bg-opacity-15">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path></svg>1м
        </button>
        <button on:click={() => adjustTime(30)} class="px-5 py-2 rounded-xl bg-white bg-opacity-5 border border-white border-opacity-10 text-white text-sm font-medium flex items-center gap-2 transition-colors active:bg-white active:bg-opacity-15">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>30с
        </button>
      </div>
      <!-- Кнопка "План урока" -->
      <button on:click={() => showMobileStages = true} class="px-4 py-1.5 rounded-full bg-white bg-opacity-10 border border-white border-opacity-15 text-white text-opacity-70 text-xs font-medium flex items-center gap-1.5 transition-colors active:bg-white active:bg-opacity-20">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
        План урока ({currentStageIndex + 1}/{stages.length})
      </button>
    </div>

    <!-- Мобильный bottom sheet: этапы -->
    {#if showMobileStages}
      <div class="fixed inset-0 z-50 flex flex-col justify-end" on:click={() => showMobileStages = false}>
        <div class="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm"></div>
        <div class="relative bg-black bg-opacity-80 backdrop-blur-2xl rounded-t-3xl max-h-[75vh] flex flex-col overflow-hidden" on:click|stopPropagation>
          <!-- Handle -->
          <div class="flex items-center justify-center py-2 flex-shrink-0">
            <div class="w-10 h-1 rounded-full bg-white bg-opacity-30"></div>
          </div>
          <div class="flex items-center justify-between px-4 pb-2 flex-shrink-0">
            <h2 class="text-base font-semibold text-white">План урока</h2>
            <div class="flex items-center gap-2">
              {#if isEditing}
                <button on:click={addStage} class="text-xs bg-white text-rose-500 px-3 py-1 rounded-full font-bold">+ Добавить</button>
              {/if}
              <button on:click={() => showMobileStages = false} class="p-1 rounded-full text-white text-opacity-60 hover:text-white">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
          </div>
          <div class="flex-1 overflow-y-auto px-4 pb-6 space-y-2" style="scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.2) transparent;">
            {#each stages as stage, index (stage.id)}
              {@const isActive = index === currentStageIndex}
              {@const isPast = index < currentStageIndex}
              {#if isEditing}
                <div class="bg-white bg-opacity-10 backdrop-blur-md p-3 rounded-xl border border-white border-opacity-20 flex flex-col gap-2">
                  <div class="flex items-center gap-2">
                    <input value={stage.name} on:input={(e) => updateStage(index, { ...stage, name: e.target.value })}
                      class="flex-1 bg-transparent border-b border-white border-opacity-30 text-white text-sm placeholder-white placeholder-opacity-50 focus:outline-none focus:border-white px-1 py-0.5" placeholder="Название" />
                    <button on:click={() => removeStage(index)} class="text-white text-opacity-60 hover:text-white"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                  </div>
                  <div class="flex items-center gap-3 pl-2">
                    <div class="flex items-center gap-1 bg-black bg-opacity-20 rounded-md px-2 py-0.5">
                      <input type="number" min="1" max="120" value={stage.duration} on:input={(e) => updateStage(index, { ...stage, duration: parseInt(e.target.value) || 1 })} class="w-10 bg-transparent text-center text-white text-xs focus:outline-none" />
                      <span class="text-[10px] text-white text-opacity-60">мин</span>
                    </div>
                    <div class="flex gap-1 flex-1 overflow-x-auto">
                      {#each COLORS as c}
                        <button on:click={() => updateStage(index, { ...stage, color: c.value })}
                          class="w-5 h-5 rounded-full border-2 transition-transform flex-shrink-0"
                          class:border-white={stage.color === c.value} class:border-transparent={stage.color !== c.value}
                          style="background-color: {c.value};" title={c.label} />
                      {/each}
                    </div>
                  </div>
                </div>
              {:else}
                <div class="relative p-3 rounded-xl border transition-all duration-300 {isActive ? 'bg-white text-gray-800 border-white shadow-lg' : isPast ? 'bg-white bg-opacity-5 border-transparent text-white text-opacity-50' : 'bg-white bg-opacity-10 border-white border-opacity-10 text-white'}">
                  {#if isActive}
                    <div class="absolute bottom-0 left-0 h-1 bg-gray-100 w-full rounded-b-xl overflow-hidden">
                      <div class="h-full transition-all duration-1000 ease-linear" style="width: 100%; background-color: {stage.color}; animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;" />
                    </div>
                  {/if}
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="w-2.5 h-10 rounded-full" class:opacity-80={!isActive} style="background-color: {stage.color};" />
                      <div>
                        <h3 class="font-bold leading-tight text-sm" class:text-base={isActive}>{stage.name}</h3>
                        <p class="text-xs mt-0.5 {isActive ? 'text-gray-500' : 'text-white text-opacity-60'}">{stage.duration} мин</p>
                      </div>
                    </div>
                    {#if isActive}
                      <div class="bg-gray-100 rounded-full px-3 py-1"><span class="text-xs font-bold text-gray-600 uppercase tracking-wider">Сейчас</span></div>
                    {/if}
                  </div>
                </div>
              {/if}
            {/each}
          </div>
          <!-- Прогресс -->
          <div class="px-4 pb-4 pt-2 border-t border-white border-opacity-10 flex-shrink-0">
            <div class="flex justify-between text-xs mb-1 text-white text-opacity-60"><span>Прогресс</span><span>{Math.round(progressPercent)}%</span></div>
            <div class="h-1.5 bg-white bg-opacity-10 rounded-full overflow-hidden"><div class="h-full bg-white transition-all duration-1000 ease-out" style="width: {progressPercent}%;" /></div>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- ========== ДЕСКТОП ТАЙМЕР (карточка с двумя колонками) ========== -->
  <div class="hidden md:flex h-[calc(100vh-4rem)] items-center justify-center py-3 px-6 font-sans text-white overflow-hidden">
    <div class="w-full max-w-5xl bg-white bg-opacity-10 backdrop-blur-3xl rounded-[3rem] border border-white border-opacity-20 shadow-2xl overflow-hidden flex flex-row max-h-full relative">
      
      <!-- Кнопки -->
      <button on:click={toggleEditMode} class="absolute top-4 left-4 z-20 p-2 rounded-full hover:bg-white hover:bg-opacity-10 text-white text-opacity-80 transition-colors">
        {#if isEditing}
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
        {:else}
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
        {/if}
      </button>
      <button on:click={toggleFullscreen} class="absolute top-4 right-4 z-20 p-2 rounded-full hover:bg-white hover:bg-opacity-10 text-white text-opacity-80 transition-colors" title="Полноэкранный режим">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
      </button>

      <!-- Левая часть: Таймер -->
      <div class="flex-1 p-8 flex flex-col items-center justify-between relative">
        <div class="w-full text-center md:text-left pl-10">
          <h1 class="text-xl font-bold tracking-tight">Таймер урока</h1>
          <p class="text-white text-opacity-60 text-xs">EvrikaEdu</p>
        </div>
        <div class="my-4">
          <div class="relative flex items-center justify-center">
            <svg class="transform -rotate-90 drop-shadow-2xl w-[340px] h-[340px]" viewBox="0 0 340 340">
              <circle stroke="rgba(255,255,255,0.1)" stroke-width="12" fill="transparent" r="125" cx="170" cy="170" />
              <circle stroke={backgroundColor} stroke-width="12" stroke-linecap="round" fill="transparent" r="125" cx="170" cy="170"
                style="stroke-dasharray: {2 * Math.PI * 125}; stroke-dashoffset: {2 * Math.PI * 125 * (1 - stageProgressPercent / 100)}; transition: stroke-dashoffset 0.5s linear;" />
              <circle stroke="rgba(255,255,255,0.05)" stroke-width="6" fill="transparent" r="165" cx="170" cy="170" />
              <circle stroke="white" stroke-width="6" stroke-linecap="round" fill="transparent" r="165" cx="170" cy="170" opacity="0.6"
                style="stroke-dasharray: {2 * Math.PI * 165}; stroke-dashoffset: {2 * Math.PI * 165 * (1 - progressPercent / 100)}; transition: stroke-dashoffset 1s linear;" />
            </svg>
            <div class="absolute flex flex-col items-center justify-center text-center">
              <span class="text-white text-opacity-80 text-xs font-medium tracking-wider uppercase mb-1">Текущий этап</span>
              <h1 class="text-6xl font-bold text-white tabular-nums tracking-tight drop-shadow-md">{formatTime(timeRemaining)}</h1>
              <div class="mt-2 px-3 py-1 rounded-full bg-white bg-opacity-20 backdrop-blur-md border border-white border-opacity-10">
                <span class="text-white font-semibold text-base">{currentStage.name}</span>
              </div>
              {#if nextStage}
                <div class="mt-3 flex items-center space-x-2 text-white text-opacity-60 text-xs">
                  <span>Далее:</span><span class="font-medium text-white">{nextStage.name}</span>
                </div>
              {/if}
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-4 w-full">
          <div class="flex items-center justify-center gap-6">
            <button on:click={resetStage} class="w-12 h-12 flex items-center justify-center rounded-full bg-white bg-opacity-10 hover:bg-white hover:bg-opacity-20 text-white transition-all active:scale-95" title="Перезапустить"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg></button>
            <button on:click={togglePlay} class="w-20 h-20 flex items-center justify-center rounded-full bg-white text-rose-500 shadow-xl hover:scale-105 active:scale-95 transition-all">
              {#if isRunning}<svg class="w-9 h-9" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>{:else}<svg class="w-9 h-9 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>{/if}
            </button>
            <button on:click={skipStage} class="w-12 h-12 flex items-center justify-center rounded-full bg-white bg-opacity-10 hover:bg-white hover:bg-opacity-20 text-white transition-all active:scale-95" title="Пропустить"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg></button>
          </div>
          <div class="flex items-center justify-center gap-3">
            <button on:click={() => adjustTime(-60)} class="px-4 py-2 rounded-lg bg-white bg-opacity-5 border border-white border-opacity-10 hover:bg-white hover:bg-opacity-10 text-white text-sm font-medium flex items-center gap-2 transition-colors"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path></svg>1м</button>
            <button on:click={() => adjustTime(30)} class="px-4 py-2 rounded-lg bg-white bg-opacity-5 border border-white border-opacity-10 hover:bg-white hover:bg-opacity-10 text-white text-sm font-medium flex items-center gap-2 transition-colors"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>30с</button>
          </div>
        </div>
      </div>

      <!-- Правая часть: Этапы -->
      <div class="w-[360px] bg-black bg-opacity-20 border-l border-white border-opacity-10 p-6 flex flex-col overflow-y-auto">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold text-white">План урока</h2>
          {#if isEditing}
            <button on:click={addStage} class="text-xs bg-white text-rose-500 px-3 py-1 rounded-full font-bold hover:bg-rose-50 transition-colors shadow-sm">+ Добавить</button>
          {/if}
        </div>
        <div class="flex-1 overflow-y-auto pr-2 space-y-2" style="scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.2) transparent;">
          {#each stages as stage, index (stage.id)}
            {@const isActive = index === currentStageIndex}
            {@const isPast = index < currentStageIndex}
            {#if isEditing}
              <div class="bg-white bg-opacity-10 backdrop-blur-md p-3 rounded-xl border border-white border-opacity-20 flex flex-col gap-3">
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-white text-opacity-40 cursor-move" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path></svg>
                  <input value={stage.name} on:input={(e) => updateStage(index, { ...stage, name: e.target.value })} class="flex-1 bg-transparent border-b border-white border-opacity-30 text-white placeholder-white placeholder-opacity-50 focus:outline-none focus:border-white px-1 py-0.5" placeholder="Название этапа" />
                  <button on:click={() => removeStage(index)} class="text-white text-opacity-60 hover:text-white transition-colors"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                </div>
                <div class="flex items-center gap-4 pl-6">
                  <div class="flex items-center gap-1 bg-black bg-opacity-20 rounded-md px-2 py-1">
                    <svg class="w-3.5 h-3.5 text-white text-opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <input type="number" min="1" max="120" value={stage.duration} on:input={(e) => updateStage(index, { ...stage, duration: parseInt(e.target.value) || 1 })} class="w-12 bg-transparent text-center text-white text-sm focus:outline-none" />
                    <span class="text-xs text-white text-opacity-60">мин</span>
                  </div>
                  <div class="flex gap-1 flex-1 overflow-x-auto pb-1">
                    {#each COLORS as c}
                      <button on:click={() => updateStage(index, { ...stage, color: c.value })} class="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 flex-shrink-0" class:border-white={stage.color === c.value} class:scale-110={stage.color === c.value} class:border-transparent={stage.color !== c.value} style="background-color: {c.value};" title={c.label} />
                    {/each}
                  </div>
                </div>
              </div>
            {:else}
              <div class="relative p-3 rounded-xl border transition-all duration-300 {isActive ? 'bg-white text-gray-800 border-white shadow-lg scale-[1.02]' : isPast ? 'bg-black bg-opacity-10 border-transparent text-white text-opacity-50' : 'bg-white bg-opacity-10 border-white border-opacity-10 text-white'}">
                {#if isActive}<div class="absolute bottom-0 left-0 h-1 bg-gray-100 w-full rounded-b-xl overflow-hidden"><div class="h-full transition-all duration-1000 ease-linear" style="width: 100%; background-color: {stage.color}; animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;" /></div>{/if}
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3"><div class="w-2.5 h-10 rounded-full" class:opacity-80={!isActive} style="background-color: {stage.color};" /><div><h3 class="font-bold leading-tight" class:text-base={isActive} class:text-sm={!isActive}>{stage.name}</h3><p class="text-xs mt-1 {isActive ? 'text-gray-500' : 'text-white text-opacity-60'}">{stage.duration} мин</p></div></div>
                  {#if isActive}<div class="bg-gray-100 rounded-full px-3 py-1"><span class="text-xs font-bold text-gray-600 uppercase tracking-wider">Сейчас</span></div>{/if}
                </div>
              </div>
            {/if}
          {/each}
        </div>
        <div class="mt-4 pt-4 border-t border-white border-opacity-10">
          <div class="flex justify-between text-sm mb-2 text-white text-opacity-60"><span>Общий прогресс</span><span>{Math.round(progressPercent)}%</span></div>
          <div class="h-2 bg-white bg-opacity-10 rounded-full overflow-hidden"><div class="h-full bg-white transition-all duration-1000 ease-out" style="width: {progressPercent}%;" /></div>
        </div>
      </div>
    </div>
  </div>
{/if}
