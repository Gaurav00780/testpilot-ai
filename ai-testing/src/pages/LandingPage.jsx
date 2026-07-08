import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useAnimation, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowRight, Play, Eye, Layers, Brain, Users, TrendingUp,
  BarChart3, Shield, Sparkles, Globe, Star, Lock, Zap,
  Monitor, Bug, GitCompare, Scan, FileSearch, Settings,
  ExternalLink, Mail, ChevronDown, ChevronRight,
  CheckCircle2, AlertTriangle, Activity, Check, X,
  MessageSquare, Search, Cpu, Palette, Code2, Box,
  CircleDot, LayoutGrid, PieChart, Target, Menu, Bell, X as XIcon
} from 'lucide-react';
import { Particles } from '@/components/ui/particles';
import { MagicCard } from '@/components/ui/magic-card';
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text';
import { TextAnimate } from "@/components/ui/text-animate";
import { AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis } from 'recharts';


gsap.registerPlugin(ScrollTrigger);

/* ─────────────── Mouse Position Hook ─────────────── */
function useMousePosition() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  const handleMouse = useCallback((e) => {
    x.set(e.clientX);
    y.set(e.clientY);
  }, [x, y]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, [handleMouse]);

  return { x: springX, y: springY, rawX: x, rawY: y };
}



/* ─────────────── Constants ─────────────── */
const COLORS = {
  bg: '#0A0A0F',
  cardBg: '#111118',
  cardBg2: '#14141B',
  cardBorder: 'rgba(255,255,255,0.06)',
  cardBorderHover: 'rgba(249,115,22,0.3)',
  accent: '#F97316',
  accentHover: '#EA580C',
  accentGlow: 'rgba(249,115,22,0.15)',
  textPrimary: '#F5F5F5',
  textSecondary: '#A0A0B0',
  textMuted: '#555570',
  gradientStart: '#F97316',
  gradientEnd: '#EA580C',
};

/* ─────────────── Custom Brand Icons ─────────────── */
const LinkedInIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const TwitterIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const YoutubeIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2a29 29 0 0 0-.46 5.33 29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
  </svg>
);

const GithubIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

/* ─────────────── Animation Variants ─────────────── */
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }
  })
};

const fadeInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] } }
};

const fadeInRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i = 0) => ({
    opacity: 1, scale: 1,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }
  })
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } }
};

/* ─────────────── Utility: Scroll-Animated Section ─────────────── */
function AnimatedSection({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={fadeInUp}
      custom={delay}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────── Utility: Animated Counter ─────────────── */
function AnimatedCounter({ target, suffix = '', prefix = '', duration = 2 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const num = parseFloat(target.toString().replace(/[^0-9.]/g, ''));
    if (isNaN(num)) { setCount(target); return; }
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = (Date.now() - startTime) / (duration * 1000);
      if (elapsed >= 1) { setCount(num); clearInterval(timer); return; }
      setCount(Math.floor(num * elapsed));
    }, 30);
    return () => clearInterval(timer);
  }, [isInView, target, duration]);

  return <span ref={ref}>{prefix}{typeof count === 'number' ? count.toLocaleString() : count}{suffix}</span>;
}

/* ─────────────── Glow Orb Decorations ─────────────── */
function GlowOrb({ className = '', color = '#F97316' }) {
  return (
    <div
      className={`absolute rounded-full blur-[120px] pointer-events-none ${className}`}
      style={{ background: color, opacity: 0.08 }}
    />
  );
}

