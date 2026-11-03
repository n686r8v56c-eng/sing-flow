import React,{useMemo,useState} from 'react';
import {Check,Star,Trash2,HardDrive,ShieldCheck} from 'lucide-react';
import {dateLabel,duration} from './lib';
import './RecordingManager.css';

const bytesOf=l=>Number(l.media?.size)||Number(l.size)|| (l.localAudio?Math.max(0,Math.floor(l.localAudio.length*0.75)):0);
const human=n=>n>=1048576?(n/1048576).toFixed(1)+'MB':n>=1024?(n/1024).toFixed(0)+'KB':n?String(n)+'B':'—';
const label=(l,songs,trainings,techniques)=>{
 const item=(songs||[]).find(x=>x.id===l.sourceId)||(trainings||[]).find(x=>x.id===l.sourceId)||(techniques||[]).find(x=>x.id===l.sourceId);
 return item?.title||item?.name||({'song':'노래 녹음','training':'훈련 녹음','technique':'기술 녹음'}[l.type]||'녹음');
};
export default function RecordingManager({logs=[],songs=[],trainings=[],techniques=[],onDelete,onPin,loading=false}){
 const [scope,S]=useState('전체'),[period,P]=useState('전체'),[order,O]=useState('최신순'),[selected,Q]=useState([]),[message,M]=useState('');
 const scopes=['전체',...new Set(logs.map(l=>label(l,songs,trainings,techniques)))];
 const threshold=period==='30일 이전'?30:period==='90일 이전'?90:period==='1년 이전'?365:0;
 const cutoff=threshold?Date.now()-threshold*86400000:0;
 const visible=useMemo(()=>logs.filter(l=>(scope==='전체'||label(l,songs,trainings,techniques)===scope)&&(!cutoff||(Number.isFinite(Date.parse(l.date))&&Date.parse(l.date)<cutoff))).sort((a,b)=>order==='큰 파일순'?bytesOf(b)-bytesOf(a):Date.parse(b.date||0)-Date.parse(a.date||0)),[logs,scope,cutoff,order,songs,trainings,techniques]);
 const eligible=visible.filter(l=>!l.pinned);
 const picked=eligible.filter(l=>selected.includes(l.id));
 const size=logs.reduce((a,l)=>a+bytesOf(l),0),pickedSize=picked.reduce((a,l)=>a+bytesOf(l),0);
 const pick=id=>Q(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
 const all=()=>Q(prev=>eligible.every(l=>prev.includes(l.id))?prev.filter(id=>!eligible.some(l=>l.id===id)):[...new Set([...prev,...eligible.map(l=>l.id)])]);
 const recent3=()=>{
  const groups=new Map();
  for(const l of [...logs].sort((a,b)=>Date.parse(b.date||0)-Date.parse(a.date||0))){
   const key=(l.type||'')+'|'+(l.sourceId||'');
   groups.set(key,[...(groups.get(key)||[]),l]);
  }
  const old=[...groups.values()].flatMap(group=>group.slice(3)).filter(l=>!l.pinned);
  Q(old.map(l=>l.id));M('곡·기술·훈련별 최근 3개를 제외한 '+old.length+'개를 선택했어. 별표 녹음은 보호돼.');
 };
 const del=async()=>{
  if(!picked.length||loading)return;
  const counts=picked.length,amount=human(pickedSize);
  if(!window.confirm(counts+'개 녹음 파일과 기록을 영구 삭제할까요?\n예상 확보 용량: '+amount+'\n삭제한 녹음은 복구할 수 없어.'))return;
  M('');
  try{
   const result=await onDelete(picked.map(l=>l.id));
   Q(old=>old.filter(id=>!result.deleted.includes(id)));
   M(result.deleted.length+'개 삭제 완료'+(result.failed.length?' · '+result.failed.length+'개 실패 (목록에 유지, 다시 시도 가능)':'')+(result.warning?' · '+result.warning:''));
  }catch(e){M('삭제 실패: '+(e?.message||'알 수 없는 오류'))}
 };
 return <section className="recording-manager">
  <div className="rm-metrics"><div><small>녹음 파일</small><b>{logs.length}개</b></div><div><small>확인 가능한 용량</small><b>{human(size)}</b></div></div>
  <small className="rm-hint"><HardDrive size={13}/> 크기가 없는 예전 기록은 용량 합산에서 제외될 수 있어.</small>
  <div className="rm-filters">
   <select aria-label="곡·훈련별 필터" value={scope} onChange={e=>S(e.target.value)}>{scopes.map(x=><option key={x}>{x}</option>)}</select>
   <select aria-label="기간별 필터" value={period} onChange={e=>P(e.target.value)}>{['전체','30일 이전','90일 이전','1년 이전'].map(x=><option key={x}>{x}</option>)}</select>
   <select aria-label="녹음 정렬" value={order} onChange={e=>O(e.target.value)}>{['최신순','큰 파일순'].map(x=><option key={x}>{x}</option>)}</select>
  </div>
  <div className="rm-actions"><button type="button" className="rm-light" onClick={all} disabled={loading||!eligible.length}><Check size={14}/> {eligible.length&&eligible.every(l=>selected.includes(l.id))?'선택 해제':'전체 선택'}</button><button type="button" className="rm-light" onClick={recent3} disabled={loading||!logs.length}><ShieldCheck size={14}/> 최근 3개 남기기</button></div>
  <div className="rm-list">{visible.map(l=><div key={l.id} className="rm-entry">
   <input type="checkbox" aria-label={label(l,songs,trainings,techniques)+' 녹음 선택'} checked={selected.includes(l.id)&&!l.pinned} disabled={loading||l.pinned} onChange={()=>pick(l.id)}/>
   <div className="rm-main"><b>{label(l,songs,trainings,techniques)}</b><small>{dateLabel(l.date)} · {duration(l.seconds)} · {human(bytesOf(l))}</small></div>
   <button type="button" className={'rm-pin '+(l.pinned?'on':'')} disabled={loading} onClick={()=>{onPin(l.id,!l.pinned);Q(old=>old.filter(id=>id!==l.id))}} title={l.pinned?'별표 보호 해제':'별표로 삭제 보호'} aria-label={l.pinned?'보호 해제':'삭제 보호'}><Star size={17} fill={l.pinned?'currentColor':'none'}/></button>
  </div>)}</div>
  {!visible.length&&<p className="rm-empty">이 조건의 녹음이 없어.</p>}
  <div className="rm-bottom"><div><b>{picked.length}개 선택</b><small>예상 확보 용량 {human(pickedSize)}</small></div><button type="button" className="rm-delete" disabled={loading||!picked.length} onClick={del}><Trash2 size={15}/> {loading?'삭제 중…':'선택 삭제'}</button></div>
  {message&&<p className="rm-message" role="status">{message}</p>}
  <small className="rm-hint">별표 녹음은 일괄 삭제에서 제외돼. 삭제 시 Storage 파일과 녹음 기록을 함께 정리해.</small>
 </section>
}
