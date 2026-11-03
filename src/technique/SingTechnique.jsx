import React,{useEffect,useState} from 'react';
import {BookOpen,Plus,Pencil,Trash2,X,Search,Bookmark,Check} from 'lucide-react';
import TechniquePhotos,{primaryPhoto} from './TechniquePhotos';
import TechniqueBookmarkStudio,{videoId,normalizedClips} from './TechniqueBookmarkStudio';
import TechniqueLearningNotes from './TechniqueLearningNotes';
import VoiceRecordingLog from './VoiceRecordingLog';
import {VOCAL_GENRE,vocalTechniqueGuide,vocalTechniqueCategories} from './vocalGuide';
import {trainingGuide,trainingGuideCategories} from '../trainingGuide';
import './sing-technique.css';
import KaraokeFields from './KaraokeFields';
const uid=()=>globalThis.crypto?.randomUUID?.()||String(Date.now()+Math.random());
const statuses=['미습득','연습 중','습득 완료'];
const empty=()=>({skills:[],bookmarks:[],notes:[]});
export default function SingTechnique({value,onChange,mode='technique',recordingLogs=[],onSaveRecording,onDeleteRecording,onUploadMR,onPlaybackSeconds,draftScope='guest'}){
 const isTraining=mode==='training',isSong=mode==='song';
 const guideMap=isTraining?trainingGuide:vocalTechniqueGuide;
 const guideCategories=isTraining?trainingGuideCategories:vocalTechniqueCategories;
 const itemLabel=isSong?'곡명':isTraining?'훈련':'기술';
 const d={...empty(),...(value||{})};
 const [sub,Sub]=useState('bookmarks'),[query,Q]=useState(''),[major,A]=useState('전체'),[minor,B]=useState('전체');
 const modalKey='sing-flow-open-bookmark-v2:'+draftScope+':'+mode;
 const [modal,M]=useState(()=>{
  try{const saved=JSON.parse(localStorage.getItem(modalKey)||'null');return saved?.type==='bookmarks'&&saved.item?.id?saved:null}catch{return null}
 }),[guide,G]=useState(false),[linkedSkill,LinkedSkill]=useState(null);
 useEffect(()=>{
  try{
   if(modal?.type==='bookmarks')localStorage.setItem(modalKey,JSON.stringify(modal));
   else localStorage.removeItem(modalKey);
  }catch{}
 },[modalKey,modal]);
 const clearBookmarkDraft=item=>{
  if(!item?.id)return;
  const kind=isSong?'song':isTraining?'training':'technique';
  try{localStorage.removeItem('sing-flow-bookmark-draft-v2:'+draftScope+':'+kind+':'+item.id)}catch{}
 };
 const closeModal=()=>{if(modal?.type==='bookmarks')clearBookmarkDraft(modal.item);M(null)};

 const mutate=fn=>onChange(old=>{const next=structuredClone({...empty(),...(old||{})});fn(next);return next});
 const open=(type,item)=>{G(false);M({type,item:item?{...structuredClone(item),...(type==='bookmarks'?{_existing:true}:{})}:type==='skills'?{id:uid(),genre:VOCAL_GENRE,name:'',category:'',subcategory:'',status:'미습득',images:[],memo:''}:type==='bookmarks'?{id:uid(),genre:VOCAL_GENRE,title:'',url:'',songId:isSong?'':undefined,clips:[],skillIds:[],memo:''}:{id:uid(),genre:VOCAL_GENRE,title:'',memo:''}})};
 const change=(key,val)=>M(old=>({...old,item:{...old.item,[key]:val}}));
 const saveItem=(type,item)=>{if(!(item.name||item.title)?.trim()){alert('이름을 입력해 줘.');return}const next={...item,genre:VOCAL_GENRE};if(isSong&&type==='skills'){next.name=(next.subcategory||next.name||'').trim();next.subcategory=next.name;}delete next._existing;delete next._legacySong;mutate(state=>{const list=state[type],i=list.findIndex(x=>x.id===next.id);if(type==='skills'){const before=list[i];if(before&&before.status!==next.status){const at=new Date().toISOString();next.lastEvaluatedAt=at;next.statusHistory=[...(before.statusHistory||[]),{id:uid(),at,status:next.status,note:'',source:itemLabel+' 라이브러리'}]}}if(i>=0)list[i]=next;else list.push(next)});M(null)};
 const evaluate=(id,status,note='',bookmarkId='')=>{mutate(state=>{const s=state.skills.find(x=>x.id===id);if(!s)return;const at=new Date().toISOString();s.status=status;s.lastEvaluatedAt=at;s.statusHistory=[...(s.statusHistory||[]),{id:uid(),at,status,note,source:bookmarkId?'유튜브 북마크':itemLabel+' 라이브러리',bookmarkId:bookmarkId||null}]})};
 const persistMRSettings=(bookmarkId,mrSettings)=>{if(!isSong)return;mutate(state=>{const b=state.bookmarks.find(x=>x.id===bookmarkId);if(b)b.mrSettings=mrSettings})};
 const remove=(type,id)=>{if(!confirm('삭제할까요?'))return;if(type==='bookmarks')clearBookmarkDraft({id});mutate(state=>{state[type]=state[type].filter(x=>x.id!==id)});M(null)};
 const cats=['전체',...new Set(d.skills.map(s=>s.category).filter(Boolean))],subs=['전체',...new Set(d.skills.filter(s=>major==='전체'||s.category===major).map(s=>s.subcategory).filter(Boolean))];
 const bookmarkHasSkill=(bookmark,skillId)=>Boolean(skillId)&&(
  bookmark.songId===skillId||
  (bookmark.skillIds||[]).includes(skillId)||
  normalizedClips(bookmark).some(clip=>clip.skillId===skillId)
 );
 const relatedBookmarks=skillId=>d.bookmarks.filter(bookmark=>bookmarkHasSkill(bookmark,skillId));
 const showLinkedBookmarks=skill=>{LinkedSkill(skill.id);Q('');Sub('bookmarks');M(null)};
 const bookmarkLinkedText=bookmark=>{
  const clips=normalizedClips(bookmark);
  const linkedIds=new Set([...(bookmark.skillIds||[]),bookmark.songId,...clips.map(c=>c.skillId)].filter(Boolean));
  const linked=d.skills.filter(skill=>linkedIds.has(skill.id));
  return [...linked.flatMap(skill=>[skill.name,skill.title,skill.category,skill.subcategory]),...clips.flatMap(clip=>[clip.label,clip.caution,clip.memo])];
 };
 const rows=(d[sub]||[]).filter(item=>{
  if(sub==='skills'&&!((major==='전체'||item.category===major)&&(minor==='전체'||item.subcategory===minor)))return false;
  if(sub==='bookmarks'&&linkedSkill&&!bookmarkHasSkill(item,linkedSkill))return false;
  const search=[item.name,item.title,item.url,item.category,item.subcategory,item.memo,...Object.values(item.karaoke||{}),...(sub==='bookmarks'?bookmarkLinkedText(item):[])].filter(Boolean).join(' ').toLocaleLowerCase();
  return search.includes(query.trim().toLocaleLowerCase());
 });
 const input=(label,key,props={})=><label>{label}<input {...props} value={modal.item[key]||''} onChange={e=>change(key,e.target.value)}/></label>;
 const clipCautions=modal?.type==='skills'?d.bookmarks.flatMap(b=>normalizedClips(b).filter(c=>c.skillId===modal.item.id&&c.caution?.trim()).map(c=>({id:c.id,bid:b.id,title:b.title||'영상 북마크',start:c.start,end:c.end,text:c.caution}))):[];
 return <div className="sing-tech">
 <div className="sing-tech-subtabs">{[['skills',itemLabel],['bookmarks','북마크 ('+d.bookmarks.length+')'],['notes',isSong?'학습 메모':'학습 노트']].map(([key,label])=><button type="button" key={key} className={sub===key?'on':''} onClick={()=>{Sub(key);Q('');if(key!=='bookmarks')LinkedSkill(null)}}>{label}</button>)}</div>
 <div className="sing-tech-heading"><h2>{sub==='skills'?itemLabel+' 라이브러리':sub==='bookmarks'?'영상 북마크':isSong?'학습 메모':'학습 노트'}</h2><button type="button" className="sing-tech-primary" onClick={()=>open(sub)}><Plus size={15}/> 추가</button></div>
 {sub==='bookmarks'&&linkedSkill&&<div className="sing-tech-linked-filter"><span><Bookmark size={13}/> {d.skills.find(s=>s.id===linkedSkill)?.name||'선택한 항목'} · 연결 북마크 {relatedBookmarks(linkedSkill).length}개</span><button type="button" onClick={()=>{LinkedSkill(null);Q('')}}>전체 보기 ×</button></div>}
 {sub!=='notes'&&<div className="sing-tech-search"><Search size={15}/><input value={query} onChange={e=>Q(e.target.value)} placeholder={sub==='bookmarks'?'영상 제목·연결 기술·분류·메모 검색':'제목·분류·메모 검색'}/></div>}
 {sub==='skills'&&<div className="sing-tech-filters"><select value={major} onChange={e=>{A(e.target.value);B('전체')}}>{cats.map(x=><option key={x}>{x}</option>)}</select><select value={minor} onChange={e=>B(e.target.value)}>{subs.map(x=><option key={x}>{x}</option>)}</select></div>}
 {sub==='notes'?<TechniqueLearningNotes genre={VOCAL_GENRE} kind={itemLabel} skills={d.skills} bookmarks={d.bookmarks} notes={d.notes}/>:<div className="sing-tech-list">{rows.map(x=><div className="sing-tech-line" key={x.id}>{(sub==='skills'?primaryPhoto(x):videoId(x.url)?'https://img.youtube.com/vi/'+videoId(x.url)+'/mqdefault.jpg':'')?<img className="sing-tech-thumb" src={sub==='skills'?primaryPhoto(x):'https://img.youtube.com/vi/'+videoId(x.url)+'/mqdefault.jpg'} alt=""/>:<div className="sing-tech-thumb sing-tech-placeholder">{sub==='skills'?<BookOpen size={17}/>:<Bookmark size={17}/>}</div>}<button type="button" className="sing-tech-line-main" onClick={()=>open(sub,x)}><b>{x.name||x.title}</b><small>{sub==='skills'?[x.category,x.subcategory].filter(Boolean).join(' · '):x.memo?.slice(0,45)||x.url||'등록된 영상'}</small>{isSong&&sub==='skills'&&(x.karaoke?.tj||x.karaoke?.kumyoung)&&<small className="karaoke-numbers">{[x.karaoke.tj&&'TJ '+x.karaoke.tj,x.karaoke.kumyoung&&'금영 '+x.karaoke.kumyoung].filter(Boolean).join(' · ')}</small>}</button>{sub==='skills'&&<select aria-label="숙련도" className="sing-tech-status" value={x.status||'미습득'} onChange={e=>evaluate(x.id,e.target.value)}>{statuses.map(st=><option key={st}>{st}</option>)}</select>}{sub==='skills'&&<button type="button" className="sing-tech-related" title="이 항목에 연결된 유튜브 북마크 보기" onClick={()=>showLinkedBookmarks(x)}><Bookmark size={14}/><span>{relatedBookmarks(x.id).length}</span></button>}<button type="button" className="sing-tech-icon" aria-label="편집" onClick={()=>open(sub,x)}><Pencil size={15}/></button></div>)}</div>}
 {sub!=='notes'&&rows.length===0&&<p className="sing-tech-empty">등록된 항목이 없어.</p>}
 {modal&&<div className="sing-tech-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)closeModal()}}><section className="sing-tech-modal" role="dialog" aria-modal="true" aria-label={modal.type==='skills'?itemLabel:modal.type==='bookmarks'?itemLabel+' 북마크':'학습 노트'}><header className="sing-tech-modalhead"><strong>{modal.type==='skills'?itemLabel:modal.type==='bookmarks'?itemLabel+' 북마크':'학습 노트'}</strong><button type="button" className="sing-tech-icon" aria-label="닫기" onClick={closeModal}><X size={19}/></button></header>
 {modal.type==='bookmarks'?<div className="sing-tech-editor-body"><TechniqueBookmarkStudio key={modal.item.id} item={modal.item} genres={[VOCAL_GENRE]} skills={d.skills} onSave={item=>saveItem('bookmarks',item)} onDelete={()=>remove('bookmarks',modal.item.id)} onEvaluate={evaluate} songMode={isSong} onUploadMR={onUploadMR} onPersistMRSettings={persistMRSettings} recordingLogs={recordingLogs} recordingKind={isSong?'song':isTraining?'training':'technique'} onSaveRecording={onSaveRecording} onDeleteRecording={onDeleteRecording} onPlaybackSeconds={onPlaybackSeconds} draftScope={draftScope}/></div>:<div className="sing-tech-editor-body sing-tech-form">
 {modal.type==='skills'?<>
 {!isSong&&<label>장르<select value={VOCAL_GENRE} disabled><option>{VOCAL_GENRE}</option></select></label>}
 {!isSong&&input(itemLabel+' 이름','name',{required:true})}
 {!isSong&&<><div className="sing-tech-guide-head"><b>대분류 · 소분류</b><button type="button" onClick={()=>G(x=>!x)} className="sing-tech-light"><BookOpen size={14}/> 분류 가이드</button></div>
 {guide&&<div className="sing-tech-guide"><p>가이드를 선택하면 대·소분류가 입력돼. 직접 입력도 가능해.</p>{guideCategories.map(cat=><div key={cat}><strong>{cat}</strong><div className="sing-tech-chips">{guideMap[cat].map(item=><button type="button" key={item} onClick={()=>{M(old=>({...old,item:{...old.item,category:cat,subcategory:item}}));G(false)}}>{item}</button>)}</div></div>)}</div>}
 <div className="sing-tech-two"><label>대분류<input list="sing-tech-major-list" value={modal.item.category||''} onChange={e=>change('category',e.target.value)} placeholder="자유 입력"/><datalist id="sing-tech-major-list">{[...new Set([...guideCategories,...d.skills.map(s=>s.category).filter(Boolean)])].map(cat=><option key={cat} value={cat}/>)}</datalist></label><label>소분류<input list="sing-tech-minor-list" value={modal.item.subcategory||''} onChange={e=>change('subcategory',e.target.value)} placeholder="자유 입력"/><datalist id="sing-tech-minor-list">{[...new Set([...(guideMap[modal.item.category]||[]),...d.skills.filter(s=>s.category===modal.item.category).map(s=>s.subcategory).filter(Boolean)])].map(x=><option key={x} value={x}/>)}</datalist></label></div></>}
 {isSong&&<KaraokeFields key={modal.item.id} item={modal.item} onChange={values=>M(old=>({...old,item:{...old.item,...values}}))}/>}

 <TechniquePhotos item={modal.item} label={isSong?"가수·곡 사진":"기술 사진"} onChange={images=>change('images',images)}/>
 {modal.type==='skills'&&d.skills.some(x=>x.id===modal.item.id)&&<button type="button" className="sing-tech-related-open" onClick={()=>showLinkedBookmarks(modal.item)}><Bookmark size={15}/> 연결된 영상 북마크 {relatedBookmarks(modal.item.id).length}개 보기</button>}
 {clipCautions.length>0&&<div className="sing-tech-history"><strong>이 {itemLabel}의 주의할 점</strong>{clipCautions.map((c,i)=><div key={c.id||i}><small>{c.title} · {c.start}–{c.end}</small><p>{c.text}</p></div>)}</div>}
 {modal.item.lastEvaluatedAt&&<small className="sing-tech-muted">마지막 평가: {new Date(modal.item.lastEvaluatedAt).toLocaleDateString('ko-KR')} · 평가 이력 {(modal.item.statusHistory||[]).length}건</small>}
 <label>숙련도<select value={modal.item.status||'미습득'} onChange={e=>change('status',e.target.value)}>{statuses.map(x=><option key={x}>{x}</option>)}</select></label>
 {d.skills.some(x=>x.id===modal.item.id)&&<VoiceRecordingLog kind={isSong?'song':isTraining?'training':'technique'} skillId={modal.item.id} logs={recordingLogs} onSave={onSaveRecording} onDelete={onDeleteRecording}/>}
 </>:<>{input('제목','title',{required:true})}<label>메모<textarea value={modal.item.memo||''} onChange={e=>change('memo',e.target.value)}/></label></>}
 <div className="sing-tech-formbuttons"><button type="button" className="sing-tech-primary" onClick={()=>saveItem(modal.type,modal.item)}><Check size={16}/> 저장</button>{d[modal.type].some(x=>x.id===modal.item.id)&&<button type="button" className="sing-tech-delete" onClick={()=>remove(modal.type,modal.item.id)}><Trash2 size={15}/> 삭제</button>}</div>
 </div>}</section></div>}
 </div>;
}
