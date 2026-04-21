import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FlaskConical, 
  ShieldCheck, 
  Zap, 
  Activity, 
  Clock, 
  ChevronRight, 
  Star,
  Users,
  TestTube2,
  Receipt,
  FileBarChart,
  Menu,
  X
} from 'lucide-react';
import { Button } from '../components/UI';
import { useSettings } from '../hooks/useSettings';
import { motion, AnimatePresence } from 'framer-motion';

export default function Landing() {
  const { settings } = useSettings();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white selection:bg-zinc-900 selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-zinc-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
              <FlaskConical className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900">
              {settings?.labName || 'BioLab Pro'}
            </span>
          </div>
          
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">Features</a>
            <a href="#services" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">Solutions</a>
            <a href="#pricing" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-4 md:flex">
              <Link to="/login" className="text-sm font-semibold text-zinc-900">Log in</Link>
              <Link to="/dashboard">
                <Button className="rounded-full px-6">Access Portal</Button>
              </Link>
            </div>
            
            <button 
              className="rounded-lg p-2 hover:bg-zinc-100 md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-b border-zinc-100 bg-white md:hidden overflow-hidden"
            >
              <div className="flex flex-col gap-4 p-6">
                <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-zinc-600 mt-2">Features</a>
                <a href="#services" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-zinc-600">Solutions</a>
                <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-zinc-600 mb-2">Pricing</a>
                <hr className="border-zinc-100" />
                <Link to="/login" className="text-lg font-semibold text-zinc-900">Log in</Link>
                <Link to="/dashboard">
                  <Button className="w-full rounded-full h-12">Access Portal</Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-8 flex">
              <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-zinc-600 ring-1 ring-zinc-100 hover:ring-zinc-200">
                Announcing Version 2.0. <a href="#" className="font-semibold text-zinc-900"><span className="absolute inset-0" aria-hidden="true" />Read more <span aria-hidden="true">&rarr;</span></a>
              </div>
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-zinc-900 sm:text-7xl">
              Precision Diagnostics <br />
              <span className="text-zinc-400">at the speed of light.</span>
            </h1>
            <p className="mt-8 text-lg leading-8 text-zinc-600 max-w-2xl">
              BioLab Pro is the ultimate operating system for modern laboratories. 
              Manage patients, orchestrate tests, and deliver instant digital reports with 
              unmatched accuracy and military-grade security.
            </p>
            <div className="mt-10 flex items-center gap-x-6">
              <Link to="/dashboard">
                <Button size="lg" className="rounded-full px-8 h-14 text-lg">
                  Start Managing <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#features" className="text-sm font-semibold leading-6 text-zinc-900">
                Live Demo <span aria-hidden="true">→</span>
              </a>
            </div>
            
            <div className="mt-16 flex items-center gap-x-8">
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i => (
                  <img 
                    key={i}
                    className="h-10 w-10 rounded-full border-2 border-white grayscale" 
                    src={`https://picsum.photos/seed/lab-user-${i}/100/100`} 
                    alt="User"
                    referrerPolicy="no-referrer"
                  />
                ))}
              </div>
              <div className="text-sm leading-6">
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                </div>
                <p className="font-medium text-zinc-900 text-xs mt-1 uppercase tracking-widest">
                  Trusted by 500+ Medical Institutions
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Abstract Background Element */}
        <div className="absolute top-0 right-0 -z-10 h-[800px] w-[800px] translate-x-1/4 -translate-y-1/4 opacity-20 blur-3xl">
          <div className="h-full w-full bg-gradient-to-br from-zinc-200 to-zinc-400 rounded-full" />
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-zinc-50 border-y border-zinc-100">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Core Capabilities</h2>
              <p className="mt-4 text-3xl font-bold tracking-tight text-zinc-900">
                Built for the next decade of medical science.
              </p>
              <p className="mt-6 text-zinc-600">
                Everything you need to run a world-class laboratory. No compromises, just clean engineering.
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:col-span-2">
              <div className="group rounded-3xl border border-zinc-200 bg-white p-8 transition-all hover:shadow-2xl hover:-translate-y-1">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900">Smart Patient Registry</h3>
                <p className="mt-2 text-sm text-zinc-600">Unified records with comprehensive medical history and instant retrieval.</p>
              </div>
              
              <div className="group rounded-3xl border border-zinc-200 bg-white p-8 transition-all hover:shadow-2xl hover:-translate-y-1">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white">
                  <TestTube2 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900">Test Orchestration</h3>
                <p className="mt-2 text-sm text-zinc-600">Complete directory of 2,500+ tests with dynamic normal ranges and unit controls.</p>
              </div>
              
              <div className="group rounded-3xl border border-zinc-200 bg-white p-8 transition-all hover:shadow-2xl hover:-translate-y-1">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white">
                  <Receipt className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900">Automated Billing</h3>
                <p className="mt-2 text-sm text-zinc-600">Instant professional invoices, payment tracking, and ledger management.</p>
              </div>
              
              <div className="group rounded-3xl border border-zinc-200 bg-white p-8 transition-all hover:shadow-2xl hover:-translate-y-1">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white">
                  <FileBarChart className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900">Digital Reports</h3>
                <p className="mt-2 text-sm text-zinc-600">Generate high-fidelity medical reports with one click. Paperless and secure.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400">Institutional Trust</h2>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8 grayscale opacity-50">
            <div className="text-2xl font-black italic tracking-tighter text-zinc-900 underline">HEALTHCARE</div>
            <div className="text-2xl font-black italic tracking-tighter text-zinc-900 font-serif">PHARMA-PLUS</div>
            <div className="text-2xl font-black italic tracking-tighter text-zinc-900">MEDCORE</div>
            <div className="text-2xl font-black italic tracking-tighter text-zinc-900 border-2 border-zinc-900 px-2">VITALIS</div>
            <div className="text-2xl font-black italic tracking-tighter text-zinc-900">LABX</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 bg-zinc-50 pt-24 pb-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
                  <FlaskConical className="h-5 w-5" />
                </div>
                <span className="text-xl font-bold tracking-tight text-zinc-900">
                  {settings?.labName || 'BioLab Pro'}
                </span>
              </div>
              <p className="max-w-xs text-sm text-zinc-500 leading-relaxed">
                Operating the world's most critical medical data with precision, speed, and unwavering security.
              </p>
            </div>
            
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-900 mb-6">Product</h4>
              <ul className="space-y-4 text-sm text-zinc-500">
                <li><a href="#" className="hover:text-zinc-900">Overview</a></li>
                <li><a href="#" className="hover:text-zinc-900">Features</a></li>
                <li><a href="#" className="hover:text-zinc-900">API Documentation</a></li>
                <li><a href="#" className="hover:text-zinc-900">Compliance</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-900 mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-zinc-500">
                <li><a href="#" className="hover:text-zinc-900">About</a></li>
                <li><a href="#" className="hover:text-zinc-900">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-zinc-900">Terms of Service</a></li>
                <li><a href="#" className="hover:text-zinc-900">Status</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-24 pt-8 border-t border-zinc-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-zinc-500 italic">
              &copy; {new Date().getFullYear()} {settings?.labName || 'BioLab Pro'}. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <ShieldCheck className="h-4 w-4 text-zinc-400" />
              <Zap className="h-4 w-4 text-zinc-400" />
              <Activity className="h-4 w-4 text-zinc-400" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
