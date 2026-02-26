/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Mic, 
  BookOpen, 
  Tractor, 
  Stethoscope, 
  IndianRupee, 
  PiggyBank, 
  CloudSun, 
  Newspaper, 
  Landmark,
  Mail,
  MessageSquare,
  Volume2,
  Home,
  Settings,
  HelpCircle,
  X,
  Send,
  Loader2
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Initialize Gemini API
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function App() {
  const [query, setQuery] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const handleTranslate = async () => {
    if (!query.trim()) {
      alert("Please enter some text to translate.");
      return;
    }

    setIsTranslating(true);
    try {
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Translate the following text to Hindi if it's in English, or to English if it's in Hindi. Return ONLY the translated text without any explanation: "${query}"`,
      });
      const translatedText = response.text || "";
      if (translatedText) {
        setQuery(translatedText.trim());
      }
    } catch (error) {
      console.error("Translation Error:", error);
      alert("Translation failed. Please try again.");
    } finally {
      setIsTranslating(false);
    }
  };

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'hi-IN'; // Default to Hindi, but it usually handles English too

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const categories = [
    { id: 'govt', label: 'GOVT SCHEMES', icon: Landmark, color: 'bg-slate-500/60' },
    { id: 'edu', label: 'EDUCATION', icon: BookOpen, color: 'bg-emerald-600/60' },
    { id: 'farm', label: 'FARMING', icon: Tractor, color: 'bg-slate-600/60' },
    { id: 'health', label: 'HEALTH', icon: Stethoscope, color: 'bg-emerald-700/60' },
    { id: 'fin1', label: 'STOCKS', icon: IndianRupee, color: 'bg-slate-500/60' },
    { id: 'fin2', label: 'FINANCE', icon: PiggyBank, color: 'bg-emerald-600/60' },
    { id: 'weather', label: 'WEATHER', icon: CloudSun, color: 'bg-slate-600/60' },
    { id: 'news', label: 'LOCAL NEWS', icon: Newspaper, color: 'bg-emerald-700/60' },
  ];

  const bottomNav = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'help', label: 'Help', icon: HelpCircle },
  ];

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    const userMessage = query;
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setQuery('');
    setIsChatOpen(true);
    setIsLoading(true);

    try {
      const model = "gemini-3-flash-preview";
      const systemInstruction = activeCategory 
        ? `You are AgriPulse, a helpful assistant specialized in ${activeCategory}. Provide concise and practical information for farmers and rural users.`
        : "You are AgriPulse, a helpful assistant for agriculture and rural services. Provide concise and practical information.";

      const response = await genAI.models.generateContent({
        model,
        contents: [...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })), { role: 'user', parts: [{ text: userMessage }] }],
        config: { systemInstruction }
      });

      const text = response.text || "I'm sorry, I couldn't process that.";
      setMessages(prev => [...prev, { role: 'model', text }]);
    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    setIsChatOpen(true);
    const welcomeMsg = `How can I help you with **${category}** today?`;
    setMessages([{ role: 'model', text: welcomeMsg }]);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-0 sm:p-4 font-sans overflow-hidden">
      {/* Mobile Container Frame */}
      <div className="relative w-full h-full sm:w-[390px] sm:h-[844px] sm:rounded-[3rem] sm:border-[8px] sm:border-slate-800 bg-slate-900 text-white shadow-2xl overflow-hidden flex flex-col">
        
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center scale-110 blur-[2px]"
          style={{ 
            backgroundImage: 'url("https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1080&q=80")',
            filter: 'brightness(0.5)'
          }}
        />
        
        {/* Main Content */}
        <div className="relative z-10 flex flex-col h-full px-6 pt-12 pb-20 overflow-y-auto no-scrollbar">
          
          {/* Header / Logo */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-24 h-24 mb-4 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full text-white" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                {/* Top Section: Trees and House */}
                <g transform="translate(0, 5)">
                  {/* Tree 1 */}
                  <path d="M10,45 L10,10 M10,20 L18,12 M10,28 L4,22" />
                  {/* Tree 2 */}
                  <path d="M28,45 L28,10 M28,20 L36,12 M28,28 L22,22" />
                  {/* Tree 3 */}
                  <path d="M46,45 L46,10 M46,20 L54,12 M46,28 L40,22" />
                  {/* House */}
                  <path d="M62,45 L62,22 L80,8 L98,22 L98,45 Z" />
                  <path d="M82,45 L82,34 L90,34 L90,45" />
                  {/* Sun/Moon detail */}
                  <circle cx="92" cy="8" r="3" fill="currentColor" stroke="none" />
                </g>
                
                {/* Bottom Section: Fields/Path */}
                <g transform="translate(0, 55)">
                  <rect x="5" y="0" width="90" height="40" rx="2" />
                  <path d="M45,40 Q45,10 95,10" opacity="0.8" />
                  <path d="M65,40 Q65,22 95,22" opacity="0.6" />
                  <path d="M80,40 Q80,32 95,32" opacity="0.4" />
                </g>
              </svg>
            </div>
            <h1 className="text-4xl font-light tracking-wide">AgriPulse</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] font-medium opacity-70 mt-1">Bridging fields to future</p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative mb-10">
            <input 
              type="text" 
              placeholder="नमस्ते, अपना सवाल पूछें"
              className="w-full bg-white/90 text-slate-800 py-4 px-6 pr-14 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-400"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button 
              type="button"
              onClick={toggleListening}
              className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2 transition-colors border-l border-slate-200 pl-3",
                isListening ? "text-red-500 animate-pulse" : "text-slate-400 hover:text-emerald-600"
              )}
            >
              <Mic size={24} />
            </button>
          </form>

          {/* Categories Grid */}
          <div className="grid grid-cols-4 gap-3 mb-12">
            {categories.map((cat) => (
              <button 
                key={cat.id}
                onClick={() => handleCategoryClick(cat.label)}
                className={cn(
                  "aspect-square rounded-2xl flex flex-col items-center justify-center p-2 transition-transform active:scale-95 shadow-md",
                  cat.color
                )}
              >
                <cat.icon size={28} className="mb-2" strokeWidth={1.5} />
                <span className="text-[9px] font-bold text-center leading-tight tracking-wider">{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Quick Access */}
          <div className="mb-auto">
            <h2 className="text-center text-sm font-medium opacity-80 mb-6">Quick Access</h2>
            <div className="flex justify-around px-4">
              <button className="flex flex-col items-center group">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-2 group-active:scale-90 transition-transform">
                  <Mail size={24} strokeWidth={1.5} />
                </div>
                <span className="text-[10px] font-medium opacity-80">Offline Mode</span>
              </button>
              <button onClick={toggleListening} className="flex flex-col items-center group">
                <div className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center mb-2 group-active:scale-90 transition-transform",
                  isListening ? "bg-red-500/40 animate-pulse" : "bg-white/20"
                )}>
                  <MessageSquare size={24} strokeWidth={1.5} />
                </div>
                <span className="text-[10px] font-medium opacity-80">Voice Input</span>
              </button>
              <button onClick={handleTranslate} disabled={isTranslating} className="flex flex-col items-center group">
                <div className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center mb-2 group-active:scale-90 transition-transform",
                  isTranslating ? "bg-emerald-500/40 animate-pulse" : "bg-white/20"
                )}>
                  <Volume2 size={24} strokeWidth={1.5} />
                </div>
                <span className="text-[10px] font-medium opacity-80">{isTranslating ? 'Translating...' : 'Translate'}</span>
              </button>
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/20 backdrop-blur-md flex justify-around py-4 border-t border-white/10">
            {bottomNav.map((item) => (
              <button key={item.id} className="flex flex-col items-center opacity-70 hover:opacity-100 transition-opacity">
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))}
            
            {/* Floating Translator Icon on the right side */}
            <div className="absolute -top-20 right-6 flex flex-col items-center gap-1">
              <button 
                onClick={handleTranslate}
                disabled={isTranslating}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95",
                  isTranslating ? "bg-emerald-500 animate-pulse" : "bg-emerald-600 hover:bg-emerald-500"
                )}
              >
                {isTranslating ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Volume2 size={20} />
                )}
              </button>
              <span className="text-[10px] font-bold uppercase tracking-tighter opacity-80">Translator</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Overlay */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col animate-in slide-in-from-bottom duration-300">
          {/* Chat Header */}
          <div className="bg-slate-800/80 backdrop-blur-md p-4 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-6 h-6 text-white fill-current">
                  <path d="M50 15c-16.5 0-30 13.5-30 30 0 5.5 1.5 10.5 4 15 2 3.5 3.5 7.5 3.5 11.5 0 4.5 3.5 8.5 8 8.5h29c4.5 0 8-4 8-8.5 0-4 1.5-8 3.5-11.5 2.5-4.5 4-9.5 4-15 0-16.5-13.5-30-30-30z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-sm">AgriPulse Assistant</h3>
                <p className="text-[10px] opacity-60 uppercase tracking-widest">{activeCategory || 'General'}</p>
              </div>
            </div>
            <button 
              onClick={() => {
                setIsChatOpen(false);
                setActiveCategory(null);
              }}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 && !isLoading && (
              <div className="h-full flex flex-col items-center justify-center opacity-40 text-center px-10">
                <MessageSquare size={48} className="mb-4" />
                <p>Start a conversation with AgriPulse. Ask about farming, health, or government schemes.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={cn(
                  "flex flex-col max-w-[85%]",
                  msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div 
                  className={cn(
                    "px-4 py-3 rounded-2xl text-sm",
                    msg.role === 'user' 
                      ? "bg-emerald-600 text-white rounded-tr-none" 
                      : "bg-slate-800 text-slate-100 rounded-tl-none"
                  )}
                >
                  <div className="prose prose-invert prose-sm max-w-none">
                    <Markdown>{msg.text}</Markdown>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <Loader2 size={14} className="animate-spin" />
                <span>AgriPulse is thinking...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 bg-slate-800/50 border-t border-white/10">
            <form 
              onSubmit={handleSearch}
              className="flex items-center gap-2 bg-slate-700 rounded-xl p-1 pr-2"
            >
              <input 
                type="text" 
                placeholder="Type your message..."
                className="flex-1 bg-transparent py-3 px-4 focus:outline-none text-sm"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button 
                type="submit"
                disabled={isLoading || !query.trim()}
                className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-colors"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
