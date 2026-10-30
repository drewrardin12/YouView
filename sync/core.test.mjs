import assert from 'node:assert/strict';
import {capture,merge,materialize,cleanSnapshot} from './core.mjs';
const ch={key:'0',name:'Approved',id:'UCaaaaaaaaaaaaaaaaaaaaaa'};
const initial={channels:[ch],history:{aaaaaaaaaaa:{at:10}},progress:{aaaaaaaaaaa:{position:100,duration:600,at:10}},shortOverrides:{}};
const a=capture(initial,{},'a',20);const b=capture({...initial,progress:{aaaaaaaaaaa:{position:200,duration:600,at:30}}},{},'b',40);
assert.equal(materialize(merge(a,b)).progress.aaaaaaaaaaa.position,200);
assert.deepEqual(merge(a,b),merge(b,a),'Concurrent records reconcile deterministically');
const deleted=capture({...initial,channels:[],history:{}},a,'a',50);const joined=materialize(merge(deleted,b));assert.equal(joined.channels.length,0);assert.equal(Object.keys(joined.history).length,0,'Deleted records must not reappear from an older device');
const rewound=capture({...initial,progress:{aaaaaaaaaaa:{position:20,duration:600,at:60}}},b,'b',60);assert.equal(materialize(merge(b,rewound)).progress.aaaaaaaaaaa.position,20,'Later rewind beats older farther position');
assert.equal(cleanSnapshot({...initial,youtubeKey:'secret',videos:[{id:'private-catalogue'}]}).youtubeKey,undefined);
assert.equal(cleanSnapshot({...initial,youtubeKey:'secret',videos:[]}).videos,undefined);
const corrected=capture({...initial,shortOverrides:{aaaaaaaaaaa:{value:false,at:100}}},a,'a',100);assert.equal(materialize(merge(corrected,b)).shortOverrides.aaaaaaaaaaa.value,false);
assert.deepEqual(materialize(merge({},JSON.parse('{"progress":{"__proto__":{"at":1,"device":"bad","value":{}}}}'))).progress,{});
console.log('Sync checks passed: concurrent progress, rewinds, deletion tombstones, deterministic merges, Shorts corrections, and credential exclusion.');

const dismissed=capture({...initial,progress:{aaaaaaaaaaa:{position:100,duration:600,at:200,shelfDismissed:true}}},a,"a",200);assert.equal(materialize(merge(dismissed,b)).progress.aaaaaaaaaaa.shelfDismissed,true);
