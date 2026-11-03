import React,{useEffect,useState} from 'react';
import {Trash2} from 'lucide-react';
import Recorder from '../components/Recorder';
import {configured,mediaUrl,dateLabel,duration} from '../lib';

function RecordingAudio({log}){
 const [url,setUrl]=useState(log.localAudio||''),[error,setError]=useState('');
 useEffect(()=>{let live=true;setUrl(log.localAudio||'');setError('');if(log.media?.path&&configured)mediaUrl(log.media.path).then(u=>{if(live)setUrl(u)}).catch(e=>{if(live)setError(e.message)});return()=>{live=false}},[log.id,log.localAudio,log.media?.path]);
 return url?<audio controls preload="none" src={url} className="sing-voice-audio"/>:<small className="sing-voice-muted">{error||'오디오 불러오는 중'}</small>;
}
export default function VoiceRecordingLog({skillId,kind,bookmarkId,clipId,logs=[],onSave,onDelete,showRecorder=true}){
 const all=logs.filter(l=>l.type===kind&&l.sourceId===skillId);
 const entries=bookmarkId&&clipId?all.filter(l=>l.bookmarkId===bookmarkId&&l.clipId===clipId):all;
 const [a,A]=useState(''),[b,B]=useState('');
 if(!skillId)return <p className="sing-voice-muted">연결된 기술·훈련을 먼저 선택해 줘.</p>;
 return <div className="sing-voice-recordings">
  {showRecorder&&<section className="sing-voice-record-section"><strong>훈련 녹음</strong><Recorder key={kind+'-'+skillId+'-'+(clipId||'library')} onSave={(blob,seconds,score,note)=>onSave(blob,seconds,score,note,{kind,skillId,bookmarkId:bookmarkId||null,clipId:clipId||null})}/></section>}
  <section className="sing-voice-log-section">
   <strong>녹음·훈련 로그 ({entries.length})</strong>
   {!entries.length&&<p className="sing-voice-muted">저장된 녹음이 없어.</p>}
   {entries.map(log=><div className="sing-voice-entry" key={log.id}>
    <div className="sing-voice-entry-heading"><div><b>{dateLabel(log.date)} · {duration(log.seconds)}</b><small>자가 평가 {log.score??'-'}/5{log.note?' · '+log.note:''}</small></div><button type="button" aria-label="녹음 로그 삭제" onClick={()=>{if(confirm('이 녹음 파일과 기록을 영구 삭제할까요?'))Promise.resolve(onDelete(log.id)).catch(err=>alert('삭제 실패: '+err.message))}}><Trash2 size={15}/></button></div>
    <RecordingAudio log={log}/>
   </div>)}
   {entries.filter(l=>l.media?.path||l.localAudio).length>1&&<div className="sing-voice-compare">
    <b>A/B 녹음 비교</b><div className="sing-voice-compare-selects"><select value={a} onChange={e=>A(e.target.value)}><option value="">A 녹음 선택</option>{entries.map(l=><option value={l.id} key={l.id}>{dateLabel(l.date)}</option>)}</select><select value={b} onChange={e=>B(e.target.value)}><option value="">B 녹음 선택</option>{entries.map(l=><option value={l.id} key={l.id}>{dateLabel(l.date)}</option>)}</select></div>{a&&entries.some(l=>l.id===a)&&<RecordingAudio log={entries.find(l=>l.id===a)}/>} {b&&entries.some(l=>l.id===b)&&<RecordingAudio log={entries.find(l=>l.id===b)}/>}
   </div>}
  </section>
 </div>;
}
