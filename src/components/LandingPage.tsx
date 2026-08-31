import React from 'react';
import { Shield, Fingerprint, WifiOff, Car, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <header className="px-8 py-6 flex items-center justify-between border-b border-emerald-50">
        <div className="flex items-center space-x-2">
          <Shield className="w-8 h-8 text-emerald-600" />
          <span className="text-2xl font-bold tracking-tight text-emerald-900">VShield</span>
        </div>
        <nav className="hidden md:flex space-x-8 text-sm font-medium text-gray-600">
          <a href="#features" className="hover:text-emerald-600 transition-colors">Features</a>
          <a href="#technology" className="hover:text-emerald-600 transition-colors">Technology</a>
          <a href="#pricing" className="hover:text-emerald-600 transition-colors">Pricing</a>
        </nav>
        <div>
          <Link to="/login" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-full font-medium transition-colors inline-flex items-center space-x-2">
            <span>Log In</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <main>
        <section className="px-8 py-24 md:py-32 max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-6 max-w-4xl mx-auto">
            Securing Nigeria, <br/><span className="text-emerald-600">One Vehicle at a Time!</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            VShield is an AI-powered biometric vehicle immobilization system that operates entirely offline, keeping your vehicle secure even in areas with poor connectivity.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link to="/login" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-colors">
              Get Started
            </Link>
            <button className="w-full sm:w-auto bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-8 py-4 rounded-full font-bold text-lg transition-colors">
              Watch Demo
            </button>
          </div>
        </section>

        <section id="features" className="bg-slate-50 py-24 px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-16 text-gray-900">Why Choose VShield?</h2>
            
            <div className="grid md:grid-cols-3 gap-12">
              <FeatureCard 
                icon={<Fingerprint className="w-8 h-8 text-emerald-600" />}
                title="Biometric Authentication"
                description="Face and fingerprint verification for engine start, ensuring only authorized drivers can operate the vehicle."
              />
              <FeatureCard 
                icon={<WifiOff className="w-8 h-8 text-emerald-600" />}
                title="Offline Operation"
                description="No internet required for core authentication. Built specifically for areas with unreliable network coverage."
              />
              <FeatureCard 
                icon={<Car className="w-8 h-8 text-emerald-600" />}
                title="Multi-Car Management"
                description="Manage unlimited vehicles from a single dashboard. Perfect for families and corporate fleets."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-emerald-950 text-emerald-200 py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Shield className="w-6 h-6 text-emerald-500" />
            <span className="text-xl font-bold text-white">VShield</span>
          </div>
          <p className="text-sm">© 2026 VShield - Google Africa Applied AI Lab. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-emerald-50 text-left">
      <div className="bg-emerald-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}
