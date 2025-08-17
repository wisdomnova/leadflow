import Image from "next/image";
import Link from "next/link";
import { Users, Mail, BarChart3, Check } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Image
                src="/leadflow.png"
                alt="Leadflow"
                width={180}
                height={40}
                priority
                className="h-13 w-auto"
              />
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-gray-900 font-medium">Features</Link>
              <Link href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium">Pricing</Link>
              <Link href="#contact" className="text-gray-600 hover:text-gray-900 font-medium">Contact</Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link href="/auth/sign-in" className="text-gray-600 hover:text-gray-900 font-medium">Sign In</Link>
              <Link 
                href="/auth/sign-up" 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl lg:text-6xl font-black text-gray-900 mb-6">
              Automate Your Cold Email Campaigns
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto font-medium">
              LeadFlow helps businesses, freelancers, and agencies create high-converting cold email sequences that run on autopilot. Find, contact, and convert leads at scale with minimal manual effort.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/signup" 
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-blue-700 transition-colors"
              >
                Start 14-Day Free Trial
              </Link>
              <Link 
                href="#demo" 
                className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-bold hover:bg-gray-50 transition-colors"
              >
                Watch Demo
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-4 font-medium">No credit card required • Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4">
              Everything You Need for Cold Email Success
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto font-medium">
              Launch your first campaign in under 10 minutes with our intuitive platform designed for results.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Lead Management</h3>
              <p className="text-gray-600 font-medium">Import and organize your contacts with CSV upload, automatic deduplication, and smart segmentation tools.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Automated Sequences</h3>
              <p className="text-gray-600 font-medium">Create multi-step email campaigns with personalized templates and smart follow-ups that convert prospects into customers.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Real-Time Analytics</h3>
              <p className="text-gray-600 font-medium">Track opens, clicks, and replies with detailed campaign analytics to optimize your outreach performance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-6">
                Scale Your Outreach Without the Headache
              </h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-bold text-gray-900">Launch in Minutes</h3>
                    <p className="text-gray-600 font-medium">Set up your first campaign in under 10 minutes with our intuitive interface.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-bold text-gray-900">High Deliverability</h3>
                    <p className="text-gray-600 font-medium">Ensure your emails reach inboxes with proper DKIM, SPF, and DMARC authentication.</p>
                  </div>
                </div>
                
                <div className="flex items-start"> 
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-bold text-gray-900">Smart Personalization</h3>
                    <p className="text-gray-600 font-medium">Use dynamic variables to personalize every email automatically.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-2xl">
              <div className="text-center">
                <h3 className="text-2xl font-black text-gray-900 mb-4">Ready to Get Started?</h3>
                <p className="text-gray-600 mb-6 font-medium">Join thousands of businesses already using LeadFlow to scale their outreach.</p>
                <Link 
                  href="/signup" 
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-blue-700 transition-colors inline-block"
                >
                  Start Your Free Trial
                </Link>
                <p className="text-sm text-gray-500 mt-4 font-medium">14 days free • No setup fees • Cancel anytime</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-black text-white mb-6">
            Stop Sending Cold Emails Manually
          </h2>
          <p className="text-xl text-blue-100 mb-8 font-medium">
            Automate your entire cold email process and focus on closing deals instead of writing emails.
          </p>
          <Link 
            href="/signup" 
            className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-bold hover:bg-gray-50 transition-colors inline-block"
          >
            Get Started Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Image
                src="/leadflow.png"
                alt="Leadflow"
                width={150}
                height={35}
                className="h-10 w-auto mb-4 brightness-0 invert"
              />
              <p className="text-gray-400 font-medium">
                Automate your cold email campaigns and convert more leads into customers.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#features" className="hover:text-white font-medium">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white font-medium">Pricing</Link></li>
                <li><Link href="/signup" className="hover:text-white font-medium">Free Trial</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white font-medium">About</Link></li>
                <li><Link href="/contact" className="hover:text-white font-medium">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-white font-medium">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white font-medium">Terms</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white font-medium">Help Center</Link></li>
                <li><Link href="/docs" className="hover:text-white font-medium">Documentation</Link></li>
                <li><a href="mailto:contact@tryleadflow.ai" className="hover:text-white font-medium">Contact Support</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p className="font-medium">&copy; 2025 LeadFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}