// Export the selected category's complete learning notes, including representative images and video links.
const safePart=value=>String(value||'전체').replace(/[\/\\:*?"<>|]/g,'-').replace(/\s+/g,'_').slice(0,55);
const fileBase=(kind,major,minor)=>['sing-flow',kind,major,minor==='전체'?'':minor,new Date().toISOString().slice(0,10)].filter(Boolean).map(safePart).join('-');
const startDownload=(blob,name)=>{
 const url=URL.createObjectURL(blob);
 const anchor=document.createElement('a');
 anchor.href=url;anchor.download=name;document.body.append(anchor);anchor.click();anchor.remove();
 setTimeout(()=>URL.revokeObjectURL(url),15000);
};
const sourceDescription=n=>[n.category,n.subcategory,n.type].filter(Boolean).join(' · ');
const sourceVideo=n=>n.youtubeUrl||'';
const photoData=async src=>{
 if(!src)return null;
 try{
  const response=await fetch(src);
  if(!response.ok)throw Error('사진을 가져오지 못했어.');
  const blob=await response.blob();
  const type=blob.type.toLowerCase();
  if(!['image/jpeg','image/png','image/gif','image/bmp'].includes(type))return null;
  const bytes=new Uint8Array(await blob.arrayBuffer());
  return {bytes,type:type==='image/jpeg'?'jpg':type.slice(6)};
 }catch{return null}
};
export async function exportLearningNotes(entries,{kind,major='전체',minor='전체',format='docx'}={}){
 const filename=fileBase(kind,major,minor);
 if(format==='txt'){
  const lines=[
   'Sing Flow · '+kind+' 학습 노트',
   '대분류: '+major+' / 소분류: '+minor,
   '내보낸 날짜: '+new Date().toLocaleDateString('ko-KR'),
   '메모 '+entries.length+'개',
   '',
  ];
  for(const n of entries){
   lines.push('■ '+(n.skill||'이름 없음'),sourceDescription(n));
   if(n.bookmarkTitle)lines.push('영상: '+n.bookmarkTitle+' · '+(n.start||'')+'–'+(n.end||''));
   if(n.at)lines.push('날짜: '+new Date(n.at).toLocaleDateString('ko-KR'));
   lines.push(n.content||'');
   if(sourceVideo(n))lines.push('유튜브: '+sourceVideo(n));
   if(n.representativePhoto)lines.push('[대표 사진: Word(DOCX) 내보내기에서 포함]');
   lines.push('','────────────────────────────────','');
  }
  startDownload(new Blob(['\uFEFF'+lines.join('\n')],{type:'text/plain;charset=utf-8'}),filename+'.txt');
  return;
 }
 const {Document,Packer,Paragraph,TextRun,ImageRun,ExternalHyperlink,HeadingLevel}=await import('docx');
 const children=[
  new Paragraph({text:'Sing Flow · '+kind+' 학습 노트',heading:HeadingLevel.TITLE,spacing:{after:180}}),
  new Paragraph({text:'대분류: '+major+'    소분류: '+minor,spacing:{after:100}}),
  new Paragraph({text:'내보낸 날짜: '+new Date().toLocaleDateString('ko-KR')+'   ·   메모 '+entries.length+'개',spacing:{after:300}}),
 ];
 let lastGroup='';
 for(const n of entries){
  const group=[n.category||'기타',n.subcategory||''].filter(Boolean).join(' / ');
  if(group!==lastGroup){
   children.push(new Paragraph({text:group,heading:HeadingLevel.HEADING_2,spacing:{before:260,after:100}}));
   lastGroup=group;
  }
  children.push(new Paragraph({text:n.skill||'이름 없음',heading:HeadingLevel.HEADING_3,spacing:{before:160,after:60}}));
  if(n.representativePhoto){
   const photo=await photoData(n.representativePhoto);
   if(photo){
    try{
     children.push(new Paragraph({children:[new ImageRun({data:photo.bytes,type:photo.type,transformation:{width:180,height:135},altText:{title:'대표 사진',description:'해당 기술·훈련의 대표 사진',name:'Skill photo'}})],spacing:{after:90}}));
    }catch{} // Unsupported historical image types should not block the notes.
   }
  }
  children.push(new Paragraph({children:[new TextRun({text:sourceDescription(n),color:'75668A',size:19})],spacing:{after:70}}));
  if(n.bookmarkTitle){
   children.push(new Paragraph({text:'영상: '+n.bookmarkTitle+' · '+(n.start||'')+'–'+(n.end||''),spacing:{after:70}}));
  }
  if(n.at)children.push(new Paragraph({text:'기록: '+new Date(n.at).toLocaleDateString('ko-KR'),spacing:{after:60}}));
  for(const line of String(n.content||'').split('\n')){
   children.push(new Paragraph({text:line||' ',spacing:{after:40}}));
  }
  if(sourceVideo(n)){
   children.push(new Paragraph({children:[new ExternalHyperlink({link:sourceVideo(n),children:[new TextRun({text:'▶ 원본 영상 열기 ('+sourceVideo(n)+')',color:'7352A5',underline:{color:'7352A5'}})]})],spacing:{before:70,after:130}}));
  }else children.push(new Paragraph({text:' ',spacing:{after:90}}));
 }
 const document=new Document({sections:[{properties:{},children}]});
 const blob=await Packer.toBlob(document);
 startDownload(blob,filename+'.docx');
}
