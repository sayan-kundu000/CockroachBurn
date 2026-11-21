import React, { useState, useEffect } from 'react';
import { bugmardiniApi } from '../services/api';
import { bugmardiniVoice } from '../services/voiceAssistant';
import {
  Sparkles, Volume2, VolumeX, Pause, Play, Square,
  CheckCircle2, AlertTriangle, ShieldAlert, Cpu, Terminal,
  MessageSquare, Send, Copy, Check, X, Loader2, ArrowRight, Lightbulb
} from 'lucide-react';

export const BugmardiniModal = ({ ticket, initialLogs = '', onClose }) => {
  const [activeTab, setActiveTab] = useState('simple'); // 'simple', 'technical', 'security', 'tests', 'chat'
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');

  // Voice state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Standalone analysis inputs if no ticket provided
  const [customTitle, setCustomTitle] = useState(ticket?.title || '');
  const [customDescription, setCustomDescription] = useState(ticket?.description || initialLogs);

  // Follow-up Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Register voice state listener
  useEffect(() => {
    bugmardiniVoice.onStateChange = ({ isSpeaking, isPaused }) => {
      setIsSpeaking(isSpeaking);
      setIsPaused(isPaused);
    };

    return () => {
      bugmardiniVoice.stop();
      bugmardiniVoice.onStateChange = null;
    };
  }, []);

  const runAnalysis = async (titleToUse, descToUse) => {
    try {
      setLoading(true);
      setError('');
      bugmardiniVoice.stop();

      const payload = ticket?.id
        ? { ticket_id: ticket.id }
        : { title: titleToUse, description: descToUse };

      const res = await bugmardiniApi.analyze(payload);
      setAnalysis(res.data.analysis);

      // Add welcoming introductory chat message
      setChatMessages([
        {
          sender: 'ai',
          text: `Greetings! I am Bugmardini AI, your Principal Staff Engineer. I have reviewed "${res.data.analysis.title}". You can ask me any follow-up questions, request tests, or ask for alternative language fixes here!`,
        },
      ]);
    } catch (err) {
      console.error('Failed to run Bugmardini AI analysis', err);
      setError(err.response?.data?.detail || 'Bugmardini AI analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticket) {
      runAnalysis(ticket.title, ticket.description);
    }
  }, [ticket]);

  // Voice playback handlers
  const handleToggleVoice = (textToSpeak) => {
    if (isSpeaking) {
      if (isPaused) {
        bugmardiniVoice.resume();
      } else {
        bugmardiniVoice.pause();
      }
    } else {
      const script = textToSpeak || analysis?.voice_script || analysis?.simple_explanation;
      if (script) {
        bugmardiniVoice.speak(script);
      }
    }
  };

  const handleStopVoice = () => {
    bugmardiniVoice.stop();
  };

  const handleCopyCode = (codeText) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || sendingChat) return;

    const userText = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);

    try {
      setSendingChat(true);
      const res = await bugmardiniApi.chat({
        query: userText,
        ticket_id: ticket?.id,
        context: analysis ? { title: analysis.title, category: analysis.category } : {},
      });

      const aiReply = res.data.answer;
      setChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: aiReply, voiceScript: res.data.voice_script },
      ]);

      // Automatically speak the new reply if user was already listening
      if (isSpeaking) {
        bugmardiniVoice.speak(res.data.voice_script || aiReply);
      }
    } catch (err) {
      console.error('Chat error', err);
      setChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'I encountered an error processing your query. Please try again.' },
      ]);
    } finally {
      setSendingChat(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            {/* Glowing Avatar */}
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-500 flex items-center justify-center text-xl shadow-lg shadow-purple-500/30 text-white font-bold animate-pulse">
                ⚔️
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-slate-900 rounded-full" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold bg-gradient-to-r from-pink-300 via-purple-200 to-indigo-300 bg-clip-text text-transparent">
                  Bugmardini AI
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Transformer Engine
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-300 border border-pink-500/20">
                  🎙️ Female Voice
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Bug Slayer, Technical Explainer & Code Architect
              </p>
            </div>
          </div>

          {/* Voice Controls & Close */}
          <div className="flex items-center space-x-3">
            {/* Voice Readout Controls */}
            {analysis && (
              <div className="flex items-center space-x-1.5 bg-slate-800/80 border border-purple-500/30 rounded-xl p-1 px-2.5 shadow-sm">
                {/* Animated Soundwave Visualizer */}
                {isSpeaking && !isPaused && (
                  <div className="flex items-center space-x-0.5 mr-2">
                    <span className="w-1 h-3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-4 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="w-1 h-4 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                  </div>
                )}

                <button
                  onClick={() => handleToggleVoice()}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    isSpeaking
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-purple-300 hover:text-white hover:bg-purple-600/30'
                  }`}
                  title={isSpeaking ? (isPaused ? 'Resume Voice' : 'Pause Voice') : 'Read Aloud with Female Voice'}
                >
                  {isSpeaking ? (
                    isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-pink-400" />
                  )}
                  <span>
                    {isSpeaking ? (isPaused ? 'Resume' : 'Pause') : 'Listen (Female Voice)'}
                  </span>
                </button>

                {isSpeaking && (
                  <button
                    onClick={handleStopVoice}
                    className="p-1 rounded text-slate-400 hover:text-rose-400 transition"
                    title="Stop Speaking"
                  >
                    <Square className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            <button
              onClick={() => {
                bugmardiniVoice.stop();
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Custom Input Bar if not analyzing from a ticket */}
        {!ticket && (
          <div className="p-4 bg-slate-850/80 border-b border-slate-800 flex flex-wrap gap-2 items-center">
            <input
              type="text"
              placeholder="Enter bug summary (e.g. Memory leak in socket registry or NullPointerException)..."
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="flex-1 min-w-[280px] bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={() => runAnalysis(customTitle, customDescription)}
              disabled={loading || !customTitle.trim()}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-md transition disabled:opacity-40 flex items-center space-x-1.5"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{loading ? 'Analyzing...' : 'Analyze with Bugmardini'}</span>
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-6 pt-2 bg-slate-900/60 overflow-x-auto">
          {[
            { id: 'simple', label: '💡 Super Simple Words (ELI5)', icon: Lightbulb },
            { id: 'technical', label: '🛠️ Code Diff & Fix', icon: Terminal },
            { id: 'security', label: '🛡️ Security & Edge Cases', icon: ShieldAlert },
            { id: 'tests', label: '🧪 Automated Test Plan', icon: CheckCircle2 },
            { id: 'chat', label: '💬 Ask Bugmardini', icon: MessageSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 pb-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white text-2xl animate-spin">
                ⚔️
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-200">
                  Bugmardini AI is inspecting your issue...
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Parsing stack traces, computing semantic attention & generating code diffs
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          ) : analysis ? (
            <>
              {/* TAB 1: Super Simple Words (ELI5) */}
              {activeTab === 'simple' && (
                <div className="space-y-6">
                  {/* Category & Severity Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-400 block mb-0.5">
                        Issue Classification
                      </span>
                      <h3 className="text-base font-bold text-slate-100">{analysis.title}</h3>
                      <div className="flex items-center space-x-2 mt-1.5">
                        <span className="text-xs font-mono font-medium text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded">
                          {analysis.category}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          {analysis.severity}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleVoice(analysis.simple_explanation)}
                      className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-lg shadow-purple-600/30 transition active:scale-95"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>{isSpeaking ? 'Pause Audio' : 'Speak Explanation (Female Voice)'}</span>
                    </button>
                  </div>

                  {/* Super Simple Analogy Card */}
                  <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-850 via-slate-850/90 to-purple-950/20 border border-purple-500/30 shadow-xl relative overflow-hidden">
                    <div className="flex items-center space-x-2 text-pink-400 mb-3">
                      <Lightbulb className="w-5 h-5" />
                      <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                        Super Simple Analogy (Explain Like I'm 5)
                      </h4>
                    </div>

                    <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-sans font-normal">
                      {analysis.simple_explanation}
                    </p>
                  </div>

                  {/* Executive Summary */}
                  <div className="p-4 rounded-2xl bg-slate-850/80 border border-slate-800 space-y-2">
                    <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      High-Level Executive Summary
                    </h5>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {analysis.summary}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: Deep Technical Fix & Code Diff */}
              {activeTab === 'technical' && (
                <div className="space-y-6">
                  {/* Detailed Root Cause */}
                  <div className="p-5 rounded-2xl bg-slate-850/80 border border-slate-800 space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center space-x-1.5">
                      <Terminal className="w-4 h-4" />
                      <span>Root Cause Technical Analysis</span>
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-sans">
                      {analysis.detailed_explanation}
                    </p>
                  </div>

                  {/* Step by Step Fix */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Step-by-Step Resolution Roadmap
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {analysis.fix_steps.map((step, idx) => (
                        <div
                          key={idx}
                          className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs text-slate-200"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Code Before vs After Diff */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Code Patch (Before vs After)
                      </h4>
                      <button
                        onClick={() => handleCopyCode(analysis.code_after)}
                        className="flex items-center space-x-1 text-xs text-purple-400 hover:text-purple-300 font-medium px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 transition"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode ? 'Copied!' : 'Copy Fix Code'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Before */}
                      <div className="rounded-2xl border border-rose-500/30 bg-slate-950 overflow-hidden flex flex-col">
                        <div className="px-3.5 py-2 bg-rose-500/10 border-b border-rose-500/20 text-[11px] font-mono text-rose-300 font-semibold flex items-center justify-between">
                          <span>❌ Problematic Code</span>
                          <span className="text-[10px] bg-rose-500/20 px-1.5 py-0.5 rounded">Vulnerable</span>
                        </div>
                        <pre className="p-3.5 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed flex-1">
                          <code>{analysis.code_before}</code>
                        </pre>
                      </div>

                      {/* After */}
                      <div className="rounded-2xl border border-emerald-500/30 bg-slate-950 overflow-hidden flex flex-col">
                        <div className="px-3.5 py-2 bg-emerald-500/10 border-b border-emerald-500/20 text-[11px] font-mono text-emerald-300 font-semibold flex items-center justify-between">
                          <span>✅ Bugmardini Patched Code</span>
                          <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded">Verified</span>
                        </div>
                        <pre className="p-3.5 text-[11px] font-mono text-emerald-300/90 overflow-x-auto leading-relaxed flex-1">
                          <code>{analysis.code_after}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Security & Edge Cases */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  {/* Security Audit */}
                  <div className="p-5 rounded-2xl bg-slate-850/80 border border-amber-500/30 space-y-3">
                    <div className="flex items-center space-x-2 text-amber-400">
                      <ShieldAlert className="w-5 h-5" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">
                        Security & Vulnerability Audit
                      </h4>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-sans">
                      {analysis.security_audit}
                    </p>
                  </div>

                  {/* Performance Impact */}
                  <div className="p-5 rounded-2xl bg-slate-850/80 border border-blue-500/30 space-y-3">
                    <div className="flex items-center space-x-2 text-blue-400">
                      <Cpu className="w-5 h-5" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">
                        Performance & Resource Footprint
                      </h4>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {analysis.performance_impact}
                    </p>
                  </div>

                  {/* Edge Cases */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Critical Boundary & Concurrency Edge Cases
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {analysis.edge_cases.map((ec, idx) => (
                        <div
                          key={idx}
                          className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs text-slate-300"
                        >
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <span>{ec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: Automated Test Plan */}
              {activeTab === 'tests' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                        Automated CI/CD Regression Test
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Add this test to your test suite to prevent this bug from reoccurring.
                      </p>
                    </div>

                    <button
                      onClick={() => handleCopyCode(analysis.automated_test_plan)}
                      className="flex items-center space-x-1 text-xs text-purple-400 hover:text-purple-300 font-medium px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 transition"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'Copied!' : 'Copy Test'}</span>
                    </button>
                  </div>

                  <div className="rounded-2xl border border-slate-700 bg-slate-950 overflow-hidden">
                    <div className="px-3.5 py-2 bg-slate-900 border-b border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                      <span>test_regression.py</span>
                      <span className="text-[10px] text-purple-400">Pytest / Async</span>
                    </div>
                    <pre className="p-4 text-xs font-mono text-purple-200/90 overflow-x-auto leading-relaxed">
                      <code>{analysis.automated_test_plan}</code>
                    </pre>
                  </div>
                </div>
              )}

              {/* TAB 5: Interactive Chat */}
              {activeTab === 'chat' && (
                <div className="flex flex-col h-[460px]">
                  {/* Messages list */}
                  <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 mb-4">
                    {chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start space-x-2.5 ${
                          msg.sender === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {msg.sender === 'ai' && (
                          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-xs text-white shrink-0 shadow">
                            ⚔️
                          </div>
                        )}

                        <div
                          className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                            msg.sender === 'user'
                              ? 'bg-purple-600 text-white rounded-tr-sm'
                              : 'bg-slate-800/80 border border-slate-700 text-slate-200 rounded-tl-sm'
                          }`}
                        >
                          <p className="whitespace-pre-line">{msg.text}</p>
                          {msg.sender === 'ai' && (
                            <div className="mt-2 pt-2 border-t border-slate-700/50 flex justify-end">
                              <button
                                onClick={() => handleToggleVoice(msg.voiceScript || msg.text)}
                                className="text-[10px] text-purple-300 hover:text-white flex items-center space-x-1"
                              >
                                <Volume2 className="w-3 h-3" />
                                <span>Listen (Female Voice)</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {sendingChat && (
                      <div className="flex items-center space-x-2 text-xs text-slate-400">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                        <span>Bugmardini AI is thinking...</span>
                      </div>
                    )}
                  </div>

                  {/* Chat input */}
                  <form onSubmit={handleSendChat} className="flex items-center space-x-2 pt-2 border-t border-slate-800">
                    <input
                      type="text"
                      placeholder="Ask Bugmardini follow-up questions (e.g. 'How to test this?', 'Explain simpler')..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      type="submit"
                      disabled={sendingChat || !chatInput.trim()}
                      className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow transition flex items-center space-x-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </button>
                  </form>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

