import {describe,it,expect} from 'vitest';
import {lessons,questions} from './data';

describe('Arabic curriculum and original assessment bank',()=>{
 it('contains eight lessons and exactly eighty uniquely identified and worded questions',()=>{
  expect(lessons).toHaveLength(8);
  expect(new Set(lessons.map(l=>l.id)).size).toBe(8);
  expect(questions).toHaveLength(80);
  expect(new Set(questions.map(q=>q.id)).size).toBe(80);
  expect(new Set(questions.map(q=>q.prompt.trim())).size).toBe(80);
 });
 it.each(lessons)('covers lesson $id with ten questions and usable beginner/medium assessments',lesson=>{
  const bank=questions.filter(q=>q.lesson===lesson.id);
  expect(bank).toHaveLength(10);
  expect(bank.filter(q=>q.dok===1).length).toBeGreaterThanOrEqual(2);
  expect(bank.filter(q=>q.dok<=2).length).toBeGreaterThanOrEqual(2);
  expect(bank.some(q=>q.dok===3)).toBe(true);
  expect(lesson.objectives.length).toBeGreaterThanOrEqual(3);
  expect(lesson.sections.length).toBeGreaterThanOrEqual(4);
  expect(lesson.beginner.trim().length).toBeGreaterThan(20);
  expect(lesson.advanced.trim().length).toBeGreaterThan(20);
 });
 it('has valid answer indices, unique options, explanations and valid lesson references',()=>{
  const ids=new Set(lessons.map(l=>l.id));
  for(const question of questions){
   expect(ids.has(question.lesson),question.id).toBe(true);
   expect(Number.isInteger(question.answer),question.id).toBe(true);
   expect(question.answer,question.id).toBeGreaterThanOrEqual(0);
   expect(question.answer,question.id).toBeLessThan(question.options.length);
   expect(question.options.length,question.id).toBeGreaterThanOrEqual(2);
   expect(new Set(question.options).size,question.id).toBe(question.options.length);
   expect(question.options.every(o=>o.trim().length>0),question.id).toBe(true);
   expect(question.explanation.trim().length,question.id).toBeGreaterThan(20);
   expect(question.prompt.trim().length,question.id).toBeGreaterThan(10);
   if(question.type==='truefalse')expect(question.options,question.id).toHaveLength(2);
  }
 });
 it('includes all seven question formats and three cognitive-demand levels',()=>{
  expect([...new Set(questions.map(q=>q.type))].sort()).toEqual(['mcq','truefalse','matching','ordering','functional','explanation','analysis'].sort());
  expect([...new Set(questions.map(q=>q.dok))].sort()).toEqual([1,2,3]);
 });
});
