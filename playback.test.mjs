import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
function harness(){
 const nodes=new Map();const node=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',value:'',classList:{hidden:false,toggle(k,v){this[k]=v},add(){},remove(){}},replaceChildren(child){this.child=child},append(){},addEventListener(){}});return nodes.get(id)};
 const timers=new Map();let tid=0;
 const context=vm.createContext({console,structuredClone,URL,URLSearchParams,crypto,Promise,Date,Math,JSON,Number,String,Map,Set,Error,Blob,queueMicrotask,sessionStorage:{getItem(){return null}},indexedDB:{open:()=>({})},navigator:{},location:{origin:'https://example.test'},document:{querySelector:node,querySelectorAll:()=>[],getElementById:()=>null,createElement:()=>({remove(){}}),head:{append(){}},addEventListener(){}},window:{addEventListener(){},scrollTo(){}},setInterval(){},setTimeout(f,ms){const id=++tid;timers.set(id,{f,ms});return id},clearTimeout(id){timers.delete(id)}});
 vm.runInContext(source,context);const run=s=>vm.runInContext(s,context);
 run(`originalRender=render;render=()=>{};persist=()=>Promise.resolve();st={channels:[{id:'approved',key:'test',name:'Approved channel',category:'NBA'}],videos:[{id:'aaaaaaaaaaa',channelId:'approved',title:'A',madeForKids:false},{id:'bbbbbbbbbbb',channelId:'approved',title:'B',madeForKids:false}],progress:{},history:{}};api=async()=>({video:null});`);
 return{run,node,context,timers};
}
{
 const{run,node}=harness();run(`current=st.videos[0];transitioning=false;playerReady=true;player={getVideoUrl:()=> 'https://www.youtube.com/watch?v=aaaaaaaaaaa',getDuration:()=>600,getCurrentTime:()=>420,getPlayerState:()=>2};saveProgress();`);
 assert.equal(run('st.progress.aaaaaaaaaaa.finished'),false);
 run('player.getCurrentTime=()=>421;saveProgress()');assert.equal(run('st.progress.aaaaaaaaaaa.finished'),true);
 run("st.progress={};player.getVideoUrl=()=> 'https://www.youtube.com/watch?v=bbbbbbbbbbb';saveProgress()");assert.equal(run('Object.keys(st.progress).length'),0,'Old-video events cannot update current video');
 run("player.getVideoUrl=()=> 'https://www.youtube.com/watch?v=aaaaaaaaaaa';current.madeForKids=true;saveProgress()");assert.equal(run('Object.keys(st.progress).length'),0);
 run('current.madeForKids=false;playerReady=false;saveProgress()');assert.equal(run('Object.keys(st.progress).length'),0);
}
{
 const{run,node,context}=harness();let onReady;let calls=0;
 const yt={PlayerState:{PLAYING:1,PAUSED:2,ENDED:0,CUED:5},Player:class{constructor(id,options){onReady=()=>options.events.onReady({target:this})}loadVideoById(){calls++}stopVideo(){}destroy(){}}};
 context.YT=yt;context.window.YT=yt;
 run('api=async()=>({video:st.videos[0]})');await run("play('aaaaaaaaaaa')");assert.match(node('#player-frame').child.src,/embed\/aaaaaaaaaaa\?enablejsapi=1/);assert.equal(node('#player-frame').child.referrerPolicy,'strict-origin-when-cross-origin');run('closePlayer()');onReady();assert.equal(calls,0,'Closing while loading prevents late hidden playback');
 assert.equal(run('current'),null);
}
{
 const{run,context}=harness();let resolveA;context.requestA=new Promise(r=>resolveA=r);
 run("api=path=>path.includes('aaaaaaaaaaa')?requestA:Promise.resolve({video:st.videos[1]});ensureYT=()=>new Promise(()=>{});");
 const a=run("play('aaaaaaaaaaa')");run("play('bbbbbbbbbbb')");await Promise.resolve();await Promise.resolve();resolveA({video:run('st.videos[0]')});await a;
 assert.equal(run('current.id'),'bbbbbbbbbbb','Slow earlier selection cannot replace latest requested video');
}
{
 const{run,node}=harness();run("api=async()=>({video:st.videos[0]});ensureYT=async()=>{throw Error('Network test failure')}");await run("play('aaaaaaaaaaa')");assert.match(node('#playback-status').textContent,/Network test failure/);assert.equal(node('#retry-player').classList.hidden,false);
}
{
 const{run,context}=harness();let calls=0;context.apiCall=()=>calls++;
 run("st.videos[0].cachedAt=Date.now();api=async()=>{apiCall();throw Error('No key')};ensureYT=async()=>{throw Error('Stop after selection')};youtubeKey='';");
 await run("play('aaaaaaaaaaa')");assert.equal(calls,0,'Fresh approved metadata permits playback without a new API request');assert.equal(run('current.id'),'aaaaaaaaaaa');
 run("current=null;st.videos[0].cachedAt=Date.now()-86400001");await run("play('aaaaaaaaaaa')");assert.equal(calls,1,'Stale metadata must be refreshed');assert.equal(run('current'),null);
}
{
 const{run,node}=harness();
 assert.equal(run('isShortForm({duration:180})'),true);assert.equal(run('isShortForm({duration:181})'),false);
 assert.equal(run('isShortForm({duration:0})'),false);assert.equal(run('isShortForm({duration:30,live:true})'),false);assert.equal(run('isShortForm({duration:30,wasLive:true})'),false);assert.equal(run('isShortForm({duration:30,isShort:false})'),false);
 run("render=originalRender;route='shorts';st.videos[0].duration=30;st.videos[1].channelId='unapproved';st.videos[1].duration=20;render()");
 assert.match(node('#main').innerHTML,/data-video="aaaaaaaaaaa"/);assert.doesNotMatch(node('#main').innerHTML,/data-video="bbbbbbbbbbb"/);
 run("st.videos[0].duration=600;render()");assert.match(node('#main').innerHTML,/No short-form uploads found/);assert.doesNotMatch(node('#main').innerHTML,/Connect YouTube/);
}
console.log('Playback checks passed: completion boundary, stale-video protection, tracking exclusion, readiness, close-before-ready, request races, and retry feedback.');
