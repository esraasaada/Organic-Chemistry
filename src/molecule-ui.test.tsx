// @vitest-environment jsdom
import React from 'react';
import {it,expect,vi} from 'vitest';
import{render,screen,fireEvent,cleanup}from'@testing-library/react';
import MoleculeLab from './MoleculeLab';
it('falls back without WebGL and rejects invalid H valence in the editor',()=>{const log=vi.spyOn(console,'error').mockImplementation(()=>{});vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockImplementation(()=>null);render(<MoleculeLab allowMotion={false}/>);expect(screen.getByLabelText('بديل ثنائي الأبعاد للجزيء')).toBeTruthy();expect(screen.getByText('الميثان',{selector:'button'})).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'C1'}));fireEvent.click(screen.getByRole('button',{name:'H2'}));fireEvent.change(screen.getByLabelText('رتبة الرابطة'),{target:{value:'3'}});fireEvent.click(screen.getByText('إنشاء / تعديل الرابطة'));expect(screen.getByRole('status').textContent).toContain('تجاوز التكافؤ');fireEvent.click(screen.getByText('إعادة البناء'));fireEvent.click(screen.getByText('أضف O'));expect(screen.getByText(/الصيغة:/).textContent).toContain('O');expect(screen.getByText(/روابط ناقصة/)).toBeTruthy();cleanup();vi.restoreAllMocks();});
