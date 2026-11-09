import paperCSS from './worksheet-paper.css?inline';
export async function printWorksheet(pagesElement, title) {
  if(!pagesElement)throw new Error('No worksheet');
  const frame=document.createElement('iframe');
  frame.title=title; frame.style.cssText='position:fixed;left:-10000px;top:0;width:794px;height:1123px;border:0';
  document.body.appendChild(frame);
  try {
    const clone=pagesElement.cloneNode(true);
    clone.querySelectorAll('[data-editor]').forEach(node=>node.remove());
    clone.querySelectorAll('.ws-block-shell').forEach(node=>{node.removeAttribute('role');node.removeAttribute('tabindex');node.removeAttribute('aria-label');});
    const ready=new Promise(resolve=>{frame.onload=resolve;});
    // HTML comes only from the rendered Svelte worksheet, which escapes all user text.
    frame.srcdoc='<!doctype html><html><head><meta charset="utf-8"><style>'+paperCSS+'</style></head><body>'+clone.innerHTML+'</body></html>';
    await ready;
    frame.contentDocument.title=title;
    await frame.contentDocument.fonts.ready;
    await Promise.all([...frame.contentDocument.images].map(img=>img.decode().catch(()=>{})));
    const cleanup=()=>frame.remove();
    frame.contentWindow.addEventListener('afterprint',cleanup,{once:true});
    // Some browsers do not dispatch afterprint for iframes.
    setTimeout(cleanup,120000);
    frame.contentWindow.focus();frame.contentWindow.print();
  } catch(error) {frame.remove();throw error;}
}
