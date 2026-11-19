import {spawnSync} from 'node:child_process';
const task=process.argv[2];
const commands={install:[['examples/01-native-browser',['install','--frozen-lockfile']],['examples/02-browser-rag',['install','--frozen-lockfile']],['examples/03-ag-ui',['install','--frozen-lockfile']]],build:[['examples/01-native-browser',['build']],['examples/02-browser-rag',['build']],['examples/03-ag-ui',['build']]],test:[['examples/01-native-browser',['test','--watch=false']],['examples/02-browser-rag',['test']],['examples/02-browser-rag',['typecheck:pipeline']],['examples/03-ag-ui',['test']]]};
if(!commands[task])throw new Error('Use install, build or test');
for(const [folder,args]of commands[task]){console.log(`\n${folder}: ${args.join(' ')}`);const r=spawnSync('pnpm',['--dir',folder,...args],{stdio:'inherit'});if(r.status!==0)process.exit(r.status??1);}
