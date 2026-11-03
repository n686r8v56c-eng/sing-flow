import React,{useEffect,useRef,useState}from'react';
import{Play,Repeat,Plus,Trash2,Check,ExternalLink}from'lucide-react';
import VoiceRecordingLog from './VoiceRecordingLog';
import MRPlayer from './MRPlayer';
import {mediaUrl} from '../lib';
const uid=()=>crypto.randomUUID?.()||Date.now().toString();
export const videoId=u=>String(u||'').match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/)?.[1]||'';
const sec=x=>{if(typeof x==='number')return x;const s=String(x??'').trim();if(/^\d+:\d\d$/.test(s)){const[a,b]=s.split(':').map(Number);return a*60+b}return s!==''&&Number.isFinite(Number(s))?Number(s):NaN};
const fmt=x=>{const n=Number.isFinite(x)?Math.max(0,Math.floor(x)):0;return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')};
const parseChapterLines=text=>{
 const entries=[],invalid=[];
 String(text||'').split(/\r?\n/).forEach((line,i)=>{
  if(!line.trim())return;
  const match=line.trim().match(/^[[(]?((?:\d{1,3}:)?\d{1,2}:\d{2})[\])]?\s*(?:[-–—|]\s*)?(.+?)\s*$/);
  if(!match){invalid.push(i+1);return}
  const parts=match[1].split(':').map(Number);
  if(parts.some(x=>!Number.isFinite(x))||parts.slice(1).some(x=>x>=60)){invalid.push(i+1);return}
  const start=parts.reduce((value,n)=>value*60+n,0);
  entries.push({start,label:match[2].trim(),line:i+1});
 });
 return {entries,invalid};
};
export const normalizedClips=b=>Array.isArray(b.clips)?b.clips:(b.skillIds||[]).map((skillId,i)=>({id:'legacy-'+i,skillId,start:fmt(sec(b.start)),end:fmt(sec(b.end)>sec(b.start)?sec(b.end):sec(b.start)+10),caution:'',memo:''}));
function SkillSearch({skills,selectedId,onSelect,label='연결할 기술'}){
 const chosen=skills.find(s=>s.id===selectedId);
 const [query,SetQuery]=useState(chosen?.name||'');
 const [opened,Open]=useState(false);
 const [active,Active]=useState(0);
 const filtered=skills.filter(s=>[s.name,s.category,s.subcategory].join(' ').toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
 const choose=s=>{onSelect(s.id);SetQuery(s.name);Open(false);Active(0)};
 return <div className="tech-skill-search">
   <label htmlFor="tech-skill-search-input">{label}</label>
   <input id="tech-skill-search-input" type="search" autoComplete="off" value={query}
     placeholder={label==='연결할 곡'?'곡명·가수 검색':'기술 이름 검색'} aria-label={label+' 검색'}
     aria-expanded={opened} aria-controls="tech-skill-search-results"
     onFocus={e=>{Open(true);Active(0);e.target.select()}}
     onChange={e=>{SetQuery(e.target.value);Open(true);Active(0);if(selectedId)onSelect('')}}
     onKeyDown={e=>{
       if(!opened&&e.key==='ArrowDown'){e.preventDefault();Open(true);return}
       if(e.key==='Escape'){Open(false);return}
       if(e.key==='ArrowDown'){e.preventDefault();Active(n=>Math.min(n+1,filtered.length-1))}
       if(e.key==='ArrowUp'){e.preventDefault();Active(n=>Math.max(0,n-1))}
       if(e.key==='Enter'&&opened){e.preventDefault();if(filtered[active])choose(filtered[active])}
     }}/>
   {opened&&<div className="tech-skill-search-results" id="tech-skill-search-results" role="listbox" aria-label="기술 검색 결과">
      {filtered.length?filtered.map((s,i)=><button type="button" key={s.id}
        role="option" aria-selected={s.id===selectedId} className={i===active?'active':''}
        onMouseDown={e=>e.preventDefault()} onClick={()=>choose(s)}>
          <span>{s.name}</span><small>{[s.category,s.subcategory].filter(Boolean).join(' · ')}</small>
        </button>):<p>일치하는 기술이 없어.</p>}
   </div>}
   {selectedId&&<small className="tech-muted">연결됨: {chosen?.name||'기술을 다시 선택해 줘'}</small>}
 </div>
}
function Video({id,onReady,onPlaying}){const host=useRef(null);useEffect(()=>{if(!id){onReady(null);return}let instance,disposed=false;const mount=()=>{if(disposed||!window.YT?.Player||!host.current)return;instance=new window.YT.Player(host.current,{videoId:id,playerVars:{playsinline:1,rel:0},events:{onReady:e=>onReady(e.target),onStateChange:e=>onPlaying(e.data===1)}})};if(window.YT?.Player)mount();else{const previous=window.onYouTubeIframeAPIReady;window.onYouTubeIframeAPIReady=()=>{previous?.();mount()};if(!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')){const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';document.head.appendChild(script)}}return()=>{disposed=true;onReady(null);try{instance?.destroy()}catch{}}},[id]);return id?<div className="tech-video" ref={host}/>:<div className="tech-video tech-no-video">유튜브 URL을 등록해 줘.</div>}
export default function TechniqueBookmarkStudio({item,genres,skills,onSave,onAutoSave,onDelete,onEvaluate,recordingLogs=[],recordingKind='technique',onSaveRecording,onDeleteRecording,songMode=false,pointMode=false,onUploadMR,onPersistMRSettings,onPlaybackSeconds,draftScope='guest'}){const draftKey='sing-flow-bookmark-draft-v2:'+draftScope+':'+recordingKind+':'+item.id;
const restoredDraft=useRef(null);
if(restoredDraft.current===null){
 try{const saved=JSON.parse(localStorage.getItem(draftKey)||'null');
  restoredDraft.current=saved?.id===item.id? saved:{};
 }catch{restoredDraft.current={}}
}
const [v,V]=useState(()=>{
 const saved=restoredDraft.current;
 return {...item,...(saved.v||{}),mr:item.mr,clips:Array.isArray(saved.v?.clips)?saved.v.clips:normalizedClips(item)};
}),[mode,M]=useState(restoredDraft.current.mode|| (item._existing?'practice':'edit')),[index,I]=useState(restoredDraft.current.index||0),[repeat,R]=useState(true),[playing,P]=useState(false),[time,T]=useState(0),[videoDuration,VideoDuration]=useState(0),[zoom,Z]=useState(false),[status,S]=useState(''),[note,N]=useState(''),[ready,Q]=useState(false),[mrReady,MRReady]=useState(false),[source,Source]=useState('youtube'),[mrFile,MRFile]=useState(null),[mrBusy,MRBusy]=useState(false),[mrUrl,MRUrl]=useState(''),[mrError,MRError]=useState(''),[chapterText,ChapterText]=useState(restoredDraft.current.chapterText||''),[chapterNotice,ChapterNotice]=useState('');
const autoSaveRef=useRef(onAutoSave),player=useRef(null),mrPlayer=useRef(null),playbackPending=useRef(0),playbackCallback=useRef(onPlaybackSeconds),playbackActive=useRef(false),edited=useRef(Boolean(item.title||restoredDraft.current.v?.title)),clip=v.clips[index],id=videoId(v.url),current=skills.filter(s=>s.genre===v.genre),[titleLoading,TL]=useState(false),[titleNotice,TN]=useState('');
// Safari can discard an inactive tab or cross-origin iframe; keep edit state across reloads.
useEffect(()=>{
 try{
  const snapshot={id:item.id,v:{...v,mr:undefined},mode,index,chapterText};
  localStorage.setItem(draftKey,JSON.stringify(snapshot));
 }catch{}
},[draftKey,item.id,v,mode,index,chapterText]);
const clearEditorDraft=()=>{try{localStorage.removeItem(draftKey)}catch{}};
autoSaveRef.current=onAutoSave;
useEffect(()=>{
 // Save completed field edits without closing the editor. Incomplete entries stay in the local draft.
 if(mode!=='edit'||!autoSaveRef.current||!String(v.title||'').trim()||!videoId(v.url))return;
 if(songMode&&!skills.some(skill=>skill.id===v.songId))return;
 if(v.clips.some(c=>!Number.isFinite(sec(c.start))||!Number.isFinite(sec(c.end))||sec(c.start)<0||sec(c.end)<=sec(c.start)))return;
 if(!songMode&&v.clips.some(c=>!pointMode&&!c.fullVideo&&!c.chapterImported&&!skills.some(skill=>skill.id===c.skillId)))return;
 const timer=setTimeout(()=>{
  const cleaned={...v};
  delete cleaned._existing;
  autoSaveRef.current?.(cleaned);
 },700);
 return()=>clearTimeout(timer);
},[v,mode,songMode,skills.length]);
useEffect(()=>{
 const persistDraft=()=>{
  try{localStorage.setItem(draftKey,JSON.stringify({id:item.id,v:{...v,mr:undefined},mode,index,chapterText}))}catch{}
 };
 document.addEventListener('visibilitychange',persistDraft);
 window.addEventListener('pagehide',persistDraft);
 return()=>{
  document.removeEventListener('visibilitychange',persistDraft);
  window.removeEventListener('pagehide',persistDraft);
 };
},[draftKey,item.id,v,mode,index,chapterText]);
playbackCallback.current=onPlaybackSeconds;
const flushPlayback=()=>{
 const amount=playbackPending.current;
 if(amount>0){playbackPending.current=0;playbackCallback.current?.(amount,recordingKind)}
};
useEffect(()=>{
 // Count real foreground playing time, not the length of a video or recording logs.
 if(songMode||!onPlaybackSeconds)return;
 let previous=performance.now();
 const timer=setInterval(()=>{
  const now=performance.now();
  const elapsed=Math.min(Math.max((now-previous)/1000,0),1.5);
  previous=now;
  let active=false;
  try{active=mode==='practice'&&document.visibilityState==='visible'&&ready&&id&&player.current?.getPlayerState?.()===1}catch{}
  if(active)playbackPending.current+=elapsed;
  if(playbackPending.current>=5||(!active&&playbackActive.current))flushPlayback();
  playbackActive.current=Boolean(active);
 },1000);
 return()=>{clearInterval(timer);flushPlayback();playbackActive.current=false};
},[songMode,mode,ready,id,recordingKind]);
const change=(k,value)=>{if(k==='title')edited.current=true;if(k==='url'){edited.current=false;TN('')}V(x=>({...x,[k]:value}))};
const update=(k,value)=>V(x=>({...x,clips:x.clips.map((c,i)=>i===index?{...c,[k]:value,...(pointMode&&k==='start'&&Number.isFinite(sec(value))?{end:fmt(sec(value)+1)}:{}),...((k==='start'||k==='end')?{fullVideo:false}:{})}:c)}));
const seek=(value)=>{const n=sec(value);if(!Number.isFinite(n))return;if(songMode&&source==='mr'){mrPlayer.current?.playFrom(n);return}if(player.current){player.current.seekTo(n,true);player.current.playVideo()}};
useEffect(()=>{if(!ready)return;const timer=setInterval(()=>{try{const n=player.current?.getCurrentTime?.()||0;T(n);if(!pointMode&&mode==='practice'&&repeat&&playing&&clip&&Number.isFinite(sec(clip.end))&&n>=sec(clip.end)-.12&&sec(clip.end)>sec(clip.start))player.current.seekTo(sec(clip.start),true)}catch{}},200);return()=>clearInterval(timer)},[ready,mode,repeat,playing,pointMode,clip?.start,clip?.end]);
useEffect(()=>{if(!id||edited.current)return;const ctl=new AbortController();const timer=setTimeout(async()=>{TL(true);TN('');try{const r=await fetch('https://noembed.com/embed?url='+encodeURIComponent('https://www.youtube.com/watch?v='+id),{signal:ctl.signal});const data=await r.json();if(data.title&&!data.error&&!edited.current){V(x=>({...x,title:data.title}));TN('유튜브 제목 조회 완료 · 직접 수정 가능')}else TN('제목을 가져오지 못했어. 직접 입력해 줘.')}catch(e){if(e.name!=='AbortError')TN('제목을 가져오지 못했어. 직접 입력해 줘.')}finally{if(!ctl.signal.aborted)TL(false)}},450);return()=>{clearTimeout(timer);ctl.abort()}},[id]);
const selectFullVideo=()=>{let duration=0;try{duration=Number(player.current?.getDuration?.()||0)}catch{}duration=duration||videoDuration;if(!Number.isFinite(duration)||duration<=0){alert('영상이 준비되면 다시 눌러 줘. 영상 플레이어에서 재생 버튼을 한 번 누르면 길이를 읽을 수 있어.');return}
 const end=fmt(Math.floor(duration));V(old=>({...old,clips:old.clips.map((c,i)=>i===index?{...c,start:'00:00',end,fullVideo:true,label:c.label||'전체 영상'}:c)}))};
const importChapters=()=>{
 const {entries,invalid}=parseChapterLines(chapterText);
 if(invalid.length)return ChapterNotice('형식을 확인해 줘: '+invalid.join(', ')+'번째 줄 · 예시: 00:23 첫 번째 질문');
 if(!entries.length)return ChapterNotice('타임스탬프를 한 줄에 하나씩 붙여넣어 줘.');
 if(entries.some((entry,i)=>i>0&&entry.start<=entries[i-1].start))return ChapterNotice('시작 시간이 앞에서부터 증가하도록 정렬해 줘.');
 let duration=0;
 try{duration=Number(player.current?.getDuration?.()||0)}catch{}
 duration=duration||videoDuration;
 if(!pointMode&&(!Number.isFinite(duration)||duration<=entries[entries.length-1].start))return ChapterNotice('마지막 구간의 종료 시각을 확인하려면 유튜브 영상을 먼저 불러와 줘. 영상이 로드된 후 다시 눌러 줘.');
 const previous=v.clips[index]||v.clips[v.clips.length-1];
 const skillId=songMode?(v.songId||''):(previous?.skillId||'');
 const clips=entries.map((entry,i)=>({
  id:uid(),skillId,label:entry.label,start:fmt(entry.start),
  end:fmt(pointMode?entry.start+1:(i+1<entries.length?entries[i+1].start:Math.ceil(duration))),
  caution:'',memo:'',chapterImported:true
 }));
 const existing=new Set(v.clips.map(c=>sec(c.start)+'|'+String(c.label||'').trim()));
 const additions=clips.filter(c=>!existing.has(sec(c.start)+'|'+c.label));
 if(!additions.length)return ChapterNotice('입력한 구간이 이미 등록되어 있어.');
 V(old=>({...old,clips:[...old.clips,...additions]}));
 I(v.clips.length);
 ChapterNotice(additions.length+'개 구간 생성 완료 · 아래 저장 버튼을 눌러 줘.');
 ChapterText('');
};
const add=()=>{const previous=v.clips[index]||v.clips[v.clips.length-1];const skillId=songMode?v.songId||'':previous?.skillId||'';V(x=>({...x,clips:[...x.clips,{id:uid(),skillId,label:'',start:fmt(time),end:fmt(time+(pointMode?1:10)),caution:'',memo:''}]}));I(v.clips.length)};
const save=async()=>{if(mrBusy)return;if(!v.title?.trim())return alert('영상 제목을 입력해 줘.');if(!videoId(v.url))return alert('올바른 유튜브 URL을 입력해 줘.');if(songMode&&!skills.some(s=>s.id===v.songId))return alert('연결할 곡을 먼저 선택해 줘.');if(v.clips.some(c=>!Number.isFinite(sec(c.start))||!Number.isFinite(sec(c.end))||sec(c.start)<0||sec(c.end)<=sec(c.start)))return alert('구간 시작·종료 시간을 확인해 줘. 종료는 시작보다 뒤여야 해.');
if(!songMode&&v.clips.some(c=>!pointMode&&!c.fullVideo&&!c.chapterImported&&!skills.some(s=>s.id===c.skillId)))return alert('구간 시간이 아니라 연결 기술이 선택되지 않았어. 「연결할 기술」에서 기술을 먼저 선택하거나 「전체 영상 선택」을 눌러 줘.');const result={...v};delete result._existing;if(mrFile){MRBusy(true);try{result.mr=await onUploadMR(mrFile);MRFile(null)}catch(err){MRError('MR 업로드 실패: '+(err?.message||''));MRBusy(false);return}MRBusy(false)}clearEditorDraft();onSave(result)};
useEffect(()=>{let live=true;MRUrl('');MRReady(false);if(v.mr?.localAudio){MRUrl(v.mr.localAudio);return}if(v.mr?.path)mediaUrl(v.mr.path).then(url=>{if(live)MRUrl(url)}).catch(e=>{if(live)MRError('MR 음원 주소 오류: '+e.message)});return()=>{live=false}},[v.mr?.path,v.mr?.localAudio]);
const setMRSettings=values=>{V(old=>({...old,mrSettings:values}));onPersistMRSettings?.(v.id,values)};
const chosen=skills.find(s=>s.id===(songMode?v.songId:clip?.skillId));return <div className="tech-bookmark dance-bookmark-layout"><div className="tech-modes"><button type="button" className={mode==='practice'?'selected':''} onClick={()=>M('practice')}>연습 모드</button><button type="button" className={mode==='edit'?'selected':''} onClick={()=>M('edit')}>편집 모드</button></div>{songMode&&mode==='practice'&&<div className="mr-source-tabs"><button type="button" className={source==='youtube'?'selected':''} onClick={()=>{Source('youtube');MRReady(false)}}>유튜브</button><button type="button" className={source==='mr'?'selected':''} onClick={()=>{Source('mr');Q(false)}}>MR 음원</button></div>}
{(!songMode||source==='youtube'||mode==='edit')&&<div className={'tech-video-shell '+(zoom?'zoom':'')}><Video id={id} onReady={p=>{player.current=p;Q(Boolean(p));if(p){try{VideoDuration(Number(p.getDuration?.()||0))}catch{}}}} onPlaying={P}/>{mode==='practice'&&playing&&clip?.caution&&<div className="tech-caution"><b>주의할 점</b><span>{clip.caution}</span></div>}</div>}
{songMode&&mode==='practice'&&source==='mr'&&(mrUrl?<MRPlayer ref={mrPlayer} url={mrUrl} settings={v.mrSettings||{keyShift:0,speed:100}} onSettingsChange={setMRSettings} onReadyChange={MRReady}/>:<div className="mr-empty">MR 음원이 없어. 편집 모드에서 MR 파일을 추가해 줘.{mrError&&<small>{mrError}</small>}</div>)}
{(!songMode||source==='youtube'||mode==='edit')&&<div className="tech-zoom-bar"><button type="button" className={zoom?'active':''} onClick={()=>Z(x=>!x)}>{zoom?'원본 화면':'영상 확대'}</button><small>{zoom?'가장자리가 잘릴 수 있어. 원본 화면으로 돌아갈 수 있어.':'검은 여백이 있는 영상은 확대해서 볼 수 있어.'}</small></div>}{songMode&&mode==='edit'&&<div className="tech-fields"><SkillSearch key={v.id+'-song'} label="연결할 곡" skills={skills} selectedId={v.songId||''} onSelect={songId=>V(old=>({...old,songId,clips:old.clips.map(c=>({...c,skillId:songId}))}))}/></div>}{songMode&&mode==='practice'&&source==='mr'&&mrUrl&&<div className="tech-fields mr-recording-panel">
  <b>MR 녹음 · {((v.mrSettings?.mrClips||[]).find(c=>c.id===v.mrSettings?.activeMRClip)?.label)||'전체 곡'}</b>
  {chosen?<><label>곡 숙련도<select value={status||chosen.status||'미습득'} onChange={e=>S(e.target.value)}>{['미습득','연습 중','습득 완료'].map(x=><option key={x}>{x}</option>)}</select></label>
  <VoiceRecordingLog kind={recordingKind} skillId={chosen.id} bookmarkId={v.id} clipId={v.mrSettings?.activeMRClip||'mr-full'} logs={recordingLogs} onSave={onSaveRecording} onDelete={onDeleteRecording}/>
  <button type="button" className="secondary" onClick={()=>{onEvaluate(chosen.id,status||chosen.status||'미습득','',v.id);S('')}}><Check size={14}/> 숙련도 기록</button></>:<small className="tech-muted">먼저 편집 모드에서 곡을 연결해 줘.</small>}
 </div>}
{(!songMode||mode==='edit'||source!=='mr')&&<><div className="tech-clip-head"><b>{songMode?"곡별 영상 구간":pointMode?"기술 연결 · 타임스탬프 북마크":"연결 기술 · 영상 구간"}</b>{mode==='edit'&&<button type="button" className="secondary tiny" onClick={add}><Plus size={14}/> {pointMode?"시점 추가":"구간 추가"}</button>}</div>{mode==='edit'&&<div className="tech-chapter-import"><label>타임스탬프 일괄 입력<textarea value={chapterText} onChange={e=>{ChapterText(e.target.value);ChapterNotice('')}} rows={4} placeholder={'00:00 도입\n00:23 노래할 때 가장 많이 하는 질문\n01:03 첫 번째 질문'} /></label><div className="tech-chapter-import-foot"><small>한 줄에 시작 시각 + 제목 · {pointMode?'각 시각에 바로 이동 · 영상은 계속 재생':'종료는 다음 시작 시각 / 마지막은 영상 끝'} · 기존 항목 유지</small><button className="secondary" type="button" onClick={importChapters}><Plus size={14}/> {pointMode?"시점 자동 생성":"구간 자동 생성"}</button></div>{chapterNotice&&<small className="tech-chapter-notice" role="status">{chapterNotice}</small>}</div>}<div className="tech-clip-tabs">{v.clips.map((c,i)=><button key={c.id||i} type="button" className={index===i?'selected':''} onClick={()=>{I(i);S('');N('');seek(c.start)}}>{songMode?c.label||'구간 '+(i+1):pointMode?c.label||skills.find(s=>s.id===c.skillId)?.name||'새 시점':(c.chapterImported&&c.label)||skills.find(s=>s.id===c.skillId)?.name||c.label||(c.fullVideo?'전체 영상':'기술 선택')}{pointMode&&c.skillId&&skills.some(s=>s.id===c.skillId)&&<small>연결 기술 · {skills.find(s=>s.id===c.skillId)?.name}</small>}<small>{pointMode?c.start:c.start+'–'+c.end}</small></button>)}</div>{!clip&&<small className="tech-muted">편집 모드에서 {pointMode?"타임스탬프를":"영상 구간을"} 추가해 줘.</small>}{clip&&(mode==='edit'?<div className="tech-fields">{songMode?<label>구간 이름 (자유 입력)<input value={clip.label||''} placeholder="인트로 · 1절 · 프리코러스 · 코러스 · 브리지" onChange={e=>update('label',e.target.value)}/></label>:<><label>구간 이름<input value={clip.label||''} placeholder="영상 목차 제목" onChange={e=>update('label',e.target.value)}/></label><SkillSearch key={clip.id||index} skills={current} selectedId={clip.skillId||''} onSelect={value=>update('skillId',value)}/></>}<div className={pointMode?'tech-point-time':'two'}><label>{pointMode?'북마크 시각 (mm:ss)':'시작 (mm:ss)'}<input value={clip.start||''} onChange={e=>update('start',e.target.value)}/></label>{!pointMode&&<label>종료 (mm:ss)<input value={clip.end||''} onChange={e=>update('end',e.target.value)}/></label>}</div><div className={pointMode?'tech-point-time':'two'}><button className="secondary" type="button" onClick={()=>update('start',fmt(time))}>현재 위치 → {pointMode?'북마크':'시작'}</button>{!pointMode&&<button className="secondary" type="button" onClick={()=>update('end',fmt(time))}>현재 위치 → 종료</button>}</div>{!pointMode&&<button className="secondary tech-full-clip" type="button" onClick={selectFullVideo}>전체 영상 선택 (00:00 ~ 끝)</button>}<label>주의할 점<textarea rows={3} value={clip.caution||''} onChange={e=>update('caution',e.target.value)}/></label><button type="button" className="secondary" onClick={()=>{V(x=>({...x,clips:x.clips.filter((_,i)=>i!==index)}));I(Math.max(0,index-1))}}><Trash2 size={13}/> {pointMode?"이 시점 삭제":"이 구간 삭제"}</button></div>:<div className="tech-fields"><b>{songMode?(clip.label||'구간 '+(index+1)):clip.label||chosen?.name||'연결된 기술 없음'} · {clip.start}{!pointMode&&'–'+clip.end}</b><div className={pointMode?'tech-point-play':'two'}><button className="secondary" type="button" onClick={()=>seek(clip.start)} disabled={songMode&&source==='mr'?!mrReady:!ready}><Play size={14}/> {pointMode?'이 시각부터 재생':'구간 재생'}</button>{!pointMode&&<button type="button" className={'secondary '+(repeat?'selected':'')} onClick={()=>R(x=>!x)}><Repeat size={14}/> 반복 {repeat?'ON':'OFF'}</button>}</div>{clip.caution?.trim()&&<div style={{padding:'10px 12px',margin:'8px 0 12px',borderRadius:10,background:'#f5f0fa',color:'#443651',fontSize:13,lineHeight:1.5,whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}><b style={{display:'block',marginBottom:4,color:'#755397'}}>주의할 점</b>{clip.caution}</div>}<label>{songMode?'곡 숙련도':'기술 숙련도'}<select value={status||chosen?.status||'미습득'} onChange={e=>S(e.target.value)}>{['미습득','연습 중','습득 완료'].map(x=><option key={x}>{x}</option>)}</select></label><VoiceRecordingLog kind={recordingKind} skillId={chosen?.id} bookmarkId={v.id} clipId={clip.id} logs={recordingLogs} onSave={onSaveRecording} onDelete={onDeleteRecording}/><button type="button" className="secondary" disabled={!chosen} onClick={()=>{onEvaluate(chosen.id,status||chosen.status||'미습득','',v.id);S('')}}><Check size={14}/> 숙련도 기록</button></div>)}</>}{mode==='edit'&&<div className="tech-fields tech-bookmark-details"><label>유튜브 URL<input type="url" value={v.url||''} onChange={e=>change('url',e.target.value)}/></label><label>영상 제목<input value={v.title||''} onChange={e=>change('title',e.target.value)} placeholder={titleLoading?'영상 제목 조회 중…':'영상 제목 자동 입력'}/></label>{songMode&&<div className="mr-upload"><label>MR 음원 파일 (선택 · MP3/M4A/WAV)<input type="file" accept="audio/*,.mp3,.m4a,.wav" onChange={e=>{const f=e.target.files?.[0];if(!f)return;if(f.size>45*1024*1024){MRError('파일은 45MB 이하로 선택해 줘.');e.target.value='';return}MRFile(f);MRError('')}}/></label>{mrFile?<div className="mr-upload-pending" role="status"><strong>파일 선택 완료 · 아직 업로드 전</strong><span>{mrFile.name} · {(mrFile.size/1024/1024).toFixed(1)}MB</span><span>맨 아래 <b>저장</b> 버튼을 누르면 업로드돼.</span></div>:<small>{v.mr?.name?'등록된 MR: '+v.mr.name:'유튜브만 사용해도 돼.'}</small>}{mrError&&<small className="mr-error">{mrError}</small>}<small>선택만으로는 업로드되지 않아. 아래 저장 버튼으로 북마크와 MR을 함께 저장해.</small></div>}{(titleLoading||titleNotice)&&<small className="tech-muted">{titleLoading?'유튜브 제목 조회 중…':titleNotice}</small>}{v.url&&<a href={v.url} target="_blank" rel="noreferrer" className="tech-external"><ExternalLink size={14}/> 원본 열기</a>}</div>}<button className="primary tech-bookmark-save" type="button" disabled={mrBusy} onClick={save}><Check size={15}/> {mrBusy?"MR 업로드 중…":"저장"}</button>{item._existing&&mode==='edit'&&<button type="button" className="secondary" onClick={onDelete}><Trash2 size={14}/> 북마크 삭제</button>}</div>}
