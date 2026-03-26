<script>
  import { onMount } from 'svelte';
  
  let showPrompt = false;
  let deferredPrompt = null;
  
  onMount(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      showPrompt = true;
    });
    
    window.addEventListener('appinstalled', () => {
      showPrompt = false;
      deferredPrompt = null;
    });
  });
  
  async function installPWA() {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    deferredPrompt = null;
    showPrompt = false;
  }
  
  function dismissPrompt() {
    showPrompt = false;
  }
</script>

{#if showPrompt}
  <div class="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
    <div class="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 md:p-5">
      <div class="flex items-start space-x-4">
        <div class="flex-shrink-0">
          <div class="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
            </svg>
          </div>
        </div>
        
        <div class="flex-1 min-w-0">
          <h3 class="text-base font-semibold text-gray-900 mb-1">
            Установить приложение
          </h3>
          <p class="text-sm text-gray-600 mb-3">
            Установите EvrikaEdu на главный экран для быстрого доступа и работы офлайн
          </p>
          
          <div class="flex space-x-2">
            <button
              on:click={installPWA}
              class="flex-1 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-medium rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-md hover:shadow-lg touch-target"
            >
              Установить
            </button>
            <button
              on:click={dismissPrompt}
              class="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors touch-target"
            >
              Позже
            </button>
          </div>
        </div>
        
        <button
          on:click={dismissPrompt}
          class="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors touch-target"
          aria-label="Закрыть"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes slide-up {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }
</style>
