<script>
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';

  // --- State ---
  let mode = 'choose'; // 'choose' | 'local' | 'remote'
  let ws = null;
  let roomCode = '';
  let codeExpiresAt = 0;
  let codeCountdown = '';
  let senderConnected = false;
  let noiseLevel = 0;       // 0-100
  let noiseRaw = 0;         // dB
  let noiseHistory = [];     // последние 60 значений для графика
  let status = 'idle';       // 'idle' | 'connecting' | 'waiting' | 'active' | 'error' | 'paused'
  let errorMsg = '';
  let codeTimer = null;

  // Локальный микрофон
  let localStream = null;
  let audioContext = null;
  let analyser = null;
  let localAnimFrame = null;

  // Визуальные пороги
  const THRESHOLDS = [
    { max: 25, label: 'Тишина', color: '#22c55e', bgFrom: '#4ade80', bgTo: '#10b981' },
    { max: 50, label: 'Нормально', color: '#eab308', bgFrom: '#facc15', bgTo: '#f59e0b' },
    { max: 75, label: 'Шумно', color: '#f97316', bgFrom: '#fb923c', bgTo: '#ef4444' },
    { max: 100, label: 'Очень громко!', color: '#ef4444', bgFrom: '#f87171', bgTo: '#dc2626' },
  ];

  $: currentThreshold = THRESHOLDS.find(t => noiseLevel <= t.max) || THRESHOLDS[3];
  $: bgOpacity = status === 'active' ? Math.min(0.35, noiseLevel / 100 * 0.5) : 0;
  $: pulseScale = status === 'active' ? 1 + noiseLevel / 100 * 0.15 : 1;
  
  // Динамический градиент фона: зелёный → жёлтый → красный по уровню шума
  $: bgGradient = (() => {
    if (status !== 'active') return 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)';
    const level = noiseLevel / 100;
    if (level < 0.25) {
      // Тишина: зелёный
      return `linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)`;
    } else if (level < 0.5) {
      // Нормально: зелёный → жёлтый
      const mix = (level - 0.25) / 0.25;
      return `linear-gradient(135deg, #10b981 0%, #84cc16 ${mix * 50}%, #eab308 100%)`;
    } else if (level < 0.75) {
      // Шумно: жёлтый → оранжевый
      const mix = (level - 0.5) / 0.25;
      return `linear-gradient(135deg, #eab308 0%, #f59e0b ${mix * 50}%, #f97316 100%)`;
    } else {
      // Очень громко: оранжевый → красный
      const mix = (level - 0.75) / 0.25;
      return `linear-gradient(135deg, #f97316 0%, #ef4444 ${mix * 50}%, #dc2626 100%)`;
    }
  })();

  function getWsUrl() {
    if (!browser) return '';
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.hostname;
    if (!host.includes('localhost')) {
      return `wss://evrika-backend.onrender.com/ws/noisemeter`;
    }
    return `${proto}://${host}:10000/ws/noisemeter`;
  }

  function chooseRemote() {
    mode = 'remote';
    connectDisplay();
  }

  function chooseLocal() {
    mode = 'local';
    startLocalMic();
  }

  function connectDisplay() {
    status = 'connecting';
    const url = `${getWsUrl()}?role=display`;
    ws = new WebSocket(url);

    ws.onopen = () => {
      status = 'waiting';
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === 'room_created') {
        roomCode = msg.code;
        codeExpiresAt = msg.codeExpiresAt;
        startCodeCountdown();
      } else if (msg.type === 'code_refreshed' || msg.type === 'session_reset') {
        roomCode = msg.code;
        codeExpiresAt = msg.codeExpiresAt;
        senderConnected = false;
        startCodeCountdown();
      } else if (msg.type === 'sender_connected') {
        senderConnected = true;
        status = 'active';
      } else if (msg.type === 'sender_disconnected') {
        senderConnected = false;
        status = 'waiting';
        noiseLevel = 0;
        noiseRaw = 0;
      } else if (msg.type === 'noise_level') {
        noiseLevel = Math.min(100, Math.max(0, msg.level));
        noiseRaw = msg.raw || 0;
        pushHistory(noiseLevel);
      } else if (msg.type === 'error') {
        status = 'error';
        errorMsg = msg.message;
      }
    };

    ws.onclose = () => {
      if (status !== 'error') {
        status = 'idle';
      }
    };

    ws.onerror = () => {
      status = 'error';
      errorMsg = 'Ошибка подключения к серверу';
    };
  }

  function startCodeCountdown() {
    if (codeTimer) clearInterval(codeTimer);
    codeTimer = setInterval(() => {
      const remaining = Math.max(0, codeExpiresAt - Date.now());
      if (remaining <= 0) {
        codeCountdown = 'Истёк';
        clearInterval(codeTimer);
        refreshCode();
      } else {
        const min = Math.floor(remaining / 60000);
        const sec = Math.floor((remaining % 60000) / 1000);
        codeCountdown = `${min}:${String(sec).padStart(2, '0')}`;
      }
    }, 1000);
  }

  function refreshCode() {
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'refresh_code' }));
    }
  }

  function resetSession() {
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'reset_session' }));
    }
    noiseLevel = 0;
    noiseRaw = 0;
    noiseHistory = [];
    senderConnected = false;
  }

  // --- Локальный микрофон ---
  async function startLocalMic() {
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
      errorMsg = 'Нет доступа к микрофону. Разрешите доступ или используйте подключение с телефона.';
    }
  }

  function stopLocalMic() {
    if (localAnimFrame) cancelAnimationFrame(localAnimFrame);
    if (localStream) localStream.getTracks().forEach(t => t.stop());
    if (audioContext) audioContext.close();
    localStream = null;
    audioContext = null;
    analyser = null;
  }

  function stopListening() {
    if (mode === 'local') {
      stopLocalMic();
    }
    if (mode === 'remote' && ws) {
      ws.close();
      ws = null;
    }
    if (codeTimer) clearInterval(codeTimer);
    status = 'paused';
    noiseLevel = 0;
  }

  function pushHistory(level) {
    noiseHistory = [...noiseHistory.slice(-59), level];
  }

  function backToChoose() {
    stopLocalMic();
    if (ws) ws.close();
    if (codeTimer) clearInterval(codeTimer);
    ws = null;
    mode = 'choose';
    status = 'idle';
    noiseLevel = 0;
    noiseRaw = 0;
    noiseHistory = [];
    senderConnected = false;
    roomCode = '';
    errorMsg = '';
  }

  onDestroy(() => {
    stopLocalMic();
    if (ws) ws.close();
    if (codeTimer) clearInterval(codeTimer);
  });
