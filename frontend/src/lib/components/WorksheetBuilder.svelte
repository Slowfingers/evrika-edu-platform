<script>
  import {WORKSHEET_FILE_LIMIT,worksheetFileJSON} from '#lib/utils/worksheet-file.js';
  import { lockBodyScroll } from '#lib/utils/scroll-lock.js';
  import { onMount, afterUpdate } from 'svelte';
  import { lang } from '#lib/stores/lang.js';
  import WorksheetBlock from './WorksheetBlock.svelte';
  import { worksheetLabel } from '#lib/utils/worksheet-labels.js';
  import { BLOCK_TYPES, THEMES, uid, createBlock, createWorksheet, normalizeWorksheet, moveBlock, paginateWorksheet } from '#lib/utils/worksheet-state.js';
  import { printWorksheet } from '#lib/utils/worksheet-print.js';
  import '#lib/utils/worksheet-paper.css';

  export let initialSheet=null;
  export let embedded=false;
  import { useUnsavedChanges, unsavedMessage, confirmDiscard } from '#lib/utils/unsaved.js';
  let dirty=false;
  useUnsavedChanges(()=>!embedded&&dirty,()=>$lang);
  import { lessonLabel } from '#lib/utils/lesson-labels.js';
  const ICONS={heading:'H',text:'¶',answer:'≡',choice:'◉',matching:'⇄',table:'▦',checklist:'☑',image:'▧',pagebreak:'↵',gaps:'_ _',wordparts:'A_' };
  const templates=['blank','scenario','teacherScenario','languagePractice','knowledge','reading','reflection'];
  let sheet=createWorksheet('ru');
  let selectedId=null;
  let preview=false;
  let showAnswers=false;
  let showTemplates=false;
  let panel='document';
  let mobilePanel=null;
  let message='';
  let past=[];
  let future=[];
  let lastEditKey='';
  let lastEditAt=0;
  let measureFrame;
  let measureRoot;
  let canvas;
  let pagesElement;
  let projectInput;
  let blockTextInput;
  let heights={};
  let firstCapacity=790;
  let nextCapacity=950;
  let fitScale=0.85;
  let zoom=null;
  let headerTooTall=false;
  $: scale=zoom??fitScale;
  let draggedId=null;
  let dropId=null;
  let printing=false;

  $: ui=key=>worksheetLabel($lang,key);
  $: paper=key=>worksheetLabel(sheet.language,key);
  $: selected=sheet.blocks.find(block=>block.id===selectedId);
  $: selectedIndex=sheet.blocks.findIndex(block=>block.id===selectedId);
  $: pages=paginateWorksheet(sheet.blocks,heights,firstCapacity,nextCapacity,sheet.compact?12:20);
  $: numbers=Object.fromEntries(sheet.blocks.filter(block=>['answer','gaps','wordparts','choice','matching','table','checklist'].includes(block.type)).map((block,i)=>[block.id,i+1]));
  $: oversized=sheet.blocks.filter(block=>block.type!=='pagebreak' && (heights[block.id]||0)>nextCapacity);

  onMount(()=>{
    sheet=initialSheet?normalizeWorksheet(initialSheet):createWorksheet($lang,'blank');
    showTemplates=!initialSheet;
    const observer=new ResizeObserver(()=>{fitScale=Math.min(1,Math.max(0.15,(canvas.clientWidth-40)/794));});
    observer.observe(canvas);
    return ()=>{observer.disconnect();cancelAnimationFrame(measureFrame);};
  });
  afterUpdate(()=>{
    cancelAnimationFrame(measureFrame);
    measureFrame=requestAnimationFrame(measure);
  });
  function measure() {
    if(!measureRoot)return;
    const next={};
    for(const node of measureRoot.querySelectorAll('[data-measure-id]'))next[node.dataset.measureId]=Math.ceil(node.getBoundingClientRect().height);
    if(JSON.stringify(next)!==JSON.stringify(heights))heights=next;
    const header=measureRoot.querySelector('.ws-page-header');
    const nextFirst=Math.floor(999-(header?.getBoundingClientRect().height||0)-26);
    headerTooTall=nextFirst<120;
    if(nextFirst!==firstCapacity)firstCapacity=Math.max(200,nextFirst);
    const nextPage=Math.floor(999-18-24);
    if(nextPage!==nextCapacity)nextCapacity=nextPage;
  }
  function remember(key='action') {
    dirty=true;
    const now=Date.now();
    if(key==='action'||key!==lastEditKey||now-lastEditAt>800)past=[...past.slice(-49),JSON.stringify(sheet)];
    lastEditKey=key;lastEditAt=now;future=[];
  }
  function changeSheet(key,value) {remember('doc:'+key);sheet={...sheet,[key]:value};}
  function updateBlock(key,value) {
    if(!selected)return;
    remember(selected.id+':'+key);
    const patch={[key]:value};
    if(key==='multiple'&&!value)patch.correct=selected.correct.slice(0,1);
    sheet={...sheet,blocks:sheet.blocks.map(block=>block.id===selectedId?{...block,...patch}:block)};
  }
  function markGap(){
    if(!selected||!blockTextInput)return;
    const start=blockTextInput.selectionStart,end=blockTextInput.selectionEnd;
    const value=selected.text.slice(start,end);
    if(!value.trim()||value.length>120||/[\[\]\n]/.test(value)){message=ui('selectGapText');return;}
    if(selected.text.length+4>3000)return;
    updateBlock('text',selected.text.slice(0,start)+'[['+value+']]'+selected.text.slice(end));
  }
  function addBlock(type) {
    if(sheet.blocks.length>=100)return;
    remember();const block=createBlock(type,sheet.language);
    const at=selectedIndex>=0?selectedIndex+1:sheet.blocks.length;
    const blocks=[...sheet.blocks];blocks.splice(at,0,block);sheet={...sheet,blocks};
    selectedId=block.id;panel='block';mobilePanel=window.innerWidth<=850?'settings':null;preview=false;
  }
  function selectBlock(id) {if(preview)return;selectedId=id;panel='block';if(window.innerWidth<=850)mobilePanel='settings';}
  function move(id,target) {remember();sheet={...sheet,blocks:moveBlock(sheet.blocks,id,target)};}
  function duplicate() {
    if(!selected||sheet.blocks.length>=100)return;
    const block={...structuredClone(selected),id:uid()};const blocks=[...sheet.blocks];blocks.splice(selectedIndex+1,0,block);const next={...sheet,blocks};try{worksheetFileJSON(next);}catch{message=ui('projectTooLarge');return;}remember();sheet=next;selectedId=block.id;
  }
  function remove() {if(!selected)return;remember();sheet={...sheet,blocks:sheet.blocks.filter(block=>block.id!==selectedId)};selectedId=null;panel='document';}
  function undo() {if(!past.length)return;dirty=true;future=[JSON.stringify(sheet),...future];sheet=JSON.parse(past.at(-1));past=past.slice(0,-1);lastEditKey='';}
  function redo() {if(!future.length)return;dirty=true;past=[...past,JSON.stringify(sheet)];sheet=JSON.parse(future[0]);future=future.slice(1);lastEditKey='';}
  async function newSheet(template) {if(dirty&&!await confirmDiscard(unsavedMessage($lang)))return;dirty=false;sheet=createWorksheet($lang,template);past=[];future=[];selectedId=null;panel='document';showTemplates=false;preview=false;showAnswers=false;mobilePanel=null;}
  function toggleCorrect(i) {updateBlock('correct',selected.multiple ? (selected.correct.includes(i)?selected.correct.filter(n=>n!==i):[...selected.correct,i]) : [i]);}
  function updateOption(i,value) {updateBlock('options',selected.options.map((option,index)=>index===i?value:option));}
  function removeOption(i) {remember();sheet={...sheet,blocks:sheet.blocks.map(block=>block.id===selectedId?{...block,options:block.options.filter((_,index)=>index!==i),correct:block.correct.filter(n=>n!==i).map(n=>n>i?n-1:n)}:block)};}
  function updatePair(index,side,value){updateBlock(side,selected[side].map((item,i)=>i===index?value:item));}
  function addPair(){if(!selected||selected.left.length>=8)return;remember();sheet={...sheet,blocks:sheet.blocks.map(block=>block.id===selectedId?{...block,left:[...block.left,''],right:[...block.right,'']}:block)};}
  function removePair(index){if(!selected||selected.left.length<=1)return;remember();sheet={...sheet,blocks:sheet.blocks.map(block=>block.id===selectedId?{...block,left:block.left.filter((_,i)=>i!==index),right:block.right.filter((_,i)=>i!==index)}:block)};}
  function setList(key,value) {
    const values=value.split('\n').slice(0,8);
    if(key==='left'||key==='right'){
      remember(selected.id+':'+key);
      const other=key==='left'?'right':'left';
      const paired=Array.from({length:values.length},(_,i)=>selected[other][i]||'');
      sheet={...sheet,blocks:sheet.blocks.map(block=>block.id===selectedId?{...block,[key]:values,[other]:paired}:block)};
    } else updateBlock(key,values);
  }
  function drop(event,id) {event.preventDefault();const from=sheet.blocks.findIndex(block=>block.id===draggedId);const to=sheet.blocks.findIndex(block=>block.id===id);if(from>=0&&to>=0&&from!==to)move(draggedId,to);draggedId=null;dropId=null;}
  async function loadImage(event) {
    const file=event.currentTarget.files?.[0];const id=selectedId;if(!file)return;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>2*1024*1024){message=ui('imageError');return;}
    const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);}).catch(()=>null);
    if(!data){message=ui('imageError');return;}
    // Keep the upload attached to the block that requested it, even if selection changed.
    if(!sheet.blocks.some(block=>block.id===id))return;
    const next={...sheet,blocks:sheet.blocks.map(block=>block.id===id?{...block,image:data}:block)};try{worksheetFileJSON(next);}catch{message=ui('projectTooLarge');return;}remember();sheet=next;
  }
  function exportProject() {
    let json;try{json=worksheetFileJSON(sheet);}catch{message=ui('projectTooLarge');return;}
    const url=URL.createObjectURL(new Blob([json],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download=(sheet.title||'worksheet').replace(/[\\/:*?"<>|]/g,'-')+'.evrika.json';link.click();dirty=false;setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function importProject(event) {
    const file=event.currentTarget.files?.[0];event.currentTarget.value='';if(!file)return;
    try {
      if(file.size>WORKSHEET_FILE_LIMIT)throw new Error('Too large');
      const imported=normalizeWorksheet(JSON.parse(await file.text()));
      if(dirty&&!await confirmDiscard(unsavedMessage($lang)))return;dirty=false;
      sheet={...imported,id:uid()};past=[];future=[];selectedId=null;panel='document';showTemplates=false;
    }catch{message=ui('importError');}
  }
  async function print() {if(printing||oversized.length||headerTooTall)return;printing=true;try{await printWorksheet(pagesElement,sheet.title);}catch{message=ui('printError');}finally{printing=false;}}
  function modalFocus(node) {
    const previous=document.activeElement;
    queueMicrotask(()=>node.focus());
    const trap=event=>{
      if(event.key!=='Tab')return;
      const items=[...node.querySelectorAll('button,input,select,textarea,a[href]')].filter(item=>!item.disabled&&item.getClientRects().length);
      if(!items.length){event.preventDefault();return;}
      const first=items[0],last=items.at(-1);
      if(event.shiftKey&&(document.activeElement===first||document.activeElement===node)){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&(document.activeElement===last||document.activeElement===node)){event.preventDefault();first.focus();}
    };
    node.addEventListener('keydown',trap);
    return {destroy(){node.removeEventListener('keydown',trap);previous?.focus();}};
  }
  function keyboard(event) {
    if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='z'&&!['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName)){event.preventDefault();event.shiftKey?redo():undo();}
    if(event.key==='Escape'){mobilePanel=null;showTemplates=false;message='';}
  }
</script>

<svelte:window on:keydown={keyboard} />
<svelte:head><title>{ui('title')} — EvrikaEdu</title></svelte:head>

<div class="builder">
  <div class="studio-heading">
    <div><div class="studio-eyebrow">EVRIKA · {ui('nav')}</div><h1>{ui('title')}</h1><p>{ui('subtitle')}</p></div>
    <span class="session-notice">{lessonLabel($lang, 'noStorage')}</span>
  </div>
  <div class="studio-toolbar">
    <div class="toolbar-group">
      <button class="studio-button" on:click={()=>showTemplates=true}><span>＋</span>{ui('new')}</button>
      <div class="toolbar-divider"></div>
      <button class="icon-button" title={ui('undo')} aria-label={ui('undo')} disabled={!past.length} on:click={undo}>↶</button>
      <button class="icon-button" title={ui('redo')} aria-label={ui('redo')} disabled={!future.length} on:click={redo}>↷</button>

    </div>
    <div class="toolbar-group toolbar-right">
      <button class="studio-button" class:active={preview} on:click={()=>{preview=!preview;mobilePanel=null;}}><span>◉</span>{preview?ui('edit'):ui('preview')}</button>
      <button class="studio-button primary" disabled={printing||!!oversized.length||headerTooTall} on:click={print}><span>↗</span>{ui('print')}</button>
    </div>
  </div>
  <p class="session-warning">{lessonLabel($lang, 'memory')}</p>
  {#if oversized.length||headerTooTall}<div class="studio-alert" role="alert">{ui('tooTall')}</div>{/if}
  <details class="mobile-outline"><summary>{ui('outline')} <span>{sheet.blocks.length}</span></summary><div>{#each sheet.blocks as block,i}<button on:click={()=>selectBlock(block.id)}><span>{i+1}</span><div><b>{ui(block.type)}</b><p>{block.text||block.caption||ui(block.type)}</p></div><span>›</span></button>{/each}</div></details>
  <div class="studio-workspace" class:preview-mode={preview}>
    {#if mobilePanel}<button use:lockBodyScroll class="panel-backdrop" aria-label={ui('close')} on:click={()=>mobilePanel=null}></button>{/if}
    <aside class="block-library studio-panel" class:mobile-open={mobilePanel==='blocks'}>
      <div class="panel-heading"><div><h2>{ui('blocks')}</h2><p>{ui('blockHint')}</p></div><button class="icon-button mobile-close" aria-label={ui('close')} on:click={()=>mobilePanel=null}>×</button></div>
      <div class="block-palette">
        {#each BLOCK_TYPES as type}<button class="palette-item" disabled={sheet.blocks.length>=100} on:click={()=>addBlock(type)}><span class="palette-icon type-{type}">{ICONS[type]}</span><span><strong>{ui(type)}</strong><small>{ui(type+'Hint')}</small></span><span class="palette-plus">＋</span></button>{/each}
      </div>
      <div class="palette-bottom"><span>✦</span><p>{ui('printHint')}</p><button on:click={()=>showTemplates=true}>{ui('templates')} ↗</button></div>
    </aside>

    <section class="canvas-area" bind:this={canvas} aria-label={ui('preview')}>
      <div class="canvas-top"><span>A4 <span class="canvas-dot">·</span> {pages.length} {ui('page').toLowerCase()}</span><label class="answer-toggle"><input type="checkbox" bind:checked={showAnswers} />{ui('teacher')}</label><div class="zoom-controls"><button aria-label={$lang==='uz'?'Kichraytirish':$lang==='en'?'Zoom out':'Уменьшить'} on:click={()=>zoom=Math.max(.2,scale-.1)}>−</button><button title={$lang==='uz'?'Sahifani sig‘dirish':$lang==='en'?'Fit page':'По ширине'} on:click={()=>zoom=null}>{Math.round(scale*100)}%</button><button aria-label={$lang==='uz'?'Kattalashtirish':$lang==='en'?'Zoom in':'Увеличить'} on:click={()=>zoom=Math.min(1.4,scale+.1)}>＋</button></div></div>
      <div class="paper-pages" bind:this={pagesElement}>
        {#each pages as pageBlocks,pageIndex}
          <div class="ws-page-shell" style="width:{794*scale}px;height:{1123*scale}px;">
            <article class="ws-page" class:ws-compact={sheet.compact} style="--ws-accent:{THEMES[sheet.theme]};transform:scale({scale});transform-origin:top left;">
              {#if pageIndex===0}
                <header class="ws-page-header"><div class="ws-eyebrow">{sheet.subject || paper('nav')}{sheet.grade?` · ${sheet.grade}`:''}</div><h1>{sheet.title || paper('untitled')}</h1>{#if sheet.instructions}<div class="ws-instructions">{sheet.instructions}</div>{/if}{#if sheet.studentFields}<div class="ws-student"><span>{paper('name')}:</span><span>{paper('date')}:</span></div>{/if}</header>
              {:else}<div class="ws-continuation">{sheet.title}</div>{/if}
              <div class="ws-page-blocks">
                {#each pageBlocks as block (block.id)}
                  <div class="ws-block-shell" class:selected={selectedId===block.id&&!preview} class:drop-target={dropId===block.id} role="button" tabindex={preview?-1:0} aria-label={`${ui('select')}: ${ui(block.type)}`} on:click={()=>selectBlock(block.id)} on:keydown={(e)=>{if(e.target===e.currentTarget&&(e.key==='Enter'||e.key===' ')){e.preventDefault();selectBlock(block.id);}}} on:dragover={(e)=>{if(draggedId){e.preventDefault();dropId=block.id;}}} on:drop={(e)=>drop(e,block.id)}>
                    {#if !preview}
                      <div class="block-tools" data-editor>
                        <button class="drag-handle" draggable="true" title={ui('drag')} aria-label={ui('drag')} on:dragstart={(e)=>{draggedId=block.id;e.dataTransfer.setData('text/plain',block.id);e.dataTransfer.effectAllowed='move';}} on:dragend={()=>{draggedId=null;dropId=null;}}>⠿</button>
                        <span>{ui(block.type)}</span>
                        {#if selectedId===block.id}
                          <button aria-label={ui('up')} title={ui('up')} disabled={selectedIndex===0} on:click|stopPropagation={()=>move(block.id,selectedIndex-1)}>↑</button>
                          <button aria-label={ui('down')} title={ui('down')} disabled={selectedIndex===sheet.blocks.length-1} on:click|stopPropagation={()=>move(block.id,selectedIndex+1)}>↓</button>
                          <button aria-label={ui('duplicate')} title={ui('duplicate')} on:click|stopPropagation={duplicate}>⧉</button>
                          <button class="danger" aria-label={ui('remove')} title={ui('remove')} on:click|stopPropagation={remove}>×</button>
                        {/if}
                      </div>
                    {/if}
                    <WorksheetBlock {block} language={sheet.language} number={sheet.numbers?(numbers[block.id]??null):null} answers={showAnswers}/>
                  </div>
                {/each}
              </div>
              {#if !sheet.blocks.some(block=>block.type!=='pagebreak')}
                <div class="paper-empty" data-editor><span>＋</span><h2>{ui('empty')}</h2><p>{ui('emptyHint')}</p><button class="studio-button" on:click={()=>addBlock('answer')}>{ui('addFirst')}</button></div>
              {/if}
              <footer class="ws-page-footer"><span>EvrikaEdu · {sheet.audience==='teacher'?paper('teacherPlan'):showAnswers?paper('teacher'):paper('student')}</span><span>{pageIndex+1} / {pages.length}</span></footer>
            </article>
          </div>
        {/each}
      </div>
      <div class="canvas-bottom"><span>＋</span><button on:click={()=>{preview=false;mobilePanel='blocks';}}>{ui('addBlock')}</button><span>·</span><button on:click={()=>showTemplates=true}>{ui('templates')}</button></div>
    </section>

    <aside class="inspector studio-panel" class:mobile-open={mobilePanel==='settings'}>
      <div class="inspector-tabs"><button class:active={panel==='document'} on:click={()=>panel='document'}>{ui('document')}</button><button class:active={panel==='block'} on:click={()=>panel='block'}>{ui('block')}</button><button class="icon-button mobile-close" aria-label={ui('close')} on:click={()=>mobilePanel=null}>×</button></div>
      <div class="inspector-body">
        {#if panel==='document'}
          <div class="inspector-section"><span class="section-caption">01 / {ui('document')}</span>
            <label>{ui('titleField')}<textarea rows="2" maxlength="180" value={sheet.title} on:input={(e)=>changeSheet('title',e.currentTarget.value)}></textarea></label>
            <div class="field-grid"><label>{ui('subject')}<input maxlength="180" value={sheet.subject} on:input={(e)=>changeSheet('subject',e.currentTarget.value)} /></label><label>{ui('grade')}<input maxlength="40" value={sheet.grade} on:input={(e)=>changeSheet('grade',e.currentTarget.value)} /></label></div>
            <label>{ui('audience')}<select value={sheet.audience} on:change={(e)=>changeSheet('audience',e.currentTarget.value)}><option value="student">{ui('studentWorksheet')}</option><option value="teacher">{ui('teacherPlan')}</option></select></label><label>{ui('instructions')}<textarea rows="3" maxlength="1500" value={sheet.instructions} on:input={(e)=>changeSheet('instructions',e.currentTarget.value)}></textarea></label>
            <label>{ui('language')}<select value={sheet.language} on:change={(e)=>changeSheet('language',e.currentTarget.value)}><option value="ru">Русский</option><option value="uz">O‘zbekcha</option><option value="en">English</option></select></label>
          </div>
          <div class="inspector-section"><span class="section-caption">02 / {ui('theme')}</span>
            <div class="theme-options">{#each Object.keys(THEMES) as theme}<button aria-label={ui(theme)} title={ui(theme)} class:active={sheet.theme===theme} style="--swatch:{THEMES[theme]}" on:click={()=>changeSheet('theme',theme)}><span></span>{ui(theme)}</button>{/each}</div>
            <label class="switch-label"><input type="checkbox" checked={sheet.studentFields} on:change={(e)=>changeSheet('studentFields',e.currentTarget.checked)} />{ui('studentFields')}</label>
            <label class="switch-label"><input type="checkbox" checked={sheet.numbers} on:change={(e)=>changeSheet('numbers',e.currentTarget.checked)} />{ui('numbers')}</label>
            <label class="switch-label"><input type="checkbox" checked={sheet.compact} on:change={(e)=>changeSheet('compact',e.currentTarget.checked)} />{ui('compact')}</label>
          </div>
          <div class="inspector-section project-actions"><button class="studio-button" on:click={exportProject}>↓ {ui('export')}</button><button class="studio-button subtle" on:click={()=>projectInput.click()}>↑ {ui('import')}</button><p>{ui('projectHint')}</p></div>
        {:else if selected}
          <div class="inspector-section"><div class="selected-heading"><span class="palette-icon">{ICONS[selected.type]}</span><div><span class="section-caption">{ui('selectedBlock')}</span><h3>{ui(selected.type)}</h3></div></div>
            {#if selected.type==='pagebreak'}<p class="field-hint">{ui('pagebreakNote')}</p>
            {:else}
              {#if selected.type!=='image'}<label>{ui(['heading','text','gaps','wordparts'].includes(selected.type)?'content':'question')}<textarea bind:this={blockTextInput} rows={['text','gaps','wordparts'].includes(selected.type)?8:3} maxlength={['text','gaps','wordparts'].includes(selected.type)?3000:500} value={selected.text} on:input={(e)=>updateBlock('text',e.currentTarget.value)}></textarea></label>{/if}
              {#if ['gaps','wordparts'].includes(selected.type)}<p class="field-hint">{ui('gapsHelp')}</p><button class="studio-button" on:click={markGap}>{ui('markGap')}</button><label class="switch-label"><input type="checkbox" checked={selected.wordBank} on:change={(e)=>updateBlock('wordBank',e.currentTarget.checked)} />{ui('wordBank')}</label>{/if}
              {#if selected.type==='answer'}<label>{ui('lines')}<div class="range-field"><input type="range" min="1" max="10" value={selected.lines} on:input={(e)=>updateBlock('lines',Number(e.currentTarget.value))} /><span>{selected.lines}</span></div></label>{/if}
              {#if selected.type==='choice'}
                <label class="switch-label"><input type="checkbox" checked={selected.multiple} on:change={(e)=>updateBlock('multiple',e.currentTarget.checked)} />{ui('multiple')}</label>
                <div class="field-label">{ui('options')}</div><p class="field-hint">{ui('correct')}</p>
                {#each selected.options as option,i}<div class="option-editor"><button class="correct-toggle" class:active={selected.correct.includes(i)} aria-label={`${ui('correct')} ${i+1}`} aria-pressed={selected.correct.includes(i)} on:click={()=>toggleCorrect(i)}>{selected.correct.includes(i)?'✓':String.fromCharCode(65+i)}</button><input aria-label={`${ui('option')} ${i+1}`} value={option} maxlength="180" on:input={(e)=>updateOption(i,e.currentTarget.value)} /><button class="remove-option" aria-label={`${ui('remove')} ${ui('option')} ${i+1}`} disabled={selected.options.length<=2} on:click={()=>removeOption(i)}>×</button></div>{/each}
                <button class="add-option" disabled={selected.options.length>=8} on:click={()=>updateBlock('options',[...selected.options,''])}>＋ {ui('addOption')}</button>
              {/if}
              {#if selected.type==='checklist'}<label>{ui('items')}<textarea rows="7" maxlength="1400" value={selected.items.join('\n')} on:input={(e)=>setList('items',e.currentTarget.value)}></textarea></label><p class="field-hint">{ui('onePerLine')}</p>{/if}
              {#if selected.type==='matching'}<p class="field-hint">{ui('pairsHint')}</p><div class="pair-editor">{#each selected.left as item,i}<div class="pair-row"><span>{i+1}</span><div><input aria-label={`${ui('leftColumn')} ${i+1}`} placeholder={ui('leftColumn')} maxlength="180" value={item} on:input={(e)=>updatePair(i,'left',e.currentTarget.value)}/><input aria-label={`${ui('rightColumn')} ${i+1}`} placeholder={ui('rightColumn')} maxlength="180" value={selected.right[i]||''} on:input={(e)=>updatePair(i,'right',e.currentTarget.value)}/></div><button class="remove-option" aria-label={`${ui('remove')} ${ui('pair')} ${i+1}`} disabled={selected.left.length<=1} on:click={()=>removePair(i)}>×</button></div>{/each}</div><button class="add-option" disabled={selected.left.length>=8} on:click={addPair}>＋ {ui('addPair')}</button>{/if}
              {#if selected.type==='table'}<div class="field-grid"><label>{ui('rows')}<input type="number" min="1" max="10" value={selected.rows} on:change={(e)=>updateBlock('rows',Math.max(1,Math.min(10,Number(e.currentTarget.value)||3)))} /></label><label>{ui('columns')}<input type="number" min="2" max="5" value={selected.columns} on:change={(e)=>updateBlock('columns',Math.max(2,Math.min(5,Number(e.currentTarget.value)||3)))} /></label></div><label>{ui('headers')}<textarea rows="5" maxlength="900" value={selected.headers.join('\n')} on:input={(e)=>updateBlock('headers',e.currentTarget.value.split('\n').slice(0,5))}></textarea></label><p class="field-hint">{ui('onePerLine')}</p>{/if}
              {#if ['answer','table'].includes(selected.type)}<label>{ui('expected')}<textarea rows="3" maxlength="1000" value={selected.answer} on:input={(e)=>updateBlock('answer',e.currentTarget.value)}></textarea></label><p class="field-hint">{ui('expectedHint')}</p>{/if}
              {#if selected.type==='image'}<label class="image-upload">▧<span>{ui('imageUpload')}</span><input type="file" accept="image/png,image/jpeg,image/webp" on:change={loadImage} /></label><p class="field-hint">{ui('imageHintUpload')}</p>{#if selected.image}<button class="add-option" on:click={()=>updateBlock('image','')}>{ui('remove')}</button>{/if}<label>{ui('caption')}<textarea rows="2" maxlength="500" value={selected.caption} on:input={(e)=>updateBlock('caption',e.currentTarget.value)}></textarea></label>{/if}
            {/if}
          </div>
          <div class="inspector-section block-actions"><div class="field-grid"><button class="studio-button" disabled={selectedIndex===0} on:click={()=>move(selectedId,selectedIndex-1)}>↑ {ui('up')}</button><button class="studio-button" disabled={selectedIndex===sheet.blocks.length-1} on:click={()=>move(selectedId,selectedIndex+1)}>↓ {ui('down')}</button></div><button class="studio-button" on:click={duplicate}>⧉ {ui('duplicate')}</button><button class="studio-button danger" on:click={remove}>× {ui('remove')}</button></div>
        {:else}<div class="inspector-empty"><span>↖</span><p>{ui('editHint')}</p></div>{/if}
      </div>
      {#if sheet.blocks.some(block=>block.type==='pagebreak')}<div class="pagebreak-list">{#each sheet.blocks.filter(block=>block.type==='pagebreak') as block}<button on:click={()=>{selectedId=block.id;panel='block';}}>{ICONS.pagebreak} {ui('pagebreak')}<span>↗</span></button>{/each}</div>{/if}
    </aside>
  </div>
  <div class="mobile-builder-tools"><button on:click={()=>{preview=false;mobilePanel='blocks';}}>＋ {ui('blocks')}</button><button class:active={mobilePanel==='settings'} on:click={()=>{preview=false;mobilePanel='settings';}}><span>⚙</span> {ui('settings')}</button></div>
</div>
<input class="sr-only" type="file" accept="application/json,.json" bind:this={projectInput} on:change={importProject} tabindex="-1" aria-label={ui('import')} />

<!-- Measure at the same unscaled A4 width used on paper. -->
<div class="worksheet-measure" aria-hidden="true" bind:this={measureRoot}><div class="ws-page" class:ws-compact={sheet.compact} style="height:auto;--ws-accent:{THEMES[sheet.theme]}"><header class="ws-page-header"><div class="ws-eyebrow">{sheet.subject || paper('nav')}{sheet.grade?` · ${sheet.grade}`:''}</div><h1>{sheet.title || paper('untitled')}</h1>{#if sheet.instructions}<div class="ws-instructions">{sheet.instructions}</div>{/if}{#if sheet.studentFields}<div class="ws-student"><span>{paper('name')}:</span><span>{paper('date')}:</span></div>{/if}</header>{#each sheet.blocks.filter(block=>block.type!=='pagebreak') as block}<div data-measure-id={block.id}><WorksheetBlock {block} language={sheet.language} number={sheet.numbers?(numbers[block.id]??null):null} answers={showAnswers} /></div>{/each}</div></div>

{#if showTemplates || message}
  <div use:lockBodyScroll class="studio-modal-backdrop" role="presentation" on:click|self={()=>{showTemplates=false;message='';}}>
    <div use:modalFocus class="studio-modal" role="dialog" aria-modal="true" aria-label={ui(message?'close':'chooseTemplate')} tabindex="-1">
      <button class="modal-close icon-button" aria-label={ui('close')} on:click={()=>{showTemplates=false;message='';}}>×</button>
      {#if message}<h2>{message}</h2><button class="studio-button primary" on:click={()=>message=''}>{ui('close')}</button>
      {:else}
        <div class="studio-eyebrow">EVRIKA · STUDIO</div><h2>{ui('chooseTemplate')}</h2><p>{ui('chooseHint')}</p><div class="template-grid">{#each templates as template}<button class="template-card" on:click={()=>newSheet(template)}><div class="template-preview preview-{template}"><span class="template-paper"><b></b><i></i><i></i>{#if template==='scenario'}<em>① → ② → ③</em>{:else if template==='teacherScenario'}<em>✎　◷　☑</em>{:else if template==='languagePractice'}<em>_ _　⇄　Ab</em>{:else if template==='knowledge'}<em>◉　○　○</em>{:else if template==='reading'}<em>▦</em>{:else if template==='reflection'}<em>☆　☆　☆</em>{:else}<em>＋</em>{/if}<i></i><i></i></span></div><strong>{ui(template)}</strong><small>{ui(template+'Hint')}</small><span class="template-use">{ui('useTemplate')} ↗</span></button>{/each}</div>
      {/if}
    </div>
  </div>
{/if}

<style>
.mobile-outline{display:none;}@media(max-width:850px){.mobile-outline{display:block;border:1px solid #e5dbef;background:#fff;border-radius:14px;margin:14px 0;padding:0 14px;}.mobile-outline summary{display:flex;align-items:center;justify-content:space-between;min-height:48px;font-size:13px;font-weight:600;color:#72518d;cursor:pointer;}.mobile-outline summary>span{background:#f1e7fc;border-radius:8px;padding:3px 8px;font-size:10px;}.mobile-outline>div{max-height:280px;overflow:auto;padding-bottom:8px;}.mobile-outline button{display:flex;align-items:center;gap:12px;width:100%;min-height:58px;padding:10px 2px;border-top:1px solid #f0e9f5;text-align:left;}.mobile-outline button>span{color:#ab91bd;font-size:12px;}.mobile-outline button>div{flex:1;min-width:0;}.mobile-outline b{font-size:12px;font-weight:600;color:#66447f;}.mobile-outline p{font-size:12px;line-height:1.5;color:#96809f;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;margin-top:3px;}}

  .builder {--studio-purple:#7955b2;--studio-ink:#302a3b;color:var(--studio-ink);margin:-4px -4px 40px;}
  .session-notice{font-size:11px;color:#8d7b9d;}.session-toolbar-note{font-size:9px;max-width:200px;line-height:1.5;color:#9b8aa9;margin-left:10px;}
  @media(max-width:850px){.session-notice,.session-toolbar-note{display:none;}}
  .session-warning{font-size:10px;color:#8d7a9d;background:#faf7fc;padding:8px 16px;}
  .studio-heading {display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:24px;}
  .studio-eyebrow {font-size:10px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:#735397;margin-bottom:7px;}
  .studio-heading h1 {font-size:clamp(22px,2.7vw,30px);font-weight:700;line-height:1.2;letter-spacing:-0.8px;}
  .studio-heading p {font-size:13px;color:#70617f;margin-top:8px;}
  .studio-button,.icon-button {display:inline-flex;align-items:center;justify-content:center;gap:8px;border:1px solid #e5dfed;background:white;border-radius:10px;font-size:12px;font-weight:600;color:#50465c;min-height:37px;padding:8px 12px;transition:background .15s,box-shadow .15s;cursor:pointer;white-space:nowrap;}
  .studio-button:hover,.icon-button:hover {background:#f5f0fb;}
  .studio-button:focus-visible,.icon-button:focus-visible,.palette-item:focus-visible {outline:2px solid #9470c6;outline-offset:3px;}
  .studio-button:disabled,.icon-button:disabled {opacity:.35;cursor:default;}
  .studio-button.primary {background:#7955b2;color:white;border-color:#7955b2;box-shadow:0 3px 8px #7955b225;}
  .studio-button.primary:hover {background:#69459f;}
  .studio-button.subtle {background:#ffffff70;}
  .studio-button.active {background:#eee6f9;color:#7045a7;border-color:#cdb8e9;}
  .studio-button>span:first-child {font-size:17px;line-height:1;}

  .icon-button {width:34px;padding:4px;font-size:20px;}
  .studio-toolbar {display:flex;gap:16px;justify-content:space-between;align-items:center;background:#ffffffd9;border:1px solid #ffffffd0;border-radius:16px 16px 0 0;padding:12px 16px;}
  .toolbar-group {display:flex;align-items:center;gap:5px;}
  .toolbar-right {gap:8px;}
  .toolbar-divider {height:20px;width:1px;background:#e9e2ef;margin:0 5px;}


  .studio-workspace {display:grid;grid-template-columns:218px minmax(200px,1fr) 260px;align-items:start;border:1px solid #ffffffb0;border-top:1px solid #e8e1ed;border-radius:0 0 16px 16px;background:#eeebf2;overflow:visible;}
  .studio-panel {background:#fff;position:sticky;top:70px;max-height:calc(100vh - 90px);overflow-y:auto;align-self:start;}
  .block-library {border-right:1px solid #e8e4ed;}
  .panel-heading {display:flex;justify-content:space-between;gap:8px;padding:23px 17px 17px;}
  .panel-heading h2 {font-size:13px;font-weight:700;}
  .panel-heading p {font-size:10px;color:#9b91a4;line-height:1.5;margin-top:6px;}
  .block-palette {padding:0 9px;display:flex;flex-direction:column;gap:3px;}
  .palette-item {display:flex;text-align:left;align-items:center;gap:10px;width:100%;padding:10px 8px;border-radius:10px;transition:background .15s;}
  .palette-item:hover {background:#f6f1fc;}
  .palette-item:disabled {opacity:.35;}
  .palette-icon {width:31px;height:34px;flex-shrink:0;border-radius:8px;background:#f0ebf7;color:#8965b5;display:inline-flex;align-items:center;justify-content:center;font-size:19px;font-family:Arial,sans-serif;font-weight:600;}
  .palette-item strong {font-size:11px;display:block;font-weight:600;line-height:1.4;}
  .palette-item small {font-size:9px;line-height:1.4;color:#a095a8;display:block;margin-top:3px;}
  .palette-plus {margin-left:auto;color:#b9a9cb;font-size:14px;}
  .type-answer,.type-table {background:#eaf3f0;color:#4c8b76;}
  .type-choice,.type-image {background:#fff1e6;color:#bf8c53;}
  .type-matching,.type-checklist {background:#edf1fc;color:#7989bb;}
  .palette-bottom {margin:24px 17px 0;padding:16px 12px;background:#faf8fc;border:1px solid #f1edf7;border-radius:10px;}
  .palette-bottom>span {color:#aa8fcc;font-size:21px;}
  .palette-bottom p {font-size:10px;line-height:1.6;color:#94859f;margin:5px 0 10px;}
  .palette-bottom button {font-size:10px;color:#7955b2;font-weight:700;}
  .canvas-area {min-width:0;padding:0 0 24px;background-color:#edeaf1;background-image:radial-gradient(#d6d0de .7px,transparent .7px);background-size:12px 12px;overflow-x:auto;}
  .canvas-top {height:54px;padding:0 20px;display:flex;align-items:center;justify-content:space-between;gap:8px;color:#9b92a4;font-size:9px;}
  .zoom-controls {display:flex;align-items:center;gap:5px;}.zoom-controls button{padding:4px 5px;border-radius:4px;}.zoom-controls button:hover{background:#e1d9eb;}.zoom-controls button:first-child,.zoom-controls button:last-child{font-size:13px;}
  .canvas-dot {margin:0 6px;}
  .answer-toggle {display:flex;gap:5px;align-items:center;color:#81738f;cursor:pointer;}
  .answer-toggle input {accent-color:#7955b2;width:12px;height:12px;}
  .paper-pages {width:max-content;min-width:100%;padding:0 20px;box-sizing:border-box;display:flex;align-items:center;flex-direction:column;gap:24px;}
  .ws-page-shell {flex-shrink:0;box-shadow:0 3px 10px #51415c10,0 15px 40px #51415c10;}
  .ws-block-shell {position:relative;outline:1.5px solid transparent;outline-offset:8px;cursor:pointer;border-radius:3px;}
  .ws-block-shell:hover {outline-color:#e0d3f2;}
  .ws-block-shell.selected {outline-color:#9d7bc9;}
  .ws-block-shell.drop-target {outline-color:#4f9b86;outline-width:3px;}
  .block-tools {position:absolute;bottom:100%;right:-9px;display:flex;align-items:center;gap:3px;height:25px;background:#9470c0;color:white;border-radius:5px 5px 0 0;padding:0 5px;font-family:Arial,sans-serif;opacity:0;pointer-events:none;z-index:2;}
  .ws-block-shell.selected .block-tools,.ws-block-shell:hover .block-tools {opacity:1;pointer-events:auto;}
  .block-tools span {font-size:9px;margin:0 7px 0 2px;}
  .block-tools button {font-size:17px;width:21px;height:23px;color:white;border-radius:3px;display:flex;align-items:center;justify-content:center;}
  .block-tools button:hover {background:#ffffff25;}
  .block-tools button:disabled {opacity:.35;}
  .drag-handle {cursor:grab;}
  .paper-empty {padding:70px 20px;text-align:center;color:#a598b4;}
  .paper-empty>span {font-size:50px;font-weight:200;}
  .paper-empty h2 {font-size:18px;color:#80718f;margin:10px 0;}
  .paper-empty p {font-size:13px;max-width:300px;margin:0 auto 20px;}
  .canvas-bottom {display:flex;align-items:center;justify-content:center;gap:10px;font-size:10px;color:#a194ad;padding:25px 10px 0;}
  .canvas-bottom button:hover {color:#7955b2;}
  .inspector {border-left:1px solid #e8e4ed;}
  .inspector-tabs {display:flex;gap:4px;border-bottom:1px solid #eee9f3;padding:13px 15px 0;}
  .inspector-tabs>button:not(.mobile-close) {flex:1;padding:10px 0 13px;font-size:11px;color:#a498ad;border-bottom:2px solid transparent;}
  .inspector-tabs>button.active {color:#7955b2;border-color:#7955b2;font-weight:700;}
  .inspector-section {padding:20px 17px;border-bottom:1px solid #f0ecf5;}
  .section-caption {display:block;font-size:9px;letter-spacing:1px;text-transform:uppercase;font-weight:600;color:#b0a4bb;margin-bottom:15px;}
  .inspector label:not(.switch-label):not(.image-upload) {display:block;font-size:10px;font-weight:600;color:#796a87;margin-bottom:15px;}
  .inspector input:not([type='checkbox']):not([type='range']):not([type='file']),.inspector textarea,.inspector select {display:block;width:100%;border:1px solid #e5dfed;background:#fdfcfe;border-radius:8px;padding:9px 10px;color:#51465d;font-size:11px;line-height:1.5;box-shadow:none;margin-top:6px;min-width:0;}
  .inspector textarea {resize:vertical;min-height:55px;}
  .inspector input:focus,.inspector textarea:focus,.inspector select:focus {outline:2px solid #d9c8ee;outline-offset:1px;border-color:#ab8aca;}
  .field-grid {display:grid;grid-template-columns:1fr 1fr;gap:10px;}
  .theme-options {display:flex;gap:5px;margin-bottom:20px;}
  .theme-options button {flex:1;font-size:8px;color:#9b8da7;padding:9px 2px;border:1px solid #ede7f4;border-radius:8px;}
  .theme-options button.active {border-color:#b69acd;background:#faf6ff;color:#72528d;}
  .theme-options span {display:block;background:var(--swatch);width:18px;height:18px;border-radius:50%;margin:0 auto 7px;}
  .switch-label {display:flex;align-items:center;gap:9px;font-size:10px;color:#80718d;margin:14px 0;cursor:pointer;}
  .switch-label input {width:14px;height:14px;accent-color:#7955b2;}
  .project-actions {display:flex;flex-direction:column;gap:8px;}
  .project-actions p,.field-hint {font-size:9px;color:#a498ae;line-height:1.6;}
  .project-actions p {margin-top:4px;}
  .selected-heading {display:flex;gap:10px;align-items:center;margin-bottom:24px;}
  .selected-heading .section-caption {margin-bottom:4px;font-size:8px;}
  .selected-heading h3 {font-size:12px;font-weight:700;}
  .range-field {display:flex;align-items:center;gap:12px;margin-top:10px;}
  .range-field input {flex:1;min-width:0;accent-color:#7955b2;}
  .range-field span {background:#f2ecf8;border-radius:5px;padding:3px 7px;font-size:10px;color:#7955b2;}
  .field-label {font-size:10px;color:#796a87;font-weight:600;margin:20px 0 4px;}
  .option-editor {display:flex;align-items:center;gap:5px;margin:8px 0;}
  .option-editor input {margin:0!important;font-size:10px!important;}
  .correct-toggle {border:1px solid #dfd5eb;flex-shrink:0;width:24px;height:24px;border-radius:50%;color:#a497af;font-size:9px;}
  .correct-toggle.active {background:#e6f2ea;color:#2f7d56;border-color:#a7ceb7;}
  .remove-option {color:#b6a8c1;font-size:19px;}
  .remove-option:disabled {opacity:.3;}
  .add-option {font-size:10px;font-weight:600;color:#8962b4;margin:10px 0 16px;}
  .add-option:disabled {opacity:.3;}
  .block-actions {display:flex;flex-direction:column;gap:8px;}
  .danger {color:#bf707a;}
  .studio-button.danger {background:#fff8f8;}
  .inspector-empty {padding:50px 25px;color:#b0a1bb;text-align:center;}
  .inspector-empty span {font-size:40px;font-weight:200;}
  .inspector-empty p {font-size:11px;line-height:1.7;margin-top:15px;}
  .pagebreak-list {padding:12px;}
  .pagebreak-list button {display:flex;align-items:center;gap:8px;width:100%;padding:10px;font-size:10px;color:#a497ad;background:#faf8fc;border-radius:6px;margin-bottom:6px;}
  .pagebreak-list span {margin-left:auto;}
  .image-upload {display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;border:1px dashed #cbb7e2;background:#faf7fe;border-radius:10px;min-height:100px;color:#a080c2;font-size:30px;position:relative;cursor:pointer;}
  .image-upload span {font-size:11px;}
  .image-upload input {position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;}
  .preview-mode {grid-template-columns:minmax(0,1fr);}
  .preview-mode .studio-panel {display:none;}
  .preview-mode .ws-block-shell {cursor:default;outline:none;}
  .studio-alert {font-size:12px;padding:12px 16px;background:#fff4d9;color:#956224;}

  .worksheet-measure {position:fixed;left:-20000px;top:0;width:794px;visibility:hidden;pointer-events:none;}
  .mobile-builder-tools,.mobile-close,.panel-backdrop {display:none;}
  .studio-modal-backdrop {position:fixed;inset:0;background:#36213e55;backdrop-filter:blur(7px);z-index:100;display:flex;align-items:center;justify-content:center;padding:24px;}
  .studio-modal {background:#fefcff;border-radius:24px;padding:32px;max-width:810px;width:100%;max-height:85vh;overflow:auto;box-shadow:0 25px 80px #33203d30;position:relative;}
  .studio-modal h2 {font-size:25px;font-weight:700;letter-spacing:-.5px;padding-right:20px;}
  .studio-modal>p {font-size:12px;color:#9788a4;margin:8px 0 24px;}
  .modal-close {position:absolute;right:15px;top:15px;}
  .template-grid {display:grid;grid-template-columns:repeat(4,1fr);gap:14px;}
  .template-card {border:1px solid #eee6f5;border-radius:14px;overflow:hidden;text-align:left;background:white;transition:transform .15s,border-color .15s;}
  .template-card:hover {border-color:#af8ed2;transform:translateY(-3px);}
  .template-preview {background:#f1eaf8;height:140px;display:flex;align-items:flex-end;justify-content:center;overflow:hidden;padding-top:20px;}
  .preview-knowledge {background:#eaf3ef;}.preview-reading {background:#fff0e5;}.preview-reflection {background:#eaedfa;}
  .template-paper {display:block;background:white;box-shadow:0 3px 12px #52395d15;width:90px;height:130px;transform:rotate(-6deg);padding:14px 12px;}
  .template-paper b {display:block;height:5px;width:75%;background:#bca6d3;margin-bottom:12px;}
  .template-paper i {display:block;height:2px;background:#e3dce9;margin:7px 0;}
  .template-paper em {display:block;padding:6px 0;font-size:16px;color:#b5a0cf;}
  .template-card>strong {display:block;font-size:12px;font-weight:700;padding:15px 12px 0;}
  .template-card>small {display:block;font-size:10px;color:#a294ac;line-height:1.6;padding:5px 12px 12px;}
  .template-use {display:block;font-size:9px;font-weight:700;color:#9574b7;border-top:1px solid #f2edf7;padding:11px 12px;}









  @media(min-width:1280px){.builder {margin-left:-10px;margin-right:-10px;}}
  @media(max-width:1100px){.studio-workspace {grid-template-columns:175px minmax(180px,1fr) 225px;}.palette-item small {display:none;}.palette-item strong {font-size:10px;}.palette-plus{display:none;}.palette-icon{width:28px;}.studio-heading h1{font-size:25px;}}
  @media(max-width:850px){.studio-workspace{display:block;position:relative;}.studio-panel{display:none;}.studio-panel.mobile-open{display:block;position:fixed;top:0;bottom:0;z-index:92;width:300px;height:100dvh;overflow:auto;min-height:0;max-height:100dvh;overscroll-behavior:contain;padding-bottom:env(safe-area-inset-bottom);}.block-library.mobile-open{left:0;}.inspector.mobile-open{right:0;}.palette-item small{display:block;}.palette-item strong{font-size:12px;}.panel-backdrop{display:block;position:fixed;inset:0;background:#36213e66;z-index:91;backdrop-filter:blur(3px);}.mobile-close{display:inline-flex;}.mobile-builder-tools{display:flex;position:sticky;bottom:78px;z-index:40;gap:5px;width:max-content;max-width:100%;margin:18px auto 0;padding:5px;background:#ffffffed;border:1px solid #e7deef;border-radius:14px;box-shadow:0 5px 24px #5c3d7220;}.mobile-builder-tools button{font-size:12px;font-weight:600;padding:9px 18px;color:#7955b2;border-radius:10px;}.mobile-builder-tools button:first-child{background:#f0e8f8;}.canvas-area{padding-bottom:10px;}.studio-heading{margin-bottom:18px;}.studio-heading h1{font-size:24px;}.studio-heading p{font-size:11px;}.template-grid{grid-template-columns:repeat(2,1fr);}.studio-modal{padding:28px 20px;}.studio-modal h2{font-size:22px;}}
  @media(max-width:540px){.builder{margin-left:-8px;margin-right:-8px;}.studio-heading{gap:10px;}.studio-eyebrow{font-size:8px;letter-spacing:1.2px;}.studio-heading h1{font-size:21px;max-width:260px;}.studio-heading p{font-size:10px;line-height:1.5;}.studio-toolbar{padding:10px;flex-wrap:wrap;gap:8px;}.toolbar-group{gap:4px;}.toolbar-group:first-child{flex:1;}.toolbar-right{width:100%;justify-content:space-between;}.toolbar-right .studio-button{flex:1;}.studio-button{font-size:12px;padding:9px 11px;min-height:44px;}.icon-button{width:44px;min-height:44px;}.studio-modal-backdrop{padding:12px;}.template-grid{gap:10px;}.template-preview{height:110px;}.canvas-top{padding:0 20px;height:44px;font-size:8px;}.paper-pages{gap:16px;}.mobile-builder-tools{bottom:75px;}.studio-modal{max-height:90vh;}}
.pair-row{display:flex;gap:8px;align-items:center;margin:12px 0;padding:8px;border:1px solid #e9e0f2;border-radius:12px;background:#faf8fd;}.pair-row>span{font-size:11px;color:#9c82af;}.pair-row>div{flex:1;min-width:0;}.pair-row input{font-size:13px!important;min-height:44px;}.pair-row .remove-option{min-width:36px;min-height:44px;}@media(max-width:850px){.inspector textarea,.inspector input:not([type=checkbox]):not([type=range]):not([type=file]){font-size:16px;} .inspector .studio-button{min-height:44px;}}
@media(max-width:850px){.inspector-tabs{position:sticky;top:0;background:#fff;z-index:2;}.pair-row input{font-size:16px!important;}}
</style>
