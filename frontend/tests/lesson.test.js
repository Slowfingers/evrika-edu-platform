import test from 'node:test';
import assert from 'node:assert/strict';
import {createLessonStages,recalculateLesson,lessonHasContent,removeLessonCard,worksheetFromLesson} from '../src/lib/utils/lesson-state.js';
import {stageNotesHTML,stageTextSections} from '../src/lib/utils/lesson-export.js';
test('a lesson can be built entirely from teacher notes without catalog cards',()=>{
 const lesson={topic:'Fractions',subject:'Math',grade:'5',lessonStages:createLessonStages()};
 assert.equal(lessonHasContent(lesson),false);
 lesson.lessonStages['объяснение-нового-материала'].notes='Explain numerator and denominator.';
 lesson.lessonStages['практика'].studentTask='Compare two fractions.';
 const result=recalculateLesson(lesson);
 assert.equal(lessonHasContent(result),true);assert.equal(result.totalTime,45);assert.equal(result.selectedCards.length,0);
 assert.equal(stageTextSections(result.lessonStages['практика'])[0].text,'Compare two fractions.');
});
test('techniques fit inside stage time and removing them preserves teacher content',()=>{
 const lesson={lessonStages:{practice:{duration:10,notes:'My notes',cards:[{id:3,timeMinutes:5}]}}};
 assert.equal(recalculateLesson(lesson).totalTime,10);
 const long={lessonStages:{practice:{...lesson.lessonStages.practice,cards:[{id:3,timeMinutes:15}]}}};
 assert.equal(recalculateLesson(long).totalTime,15);
 const result=removeLessonCard(long,3,'practice');assert.equal(result.totalTime,10);assert.equal(result.lessonStages.practice.notes,'My notes');
});
test('worksheet inherits lesson context but never teacher-only notes or answers',()=>{
 const lesson={topic:'Fractions',subject:'Math',grade:'5',goals:'Private',lessonStages:createLessonStages()};
 lesson.lessonStages['практика'].notes='Secret answer 42';
 const sheet=worksheetFromLesson(lesson,'uz');
 assert.equal(sheet.title,'Fractions');assert.equal(sheet.subject,'Math');assert.equal(sheet.grade,'5');assert.equal(sheet.language,'uz');assert.deepEqual(sheet.blocks,[]);assert.ok(!JSON.stringify(sheet).includes('Secret answer'));
});
test('teacher notes are escaped in HTML export while line breaks are preserved',()=>{
 const html=stageNotesHTML({notes:'<script>alert(1)</script>\nExample',studentTask:'A & B'},'ru');
 assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));assert.ok(html.includes('\nExample'));assert.ok(html.includes('A &amp; B'));
});
