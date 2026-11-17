export type Element = 'C' | 'H' | 'O';
export type Atom = { id: number; element: Element; x: number; y: number; z: number };
export type Bond = { a: number; b: number; order: 1 | 2 | 3 };
export type Molecule = { atoms: Atom[]; bonds: Bond[] };
export const valence: Record<Element, number> = { C: 4, H: 1, O: 2 };
export function formula(m: Molecule) { return (['C', 'H', 'O'] as Element[]).map(e => { const n = m.atoms.filter(a => a.element === e).length; return n ? e + (n > 1 ? n : '') : ''; }).join(''); }
export function bondSum(m: Molecule, id: number) { return m.bonds.filter(b => b.a === id || b.b === id).reduce((n, b) => n + b.order, 0); }
export function issues(m: Molecule) { return m.atoms.flatMap(a => { const n = bondSum(m, a.id), v = valence[a.element]; return n === v ? [] : [`${a.element}${a.id + 1}: مجموع الرتب ${n}؛ التكافؤ المعتاد ${v} (${n > v ? 'تجاوز التكافؤ' : 'روابط ناقصة'}).`]; }); }
function complete(atoms: Atom[], bonds: Bond[], planar = false): Molecule {
 const original = [...atoms];
 for (const a of original) { const needed = valence[a.element] - bonds.filter(b => b.a === a.id || b.b === a.id).reduce((n,b) => n+b.order,0); for(let i=0;i<needed;i++) { const theta = (i/Math.max(needed,1))*Math.PI*2 + (a.id%2 ? 0 : Math.PI); const neighbor = original.find(n => bonds.some(b => (b.a===a.id&&b.b===n.id)||(b.b===a.id&&b.a===n.id))); let dx=0,dy=0,dz=0;
 if(needed===1 && neighbor) { dx=a.x-neighbor.x;dy=a.y-neighbor.y;dz=a.z-neighbor.z; const norm=Math.hypot(dx,dy,dz)||1;dx/=norm;dy/=norm;dz/=norm; }
 else { dx=Math.cos(theta)*0.75;dy=Math.sin(theta)*0.9;dz=planar?0:(i%2 ? 0.8 : -0.8); }
 const id=atoms.length;atoms.push({id,element:'H',x:a.x+dx,y:a.y+dy,z:a.z+dz});bonds.push({a:a.id,b:id,order:1}); }
 } return {atoms,bonds};
}
const atom=(id:number,element:Element,x:number,y=0,z=0):Atom=>({id,element,x,y,z});
export const presets: Record<string, {name:string; model:Molecule; note:string}> = {
 methane:{name:'الميثان',model:{atoms:[atom(0,'C',0),atom(1,'H',.7,.7,.7),atom(2,'H',.7,-.7,-.7),atom(3,'H',-.7,.7,-.7),atom(4,'H',-.7,-.7,.7)],bonds:[1,2,3,4].map(b=>({a:0,b,order:1}))},note:'هندسة رباعية السطوح؛ زاوية H–C–H نحو 109.5°.'},
 ethene:{name:'الإيثين',model:{atoms:[atom(0,'C',-.67),atom(1,'C',.67),atom(2,'H',-1.21,.94),atom(3,'H',-1.21,-.94),atom(4,'H',1.21,.94),atom(5,'H',1.21,-.94)],bonds:[{a:0,b:1,order:2},{a:0,b:2,order:1},{a:0,b:3,order:1},{a:1,b:4,order:1},{a:1,b:5,order:1}]},note:'جزيء مستوٍ؛ الزوايا حول الكربون تقارب 120°.'},
 ethyne:{name:'الإيثاين',model:{atoms:[atom(0,'C',-.6),atom(1,'C',.6),atom(2,'H',-1.66),atom(3,'H',1.66)],bonds:[{a:0,b:1,order:3},{a:0,b:2,order:1},{a:1,b:3,order:1}]},note:'جزيء خطي؛ زاوية الروابط 180°.'},
 ethanol:{name:'الإيثانول',model:complete([atom(0,'C',-1.5),atom(1,'C',0),atom(2,'O',.75,1.2)],[{a:0,b:1,order:1},{a:1,b:2,order:1}]),note:'تمثيل تقريبي للاتصال؛ اتجاهات الهيدروجين ليست بنية محسّنة طاقياً.'},
 benzene:{name:'البنزين',model:(()=>{const atoms=Array.from({length:6},(_,i)=>atom(i,'C',1.4*Math.cos(i*Math.PI/3),1.4*Math.sin(i*Math.PI/3))); const bonds:Bond[]=Array.from({length:6},(_,i)=>({a:i,b:(i+1)%6,order:i%2?1:2}));for(let i=0;i<6;i++){atoms.push(atom(i+6,'H',2.48*Math.cos(i*Math.PI/3),2.48*Math.sin(i*Math.PI/3)));bonds.push({a:i,b:i+6,order:1});}return {atoms,bonds};})(),note:'رسم كيكوله: الروابط الفعلية متكافئة بسبب عدم تمركز إلكترونات π؛ لا يتذبذب الجزيء بين رسمين.'}
};
export function isomorphic(a:Molecule,b:Molecule) {
 if(a.atoms.length!==b.atoms.length||a.bonds.length!==b.bonds.length||formula(a)!==formula(b))return false;
 const rank=(m:Molecule,id:number)=>m.bonds.filter(x=>x.a===id||x.b===id).map(x=>x.order).sort().join(',');
 const order=[...a.atoms].sort((x,y)=>bondSum(a,y.id)-bondSum(a,x.id));const mapped=new Map<number,number>(),used=new Set<number>();
 const edge=(m:Molecule,x:number,y:number)=>m.bonds.find(v=>(v.a===x&&v.b===y)||(v.a===y&&v.b===x))?.order||0;
 function match(i:number):boolean { if(i===order.length)return true;const x=order[i]; for(const y of b.atoms){if(used.has(y.id)||x.element!==y.element||rank(a,x.id)!==rank(b,y.id))continue; if([...mapped].some(([p,q])=>edge(a,x.id,p)!==edge(b,y.id,q)))continue;mapped.set(x.id,y.id);used.add(y.id);if(match(i+1))return true;mapped.delete(x.id);used.delete(y.id);}return false;}return match(0);
}
export function identify(m:Molecule){return Object.values(presets).find(p=>isomorphic(m,p.model))?.name || 'مركب غير موجود في مكتبة التعرف / تركيب غير مكتمل';}
export function copyModel(m:Molecule):Molecule {return {atoms:m.atoms.map(a=>({...a})),bonds:m.bonds.map(b=>({...b}))};}
