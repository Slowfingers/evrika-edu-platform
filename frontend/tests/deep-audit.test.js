import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {BaseApi} from '../src/lib/api/base.api.js';
import {parseClassroom} from '../src/lib/utils/classroom-state.js';
import {csvCell,targetExportSVG,wrapExportText} from '../src/lib/utils/activity-export.js';
import {lessonText} from '../src/lib/utils/lesson-export.js';
import {createLessonStages,recalculateLesson} from '../src/lib/utils/lesson-state.js';
import {translateLabel} from '../src/lib/utils/export-labels.js';
const require=createRequire(import.meta.url);
const service=require('../../backend/src/services/card.service.json.js');
const cards=require('../../backend/src/data/cards.json');
const api=new BaseApi(async()=>({ok:true,json:async()=>cards}));
test('API rejects partial numeric IDs just like the static catalog',async()=>{
 assert.equal(await service.getCardById('3abc'),null);
 assert.equal((await api.fetchStaticCards('/cards/3abc')).data,null);
});
test('invalid pagination never selects records from the end or disagrees with the API',async()=>{
 for(const filter of [{limit:-3,offset:-10},{limit:'oops',offset:'oops'},{limit:0,offset:-1},{limit:3,offset:2},{offset:3},{limit:'2oops',offset:0}]){
  const qs=new URLSearchParams(filter);const result=await api.fetchStaticCards('/cards?'+qs);
  assert.deepEqual(result.data.map(c=>c.id),(await service.getAllCards(filter)).map(c=>c.id));
 }
 assert.equal((await service.getAllCards({limit:2,offset:-10}))[0].id,cards[0].id);
});
test('classroom file preserves names waiting to be added, including old-file compatibility',()=>{
 const file={type:'evrika-classroom',version:1,students:[],seating:{},count:2,capacity:2,names:'Ali\nZarina'};
 assert.equal(parseClassroom(file).names,file.names);delete file.names;assert.equal(parseClassroom(file).names,'');
});
test('CSV export quotes text and neutralizes formulas even after whitespace',()=>{
 assert.equal(csvCell('A "quote"'),'"A ""quote"""');
 assert.equal(csvCell('  =SUM(A1:A2)'),'"\'  =SUM(A1:A2)"');
 assert.equal(csvCell(0),'"0"');
});
test('SVG export wraps long titles and includes the scale without injecting user markup',()=>{
 const svg=targetExportSVG('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><circle cx="1" cy="1" r="1"/></svg>','W'.repeat(100),['<script>bad</script>'],['Help','Some help','Confident'],'Scale');
 assert.ok(svg.includes('Scale'));assert.ok(svg.includes('Confident'));assert.ok(!svg.includes('<script>'));assert.ok(svg.includes('&lt;script&gt;'));
 const lines=wrapExportText('W'.repeat(100));assert.equal(lines.join(''),'W'.repeat(100));assert.ok(lines.every(line=>line.length<=32));
 const height=Number(svg.match(/viewBox="0 0 400 (\d+)"/)[1]);const positions=[...svg.matchAll(/<text x="12" y="(\d+)"/g)].map(m=>Number(m[1]));assert.ok(Math.max(...positions)<height);
});
test('text export includes goals and all teacher fields without relying on selected techniques',()=>{
 const stages=createLessonStages();stages['практика'].notes='Explain this';stages['практика'].studentTask='Try it';stages['практика'].resources='Paper';
 const result=lessonText(recalculateLesson({language:'en',goals:'Learn',lessonStages:stages}));
 for(const text of ['LESSON PLAN','Learn','Explain this','Try it','Paper','Practice'])assert.ok(result.includes(text),text);
});
test('legacy flat lesson text still exports techniques in Uzbek',()=>{
 const result=lessonText({language:'uz',topic:'Sinov',cards:[{title:'Usul',description:'Tavsif',content:'Mazmun',timeMinutes:5}],totalTime:5});
 for(const text of ['DARS REJASI','Sinov','Usul','Mazmun','daqiqa'])assert.ok(result.includes(text));
 assert.equal(translateLabel('Предмет: ','en'),'Subject: ');
});

test('static metadata includes every catalog skill and retries failed downloads',async()=>{
 const {MetadataApi}=await import('../src/lib/api/metadata.api.js');
 const metadata=require('../../backend/src/data/metadata.json');let attempts=0;
 const api=new MetadataApi(async()=>({ok:++attempts>1,status:503,json:async()=>metadata}));
 await assert.rejects(api.getSkills());
 const responses=await Promise.all([api.getSkills(),api.getAgeGroups(),api.getFormData()]);assert.equal(attempts,2);
 const skills=new Set(responses[0].data.map(item=>item.id));for(const card of cards)for(const skill of card.skills)assert.ok(skills.has(skill),skill);
});
test('worksheet files respect the same UTF-8 size limit when saving and reopening',async()=>{
 const {worksheetFileJSON,WORKSHEET_FILE_LIMIT}=await import('../src/lib/utils/worksheet-file.js');
 assert.deepEqual(JSON.parse(worksheetFileJSON({title:'O‘zbekcha матн'})),{title:'O‘zbekcha матн'});
 assert.throws(()=>worksheetFileJSON({image:'x'.repeat(WORKSHEET_FILE_LIMIT)}));
 assert.throws(()=>worksheetFileJSON({text:'я'.repeat(WORKSHEET_FILE_LIMIT/2)}));
});
test('backend serves catalog and complete metadata without opening a SQLite database',async t=>{
 const app=require('../../backend/src/server.js');assert.ok(!Object.keys(require.cache).some(key=>key.endsWith('/services/database.service.js')));const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
 t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();}));
 const base=`http://127.0.0.1:${server.address().port}`;
 const result=await fetch(base+'/api/metadata/skills');assert.equal(result.status,200);assert.equal((await result.json()).data.length,6);
 const card=await fetch(base+'/api/cards/3abc');assert.equal(card.status,404);
 const missing=await fetch(base+'/api/missing');assert.equal(missing.status,404);assert.equal((await missing.json()).success,false);
 const known=await fetch(base+'/api/cards?limit=2&offset=-5');assert.equal((await known.json()).data[0].id,cards[0].id);
});

test('U layouts have three connected bottom desks for every supported room size',async()=>{
 const {classroomDeskPosition}=await import('../src/lib/utils/classroom-state.js');
 for(let count=5;count<=30;count++){
  const positions=Array.from({length:count},(_,i)=>classroomDeskPosition(i,count,'u'));assert.equal(new Set(positions).size,count);
  const cells=positions.map(position=>position.match(/grid-column:(\d+);grid-row:(\d+)/).slice(1).map(Number));
  const bottom=Math.max(...cells.map(c=>c[1]));assert.deepEqual(cells.filter(c=>c[1]===bottom).map(c=>c[0]).sort(),[1,2,3]);
  assert.ok(cells.some(c=>c[0]===1&&c[1]===bottom-1));assert.ok(cells.some(c=>c[0]===3&&c[1]===bottom-1));
 }
});