/* ─────────────── Section Badge (Dark) ─────────────── */
function SectionBadge({ children, icon: Icon = Sparkles }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-caption font-normal border"
      style={{
        background: 'rgba(249,115,22,0.08)',
        borderColor: 'rgba(249,115,22,0.2)',
        color: '#F97316',
      }}>
      <Icon className="w-3.5 h-3.5" />
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────── */
/*  NAVBAR                                            */
/* ────────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      setScrolled(scrollY > 20);
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? Math.min(scrollY / docHeight, 1) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = ['Home', 'Features', 'About', 'Pricing'];

  return (
    <>
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-[60] h-[2px] origin-left"
        style={{ background: 'linear-gradient(90deg, #F97316, #FB923C, #F97316)', scaleX: scrollProgress }}
      />

      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-700"
        style={{
          background: scrolled
            ? 'rgba(10,10,15,0.75)'
            : 'transparent',
          backdropFilter: scrolled ? 'blur(24px) saturate(1.6)' : 'blur(0px)',
          WebkitBackdropFilter: scrolled ? 'blur(24px) saturate(1.6)' : 'blur(0px)',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent',
          boxShadow: scrolled ? '0 1px 40px rgba(0,0,0,0.3)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16 lg:h-[72px]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group relative" id="landing-logo">
            <span className="text-xl font-bold tracking-tight text-white font-display uppercase">
              TESTPILOT
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#F97316] to-[#EA580C] shadow-lg shadow-orange-500/50" />
          </Link>

          {/* Center Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item, i) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase().replace(/[^a-z0-9]/g, '')}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.4 }}
                className="relative px-4 py-2 text-label font-normal text-[#A0A0B0] hover:text-white transition-colors rounded-lg overflow-hidden group/nav"
                id={`nav-${item.toLowerCase().replace(/[^a-z0-9]/g, '')}`}
                whileHover={{ x: 2 }}
              >
                <span className="relative z-10">{item}</span>
                <motion.span
                  className="absolute inset-0 rounded-lg bg-white/[0.04] opacity-0 group-hover/nav:opacity-100 transition-opacity"
                />
              </motion.a>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="hidden lg:block">
              <Link to="/login"
                className="inline-flex items-center gap-1.5 bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-semibold px-5 py-2.5 rounded-full transition-all duration-300 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 relative overflow-hidden group/btn"
                id="landing-get-started">
                <span className="relative z-10">Get Started</span>
                <ArrowRight className="w-3.5 h-3.5 relative z-10" />
              </Link>
            </motion.div>

            {/* Mobile menu toggle */}
            <button
              className="lg:hidden w-10 h-10 rounded-lg flex items-center justify-center text-[#A0A0B0] hover:text-white hover:bg-white/5 transition-all"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <XIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="lg:hidden overflow-hidden border-t"
              style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(10,10,15,0.95)' }}
            >
              <div className="px-6 py-4 space-y-1">
                {navItems.map((item, i) => (
                  <motion.a
                    key={item}
                    href={`#${item.toLowerCase().replace(/[^a-z0-9]/g, '')}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="block px-4 py-3 text-label font-normal text-[#A0A0B0] hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item}
                  </motion.a>
                ))}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="pt-2"
                >
                  <Link to="/login"
                    className="block w-full text-center bg-[#EA580C] hover:bg-[#C2410C] text-white font-semibold px-5 py-3 rounded-full transition-all"
                    onClick={() => setMobileOpen(false)}
                  >
                    Get Started
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}

/* ─────────────── Typewriter Effect ─────────────── */
function TypewriterText({ words, className = '' }) {
  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = words[wordIndex];
    let timer;

    if (!deleting && charIndex < current.length) {
      timer = setTimeout(() => setCharIndex((c) => c + 1), 80);
    } else if (!deleting && charIndex === current.length) {
      timer = setTimeout(() => setDeleting(true), 2000);
    } else if (deleting && charIndex > 0) {
      timer = setTimeout(() => setCharIndex((c) => c - 1), 40);
    } else if (deleting && charIndex === 0) {
      setDeleting(false);
      setWordIndex((w) => (w + 1) % words.length);
    }

    return () => clearTimeout(timer);
  }, [charIndex, deleting, wordIndex, words]);

  return (
    <span className={className}>
      {words[wordIndex].substring(0, charIndex)}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
        className="inline-block w-[2px] h-[0.8em] bg-[#F97316] ml-1 align-middle"
      />
    </span>
  );
}

/* ────────────────────────────────────────────────── */
/*  HERO SECTION                                      */
/* ────────────────────────────────────────────────── */
function HeroSection() {
  const heroRef = useRef(null);
  const mouse = useMousePosition();

  return (
    <section id="hero" ref={heroRef} className="relative pt-24 lg:pt-32 pb-0 min-h-screen flex flex-col" style={{ background: 'transparent' }}>
      {/* Background Effects */}
      <GlowOrb className="w-[800px] h-[800px] -top-[200px] -right-[200px]" color="#F97316" />
      <GlowOrb className="w-[600px] h-[600px] top-[200px] -left-[200px]" color="#F97316" />
      <GlowOrb className="w-[400px] h-[400px] bottom-0 left-1/3" color="#FB923C" />

      {/* Interactive glow that follows mouse */}
      <motion.div
        className="absolute w-[300px] h-[300px] rounded-full pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)',
          x: mouse.x,
          y: mouse.y,
          translateX: '-50%',
          translateY: '-50%',
        }}
      />

      {/* Light Beam Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.015] to-transparent pointer-events-none" />

      {/* Particle System */}
      <Particles quantity={50} color="#F97316" />



      {/* Main content wrapper */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full flex flex-col items-center justify-center pt-8">
        {/* Floating Info Cards */}
        {/* Card 1: Top Left */}
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute hidden lg:flex items-center gap-4 bg-transparent backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] px-5 py-3.5 rounded-2xl top-[-2rem] left-[0%] xl:left-[2%] z-20"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F97316]/80 to-[#EA580C]/80 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
            <Zap className="w-5 h-5 text-white drop-shadow-md" />
          </div>
          <div>
            <p className="text-white text-sm font-bold tracking-wide font-display drop-shadow-md">Real-Time AI</p>
            <p className="text-white/70 text-xs font-medium">Instant visual analysis</p>
          </div>
        </motion.div>

        {/* Card 2: Top Right */}
        <motion.div
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute hidden lg:flex items-center gap-4 bg-transparent backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] px-5 py-3.5 rounded-2xl top-[8rem] right-[0%] xl:right-[2%] z-20"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F97316]/80 to-[#EA580C]/80 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
            <Shield className="w-5 h-5 text-white drop-shadow-md" />
          </div>
          <div>
            <p className="text-white text-sm font-bold tracking-wide font-display drop-shadow-md">99.9% Accuracy</p>
            <p className="text-white/70 text-xs font-medium">Zero hallucinations</p>
          </div>
        </motion.div>

        {/* Card 3: Bottom Left */}
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute hidden lg:flex items-center gap-4 bg-transparent backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] px-5 py-3.5 rounded-2xl top-[20rem] left-[4%] xl:left-[8%] z-20"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F97316]/80 to-[#EA580C]/80 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
            <Activity className="w-5 h-5 text-white drop-shadow-md" />
          </div>
          <div>
            <p className="text-white text-sm font-bold tracking-wide font-display drop-shadow-md">Auto Healing</p>
            <p className="text-white/70 text-xs font-medium">Self-correcting code</p>
          </div>
        </motion.div>

        {/* Card 4: Bottom Right */}
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute hidden lg:flex items-center gap-4 bg-transparent backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] px-5 py-3.5 rounded-2xl top-[26rem] right-[5%] xl:right-[10%] z-20"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F97316]/80 to-[#EA580C]/80 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
            <Monitor className="w-5 h-5 text-white drop-shadow-md" />
          </div>
          <div>
            <p className="text-white text-sm font-bold tracking-wide font-display drop-shadow-md">24/7 Monitor</p>
            <p className="text-white/70 text-xs font-medium">Constant vigilance</p>
          </div>
        </motion.div>

        {/* Top Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex justify-center mb-6"
        >
          <div className="inline-flex items-center gap-2.5 bg-white/[0.03] border border-white/10 rounded-full px-3.5 py-1.5 text-xs text-white/80 backdrop-blur-md">
            <span className="bg-[#F97316] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Whats New
            </span>
            <span className="text-white/60 font-medium flex items-center gap-1">
              Ease Update v0.1 <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </motion.div>

        {/* Title & Subtext */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center w-full"
        >
          <TextAnimate
            animation="blurIn"
            as="h1"
            className="text-4xl md:text-6xl lg:text-7xl tracking-tight text-white leading-[1.1] mb-6 max-w-4xl mx-auto font-display"
          >
            AI-Powered Visual Testing for Modern Teams.
          </TextAnimate>

          <p className="text-sm md:text-base lg:text-lg text-[#A0A0B0] max-w-2xl mx-auto leading-relaxed mb-8 font-normal">
            Catch visual regressions instantly and ship with confidence using TestPilot. <br className="hidden sm:inline" /> The all-in-one platform for automated UI quality.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <a href="#features" className="inline-flex items-center gap-1.5 bg-white/[0.03] hover:bg-white/[0.08] text-white border border-white/10 px-6 py-2.5 rounded-full text-sm font-medium transition-all">
                Read More
                <ArrowRight className="w-4 h-4 text-white/60" />
              </a>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link to="/login" className="inline-flex items-center gap-1.5 bg-[#EA580C] hover:bg-[#C2410C] text-white px-6 py-2.5 rounded-full text-sm font-semibold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Glowing Arc & Mockup Section */}
      <div className="relative w-full flex flex-col items-center justify-end pt-4 md:pt-12">


        {/* Background Radial Glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] rounded-full bg-[#F97316]/10 blur-[100px] -z-10 pointer-events-none" />

        {/* Centered Dashboard Preview Container */}
        {/* Main Dashboard Image */}
        <div className='relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 mt-4 md:mt-16 mb-16 md:mb-8 lg:mb-0'>
          <div
            className="relative w-full max-w-[1400px] mx-auto transform scale-[1.25] md:scale-110 lg:scale-100 origin-top"
            style={{
              WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
              maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)'
            }}
          >
            {/* The SVG Frame with embedded dashboard image */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 944 577" preserveAspectRatio="none" className="w-full aspect-video drop-shadow-2xl">
              <mask id="screen_svg__b" width="944" height="577" x="0" y="0" maskUnits="userSpaceOnUse" style={{ maskType: 'alpha' }}>
                <path fill="url(#screen_svg__a)" d="M0 0h944v577H0z" />
              </mask>
              <g filter="url(#screen_svg__c)" mask="url(#screen_svg__b)">
                <path fill="url(#screen_svg__d)" d="M101.336 139.742c-.916-5.632 3.431-10.742 9.136-10.742h723.062c5.705 0 10.052 5.11 9.137 10.742l-69.8 429.486a9.255 9.255 0 0 1-9.136 7.772H180.271a9.255 9.255 0 0 1-9.136-7.772z" />
              </g>
              <g filter="url(#screen_svg__e)">
                <rect width="760" height="482" x="92" y="95" fill="#fff" fillOpacity=".1" rx="18" />
                <rect width="759" height="481" x="92.5" y="95.5" stroke="#fff" strokeOpacity=".1" rx="17.5" />
                <rect width="759" height="481" x="92.5" y="95.5" stroke="url(#screen_svg__f)" rx="17.5" />
              </g>
              <rect width="732" height="454" x="106" y="109" fill="#0B0B0E" rx="10" />

              {/* Dashboard image clipped to fit precisely */}
              <image href="/dashboard.png" x="106" y="109" width="732" height="454" preserveAspectRatio="xMidYMin slice" clipPath="url(#dashboard-clip)" />

              <defs>
                <clipPath id="dashboard-clip">
                  <rect width="732" height="454" x="106" y="109" rx="10" />
                </clipPath>
                <linearGradient id="screen_svg__a" x1="0" x2="944" y1="319.961" y2="319.961" gradientUnits="userSpaceOnUse"><stop offset=".044" stopColor="#D9D9D9" stopOpacity=".2" /><stop offset=".362" stopColor="#D9D9D9" /><stop offset=".642" stopColor="#D9D9D9" /><stop offset=".955" stopColor="#D9D9D9" stopOpacity=".2" /></linearGradient>
                <linearGradient id="screen_svg__d" x1="469.597" x2="469.597" y1="149.774" y2="658.51" gradientUnits="userSpaceOnUse"><stop stopColor="#F44E36" /><stop offset="1" stopColor="#F44E36" stopOpacity=".6" /></linearGradient>
                <filter id="screen_svg__c" width="982.252" height="688.673" x="-19.123" y="8.664" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse"><feFlood floodOpacity="0" result="BackgroundImageFix" /><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" /><feGaussianBlur result="effect1_foregroundBlur_766_158773" stdDeviation="60.168" /></filter>
                <filter id="screen_svg__e" width="792" height="514" x="76" y="79" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse"><feFlood floodOpacity="0" result="BackgroundImageFix" /><feGaussianBlur in="BackgroundImageFix" stdDeviation="8" /><feComposite in2="SourceAlpha" operator="in" result="effect1_backgroundBlur_766_158773" /><feBlend in="SourceGraphic" in2="effect1_backgroundBlur_766_158773" result="shape" /></filter>
                <radialGradient id="screen_svg__f" cx="0" cy="0" r="1" gradientTransform="matrix(0 246.5 -388.672 0 472 -38)" gradientUnits="userSpaceOnUse"><stop stopColor="#FFA699" /><stop offset="1" stopColor="#FFA699" stopOpacity="0" /></radialGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────── */
/*  FEATURES SECTION                                  */
/* ────────────────────────────────────────────────── */
const features = [
  {
    icon: Eye,
    title: 'AI Visual Analysis',
    desc: 'Automatically detect layout shifts with AI.',
    bgImage: '/features-images/AI%20Visual%20Analysis.png'
  },
  {
    icon: Bug,
    title: 'Smart Debugging',
    desc: 'Pinpoint root causes and get fix suggestions instantly.',
    bgImage: '/features-images/Smart%20Debugging.png'
  },
  {
    icon: Globe,
    title: 'Cross-Browser Testing',
    desc: 'Test across all major browsers without the hassle.',
    bgImage: '/features-images/Cross-Browser%20Testing.png'
  },
  {
    icon: GitCompare,
    title: 'Visual Regression',
    desc: 'Prevent visual bugs with pixel-perfect comparisons.',
    bgImage: '/features-images/Visual%20Regression.png'
  },
  {
    icon: Palette,
    title: 'Design Comparison',
    desc: 'Overlay designs to ensure your UI matches specifications.',
    bgImage: '/features-images/Design%20Comparison.png'
  },
  {
    icon: Code2,
    title: 'CI/CD Integrations',
    desc: 'Automate visual testing natively within your pipeline.',
    bgImage: '/features-images/CI-CD%20Integrations.png'
  },
];

function FeatureCard({ icon: Icon, title, desc, bgImage }) {
  return (
    <MagicCard
      className="p-6 relative overflow-hidden group aspect-square flex flex-col rounded-sm"
      style={{
        background: 'linear-gradient(135deg, rgba(17,17,24,0.8), rgba(20,20,27,0.9))',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      {/* Background Image Layer */}
      {bgImage && (
        <div
          className="absolute inset-0 z-0 opacity-100 transition-opacity duration-700 pointer-events-none"
          style={{
            backgroundImage: `url('${bgImage}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}

      {/* Overlay to ensure text readability */}
      {bgImage && (
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#111118]/90 via-transparent to-transparent pointer-events-none" />
      )}

      {/* Content wrapper with higher z-index */}
      <div className="relative z-10 flex-1 flex flex-col justify-end">
        {/* Hover glow effect */}
        <motion.div
          className="absolute -inset-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(249,115,22,0.06), transparent 60%)',
          }}
        />

        <h3 className="text-body-compact font-semibold text-white mb-2 font-display relative">{title}</h3>
        <p className="text-label leading-[1.6] relative" style={{ color: COLORS.textSecondary }}>{desc}</p>
      </div>

      {/* Corner accent */}
      <motion.div
        className="absolute top-0 right-0 w-16 h-16 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"
        style={{
          background: 'linear-gradient(225deg, rgba(249,115,22,0.08), transparent)',

        }}
      />
    </MagicCard>
  );
}

function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="features" className="relative py-24 lg:py-32" style={{ background: 'transparent' }}>
      <GlowOrb className="w-[600px] h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <AnimatedSection className="text-center mb-16">
          <SectionBadge icon={Zap}>POWERFUL FEATURES</SectionBadge>
          <h2 className="mt-6 text-[clamp(2rem,4vw,52px)] font-semibold leading-[1.1] text-white tracking-[-0.02em] font-display">
            Everything You Need for{' '}
            <br />
            <span className="relative inline-block">
              <AnimatedGradientText className="text-[clamp(2rem,4vw,52px)] font-semibold leading-[1.1] tracking-[-0.02em]">
                Pixel-Perfect
              </AnimatedGradientText>
              <motion.svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 200 12"
                fill="none"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 0.3 }}
              >
                <path d="M0,6 Q50,0 100,6 T200,6" stroke="#F97316" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
              </motion.svg>
            </span>{' '}
            Experiences
          </h2>
          <p className="mt-5 text-body font-normal max-w-xl mx-auto leading-[1.6]" style={{ color: COLORS.textSecondary }}>
            Powerful AI capabilities and enterprise-level tools that redefine how you test, scale, and ship your projects.
          </p>
        </AnimatedSection>

        {/* Feature Grid */}
        <motion.div
          ref={ref}
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-[30px] max-w-5xl mx-auto"
        >
          {features.map((f, i) => (
            <FeatureCard key={i} icon={f.icon} title={f.title} desc={f.desc} bgImage={f.bgImage} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────── */
/*  ANALYTICS / INSIGHTS SECTION                      */
/* ────────────────────────────────────────────────── */
function AnalyticsSection() {
  const sectionRef = useRef(null);

  const chartData = [
    { day: 'Mon', score: 65 },
    { day: 'Tue', score: 72 },
    { day: 'Wed', score: 68 },
    { day: 'Thu', score: 85 },
    { day: 'Fri', score: 82 },
    { day: 'Sat', score: 90 },
    { day: 'Sun', score: 92 },
  ];

  return (
    <section ref={sectionRef} className="relative py-24 lg:py-32" style={{ background: 'transparent' }}>
      <GlowOrb className="w-[600px] h-[600px] top-0 -left-[200px]" />
      <GlowOrb className="w-[400px] h-[400px] bottom-0 -right-[100px]" color="#FB923C" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — Content */}
          <AnimatedSection>
            <SectionBadge icon={BarChart3}>ANALYTICS DASHBOARD</SectionBadge>

            <h2 className="mt-6 text-[clamp(1.75rem,3.5vw,42px)] font-semibold leading-[1.15] text-white tracking-[-0.02em] font-display">
              Real Insights.{' '}
              <br />Smarter Decisions.
            </h2>

            <p className="mt-4 text-body font-normal leading-[1.6] max-w-md" style={{ color: COLORS.textSecondary }}>
              Go beyond pass or fail. Get rich insights into your UI quality, performance, and visual healthiness.
            </p>

            <div className="mt-8 space-y-4">
              {[
                { icon: CheckCircle2, text: 'Test results tracking', color: '#10B981' },
                { icon: Shield, text: 'Visual quality scores', color: '#F97316' },
                { icon: Activity, text: 'Fully real-time analytics', color: '#3B82F6' },
                { icon: TrendingUp, text: 'Scale performance metrics', color: '#A855F7' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-center gap-3 group"
                >
                  <motion.div
                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${item.color}20` }}
                    whileHover={{ scale: 1.2, rotate: 5 }}
                  >
                    <item.icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                  </motion.div>
                  <span className="text-label font-normal text-white group-hover:text-white/80 transition-colors">{item.text}</span>
                </motion.div>
              ))}
            </div>

            <motion.a
              href="#"
              className="inline-flex items-center gap-2 text-[#F97316] text-label font-normal mt-8 group hover:gap-3 transition-all"
              whileHover={{ x: 3 }}
            >
              Explore Insights <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </motion.a>
          </AnimatedSection>

          {/* Right — Dashboard Cards */}
          <AnimatedSection delay={0.2}>
            <div className="space-y-3">
              {/* Top row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Quality Score', value: '92', unit: '', color: '#F97316' },
                  { label: 'Flaky Tests', value: '8', unit: '%', color: '#EF4444' },
                  { label: 'Release Readiness', value: '85', unit: '%', color: '#10B981' },
                ].map((card, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="rounded-xl p-3 border text-center relative overflow-hidden backdrop-blur-xl"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderColor: 'rgba(255, 255, 255, 0.08)',
                      boxShadow: '0 4px 24px -8px rgba(0,0,0,0.5)',
                    }}
                    whileHover={{
                      scale: 1.05,
                      borderColor: `rgba(249,115,22,0.3)`,
                      background: 'rgba(255, 255, 255, 0.05)',
                      transition: { type: 'spring', stiffness: 300 }
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20 pointer-events-none" />
                    <p className="text-caption font-medium mb-2 relative z-10" style={{ color: COLORS.textMuted }}>{card.label}</p>
                    <p className="text-3xl font-display font-bold relative z-10" style={{ color: card.color, textShadow: `0 2px 10px ${card.color}30` }}>
                      <AnimatedCounter target={card.value} suffix={card.unit} />
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Quality Trend Chart with Recharts */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
                className="rounded-xl p-4 border backdrop-blur-xl relative overflow-hidden"
                style={{
                  backgroundColor: '#0A0A0F',
                  backgroundImage: 'linear-gradient(rgba(249, 115, 22, 0.05) 1px, transparent 1px), linear-gradient(to right, rgba(249, 115, 22, 0.05) 1px, #0A0A0F 1px)',
                  backgroundSize: '24px 24px',
                  borderColor: 'rgba(255,255,255,0.08)',
                  boxShadow: '0 8px 32px -8px rgba(0,0,0,0.5)',
                }}
                whileHover={{ borderColor: 'rgba(249,115,22,0.2)' }}
              >
                <div className="flex items-center justify-between mb-2 relative z-10">
                  <div>
                    <p className="text-label font-semibold text-white">Quality Trend</p>
                    <p className="text-caption text-muted-foreground mt-1 text-[#A0A0B0]">Last 7 days performance</p>
                  </div>
                  <motion.span
                    className="text-caption px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 font-medium shadow-lg"
                    style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    +12% <TrendingUp className="w-3.5 h-3.5" />
                  </motion.span>
                </div>

                <div className="h-[110px] w-full relative z-10 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 15, left: 15, bottom: 25 }}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#A0A0B0', fontSize: 12 }} dy={10} />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: 'rgba(10,10,15,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                        itemStyle={{ color: '#F97316', fontWeight: 600 }}
                      />
                      <Area type="monotone" dataKey="score" stroke="#F97316" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" activeDot={{ r: 6, fill: '#F97316', stroke: '#fff', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Top Issues */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7 }}
                className="rounded-xl p-3 border backdrop-blur-xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderColor: 'rgba(255,255,255,0.08)',
                  boxShadow: '0 4px 24px -8px rgba(0,0,0,0.5)',
                }}
                whileHover={{ borderColor: 'rgba(249,115,22,0.15)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-label font-semibold text-white">Top Issues Identified</p>
                  <span className="text-[10px] text-white/50 px-2 py-1 rounded bg-white/5">Auto-detected</span>
                </div>
                <div className="space-y-1">
                  {[
                    { label: 'Layout shift on mobile viewport', severity: 'High', color: '#EF4444' },
                    { label: 'Font rendering discrepancy', severity: 'Medium', color: '#F59E0B' },
                    { label: 'Button hover state timing', severity: 'Low', color: '#10B981' },
                  ].map((issue, i) => (
                    <motion.div
                      key={i}
                      className="flex items-center justify-between py-0.5 px-2 rounded-lg hover:bg-white/[0.03] transition-colors"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.8 + i * 0.1 }}
                    >
                      <div className="flex items-center gap-3">
                        <motion.div
                          className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]"
                          style={{ background: issue.color, color: issue.color }}
                          animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                          transition={{ duration: 2, delay: i * 0.5, repeat: Infinity }}
                        />
                        <span className="text-caption font-medium" style={{ color: COLORS.textSecondary }}>{issue.label}</span>
                      </div>
                      <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold tracking-wide uppercase"
                        style={{ background: `${issue.color}15`, color: issue.color, border: `1px solid ${issue.color}30` }}>
                        {issue.severity}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────── */
/*  CTA SECTION                                        */
/* ────────────────────────────────────────────────── */
function CTASection() {
  return (
    <section className="relative py-24 lg:py-32" style={{ background: 'transparent' }}>
      <GlowOrb className="w-[800px] h-[800px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      <GlowOrb className="w-[400px] h-[400px] top-0 right-1/4" color="#FB923C" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <AnimatedSection>
            <h2 className="text-[clamp(2rem,4vw,48px)] font-semibold leading-[1.1] text-white tracking-[-0.02em] font-display">
              Ready to catch{' '}
              <br />every UI bug{' '}
              <br />
              <AnimatedGradientText className="text-[clamp(2rem,4vw,48px)] font-semibold leading-[1.1] tracking-[-0.02em]">
                before release?
              </AnimatedGradientText>
            </h2>

            <p className="mt-5 text-body font-normal leading-[1.6] max-w-md" style={{ color: COLORS.textSecondary }}>
              Join <span className="text-white/70 font-medium">top engineering teams</span> automating their visual QA with TestPilot.
            </p>

            <div className="flex items-center gap-4 flex-wrap mt-8">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link to="/login"
                  className="group relative inline-flex items-center gap-2 bg-[#EA580C] hover:bg-[#C2410C] text-white font-semibold px-7 py-3.5 rounded-xl text-label transition-all duration-300 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 overflow-hidden"
                  id="cta-start">
                  <motion.span
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                  />
                  <span className="relative z-10">Get Started</span>
                  <motion.div
                    className="relative z-10"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.div>
                </Link>
              </motion.div>
              <motion.a
                href="#features"
                whileHover={{ scale: 1.04, borderColor: 'rgba(249,115,22,0.3)' }}
                className="inline-flex items-center gap-2 font-normal px-7 py-3.5 rounded-xl text-label transition-all duration-300 border group"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  borderColor: 'rgba(255,255,255,0.1)',
                  color: COLORS.textSecondary,
                }}
                id="cta-demo">
                Book a Demo
              </motion.a>
            </div>
          </AnimatedSection>

          {/* Right — Abstract Visual */}
          <AnimatedSection delay={0.2}>
            <div className="relative flex items-center justify-center h-80">
              {/* Pulsing rings */}
              {[1, 2, 3].map((ring) => (
                <motion.div
                  key={ring}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.15, 0, 0.15],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: ring * 0.8,
                    ease: 'easeOut',
                  }}
                  className="absolute w-32 h-32 rounded-full border"
                  style={{ borderColor: 'rgba(249,115,22,0.3)' }}
                />
              ))}

              {/* Central star shape */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="relative"
              >
                <svg width="160" height="160" viewBox="0 0 160 160">
                  <defs>
                    <linearGradient id="starGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#F97316" />
                      <stop offset="100%" stopColor="#EA580C" />
                    </linearGradient>
                    <filter id="starGlow">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  </defs>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <motion.line
                      key={i}
                      x1="80" y1="80"
                      x2={80 + 70 * Math.cos((i * 45 * Math.PI) / 180)}
                      y2={80 + 70 * Math.sin((i * 45 * Math.PI) / 180)}
                      stroke="url(#starGrad)" strokeWidth="2"
                      strokeLinecap="round"
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: [0.3, 0.8, 0.3] }}
                      transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
                    />
                  ))}
                  <motion.circle
                    cx="80" cy="80" r="20" fill="url(#starGrad)" opacity="0.9"
                    animate={{ r: [20, 22, 20] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <circle cx="80" cy="80" r="30" fill="none" stroke="#F97316" strokeWidth="1" opacity="0.3" />
                  <circle cx="80" cy="80" r="50" fill="none" stroke="#F97316" strokeWidth="0.5" opacity="0.15" />
                </svg>
              </motion.div>

              {/* Floating particles */}
              {Array.from({ length: 16 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    y: [0, -(15 + Math.random() * 20), 0],
                    x: [0, (Math.random() - 0.5) * 30, 0],
                    opacity: [0.2, 0.8, 0.2],
                    scale: [1, 1.5, 1],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.3,
                  }}
                  className="absolute w-1 h-1 rounded-full bg-[#F97316]"
                  style={{
                    top: `${15 + Math.random() * 70}%`,
                    left: `${15 + Math.random() * 70}%`,
                  }}
                />
              ))}
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────── */
/*  FOOTER                                             */
/* ────────────────────────────────────────────────── */
function Footer() {
  const footerLinks = {
    Product: ['Features', 'AI Analysis', 'Visual Diffs', 'Integrations', 'Changelog'],
    Solutions: ['For Teams', 'For QA Engineers', 'For Designers', 'For Developers'],
    Resources: ['Blog', 'Guides', 'Help Center', 'Community'],
    Company: ['About Us', 'Careers', 'Contact Us'],
  };

  return (
    <footer className="relative pt-16 pb-8 overflow-hidden" style={{
      background: 'linear-gradient(180deg, transparent 0%, #0A0A0F 100%)',
      borderTop: '1px solid rgba(255,255,255,0.04)',
    }}>
      <GlowOrb className="w-[600px] h-[600px] -bottom-[300px] left-1/2 -translate-x-1/2" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        {/* Top Area */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4 group">
              <motion.div
                className="w-8 h-8 bg-gradient-to-br from-[#F97316] to-[#EA580C] rounded-lg flex items-center justify-center"
                whileHover={{ scale: 1.05, rotate: -3 }}
              >
                <Eye className="w-4 h-4 text-white" />
              </motion.div>
              <span className="text-body font-semibold text-white font-display">
                <span className="text-[#F97316]">Test</span>Pilot AI
              </span>
            </Link>
            <p className="text-caption font-normal leading-[1.6] mb-6 max-w-[280px]" style={{ color: COLORS.textMuted }}>
              The all-in-one AI visual testing platform that helps teams catch regressions, diagnose issues, and ship great work faster.
            </p>
            {/* Newsletter */}
            <div className="flex items-center gap-2 max-w-[280px] group">
              <input type="email" placeholder="Enter your email"
                className="flex-1 rounded-lg px-3 py-2.5 text-label font-normal text-white placeholder:text-[#555570] focus:outline-none border transition-all duration-300 group-hover:border-[#F97316]/20"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  borderColor: 'rgba(255,255,255,0.06)',
                }}
                id="footer-email-input" />
              <motion.button
                className="w-10 h-10 bg-[#EA580C] hover:bg-[#C2410C] rounded-lg flex items-center justify-center text-white shadow-lg shadow-orange-500/20"
                id="footer-subscribe-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-label font-semibold text-white mb-4 font-display">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-caption font-normal transition-all duration-300 hover:text-[#F97316] hover:translate-x-1 inline-block"
                      style={{ color: COLORS.textMuted }}>
                      {link}
                      {link === 'Careers' && (
                        <motion.span
                          className="ml-1.5 text-[9px] bg-emerald-500/15 text-emerald-400 font-semibold px-1.5 py-0.5 rounded-full"
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          Hiring
                        </motion.span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t flex flex-col lg:flex-row items-center justify-between gap-4" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <p className="text-caption font-normal text-center lg:text-left" style={{ color: COLORS.textMuted }}>
            &copy; {new Date().getFullYear()} TestPilot AI Technologies Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            {[LinkedInIcon, TwitterIcon, YoutubeIcon, GithubIcon].map((SI, i) => (
              <motion.a
                key={i}
                href="#"
                className="w-9 h-9 rounded-full border flex items-center justify-center"
                style={{
                  borderColor: 'rgba(255,255,255,0.06)',
                  color: COLORS.textMuted,
                }}
                whileHover={{
                  scale: 1.1,
                  borderColor: 'rgba(249,115,22,0.4)',
                  color: '#F97316',
                }}
                whileTap={{ scale: 0.95 }}
                id={`footer-social-${i}`}>
                <SI className="w-4 h-4" />
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ────────────────────────────────────────────────── */
/*  LANDING PAGE — MAIN                                */
/* ────────────────────────────────────────────────── */
export default function LandingPage() {
  // Cleanup GSAP ScrollTrigger on unmount
  useEffect(() => {
    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-clip" style={{
      backgroundColor: '#0A0A0F',
      backgroundImage: 'linear-gradient(rgba(249, 115, 22, 0.08) 1px, transparent 1px), linear-gradient(to right, rgba(249, 115, 22, 0.08) 1px, #0A0A0F 1px)',
      backgroundSize: '32px 32px',
      backgroundRepeat: 'repeat'
    }}>
      {/* Smooth scrolling */}
      <style>{`
        html { scroll-behavior: smooth; }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes gradient {
          0% { background-position: 0% center; }
          50% { background-position: 100% center; }
          100% { background-position: 0% center; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <AnalyticsSection />
      <CTASection />
      <Footer />
    </div>
  );
}
