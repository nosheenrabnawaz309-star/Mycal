import React, { useState, useEffect, useRef } from 'react';
import { evaluate } from 'mathjs';
import { GoogleGenAI } from "@google/genai";
import { 
  Calculator as CalculatorIcon, 
  MessageSquare, 
  X, 
  ChevronRight, 
  Delete,
  Sparkles
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export default function App() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [history, setHistory] = useState<{ expression: string; result: string }[]>([]);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll AI response
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [aiResponse]);

  const handleButtonClick = (value: string) => {
    if (value === '=') {
      calculateResult();
    } else if (value === 'C') {
      setInput('');
      setResult('');
    } else if (value === 'DEL') {
      setInput(prev => prev.slice(0, -1));
    } else {
      setInput(prev => prev + value);
    }
  };

  const calculateResult = () => {
    try {
      if (!input) return;
      // Replace symbols for mathjs
      const sanitizedInput = input
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, 'PI')
        .replace(/e/g, 'E')
        .replace(/sin\(/g, 'sin(')
        .replace(/cos\(/g, 'cos(')
        .replace(/tan\(/g, 'tan(')
        .replace(/log\(/g, 'log10(')
        .replace(/ln\(/g, 'log(')
        .replace(/√\(/g, 'sqrt(');

      const res = evaluate(sanitizedInput);
      const formattedRes = Number.isInteger(res) ? res.toString() : res.toFixed(8).replace(/\.?0+$/, '');
      setResult(formattedRes);
      setHistory(prev => [{ expression: input, result: formattedRes }, ...prev].slice(0, 10));
    } catch (error) {
      setResult('Error');
    }
  };

  const askAI = async (customQuery?: string) => {
    setIsAiPanelOpen(true);
    setIsAiLoading(true);
    setAiResponse('');

    const query = customQuery || `Explain how to solve this scientific calculation: ${input}. If there's a result, it is ${result}. Provide a brief, clear step-by-step explanation.`;

    try {
      const result = await genAI.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: query }] }]
      });

      for await (const chunk of result) {
        const chunkText = chunk.text;
        setAiResponse(prev => prev + chunkText);
      }
    } catch (error) {
      console.error(error);
      setAiResponse('Sorry, I encountered an error while processing your request.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    askAI(aiQuery);
    setAiQuery('');
  };

  const buttons = [
    { label: 'sin', value: 'sin(', type: 'func' },
    { label: 'cos', value: 'cos(', type: 'func' },
    { label: 'tan', value: 'tan(', type: 'func' },
    { label: 'deg', value: 'deg', type: 'func' },
    { label: 'log', value: 'log(', type: 'func' },
    { label: 'ln', value: 'ln(', type: 'func' },
    { label: '(', value: '(', type: 'op' },
    { label: ')', value: ')', type: 'op' },
    { label: '√', value: '√(', type: 'func' },
    { label: '^', value: '^', type: 'op' },
    { label: 'π', value: 'π', type: 'const' },
    { label: 'e', value: 'e', type: 'const' },
    { label: '7', value: '7', type: 'num' },
    { label: '8', value: '8', type: 'num' },
    { label: '9', value: '9', type: 'num' },
    { label: '÷', value: '÷', type: 'op' },
    { label: '4', value: '4', type: 'num' },
    { label: '5', value: '5', type: 'num' },
    { label: '6', value: '6', type: 'num' },
    { label: '×', value: '×', type: 'op' },
    { label: '1', value: '1', type: 'num' },
    { label: '2', value: '2', type: 'num' },
    { label: '3', value: '3', type: 'num' },
    { label: '-', value: '-', type: 'op' },
    { label: '0', value: '0', type: 'num' },
    { label: '.', value: '.', type: 'num' },
    { label: 'EXP', value: 'e', type: 'func' },
    { label: '+', value: '+', type: 'op' },
    { label: 'C', value: 'C', type: 'clear' },
    { label: 'DEL', value: 'DEL', type: 'clear' },
    { label: '=', value: '=', type: 'equal' },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6 items-start">
        
        {/* Main Calculator Card */}
        <div className="bg-[#18181b] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <CalculatorIcon className="w-5 h-5 text-emerald-500" />
              </div>
              <h1 className="text-lg font-semibold tracking-tight">Scientific AI</h1>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  isAiPanelOpen ? "bg-emerald-500/20 text-emerald-500" : "hover:bg-zinc-800 text-zinc-400"
                )}
              >
                <Sparkles className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Display Area */}
          <div className="p-8 flex flex-col items-end justify-end min-h-[160px] bg-[#09090b]/50">
            <div className="text-zinc-500 text-lg font-mono mb-2 h-8 overflow-x-auto whitespace-nowrap w-full text-right">
              {input || '0'}
            </div>
            <div className="text-5xl font-semibold tracking-tighter text-emerald-500 overflow-x-auto whitespace-nowrap w-full text-right">
              {result || '0'}
            </div>
          </div>

          {/* Keypad */}
          <div className="p-6 grid grid-cols-4 gap-3">
            {buttons.map((btn) => (
              <button
                key={btn.label}
                onClick={() => handleButtonClick(btn.value)}
                className={cn(
                  "h-14 rounded-xl text-sm font-medium transition-all active:scale-95 flex items-center justify-center",
                  btn.type === 'num' && "bg-zinc-800 hover:bg-zinc-700 text-zinc-100",
                  btn.type === 'op' && "bg-zinc-800/50 hover:bg-zinc-700 text-emerald-500",
                  btn.type === 'func' && "bg-zinc-900 hover:bg-zinc-800 text-emerald-400 font-mono",
                  btn.type === 'const' && "bg-zinc-900 hover:bg-zinc-800 text-amber-400",
                  btn.type === 'clear' && "bg-rose-500/10 hover:bg-rose-500/20 text-rose-500",
                  btn.type === 'equal' && "bg-emerald-500 hover:bg-emerald-600 text-zinc-900 font-bold col-span-1"
                )}
              >
                {btn.label === 'DEL' ? <Delete className="w-5 h-5" /> : btn.label}
              </button>
            ))}
            <button
              onClick={() => askAI()}
              disabled={!input}
              className="h-14 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              <span>Explain</span>
            </button>
          </div>
        </div>

        {/* AI Assistant Panel */}
        <div className={cn(
          "bg-[#18181b] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col transition-all duration-300 h-[600px] lg:h-[720px]",
          !isAiPanelOpen && "hidden lg:flex opacity-50 grayscale pointer-events-none"
        )}>
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <h2 className="font-semibold">AI Assistant</h2>
            </div>
            <button 
              onClick={() => setIsAiPanelOpen(false)}
              className="p-1 hover:bg-zinc-800 rounded-md lg:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-4 text-sm leading-relaxed text-zinc-300"
          >
            {!aiResponse && !isAiLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                <div className="p-4 bg-zinc-800 rounded-full">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <p>Ask me to explain a calculation or solve a word problem.</p>
              </div>
            ) : (
              <div className="prose prose-invert prose-emerald max-w-none whitespace-pre-wrap">
                {aiResponse}
                {isAiLoading && <span className="inline-block w-2 h-4 bg-emerald-500 animate-pulse ml-1" />}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-zinc-800">
            <form onSubmit={handleAiSubmit} className="relative">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Ask a question..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <button
                type="submit"
                disabled={isAiLoading || !aiQuery.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-500 text-zinc-900 rounded-lg disabled:opacity-50 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {['Explain steps', 'Scientific context', 'Units conversion'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => askAI(`Provide ${tag.toLowerCase()} for the current calculation.`)}
                  className="whitespace-nowrap px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-full text-[10px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Background Decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>
    </div>
  );
}
