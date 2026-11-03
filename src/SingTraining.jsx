import React,{useState} from 'react';
import {Plus,Pencil,Trash2,X,Search,Bookmark,BookOpen,Check,ExternalLink} from 'lucide-react';
import TrainingClassification from './TrainingClassification';
import Recorder from './components/Recorder';
import {trainingGuide,trainingGuideCategories} from './trainingGuide';
import './sing-training.css';
const uid=()=>globalThis.crypto?.randomUUID?.()||String(Date.now()+Math.random());
export default function SingTraining({trainings=[],categories=[],logs=[],onSave,onDelete,onRecord,onDeleteLog,renderLogs}){
 const [sub,S]=useState('library'),[major,A]=useState('전체'),[minor,B]=useState('전체'),[search,Q]=useState(''),[draft,D]=useState(null),[bookmarkDraft,BD]=useState(null);
 const majors=['전체',...new Set([...trainingGuideCategories,...categories,...trainings.map(t=>t.category)].filter(Boolean))];
 const minors=['전체',...new Set([...(major==='전체'?Object.values(trainingGuide).flat():(trainingGuide[major]||[])),...trainings.filter(t=>major==='전체'||t.category===major).map(t=>t.subcategory)].filter(Boolean))];
 const open=(item)=>{BD(null);D(item?{...structuredClone(item)}:{id:uid(),title:'',category:'',subcategory:'',description:'',bookmarks:[]})};
 const save=()=>{if(!draft?.title?.trim())return alert('훈련 이름을 입력해 줘.');onSave({...draft,title:draft.title.trim(),category:draft.category?.trim()||'기타',subcategory:draft.subcategory?.trim()||'기타'});D(null)};
 const allBookmarks=trainings.flatMap(t=>(t.bookmarks||[]).map(b=>({...b,trainingId:t.id,trainingTitle:t.title,category:t.category,subcategory:t.subcategory})));
 const matches=t=>(major==='전체'||t.category===major)&&(minor==='전체'||t.subcategory===minor)&&[t.title,t.category,t.subcategory,t.description,t.notes].join(' ').toLowerCase().includes(search.toLowerCase());
 const rows=(sub==='library'?trainings:allBookmarks).filter(matches);
 const update=(key,value)=>D(d=>({...d,[key]:value}));
 const addBookmark=()=>{if(!draft)return;BD({id:uid(),title:'',url:'',notes:''})};
 const saveBookmark=()=>{if(!bookmarkDraft?.title?.trim()||!bookmarkDraft?.url?.trim())return alert('북마크 제목과 URL을 입력해 줘.');const updated={...draft,bookmarks:[...(draft.bookmarks||[]).filter(b=>b.id!==bookmarkDraft.id),bookmarkDraft]};onSave(updated);D(updated);BD(null)};
 const existing=Boolean(draft&&trainings.some(t=>t.id===draft.id));
 return <div className="sing-training">
 <div className="sing-training-heading"><h2>보컬 훈련</h2><button type="button" className="primary compact" onClick={()=>open(null)}><Plus size={16}/> 훈련 추가</button></div>
 <div className="sing-training-tabs">{[['library','라이브러리'],['bookmarks','북마크']].map(([v,label])=><button type="button" key={v} className={sub===v?'on':''} onClick={()=>S(v)}>{label}</button>)}</div>
 <div className="sing-training-search"><Search size={15}/><input value={search} onChange={e=>Q(e.target.value)} placeholder="훈련·분류·메모 검색"/></div>
 <div className="sing-training-filters"><select aria-label="훈련 대분류" value={major} onChange={e=>{A(e.target.value);B('전체')}}>{majors.map(m=><option key={m}>{m}</option>)}</select><select aria-label="훈련 소분류" value={minor} onChange={e=>B(e.target.value)}>{minors.map(m=><option key={m}>{m}</option>)}</select></div>
 <div className="sing-training-list">{rows.map(t=><div key={(t.trainingId||'training')+'-'+t.id} className="sing-training-line"><div className="sing-training-placeholder">{sub==='library'?<BookOpen size={17}/>:<Bookmark size={17}/>}</div><button type="button" className="sing-training-line-main" onClick={()=>{if(sub==='library')open(t);else{const parent=trainings.find(x=>x.id===t.trainingId);open(parent);BD({id:t.id,title:t.title,url:t.url,notes:t.notes||''})}}}><b>{t.title}</b><small>{[t.category,t.subcategory].filter(Boolean).join(' · ')}{sub==='bookmarks'?' · '+t.trainingTitle:''}</small></button>{sub==='library'&&(t.bookmarks||[]).length>0&&<small className="sing-training-bookmark-count">{t.bookmarks.length}개</small>}<button type="button" className="sing-training-pencil" aria-label="편집" onClick={()=>{if(sub==='library')open(t);else{const parent=trainings.find(x=>x.id===t.trainingId);open(parent);BD({id:t.id,title:t.title,url:t.url,notes:t.notes||''})}}}><Pencil size={15}/></button></div>)}</div>
 {!rows.length&&<p className="sing-training-empty">등록된 {sub==='library'?'훈련':'북마크'}이 없어.</p>}
 {draft&&<div className="sing-training-overlay" onMouseDown={e=>e.target===e.currentTarget&&D(null)}><section role="dialog" aria-modal="true" className="sing-training-modal" aria-label="훈련 편집"><header className="sing-training-modalhead"><strong>훈련</strong><button type="button" onClick={()=>D(null)} aria-label="닫기"><X size={19}/></button></header><div className="sing-training-editor">
 {bookmarkDraft?<><label>북마크 제목<input value={bookmarkDraft.title||''} onChange={e=>BD(b=>({...b,title:e.target.value}))}/></label><label>영상 URL<input type="url" value={bookmarkDraft.url||''} onChange={e=>BD(b=>({...b,url:e.target.value}))}/></label><label>북마크 메모<textarea value={bookmarkDraft.notes||''} onChange={e=>BD(b=>({...b,notes:e.target.value}))}/></label>{bookmarkDraft.url&&<a href={bookmarkDraft.url} target="_blank" rel="noreferrer" className="sing-training-external"><ExternalLink size={15}/> 원본 열기</a>}<button type="button" className="sing-training-save" onClick={saveBookmark}><Check size={16}/> 북마크 저장</button>{(draft.bookmarks||[]).some(b=>b.id===bookmarkDraft.id)&&<button type="button" className="sing-training-remove" onClick={()=>{if(!confirm('이 북마크를 삭제할까요?'))return;const revised={...draft,bookmarks:(draft.bookmarks||[]).filter(b=>b.id!==bookmarkDraft.id)};onSave(revised);D(revised);BD(null)}}><Trash2 size={15}/> 북마크 삭제</button>}<button type="button" className="sing-training-cancel" onClick={()=>BD(null)}>훈련 편집으로 돌아가기</button></>:<>
 <label>훈련 이름<input value={draft.title||''} onChange={e=>update('title',e.target.value)} placeholder="훈련 이름" required/></label>
 <TrainingClassification category={draft.category||''} subcategory={draft.subcategory||''} onCategoryChange={v=>D(d=>({...d,category:v}))} onSubcategoryChange={v=>D(d=>({...d,subcategory:v}))} existingCategories={categories} trainings={trainings}/>
 <label>훈련 설명<textarea value={draft.description||''} onChange={e=>update('description',e.target.value)} placeholder="훈련 방법과 주의할 점"/></label>
 <div className="sing-training-bookmark-head"><strong>훈련 북마크 ({(draft.bookmarks||[]).length})</strong><button type="button" className="sing-training-light" onClick={()=>{if(!existing)return alert('새 훈련을 먼저 저장해 줘.');addBookmark()}}><Plus size={14}/> 북마크 추가</button></div>
 {(draft.bookmarks||[]).map(b=><button key={b.id} type="button" className="sing-training-bookmark-row" onClick={()=>BD({...b})}><Bookmark size={14}/><span>{b.title}</span><Pencil size={14}/></button>)}
 {existing&&<><div className="sing-training-recording"><strong>훈련 녹음</strong><Recorder onSave={(blob,secs,score,note)=>onRecord(blob,secs,score,note,draft.id)}/></div><strong className="sing-training-log-title">훈련 로그</strong>{renderLogs(draft.id)}</>}
 <button type="button" className="sing-training-save" onClick={save}><Check size={16}/> 저장</button>
 {existing&&<button type="button" className="sing-training-remove" onClick={()=>{if(!confirm('훈련을 삭제할까요? 기존 녹음 로그는 유지됩니다.'))return;onDelete(draft.id);D(null)}}><Trash2 size={15}/> 삭제</button>}
 </>}
 </div></section></div>}
 </div>
}
