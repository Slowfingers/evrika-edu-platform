// Keep a stage's hue while giving white controls a consistently dark surface.
export function darkSurface(color){
 const match=/^#([0-9a-f]{6})$/i.exec(String(color));if(!match)return '#281b3f';
 const value=parseInt(match[1],16),rgb=[value>>16,(value>>8)&255,value&255],base=[33,19,55];
 return '#'+rgb.map((part,i)=>Math.round(base[i]*.78+part*.22).toString(16).padStart(2,'0')).join('');
}
