// SPDX-License-Identifier: GPL-3.0-or-later
export class CompanionClient{
 constructor({url,buttons,onState=()=>{},WebSocketImpl=globalThis.WebSocket,fetchImpl=globalThis.fetch,now=Date.now,reconnectMs=2000,holdMs=5000}){this.url=url;this.buttons=buttons;this.onState=onState;this.WS=WebSocketImpl;this.fetch=fetchImpl;this.now=now;this.reconnectMs=reconnectMs;this.holdMs=holdMs;this.connected=false;this.images={};this.holds=new Map();this.queues=new Map();this.closed=false;this.error='';}
 snapshot(){return {mode:'live',connected:this.connected,error:this.error,buttons:this.buttons.map(b=>({...b,image:this.images[b.id]||'',enabled:this.connected&&!!this.images[b.id]}))};}
 publish(){this.onState(this.snapshot());}
 start(){this.connect();this.sweep=setInterval(()=>this.releaseDue(),250);this.sweep.unref?.();}
 connect(){if(this.closed)return;const ws=this.socket=new this.WS(new URL('/trpc',this.url).href.replace(/^http/,'ws'));const current=()=>this.socket===ws&&!this.closed;
 ws.addEventListener('open',()=>{if(!current())return;this.connected=true;this.error='';for(const [index,b]of this.buttons.entries()){const [pageNumber,row,column]=b.location.split('/').map(Number);ws.send(JSON.stringify({id:index+1,method:'subscription',params:{path:'preview.graphics.location',input:{location:{pageNumber,row,column}}}}));}this.publish();});
 ws.addEventListener('message',({data})=>{if(!current())return;if(data==='PING'){ws.send('PONG');return;}try{const parsed=JSON.parse(data);for(const m of Array.isArray(parsed)?parsed:[parsed]){if(m.error){this.error=String(m.error.message||'Companion subscription failed');this.connected=false;this.images={};this.publish();ws.close();return;}const b=this.buttons[m.id-1],image=m.result?.data?.image;if(!b||typeof image!=='string'||!image.startsWith('data:image/png;base64,')||image.length>1024*1024||image===this.images[b.id])continue;this.images[b.id]=image;this.publish();}}catch{}});
 ws.addEventListener('error',()=>{});ws.addEventListener('close',()=>{if(!current())return;this.connected=false;this.images={};this.publish();for(const [id,h]of this.holds)this.input(id,false,h.client).catch(()=>{});clearTimeout(this.retry);this.retry=setTimeout(()=>this.connect(),this.reconnectMs);this.retry.unref?.();});
 }
 input(id,pressed,client){const task=(this.queues.get(id)||Promise.resolve()).catch(()=>{}).then(()=>this.perform(id,pressed,client));this.queues.set(id,task);task.finally(()=>{if(this.queues.get(id)===task)this.queues.delete(id);}).catch(()=>{});return task;}
 async perform(id,pressed,client){const b=this.buttons.find(b=>b.id===id);if(!b||typeof pressed!=='boolean'||!client)throw Error('Invalid button command');const hold=this.holds.get(id);if(hold&&hold.client!==client)throw Error('Button held by another client');if(pressed){if(this.closed||!this.connected||!this.images[id])throw Error('Button is offline');if(hold)return;this.holds.set(id,{client,until:this.now()+this.holdMs});}else if(!hold)return;
 const r=await this.fetch(new URL(`/api/location/${b.location}/${pressed?'down':'up'}`,this.url),{method:'POST',signal:AbortSignal.timeout(3000)});if(!r.ok)throw Error('Companion HTTP '+r.status);if(!pressed)this.holds.delete(id);
 }
 releaseDue(){for(const [id,h]of this.holds)if(h.until<=this.now()){h.until=this.now()+1000;this.input(id,false,h.client).catch(()=>{});}}
 releaseClient(client){return Promise.allSettled([...this.holds].filter(([,h])=>h.client===client).map(([id])=>this.input(id,false,client)));}
 async close(){this.closed=true;clearInterval(this.sweep);clearTimeout(this.retry);await Promise.allSettled([...this.holds].map(([id,h])=>this.input(id,false,h.client)));this.socket?.close();}
}
