<script>
 import '../app.css';import {page} from '$app/state';import {afterNavigate} from '$app/navigation';import {t,lang} from '#lib/stores/lang.js';
 import {designLabel} from '#lib/utils/design-labels.js';import {lockBodyScroll} from '#lib/utils/scroll-lock.js';import {dialogFocus} from '#lib/utils/dialog-focus.js';
 import Header from '#lib/components/Header.svelte';import UiIcon from '#lib/components/UiIcon.svelte';import UnsavedPrompt from '#lib/components/UnsavedPrompt.svelte';
	/**
	 * @typedef {Object} Props
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props} */
	let { children } = $props();
 let toolsOpen=$state(false);
 let path=$derived(page.url.pathname);
 let ui=$derived(key=>designLabel($lang,key));
 let primary=$derived([{href:'/',key:'catalog',icon:'grid'},{href:'/constructor',key:'lesson',icon:'lesson'},{href:'/worksheets',key:'sheets',icon:'sheet'},{href:'/timer',key:'timer',icon:'clock'}]);
 let tools=$derived([{href:'/target',label:$t('nav_target'),icon:'target'},{href:'/classroom',label:$t('nav_class'),icon:'room'},{href:'/noisemeter',label:$t('nav_noise'),icon:'mic'}]);
 afterNavigate(()=>toolsOpen=false);
</script>
<Header/>
<main class="app-main max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">{@render children?.()}</main>
<nav class="mobile-nav" aria-label={$t('nav_menu')}>
 {#each primary as item}<a href={item.href} class:active={path===item.href} aria-current={path===item.href?'page':undefined} aria-label={ui(item.key)}><span class="nav-icon"><UiIcon name={item.icon} size={21}/></span><span>{ui(item.key)}</span></a>{/each}
 <button class:active={toolsOpen||tools.some(item=>item.href===path)} aria-label={ui('tools')} aria-expanded={toolsOpen} onclick={()=>toolsOpen=!toolsOpen}><span class="nav-icon"><UiIcon name="menu" size={21}/></span><span>{ui('more')}</span></button>
</nav>
{#if toolsOpen}<div class="tools-overlay" use:lockBodyScroll><button class="tools-backdrop" aria-label={$t('close')} onclick={()=>toolsOpen=false}></button><div role="dialog" aria-modal="true" aria-labelledby="tools-title" use:dialogFocus={()=>toolsOpen=false} class="tools-sheet"><div class="sheet-handle"></div><header><h2 id="tools-title">{ui('tools')}</h2><button class="close-tool" aria-label={$t('close')} onclick={()=>toolsOpen=false}><UiIcon name="close"/></button></header><div class="tool-links">{#each tools as item}<a href={item.href}><span><UiIcon name={item.icon} size={23}/></span><b>{item.label}</b><UiIcon name="chevron" size={17}/></a>{/each}</div></div></div>{/if}
<UnsavedPrompt/>
<style>
 .mobile-nav{display:none;}.tools-overlay{position:fixed;inset:0;z-index:110;}.tools-backdrop{position:absolute;inset:0;background:#25133755;backdrop-filter:blur(3px);width:100%;height:100%;}.tools-sheet{position:absolute;bottom:0;left:0;right:0;background:#fff;border-radius:26px 26px 0 0;padding:10px 20px calc(24px + env(safe-area-inset-bottom));box-shadow:0 -10px 40px #3b1a6315;max-height:85dvh;overflow:auto;}.sheet-handle{width:34px;height:4px;background:#ded4e9;border-radius:6px;margin:0 auto 15px;}.tools-sheet header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:15px;}.tools-sheet h2{font-size:19px;font-weight:750;color:#392052;}.close-tool{display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:50%;background:#f5effa;color:#856599;}.tool-links{display:flex;flex-direction:column;gap:8px;}.tool-links a{display:flex;gap:14px;align-items:center;border:1px solid #eae2f3;border-radius:15px;padding:12px;color:#593d76;}.tool-links a>span{width:45px;height:45px;display:grid;place-items:center;background:#f0e5ff;border-radius:12px;color:#8b4ed5;}.tool-links b{font-size:14px;font-weight:600;flex:1;}@media(min-width:768px){.tools-overlay{display:none;}}@media(max-width:767px){.mobile-nav{position:fixed;inset:auto 0 0;display:flex;align-items:flex-start;justify-content:space-around;background:#fffffffa;border-top:1px solid #e8e0f1;z-index:60;padding:7px 5px calc(7px + env(safe-area-inset-bottom));backdrop-filter:blur(12px);}.mobile-nav>a,.mobile-nav>button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;flex:1;min-width:0;color:#93829f;font-size:10px;font-weight:500;line-height:1.4;min-height:49px;}.nav-icon{width:42px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:10px;}.mobile-nav .active{color:#7733d7;}.active .nav-icon{background:#f0e5ff;}}
</style>
