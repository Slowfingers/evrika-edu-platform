<script>
  import { onMount } from 'svelte';
  import { cardsApi } from '$lib/api/cards.api.js';
  import LessonWizard from '$lib/components/LessonWizard.svelte';
  import { t } from '$lib/stores/lang.js';

  // Состояние каталога
  let catalogCards = [];
  let isLoading = true;

  // Маппинги английских ID → русских для нормализации данных из БД
  const EN_TO_RU = {
    ageGroups: { 'primary': 'начальные-классы', 'secondary': 'старшие-классы' },
    skills: { 'critical': 'критическое-мышление', 'teamwork': 'командная-работа', 'reflection': 'рефлексия', 'creative': 'креативное-мышление', 'systematization': 'систематизация', 'communication': 'коммуникация' },
    types: { 'individual': 'индивидуальная', 'pair': 'парная', 'team': 'командная', 'frontal': 'фронтальная' }
  };

  function normalizeIds(ids, mapping) {
    if (!ids || !Array.isArray(ids)) return [];
    return ids.map(id => mapping[id] || id);
  }

  // Функция для преобразования данных карточки из API формата в frontend формат
  function transformCardData(apiCard) {
    return {
      ...apiCard,
      // Преобразуем snake_case в camelCase для совместимости с frontend компонентами
      timeMinutes: apiCard.time_minutes,
      // Нормализуем ID: английские → русские для единообразия с фильтрами
      ageGroups: normalizeIds(apiCard.age_groups, EN_TO_RU.ageGroups),
      skillIds: normalizeIds(apiCard.skills, EN_TO_RU.skills),
      stageIds: apiCard.stages || [],
      typeIds: normalizeIds(apiCard.types, EN_TO_RU.types),
      aimIds: apiCard.aims || [],
      fileUrl: apiCard.file_url,
      createdAt: apiCard.created_at,
      updatedAt: apiCard.updated_at
    };
  }

  // Загрузка карточек из каталога (все, без лимита)
  onMount(async () => {
    try {
      const response = await cardsApi.getAllCards({ limit: 1000 });
      
      if (response && response.success && Array.isArray(response.data)) {
        // Преобразуем данные карточек для совместимости с frontend компонентами
        catalogCards = response.data.map(transformCardData);
        console.log('✅ Конструктор: Загружено', catalogCards.length, 'карточек');
        console.log('🔍 Пример карточки:', catalogCards[0]);
      } else {
        console.error('❌ Конструктор: Неправильный формат ответа API');
        catalogCards = [];
      }
    } catch (error) {
      console.error('❌ Конструктор: Ошибка загрузки карточек:', error);
      catalogCards = [];
    } finally {
      isLoading = false;
    }
  });
</script>

<svelte:head>
  <title>{$t('title_constructor')}</title>
</svelte:head>

<LessonWizard 
  {catalogCards} 
  {isLoading}
/>
