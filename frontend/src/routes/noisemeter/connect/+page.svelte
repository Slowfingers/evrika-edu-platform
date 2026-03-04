<script>
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';

  let code = '';
  let ws = null;
  let status = 'idle'; // 'idle' | 'connecting' | 'connected' | 'error' | 'sending'
  let errorMsg = '';
  let noiseLevel = 0;

  // Микрофон
  let stream = null;
  let audioContext = null;
  let analyser = null;
  let animFrame = null;
  let sendInterval = null;

  function getWsUrl() {
    if (!browser) return '';
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.hostname;
    if (!host.includes('localhost')) {
      return `wss://evrika-backend.onrender.com/ws/noisemeter`;
    }
    return `${proto}://${host}:10000/ws/noisemeter`;
  }

  function connect() {
    if (code.length !== 6) {
      errorMsg = 'Введите 6-значный код';
      return;
    }

    status = 'connecting';
    errorMsg = '';

    const url = `${getWsUrl()}?role=sender&code=${code}`;
    ws = new WebSocket(url);

    ws.onopen = () => {
      // Ждём подтверждения от сервера
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === 'connected') {
        status = 'connected';
        startMicrophone();
      } else if (msg.type === 'error') {
        status = 'error';
        errorMsg = msg.message;
      } else if (msg.type === 'disconnected') {
        status = 'error';
        errorMsg = msg.reason === 'session_reset' 
          ? 'Сессия сброшена на доске. Запросите новый код.'
          : msg.reason === 'code_refreshed'
          ? 'Код обновлён на доске. Запросите новый код.'
          : 'Отключено';
        stopMicrophone();
      }
    };

    ws.onclose = () => {
      if (status === 'connected' || status === 'sending') {
        status = 'error';
        errorMsg = 'Соединение потеряно';
      }
      stopMicrophone();
    };

    ws.onerror = () => {
      status = 'error';
      errorMsg = 'Ошибка подключения к серверу';
    };
  }

  async function startMicrophone() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      status = 'sending';

      function tick() {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        noiseLevel = Math.min(100, Math.round((avg / 128) * 100));
        animFrame = requestAnimationFrame(tick);
      }
      tick();

      // Отправляем уровень каждые 100мс (~10 fps)
      sendInterval = setInterval(() => {
        if (ws && ws.readyState === 1) {
          ws.send(JSON.stringify({
            type: 'noise_level',
            level: noiseLevel,
            raw: noiseLevel,
          }));
        }
      }, 100);

    } catch (e) {
      status = 'error';
      errorMsg = 'Нет доступа к микрофону. Разрешите доступ в настройках браузера.';
    }
  }

  function stopMicrophone() {
    if (animFrame) cancelAnimationFrame(animFrame);
    if (sendInterval) clearInterval(sendInterval);
    if (stream) stream.getTracks().forEach(t => t.stop());
    if (audioContext) audioContext.close().catch(() => {});
    stream = null;
    audioContext = null;
    analyser = null;
  }

  function disconnect() {
    stopMicrophone();
    if (ws) ws.close();
    ws = null;
    status = 'idle';
    code = '';
    noiseLevel = 0;
    errorMsg = '';
  }

  function handleCodeInput(e) {
    code = e.target.value.replace(/\D/g, '').slice(0, 6);
  }

  function handleKeydown(e) {
    if (e.key === 'Enter') connect();
  }

  onDestroy(() => {
    stopMicrophone();
    if (ws) ws.close();
  });
</script>

<svelte:head>
  <title>Подключить микрофон - Шумомер - EvrikaEdu</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center p-4">
  <div class="max-w-sm w-full">

    {#if status === 'idle' || status === 'error'}
      <!-- Экран ввода кода -->
      <div class="text-center">
        <div class="text-5xl mb-4">📱</div>
        <h1 class="text-2xl font-bold text-gray-800 mb-2">Подключение к шумомеру</h1>
        <p class="text-gray-500 text-sm mb-6">Введите код с экрана доски</p>

        <div class="bg-white bg-opacity-70 backdrop-blur-xl rounded-2xl p-6 shadow-lg mb-4" style="border: 1px solid rgba(255,255,255,0.3);">
          <input
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="6"
            value={code}
            on:input={handleCodeInput}
            on:keydown={handleKeydown}
            placeholder="000000"
            class="w-full text-center text-4xl font-mono font-bold tracking-[0.4em] bg-transparent border-b-2 border-gray-200 focus:border-indigo-500 outline-none py-3 text-gray-800 placeholder-gray-300 transition-colors"
          />
        </div>

        {#if errorMsg}
          <div class="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm">
            {errorMsg}
          </div>
        {/if}

        <button
          on:click={connect}
          disabled={code.length !== 6}
          class="w-full py-4 rounded-2xl font-bold text-lg text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed
            {code.length === 6 ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:shadow-lg active:scale-[0.98]' : 'bg-gray-300'}"
        >
          Подключиться
        </button>

        <a href="/noisemeter" class="inline-block mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Открыть шумомер на этом устройстве
        </a>
      </div>

    {:else if status === 'connecting'}
      <!-- Подключение -->
      <div class="text-center">
        <div class="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
        <h2 class="text-xl font-bold text-gray-800 mb-2">Подключение...</h2>
        <p class="text-gray-500 text-sm">Код: {code}</p>
      </div>

    {:else if status === 'connected' || status === 'sending'}
      <!-- Активная отправка -->
      <div class="text-center">
        <div class="mb-6">
          <div class="w-2 h-2 bg-green-500 rounded-full mx-auto mb-2 animate-pulse"></div>
          <p class="text-green-600 font-medium text-sm">Подключено к доске</p>
        </div>

        <!-- Индикатор уровня -->
        <div class="relative w-48 h-48 mx-auto mb-6">
          <svg viewBox="0 0 200 200" class="w-full h-full transform -rotate-90">
            <circle
              cx="100" cy="100" r="85"
              fill="none"
              stroke="rgba(0,0,0,0.05)"
              stroke-width="12"
            />
            <circle
              cx="100" cy="100" r="85"
              fill="none"
              stroke={noiseLevel > 75 ? '#ef4444' : noiseLevel > 50 ? '#f97316' : noiseLevel > 25 ? '#eab308' : '#22c55e'}
              stroke-width="12"
              stroke-linecap="round"
              stroke-dasharray="{2 * Math.PI * 85}"
              stroke-dashoffset="{2 * Math.PI * 85 * (1 - noiseLevel / 100)}"
              style="transition: stroke-dashoffset 0.1s ease-out, stroke 0.3s ease;"
            />
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="text-5xl font-bold tabular-nums text-gray-800">{noiseLevel}</span>
            <span class="text-gray-400 text-xs">уровень</span>
          </div>
        </div>

        <p class="text-gray-400 text-xs mb-6">Микрофон активен. Данные передаются на доску.</p>

        <button
          on:click={disconnect}
          class="px-6 py-3 rounded-xl bg-white border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
        >
          Отключиться
        </button>
      </div>
    {/if}
  </div>
</div>
