<script>
  import { onMount, tick, afterUpdate } from 'svelte';
  
  // Режимы работы
  let mode = 'setup'; // setup | presentation | stats
  
  // Настройки мишени
  let criteria = ['Тема 1', 'Тема 2', 'Тема 3', 'Тема 4'];
  let rings = 3; // количество колец (2-5)
  let ringLabels = ['Сложно', 'Нормально', 'Легко'];
  
  // Данные взаимодействия
  let markers = []; // {x, y, sector, ring, timestamp}
  
  // Статистика (вычисляемая)
  $: stats = calculateStats(markers);
  
  function calculateStats(markersList) {
    if (markersList.length === 0) {
      return {
        total: 0,
        byRing: [],
        bySector: [],
        sectorScores: [],
        avgScore: 0,
        understanding: 'Нет данных',
        strongTopics: [],
        weakTopics: []
      };
    }
    
    // Распределение по кольцам (общее)
    const byRing = Array(rings).fill(0);
    markersList.forEach(m => {
      if (m.ring !== undefined && m.ring < rings) {
        byRing[m.ring]++;
      }
    });
    
    // Распределение по секторам (количество отметок)
    const bySector = Array(criteria.length).fill(0);
    markersList.forEach(m => {
      if (m.sector !== undefined && m.sector < criteria.length) {
        bySector[m.sector]++;
      }
    });
    
    // КЛЮЧЕВОЕ: Средний балл ПО КАЖДОЙ ТЕМЕ
    // ring 0 = внешний (сложно) = 0 баллов
    // ring (rings-1) = центр (легко) = 100 баллов
    const sectorScores = criteria.map((_, sectorIndex) => {
      const sectorMarkers = markersList.filter(m => m.sector === sectorIndex);
      if (sectorMarkers.length === 0) return { count: 0, avgScore: 0, level: 'Нет данных' };
      
      let totalScore = 0;
      sectorMarkers.forEach(m => {
        if (m.ring !== undefined) {
          // Инвертируем: центр = высокий балл
          const score = ((rings - 1 - m.ring) / (rings - 1)) * 100;
          totalScore += score;
        }
      });
      const avgScore = Math.round(totalScore / sectorMarkers.length);
      
      let level = 'Нет данных';
      if (avgScore >= 80) level = 'Отлично';
      else if (avgScore >= 60) level = 'Хорошо';
      else if (avgScore >= 40) level = 'Средне';
      else if (avgScore >= 20) level = 'Слабо';
      else level = 'Сложно';
      
      return { count: sectorMarkers.length, avgScore, level };
    });
    
    // Общий средний балл
    let totalScore = 0;
    let validMarkers = 0;
    markersList.forEach(m => {
      if (m.ring !== undefined) {
        const score = ((rings - 1 - m.ring) / (rings - 1)) * 100;
        totalScore += score;
        validMarkers++;
      }
    });
    const avgScore = validMarkers > 0 ? Math.round(totalScore / validMarkers) : 0;
    
    // Уровень понимания
    let understanding = 'Нет данных';
    if (avgScore >= 80) understanding = 'Отлично! 🎉';
    else if (avgScore >= 60) understanding = 'Хорошо 👍';
    else if (avgScore >= 40) understanding = 'Средне 📊';
    else if (avgScore >= 20) understanding = 'Требует внимания ⚠️';
    else if (avgScore > 0) understanding = 'Сложно 🔴';
    
    // Сильные и слабые темы
    const scoredTopics = sectorScores
      .map((s, i) => ({ index: i, name: criteria[i], ...s }))
      .filter(s => s.count > 0)
      .sort((a, b) => b.avgScore - a.avgScore);
    
    const strongTopics = scoredTopics.filter(t => t.avgScore >= 60);
    const weakTopics = scoredTopics.filter(t => t.avgScore < 40);
    
    return {
      total: markersList.length,
      byRing,
      bySector,
      sectorScores,
      avgScore,
      understanding,
      strongTopics,
      weakTopics
    };
  }
  
  // Canvas элементы (отдельные для каждого режима)
  let previewCanvas;
  let presentationCanvas;
  
  // Размеры
  const canvasSize = 600;
  const centerX = 300;
  const centerY = 300;
  
  // Цвета для секторов (более яркие для детей)
  const sectorColors = [
    'rgba(99, 102, 241, 0.6)',   // indigo
    'rgba(236, 72, 153, 0.6)',   // pink
    'rgba(34, 197, 94, 0.6)',    // green
    'rgba(245, 158, 11, 0.6)',   // amber
    'rgba(59, 130, 246, 0.6)',   // blue
    'rgba(239, 68, 68, 0.6)',    // red
    'rgba(20, 184, 166, 0.6)',   // teal
    'rgba(168, 85, 247, 0.6)'    // purple
  ];
  
  // Яркие цвета для маркеров
  const markerColors = [
    '#f472b6', '#a78bfa', '#60a5fa', '#34d399', 
    '#fbbf24', '#fb923c', '#f87171', '#c084fc'
  ];
  
  // Система частиц
  let particles = [];
  let animationFrame;
  
  function createParticles(x, y, color, count = 12) {
    const newParticles = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 3 + Math.random() * 4;
      newParticles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color,
        size: 4 + Math.random() * 4
      });
    }
    particles = [...particles, ...newParticles];
    if (!animationFrame) {
      animateParticles();
    }
  }
  
  function animateParticles() {
    if (particles.length === 0) {
      animationFrame = null;
      return;
    }
    
    particles = particles
      .map(p => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        vy: p.vy + 0.15, // gravity
        life: p.life - 0.03
      }))
      .filter(p => p.life > 0);
    
    drawPresentation();
    animationFrame = requestAnimationFrame(animateParticles);
  }
  
  onMount(() => {
    drawPreview();
    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
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
    
    // Фон для презентации (прозрачный, т.к. фон в CSS)
    if (isDark) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, canvasSize, canvasSize);
    }
    
    const maxRadius = canvasSize / 2 - 50;
    const angleStep = (2 * Math.PI) / criteria.length;
    
    // Свечение вокруг мишени (только в презентации)
    if (isDark) {
      ctx.shadowColor = 'rgba(139, 92, 246, 0.5)';
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRadius + 5, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(139, 92, 246, 0.1)';
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    
    // Рисуем сектора и кольца
    for (let r = 0; r < rings; r++) {
      const outerRadius = maxRadius * ((rings - r) / rings);
      const innerRadius = r === rings - 1 ? 0 : maxRadius * ((rings - r - 1) / rings);
      
      // Яркость увеличивается к центру
      const brightness = 0.5 + (r / rings) * 0.3;
      
      for (let s = 0; s < criteria.length; s++) {
        const startAngle = s * angleStep - Math.PI / 2;
        const endAngle = (s + 1) * angleStep - Math.PI / 2;
        
        // Рисуем сектор
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
        ctx.closePath();
        
        // Заливка с учётом яркости
        const baseColor = sectorColors[s % sectorColors.length];
        ctx.fillStyle = baseColor.replace('0.6', String(brightness));
        ctx.fill();
        
        // Граница
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      // Кольцо (граница)
      if (innerRadius > 0) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
    
    // Центральный круг (яблочко) с особым эффектом
    ctx.beginPath();
    ctx.arc(centerX, centerY, maxRadius / rings * 0.7, 0, 2 * Math.PI);
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius / rings * 0.7);
    gradient.addColorStop(0, 'rgba(251, 191, 36, 0.9)');
    gradient.addColorStop(1, 'rgba(245, 158, 11, 0.7)');
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Звёздочка в центре
    if (isDark) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⭐', centerX, centerY);
    }
    
    // Внешняя граница
    ctx.beginPath();
    ctx.arc(centerX, centerY, maxRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Подписи критериев
    ctx.fillStyle = isDark ? '#ffffff' : '#1f2937';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let s = 0; s < criteria.length; s++) {
      const angle = s * angleStep - Math.PI / 2 + angleStep / 2;
      const labelRadius = maxRadius + 30;
      const x = centerX + Math.cos(angle) * labelRadius;
      const y = centerY + Math.sin(angle) * labelRadius;
      
      // Фон для подписи (только в презентации)
      if (isDark) {
        const text = criteria[s].length > 10 ? criteria[s].substring(0, 8) + '...' : criteria[s];
        const textWidth = ctx.measureText(text).width;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.roundRect(x - textWidth/2 - 8, y - 12, textWidth + 16, 24, 8);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, x, y);
      } else {
        const text = criteria[s].length > 12 ? criteria[s].substring(0, 10) + '...' : criteria[s];
        ctx.fillText(text, x, y);
      }
    }
    
    // Рисуем маркеры (только в презентации)
    if (isDark) {
      markers.forEach((marker, index) => {
        drawMarkerOnCanvas(ctx, marker.x, marker.y, index);
      });
      
      // Рисуем частицы
      drawParticles(ctx);
    }
  }
  
  // Рисовать маркер
  function drawMarkerOnCanvas(ctx, x, y, index) {
    if (!ctx) return;
    
    const color = markerColors[index % markerColors.length];
    
    // Свечение
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    
    // Внешний круг (свечение)
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, 2 * Math.PI);
    ctx.fillStyle = color + '40';
    ctx.fill();
    
    // Основной маркер
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    
    // Белая обводка
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Блик
    ctx.beginPath();
    ctx.arc(x - 3, y - 3, 3, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fill();
    
    // Сброс тени
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }
  
  // Рисовать частицы
  function drawParticles(ctx) {
    particles.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, 2 * Math.PI);
      ctx.fillStyle = p.color;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
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
      // Определяем сектор и кольцо
      const angle = Math.atan2(dy, dx) + Math.PI / 2;
      const normalizedAngle = angle < 0 ? angle + 2 * Math.PI : angle;
      const sectorIndex = Math.floor((normalizedAngle / (2 * Math.PI)) * criteria.length) % criteria.length;
      const ringIndex = Math.min(Math.floor((distance / maxRadius) * rings), rings - 1);
      
      // Цвет маркера
      const markerColor = markerColors[markers.length % markerColors.length];
      
      // Добавляем маркер с информацией о секторе и кольце
      markers = [...markers, {
        x,
        y,
        sector: sectorIndex,
        ring: ringIndex,
        timestamp: Date.now()
      }];
      
      // Создаём частицы для эффекта
      createParticles(x, y, markerColor, ringIndex >= rings - 1 ? 20 : 10);
      
      // Перерисовываем
      drawPresentation();
      
      // Эффект для центра (яблочко) — больше частиц и звук
      if (ringIndex >= rings - 1) {
        animateBullseye(x, y);
        // Дополнительные золотые частицы для центра
        createParticles(x, y, '#fbbf24', 15);
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
  
  // Показать статистику
  function showStats() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    mode = 'stats';
  }
  
  // Вернуться к презентации
  async function backToPresentation() {
    mode = 'presentation';
    await tick();
    setTimeout(() => {
      drawPresentation();
    }, 100);
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
        
        <!-- Заголовок с инструкцией -->
        <div class="card mb-6">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke-width="2"/>
                <circle cx="12" cy="12" r="6" stroke-width="2"/>
                <circle cx="12" cy="12" r="2" stroke-width="2"/>
              </svg>
            </div>
            <div class="flex-1">
              <h1 class="text-xl font-bold text-gray-900 mb-1">Мишень рефлексии</h1>
              <p class="text-gray-500 text-sm mb-3">Интерактивный инструмент для сбора обратной связи от учеников</p>
              <div class="flex flex-wrap gap-2">
                <span class="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-medium">🎯 Каждый сектор = тема</span>
                <span class="px-2.5 py-1 rounded-full bg-green-50 text-green-600 text-xs font-medium">✨ Центр = понял отлично</span>
                <span class="px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-medium">📊 Край = было сложно</span>
              </div>
            </div>
          </div>
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
          <button on:click={startPresentation} 
            class="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
            <div class="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span class="relative flex items-center gap-3">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Запустить на доске
            </span>
          </button>
        </div>
        
      </div>
    </div>
    
  {:else if mode === 'presentation'}
    <!-- Режим презентации (fullscreen) -->
    <div class="fixed inset-0 z-50 flex flex-col overflow-hidden" style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 25%, #4c1d95 50%, #581c87 75%, #701a75 100%);">
      
      <!-- Декоративные круги на фоне -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-purple-500/20 blur-3xl animate-pulse"></div>
        <div class="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-pink-500/20 blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-3xl"></div>
      </div>
      
      <!-- Управление -->
      <div class="absolute top-2 md:top-4 right-2 md:right-4 flex flex-wrap gap-1.5 md:gap-2 z-20 max-w-[calc(100%-1rem)]">
        <button on:click={showStats} class="px-2.5 md:px-4 py-1.5 md:py-2.5 rounded-lg md:rounded-xl bg-emerald-500/90 backdrop-blur-xl text-white text-xs md:text-sm font-medium hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/25">
          📊 <span class="hidden sm:inline">Результаты</span>
        </button>
        <button on:click={clearMarkers} class="px-2.5 md:px-4 py-1.5 md:py-2.5 rounded-lg md:rounded-xl bg-white/15 backdrop-blur-xl text-white text-xs md:text-sm font-medium hover:bg-white/25 transition-all">
          🗑️ <span class="hidden sm:inline">Очистить</span>
        </button>
        <button on:click={saveAsPNG} class="px-2.5 md:px-4 py-1.5 md:py-2.5 rounded-lg md:rounded-xl bg-white/15 backdrop-blur-xl text-white text-xs md:text-sm font-medium hover:bg-white/25 transition-all">
          💾 <span class="hidden sm:inline">Сохранить</span>
        </button>
        <button on:click={exitPresentation} class="px-2.5 md:px-4 py-1.5 md:py-2.5 rounded-lg md:rounded-xl bg-red-500/90 backdrop-blur-xl text-white text-xs md:text-sm font-medium hover:bg-red-500 transition-all shadow-lg shadow-red-500/25">
          ✕ <span class="hidden sm:inline">Выход</span>
        </button>
      </div>
      
      <!-- Счётчик маркеров -->
      <div class="absolute top-2 md:top-4 left-2 md:left-4 z-20">
        <div class="px-3 md:px-5 py-2 md:py-3 rounded-xl md:rounded-2xl bg-white/15 backdrop-blur-xl text-white shadow-lg">
          <div class="text-xl md:text-3xl font-bold">{markers.length}</div>
          <div class="text-[10px] md:text-xs text-white/70">ответов</div>
        </div>
      </div>
      
      <!-- Подсказка -->
      <div class="absolute bottom-2 md:bottom-6 left-1/2 -translate-x-1/2 z-20 px-2 w-full max-w-lg">
        <div class="px-3 md:px-6 py-2 md:py-4 rounded-xl md:rounded-2xl bg-white/15 backdrop-blur-xl text-white text-center shadow-lg">
          <p class="text-xs md:text-base font-medium mb-0.5 md:mb-1">👆 Нажми в <span class="text-amber-300 font-bold">каждый сектор</span></p>
          <p class="text-[10px] md:text-sm text-white/70">Центр = понял ✨ | Край = сложно 🤔</p>
        </div>
      </div>
      
      <!-- Мишень -->
      <div class="flex-1 flex items-center justify-center p-8">
        <canvas bind:this={presentationCanvas} width={canvasSize} height={canvasSize} 
          on:click={handleCanvasClick}
          on:touchstart|preventDefault={handleCanvasClick}
          class="max-w-full max-h-full cursor-crosshair rounded-2xl shadow-2xl"></canvas>
      </div>
      
    </div>
    
  {:else if mode === 'stats'}
    <!-- Режим статистики -->
    <div class="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col overflow-y-auto">
      
      <!-- Управление -->
      <div class="absolute top-4 right-4 flex gap-2 z-10">
        <button on:click={backToPresentation} class="px-4 py-2 rounded-xl bg-indigo-500/80 backdrop-blur-xl text-white hover:bg-indigo-500 transition-all">
          ← Назад к мишени
        </button>
        <button on:click={exitPresentation} class="px-4 py-2 rounded-xl bg-red-500/80 backdrop-blur-xl text-white hover:bg-red-500 transition-all">
          Завершить
        </button>
      </div>
      
      <div class="flex-1 p-6 md:p-10 pt-20">
        <div class="max-w-4xl mx-auto">
          
          <!-- Заголовок -->
          <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-white mb-2">Результаты рефлексии</h1>
            <p class="text-white/60">Анализ ответов учеников</p>
          </div>
          
          <!-- Главные метрики -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div class="bg-white/10 backdrop-blur-xl rounded-2xl p-5 text-center">
              <p class="text-4xl font-bold text-white mb-1">{stats.total}</p>
              <p class="text-white/60 text-sm">Всего ответов</p>
            </div>
            <div class="bg-white/10 backdrop-blur-xl rounded-2xl p-5 text-center">
              <p class="text-4xl font-bold text-white mb-1">{stats.avgScore}%</p>
              <p class="text-white/60 text-sm">Средний балл</p>
            </div>
            <div class="bg-white/10 backdrop-blur-xl rounded-2xl p-5 text-center col-span-2">
              <p class="text-2xl font-bold text-white mb-1">{stats.understanding}</p>
              <p class="text-white/60 text-sm">Уровень понимания</p>
            </div>
          </div>
          
          <!-- Распределение по кольцам (уровень понимания) -->
          <div class="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6">
            <h3 class="text-lg font-bold text-white mb-4">📊 Распределение по уровням</h3>
            <div class="space-y-3">
              {#each ringLabels as label, i}
                {@const count = stats.byRing[i] || 0}
                {@const percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0}
                {@const isGood = i >= rings - 1}
                {@const isBad = i === 0}
                <div class="flex items-center gap-3">
                  <span class="text-white/80 text-sm w-32 truncate">{label}</span>
                  <div class="flex-1 h-8 bg-white/10 rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-3
                      {isGood ? 'bg-green-500' : isBad ? 'bg-red-500' : 'bg-amber-500'}"
                      style="width: {Math.max(percent, 5)}%">
                      <span class="text-white text-sm font-bold">{count}</span>
                    </div>
                  </div>
                  <span class="text-white/60 text-sm w-12 text-right">{percent}%</span>
                </div>
              {/each}
            </div>
          </div>
          
          <!-- Анализ понимания по темам -->
          <div class="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6">
            <h3 class="text-lg font-bold text-white mb-4">📚 Понимание по темам</h3>
            <p class="text-white/60 text-sm mb-4">Средний балл понимания каждой темы (ближе к центру = лучше поняли)</p>
            <div class="space-y-3">
              {#each criteria as criterion, i}
                {@const sectorData = stats.sectorScores[i] || { count: 0, avgScore: 0, level: 'Нет данных' }}
                {@const isStrong = sectorData.avgScore >= 60}
                {@const isWeak = sectorData.avgScore < 40 && sectorData.count > 0}
                <div class="bg-white/5 rounded-xl p-4">
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                      <div class="w-4 h-4 rounded" style="background: {sectorColors[i % sectorColors.length]}"></div>
                      <span class="text-white font-medium">{criterion}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-white/60 text-sm">{sectorData.count} отв.</span>
                      <span class="px-2 py-0.5 rounded-full text-xs font-bold
                        {isStrong ? 'bg-green-500/30 text-green-300' : isWeak ? 'bg-red-500/30 text-red-300' : 'bg-amber-500/30 text-amber-300'}">
                        {sectorData.level}
                      </span>
                    </div>
                  </div>
                  <div class="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-500
                      {isStrong ? 'bg-green-500' : isWeak ? 'bg-red-500' : 'bg-amber-500'}"
                      style="width: {Math.max(sectorData.avgScore, 3)}%">
                    </div>
                  </div>
                  <div class="flex justify-between mt-1">
                    <span class="text-white/40 text-xs">Сложно</span>
                    <span class="text-white font-bold text-sm">{sectorData.avgScore}%</span>
                    <span class="text-white/40 text-xs">Легко</span>
                  </div>
                </div>
              {/each}
            </div>
          </div>
          
          <!-- Сильные и слабые темы -->
          {#if stats.strongTopics.length > 0 || stats.weakTopics.length > 0}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {#if stats.strongTopics.length > 0}
                <div class="bg-green-500/20 backdrop-blur-xl rounded-2xl p-5">
                  <h4 class="text-green-300 font-bold mb-3 flex items-center gap-2">
                    <span>✅</span> Сильные темы
                  </h4>
                  <div class="space-y-2">
                    {#each stats.strongTopics as topic}
                      <div class="flex items-center justify-between text-white/80">
                        <span class="text-sm">{topic.name}</span>
                        <span class="text-green-300 font-bold">{topic.avgScore}%</span>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
              
              {#if stats.weakTopics.length > 0}
                <div class="bg-red-500/20 backdrop-blur-xl rounded-2xl p-5">
                  <h4 class="text-red-300 font-bold mb-3 flex items-center gap-2">
                    <span>⚠️</span> Требуют внимания
                  </h4>
                  <div class="space-y-2">
                    {#each stats.weakTopics as topic}
                      <div class="flex items-center justify-between text-white/80">
                        <span class="text-sm">{topic.name}</span>
                        <span class="text-red-300 font-bold">{topic.avgScore}%</span>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          {/if}
          
          <!-- Рекомендации -->
          <div class="bg-white/10 backdrop-blur-xl rounded-2xl p-6">
            <h3 class="text-lg font-bold text-white mb-4">💡 Рекомендации</h3>
            <div class="space-y-3 text-white/80">
              {#if stats.total === 0}
                <p>📝 Нет данных для анализа.</p>
                <p class="text-white/60 text-sm">Попросите каждого ученика поставить отметку в КАЖДЫЙ сектор на том уровне, насколько он понял эту тему.</p>
              {:else if stats.avgScore >= 80}
                <p>✅ Отличный результат! Ученики хорошо усвоили все темы урока.</p>
              {:else if stats.avgScore >= 60}
                <p>👍 Хороший результат. Большинство тем усвоены хорошо.</p>
              {:else if stats.avgScore >= 40}
                <p>📊 Средний результат. Рекомендуется повторить сложные темы.</p>
              {:else}
                <p>⚠️ Материал вызвал затруднения. Рекомендуется дополнительное объяснение.</p>
              {/if}
              
              {#if stats.weakTopics.length > 0}
                <p class="text-amber-300">🔄 Рекомендуется повторить: {stats.weakTopics.map(t => t.name).join(', ')}</p>
              {/if}
              
              {#if stats.strongTopics.length > 0 && stats.weakTopics.length > 0}
                <p class="text-white/60 text-sm">💡 Можно использовать сильные темы как опору для объяснения слабых.</p>
              {/if}
            </div>
          </div>
          
        </div>
      </div>
      
    </div>
  {/if}
  
</div>
