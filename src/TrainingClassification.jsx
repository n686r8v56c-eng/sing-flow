import React,{useState} from 'react';
import {BookOpen} from 'lucide-react';
import {trainingGuide,trainingGuideCategories} from './trainingGuide';
import './training-classification.css';

export default function TrainingClassification({
 category,subcategory,onCategoryChange,onSubcategoryChange,
 existingCategories=[],trainings=[],names=false
}){
 const [guideOpen,setGuideOpen]=useState(false);
 const majors=[...new Set([...trainingGuideCategories,...existingCategories,...trainings.map(x=>x.category)].filter(Boolean))];
 const minors=[...new Set([...(trainingGuide[category]||[]),...trainings.filter(x=>x.category===category).map(x=>x.subcategory)].filter(Boolean))];
 return <div className="training-classification">
  <div className="training-guide-heading">
   <b>대분류 · 소분류</b>
   <button type="button" className="secondary compact training-guide-toggle" onClick={()=>setGuideOpen(v=>!v)} aria-expanded={guideOpen}>
    <BookOpen size={14}/> 분류 가이드
   </button>
  </div>
  {guideOpen&&<div className="training-guide-panel">
   <p>보컬 훈련 참고 분류 · 항목을 누르면 대·소분류 입력창에 적용돼. 직접 입력도 가능해.</p>
   {trainingGuideCategories.map(major=><div className="training-guide-category" key={major}>
    <strong>{major}</strong>
    <div className="training-guide-options">
     {trainingGuide[major].map(minor=><button type="button" key={minor} onClick={()=>{onCategoryChange(major);onSubcategoryChange(minor);setGuideOpen(false)}}>{minor}</button>)}
    </div>
   </div>)}
  </div>}
  <div className="training-classification-inputs">
   <label className="field"><span>대분류</span><input
     name={names?'category':undefined} list="sing-training-major"
     value={category||''} onChange={e=>{onCategoryChange(e.target.value);onSubcategoryChange('')}} placeholder="대분류 직접 입력"/></label>
   <label className="field"><span>소분류</span><input
     name={names?'subcategory':undefined} list="sing-training-minor"
     value={subcategory||''} onChange={e=>onSubcategoryChange(e.target.value)} placeholder="소분류 직접 입력"/></label>
   <datalist id="sing-training-major">{majors.map(x=><option key={x} value={x}/>)}</datalist>
   <datalist id="sing-training-minor">{minors.map(x=><option key={x} value={x}/>)}</datalist>
  </div>
 </div>
}
export function TrainingCreateFields({existingCategories,trainings}){
 const [category,C]=useState(''),[subcategory,S]=useState('');
 return <TrainingClassification category={category} subcategory={subcategory} onCategoryChange={C} onSubcategoryChange={S} existingCategories={existingCategories} trainings={trainings} names/>;
}
