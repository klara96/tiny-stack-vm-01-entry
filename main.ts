import * as fs from "node:fs";
import * as path from "node:path";
const D=new Int32Array(256);
const C=new Int32Array(64);
let M=new Int32Array(256);
const outBuf=new Uint8Array(65536);
let sp=0,csp=0,olen=0,inPos=0,inputBytes: Uint8Array;
function run(program: Uint8Array,input: Uint8Array): number {
M.fill(0);
sp=0;
csp=0;
olen=0;
inPos=0;
inputBytes=input;
let steps=1000000;
let pc=0;
while (true){
if (steps===0) return 10;
if (pc<0||pc>=program.length) return 9;
const op=program[pc];
let immBytes=0;
let pops=0;
let pushes=0;
switch (op){
case 0x00: case 0x34: immBytes=0;pops=0;pushes=0;break;
case 0x01: immBytes=1;pops=0;pushes=1;break;
case 0x02: immBytes=4;pops=0;pushes=1;break;
case 0x03: immBytes=0;pops=1;pushes=0;break;
case 0x04: immBytes=0;pops=1;pushes=2;break;
case 0x05: immBytes=0;pops=2;pushes=2;break;
case 0x06: immBytes=0;pops=2;pushes=3;break;
case 0x07: immBytes=0;pops=3;pushes=3;break;
case 0x10: case 0x11: case 0x12: case 0x13: case 0x14: case 0x15: case 0x16: case 0x18: case 0x19: case 0x1a: case 0x1c: case 0x1d: case 0x1e: case 0x20: case 0x21: case 0x22: immBytes=0;pops=2;pushes=1;break;
case 0x17: case 0x1b: immBytes=0;pops=1;pushes=1;break;
case 0x30: immBytes=2;pops=0;pushes=0;break;
case 0x31: case 0x32: immBytes=2;pops=1;pushes=0;break;
case 0x33: immBytes=2;pops=0;pushes=0;break;
case 0x40: immBytes=0;pops=1;pushes=1;break;
case 0x41: immBytes=0;pops=2;pushes=0;break;
case 0x50: case 0x51: case 0x53: immBytes=0;pops=1;pushes=0;break;
case 0x52: immBytes=0;pops=0;pushes=1;break;
default: return 5;
}
if (pc+immBytes>=program.length) return 9;
const next=pc+1+immBytes;
if (sp<pops) return 2;
if (sp-pops+pushes>256) return 3;
pc=next;
steps--;
switch (op){
case 0x00: return 0;
case 0x01: D[sp++]=(program[next-1] << 24) >> 24;break;
case 0x02: D[sp++]=(program[next-4] | (program[next-3] << 8) | (program[next-2] << 16) | (program[next-1] << 24)) << 0 >> 0;
break;
case 0x03: sp--;break;
case 0x04: D[sp]=D[sp-1];sp++;break;
case 0x05: { const t=D[sp-1];D[sp-1]=D[sp-2];D[sp-2]=t;break;}
case 0x06: D[sp]=D[sp-2];sp++;break;
case 0x07: { const a=D[sp-3];D[sp-3]=D[sp-2];D[sp-2]=D[sp-1];D[sp-1]=a;break;}
case 0x10: { const b=D[--sp];const a=D[--sp];D[sp++]=(a+b) | 0;break;}
case 0x11: { const b=D[--sp];const a=D[--sp];D[sp++]=(a-b) | 0;break;}
case 0x12: { const b=D[--sp];const a=D[--sp];D[sp++]=Math.imul(a,b);break;}
case 0x13: { const b=D[--sp];const a=D[--sp];if (b===0) return 4;if (a===-2147483648&&b===-1){ D[sp++]=-2147483648;break;} D[sp++]=(a / b) | 0;break;}
case 0x14: { const b=D[--sp];const a=D[--sp];if (b===0) return 4;if (b===-1){ D[sp++]=0;break;} D[sp++]=a % b;break;}
case 0x15: { const b=D[--sp];const a=D[--sp];if (b===0) return 4;D[sp++]=(Math.floor((a >>> 0) / (b >>> 0)) | 0);break;}
case 0x16: { const b=D[--sp];const a=D[--sp];if (b===0) return 4;D[sp++]=((a >>> 0) % (b >>> 0) | 0);break;}
case 0x17: D[sp-1]=(-D[sp-1]) | 0;break;
case 0x18: { const b=D[--sp];const a=D[--sp];D[sp++]=a & b;break;}
case 0x19: { const b=D[--sp];const a=D[--sp];D[sp++]=a | b;break;}
case 0x1a: { const b=D[--sp];const a=D[--sp];D[sp++]=a ^ b;break;}
case 0x1b: D[sp-1]=~D[sp-1];break;
case 0x1c: { const b=D[--sp];const a=D[--sp];D[sp++]=a << (b & 31);break;}
case 0x1d: { const b=D[--sp];const a=D[--sp];D[sp++]=a >> (b & 31);break;}
case 0x1e: { const b=D[--sp];const a=D[--sp];D[sp++]=(a >>> (b & 31)) | 0;break;}
case 0x20: { const b=D[--sp];const a=D[--sp];D[sp++]=a===b ? 1 : 0;break;}
case 0x21: { const b=D[--sp];const a=D[--sp];D[sp++]=a<b ? 1 : 0;break;}
case 0x22: { const b=D[--sp];const a=D[--sp];D[sp++]=(a >>> 0)<(b >>> 0) ? 1 : 0;break;}
case 0x30: { const rel=((program[next-2] | (program[next-1] << 8)) << 16) >> 16;pc=next+rel;break;}
case 0x31: { const v=D[--sp];if (v===0){ const rel=((program[next-2] | (program[next-1] << 8)) << 16) >> 16;pc=next+rel;} break;}
case 0x32: { const v=D[--sp];if (v!==0){ const rel=((program[next-2] | (program[next-1] << 8)) << 16) >> 16;pc=next+rel;} break;}
case 0x33: { if (csp===64) return 7;C[csp++]=next;pc=program[next-2] | (program[next-1] << 8);break;}
case 0x34: { if (csp===0) return 8;pc=C[--csp];break;}
case 0x40: { const addr=D[sp-1];if (addr<0||addr>255) return 6;D[sp-1]=M[addr];break;}
case 0x41: { const addr=D[sp-1],v=D[sp-2];if (addr<0||addr>255) return 6;sp -= 2;M[addr]=v;break;}
case 0x50: { const s=String(D[sp-1]);if (olen+s.length>65536) return 11;sp--;for (let i=0;i<s.length;i++) outBuf[olen++]=s.charCodeAt(i);break;}
case 0x51: { if (olen>=65536) return 11;outBuf[olen++]=D[--sp] & 255;break;}
case 0x52: D[sp++]=inPos<inputBytes.length ? inputBytes[inPos++] : -1;break;
case 0x53: return D[--sp] & 255;
}
}
}
function main(){
const inputDir=process.env.MAKEFUN_INPUT_DIR||"/input";
const outputDir=process.env.MAKEFUN_OUTPUT_DIR||"/output";
const ids=fs.readdirSync(inputDir);
for (const id of ids){
const progPath=path.join(inputDir,id,"program.bin");
const inputPath=path.join(inputDir,id,"input.bin");
const outDir=path.join(outputDir,id);
const stdoutPath=path.join(outDir,"stdout.bin");
const exitPath=path.join(outDir,"exit.txt");
if (!fs.existsSync(progPath)||!fs.existsSync(inputPath)) continue;
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir,{ recursive: true });
const program=new Uint8Array(fs.readFileSync(progPath));
const input=new Uint8Array(fs.readFileSync(inputPath));
const exit=run(program,input);
fs.writeFileSync(stdoutPath,outBuf.slice(0,olen));
fs.writeFileSync(exitPath,exit.toString()+"\n");
}
}
main();