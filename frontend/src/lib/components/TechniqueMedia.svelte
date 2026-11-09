<script>
 import media from '#lib/utils/technique-media.json';
 import {lockBodyScroll} from '#lib/utils/scroll-lock.js';
 import {dialogFocus} from '#lib/utils/dialog-focus.js';
 export let id;
 export let language='ru';
 let open=false,fullSize=false,failed=false;
 $: image=media[id];
 const labels={ru:{title:'Наглядный пример',zoom:'Рассмотреть',close:'Закрыть',source:'Источник',original:'Открыть изображение',fit:'По ширине',actual:'Крупнее',pan:'Изображение можно прокручивать в стороны.',error:'Изображение недоступно. Откройте источник.',changed:'Оптимизировано для сайта',en:'Подписи на английском',de:'Подписи на немецком',ru:'Подписи на русском',symbols:'Буквенные обозначения'},uz:{title:'Ko‘rgazmali namuna',zoom:'Kattalashtirish',close:'Yopish',source:'Manba',original:'Rasmni ochish',fit:'Kenglikka moslash',actual:'Yirikroq',pan:'Rasmni yon tomonga surib ko‘rish mumkin.',error:'Rasm ochilmadi. Manbani oching.',changed:'Sayt uchun optimallashtirilgan',en:'Yozuvlar ingliz tilida',de:'Yozuvlar nemis tilida',ru:'Yozuvlar rus tilida',symbols:'Harfli belgilar'},en:{title:'Visual example',zoom:'Enlarge',close:'Close',source:'Source',original:'Open image',fit:'Fit width',actual:'Larger view',pan:'Scroll sideways to explore the image.',error:'Image unavailable. Open the source.',changed:'Optimized for the website',en:'English labels',de:'German labels',ru:'Russian labels',symbols:'Letter labels'}};
 $: ui=labels[language]||labels.ru;
 $: caption=image?.caption[language]||image?.caption.ru;
 function close(){open=false;fullSize=false;}
</script>
{#if image}
 <section class="technique-media" aria-label={ui.title}>
  <header><h2>{ui.title}</h2><span>{ui[image.imageLanguage]}</span></header>
  {#if !failed}<button class="preview" on:click={()=>open=true} aria-label={ui.zoom}><img src={image.src} alt={caption} width={image.width} height={image.height} loading="lazy" decoding="async" on:error={()=>failed=true}/><span>{ui.zoom} ↗</span></button>{:else}<p class="error">{ui.error}</p>{/if}
  <p class="caption">{caption}</p>
  <p class="credit">{image.author} · <a href={image.licenseUrl} target="_blank" rel="noopener noreferrer">{image.license}</a> · <a href={image.source} target="_blank" rel="noopener noreferrer">{ui.source} ↗</a>{#if image.src.endsWith('.webp')}<span> · {ui.changed}</span>{/if}</p>
 </section>
 {#if open}
  <div class="media-overlay" use:lockBodyScroll>
   <button class="backdrop" on:click={close} aria-label={ui.close}></button>
   <div class="media-dialog" role="dialog" aria-modal="true" aria-label={ui.title} tabindex="-1" use:dialogFocus={close}>
    <header><h2>{ui.title}</h2><button class="close" on:click={close} aria-label={ui.close}>×</button></header>
    <div class="view-actions"><button on:click={()=>fullSize=!fullSize} aria-pressed={fullSize}>{fullSize?ui.fit:ui.actual}</button><a href={image.src} target="_blank" rel="noopener noreferrer">{ui.original} ↗</a></div>
    {#if fullSize}<p class="pan">{ui.pan}</p>{/if}
    <div class="image-scroll" tabindex="0" role="region" aria-label={ui.title}><img src={image.src} alt={caption} class:actual={fullSize} style:width={fullSize?`${Math.min(image.width,1600)}px`:'100%'} width={image.width} height={image.height}/></div>
    <p class="caption">{caption}</p><p class="credit">{image.author} · <a href={image.licenseUrl} target="_blank" rel="noopener noreferrer">{image.license}</a> · <a href={image.source} target="_blank" rel="noopener noreferrer">{ui.source} ↗</a></p>
   </div>
  </div>
 {/if}
{/if}
<style>
 .technique-media{margin:18px 0;padding:22px;border:1px solid #e7ddf1;border-radius:22px;background:#fff;color:#38234e;}header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;}h2{font-size:18px;font-weight:700;}header>span{font-size:11px;color:#79628c;}.preview{width:100%;display:block;position:relative;border:1px solid #eee8f5;border-radius:14px;overflow:hidden;background:#faf8fd;padding:15px;}.preview img{width:100%;height:auto;max-height:300px;object-fit:contain;}.preview>span{display:inline-flex;min-height:36px;align-items:center;margin-top:10px;padding:6px 12px;border-radius:24px;background:#ede4fa;color:#684099;font-size:12px;font-weight:600;}.caption{font-size:13px;line-height:1.65;margin-top:14px;}.credit{font-size:11px;line-height:1.7;color:#79658b;margin-top:8px;overflow-wrap:anywhere;}.credit a{text-decoration:underline;text-underline-offset:3px;}.media-overlay{position:fixed;inset:0;z-index:1000;padding:24px;display:grid;place-items:center;}.backdrop{position:absolute;inset:0;background:#20122d99;backdrop-filter:blur(4px);width:100%;height:100%;}.media-dialog{position:relative;width:min(100%,1050px);max-height:calc(100dvh - 48px);display:flex;flex-direction:column;min-height:0;background:white;border-radius:22px;padding:22px;color:#38234e;box-shadow:0 20px 80px #160e2d44;overflow:auto;}.close{width:44px;height:44px;flex-shrink:0;border-radius:50%;background:#f4eefb;font-size:24px;}.view-actions{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:12px;font-size:12px;}.view-actions button,.view-actions a{min-height:44px;padding:11px 14px;border:1px solid #e4d8f2;border-radius:10px;color:#674091;}.view-actions button[aria-pressed=true]{background:#eee5f9;}.image-scroll{overflow:auto;min-height:120px;max-height:60dvh;flex-shrink:0;border:1px solid #eee8f5;background:#faf9fc;border-radius:10px;overscroll-behavior:contain;}.image-scroll img{max-width:100%;height:auto;display:block;}.image-scroll img.actual{max-width:none;}.pan{font-size:12px;color:#79658b;margin-bottom:8px;}.error{font-size:13px;}button:focus-visible,a:focus-visible,.image-scroll:focus-visible{outline:3px solid #a475e6;outline-offset:3px;}@media(max-width:767px){.technique-media{padding:17px;border-radius:18px;}header{align-items:flex-start;flex-direction:column;gap:5px;}h2{font-size:17px;}.preview{padding:10px;}.preview img{max-height:220px;}.media-overlay{padding:10px;}.media-dialog{padding:16px;max-height:calc(100dvh - 20px);border-radius:18px;}.media-dialog header{flex-direction:row;align-items:center;}.image-scroll{max-height:55dvh;}.caption{font-size:13px;}}
</style>
