<script>
  import '../app.css';
  import { page } from '$app/stores';
  import Header from '$lib/components/Header.svelte';

  $: currentPath = $page.url.pathname;
  
  let toolsOpen = false;
  
  const toolRoutes = ['/timer', '/noisemeter', '/target', '/classroom'];
  $: isToolPage = toolRoutes.includes(currentPath);
</script>

<div class="min-h-screen pb-20 md:pb-0">
  <Header />
  
  <main class="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
    <slot />
  </main>
</div>

<!-- Popup меню инструментов -->
{#if toolsOpen}
  <div class="fixed inset-0 z-[60] md:hidden" on:click={() => toolsOpen = false}>
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
    <div class="absolute bottom-20 left-4 right-4 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden" on:click|stopPropagation>
      <div class="flex items-center justify-between px-5 py-4 border-b border-white/40">
        <span class="text-sm font-bold text-gray-800 uppercase tracking-wider">Меню</span>
        <button on:click={() => toolsOpen = false} class="text-sm font-bold text-rose-500 bg-rose-50 px-3 py-1.5 rounded-xl">✕ Закрыть</button>
      </div>
      <div class="p-3 space-y-2">
        <a href="/classroom" class="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/80 transition-colors shadow-sm bg-white/40" on:click={() => toolsOpen = false}>
          <div class="w-12 h-12 rounded-2xl bg-indigo-500 shadow-md flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </div>
          <div class="flex-1">
            <div class="font-bold text-gray-900 text-lg">Классы</div>
            <div class="text-sm text-gray-700 font-medium">Управление классом</div>
          </div>
          <div class="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
            <svg class="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
          </div>
        </a>
        <a href="/noisemeter" class="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/80 transition-colors shadow-sm bg-white/40" on:click={() => toolsOpen = false}>
          <div class="w-12 h-12 rounded-2xl bg-emerald-500 shadow-md flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
          </div>
          <div class="flex-1">
            <div class="font-bold text-gray-900 text-lg">Шумометр</div>
            <div class="text-sm text-gray-700 font-medium">Контроль уровня шума</div>
          </div>
          <div class="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
            <svg class="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
          </div>
        </a>
      </div>
    </div>
  </div>
{/if}

<!-- Мобильная нижняя навигация (PWA) -->
<nav class="fixed bottom-0 left-0 right-0 z-50 md:hidden shadow-[0_-8px_30px_rgba(0,0,0,0.1)]" style="background: rgba(255,255,255,0.85); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border-top: 1px solid rgba(255,255,255,0.5); padding-bottom: env(safe-area-inset-bottom);">
  <div class="flex items-center justify-around px-2 py-3 relative">
    
    <!-- Каталог -->
    <a href="/" class="flex flex-col items-center gap-1.5 flex-1 {currentPath === '/' ? 'text-indigo-700' : 'text-gray-600'} transition-colors">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="{currentPath === '/' ? 2.5 : 2}">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
      </svg>
      <span class="text-[11px] font-bold">Каталог</span>
    </a>
    
    <!-- Таймер -->
    <a href="/timer" class="flex flex-col items-center gap-1.5 flex-1 {currentPath === '/timer' ? 'text-indigo-700' : 'text-gray-600'} transition-colors">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="{currentPath === '/timer' ? 2.5 : 2}">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <span class="text-[11px] font-bold">Таймер</span>
    </a>
    
    <!-- Центральная кнопка Конструктор -->
    <a href="/constructor" class="flex flex-col items-center gap-1 flex-1 -mt-8 relative z-10 group">
      <div class="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-[0_8px_20px_rgba(99,102,241,0.4)] flex items-center justify-center transform transition-transform group-active:scale-95 {currentPath === '/constructor' ? 'ring-4 ring-indigo-200' : 'border-4 border-white'}">
        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </div>
    </a>
    
    <!-- Мишень -->
    <a href="/target" class="flex flex-col items-center gap-1.5 flex-1 {currentPath === '/target' ? 'text-indigo-700' : 'text-gray-600'} transition-colors">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="{currentPath === '/target' ? 2.5 : 2}">
        <circle cx="12" cy="12" r="10" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="12" r="6" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="12" r="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span class="text-[11px] font-bold">Мишень</span>
    </a>
    
    <!-- Меню -->
    <button on:click={() => toolsOpen = !toolsOpen} class="flex flex-col items-center gap-1.5 flex-1 {toolsOpen ? 'text-indigo-700' : 'text-gray-600'} transition-colors">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="{toolsOpen ? 2.5 : 2}">
        {#if toolsOpen}
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        {:else}
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
        {/if}
      </svg>
      <span class="text-[11px] font-bold">Меню</span>
    </button>

  </div>
</nav>
