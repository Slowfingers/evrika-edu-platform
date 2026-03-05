const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const API_BASE_URL = isDev ? 'http://localhost:10000/api' : '';

export class BaseApi {
  constructor(customFetch = null) {
    this.baseUrl = API_BASE_URL;
    this.fetch = customFetch || (typeof window !== 'undefined' ? window.fetch.bind(window) : fetch);
    this.useStaticData = !isDev;
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

  async fetchStaticCards(endpoint) {
    try {
      const response = await this.fetch('/data/cards.json');
      if (!response.ok) {
        throw new Error(`Failed to load static data: ${response.status}`);
      }
      
      let cards = await response.json();
      
      // Проверяем, это запрос на получение одной карточки по ID
      const cardIdMatch = endpoint.match(/\/cards\/([^?]+)/);
      if (cardIdMatch && !endpoint.includes('?')) {
        const cardId = cardIdMatch[1];
        const card = cards.find(c => c.id === cardId);
        return {
          success: true,
          data: card || null
        };
      }
      
      // Парсим query параметры из endpoint
      const url = new URL(`http://dummy${endpoint}`);
      const limit = parseInt(url.searchParams.get('limit')) || cards.length;
      const page = parseInt(url.searchParams.get('page')) || 1;
      const search = url.searchParams.get('search') || '';
      const ageGroups = url.searchParams.get('ageGroups') || '';
      const skills = url.searchParams.get('skills') || '';
      const stages = url.searchParams.get('stages') || '';
      const types = url.searchParams.get('types') || '';
      const timeRange = url.searchParams.get('timeRange') || '';
      
      // Применяем фильтры
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
      
      // Фильтр по возрастным группам
      if (ageGroups) {
        const ageGroupsArray = ageGroups.split(',');
        filteredCards = filteredCards.filter(card => 
          card.age_groups?.some(ag => ageGroupsArray.includes(ag))
        );
      }
      
      // Фильтр по навыкам
      if (skills) {
        const skillsArray = skills.split(',');
        filteredCards = filteredCards.filter(card => 
          card.skills?.some(s => skillsArray.includes(s))
        );
      }
      
      // Фильтр по этапам урока
      if (stages) {
        const stagesArray = stages.split(',');
        filteredCards = filteredCards.filter(card => 
          card.stages?.some(st => stagesArray.includes(st))
        );
      }
      
      // Фильтр по типам работы
      if (types) {
        const typesArray = types.split(',');
        filteredCards = filteredCards.filter(card => 
          card.types?.some(t => typesArray.includes(t))
        );
      }
      
      // Фильтр по времени
      if (timeRange) {
        filteredCards = filteredCards.filter(card => {
          const time = card.time_minutes || 0;
          switch (timeRange) {
            case '0-5': return time <= 5;
            case '5-10': return time > 5 && time <= 10;
            case '10-15': return time > 10 && time <= 15;
            case '15-20': return time > 15 && time <= 20;
            case '20-30': return time > 20 && time <= 30;
            case '30+': return time > 30;
            default: return true;
          }
        });
      }
      
      const total = filteredCards.length;
      const offset = (page - 1) * limit;
      
      // Применяем пагинацию
      const paginatedCards = filteredCards.slice(offset, offset + limit);
      
      return {
        success: true,
        data: paginatedCards,
        total: total,
        page: page,
        limit: limit
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