</script>

<svelte:head>
  <title>Шумомер - EvrikaEdu</title>
  <meta name="description" content="Шумомер для класса — измеряйте уровень шума в реальном времени" />
</svelte:head>

{#if mode === 'choose'}
  <!-- Экран выбора режима — glassmorphism стиль -->
  <div class="h-[calc(100vh-3.5rem-4rem)] md:h-[calc(100vh-4rem)] flex items-center justify-center p-4 overflow-hidden">
    <div class="max-w-md w-full">
      <!-- Заголовок -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m-4 0h8m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
          </svg>
        </div>
        <h1 class="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Шумомер</h1>
        <p class="text-gray-500 text-sm">Измеряйте уровень шума в классе в реальном времени</p>
      </div>

      <!-- Кнопки выбора -->
      <div class="space-y-3">
        <!-- Локальный микрофон -->
        <button
          on:click={chooseLocal}
          class="card w-full !p-4 text-left hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 group"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 transition-colors">
              <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m-4 0h8m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-base font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">Микрофон устройства</h3>
              <p class="text-xs text-gray-500">Встроенный микрофон компьютера или доски</p>
            </div>
            <svg class="w-5 h-5 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </div>
        </button>

        <!-- Удалённый телефон -->
        <button
          on:click={chooseRemote}
          class="card w-full !p-4 text-left hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 group"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-base font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">Подключить телефон</h3>
              <p class="text-xs text-gray-500">Нет микрофона? Используйте телефон по коду</p>
            </div>
            <svg class="w-5 h-5 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </div>
        </button>
      </div>

      <!-- Подсказка внизу -->
      <p class="text-center text-gray-400 text-xs mt-6">
        Выберите источник звука для измерения
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
      <h2 class="text-2xl font-bold text-gray-800 mb-2">Ошибка</h2>
      <p class="text-gray-500 mb-6">{errorMsg}</p>
      <button
        on:click={backToChoose}
        class="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
      >
        <span class="flex items-center gap-2 justify-center">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          Назад
        </span>
      </button>
    </div>
  </div>

{:else if status === 'paused'}
  <!-- Остановлен -->
  <div class="h-[calc(100vh-3.5rem-4rem)] md:h-[calc(100vh-4rem)] flex items-center justify-center p-4 overflow-hidden">
    <div class="max-w-md w-full text-center">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"></path>
        </svg>
      </div>
      <h2 class="text-2xl font-bold text-gray-800 mb-2">Шумомер остановлен</h2>
      <p class="text-gray-500 mb-6">Микрофон отключён</p>
      <div class="flex gap-3 justify-center">
        <button
          on:click={backToChoose}
          class="px-5 py-3 rounded-xl bg-white border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
        >
          <span class="flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Выбрать режим
          </span>
        </button>
        <button
          on:click={chooseLocal}
          class="px-5 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:shadow-lg transition-all"
        >
          <span class="flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Запустить снова
          </span>
        </button>
      </div>
    </div>
  </div>

{:else if mode === 'remote' && !senderConnected}
  <!-- Ожидание подключения телефона -->
  <div class="h-[calc(100vh-3.5rem-4rem)] md:h-[calc(100vh-4rem)] flex items-center justify-center p-4 relative overflow-hidden">
    <button
      on:click={backToChoose}
      class="fixed top-20 left-4 md:top-6 md:left-6 z-10 p-2 rounded-xl bg-white bg-opacity-70 backdrop-blur-md text-gray-600 hover:bg-opacity-100 transition-all"
      style="border: 1px solid rgba(255,255,255,0.3);"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
      </svg>
    </button>

    <div class="max-w-md w-full text-center">
      <div class="bg-white bg-opacity-70 backdrop-blur-xl rounded-3xl p-8 shadow-xl" style="border: 1px solid rgba(255,255,255,0.3);">
        <div class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
          <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-800 mb-2">Подключите телефон</h2>
        <p class="text-gray-500 mb-6">Откройте шумомер на телефоне и введите код:</p>

        <!-- Код -->
        <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-4">
          <div class="text-5xl font-mono font-bold tracking-[0.3em] text-indigo-600">
            {roomCode || '------'}
          </div>
          <div class="text-sm text-indigo-400 mt-2">
            {#if codeCountdown && codeCountdown !== 'Истёк'}
              Код действителен: {codeCountdown}
            {:else}
              Обновление кода...
            {/if}
          </div>
        </div>

        <p class="text-xs text-gray-400 mb-4">
          Перейдите на <strong>{browser ? window.location.origin : ''}/noisemeter/connect</strong> на телефоне
        </p>

        <div class="flex gap-3 justify-center">
          <button
            on:click={refreshCode}
            class="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1.5"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Обновить код
          </button>
          <button
            on:click={resetSession}
            class="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1.5"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            Сбросить
          </button>
        </div>
      </div>

      {#if status === 'connecting'}
        <div class="mt-4 text-gray-400 text-sm flex items-center justify-center gap-2">
          <div class="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          Подключение к серверу...
        </div>
      {:else}
        <div class="mt-4 text-gray-400 text-sm flex items-center justify-center gap-2">
          <div class="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
          Ожидание подключения телефона...
        </div>
      {/if}
    </div>
  </div>

{:else}
  <!-- Основной экран шумомера (активный) -->
  <div class="h-[calc(100vh-3.5rem-4rem)] md:h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 relative overflow-hidden">
    
    <!-- Динамический градиентный фон -->
    <div 
      class="fixed inset-0 -z-50 transition-all duration-[800ms] ease-out"
      style="background: {bgGradient};"
    ></div>
    
    <!-- Дополнительный эффект свечения -->
    <div 
      class="fixed inset-0 -z-40 pointer-events-none transition-opacity duration-500"
      style="opacity: {status === 'active' ? 0.3 : 0};"
    >
      <div class="absolute inset-0" style="background: radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.15), transparent 60%);"></div>
    </div>

    <!-- Кнопка назад -->
    <button
      on:click={backToChoose}
      class="fixed top-20 left-4 md:top-6 md:left-6 z-10 p-2 rounded-xl bg-white bg-opacity-70 backdrop-blur-md text-gray-600 hover:bg-opacity-100 transition-all"
      style="border: 1px solid rgba(255,255,255,0.3);"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
      </svg>
    </button>

    <!-- Статус подключения (remote) -->
    {#if mode === 'remote'}
      <div class="fixed top-20 right-4 md:top-6 md:right-6 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white bg-opacity-70 backdrop-blur-md text-sm" style="border: 1px solid rgba(255,255,255,0.3);">
        <div class="w-2 h-2 rounded-full {senderConnected ? 'bg-green-500' : 'bg-red-400'}"></div>
        <span class="text-gray-600">{senderConnected ? 'Телефон подключён' : 'Отключён'}</span>
      </div>
    {/if}

    <!-- Главный индикатор -->
    <div class="flex flex-col items-center gap-3 md:gap-6 max-w-lg w-full">
      
      <!-- Статус-лейбл -->
      <div class="text-center">
        <h2 class="text-xl md:text-3xl font-bold text-white mb-1 transition-all duration-300 drop-shadow-lg">{currentThreshold.label}</h2>
        <p class="text-white text-opacity-80 text-xs md:text-sm drop-shadow">Уровень шума в классе</p>
      </div>

      <!-- Круговой индикатор -->
      <div class="relative w-52 h-52 md:w-72 md:h-72 transition-transform duration-200 ease-out" style="transform: scale({1 + noiseLevel / 100 * 0.04});">
        <svg viewBox="0 0 200 200" class="w-full h-full transform -rotate-90">
          <!-- Фоновый круг -->
          <circle
            cx="100" cy="100" r="85"
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            stroke-width="14"
          />
          <!-- Прогресс -->
          <circle
            cx="100" cy="100" r="85"
            fill="none"
            stroke="white"
            stroke-width="14"
            stroke-linecap="round"
            stroke-dasharray="{2 * Math.PI * 85}"
            stroke-dashoffset="{2 * Math.PI * 85 * (1 - noiseLevel / 100)}"
            style="transition: stroke-dashoffset 0.15s ease-out; filter: drop-shadow(0 0 8px rgba(255,255,255,0.5));"
          />
        </svg>
        <!-- Число в центре -->
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span class="text-6xl md:text-7xl font-bold tabular-nums text-white drop-shadow-lg">
            {noiseLevel}
          </span>
          <span class="text-white text-opacity-70 text-sm font-medium">/ 100</span>
        </div>
      </div>

      <!-- Мини-график истории -->
      {#if noiseHistory.length > 1}
        <div class="w-full max-w-md h-16 bg-white bg-opacity-20 backdrop-blur-md rounded-2xl p-2 overflow-hidden" style="border: 1px solid rgba(255,255,255,0.3);">
          <svg viewBox="0 0 {noiseHistory.length - 1} 100" preserveAspectRatio="none" class="w-full h-full">
            <polyline
              fill="none"
              stroke="white"
              stroke-width="2"
              stroke-linejoin="round"
              points={noiseHistory.map((v, i) => `${i},${100 - v}`).join(' ')}
              style="filter: drop-shadow(0 0 4px rgba(255,255,255,0.5));"
            />
          </svg>
        </div>
      {/if}

      <!-- Кнопки управления -->
      <div class="flex gap-3 items-center">
        {#if mode === 'remote'}
          <button
            on:click={resetSession}
            class="px-4 py-2.5 rounded-xl bg-white bg-opacity-70 backdrop-blur-md text-gray-600 text-sm font-medium hover:bg-opacity-100 transition-all flex items-center gap-1.5"
            style="border: 1px solid rgba(255,255,255,0.3);"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Сбросить
          </button>
        {/if}
        <button
          on:click={stopListening}
          class="px-5 py-2.5 rounded-xl bg-red-500 bg-opacity-90 text-white text-sm font-medium hover:bg-opacity-100 transition-all flex items-center gap-2 shadow-md"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"></path>
          </svg>
          Остановить
        </button>
      </div>
    </div>
  </div>
{/if}
