// @vitest-environment jsdom
import React from 'react';
import {afterEach,describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import Assessment from './Assessment';
import Games from './Games';
import Experiments from './Experiments';
import {questions} from './data';
afterEach(cleanup);
describe('student interactions',()=>{
 it('completes a 16 question assessment and records actual answers',()=>{const save=vi.fn();render(<Assessment level="advanced" onResult={save}/>);fireEvent.click(screen.getByText('ابدأ الاختبار'));for(let i=0;i<16;i++){const q=questions.find(q=>screen.queryByText(q.prompt));expect(q).toBeDefined();fireEvent.click(screen.getByRole('button',{name:q!.options[q!.answer]}));expect(screen.getByText(q!.explanation)).toBeTruthy();fireEvent.click(screen.getByText(i===15?'عرض النتيجة وحفظها':'السؤال التالي'));}expect(save).toHaveBeenCalledOnce();expect(save.mock.calls[0][0]).toMatchObject({score:16,total:16,weakLessons:[]});});
 it('opens and plays every game without dead controls',()=>{const earn=vi.fn();render(<Games onEarn={earn}/>);for(let i=0;i<6;i++){fireEvent.click(screen.getAllByText('ابدأ التحدي')[i]);const options=screen.getAllByRole('button').filter(b=>b.className.includes('secondary'));fireEvent.click(options[0]);expect(screen.getByText(/الإجابة:/)).toBeTruthy();fireEvent.click(screen.getByText('العودة إلى الألعاب'));}expect(screen.getAllByText('ابدأ التحدي')).toHaveLength(6);});
 it('runs five independent experiments and records completion after assessment',()=>{const complete=vi.fn();render(<Experiments student="طالب اختبار" onComplete={complete}/>);const titles=['الاحتراق العضوي','اختبار عدم التشبع','تفاعل الإضافة','الأسترة','مقارنة المركبات العضوية'];for(let i=0;i<5;i++){fireEvent.click(screen.getByRole('button',{name:`${i+1}. ${titles[i]}`}));fireEvent.click(screen.getByText('شغّل المحاكاة ←'));expect(screen.getByText('الملاحظة والنتيجة')).toBeTruthy();const buttons=screen.getAllByRole('button').filter(b=>b.parentElement?.parentElement?.style.borderBottom);const groups=new Set<Element>();for(const b of buttons){const g=b.parentElement!;if(!groups.has(g)){groups.add(g);fireEvent.click(b);}}fireEvent.click(screen.getByText('احفظ إنجاز التجربة'));expect(complete).toHaveBeenLastCalledWith(i+1);expect(screen.getByText(/الطالب: طالب اختبار/)).toBeTruthy();}expect(complete).toHaveBeenCalledTimes(5);});
});
