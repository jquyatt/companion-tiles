// SPDX-License-Identifier: GPL-3.0-or-later
import zlib from 'node:zlib';
function crc(buffer){let c=0xffffffff;for(const b of buffer){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
function chunk(type,data){const bytes=Buffer.concat([Buffer.from(type),data]),len=Buffer.alloc(4),sum=Buffer.alloc(4);len.writeUInt32BE(data.length);sum.writeUInt32BE(crc(bytes));return Buffer.concat([len,bytes,sum]);}
function image(active,index){const w=72,h=72,raw=Buffer.alloc((w*3+1)*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const n=y*(w*3+1)+1+x*3,mark=x>12&&x<60&&y>20&&y<52&&((Math.floor(x/8)+index)%3===0);const color=mark?[240,245,250]:active?[20,160,95]:[35,65,95];raw.set(color,n);}const header=Buffer.alloc(13);header.writeUInt32BE(w);header.writeUInt32BE(h,4);header[8]=8;header[9]=2;return 'data:image/png;base64,'+Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]).toString('base64');}
export class Simulator{
 constructor({buttons,onState=()=>{},now=Date.now}){this.buttons=buttons;this.onState=onState;this.now=now;this.holds=new Map();this.active=null;this.online=true;}
 snapshot(){return {mode:'simulator',connected:this.online,error:'',buttons:this.buttons.map((b,i)=>({...b,image:this.online?image(this.active===b.id,i):'',enabled:this.online}))};}
 publish(){this.onState(this.snapshot());}start(){this.publish();this.timer=setInterval(()=>{for(const[id,h]of this.holds)if(h.until<=this.now())this.input(id,false,h.client);},250);this.timer.unref?.();}
 async input(id,pressed,client){if(!this.buttons.some(b=>b.id===id)||typeof pressed!=='boolean')throw Error('Invalid button');const hold=this.holds.get(id);if(hold&&hold.client!==client)throw Error('Button held by another client');if(pressed){if(!this.online)throw Error('Offline');this.holds.set(id,{client,until:this.now()+5000});this.active=id;}else this.holds.delete(id);this.publish();}
 async releaseClient(client){for(const[id,h]of this.holds)if(h.client===client)await this.input(id,false,client);}async close(){clearInterval(this.timer);this.holds.clear();}
}
