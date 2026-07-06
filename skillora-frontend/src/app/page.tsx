"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import Image from 'next/image';
import AuthModal from '@/app/components/AuthModal';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// --- ANIMATION VARIANTS ---
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } }
};

export default function SkilloraLanding() {
  // State to control modal visibility and target view ('login' or 'signup')
  const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null);
  const [pageKey, setPageKey] = useState(0);

  // Force reload when user navigates back to this page
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        window.location.reload();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setPageKey(prev => prev + 1);
      }
    };

    const handleFocus = () => {
      setPageKey(prev => prev + 1);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    window.history.scrollRestoration = 'manual';
    window.addEventListener('pageshow', handlePageShow);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  return (
    <div key={pageKey} className="relative min-h-screen bg-black text-white font-sans overflow-x-hidden selection:bg-blue-500/30">
    <div className="relative min-h-screen bg-black text-white font-sans overflow-x-hidden selection:bg-blue-500/30">
      
      {/* --- BACKGROUND & LIGHTS --- */}
      <div className="absolute inset-0 bg-[url('/homebackground.jpeg')] opacity-30 pointer-events-none z-0" />
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1], 
          opacity: [0.2, 0.4, 0.2],
          rotate: [0, 5, 0]
        }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/20 blur-[130px] rounded-full z-0" 
      />

      {/* --- NAVBAR --- */}
      <nav className="relative z-50 flex justify-between items-center px-9 py-2 w-full">
        <motion.div 
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.02 }}
          className="relative w-[350px] h-24 -ml-7"
        > 
          <Image src="/logo.jpeg" alt="Skillora" fill className="object-contain object-left" priority />
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-8 pr-5" 
        >
          {/* Click to open Login */}
          <button 
            onClick={() => setAuthMode('login')}
            className="text-xs font-medium text-gray-400 hover:text-blue-400 transition-colors uppercase tracking-widest"
          >
            Login
          </button>
          
          {/* Click to open Sign Up */}
          <motion.button 
            onClick={() => setAuthMode('signup')}
            whileHover={{ scale: 1.1, boxShadow: "0 0 25px rgba(37,99,235,0.8)" }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-2 bg-blue-600 rounded-full text-xs font-bold shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all uppercase"
          >
            Get Started
          </motion.button>
        </motion.div>
      </nav>

      {/* --- HERO SECTION --- */}
      <motion.section 
        initial="hidden" whileInView="visible" variants={stagger} viewport={{ once: false, amount: 0.2 }}
        className="relative z-10 flex flex-col items-center text-center pt-2 pb-6"
      >
        <motion.h1 variants={fadeInUp} className="text-3xl md:text-4xl font-bold tracking-tight mb-4 uppercase">
          AI-Powered Career Growth Platform
        </motion.h1>
        <motion.p variants={fadeInUp} className="text-gray-400 text-s max-w-l mx-auto leading-relaxed px-6">
          A smarter way to discover jobs, improve your profile, and prepare for interviews with personalized AI insights.
        </motion.p>

        <motion.div 
          variants={fadeInUp}
          animate={{ 
            y: [0, -25, 0],
            rotate: [0, 5, -5, 0] 
          }}
          transition={{ 
            y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 6, repeat: Infinity, ease: "easeInOut" }
          }}
          whileHover={{ scale: 1.05, filter: "brightness(1.1)" }}
          className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px] mt-4 cursor-pointer"
        >
          <Image src="/fakerobot2.png" alt="AI Assistant" fill className="object-contain drop-shadow-[0_0_50px_rgba(37,99,235,0.4)]" />
        </motion.div>
      </motion.section>

      {/* --- GLASS CARDS --- */}
      <motion.section 
        initial="hidden" whileInView="visible" variants={stagger} viewport={{ once: false, amount: 0.2 }}
        className="relative z-10 max-w-5xl mx-auto px-6 py-4 grid md:grid-cols-3 gap-8"
      >
        <GlassCard img="/firstcard.jpeg" title="CV Analysis" desc="Upload your resume and extract your skills automatically." />
        <GlassCard img="/secondcard.jpeg" title="Smart Job Matching" desc="Receive personalized suggestions for career growth." />
        <GlassCard img="/thirdcard.jpeg" title="Grow Smarter" desc="Improve your skills with personalized AI guidance." />
      </motion.section>

      {/* --- WHY JOIN --- */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: false }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold mb-16 text-center"
        >
          Why Start Your Journey With Us?
        </motion.h2>
        <div className="flex flex-col-reverse md:flex-row items-center gap-16">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.3 }}
            variants={stagger}
            className="flex-1 relative border-l-2 border-blue-600/30 pl-10 space-y-12"
          >
            <TimelineStep title="Build Your Digital Twin" text="Create a dynamic AI profile that evolves with your career journey." />
            <TimelineStep title="Improve Your Opportunities" text="Increase your job match percentage with skill recommendations." />
            <TimelineStep title="Practice with Confidence" text="Train using AI-generated interview simulations." />
            <TimelineStep title="Learn What Matters" text="Get personalized roadmaps for your target role." />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50, rotateY: 20 }} 
            whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            whileHover={{ scale: 1.02, rotate: 1 }}
            className="flex-1 relative group"
          >
            <div className="absolute inset-0 bg-blue-500/20 blur-[80px] rounded-full" />
            <Image src="/AIblue.jpeg" alt="Feature" width={550} height={400} className="relative rounded-3xl border border-white/10 shadow-2xl" />
          </motion.div>
        </div>
      </section>

      {/* --- SUCCESS STORIES --- */}
      <section className="relative z-10 py-20 flex flex-col items-center">
        <motion.h2 
          initial={{ opacity: 0, scale: 0.9 }} 
          whileInView={{ opacity: 1, scale: 1 }} 
          viewport={{ once: false }}
          className="text-3xl font-bold mb-16 uppercase tracking-widest text-blue-500"
        >
          Success Stories
        </motion.h2>
        
        <div className="relative w-full max-w-4xl h-[600px] flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <line x1="25%" y1="35%" x2="50%" y2="50%" stroke="#3b82f6" strokeWidth="3" opacity="0.4" />
            <line x1="25%" y1="65%" x2="50%" y2="50%" stroke="#3b82f6" strokeWidth="3" opacity="0.4" />
            <line x1="75%" y1="35%" x2="50%" y2="50%" stroke="#3b82f6" strokeWidth="3" opacity="0.4" />
            <line x1="75%" y1="65%" x2="50%" y2="50%" stroke="#3b82f6" strokeWidth="3" opacity="0.4" />
          </svg>

          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute z-20 w-44 h-44 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-300 p-[2px] shadow-[0_0_60px_rgba(37,99,235,0.6)]"
          >
             <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-xs font-bold tracking-widest">SKILLORA</div>
          </motion.div>

          <div className="absolute left-8 flex flex-col">
            <OrbitCard stars="⭐️⭐️⭐️⭐️⭐️" quote="Very accurate skill analysis." name="Amir B" delay={0} />
            <OrbitCard stars="⭐️⭐️⭐️⭐️⭐️" quote="The roadmap helped me improve faster." name="Luna F" delay={0.5} />
          </div>

          <div className="absolute right-8 flex flex-col">
            <OrbitCard stars="⭐️⭐️⭐️⭐️⭐️" quote="Interview practice felt realistic." name="Lara S" delay={1} />
            <OrbitCard stars="⭐️⭐️⭐️⭐️⭐️" quote="Job matches were relevant." name="Ahmad R" delay={1.5} />
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="relative z-10 py-2 text-center border-t border-white/5 bg-black">
        <div className="max-w-6xl mx-auto px-5 flex flex-col md:flex-row justify-between items-center">
          <div className="w-30 h-40 relative opacity-70">
            <Image src="/logo.jpeg" alt="Skillora" fill className="object-contain" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-gray-500 text-xs tracking-widest uppercase">© 2026 Skillora AI. Empowering Future Careers.</p>
            <p className="text-gray-600 text-[10px] italic">Bridging the gap between talent and opportunity with intelligence.</p>
          </div>
          
          {/* Click to open Sign Up */}
          <motion.button 
            onClick={() => setAuthMode('signup')}
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(37,99,235,0.5)" }}
            whileTap={{ scale: 0.95 }}
            className="mt-4 md:mt-0 px-6 py-2 border border-blue-600/50 hover:bg-blue-600 text-white rounded-full text-[10px] font-bold transition-all uppercase tracking-widest"
          >
            Try the platform
          </motion.button>
        </div>
      </footer>

      {/* --- AUTHENTICATION MODAL ANOMATION OVERLAY --- */}
      <AnimatePresence>
        {authMode && (
          <AuthModal initialMode={authMode} onClose={() => setAuthMode(null)} />
        )}
      </AnimatePresence>
    </div>
    </div>
  );
}

