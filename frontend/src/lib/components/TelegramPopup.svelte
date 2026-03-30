<script>
  import { onMount } from 'svelte';

  let visible = false;

  onMount(() => {
    const dismissed = localStorage.getItem('tg_popup_dismissed');
    if (!dismissed) {
      setTimeout(() => (visible = true), 1500);
    }
  });

  function close() {
    visible = false;
    localStorage.setItem('tg_popup_dismissed', '1');
  }
</script>

{#if visible}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div
    class="popup-overlay"
    on:click={close}
    role="dialog"
    aria-modal="true"
  >
    <div
      class="popup-card"
      on:click|stopPropagation
    >
      <button class="popup-close" on:click={close} aria-label="Закрыть">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>

      <div class="popup-icon">
        <svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" width="56" height="56">
          <defs>
            <linearGradient id="tg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#2AABEE"/>
              <stop offset="100%" style="stop-color:#229ED9"/>
            </linearGradient>
          </defs>
          <circle cx="120" cy="120" r="120" fill="url(#tg-grad)"/>
          <path d="M176 70L152.5 176.5c-1.7 7.5-6.2 9.4-12.5 5.8l-34.5-25.4-16.6 16c-1.8 1.8-3.4 3.4-6.9 3.4l2.5-34.8 63.5-57.4c2.8-2.5-.6-3.8-4.2-1.4L73.5 130 40.5 119.6c-7.3-2.3-7.4-7.3 1.5-10.8l122.5-47.2c6-2.2 11.3 1.5 11.5 8.4z" fill="white"/>
        </svg>
      </div>

      <h2 class="popup-title">Подпишитесь на Telegram!</h2>
      <p class="popup-text">
        Будьте в курсе всех обновлений платформы, новых инструментов и полезных материалов для учителей ✨
      </p>

      <a
        href="https://t.me/evrikaedu"
        target="_blank"
        rel="noopener noreferrer"
        class="popup-btn"
        on:click={close}
      >
        <svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" width="20" height="20" style="flex-shrink:0">
          <circle cx="120" cy="120" r="120" fill="white" fill-opacity="0.25"/>
          <path d="M176 70L152.5 176.5c-1.7 7.5-6.2 9.4-12.5 5.8l-34.5-25.4-16.6 16c-1.8 1.8-3.4 3.4-6.9 3.4l2.5-34.8 63.5-57.4c2.8-2.5-.6-3.8-4.2-1.4L73.5 130 40.5 119.6c-7.3-2.3-7.4-7.3 1.5-10.8l122.5-47.2c6-2.2 11.3 1.5 11.5 8.4z" fill="white"/>
        </svg>
        Подписаться на @evrikaedu
      </a>

      <button class="popup-later" on:click={close}>Позже</button>
    </div>
  </div>
{/if}

<style>
  .popup-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 1rem;
    animation: fade-in 0.25s ease;
  }

  .popup-card {
    position: relative;
    background: white;
    border-radius: 24px;
    padding: 2rem 1.75rem 1.75rem;
    max-width: 360px;
    width: 100%;
    text-align: center;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.18);
    animation: scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .popup-close {
    position: absolute;
    top: 0.875rem;
    right: 0.875rem;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: none;
    background: #f3f4f6;
    color: #6b7280;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  .popup-close:hover {
    background: #e5e7eb;
    color: #111827;
  }

  .popup-icon {
    display: flex;
    justify-content: center;
    margin-bottom: 1rem;
  }

  .popup-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 0.5rem;
  }

  .popup-text {
    font-size: 0.9rem;
    color: #6b7280;
    line-height: 1.55;
    margin: 0 0 1.5rem;
  }

  .popup-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.75rem 1.25rem;
    background: linear-gradient(135deg, #2AABEE, #229ED9);
    color: white;
    font-size: 0.95rem;
    font-weight: 600;
    border-radius: 14px;
    text-decoration: none;
    box-shadow: 0 4px 14px rgba(34, 158, 217, 0.4);
    transition: opacity 0.15s, transform 0.15s;
    margin-bottom: 0.75rem;
  }

  .popup-btn:hover {
    opacity: 0.92;
    transform: translateY(-1px);
  }

  .popup-later {
    background: none;
    border: none;
    font-size: 0.85rem;
    color: #9ca3af;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    transition: color 0.15s;
  }

  .popup-later:hover {
    color: #6b7280;
  }

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes scale-in {
    from { transform: scale(0.85); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
</style>
