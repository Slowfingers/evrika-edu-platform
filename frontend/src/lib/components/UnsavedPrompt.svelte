<script>
  import { lockBodyScroll } from '#lib/utils/scroll-lock.js';
 import { onMount, tick } from 'svelte';
 import { lang } from '#lib/stores/lang.js';
 let pending=null;
 let stayButton;
 let dialogElement;
 let previous;
 $: labels=({ru:{title:'Выйти без скачивания?',stay:'Продолжить работу',leave:'Выйти'},uz:{title:'Yuklab olmasdan chiqasizmi?',stay:'Ishni davom ettirish',leave:'Chiqish'},en:{title:'Leave without downloading?',stay:'Keep editing',leave:'Leave'}})[$lang];
 onMount(()=>{
  const ask=async(event)=>{pending?.resolve(false);previous=document.activeElement;pending=event.detail;await tick();stayButton?.focus();};
  window.addEventListener('evrika:confirm-discard',ask);
  return()=>{window.removeEventListener('evrika:confirm-discard',ask);pending?.resolve(false);};
 });
 function answer(accepted){const request=pending;pending=null;request?.resolve(accepted);if(!accepted)previous?.focus();}
 function keys(event){if(!pending)return;if(event.key==='Escape'){event.preventDefault();answer(false);}if(event.key==='Tab'){const buttons=[...dialogElement.querySelectorAll('button')];if(event.shiftKey&&document.activeElement===buttons[0]){event.preventDefault();buttons.at(-1).focus();}else if(!event.shiftKey&&document.activeElement===buttons.at(-1)){event.preventDefault();buttons[0].focus();}}}
</script>
<svelte:window on:keydown={keys} />
{#if pending}
 <div use:lockBodyScroll class="discard-backdrop" role="presentation">
  <div class="discard-dialog" role="alertdialog" aria-modal="true" aria-labelledby="discard-title" aria-describedby="discard-message" tabindex="-1" bind:this={dialogElement}>
   <h2 id="discard-title">{pending.title||labels.title}</h2><p id="discard-message">{pending.message}</p>
   <div><button bind:this={stayButton} class="stay" on:click={()=>answer(false)}>{labels.stay}</button><button class="leave" on:click={()=>answer(true)}>{labels.leave}</button></div>
  </div>
 </div>
{/if}
<style>
.discard-backdrop{position:fixed;inset:0;z-index:20000;background:#26153280;backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;padding:20px;}.discard-dialog{width:100%;max-width:430px;border-radius:22px;padding:26px;background:white;box-shadow:0 20px 80px #21142c40;}h2{font-size:20px;line-height:1.4;font-weight:700;color:#4c345c;}p{font-size:14px;line-height:1.7;color:#8d7b99;margin:12px 0 24px;}.discard-dialog>div{display:flex;gap:10px;flex-wrap:wrap;}button{min-height:46px;flex:1;padding:10px 14px;border-radius:12px;font-size:13px;font-weight:600;}.stay{color:white;background:#7955b2;}.leave{color:#b66a75;background:#fcf2f4;}button:focus-visible{outline:2px solid #7955b2;outline-offset:3px;}
</style>
