import { beforeNavigate, goto } from '$app/navigation';
import { onMount } from 'svelte';
export const unsavedMessage = language => ({ru:'Изменения не сохранены в файл. Выйти и потерять введённые данные?',uz:'O‘zgarishlar faylga saqlanmagan. Chiqib, kiritilgan ma’lumotlarni yo‘qotasizmi?',en:'Your changes have not been downloaded. Leave and discard your work?'}[language] || 'Leave without saving?');
export function confirmDiscard(message,title) {
 return new Promise(resolve=>window.dispatchEvent(new CustomEvent('evrika:confirm-discard',{detail:{message,title,resolve}})));
}
export function useUnsavedChanges(isDirty,language,getPrompt) {
 let allowOnce=false;
 beforeNavigate(navigation=>{
  if(allowOnce){allowOnce=false;return;}
  if(!isDirty() || navigation.willUnload || (navigation.to?.url.pathname===navigation.from?.url.pathname && navigation.to?.url.search===navigation.from?.url.search))return;
  navigation.cancel();
  const prompt=getPrompt?.()||{message:unsavedMessage(language())};
  confirmDiscard(prompt.message,prompt.title).then(accepted=>{
   if(accepted&&navigation.to){allowOnce=true;if(navigation.type==='popstate'&&navigation.delta)history.go(navigation.delta);else goto(navigation.to.url.href).catch(()=>{allowOnce=false;});}
  });
 });
 onMount(()=>{
  const warn=event=>{if(isDirty()){event.preventDefault();event.returnValue='';}};
  window.addEventListener('beforeunload',warn);
  return()=>window.removeEventListener('beforeunload',warn);
 });
}
