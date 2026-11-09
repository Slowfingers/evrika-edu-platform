import { scenarioBlocks } from './worksheet-scenarios.js';
import { worksheetLabel } from './worksheet-labels.js';
export const BLOCK_TYPES = ['heading','text','answer','gaps','wordparts','choice','matching','table','checklist','image','pagebreak'];
export const THEMES = { violet: '#7955b2', mint: '#287c69', ink: '#263442' };
export const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const number = (value, fallback, max, min = 1) => Math.max(min, Math.min(max, Math.floor(Number(value) || fallback)));
const safeId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value) && !['__proto__','prototype','constructor'].includes(value) ? value : uid();
const text = (value, max = 3000) => typeof value === 'string' ? value.slice(0,max) : '';
const samples = {
 ru: {heading:'Давайте разберёмся',text:'Добавьте текст, который поможет ученику выполнить задание.',answer:'Объясните своими словами. Приведите пример.',choice:'Выберите верный ответ.',options:['Первый вариант','Второй вариант','Третий вариант'],matching:'Соедините понятия с подходящими определениями.',left:['Понятие 1','Понятие 2','Понятие 3'],right:['Определение 1','Определение 2','Определение 3'],table:'Заполните таблицу.',headers:['Понятие','Пример','Вывод'],checklist:'Отметьте, что у вас получилось.',items:['Я могу объяснить основную идею','Я могу привести пример','Я знаю, что стоит повторить'],readTitle:'Читаем и исследуем',readQuestion:'Какова главная мысль текста? Подтвердите ответ примером.',reflectQuestion:'Что сегодня получилось лучше всего? Какой следующий шаг вы сделаете?'},
 uz: {heading:'Birgalikda tushunamiz',text:'O‘quvchiga topshiriqni bajarishga yordam beradigan matn qo‘shing.',answer:'O‘z so‘zlaringiz bilan tushuntiring. Misol keltiring.',choice:'To‘g‘ri javobni tanlang.',options:['Birinchi variant','Ikkinchi variant','Uchinchi variant'],matching:'Tushunchalarni mos ta’riflar bilan bog‘lang.',left:['Tushuncha 1','Tushuncha 2','Tushuncha 3'],right:['Ta’rif 1','Ta’rif 2','Ta’rif 3'],table:'Jadvalni to‘ldiring.',headers:['Tushuncha','Misol','Xulosa'],checklist:'Nimalarni uddalaganingizni belgilang.',items:['Asosiy fikrni tushuntira olaman','Misol keltira olaman','Nimani takrorlash kerakligini bilaman'],readTitle:'O‘qiymiz va tadqiq qilamiz',readQuestion:'Matnning asosiy fikri nima? Javobingizni misol bilan asoslang.',reflectQuestion:'Bugun nima eng yaxshi chiqdi? Keyingi qadamingiz qanday bo‘ladi?'},
 en: {heading:'Let’s explore',text:'Add a passage or instructions to help students complete the task.',answer:'Explain in your own words. Give an example.',choice:'Choose the correct answer.',options:['First option','Second option','Third option'],matching:'Match the concepts to their definitions.',left:['Concept 1','Concept 2','Concept 3'],right:['Definition 1','Definition 2','Definition 3'],table:'Complete the table.',headers:['Concept','Example','Conclusion'],checklist:'Check what you can do.',items:['I can explain the main idea','I can give an example','I know what I need to review'],readTitle:'Read and explore',readQuestion:'What is the main idea? Support your answer with an example.',reflectQuestion:'What went best today? What will your next step be?'}
};
export function createBlock(type, language = 'ru') {
 if(!BLOCK_TYPES.includes(type)) throw new Error('Unknown block type');
 const s = samples[language] || samples.ru;
 const gapSamples={ru:{gaps:'Вода [[испаряется]] при нагревании и превращается в [[пар]].',wordparts:'Допишите слова: кни[[га]], шко[[ла]], уче[[ник]].'},uz:{gaps:'Suv qizdirilganda [[bug‘lanadi]] va [[bug‘]]ga aylanadi.',wordparts:'So‘zlarni tugating: ki[[tob]], mak[[tab]], o‘quv[[chi]].'},en:{gaps:'Plants need [[water]] and [[sunlight]] to grow.',wordparts:'Complete the words: ele[[phant]], but[[terfly]], class[[room]].'}};
 return { id:uid(), type, text:(gapSamples[language]||gapSamples.ru)[type] || s[type] || '', wordBank:type==='gaps', answer:'', lines:3, options:[...s.options], correct:[], multiple:false, items:[...s.items], left:[...s.left], right:[...s.right], rows:3, columns:3, headers:[...s.headers], image:'', caption:'' };
}
export function createWorksheet(language='ru', template='blank') {
 const doc = { version:1, kind:'evrika-worksheet', id:uid(), title:worksheetLabel(language,template==='blank'?'untitled':template), subject:'', grade:'', instructions:'', language, audience:'student', theme:'violet', studentFields:true, numbers:true, compact:false, blocks:[], updatedAt:new Date().toISOString() };
 const scenario=scenarioBlocks(language,template);
 if(scenario){doc.blocks=scenario.blocks.map(item=>({...createBlock(item.type,language),...item}));doc.instructions=scenario.instructions;doc.audience=scenario.audience;doc.studentFields=scenario.audience!=='teacher';return doc;}
 const types={knowledge:['heading','answer','choice','checklist'],reading:['heading','text','answer','table'],reflection:['heading','answer','checklist']}[template] || [];
 doc.blocks=types.map(type=>createBlock(type,language));
 const s=samples[language]||samples.ru;
 if(template==='reading'){doc.blocks[0].text=s.readTitle;doc.blocks[2].text=s.readQuestion;}
 if(template==='reflection')doc.blocks[1].text=s.reflectQuestion;
 return doc;
}
export function normalizeWorksheet(raw) {
 if(!raw || raw.kind!=='evrika-worksheet' || raw.version!==1 || !Array.isArray(raw.blocks) || raw.blocks.length>100)throw new Error('Invalid worksheet');
 const language=['ru','uz','en'].includes(raw.language)?raw.language:'ru';
 const doc=createWorksheet(language);
 for(const key of ['title','subject','grade','instructions'])doc[key]=text(raw[key],key==='instructions'?1500:180);
 doc.audience=raw.audience==='teacher'?'teacher':'student';
 doc.id=safeId(raw.id);doc.theme=Object.hasOwn(THEMES,raw.theme)?raw.theme:'violet';
 for(const key of ['studentFields','numbers','compact'])if(typeof raw[key]==='boolean')doc[key]=raw[key];
 const ids=new Set();
 doc.blocks=raw.blocks.map(item=>{
  if(!item || !BLOCK_TYPES.includes(item.type))throw new Error('Invalid block');
  const block=createBlock(item.type,language);
  block.id=safeId(item.id);if(ids.has(block.id))block.id=uid();ids.add(block.id);
  for(const key of ['text','answer','caption'])block[key]=text(item[key],key==='text'?3000:1000);
  for(const key of ['options','items','left','right','headers'])if(Array.isArray(item[key]))block[key]=item[key].slice(0,key==='headers'?5:8).map(value=>text(value,180));
  block.lines=number(item.lines,3,10);block.rows=number(item.rows,3,10);block.columns=number(item.columns,3,5,2);
  block.wordBank=typeof item.wordBank==='boolean'?item.wordBank:block.wordBank;
  block.multiple=!!item.multiple;
  block.correct=Array.isArray(item.correct)?[...new Set(item.correct.filter(i=>Number.isInteger(i)&&i>=0&&i<block.options.length))]:[];
  if(!block.multiple)block.correct=block.correct.slice(0,1);
  if(block.options.length<2)block.options=[...block.options,...Array(2-block.options.length).fill('')];
  const pairCount=Math.max(1,block.left.length,block.right.length);
  block.left=Array.from({length:pairCount},(_,i)=>block.left[i]||'');
  block.right=Array.from({length:pairCount},(_,i)=>block.right[i]||'');
  if(typeof item.image==='string' && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(item.image) && item.image.length<2800000)block.image=item.image;
  return block;
 });
 return doc;
}
export function moveBlock(blocks, id, target) {
 const from=blocks.findIndex(block=>block.id===id);if(from<0)return blocks;
 const result=[...blocks];const [block]=result.splice(from,1);result.splice(Math.max(0,Math.min(target,result.length)),0,block);return result;
}
export function paginateWorksheet(blocks, heights={}, firstCapacity=800, capacity=940, gap=20) {
 const pages=[[]];let available=firstCapacity;
 for(let index=0;index<blocks.length;index++){
  const block=blocks[index];
  if(block.type==='pagebreak') {if(pages.at(-1).length){pages.push([]);available=capacity;}continue;}
  const height=heights[block.id]||100;
  const next=blocks[index+1];
  const keepTogether=block.type==='heading'&&next&&next.type!=='pagebreak' ? gap+(heights[next.id]||100) : 0;
  const needed=height+(pages.at(-1).length?gap:0)+keepTogether;
  if(needed>available&&pages.at(-1).length){pages.push([]);available=capacity;}
  pages.at(-1).push(block);available-=height+(pages.at(-1).length>1?gap:0);
 }
 if(pages.length>1&&!pages.at(-1).length)pages.pop();
 return pages;
}
// A deterministic derangement: no pair remains in its original position.
export function matchingOrder(block) { return block.right.length>1 ? [...block.right.slice(1),block.right[0]] : [...block.right]; }
export function matchingAnswers(block) {
 const n=block.right.length;
 if(!n)return '';
 return block.left.map((_,i)=>`${i+1}–${String.fromCharCode(65+(i+n-1)%n)}`).join(', ');
}

// User-entered text is rendered as text nodes. Only paired [[answer]] markers become gaps.
export function gapTokens(value){
 const source=String(value||'');const parts=[];const pattern=/\[\[([^\[\]\n]{1,120})\]\]/g;let from=0,match;
 while((match=pattern.exec(source))){if(!match[1].trim())continue;if(match.index>from)parts.push({text:source.slice(from,match.index)});parts.push({answer:match[1].trim()});from=pattern.lastIndex;}
 if(from<source.length)parts.push({text:source.slice(from)});return parts;
}
export function gapWordBank(value){const words=[...new Set(gapTokens(value).filter(part=>part.answer).map(part=>part.answer))];return words.length>1?[...words.slice(1),words[0]]:words;}
