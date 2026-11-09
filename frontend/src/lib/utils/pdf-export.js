import { lessonHasContent, stageHasContent } from './lesson-state.js';
import { stageLabel } from './lesson-labels.js';
import { stageNotesHTML, escapeHTML, lessonText } from './lesson-export.js';
import { translateLabel } from './export-labels.js';
import { formatTimeDisplay } from './time-intervals.js';
import { getAgeGroupNames, getSkillNames, getStageNames, getTypeNames } from './localization.js';

/** Download a real, paginated PDF on desktop and mobile. */
export async function exportLessonToPDF(lessonData) {
  if (!lessonHasContent(lessonData) && !lessonData?.cards?.length) throw new Error('План урока пуст');
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
  const safe = { ...lessonData };
  for (const key of ['subject', 'topic', 'grade', 'description', 'goals']) safe[key] = escape(safe[key]);
  safe.cards = (lessonData.cards || []).map(card => ({ ...card,
    title: escape(card.title), description: escape(card.description), content: escape(card.content)
  }));
  if(lessonData.lessonStages)safe.lessonStages=Object.fromEntries(Object.entries(lessonData.lessonStages).map(([id,stage])=>[id,{...stage,cards:(stage.cards||[]).map(card=>({...card,title:escape(card.title),description:escape(card.description),content:escape(card.content)}))}]));
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:800px;height:1200px;border:0;';
  document.body.appendChild(frame);
  try {
    const loaded = new Promise(resolve => { frame.onload = resolve; });
    frame.srcdoc = createFullHTMLDocument(safe, createPrintableContent(safe));
    await loaded;
    const doc = frame.contentDocument;
    if (['uz','en'].includes(lessonData.language)) {
      const language=lessonData.language;
      for (const element of doc.querySelectorAll('h1,h2,h3,.info-label,.summary strong,.technique-content strong')) {
        element.textContent = translateLabel(element.textContent, language);
      }
      doc.querySelector('.header p').textContent = language==='uz'?'Evrika platformasi yordamida yaratildi':'Created with EvrikaEdu';
      for (const element of doc.querySelectorAll('.summary p,.info-value')) {
        for (const node of element.childNodes) if (node.nodeType === 3) {
          node.textContent = translateLabel(node.textContent, language).replace(/(\d+) минут/g, language==='uz'?'$1 daqiqa':'$1 min');
        }
      }
      const heading = doc.querySelector('.techniques-section h2');
      if (heading) heading.textContent = language==='uz'?'Dars jarayoni':'Lesson flow';
    }
    await doc.fonts.ready;
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    let pageY = 12;
    // Render one section at a time to avoid mobile canvas size limits.
    const blocks = [...doc.body.children].flatMap(node => node.classList.contains('techniques-section') ? [...node.children] : [node]);
    for (const block of blocks) {
      const canvas = await html2canvas(block, { scale: 1.5, backgroundColor: '#ffffff', windowWidth: 800 });
      const mmPerPixel = 186 / canvas.width;
      const rootTop = block.getBoundingClientRect().top;
      const textRects = [];
      const walker = doc.createTreeWalker(block, 4);
      while (walker.nextNode()) {
        if (!walker.currentNode.textContent.trim()) continue;
        const range = doc.createRange();
        range.selectNodeContents(walker.currentNode);
        for (const rect of range.getClientRects()) textRects.push({ top: (rect.top - rootTop) * 1.5, bottom: (rect.bottom - rootTop) * 1.5 });
      }
      if (canvas.height * mmPerPixel <= 273 && canvas.height * mmPerPixel > 285 - pageY) {
        pdf.addPage(); pageY = 12;
      }
      let offset = 0;
      while (offset < canvas.height) {
        let height = Math.min(canvas.height - offset, Math.floor((285 - pageY) / mmPerPixel));
        if (height <= 0) { pdf.addPage(); pageY = 12; continue; }
        if (offset + height < canvas.height) {
          const boundary = offset + height;
          const crossing = textRects.filter(rect => rect.top < boundary && rect.bottom > boundary);
          if (crossing.length) height = Math.floor(Math.min(...crossing.map(rect => rect.top)) - offset);
          if (height <= 0) { pdf.addPage(); pageY = 12; continue; }
        }
        const slice = document.createElement('canvas');
        slice.width = canvas.width; slice.height = height;
        slice.getContext('2d').drawImage(canvas, 0, offset, canvas.width, height, 0, 0, canvas.width, height);
        pdf.addImage(slice, 'PNG', 12, pageY, 186, height * mmPerPixel);
        offset += height;
        pageY += height * mmPerPixel;
        if (offset < canvas.height) { pdf.addPage(); pageY = 12; }
      }
      pageY += 5;
    }
    await pdf.save(`план-урока-${sanitizeFileName(lessonData.topic || 'без-названия')}.pdf`, { returnPromise: true });
  } finally { frame.remove(); }
}

