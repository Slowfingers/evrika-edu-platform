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
      
      // Парсим query параметры из endpoint
      const url = new URL(`http://dummy${endpoint}`);
      const limit = parseInt(url.searchParams.get('limit')) || cards.length;
      const page = parseInt(url.searchParams.get('page')) || 1;
      const offset = (page - 1) * limit;
      
      // Применяем пагинацию
      const paginatedCards = cards.slice(offset, offset + limit);
      
      return {
        success: true,
        data: paginatedCards,
        total: cards.length,
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
