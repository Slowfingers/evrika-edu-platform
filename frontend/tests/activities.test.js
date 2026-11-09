import test from 'node:test';
import assert from 'node:assert/strict';
import {fillSeats,parseClassroom,classroomSlots,placeStudent} from '../src/lib/utils/classroom-state.js';
import {targetPoint,targetStats,completeResponse} from '../src/lib/utils/target-state.js';
test('seating keeps occupied places, excludes absent students and never duplicates IDs',()=>{
 const students=[{id:1},{id:2},{id:3,absent:true},{id:4}];const slots=classroomSlots(2,2);
 const result=fillSeats(students,{'0_0':1,'0_1':1,'1_0':3},slots,false,()=>0);
 assert.equal(result['0_0'],1);assert.deepEqual(new Set(Object.values(result)),new Set([1,2,4]));assert.equal(Object.keys(result).length,3);
});
test('insufficient capacity leaves extras unseated and reshuffle removes stale places',()=>{
 const result=fillSeats([{id:1},{id:2},{id:3}],{'99_0':1},['0_0','0_1'],true,()=>0);
 assert.equal(Object.keys(result).length,2);assert.equal(result['99_0'],undefined);
});
test('placing an unseated student replaces occupant without creating a duplicate',()=>{
 assert.deepEqual(placeStudent({'0_0':1,'0_1':2},3,'0_0'),{'0_0':3,'0_1':2});
 assert.deepEqual(placeStudent({'0_0':1},1,'0_0'),{'0_0':1});
});
test('classroom import normalizes IDs and removes duplicate, absent and invalid placements',()=>{
 const s=parseClassroom({type:'evrika-classroom',version:1,count:1,capacity:4,students:[{id:20,name:'A'},{id:30,name:'B',absent:true}],seating:{'0_0':20,'0_1':20,'0_2':30,'9_0':20}});
 assert.deepEqual(s.seating,{'0_0':1});assert.throws(()=>parseClassroom({type:'other',students:[]}));
});
test('target hit testing distinguishes sectors and keeps center as the confident level',()=>{
 assert.deepEqual(targetPoint(250,150,4),{sector:0,level:1});
 assert.deepEqual(targetPoint(210,190,4),{sector:0,level:2});
 assert.equal(targetPoint(0,0,4),null);
});
test('unanswered topics stay missing, zero confidence remains a real response',()=>{
 const result=targetStats([{sector:0,level:0},{sector:0,level:2}],3);
 assert.equal(result.topics[0].positive,50);assert.equal(result.topics[1].positive,null);assert.equal(result.covered,1);
 assert.deepEqual(result.topics[0].distribution,[1,0,1]);
});
test('complete responses preserve zero values and reject missing or invalid levels',()=>{
 assert.deepEqual(completeResponse({0:0,1:2,2:9},4),[{sector:0,level:0},{sector:1,level:2}]);
});

test('white timer controls remain readable for every selectable stage color',async()=>{
 const {darkSurface}=await import('../src/lib/utils/color.js');
 const luminance=hex=>{const rgb=hex.slice(1).match(/../g).map(c=>parseInt(c,16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
 for(const color of ['#4ade80','#60a5fa','#facc15','#fb923c','#f87171','#a78bfa','#f472b6','#2dd4bf','#ffffff','#000000'])assert.ok(1.05/(luminance(darkSurface(color))+.05)>=4.5,color);
});
