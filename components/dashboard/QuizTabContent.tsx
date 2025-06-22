import React from 'react';
import QuizList from '@/components/ui/quiz';
import { QuizStarter } from '../quiz/QuizStarter';

export function QuizTabContent() {
  return (
    <div>
      <QuizList />
      <QuizStarter />
    </div>
  );
}
