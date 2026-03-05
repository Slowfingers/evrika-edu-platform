const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const API_BASE_URL = isDev ? 'http://localhost:10000/api' : '';

// Маппинги русских ID → английских для сопоставления с данными в БД
const RU_TO_EN = {
  ageGroups: { 'начальные-классы': 'primary', 'старшие-классы': 'secondary' },
  skills: { 'критическое-мышление': 'critical', 'командная-работа': 'teamwork', 'рефлексия': 'reflection', 'креативное-мышление': 'creative', 'систематизация': 'systematization', 'систематизация-материала': 'systematization', 'коммуникация': 'communication' },
  stages: { 'начало-урока': 'начало-урока', 'объяснение-нового-материала': 'объяснение-нового-материала', 'закрепление': 'закрепление', 'конец-урока': 'конец-урока' },
  types: { 'индивидуальная': 'individual', 'парная': 'pair', 'командная': 'team', 'фронтальная': 'frontal' }
};

// Проверяет, содержит ли массив данных карточки хотя бы одно значение из фильтра
// Учитывает и русские, и английские ID
function matchesFilter(cardValues, filterValues, mappingType) {
  if (!cardValues || !filterValues || filterValues.length === 0) return true;
  const mapping = RU_TO_EN[mappingType] || {};
  // Для каждого значения фильтра проверяем прямое совпадение и совпадение через маппинг
  return filterValues.some(filterVal => {
    const englishVal = mapping[filterVal];
    return cardValues.some(cv => cv === filterVal || cv === englishVal);
  });
}

export class BaseApi {
  constructor(customFetch = null) {
    this.baseUrl = API_BASE_URL;
    this.fetch = customFetch || (typeof window !== 'undefined' ? window.fetch.bind(window) : fetch);
    this.useStaticData = !isDev;
    this._staticCardsCache = null;
  }

  async request(endpoint, options = {}) {
    // На продакшене используем статический JSON для карточек
    if (this.useStaticData && endpoint.includes('/cards')) {
      return this.fetchStaticCards(endpoint);
    }

    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const config = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    try {
      const response = await this.fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async loadStaticCards() {
    if (this._staticCardsCache) return this._staticCardsCache;
    const response = await this.fetch('/data/cards.json');
    if (!response.ok) {
      throw new Error(`Failed to load static data: ${response.status}`);
    }
    this._staticCardsCache = await response.json();
    return this._staticCardsCache;
  }

  async fetchStaticCards(endpoint) {
    try {
      const cards = await this.loadStaticCards();
      
      // Запрос на одну карточку: /cards/20
      const cardIdMatch = endpoint.match(/\/cards\/(\d+)$/);
      if (cardIdMatch) {
        const cardId = parseInt(cardIdMatch[1], 10);
        const card = cards.find(c => c.id === cardId);
        return { success: true, data: card || null };
      }
      
      // Парсим query параметры
      const url = new URL(`http://dummy${endpoint}`);
      const limit = parseInt(url.searchParams.get('limit')) || cards.length;
      const offset = parseInt(url.searchParams.get('offset')) || 0;
      const search = url.searchParams.get('search') || '';
      const timeRange = url.searchParams.get('timeRange') || '';
      
      // getAll() для множественных параметров (ageGroupIds=a&ageGroupIds=b)
      const ageGroupIds = url.searchParams.getAll('ageGroupIds');
      const skillIds = url.searchParams.getAll('skillIds');
      const stageIds = url.searchParams.getAll('stageIds');
      const typeIds = url.searchParams.getAll('typeIds');
      
      let filteredCards = cards;
      
      // Поиск по тексту
      if (search) {
        const searchLower = search.toLowerCase();
        filteredCards = filteredCards.filter(card => 
          card.title?.toLowerCase().includes(searchLower) ||
          card.description?.toLowerCase().includes(searchLower) ||
          card.content?.toLowerCase().includes(searchLower)
        );
      }
      
      // Фильтры с учётом русских и английских ID
      if (ageGroupIds.length > 0) {
        filteredCards = filteredCards.filter(card => matchesFilter(card.age_groups, ageGroupIds, 'ageGroups'));
      }
      if (skillIds.length > 0) {
        filteredCards = filteredCards.filter(card => matchesFilter(card.skills, skillIds, 'skills'));
      }
      if (stageIds.length > 0) {
        filteredCards = filteredCards.filter(card => matchesFilter(card.stages, stageIds, 'stages'));
      }
      if (typeIds.length > 0) {
        filteredCards = filteredCards.filter(card => matchesFilter(card.types, typeIds, 'types'));
      }
      
      // Фильтр по времени — значения из фронтенда
      if (timeRange) {
        filteredCards = filteredCards.filter(card => {
          const t = card.time_minutes || 0;
          switch (timeRange) {
            case 'up-to-2': return t <= 2;
            case '3-5': return t >= 3 && t <= 5;
            case '5-10': return t >= 5 && t <= 10;
            case '15-20': return t >= 15 && t <= 20;
            case '25-30': return t >= 25 && t <= 30;
            case 'full-lesson': return t > 30;
            default: return true;
          }
        });
      }
      
      const total = filteredCards.length;
      const paginatedCards = filteredCards.slice(offset, offset + limit);
      
      return {
        success: true,
        data: paginatedCards,
        total: total,
        count: paginatedCards.length
      };
    } catch (error) {
      console.error('Static data error:', error);
      throw error;
    }
  }

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}
