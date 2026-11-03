import {createClient} from '@supabase/supabase-js';
const url=import.meta.env.VITE_SUPABASE_URL,key=import.meta.env.VITE_SUPABASE_ANON_KEY;
export const configured=Boolean(url&&key&&url.includes('supabase.co'));
export const supabase=configured?createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
export const uid=()=>globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(16).slice(2)}`;
export const categories=['호흡','발성','음정','리듬','딕션','표현'];
export const initial=()=>({songs:[],trainings:[{id:'t1',title:'립트릴',category:'발성',subcategory:'워밍업',description:'입술을 가볍게 떨며 무리 없이 소리를 연결해 보세요.',bookmarks:[]},{id:'t2',title:'3도·5도 음정 도약',category:'음정',subcategory:'도약',description:'기준음을 듣고 간격을 정확하게 따라 부르세요.',bookmarks:[]}],categories,bookmarks:[],techniqueStudio:{skills:[],bookmarks:[],notes:[]},logs:[],targets:{songs:12,sessions:60,minutes:1800},journal:[]});
export const dateLabel=(s)=>new Date(s).toLocaleString('ko-KR',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
export const duration=s=>`${String(Math.floor((s||0)/60)).padStart(2,'0')}:${String(Math.floor((s||0)%60)).padStart(2,'0')}`;
export const getYoutubeId=(url)=>{try{const u=new URL(url);if(u.hostname==='youtu.be')return u.pathname.slice(1);if(u.hostname.endsWith('youtube.com'))return u.searchParams.get('v')||u.pathname.split('/').filter(Boolean).pop();}catch{}return null};
export async function putMedia(user,file){const ext=(file.name.split('.').pop()||'webm').replace(/[^a-zA-Z0-9]/g,'').slice(0,8);const path=`${user.id}/${uid()}.${ext}`;const {error}=await supabase.storage.from('vocal-media').upload(path,file,{contentType:file.type||'application/octet-stream'});if(error)throw error;return {path,name:file.name,size:file.size};}
export async function mediaUrl(path){if(!path)return '';const {data,error}=await supabase.storage.from('vocal-media').createSignedUrl(path,3600);if(error)throw error;return data.signedUrl;}
