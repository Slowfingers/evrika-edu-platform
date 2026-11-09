<script>
  import { worksheetLabel } from '#lib/utils/worksheet-labels.js';
  import { matchingOrder, matchingAnswers, gapTokens, gapWordBank } from '#lib/utils/worksheet-state.js';
  export let block;
  export let language = 'ru';
  export let number = null;
  export let answers = false;
  $: label = key => worksheetLabel(language,key);
  $: right = matchingOrder(block);
</script>

<div class="ws-block-content ws-type-{block.type}">
  {#if block.type === 'heading'}
    <h2>{block.text || label('heading')}</h2>
  {:else if block.type === 'text'}
    <div class="ws-reading">{block.text || label('text')}</div>
  {:else if ['gaps','wordparts'].includes(block.type)}
    <div class="ws-question">{#if number !== null}<span class="ws-question-number">{number}</span>{/if}<p>{label(block.type)}</p></div>
    <div class="ws-gap-text">{#each gapTokens(block.text) as part}{#if part.answer}{#if answers}<span class="ws-gap-key">{part.answer}</span>{:else}<span class="ws-gap-blank" aria-label={label('gap')} style:width={`${Math.min(180,Math.max(block.type==='wordparts'?42:75,part.answer.length*9))}px`}></span>{/if}{:else}{part.text}{/if}{/each}</div>
    {#if block.wordBank&&!answers}<div class="ws-word-bank"><strong>{label('wordBank')}:</strong> {gapWordBank(block.text).join(' · ')}</div>{/if}
  {:else if block.type === 'image'}
    {#if block.image}
      <figure><img src={block.image} alt={block.caption || label('image')} />{#if block.caption}<figcaption>{block.caption}</figcaption>{/if}</figure>
    {:else}<div class="ws-image-placeholder"><span>▧</span>{label('imageMissing')}</div>{/if}
  {:else if block.type !== 'pagebreak'}
    <div class="ws-question">
      {#if number !== null}<span class="ws-question-number">{number}</span>{/if}
      <p>{block.text || label(block.type)}</p>
    </div>
    {#if block.type === 'answer'}
      {#if answers && block.answer}<div class="ws-answer-key"><strong>{label('answerKey')}:</strong> {block.answer}</div>
      {:else}<div class="ws-answer-lines">{#each Array(block.lines) as _}<div></div>{/each}</div>{/if}
    {:else if block.type === 'choice'}
      <div class="ws-options">
        {#each block.options as option, i}
          <div class:ws-correct={answers && block.correct.includes(i)}><span class="ws-option-marker" class:ws-square={block.multiple}>{answers && block.correct.includes(i) ? '✓' : ''}</span><span>{option || `${label('option')} ${i+1}`}</span></div>
        {/each}
      </div>
    {:else if block.type === 'checklist'}
      <div class="ws-options">{#each block.items as item}<div><span class="ws-option-marker ws-square"></span><span>{item}</span></div>{/each}</div>
    {:else if block.type === 'matching'}
      <div class="ws-matching">
        <div>{#each block.left as item,i}<div><b>{i+1}</b><span>{item}</span><span class="ws-dot">●</span></div>{/each}</div>
        <div>{#each right as item,i}<div><span class="ws-dot">●</span><b>{String.fromCharCode(65+i)}</b><span>{item}</span></div>{/each}</div>
      </div>
      {#if answers}<div class="ws-answer-key"><strong>{label('matchingKey')}:</strong> {matchingAnswers(block)}</div>{/if}
    {:else if block.type === 'table'}
      <table><thead><tr>{#each Array(block.columns) as _,i}<th>{block.headers[i] || `${label('columns')} ${i+1}`}</th>{/each}</tr></thead><tbody>{#each Array(block.rows) as _}<tr>{#each Array(block.columns) as _}<td>&nbsp;</td>{/each}</tr>{/each}</tbody></table>
      {#if answers && block.answer}<div class="ws-answer-key"><strong>{label('answerKey')}:</strong> {block.answer}</div>{/if}
    {/if}
  {/if}
</div>
