"use client";

import React, { useState, useEffect } from "react";
import { 
  Play, 
  RefreshCw, 
  Copy, 
  Check, 
  ThumbsUp, 
  ThumbsDown, 
  AlertTriangle, 
  HelpCircle, 
  ExternalLink,
  ChevronRight,
  Database,
  Layers,
  CheckCircle,
  FileText
} from "lucide-react";

// Pre-packaged samples to test easily
const SAMPLES = [
  {
    label: "Java Spring NPE",
    lang: "Java",
    log: `java.lang.NullPointerException: Cannot invoke "com.example.service.UserService.getUserById(Long)" because "this.userService" is null
\tat com.example.controller.UserController.getUser(UserController.java:24)
\tat java.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:103)
\tat java.base/java.lang.reflect.Method.invoke(Method.java:580)
\tat org.springframework.web.method.support.InvocableHandlerMethod.doInvoke(InvocableHandlerMethod.java:255)`
  },
  {
    label: "Postgres Pool Exhausted",
    lang: "SQL",
    log: `FATAL: remaining connection slots are reserved for non-replication superuser connections
\tat pool.js:23:17
\tat process.processTicksAndRejections (node:internal/process/task_queues:95:5)
ConnectionError: database connection timeout after 5000ms
\tat Pool.connect (node_modules/pg/lib/pool.js:45:11)
\tat Object.query (src/lib/db.ts:18:22)`
  },
  {
    label: "Next.js Hydration Mismatch",
    lang: "TypeScript",
    log: `Error: Hydration failed because the initial UI does not match what was rendered on the server.
Warning: Text content did not match. Server: "Login" Client: "Welcome, User!"
\tat div
\tat main
\tat Page (src/app/page.tsx:12:10)
\tat InnerLayout (src/app/layout.tsx:18:14)`
  },
  {
    label: "Python SQLAlchemy Timeout",
    lang: "Python",
    log: `sqlalchemy.exc.OperationalError: (psycopg2.OperationalError) connection to server at "localhost" (127.0.0.1), port 5432 failed: Connection refused
\tIs the server running on that host and accepting TCP/IP connections?
During handling of the above exception, another exception occurred:
\tat sqlalchemy.engine.base.Engine.connect (engine/base.py:3268)
\tat app.py:14:5`
  }
];

const LOADING_STEPS = [
  "Extracting signature & stack frame nodes...",
  "Running vector search in local database...",
  "Querying AI diagnostics pipeline...",
  "Ranking potential causes & compiling code patch..."
];

