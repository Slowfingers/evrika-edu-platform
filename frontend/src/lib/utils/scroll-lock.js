let locks=0;
let previous='';
export function lockBodyScroll() {
 if(locks++===0){previous=document.body.style.overflow;document.body.style.overflow='hidden';}
 let active=true;
 return {destroy(){if(!active)return;active=false;locks=Math.max(0,locks-1);if(!locks)document.body.style.overflow=previous;}};
}
