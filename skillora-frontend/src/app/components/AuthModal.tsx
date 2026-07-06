"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

interface AuthModalProps {
  initialMode: 'login' | 'signup';
  onClose: () => void;
}

export default function AuthModal({ initialMode, onClose }: AuthModalProps) {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  
  // States
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Clear fields and errors when switching modes
  const resetForm = (signUpMode: boolean) => {
    setIsSignUp(signUpMode);
    setUsername('');
    setEmail('');
    setPassword('');
    setError('');
  };

  useEffect(() => {
    resetForm(initialMode === 'signup');
  }, [initialMode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = await signIn('credentials', {
      email: username, // Your identifier (can be email or username depending on your NextAuth backend configuration)
      password,
      redirect: false,
    });

    if (result?.error) {
      // Direct matching based on what your NextAuth backend throws
      const err = result.error.toLowerCase();
      
      if (err.includes('password')) {
        setError('Incorrect password. Please try again.');
      } else if (err.includes('user') || err.includes('exist') || err.includes('found')) {
        setError('No username or email found with these credentials.');
      } else {
        setError('Invalid credentials. Please verify your details.');
      }
    } else if (result?.ok) {
      onClose(); 
      window.location.href = '/dashboard';
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !email.trim() || !password.trim()) {
      setError('All fields are required.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter.');
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter.');
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number.');
      return;
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      setError('Password must contain at least one special character.');
      return;
    }

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: username, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      // If server responds with "User already exists", it displays here
      setError(data.error || 'Something went wrong during registration.');
    } else {
      // Auto-login after successful registration
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        setError('Registered successfully, but auto-login failed. Please log in manually.');
        resetForm(false);
      } else {
        onClose();
        window.location.href = '/dashboard';
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative w-full max-w-[750px] h-[450px] bg-black/40 backdrop-blur-2xl border-2 border-blue-600/50 rounded-3xl shadow-[0_0_25px_rgba(37,99,235,0.4)] overflow-hidden z-10 flex text-white"
      >
        <button onClick={onClose} className="absolute top-4 right-5 text-gray-400 hover:text-white transition-colors text-xl z-[60]">✕</button>

        {/* --- MOVING BANNER --- */}
        <motion.div 
          className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-br from-blue-950/90 to-black border-r border-l border-white/10 p-10 flex flex-col justify-center items-center text-center select-none z-40"
          style={{ pointerEvents: 'none' }} 
          animate={{ x: isSignUp ? '0%' : '100%' }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        >
          <div className="absolute inset-0 bg-blue-600/10 blur-[50px] rounded-full pointer-events-none" />
          <h1 className="text-2xl font-black uppercase tracking-widest mb-3 text-blue-400">
            {isSignUp ? "Join Skillora" : "WELCOME BACK!"}
          </h1>
          <p className="text-xs text-gray-400 leading-relaxed max-w-[240px]">
            {isSignUp 
              ? "Unlock deep, interactive AI career insight tools tailored right to your growth."
              : "Step straight back into your tailored roadmap and interview simulations."
            }
          </p>
        </motion.div>

        {/* --- LOGIN SIDE --- */}
        <div className="w-1/2 h-full flex flex-col justify-center p-10 font-sans relative z-30">
          <motion.div
            animate={{ opacity: isSignUp ? 0 : 1, scale: isSignUp ? 0.9 : 1 }}
            transition={{ duration: 0.3 }}
            className={isSignUp ? "pointer-events-none w-full" : "w-full"}
          >
            <h2 className="text-xl font-bold uppercase tracking-wider mb-4 text-white">Login</h2>
            {error && !isSignUp && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 p-2 rounded-lg mb-3">
                {error}
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              <input 
                type="text" 
                placeholder="Email or Username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 bg-white/[0.03] border-2 border-blue-600/30 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm text-white placeholder-gray-500"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-white/[0.03] border-2 border-blue-600/30 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm text-white placeholder-gray-500"
              />
              <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 font-bold uppercase tracking-wider text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                Login
              </button>
            </form>
            <p className="text-xs text-gray-400 mt-5 text-center">
              Don’t have an account?{" "}
              <button type="button" onClick={() => resetForm(true)} className="text-blue-400 font-bold hover:underline cursor-pointer">
                Sign Up
              </button>
            </p>
          </motion.div>
        </div>

        {/* --- SIGN UP SIDE --- */}
        <div className="w-1/2 h-full flex flex-col justify-center p-10 font-sans relative z-30">
          <motion.div
            animate={{ opacity: isSignUp ? 1 : 0, scale: isSignUp ? 1 : 0.9 }}
            transition={{ duration: 0.3 }}
            className={!isSignUp ? "pointer-events-none w-full" : "w-full"}
          >
            <h2 className="text-xl font-bold uppercase tracking-wider mb-4 text-white">Sign Up</h2>
            {error && isSignUp && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 p-2 rounded-lg mb-3">
                {error}
              </div>
            )}
            <form onSubmit={handleRegister} className="space-y-4">
              <input 
                type="text" 
                placeholder="Username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 bg-white/[0.03] border-2 border-blue-600/30 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm text-white placeholder-gray-500"
              />
              <input 
                type="email" 
                placeholder="Email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-white/[0.03] border-2 border-blue-600/30 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm text-white placeholder-gray-500"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-white/[0.03] border-2 border-blue-600/30 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm text-white placeholder-gray-500"
              />
              <p className="text-[10px] text-gray-500 -mt-2">
                Min 8 chars · Uppercase · Lowercase · Number · Special character
              </p>
              <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 font-bold uppercase tracking-wider text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                Sign Up
              </button>
            </form>
            <p className="text-xs text-gray-400 mt-5 text-center">
              Already have an account?{" "}
              <button type="button" onClick={() => resetForm(false)} className="text-blue-400 font-bold hover:underline cursor-pointer">
                Login
              </button>
            </p>
          </motion.div>
        </div>

      </motion.div>
    </div>
  );
}