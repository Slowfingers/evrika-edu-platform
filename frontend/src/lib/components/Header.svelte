<script>
  import { page } from '$app/stores';

  const toolRoutes = ['/timer', '/noisemeter', '/classroom'];
  const navRoutes = ['/', '/constructor', '/timer', '/noisemeter', '/classroom'];

  $: currentPath = $page.url.pathname;
  $: isCardDetail = currentPath.match(/^\/\d+$/);
  $: isMobileRoot = navRoutes.includes(currentPath);
  
  $: mobileTitle = {
    '/timer': 'Таймер урока',
    '/noisemeter': 'Шумометр',
    '/classroom': 'Управление классом',
    '/constructor': 'Конструктор урока'
  }[currentPath] || null;
</script>

<header class="sticky top-0 z-50 backdrop-blur-2xl backdrop-saturate-150" style="background: rgba(255,255,255,0.72); border-bottom: 1px solid rgba(0,0,0,0.06); box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
  <div class="max-w-7xl mx-auto px-4 md:px-6">
    <div class="flex items-center justify-between h-12 md:h-14">

      <!-- Мобильный: логотип (на главной/инструментах) или назад (карточка) -->
      {#if isCardDetail}
        <a href="/" class="md:hidden flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors -ml-1">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          <span class="text-sm font-medium">Назад</span>
        </a>
      {:else}
        <a href="/" class="md:hidden flex items-center gap-2">
          <img src="/logo.png" alt="EvrikaEdu" class="w-7 h-7 rounded-lg object-cover" />
          {#if mobileTitle}
            <span class="text-sm font-semibold text-gray-900 truncate">{mobileTitle}</span>
          {:else}
            <span class="text-base font-semibold text-gray-900">EvrikaEdu</span>
          {/if}
        </a>
      {/if}

      <!-- Десктоп: логотип -->
      <a href="/" class="hidden md:flex items-center gap-2.5 group">
        <img src="/logo.png" alt="EvrikaEdu" class="w-8 h-8 rounded-xl object-cover shadow-sm group-hover:shadow-md transition-shadow" />
        <span class="text-lg font-semibold text-gray-900">EvrikaEdu</span>
      </a>

      <!-- Десктоп: навигация (pill-style) -->
      <nav class="hidden md:flex items-center">
        <div class="flex items-center gap-0.5 p-1 rounded-full bg-gray-100/80">
          <a href="/" class="px-4 py-1.5 rounded-full text-sm font-medium transition-all {currentPath === '/' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'}">Каталог</a>
          <a href="/constructor" class="px-4 py-1.5 rounded-full text-sm font-medium transition-all {currentPath === '/constructor' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'}">Конструктор</a>
        </div>
        <div class="w-px h-5 bg-gray-200 mx-3"></div>
        <div class="flex items-center gap-0.5 p-1 rounded-full bg-gray-100/80">
          <a href="/timer" class="px-3 py-1.5 rounded-full text-sm font-medium transition-all {currentPath === '/timer' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}">Таймер</a>
          <a href="/noisemeter" class="px-3 py-1.5 rounded-full text-sm font-medium transition-all {currentPath === '/noisemeter' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}">Шум</a>
          <a href="/classroom" class="px-3 py-1.5 rounded-full text-sm font-medium transition-all {currentPath === '/classroom' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}">Класс</a>
        </div>
      </nav>

      <!-- Правая часть (мобильный баланс) -->
      <div class="md:hidden w-12"></div>
    </div>
  </div>
</header>
