<script>
  import { formatTimeDisplay } from '$lib/utils/time-intervals.js';
  import { getAgeGroupNames, getSkillNames, getStageNames, getTypeNames, getSkillName } from '$lib/utils/localization.js';
  
  export let card;
  
  // Генерация случайного пастельного градиента для каждой карточки
  const gradients = [
    'linear-gradient(135deg, rgba(224, 195, 252, 0.4) 0%, rgba(142, 197, 252, 0.4) 100%)',
    'linear-gradient(135deg, rgba(142, 197, 252, 0.4) 0%, rgba(168, 237, 234, 0.4) 100%)',
    'linear-gradient(135deg, rgba(168, 237, 234, 0.4) 0%, rgba(254, 214, 227, 0.4) 100%)',
    'linear-gradient(135deg, rgba(254, 214, 227, 0.4) 0%, rgba(255, 209, 163, 0.4) 100%)',
    'linear-gradient(135deg, rgba(255, 209, 163, 0.4) 0%, rgba(224, 195, 252, 0.4) 100%)',
  ];
  
  const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];
</script>

<a href="/{card.id}" class="group card-modern flex flex-col h-full relative overflow-hidden no-select" style="background: {randomGradient};">
  <!-- Иконки в верхней части -->
  <div class="flex items-center justify-between mb-4">
    <div class="icon-box">
      <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
      </svg>
    </div>
    <span class="badge-count">
      {formatTimeDisplay(card.time_minutes)}
    </span>
  </div>

  <!-- Заголовок -->
  <h3 class="text-lg font-bold text-gray-900 mb-2 card-title">
    {card.title}
  </h3>

  <!-- Описание -->
  <p class="text-gray-600 text-sm card-description leading-relaxed flex-grow">
    {card.description}
  </p>

  <!-- Стрелка вперёд -->
  <div class="mt-4 flex justify-end">
    <span class="text-gray-400 group-hover:text-gray-700 group-hover:translate-x-1 transition-all duration-200">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
      </svg>
    </span>
  </div>
</a>

<style>
  .card-title {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card-description {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
