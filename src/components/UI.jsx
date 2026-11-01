import React from 'react';import {X} from 'lucide-react';
export function Modal({title,onClose,children}){return <div className="scrim" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><section className="dialog" role="dialog" aria-modal="true" aria-label={title}><header className="dialog-head"><strong>{title}</strong><button className="icon" aria-label="닫기" onClick={onClose}><X size={18}/></button></header><div className="dialog-body">{children}</div></section></div>}
export function Field({label,...props}){return <label className="field"><span>{label}</span><input {...props}/></label>}
export function Empty({children}){return <div className="empty">{children}</div>}
export function Tabs({items,value,onChange}){return <div className="subtabs">{items.map(x=><button key={x} className={value===x?'on':''} onClick={()=>onChange(x)}>{x}</button>)}</div>}
export function SmallButton({children,...props}){return <button className="smallbtn" {...props}>{children}</button>}
