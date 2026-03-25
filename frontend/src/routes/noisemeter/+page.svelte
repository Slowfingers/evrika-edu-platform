<script>
  import { onMount, onDestroy } from 'svelte';
  import { t } from '$lib/stores/lang.js';

  // --- State ---
  let noiseLevel = 0;       // 0-100
  let noiseRaw = 0;         // dB
  let noiseHistory = [];     // последние 60 значений для графика
  let status = 'idle';       // 'idle' | 'active' | 'error'
  let errorMsg = '';

  // Локальный микрофон
  let localStream = null;
  let audioContext = null;
  let analyser = null;
  let localAnimFrame = null;

  // Визуальные пороги
  $: THRESHOLDS = [
    { max: 25, label: $t('noise_silence'), color: '#22c55e', bgFrom: '#4ade80', bgTo: '#10b981' },
    { max: 50, label: $t('noise_normal'), color: '#eab308', bgFrom: '#facc15', bgTo: '#f59e0b' },
    { max: 75, label: $t('noise_loud'), color: '#f97316', bgFrom: '#fb923c', bgTo: '#ef4444' },
    { max: 100, label: $t('noise_very_loud'), color: '#ef4444', bgFrom: '#f87171', bgTo: '#dc2626' },
  ];

  $: currentThreshold = THRESHOLDS.find(t => noiseLevel <= t.max) || THRESHOLDS[3];
  $: bgOpacity = status === 'active' ? Math.min(0.35, noiseLevel / 100 * 0.5) : 0;
  $: pulseScale = status === 'active' ? 1 + noiseLevel / 100 * 0.15 : 1;
  
  // Динамический градиент фона: зелёный → жёлтый → красный по уровню шума
  $: bgGradient = (() => {
    if (status !== 'active') return 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)';
    const level = noiseLevel / 100;
    if (level < 0.25) {
      return `linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)`;
    } else if (level < 0.5) {
      const mix = (level - 0.25) / 0.25;
      return `linear-gradient(135deg, #10b981 0%, #84cc16 ${mix * 50}%, #eab308 100%)`;
    } else if (level < 0.75) {
      const mix = (level - 0.5) / 0.25;
      return `linear-gradient(135deg, #eab308 0%, #f59e0b ${mix * 50}%, #f97316 100%)`;
    } else {
      const mix = (level - 0.75) / 0.25;
      return `linear-gradient(135deg, #f97316 0%, #ef4444 ${mix * 50}%, #dc2626 100%)`;
    }
  })();

  async function startMicrophone() {
    try {
      status = 'active';
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(localStream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      function tick() {
        if (!analyser) return;
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const level = Math.min(100, Math.round((avg / 128) * 100));
        noiseLevel = level;
        noiseRaw = Math.round(avg);
        pushHistory(level);
        localAnimFrame = requestAnimationFrame(tick);
      }
      tick();
    } catch (e) {
      status = 'error';
      errorMsg = $t('noise_error_mic');
    }
  }

  function stopMicrophone() {
    if (localAnimFrame) cancelAnimationFrame(localAnimFrame);
    if (localStream) localStream.getTracks().forEach(t => t.stop());
    if (audioContext) audioContext.close();
    localStream = null;
    audioContext = null;
    analyser = null;
    status = 'idle';
    noiseLevel = 0;
    noiseRaw = 0;
    noiseHistory = [];
  }

  function pushHistory(level) {
    noiseHistory = [...noiseHistory.slice(-59), level];
  }

  onDestroy(() => {
    stopMicrophone();
  });
</script>

<svelte:head>
  <title>{$t('title_noisemeter')}</title>
  <meta name="description" content={$t('noise_desc')} />
</svelte:head>

{#if status === 'idle'}
  <!-- Начальный экран -->
  <div class="h-[calc(100vh-3.5rem-4rem)] md:h-[calc(100vh-4rem)] flex items-center justify-center p-4 overflow-hidden">
    <div class="max-w-md w-full text-center">
      <div class="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-xl">
        <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m-4 0h8m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
        </svg>
      </div>
      <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{$t('noise_title')}</h1>
      <p class="text-gray-700 text-base font-medium mb-8">{$t('noise_desc')}</p>
      
      <button
        on:click={startMicrophone}
        class="px-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl font-semibold text-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
      >
        <span class="flex items-center gap-3 justify-center">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          {$t('noise_start')}
        </span>
      </button>

      <p class="text-gray-600 text-sm mt-6 font-medium">
        {$t('noise_hint')}
      </p>
    </div>
  </div>

{:else if status === 'error'}
  <!-- Ошибка -->
  <div class="h-[calc(100vh-3.5rem-4rem)] md:h-[calc(100vh-4rem)] flex items-center justify-center p-4 overflow-hidden">
    <div class="max-w-md w-full text-center">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
        <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
        </svg>
      </div>
      <h2 class="text-2xl font-bold text-gray-900 mb-2">{$t('noise_error_title')}</h2>
      <p class="text-gray-700 mb-6 font-medium">{errorMsg}</p>
      <button
        on:click={() => { status = 'idle'; errorMsg = ''; }}
        class="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
      >
        {$t('noise_back')}
      </button>
    </div>
  </div>

{:else if status === 'active'}
  <!-- Активный шумомер -->
  <div class="fixed inset-0 z-50 flex flex-col overflow-hidden transition-all duration-700" style="background: {bgGradient};">
    
    <!-- Кнопка остановки -->
    <button
      on:click={stopMicrophone}
      class="fixed top-20 md:top-6 right-4 md:right-6 z-10 p-3 rounded-2xl bg-white bg-opacity-20 backdrop-blur-md text-white hover:bg-opacity-30 transition-all border border-white border-opacity-30"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    </button>

    <!-- Основной контент -->
    <div class="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
      
      <!-- Круговой индикатор -->
      <div class="relative mb-8" style="transform: scale({pulseScale}); transition: transform 0.3s ease-out;">
        <svg class="transform -rotate-90 w-64 h-64 md:w-80 md:h-80 drop-shadow-2xl" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="8"/>
          <circle 
            cx="100" cy="100" r="90" fill="none" 
            stroke="white" stroke-width="8" stroke-linecap="round"
            stroke-dasharray="{2 * Math.PI * 90}"
            stroke-dashoffset="{2 * Math.PI * 90 * (1 - noiseLevel / 100)}"
            style="transition: stroke-dashoffset 0.3s ease-out;"
          />
        </svg>
        
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <div class="text-7xl md:text-8xl font-bold text-white tabular-nums drop-shadow-lg">
            {noiseLevel}
          </div>
          <div class="text-white text-opacity-90 text-lg md:text-xl font-semibold mt-2">
            {currentThreshold.label}
          </div>
        </div>
      </div>

      <!-- График истории -->
      <div class="w-full max-w-2xl h-24 bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-4 border border-white border-opacity-20">
        <div class="h-full flex items-end gap-1">
          {#each noiseHistory as level}
            <div 
              class="flex-1 bg-white rounded-t transition-all duration-300"
              style="height: {level}%; opacity: 0.7;"
            ></div>
          {/each}
        </div>
      </div>

      <!-- Подсказка -->
      <p class="text-white text-opacity-80 text-sm md:text-base mt-6 font-medium">
        {$t('noise_level_label')}: {noiseRaw} dB
      </p>
    </div>
  </div>
{/if}
