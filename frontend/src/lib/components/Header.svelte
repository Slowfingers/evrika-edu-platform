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

<header class="sticky top-0 z-50 backdrop-blur-xl" style="background: rgba(255,255,255,0.6); border-bottom: 1px solid rgba(255,255,255,0.3);">
  <div class="max-w-7xl mx-auto px-4 md:px-6">
    <div class="flex items-center justify-between h-14 md:h-16">

      <!-- Мобильный: логотип (на главной/инструментах) или назад (карточка) -->
      {#if isCardDetail}
        <a href="/" class="md:hidden flex items-center gap-1.5 text-gray-700 -ml-1">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          <span class="text-sm font-medium">Назад</span>
        </a>
      {:else}
        <a href="/" class="md:hidden flex items-center gap-2">
          <div class="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          {#if mobileTitle}
            <span class="text-sm font-semibold text-gray-900 truncate">{mobileTitle}</span>
          {:else}
            <span class="text-base font-semibold text-gray-900">EvrikaEdu</span>
          {/if}
        </a>
      {/if}

      <!-- Десктоп: логотип -->
      <a href="/" class="hidden md:flex items-center gap-2">
        <div class="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </div>
        <span class="text-lg font-semibold text-gray-900">EvrikaEdu</span>
      </a>

      <!-- Десктоп: навигация -->
      <nav class="hidden md:flex items-center gap-1">
        <a href="/" class="nav-link {currentPath === '/' ? 'active' : ''}">Каталог</a>
        <a href="/constructor" class="nav-link {currentPath === '/constructor' ? 'active' : ''}">Конструктор</a>
        <div class="w-px h-4 bg-gray-200 mx-1"></div>
        <a href="/timer" class="nav-link {currentPath === '/timer' ? 'active' : ''}">Таймер</a>
        <a href="/noisemeter" class="nav-link {currentPath === '/noisemeter' ? 'active' : ''}">Шумометр</a>
        <a href="/classroom" class="nav-link {currentPath === '/classroom' ? 'active' : ''}">Классы</a>
      </nav>

      <!-- Правая часть (мобильный баланс) -->
      <div class="md:hidden w-16"></div>
    </div>
  </div>
</header>
