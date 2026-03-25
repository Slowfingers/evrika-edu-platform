<script>
  import { t } from '$lib/stores/lang.js';

  export let ageGroups = [];
  export let skills = [];
  export let stages = [];
  export let types = [];
  export let timeRanges = [];

  export let selectedAgeGroups = [];
  export let selectedSkills = [];
  export let selectedStages = [];
  export let selectedTypes = [];
  export let selectedTimeRange = '';
</script>

<!-- Возрастные группы -->
<div>
  <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{$t('filter_age')}</p>
  <div class="space-y-2.5">
    {#each ageGroups as group}
      <label class="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          value={group.id}
          checked={selectedAgeGroups.includes(group.id)}
          on:change={(e) => {
            selectedAgeGroups = e.target.checked
              ? [...selectedAgeGroups, group.id]
              : selectedAgeGroups.filter(id => id !== group.id);
          }}
          class="w-4 h-4 rounded border-gray-300 accent-gray-800"
        />
        <span class="text-sm text-gray-700">{group.name}</span>
      </label>
    {/each}
  </div>
</div>

<!-- Навыки -->
<div>
  <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{$t('filter_skills')}</p>
  <div class="space-y-2.5">
    {#each skills as skill}
      <label class="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          value={skill.id}
          checked={selectedSkills.includes(skill.id)}
          on:change={(e) => {
            selectedSkills = e.target.checked
              ? [...selectedSkills, skill.id]
              : selectedSkills.filter(id => id !== skill.id);
          }}
          class="w-4 h-4 rounded border-gray-300 accent-gray-800"
        />
        <span class="text-sm text-gray-700">{skill.name}</span>
      </label>
    {/each}
  </div>
</div>

<!-- Этапы урока -->
<div>
  <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{$t('filter_stage')}</p>
  <div class="space-y-2.5">
    {#each stages as stage}
      <label class="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          value={stage.id}
          checked={selectedStages.includes(stage.id)}
          on:change={(e) => {
            selectedStages = e.target.checked
              ? [...selectedStages, stage.id]
              : selectedStages.filter(id => id !== stage.id);
          }}
          class="w-4 h-4 rounded border-gray-300 accent-gray-800"
        />
        <span class="text-sm text-gray-700">{stage.name}</span>
      </label>
    {/each}
  </div>
</div>

<!-- Тип работы -->
<div>
  <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{$t('filter_type')}</p>
  <div class="space-y-2.5">
    {#each types as type}
      <label class="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          value={type.id}
          checked={selectedTypes.includes(type.id)}
          on:change={(e) => {
            selectedTypes = e.target.checked
              ? [...selectedTypes, type.id]
              : selectedTypes.filter(id => id !== type.id);
          }}
          class="w-4 h-4 rounded border-gray-300 accent-gray-800"
        />
        <span class="text-sm text-gray-700">{type.name}</span>
      </label>
    {/each}
  </div>
</div>

<!-- Время -->
<div>
  <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{$t('filter_time')}</p>
  <div class="space-y-2.5">
    {#each timeRanges as range}
      <label class="flex items-center gap-2.5 cursor-pointer">
        <input
          type="radio"
          name="timeRange"
          value={range.id}
          checked={selectedTimeRange === range.id}
          on:change={() => selectedTimeRange = range.id}
          class="w-4 h-4 border-gray-300 accent-gray-800"
        />
        <span class="text-sm text-gray-700">{range.name}</span>
      </label>
    {/each}
    {#if selectedTimeRange}
      <button
        on:click={() => selectedTimeRange = ''}
        class="text-xs text-gray-400 hover:text-gray-700 mt-1 block"
      >
        {$t('deselect')}
      </button>
    {/if}
  </div>
</div>
