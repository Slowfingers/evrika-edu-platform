export function placeStudent(seating, studentId, key) {
 if(studentId==null)return seating;
 const next={...seating};
 const old=Object.keys(next).find(place=>next[place]===studentId);
 const displaced=next[key];
 if(old)delete next[old];
 if(old&&old!==key&&displaced!=null&&displaced!==studentId)next[old]=displaced;
 next[key]=studentId;
 return next;
}
export function shuffle(items,random=Math.random){const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
export function classroomSlots(count,capacity){return Array.from({length:count},(_,d)=>Array.from({length:capacity},(_,s)=>`${d}_${s}`)).flat();}
export function fillSeats(students,seating,slots,reshuffle=false,random=Math.random){
 const present=new Set(students.filter(s=>!s.absent).map(s=>s.id));
 const used=new Set();const next={};
 if(!reshuffle)for(const key of slots){const id=seating[key];if(present.has(id)&&!used.has(id)){next[key]=id;used.add(id);}}
 const pool=shuffle([...present].filter(id=>!used.has(id)),random);let i=0;
 for(const key of slots)if(next[key]==null&&i<pool.length)next[key]=pool[i++];
 return next;
}
export function parseClassroom(value){
 if(value?.type!=='evrika-classroom'||value.version!==1||!Array.isArray(value.students)||value.students.length>150)throw new Error('invalid');
 const count=Math.max(1,Math.min(30,Math.round(Number(value.count)||12)));
 const capacity=[1,2,4,6].includes(value.capacity)?value.capacity:2;
 const students=value.students.map((s,i)=>({id:i+1,name:String(s.name||'').trim().slice(0,100),absent:!!s.absent}));
 if(students.some(s=>!s.name)||new Set(value.students.map(s=>s.id)).size!==students.length)throw new Error('invalid');
 const ids=new Map(value.students.map((s,i)=>[s.id,i+1]));const seating={};const used=new Set();
 for(const key of classroomSlots(count,capacity)){const id=ids.get(value.seating?.[key]);if(id&&!students[id-1].absent&&!used.has(id)){seating[key]=id;used.add(id);}}
 return {students,seating,count,capacity,layout:['rows','groups','u'].includes(value.layout)?value.layout:'rows',title:String(value.title||'').slice(0,100),names:String(value.names||'').slice(0,15500)};
}

export function classroomDeskPosition(index,count,layout){
 if(layout!=='u'||count<5)return '';
 const left=Math.ceil((count-3)/2),right=count-3-left,depth=Math.max(left,right);
 if(index<left)return `grid-column:1;grid-row:${index+1}`;
 if(index<left+right)return `grid-column:3;grid-row:${depth-right+index-left+1}`;
 return `grid-column:${index-left-right+1};grid-row:${depth+1}`;
}
