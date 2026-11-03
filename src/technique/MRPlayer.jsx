import React,{forwardRef,useEffect,useImperativeHandle,useRef,useState} from 'react';
import * as Tone from 'tone';
import {Play,Pause,Minus,Plus,RotateCcw,Repeat,Trash2} from 'lucide-react';

const showTime=n=>{const s=Math.max(0,Math.floor(n||0));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
const parseTime=(value)=>{const t=String(value??'').trim();if(/^\d+:\d{1,2}$/.test(t)){const [m,s]=t.split(':').map(Number);return s<60?m*60+s:NaN}return t!==''&&Number.isFinite(Number(t))?Number(t):NaN};
const defaultSegment={id:'mr-full',label:'전체 곡',start:0,end:0,caution:''};
const MRPlayer=forwardRef(function MRPlayer({url,settings,onSettingsChange,onReadyChange},ref){
 const [ready,R]=useState(false),[busy,B]=useState(false),[playing,P]=useState(false),[time,T]=useState(0),[length,L]=useState(0),[error,E]=useState('');
 const player=useRef(null),position=useRef(0),clock=useRef(0),running=useRef(false),rate=useRef(1),keyRef=useRef(0),lengthRef=useRef(0),repeatRef=useRef(true),segmentRef=useRef(defaultSegment);
 const key=clamp(Number(settings?.keyShift)||0,-6,6),speed=clamp(Number(settings?.speed)||100,50,125);
 keyRef.current=key;
 const segments=[defaultSegment,...(Array.isArray(settings?.mrClips)?settings.mrClips:[])];
 const active=segments.find(x=>x.id===settings?.activeMRClip)||defaultSegment;
 const activeStart=Number(active.start)||0;
 const activeEnd=active.id==='mr-full'?length:Number(active.end)||0;
 const valid=active.id==='mr-full'||(Number.isFinite(activeStart)&&Number.isFinite(activeEnd)&&activeEnd>activeStart&&activeStart>=0&&activeEnd<=length);
 const repeat=settings?.mrRepeat??true;
 repeatRef.current=repeat;segmentRef.current={...active,start:activeStart,end:activeEnd};
 const current=()=>running.current?position.current+(Tone.now()-clock.current)*rate.current:position.current;
 const stop=()=>{try{player.current?.stop()}catch{}running.current=false;P(false)};
 const playAt=async t=>{
  if(!player.current||!player.current.loaded)return;
  try{
   await Tone.start();
   const dur=lengthRef.current,begin=clamp(Number(t)||0,0,Math.max(0,dur-0.05));
   try{player.current.stop()}catch{}
   player.current.loop=false;
   player.current.detune=keyRef.current*100;
   player.current.playbackRate=rate.current;
   player.current.start(undefined,begin);
   position.current=begin;clock.current=Tone.now();running.current=true;T(begin);P(true);E('');
  }catch(err){E('MR 재생 실패: '+(err?.message||'재생 권한을 확인해 줘'))}
 };
 const pause=()=>{if(!running.current)return;position.current=clamp(current(),0,lengthRef.current);stop();T(position.current)};
 const seek=t=>{const n=clamp(Number(t)||0,0,lengthRef.current);if(running.current)playAt(n);else{position.current=n;T(n)}};
 useImperativeHandle(ref,()=>({playFrom:playAt,pause,stop,getTime:()=>current(),isReady:()=>Boolean(player.current?.loaded)}));
 useEffect(()=>{let cancelled=false;stop();player.current?.dispose();player.current=null;R(false);onReadyChange?.(false);B(Boolean(url));E('');T(0);L(0);position.current=0;
  if(!url){B(false);return}
  const p=new Tone.GrainPlayer({url,loop:false,grainSize:0.12,overlap:0.06,detune:keyRef.current*100,playbackRate:rate.current,onload:()=>{if(cancelled)return;const len=p.buffer.duration;lengthRef.current=len;L(len);R(true);onReadyChange?.(true);B(false)},onerror:(err)=>{if(!cancelled){E('MR 파일을 불러오지 못했어: '+(err?.message||''));B(false)}}}).toDestination();
  player.current=p;
  return()=>{cancelled=true;try{p.stop();p.dispose()}catch{}if(player.current===p)player.current=null;running.current=false;onReadyChange?.(false)};
 },[url]);
 useEffect(()=>{if(running.current){position.current=current();clock.current=Tone.now()}rate.current=speed/100;if(player.current)player.current.playbackRate=rate.current},[speed]);
 useEffect(()=>{if(player.current)player.current.detune=key*100},[key]);
 useEffect(()=>{if(!ready)return;const timer=setInterval(()=>{
   if(!running.current)return;
   const p=current(),clip=segmentRef.current,end=clip.id==='mr-full'?lengthRef.current:Math.min(clip.end,lengthRef.current);
   if(p>=end-0.06){
    if(repeatRef.current){playAt(clip.id==='mr-full'?0:clip.start)}
    else{position.current=end;stop();T(end)}
   }else T(p);
  },120);return()=>clearInterval(timer);
 },[ready]);
 const setSettings=(name,value)=>onSettingsChange?.({...settings,[name]:value});
 const selectSegment=id=>{pause();onSettingsChange?.({...settings,activeMRClip:id});};
 const updateSegment=(id,changes)=>onSettingsChange?.({...settings,mrClips:(settings?.mrClips||[]).map(x=>x.id===id?{...x,...changes}:x)});
 const addSegment=()=>{const now=clamp(current(),0,lengthRef.current);const start=Math.floor(now),end=Math.min(lengthRef.current,start+15);const id='mr-'+(globalThis.crypto?.randomUUID?.()||Date.now());onSettingsChange?.({...settings,activeMRClip:id,mrClips:[...(settings?.mrClips||[]),{id,label:'새 구간',start,end,caution:''}]});pause()};
 const removeSegment=()=>{if(active.id==='mr-full')return;pause();onSettingsChange?.({...settings,activeMRClip:'mr-full',mrClips:(settings?.mrClips||[]).filter(x=>x.id!==active.id)})};
 const startSegment=()=>{if(!valid)return;playAt(activeStart)};
 const [editTimes,EditTimes]=useState({start:'',end:''});
 useEffect(()=>{EditTimes({start:showTime(activeStart),end:showTime(activeEnd)})},[active.id,activeStart,activeEnd]);
 return <div className="mr-player">
  <div className="mr-player-top"><strong>MR 음원 플레이어</strong><small>{busy?'음원 준비 중…':ready?'키·속도 독립 조절':'MR 음원을 등록해 줘'}</small></div>
  <div className="mr-transport"><button type="button" className="mr-play" onClick={()=>playing?pause():playAt(position.current)} disabled={!ready} aria-label={playing?'일시정지':'MR 재생'}>{playing?<Pause size={20}/>:<Play size={20}/>}</button><div className="mr-progress"><input type="range" min="0" max={Math.max(1,length)} step=".1" value={Math.min(time,length||0)} onChange={e=>seek(Number(e.target.value))} disabled={!ready} aria-label="MR 재생 위치"/><div><small>{showTime(time)}</small><small>{showTime(length)}</small></div></div></div>
  <div className="mr-control-head"><b>키 조절</b><strong>{key>0?'+':''}{key} 반음</strong></div>
  <div className="mr-adjust"><button type="button" onClick={()=>setSettings('keyShift',clamp(key-1,-6,6))} disabled={!ready||key===-6} aria-label="반음 낮추기"><Minus size={16}/></button><input type="range" min="-6" max="6" step="1" value={key} onChange={e=>setSettings('keyShift',Number(e.target.value))} aria-label="반음 단위 키 조절" disabled={!ready}/><button type="button" onClick={()=>setSettings('keyShift',clamp(key+1,-6,6))} disabled={!ready||key===6} aria-label="반음 높이기"><Plus size={16}/></button><button type="button" className="mr-reset" onClick={()=>setSettings('keyShift',0)} disabled={!ready||key===0}>원키</button></div>
  <div className="mr-control-head"><b>속도 조절</b><strong>{speed}%</strong></div>
  <div className="mr-adjust"><button type="button" onClick={()=>setSettings('speed',clamp(speed-1,50,125))} disabled={!ready||speed===50} aria-label="속도 1퍼센트 낮추기"><Minus size={16}/></button><input type="range" min="50" max="125" step="1" value={speed} onChange={e=>setSettings('speed',Number(e.target.value))} aria-label="재생 속도 조절" disabled={!ready}/><button type="button" onClick={()=>setSettings('speed',clamp(speed+1,50,125))} disabled={!ready||speed===125} aria-label="속도 1퍼센트 높이기"><Plus size={16}/></button><button type="button" className="mr-reset" onClick={()=>setSettings('speed',100)} disabled={!ready||speed===100}><RotateCcw size={13}/></button></div>
  <div className="mr-segment-head"><b>MR 구간 설정</b><button type="button" onClick={addSegment} disabled={!ready}><Plus size={14}/> 구간 추가</button></div>
  <div className="mr-segment-tabs">{segments.map(x=><button type="button" key={x.id} className={active.id===x.id?'selected':''} onClick={()=>selectSegment(x.id)}><b>{x.label||'이름 없는 구간'}</b><small>{x.id==='mr-full'?'전체 재생':showTime(x.start)+'–'+showTime(x.end)}</small></button>)}</div>
  {active.id!=='mr-full'&&<div className="mr-segment-editor">
   <label>구간 이름<input value={active.label||''} onChange={e=>updateSegment(active.id,{label:e.target.value})} placeholder="코러스 · 브리지 · 1절"/></label>
   <div className="mr-segment-times">
     <label>시작 (mm:ss)<input inputMode="numeric" value={editTimes.start} onChange={e=>EditTimes(x=>({...x,start:e.target.value}))} onBlur={()=>{const n=parseTime(editTimes.start);if(Number.isFinite(n)&&n>=0&&n<activeEnd)updateSegment(active.id,{start:n});else EditTimes(x=>({...x,start:showTime(activeStart)}))}}/></label>
     <label>종료 (mm:ss)<input inputMode="numeric" value={editTimes.end} onChange={e=>EditTimes(x=>({...x,end:e.target.value}))} onBlur={()=>{const n=parseTime(editTimes.end);if(Number.isFinite(n)&&n>activeStart&&n<=lengthRef.current)updateSegment(active.id,{end:n});else EditTimes(x=>({...x,end:showTime(activeEnd)}))}}/></label>
   </div>
   <div className="mr-segment-marks"><button type="button" onClick={()=>{const n=Math.floor(current());if(n<activeEnd)updateSegment(active.id,{start:n})}}>현재 위치 → 시작</button><button type="button" onClick={()=>{const n=Math.ceil(current());if(n>activeStart&&n<=lengthRef.current)updateSegment(active.id,{end:n})}}>현재 위치 → 종료</button></div>
   <label>주의할 점<textarea rows={2} value={active.caution||''} onChange={e=>updateSegment(active.id,{caution:e.target.value})} placeholder="호흡 · 박자 · 발성 주의점"/></label>
   <button type="button" className="mr-segment-remove" onClick={removeSegment}><Trash2 size={13}/> 이 구간 삭제</button>
  </div>}
  <div className="mr-segment-play"><button type="button" onClick={startSegment} disabled={!ready||!valid}><Play size={15}/> {active.id==='mr-full'?'전체 재생':'이 구간 재생'}</button><button type="button" className={repeat?'selected':''} onClick={()=>setSettings('mrRepeat',!repeat)}><Repeat size={15}/> 반복 {repeat?'ON':'OFF'}</button></div>
  {active.caution?.trim()&&<div className="mr-segment-caution"><b>주의할 점</b>{active.caution}</div>}
  {!valid&&<small className="mr-error">구간 시작·종료 시간을 확인해 줘.</small>}
  <small className="mr-tip">MR 구간은 유튜브 구간과 별도로 저장돼. 선택한 구간과 반복 설정도 기억해.</small>
  {error&&<p className="mr-error" role="alert">{error}</p>}
  <small className="mr-tip">키 ±6반음 · 속도 50~125% (1% 단위). 원본 MR은 변경되지 않아. 큰 폭의 변조에서는 음질이 달라질 수 있어.</small>
 </div>;
});
export default MRPlayer;
