<script>
  import { onMount } from 'svelte';

  let students = [];
  let newStudent = '';
  let picked = null;
  let picking = false;
  let pickTimeout = null;

  onMount(() => {
    const saved = localStorage.getItem('evrika-students');
    if (saved) students = JSON.parse(saved);
  });

  function save() {
    localStorage.setItem('evrika-students', JSON.stringify(students));
  }

  function addStudent() {
    const name = newStudent.trim();
    if (!name) return;
    students = [...students, { id: Date.now(), name, present: true }];
    newStudent = '';
    save();
  }

  function removeStudent(id) {
    students = students.filter(s => s.id !== id);
    save();
  }

  function togglePresent(id) {
    students = students.map(s => s.id === id ? { ...s, present: !s.present } : s);
    save();
  }

  function pickRandom() {
    const present = students.filter(s => s.present);
    if (present.length === 0) return;
    picking = true;
    picked = null;
    let count = 0;
    const total = 15;
    function step() {
      const idx = Math.floor(Math.random() * present.length);
      picked = present[idx].name;
      count++;
      if (count < total) {
        pickTimeout = setTimeout(step, 50 + count * 8);
      } else {
        picking = false;
      }
    }
    step();
  }

  function clearAll() {
    if (confirm('Очистить список?')) {
      students = [];
      picked = null;
      save();
    }
  }

  $: presentCount = students.filter(s => s.present).length;
</script>

<svelte:head>
  <title>Классы — EvrikaEdu</title>
</svelte:head>

<div class="max-w-lg mx-auto pb-24 md:pb-8">

  <div class="text-center mb-6">
    <h1 class="text-2xl font-bold text-gray-900">Управление классом</h1>
    <p class="text-sm text-gray-500 mt-1">Список учеников и случайный выбор</p>
  </div>

  <!-- Случайный выбор -->
  <div class="card mb-4 text-center py-6">
    {#if picked}
      <p class="text-xs text-gray-400 uppercase tracking-wide mb-2">Выбран ученик</p>
      <p class="text-3xl font-bold text-gray-900 mb-5 transition-all duration-150">{picked}</p>
    {:else}
      <p class="text-gray-400 text-sm mb-5">Нажмите кнопку, чтобы выбрать ученика</p>
    {/if}
    <button
      on:click={pickRandom}
      disabled={picking || presentCount === 0}
      class="btn btn-primary disabled:opacity-40"
    >
      {#if picking}
        Выбираю...
      {:else}
        🎲 Случайный ученик
      {/if}
    </button>
    {#if students.length > 0}
      <p class="text-xs text-gray-400 mt-3">Присутствует: {presentCount} из {students.length}</p>
    {/if}
  </div>

  <!-- Добавить ученика -->
  <div class="card !p-4 mb-4">
    <div class="flex gap-2">
      <input
        type="text"
        bind:value={newStudent}
        placeholder="Имя ученика..."
        class="input"
        on:keydown={(e) => e.key === 'Enter' && addStudent()}
      />
      <button on:click={addStudent} class="btn btn-primary flex-shrink-0 px-5">+</button>
    </div>
  </div>

  <!-- Список учеников -->
  {#if students.length > 0}
    <div class="card !p-0 overflow-hidden">
      <div class="flex items-center justify-between px-5 py-3 border-b border-white/20">
        <p class="text-sm font-semibold text-gray-700">{students.length} учеников</p>
        <button on:click={clearAll} class="text-xs text-gray-400 hover:text-red-500 transition-colors">Очистить</button>
      </div>
      <div class="divide-y divide-white/10">
        {#each students as student (student.id)}
          <div class="flex items-center gap-3 px-5 py-3 hover:bg-white/20 transition-colors">
            <button
              on:click={() => togglePresent(student.id)}
              class="w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all
                {student.present ? 'bg-gray-900 border-gray-900' : 'border-gray-300'}"
            >
              {#if student.present}
                <svg class="w-3 h-3 text-white m-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              {/if}
            </button>
            <span class="flex-1 text-sm {student.present ? 'text-gray-900' : 'text-gray-400 line-through'}">{student.name}</span>
            <button on:click={() => removeStudent(student.id)} class="text-gray-300 hover:text-red-400 transition-colors p-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <div class="card text-center py-10">
      <svg class="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
      <p class="text-gray-400 text-sm">Добавьте учеников в список</p>
    </div>
  {/if}

</div>
