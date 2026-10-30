import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
function harness(){
 const nodes=new Map();const node=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',value:'',style:{},setAttribute(){},querySelectorAll(){return[]},classList:{hidden:false,toggle(k,v){this[k]=v},add(...keys){keys.forEach(k=>this[k]=true)},remove(...keys){keys.forEach(k=>this[k]=false)},contains(k){return this[k]===true}},replaceChildren(child){this.child=child},append(){},addEventListener(){}});return nodes.get(id)};
 const timers=new Map();let tid=0;
 const context=vm.createContext({console,structuredClone,URL,URLSearchParams,crypto,Promise,Date,Math,JSON,Number,String,Map,Set,Error,Blob,queueMicrotask,sessionStorage:{getItem(){return null}},indexedDB:{open:()=>({})},navigator:{},location:{origin:'https://example.test'},document:{querySelector:node,querySelectorAll:()=>[],getElementById:()=>null,createElement:()=>({remove(){}}),head:{append(){}},addEventListener(){}},window:{addEventListener(){},scrollTo(){}},setInterval(){},setTimeout(f,ms){const id=++tid;timers.set(id,{f,ms});return id},clearTimeout(id){timers.delete(id)}});
 vm.runInContext(source,context);const run=s=>vm.runInContext(s,context);
 run(`startupPending=false;originalRender=render;render=()=>{};persist=()=>Promise.resolve();st={includeShortClips:true,channels:[{id:'approved',key:'test',name:'Approved channel',category:'NBA'}],videos:[{id:'aaaaaaaaaaa',channelId:'approved',title:'A',madeForKids:false},{id:'bbbbbbbbbbb',channelId:'approved',title:'B',madeForKids:false}],progress:{},history:{}};api=async()=>({video:null});`);
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
 assert.match(node('#main').innerHTML,/data-short="aaaaaaaaaaa"/);assert.doesNotMatch(node('#main').innerHTML,/data-video="bbbbbbbbbbb"/);
 run("st.videos[0].duration=600;render()");assert.match(node('#main').innerHTML,/No short-form uploads found/);assert.doesNotMatch(node('#main').innerHTML,/Connect YouTube/);
}
{
 const{run,node}=harness();run("st.channels[0].watchSeconds=90;st.history.keep={at:123};st.progress.keep={position:45};resetUploadCounters()");
 assert.equal(run('st.uploadCounterResetVersion'),2);assert.ok(run('st.channels[0].lastVisit')>0);assert.equal(run('st.channels[0].watchSeconds'),90);assert.equal(run('st.progress.keep.position'),45);
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
 const{run,node,timers}=harness();let hidden=0;node('#startup-screen').classList.add=name=>{if(name==='hidden')hidden++};
 run('startupPending=true;finishStartup()');assert.equal(run('startupPending'),false);assert.equal(hidden,0,'Splash fades while Home renders');const reveal=[...timers.values()].find(t=>t.ms>0&&t.ms<=2250);assert.ok(reveal);reveal.f();const fade=[...timers.values()].find(t=>t.ms===250);assert.ok(fade);fade.f();assert.equal(hidden,1);run('finishStartup()');assert.equal(hidden,1,'Startup release must be idempotent');
}
{
 const{run,node,timers}=harness();run('startupPending=true;originalRender()');assert.equal(node('#main').innerHTML,undefined,'Home must not render stale content during initial refresh');
 const fallback=[...timers.values()].find(t=>t.ms===12000);assert.ok(fallback);fallback.f();assert.equal(run('startupPending'),false,'A stalled refresh must not trap the user on splash');
}
{
 const{run}=harness();run("st.includeShortClips=false;current=st.videos[0];current.duration=30;current.title='Regular clip'");assert.equal(run('isShortForm(current)'),false);run("current.title='A creator clip #Shorts'");assert.equal(run('isShortForm(current)'),true);run("classifyShort(current.id,false)");assert.equal(run('isShortForm(current)'),false);run("classifyShort(current.id,true)");assert.equal(run('isShortForm(current)'),true);run('current.live=true');assert.equal(run('isShortForm(current)'),false);
}
{
 const{run}=harness();run("st.progress={};st.videos[0].published=new Date(1000).toISOString()");assert.equal(run('isFreshUpload(st.videos[0],86400999)'),true);assert.equal(run('isFreshUpload(st.videos[0],86401000)'),false);run('st.progress.aaaaaaaaaaa={finished:true}');assert.equal(run('isFreshUpload(st.videos[0],2000)'),false,'Watched treatment takes precedence over freshness');assert.equal(run('isFreshUpload(st.videos[0],0)'),false);
 assert.equal(run('activeChapterAt([0,60,120],119)'),60);assert.equal(run('activeChapterAt([0,60,120],120)'),120);assert.equal(run('activeChapterAt([60],5)'),null);
}
{
 const{run,node,context}=harness();let clear,undo;context.confirm=()=>true;node('#clear-history').addEventListener=(name,f)=>clear=f;node('#undo-clear-history').addEventListener=(name,f)=>undo=f;
 run("st.history={aaaaaaaaaaa:{at:100}};st.progress={aaaaaaaaaaa:{position:120,duration:600,finished:false}};bind()");clear();assert.equal(run('Object.keys(st.history).length'),0);assert.equal(run('st.progress.aaaaaaaaaaa.position'),120);undo();assert.equal(run('st.history.aaaaaaaaaaa.at'),100,'Undo must preserve original viewing dates');
 run("st.videos[0].title='<script>unsafe</script>';st.videos[0].published=new Date().toISOString();historyType='All';historyChannel='All';query='' ");const html=run('historyPage()');assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>unsafe'));assert.ok(html.includes('history-item'));assert.ok(html.includes('data-remove-history'));
 run("historyChannel='foreign'");assert.ok(!run('historyPage()').includes('history-item'));
}
{
 const{run}=harness();run("st.videos.forEach(v=>{v.duration=600;v.published=new Date().toISOString()});st.progress={aaaaaaaaaaa:{position:100,duration:600,finished:false,at:10},bbbbbbbbbbb:{position:200,duration:600,finished:false,at:20}};st.history={aaaaaaaaaaa:{at:5}};");assert.equal(run('continueVideos()[0].id'),'bbbbbbbbbbb','Shelf sorts by saved playback time, not history or upload time');run("dismissShelf('aaaaaaaaaaa')");assert.equal(run('st.progress.aaaaaaaaaaa.position'),100);assert.equal(run('st.history.aaaaaaaaaaa.at'),5);assert.equal(run('continueVideos().length'),1);run("st.shortOverrides={bbbbbbbbbbb:{value:true}};");assert.equal(run('continueVideos().length'),0,'Shorts stay out of long-form Continue Watching');
 assert.equal(run("primaryRoute('channel')"),'channels');for(const r of ['you','continue','history','settings','live','playlists'])assert.equal(run(`primaryRoute('${r}')`),'you');
}
{
 const{run,context,node}=harness();context.YT={PlayerState:{PLAYING:1,PAUSED:2,ENDED:0,CUED:5},Player:class{constructor(){}destroy(){}stopVideo(){}}};context.window.YT=context.YT;run("st.progress={aaaaaaaaaaa:{position:300,duration:600,finished:false,shelfDismissed:true}};st.history={aaaaaaaaaaa:{at:10}};api=async()=>({video:st.videos[0]});");await run("play('aaaaaaaaaaa',null,false,0,0,true)");assert.equal(new URL(node('#player-frame').child.src).searchParams.get('start'),'0','Explicit shelf restart overrides automatic resume');assert.equal(run('st.history.aaaaaaaaaaa.at'),10);assert.equal(run('st.progress.aaaaaaaaaaa.shelfDismissed'),undefined);
}
{
 const{run,node}=harness();run("current=st.videos[0];current.duration=30;st.shortOverrides={aaaaaaaaaaa:{value:true}};transitioning=false;playerReady=true;player={getVideoUrl:()=> 'https://www.youtube.com/watch?v=aaaaaaaaaaa',getDuration:()=>30,getCurrentTime:()=>10,getPlayerState:()=>1};saveProgress()");assert.equal(run('st.progress.aaaaaaaaaaa.finished'),false,'Three-minute long-form rule must not prematurely complete Shorts');run('saveProgress(true)');assert.equal(run('st.progress.aaaaaaaaaaa.finished'),true);
 run("st.progress={};st.history={};st.shortOverrides={};player.getCurrentTime=()=>0;saveProgress()");assert.equal(run('Object.keys(st.progress).length'),0,'Cued short-duration videos are not automatically marked watched');
}
{
 const{run,node}=harness();run("st.videos.forEach(v=>v.duration=600);st.progress={aaaaaaaaaaa:{position:100,duration:600,finished:false,at:10}};");
 for(const r of ['you','continue','live','playlists']){run(`route='${r}';selected=null;originalRender()`);assert.ok(node('#main').innerHTML.length>100,r+' renders a complete page');}
 run("route='channel';selected=st.channels[0];tab='Home';originalRender()");assert.ok(node('#main').innerHTML.includes('Latest uploads'));assert.ok(node('#main').innerHTML.includes('data-channel-tab="Playlists"'));assert.ok(node('#main').innerHTML.includes('Approved channel'));
 const markup=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8'),footer=markup.match(/<footer class="mobile">([\s\S]*?)<\/footer>/)[1];assert.deepEqual([...footer.matchAll(/data-nav="([^"]+)"/g)].map(m=>m[1]),['home','shorts','channels','you']);
}
// Remaining design behavior: approval boundaries, scope and state preservation.
{
 const{run,node}=harness();run("st.videos[0].duration=600;st.videos[0].published='2026-01-01';st.videos[1].duration=600;st.videos[1].published='2026-02-01';st.videos.push({id:'ccccccccccc',channelId:'unapproved',title:'Hidden',duration:600,published:'2026-03-01'});route='home';originalRender()");
 assert.match(node('#main').innerHTML,/home-hero/);assert.match(node('#main').innerHTML,/Latest uploads/);assert.doesNotMatch(node('#main').innerHTML,/data-video="ccccccccccc"/);
 const feed=node('#main').innerHTML.split('id="latest-feed"')[1];assert.ok(feed.indexOf('data-video="bbbbbbbbbbb"')<feed.indexOf('data-video="aaaaaaaaaaa"'),'Home feed remains strictly newest first');
}
{
 const{run,node}=harness();run("st.channels.push({id:'second',key:'two',name:'Second',watchSeconds:300,lastVisit:321});st.channels[0].lastVisit=123;carouselKey='test';route='channels';originalRender()");assert.match(node('#main').innerHTML,/channel-carousel/);assert.match(node('#main').innerHTML,/manage-channels/);
 run('moveChannelPreview(-1)');assert.equal(run('carouselKey'),'two');assert.equal(run('st.channels[0].lastVisit'),123);assert.equal(run('st.channels[1].lastVisit'),321,'Preview never clears channel counters');run('channelCarousel()');assert.equal(run('carouselKey'),'two','Preview choice remains stable');
}
{
 const{run,node}=harness();run("st.videos[0].title='Topic regular';st.videos[0].duration=600;st.videos[1].title='Topic short';st.videos[1].duration=30;st.videos.push({id:'ccccccccccc',channelId:'unapproved',title:'Topic hidden'});playlistSearchCache.set('ok',{id:'ok',channelId:'approved',title:'Topic playlist',cachedAt:Date.now()});playlistSearchCache.set('no',{id:'no',channelId:'unapproved',title:'Topic hidden',cachedAt:Date.now()});query='topic';route='search';searchKind='All';originalRender()");
 assert.match(node('#main').innerHTML,/data-video="aaaaaaaaaaa"/);assert.match(node('#main').innerHTML,/data-short="bbbbbbbbbbb"/);assert.match(node('#main').innerHTML,/data-search-playlist="ok"/);assert.doesNotMatch(node('#main').innerHTML,/ccccccccccc|data-search-playlist="no"/);
 run("searchKind='Shorts';searchOrder='Oldest';originalRender()");assert.equal(run('query'),'topic');assert.match(node('#main').innerHTML,/data-short="bbbbbbbbbbb"/);assert.doesNotMatch(node('#main').innerHTML,/data-video="aaaaaaaaaaa"/);
 run("st.channels=[];searchKind='All';originalRender()");assert.doesNotMatch(node('#main').innerHTML,/data-short=|data-video=|data-search-playlist=/,'Removed channels immediately disappear from grouped results');
}
{
 const{run}=harness();run("st.channels.push({id:'second',key:'two',name:'Second'});st.videos.forEach(v=>v.duration=30);st.videos[1].channelId='second';play=(id,queue,mode)=>{chosenShort={id,mode}};route='channel';selected=st.channels[0];launchShort('aaaaaaaaaaa')");assert.equal(run("shortsSequence.join(',')"),'aaaaaaaaaaa');assert.equal(run('chosenShort.mode'),true);run("route='search';selected=null;launchShort('bbbbbbbbbbb')");assert.equal(run('shortsSequence.length'),2);
}
{
 const{run,node}=harness();run("st.videos[0].duration=30;st.videos[0].cachedAt=Date.now();ensureYT=async()=>{throw Error('Stop after setup')}");await run("play('aaaaaaaaaaa')");assert.equal(node('#player-shell').classList['shorts-full'],true,'Opening a Short from history/search defaults to immersive mode');
 run("st.videos.push({id:'ccccccccccc',channelId:'unapproved',title:'Forbidden'});updatePlayerDetails(st.videos[0])");assert.doesNotMatch(node('#related-pane').innerHTML,/ccccccccccc/);run("playerDetailsTab('Description')");assert.equal(node('#description-pane').classList.hidden,false);assert.equal(node('#chapter-pane').classList.hidden,true);
}
{
 const{run}=harness();run("st.uploadCounterResetVersion=1;st.channels[0].lastVisit=1;st.videos[0].published=new Date(Date.now()-1000).toISOString();initializeUploadCounters()");assert.equal(run('st.uploadCounterResetVersion'),2);assert.doesNotMatch(run('bubble(st.channels[0])'),/upload-dot/,'Existing uploads cleared by one-time migration');
 run("st.videos[0].published=new Date(Date.now()+1000).toISOString()");assert.match(run('bubble(st.channels[0])'),/class="badge upload-dot"[^>]*><\/span>/,'New uploads use an empty red dot');assert.doesNotMatch(run('bubble(st.channels[0])'),/>1<\/span>/);
 run('st.videos[0].live=true');assert.match(run('bubble(st.channels[0])'),/>LIVE<\/span>/,'Live indicator remains distinct');
}
{
 const{run,node}=harness();run("st.channels[0].image='';st.channels[0].lastVisit=1;st.videos[0].title='A very long landscape title that stays readable';st.videos[0].duration=600;st.videos[0].published=new Date(Date.now()-1000).toISOString();st.videos[1].duration=600;st.videos[1].published=new Date(Date.now()-2000).toISOString();st.videos[1].thumbnail='';st.videos.push({...st.videos[0]});route='home';originalRender()");
 const html=node('#main').innerHTML;assert.match(html,/FROM YOUR CHANNELS/);assert.match(html,/A very long landscape title/);assert.doesNotMatch(html,/Your channels\.<br>Your pace|Live now|data-nav="history"/);assert.match(html,/home-video-menu/);assert.match(html,/assets\/avatar.svg/);assert.match(html,/assets\/video-unavailable.svg/);
 const actions=html.match(/<nav class="home-actions"[^>]*>([\s\S]*?)<\/nav>/)[1];assert.equal([...actions.matchAll(/<button/g)].length,2);assert.match(actions,/Latest uploads/);assert.match(actions,/Continue watching/);
 const feed=html.split('id="latest-feed"')[1];assert.equal([...feed.matchAll(/class="home-video-card /g)].length,2,'Home deduplicates only identical video IDs');assert.ok(feed.indexOf('data-video="aaaaaaaaaaa"')<feed.indexOf('data-video="bbbbbbbbbbb"'));
 assert.match(run('homeChannels()'),/upload-dot/);run('st.videos[0].live=true');const channels=run('homeChannels()');assert.match(channels,/home-live-badge/);assert.match(channels,/upload-dot/,'Live and new-upload signals coexist independently');run('nav("channel","test")');assert.doesNotMatch(run('homeChannels()'),/upload-dot/,'Visiting the channel clears its dot');
}
{
 const{run}=harness();run("st.videos[0].published=new Date(Date.now()-1000).toISOString();st.videos[0].duration=600;st.progress.aaaaaaaaaaa={position:500,duration:600,finished:true}");const art=run('homeArtwork(st.videos[0])');assert.match(art,/watched/);assert.doesNotMatch(art,/artwork-glass fresh/);assert.match(art,/class="progress"/);
 run("st.videos[0].title='<script>alert(1)</script>';st.channels[0].name='<img onerror=bad>'");assert.doesNotMatch(run('homeCard(st.videos[0])'),/<script>|<img onerror/,'Home escapes metadata');
 run("st.videos[1].channelId='removed'");assert.equal(run('homeCard(st.videos[1])'),'');
}
{
 const{run}=harness();run("st.channels.push({id:'rare',key:'rare',name:'Rarely watched'});st.channels[0].watchSeconds=18000;st.channels[0].visits=20;st.videos[0].duration=600;st.videos[0].published=new Date(Date.now()-7*86400000).toISOString();st.videos[1].channelId='rare';st.videos[1].duration=600;st.videos[1].published=new Date(Date.now()-1000).toISOString();st.videos.push({id:'ccccccccccc',channelId:'not-approved',published:new Date().toISOString()});homeMode='For you'");
 assert.equal(run('personalHomeFeed()[0].id'),'aaaaaaaaaaa','Viewing preference can outrank simple recency');assert.equal(run('personalHomeFeed().length'),2,'Personalized candidates remain approved only');run("homeMode='Latest'");assert.equal(run('homeFeed()[0].id'),'bbbbbbbbbbb','Latest remains chronological');
 run("homeMode='For you';st.progress.aaaaaaaaaaa={finished:true,position:600,duration:600}");assert.equal(run('personalHomeFeed()[0].id'),'bbbbbbbbbbb','Finished videos are deprioritized, not removed');
 run("st.channels=st.channels.filter(c=>c.id!=='approved')");assert.equal(run('personalHomeFeed().length'),1,'Removing approval removes recommendations immediately');
}
{
 const{run}=harness();run("st.channels[0].watchSeconds=0;st.channels[0].visits=0;st.videos[0].duration=600;st.videos[1].duration=600;st.videos[0].published=new Date(Date.now()-86400000).toISOString();st.videos[1].published=new Date(Date.now()-1000).toISOString()");assert.equal(run('personalHomeFeed()[0].id'),'bbbbbbbbbbb','Cold start uses recency without invented preferences');
}
{
 const{run,node}=harness();run("st.channels.push({id:'rare',key:'rare',name:'Rare'});st.channels[0].watchSeconds=18000;st.channels[0].visits=20;st.videos[0].duration=600;st.videos[0].published=new Date(Date.now()-7*86400000).toISOString();st.videos[1].channelId='rare';st.videos[1].duration=600;st.videos[1].published=new Date(Date.now()-1000).toISOString();route='home';category='All';homeMode='For you';originalRender()");
 let feed=node('#main').innerHTML.split('id="latest-feed"')[1];assert.ok(feed.indexOf('data-video="aaaaaaaaaaa"')<feed.indexOf('data-video="bbbbbbbbbbb"'),'Rendered For you must use personalized order');
 assert.match(feed,/aria-label="For you"[^>]*>[\s\S]*?#smile/);assert.match(feed,/aria-label="Latest"[^>]*>[\s\S]*?#refresh/);assert.doesNotMatch(feed,/>For you<\/button>|>Latest<\/button>/,'Mode controls have icons, with accessible names');
 run("homeMode='Latest';originalRender()");feed=node('#main').innerHTML.split('id="latest-feed"')[1];assert.ok(feed.indexOf('data-video="bbbbbbbbbbb"')<feed.indexOf('data-video="aaaaaaaaaaa"'),'Rendered Latest must stay chronological');
 run("homeMode='For you';category='NBA';originalRender()");feed=node('#main').innerHTML.split('id="latest-feed"')[1];assert.match(feed,/data-video="aaaaaaaaaaa"/);assert.doesNotMatch(feed,/data-video="bbbbbbbbbbb"/,'Category filter applies after personalized ordering');
}
{
 const{run,node}=harness();run("current=st.videos[0];playerReady=true;transitioning=false;testRate=1;rateCalls=[];player={getVideoUrl:()=> 'https://www.youtube.com/watch?v=aaaaaaaaaaa',getAvailablePlaybackRates:()=>[1,1.5,2],getPlaybackRate:()=>testRate,setPlaybackRate:r=>{testRate=r;rateCalls.push(r)}};updateQuickControls()");assert.equal(node('#speed2').disabled,false);run('toggleDoubleSpeed()');assert.equal(run('testRate'),2);assert.equal(node('#speed2').classList.on,true);run('toggleDoubleSpeed()');assert.equal(run('testRate'),1);assert.equal(node('#speed2').classList.on,false);
 run('player.getAvailablePlaybackRates=()=>[1];updateQuickControls()');assert.equal(node('#speed2').disabled,true);run('toggleDoubleSpeed()');assert.equal(run('rateCalls.length'),2,'Unsupported speed does not issue an API request');run("player.getAvailablePlaybackRates=()=>[1,2];player.getVideoUrl=()=> 'https://www.youtube.com/watch?v=bbbbbbbbbbb';updateQuickControls()");assert.equal(node('#speed2').disabled,true,'Controls cannot act on the previous video');
}
{
 const{run,context}=harness();context.window.scrollY=650;context.window.scrollTo=(x,y)=>{context.window.scrollY=typeof x==='object'?x.top:y};run("route='home';category='Golf';homeMode='Latest';nav('channels')");context.window.scrollY=220;run("query='packers';nav('home')");assert.equal(run('category'),'Golf');assert.equal(run('homeMode'),'Latest');assert.equal(context.window.scrollY,650,'Returning to a primary tab restores its scroll');run('iosGoBack()');assert.equal(run('route'),'channels');assert.equal(run('query'),'packers');assert.equal(context.window.scrollY,220,'Back restores prior search and scroll state');
 run("iosRestore({route:'channel',key:'removed',y:100,query:'x'})");assert.equal(run('route'),'channels','Restoring a deleted channel falls back safely');
}
{
 const{run,node,context}=harness();const sheet=node('#ios-sheet'),actions={items:[],replaceChildren(){this.items=[]},append(b){this.items.push(b)}};sheet.querySelector=()=>actions;sheet.showModal=()=>sheet.open=true;sheet.close=()=>sheet.open=false;let clicks=0;const original={textContent:'Share',click(){assert.equal(sheet.open,false);clicks++}};context.summary={isConnected:true,focus(){},getAttribute:()=> 'Video actions',parentElement:{querySelector:()=>({querySelectorAll:()=>[original]})}};context.document.createElement=()=>({addEventListener(type,fn){this.click=fn}});assert.equal(run('iosOpenSheet(summary)'),true);assert.equal(actions.items.length,1);actions.items[0].click();assert.equal(clicks,1,'Sheet action dispatches the existing video command once, after dismissing');
}
{
 const{run,node,context}=harness();run("route='home'");context.window.scrollY=400;run('iosRefreshFinished()');assert.equal(node('#ios-updates').classList.hidden,false,'Background refresh offers an explicit update while mid-feed');assert.equal(node('#main').innerHTML,undefined,'Quiet refresh does not replace the visible feed');
}
console.log('Checks passed: playback, allowlist, chapters including bracketed ranges, search, historical indexing, complete playlist ordering/duplicates, saved keys, and handoff URL parsing.');
