// SPDX-License-Identifier: GPL-3.0-or-later
import fs from 'node:fs/promises';import {validateConfig} from '../src/config.mjs';import {companionTile} from '../src/widgets.mjs';
const flag=process.argv.indexOf('--config'),config=validateConfig(JSON.parse(await fs.readFile(flag<0?new URL('../examples/config.json',import.meta.url):process.argv[flag+1],'utf8')));const outputFlag=process.argv.indexOf('--output'),output=outputFlag<0?new URL('../examples/session.json',import.meta.url):process.argv[outputFlag+1];
const session={version:'1.31.1',type:'session',content:{type:'root',id:'root',layout:'vertical',colorBg:'#121923',colorWidget:'#53b7dc',widgets:[{type:'text',id:'status',address:'/companion-tiles/status',value:'Companion Tiles · connecting',bypass:true,height:40},{type:'panel',id:'tiles',layout:'horizontal',scroll:true,height:164,widgets:config.buttons.map(b=>companionTile({...b}))}]}};
await fs.writeFile(output,JSON.stringify(session,null,2)+'\n');
