// ./app/page.tsx
'use client'

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Upload, Zap, BarChart3, Users, Mail, Brain, Play, Star, Quote, Twitter, Linkedin, Github, Globe, Shield, Send, MessageSquare, Target, TrendingUp, Eye, MousePointer, Inbox, FileText, Settings, HeadphonesIcon } from "lucide-react";
import { useState } from "react";

// Theme colors - consistent with dashboard
const THEME_COLORS = {
  primary: '#0f66db',     // Main blue
  success: '#25b43d',     // Green
  secondary: '#6366f1',   // Indigo
  accent: '#059669',      // Emerald
  warning: '#dc2626'      // Red
}

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
      description: 'Perfect for individual sales professionals',
      monthlyEmails: '10,000',
      features: [
        '1 user, unlimited sending domains',
        '10,000 emails/month',
        'Unlimited AI generator & personalization',
        'AI subject lines & follow-up suggestions',
        'Central inbox (Unibox)',
        'Advanced analytics dashboard',
        'Email & chat support'
      ]
    },
    {
      id: 'growth',
      name: 'Growth',
      monthly: 99,
      yearly: 990,
      description: 'Best for growing sales teams',
      monthlyEmails: '100,000',
      features: [
        '3 users, unlimited sending domains',
        '100,000 emails/month',
        'Unlimited AI generator & personalization',
        'AI subject lines & follow-up suggestions',
        'Central inbox (Unibox)',
        'Advanced analytics dashboard',
        'Priority support (chat + email)'
      ],
      popular: true
    },
    {
      id: 'pro',
      name: 'Pro',
      monthly: 299,
      yearly: 2990,
      description: 'For enterprise teams at scale',
      monthlyEmails: '500,000',
      features: [
        '10 users, unlimited sending domains',
        '500,000 emails/month',
        'Unlimited AI generator & personalization',
        'AI subject lines & follow-up suggestions',
        'Central inbox (Unibox)',
        'Advanced analytics dashboard',
        'Dedicated account manager + premium support'
      ]
    }
  ];

  const getDiscountPercentage = () => {
    const starter = plans.find(p => p.id === 'starter')!
    const discount = ((starter.monthly * 12 - starter.yearly) / (starter.monthly * 12)) * 100
    return Math.round(discount)
  }

  // Social media links
  const socialLinks = [
    { name: 'Twitter', icon: Twitter, url: 'https://twitter.com/leadflow', color: 'hover:text-blue-400' },
    { name: 'LinkedIn', icon: Linkedin, url: 'https://linkedin.com/company/leadflow', color: 'hover:text-blue-600' },
    { name: 'GitHub', icon: Github, url: 'https://github.com/leadflow', color: 'hover:text-gray-600' },
    { name: 'Website', icon: Globe, url: 'https://leadflow.com', color: 'hover:text-green-500' }
  ];

  // Client logos for social proof
  const clientLogos = [
    { name: 'TechFlow', logo: '/logos/techflow.png' },
    { name: 'GrowthLabs', logo: '/logos/growthlabs.png' },
    { name: 'ScaleUp Inc', logo: '/logos/scaleup.png' },
    { name: 'DataCorp', logo: '/logos/datacorp.png' },
    { name: 'CloudTech', logo: '/logos/cloudtech.png' },
    { name: 'SalesForce Pro', logo: '/logos/salesforce-pro.png' }
  ];

  // Updated testimonials with better social proof
  const testimonials = [
    {
      id: 1,
      content: "LeadFlow completely transformed our outreach. We went from 12% to 44% reply rates in just 3 weeks. The AI personalization is incredible - it's like having a team of copywriters working 24/7.",
      author: "Sarah Chen",
      title: "VP of Sales",
      company: "TechFlow",
      avatar: "/avatars/sarah.jpg",
      rating: 5,
      results: "+267% reply rate increase"
    },
    {
      id: 2,
      content: "Setting up campaigns used to take our team hours. Now I can launch a new sequence in under 5 minutes. The automation handles everything perfectly, and our conversion rates have never been higher.",
      author: "Marcus Rodriguez",
      title: "Sales Director", 
      company: "GrowthLabs",
      avatar: "/avatars/marcus.jpg",
      rating: 5,
      results: "5x faster campaign setup"
    },
    {
      id: 3,
      content: "The analytics dashboard gives us insights we never had before. We can optimize our campaigns in real-time and see immediate improvements. ROI increased 340% in the first quarter.",
      author: "Emily Watson",
      title: "Head of Business Development",
      company: "ScaleUp Inc",
      avatar: "/avatars/emily.jpg",
      rating: 5,
      results: "+340% ROI increase"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <motion.header 
        className="bg-white py-6 sticky top-0 z-50 border-b border-gray-100"
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
                className="text-white px-8 py-3 rounded-xl hover:shadow-lg transition-all font-semibold text-lg shadow-sm"
                style={{ backgroundColor: THEME_COLORS.primary }}
              >
                Sign Up
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="bg-white py-20 lg:py-28 relative overflow-hidden">
        {/* Floating Gradient Blur */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute -right-80 top-1/3 -translate-y-1/2 w-[1000px] h-[800px] opacity-70"
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

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          {/* Hero Content */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
            
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
                className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight"
                variants={fadeInLeft}
              >
                <span className="text-gray-900">Scale Your Cold Email </span>
                <span 
                  style={{
                    background: `linear-gradient(135deg, ${THEME_COLORS.success} 0%, ${THEME_COLORS.primary} 70%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  Outreach
                </span>
              </motion.h1>
              
              <motion.p 
                className="text-lg sm:text-xl lg:text-[22px] text-gray-600 font-normal leading-relaxed"
                variants={fadeInLeft}
              >
                Launch campaigns in under 5 minutes and get +32% reply rates with AI-powered personalization. 
                LeadFlow automates your entire outreach process.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 pt-4"
                variants={fadeInLeft}
              >
                <Link 
                  href="/auth/sign-up" 
                  className="inline-flex items-center justify-center text-white px-8 sm:px-12 py-4 sm:py-5 rounded-2xl text-lg sm:text-xl font-bold hover:shadow-xl transition-all transform hover:scale-105"
                  style={{ backgroundColor: THEME_COLORS.primary }}
                >
                  Start Free Trial
                </Link>
                <button className="inline-flex items-center justify-center bg-transparent border-2 border-gray-300 text-gray-700 px-8 sm:px-12 py-4 sm:py-5 rounded-2xl text-lg sm:text-xl font-bold hover:bg-gray-50 transition-all transform hover:scale-105">
                  <Play className="w-5 h-5 mr-2" />
                  Watch Demo
                </button>
              </motion.div>

              {/* Trial Benefits */}
              <motion.div 
                className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-8 pt-2"
                variants={fadeInLeft}
              >
                <div className="flex items-center space-x-2">
                  <Check className="w-5 h-5" style={{ color: THEME_COLORS.success }} />
                  <span className="text-gray-600 font-medium">14 days free trial</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-5 h-5" style={{ color: THEME_COLORS.success }} />
                  <span className="text-gray-600 font-medium">No credit card required</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Dashboard Image - Right */}
            <motion.div 
              className="relative"
              variants={fadeInRight}
              initial="initial"
              animate="animate"
            >
              {/* Laptop Frame */}
              <div className="relative">
                <div className="bg-gray-800 rounded-t-2xl p-2">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="relative rounded-xl overflow-hidden shadow-2xl border border-gray-200">
                    <Image
                      src="/dashboard.png"
                      alt="LeadFlow Dashboard"
                      width={2000}
                      height={1200}
                      className="w-full h-auto"
                      priority
                      quality={95}
                    />
                  </div>
                </div>
                <div className="bg-gray-700 h-6 rounded-b-2xl"></div>
              </div>
            </motion.div>
          </div>

          {/* Social Proof - Client Logos */}
          <motion.div 
            className="mb-20"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.p 
              className="text-center text-gray-500 mb-8 text-sm font-medium"
              variants={staggerItem}
            >
              Trusted by 1000+ sales teams worldwide
            </motion.p>
            <motion.div 
              className="flex flex-wrap justify-center items-center gap-8 lg:gap-12 opacity-60"
              variants={staggerItem}
            >
              {clientLogos.map((client, index) => (
                <div key={index} className="text-gray-400 font-bold text-lg">
                  {client.name}
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Social Links */}
          <motion.div 
            className="mb-20"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.p 
              className="text-center text-gray-500 mb-8 text-sm font-medium"
              variants={staggerItem}
            >
              Connect with us
            </motion.p>
            <motion.div 
              className="flex justify-center items-center gap-8"
              variants={staggerItem}
            >
              {socialLinks.map((link, index) => (
                <Link 
                  key={index} 
                  href={link.url}
                  className={`p-3 rounded-full bg-gray-100 text-gray-600 transition-all hover:scale-110 ${link.color}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <link.icon className="w-6 h-6" />
                </Link>
              ))}
            </motion.div>
          </motion.div>

          {/* Enhanced Testimonials */}
          <motion.div 
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-32"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-3xl p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-300"
                variants={staggerItem}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <div 
                    className="text-xs font-bold px-3 py-1 rounded-full text-white"
                    style={{ backgroundColor: THEME_COLORS.success }}
                  >
                    {testimonial.results}
                  </div>
                </div>
                <div className="mb-4">
                  <Quote className="w-8 h-8 opacity-30" style={{ color: THEME_COLORS.primary }} />
                </div>
                <p className="text-gray-700 mb-6 text-base leading-relaxed font-medium">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center">
                  <div 
                    className="w-12 h-12 rounded-full mr-4 flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${THEME_COLORS.primary} 0%, ${THEME_COLORS.secondary} 100%)` }}
                  >
                    <span className="text-white font-bold text-lg">
                      {testimonial.author.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{testimonial.author}</div>
                    <div className="text-sm text-gray-600">{testimonial.title}</div>
                    <div className="text-sm font-medium" style={{ color: THEME_COLORS.primary }}>{testimonial.company}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* How It Works Content */}
          <div className="mt-32">
            {/* Section Label */}
            <motion.div 
              className="mb-20"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerItem}
            >
              <p className="text-2xl sm:text-3xl lg:text-[40px] text-gray-700 font-normal lowercase tracking-widest text-center">
                how it works
              </p>
            </motion.div>

            <motion.div 
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12"
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
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                  style={{ backgroundColor: `${THEME_COLORS.primary}20` }}
                >
                  <Upload className="w-8 h-8" style={{ color: THEME_COLORS.primary }} />
                </div>
                <div 
                  className="text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-bold"
                  style={{ backgroundColor: THEME_COLORS.primary }}
                >
                  1
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Upload & Setup</h3>
                <p className="text-gray-600 leading-relaxed">
                  Import your contact list and create email templates. 
                  Our AI helps you write compelling subject lines and personalized messages in under 5 minutes.
                </p>
              </motion.div>

              {/* Step 2 */}
              <motion.div 
                className="text-center"
                variants={staggerItem}
              >
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                  style={{ backgroundColor: `${THEME_COLORS.success}20` }}
                >
                  <Zap className="w-8 h-8" style={{ color: THEME_COLORS.success }} />
                </div>
                <div 
                  className="text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-bold"
                  style={{ backgroundColor: THEME_COLORS.success }}
                >
                  2
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Automate & Send</h3>
                <p className="text-gray-600 leading-relaxed">
                  Set up email sequences and let LeadFlow automatically send personalized emails 
                  at optimal times for maximum open rates and +32% reply rates.
                </p>
              </motion.div>

              {/* Step 3 */}
              <motion.div 
                className="text-center"
                variants={staggerItem}
              >
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                  style={{ backgroundColor: `${THEME_COLORS.secondary}20` }}
                >
                  <BarChart3 className="w-8 h-8" style={{ color: THEME_COLORS.secondary }} />
                </div>
                <div 
                  className="text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-bold"
                  style={{ backgroundColor: THEME_COLORS.secondary }}
                >
                  3
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Track & Optimize</h3>
                <p className="text-gray-600 leading-relaxed">
                  Monitor reply rates, track conversions, and optimize your campaigns 
                  with detailed analytics and A/B testing to continuously improve results.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section - Redesigned */}
      <section className="bg-white py-32 lg:py-40 relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[600px] opacity-40"
            style={{
              background: `
                radial-gradient(ellipse 60% 80% at 30% 50%, rgba(31, 190, 57, 0.2) 0%, transparent 70%),
                radial-gradient(ellipse 80% 60% at 70% 30%, rgba(24, 106, 229, 0.3) 0%, transparent 70%),
                radial-gradient(ellipse 70% 70% at 50% 70%, rgba(147, 51, 234, 0.15) 0%, transparent 60%)
              `,
              filter: "blur(100px)",
            }}
          /> 
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          
          {/* Simple Clean Header */}
          <motion.div 
            className="text-center mb-20"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
              variants={staggerItem}
            >
              <span className="text-gray-900">Everything You Need for </span>
              <span 
                className="block"
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
              className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto"
              variants={staggerItem}
            >
              From lead management to AI-powered personalization, LeadFlow provides everything you need to run successful cold email campaigns at scale.
            </motion.p>

            {/* Feature Grid */}
            <motion.div 
              className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mt-16"
              variants={staggerContainer}
            >
              {[
                { icon: Users, title: "Contact Management", desc: "Import, organize, and segment up to 50,000 contacts", color: THEME_COLORS.primary },
                { icon: Mail, title: "Email Sequences", desc: "Automated multi-step campaigns with smart timing", color: THEME_COLORS.success },
                { icon: Brain, title: "AI Personalization", desc: "Dynamic content that increases reply rates by 32%", color: THEME_COLORS.secondary },
                { icon: BarChart3, title: "Advanced Analytics", desc: "Real-time tracking and optimization insights", color: THEME_COLORS.accent }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="bg-white border border-gray-100 rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300"
                  variants={staggerItem}
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: `linear-gradient(135deg, ${feature.color} 0%, ${THEME_COLORS.secondary} 100%)` }}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Contact Management Section */}
      <section id="features" className="bg-white py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div 
            className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center"
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
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                  <span className="text-gray-900">Contact </span>
                  <span 
                    style={{
                      background: `linear-gradient(135deg, ${THEME_COLORS.success} 0%, ${THEME_COLORS.primary} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    Management
                  </span>
                </h2>
              </div>
              
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
                Import and organize your contacts with CSV upload, automatic deduplication, and smart segmentation tools. 
                Manage up to 50,000 contacts with advanced filtering.
              </p>

              {/* Key Features */}
              <div className="space-y-4">
                {[
                  { icon: Upload, text: "One-click CSV import with automatic field mapping" },
                  { icon: Shield, text: "Smart deduplication prevents sending duplicates" },
                  { icon: Target, text: "Advanced segmentation and tagging system" }
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${THEME_COLORS.primary}20` }}
                    >
                      <feature.icon className="w-4 h-4" style={{ color: THEME_COLORS.primary }} />
                    </div>
                    <span className="text-gray-700">{feature.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Contacts Screenshot in Laptop Frame */}
            <motion.div 
              className="relative w-full max-w-none mx-auto"
              variants={staggerItem}
            >
              <div className="relative">
                <div className="bg-gray-800 rounded-t-2xl p-3">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="relative rounded-xl overflow-hidden shadow-2xl border border-gray-200">
                    <Image
                      src="/contacts.png"
                      alt="LeadFlow Contacts Management"
                      width={2000}
                      height={1200}
                      className="w-full h-auto"
                      quality={95}
                    />
                  </div>
                </div>
                <div className="bg-gray-700 h-6 rounded-b-2xl"></div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Campaign Management Section */}
      <section className="bg-gray-50 py-32 relative overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 w-[800px] h-[400px] opacity-30"
            style={{
              background: `
                radial-gradient(ellipse 70% 50% at 80% 50%, rgba(15, 102, 219, 0.2) 0%, transparent 70%),
                radial-gradient(ellipse 50% 70% at 20% 30%, rgba(37, 180, 61, 0.15) 0%, transparent 60%)
              `,
              filter: "blur(80px)",
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <motion.div 
            className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {/* Campaigns Screenshot in Desktop Frame */}
            <motion.div 
              className="relative w-full max-w-none mx-auto order-2 lg:order-1"
              variants={staggerItem}
            >
              <div className="relative">
                <div className="bg-gray-800 rounded-t-2xl p-3">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="relative rounded-xl overflow-hidden shadow-2xl border border-gray-200">
                    <Image
                      src="/campaigns.png"
                      alt="LeadFlow Campaigns"
                      width={2000}
                      height={1200}
                      className="w-full h-auto"
                      quality={95}
                    />
                  </div>
                </div>
                <div className="bg-gray-700 h-6 rounded-b-2xl"></div>
              </div>
            </motion.div>

            {/* Text Content - Right */}
            <motion.div 
              className="space-y-8 order-1 lg:order-2"
              variants={staggerItem}
            >
              <div className="flex items-center space-x-4 mb-6">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                  <span className="text-gray-900">Email </span>
                  <span 
                    style={{
                      background: `linear-gradient(135deg, ${THEME_COLORS.success} 0%, ${THEME_COLORS.primary} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    Sequences
                  </span>
                </h2>
              </div>
              
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
                Create unlimited automated email sequences with smart follow-ups. 
                Set precise timing, personalize at scale, and convert prospects into customers.
              </p>

              {/* Key Features */}
              <div className="space-y-4">
                {[
                  { icon: Send, text: "Multi-step sequences with intelligent delays" },
                  { icon: Brain, text: "AI-powered subject lines and content optimization" },
                  { icon: MessageSquare, text: "Automated follow-ups based on engagement" }
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${THEME_COLORS.success}20` }}
                    >
                      <feature.icon className="w-4 h-4" style={{ color: THEME_COLORS.success }} />
                    </div>
                    <span className="text-gray-700">{feature.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Analytics Section */}
      <section className="bg-white py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div 
            className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center"
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
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                  <span className="text-gray-900">Advanced </span>
                  <span 
                    style={{
                      background: `linear-gradient(135deg, ${THEME_COLORS.success} 0%, ${THEME_COLORS.primary} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    Analytics
                  </span>
                </h2>
              </div>
              
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
                Track every metric that matters. Monitor reply rates, open rates, click-through rates, and conversions 
                with real-time analytics and detailed reporting.
              </p>

              {/* Key Features */}
              <div className="space-y-4">
                {[
                  { icon: TrendingUp, text: "Real-time campaign performance tracking" },
                  { icon: Eye, text: "Detailed open and click analytics" },
                  { icon: FileText, text: "Exportable reports and insights" }
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${THEME_COLORS.secondary}20` }}
                    >
                      <feature.icon className="w-4 h-4" style={{ color: THEME_COLORS.secondary }} />
                    </div>
                    <span className="text-gray-700">{feature.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Analytics Screenshot in Desktop Frame */}
            <motion.div 
              className="relative w-full max-w-none mx-auto"
              variants={staggerItem}
            >
              <div className="relative">
                <div className="bg-gray-800 rounded-t-2xl p-3">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="relative rounded-xl overflow-hidden shadow-2xl border border-gray-200">
                    <Image
                      src="/analytics.png"
                      alt="LeadFlow Analytics Dashboard"
                      width={2000}
                      height={1200}
                      className="w-full h-auto"
                      quality={95}
                    />
                  </div>
                </div>
                <div className="bg-gray-700 h-6 rounded-b-2xl"></div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Additional Features Section */}
      <section className="bg-gray-50 py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 
              className="text-4xl sm:text-5xl font-bold mb-6"
              variants={staggerItem}
            >
              <span className="text-gray-900">More Power, </span>
              <span 
                style={{
                  background: `linear-gradient(135deg, ${THEME_COLORS.success} 0%, ${THEME_COLORS.primary} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                More Results
              </span>
            </motion.h2>
            <motion.p 
              className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto"
              variants={staggerItem}
            >
              Advanced features that help you outperform competitors and close more deals.
            </motion.p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              {
                icon: Inbox,
                title: "Unified Inbox",
                description: "Manage all replies in one centralized inbox with smart filtering and auto-categorization.",
                color: THEME_COLORS.primary
              },
              {
                icon: Shield,
                title: "Deliverability Monitor",
                description: "Real-time monitoring of SPF, DKIM, DMARC records and spam score optimization.",
                color: THEME_COLORS.success
              },
              {
                icon: Settings,
                title: "API & Webhooks",
                description: "Integrate with your CRM and tools using our powerful API and webhook system.",
                color: THEME_COLORS.secondary
              },
              {
                icon: Brain,
                title: "AI Content Generator",
                description: "Generate personalized email content, subject lines, and follow-ups with advanced AI.",
                color: THEME_COLORS.accent
              },
              {
                icon: HeadphonesIcon,
                title: "Premium Support",
                description: "24/7 dedicated support with account managers for Pro plans and priority assistance.",
                color: THEME_COLORS.warning
              },
              {
                icon: MousePointer,
                title: "Smart Sending",
                description: "Optimal send times based on recipient time zones and engagement patterns.",
                color: THEME_COLORS.primary
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300"
                variants={staggerItem}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: `${feature.color}20` }}
                >
                  <feature.icon className="w-7 h-7" style={{ color: feature.color }} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

            {/* Pricing Section */}
      <section id="pricing" className="bg-gray-50 py-32 relative overflow-hidden">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] opacity-30"
            style={{
              background: `
                radial-gradient(ellipse 60% 80% at 30% 50%, rgba(15, 102, 219, 0.2) 0%, transparent 70%),
                radial-gradient(ellipse 80% 60% at 70% 30%, rgba(37, 180, 61, 0.15) 0%, transparent 70%),
                radial-gradient(ellipse 70% 70% at 50% 70%, rgba(99, 102, 241, 0.1) 0%, transparent 60%)
              `,
              filter: "blur(80px)",
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          
          {/* Header */}
          <motion.div 
            className="text-center mb-16"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6"
              variants={staggerItem}
            >
              <span className="text-gray-900">Simple, </span>
              <span 
                style={{
                  background: `linear-gradient(135deg, ${THEME_COLORS.success} 0%, ${THEME_COLORS.primary} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Transparent Pricing
              </span>
            </motion.h2>
            <motion.p 
              className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto"
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
            <div className="bg-gray-100 p-1 rounded-xl">
              <div className="flex">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-6 py-3 text-sm font-semibold rounded-lg transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-6 py-3 text-sm font-semibold rounded-lg transition-all relative ${
                    billingCycle === 'yearly'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Yearly
                  <span 
                    className="absolute -top-2 -right-2 text-white text-xs px-2 py-1 rounded-full font-bold"
                    style={{ backgroundColor: THEME_COLORS.success }}
                  >
                    Save {getDiscountPercentage()}%
                  </span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Pricing Cards */}
          <motion.div 
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
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
                    ? 'scale-105 ring-4 ring-opacity-20' 
                    : 'border-gray-200'
                }`}
                style={{
                  borderColor: plan.popular ? THEME_COLORS.primary : undefined
                }}
                variants={staggerItem}
                whileHover={{ scale: plan.popular ? 1.05 : 1.02 }}
                transition={{ duration: 0.3 }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span 
                      className="text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg"
                      style={{ backgroundColor: THEME_COLORS.primary }}
                    >
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  
                  <div className="mb-2">
                    <span className="text-4xl lg:text-5xl font-bold text-gray-900">
                      ${billingCycle === 'monthly' ? plan.monthly : plan.yearly}
                    </span>
                    <span className="text-gray-600 text-lg lg:text-xl">
                      /{billingCycle === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>

                  {/* Monthly Email Limit */}
                  <div className="mb-4">
                    <div 
                      className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold text-white"
                      style={{ backgroundColor: `${THEME_COLORS.primary}20`, color: THEME_COLORS.primary }}
                    >
                      {plan.monthlyEmails} emails/month
                    </div>
                  </div>

                  {billingCycle === 'yearly' && (
                    <p className="font-semibold" style={{ color: THEME_COLORS.success }}>
                      Save ${(plan.monthly * 12) - plan.yearly} per year
                    </p>
                  )}
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 flex-shrink-0 mr-3 mt-0.5" style={{ color: THEME_COLORS.success }} />
                      <span className="text-gray-700 text-sm leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link 
                  href="/auth/sign-up"
                  className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl block text-center ${
                    plan.popular
                      ? 'text-white hover:shadow-2xl'
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                  }`}
                  style={{
                    backgroundColor: plan.popular ? THEME_COLORS.primary : undefined
                  }}
                >
                  Start Free Trial
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Bottom CTA */}
          <motion.div  
            className="text-center mt-16"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerItem}
          >
            <p className="text-gray-600 mb-6 text-lg">
              All plans include a 14-day free trial. No credit card required.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-8">
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5" style={{ color: THEME_COLORS.success }} />
                <span className="text-gray-600 font-medium">Cancel anytime</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5" style={{ color: THEME_COLORS.success }} />
                <span className="text-gray-600 font-medium">No setup fees</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5" style={{ color: THEME_COLORS.success }} />
                <span className="text-gray-600 font-medium">24/7 support</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gray-50 py-32 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          
          <motion.div 
            className="text-center mb-16"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 
              className="text-4xl sm:text-5xl font-bold mb-6"
              variants={staggerItem}
            >
              <span className="text-gray-900">Frequently Asked </span>
              <span 
                style={{
                  background: `linear-gradient(135deg, ${THEME_COLORS.success} 0%, ${THEME_COLORS.primary} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Questions
              </span>
            </motion.h2>
            <motion.p 
              className="text-lg text-gray-600"
              variants={staggerItem}
            >
              Everything you need to know about LeadFlow and cold email automation.
            </motion.p>
          </motion.div>

          <motion.div 
            className="space-y-6"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              {
                question: "How does LeadFlow ensure high deliverability?",
                answer: "We monitor SPF, DKIM, and DMARC records in real-time, provide spam score analysis, and use smart sending patterns to maintain your sender reputation. Our deliverability rate is consistently above 95%."
              },
              {
                question: "Can I cancel my subscription anytime?",
                answer: "Yes, absolutely. You can cancel your subscription at any time with no cancellation fees. Your account will remain active until the end of your billing period, and you'll retain access to all your data."
              },
              {
                question: "How do I set up my sending domains?",
                answer: "We provide step-by-step guidance for domain setup including DNS record configuration. Our support team can help you configure SPF, DKIM, and DMARC records to ensure optimal deliverability."
              },
              {
                question: "What's included in the 14-day free trial?",
                answer: "The free trial includes full access to all features of your chosen plan, including unlimited campaigns, AI personalization, analytics, and support. No credit card required to start."
              },
              {
                question: "How does the AI personalization work?",
                answer: "Our AI analyzes contact data, company information, and industry context to generate personalized email content, subject lines, and follow-up sequences that increase reply rates by an average of 32%."
              },
              {
                question: "Do you offer refunds?",
                answer: "Yes, we offer a 30-day money-back guarantee. If you're not satisfied with LeadFlow for any reason, contact our support team within 30 days for a full refund."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all"
                variants={staggerItem}
              >
                <h3 className="text-lg font-bold text-gray-900 mb-3">{faq.question}</h3>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Contact Support */}
          <motion.div 
            className="text-center mt-12"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerItem}
          >
            <p className="text-gray-600 mb-4">Still have questions?</p>
            <Link 
              href="/support/help"
              className="inline-flex items-center text-lg font-semibold hover:underline"
              style={{ color: THEME_COLORS.primary }}
            >
              Contact our support team
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 20% 0%, rgba(31, 190, 57, 0.3) 0%, transparent 50%),
              radial-gradient(ellipse 60% 80% at 80% 50%, rgba(24, 106, 229, 0.4) 0%, transparent 50%),
              radial-gradient(ellipse 100% 60% at 40% 100%, rgba(147, 51, 234, 0.3) 0%, transparent 50%),
              linear-gradient(135deg, #000000 0%, #0a0a0a 25%, #000000 50%, #0f0f0f 75%, #000000 100%)
            `
          }}
        />

        {/* CTA Content */}
        <div className="relative z-10 py-24 lg:py-32">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <motion.div 
              className="text-center"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.h2 
                className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-8 leading-tight"
                variants={staggerItem}
              >
                <span className="text-white">Stop Sending Cold Emails </span>
                <span 
                  style={{
                    background: `linear-gradient(135deg, ${THEME_COLORS.success} 0%, ${THEME_COLORS.primary} 70%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  Manually
                </span>
              </motion.h2>
              
              <motion.p 
                className="text-lg sm:text-xl lg:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed"
                variants={staggerItem}
              >
                Launch campaigns in under 5 minutes and achieve +32% reply rates with automated sequences.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row items-center justify-center gap-6"
                variants={staggerItem}
              >
                <Link 
                  href="/auth/sign-up" 
                  className="inline-flex items-center text-white px-8 sm:px-12 py-4 sm:py-5 rounded-2xl text-lg sm:text-xl font-bold transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
                  style={{ backgroundColor: THEME_COLORS.primary }}
                >
                  Start Free Trial
                </Link>
                <button className="inline-flex items-center bg-transparent border-2 border-white text-white px-8 sm:px-12 py-4 sm:py-5 rounded-2xl text-lg sm:text-xl font-bold hover:bg-white hover:text-black transition-all transform hover:scale-105">
                  <Play className="w-5 h-5 mr-2" />
                  Watch Demo
                </button>
              </motion.div>

              <motion.div 
                className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 lg:space-x-12 pt-12"
                variants={staggerItem}
              >
                <div className="flex items-center space-x-3">
                  <Check className="w-6 h-6" style={{ color: THEME_COLORS.success }} />
                  <span className="text-gray-300 text-base lg:text-lg font-medium">14 days free trial</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-6 h-6" style={{ color: THEME_COLORS.success }} />
                  <span className="text-gray-300 text-base lg:text-lg font-medium">No credit card required</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-6 h-6" style={{ color: THEME_COLORS.success }} />
                  <span className="text-gray-300 text-base lg:text-lg font-medium">Setup in 5 minutes</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <footer className="relative z-10">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            
            <div className="py-16">
              <motion.div 
                className="grid lg:grid-cols-5 md:grid-cols-2 gap-12"
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                variants={staggerContainer}
              >
                
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
                  
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400 text-sm">GDPR Ready</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400 text-sm">TLS/SSL Encrypted</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400 text-sm">Stripe Secure</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400 text-sm">99.9% Uptime</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

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
                    {/* <li>
                      <Link href="/templates" className="text-gray-400 hover:text-white transition-colors">
                        Templates
                      </Link>
                    </li> */}
                    {/* <li>
                      <Link href="/integrations" className="text-gray-400 hover:text-white transition-colors">
                        Integrations
                      </Link>
                    </li> */}
                  </ul>
                </motion.div>

                <motion.div variants={staggerItem}>
                  <h3 className="text-white font-bold text-lg mb-6">Support</h3>
                  <ul className="space-y-4">
                    <li>
                      <Link href="/support/help" className="text-gray-400 hover:text-white transition-colors">
                        Help Center
                      </Link>
                    </li>
                    {/* <li>
                      <Link href="/support/docs" className="text-gray-400 hover:text-white transition-colors">
                        Documentation
                      </Link>
                    </li> */}
                    <li>
                      <Link href="/support/contact" className="text-gray-400 hover:text-white transition-colors">
                        Contact Support
                      </Link>
                    </li>
                    {/* <li>
                      <Link href="/api" className="text-gray-400 hover:text-white transition-colors">
                        API Reference
                      </Link>
                    </li> */}
                  </ul>
                </motion.div>

                <motion.div variants={staggerItem}>
                  <h3 className="text-white font-bold text-lg mb-6">Legal</h3>
                  <ul className="space-y-4">
                    <li>
                      <Link href="/legal/privacy" className="text-gray-400 hover:text-white transition-colors">
                        Privacy Policy
                      </Link>
                    </li>
                    <li>
                      <Link href="/legal/terms" className="text-gray-400 hover:text-white transition-colors">
                        Terms of Service
                      </Link>
                    </li>
                    <li>
                      <Link href="/legal/security" className="text-gray-400 hover:text-white transition-colors">
                        Security
                      </Link>
                    </li>
                    <li>
                      <Link href="/legal/gdpr" className="text-gray-400 hover:text-white transition-colors">
                        GDPR Compliance
                      </Link>
                    </li>
                  </ul>
                </motion.div>
              </motion.div>
            </div>

            <motion.div 
              className="border-t border-gray-800 py-8"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerItem}
            >
              <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
                
                <div className="text-gray-400 text-sm">
                  © {new Date().getFullYear()} LeadFlow. All rights reserved.
                </div>

                <div className="flex flex-wrap items-center gap-4 lg:gap-8">
                  <Link href="/legal/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Privacy Policy
                  </Link>
                  <Link href="/legal/terms" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Terms of Service
                  </Link>
                  <Link href="/legal/security" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Security
                  </Link>
                  <Link href="/legal/gdpr" className="text-gray-400 hover:text-white transition-colors text-sm">
                    GDPR Compliance
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </footer>
      </section>

    </div>
  );
}