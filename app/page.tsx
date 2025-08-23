'use client'

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Upload, Zap, BarChart3, Users, Mail, Brain } from "lucide-react";
import { useState } from "react";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8 }
};

const fadeInLeft = {
  initial: { opacity: 0, x: -50 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.8 }
};

const fadeInRight = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.8, delay: 0.2 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.2
    }
  }
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function Home() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      monthly: 29,
      yearly: 290,
      description: 'Perfect for small businesses and startups',
      features: [
        '1,000 contacts',
        '10 email campaigns per month',
        '5,000 emails per month', 
        'Basic analytics',
        'Email support',
        'CSV import/export'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      monthly: 79,
      yearly: 790,
      description: 'Best for growing businesses',
      features: [
        '10,000 contacts',
        '50 email campaigns per month',
        '50,000 emails per month',
        'Advanced analytics',
        'Priority support',
        'API access',
        'Custom fields',
        'Automation workflows'
      ],
      popular: true
    }
  ];

  const getDiscountPercentage = () => {
    const starter = plans.find(p => p.id === 'starter')!
    const discount = ((starter.monthly * 12 - starter.yearly) / (starter.monthly * 12)) * 100
    return Math.round(discount)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <motion.header 
        className="bg-white py-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <motion.div 
              className="flex items-center"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Image
                src="/leadflow.png" 
                alt="Leadflow"
                width={220}
                height={50}
                priority
                className="h-14 w-auto"
              />
            </motion.div>

            {/* Navigation */}
            <motion.nav 
              className="hidden lg:flex items-center space-x-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Link href="#features" className="text-gray-700 hover:text-gray-900 font-medium text-lg transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-gray-700 hover:text-gray-900 font-medium text-lg transition-colors">
                How It Works
              </Link>
              <Link href="#pricing" className="text-gray-700 hover:text-gray-900 font-medium text-lg transition-colors">
                Pricing
              </Link>
            </motion.nav>

            {/* Auth Buttons */}
            <motion.div 
              className="flex items-center space-x-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Link href="/auth/sign-in" className="text-gray-700 hover:text-gray-900 font-medium text-lg transition-colors">
                Sign In
              </Link>
              <Link 
                href="/auth/sign-up" 
                className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-all font-semibold text-lg shadow-sm hover:shadow-md"
              >
                Sign Up
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section with How It Works */}
      <section className="bg-white py-24 lg:py-32 relative overflow-hidden">

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          {/* Hero Content */}
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-32">
            
            {/* Text Content - Left */}
            <motion.div 
              className="space-y-8"
              initial="initial"
              animate="animate"
              variants={{
                animate: {
                  transition: {
                    staggerChildren: 0.2
                  }
                }
              }}
            >
              <motion.h1 
                className="text-6xl lg:text-7xl font-black leading-tight"
                variants={fadeInLeft}
              >
                <span className="text-gray-900">Scale Your Cold Email </span>
                <span 
                  style={{
                    background: 'linear-gradient(135deg, #1fbe39 0%, #186ae5 70%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  Outreach
                </span>
              </motion.h1>
              
              <motion.p 
                className="text-[22px] text-gray-600 font-normal leading-relaxed max-w-2xl"
                variants={fadeInLeft}
              >
                Send thousands of personalized cold emails that actually get replies. 
                LeadFlow automates your entire outreach process so you can focus on closing deals.
              </motion.p>
              
              <motion.div 
                className="pt-4"
                variants={fadeInLeft}
              >
                <Link 
                  href="/auth/sign-up" 
                  className="inline-flex items-center bg-blue-600 text-white px-12 py-5 rounded-2xl text-xl font-bold hover:bg-blue-700 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
                >
                  Start Free Trial
                </Link>
              </motion.div>

              {/* Trial Benefits */}
              <motion.div 
                className="flex items-center space-x-8 pt-2"
                variants={fadeInLeft}
              >
                <div className="flex items-center space-x-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-600 font-medium">14 days free trial</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-600 font-medium">No credit card required</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Dashboard Preview - Right */}
            <motion.div 
              className="relative w-full max-w-2xl mx-auto"
              variants={fadeInRight}
              initial="initial"
              animate="animate"
            >
              {/* Mac Window Frame */}
              <div className="bg-gray-100 rounded-xl shadow-2xl overflow-hidden border border-gray-200">
                {/* Mac Title Bar */}
                <div className="bg-gray-200 px-4 py-3 flex items-center space-x-2 border-b border-gray-300">
                  <div className="flex space-x-1.5">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-gray-600 text-sm font-medium">LeadFlow Dashboard</span>
                  </div>
                </div>

                {/* Dashboard Content */}
                <div className="bg-white flex">
                  {/* Sidebar */}
                  <div className="bg-gray-50 w-48 p-4 border-r border-gray-200">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3 p-2 bg-blue-100 text-blue-700 rounded-lg">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span className="text-sm font-medium" style={{ fontFamily: 'SF Pro Text, system-ui, sans-serif' }}>
                          Dashboard
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 p-2 text-gray-600 rounded-lg hover:bg-gray-100">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-sm" style={{ fontFamily: 'SF Pro Text, system-ui, sans-serif' }}>
                          Campaigns
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 p-2 text-gray-600 rounded-lg hover:bg-gray-100">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-sm" style={{ fontFamily: 'SF Pro Text, system-ui, sans-serif' }}>
                          Contacts
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 p-2 text-gray-600 rounded-lg hover:bg-gray-100">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-sm" style={{ fontFamily: 'SF Pro Text, system-ui, sans-serif' }}>
                          Analytics
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 p-6">
                    {/* Dashboard Header */}
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}>
                        Dashboard
                      </h2>
                      <p className="text-gray-600 text-sm" style={{ fontFamily: 'SF Pro Text, system-ui, sans-serif' }}>
                        Welcome back, Sarah
                      </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                        <div className="text-blue-600 text-xs font-semibold mb-1" style={{ fontFamily: 'SF Pro Text, system-ui, sans-serif' }}>
                          EMAILS SENT
                        </div>
                        <div className="text-lg font-bold text-blue-700" style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}>
                          12,847
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg border border-blue-200">
                        <div className="text-green-600 text-xs font-semibold mb-1" style={{ fontFamily: 'SF Pro Text, system-ui, sans-serif' }}>
                          REPLY RATE
                        </div>
                        <div className="text-lg font-bold text-green-700" style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}>
                          23.4%
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200">
                        <div className="text-purple-600 text-xs font-semibold mb-1" style={{ fontFamily: 'SF Pro Text, system-ui, sans-serif' }}>
                          ACTIVE LEADS
                        </div>
                        <div className="text-lg font-bold text-purple-700" style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}>
                          1,249
                        </div>
                      </div>
                    </div>

                    {/* Campaign List */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}>
                        Recent Campaigns
                      </h3>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div>
                            <div className="font-semibold text-gray-900 text-sm" style={{ fontFamily: 'SF Pro Text, system-ui, sans-serif' }}>
                              SaaS Outreach Q1
                            </div>
                            <div className="text-xs text-gray-600" style={{ fontFamily: 'SF Pro Text, system-ui, sans-serif' }}>
                              1,247 contacts • 23.4% reply
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold" style={{ fontFamily: 'SF Pro Text, system-ui, sans-serif' }}>
                            ACTIVE
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div>
                            <div className="font-semibold text-gray-900 text-sm" style={{ fontFamily: 'SF Pro Text, system-ui, sans-serif' }}>
                              Enterprise Follow-up
                            </div>
                            <div className="text-xs text-gray-600" style={{ fontFamily: 'SF Pro Text, system-ui, sans-serif' }}>
                              856 contacts • 31.2% reply
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold" style={{ fontFamily: 'SF Pro Text, system-ui, sans-serif' }}>
                            DONE
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Floating Gradient Blur */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute -right-80 top-1/2 -translate-y-1/2 w-[800px] h-[400px] opacity-60"
              style={{
                background: `
                  radial-gradient(ellipse 60% 80% at 30% 50%, rgba(31, 190, 57, 0.3) 0%, transparent 70%),
                  radial-gradient(ellipse 80% 60% at 70% 30%, rgba(24, 106, 229, 0.4) 0%, transparent 70%),
                  radial-gradient(ellipse 70% 70% at 50% 70%, rgba(147, 51, 234, 0.2) 0%, transparent 60%),
                  radial-gradient(ellipse 90% 50% at 20% 80%, rgba(31, 190, 57, 0.2) 0%, transparent 80%),
                  radial-gradient(ellipse 50% 90% at 80% 60%, rgba(24, 106, 229, 0.3) 0%, transparent 75%)
                `,
                filter: "blur(120px)",
                transform: "scale(1.2)",
              }}
            />
          </div>

          {/* How It Works Content */}
          <div className="mt-32">
            {/* Section Label */}
            <motion.div 
              className="mb-30"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerItem}
            >
              <p className="text-[40px] text-gray-700 font-normal lowercase tracking-widest">
                how it works
              </p>
            </motion.div>

            <motion.div 
              className="grid md:grid-cols-3 gap-12"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {/* Step 1 */}
              <motion.div 
                className="text-center"
                variants={staggerItem}
              >
                <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-bold">
                  1
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Upload & Setup</h3>
                <p className="text-gray-600 leading-relaxed">
                  Import your contact list and create email templates. 
                  Our AI helps you write compelling subject lines and personalized messages.
                </p>
              </motion.div>

              {/* Step 2 */}
              <motion.div 
                className="text-center"
                variants={staggerItem}
              >
                <div className="bg-green-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-8 h-8 text-green-600" />
                </div>
                <div className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-bold">
                  2
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Automate & Send</h3>
                <p className="text-gray-600 leading-relaxed">
                  Set up email sequences and let LeadFlow automatically send personalized emails 
                  at optimal times for maximum open rates.
                </p>
              </motion.div>

              {/* Step 3 */}
              <motion.div 
                className="text-center"
                variants={staggerItem}
              >
                <div className="bg-purple-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                </div>
                <div className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-bold">
                  3
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Track & Optimize</h3>
                <p className="text-gray-600 leading-relaxed">
                  Monitor reply rates, track conversions, and optimize your campaigns 
                  with detailed analytics and A/B testing.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-40 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          
          {/* Header with Rounded Gradient Box */}
          <motion.div 
            className="text-center mb-20"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {/* Rounded Gradient Container */}
            <div className="relative mx-auto w-full max-w-6xl">
              <motion.div 
                className="relative rounded-[3rem] p-20 lg:p-32 overflow-hidden min-h-[500px] flex items-center justify-center"
                style={{
                  background: `
                    radial-gradient(ellipse 60% 40% at 20% 30%, rgba(31, 190, 57, 0.15) 0%, transparent 50%),
                    radial-gradient(ellipse 50% 60% at 80% 20%, rgba(24, 106, 229, 0.2) 0%, transparent 50%),
                    radial-gradient(ellipse 70% 50% at 50% 80%, rgba(147, 51, 234, 0.15) 0%, transparent 50%),
                    radial-gradient(ellipse 80% 30% at 10% 70%, rgba(31, 190, 57, 0.1) 0%, transparent 60%),
                    radial-gradient(ellipse 40% 70% at 90% 60%, rgba(24, 106, 229, 0.15) 0%, transparent 50%),
                    linear-gradient(135deg, #000000 0%, #0f0f0f 25%, #000000 50%, #1a1a1a 75%, #000000 100%)
                  `,
                  filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.3))'
                }}
                variants={staggerItem}
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ 
                  scale: 1, 
                  opacity: 1,
                  boxShadow: [
                    "0 25px 50px rgba(0, 0, 0, 0.3)",
                    "0 35px 70px rgba(31, 190, 57, 0.2), 0 45px 90px rgba(24, 106, 229, 0.15)",
                    "0 25px 50px rgba(0, 0, 0, 0.3)"
                  ]
                }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 1.2, 
                  ease: "easeOut",
                  boxShadow: {
                    duration: 2,
                    times: [0, 0.5, 1],
                    ease: "easeInOut"
                  }
                }}
                whileHover={{
                  scale: 1.02,
                  boxShadow: "0 35px 70px rgba(31, 190, 57, 0.15), 0 45px 90px rgba(24, 106, 229, 0.1)"
                }}
              >
                {/* Subtle animated overlay */}
                <div 
                  className="absolute inset-0 opacity-30"
                  style={{
                    background: `
                      radial-gradient(circle at 30% 40%, rgba(31, 190, 57, 0.1) 0%, transparent 40%),
                      radial-gradient(circle at 70% 60%, rgba(24, 106, 229, 0.1) 0%, transparent 40%),
                      radial-gradient(circle at 50% 80%, rgba(147, 51, 234, 0.08) 0%, transparent 40%)
                    `
                  }}
                />

                {/* Content */}
                <div className="relative z-10 text-center max-w-5xl mx-auto">
                  <motion.h2 
                    className="text-5xl lg:text-7xl font-bold text-white mb-8 leading-tight"
                    variants={staggerItem}
                    initial={{ y: 30, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                  >
                    Everything You Need for 
                    <span 
                      className="block mt-2"
                      style={{
                        background: 'linear-gradient(135deg, #1fbe39 0%, #186ae5 70%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}
                    >
                      Cold Email Success
                    </span>
                  </motion.h2>
                  
                  <motion.p 
                    className="text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto"
                    variants={staggerItem}
                    initial={{ y: 20, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                  >
                    From lead management to AI-powered personalization, LeadFlow provides everything you need to run successful cold email campaigns at scale.
                  </motion.p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Lead Management Section */}
      <section className="bg-white py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div 
            className="grid lg:grid-cols-2 gap-20 items-center"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {/* Text Content - Left */}
            <motion.div 
              className="space-y-8"
              variants={staggerItem}
            >
              <div className="flex items-center space-x-4 mb-6">
                <h2 className="text-5xl font-bold">
                  <span className="text-gray-900">Lead </span>
                  <span 
                    style={{
                      background: 'linear-gradient(135deg, #1fbe39 0%, #186ae5 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    Management
                  </span>
                </h2>
              </div>
              
              <p className="text-xl text-gray-600 leading-relaxed">
                Import and organize your contacts with CSV upload, automatic deduplication, and smart segmentation tools.
              </p>
            </motion.div>

            {/* Mac Window - Right */}
            <motion.div 
              className="relative w-full max-w-2xl mx-auto"
              variants={staggerItem}
            >
              <div className="bg-gray-100 rounded-xl shadow-2xl overflow-hidden border border-gray-200">
                {/* Mac Title Bar */}
                <div className="bg-gray-200 px-4 py-3 flex items-center space-x-2 border-b border-gray-300">
                  <div className="flex space-x-1.5">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-gray-600 text-sm font-medium">Lead Management</span>
                  </div>
                </div>

                {/* Window Content */}
                <div className="bg-white p-8">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-gray-900">Contacts</h3>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                        Import CSV
                      </button>
                    </div>

                    {/* Contact List */}
                    <div className="space-y-3">
                      {[
                        { name: "Sarah Johnson", email: "sarah@company.com", status: "Active", tag: "SaaS" },
                        { name: "Mike Chen", email: "mike@startup.io", status: "Replied", tag: "Enterprise" },
                        { name: "Emma Davis", email: "emma@tech.co", status: "Pending", tag: "SMB" },
                        { name: "Alex Rivera", email: "alex@growth.com", status: "Active", tag: "SaaS" }
                      ].map((contact, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-semibold text-sm">
                                {contact.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 text-sm">{contact.name}</div>
                              <div className="text-xs text-gray-600">{contact.email}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              contact.status === 'Active' ? 'bg-green-100 text-green-700' :
                              contact.status === 'Replied' ? 'bg-blue-100 text-blue-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {contact.status}
                            </span>
                            <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs">
                              {contact.tag}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Automated Sequences Section */}
      <section className="bg-gray-50 py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div 
            className="grid lg:grid-cols-2 gap-20 items-center"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {/* Mac Window - Left */}
            <motion.div 
              className="relative w-full max-w-2xl mx-auto order-2 lg:order-1"
              variants={staggerItem}
            >
              <div className="bg-gray-100 rounded-xl shadow-2xl overflow-hidden border border-gray-200">
                {/* Mac Title Bar */}
                <div className="bg-gray-200 px-4 py-3 flex items-center space-x-2 border-b border-gray-300">
                  <div className="flex space-x-1.5">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-gray-600 text-sm font-medium">Email Sequences</span>
                  </div>
                </div>

                {/* Window Content */}
                <div className="bg-white p-8">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-gray-900">Campaign Sequence</h3>
                      <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                        Add Step
                      </button>
                    </div>

                    {/* Sequence Steps */}
                    <div className="space-y-4">
                      {[
                        { step: 1, title: "Initial Outreach", delay: "Day 1", status: "sent" },
                        { step: 2, title: "Follow-up #1", delay: "Day 4", status: "scheduled" },
                        { step: 3, title: "Value Proposition", delay: "Day 8", status: "draft" },
                        { step: 4, title: "Final Touch", delay: "Day 15", status: "draft" }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg border">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                            item.status === 'sent' ? 'bg-green-500' :
                            item.status === 'scheduled' ? 'bg-blue-500' :
                            'bg-gray-400'
                          }`}>
                            {item.step}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 text-sm">{item.title}</div>
                            <div className="text-xs text-gray-600">{item.delay}</div>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            item.status === 'sent' ? 'bg-green-100 text-green-700' :
                            item.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {item.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Text Content - Right */}
            <motion.div 
              className="space-y-8 order-1 lg:order-2"
              variants={staggerItem}
            >
              <div className="flex items-center space-x-4 mb-6">
                <h2 className="text-5xl font-bold">
                  <span 
                    style={{
                      background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    Automated 
                  </span>
                  <span 
                    style={{
                      background: 'linear-gradient(135deg, #1fbe39 0%, #186ae5 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    {' '}Sequences
                  </span>
                </h2>
              </div>
              
              <p className="text-xl text-gray-600 leading-relaxed">
                Create multi-step email campaigns with personalized templates and smart follow-ups that convert prospects into customers.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* AI Personalization Section */}
      <section className="bg-white py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div 
            className="grid lg:grid-cols-2 gap-20 items-center"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {/* Text Content - Left */}
            <motion.div 
              className="space-y-8"
              variants={staggerItem}
            >
              <div className="flex items-center space-x-4 mb-6">
                <h2 className="text-5xl font-bold">
                  <span 
                    style={{
                      background: 'linear-gradient(135deg, #000000 0%, #2a2a2a 70%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    AI 
                  </span>
                  <span 
                    style={{
                      background: 'linear-gradient(135deg, #9333ea 0%, #1fbe39 50%, #186ae5 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                     &nbsp;Personalization
                  </span>
                </h2>
              </div>
              
              <p className="text-xl text-gray-600 leading-relaxed">
                Leverage advanced AI to personalize emails at scale with dynamic content, smart templates, and intelligent subject lines that increase open rates by 40%.
              </p>
            </motion.div>

            {/* Mac Window - Right */}
            <motion.div 
              className="relative w-full max-w-2xl mx-auto"
              variants={staggerItem}
            >
              <div className="bg-gray-100 rounded-xl shadow-2xl overflow-hidden border border-gray-200">
                {/* Mac Title Bar */}
                <div className="bg-gray-200 px-4 py-3 flex items-center space-x-2 border-b border-gray-300">
                  <div className="flex space-x-1.5">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-gray-600 text-sm font-medium">AI Email Generator</span>
                  </div>
                </div>

                {/* Window Content */}
                <div className="bg-white p-8">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-gray-900">AI Email Assistant</h3>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-green-600 font-medium">AI Active</span>
                      </div>
                    </div>

                    {/* AI Suggestions */}
                    <div className="space-y-4">
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Brain className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-semibold text-purple-700">AI Suggestion</span>
                        </div>
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">Subject:</span> "Quick question about {'{'}company_name{'}'}'s recent funding round"
                        </p>
                        <div className="mt-2 flex items-center space-x-2">
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">+42% open rate</span>
                          <button className="text-xs text-purple-600 hover:text-purple-700 font-medium">Use this</button>
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Brain className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-700">Personalization</span>
                        </div>
                        <p className="text-sm text-gray-700">
                          "Hi {'{'}first_name{'}'}, I noticed {'{'}company_name{'}'} just expanded to {'{'}location{'}'}. Congratulations on the growth!"
                        </p>
                        <div className="mt-2">
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Dynamic content</span>
                        </div>
                      </div>

                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Brain className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-semibold text-green-700">Tone Analysis</span>
                        </div>
                        <p className="text-sm text-gray-700">
                          Your email tone: Professional & Friendly
                        </p>
                        <div className="mt-2 flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full w-4/5"></div>
                          </div>
                          <span className="text-xs text-green-600">Optimized</span>
                        </div>
                      </div>
                    </div>

                    {/* Generate Button */}
                    <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-medium text-sm hover:from-purple-700 hover:to-blue-700 transition-all">
                      Generate Personalized Email
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-gray-50 py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          
          {/* Header */}
          <motion.div 
            className="text-center mb-16"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 
              className="text-5xl lg:text-6xl font-bold mb-6"
              variants={staggerItem}
            >
              <span className="text-gray-900">Simple, </span>
              <span 
                style={{
                  background: 'linear-gradient(135deg, #1fbe39 0%, #186ae5 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Transparent Pricing
              </span>
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-600 max-w-3xl mx-auto"
              variants={staggerItem}
            >
              Choose the perfect plan for your business. Start with our free trial and upgrade when you're ready to scale.
            </motion.p>
          </motion.div>

          {/* Billing Toggle */}
          <motion.div 
            className="flex justify-center mb-12"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerItem}
          >
            <div className="bg-gray-100 p-1 rounded-lg">
              <div className="flex">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${
                    billingCycle === 'monthly'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-6 py-2 text-sm font-medium rounded-md transition-colors relative ${
                    billingCycle === 'yearly'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Yearly
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    Save {getDiscountPercentage()}%
                  </span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Pricing Cards */}
          <motion.div 
            className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                className={`relative bg-white rounded-3xl shadow-xl border-2 p-8 ${
                  plan.popular 
                    ? 'border-blue-500 ring-4 ring-blue-100' 
                    : 'border-gray-200'
                }`}
                variants={staggerItem}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  
                  <div className="mb-4">
                    <span className="text-5xl font-bold text-gray-900">
                      ${billingCycle === 'monthly' ? plan.monthly : plan.yearly}
                    </span>
                    <span className="text-gray-600 text-xl">
                      /{billingCycle === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>

                  {billingCycle === 'yearly' && (
                    <p className="text-green-600 font-semibold">
                      Save ${(plan.monthly * 12) - plan.yearly} per year
                    </p>
                  )}
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link 
                  href="/auth/sign-up"
                  className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl block text-center ${
                    plan.popular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                  }`}
                >
                  Start Free Trial
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Bottom CTA */}
          <motion.div 
            className="text-center mt-12"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerItem}
          >
            <p className="text-gray-600 mb-4">
              All plans include a 14-day free trial. No credit card required.
            </p>
            <div className="flex items-center justify-center space-x-6">
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">Cancel anytime</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">No setup fees</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">24/7 support</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative overflow-hidden">
        {/* Swirling Gradient Background */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 20% 0%, rgba(31, 190, 57, 0.3) 0%, transparent 50%),
              radial-gradient(ellipse 60% 80% at 80% 50%, rgba(24, 106, 229, 0.4) 0%, transparent 50%),
              radial-gradient(ellipse 100% 60% at 40% 100%, rgba(147, 51, 234, 0.3) 0%, transparent 50%),
              radial-gradient(ellipse 120% 40% at 90% 10%, rgba(31, 190, 57, 0.2) 0%, transparent 60%),
              radial-gradient(ellipse 70% 90% at 10% 80%, rgba(24, 106, 229, 0.3) 0%, transparent 50%),
              linear-gradient(135deg, #000000 0%, #0a0a0a 25%, #000000 50%, #0f0f0f 75%, #000000 100%)
            `
          }}
        />
        
        {/* Animated Swirl Overlays */}
        <div className="absolute inset-0 z-1">
          <div 
            className="absolute w-96 h-96 opacity-20 animate-spin"
            style={{
              top: '10%',
              left: '10%',
              background: 'conic-gradient(from 0deg, transparent, rgba(31, 190, 57, 0.4), transparent, rgba(24, 106, 229, 0.3), transparent)',
              borderRadius: '50%',
              animationDuration: '20s',
              filter: 'blur(60px)'
            }}
          />
          <div 
            className="absolute w-80 h-80 opacity-15 animate-spin"
            style={{
              top: '40%',
              right: '5%',
              background: 'conic-gradient(from 180deg, transparent, rgba(147, 51, 234, 0.4), transparent, rgba(31, 190, 57, 0.3), transparent)',
              borderRadius: '50%',
              animationDuration: '15s',
              animationDirection: 'reverse',
              filter: 'blur(80px)'
            }}
          />
          <div 
            className="absolute w-72 h-72 opacity-25 animate-spin"
            style={{
              bottom: '20%',
              left: '30%',
              background: 'conic-gradient(from 90deg, transparent, rgba(24, 106, 229, 0.5), transparent, rgba(147, 51, 234, 0.3), transparent)',
              borderRadius: '50%',
              animationDuration: '25s',
              filter: 'blur(40px)'
            }}
          />
        </div>

        {/* CTA Content */}
        <div className="relative z-10 py-32">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <motion.div 
              className="text-center"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {/* Main Headline */}
              <motion.h2 
                className="text-6xl lg:text-7xl font-bold mb-8 leading-tight"
                variants={staggerItem}
              >
                <span className="text-white">Stop Sending Cold Emails </span>
                <span 
                  style={{
                    background: 'linear-gradient(135deg, #1fbe39 0%, #186ae5 70%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  Manually
                </span>
              </motion.h2>
              
              {/* Subheading */}
              <motion.p 
                className="text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed"
                variants={staggerItem}
              >
                Automate your entire cold email process and focus on closing deals instead of writing emails.
              </motion.p>
              
              {/* CTA Buttons */}
              <motion.div 
                className="flex flex-col sm:flex-row items-center justify-center gap-6"
                variants={staggerItem}
              >
                <Link 
                  href="/auth/sign-up" 
                  className="inline-flex items-center bg-blue-600 text-white px-12 py-5 rounded-2xl text-xl font-bold hover:bg-blue-700 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 relative z-20"
                >
                  Start Free Trial
                </Link>
                <Link 
                  href="#pricing" 
                  className="inline-flex items-center bg-transparent border-2 border-white text-white px-12 py-5 rounded-2xl text-xl font-bold hover:bg-white hover:text-black transition-all transform hover:scale-105 relative z-20"
                >
                  View Pricing
                </Link>
              </motion.div>

              {/* Bottom Benefits */}
              <motion.div 
                className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-12 pt-12"
                variants={staggerItem}
              >
                <div className="flex items-center space-x-3">
                  <Check className="w-6 h-6 text-green-400" />
                  <span className="text-gray-300 text-lg font-medium">14 days free trial</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-6 h-6 text-green-400" />
                  <span className="text-gray-300 text-lg font-medium">No credit card required</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-6 h-6 text-green-400" />
                  <span className="text-gray-300 text-lg font-medium">Setup in 10 minutes</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Footer Content */}
        <footer className="relative z-10">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            
            {/* Main Footer Content */}
            <div className="py-16">
              <motion.div 
                className="grid lg:grid-cols-4 md:grid-cols-2 gap-12"
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                variants={staggerContainer}
              >
                
                {/* Logo & Description */}
                <motion.div 
                  className="lg:col-span-2"
                  variants={staggerItem}
                >
                  <div className="mb-6">
                    <Image
                      src="/leadflow.png" 
                      alt="Leadflow"
                      width={260}
                      height={60}
                      className="h-16 w-auto brightness-0 invert"
                    />
                  </div>
                  <p className="text-gray-400 text-lg leading-relaxed mb-6 max-w-md">
                    The most powerful cold email automation platform. Scale your outreach and focus on closing deals.
                  </p>
                  
                  {/* Trust Elements */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400 text-sm">GDPR Compliant</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400 text-sm">SOC 2 Certified</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400 text-sm">Stripe Secure</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400 text-sm">256-bit SSL</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Product Links */}
                <motion.div variants={staggerItem}>
                  <h3 className="text-white font-bold text-lg mb-6">Product</h3>
                  <ul className="space-y-4">
                    <li>
                      <Link href="#features" className="text-gray-400 hover:text-white transition-colors">
                        Features
                      </Link>
                    </li>
                    <li>
                      <Link href="#pricing" className="text-gray-400 hover:text-white transition-colors">
                        Pricing
                      </Link>
                    </li>
                  </ul>
                </motion.div>

                {/* Support Links */}
                <motion.div variants={staggerItem}>
                  <h3 className="text-white font-bold text-lg mb-6">Support</h3>
                  <ul className="space-y-4">
                    <li>
                      <Link href="/help" className="text-gray-400 hover:text-white transition-colors">
                        Help Center
                      </Link>
                    </li>
                    <li>
                      <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                        Contact Us
                      </Link>
                    </li>
                  </ul>
                </motion.div>
              </motion.div>
            </div>

            {/* Bottom Section */}
            <motion.div 
              className="border-t border-gray-800 py-8"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerItem}
            >
              <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
                
                {/* Copyright */}
                <div className="text-gray-400 text-sm">
                  © {new Date().getFullYear()} LeadFlow. All rights reserved.
                </div>

                {/* Legal Links */}
                <div className="flex flex-wrap items-center space-x-8">
                  <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Privacy Policy
                  </Link>
                  <Link href="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Terms of Service
                  </Link>
                  <Link href="/cookies" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Cookie Policy
                  </Link>
                  <Link href="/security" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Security
                  </Link>
                </div>

                {/* Trust Badges */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 bg-gray-800 px-3 py-1 rounded-full">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-gray-400 text-xs">99.9% Uptime</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-gray-800 px-3 py-1 rounded-full">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-gray-400 text-xs">Enterprise Ready</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </footer>
      </section>

    </div>
  );
}