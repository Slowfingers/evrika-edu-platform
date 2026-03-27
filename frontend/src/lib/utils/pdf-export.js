import { formatTimeDisplay } from './time-intervals.js';
import { getAgeGroupNames, getSkillNames, getStageNames, getTypeNames } from './localization.js';

/**
 * Экспорт урока в PDF через браузерную печать или прямое скачивание HTML
 */
export function exportLessonToPDF(lessonData, directDownload = false) {
  try {
    // Проверяем, что данные урока корректны
    if (!lessonData) {
      throw new Error('Данные урока отсутствуют');
    }
    
    if (!lessonData.cards || lessonData.cards.length === 0) {
      throw new Error('В уроке нет выбранных приёмов');
    }
    
    // Создаем HTML контент для PDF
    const printContent = createPrintableContent(lessonData);
    
    // Создаем полный HTML документ
    const fullHTML = createFullHTMLDocument(lessonData, printContent);
    
    // Проверяем, мобильное ли устройство или запрошено прямое скачивание
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (directDownload || isMobile) {
      // На мобильных или при прямом скачивании - сразу скачиваем HTML файл
      downloadAsHTMLFile(fullHTML, lessonData.topic);
      return;
    }
    
    // На десктопе - открываем окно печати
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      // Если всплывающие окна заблокированы, скачиваем как HTML файл
      downloadAsHTMLFile(fullHTML, lessonData.topic);
      return;
    }
    
    // Записываем HTML в новое окно
    printWindow.document.write(fullHTML);
    printWindow.document.close();
    
    // Ждем загрузки и открываем диалог печати
    printWindow.onload = function() {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
    
  } catch (error) {
    console.error('📄 PDF Export: Error during export:', error);
    alert('Произошла ошибка при экспорте в PDF: ' + error.message);
  }
}

/**
 * Скачивает HTML файл как резервный вариант
 */
function downloadAsHTMLFile(htmlContent, topicName) {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `план-урока-${sanitizeFileName(topicName || 'без-названия')}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
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
          justify-content: between;
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

    ${cards && cards.length > 0 ? `
      <div class="techniques-section">
        <h2>Приёмы урока (${cards.length})</h2>
        ${cards.map((card, index) => createTechniqueHTML(card, index + 1)).join('')}
      </div>

      <div class="summary">
        <h3>Сводка урока</h3>
        <p><strong>Количество приёмов:</strong> ${cards.length}</p>
        <p><strong>Общее время:</strong> ${totalTime} минут</p>
        <p><strong>Средняя продолжительность приёма:</strong> ${Math.round(totalTime / cards.length)} минут</p>
      </div>
    ` : '<p style="text-align: center; color: #6b7280; margin: 40px 0;">Приёмы не добавлены</p>'}
  `;
}

/**
 * Создает HTML для отдельного приёма
 */
function createTechniqueHTML(card, index) {
  try {
    // Правильно извлекаем данные из карточки с учетом реальной структуры
    const timeMinutes = card.timeMinutes || card.time_minutes || 0;
    
    // Безопасная обработка всех метаданных (все функции возвращают строки)
    const stagesText = (card.stageIds && Array.isArray(card.stageIds)) ? getStageNames(card.stageIds) : '';
    const typesText = (card.typeIds && Array.isArray(card.typeIds)) ? getTypeNames(card.typeIds) : '';
    const skillsText = (card.skillIds && Array.isArray(card.skillIds)) ? getSkillNames(card.skillIds) : '';
    
    // Безопасная обработка ageGroups - getAgeGroupNames возвращает строку, не массив
    let ageGroupsText = '';
    if (card.ageGroups) {
      if (Array.isArray(card.ageGroups)) {
        // Если это массив ID, получаем строку с названиями
        ageGroupsText = getAgeGroupNames(card.ageGroups);
      } else if (typeof card.ageGroups === 'string') {
        // Если это уже строка с названием, используем как есть
        ageGroupsText = card.ageGroups;
      }
    }

    return `
      <div class="technique">
        <div class="technique-header">
          <h3 class="technique-title">${index}. ${card.title || 'Без названия'}</h3>
          <span class="technique-time">${formatTimeDisplay(timeMinutes)}</span>
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
  const { subject, topic, grade, description, cards, totalTime } = lessonData;
  
  let content = `ПЛАН УРОКА\n`;
  content += `${'='.repeat(50)}\n\n`;
  
  content += `Предмет: ${subject || 'Не указан'}\n`;
  content += `Класс: ${grade || 'Не указан'}\n`;
  content += `Тема: ${topic || 'Не указана'}\n`;
  content += `Общее время: ${totalTime} минут\n`;
  
  if (description) {
    content += `\nОписание: ${description}\n`;
  }
  
  if (cards && cards.length > 0) {
    content += `\nПРИЁМЫ УРОКА (${cards.length})\n`;
    content += `${'-'.repeat(30)}\n\n`;
    
    cards.forEach((card, index) => {
      content += `${index + 1}. ${card.title}\n`;
      content += `   Время: ${formatTimeDisplay(card.timeMinutes)}\n`;
      content += `   Описание: ${card.description}\n`;
      
      if (card.content) {
        content += `   Содержание: ${card.content}\n`;
      }
      
      const stages = card.stageIds ? getStageNames(card.stageIds) : [];
      const types = card.typeIds ? getTypeNames(card.typeIds) : [];
      const skills = card.skills ? getSkillNames(card.skills) : [];
      
      if (stages.length > 0) {
        content += `   Этапы: ${stages.join(', ')}\n`;
      }
      if (types.length > 0) {
        content += `   Типы работы: ${types.join(', ')}\n`;
      }
      if (skills.length > 0) {
        content += `   Навыки: ${skills.join(', ')}\n`;
      }
      
      content += '\n';
    });
    
    content += `\nСВОДКА\n`;
    content += `${'-'.repeat(20)}\n`;
    content += `Количество приёмов: ${cards.length}\n`;
    content += `Общее время: ${totalTime} минут\n`;
    content += `Средняя продолжительность: ${Math.round(totalTime / cards.length)} минут\n`;
  }
  
  const dataBlob = new Blob([content], { type: 'text/plain; charset=utf-8' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `урок_${lessonData.topic || 'без_названия'}_${new Date().toISOString().split('T')[0]}.txt`;
  link.click();
  
  URL.revokeObjectURL(url);
}
