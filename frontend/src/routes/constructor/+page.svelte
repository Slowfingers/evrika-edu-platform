<script>
  import { onMount } from 'svelte';
  import { cardsApi } from '$lib/api/cards.api.js';
  import LessonWizard from '$lib/components/LessonWizard.svelte';

  // Состояние каталога
  let catalogCards = [];
  let isLoading = true;

  // Функция для преобразования данных карточки из API формата в frontend формат
  function transformCardData(apiCard) {
    return {
      ...apiCard,
      // Преобразуем snake_case в camelCase для совместимости с frontend компонентами
      timeMinutes: apiCard.time_minutes,
      ageGroups: apiCard.age_groups || [],
      skillIds: apiCard.skills || [],
      stageIds: apiCard.stages || [],
      typeIds: apiCard.types || [],
      aimIds: apiCard.aims || [],
      fileUrl: apiCard.file_url,
      createdAt: apiCard.created_at,
      updatedAt: apiCard.updated_at
    };
  }

  // Загрузка карточек из каталога
  onMount(async () => {
    try {
      const response = await cardsApi.getAllCards();
      
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
  <title>Конструктор урока - EvrikaEdu</title>
  <meta name="description" content="Создайте план урока с помощью конструктора EvrikaEdu" />
</svelte:head>

<LessonWizard 
  {catalogCards} 
  {isLoading}
/>
