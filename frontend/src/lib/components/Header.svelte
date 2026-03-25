<script>
  import { page } from '$app/stores';
  import { t, lang, LANGS } from '$lib/stores/lang.js';

  const toolRoutes = ['/timer', '/noisemeter', '/classroom', '/target'];
  const navRoutes = ['/', '/constructor', '/timer', '/noisemeter', '/classroom', '/target'];

  $: currentPath = $page.url.pathname;
  $: isCardDetail = currentPath.match(/^\/\d+$/);
  $: isMobileRoot = navRoutes.includes(currentPath);

  $: mobileTitle = {
    '/timer': $t('mobile_timer'),
    '/noisemeter': $t('mobile_noisemeter'),
    '/classroom': $t('mobile_classroom'),
    '/constructor': $t('mobile_constructor'),
    '/target': $t('mobile_target')
  }[currentPath] || null;
</script>

<header class="sticky top-0 z-50 backdrop-blur-2xl backdrop-saturate-150" style="background: rgba(255,255,255,0.72); border-bottom: 1px solid rgba(0,0,0,0.06); box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
  <div class="max-w-7xl mx-auto px-4 md:px-6">
    <div class="flex items-center justify-between h-12 md:h-14">

      <!-- Мобильный: логотип или назад -->
      {#if isCardDetail}
        <a href="/" class="md:hidden flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors -ml-1">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          <span class="text-sm font-medium">{$t('nav_back')}</span>
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

      <!-- Десктоп: навигация -->
      <nav class="hidden md:flex items-center">
        <div class="flex items-center gap-0.5 p-1 rounded-full bg-gray-100/80">
          <a href="/" class="px-4 py-1.5 rounded-full text-sm font-medium transition-all {currentPath === '/' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'}">{$t('nav_catalog')}</a>
          <a href="/constructor" class="px-4 py-1.5 rounded-full text-sm font-medium transition-all {currentPath === '/constructor' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'}">{$t('nav_constructor')}</a>
        </div>
        <div class="w-px h-5 bg-gray-200 mx-3"></div>
        <div class="flex items-center gap-0.5 p-1 rounded-full bg-gray-100/80">
          <a href="/timer" class="px-3 py-1.5 rounded-full text-sm font-medium transition-all {currentPath === '/timer' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}">{$t('nav_timer')}</a>
          <a href="/noisemeter" class="px-3 py-1.5 rounded-full text-sm font-medium transition-all {currentPath === '/noisemeter' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}">{$t('nav_noise')}</a>
          <a href="/classroom" class="px-3 py-1.5 rounded-full text-sm font-medium transition-all {currentPath === '/classroom' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}">{$t('nav_class')}</a>
          <a href="/target" class="px-3 py-1.5 rounded-full text-sm font-medium transition-all {currentPath === '/target' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}">{$t('nav_target')}</a>
        </div>
      </nav>

      <!-- Переключатель языков -->
      <div class="flex items-center gap-0.5 p-0.5 rounded-full bg-gray-100/80 flex-shrink-0">
        {#each LANGS as l}
          <button
            on:click={() => lang.set(l.code)}
            class="px-2.5 py-1 rounded-full text-xs font-bold transition-all
              {$lang === l.code ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-800'}"
            title={l.label}
          >
            {l.label}
          </button>
        {/each}
      </div>
    </div>
  </div>
</header>
