<script>
  import { onDestroy } from 'svelte';

  let level = 0;
  let running = false;
  let audioContext = null;
  let analyser = null;
  let micStream = null;
  let animFrame = null;
  let error = null;
  let history = [];

  $: barColor = level < 40 ? '#22c55e' : level < 70 ? '#f59e0b' : '#ef4444';
  $: statusText = level < 40 ? 'Тихо' : level < 70 ? 'Нормально' : 'Громко!';
  $: statusColor = level < 40 ? 'text-green-600' : level < 70 ? 'text-amber-600' : 'text-red-600';

  async function start() {
    error = null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStream = stream;
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      running = true;
      measure();
    } catch (e) {
      error = 'Нет доступа к микрофону. Разрешите доступ в браузере.';
    }
  }

  function measure() {
    if (!running) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    const avg = data.reduce((s, v) => s + v, 0) / data.length;
    level = Math.min(100, Math.round((avg / 128) * 100 * 2.5));

    // History
    history = [...history.slice(-59), level];

    animFrame = requestAnimationFrame(measure);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(animFrame);
    if (micStream) micStream.getTracks().forEach(t => t.stop());
    if (audioContext) audioContext.close();
    level = 0;
    history = [];
  }

  onDestroy(stop);
</script>

<svelte:head>
  <title>Шумометр — EvrikaEdu</title>
</svelte:head>

<div class="max-w-md mx-auto pb-24 md:pb-8">

  <div class="text-center mb-6">
    <h1 class="text-2xl font-bold text-gray-900">Шумометр</h1>
    <p class="text-sm text-gray-500 mt-1">Контролируйте шум в классе</p>
  </div>

  <div class="card flex flex-col items-center py-8 mb-4">

    <!-- Большой индикатор уровня -->
    <div class="relative w-48 h-48 mb-4">
      <svg class="w-full h-full -rotate-90" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(0,0,0,0.08)" stroke-width="16"/>
        <circle
          cx="100" cy="100" r="85"
          fill="none"
          stroke={barColor}
          stroke-width="16"
          stroke-linecap="round"
          stroke-dasharray={2 * Math.PI * 85}
          stroke-dashoffset={2 * Math.PI * 85 * (1 - level / 100)}
          style="transition: stroke-dashoffset 0.1s ease, stroke 0.3s ease"
        />
      </svg>
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <span class="text-5xl font-bold text-gray-900 font-mono">{level}</span>
        <span class="text-xs text-gray-400 mt-0.5">dB</span>
      </div>
    </div>

    <span class="text-xl font-semibold {statusColor} mb-6">{statusText}</span>

    {#if error}
      <p class="text-sm text-red-500 mb-4 text-center">{error}</p>
    {/if}

    {#if running}
      <button on:click={stop} class="btn btn-secondary">Остановить</button>
    {:else}
      <button on:click={start} class="btn btn-primary">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
        </svg>
        Включить микрофон
      </button>
    {/if}
  </div>

  <!-- Мини-история -->
  {#if history.length > 1}
    <div class="card !p-4">
      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">История уровня</p>
      <div class="flex items-end gap-0.5 h-12">
        {#each history as h}
          <div
            class="flex-1 rounded-sm transition-all duration-100"
            style="height: {Math.max(4, h)}%; background: {h < 40 ? '#22c55e' : h < 70 ? '#f59e0b' : '#ef4444'}; opacity: 0.7"
          ></div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Зоны -->
  <div class="card !p-4 mt-4">
    <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Зоны шума</p>
    <div class="space-y-2">
      <div class="flex items-center gap-3">
        <div class="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></div>
        <span class="text-sm text-gray-700">0–39 — Тихо, рабочая обстановка</span>
      </div>
      <div class="flex items-center gap-3">
        <div class="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0"></div>
        <span class="text-sm text-gray-700">40–69 — Нормальный уровень</span>
      </div>
      <div class="flex items-center gap-3">
        <div class="w-3 h-3 rounded-full bg-red-500 flex-shrink-0"></div>
        <span class="text-sm text-gray-700">70+ — Громко, нужно успокоить класс</span>
      </div>
    </div>
  </div>

</div>
