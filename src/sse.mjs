// Allow normal large snapshots while bounding genuinely stalled consumers.
export function writeEvent(response,message,{maxBacklog=1024*1024,onDrop=()=>{}}={}){
 if(response.destroyed||response.writableEnded)return false;
 const limit=Math.max(maxBacklog,Buffer.byteLength(message)*2);
 if(response.writableLength>limit){onDrop(response.writableLength);response.destroy();return false;}
 response.write(message);return true;
}
