<script>
  import { onMount, tick, afterUpdate } from 'svelte';
  
  // Режимы работы
  let mode = 'setup'; // setup | presentation
  
  // Настройки мишени
  let criteria = ['Тема 1', 'Тема 2', 'Тема 3', 'Тема 4'];
  let rings = 3; // количество колец (2-5)
  let ringLabels = ['Сложно', 'Нормально', 'Легко'];
  
  // Данные взаимодействия
  let markers = []; // {x, y, sector, ring, timestamp}
  
  // Canvas элементы (отдельные для каждого режима)
  let previewCanvas;
  let presentationCanvas;
  
  // Размеры
  const canvasSize = 600;
  const centerX = 300;
  const centerY = 300;
  
  // Цвета для секторов (glassmorphism)
  const sectorColors = [
    'rgba(99, 102, 241, 0.5)',   // indigo
    'rgba(236, 72, 153, 0.5)',   // pink
    'rgba(34, 197, 94, 0.5)',    // green
    'rgba(245, 158, 11, 0.5)',   // amber
    'rgba(59, 130, 246, 0.5)',   // blue
    'rgba(239, 68, 68, 0.5)',    // red
    'rgba(20, 184, 166, 0.5)',   // teal
    'rgba(168, 85, 247, 0.5)'    // purple
  ];
  
  onMount(() => {
    drawPreview();
  });
  
  afterUpdate(() => {
    if (mode === 'setup' && previewCanvas) {
      drawPreview();
    }
  });
  
  // Добавить критерий
  function addCriterion() {
    if (criteria.length < 8) {
      criteria = [...criteria, `Тема ${criteria.length + 1}`];
      drawPreview();
    }
  }
  
  // Удалить критерий
  function removeCriterion(index) {
    if (criteria.length > 2) {
      criteria = criteria.filter((_, i) => i !== index);
      drawPreview();
    }
  }
  
  // Изменить количество колец
  function updateRings(count) {
    rings = count;
    const defaultLabels = {
      2: ['Сложно', 'Легко'],
      3: ['Сложно', 'Нормально', 'Легко'],
      4: ['Очень сложно', 'Сложно', 'Нормально', 'Легко'],
      5: ['Очень сложно', 'Сложно', 'Нормально', 'Легко', 'Супер']
    };
    ringLabels = defaultLabels[count] || ringLabels;
    drawPreview();
  }
  
  // Рисовать превью
  function drawPreview() {
    if (!previewCanvas) return;
    const ctx = previewCanvas.getContext('2d');
    drawTargetOnCanvas(ctx, false);
  }
  
  // Рисовать презентацию
  function drawPresentation() {
    if (!presentationCanvas) return;
    const ctx = presentationCanvas.getContext('2d');
    drawTargetOnCanvas(ctx, true);
  }
  
  // Универсальная функция отрисовки мишени
  function drawTargetOnCanvas(ctx, isDark = false) {
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    
    // Фон для презентации
    if (isDark) {
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(0, 0, canvasSize, canvasSize);
    }
    
    const maxRadius = canvasSize / 2 - 40;
    const angleStep = (2 * Math.PI) / criteria.length;
    
    // Рисуем сектора и кольца
    for (let r = 0; r < rings; r++) {
      const outerRadius = maxRadius * ((rings - r) / rings);
      const innerRadius = r === rings - 1 ? 0 : maxRadius * ((rings - r - 1) / rings);
      
      for (let s = 0; s < criteria.length; s++) {
        const startAngle = s * angleStep - Math.PI / 2;
        const endAngle = (s + 1) * angleStep - Math.PI / 2;
        
        // Рисуем сектор
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
        ctx.closePath();
        
        // Заливка
        ctx.fillStyle = sectorColors[s % sectorColors.length];
        ctx.fill();
        
        // Граница
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      // Кольцо (граница)
      if (innerRadius > 0) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
    
    // Внешняя граница
    ctx.beginPath();
    ctx.arc(centerX, centerY, maxRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Подписи критериев
    ctx.fillStyle = isDark ? '#ffffff' : '#1f2937';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let s = 0; s < criteria.length; s++) {
      const angle = s * angleStep - Math.PI / 2 + angleStep / 2;
      const labelRadius = maxRadius + 25;
      const x = centerX + Math.cos(angle) * labelRadius;
      const y = centerY + Math.sin(angle) * labelRadius;
      
      // Обрезаем длинные названия
      const text = criteria[s].length > 12 ? criteria[s].substring(0, 10) + '...' : criteria[s];
      ctx.fillText(text, x, y);
    }
    
    // Рисуем маркеры (только в презентации)
    if (isDark) {
      markers.forEach((marker, index) => {
        drawMarkerOnCanvas(ctx, marker.x, marker.y, index);
      });
    }
  }
  
  // Рисовать маркер
  function drawMarkerOnCanvas(ctx, x, y, index) {
    if (!ctx) return;
    
    // Тень
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Основной маркер
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, 2 * Math.PI);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Сброс тени
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }
  
  // Обработка клика/тапа
  function handleCanvasClick(event) {
    if (!presentationCanvas) return;
    
    const rect = presentationCanvas.getBoundingClientRect();
    const scaleX = presentationCanvas.width / rect.width;
    const scaleY = presentationCanvas.height / rect.height;
    
    let clientX, clientY;
    
    if (event.touches && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    
    // Определяем сектор и кольцо
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const maxRadius = canvasSize / 2 - 40;
    
    if (distance <= maxRadius) {
      // Добавляем маркер
      markers = [...markers, {
        x,
        y,
        timestamp: Date.now()
      }];
      
      // Перерисовываем
      drawPresentation();
      
      // Эффект для центра (яблочко)
      const ringIndex = Math.floor((distance / maxRadius) * rings);
      if (ringIndex >= rings - 1) {
        animateBullseye(x, y);
      }
    }
  }
  
  // Анимация попадания в яблочко
  function animateBullseye(x, y) {
    if (!presentationCanvas) return;
    const ctx = presentationCanvas.getContext('2d');
    
    let scale = 1;
    const animate = () => {
      if (scale > 2) {
        drawPresentation();
        return;
      }
      
      drawPresentation();
      
      ctx.save();
      ctx.globalAlpha = 1 - (scale - 1);
      ctx.beginPath();
      ctx.arc(x, y, 20 * scale, 0, 2 * Math.PI);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();
      
      scale += 0.1;
      requestAnimationFrame(animate);
    };
    animate();
  }
  
  // Переход в режим презентации
  async function startPresentation() {
    mode = 'presentation';
    markers = [];
    await tick();
    
    // Ждём пока canvas появится в DOM
    setTimeout(() => {
      drawPresentation();
    }, 100);
  }
  
  // Выход из режима презентации
  function exitPresentation() {
    mode = 'setup';
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }
  
  // Очистка маркеров
  function clearMarkers() {
    if (confirm('Очистить все маркеры?')) {
      markers = [];
      drawPresentation();
    }
  }
  
  // Сохранение в PNG
  function saveAsPNG() {
    if (!presentationCanvas) return;
    
    const link = document.createElement('a');
    link.download = `target-${Date.now()}.png`;
    link.href = presentationCanvas.toDataURL();
    link.click();
  }
  
  // Реактивность для превью
  $: if (previewCanvas && mode === 'setup') {
    criteria;
    rings;
    ringLabels;
    drawPreview();
  }
</script>

<div class="h-[calc(100vh-3.5rem-4rem)] md:h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
  
  {#if mode === 'setup'}
    <!-- Режим настройки -->
    <div class="flex-1 overflow-y-auto p-4 md:p-6">
      <div class="max-w-4xl mx-auto">
        
        <div class="card mb-6 text-center">
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Интерактивная мишень рефлексии</h1>
          <p class="text-gray-500 text-sm">Настройте критерии и запустите сбор обратной связи</p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <!-- Настройки -->
          <div class="space-y-4">
            
            <!-- Критерии -->
            <div class="card">
              <h3 class="text-sm font-bold text-gray-900 mb-3">Критерии (темы урока)</h3>
              <div class="space-y-2 mb-3">
                {#each criteria as criterion, i}
                  <div class="flex items-center gap-2">
                    <div class="w-4 h-4 rounded" style="background: {sectorColors[i % sectorColors.length]}"></div>
                    <input type="text" bind:value={criteria[i]} class="input flex-1 !py-1.5 text-sm" />
                    {#if criteria.length > 2}
                      <button on:click={() => removeCriterion(i)} class="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    {/if}
                  </div>
                {/each}
              </div>
              {#if criteria.length < 8}
                <button on:click={addCriterion} class="btn btn-secondary w-full !py-2 text-sm">
                  + Добавить критерий
                </button>
              {/if}
            </div>
            
            <!-- Кольца -->
            <div class="card">
              <h3 class="text-sm font-bold text-gray-900 mb-3">Количество колец</h3>
              <div class="flex gap-2 mb-3">
                {#each [2, 3, 4, 5] as count}
                  <button on:click={() => updateRings(count)} 
                    class="flex-1 py-2 rounded-lg text-sm font-medium transition-all {rings === count ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}">
                    {count}
                  </button>
                {/each}
              </div>
              <div class="space-y-1.5">
                {#each ringLabels as label, i}
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-gray-400 w-16">Кольцо {i + 1}</span>
                    <input type="text" bind:value={ringLabels[i]} class="input flex-1 !py-1.5 text-sm" />
                  </div>
                {/each}
              </div>
            </div>
            
          </div>
          
          <!-- Превью мишени -->
          <div class="card flex flex-col items-center justify-center">
            <h3 class="text-sm font-bold text-gray-900 mb-3">Превью</h3>
            <canvas bind:this={previewCanvas} width={canvasSize} height={canvasSize} 
              class="max-w-full h-auto rounded-xl shadow-lg" style="background: #f9fafb;"></canvas>
          </div>
          
        </div>
        
        <!-- Кнопка запуска -->
        <div class="mt-6 flex justify-center">
          <button on:click={startPresentation} class="btn btn-primary !px-8 !py-3">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Запустить на доске
          </button>
        </div>
        
      </div>
    </div>
    
  {:else if mode === 'presentation'}
    <!-- Режим презентации (fullscreen) -->
    <div class="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
      
      <!-- Управление -->
      <div class="absolute top-4 right-4 flex gap-2 z-10">
        <button on:click={clearMarkers} class="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-xl text-white hover:bg-white/20 transition-all">
          Очистить
        </button>
        <button on:click={saveAsPNG} class="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-xl text-white hover:bg-white/20 transition-all">
          Сохранить PNG
        </button>
        <button on:click={exitPresentation} class="px-4 py-2 rounded-xl bg-red-500/80 backdrop-blur-xl text-white hover:bg-red-500 transition-all">
          Выход
        </button>
      </div>
      
      <!-- Счётчик маркеров -->
      <div class="absolute top-4 left-4 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-xl text-white z-10">
        <span class="text-sm font-medium">Ответов: {markers.length}</span>
      </div>
      
      <!-- Мишень -->
      <div class="flex-1 flex items-center justify-center p-8">
        <canvas bind:this={presentationCanvas} width={canvasSize} height={canvasSize} 
          on:click={handleCanvasClick}
          on:touchstart|preventDefault={handleCanvasClick}
          class="max-w-full max-h-full cursor-crosshair rounded-2xl shadow-2xl"></canvas>
      </div>
      
    </div>
  {/if}
  
</div>
