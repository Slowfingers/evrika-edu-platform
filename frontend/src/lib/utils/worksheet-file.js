export const WORKSHEET_FILE_LIMIT=12*1024*1024;
export function worksheetFileJSON(sheet){
 const json=JSON.stringify(sheet,null,2);
 if(new TextEncoder().encode(json).byteLength>WORKSHEET_FILE_LIMIT)throw new Error('Worksheet file is too large');
 return json;
}
