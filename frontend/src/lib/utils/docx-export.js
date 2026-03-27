import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { formatTimeDisplay } from './time-intervals.js';
import { getAgeGroupNames, getSkillNames, getStageNames, getTypeNames } from './localization.js';

/**
 * Экспорт урока в DOCX формат
 */
export async function exportLessonToDOCX(lessonData) {
  try {
    if (!lessonData) {
      throw new Error('Данные урока отсутствуют');
    }
    
    if (!lessonData.cards || lessonData.cards.length === 0) {
      throw new Error('В уроке нет выбранных приёмов');
    }

    const doc = createDocxDocument(lessonData);
    
    // Генерируем blob
    const blob = await Packer.toBlob(doc);
    
    // Скачиваем файл
    const fileName = `план-урока-${sanitizeFileName(lessonData.topic || 'без-названия')}.docx`;
    saveAs(blob, fileName);
    
  } catch (error) {
    console.error('📄 DOCX Export: Error during export:', error);
    alert('Ошибка при экспорте в DOCX: ' + error.message);
  }
}

/**
 * Очищает имя файла от недопустимых символов
 */
function sanitizeFileName(name) {
  return name.replace(/[^a-zа-яё0-9\s-]/gi, '').replace(/\s+/g, '-').toLowerCase();
}

/**
 * Создает DOCX документ
 */
function createDocxDocument(lessonData) {
  const { subject, topic, grade, description, goals, cards, totalTime, lessonStages } = lessonData;
  
  const sections = [];
  
  // Заголовок документа
  sections.push(
    new Paragraph({
      text: 'ПЛАН УРОКА',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    })
  );
  
  // Информация об уроке
  sections.push(
    new Paragraph({
      text: 'Информация об уроке',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 }
    })
  );
  
  // Предмет и класс
  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Предмет: ', bold: true }),
        new TextRun({ text: subject || 'Не указан' })
      ],
      spacing: { after: 100 }
    })
  );
  
  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Класс: ', bold: true }),
        new TextRun({ text: grade || 'Не указан' })
      ],
      spacing: { after: 100 }
    })
  );
  
  // Тема урока
  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Тема урока: ', bold: true }),
        new TextRun({ text: topic || 'Не указана' })
      ],
      spacing: { after: 100 }
    })
  );
  
  // Общее время
  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Общее время: ', bold: true }),
        new TextRun({ text: `${totalTime} минут` })
      ],
      spacing: { after: 100 }
    })
  );
  
  // Цели урока
  if (goals) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Цели урока: ', bold: true }),
          new TextRun({ text: goals })
        ],
        spacing: { after: 100 }
      })
    );
  }
  
  // Описание
  if (description) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Описание: ', bold: true }),
          new TextRun({ text: description })
        ],
        spacing: { after: 200 }
      })
    );
  }
  
  // Приёмы урока по этапам
  if (lessonStages) {
    const stageNames = {
      'начало-урока': 'Начало урока',
      'объяснение-нового-материала': 'Объяснение нового материала',
      'закрепление': 'Закрепление',
      'конец-урока': 'Конец урока'
    };
    
    Object.keys(lessonStages).forEach(stageId => {
      const stage = lessonStages[stageId];
      if (stage.cards && stage.cards.length > 0) {
        // Заголовок этапа
        sections.push(
          new Paragraph({
            text: `${stageNames[stageId]} (${stage.totalTime} мин)`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 }
          })
        );
        
        // Карточки этапа
        stage.cards.forEach((card, index) => {
          sections.push(...createCardParagraphs(card, index + 1));
        });
      }
    });
  } else if (cards && cards.length > 0) {
    // Если нет этапов, просто выводим все карточки
    sections.push(
      new Paragraph({
        text: `Приёмы урока (${cards.length})`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 }
      })
    );
    
    cards.forEach((card, index) => {
      sections.push(...createCardParagraphs(card, index + 1));
    });
  }
  
  // Сводка
  sections.push(
    new Paragraph({
      text: 'Сводка урока',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 150 }
    })
  );
  
  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Количество приёмов: ', bold: true }),
        new TextRun({ text: `${cards.length}` })
      ],
      spacing: { after: 100 }
    })
  );
  
  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Общее время: ', bold: true }),
        new TextRun({ text: `${totalTime} минут` })
      ],
      spacing: { after: 100 }
    })
  );
  
  if (cards.length > 0) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Средняя продолжительность приёма: ', bold: true }),
          new TextRun({ text: `${Math.round(totalTime / cards.length)} минут` })
        ],
        spacing: { after: 100 }
      })
    );
  }
  
  // Создаем документ
  const doc = new Document({
    sections: [{
      properties: {},
      children: sections
    }]
  });
  
  return doc;
}

/**
 * Создает параграфы для одной карточки
 */
function createCardParagraphs(card, index) {
  const paragraphs = [];
  const timeMinutes = card.timeMinutes || card.time_minutes || 0;
  
  // Заголовок карточки
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: `${index}. ${card.title || 'Без названия'}`, bold: true, size: 28 }),
        new TextRun({ text: ` (${formatTimeDisplay(timeMinutes)})`, italics: true, size: 24 })
      ],
      spacing: { before: 200, after: 100 }
    })
  );
  
  // Описание
  if (card.description) {
    paragraphs.push(
      new Paragraph({
        text: card.description,
        spacing: { after: 100 }
      })
    );
  }
  
  // Содержание
  if (card.content) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Содержание: ', bold: true })
        ],
        spacing: { before: 100, after: 50 }
      })
    );
    
    paragraphs.push(
      new Paragraph({
        text: card.content,
        spacing: { after: 100 }
      })
    );
  }
  
  // Метаданные
  const metadata = [];
  
  if (card.ageGroups && Array.isArray(card.ageGroups)) {
    const ageText = getAgeGroupNames(card.ageGroups);
    if (ageText) metadata.push(`Возраст: ${ageText}`);
  }
  
  if (card.stageIds && Array.isArray(card.stageIds)) {
    const stagesText = getStageNames(card.stageIds);
    if (stagesText) metadata.push(`Этапы: ${stagesText}`);
  }
  
  if (card.typeIds && Array.isArray(card.typeIds)) {
    const typesText = getTypeNames(card.typeIds);
    if (typesText) metadata.push(`Типы работы: ${typesText}`);
  }
  
  if (card.skillIds && Array.isArray(card.skillIds)) {
    const skillsText = getSkillNames(card.skillIds);
    if (skillsText) metadata.push(`Навыки: ${skillsText}`);
  }
  
  if (metadata.length > 0) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: metadata.join(' • '), italics: true, size: 20, color: '666666' })
        ],
        spacing: { after: 150 }
      })
    );
  }
  
  return paragraphs;
}
