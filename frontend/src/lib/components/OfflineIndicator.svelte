<script>
  import { onMount } from 'svelte';
  
  let isOnline = true;
  let showNotification = false;
  
  onMount(() => {
    isOnline = navigator.onLine;
    
    const handleOnline = () => {
      isOnline = true;
      showNotification = true;
      setTimeout(() => {
        showNotification = false;
      }, 3000);
    };
    
    const handleOffline = () => {
      isOnline = false;
      showNotification = true;
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  });
</script>

{#if showNotification}
  <div class="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
    <div class="px-4 py-3 rounded-xl shadow-lg border {isOnline ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}">
      <div class="flex items-center space-x-3">
        {#if isOnline}
          <div class="flex-shrink-0">
            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <p class="text-sm font-medium text-green-800">
            Соединение восстановлено
          </p>
        {:else}
          <div class="flex-shrink-0">
            <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <p class="text-sm font-medium text-yellow-800">
            Нет подключения к интернету
          </p>
        {/if}
      </div>
    </div>
  </div>
{/if}

{#if !isOnline && !showNotification}
  <div class="fixed bottom-0 left-0 right-0 bg-yellow-500 text-white py-2 px-4 text-center text-sm font-medium z-40">
    <div class="flex items-center justify-center space-x-2">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"></path>
      </svg>
      <span>Работа в автономном режиме</span>
    </div>
  </div>
{/if}

<style>
  @keyframes slide-down {
    from {
      transform: translate(-50%, -100%);
      opacity: 0;
    }
    to {
      transform: translate(-50%, 0);
      opacity: 1;
    }
  }
  
  .animate-slide-down {
    animation: slide-down 0.3s ease-out;
  }
</style>
