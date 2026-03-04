<script>
  import { onDestroy } from 'svelte';

  let duration = 15;
  let timeLeft = 15 * 60;
  let running = false;
  let finished = false;
  let interval = null;
  let customMinutes = '';

  const presets = [5, 10, 15, 20, 30, 45];

  $: progress = timeLeft / (duration * 60);
  $: minutes = Math.floor(timeLeft / 60);
  $: seconds = timeLeft % 60;
  $: displayTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // SVG ring
  const R = 90;
  const C = 2 * Math.PI * R;
  $: dashOffset = C * (1 - progress);
  $: ringColor = progress > 0.5 ? '#22c55e' : progress > 0.25 ? '#f59e0b' : '#ef4444';

  function setPreset(min) {
    stop();
    duration = min;
    timeLeft = min * 60;
    finished = false;
  }

  function setCustom() {
    const min = parseInt(customMinutes);
    if (min > 0 && min <= 90) {
      setPreset(min);
      customMinutes = '';
    }
  }

  function start() {
    if (finished) reset();
    running = true;
    interval = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
      } else {
        clearInterval(interval);
        running = false;
        finished = true;
        playBell();
      }
    }, 1000);
  }

  function pause() {
    running = false;
    clearInterval(interval);
  }

  function stop() {
    pause();
    timeLeft = duration * 60;
    finished = false;
  }

  function reset() {
    stop();
  }

  function playBell() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.4, 0.8].forEach(delay => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 660;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.4, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.8);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.8);
      });
    } catch (e) {}
  }

  onDestroy(() => clearInterval(interval));
</script>

<svelte:head>
  <title>Таймер урока — EvrikaEdu</title>
</svelte:head>

<div class="max-w-md mx-auto pb-24 md:pb-8">

  <div class="text-center mb-6">
    <h1 class="text-2xl font-bold text-gray-900">Таймер урока</h1>
    <p class="text-sm text-gray-500 mt-1">Управляйте временем на активности</p>
  </div>

  <!-- Кольцо таймера -->
  <div class="card flex flex-col items-center py-8 mb-4">
    <div class="relative w-56 h-56 mb-6">
      <svg class="w-full h-full -rotate-90" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r={R} fill="none" stroke="rgba(0,0,0,0.08)" stroke-width="12"/>
        <circle
          cx="100" cy="100" r={R}
          fill="none"
          stroke={finished ? '#ef4444' : ringColor}
          stroke-width="12"
          stroke-linecap="round"
          stroke-dasharray={C}
          stroke-dashoffset={dashOffset}
          style="transition: stroke-dashoffset 1s linear, stroke 0.5s ease"
        />
      </svg>
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <span class="text-5xl font-bold text-gray-900 font-mono tabular-nums">{displayTime}</span>
        <span class="text-sm text-gray-400 mt-1">{duration} мин</span>
      </div>
    </div>

    {#if finished}
      <div class="badge-count text-base px-6 py-2 !bg-red-500/80 mb-4">Время вышло!</div>
    {/if}

    <!-- Кнопки управления -->
    <div class="flex items-center gap-3">
      <button on:click={reset} class="btn btn-secondary px-4" disabled={!running && timeLeft === duration * 60 && !finished}>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
      </button>
      {#if running}
        <button on:click={pause} class="btn btn-primary px-8">Пауза</button>
      {:else}
        <button on:click={start} class="btn btn-primary px-8">
          {finished ? 'Заново' : 'Старт'}
        </button>
      {/if}
    </div>
  </div>

  <!-- Пресеты -->
  <div class="card !p-4">
    <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Быстрый выбор</p>
    <div class="grid grid-cols-3 gap-2 mb-3">
      {#each presets as min}
        <button
          on:click={() => setPreset(min)}
          class="py-2.5 rounded-2xl text-sm font-medium transition-all duration-200
            {duration === min && !running ? 'bg-gray-900 text-white shadow-md' : 'bg-white/60 text-gray-700 hover:bg-white/80'}"
        >
          {min} мин
        </button>
      {/each}
    </div>
    <div class="flex gap-2">
      <input
        type="number"
        bind:value={customMinutes}
        placeholder="Свои минуты..."
        min="1" max="90"
        class="input text-sm"
        on:keydown={(e) => e.key === 'Enter' && setCustom()}
      />
      <button on:click={setCustom} class="btn btn-secondary flex-shrink-0 px-4 text-sm">Ок</button>
    </div>
  </div>

</div>
