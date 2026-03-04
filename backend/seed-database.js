const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'evrika.db');
const db = new sqlite3.Database(dbPath);

const seedData = async () => {
  console.log('🌱 Начинаем заполнение базы данных...');

  // Возрастные группы
  const ageGroups = [
    { id: 'primary', name: 'Начальные классы (1-4)', description: 'Учащиеся 1-4 классов' },
    { id: 'secondary', name: 'Старшие классы (5-11)', description: 'Учащиеся 5-11 классов' }
  ];

  // Навыки
  const skills = [
    { id: 'communication', name: 'Коммуникативные', description: 'Развитие коммуникативных навыков' },
    { id: 'creative', name: 'Креативное мышление', description: 'Развитие творческих способностей' },
    { id: 'critical', name: 'Критическое мышление', description: 'Развитие критического мышления' },
    { id: 'reflection', name: 'Рефлексия', description: 'Навыки самоанализа и рефлексии' },
    { id: 'systematization', name: 'Систематизация', description: 'Систематизация материала' },
    { id: 'teamwork', name: 'Командная работа', description: 'Навыки работы в команде' }
  ];

  // Карточки приемов
  const cards = [
    {
      id: 3,
      title: 'Логическая цепочка',
      description: 'Ученики создают цепочку фактов в определённом логическом или хронологическом порядке.',
      content: `Ученики создают цепочку фактов в определённом логическом или хронологическом порядке. Цепочку можно строить из предложений, дат, правил, шагов, действий, цитат, изображений, формул, утверждений, определений, принципов и др.

На уроке ученики делают логическую цепочку по теме: ___________________________________________________

Им нужно расположить по порядку: ___________________________________________________

Ожидаемый результат:
- запоминание и осмысление большого объёма информации;
- выявление закономерностей определённых событий, явлений, характеристик или процессов;
- развитие критического и логического мышления, памяти.`,
      time_minutes: 5,
      age_groups: JSON.stringify(['secondary']),
      skills: JSON.stringify(['critical', 'systematization']),
      stages: JSON.stringify(['начало-урока', 'закрепление']),
      types: JSON.stringify(['individual', 'team', 'pair', 'frontal'])
    },
    {
      id: 4,
      title: 'Билетик на выход 🎫',
      description: 'Прием, позволяющий оценить степень усвоения материала учащимися.',
      content: `Каждому ученику выдается небольшой листок бумаги или карточка — «билетик». Карточка содержит в себе задание, позволяющее обобщить пройденный материал.

Ученики выполняют задание и сдают "билетик" перед выходом из класса.`,
      time_minutes: 5,
      age_groups: JSON.stringify(['primary', 'secondary']),
      skills: JSON.stringify(['reflection', 'systematization']),
      stages: JSON.stringify(['конец-урока']),
      types: JSON.stringify(['individual'])
    },
    {
      id: 5,
      title: '321',
      description: 'Прием, позволяющий обобщить пройденный материал',
      content: `В конце урока или блока темы учащиеся отвечают письменно на три группы вопросов:

3 — три факта, идеи или термина, которые они узнали сегодня.
2 — два момента, которые показались наиболее интересными или важными.
1 — один вопрос, который остался, или одно затруднение.`,
      time_minutes: 5,
      age_groups: JSON.stringify(['primary', 'secondary']),
      skills: JSON.stringify(['reflection', 'systematization']),
      stages: JSON.stringify(['конец-урока']),
      types: JSON.stringify(['individual'])
    },
    {
      id: 6,
      title: '✈️Взлет-посадка🛬',
      description: 'Активная форма проверки усвоения материала учащимися',
      content: `Как проводится:
Учитель зачитывает утверждение по теме урока.
Если ученики считают утверждение верным — они встают.
Если утверждение ложное — ученики садятся или остаются сидеть.`,
      time_minutes: 2,
      age_groups: JSON.stringify(['secondary', 'primary']),
      skills: JSON.stringify(['systematization']),
      stages: JSON.stringify(['начало-урока', 'закрепление', 'конец-урока']),
      types: JSON.stringify(['frontal'])
    },
    {
      id: 7,
      title: 'Timed round robin',
      description: 'Прием "проговори по кругу"',
      content: `Условие проведения приема: рассадка - по 4 человека за 1 столом.

Этапы проведения приема:
1. Учитель задает вопрос/предлагает тему, о которой ученики должны рассказать.
2. Ставится таймер на ____ секунд, чтобы каждый учащийся мог подготовить свой ответ.
3. Далее ученики по очереди за фиксированное время (по _____ секунд) проговаривают подготовленный ответ по кругу.
! Важно активно слушать друг друга.
4. После того, как круг завершен, учитель спрашивает несколько учеников о том, что говорили учащиеся за их столами.`,
      time_minutes: 5,
      age_groups: JSON.stringify(['primary', 'secondary']),
      skills: JSON.stringify(['critical', 'reflection', 'systematization', 'teamwork', 'communication']),
      stages: JSON.stringify(['начало-урока', 'закрепление', 'конец-урока']),
      types: JSON.stringify(['team', 'individual'])
    },
    {
      id: 8,
      title: 'Think-pair-share',
      description: 'Прием "подумай-обсуди в паре-поделись"',
      content: `Этапы проведения приема:
1) Учитель задает вопрос/предлагает задание для решения.
2) Ставится таймер на ______ секунд, чтобы учащиеся могли подумать над решением.
3) Далее ставится таймер на _____ секунд, во время которого учащиеся выполняют задание письменно.
4) Учащиеся по кругу проговаривают решенное ими задание. Учитель проходит по рядам, прислушиваясь к ответам учеников.

Важно! Учащиеся активно слушают друг друга.`,
      time_minutes: 7,
      age_groups: JSON.stringify(['primary', 'secondary']),
      skills: JSON.stringify(['reflection', 'systematization', 'communication', 'critical']),
      stages: JSON.stringify(['начало-урока', 'закрепление', 'конец-урока']),
      types: JSON.stringify(['team', 'individual'])
    }
  ];

  try {
    // Вставляем возрастные группы
    for (const group of ageGroups) {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT OR REPLACE INTO age_groups (id, name, description) VALUES (?, ?, ?)',
          [group.id, group.name, group.description],
          (err) => err ? reject(err) : resolve()
        );
      });
    }
    console.log(`✅ Добавлено ${ageGroups.length} возрастных групп`);

    // Вставляем навыки
    for (const skill of skills) {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT OR REPLACE INTO skills (id, name, description) VALUES (?, ?, ?)',
          [skill.id, skill.name, skill.description],
          (err) => err ? reject(err) : resolve()
        );
      });
    }
    console.log(`✅ Добавлено ${skills.length} навыков`);

    // Вставляем карточки
    for (const card of cards) {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT OR REPLACE INTO cards 
           (id, title, description, content, time_minutes, age_groups, skills, stages, types, views) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            card.id,
            card.title,
            card.description,
            card.content,
            card.time_minutes,
            card.age_groups,
            card.skills,
            card.stages,
            card.types,
            0
          ],
          (err) => err ? reject(err) : resolve()
        );
      });
    }
    console.log(`✅ Добавлено ${cards.length} карточек приемов`);

    console.log('\n🎉 База данных успешно заполнена!');
  } catch (error) {
    console.error('❌ Ошибка при заполнении базы:', error);
  } finally {
    db.close();
  }
};

seedData();
