import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { recalculateLesson, removeLessonCard } from '../src/lib/utils/lesson-state.js';
import { advanceTimer, editTimerStage, removeTimerStage } from '../src/lib/utils/timer-state.js';
import { BaseApi } from '../src/lib/api/base.api.js';
const require = createRequire(import.meta.url);
const service = require('../../backend/src/services/card.service.json.js');
const cards = JSON.parse(readFileSync(new URL('../static/data/cards.json', import.meta.url)));
const api = new BaseApi(async () => ({ ok: true, json: async () => cards }));
test('removing a repeated technique preserves its other stage and total', () => {
 const card = { id: 3, timeMinutes: 5 };
 const lesson = recalculateLesson({lessonStages:{start:{cards:[card]},end:{cards:[card]}}});
 const result = removeLessonCard(lesson, 3, 'start');
 assert.equal(result.totalTime, 5); assert.equal(result.selectedCards.length, 1);
 assert.equal(result.lessonStages.end.cards.length, 1); assert.equal(lesson.totalTime, 10);
});
const stages = [{id:1,duration:1},{id:2,duration:2},{id:3,duration:1}];
test('timer advances exactly at zero and catches up after a suspended tab', () => {
 assert.deepEqual(advanceTimer(stages,0,60,60),{index:1,remaining:120,finished:false});
 assert.deepEqual(advanceTimer(stages,0,60,200),{index:2,remaining:40,finished:false});
 assert.deepEqual(advanceTimer(stages,0,60,240),{index:2,remaining:0,finished:true});
});
test('editing duration preserves elapsed time and bounds duration', () => {
 assert.equal(editTimerStage(stages,0,40,0,{duration:2}).remaining,100);
 assert.equal(editTimerStage(stages,0,40,0,{duration:1000}).stages[0].duration,120);
});
test('deleting earlier stage preserves active stage identity and time', () => {
 const result = removeTimerStage(stages,1,80,0);
 assert.equal(result.index,0); assert.equal(result.stages[result.index].id,2);assert.equal(result.remaining,80);
 assert.equal(removeTimerStage(stages,1,80,1).remaining,60);
});
test('static and API catalog agree on all filters and pagination', async () => {
 for(const filter of [{}, {ageGroupIds:['начальные-классы']},{skillIds:['критическое-мышление']},{stageIds:['закрепление']},{typeIds:['парная']},...['up-to-2','3-5','5-10','15-20','25-30','full-lesson'].map(timeRange=>({timeRange})),{search:'цепочка'}]) {
  const params = new URLSearchParams();
  for(const [key,value] of Object.entries(filter)) for(const item of Array.isArray(value)?value:[value])params.append(key,item);
  params.set('limit','12');params.set('offset','12');
  const result = await api.fetchStaticCards('/cards?'+params);
  assert.deepEqual(result.data.map(c=>c.id),(await service.getAllCards({...filter,limit:12,offset:12})).map(c=>c.id),JSON.stringify(filter));
  assert.equal(result.total,await service.getCardsCount(filter));
 }
});
test('static catalog rejects writes instead of pretending success', async()=> {
 await assert.rejects(api.post('/cards',{}),/только для чтения/);
});
test('authentication rejects missing/wrong tokens and accepts configured token',()=>{
 const auth=require('../../backend/src/services/auth.service.js');
 const original=process.env.ADMIN_API_TOKEN;
 let code; let passed=false; const res={status(n){code=n;return this},json(){}};
 try {
 delete process.env.ADMIN_API_TOKEN;auth.authenticateToken({headers:{}},res,()=>{passed=true}); assert.equal(code,503);
 process.env.ADMIN_API_TOKEN='test-only-secret';auth.authenticateToken({headers:{authorization:'Bearer wrong'}},res,()=>{passed=true});assert.equal(code,401);assert.equal(passed,false);
 const req={headers:{authorization:'Bearer test-only-secret'}};auth.authenticateToken(req,res,()=>{passed=true});assert.equal(passed,true);assert.equal(req.user.role,'admin');
 }finally{if(original===undefined)delete process.env.ADMIN_API_TOKEN;else process.env.ADMIN_API_TOKEN=original;}
});

test('all catalog cards have complete Uzbek translations and remain searchable', async()=>{
 assert.equal(cards.length,98);
 for(const card of cards) for(const field of ['title_uz','description_uz','content_uz']) assert.ok(card[field]?.trim(), `${card.id}: ${field}`);
 assert.deepEqual(cards,JSON.parse(readFileSync(new URL('../../backend/src/data/cards.json',import.meta.url))));
 const query=cards[0].title_uz;
 assert.ok((await api.fetchStaticCards('/cards?search='+encodeURIComponent(query))).data.some(c=>c.id===cards[0].id));
 assert.ok((await service.getAllCards({search:query})).some(c=>c.id===cards[0].id));
});

test('Uzbek search accepts common apostrophe variants',async()=>{
 const result=await api.fetchStaticCards('/cards?search='+encodeURIComponent("G'oyalar"));
 assert.ok(result.data.some(card=>card.id===11));
 assert.ok((await service.getAllCards({search:"G'oyalar"})).some(card=>card.id===11));
});
