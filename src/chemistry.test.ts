import {describe,it,expect} from 'vitest';
import {presets,formula,issues,identify,copyModel,isomorphic} from './chemistry';
describe('molecular scientific invariants',()=>{
 it('all presets have complete neutral valences',()=>{for(const p of Object.values(presets))expect(issues(p.model)).toEqual([]);});
 it('uses explicit molecular formulae',()=>{expect(Object.values(presets).map(p=>formula(p.model))).toEqual(['CH4','C2H4','C2H2','C2H6O','C6H6']);});
 it('recognises reordered atom ids by graph connectivity',()=>{const m=copyModel(presets.ethanol.model);m.atoms.forEach(a=>a.id+=20);m.bonds.forEach(b=>{b.a+=20;b.b+=20;});expect(identify(m)).toBe('الإيثانول');});
 it('does not confuse an ether with ethanol despite matching formula',()=>{const m=copyModel(presets.ethanol.model);const oxygen=m.atoms.find(a=>a.element==='O')!; const carbon=m.atoms.find(a=>a.id===0)!;const hydrogen=m.atoms.find(a=>a.element==='H'&&m.bonds.some(b=>(b.a===carbon.id&&b.b===a.id)||(b.b===carbon.id&&b.a===a.id)))!;const oh=m.bonds.find(b=>b.a===oxygen.id&&m.atoms.find(a=>a.id===b.b)?.element==='H')!;m.bonds=m.bonds.filter(b=>b!==oh&&!(b.a===0&&b.b===hydrogen.id)&&!(b.a===0&&b.b===1));m.bonds.push({a:0,b:oxygen.id,order:1},{a:1,b:hydrogen.id,order:1},{a:0,b:oh.b,order:1});expect(formula(m)).toBe('C2H6O');expect(issues(m)).toEqual([]);expect(isomorphic(m,presets.ethanol.model)).toBe(false);});
 it('detects missing valence',()=>{const m=copyModel(presets.ethyne.model);m.bonds[0].order=2;expect(issues(m)).toHaveLength(2);});
});
