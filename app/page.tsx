'use client'

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Upload, Zap, BarChart3, Users, Mail, Brain, Play, Star, Quote } from "lucide-react";
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
      monthly: 49,
      yearly: 490,
      description: 'Perfect for individual sales professionals',
      features: [
        '1 user',
        '2 active campaigns',
        '500 contacts',
        'Basic automation',
        'Email support',
        'CSV import/export'
      ]
    },
    {
      id: 'growth',
      name: 'Growth',
      monthly: 149,
      yearly: 1490,
      description: 'Best for growing sales teams',
      features: [
        '3 users',
        '10 active campaigns',
        '5,000 contacts',
        'Full automation workflows',
        'AI text assist',
        'Priority support',
        'API access',
        'Custom fields'
      ],
      popular: true
    },
    {
      id: 'pro',
      name: 'Pro',
      monthly: 399,
      yearly: 3990,
      description: 'For enterprise teams at scale',
      features: [
        '10 users',
        'Unlimited campaigns',
        '50,000 contacts',
        'Advanced AI features',
        'Sequence suggestions',
        'Premium support',
        'Custom integrations',
        'Advanced analytics',
        'White-label options'
      ]
    }
  ];

  const getDiscountPercentage = () => {
    const starter = plans.find(p => p.id === 'starter')!
    const discount = ((starter.monthly * 12 - starter.yearly) / (starter.monthly * 12)) * 100
    return Math.round(discount)
  }

  // Social proof companies
  const companies = [
    { name: 'Microsoft', logo: '/logos/microsoft.svg' },
    { name: 'Slack', logo: '/logos/slack.svg' },
    { name: 'Notion', logo: '/logos/notion.svg' },
    { name: 'Stripe', logo: '/logos/stripe.svg' },
    { name: 'Zoom', logo: '/logos/zoom.svg' },
    { name: 'Shopify', logo: '/logos/shopify.svg' }
  ];

  // Testimonials
  const testimonials = [
    {
      id: 1,
      content: "LeadFlow transformed our outreach completely. We went from 12% to 44% reply rates in just 3 weeks. The AI personalization is incredible.",
      author: "Sarah Chen",
      title: "VP of Sales",
      company: "TechFlow",
      avatar: "/avatars/sarah.jpg",
      rating: 5
    },
    {
      id: 2,
      content: "Setting up campaigns used to take hours. Now I can launch a new sequence in under 5 minutes. The automation handles everything perfectly.",
      author: "Marcus Rodriguez",
      title: "Sales Director",
      company: "GrowthLabs",
      avatar: "/avatars/marcus.jpg",
      rating: 5
    }
  ];

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

      {/* Hero Section */}
      <section className="bg-white py-20 lg:py-28 relative overflow-hidden">
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

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          {/* Hero Content */}
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
            
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
                Launch campaigns in under 5 minutes and get +32% reply rates with AI-powered personalization. 
                LeadFlow automates your entire outreach process.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 pt-4"
                variants={fadeInLeft}
              >
                <Link 
                  href="/auth/sign-up" 
                  className="inline-flex items-center justify-center bg-blue-600 text-white px-12 py-5 rounded-2xl text-xl font-bold hover:bg-blue-700 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
                >
                  Start Free Trial
                </Link>
                <button className="inline-flex items-center justify-center bg-transparent border-2 border-gray-300 text-gray-700 px-12 py-5 rounded-2xl text-xl font-bold hover:bg-gray-50 transition-all transform hover:scale-105">
                  <Play className="w-5 h-5 mr-2" />
                  Watch Demo
                </button>
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

            {/* Dashboard Image - Right */}
            <motion.div 
              className="relative w-full max-w-4xl mx-auto"
              variants={fadeInRight}
              initial="initial"
              animate="animate"
            >
              <div className="relative rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
                <Image
                  src="/dashboard.png"
                  alt="LeadFlow Dashboard"
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </motion.div>
          </div>

          {/* Social Proof - Company Logos */}
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
              Trusted by sales teams at
            </motion.p>
            <motion.div 
              className="flex flex-wrap justify-center items-center gap-8 lg:gap-12 opacity-60"
              variants={staggerItem}
            >
              {companies.map((company, index) => (
                <div key={index} className="h-8 w-20 bg-gray-300 rounded flex items-center justify-center">
                  <span className="text-xs text-gray-600 font-medium">{company.name}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Testimonials */}
          <motion.div 
            className="grid md:grid-cols-2 gap-8 mb-32"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm"
                variants={staggerItem}
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <Quote className="w-8 h-8 text-gray-300 mb-4" />
                <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.author}</div>
                    <div className="text-sm text-gray-600">{testimonial.title}, {testimonial.company}</div>
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
              <p className="text-[40px] text-gray-700 font-normal lowercase tracking-widest text-center">
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
                  Our AI helps you write compelling subject lines and personalized messages in under 5 minutes.
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
                  at optimal times for maximum open rates and +32% reply rates.
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
                  with detailed analytics and A/B testing to continuously improve results.
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

      {/* Contact Management Section */}
      <section id="features" className="bg-white py-32 relative overflow-hidden">
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
                  <span className="text-gray-900">Contact </span>
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
                Manage up to 50,000 contacts with advanced filtering.
              </p>
            </motion.div>

            {/* Contacts Screenshot */}
            <motion.div 
              className="relative w-full max-w-4xl mx-auto"
              variants={staggerItem}
            >
              <div className="relative rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
                <Image
                  src="/contacts.png"
                  alt="LeadFlow Contacts Management"
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Campaign Management Section */}
      <section className="bg-gray-50 py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div 
            className="grid lg:grid-cols-2 gap-20 items-center"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {/* Campaigns Screenshot */}
            <motion.div 
              className="relative w-full max-w-4xl mx-auto order-2 lg:order-1"
              variants={staggerItem}
            >
              <div className="relative rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
                <Image
                  src="/campaigns.png"
                  alt="LeadFlow Campaigns"
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                />
              </div>
            </motion.div>

            {/* Text Content - Right */}
            <motion.div 
              className="space-y-8 order-1 lg:order-2"
              variants={staggerItem}
            >
              <div className="flex items-center space-x-4 mb-6">
                <h2 className="text-5xl font-bold">
                  <span className="text-gray-900">Email </span>
                  <span 
                    style={{
                      background: 'linear-gradient(135deg, #1fbe39 0%, #186ae5 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    Sequences
                  </span>
                </h2>
              </div>
              
              <p className="text-xl text-gray-600 leading-relaxed">
                Create unlimited automated email sequences with smart follow-ups. 
                Set precise timing, personalize at scale, and convert prospects into customers.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Analytics Section */}
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
                  <span className="text-gray-900">Advanced </span>
                  <span 
                    style={{
                      background: 'linear-gradient(135deg, #1fbe39 0%, #186ae5 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    Analytics
                  </span>
                </h2>
              </div>
              
              <p className="text-xl text-gray-600 leading-relaxed">
                Track every metric that matters. Monitor reply rates, open rates, click-through rates, and conversions 
                with real-time analytics and detailed reporting.
              </p>
            </motion.div>

            {/* Analytics Screenshot */}
            <motion.div 
              className="relative w-full max-w-4xl mx-auto"
              variants={staggerItem}
            >
              <div className="relative rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
                <Image
                  src="/analytics.png"
                  alt="LeadFlow Analytics Dashboard"
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                />
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
            className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto"
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
                    ? 'border-blue-500 ring-4 ring-blue-100 scale-105' 
                    : 'border-gray-200'
                }`}
                variants={staggerItem}
                whileHover={{ scale: plan.popular ? 1.05 : 1.02 }}
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
                      €{billingCycle === 'monthly' ? plan.monthly : plan.yearly}
                    </span>
                    <span className="text-gray-600 text-xl">
                      /{billingCycle === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>

                  {billingCycle === 'yearly' && (
                    <p className="text-green-600 font-semibold">
                      Save €{(plan.monthly * 12) - plan.yearly} per year
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
        <div className="relative z-10 py-32">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <motion.div 
              className="text-center"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
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
              
              <motion.p 
                className="text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed"
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
                  className="inline-flex items-center bg-blue-600 text-white px-12 py-5 rounded-2xl text-xl font-bold hover:bg-blue-700 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
                >
                  Start Free Trial
                </Link>
                <button className="inline-flex items-center bg-transparent border-2 border-white text-white px-12 py-5 rounded-2xl text-xl font-bold hover:bg-white hover:text-black transition-all transform hover:scale-105">
                  <Play className="w-5 h-5 mr-2" />
                  Watch Demo
                </button>
              </motion.div>

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
                  <span className="text-gray-300 text-lg font-medium">Setup in 5 minutes</span>
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
                className="grid lg:grid-cols-4 md:grid-cols-2 gap-12"
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
                  </ul>
                </motion.div>

                <motion.div variants={staggerItem}>
                  <h3 className="text-white font-bold text-lg mb-6">Support</h3>
                  <ul className="space-y-4">
                    <li>
                      <Link href="/help" className="text-gray-400 hover:text-white transition-colors">
                        Help Center
                      </Link>
                    </li>
                    <li>
                      <Link href="/security" className="text-gray-400 hover:text-white transition-colors">
                        Security
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

                <div className="flex flex-wrap items-center space-x-8">
                  <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Privacy Policy
                  </Link>
                  <Link href="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Terms of Service
                  </Link>
                  <Link href="/security" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Security
                  </Link>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 bg-gray-800 px-3 py-1 rounded-full">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-gray-400 text-xs">System Operational</span>
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