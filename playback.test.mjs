import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
function harness(){
 const nodes=new Map();const node=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',value:'',querySelectorAll(){return[]},classList:{hidden:false,toggle(k,v){this[k]=v},add(){},remove(){}},replaceChildren(child){this.child=child},append(){},addEventListener(){}});return nodes.get(id)};
 const timers=new Map();let tid=0;
 const context=vm.createContext({console,structuredClone,URL,URLSearchParams,crypto,Promise,Date,Math,JSON,Number,String,Map,Set,Error,Blob,queueMicrotask,sessionStorage:{getItem(){return null}},indexedDB:{open:()=>({})},navigator:{},location:{origin:'https://example.test'},document:{querySelector:node,querySelectorAll:()=>[],getElementById:()=>null,createElement:()=>({remove(){}}),head:{append(){}},addEventListener(){}},window:{addEventListener(){},scrollTo(){}},setInterval(){},setTimeout(f,ms){const id=++tid;timers.set(id,{f,ms});return id},clearTimeout(id){timers.delete(id)}});
 vm.runInContext(source,context);const run=s=>vm.runInContext(s,context);
 run(`startupPending=false;originalRender=render;render=()=>{};persist=()=>Promise.resolve();st={channels:[{id:'approved',key:'test',name:'Approved channel',category:'NBA'}],videos:[{id:'aaaaaaaaaaa',channelId:'approved',title:'A',madeForKids:false},{id:'bbbbbbbbbbb',channelId:'approved',title:'B',madeForKids:false}],progress:{},history:{}};api=async()=>({video:null});`);
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
{
 const{run,node}=harness();run("st.channels[0].watchSeconds=90;st.history.keep={at:123};st.progress.keep={position:45};resetUploadCounters()");
 assert.equal(run('st.uploadCounterResetVersion'),1);assert.ok(run('st.channels[0].lastVisit')>0);assert.equal(run('st.channels[0].watchSeconds'),90);assert.equal(run('st.progress.keep.position'),45);
 const baseline=run('st.channels[0].lastVisit');run('initializeUploadCounters()');assert.equal(run('st.channels[0].lastVisit'),baseline);
 run("api=async()=>({video:st.videos[0]});ensureYT=async()=>{throw Error('Test boundary')};route='shorts'");await run("play('aaaaaaaaaaa')");assert.equal(node('#player-shell').classList['shorts-full'],true);
 run("route='home'");await run("play('aaaaaaaaaaa')");assert.equal(node('#player-shell').classList['shorts-full'],false);
}
{
 const{run}=harness();run("youtubeKey='test';st.videos[0].live=true;api=async()=>({videos:[{id:'ccccccccccc',channelId:'approved',title:'Live',live:true},{id:'ddddddddddd',channelId:'foreign',live:true}]})");
 await run('refreshLiveChannel(st.channels[0],true)');assert.equal(run("st.videos.find(v=>v.id==='aaaaaaaaaaa').live"),false);assert.equal(run("st.videos.filter(v=>v.id==='ccccccccccc').length"),1);assert.equal(run("st.videos.some(v=>v.channelId==='foreign')"),false);
 run("api=async()=>{throw Error('Should be cached')}");await run('refreshLiveChannel(st.channels[0])');assert.equal(run('st.channels[0].liveError'),undefined);
 run("api=async()=>{throw Error('Quota failure')}");await run('refreshLiveChannel(st.channels[0],true)');assert.equal(run('st.channels[0].liveError'),'Quota failure');assert.equal(run("st.videos.find(v=>v.id==='ccccccccccc').live"),true);
}
{
 const{run,context}=harness();const session=new Map(),local=new Map();const storage=m=>({getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)});
 context.sessionStorage=storage(session);context.localStorage=storage(local);context.window.sessionStorage=context.sessionStorage;context.window.localStorage=context.localStorage;
 run("saveKey('fixture-key',false)");assert.equal(local.size,0);assert.equal(run('readKey()'),'fixture-key');
 run("saveKey('fixture-key',true)");session.clear();assert.equal(run('readKey()'),'fixture-key','Remembered key survives the end of a browser session');
 run('forgetKey()');assert.equal(run('readKey()'),'');assert.equal(local.size,0);
 run("saveKey('fixture-key',true);saveKey('fixture-key',false)");assert.equal(local.size,0,'Session-only choice removes a previously remembered key');
 assert.match(run('playbackErrorMessage(150)'),/creator blocks/);assert.match(run('playbackErrorMessage(153)'),/identify/);
}
{
 const{run,node}=harness();assert.equal(run("parseChapters('0:00 Intro\\n1:02:03 Long segment\\n5:99 Bad time\\n0:00 Duplicate',4000).length"),2);
 run("st.channels[0].handle='LeBatardShow';current=st.videos[0];current.description='0:00 Official intro';youtubeKey=''");await run('loadChapters(current)');assert.match(node('#chapters').innerHTML,/Connect your existing/);assert.match(node('#chapters').innerHTML,/Refresh chapters/);
 run("youtubeKey='fixture';api=async()=>{throw Error('Comments disabled')}");await run('loadChapters(current,{force:true})');assert.match(node('#chapters').innerHTML,/Comments disabled/);
 run("api=async()=>({text:'0:00 Preferred intro\\n5:00 Second segment',scanned:1,nextPage:null})");await run('loadChapters(current,{force:true})');assert.match(node('#chapters').innerHTML,/@IrishWeegee timestamps/);assert.match(node('#chapters').innerHTML,/Second segment/);
 run("api=async()=>{throw Error('Cache should prevent request')}");await run('loadChapters(current)');assert.doesNotMatch(node('#chapters').innerHTML,/Cache should prevent/);
}
{
 const{run,context}=harness();const author='UC'+ 'a'.repeat(22);let pages=0;
 run("st.channels[0].handle='LeBatardShow'");context.fixtureAuthor=author;
 context.yt=async(resource,params)=>resource==='channels'?{items:[{id:author}]}:(++pages===1?{items:[{snippet:{topLevelComment:{id:'fake',snippet:{authorDisplayName:'@IrishWeegee',authorChannelId:{value:'UC'+ 'b'.repeat(22)},textOriginal:'0:00 Fake'}}}}],nextPageToken:'next'}:{items:[{snippet:{topLevelComment:{id:'real',snippet:{authorChannelId:{value:author},textOriginal:'0:00 Real intro\n4:00 Real segment'}}}}]});
 const found=await run("retrieveChapterComment('aaaaaaaaaaa')");assert.equal(found.commentId,'real');assert.equal(pages,2,'Retrieval follows pagination and matches verified author ID');
 context.yt=async()=>({items:[],nextPageToken:'more'});const missing=await run("retrieveChapterComment('aaaaaaaaaaa')");assert.equal(missing.nextPage,'more','A bounded scan can be continued');
}
{
 const{run}=harness();const chapters=run("parseChapters('[0:00-3:35] On Standby\\n[3:36 - 7:36] Shadow Show\\n[1:39:57–1:58:35] Pat McAfee response',12000)");assert.equal(chapters.length,3);assert.equal(chapters[1].seconds,216);assert.equal(chapters[2].seconds,5997);assert.equal(chapters[0].title,'On Standby');
 assert.ok(run("searchScore({title:'Cooper Flagg big win',description:''},'cooper highlights')")>0);assert.equal(run("searchScore({title:'Golf match'},'packers injury')"),0);
 assert.ok(run("searchScore({title:'Café golf',description:''},'cafe golf')")>0);
 assert.equal(run("parseVideoUrl('https://www.youtube.com/watch?v=IX9Dv4cBUKg&t=10577s').start"),10577);assert.equal(run("parseVideoUrl('https://youtu.be/IX9Dv4cBUKg?t=2h3m').start"),7380);assert.equal(run("parseVideoUrl('https://youtube.com.evil.test/watch?v=IX9Dv4cBUKg')"),null);
}
{
 const{run,context}=harness();let pages=0;run("youtubeKey='fixture';st.channels[0].nextPage='older'");context.api=async()=>++pages===1?{videos:[{id:'ccccccccccc',channelId:'approved',title:'Old match'},{id:'ddddddddddd',channelId:'foreign',title:'Excluded'}],nextPage:'last'}:{videos:[{id:'eeeeeeeeeee',channelId:'approved',title:'Oldest match'}],nextPage:null};
 await run('indexOlderUploads(2)');assert.equal(pages,2);assert.equal(run('st.channels[0].nextPage'),null);assert.equal(run("st.videos.some(v=>v.channelId==='foreign')"),false);assert.equal(run('historyIndex.added'),2);
}
{
 const{run,context}=harness();let pages=0;run("route='channel';tab='Playlists';selected=st.channels[0];playlistView={channelId:'approved',items:[],loaded:true};playlistView.active={id:'playlist',title:'Test',entries:[],excluded:0,started:false,nextPage:undefined,loading:false,loadingAll:false,seenPages:new Set()}");
 const a=run('st.videos[0]'),b=run('st.videos[1]');context.api=async()=>++pages===1?{videos:[a,{id:'foreign',channelId:'nope'}],entryCount:3,nextPage:'next'}:{videos:[b,a],entryCount:2,nextPage:null};
 assert.equal(await run('loadEntirePlaylist(playlistView,playlistView.active)'),true);assert.equal(pages,2);assert.equal(run("playlistView.active.entries.map(v=>v.id).join(',')"),'aaaaaaaaaaa,bbbbbbbbbbb,aaaaaaaaaaa');assert.equal(run('playlistView.active.excluded'),2);
}
{
 const{run,context}=harness();let advanced=[];context.YT={PlayerState:{PLAYING:1,PAUSED:2,ENDED:0,CUED:5}};context.capture=(...args)=>advanced.push(args);
 run("current=st.videos[0];playerReady=true;transitioning=false;player={getVideoUrl:()=> 'https://www.youtube.com/watch?v=aaaaaaaaaaa',getDuration:()=>600,getCurrentTime:()=>600,getPlayerState:()=>0};playbackQueue=['aaaaaaaaaaa','bbbbbbbbbbb','aaaaaaaaaaa'];playbackQueueIndex=2;play=(...args)=>capture(...args);playerStateChanged({data:0,target:player})");assert.equal(advanced.length,0,'Last duplicate playlist entry must not loop back');run('playbackQueueIndex=0;playerStateChanged({data:0,target:player})');assert.equal(advanced[0][0],'bbbbbbbbbbb');assert.equal(advanced[0][4],1);
}
{
 const{run,node,context}=harness();let options;let destroyed=0;
 context.YT={PlayerState:{PLAYING:1,PAUSED:2,ENDED:0,CUED:5},Player:class{constructor(id,o){options=o}destroy(){destroyed++}loadVideoById(){}stopVideo(){}}};context.window.YT=context.YT;
 run('api=async()=>({video:st.videos[0]})');await run("play('aaaaaaaaaaa',null,false)");
 assert.equal(new URL(node('#player-frame').child.src).searchParams.get('playsinline'),'0');assert.equal(options.playerVars.playsinline,0);assert.equal(options.playerVars.fs,1);assert.equal(options.playerVars.autoplay,1);assert.equal(new URL(node('#player-frame').child.src).searchParams.get('autoplay'),'1');
 await run("play('aaaaaaaaaaa',null,true)");assert.equal(destroyed,1);assert.equal(new URL(node('#player-frame').child.src).searchParams.get('playsinline'),'1');assert.equal(options.playerVars.playsinline,1);
 await run("play('aaaaaaaaaaa',null,false)");assert.equal(destroyed,2);assert.equal(options.playerVars.playsinline,0);
}
{
 const{run,context}=harness();let ready;let reloads=0;let destroys=0;
 context.YT={PlayerState:{PLAYING:1,PAUSED:2,ENDED:0,CUED:5},Player:class{constructor(id,o){ready=()=>o.events.onReady({target:this})}getVideoUrl(){return 'https://www.youtube.com/watch?v=aaaaaaaaaaa'}loadVideoById(){reloads++}destroy(){destroys++}stopVideo(){}}};context.window.YT=context.YT;
 run('api=async()=>({video:st.videos[0]})');await run("play('aaaaaaaaaaa',null,false)");ready();assert.equal(reloads,0,'Attaching progress tracking must not reload an already initialized video');
 await run("play('aaaaaaaaaaa',null,false)");assert.equal(destroys,1,'Regular videos get a fresh embed like Simplicity');
}
{
 const{run}=harness();assert.equal(run("SEED.find(c=>c.name==='LeBron James').id"),'UCV9dV3DcAZWGnT2yFNKxStA');
 assert.equal(run("SEED.find(c=>c.name==='Fat Perez').id"),undefined,'Unverified channels must remain unresolved');
}
{
 const{run}=harness();run("youtubeKey='fixture';st.liveDiscoveryAt=0;st.channels=[{id:'a',liveCheckedAt:100},{id:'b',liveCheckedAt:50}]");assert.equal(run('liveDiscoveryCandidate(4000000).id'),'b');run('st.liveDiscoveryAt=3999999');assert.equal(run('liveDiscoveryCandidate(4000000)'),null);run("youtubeKey=''");assert.equal(run('liveDiscoveryCandidate(9000000)'),null);
}
{
 const{run,context}=harness();let calls=0;context.repeat=()=>{calls++;return {videos:[],nextPage:'same'}};
 run("youtubeKey='fixture';st.channels[0].nextPage='same';api=async()=>repeat();query='test'");await run('indexOlderUploads()');assert.equal(calls,1,'Repeated upload cursors must not burn 500 API requests');assert.equal(run('historyIndex.errors'),1);
}
{
 const{run,context}=harness();let finish;context.delayed=new Promise(r=>finish=r);run("youtubeKey='fixture';st.channels[0].nextPage='old';api=()=>delayed");const pending=run('indexOlderUploads()');run('indexJob++;historyIndex.running=false');finish({videos:[],nextPage:'late'});await pending;assert.equal(run('st.channels[0].nextPage'),'old','Cancelled responses must not overwrite a newer indexing cursor');
}
{
 const{run,context}=harness();let latest,created=0,destroyed=0;
 context.YT={PlayerState:{PLAYING:1,PAUSED:2,ENDED:0,CUED:5},Player:class{constructor(id,o){created++;latest={target:this,options:o}}getVideoUrl(){return 'https://www.youtube.com/watch?v=aaaaaaaaaaa'}getPlayerState(){return 1}getCurrentTime(){return 120}getDuration(){return 600}destroy(){destroyed++}stopVideo(){}}};context.window.YT=context.YT;
 run('api=async()=>({video:st.videos[0]})');await run("play('aaaaaaaaaaa')");const old=latest;run('closePlayer()');await run("play('aaaaaaaaaaa')");assert.equal(created,2,'Reopening after close during initialization creates a fresh player');assert.equal(destroyed,1);
 latest.options.events.onReady({target:latest.target});assert.equal(run('transitioning'),false,'Already-playing native video enables saving immediately on API readiness');assert.equal(run('st.progress.aaaaaaaaaaa.position'),120);
 old.options.events.onStateChange({target:old.target,data:0});assert.equal(run('st.progress.aaaaaaaaaaa.finished'),false,'A destroyed player cannot finish the newly reopened same video');
 run('player.getCurrentTime=()=>-5;saveProgress()');assert.equal(run('st.progress.aaaaaaaaaaa.position'),120,'Invalid player readings cannot overwrite saved progress');
}
{
 const{run}=harness();run("st.videos.forEach(v=>v.duration=30);shortsSequence=['aaaaaaaaaaa','bbbbbbbbbbb'];current=st.videos[0]");assert.equal(run('nextShortId(1)'),'bbbbbbbbbbb');assert.equal(run('nextShortId(-1)'),null);run('st.videos[1].isShort=false');assert.equal(run('nextShortId(1)'),null);run("st.videos[1].isShort=true;st.videos[1].channelId='foreign'");assert.equal(run('nextShortId(1)'),null);
}
{
 const{run,node}=harness();let hidden=0;node('#startup-screen').classList.add=name=>{if(name==='hidden')hidden++};
 run('startupPending=true;finishStartup()');assert.equal(run('startupPending'),false);assert.equal(hidden,1);run('finishStartup()');assert.equal(hidden,1,'Startup release must be idempotent');
}
{
 const{run,node,timers}=harness();run('startupPending=true;originalRender()');assert.equal(node('#main').innerHTML,undefined,'Home must not render stale content during initial refresh');
 const fallback=[...timers.values()].find(t=>t.ms===12000);assert.ok(fallback);fallback.f();assert.equal(run('startupPending'),false,'A stalled refresh must not trap the user on splash');
}
console.log('Checks passed: playback, allowlist, chapters including bracketed ranges, search, historical indexing, complete playlist ordering/duplicates, saved keys, and handoff URL parsing.');
