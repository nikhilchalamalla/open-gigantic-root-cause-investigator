"use client";

import React, { useState } from "react";
import { HistoryItem } from "./page";
import { 
  Search, 
  Filter, 
  Activity, 
  ThumbsUp, 
  ThumbsDown, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Code,
  FileText,
  Copy,
  Check
} from "lucide-react";

interface HistoryClientPageProps {
  initialHistory: HistoryItem[];
}

export default function HistoryClientPage({ initialHistory }: HistoryClientPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 1. Calculate statistics
  const totalAnalyzed = initialHistory.length;
  
  const feedbackItems = initialHistory.filter(h => h.useful !== null);
  const totalFeedback = feedbackItems.length;
  const usefulCount = feedbackItems.filter(h => h.useful === true).length;
  const approvalRate = totalFeedback > 0 ? Math.round((usefulCount / totalFeedback) * 100) : 100;
  
  const avgLatency = initialHistory.length > 0 
    ? Math.round(initialHistory.reduce((sum, h) => sum + (h.latencyMs || 0), 0) / initialHistory.length)
    : 0;

  // 2. Filter list
  const filteredHistory = initialHistory.filter(item => {
    const matchesSearch = 
      item.exceptionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.errorMessage.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.rawLog.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesLang = selectedLanguage === "" || item.language === selectedLanguage;
    
    return matchesSearch && matchesLang;
  });

  const uniqueLanguages = Array.from(new Set(initialHistory.map(h => h.language)));

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-8">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel border-white/5 rounded-2xl p-5 flex items-center space-x-4">
          <div className="p-3 bg-violet-600/10 border border-violet-500/20 rounded-xl text-violet-400">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Traces Ingested</p>
            <p className="text-2xl font-bold text-zinc-100">{totalAnalyzed}</p>
          </div>
        </div>

        <div className="glass-panel border-white/5 rounded-2xl p-5 flex items-center space-x-4">
          <div className="p-3 bg-emerald-600/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <ThumbsUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Helpfulness Approval</p>
            <p className="text-2xl font-bold text-zinc-100">{approvalRate}%</p>
          </div>
        </div>

        <div className="glass-panel border-white/5 rounded-2xl p-5 flex items-center space-x-4">
          <div className="p-3 bg-indigo-600/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Avg Latency</p>
            <p className="text-2xl font-bold text-zinc-100">{avgLatency} ms</p>
          </div>
        </div>

        <div className="glass-panel border-white/5 rounded-2xl p-5 flex items-center space-x-4">
          <div className="p-3 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-300">
            <Code className="h-5 w-5" />
          </div>
          <div>
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Registered Types</p>
            <p className="text-2xl font-bold text-zinc-100">{uniqueLanguages.length}</p>
          </div>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by log text, exception class, or error message..."
            className="w-full h-11 pl-11 pr-4 rounded-xl bg-zinc-900 border border-white/5 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 text-sm text-zinc-200 outline-none transition-all"
          />
        </div>

        {/* Language Filter */}
        <div className="w-full md:w-56 relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full h-11 pl-11 pr-4 rounded-xl bg-zinc-900 border border-white/5 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 text-sm text-zinc-200 outline-none transition-all appearance-none"
          >
            <option value="">All Dialects</option>
            {uniqueLanguages.map((lang, idx) => (
              <option key={idx} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredHistory.length > 0 ? (
          filteredHistory.map((item) => {
            const isExpanded = expandedId === item.id;
            const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleString() : "Unknown date";
            
            return (
              <div
                key={item.id}
                className="glass-panel border-white/5 rounded-2xl overflow-hidden transition-all shadow-xl"
              >
                {/* Header row */}
                <div
                  onClick={() => toggleExpand(item.id)}
                  className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02] transition-all select-none"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-violet-600/20 text-violet-300 border border-violet-500/10 uppercase tracking-wide">
                        {item.language}
                      </span>
                      <span className="text-[10px] text-zinc-500 flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{dateStr}</span>
                      </span>
                      {item.useful !== null && (
                        <span className={`inline-flex items-center space-x-1 text-[10px] font-bold ${item.useful ? "text-emerald-400" : "text-rose-400"}`}>
                          {item.useful ? <ThumbsUp className="h-3 w-3" /> : <ThumbsDown className="h-3 w-3" />}
                          <span>{item.useful ? "Useful" : "Not Useful"}</span>
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-zinc-200 truncate">{item.exceptionType}</h3>
                    <p className="text-xs text-zinc-400 line-clamp-1 leading-relaxed">{item.errorMessage}</p>
                  </div>

                  <div className="flex items-center space-x-3 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-[9px] uppercase tracking-wider text-zinc-500">Model</p>
                      <p className="text-xs text-zinc-400 font-medium">{item.llmModel || "Local"}</p>
                    </div>
                    <div className="p-1.5 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </div>

                {/* Collapsible body */}
                {isExpanded && (
                  <div className="px-5 pb-6 border-t border-white/5 pt-5 bg-zinc-950/20 space-y-5 animate-fade-in">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left: Raw log */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center space-x-1.5">
                          <FileText className="h-3.5 w-3.5" />
                          <span>Submitted Log Trace</span>
                        </span>
                        <pre className="p-4 rounded-xl text-[10px] font-mono overflow-auto max-h-60 text-zinc-400 whitespace-pre bg-zinc-950 border border-white/5">
                          {item.rawLog}
                        </pre>
                      </div>

                      {/* Right: AI proposed patch */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center space-x-1.5">
                            <Code className="h-3.5 w-3.5" />
                            <span>Preserved Solution Patch</span>
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(item.id, item.proposedFix || "");
                            }}
                            className="flex items-center space-x-1 text-[9px] text-zinc-500 hover:text-zinc-300 uppercase tracking-wider"
                          >
                            {copiedId === item.id ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Copy Code</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="p-4 rounded-xl text-[10px] font-mono overflow-auto max-h-60 text-zinc-300 whitespace-pre-wrap bg-zinc-950 border border-white/5">
                          {item.proposedFix || "No proposed fix generated."}
                        </pre>
                      </div>
                    </div>

                    {/* Developer notes / Resolution summary */}
                    {(item.feedbackNote || item.feedbackResolution) && (
                      <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {item.feedbackNote && (
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-zinc-500 block mb-1 font-semibold">Developer Feedback Notes:</span>
                            <p className="text-xs text-zinc-300 italic">"{item.feedbackNote}"</p>
                          </div>
                        )}
                        {item.feedbackResolution && (
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-zinc-500 block mb-1 font-semibold">Developer Actual Code Fix:</span>
                            <pre className="p-3 rounded-lg text-[10px] font-mono bg-zinc-950 border border-white/5 overflow-x-auto text-zinc-300">
                              {item.feedbackResolution}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center p-12 text-center space-y-3">
            <Search className="h-8 w-8 text-zinc-600" />
            <div>
              <h3 className="text-zinc-300 font-semibold text-sm">No historical incidents found</h3>
              <p className="text-zinc-500 text-xs mt-1">
                {totalAnalyzed === 0
                  ? "You haven't run any diagnostic sessions yet."
                  : "No incident records match your search criteria."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