// --- SUB-COMPONENTS (Keep yours exactly as they are) ---
function GlassCard({ img, title, desc }: any) {
  return (
    <motion.div 
      variants={fadeInUp}
      whileHover={{ y: -12, scale: 1.02, borderColor: "rgba(59, 130, 246, 0.6)", backgroundColor: "rgba(255,255,255,0.08)" }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[40px] text-center transition-all cursor-default"
    >
      <motion.div whileHover={{ rotate: 5, scale: 1.1 }} className="relative w-28 h-28 mx-auto mb-6">
        <Image src={img} alt={title} fill className="object-contain" />
      </motion.div>
      <h3 className="text-lg font-bold uppercase tracking-widest mb-3">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function OrbitCard({ stars, quote, name, delay }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: false }}
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay }}
      whileHover={{ scale: 1.05, backgroundColor: "rgba(37, 99, 235, 0.1)", borderColor: "#3b82f6" }}
      className="w-64 p-6 bg-white/[0.03] backdrop-blur-2xl border border-blue-500/20 rounded-2xl shadow-xl m-0 transition-colors"
    >
      <div className="text-yellow-500 text-xs mb-2">{stars}</div>
      <p className="text-[12px] text-white/90 italic mb-4 leading-relaxed">"{quote}"</p>
      <div className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">— {name}</div>
    </motion.div>
  );
}

function TimelineStep({ title, text }: any) {
  return (
    <motion.div 
      variants={fadeInUp} 
      whileHover={{ x: 10 }} 
      className="relative cursor-pointer group"
    >
      <motion.div 
        animate={{ scale: [1, 1.2, 1] }} 
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute -left-[45px] top-1.5 w-4 h-4 bg-blue-600 rounded-full shadow-[0_0_15px_#3b82f6]" 
      />
      <h4 className="text-lg font-bold mb-1 group-hover:text-blue-400 transition-colors">{title}</h4>
      <p className="text-sm text-gray-400">{text}</p>
    </motion.div>
  );
}