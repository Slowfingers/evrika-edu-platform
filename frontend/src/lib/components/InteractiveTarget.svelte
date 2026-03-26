<script>
  import { onMount, tick, afterUpdate } from 'svelte';
  import { t } from '$lib/stores/lang.js';
  
  // Режимы работы
  let mode = 'setup'; // setup | presentation | stats
  
  // Настройки мишени
  let criteria = null;
  let rings = 3;
  let ringLabels = null;
  $: if (!criteria) criteria = [$t('target_topic') + ' 1', $t('target_topic') + ' 2', $t('target_topic') + ' 3', $t('target_topic') + ' 4'];
  $: if (!ringLabels) ringLabels = [$t('ring_hard'), $t('ring_ok'), $t('ring_easy')];
  
  // Данные взаимодействия
  let markers = []; // {x, y, sector, ring, timestamp}
  
  // Название класса для скачивания отчёта
  let className = '';
  
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
        understanding: $t('stat_no_data'),
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
      if (sectorMarkers.length === 0) return { count: 0, avgScore: 0, level: $t('stat_no_data') };
      
      let totalScore = 0;
      sectorMarkers.forEach(m => {
        if (m.ring !== undefined) {
          // Центр (ring = rings-1) = высокий балл, край (ring = 0) = низкий балл
          const score = (m.ring / (rings - 1)) * 100;
          totalScore += score;
        }
      });
      const avgScore = Math.round(totalScore / sectorMarkers.length);
      
      let level = $t('stat_no_data');
      if (avgScore >= 80) level = $t('stat_excellent');
      else if (avgScore >= 60) level = $t('stat_good');
      else if (avgScore >= 40) level = $t('stat_medium');
      else if (avgScore >= 20) level = $t('stat_weak');
      else level = $t('stat_hard');
      
      return { count: sectorMarkers.length, avgScore, level };
    });
    
    // Общий средний балл
    let totalScore = 0;
    let validMarkers = 0;
    markersList.forEach(m => {
      if (m.ring !== undefined) {
        const score = (m.ring / (rings - 1)) * 100;
        totalScore += score;
        validMarkers++;
      }
    });
    const avgScore = validMarkers > 0 ? Math.round(totalScore / validMarkers) : 0;
    
    // Уровень понимания
    let understanding = $t('stat_no_data');
    if (avgScore >= 80) understanding = $t('stat_und_excellent');
    else if (avgScore >= 60) understanding = $t('stat_und_good');
    else if (avgScore >= 40) understanding = $t('stat_und_medium');
    else if (avgScore >= 20) understanding = $t('stat_und_attention');
    else if (avgScore > 0) understanding = $t('stat_und_hard');
    
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
      criteria = [...criteria, `${$t('target_topic')} ${criteria.length + 1}`];
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
      2: [$t('ring_hard'), $t('ring_easy')],
      3: [$t('ring_hard'), $t('ring_ok'), $t('ring_easy')],
      4: [$t('ring_very_hard'), $t('ring_hard'), $t('ring_ok'), $t('ring_easy')],
      5: [$t('ring_very_hard'), $t('ring_hard'), $t('ring_ok'), $t('ring_easy'), $t('ring_super')]
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
    
    // Звёздочка в центре (только в презентации)
    if (isDark) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px system-ui, sans-serif';
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
      // Инвертируем: центр (distance=0) → ring=rings-1 (Легко), край → ring=0 (Сложно)
      const rawRing = Math.min(Math.floor((distance / maxRadius) * rings), rings - 1);
      const ringIndex = rings - 1 - rawRing;
      
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
  
  // Вспомогательная функция: скруглённый прямоугольник
  function rRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // Скачать статистику как PNG-изображение
  function downloadStats() {
    const date = new Date().toLocaleDateString('ru-RU');
    const W = 900;
    const PAD = 40;
    const INNER = W - PAD * 2;
    const hasStrongWeak = stats.strongTopics.length > 0 || stats.weakTopics.length > 0;
    const swRows = Math.max(stats.strongTopics.length, stats.weakTopics.length);

    // Pre-calculate total height
    const H = 160          // header
      + 110                // metrics row
      + 30 + rings * 40    // rings section
      + 30 + criteria.length * 68  // topics section
      + (hasStrongWeak ? 60 + swRows * 26 : 0)
      + 70;                // footer

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0,   '#1e1b4b');
    bg.addColorStop(0.4, '#312e81');
    bg.addColorStop(0.7, '#4c1d95');
    bg.addColorStop(1,   '#1e1b4b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Dot texture
    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    for (let x = 20; x < W; x += 40)
      for (let y = 20; y < H; y += 40) {
        ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill();
      }

    let cy = 0;

    // ── Header ──────────────────────────────────────────
    cy += 38;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '13px system-ui,sans-serif';
    ctx.fillText('РЕЗУЛЬТАТЫ РЕФЛЕКСИИ', W / 2, cy);

    cy += 36;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px system-ui,sans-serif';
    ctx.fillText('Мишень рефлексии 🎯', W / 2, cy);

    cy += 24;
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '14px system-ui,sans-serif';
    const sub = [className ? `Класс: ${className}` : null, `Дата: ${date}`].filter(Boolean).join('   •   ');
    ctx.fillText(sub, W / 2, cy);

    cy += 28;
    ctx.strokeStyle = 'rgba(255,255,255,0.13)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD, cy); ctx.lineTo(W - PAD, cy); ctx.stroke();

    // ── Metrics row ──────────────────────────────────────
    cy += 22;
    const mW = (INNER - 20) / 3;
    const mH = 72;
    const scoreColor = stats.avgScore >= 60 ? '#34d399' : stats.avgScore >= 40 ? '#fbbf24' : '#f87171';
    [
      { label: 'Всего ответов', value: String(stats.total),    color: '#818cf8' },
      { label: 'Средний балл',  value: `${stats.avgScore}%`,   color: scoreColor },
      { label: 'Понимание',     value: stats.understanding.replace(/[🎉👍📊⚠️🔴]/gu, '').trim(), color: '#e879f9' }
    ].forEach((m, i) => {
      const bx = PAD + i * (mW + 10);
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      rRect(ctx, bx, cy, mW, mH, 12); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
      rRect(ctx, bx, cy, mW, mH, 12); ctx.stroke();
      ctx.textAlign = 'center';
      ctx.fillStyle = m.color;
      ctx.font = 'bold 24px system-ui,sans-serif';
      ctx.fillText(m.value, bx + mW / 2, cy + 34);
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = '12px system-ui,sans-serif';
      ctx.fillText(m.label, bx + mW / 2, cy + 54);
    });
    cy += mH + 26;

    // ── Rings (уровни) ───────────────────────────────────
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.font = 'bold 14px system-ui,sans-serif';
    ctx.fillText('📊  Распределение по уровням', PAD, cy);
    cy += 22;

    ringLabels.forEach((label, i) => {
      const count   = stats.byRing[i] || 0;
      const percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
      const rColor  = i === 0 ? '#f87171' : i >= rings - 1 ? '#34d399' : '#fbbf24';
      const rowH    = 32;

      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = '12px system-ui,sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(label, PAD, cy + 21);

      const bx = PAD + 110, bw = INNER - 110 - 4, bh = 20;
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      rRect(ctx, bx, cy + 6, bw, bh, 6); ctx.fill();
      if (percent > 0) {
        const fw = Math.max((percent / 100) * bw, 24);
        ctx.fillStyle = rColor;
        rRect(ctx, bx, cy + 6, fw, bh, 6); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 11px system-ui,sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${count} (${percent}%)`, bx + fw - 7, cy + 20);
      }
      cy += rowH;
    });

    cy += 16;
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD, cy); ctx.lineTo(W - PAD, cy); ctx.stroke();
    cy += 20;

    // ── Topics ───────────────────────────────────────────
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.font = 'bold 14px system-ui,sans-serif';
    ctx.fillText('📚  Понимание по темам', PAD, cy);
    cy += 22;

    criteria.forEach((criterion, i) => {
      const s      = stats.sectorScores[i] || { count: 0, avgScore: 0, level: 'Нет данных' };
      const strong = s.avgScore >= 60;
      const weak   = s.avgScore < 40 && s.count > 0;
      const tColor = strong ? '#34d399' : weak ? '#f87171' : '#fbbf24';
      const tBg    = strong ? 'rgba(52,211,153,0.08)' : weak ? 'rgba(248,113,113,0.08)' : 'rgba(251,191,36,0.08)';
      const tBd    = strong ? 'rgba(52,211,153,0.25)' : weak ? 'rgba(248,113,113,0.25)' : 'rgba(251,191,36,0.25)';
      const boxH   = 60;

      ctx.fillStyle = tBg;
      rRect(ctx, PAD, cy, INNER, boxH, 10); ctx.fill();
      ctx.strokeStyle = tBd; ctx.lineWidth = 1;
      rRect(ctx, PAD, cy, INNER, boxH, 10); ctx.stroke();

      // Sector dot
      const rawColor = sectorColors[i % sectorColors.length];
      ctx.fillStyle = rawColor.replace(/[\d.]+\)$/, '1)');
      ctx.beginPath(); ctx.arc(PAD + 14, cy + 18, 6, 0, Math.PI * 2); ctx.fill();

      // Name
      ctx.fillStyle = '#fff'; ctx.font = 'bold 13px system-ui,sans-serif';
      ctx.textAlign = 'left';
      const nm = criterion.length > 34 ? criterion.slice(0, 32) + '…' : criterion;
      ctx.fillText(nm, PAD + 28, cy + 22);

      // Sub-label
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.font = '11px system-ui,sans-serif';
      ctx.fillText(`${s.count} ответов  •  ${s.level}`, PAD + 28, cy + 38);

      // Score
      ctx.fillStyle = tColor; ctx.font = 'bold 18px system-ui,sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${s.avgScore}%`, W - PAD - 12, cy + 24);

      // Progress bar
      const pbx = PAD + 28, pbw = INNER - 44 - 62, pbh = 6, pby = cy + 46;
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      rRect(ctx, pbx, pby, pbw, pbh, 3); ctx.fill();
      if (s.avgScore > 0) {
        ctx.fillStyle = tColor;
        rRect(ctx, pbx, pby, Math.max((s.avgScore / 100) * pbw, 6), pbh, 3); ctx.fill();
      }

      cy += boxH + 6;
    });

    // ── Strong / Weak ─────────────────────────────────────
    if (hasStrongWeak) {
      cy += 16;
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(PAD, cy); ctx.lineTo(W - PAD, cy); ctx.stroke();
      cy += 22;

      const colW = (INNER - 16) / 2;

      if (stats.strongTopics.length > 0) {
        ctx.fillStyle = 'rgba(52,211,153,0.8)'; ctx.font = 'bold 13px system-ui,sans-serif';
        ctx.textAlign = 'left'; ctx.fillText('✅  Сильные темы', PAD, cy);
        let sy = cy + 22;
        stats.strongTopics.forEach(t => {
          ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '12px system-ui,sans-serif';
          ctx.textAlign = 'left'; ctx.fillText(`• ${t.name}`, PAD + 8, sy);
          ctx.fillStyle = '#34d399'; ctx.font = 'bold 12px system-ui,sans-serif';
          ctx.textAlign = 'right'; ctx.fillText(`${t.avgScore}%`, PAD + colW, sy);
          sy += 24;
        });
      }

      if (stats.weakTopics.length > 0) {
        const wx = stats.strongTopics.length > 0 ? PAD + colW + 16 : PAD;
        ctx.fillStyle = 'rgba(248,113,113,0.8)'; ctx.font = 'bold 13px system-ui,sans-serif';
        ctx.textAlign = 'left'; ctx.fillText('⚠️  Требуют внимания', wx, cy);
        let wy = cy + 22;
        stats.weakTopics.forEach(t => {
          ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '12px system-ui,sans-serif';
          ctx.textAlign = 'left'; ctx.fillText(`• ${t.name}`, wx + 8, wy);
          ctx.fillStyle = '#f87171'; ctx.font = 'bold 12px system-ui,sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(`${t.avgScore}%`, stats.strongTopics.length > 0 ? W - PAD : wx + colW, wy);
          wy += 24;
        });
      }

      cy += 14 + swRows * 24;
    }

    // ── Footer ────────────────────────────────────────────
    cy += 24;
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD, cy); ctx.lineTo(W - PAD, cy); ctx.stroke();
    cy += 18;
    ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.font = '12px system-ui,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EvrikaEdu — Мишень рефлексии', W / 2, cy);

    // Export PNG
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `мишень${className ? '-' + className : ''}-${date.replace(/\./g, '-')}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
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
        <div class="card mb-4 md:mb-6">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke-width="2"/>
                <circle cx="12" cy="12" r="6" stroke-width="2"/>
                <circle cx="12" cy="12" r="2" stroke-width="2"/>
              </svg>
            </div>
            <div class="flex-1">
              <h1 class="text-lg md:text-xl font-bold text-gray-900 mb-0.5 md:mb-1">{$t('target_title')}</h1>
              <p class="text-gray-500 text-xs md:text-sm mb-2 md:mb-3">{$t('target_desc')}</p>
              <div class="flex flex-wrap gap-1.5 md:gap-2">
                <span class="px-2 py-0.5 md:px-2.5 md:py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] md:text-xs font-medium">{$t('target_hint1')}</span>
                <span class="px-2 py-0.5 md:px-2.5 md:py-1 rounded-full bg-green-50 text-green-600 text-[10px] md:text-xs font-medium">{$t('target_hint2')}</span>
                <span class="px-2 py-0.5 md:px-2.5 md:py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] md:text-xs font-medium">{$t('target_hint3')}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          
          <!-- Настройки -->
          <div class="space-y-4">
            
            <!-- Критерии -->
            <div class="card">
              <h3 class="text-sm font-bold text-gray-900 mb-3">{$t('target_criteria')}</h3>
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
                  {$t('target_add_criterion')}
                </button>
              {/if}
            </div>
            
            <!-- Кольца -->
            <div class="card">
              <h3 class="text-sm font-bold text-gray-900 mb-3">{$t('target_rings')}</h3>
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
                    <span class="text-xs text-gray-400 w-16">{$t('target_ring_n', i + 1)}</span>
                    <input type="text" bind:value={ringLabels[i]} class="input flex-1 !py-1.5 text-sm" />
                  </div>
                {/each}
              </div>
            </div>
            
          </div>
          
          <!-- Превью мишени -->
          <div class="card flex flex-col items-center justify-center">
            <h3 class="text-sm font-bold text-gray-900 mb-3">{$t('target_preview')}</h3>
            <canvas bind:this={previewCanvas} width={canvasSize} height={canvasSize} 
              class="max-w-full h-auto rounded-xl shadow-lg" style="background: #f9fafb;"></canvas>
          </div>
          
        </div>
        
        <!-- Кнопка запуска -->
        <div class="mt-6 flex justify-center">
          <button on:click={startPresentation} 
            class="btn btn-primary px-8 py-4 text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
            <span class="flex items-center gap-3">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {$t('target_start')}
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
          📊 <span class="hidden sm:inline">{$t('target_results')}</span>
        </button>
        <button on:click={clearMarkers} class="px-2.5 md:px-4 py-1.5 md:py-2.5 rounded-lg md:rounded-xl bg-white/15 backdrop-blur-xl text-white text-xs md:text-sm font-medium hover:bg-white/25 transition-all">
          🗑️ <span class="hidden sm:inline">{$t('target_clear')}</span>
        </button>
        <button on:click={saveAsPNG} class="px-2.5 md:px-4 py-1.5 md:py-2.5 rounded-lg md:rounded-xl bg-white/15 backdrop-blur-xl text-white text-xs md:text-sm font-medium hover:bg-white/25 transition-all">
          💾 <span class="hidden sm:inline">{$t('target_save')}</span>
        </button>
        <button on:click={exitPresentation} class="px-2.5 md:px-4 py-1.5 md:py-2.5 rounded-lg md:rounded-xl bg-red-500/90 backdrop-blur-xl text-white text-xs md:text-sm font-medium hover:bg-red-500 transition-all shadow-lg shadow-red-500/25">
          ✕ <span class="hidden sm:inline">{$t('target_exit')}</span>
        </button>
      </div>
      
      <!-- Счётчик маркеров -->
      <div class="absolute top-2 md:top-4 left-2 md:left-4 z-20">
        <div class="px-3 md:px-5 py-2 md:py-3 rounded-xl md:rounded-2xl bg-white/15 backdrop-blur-xl text-white shadow-lg">
          <div class="text-xl md:text-3xl font-bold">{markers.length}</div>
          <div class="text-[10px] md:text-xs text-white/70">{$t('target_responses')}</div>
        </div>
      </div>
      
      <!-- Подсказка -->
      <div class="absolute bottom-2 md:bottom-6 left-1/2 -translate-x-1/2 z-20 px-2 w-full max-w-lg">
        <div class="px-3 md:px-6 py-2 md:py-4 rounded-xl md:rounded-2xl bg-white/15 backdrop-blur-xl text-white text-center shadow-lg">
          <p class="text-xs md:text-base font-medium mb-0.5 md:mb-1">{@html $t('target_tap_hint')}</p>
          <p class="text-[10px] md:text-sm text-white/70">{$t('target_tap_sub')}</p>
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
        <button on:click={downloadStats} class="px-4 py-2 rounded-xl bg-emerald-500/80 backdrop-blur-xl text-white hover:bg-emerald-500 transition-all flex items-center gap-2">
          ⬇️ {$t('target_download_report')}
        </button>
        <button on:click={backToPresentation} class="px-4 py-2 rounded-xl bg-indigo-500/80 backdrop-blur-xl text-white hover:bg-indigo-500 transition-all">
          ← {$t('target_back_to_target')}
        </button>
        <button on:click={exitPresentation} class="px-4 py-2 rounded-xl bg-red-500/80 backdrop-blur-xl text-white hover:bg-red-500 transition-all">
          {$t('target_finish')}
        </button>
      </div>
      
      <div class="flex-1 p-6 md:p-10 pt-20">
        <div class="max-w-4xl mx-auto">
          
          <!-- Заголовок -->
          <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-white mb-2">{$t('target_stats_title')}</h1>
            <p class="text-white/60 mb-4">{$t('target_stats_desc')}</p>
            <div class="flex items-center justify-center gap-3">
              <label for="className" class="text-white/60 text-sm">{$t('target_class_label')}</label>
              <input id="className" type="text" bind:value={className} placeholder={$t('target_class_ph')} 
                class="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/50 w-40" />
            </div>
          </div>
          
          <!-- Главные метрики -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div class="bg-white/10 backdrop-blur-xl rounded-2xl p-5 text-center">
              <p class="text-4xl font-bold text-white mb-1">{stats.total}</p>
              <p class="text-white/60 text-sm">{$t('target_total_responses')}</p>
            </div>
            <div class="bg-white/10 backdrop-blur-xl rounded-2xl p-5 text-center">
              <p class="text-4xl font-bold text-white mb-1">{stats.avgScore}%</p>
              <p class="text-white/60 text-sm">{$t('target_avg_score')}</p>
            </div>
            <div class="bg-white/10 backdrop-blur-xl rounded-2xl p-5 text-center col-span-2">
              <p class="text-2xl font-bold text-white mb-1">{stats.understanding}</p>
              <p class="text-white/60 text-sm">{$t('target_understanding')}</p>
            </div>
          </div>
          
          <!-- Распределение по кольцам (уровень понимания) -->
          <div class="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6">
            <h3 class="text-lg font-bold text-white mb-4">{$t('target_by_level')}</h3>
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
            <h3 class="text-lg font-bold text-white mb-4">{$t('target_by_topic')}</h3>
            <p class="text-white/60 text-sm mb-4">{$t('target_by_topic_desc')}</p>
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
                      <span class="text-white/60 text-sm">{sectorData.count} {$t('target_answers_abbr')}</span>
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
                    <span class="text-white/40 text-xs">{$t('ring_hard')}</span>
                    <span class="text-white font-bold text-sm">{sectorData.avgScore}%</span>
                    <span class="text-white/40 text-xs">{$t('ring_easy')}</span>
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
                    <span>✅</span> {$t('target_strong_topics')}
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
                    <span>⚠️</span> {$t('target_weak_topics')}
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
            <h3 class="text-lg font-bold text-white mb-4">{$t('target_recommendations')}</h3>
            <div class="space-y-3 text-white/80">
              {#if stats.total === 0}
                <p>{$t('target_rec_no_data')}</p>
                <p class="text-white/60 text-sm">{$t('target_rec_instruction')}</p>
              {:else if stats.avgScore >= 80}
                <p>{$t('target_rec_excellent')}</p>
              {:else if stats.avgScore >= 60}
                <p>{$t('target_rec_good')}</p>
              {:else if stats.avgScore >= 40}
                <p>{$t('target_rec_medium')}</p>
              {:else}
                <p>{$t('target_rec_hard')}</p>
              {/if}
              
              {#if stats.weakTopics.length > 0}
                <p class="text-amber-300">{$t('target_rec_repeat')} {stats.weakTopics.map(t => t.name).join(', ')}</p>
              {/if}
              
              {#if stats.strongTopics.length > 0 && stats.weakTopics.length > 0}
                <p class="text-white/60 text-sm">{$t('target_rec_use_strong')}</p>
              {/if}
            </div>
          </div>
          
        </div>
      </div>
      
    </div>
  {/if}
  
</div>