/**
 * Очищает имя файла от недопустимых символов
 */
function sanitizeFileName(name) {
  return name.replace(/[^a-zа-яё0-9\s-]/gi, '').replace(/\s+/g, '-').toLowerCase();
}

/**
 * Создает полный HTML документ для экспорта
 */
function createFullHTMLDocument(lessonData, printContent) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>План урока - ${lessonData.topic || 'Без названия'}</title>
      <style>
        body {
          overflow-wrap: anywhere;
          letter-spacing: 0.1px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .lesson-info {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .lesson-info h2 {
          margin-top: 0;
          color: #2563eb;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-top: 15px;
        }
        .info-item {
          display: flex;
          flex-direction: column;
        }
        .info-label {
          font-weight: bold;
          color: #374151;
          margin-bottom: 5px;
        }
        .info-value {
          color: #6b7280;
        }
        .techniques-section {
          margin-top: 30px;
        }
        .technique {
          border-left: 4px solid #2563eb;
          padding: 20px;
          margin-bottom: 20px;
          background: #f8f9fa;
          border-radius: 0 8px 8px 0;
        }
        .technique-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
        }
        .technique-title {
          font-size: 18px;
          font-weight: bold;
          color: #1f2937;
          margin: 0;
        }
        .technique-time {
          color: #6b7280;
          font-size: 14px;
          margin-left: auto;
        }
        .technique-description {
          color: #4b5563;
          margin: 10px 0;
        }
        .technique-content {
          background: white;
          padding: 15px;
          border-radius: 6px;
          margin-top: 10px;
        }
        .technique-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }
        .meta-tag {
          background: #e5e7eb;
          color: #374151;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
        }
        .meta-tag.stage {
          background: #dbeafe;
          color: #1e40af;
        }
        .meta-tag.type {
          background: #d1fae5;
          color: #065f46;
        }
        .meta-tag.skill {
          background: #fef3c7;
          color: #92400e;
        }
        .summary {
          background: #f0f9ff;
          border: 1px solid #0ea5e9;
          padding: 20px;
          border-radius: 8px;
          margin-top: 30px;
        }
        .summary h3 {
          color: #0369a1;
          margin-top: 0;
        }
        @media print {
          body { margin: 0; padding: 15px; }
          .technique { break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      ${printContent}
    </body>
    </html>
  `;
}

/**
 * Создает HTML контент для печати
 */
function createPrintableContent(lessonData) {
  const { subject, topic, grade, description, goals, cards, totalTime } = lessonData;
  
  return `
    <div class="header">
      <h1>План урока</h1>
      <p style="margin: 0; color: #6b7280;">Создано с помощью платформы Evrika</p>
    </div>

    <div class="lesson-info">
      <h2>Информация об уроке</h2>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Предмет:</span>
          <span class="info-value">${subject || 'Не указан'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Класс:</span>
          <span class="info-value">${grade || 'Не указан'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Тема урока:</span>
          <span class="info-value">${topic || 'Не указана'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Общее время:</span>
          <span class="info-value">${totalTime} минут</span>
        </div>
      </div>
      ${goals ? `
        <div class="info-item" style="margin-top: 15px;">
          <span class="info-label">Цели урока:</span>
          <span class="info-value">${goals}</span>
        </div>
      ` : ''}
      ${description ? `
        <div class="info-item" style="margin-top: 15px;">
          <span class="info-label">Описание:</span>
          <span class="info-value">${description}</span>
        </div>
      ` : ''}
    </div>

    ${(cards?.length || lessonHasContent(lessonData)) ? `
      <div class="techniques-section">
        <h2>${lessonData.language==='uz'?'Dars jarayoni':lessonData.language==='en'?'Lesson flow':'Ход урока'}</h2>
        ${lessonData.lessonStages ? Object.entries(lessonData.lessonStages).map(([id, stage]) => (stageHasContent(stage) || stage.duration>0) ?
          `<h3>${escapeHTML(stageLabel(id, lessonData.language))} · ${stage.totalTime} ${lessonData.language==='uz'?'daqiqa':lessonData.language==='en'?'min':'мин'}</h3>${stageNotesHTML(stage,lessonData.language)}${stage.cards.map(card => createTechniqueHTML(cards.find(item => item.id === card.id) || card, cards.findIndex(item => item.id === card.id) + 1, lessonData.language)).join('')}` : '').join('') : cards.map((card, index) => createTechniqueHTML(card, index + 1, lessonData.language)).join('')}
      </div>

      <div class="summary">
        <h3>Сводка урока</h3>
        <p><strong>Количество приёмов:</strong> ${cards.length}</p>
        <p><strong>Общее время:</strong> ${totalTime} минут</p>
        ${cards.length ? `<p><strong>Средняя продолжительность приёма:</strong> ${Math.round(cards.reduce((sum, card) => sum + (card.timeMinutes ?? card.time_minutes ?? 0), 0) / cards.length)} минут</p>` : ''}
      </div>
    ` : '<p style="text-align: center; color: #6b7280; margin: 40px 0;">Приёмы не добавлены</p>'}
  `;
}

/**
 * Создает HTML для отдельного приёма
 */
function createTechniqueHTML(card, index, language = "ru") {
  try {
    // Правильно извлекаем данные из карточки с учетом реальной структуры
    const timeMinutes = card.timeMinutes || card.time_minutes || 0;
    
    // Безопасная обработка всех метаданных (все функции возвращают строки)
    const stagesText = (card.stageIds && Array.isArray(card.stageIds)) ? getStageNames(card.stageIds, language) : '';
    const typesText = (card.typeIds && Array.isArray(card.typeIds)) ? getTypeNames(card.typeIds, language) : '';
    const skillsText = (card.skillIds && Array.isArray(card.skillIds)) ? getSkillNames(card.skillIds, language) : '';
    
    // Безопасная обработка ageGroups - getAgeGroupNames возвращает строку, не массив
    let ageGroupsText = '';
    if (card.ageGroups) {
      if (Array.isArray(card.ageGroups)) {
        // Если это массив ID, получаем строку с названиями
        ageGroupsText = getAgeGroupNames(card.ageGroups, language);
      } else if (typeof card.ageGroups === 'string') {
        // Если это уже строка с названием, используем как есть
        ageGroupsText = card.ageGroups;
      }
    }

    return `
      <div class="technique">
        <div class="technique-header">
          <h3 class="technique-title">${index}. ${card.title || 'Без названия'}</h3>
          <span class="technique-time">${formatTimeDisplay(timeMinutes, language)}</span>
        </div>
        
        <p class="technique-description">${card.description || 'Описание отсутствует'}</p>
        
        ${card.content ? `
          <div class="technique-content">
            <strong>Содержание:</strong><br>
            ${card.content.replace(/\n/g, '<br>')}
          </div>
        ` : ''}

        <div class="technique-meta">
          ${ageGroupsText ? `<span class="meta-tag age-group">${ageGroupsText}</span>` : ''}
          ${stagesText ? `<span class="meta-tag stage">${stagesText}</span>` : ''}
          ${typesText ? `<span class="meta-tag type">${typesText}</span>` : ''}
          ${skillsText ? `<span class="meta-tag skill">${skillsText}</span>` : ''}
        </div>
      </div>
    `;
    
  } catch (error) {
    console.error(`📄 PDF Export: Error processing card ${index}:`, error);
    return `<div class="technique"><p>Ошибка при обработке карточки ${index}: ${error.message}</p></div>`;
  }
}

/**
 * Экспорт урока в JSON файл
 */
export function exportLessonToJSON(lessonData) {
  const dataStr = JSON.stringify(lessonData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `урок_${lessonData.topic || 'без_названия'}_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  
  URL.revokeObjectURL(url);
}

/**
 * Экспорт урока в текстовый файл
 */
export function exportLessonToText(lessonData) {
 const url=URL.createObjectURL(new Blob([lessonText(lessonData)],{type:'text/plain;charset=utf-8'}));
 const link=document.createElement('a');link.href=url;link.download=`lesson-${sanitizeFileName(lessonData.topic||'lesson')}.txt`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
