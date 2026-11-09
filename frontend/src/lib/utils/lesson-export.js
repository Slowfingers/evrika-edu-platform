import { stageLabel } from './lesson-labels.js';
import { formatTimeDisplay } from './time-intervals.js';
import { translateLabel } from './export-labels.js';
import { lessonLabel } from './lesson-labels.js';
export const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function stageTextSections(stage,language='ru') {
 return [['notes','notes'],['studentTask','task'],['resources','resources']].filter(([field])=>stage[field]?.trim()).map(([field,label])=>({label:lessonLabel(language,label),text:stage[field]}));
}
export function stageNotesHTML(stage,language='ru') {
 return stageTextSections(stage,language).map(section=>`<div class="technique"><strong>${escapeHTML(section.label)}</strong><div style="white-space:pre-wrap;margin-top:8px">${escapeHTML(section.text)}</div></div>`).join('');
}

export function lessonText(lesson){
 const language=lesson.language||'ru',tr=text=>translateLabel(text,language);
 const unit=language==='uz'?'daqiqa':language==='en'?'min':'мин';
 const lines=[tr('ПЛАН УРОКА'),''];
 for(const [field,label] of [['subject','Предмет: '],['grade','Класс: '],['topic','Тема урока: '],['goals','Цели урока: '],['description','Описание: ']])if(lesson[field])lines.push(tr(label)+lesson[field]);
 lines.push(tr('Общее время: ')+(lesson.totalTime||0)+' '+unit,'');
 const technique=card=>{lines.push(card.title||'',formatTimeDisplay(card.timeMinutes??card.time_minutes??0,language),card.description||'',card.content||'','');};
 if(lesson.lessonStages)for(const [id,stage] of Object.entries(lesson.lessonStages)){
  lines.push(stageLabel(id,language)+' · '+(stage.totalTime??stage.duration??0)+' '+unit);
  for(const section of stageTextSections(stage,language))lines.push(section.label,section.text);
  for(const card of stage.cards||[])technique(card);
  lines.push('');
 }else for(const card of lesson.cards||[])technique(card);
 return lines.join('\n');
}
