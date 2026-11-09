<script>
 import {formatTimeDisplay} from '#lib/utils/time-intervals.js';
 import {getSkillName,getTypeName,localizeCard} from '#lib/utils/localization.js';
 import {lang} from '#lib/stores/lang.js';
 import {cardTone,displayCardTitle} from '#lib/utils/design-labels.js';
 import TechniqueIcon from './TechniqueIcon.svelte';
 import UiIcon from './UiIcon.svelte';
 export let card;
 export let returnTo='/';
 $: lcard=localizeCard(card,$lang);
</script>
<a href={`/${card.id}${returnTo!=='/'?'?catalog='+encodeURIComponent(returnTo):''}`} class={`technique-card tone-${cardTone(card.id)}`}>
 <div class="card-heading"><TechniqueIcon id={card.id}/><h3>{displayCardTitle(lcard.title)}</h3></div>
 <p class="description">{lcard.description}</p>
 <div class="card-meta"><span><UiIcon name="clock" size={14}/>{formatTimeDisplay(card.time_minutes,$lang)}</span>{#if card.types?.length}<span><UiIcon name="team" size={14}/>{getTypeName(card.types[0],$lang)}</span>{/if}</div>
 <div class="card-footer">{#if card.skills?.length}<span class="skill">{getSkillName(card.skills[0],$lang)}</span>{/if}<span class="open-arrow"><UiIcon name="arrow" size={18}/></span></div>
</a>
<style>
 .technique-card{display:flex;flex-direction:column;min-width:0;border:1px solid var(--card-border,#e0d3f3);background:linear-gradient(140deg,#fff 10%,var(--card-tint,#f3ebfc));border-radius:20px;padding:20px;box-shadow:0 2px 5px #33204c05;color:#27163f;transition:border-color .15s,box-shadow .15s;}.technique-card:hover{border-color:#b88cfa;box-shadow:0 5px 16px #6931ab0f;}.card-heading{display:flex;align-items:center;gap:13px;margin-bottom:14px;}.card-heading h3{font-size:16px;line-height:1.4;font-weight:750;letter-spacing:-.3px;overflow-wrap:anywhere;}p{font-size:13px;line-height:1.7;color:#736680;}.description{display:-webkit-box;-webkit-line-clamp:3;line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;margin:0 0 18px;flex:1;}.card-meta{display:flex;align-items:center;flex-wrap:wrap;gap:6px;}.card-meta>span{display:inline-flex;align-items:center;gap:5px;font-size:10px;color:#655373;background:#ffffffbf;border:1px solid #ffffff;border-radius:20px;padding:4px 7px;line-height:1.4;}.card-footer{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:13px;}.skill{display:inline-block;font-size:10px;line-height:1.5;font-weight:500;border-radius:20px;padding:4px 10px;background:#dbf2eb;color:#377367;}.open-arrow{width:30px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:white;color:#733aab;border:1px solid #ede4f7;margin-left:auto;flex-shrink:0;}.tone-lilac{--card-tint:#f0e6fd;--card-border:#e3d2f8;}.tone-sky{--card-tint:#e8f2fd;--card-border:#d5e4f6;}.tone-peach{--card-tint:#fff0df;--card-border:#f0dfca;}.tone-mint{--card-tint:#eaf6f1;--card-border:#d8e9e0;}.tone-rose{--card-tint:#fbeaf3;--card-border:#efd8e5;}
 @media(max-width:767px){.technique-card{padding:18px;border-radius:18px;}.card-heading{gap:13px;margin-bottom:10px;}.card-heading h3{font-size:17px;line-height:1.45;}.description{font-size:13px;margin-bottom:15px;-webkit-line-clamp:2;line-clamp:2;}.card-meta>span{font-size:11px;padding:4px 8px;}.skill{font-size:11px;}.card-footer{margin-top:11px;}.open-arrow{width:32px;height:32px;}}
</style>
