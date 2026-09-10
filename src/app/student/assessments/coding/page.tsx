"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Play, Check, Clock, Maximize2, RotateCcw, CheckCircle2 } from 'lucide-react';
import { mockCodingProblems } from '@/data/mock/assessments';

export default function CodingAssessment() {
  const router = useRouter();
  const problem = mockCodingProblems[0];
  const [timeLeft, setTimeLeft] = useState(45 * 60); // 45 mins
  const [code, setCode] = useState(problem.starterCode?.python || '');
  const [language, setLanguage] = useState('python');
  const [selectedCase, setSelectedCase] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [activeConsoleTab, setActiveConsoleTab] = useState('testcases');
  const [runResult, setRunResult] = useState<{ status: string; passed: boolean; output: string } | null>(null);

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

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    if (problem.starterCode?.[newLang]) {
      setCode(problem.starterCode[newLang]);
    }
  };

  const handleRun = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setRunResult({
        status: "Accepted",
        passed: true,
        output: "[0, 1]",
      });
      setActiveConsoleTab("output");
    }, 800);
  };

  const handleSubmit = () => {
    if (confirm("Are you ready to submit your code for assessment?")) {
      router.push('/student/assessments');
    }
  };

  return (
    <div className="h-[calc(100vh-theme(spacing.16))] flex flex-col -m-4 lg:-m-6 bg-[#1e1e1e] text-slate-300">
      {/* Top bar */}
      <div className="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-[#252526] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="font-semibold text-slate-100 truncate">{problem.title}</div>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Autosaved
          </span>
        </div>
        <div className="flex items-center gap-3 sm:gap-6 shrink-0">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="h-4 w-4 text-slate-400" />
            <span className="font-mono text-sm">{formatTime(timeLeft)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 text-xs"
              onClick={handleRun}
              disabled={isRunning}
            >
              <Play className="h-3.5 w-3.5 mr-1.5" /> 
              {isRunning ? "Running..." : "Run Code"}
            </Button>
            <Button 
              size="sm" 
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
              onClick={handleSubmit}
            >
              <Check className="h-3.5 w-3.5 mr-1.5" /> Submit
            </Button>
          </div>
        </div>
      </div>

      {/* Main content - Responsive split panes */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left pane - Problem Description */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-slate-800 flex flex-col bg-[#1e1e1e] overflow-y-auto p-4 md:p-6">
          <div className="max-w-none">
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${
                problem.difficulty === 'easy' ? 'bg-emerald-500/20 text-emerald-400' :
                problem.difficulty === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                'bg-rose-500/20 text-rose-400'
              }`}>
                {problem.difficulty}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-100 mb-3">{problem.title}</h1>
            <p className="text-slate-300 whitespace-pre-wrap leading-relaxed text-sm">{problem.description}</p>
            
            <div className="mt-6 space-y-5">
              {problem.examples?.map((ex, i) => (
                <div key={i}>
                  <h3 className="text-slate-200 font-semibold text-sm mb-2">Example {i + 1}:</h3>
                  <div className="bg-[#2d2d2d] rounded-md p-3 font-mono text-xs space-y-1.5">
                    <div><span className="text-slate-500">Input:</span> <span className="text-slate-200">{ex.input}</span></div>
                    <div><span className="text-slate-500">Output:</span> <span className="text-emerald-400">{ex.output}</span></div>
                    {ex.explanation && (
                      <div className="text-slate-400 pt-1 text-[11px] border-t border-slate-700/50">
                        Explanation: {ex.explanation}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {problem.constraints?.length > 0 && (
                <div>
                  <h3 className="text-slate-200 font-semibold text-sm mb-2">Constraints:</h3>
                  <ul className="list-disc list-inside space-y-1 font-mono text-xs text-slate-400">
                    {problem.constraints.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right pane - Editor & Console */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col bg-[#1e1e1e]">
          {/* Editor Header */}
          <div className="h-10 bg-[#252526] flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
            <select 
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-[#333333] border border-slate-700 text-slate-300 text-xs rounded px-2.5 py-1 outline-none cursor-pointer"
            >
              <option value="python">Python 3</option>
              <option value="java">Java (OpenJDK 17)</option>
              <option value="cpp">C++ (GCC 12)</option>
            </select>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => problem.starterCode?.[language] && setCode(problem.starterCode[language])} 
                className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1"
                title="Reset code template"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
              <button className="text-slate-400 hover:text-slate-200 p-1">
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 flex bg-[#1e1e1e] font-mono text-sm overflow-hidden relative">
            <div className="w-10 bg-[#1e1e1e] border-r border-slate-800 text-slate-600 text-right pr-2.5 py-3 select-none text-xs">
              {code.split('\n').map((_: string, i: number) => <div key={i}>{i + 1}</div>)}
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 bg-transparent text-slate-200 p-3 outline-none resize-none whitespace-pre font-mono text-sm leading-relaxed"
              spellCheck={false}
            />
          </div>

          {/* Bottom Console Panel */}
          <div className="h-44 border-t border-slate-800 flex flex-col bg-[#252526] shrink-0">
            <Tabs value={activeConsoleTab} onValueChange={setActiveConsoleTab} className="w-full flex-1 flex flex-col">
              <TabsList className="bg-[#252526] border-b border-slate-800 w-full justify-start rounded-none h-9 p-0">
                <TabsTrigger value="testcases" className="rounded-none text-xs data-[state=active]:bg-[#1e1e1e] data-[state=active]:border-t-2 data-[state=active]:border-t-blue-500">
                  Test Cases
                </TabsTrigger>
                <TabsTrigger value="output" className="rounded-none text-xs data-[state=active]:bg-[#1e1e1e] data-[state=active]:border-t-2 data-[state=active]:border-t-blue-500">
                  Test Result
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="testcases" className="flex-1 p-3 m-0 bg-[#1e1e1e] overflow-auto">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {problem.examples?.map((_, i) => (
                      <Button 
                        key={i} 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSelectedCase(i)}
                        className={`text-xs py-1 h-7 border-slate-700 ${selectedCase === i ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400'}`}
                      >
                        Case {i + 1}
                      </Button>
                    ))}
                  </div>
                  <div className="space-y-2 font-mono text-xs">
                    <div>
                      <div className="text-slate-500 text-[11px] mb-1">Input:</div>
                      <div className="bg-[#2d2d2d] p-2 rounded text-slate-200">{problem.examples?.[selectedCase]?.input}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-[11px] mb-1">Expected:</div>
                      <div className="bg-[#2d2d2d] p-2 rounded text-emerald-400">{problem.examples?.[selectedCase]?.output}</div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="output" className="flex-1 p-3 m-0 bg-[#1e1e1e] overflow-auto font-mono text-xs">
                {runResult ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                      <CheckCircle2 className="h-4 w-4" />
                      Status: {runResult.status} (Passed 2/2 Test Cases)
                    </div>
                    <div className="text-slate-400 text-[11px]">Runtime: 44 ms | Memory: 16.4 MB</div>
                    <div className="bg-[#2d2d2d] p-2.5 rounded space-y-1">
                      <div><span className="text-slate-500">Output:</span> <span className="text-slate-200">{runResult.output}</span></div>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs flex items-center justify-center h-full">
                    Click &ldquo;Run Code&rdquo; to execute test cases against the solution.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
