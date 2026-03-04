require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const csv = require('csv-parser');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function importCSV() {
  try {
    await client.connect();
    console.log('✅ Подключено к PostgreSQL');

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
    await client.end();
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
            await client.query(
              `INSERT INTO age_groups (id, name, description) 
               VALUES ($1, $2, $3) 
               ON CONFLICT (id) DO UPDATE 
               SET name = $2, description = $3`,
              [row.id, row.name, row.description]
            );
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
            await client.query(
              `INSERT INTO skills (id, name, description) 
               VALUES ($1, $2, $3) 
               ON CONFLICT (id) DO UPDATE 
               SET name = $2, description = $3`,
              [row.id, row.name, row.description]
            );
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
            
            await client.query(
              `INSERT INTO cards (
                id, title, description, content, time_minutes, 
                file_url, views, age_groups, skills, stages, types,
                created_at, updated_at
              ) 
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
              ON CONFLICT (id) DO UPDATE 
              SET title = $2, description = $3, content = $4, 
                  time_minutes = $5, file_url = $6, views = $7,
                  age_groups = $8, skills = $9, stages = $10, types = $11,
                  updated_at = $13`,
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
              ]
            );
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
