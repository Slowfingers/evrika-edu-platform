import { lessonHasContent, stageHasContent } from './lesson-state.js';
import { stageLabel } from './lesson-labels.js';
import { stageTextSections } from './lesson-export.js';
import { translateLabel } from './export-labels.js';
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
    
    if (!lessonHasContent(lessonData) && !lessonData.cards?.length) {
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
  const { subject, topic, grade, description, goals, cards = [], totalTime, lessonStages, language = "ru" } = lessonData;
  
  const sections = [];
  
  // Заголовок документа
  sections.push(
    new Paragraph({
      text: translateLabel("ПЛАН УРОКА", language),
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    })
  );
  
  // Информация об уроке
  sections.push(
    new Paragraph({
      text: translateLabel("Информация об уроке", language),
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 }
    })
  );
  
  // Предмет и класс
  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: translateLabel("Предмет: ", language), bold: true }),
        new TextRun({ text: subject || translateLabel("Не указан", language) })
      ],
      spacing: { after: 100 }
    })
  );
  
  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: translateLabel("Класс: ", language), bold: true }),
        new TextRun({ text: grade || translateLabel("Не указан", language) })
      ],
      spacing: { after: 100 }
    })
  );
  
  // Тема урока
  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: translateLabel("Тема урока: ", language), bold: true }),
        new TextRun({ text: topic || translateLabel("Не указана", language) })
      ],
      spacing: { after: 100 }
    })
  );
  
  // Общее время
  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: translateLabel("Общее время: ", language), bold: true }),
        new TextRun({ text: `${totalTime} ${language === "uz" ? "daqiqa" : language === "en" ? "min" : "минут"}` })
      ],
      spacing: { after: 100 }
    })
  );
  
  // Цели урока
  if (goals) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: translateLabel("Цели урока: ", language), bold: true }),
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
          new TextRun({ text: translateLabel("Описание: ", language), bold: true }),
          new TextRun({ text: description })
        ],
        spacing: { after: 200 }
      })
    );
  }
  
  // Приёмы урока по этапам
  if (lessonStages) {
    const stageNames = {
      'начало-урока': translateLabel("Начало урока", language),
      'объяснение-нового-материала': translateLabel("Объяснение нового материала", language),
      'закрепление': translateLabel("Закрепление", language),
      'конец-урока': translateLabel("Конец урока", language)
    };
    
    Object.keys(lessonStages).forEach(stageId => {
      const stage = lessonStages[stageId];
      if (stageHasContent(stage) || stage.duration>0) {
        // Заголовок этапа
        sections.push(
          new Paragraph({
            text: `${stageLabel(stageId, language)} (${stage.totalTime} ${language === "uz" ? "daq" : language === "en" ? "min" : "мин"})`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 }
          })
        );
        
        for (const field of stageTextSections(stage, language)) {
          sections.push(new Paragraph({children:[new TextRun({text:field.label,bold:true})],spacing:{before:180,after:80}}));
          for (const line of field.text.split('\n')) sections.push(new Paragraph({text:line,spacing:{after:80}}));
        }
        // Карточки этапа
        stage.cards.forEach((card, index) => {
          sections.push(...createCardParagraphs(card, index + 1, language));
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
      sections.push(...createCardParagraphs(card, index + 1, language));
    });
  }
  
  // Сводка
  sections.push(
    new Paragraph({
      text: translateLabel("Сводка урока", language),
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 150 }
    })
  );
  
  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: translateLabel("Количество приёмов: ", language), bold: true }),
        new TextRun({ text: `${cards.length}` })
      ],
      spacing: { after: 100 }
    })
  );
  
  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: translateLabel("Общее время: ", language), bold: true }),
        new TextRun({ text: `${totalTime} ${language === "uz" ? "daqiqa" : language === "en" ? "min" : "минут"}` })
      ],
      spacing: { after: 100 }
    })
  );
  
  if (cards.length > 0) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: translateLabel("Средняя продолжительность приёма: ", language), bold: true }),
          new TextRun({ text: `${Math.round(cards.reduce((sum,card)=>sum+(card.timeMinutes??card.time_minutes??0),0) / cards.length)} ${language === "uz" ? "daqiqa" : language === "en" ? "min" : "минут"}` })
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
function createCardParagraphs(card, index, language = "ru") {
  const paragraphs = [];
  const timeMinutes = card.timeMinutes || card.time_minutes || 0;
  
  // Заголовок карточки
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: `${index}. ${card.title || translateLabel("Без названия", language)}`, bold: true, size: 28 }),
        new TextRun({ text: ` (${formatTimeDisplay(timeMinutes, language)})`, italics: true, size: 24 })
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
          new TextRun({ text: translateLabel('Содержание:', language) + ' ', bold: true })
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
    const ageText = getAgeGroupNames(card.ageGroups, language);
    if (ageText) metadata.push(`${language === "uz" ? "Yosh:" : language === "en" ? "Age:" : "Возраст:"} ${ageText}`);
  }
  
  if (card.stageIds && Array.isArray(card.stageIds)) {
    const stagesText = getStageNames(card.stageIds, language);
    if (stagesText) metadata.push(`${language === "uz" ? "Bosqichlar:" : language === "en" ? "Stages:" : "Этапы:"} ${stagesText}`);
  }
  
  if (card.typeIds && Array.isArray(card.typeIds)) {
    const typesText = getTypeNames(card.typeIds, language);
    if (typesText) metadata.push(`${language === "uz" ? "Ish shakllari:" : language === "en" ? "Format:" : "Типы работы:"} ${typesText}`);
  }
  
  if (card.skillIds && Array.isArray(card.skillIds)) {
    const skillsText = getSkillNames(card.skillIds, language);
    if (skillsText) metadata.push(`${language === "uz" ? "Ko‘nikmalar:" : language === "en" ? "Skills:" : "Навыки:"} ${skillsText}`);
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
