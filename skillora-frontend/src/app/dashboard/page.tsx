"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Terminal, CheckCircle2, Cpu, Send, Sparkles,
  Plus, Trash2, Target, Edit2, Briefcase, ChevronRight,
  Menu, X
} from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';

interface Message {
  sender: 'ai' | 'user';
  text: string;
  isStreaming?: boolean;
}

interface Skill {
  name: string;
  level: 'strong' | 'weak';
}
function YouTubePlayer({
  videoId,
  skill,
  onComplete
}: {
  videoId: string;
  skill: string;
  onComplete: (skill: string) => void;
}) {
  const playerRef = useRef<any>(null);
  const divId = `yt-player-${skill.replace(/[^a-zA-Z0-9]/g, '-')}`;

  useEffect(() => {
    const createPlayer = () => {
      if ((window as any).YT && (window as any).YT.Player) {
        playerRef.current = new (window as any).YT.Player(divId, {
          videoId,
          height: '280',
          width: '100%',
          playerVars: {
            rel: 0,
            modestbranding: 1,
          },
          events: {
            onStateChange: (event: any) => {
              // 0 = ended
              if (event.data === 0) {
                onComplete(skill);
              }
            },
          },
        });
      }
    };

    // If YT API already loaded
    if ((window as any).YT && (window as any).YT.Player) {
      createPlayer();
    } else {
      // Wait for API to load
      const previousCallback = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        if (previousCallback) previousCallback();
        createPlayer();
      };
    }

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch { }
      }
    };
  }, [videoId, divId, skill, onComplete]);

  return (
    <div className="rounded-xl overflow-hidden border border-white/10">
      <div id={divId} className="w-full" />
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // --- STATE: MOBILE SIDEBAR ---
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // --- STATE: CV UPLOAD & SCAN ---
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'extracting' | 'building' | 'matching' | 'complete'>('idle');
  const [scanProgress, setScanProgress] = useState(0);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');

  // --- STATE: PREDICTIVE MATCH SCORE & MATRIX ---
  const [matchScore, setMatchScore] = useState(0);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState('');

  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [roleSuggestions, setRoleSuggestions] = useState<any>(null);

  const [selectedRole, setSelectedRole] = useState<string>('');
  const [missingSkills, setMissingSkills] = useState<string[]>([]);
  const [originalMissingSkills, setOriginalMissingSkills] = useState<string[]>([]);

  const [coverLetter, setCoverLetter] = useState<string>('');
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);

  const [interviewQuestions, setInterviewQuestions] = useState<any[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);

  const [semanticScore, setSemanticScore] = useState<number | null>(null);
  const [showAnswers, setShowAnswers] = useState<{ [key: number]: boolean }>({});

  const SKILL_VIDEOS: { [key: string]: { title: string; videoId: string } } = {
    // Frontend
    'react': { title: 'React Full Course for Beginners', videoId: 'SqcY0GlETPk' },
    'react.js': { title: 'React Full Course for Beginners', videoId: 'SqcY0GlETPk' },
    'next.js': { title: 'Next.js 14 Full Course', videoId: 'ZjAqacIC_3c' },
    'typescript': { title: 'TypeScript Full Course', videoId: 'BwuLxPH8IDs' },
    'javascript': { title: 'JavaScript Full Course', videoId: 'lfmg-EJ8gm4' },
    'html': { title: 'HTML Full Course', videoId: 'mJgBOIoGihA' },
    'css': { title: 'CSS Full Course', videoId: 'OXGznpKZ_sA' },
    'tailwind': { title: 'Tailwind CSS Full Course', videoId: 'ft30zcMlFa8' },
    'vue': { title: 'Vue.js Full Course', videoId: '1GNsWa_EZdw' },
    'vue.js': { title: 'Vue.js Full Course', videoId: '1GNsWa_EZdw' },
    'angular': { title: 'Angular Full Course', videoId: '3qBXWUpoPHo' },
    // Backend
    'node.js': { title: 'Node.js Full Course', videoId: 'f2EqECiTBL8' },
    'express': { title: 'Express.js Full Course', videoId: 'SccSCuHhOw0' },
    'express.js': { title: 'Express.js Full Course', videoId: 'SccSCuHhOw0' },
    'python': { title: 'Python Full Course for Beginners', videoId: 'ix9cRaBkVe0' },
    'django': { title: 'Django Full Course', videoId: 'PtQiiknWUcI' },
    'fastapi': { title: 'FastAPI Full Course', videoId: '7t2alSnE2-I' },
    'nestjs': { title: 'NestJS Crash Course', videoId: '0M8AYU_hPas' },
    'nest.js': { title: 'NestJS Crash Course', videoId: '0M8AYU_hPas' },
    // Databases
    'postgresql': { title: 'PostgreSQL Full Course', videoId: 'qw--VYLpxG4' },
    'mongodb': { title: 'MongoDB Full Course', videoId: '-bt_y4Loofg' },
    'mysql': { title: 'MySQL Full Course', videoId: 'HXV3zeQKqGY' },
    'redis': { title: 'Redis Full Course', videoId: 'XCsS_NVAa1g' },
    // DevOps
    'docker': { title: 'Docker Full Course', videoId: 'pg19Z8LL06w' },
    'kubernetes': { title: 'Kubernetes Full Course', videoId: 'X48VuDVv0do' },
    'aws': { title: 'AWS Full Course', videoId: 'k1RI5locZE4' },
    'git': { title: 'Git & GitHub Full Course', videoId: 'RGOj5yH7evk' },
    'linux': { title: 'Linux Full Course', videoId: 'wBp0Rb-ZJak' },
    'ci/cd': { title: 'CI/CD Full Course', videoId: 'scEDHsr3APg' },
    // AI & Data
    'machine learning': { title: 'Machine Learning Full Course', videoId: 'NWONeJKn9Kc' },
    'deep learning': { title: 'Deep Learning Full Course', videoId: 'VyWAvY2CF9c' },
    'tensorflow': { title: 'TensorFlow Full Course', videoId: 'tPYj3fFJGjk' },
    'pytorch': { title: 'PyTorch Full Course', videoId: 'V_xro1bcAuA' },
    'nlp': { title: 'NLP Full Course', videoId: 'U9t-slLl30E' },
    'pandas': { title: 'Pandas Full Course', videoId: 'gtjxAH8uaP0' },
    'numpy': { title: 'NumPy Full Course', videoId: 'QUT1VHiLmmI' },
  };

  const [activeVideoPhase, setActiveVideoPhase] = useState<string | null>(null);
  const [videoCompleted, setVideoCompleted] = useState<{ [key: string]: boolean }>({});

  const handleVideoComplete = useCallback(async (skill: string) => {
    setVideoCompleted(prev => ({ ...prev, [skill]: true }));
    setActiveVideoPhase(null);
    await handleSkillComplete(skill);
  }, [selectedRole]);

  useEffect(() => {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
  }, []);

  const toggleAnswer = (idx: number) => {
    setShowAnswers(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleGenerateRecommendations = async () => {
    setIsLoadingRecs(true);
    try {
      const res = await fetch('http://localhost:3001/api/recommendations/generate', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.recommendations) {
        setRecommendations(data.recommendations);
      }
    } catch (err) {
      console.error('Failed to generate recommendations:', err);
    } finally {
      setIsLoadingRecs(false);
    }
  };

  const handleGenerateQuestions = async () => {
    setIsGeneratingQuestions(true);
    try {
      const res = await fetch('http://localhost:3001/api/questions/generate', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.questions) {
        setInterviewQuestions(data.questions);
      }
    } catch (err) {
      console.error('Failed to generate questions:', err);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    setIsGeneratingCoverLetter(true);
    try {
      const res = await fetch('http://localhost:3001/api/cover-letter/generate', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.coverLetter) {
        setCoverLetter(data.coverLetter);

        // Save to backend
        await fetch('http://localhost:3001/api/cv/preferences', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            selectedRole,
            coverLetter: data.coverLetter,
          }),
        });
      }
    } catch (err) {
      console.error('Failed to generate cover letter:', err);
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  };

  // --- LOAD SAVED SKILLS ON PAGE LOAD ---
  useEffect(() => {
    if (status !== 'authenticated') return;

    const loadData = async () => {
      try {
        // Load skills
        const skillsRes = await fetch('http://localhost:3001/api/cv/skills', {
          credentials: 'include',
        });
        const skillsData = await skillsRes.json();

        if (skillsData.skills && skillsData.skills.length > 0) {
          const loadedSkills = skillsData.skills.map((s: any) => ({
            name: s.name,
            level: 'strong' as const,
          }));
          setSkills(loadedSkills);
          setMatchScore(Math.min(60 + loadedSkills.length * 3, 98));
          setUploadState('complete');
        }

        // Load AI analysis
        const analysisRes = await fetch('http://localhost:3001/api/cv/analysis', {
          credentials: 'include',
        });
        const analysisData = await analysisRes.json();

        if (analysisData.aiAnalysis) {
          setAiAnalysis(analysisData.aiAnalysis);
        }
        if (analysisData.roleSuggestions) {
          setRoleSuggestions(analysisData.roleSuggestions);
          if (analysisData.roleSuggestions?.suggestions) {
            setTargetRoles(analysisData.roleSuggestions.suggestions.map((r: any) => r.role));
          }
        }

        // Load saved preferences and restore role + missing skills
        const prefsRes = await fetch('http://localhost:3001/api/cv/preferences', {
          credentials: 'include',
        });
        const prefsData = await prefsRes.json();

        if (prefsData.preferences?.selected_role) {
          const savedRole = prefsData.preferences.selected_role;
          setSelectedRole(savedRole);

          if (prefsData.preferences?.original_missing_skills) {
            setOriginalMissingSkills(prefsData.preferences.original_missing_skills);
          }

          if (prefsData.preferences?.cover_letter) {
            setCoverLetter(prefsData.preferences.cover_letter);
          }

          const semanticRes = await fetch('http://localhost:3001/api/embeddings/semantic-match', {
            method: 'POST',
            credentials: 'include',
          });
          const semanticData = await semanticRes.json();
          if (semanticData.semantic_score) {
            setSemanticScore(semanticData.semantic_score);
          }

          const matchRes = await fetch('http://localhost:3001/api/jobs/match', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: savedRole }),
          });
          const matchData = await matchRes.json();

          if (matchData.missingSkills) {
            setMissingSkills(matchData.missingSkills);
            setOriginalMissingSkills(matchData.missingSkills);
            const redSkills = matchData.missingSkills.map((s: string) => ({
              name: s,
              level: 'weak' as const,
            }));
            setSkills(prev => {
              const blueOnly = prev.filter(s => s.level === 'strong');
              return [...blueOnly, ...redSkills];
            });
            if (matchData.matchScore !== undefined) {
              setMatchScore(Math.round(matchData.matchScore));
            }
          }
        }

      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };
    loadData();
  }, [status]);

  // --- STATE: TARGET ROLES ---
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [editingRoles, setEditingRoles] = useState(false);
  const [newRoleInput, setNewRoleInput] = useState('');

  // --- STATE: AI INTERVIEW CHAT SIMULATOR ---
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleRoleSelect = async (role: string, preserveOriginal = false) => {
    setSelectedRole(role);
    try {

      const res = await fetch('http://localhost:3001/api/jobs/match', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();

      await fetch('http://localhost:3001/api/cv/preferences', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedRole: role,
          originalMissingSkills: preserveOriginal ? undefined : data.missingSkills
        }),
      });

      if (data.missingSkills) {
        setMissingSkills(data.missingSkills);
        if (!preserveOriginal) {
          setOriginalMissingSkills(data.missingSkills);
        }
        const redSkills = data.missingSkills.map((s: string) => ({
          name: s,
          level: 'weak' as const,
        }));
        setSkills(prev => {
          const blueOnly = prev.filter(s => s.level === 'strong');
          return [...blueOnly, ...redSkills];
        });
      }

      if (data.matchScore !== undefined && data.matchScore !== null) {
        setMatchScore(Math.round(data.matchScore));
      }

    } catch (err) {
      console.error('Failed to fetch missing skills:', err);
    }
  };

  //when user clicks "Done" on a roadmap
  const handleSkillComplete = async (skill: string) => {
    if (!selectedRole) return;
    try {
      await fetch('http://localhost:3001/api/cv/skills/complete', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill, role: selectedRole }),
      });

      // Move from red to blue in Aura Center
      setSkills(prev => prev.map(s =>
        s.name.toLowerCase() === skill.toLowerCase()
          ? { ...s, level: 'strong' as const }
          : s
      ));

      // Remove from missing skills
      setMissingSkills(prev => prev.filter(s => s.toLowerCase() !== skill.toLowerCase()));

      // Re-run job match to update percentage
      await handleRoleSelect(selectedRole, true);

      // Re-fetch AI analysis to update metrics
      const analysisRes = await fetch('http://localhost:3001/api/cv/analysis', {
        credentials: 'include',
      });
      const analysisData = await analysisRes.json();
      if (analysisData.aiAnalysis) setAiAnalysis(analysisData.aiAnalysis);

    } catch (err) {
      console.error('Failed to complete skill:', err);
    }
  };
  // --- CV SCAN SIMULATION ---
  const handleFileSimulate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setFileName(file.name);
    setUploadState('uploading');
    setScanProgress(0);
    setTerminalLogs([`[INFO] Reading file: ${file.name}`]);

    const formData = new FormData();
    formData.append('file', file);

    try {
      setScanProgress(50);
      setUploadState('extracting');
      setTerminalLogs(prev => [...prev, '[OK] File uploaded successfully.', '[AI] Reading your text and finding skills...']);

      const res = await fetch('http://localhost:3001/api/cv/upload', {
        method: 'POST',
        credentials: 'include', // sends the NextAuth cookie
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setTerminalLogs(prev => [...prev, `[ERROR] ${data.message || 'Upload failed'}`]);
        setUploadState('idle');
        return;
      }

      setUploadState('building');
      setTerminalLogs(prev => [...prev, '[OK] Skills extracted.', '[AI] Syncing parameters into the Aura Center...']);
      if (data.aiAnalysis) setAiAnalysis(data.aiAnalysis);
      if (data.roleSuggestions) {
        setRoleSuggestions(data.roleSuggestions);
        if (data.roleSuggestions?.suggestions) {
          setTargetRoles(data.roleSuggestions.suggestions.map((r: any) => r.role));
        }
      }
      setTimeout(() => {
        setUploadState('matching');
        setTerminalLogs(prev => [...prev, '[OK] Aura Profile updated.', '[AI] Scanning online market for matching job options...']);

        setTimeout(() => {
          setUploadState('complete');
          setTerminalLogs(prev => [...prev, `[SUCCESS] Found ${data.skillsFound} skills!`]);
          setScanProgress(100);

          // Update skills state with real extracted skills
          const newSkills = data.skills.map((s: string) => ({
            name: s,
            level: 'strong' as const,
          }));
          setSkills(newSkills);
          setMatchScore(Math.min(60 + data.skillsFound * 3, 98));
        }, 1000);
      }, 1000);

    } catch (err) {
      setTerminalLogs(prev => [...prev, '[ERROR] Could not reach backend server.']);
      setUploadState('idle');
    }
  };

  // --- ADD SKILLS ---
  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim()) return;

    try {
      // Save to backend
      const res = await fetch('http://localhost:3001/api/cv/skills/add', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill: newSkill.trim().toLowerCase() }),
      });

      if (!res.ok) return;

      // Add to local state as blue node
      setSkills(prev => [...prev, { name: newSkill.trim(), level: 'strong' as const }]);
      setNewSkill('');

      // Re-fetch AI analysis with updated skills
      const analysisRes = await fetch('http://localhost:3001/api/cv/analysis', {
        credentials: 'include',
      });
      const analysisData = await analysisRes.json();

      if (analysisData.aiAnalysis) setAiAnalysis(analysisData.aiAnalysis);
      if (analysisData.roleSuggestions) {
        setRoleSuggestions(analysisData.roleSuggestions);
        if (analysisData.roleSuggestions?.suggestions) {
          setTargetRoles(analysisData.roleSuggestions.suggestions.map((r: any) => r.role));
        }
      }

      // Re-run job match if a role is selected
      if (selectedRole) {
        await handleRoleSelect(selectedRole);
      }

    } catch (err) {
      console.error('Failed to add skill:', err);
    }
  };

  // --- ADD / REMOVE TARGET ROLES ---
  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleInput.trim()) return;
    setTargetRoles([...targetRoles, newRoleInput.trim()]);
    setNewRoleInput('');
  };

  const handleRemoveRole = (idx: number) => {
    setTargetRoles(targetRoles.filter((_, i) => i !== idx));
  };

  // --- CHAT AI STREAMING TYPEWRITER EFFECT ---
  const startInterview = async () => {
    setInterviewStarted(true);
    setIsAiThinking(true);
    setChatMessages([]);

    try {
      const res = await fetch('http://localhost:3001/api/interviews/chat', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [] }),
      });
      const data = await res.json();
      setChatMessages([{ sender: 'ai', text: data.reply }]);
    } catch (err) {
      setChatMessages([{ sender: 'ai', text: 'Interview service unavailable. Please try again.' }]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isAiThinking || interviewComplete) return;

    const userMsg = userInput.trim();
    const newMessages = [...chatMessages, { sender: 'user' as const, text: userMsg }];
    setChatMessages(newMessages);
    setUserInput('');
    setIsAiThinking(true);

    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    try {
      // Convert to API format
      const apiMessages = newMessages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'ai',
        content: m.text,
      }));

      const res = await fetch('http://localhost:3001/api/interviews/chat', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });
      const data = await res.json();

      setChatMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);

      if (data.is_complete) {
        setInterviewComplete(true);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { sender: 'ai', text: 'Connection error. Please try again.' }]);
    } finally {
      setIsAiThinking(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
    // Close mobile sidebar after navigation
    setMobileSidebarOpen(false);
  };

  // Sidebar nav links shared between desktop and mobile
  const navLinks = [
    { label: '1. CV Upload & Scan', target: 'cv-upload' },
    { label: '2. The Aura Center', target: 'aura-center' },
    { label: '3. Predictive Job Match', target: 'job-match' },
    { label: '4. Career Recommendations', target: 'recommendations' },
    { label: '5. Growth Roadmap', target: 'roadmap' },
    { label: '6. Cover Letter', target: 'cover-letter' },
    { label: '7. Interview Questions', target: 'questions' },
    { label: '8. AI Interview Simulator', target: 'simulation-lab' },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans flex overflow-hidden selection:bg-blue-500/30">

      {/* ==========================================
          MOBILE TOP BAR (visible only on mobile)
         ========================================== */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-[60] flex items-center justify-between px-4 py-3 bg-black/90 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_12px_#3b82f6]" />
          <h1 className="text-lg font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-500 uppercase">Skillora</h1>
        </div>
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => setMobileSidebarOpen(true)}
          className="p-2 rounded-xl border border-white/10 bg-white/[0.04] text-gray-300 hover:text-blue-400 hover:border-blue-500/40 transition-all active:bg-blue-600/20"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </motion.button>
      </div>
      {/* ==========================================
          MOBILE SIDEBAR DRAWER (slide-in overlay)
         ========================================== */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="md:hidden fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm"
            />

            {/* Drawer panel */}
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="md:hidden fixed left-0 top-0 bottom-0 z-[80] w-72 bg-black/95 border-r border-white/10 backdrop-blur-2xl flex flex-col justify-between p-6"
            >
              <div className="flex flex-col min-h-0 flex-1 space-y-4">
                {/* Drawer header */}
                <div className="flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_12px_#3b82f6]" />
                    <h1 className="text-lg font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-500 uppercase">Skillora</h1>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => setMobileSidebarOpen(false)}
                    className="p-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white transition-all"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* Profile card */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-blue-500/20 shrink-0">
                  <div className="text-[9px] text-gray-500 uppercase tracking-widest font-mono">Profile Status</div>
                  <div className="text-sm font-bold text-blue-400 mt-0.5">
                    {session?.user?.name || 'User'}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[10px] text-gray-400 font-mono">Twin Synced 100%</span>
                  </div>
                </div>

                {/* Scrollable nav */}
                <nav className="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0">
                  {navLinks.map((link, i) => (
                    <motion.button
                      key={link.target}
                      initial={{ opacity: 0, x: -18 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => scrollToSection(link.target)}
                      className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-blue-400 hover:bg-blue-600/10 rounded-lg border border-transparent hover:border-blue-500/20 transition-all"
                    >
                      {link.label}
                    </motion.button>
                  ))}
                </nav>
              </div>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full py-2 mt-4 border border-red-500/30 hover:bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-widest rounded-xl transition-all shrink-0"
              >
                Logout
              </motion.button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ==========================================
          1. FIXED SIDEBAR — DESKTOP ONLY
         ========================================== */}
      <aside className="hidden md:flex w-80 h-screen border-r border-white/10 bg-black/60 backdrop-blur-xl p-6 flex-col justify-between fixed left-0 top-0 z-50">
        <div className="flex flex-col h-full min-h-0 space-y-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse shadow-[0_0_15px_#3b82f6]" />
            <h1 className="text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-500 uppercase">Skillora</h1>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-blue-500/20 shrink-0">
            <div className="text-[9px] text-gray-500 uppercase tracking-widest font-mono">Profile Status</div>
            <div className="text-sm font-bold text-blue-400 mt-0.5">
              {session?.user?.name || 'User'}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[10px] text-gray-400 font-mono">Twin Synced 100%</span>
            </div>
          </div>

          {/* Scrollable nav */}
          <nav className="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0 pr-1">
            {navLinks.map((link) => (
              <motion.button
                key={link.target}
                whileHover={{ x: 4, backgroundColor: 'rgba(37,99,235,0.08)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => scrollToSection(link.target)}
                className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-blue-400 hover:bg-blue-600/10 rounded-lg border border-transparent hover:border-blue-500/20 transition-all shrink-0"
              >
                {link.label}
              </motion.button>
            ))}
          </nav>
        </div>

        {/* Logout always visible at bottom */}
        <motion.button
          whileHover={{ backgroundColor: 'rgba(239,68,68,0.10)' }}
          whileTap={{ scale: 0.97 }}
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full py-2 mt-4 border border-red-500/30 hover:bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-widest rounded-xl transition-all shrink-0"
        >
          Logout
        </motion.button>
      </aside>

      {/* ==========================================
          2. SCROLLABLE INTERACTIVE STREAM PLATFORM
         ========================================== */}
      <main className="flex-1 min-h-screen md:ml-80 overflow-y-auto bg-gradient-to-b from-black via-blue-950/10 to-black pt-14 md:pt-0">

        {/* --- SECTION 1: ANIMATED CV SCAN --- */}
        <section id="cv-upload" className="min-h-screen flex flex-col justify-center px-4 md:px-12 border-b border-white/5 relative">
          <div className="max-w-4xl grid lg:grid-cols-5 gap-8 items-center">

            <motion.div
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2"
            >
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-3">Upload Your CV</h2>
              <p className="text-gray-400 text-xs leading-relaxed mb-6">
                Drop your resume file below. Our smart systems will instantly read through it, gather your software skills, and automatically build your custom workspace profile.
              </p>

              {/* Step Tracking Pipeline Graphic */}
              <div className="space-y-3 font-mono text-[11px]">
                {[
                  { state: 'uploading', color: 'text-blue-400', dot: 'bg-blue-400', label: '1. READING YOUR RESUME' },
                  { state: 'extracting', color: 'text-cyan-400', dot: 'bg-cyan-400', label: '2. EXTRACTING TECH SKILLS' },
                  { state: 'building', color: 'text-purple-400', dot: 'bg-purple-400', label: '3. CREATING DIGITAL PROFILE' },
                  { state: 'matching', color: 'text-indigo-400', dot: 'bg-indigo-400', label: '4. COMPUTING JOB MATCHES' },
                ].map((step) => (
                  <motion.div
                    key={step.state}
                    animate={uploadState === step.state ? { x: [0, 3, 0] } : {}}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className={`flex items-center gap-2 ${uploadState === step.state ? `${step.color} font-bold` : 'text-gray-600'}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${uploadState === step.state ? `${step.dot} animate-ping` : 'bg-gray-700'}`} />
                    {step.label}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-3 space-y-4"
            >
              <div className="relative group">
                <input
                  type="file"
                  accept=".pdf,.txt,.docx"
                  onChange={handleFileSimulate}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 disabled:pointer-events-none"
                  disabled={uploadState !== 'idle' && uploadState !== 'complete'}
                />

                <motion.div
                  whileHover={uploadState === 'idle' ? { scale: 1.01, borderColor: 'rgba(59,130,246,0.8)' } : {}}
                  className={`w-full h-64 rounded-2xl border-2 border-dashed transition-all p-6 flex flex-col items-center justify-center relative overflow-hidden ${uploadState === 'idle' ? 'border-blue-600/30 bg-blue-950/5 hover:border-blue-500' :
                    uploadState === 'complete' ? 'border-emerald-500/40 bg-emerald-950/5' : 'border-blue-500/80 bg-blue-950/20'
                    }`}
                >
                  {/* Cyber Hologram Scanner Line Effect */}
                  {uploadState !== 'idle' && uploadState !== 'complete' && (
                    <motion.div
                      className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_12px_#3b82f6] z-10"
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}

                  {uploadState === 'idle' && (
                    <>
                      <motion.div
                        whileHover={{ scale: 1.15, rotate: 5 }}
                        className="w-12 h-12 rounded-full bg-blue-600/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
                      >
                        <Upload className="text-blue-400 w-5 h-5" />
                      </motion.div>
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-300">Click or drag your CV here</p>
                      <p className="text-[10px] text-gray-500 mt-1 font-mono">SUPPORTS PDF, TXT or DOCX</p>
                    </>
                  )}

                  {uploadState !== 'idle' && uploadState !== 'complete' && (
                    <div className="text-center w-full max-w-[240px] z-10">
                      <Cpu className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
                      <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">AI is reading data...</p>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-1">
                        <motion.div className="h-full bg-blue-500" style={{ width: `${scanProgress}%` }} />
                      </div>
                      <span className="font-mono text-[10px] text-gray-400">{scanProgress}% completed</span>
                    </div>
                  )}

                  {uploadState === 'complete' && (
                    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-center">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Analysis Done!</p>
                      <p className="text-[11px] text-gray-400 font-mono mt-1 mb-4">{fileName}</p>
                    </motion.div>
                  )}
                </motion.div>
              </div>

              {/* Simplified Live Log Outputs */}
              <div className="w-full rounded-xl border border-white/5 bg-black/90 p-4 font-mono text-[11px] text-blue-400/80 shadow-2xl h-32 overflow-y-auto">
                <div className="flex items-center gap-2 text-gray-500 border-b border-white/5 pb-1 mb-2">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>AI ANALYSIS PROGRESS</span>
                </div>
                {terminalLogs.length === 0 && <span className="text-gray-600 italic">Waiting for a file payload input to scan...</span>}
                {terminalLogs.map((log, idx) => (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} key={idx} className="leading-tight">
                    {log}
                  </motion.div>
                ))}
              </div>
            </motion.div>

          </div>
        </section>

        {/* SECTION 2: THE AURA CENTER */}
        <section id="aura-center" className="min-h-screen flex flex-col justify-center px-4 md:px-12 border-b border-white/5">
          <div className="max-w-4xl space-y-10">

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
            >
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight font-sans">
                The "Aura" Center - AI Digital Twin
              </h2>
              <p className="text-gray-400 text-sm">
                AI Identity Experience
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 items-stretch">

              {/* DIGITAL TWIN MATRIX */}
              <motion.div
                initial={{ opacity: 0, x: -28 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55 }}
                className="relative p-6 rounded-3xl bg-gradient-to-b from-blue-950/10 to-black border border-white/10 overflow-hidden flex flex-col justify-between min-h-[420px] before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/[0.03] before:to-transparent before:pointer-events-none"
              >
                {/* Ambient Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-500/[0.05] blur-[80px] rounded-full pointer-events-none" />

                {/* Floating Particles */}
                {[...Array(14)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      y: [0, -20, 0],
                      opacity: [0.15, 0.7, 0.15]
                    }}
                    transition={{
                      duration: 3 + i * 0.3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute w-1 h-1 bg-blue-400 rounded-full"
                    style={{
                      left: `${(i * 13) % 100}%`,
                      top: `${(i * 9) % 100}%`
                    }}
                  />
                ))}

                <div className="flex items-center justify-between mb-4 relative z-20">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-blue-400 font-mono">
                    Real-Time Digital Twin
                  </h3>

                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </div>
                </div>

                {/* CORE */}
                <div className="flex-1 relative flex items-center justify-center select-none min-h-[260px]">

                  {/* Rotating Rings */}
                  <div className="absolute w-40 h-40 rounded-full border border-blue-500/10 animate-[spin_18s_linear_infinite]" />

                  <div className="absolute w-56 h-56 rounded-full border border-dashed border-blue-400/10 animate-[spin_30s_linear_infinite_reverse]" />

                  <div className="absolute w-72 h-72 rounded-full border border-white/[0.03] animate-pulse" />

                  {/* Connection Lines */}
                  <svg className="absolute w-full h-full inset-0 z-10 pointer-events-none">
                    {skills.map((_, idx) => {
                      const angle = (idx / skills.length) * Math.PI * 2;
                      const x = parseFloat((50 + Math.cos(angle) * 32).toFixed(4));
                      const y = parseFloat((50 + Math.sin(angle) * 32).toFixed(4));

                      return (
                        <line
                          key={idx}
                          x1="50%"
                          y1="50%"
                          x2={`${x}%`}
                          y2={`${y}%`}
                          stroke="rgba(59,130,246,0.15)"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                        />
                      );
                    })}
                  </svg>

                  {/* CENTER CORE */}
                  <motion.div
                    animate={{
                      scale: [1, 1.08, 1],
                      boxShadow: [
                        "0 0 20px rgba(59,130,246,0.3)",
                        "0 0 50px rgba(59,130,246,0.7)",
                        "0 0 20px rgba(59,130,246,0.3)"
                      ]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 3,
                      ease: "easeInOut"
                    }}
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-900 border-2 border-blue-400 flex items-center justify-center z-30"
                  >
                    <Sparkles className="w-5 h-5 text-white animate-pulse" />
                  </motion.div>

                  {/* DYNAMIC SKILL NODES */}
                  {skills.map((skill, idx) => {
                    const angle = (idx / skills.length) * Math.PI * 2;
                    const radius = 35;

                    const x = parseFloat((50 + Math.cos(angle) * radius).toFixed(4));
                    const y = parseFloat((50 + Math.sin(angle) * radius).toFixed(4));

                    const strong = skill.level === 'strong';

                    return (
                      <motion.div
                        key={skill.name}
                        animate={
                          strong
                            ? { y: [0, -5, 0] }
                            : { scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }
                        }
                        whileHover={{ scale: 1.18, zIndex: 50 }}
                        transition={{
                          repeat: Infinity,
                          duration: 3 + idx * 0.4,
                          ease: "easeInOut"
                        }}
                        className={`absolute z-20 px-3 py-2 rounded-xl text-[10px] font-mono font-bold tracking-wide shadow-2xl backdrop-blur-md border -translate-x-1/2 -translate-y-1/2 whitespace-nowrap cursor-pointer ${strong
                          ? 'bg-blue-950/80 border-blue-400 text-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.4)]'
                          : 'bg-red-950/70 border-red-500/40 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                          }`}
                        style={{
                          left: `${x}%`,
                          top: `${y}%`
                        }}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full inline-block mr-1.5 ${strong
                            ? 'bg-cyan-400 animate-pulse'
                            : 'bg-red-500 animate-ping'
                            }`}
                        />
                        {skill.name}
                      </motion.div>
                    );
                  })}
                </div>

                {/* METRICS */}
                <div className="grid grid-cols-3 gap-2 mt-6 relative z-20">
                  {[
                    { label: 'AI Confidence', value: `${aiAnalysis?.profile_metrics?.ai_confidence ?? 0}%` },
                    { label: 'Market Sync', value: `${aiAnalysis?.profile_metrics?.market_sync ?? 0}%` },
                    { label: 'Profile Stability', value: `${aiAnalysis?.profile_metrics?.profile_stability ?? 0}%` }
                  ].map((metric) => (
                    <motion.div
                      key={metric.label}
                      whileHover={{ scale: 1.05, borderColor: 'rgba(59,130,246,0.3)' }}
                      className="bg-white/[0.03] border border-white/5 rounded-xl p-3 text-center transition-all"
                    >
                      <div className="text-sm font-black text-blue-400 font-mono">
                        {metric.value}
                      </div>
                      <div className="text-[9px] uppercase tracking-widest text-gray-500 mt-1 font-mono">
                        {metric.label}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* LEGEND */}
                <div className="text-center text-[10px] font-mono text-gray-500 tracking-wider mt-4">
                  <span className="text-blue-400 font-bold">
                    Blue Nodes = Verified Skills
                  </span>
                  {" "} | {" "}
                  <span className="text-red-400 font-bold">
                    Red Nodes = Missing Skills
                  </span>
                </div>
              </motion.div>

              {/* PROFICIENCY DISPLAY PANEL */}
              <motion.div
                initial={{ opacity: 0, x: 28 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: 0.08 }}
                className="relative p-6 rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col justify-between overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/[0.03] before:to-transparent before:pointer-events-none"
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400 font-sans">
                      Aura Core Skill Status
                    </h3>

                    <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      ACTIVE
                    </div>
                  </div>

                  <div className="space-y-5">
                    {(aiAnalysis?.category_scores?.slice(0, 3) ?? [
                      { category: 'AI & Machine Learning', score: 0 },
                      { category: 'Full Stack Development', score: 0 },
                      { category: 'Database Management', score: 0 }
                    ]).map((item: any, index: number) => (
                      <div key={item.category}>
                        <div className="flex justify-between text-xs font-mono mb-1">
                          <span className="text-gray-300">{item.category}</span>
                          <motion.span
                            key={item.score}
                            initial={{ opacity: 0.5 }}
                            animate={{ opacity: 1 }}
                            className="text-blue-400"
                          >
                            {Math.round(item.score)}%
                          </motion.span>
                        </div>
                        <div className="w-full h-2 bg-white/[0.03] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${item.score}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.2, delay: index * 0.2 }}
                            className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                          />
                        </div>
                      </div>
                    ))}

                  </div>
                </div>
              </motion.div>
            </div>

            {/* TARGET ROLES MANAGEMENT */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
              className="relative p-6 rounded-3xl bg-white/[0.01] border border-white/5 overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/[0.02] before:to-transparent before:pointer-events-none"
            >
              <div className="relative z-10 flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <Target className="w-5 h-5 text-blue-400" />

                  <div>
                    <h3 className="text-base font-bold uppercase tracking-wide font-sans">
                      Your Aimed Target Roles
                    </h3>

                    <p className="text-gray-500 text-xs font-sans">
                      Define the career tracks the AI engine scans matches against.
                    </p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setEditingRoles(!editingRoles)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] hover:bg-blue-600/20 text-gray-300 hover:text-blue-400 border border-white/10 hover:border-blue-500/30 text-xs rounded-xl transition-all"
                >
                  <Edit2 className="w-3 h-3" />
                  {editingRoles ? 'Done Editing' : 'Modify Roles'}
                </motion.button>
              </div>

              {editingRoles && (
                <motion.form
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={handleAddRole}
                  className="flex gap-2 mb-4 relative z-10"
                >
                  <input
                    type="text"
                    placeholder="Enter career title..."
                    value={newRoleInput}
                    onChange={(e) => setNewRoleInput(e.target.value)}
                    className="flex-1 px-3 py-2 bg-black border border-white/10 rounded-xl outline-none focus:border-blue-500 text-xs text-white"
                  />

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all font-bold text-xs uppercase tracking-wider flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </motion.button>
                </motion.form>
              )}

              <div className="relative z-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {targetRoles.map((role, rIdx) => (
                  <motion.div
                    key={rIdx}
                    onClick={() => handleRoleSelect(role)}
                    whileHover={{ scale: 1.02, borderColor: 'rgba(59,130,246,0.25)' }}
                    className={`flex items-center justify-between p-3 bg-white/[0.02] border rounded-xl hover:border-blue-500/20 transition-all group cursor-pointer ${selectedRole === role
                      ? 'border-blue-500/50 bg-blue-500/10'
                      : 'border-white/5'
                      }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Briefcase className="w-4 h-4 text-gray-500 group-hover:text-blue-400 shrink-0 transition-colors" />
                      <span className="text-xs text-gray-200 font-sans font-medium truncate">
                        {role}
                      </span>
                    </div>
                    {selectedRole === role && (
                      <span className="text-[9px] text-blue-400 font-bold uppercase tracking-widest shrink-0">
                        Selected
                      </span>
                    )}
                    {editingRoles && (
                      <motion.button
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); handleRemoveRole(rIdx); }}
                        className="text-gray-500 hover:text-red-400 p-1 rounded-md transition-colors shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </motion.button>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* SECTION 3: REAL-TIME MATCH SCORE PREDICTOR */}
        <section id="job-match" className="min-h-screen flex flex-col justify-center px-4 md:px-12 border-b border-white/5">
          <div className="max-w-4xl grid md:grid-cols-5 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -28 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
              className="md:col-span-2 space-y-4"
            >
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">Job Match Analytics</h2>
              <p className="text-gray-400 text-xs leading-relaxed">
                Personalize your identity profile with custom details and let the system generate live AI-powered insights and prediction results automatically.
              </p>
              <form onSubmit={handleAddSkill} className="flex gap-2">
                <input type="text" placeholder="Add skill (e.g. AWS)..." value={newSkill} onChange={(e) => setNewSkill(e.target.value)} className="flex-1 px-3 py-2 bg-white/[0.03] border border-white/10 rounded-xl outline-none focus:border-blue-500 font-mono text-xs text-white" />
                <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} type="submit" className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl">
                  <Plus className="w-4 h-4" />
                </motion.button>
              </form>
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                {skills.map((skill, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.06 }}
                    className={`px-2.5 py-1 border text-[10px] font-mono rounded-md uppercase tracking-wider ${skill.level === 'strong'
                      ? 'bg-blue-950/40 border-blue-500/20 text-blue-300'
                      : 'bg-red-950/40 border-red-500/20 text-red-300'
                      }`}
                  >
                    {skill.name}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 28 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="md:col-span-3 flex flex-col items-center justify-center p-8 bg-white/[0.01] border border-white/5 rounded-3xl relative"
            >
              <div className="relative w-44 h-44 flex items-center justify-center mb-4">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.02)" strokeWidth="6" fill="transparent" />
                  <motion.circle cx="50" cy="50" r="40" stroke="#2563eb" strokeWidth="6" fill="transparent" strokeDasharray="251.2" animate={{ strokeDashoffset: 251.2 - (251.2 * matchScore) / 100 }} transition={{ type: "spring", stiffness: 40 }} strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
                </svg>
                <div className="absolute flex flex-col items-center font-mono">
                  <motion.span
                    key={matchScore}
                    initial={{ scale: 1.3, color: '#60a5fa' }}
                    animate={{ scale: 1, color: '#ffffff' }}
                    transition={{ duration: 0.5 }}
                    className="text-4xl font-black text-white"
                  >
                    {matchScore}%
                  </motion.span>
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest mt-0.5">Match Score</span>
                </div>
              </div>

              {/* Semantic score OUTSIDE the circle */}
              {semanticScore !== null && (
                <div className="mt-2 text-center border-t border-white/5 pt-4 w-full">
                  <div className="text-[9px] text-gray-500 font-mono uppercase tracking-widest mb-1">
                    Semantic Match (AI Embeddings)
                  </div>
                  <div className="text-2xl font-black text-cyan-400 font-mono">
                    {Math.round(semanticScore)}%
                  </div>
                  <div className="text-[9px] text-gray-600 font-mono mt-1">
                    Powered by Hugging Face Embeddings
                  </div>
                </div>
              )}

              <h4 className="text-xs font-mono text-gray-500 uppercase tracking-wider text-center mt-3">
                Target Node Alignment Accuracy Match
              </h4>
            </motion.div>
          </div>
        </section>


        {/* SECTION 4: CAREER RECOMMENDATIONS */}
        <section id="recommendations" className="min-h-screen flex flex-col justify-center px-4 md:px-12 border-b border-white/5">
          <div className="max-w-4xl space-y-8 w-full">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
            >
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-3">
                Career Recommendations
              </h2>
              <p className="text-gray-400 text-xs">
                Personalized career guidance based on your skills, target role, and match score.
              </p>
            </motion.div>

            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: '0 0 20px rgba(37,99,235,0.5)' }}
                whileTap={{ scale: 0.96 }}
                onClick={handleGenerateRecommendations}
                disabled={isLoadingRecs}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all"
              >
                {isLoadingRecs ? 'Analyzing...' : '✦ Get Recommendations'}
              </motion.button>
            </div>

            {recommendations.length > 0 && (
              <div className="grid gap-4">
                {recommendations.map((rec, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-blue-500/20 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-sm font-bold text-white leading-tight">{rec.title}</h3>
                      <span className={`shrink-0 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${rec.priority === 'High' ? 'bg-red-500/20 text-red-400' :
                        rec.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-emerald-500/20 text-emerald-400'
                        }`}>
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{rec.description}</p>
                    <div className="mt-2">
                      <span className="text-[9px] uppercase tracking-widest text-blue-400/60 font-mono">
                        {rec.type.replace('_', ' ')}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* SECTION 5: ROADMAP */}
        <section id="roadmap" className="min-h-screen flex flex-col justify-center px-4 md:px-12 border-b border-white/5">
          <div className="max-w-3xl space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
            >
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-3">
                Interactive Growth Roadmap
              </h2>
              <p className="text-gray-400 text-xs">
                {selectedRole
                  ? `Skills to master for ${selectedRole}. Watch each course to unlock the next phase.`
                  : 'Select a target role above to generate your personalized roadmap.'}
              </p>
            </motion.div>

            {!selectedRole ? (
              <div className="text-center py-16 text-gray-600 font-mono text-sm">
                ← Select a target role from the Aura Center to see your roadmap
              </div>
            ) : missingSkills.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                <p className="text-emerald-400 font-bold uppercase tracking-widest text-sm">
                  All core skills mastered for {selectedRole}!
                </p>
              </motion.div>
            ) : (
              <div className="relative border-l border-blue-500/20 pl-8 ml-4 space-y-10 font-mono text-xs">
                {missingSkills.map((skill, idx) => {
                  const originalPhase = originalMissingSkills.indexOf(skill) + 1;
                  const isFirst = idx === 0;
                  const video = SKILL_VIDEOS[skill.toLowerCase()];
                  const isWatchingThis = activeVideoPhase === skill;

                  return (
                    <motion.div
                      key={skill}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                      whileHover={isFirst ? { x: 4 } : {}}
                      className="relative"
                    >
                      <div className={`absolute -left-[41px] top-0 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${isFirst
                          ? 'bg-blue-600 border border-blue-400 text-white animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.6)]'
                          : 'bg-zinc-900 border border-white/10 text-gray-500 blur-[0.5px] opacity-40'
                        }`}>
                        {isFirst ? '➔' : '🔒'}
                      </div>

                      <div className={!isFirst ? 'opacity-30 pointer-events-none select-none' : ''}>
                        <h4 className={`text-sm font-bold uppercase tracking-wide mb-1 ${isFirst ? 'text-blue-400' : 'text-gray-400'}`}>
                          Phase {String(originalPhase).padStart(2, '0')}: Learn {skill}
                        </h4>
                        <p className="text-gray-500 text-[11px] mt-1 leading-relaxed mb-3">
                          Master <span className="text-blue-300">{skill}</span> to improve your match for {selectedRole}.
                        </p>

                        {isFirst && (
                          <div className="space-y-3">
                            {video ? (
                              <>
                                {!isWatchingThis ? (
                                  <motion.button
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => setActiveVideoPhase(skill)}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all"
                                  >
                                    ▶ Watch Course — {video.title}
                                  </motion.button>
                                ) : (
                                  <div className="space-y-3">
                                    <YouTubePlayer
                                      videoId={video.videoId}
                                      skill={skill}
                                      onComplete={handleVideoComplete}
                                    />
                                    <p className="text-[10px] text-gray-500 font-mono animate-pulse">
                                      ⏳ Complete the video to automatically unlock the next phase...
                                    </p>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="space-y-3">
                                <p className="text-[10px] text-gray-500">
                                  🔍 Search: <span className="text-blue-400">"{skill} tutorial for beginners" on YouTube</span>
                                </p>
                                <motion.button
                                  whileHover={{ scale: 1.04 }}
                                  whileTap={{ scale: 0.96 }}
                                  onClick={() => handleSkillComplete(skill)}
                                  className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  ✓ Mark as Learned
                                </motion.button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* SECTION 6: COVER LETTER */}
        <section id="cover-letter" className="min-h-screen flex flex-col justify-center px-4 md:px-12 border-b border-white/5">
          <div className="max-w-3xl space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
            >
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-3">
                Cover Letter Generator
              </h2>
              <p className="text-gray-400 text-xs">
                Generate a personalized cover letter based on your CV skills and target role.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-6 rounded-3xl bg-white/[0.02] border border-white/10"
            >
              {!selectedRole ? (
                <p className="text-gray-500 text-sm text-center py-8">
                  Select a target role first to generate your cover letter.
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                      Generating for: <span className="text-blue-400 font-bold">{selectedRole}</span>
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={handleGenerateCoverLetter}
                      disabled={isGeneratingCoverLetter}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all"
                    >
                      {isGeneratingCoverLetter ? 'Generating...' : '✦ Generate Cover Letter'}
                    </motion.button>
                  </div>

                  {coverLetter && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="relative"
                    >
                      <textarea
                        readOnly
                        value={coverLetter}
                        className="w-full h-80 bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-gray-300 font-mono leading-relaxed resize-none outline-none"
                      />
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => navigator.clipboard.writeText(coverLetter)}
                        className="mt-2 px-4 py-1.5 border border-white/10 hover:border-blue-500/50 text-gray-400 hover:text-white text-[10px] font-mono rounded-lg uppercase tracking-wider transition-colors"
                      >
                        Copy to Clipboard
                      </motion.button>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* SECTION 7: INTERVIEW QUESTIONS GENERATOR */}
        <section id="questions" className="min-h-screen flex flex-col justify-center px-4 md:px-12 border-b border-white/5">
          <div className="max-w-4xl space-y-8 w-full">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
            >
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-3">
                Interview Questions Generator
              </h2>
              <p className="text-gray-400 text-xs">
                AI-generated interview questions tailored to your skills and target role. Study these before your interview.
              </p>
            </motion.div>

            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: '0 0 20px rgba(37,99,235,0.5)' }}
                whileTap={{ scale: 0.96 }}
                onClick={handleGenerateQuestions}
                disabled={isGeneratingQuestions}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all"
              >
                {isGeneratingQuestions ? 'Generating...' : '✦ Generate Questions'}
              </motion.button>
              {interviewQuestions.length > 0 && (
                <span className="text-[10px] text-gray-500 font-mono">
                  {interviewQuestions.length} questions for {selectedRole || 'your role'}
                </span>
              )}
            </div>

            {interviewQuestions.length > 0 && (
              <div className="grid gap-3">
                {['Technical', 'Behavioral', 'Problem-solving', 'Role-specific'].map(category => {
                  const categoryQuestions = interviewQuestions.filter(q => q.category === category);
                  if (categoryQuestions.length === 0) return null;

                  // Track global index for toggle
                  let globalIdx = 0;

                  return (
                    <motion.div
                      key={category}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 rounded-2xl bg-white/[0.02] border border-white/10"
                    >
                      <h3 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3">
                        {category}
                      </h3>
                      <div className="space-y-4">
                        {categoryQuestions.map((q, idx) => {
                          const key = `${category}-${idx}`;
                          return (
                            <div key={idx} className="space-y-2">
                              <div className="flex items-start gap-3">
                                <span className={`shrink-0 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest mt-0.5 ${q.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400' :
                                  q.difficulty === 'Hard' ? 'bg-red-500/20 text-red-400' :
                                    'bg-blue-500/20 text-blue-400'
                                  }`}>
                                  {q.difficulty}
                                </span>
                                <div className="flex-1">
                                  <p className="text-sm text-gray-300 leading-relaxed">{q.question}</p>

                                  {/* Toggle sample answer */}
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => toggleAnswer(interviewQuestions.indexOf(q))}
                                    className="mt-2 text-[10px] text-blue-400/70 hover:text-blue-400 font-mono uppercase tracking-widest transition-colors flex items-center gap-1"
                                  >
                                    {showAnswers[interviewQuestions.indexOf(q)] ? '▲ Hide' : '▼ Show'} Sample Answer
                                  </motion.button>

                                  {showAnswers[interviewQuestions.indexOf(q)] && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="mt-2 p-3 rounded-xl bg-blue-950/30 border border-blue-500/20"
                                    >
                                      <div className="text-[9px] text-blue-400 font-bold uppercase tracking-widest mb-1">
                                        💡 Sample Answer Guide
                                      </div>
                                      <p className="text-[11px] text-gray-400 leading-relaxed">
                                        {q.sample_answer}
                                      </p>
                                    </motion.div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* SECTION 8: AI INTERVIEW SIMULATOR */}
        <section id="simulation-lab" className="min-h-screen flex flex-col justify-center px-4 md:px-12 pb-20">
          <div className="max-w-4xl space-y-4 w-full">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
            >
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-2">
                AI Interview Simulator
              </h2>
              <p className="text-gray-400 text-xs">
                Real AI-powered interview tailored to your skills and target role. Answer naturally — the AI responds like a real interviewer.
              </p>
            </motion.div>

            {!interviewStarted ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 gap-6"
              >
                <p className="text-gray-400 text-sm text-center max-w-md">
                  {selectedRole
                    ? `Ready to interview for ${selectedRole}? The AI will ask you relevant technical and behavioral questions.`
                    : 'Select a target role first for a more personalized interview experience.'}
                </p>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(37,99,235,0.7)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startInterview}
                  className="px-8 py-3 bg-blue-600 rounded-full text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all"
                >
                  Start Interview
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full rounded-2xl border border-white/10 bg-black/80 shadow-2xl flex flex-col h-[500px] overflow-hidden backdrop-blur-md"
              >
                {/* Header */}
                <div className="bg-white/[0.02] border-b border-white/5 px-4 py-3 flex items-center justify-between font-mono text-[10px] text-gray-500">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>INTERVIEW SESSION — {selectedRole || 'Software Developer'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {interviewComplete && (
                      <span className="text-emerald-400 font-bold">INTERVIEW COMPLETE</span>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      onClick={() => {
                        setInterviewStarted(false);
                        setInterviewComplete(false);
                        setChatMessages([]);
                      }}
                      className="text-gray-500 hover:text-red-400 transition-colors text-[10px] uppercase tracking-widest"
                    >
                      End Session
                    </motion.button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4 font-mono text-xs">
                  <AnimatePresence initial={false}>
                    {chatMessages.map((msg, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] rounded-xl px-4 py-3 ${msg.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-white/[0.03] border border-white/10 text-emerald-400 rounded-bl-none'
                          }`}>
                          <div className="text-[9px] uppercase tracking-widest mb-1 opacity-50 font-bold">
                            {msg.sender === 'user' ? 'You' : 'Interviewer (Alex)'}
                          </div>
                          <div className="leading-relaxed whitespace-pre-wrap">{msg.text}</div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {isAiThinking && (
                    <div className="flex items-center gap-2 text-gray-500 animate-pulse text-[11px]">
                      <Cpu className="w-3.5 h-3.5 animate-spin text-blue-500" />
                      <span>Alex is typing...</span>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-3 bg-white/[0.01] border-t border-white/5 flex gap-2">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    disabled={isAiThinking || interviewComplete}
                    placeholder={interviewComplete ? 'Interview complete — start a new session' : 'Type your answer here...'}
                    className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none font-mono focus:border-blue-500 transition-colors disabled:opacity-50"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.93 }}
                    type="submit"
                    disabled={isAiThinking || !userInput.trim() || interviewComplete}
                    className="px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-950 disabled:text-gray-500 text-white text-[10px] font-mono font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all shrink-0"
                  >
                    <Send className="w-3 h-3" />
                    Send
                  </motion.button>
                </form>
              </motion.div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
