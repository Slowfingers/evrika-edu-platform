const uz = {
  "Не указано": "Ko‘rsatilmagan",
  "Не указан": "Ko‘rsatilmagan",
  "Не указана": "Ko‘rsatilmagan",
  "ПЛАН УРОКА": "DARS REJASI",
  "План урока": "Dars rejasi",
  "Информация об уроке": "Dars haqida ma’lumot",
  "Предмет: ": "Fan: ",
  "Класс: ": "Sinf: ",
  "Тема урока: ": "Dars mavzusi: ",
  "Общее время: ": "Umumiy vaqt: ",
  "Цели урока: ": "Dars maqsadlari: ",
  "Описание: ": "Tavsif: ",
  "Сводка урока": "Dars xulosasi",
  "Количество приёмов: ": "Usullar soni: ",
  "Средняя продолжительность приёма: ": "Usulning o‘rtacha davomiyligi: ",
  "Начало урока": "Dars boshlanishi",
  "Объяснение нового материала": "Yangi mavzuni tushuntirish",
  "Закрепление": "Mustahkamlash",
  "Конец урока": "Dars yakuni",
  "Начальные классы (1-4)": "Boshlang‘ich sinflar (1–4)",
  "Старшие классы (5-11)": "Yuqori sinflar (5–11)",
  "Дошкольники": "Maktabgacha yoshdagilar",
  "Взрослые": "Kattalar",
  "Критическое мышление": "Tanqidiy fikrlash",
  "Командная работа": "Jamoada ishlash",
  "Рефлексия": "Refleksiya",
  "Креативное мышление": "Ijodiy fikrlash",
  "Систематизация материала": "Materialni tizimlashtirish",
  "Коммуникативные навыки": "Muloqot ko‘nikmalari",
  "Мотивация": "Rag‘batlantirish",
  "Объяснение": "Tushuntirish",
  "Практика": "Amaliyot",
  "Индивидуальная": "Yakka tartibda",
  "Парная": "Juftlikda",
  "Командная": "Jamoada",
  "Фронтальная": "Butun sinf bilan",
  "Содержание:": "Mazmuni:",
  "Возраст: ": "Yosh: ",
  "Навыки: ": "Ko‘nikmalar: ",
  "Этапы: ": "Bosqichlar: ",
  "Тип работы: ": "Ish shakli: ",
  "Без названия": "Nomsiz",
  "Описание отсутствует": "Tavsif yo‘q"
};
const en={
 'Не указано':'Not specified','Не указан':'Not specified','Не указана':'Not specified','ПЛАН УРОКА':'LESSON PLAN','План урока':'Lesson plan','Информация об уроке':'Lesson information','Предмет:':'Subject:','Класс:':'Class:','Тема урока:':'Lesson topic:','Общее время:':'Total time:','Цели урока:':'Lesson goals:','Описание:':'Description:','Сводка урока':'Lesson summary','Количество приёмов:':'Number of techniques:','Средняя продолжительность приёма:':'Average technique duration:','Начало урока':'Lesson opening','Объяснение нового материала':'New material','Закрепление':'Consolidation','Конец урока':'Lesson closing','Начальные классы (1-4)':'Primary school (grades 1–4)','Старшие классы (5-11)':'Secondary school (grades 5–11)','Дошкольники':'Preschool','Взрослые':'Adults','Критическое мышление':'Critical thinking','Командная работа':'Teamwork','Рефлексия':'Reflection','Креативное мышление':'Creative thinking','Систематизация материала':'Organizing information','Коммуникативные навыки':'Communication','Мотивация':'Motivation','Объяснение':'Explanation','Практика':'Practice','Индивидуальная':'Individual','Парная':'Pairs','Командная':'Teams','Фронтальная':'Whole class','Содержание:':'Content:','Возраст:':'Age:','Навыки:':'Skills:','Этапы:':'Stages:','Тип работы:':'Format:','Без названия':'Untitled','Описание отсутствует':'No description'
};
export function translateLabel(text, language = 'ru') {
 const dictionary=language==='uz'?uz:language==='en'?en:null;
 if(!dictionary)return text;
 const value=String(text??'');
 const entry=Object.entries(dictionary).find(([key])=>key.trim()===value.trim());
 if(!entry)return value;
 return (value.match(/^\s*/)?.[0]||'')+entry[1].trim()+(value.match(/\s*$/)?.[0]||'');
}
