const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const dbPath = path.join(__dirname, 'evrika.db');
const db = new sqlite3.Database(dbPath);

async function importCSV() {
  try {
    console.log('✅ Подключено к SQLite');

    // Импорт age_groups
    console.log('\n📊 Импорт возрастных групп...');
    const ageGroupsPath = path.join(process.env.HOME, 'Downloads', 'age_groups.csv');
    await importAgeGroups(ageGroupsPath);

    // Импорт skills
    console.log('\n📊 Импорт навыков...');
    const skillsPath = path.join(process.env.HOME, 'Downloads', 'skills.csv');
    await importSkills(skillsPath);

    // Импорт cards
    console.log('\n📊 Импорт карточек приемов...');
    const cardsPath = path.join(process.env.HOME, 'Downloads', 'cards.csv');
    await importCards(cardsPath);

    console.log('\n✅ Импорт завершен успешно!');
  } catch (error) {
    console.error('❌ Ошибка импорта:', error);
  } finally {
    db.close();
  }
}

function importAgeGroups(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          for (const row of results) {
            await new Promise((resolve, reject) => {
              db.run(
                `INSERT OR REPLACE INTO age_groups (id, name, description) 
                 VALUES (?, ?, ?)`,
                [row.id, row.name, row.description],
                (err) => err ? reject(err) : resolve()
              );
            });
          }
          console.log(`✅ Импортировано ${results.length} возрастных групп`);
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

function importSkills(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          for (const row of results) {
            await new Promise((resolve, reject) => {
              db.run(
                `INSERT OR REPLACE INTO skills (id, name, description) 
                 VALUES (?, ?, ?)`,
                [row.id, row.name, row.description],
                (err) => err ? reject(err) : resolve()
              );
            });
          }
          console.log(`✅ Импортировано ${results.length} навыков`);
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

function importCards(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          for (const row of results) {
            // Парсим JSON массивы из CSV
            const ageGroups = row.age_groups || '[]';
            const skills = row.skills || '[]';
            const stages = row.stages || '[]';
            const types = row.types || '[]';
            
            await new Promise((resolve, reject) => {
              db.run(
                `INSERT OR REPLACE INTO cards (
                  id, title, description, content, time_minutes, 
                  file_url, views, age_groups, skills, stages, types,
                  created_at, updated_at
                ) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  row.id,
                  row.title,
                  row.description,
                  row.content,
                  parseInt(row.time_minutes) || 5,
                  row.file_url || null,
                  parseInt(row.views) || 0,
                  ageGroups,
                  skills,
                  stages,
                  types,
                  row.created_at || new Date().toISOString(),
                  row.updated_at || new Date().toISOString()
                ],
                (err) => err ? reject(err) : resolve()
              );
            });
          }
          console.log(`✅ Импортировано ${results.length} карточек приемов`);
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

importCSV();
