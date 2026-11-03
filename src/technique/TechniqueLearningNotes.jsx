import React,{useMemo,useState}from'react';
import{Copy,ExternalLink}from'lucide-react';
import{primaryPhoto}from'./TechniquePhotos';
import{normalizedClips,videoId}from'./TechniqueBookmarkStudio';
const clipStartSeconds=value=>{const parts=String(value||'').split(':').map(Number);return parts.length===2&&parts.every(Number.isFinite)?Math.max(0,Math.floor(parts[0]*60+parts[1])):0};
const youtubeClipUrl=(url,start)=>{const id=videoId(url);return id?'https://www.youtube.com/watch?v='+id+'&t='+clipStartSeconds(start)+'s':''};
export default function TechniqueLearningNotes({genre,skills,bookmarks,notes=[],kind='기술'}){const[major,A]=useState('전체'),[minor,B]=useState('전체'),[skillId,C]=useState('전체'),[type,D]=useState('전체'),[query,Q]=useState('');
const current=skills.filter(s=>s.genre===genre),cats=['전체',...new Set(current.map(s=>s.category).filter(Boolean))],subs=['전체',...new Set(current.filter(s=>major==='전체'||s.category===major).map(s=>s.subcategory).filter(Boolean))],filtered=current.filter(s=>(major==='전체'||s.category===major)&&(minor==='전체'||s.subcategory===minor));
const entries=useMemo(()=>{const result=[];for(const s of current){const base={skillId:s.id,skill:s.name,category:s.category||'',subcategory:s.subcategory||'',representativePhoto:primaryPhoto(s)};if(s.memo)result.push({...base,type:'기술 메모',content:s.memo});for(const h of s.statusHistory||[])if(h.note)result.push({...base,type:'연습 메모',content:h.note,at:h.at,status:h.status,source:h.source});for(const b of bookmarks.filter(b=>b.genre===genre)){for(const c of normalizedClips(b).filter(c=>c.skillId===s.id)){if(c.caution)result.push({...base,type:'주의할 점',content:c.caution,bookmarkTitle:b.title,clipLabel:c.label||'',start:c.start,end:c.end,youtubeUrl:youtubeClipUrl(b.url,c.start)});if(c.memo)result.push({...base,type:'구간 메모',content:c.memo,bookmarkTitle:b.title,clipLabel:c.label||'',start:c.start,end:c.end,youtubeUrl:youtubeClipUrl(b.url,c.start)})}}}for(const n of notes.filter(n=>n.genre===genre))result.push({skill:n.title||'자유 메모',category:'',subcategory:'',type:'자유 메모',content:n.memo||'',id:n.id});return result},[genre,skills,bookmarks,notes]);
const shown=entries.filter(n=>(major==='전체'||n.category===major)&&(minor==='전체'||n.subcategory===minor)&&(skillId==='전체'||n.skillId===skillId)&&(type==='전체'||n.type===type)&&[n.skill,n.content,n.bookmarkTitle,n.category,n.subcategory].join(' ').toLowerCase().includes(query.toLowerCase()));
const [copied,SetCopied]=useState('');
const copyAll=async()=>{
 if(!shown.length)return;
 const text=shown.map(n=>String(n.content||'').trim()).filter(Boolean).join('\n\n');
 if(!text)return;
 try{
  if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text)}
  else{
   const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();
   const ok=document.execCommand('copy');area.remove();if(!ok)throw Error('복사 실패');
  }
  SetCopied('메모 '+shown.length+'개 복사됨');
 }catch{SetCopied('복사 권한을 확인해 줘.')}
};

return <div className="tech-notes"><div className="tech-note-filters"><select value={major} onChange={e=>{A(e.target.value);B('전체');C('전체')}}><option>전체</option>{cats.slice(1).map(x=><option key={x}>{x}</option>)}</select><select value={minor} onChange={e=>{B(e.target.value);C('전체')}}><option>전체</option>{subs.slice(1).map(x=><option key={x}>{x}</option>)}</select><select value={skillId} onChange={e=>C(e.target.value)}><option value="전체">전체 기술</option>{filtered.map(s=><option value={s.id} key={s.id}>{s.name}</option>)}</select><select value={type} onChange={e=>D(e.target.value)}>{['전체','기술 메모','주의할 점','구간 메모','연습 메모','자유 메모'].map(x=><option key={x}>{x}</option>)}</select></div><div className="search"><input value={query} onChange={e=>Q(e.target.value)} placeholder="기술·학습 메모 검색"/></div><div className="tech-note-head"><b>{kind==='곡명'?'학습 메모':'학습 노트'} {shown.length}개</b><button type="button" className="secondary tiny tech-note-copy-all" disabled={!shown.length} onClick={copyAll} title="현재 필터에 표시된 메모 전체 복사" aria-label="현재 필터의 모든 메모 복사"><Copy size={14}/> 전체 복사</button></div>{copied&&<small role="status" className="tech-copy-status">{copied}</small>}{shown.map((n,i)=><div className="tech-note-entry" key={(n.id||n.skillId)+'-'+i}>{n.representativePhoto&&<img src={n.representativePhoto} alt=""/>}<div className="tech-note-body"><b>{n.skill}</b><small>{[n.category,n.subcategory,n.type].filter(Boolean).join(' · ')}</small>{n.bookmarkTitle&&<small>{n.bookmarkTitle}{n.clipLabel?' · '+n.clipLabel:''} · {n.start}–{n.end}</small>}{n.at&&<small>{new Date(n.at).toLocaleDateString('ko-KR')} · {n.status||''}</small>}<div className="tech-note-copy"><p>{n.content}</p><div className="tech-note-actions">{n.youtubeUrl&&<a className="tech-note-youtube" href={n.youtubeUrl} target="_blank" rel="noopener noreferrer" title="이 메모의 유튜브 구간 열기" aria-label={n.skill+" 유튜브 구간 열기"}><ExternalLink size={15}/></a>}</div></div></div></div>)}{!shown.length&&<p className="empty">선택한 조건에 해당하는 메모가 없어.</p>}</div>}
