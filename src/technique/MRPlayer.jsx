import React,{forwardRef,useEffect,useImperativeHandle,useRef,useState} from 'react';
import * as Tone from 'tone';
import {Play,Pause,Minus,Plus,RotateCcw} from 'lucide-react';

const showTime=n=>{const s=Math.max(0,Math.floor(n||0));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
const MRPlayer=forwardRef(function MRPlayer({url,clip,repeat=true,settings,onSettingsChange,onReadyChange},ref){
 const [ready,R]=useState(false),[busy,B]=useState(false),[playing,P]=useState(false),[time,T]=useState(0),[length,L]=useState(0),[error,E]=useState('');
 const player=useRef(null),position=useRef(0),clock=useRef(0),running=useRef(false),rate=useRef(1),keyRef=useRef(0),lengthRef=useRef(0),repeatRef=useRef(true);
 const key=clamp(Number(settings?.keyShift)||0,-6,6),speed=clamp(Number(settings?.speed)||100,50,125);
 rate.current=speed/100;keyRef.current=key;
 const clipA=Number.isFinite(Number(clip?.startSeconds))?Number(clip.startSeconds):0;
 const clipB=Number.isFinite(Number(clip?.endSeconds))?Number(clip.endSeconds):0;
 repeatRef.current=repeat;
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
 useEffect(()=>{if(player.current){player.current.detune=key*100;player.current.playbackRate=speed/100}},[key,speed]);
 useEffect(()=>{if(!ready)return;const timer=setInterval(()=>{
   if(!running.current)return;
   const p=current(),end=clipB>clipA?Math.min(clipB,lengthRef.current):lengthRef.current;
   if(p>=end-0.06){
    if(repeatRef.current){const from=clipB>clipA?clipA:0;playAt(from)}
    else{position.current=end;stop();T(end)}
   }else T(p);
  },120);return()=>clearInterval(timer);
 },[ready,clipA,clipB]);
 const setSettings=(name,value)=>onSettingsChange?.({...settings,[name]:value});
 return <div className="mr-player">
  <div className="mr-player-top"><strong>MR 음원 플레이어</strong><small>{busy?'음원 준비 중…':ready?'키·속도 독립 조절':'MR 음원을 등록해 줘'}</small></div>
  <div className="mr-transport"><button type="button" className="mr-play" onClick={()=>playing?pause():playAt(position.current)} disabled={!ready} aria-label={playing?'일시정지':'MR 재생'}>{playing?<Pause size={20}/>:<Play size={20}/>}</button><div className="mr-progress"><input type="range" min="0" max={Math.max(1,length)} step=".1" value={Math.min(time,length||0)} onChange={e=>seek(Number(e.target.value))} disabled={!ready} aria-label="MR 재생 위치"/><div><small>{showTime(time)}</small><small>{showTime(length)}</small></div></div></div>
  <div className="mr-control-head"><b>키 조절</b><strong>{key>0?'+':''}{key} 반음</strong></div>
  <div className="mr-adjust"><button type="button" onClick={()=>setSettings('keyShift',clamp(key-1,-6,6))} disabled={!ready||key===-6} aria-label="반음 낮추기"><Minus size={16}/></button><input type="range" min="-6" max="6" step="1" value={key} onChange={e=>setSettings('keyShift',Number(e.target.value))} aria-label="반음 단위 키 조절" disabled={!ready}/><button type="button" onClick={()=>setSettings('keyShift',clamp(key+1,-6,6))} disabled={!ready||key===6} aria-label="반음 높이기"><Plus size={16}/></button><button type="button" className="mr-reset" onClick={()=>setSettings('keyShift',0)} disabled={!ready||key===0}>원키</button></div>
  <div className="mr-control-head"><b>속도 조절</b><strong>{speed}%</strong></div>
  <div className="mr-adjust"><button type="button" onClick={()=>setSettings('speed',clamp(speed-1,50,125))} disabled={!ready||speed===50} aria-label="속도 1퍼센트 낮추기"><Minus size={16}/></button><input type="range" min="50" max="125" step="1" value={speed} onChange={e=>setSettings('speed',Number(e.target.value))} aria-label="재생 속도 조절" disabled={!ready}/><button type="button" onClick={()=>setSettings('speed',clamp(speed+1,50,125))} disabled={!ready||speed===125} aria-label="속도 1퍼센트 높이기"><Plus size={16}/></button><button type="button" className="mr-reset" onClick={()=>setSettings('speed',100)} disabled={!ready||speed===100}><RotateCcw size={13}/></button></div>
  {error&&<p className="mr-error" role="alert">{error}</p>}
  <small className="mr-tip">키 ±6반음 · 속도 50~125% (1% 단위). 원본 MR은 변경되지 않아. 큰 폭의 변조에서는 음질이 달라질 수 있어.</small>
 </div>;
});
export default MRPlayer;
