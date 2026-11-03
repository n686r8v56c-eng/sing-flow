import React,{useEffect,useRef,useState} from 'react';
import {Search} from 'lucide-react';
import './karaoke.css';
export default function KaraokeFields({item,onChange}){
 const [results,setResults]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[filter,setFilter]=useState('');
 const request=useRef(null);
 useEffect(()=>()=>request.current?.abort(),[]);
 const title=item.subcategory||item.name||'',artist=item.category||'';
 function edit(values){request.current?.abort();request.current=null;setBusy(false);setResults(null);setError('');onChange(values)}
 async function search(){
  if(!title.trim()){setError('곡명을 먼저 입력해 줘.');return}
  request.current?.abort();const controller=new AbortController();request.current=controller;
  setBusy(true);setError('');setResults(null);setFilter('');
  const timeout=setTimeout(()=>controller.abort(),15000);
  try{
   const response=await fetch(`https://api.manana.kr/karaoke/song/${encodeURIComponent(title.trim())}.json`,{signal:controller.signal});
   if(response.status===404){setResults([]);return}
   if(!response.ok)throw Error('검색 서버에 연결하지 못했어. 잠시 후 다시 시도하거나 번호를 직접 입력해 줘.');
   const data=await response.json();if(!Array.isArray(data))throw Error('검색 결과를 불러오지 못했어.');
   const norm=s=>String(s||'').normalize('NFKC').replace(/\s/g,'').toLowerCase();
   const seen=new Set();const rows=data.filter(r=>['tj','kumyoung'].includes(r.brand)&&/^\d+$/.test(String(r.no))&&r.title&& !seen.has(r.brand+':'+r.no)&&(seen.add(r.brand+':'+r.no),true));
   rows.sort((a,b)=>Number(norm(b.singer).includes(norm(artist)))-Number(norm(a.singer).includes(norm(artist))));setResults(rows);
  }catch(e){if(request.current===controller)setError(e.name==='AbortError'?'검색 시간이 길어지고 있어. 다시 시도하거나 번호를 직접 입력해 줘.':e.message)}
  finally{clearTimeout(timeout);if(request.current===controller)setBusy(false)}
 }
 const shown=(results||[]).filter(r=>[r.title,r.singer,r.no].join(' ').toLowerCase().includes(filter.toLowerCase()));
 return <div className="karaoke-fields">
  <div className="sing-tech-two"><label>대분류 · 가수<input value={artist} placeholder="가수 이름" onChange={e=>edit({category:e.target.value})}/></label><label>소분류 · 곡명<div className="karaoke-title"><input value={title} required placeholder="노래 제목" onChange={e=>edit({subcategory:e.target.value,name:e.target.value})}/><button type="button" className="sing-tech-light" aria-label="노래방 번호 검색" disabled={busy} onClick={search}><Search size={16}/>{busy?'검색 중':'검색'}</button></div></label></div>
  <div className="sing-tech-two">{[['tj','TJ 번호'],['kumyoung','금영 번호']].map(([brand,label])=><label key={brand}>{label}<input inputMode="numeric" pattern="[0-9]*" placeholder="검색 또는 직접 입력" value={item.karaoke?.[brand]||''} onChange={e=>onChange({karaoke:{...item.karaoke,[brand]:e.target.value.replace(/\D/g,'')}})}/></label>)}</div>
  {error&&<p role="alert" className="karaoke-message">{error}</p>}
  {results!==null&&<section className="karaoke-results" aria-label="노래방 검색 결과"><div className="karaoke-result-head"><b>노래방 번호 선택 · {results.length}건</b><button type="button" className="sing-tech-light" onClick={()=>setResults(null)}>접기</button></div><small>가수·버전을 확인해서 TJ와 금영을 각각 선택해 줘. 저장 버튼을 누르면 반영돼.</small>{results.length>0&&<input aria-label="검색 결과 가수·곡명 필터" placeholder="결과에서 가수·곡명 검색" value={filter} onChange={e=>setFilter(e.target.value)}/>}<div className="karaoke-result-list">{shown.map(r=><button type="button" key={r.brand+':'+r.no} className={'karaoke-result '+(item.karaoke?.[r.brand]===String(r.no)?'selected':'')} onClick={()=>onChange({karaoke:{...item.karaoke,[r.brand]:String(r.no)}})}><span><b>{r.title}</b><small>{r.singer}</small></span><strong>{r.brand==='tj'?'TJ':'금영'} {r.no}{item.karaoke?.[r.brand]===String(r.no)?' ✓':''}</strong></button>)}</div>{shown.length===0&&<p className="karaoke-message">검색 결과가 없어. 곡명을 짧게 바꿔 검색하거나 번호를 직접 입력해 줘.</p>}<small>검색 제공: <a href="https://api.manana.kr/karaoke" target="_blank" rel="noreferrer">API Manana</a></small></section>}
 </div>;
}

export function SongRegistration({onSubmit,children}){
 const [song,setSong]=useState({name:'',category:'',subcategory:'',karaoke:{}});
 return <form className="stack" onSubmit={e=>onSubmit(e,song.karaoke)}><KaraokeFields item={song} onChange={values=>setSong(old=>({...old,...values}))}/><input type="hidden" name="title" value={song.name}/><input type="hidden" name="artist" value={song.category}/>{children}</form>;
}
