<script>
  import '../app.css';
  import { page } from '$app/stores';
  import Header from '$lib/components/Header.svelte';
  import { t } from '$lib/stores/lang.js';

  $: currentPath = $page.url.pathname;
  
  let toolsOpen = false;
  
  const toolRoutes = ['/timer', '/noisemeter', '/target', '/classroom'];
  $: isToolPage = toolRoutes.includes(currentPath);
</script>

<div class="min-h-screen md:pb-0 relative z-0">
  <!-- Фоновые blobs -->
  <div class="bg-blobs">
    <div class="blob blob-1"></div>
    <div class="blob blob-2"></div>
    <div class="blob blob-3"></div>
  </div>

  <Header />
  
  <main class="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
    <slot />
  </main>
</div>

<!-- Popup меню инструментов -->
{#if toolsOpen}
  <div class="modal-overlay md:hidden" on:click={() => toolsOpen = false}>
    <div class="absolute bottom-16 left-3 right-3 modal-content bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 overflow-hidden" on:click|stopPropagation>
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200/50">
        <span class="text-sm font-bold text-gray-800">{$t('nav_menu')}</span>
        <button on:click={() => toolsOpen = false} class="text-xs font-bold text-rose-500 bg-rose-50 px-3 py-1.5 rounded-xl">✕ {$t('close')}</button>
      </div>
      <div class="p-2">
        <a href="/noisemeter" class="flex items-center gap-3 p-3 rounded-xl hover:bg-white/80 transition-colors bg-white/50" on:click={() => toolsOpen = false}>
          <div class="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-bold text-gray-900 text-base">{$t('noise_title')}</div>
            <div class="text-xs text-gray-600 font-medium">{$t('noise_desc')}</div>
          </div>
          <div class="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0">
            <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
          </div>
        </a>
      </div>
    </div>
  </div>
{/if}

<!-- Мобильная нижняя навигация (PWA) -->
<nav class="mobile-nav">
  <!-- Каталог -->
  <a href="/" class="flex items-center justify-center flex-1 {currentPath === '/' ? 'text-purple-700' : 'text-gray-500'} transition-colors duration-200">
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="{currentPath === '/' ? 2.5 : 2}">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
    </svg>
  </a>
  
  <!-- Таймер -->
  <a href="/timer" class="flex items-center justify-center flex-1 {currentPath === '/timer' ? 'text-purple-700' : 'text-gray-500'} transition-colors duration-200">
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="{currentPath === '/timer' ? 2.5 : 2}">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  </a>
  
  <!-- Центральная кнопка Конструктор -->
  <a href="/constructor" class="flex items-center justify-center flex-1 -mt-3 relative z-10">
    <div class="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95" style="background: #b794d6; box-shadow: 0 4px 12px rgba(183, 148, 214, 0.4);">
      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
      </svg>
    </div>
  </a>
  
  <!-- Мишень -->
  <a href="/target" class="flex items-center justify-center flex-1 {currentPath === '/target' ? 'text-purple-700' : 'text-gray-500'} transition-colors duration-200">
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="{currentPath === '/target' ? 2.5 : 2}">
      <circle cx="12" cy="12" r="10" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="12" cy="12" r="6" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="12" cy="12" r="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </a>
  
  <!-- Меню -->
  <button on:click={() => toolsOpen = !toolsOpen} class="flex items-center justify-center flex-1 {toolsOpen ? 'text-purple-700' : 'text-gray-500'} transition-colors duration-200">
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="{toolsOpen ? 2.5 : 2}">
      {#if toolsOpen}
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
      {:else}
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
      {/if}
    </svg>
  </button>
</nav>
