'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  ChevronLeft, 
  Rocket, 
  Target, 
  Webhook, 
  ShieldCheck,
  Building2,
  Users,
  Briefcase,
  Globe,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Plus,
  UserSquare2
} from 'lucide-react';

const steps = [
  {
    id: 1,
    title: 'Your Professional Role',
    description: 'Tell us a bit about what you do to personalize your experience.',
    icon: Briefcase
  },
  {
    id: 2,
    title: 'Outreach Goals',
    description: 'What is your primary goal with LeadFlow?',
    icon: Target
  },
  {
    id: 3,
    title: 'Workspace Settings',
    description: 'Set up your workspace defaults for your team.',
    icon: Building2
  }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    role: '',
    goal: '',
    industry: '',
    teamSize: ''
  });

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      finishOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipOnboarding = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skipped: true })
      });
    } catch (err) {
      console.error("Skip onboarding error:", err);
    }
    router.push('/dashboard');
  };

  const finishOnboarding = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        const data = await res.json();
        console.error("Onboarding failed:", data.error);
        // Fallback to dashboard anyway to not block user
        router.push('/dashboard');
      }
    } catch (err) {
      console.error("Onboarding request error:", err);
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const currentStepData = steps[currentStep - 1];
  const Icon = currentStepData.icon;

  return (
    <div className="min-h-screen flex flex-col font-jakarta bg-white overflow-hidden">
      {/* Header */}
      <header className="h-20 flex items-center justify-between px-8 sm:px-12 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <Link href="/">
          <Image 
            src="/leadflow-black.png" 
            alt="LeadFlow" 
            width={100} 
            height={28} 
            className="h-6 w-auto object-contain"
          />
        </Link>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2">
            {steps.map((s) => (
              <div 
                key={s.id}
                className={`w-8 h-1 rounded-full transition-all duration-500 ${s.id <= currentStep ? 'bg-[#745DF3]' : 'bg-gray-100'}`}
              />
            ))}
          </div>
          <button 
            onClick={skipOnboarding}
            className="text-gray-400 text-xs font-black uppercase tracking-widest hover:text-[#745DF3] transition-colors"
          >
            Skip for now
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-8 relative">
        {/* Background Decor */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#745DF3]/[0.02] blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#745DF3]/[0.05] blur-[100px] rounded-full pointer-events-none" />

        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-[#745DF3]/10 rounded-2xl flex items-center justify-center text-[#745DF3] mx-auto mb-6">
                  <Icon className="w-8 h-8" />
                </div>
                <h1 className="text-4xl font-black text-[#101828] tracking-tighter uppercase ">
                  {currentStepData.title}
                </h1>
                <p className="text-gray-500 font-medium text-lg max-w-md mx-auto leading-relaxed">
                  {currentStepData.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentStep === 1 && (
                  <>
                    {[
                      { id: 'founder', name: 'Founder / CEO', icon: UserSquare2 },
                      { id: 'sales', name: 'Sales / BDR', icon: Target },
                      { id: 'marketing', name: 'Marketing', icon: Globe },
                      { id: 'other', name: 'Other Professional', icon: Briefcase }
                    ].map((role) => (
                      <button
                        key={role.id}
                        onClick={() => setFormData({ ...formData, role: role.id })}
                        className={`p-6 rounded-3xl border-2 text-left transition-all flex items-center gap-4 group ${
                          formData.role === role.id 
                            ? 'border-[#745DF3] bg-[#745DF3]/[0.02]' 
                            : 'border-gray-100 hover:border-gray-200 bg-white shadow-sm'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                          formData.role === role.id ? 'bg-[#745DF3] text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-white group-hover:text-[#745DF3]'
                        }`}>
                          <role.icon className="w-5 h-5" />
                        </div>
                        <span className={`font-black uppercase tracking-tight text-sm ${
                          formData.role === role.id ? 'text-[#101828]' : 'text-gray-400 group-hover:text-[#101828]'
                        }`}>
                          {role.name}
                        </span>
                      </button>
                    ))}
                  </>
                )}

                {currentStep === 2 && (
                  <>
                    {[
                      { id: 'leads', name: 'Generate Leads', icon: Rocket },
                      { id: 'recruiting', name: 'Technical Recruiting', icon: Users },
                      { id: 'partners', name: 'Partnerships', icon: Webhook },
                      { id: 'testing', name: 'Just testing things', icon: ShieldCheck }
                    ].map((goal) => (
                      <button
                        key={goal.id}
                        onClick={() => setFormData({ ...formData, goal: goal.id })}
                        className={`p-6 rounded-3xl border-2 text-left transition-all flex items-center gap-4 group ${
                          formData.goal === goal.id 
                            ? 'border-[#745DF3] bg-[#745DF3]/[0.02]' 
                            : 'border-gray-100 hover:border-gray-200 bg-white shadow-sm'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                          formData.goal === goal.id ? 'bg-[#745DF3] text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-white group-hover:text-[#745DF3]'
                        }`}>
                          <goal.icon className="w-5 h-5" />
                        </div>
                        <span className={`font-black uppercase tracking-tight text-sm ${
                          formData.goal === goal.id ? 'text-[#101828]' : 'text-gray-400 group-hover:text-[#101828]'
                        }`}>
                          {goal.name}
                        </span>
                      </button>
                    ))}
                  </>
                )}

                {currentStep === 3 && (
                  <div className="col-span-1 md:col-span-2 space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Industry</label>
                       <input 
                         type="text" 
                         placeholder="e.g. Software, Real Estate, E-commerce"
                         className="w-full px-8 py-5 bg-gray-50 border border-gray-100 rounded-[2rem] outline-none focus:ring-2 focus:ring-[#745DF3]/10 focus:border-[#745DF3] focus:bg-white transition-all font-bold text-[#101828]"
                         value={formData.industry}
                         onChange={(e) => setFormData({...formData, industry: e.target.value})}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Estimated Monthly Sends</label>
                       <div className="grid grid-cols-3 gap-3">
                         {['< 5k', '5k - 20k', '20k+'].map((range) => (
                           <button
                             key={range}
                             onClick={() => setFormData({...formData, teamSize: range})}
                             className={`py-4 rounded-2xl border-2 font-black transition-all text-xs tracking-tight ${
                               formData.teamSize === range ? 'border-[#745DF3] bg-[#745DF3]/[0.02] text-[#101828]' : 'border-gray-100 text-gray-400'
                             }`}
                           >
                             {range}
                           </button>
                         ))}
                       </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 pt-10">
                {currentStep > 1 && (
                  <button
                    onClick={prevStep}
                    className="flex-1 py-5 bg-white border border-gray-100 rounded-[2rem] flex items-center justify-center gap-2 font-black text-gray-400 hover:text-[#101828] hover:border-[#745DF3]/30 transition-all shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                )}
                <button
                  disabled={isLoading || (currentStep === 1 && !formData.role) || (currentStep === 2 && !formData.goal)}
                  onClick={nextStep}
                  className={`${currentStep > 1 ? 'flex-[2]' : 'w-full'} py-5 bg-[#101828] text-white rounded-[2rem] flex items-center justify-center gap-2 font-black hover:bg-black transition-all shadow-xl shadow-[#101828]/10 group disabled:opacity-50`}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : currentStep === steps.length ? (
                    <>
                      Complete Setup
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Continue
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-8 text-center bg-gray-50/30">
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
          Welcome to the future of sequence management
        </p>
      </footer>
    </div>
  );
}

