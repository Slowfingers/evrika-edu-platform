export function targetPoint(x,y,count,levels=3){
 const dx=x-200,dy=y-200,r=Math.hypot(dx,dy);if(r>170||r<0.5)return null;
 const angle=(Math.atan2(dy,dx)+Math.PI/2+Math.PI*2)%(Math.PI*2);
 return {sector:Math.min(count-1,Math.floor(angle/(Math.PI*2/count))),level:Math.min(levels-1,Math.floor((1-r/170)*levels))};
}
export function targetStats(responses,count){
 const topics=Array.from({length:count},(_,sector)=>{const votes=responses.filter(r=>r.sector===sector);const distribution=[0,0,0];for(const r of votes)if(Number.isInteger(r.level)&&r.level>=0&&r.level<3)distribution[r.level]++;
 return {count:votes.length,distribution,positive:votes.length?Math.round(distribution[2]/votes.length*100):null};});
 return {topics,total:responses.length,covered:topics.filter(t=>t.count>0).length};
}
export function completeResponse(draft,count){return Array.from({length:count},(_,sector)=>({sector,level:draft[sector]})).filter(r=>Number.isInteger(r.level)&&r.level>=0&&r.level<3);}
