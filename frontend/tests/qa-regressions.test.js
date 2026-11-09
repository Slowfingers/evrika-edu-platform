import test from 'node:test';
import assert from 'node:assert/strict';
import { BaseApi } from '../src/lib/api/base.api.js';
import { placeStudent } from '../src/lib/utils/classroom-state.js';
test('simultaneous catalog calls share one download',async()=>{
 let downloads=0;const cards=[{id:1,title:'A',created_at:'2026-01-01'}];
 const api=new BaseApi(async()=>{downloads++;await new Promise(resolve=>setTimeout(resolve,10));return {ok:true,json:async()=>cards};});
 await Promise.all([api.fetchStaticCards('/cards'),api.fetchStaticCards('/cards/1')]);assert.equal(downloads,1);
});
test('a failed catalog download can be retried',async()=>{
 let downloads=0;const api=new BaseApi(async()=>({ok:++downloads>1,status:503,json:async()=>[]}));
 await assert.rejects(api.loadStaticCards());assert.deepEqual(await api.loadStaticCards(),[]);assert.equal(downloads,2);
});
test('invalid card IDs never return the entire catalog',async()=>{
 const api=new BaseApi(async()=>({ok:true,json:async()=>[{id:1,title:'A'}]}));
 assert.equal((await api.fetchStaticCards('/cards/not-a-card')).data,null);
 assert.equal((await api.fetchStaticCards('/cards/1?source=catalog')).data.id,1);
});
test('cards with missing metadata are excluded by active filters',async()=>{
 const api=new BaseApi(async()=>({ok:true,json:async()=>[{id:1,title:'A'},{id:2,title:'B',skills:['critical']}]}));
 assert.deepEqual((await api.fetchStaticCards('/cards?skillIds=critical')).data.map(card=>card.id),[2]);
});
test('moving a seated student onto an occupied seat swaps students',()=>{
 const original={a:1,b:2,c:3};assert.deepEqual(placeStudent(original,1,'b'),{a:2,b:1,c:3});assert.deepEqual(original,{a:1,b:2,c:3});
 assert.deepEqual(placeStudent(original,4,'b'),{a:1,b:4,c:3});assert.deepEqual(placeStudent(original,1,'a'),original);
});

test('search tolerates whitespace around a pasted query',async()=>{
 const api=new BaseApi(async()=>({ok:true,json:async()=>[{id:1,title:'Test title'}]}));
 assert.equal((await api.fetchStaticCards('/cards?search='+encodeURIComponent('  Test title  '))).data.length,1);
});
