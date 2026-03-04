<script>
  import '../app.css';
  import { page } from '$app/stores';
  import Header from '$lib/components/Header.svelte';

  $: currentPath = $page.url.pathname;
</script>

<div class="min-h-screen pb-20 md:pb-0">
  <Header />
  
  <main class="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
    <slot />
  </main>
</div>

<!-- Мобильная нижняя навигация (PWA) -->
<nav class="fixed bottom-0 left-0 right-0 z-50 md:hidden" style="background: rgba(255,255,255,0.88); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-top: 1px solid rgba(0,0,0,0.06); padding-bottom: env(safe-area-inset-bottom);">
  <div class="flex items-center justify-around px-1 py-1.5">
    
    {#each [
      { href: '/', label: 'Каталог', icon: 'catalog' },
      { href: '/constructor', label: 'Урок', icon: 'constructor' },
      { href: '/timer', label: 'Таймер', icon: 'timer' },
      { href: '/noisemeter', label: 'Шум', icon: 'noise' },
      { href: '/classroom', label: 'Класс', icon: 'class' }
    ] as item}
      {@const active = currentPath === item.href}
      <a href={item.href} class="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-2xl transition-all {active ? 'bg-gray-900/8' : ''}">
        {#if item.icon === 'catalog'}
          <svg class="w-5 h-5 {active ? 'text-gray-900' : 'text-gray-400'}" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="{active ? 2.5 : 1.8}">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
          </svg>
        {:else if item.icon === 'constructor'}
          <svg class="w-5 h-5 {active ? 'text-gray-900' : 'text-gray-400'}" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="{active ? 2.5 : 1.8}">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        {:else if item.icon === 'timer'}
          <svg class="w-5 h-5 {active ? 'text-gray-900' : 'text-gray-400'}" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="{active ? 2.5 : 1.8}">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        {:else if item.icon === 'noise'}
          <svg class="w-5 h-5 {active ? 'text-gray-900' : 'text-gray-400'}" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="{active ? 2.5 : 1.8}">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
          </svg>
        {:else if item.icon === 'class'}
          <svg class="w-5 h-5 {active ? 'text-gray-900' : 'text-gray-400'}" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="{active ? 2.5 : 1.8}">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        {/if}
        <span class="text-[9px] font-medium {active ? 'text-gray-900' : 'text-gray-400'}">{item.label}</span>
      </a>
    {/each}

  </div>
</nav>
