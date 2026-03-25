// Сервис для работы с карточками через JSON (для Vercel serverless)
const path = require('path');
const fs = require('fs');

// Загружаем данные из JSON файла
let cardsData = [];
try {
  const dataPath = path.join(__dirname, '../data/cards.json');
  const rawData = fs.readFileSync(dataPath, 'utf8');
  cardsData = JSON.parse(rawData);
  console.log(`📚 Загружено ${cardsData.length} карточек из JSON`);
} catch (error) {
  console.error('❌ Ошибка загрузки cards.json:', error.message);
}

// Преобразование ID фильтров в формат базы данных
function convertFilterIdToDbFormat(filterId, type) {
  const mappings = {
    ageGroups: {
      'начальные-классы': 'primary',
      'старшие-классы': 'secondary',
      'primary': 'primary',
      'secondary': 'secondary'
    },
    skills: {
      'критическое-мышление': 'critical',
      'командная-работа': 'teamwork', 
      'рефлексия': 'reflection',
      'креативное-мышление': 'creative',
      'систематизация': 'systematization',
      'систематизация-материала': 'systematization',
      'коммуникация': 'communication',
      'critical': 'critical',
      'teamwork': 'teamwork',
      'reflection': 'reflection',
      'creative': 'creative',
      'systematization': 'systematization',
      'communication': 'communication'
    },
    stages: {
      'lesson-start': 'начало-урока',
      'new-material': 'объяснение-нового-материала', 
      'practice': 'закрепление',
      'lesson-end': 'конец-урока',
      'начало-урока': 'начало-урока',
      'объяснение-нового-материала': 'объяснение-нового-материала',
      'закрепление': 'закрепление',
      'конец-урока': 'конец-урока'
    },
    types: {
      'индивидуальная': 'individual',
      'парная': 'pair',
      'командная': 'team', 
      'фронтальная': 'frontal',
      'individual': 'individual',
      'pair': 'pair',
      'team': 'team',
      'frontal': 'frontal'
    }
  };
  
  return mappings[type] && mappings[type][filterId] ? mappings[type][filterId] : filterId;
}

// Парсинг JSON строк в массивы
function parseJsonField(field) {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  try {
    return JSON.parse(field);
  } catch {
    return [];
  }
}

class CardServiceJSON {
  // Получить все карточки с фильтрацией
  async getAllCards(filters = {}) {
    let result = [...cardsData];

    // Фильтр по возрастным группам
    if (filters.ageGroupIds && filters.ageGroupIds.length > 0) {
      const dbIds = filters.ageGroupIds.map(id => convertFilterIdToDbFormat(id, 'ageGroups'));
      result = result.filter(card => {
        const cardAgeGroups = parseJsonField(card.age_groups);
        return dbIds.some(id => cardAgeGroups.includes(id));
      });
    }

    // Фильтр по навыкам
    if (filters.skillIds && filters.skillIds.length > 0) {
      const dbIds = filters.skillIds.map(id => convertFilterIdToDbFormat(id, 'skills'));
      result = result.filter(card => {
        const cardSkills = parseJsonField(card.skills);
        return dbIds.some(id => cardSkills.includes(id));
      });
    }

    // Фильтр по этапам урока
    if (filters.stageIds && filters.stageIds.length > 0) {
      const dbIds = filters.stageIds.map(id => convertFilterIdToDbFormat(id, 'stages'));
      result = result.filter(card => {
        const cardStages = parseJsonField(card.stages);
        return dbIds.some(id => cardStages.includes(id));
      });
    }

    // Фильтр по типам работы
    if (filters.typeIds && filters.typeIds.length > 0) {
      const dbIds = filters.typeIds.map(id => convertFilterIdToDbFormat(id, 'types'));
      result = result.filter(card => {
        const cardTypes = parseJsonField(card.types);
        return dbIds.some(id => cardTypes.includes(id));
      });
    }

    // Фильтр по времени
    if (filters.timeRange) {
      const ranges = {
        'up-to-2': [0, 2],
        '3-5': [3, 5],
        '5-10': [5, 10],
        '15-20': [15, 20],
        '25-30': [25, 30],
        'full-lesson': [40, 50]
      };
      const range = ranges[filters.timeRange];
      if (range) {
        result = result.filter(card => 
          card.time_minutes >= range[0] && card.time_minutes <= range[1]
        );
      }
    }

    // Поиск по названию и описанию (все языки)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(card => 
        card.title.toLowerCase().includes(searchLower) ||
        card.description.toLowerCase().includes(searchLower) ||
        (card.content && card.content.toLowerCase().includes(searchLower)) ||
        (card.title_uz && card.title_uz.toLowerCase().includes(searchLower)) ||
        (card.title_en && card.title_en.toLowerCase().includes(searchLower)) ||
        (card.description_uz && card.description_uz.toLowerCase().includes(searchLower)) ||
        (card.description_en && card.description_en.toLowerCase().includes(searchLower))
      );
    }

    // Сортировка по дате создания (новые первые)
    result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Пагинация
    const total = result.length;
    if (filters.limit) {
      const offset = parseInt(filters.offset) || 0;
      const limit = parseInt(filters.limit);
      result = result.slice(offset, offset + limit);
    }

    // Преобразуем JSON строки в массивы
    return result.map(card => ({
      ...card,
      age_groups: parseJsonField(card.age_groups),
      skills: parseJsonField(card.skills),
      stages: parseJsonField(card.stages),
      types: parseJsonField(card.types),
      aims: parseJsonField(card.aims),
      title_uz: card.title_uz || null,
      title_en: card.title_en || null,
      description_uz: card.description_uz || null,
      description_en: card.description_en || null,
      content_uz: card.content_uz || null,
      content_en: card.content_en || null
    }));
  }

  // Получить карточку по ID
  async getCardById(id) {
    const card = cardsData.find(c => c.id === parseInt(id));
    if (!card) return null;
    
    return {
      ...card,
      age_groups: parseJsonField(card.age_groups),
      skills: parseJsonField(card.skills),
      stages: parseJsonField(card.stages),
      types: parseJsonField(card.types),
      aims: parseJsonField(card.aims),
      title_uz: card.title_uz || null,
      title_en: card.title_en || null,
      description_uz: card.description_uz || null,
      description_en: card.description_en || null,
      content_uz: card.content_uz || null,
      content_en: card.content_en || null
    };
  }

  // Получить количество карточек
  async getCardsCount(filters = {}) {
    const cards = await this.getAllCards({ ...filters, limit: undefined, offset: undefined });
    return cards.length;
  }

  // Заглушки для методов записи (не работают в serverless)
  async createCard() { throw new Error('Создание карточек недоступно в serverless режиме'); }
  async updateCard() { throw new Error('Обновление карточек недоступно в serverless режиме'); }
  async deleteCard() { throw new Error('Удаление карточек недоступно в serverless режиме'); }
  async incrementViews() { return { success: true }; }
}

module.exports = new CardServiceJSON();
