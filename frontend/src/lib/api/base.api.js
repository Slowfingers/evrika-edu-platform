export const normalizeSearch = value => String(value || '').normalize('NFC').trim().toLowerCase().replace(/[ʻʼ’‘`´]/g, "'");
const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || '').replace(/\/$/, '');

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
  if (!filterValues || filterValues.length === 0) return true;
  if (!Array.isArray(cardValues)) return false;
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
    this.useStaticData = !this.baseUrl;
    this._staticCardsCache = null;
  }

  async request(endpoint, options = {}) {
    // На продакшене используем статический JSON для карточек
    if (this.useStaticData && endpoint.includes('/cards')) {
      if (options.method && options.method !== 'GET') throw new Error('Каталог доступен только для чтения');
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
    if (!this._staticCardsRequest) {
      this._staticCardsRequest = (async () => {
        const response = await this.fetch('/data/cards.json');
        if (!response.ok) throw new Error(`Failed to load static data: ${response.status}`);
        const cards = await response.json();
        if (!Array.isArray(cards)) throw new Error('Invalid catalog data');
        this._staticCardsCache = cards;
        return cards;
      })().finally(() => { this._staticCardsRequest = null; });
    }
    return this._staticCardsRequest;
  }

  async fetchStaticCards(endpoint) {
    try {
      const cards = await this.loadStaticCards();
      
      // Запрос на одну карточку: /cards/20
      const cardPath = new URL(endpoint, 'http://local').pathname;
      const cardIdMatch = cardPath.match(/^\/cards\/(\d+)$/);
      if (cardPath !== '/cards' && !cardIdMatch) return { success: true, data: null };
      if (cardIdMatch) {
        const cardId = parseInt(cardIdMatch[1], 10);
        const card = cards.find(c => c.id === cardId);
        return { success: true, data: card || null };
      }
      
      // Парсим query параметры
      const url = new URL(`http://dummy${endpoint}`);
      const rawLimit=Number(url.searchParams.get('limit')),rawOffset=Number(url.searchParams.get('offset'));
      const limit=Number.isSafeInteger(rawLimit)&&rawLimit>0?Math.min(1000,rawLimit):cards.length;
      const offset=Number.isSafeInteger(rawOffset)&&rawOffset>=0?rawOffset:0;
      const search = url.searchParams.get('search') || '';
      const timeRange = url.searchParams.get('timeRange') || '';
      
      // getAll() для множественных параметров (ageGroupIds=a&ageGroupIds=b)
      const ageGroupIds = url.searchParams.getAll('ageGroupIds');
      const skillIds = url.searchParams.getAll('skillIds');
      const stageIds = url.searchParams.getAll('stageIds');
      const typeIds = url.searchParams.getAll('typeIds');
      
      let filteredCards = [...cards].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      // Поиск по тексту
      if (search) {
        const searchLower = normalizeSearch(search);
        filteredCards = filteredCards.filter(card => 
          normalizeSearch(card.title).includes(searchLower) ||
          normalizeSearch(card.description).includes(searchLower) ||
          normalizeSearch(card.content).includes(searchLower) ||
          ['title_uz', 'title_en', 'description_uz', 'description_en', 'content_uz', 'content_en'].some(key => normalizeSearch(card[key]).includes(searchLower))
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
            case 'full-lesson': return t >= 40 && t <= 50;
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
