<script>
 import {page} from '$app/state';import {afterNavigate} from '$app/navigation';
 import {t,lang,LANGS} from '#lib/stores/lang.js';import {worksheetLabel} from '#lib/utils/worksheet-labels.js';import {designLabel} from '#lib/utils/design-labels.js';import UiIcon from './UiIcon.svelte';
 let languagesOpen=$state(false),toolsOpen=$state(false);
 let path=$derived(page.url.pathname);
 let ui=$derived(key=>designLabel($lang,key));
 let tools=$derived([{href:'/timer',label:$t('nav_timer'),icon:'clock'},{href:'/target',label:$t('nav_target'),icon:'target'},{href:'/classroom',label:$t('nav_class'),icon:'room'},{href:'/noisemeter',label:$t('nav_noise'),icon:'mic'}]);
 afterNavigate(()=>{languagesOpen=false;toolsOpen=false;});
 function outside(e){if(!e.target.closest('.language-picker'))languagesOpen=false;if(!e.target.closest('.desktop-tools'))toolsOpen=false;}
 function keys(e){if(e.key==='Escape'){languagesOpen=false;toolsOpen=false;}}
</script>
<svelte:window onclick={outside} onkeydown={keys}/>
<header class="app-header"><div class="header-inner">
 <a class="brand" href="/" aria-label="EvrikaEdu"><img src="/brand-mark.svg" alt="" width="38" height="38"/><span>evrikaedu</span></a>
 <nav class="desktop-navigation" aria-label={$t('nav_menu')}>
  <a href="/" class:active={path==='/'} aria-current={path==='/'?'page':undefined}><UiIcon name="grid"/>{$t('nav_catalog')}</a>
  <a href="/constructor" class:active={path==='/constructor'} aria-current={path==='/constructor'?'page':undefined}><UiIcon name="lesson"/>{$t('nav_constructor')}</a>
  <a href="/worksheets" class:active={path==='/worksheets'} aria-current={path==='/worksheets'?'page':undefined}><UiIcon name="sheet"/>{worksheetLabel($lang,'nav')}</a>
  <div class="desktop-tools"><button class:active={tools.some(tool=>tool.href===path)} aria-expanded={toolsOpen} onclick={()=>toolsOpen=!toolsOpen}><UiIcon name="spark"/>{ui('tools')}<UiIcon name="down" size={14}/></button>{#if toolsOpen}<div class="header-dropdown">{#each tools as tool}<a href={tool.href}><UiIcon name={tool.icon}/>{tool.label}</a>{/each}</div>{/if}</div>
 </nav>
 <div class="language-picker"><button aria-label={`${ui('language')}: ${LANGS.find(l=>l.code===$lang)?.label}`} aria-expanded={languagesOpen} aria-controls="language-list" onclick={()=>languagesOpen=!languagesOpen}><span>{LANGS.find(l=>l.code===$lang)?.label}</span><UiIcon name="down" size={14}/></button>{#if languagesOpen}<div id="language-list" class="header-dropdown">{#each LANGS as language}<button class:current={$lang===language.code} onclick={()=>{lang.set(language.code);languagesOpen=false;}}>{language.label}<span>{$lang===language.code?'✓':''}</span></button>{/each}</div>{/if}</div>
</div></header>
<style>
 .app-header{position:sticky;top:0;z-index:50;background:#ffffffee;border-bottom:1px solid #e9e2f3;backdrop-filter:blur(12px);}.header-inner{max-width:1280px;margin:auto;padding:0 24px;display:flex;align-items:center;gap:36px;min-height:74px;}.brand{display:flex;align-items:center;gap:9px;flex-shrink:0;}.brand span{font-size:24px;font-weight:800;letter-spacing:-1px;color:#28144d;}.brand img{width:38px;height:38px;}.desktop-navigation{display:flex;align-items:center;gap:5px;flex:1;}.desktop-navigation>a,.desktop-tools>button{display:flex;align-items:center;gap:8px;min-height:42px;padding:10px 13px;font-size:12px;font-weight:600;color:#67577d;border-radius:12px;white-space:nowrap;}.desktop-navigation>a:hover,.desktop-tools>button:hover{background:#f4eefb;}.desktop-navigation .active{background:#eee3ff;color:#7331d8;}.desktop-tools,.language-picker{position:relative;}.language-picker{margin-left:auto;}.language-picker>button{display:flex;align-items:center;gap:8px;min-height:44px;padding:8px 11px;border:1px solid #dfd2f0;border-radius:10px;background:#fbf9ff;color:#4c306f;font-size:12px;font-weight:600;}.header-dropdown{position:absolute;right:0;top:calc(100% + 10px);background:white;border:1px solid #e5d9f2;border-radius:15px;padding:6px;min-width:180px;box-shadow:0 10px 35px #40276315;}.header-dropdown>a,.header-dropdown>button{display:flex;align-items:center;gap:10px;width:100%;padding:11px 12px;border-radius:9px;text-align:left;font-size:13px;color:#665176;min-height:44px;}.header-dropdown>a:hover,.header-dropdown>button:hover,.header-dropdown .current{background:#f4edfc;}.header-dropdown>button{justify-content:space-between;}.language-picker .header-dropdown{min-width:120px;}@media(max-width:1050px){.header-inner{gap:18px;}.brand span{font-size:21px;}.desktop-navigation>a,.desktop-tools>button{font-size:11px;padding:9px 10px;gap:5px;}}@media(max-width:767px){.header-inner{min-height:60px;padding:0 16px;}.brand span{font-size:21px;}.brand img{width:32px;height:32px;}.desktop-navigation{display:none;}.language-picker>button{min-height:44px;}.header-dropdown>button{min-height:44px;}}
</style>
