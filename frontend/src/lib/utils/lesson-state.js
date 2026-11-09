import { createWorksheet } from './worksheet-state.js';
import { lessonLabel } from './lesson-labels.js';
export function createLessonStages() {
 return Object.fromEntries([['начало-урока',3],['объяснение-нового-материала',12],['закрепление',10],['практика',15],['конец-урока',5]].map(([id,duration])=>[id,{cards:[],notes:'',studentTask:'',resources:'',duration,totalTime:duration}]));
}
export function stageHasContent(stage) {return !!(stage.cards?.length||stage.notes?.trim()||stage.studentTask?.trim()||stage.resources?.trim());}
export function lessonHasContent(lesson) {return Object.values(lesson.lessonStages||{}).some(stageHasContent);}
export function recalculateLesson(lesson) {
 const lessonStages=Object.fromEntries(Object.entries(lesson.lessonStages).map(([id,stage])=>{
  const cardTime=(stage.cards||[]).reduce((sum,card)=>sum+(card.timeMinutes??card.time_minutes??0),0);
  return [id,{...stage,cardTime,totalTime:Math.max(Number(stage.duration)||0,cardTime)}];
 }));
 const selectedCards=Object.values(lessonStages).flatMap(stage=>stage.cards||[]);
 return {...lesson,lessonStages,selectedCards,totalTime:Object.values(lessonStages).reduce((sum,stage)=>sum+stage.totalTime,0)};
}
export function removeLessonCard(lesson,cardId,stageId) {
 const lessonStages=Object.fromEntries(Object.entries(lesson.lessonStages).map(([id,stage])=>[id,{...stage,cards:!stageId||id===stageId?stage.cards.filter(card=>card.id!==cardId):stage.cards}]));
 return recalculateLesson({...lesson,lessonStages});
}
export function worksheetFromLesson(lesson,language='ru') {
 const sheet=createWorksheet(language,'blank');
 sheet.title=lesson.topic?.trim()||lessonLabel(language,'newWorksheet');sheet.subject=lesson.subject||'';sheet.grade=lesson.grade||'';
 // Teacher notes and answer keys are intentionally kept out of student handouts.
 return sheet;
}
