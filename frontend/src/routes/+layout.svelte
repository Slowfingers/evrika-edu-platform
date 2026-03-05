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
    <div class="absolute bottom-20 left-4 right-4 bg-white rounded-3xl shadow-2xl overflow-hidden" on:click|stopPropagation>
      <div class="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">Инструменты</span>
        <button on:click={() => toolsOpen = false} class="text-sm font-bold text-red-500">Выйти</button>
      </div>
      <div class="p-2">
        <a href="/timer" class="flex items-center gap-4 p-4 rounded-2xl hover:bg-indigo-50 transition-colors" on:click={() => toolsOpen = false}>
          <div class="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
            <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <div class="flex-1">
            <div class="font-bold text-gray-900">Таймер</div>
            <div class="text-xs text-gray-500">Управление этапами урока</div>
          </div>
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </a>
        <a href="/target" class="flex items-center gap-4 p-4 rounded-2xl hover:bg-purple-50 transition-colors" on:click={() => toolsOpen = false}>
          <div class="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><circle cx="12" cy="12" r="6" stroke-width="2"/><circle cx="12" cy="12" r="2" stroke-width="2"/></svg>
          </div>
          <div class="flex-1">
            <div class="font-bold text-gray-900">Мишень</div>
            <div class="text-xs text-gray-500">Рефлексия учеников</div>
          </div>
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </a>
        <a href="/noisemeter" class="flex items-center gap-4 p-4 rounded-2xl hover:bg-green-50 transition-colors" on:click={() => toolsOpen = false}>
          <div class="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
          </div>
          <div class="flex-1">
            <div class="font-bold text-gray-900">Шумометр</div>
            <div class="text-xs text-gray-500">Контроль уровня шума</div>
          </div>
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </a>
      </div>
    </div>
  </div>
{/if}

<!-- Мобильная нижняя навигация (PWA) -->
<nav class="fixed bottom-0 left-0 right-0 z-50 md:hidden" style="background: rgba(255,255,255,0.95); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-top: 1px solid rgba(0,0,0,0.06); padding-bottom: env(safe-area-inset-bottom);">
  <div class="flex items-center justify-around px-2 py-2 relative">
    
    <!-- Главная -->
    <a href="/" class="flex flex-col items-center gap-1 flex-1 {currentPath === '/' ? 'text-indigo-600' : 'text-gray-400'}">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="{currentPath === '/' ? 2.5 : 2}">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
      </svg>
      <span class="text-[10px] font-medium">Главная</span>
    </a>
    
    <!-- Расписание (Конструктор) -->
    <a href="/constructor" class="flex flex-col items-center gap-1 flex-1 {currentPath === '/constructor' ? 'text-indigo-600' : 'text-gray-400'}">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="{currentPath === '/constructor' ? 2.5 : 2}">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <span class="text-[10px] font-medium">Расписание</span>
    </a>
    
    <!-- Центральная кнопка инструментов -->
    <button on:click={() => toolsOpen = !toolsOpen} class="flex flex-col items-center gap-1 flex-1 -mt-6">
      <div class="w-14 h-14 rounded-full bg-gray-900 shadow-lg flex items-center justify-center">
        <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
        </svg>
      </div>
    </button>
    
    <!-- Классы -->
    <a href="/classroom" class="flex flex-col items-center gap-1 flex-1 {currentPath === '/classroom' ? 'text-indigo-600' : 'text-gray-400'}">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="{currentPath === '/classroom' ? 2.5 : 2}">
        <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
      <span class="text-[10px] font-medium">Классы</span>
    </a>
    
    <!-- Меню -->
    <button on:click={() => toolsOpen = !toolsOpen} class="flex flex-col items-center gap-1 flex-1 {toolsOpen ? 'text-indigo-600' : 'text-gray-400'}">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="{toolsOpen ? 2.5 : 2}">
        {#if toolsOpen}
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        {:else}
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
        {/if}
      </svg>
      <span class="text-[10px] font-medium">Меню</span>
    </button>

  </div>
</nav>
