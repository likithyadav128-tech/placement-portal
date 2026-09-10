"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, ChevronLeft, ChevronRight, Flag } from 'lucide-react';
import { mockAptitudeQuestions } from '@/data/mock/assessments';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function AptitudeAssessment() {
  const router = useRouter();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [marked, setMarked] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(60 * 60);

  const questions = mockAptitudeQuestions;
  const currentQ = questions[currentIdx];
  const progress = ((currentIdx + 1) / questions.length) * 100;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (optId: string) => {
    setAnswers(prev => ({ ...prev, [currentQ.id]: optId }));
  };

  const toggleMark = () => {
    setMarked(prev => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }));
  };

  const handleSubmit = () => {
    if (confirm("Are you sure you want to submit the test?")) {
      router.push('/student/assessments');
    }
  };

  return (
    <div className="h-[calc(100vh-theme(spacing.16))] flex flex-col -m-4 lg:-m-6 bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Quantitative Aptitude Test</h1>
          <p className="text-sm text-slate-500">General Placement Preparation</p>
        </div>
        <div className="flex items-center gap-4 bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">
          <Clock className="h-5 w-5 text-slate-600" />
          <span className="font-mono text-lg font-semibold text-slate-900">{formatTime(timeLeft)}</span>
        </div>
      </header>

      {/* Progress */}
      <div className="bg-white px-6 py-2 border-b border-slate-200 shrink-0">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium text-slate-700">Question {currentIdx + 1} of {questions.length}</span>
          <span className="text-slate-500">{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Question Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col">
          <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                {currentQ.category}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleMark}
                className={cn(marked[currentQ.id] ? "text-amber-600 bg-amber-50" : "text-slate-500")}
              >
                <Flag className="h-4 w-4 mr-2" />
                {marked[currentQ.id] ? 'Marked for Review' : 'Mark for Review'}
              </Button>
            </div>

            <div className="prose prose-slate max-w-none mb-10">
              <p className="text-xl text-slate-900 leading-relaxed font-medium">
                {currentIdx + 1}. {currentQ.question}
              </p>
            </div>

            <div className="space-y-4 mt-auto">
              {currentQ.options.map((opt, optIdx) => (
                <button
                  key={optIdx}
                  onClick={() => handleSelectOption(opt)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4",
                    answers[currentQ.id] === opt
                      ? "border-blue-600 bg-blue-50/50"
                      : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
                  )}
                >
                  <div className={cn(
                    "h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0",
                    answers[currentQ.id] === opt ? "border-blue-600" : "border-slate-300"
                  )}>
                    {answers[currentQ.id] === opt && <div className="h-3 w-3 bg-blue-600 rounded-full" />}
                  </div>
                  <span className={cn(
                    "text-lg",
                    answers[currentQ.id] === opt ? "text-slate-900 font-medium" : "text-slate-700"
                  )}>
                    {opt}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Navigator */}
        <div className="w-72 bg-white border-l border-slate-200 flex flex-col shrink-0 hidden lg:flex">
          <div className="p-4 border-b border-slate-200 font-semibold text-slate-900">
            Question Navigator
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isMarked = !!marked[q.id];
                const isCurrent = idx === currentIdx;
                
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={cn(
                      "h-10 w-10 rounded-md text-sm font-medium flex items-center justify-center border transition-colors",
                      isCurrent ? "ring-2 ring-blue-600 ring-offset-1" : "",
                      isMarked ? "bg-amber-100 border-amber-300 text-amber-800" :
                      isAnswered ? "bg-blue-600 border-blue-600 text-white" :
                      "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            
            <div className="mt-8 space-y-3 text-sm">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-600 rounded-sm"></div> <span className="text-slate-600">Answered ({Object.keys(answers).length})</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-100 border border-amber-300 rounded-sm"></div> <span className="text-slate-600">Marked ({Object.keys(marked).length})</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-white border border-slate-200 rounded-sm"></div> <span className="text-slate-600">Unanswered ({questions.length - Object.keys(answers).length})</span></div>
            </div>
          </div>
          
          <div className="p-4 border-t border-slate-200">
            <Button onClick={handleSubmit} className="w-full bg-emerald-600 hover:bg-emerald-700">
              Submit Test
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <Button 
          variant="outline" 
          onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
          disabled={currentIdx === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" /> Previous
        </Button>
        <div className="lg:hidden font-medium text-slate-700 text-sm">
          {currentIdx + 1} / {questions.length}
        </div>
        {currentIdx === questions.length - 1 ? (
          <Button 
            onClick={handleSubmit} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          >
            Submit Test
          </Button>
        ) : (
          <Button 
            onClick={() => setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1))}
          >
            Next <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