export default function Home() {
  const [rawLog, setRawLog] = useState("");
  const [language, setLanguage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);

  // Diagnostic result data
  const [result, setResult] = useState<any>(null);

  // CopyProposedFix state
  const [copied, setCopied] = useState(false);

  // Feedback states
  const [feedbackGiven, setFeedbackGiven] = useState<boolean | null>(null);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [feedbackResolution, setFeedbackResolution] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Loading steps animation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === "loading") {
      setLoadingStep(0);
      const interval = setInterval(() => {
        setLoadingStep((prev) => {
          if (prev < LOADING_STEPS.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 900);
      return () => clearInterval(interval);
    }
  }, [status]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawLog.trim()) return;

    setStatus("loading");
    setErrorMsg("");
    setResult(null);
    setFeedbackGiven(null);
    setFeedbackNote("");
    setFeedbackResolution("");
    setFeedbackSubmitted(false);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawLog, language: language || null }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.details || data.error || "Analysis failed.");
      }

      setResult(data);
      setStatus("success");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred.");
      setStatus("error");
    }
  };

  const handleFeedbackSubmit = async (usefulVal?: boolean) => {
    if (!result) return;
    const isUseful = usefulVal !== undefined ? usefulVal : feedbackGiven;
    if (isUseful === null) return;

    try {
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosisId: result.diagnosisId,
          useful: isUseful,
          note: feedbackNote.trim() || null,
          resolution: feedbackResolution.trim() || null,
        }),
      });

      if (response.ok) {
        setFeedbackSubmitted(true);
      }
    } catch (err) {
      console.error("Failed to save feedback:", err);
    }
  };

  const selectSample = (sample: typeof SAMPLES[0]) => {
    setRawLog(sample.log);
    setLanguage(sample.lang);
  };

  return (
    <div className="space-y-10">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-4xl font-extrabold sm:text-5xl tracking-tight bg-gradient-to-r from-violet-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
          Investigate Stack Traces in Real-Time
        </h1>
        <p className="text-zinc-400 text-lg leading-relaxed">
          Paste your stack trace, select your stack dialect, and let the AI find root causes, fetch historical similar bugs, and output tested code fixes.
        </p>
      </div>

      {/* Input section & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            {/* Background glowing orb */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

            <form onSubmit={handleAnalyze} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  1. Choose Dialect Context (Optional)
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-zinc-900 border border-white/5 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 text-sm text-zinc-200 outline-none transition-all"
                >
                  <option value="">Auto-Detect Dialect</option>
                  <option value="Java">Java / Spring Boot</option>
                  <option value="Python">Python / Django / FastAPI</option>
                  <option value="TypeScript">TypeScript / Node.js</option>
                  <option value="SQL">SQL / PostgreSQL</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    2. Paste Stack Trace / Logs
                  </label>
                  <button
                    type="button"
                    onClick={() => setRawLog("")}
                    className="text-[10px] text-zinc-500 hover:text-zinc-300 uppercase tracking-wider"
                  >
                    Clear
                  </button>
                </div>
                <textarea
                  value={rawLog}
                  onChange={(e) => setRawLog(e.target.value)}
                  placeholder="Paste stack trace, error logs, or SRE output here..."
                  rows={8}
                  className="w-full p-4 rounded-xl bg-zinc-950 border border-white/5 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 text-xs font-mono text-zinc-200 outline-none transition-all resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={status === "loading" || !rawLog.trim()}
                className="w-full h-12 flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:hover:from-violet-600 disabled:hover:to-indigo-600 text-sm font-semibold text-white shadow-lg glow-btn shadow-violet-950/40 transition-all outline-none"
              >
                {status === "loading" ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Analyzing Log...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-white" />
                    <span>Analyze Incident</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Tester presets */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Try prefilled test cases:
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {SAMPLES.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => selectSample(sample)}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 border border-white/5 hover:border-zinc-700 text-left text-xs font-medium text-zinc-300 hover:text-white transition-all hover:bg-zinc-800/40"
                >
                  <span>{sample.label}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Diagnostic display screen */}
        <div className="lg:col-span-7">
          {status === "idle" && (
            <div className="h-[430px] border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="p-4 rounded-full bg-zinc-900 border border-white/5">
                <HelpCircle className="h-10 w-10 text-zinc-600" />
              </div>
              <div className="max-w-md">
                <h3 className="text-zinc-200 font-semibold text-lg">Diagnostics Terminal Idle</h3>
                <p className="text-zinc-500 text-sm mt-1">
                  Choose a preset sample log or paste a stack trace on the left panel to load the investigator engine.
                </p>
              </div>
            </div>
          )}

          {status === "loading" && (
            <div className="h-[430px] glass-panel border-white/5 rounded-2xl flex flex-col items-center justify-center p-6 text-center space-y-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Database className="h-6 w-6 text-violet-400 animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-zinc-200 font-semibold text-lg">Running Investigator Engine</h3>
                <div className="flex flex-col items-center space-y-1">
                  {LOADING_STEPS.map((step, idx) => (
                    <p
                      key={idx}
                      className={`text-xs transition-colors duration-300 ${
                        idx === loadingStep
                          ? "text-violet-400 font-medium scale-105"
                          : idx < loadingStep
                          ? "text-emerald-500"
                          : "text-zinc-600"
                      }`}
                    >
                      {idx < loadingStep ? "✓ " : idx === loadingStep ? "→ " : "• "}
                      {step}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="h-[430px] border border-rose-950/20 bg-rose-950/10 rounded-2xl flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="p-4 rounded-full bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="h-10 w-10 text-rose-400" />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="text-rose-400 font-semibold text-lg">Analysis Pipeline Blocked</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          )}

          {status === "success" && result && (
            <div className="space-y-6 animate-fade-in">
              {/* Core summary bar */}
              <div className="glass-panel border-white/5 rounded-2xl p-6 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <div className="space-y-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-600/20 text-violet-300 border border-violet-500/10 uppercase tracking-wide">
                      {result.parsed.language}
                    </span>
                    <h2 className="text-xl font-bold text-zinc-100">{result.parsed.exceptionType}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-zinc-500 text-[10px] uppercase tracking-wider">Diagnostic Engine</p>
                    <p className="text-zinc-300 text-xs font-medium">{result.diagnosis.model}</p>
                    <p className="text-violet-400 text-xs mt-0.5">{result.diagnosis.latencyMs}ms latency</p>
                  </div>
                </div>

                {/* Error message */}
                <div className="bg-zinc-950/50 border border-white/5 p-4 rounded-xl font-mono text-xs text-zinc-300">
                  <span className="text-rose-400 font-semibold uppercase tracking-wider mr-2 text-[10px]">Error Message:</span>
                  {result.parsed.errorMessage}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left sub-column: Stack frames & confidence meters */}
                  <div className="space-y-5">
                    {/* Top Frames */}
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                        <Layers className="h-3.5 w-3.5 text-zinc-500" />
                        <span>Key Stack Frames</span>
                      </h4>
                      <div className="space-y-1 bg-zinc-950/30 p-3 rounded-xl border border-white/5">
                        {result.parsed.topFrames.length > 0 ? (
                          result.parsed.topFrames.map((frame: string, idx: number) => (
                            <div key={idx} className="flex items-start space-x-2 text-[11px] font-mono text-zinc-400 py-1 border-b border-white/5 last:border-b-0">
                              <span className="text-violet-500 text-xs">{idx + 1}.</span>
                              <span className="truncate">{frame}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-zinc-500 text-xs">No stack frames parsed.</p>
                        )}
                      </div>
                    </div>

                    {/* Ranked Causes */}
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-zinc-500" />
                        <span>Ranked Root Causes</span>
                      </h4>
                      <div className="space-y-3">
                        {result.diagnosis.rankedCauses.map((item: any, idx: number) => (
                          <div key={idx} className="space-y-1 bg-zinc-900/40 p-3 rounded-xl border border-white/5">
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-semibold text-zinc-200">{item.cause}</span>
                              <span className={`text-xs font-bold ${item.confidence >= 80 ? "text-emerald-400" : item.confidence >= 60 ? "text-yellow-400" : "text-zinc-400"}`}>
                                {item.confidence}%
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 leading-relaxed">{item.rationale}</p>
                            {/* Visual Progress Bar */}
                            <div className="w-full bg-zinc-950 h-1 rounded-full overflow-hidden mt-2">
                              <div 
                                className={`h-full rounded-full ${item.confidence >= 80 ? "bg-emerald-500" : item.confidence >= 60 ? "bg-yellow-500" : "bg-zinc-500"}`}
                                style={{ width: `${item.confidence}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right sub-column: Proposed Fix */}
                  <div className="space-y-5">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center space-x-1.5">
                          <CheckCircle className="h-3.5 w-3.5 text-zinc-500" />
                          <span>Proposed Solution</span>
                        </h4>
                        <button
                          onClick={() => handleCopy(result.diagnosis.proposedFix)}
                          className="flex items-center space-x-1 text-[10px] text-zinc-500 hover:text-zinc-300 uppercase tracking-wider transition-colors"
                        >
                          {copied ? (
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
                      
                      <div className="rounded-xl overflow-hidden border border-white/5">
                        <div className="bg-zinc-950 px-4 py-2 text-[10px] uppercase tracking-wider font-semibold text-zinc-500 border-b border-white/5 flex items-center justify-between">
                          <span>Actionable Patch</span>
                          <span className="text-violet-400 text-[9px] font-mono">diff</span>
                        </div>
                        <pre className="p-4 text-xs font-mono overflow-x-auto text-zinc-200 max-h-64 whitespace-pre-wrap">
                          <code>{result.diagnosis.proposedFix}</code>
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Fix Rationale</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-950/20 p-3 rounded-xl border border-white/5">
                        {result.diagnosis.fixRationale}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Similar Incidents */}
                {result.similarIncidents && result.similarIncidents.length > 0 && (
                  <div className="border-t border-white/5 pt-5 space-y-3">
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <Database className="h-3.5 w-3.5 text-zinc-500" />
                      <span>Retrieved Similar Historical Incidents</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {result.similarIncidents.map((inc: any, idx: number) => (
                        <div key={idx} className="bg-zinc-950/40 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start mb-1.5">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-white/5 uppercase">
                                {inc.language}
                              </span>
                              <span className="text-[10px] text-violet-400 font-bold font-mono">
                                Match: {Math.round(inc.similarity * 100)}%
                              </span>
                            </div>
                            <h5 className="text-xs font-bold text-zinc-200 line-clamp-1 mb-1">{inc.title}</h5>
                            <p className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed mb-3">
                              {inc.rootCause}
                            </p>
                          </div>
                          
                          {/* Details viewer toggle */}
                          <div className="border-t border-white/5 pt-2.5 mt-auto">
                            <span className="text-[9px] uppercase tracking-wider text-zinc-500 block">Historical Fix:</span>
                            <span className="text-[10px] text-zinc-400 line-clamp-1 italic font-mono mt-0.5">{inc.fix}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Feedback form */}
              <div className="glass-panel border-white/5 rounded-2xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-zinc-200">Was this AI-generated diagnosis helpful?</h3>
                    <p className="text-xs text-zinc-500">Provide feedback to help tune the incident resolution models.</p>
                  </div>
                  
                  {feedbackGiven === null ? (
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setFeedbackGiven(true)}
                        className="flex items-center space-x-2 px-4 h-10 rounded-xl bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 hover:border-emerald-500 text-xs font-semibold transition-all outline-none"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                        <span>Useful</span>
                      </button>
                      <button
                        onClick={() => setFeedbackGiven(false)}
                        className="flex items-center space-x-2 px-4 h-10 rounded-xl bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 hover:border-rose-500 text-xs font-semibold transition-all outline-none"
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                        <span>Not Useful</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold">
                        <Check className="h-4 w-4" />
                        <span>Helpfulness vote chosen: {feedbackGiven ? "Useful" : "Not Useful"}</span>
                      </div>
                      {!feedbackSubmitted && (
                        <button
                          onClick={() => setFeedbackGiven(null)}
                          className="text-[10px] text-zinc-500 hover:text-zinc-300 underline outline-none"
                        >
                          Change vote
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Additional form for detailed notes when useful is clicked */}
                {feedbackGiven !== null && !feedbackSubmitted && (
                  <div className="border-t border-white/5 pt-4 space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                          Did you notice any details that could be improved? (Optional)
                        </label>
                        <textarea
                          value={feedbackNote}
                          onChange={(e) => setFeedbackNote(e.target.value)}
                          placeholder="Tell us what the AI missed, e.g. wrong library method..."
                          rows={3}
                          className="w-full p-3 rounded-lg bg-zinc-950 border border-white/5 text-xs text-zinc-300 outline-none focus:border-zinc-700 transition-all resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                          What was the actual code or patch that fixed this? (Optional)
                        </label>
                        <textarea
                          value={feedbackResolution}
                          onChange={(e) => setFeedbackResolution(e.target.value)}
                          placeholder="Copy paste the actual resolved code block..."
                          rows={3}
                          className="w-full p-3 rounded-lg bg-zinc-950 border border-white/5 text-xs text-zinc-300 outline-none focus:border-zinc-700 transition-all resize-none"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end space-x-3">
                      <button
                        onClick={() => {
                          setFeedbackNote("");
                          setFeedbackResolution("");
                          handleFeedbackSubmit();
                        }}
                        className="px-4 h-9 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/5 hover:border-zinc-700 text-xs font-semibold text-zinc-400 hover:text-white transition-all outline-none"
                      >
                        Skip & Submit
                      </button>
                      <button
                        onClick={() => handleFeedbackSubmit()}
                        className="px-5 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-all outline-none"
                      >
                        Submit Notes
                      </button>
                    </div>
                  </div>
                )}

                {feedbackSubmitted && (
                  <div className="border-t border-emerald-500/10 bg-emerald-500/5 rounded-xl p-4 text-emerald-400 text-xs flex items-center space-x-2 animate-fade-in mt-4">
                    <Check className="h-4 w-4 shrink-0" />
                    <span>Thank you! Your resolution feedback and notes have been successfully persisted to the SRE registry database.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
