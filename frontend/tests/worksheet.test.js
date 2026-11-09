import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorksheet, createBlock, normalizeWorksheet, moveBlock, paginateWorksheet, matchingOrder, matchingAnswers } from '../src/lib/utils/worksheet-state.js';

test('templates are independent and have complete localized blocks',()=>{
 for(const language of ['ru','uz','en']) for(const template of ['blank','knowledge','reading','reflection']){
  const a=createWorksheet(language,template),b=createWorksheet(language,template);
  assert.notEqual(a.id,b.id);assert.equal(a.language,language);
  assert.equal(new Set(a.blocks.map(block=>block.id)).size,a.blocks.length);
  if(template!=='blank')assert.equal(a.blocks.length,template==='reflection'?3:4);
  if(a.blocks.length){a.blocks[0].text='Changed';assert.notEqual(b.blocks[0].text,'Changed');}
 }
});
test('import validates file type, clamps sizes, and strips unsafe images',()=>{
 assert.throws(()=>normalizeWorksheet({version:1,blocks:[]}));
 const sheet=createWorksheet('uz','knowledge');
 sheet.blocks[1].lines=999;sheet.blocks[1].text='x'.repeat(5000);sheet.blocks[1].image='javascript:alert(1)';
 sheet.blocks[2].id=sheet.blocks[1].id;sheet.blocks[0].id='__proto__';sheet.theme='__proto__';
 const result=normalizeWorksheet(sheet);
 assert.equal(result.blocks[1].lines,10);assert.equal(result.blocks[1].text.length,3000);assert.equal(result.blocks[1].image,'');
 assert.notEqual(result.blocks[0].id,'__proto__');assert.notEqual(result.blocks[1].id,result.blocks[2].id);assert.equal(result.theme,'violet');
 assert.throws(()=>normalizeWorksheet({...sheet,blocks:[{type:'script'}]}));
});
test('project round trip preserves tasks, answers, and images',()=>{
 const sheet=createWorksheet('ru','reading');const image=createBlock('image');image.image='data:image/png;base64,aGVsbG8=';
 sheet.blocks.push(image);sheet.blocks[2].answer='Expected answer';
 const result=normalizeWorksheet(JSON.parse(JSON.stringify(sheet)));
 assert.equal(result.title,sheet.title);assert.deepEqual(result.blocks,sheet.blocks);assert.equal(result.language,'ru');
});
test('reordering works in both directions without mutating source',()=>{
 const a=[{id:'a'},{id:'b'},{id:'c'}];
 assert.deepEqual(moveBlock(a,'a',2).map(b=>b.id),['b','c','a']);
 assert.deepEqual(moveBlock(a,'c',0).map(b=>b.id),['c','a','b']);
 assert.deepEqual(a.map(b=>b.id),['a','b','c']);
});
test('pagination accounts for first-page header, gaps, and manual breaks',()=>{
 const a=['a','b','c'].map(id=>({id,type:'text'}));
 assert.deepEqual(paginateWorksheet(a,{a:150,b:150,c:150},320,400,20).map(p=>p.map(b=>b.id)),[['a','b'],['c']]);
 assert.deepEqual(paginateWorksheet([a[0],{id:'break',type:'pagebreak'},a[1],{id:'end',type:'pagebreak'}],{},800,900).map(p=>p.map(b=>b.id)),[['a'],['b']]);
 assert.equal(paginateWorksheet([],{},800,900).length,1);
});
test('matching shuffles all pairs and answer key points to displayed letters',()=>{
 const block=createBlock('matching');
 const order=matchingOrder(block);assert.deepEqual(order,['Определение 2','Определение 3','Определение 1']);
 assert.equal(matchingAnswers(block),'1–C, 2–A, 3–B');
 block.right.forEach((value,i)=>assert.notEqual(order[i],value));
});

test('a section heading stays with its next task when a page fills up',()=>{
 const blocks=[{id:'first',type:'text'},{id:'heading',type:'heading'},{id:'task',type:'answer'}];
 assert.deepEqual(paginateWorksheet(blocks,{first:210,heading:30,task:120},300,900,20).map(page=>page.map(block=>block.id)),[['first'],['heading','task']]);
});
