import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorksheet,createBlock,normalizeWorksheet,gapTokens,gapWordBank} from '../src/lib/utils/worksheet-state.js';
test('whole-word and partial-word gaps survive Unicode and line breaks',()=>{
 const tokens=gapTokens('ki[[tob]]\nPlants need [[water]] and [[sunlight]].');
 assert.deepEqual(tokens.filter(t=>t.answer).map(t=>t.answer),['tob','water','sunlight']);
 assert.equal(tokens.map(t=>t.answer??t.text).join(''),'kitob\nPlants need water and sunlight.');
 assert.equal(gapTokens('[[ ]] and [[unfinished').some(t=>t.answer),false);
 assert.deepEqual(gapTokens('<img onerror=bad>'),[{text:'<img onerror=bad>'}]);
});
test('word bank uses distinct answers without changing original text',()=>{
 const text='[[cat]] [[dog]] [[cat]]';assert.deepEqual(gapWordBank(text),['dog','cat']);assert.equal(gapTokens(text).filter(t=>t.answer).length,3);
});
test('scenario templates separate teacher notes from student worksheets in every language',()=>{
 for(const language of ['ru','uz','en']){
  const student=createWorksheet(language,'scenario'),teacher=createWorksheet(language,'teacherScenario'),practice=createWorksheet(language,'languagePractice');
  assert.equal(student.audience,'student');assert.equal(teacher.audience,'teacher');assert.equal(teacher.studentFields,false);
  assert.ok(student.blocks.some(b=>b.type==='table'));assert.ok(student.blocks.some(b=>b.type==='answer'));assert.ok(teacher.blocks.filter(b=>b.type==='heading').length>=6);
  assert.ok(practice.blocks.some(b=>b.type==='gaps'));assert.ok(practice.blocks.some(b=>b.type==='wordparts'));assert.ok(practice.blocks.some(b=>b.type==='matching'));
  assert.deepEqual(normalizeWorksheet(JSON.parse(JSON.stringify(teacher))).blocks,teacher.blocks);
  student.blocks[3].items[0]='changed';assert.notEqual(createWorksheet(language,'scenario').blocks[3].items[0],'changed');
 }
});
test('project files preserve gap answers, word bank and document audience',()=>{
 const sheet=createWorksheet('en');sheet.audience='teacher';const block=createBlock('wordparts','en');block.text='but[[terfly]]';block.wordBank=true;sheet.blocks=[block];
 const copy=normalizeWorksheet(JSON.parse(JSON.stringify(sheet)));assert.equal(copy.audience,'teacher');assert.equal(copy.blocks[0].wordBank,true);assert.equal(copy.blocks[0].text,'but[[terfly]]');
 assert.equal(normalizeWorksheet({...sheet,audience:'invalid'}).audience,'student');
});
