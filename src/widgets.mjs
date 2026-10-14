// SPDX-License-Identifier: GPL-3.0-or-later
export function companionTile({id,label=id,namespace='/companion-tiles/'+id,width=144,height=144}={}){
 if(!/^[A-Za-z][\w-]{0,63}$/.test(id||''))throw Error('Invalid unique tile id');if(!/^\/(?:[\w-]+\/)*[\w-]+$/.test(namespace))throw Error('Invalid address namespace');
 if(![width,height].every(v=>Number.isFinite(v)&&v>=64&&v<=2048))throw Error('Tile dimensions must be 64–2048');
 return {type:'panel',id,width,height,layout:'default',widgets:[
  {type:'text',id:id+'_fallback',top:0,left:0,width:'100%',height:'100%',value:String(label),bypass:true},
  {type:'image',id:id+'_image',top:0,left:0,width:'100%',height:'100%',address:namespace+'/image',bypass:true,size:'contain',css:'pointer-events:none;'},
  {type:'button',id:id+'_press',top:0,left:0,width:'100%',height:'100%',address:namespace+'/press',mode:'push',label:String(label),interaction:`OSC{${namespace}/enabled, 0}`,css:'opacity:0;',comments:'Full-image native push/release target. Keep all child ids unique.'}
 ]};
}
