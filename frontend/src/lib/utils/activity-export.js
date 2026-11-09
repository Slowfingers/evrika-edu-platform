export function csvCell(value) {
 const text=String(value??'');
 const safe=/^[\s]*[=+@-]/.test(text)||/^[\t\r\n]/.test(text)?"'"+text:text;
 return '"'+safe.replaceAll('"','""')+'"';
}
export function wrapExportText(value,width=32){
 const lines=[];let line='';
 for(const word of String(value??'').replace(/\s+/g,' ').trim().split(' ')){
  if(!word)continue;
  if(word.length>width){if(line){lines.push(line);line='';}for(let i=0;i<word.length;i+=width)lines.push(word.slice(i,i+width));continue;}
  if((line+' '+word).trim().length>width){lines.push(line);line=word;}else line=(line+' '+word).trim();
 }
 if(line)lines.push(line);return lines;
}
const xml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function targetExportSVG(svg,title,topics,levels,scaleTitle='Scale: edge to center'){
 const lines=[...wrapExportText(title), '',...topics.flatMap((topic,i)=>wrapExportText(`${i+1}. ${topic}`)), '',...wrapExportText(scaleTitle),...levels.flatMap((level,i)=>wrapExportText(`${i+1}. ${level}`))];
 const height=430+lines.length*17;
 const base=svg.replace(/viewBox="[^"]*"/,`viewBox="0 0 400 ${height}"`).replace('</svg>','');
 return base+lines.map((text,i)=>`<text x="12" y="${420+i*17}" font-family="Arial, sans-serif" font-size="11" fill="#493659">${xml(text)}</text>`).join('')+'</svg>';
}
