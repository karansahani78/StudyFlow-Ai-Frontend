import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Users, MessageSquare, BarChart2, Shield, Globe, CheckCircle2, ArrowRight, Bot, FileText, Calendar, Bell } from 'lucide-react'

const features = [
  { icon:Bot,          title:'AI Chatbot 24/7',        desc:'Answer student FAQs instantly in English, Nepali & Hindi. Never miss an inquiry again, even at 2am.' },
  { icon:MessageSquare,title:'WhatsApp Automation',    desc:'Automated qualification flows, reminders, and appointment confirmations sent directly via WhatsApp.' },
  { icon:Users,        title:'Smart Lead CRM',          desc:'AI-scored leads (Hot/Warm/Cold), counselor assignment, drag-drop kanban pipeline.' },
  { icon:BarChart2,    title:'Analytics & AI Insights', desc:'Revenue forecasts, conversion tracking, counselor performance, and AI-driven business insights.' },
  { icon:FileText,     title:'Document Management',     desc:'Secure upload, review and approval workflow for passports, transcripts, IELTS, SOP, LOR and more.' },
  { icon:Globe,        title:'Multi-Tenant & White-Label', desc:'Each consultancy gets isolated data. Custom branding, domain, and chatbot for premium clients.' },
]

const pricing = [
  { plan:'Starter',    price:99,  leads:200,  users:3,  features:['AI Chatbot','Lead CRM','Basic Analytics','Email notifications','1 WhatsApp number'],          popular:false },
  { plan:'Growth',     price:199, leads:1000, users:10, features:['Everything in Starter','WhatsApp Automation','Advanced Analytics','Document Management','Priority Support'], popular:true  },
  { plan:'Pro',        price:349, leads:5000, users:30, features:['Everything in Growth','White-Label & Custom Domain','AI Revenue Insights','API Access','Dedicated Support'],  popular:false },
]

const faqs = [
  { q:'How quickly can I set up?',        a:'Most consultancies are live within 30 minutes. Our onboarding wizard guides you step by step.' },
  { q:'Is my student data secure?',       a:'Yes. Each consultancy is completely isolated. Data is encrypted at rest and in transit.' },
  { q:'Does it work with WhatsApp?',      a:'Yes. Connect your WhatsApp Business number and the AI handles conversations automatically.' },
  { q:'Can I white-label it?',            a:'Yes, on Pro and Enterprise plans you can add your logo, colors, and a custom domain.' },
  { q:'What languages does the AI support?', a:'English, Nepali, and Hindi out of the box. More languages coming soon.' },
  { q:'Can I import my existing leads?',  a:'Yes. Import from CSV or Excel with one click.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/8 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center shadow-glow">
              <Zap size={18} className="text-white"/>
            </div>
            <span className="text-lg font-bold">StudyFlow AI</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            {[['Features','#features'],['Pricing','#pricing'],['FAQ','#faq']].map(([l,h])=>(
              <a key={l} href={h} className="hover:text-white transition-colors">{l}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-gray-300 hover:text-white transition-colors hidden sm:block">Sign in</Link>
            <Link to="/register" className="btn-primary text-sm py-2">Start free trial</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.2),transparent_60%)]"/>
        <div className="absolute top-40 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl pointer-events-none"/>
        <div className="absolute top-40 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"/>
        <div className="max-w-5xl mx-auto text-center relative">
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
            className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/30 rounded-full px-4 py-1.5 text-sm text-primary-300 mb-6">
            <span className="w-2 h-2 bg-primary-400 rounded-full animate-pulse"/>
            Built for Nepal & South Asia Study Abroad Consultancies
          </motion.div>
          <motion.h1 initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}}
            className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            Convert More<br/>
            <span className="bg-gradient-to-r from-primary-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">Student Leads with AI</span>
          </motion.h1>
          <motion.p initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
            className="text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            24/7 AI-powered lead capture, WhatsApp automation, counseling workflow and student CRM — purpose-built for study abroad consultancies.
          </motion.p>
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.3}}
            className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/register" className="btn-primary px-8 py-3.5 text-base rounded-xl shadow-glow">
              Start Free Trial <ArrowRight size={18}/>
            </Link>
            <Link to="/login" className="btn-secondary px-8 py-3.5 text-base rounded-xl">
              Sign in to Demo →
            </Link>
          </motion.div>
          <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.5}} className="text-sm text-gray-500 mt-4">
            14-day free trial · No credit card required · Setup in 5 minutes
          </motion.p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 px-6 border-y border-white/8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[['500+','Consultancies Active'],['50K+','Leads Managed'],['35%','Avg Conversion Lift'],['24/7','AI Availability']].map(([n,l])=>(
            <div key={l}>
              <p className="text-4xl font-bold bg-gradient-to-r from-primary-400 to-purple-400 text-transparent bg-clip-text">{n}</p>
              <p className="text-gray-400 text-sm mt-1">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold mb-4">Everything you need to grow enrollments</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">Stop losing leads to slow responses. Let AI handle inquiries 24/7 while your team focuses on closing.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f,i)=>(
              <motion.div key={f.title} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.08}}
                className="glass-card p-6 hover:border-primary-500/30 transition-all duration-300">
                <div className="p-3 bg-primary-500/10 rounded-xl w-fit mb-4"><f.icon size={22} className="text-primary-400"/></div>
                <h3 className="font-semibold text-white text-lg mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-white/2">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">How it works</h2>
            <p className="text-gray-400">From inquiry to enrollment — fully automated</p>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { step:'1', title:'Student Inquires', desc:'Via website chatbot or WhatsApp', icon:MessageSquare },
              { step:'2', title:'AI Qualifies',     desc:'Scores lead as Hot/Warm/Cold automatically', icon:Bot },
              { step:'3', title:'Counselor Books',  desc:'Appointment auto-scheduled with reminders', icon:Calendar },
              { step:'4', title:'Student Enrolls',  desc:'Documents tracked, visa processed', icon:CheckCircle2 },
            ].map((s,i)=>(
              <div key={s.step} className="relative text-center">
                {i<3 && <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary-500/50 to-transparent"/>}
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500/20 to-purple-500/20 border border-primary-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <s.icon size={24} className="text-primary-400"/>
                </div>
                <div className="text-xs font-bold text-primary-400 mb-1">Step {s.step}</div>
                <h4 className="font-semibold text-white text-sm mb-1">{s.title}</h4>
                <p className="text-xs text-gray-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-gray-400">Start free for 14 days. No credit card required.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {pricing.map((p,i)=>(
              <motion.div key={p.plan} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.1}}
                className={`glass-card p-8 relative flex flex-col ${p.popular ? 'border-primary-500/50 shadow-glow' : ''}`}>
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">Most Popular</div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">{p.plan}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">${p.price}</span>
                    <span className="text-gray-400">/month</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{p.leads.toLocaleString()} leads · {p.users} users</p>
                </div>
                <div className="space-y-3 flex-1 mb-8">
                  {p.features.map(feat=>(
                    <div key={feat} className="flex items-start gap-2 text-sm text-gray-300">
                      <CheckCircle2 size={15} className="text-primary-400 flex-shrink-0 mt-0.5"/>{feat}
                    </div>
                  ))}
                </div>
                <Link to="/register" className={p.popular ? 'btn-primary w-full justify-center py-3' : 'btn-secondary w-full justify-center py-3'}>
                  Get started
                </Link>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">Enterprise plans with custom pricing also available.</p>
            <p className="text-gray-500 text-sm">One-time setup fee: $500–$1,500 for full onboarding assistance.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6 bg-white/2">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map(faq=>(
              <div key={faq.q} className="glass-card p-5">
                <h4 className="font-semibold text-white mb-2">{faq.q}</h4>
                <p className="text-sm text-gray-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
            className="glass-card p-12 border-primary-500/30">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow">
              <Zap size={28} className="text-white"/>
            </div>
            <h2 className="text-3xl font-bold mb-4">Ready to convert more students?</h2>
            <p className="text-gray-400 mb-8">Join 500+ consultancies in Nepal & South Asia using StudyFlow AI to automate operations and boost enrollments.</p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link to="/register" className="btn-primary px-10 py-3.5 text-base rounded-xl shadow-glow">
                Start your free trial <ArrowRight size={18}/>
              </Link>
              <Link to="/login" className="btn-secondary px-8 py-3.5 text-base rounded-xl">
                Sign in to Demo
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap size={13} className="text-white"/>
            </div>
            <span className="text-sm font-semibold text-white">StudyFlow AI</span>
          </div>
          <p className="text-gray-500 text-sm text-center">© {new Date().getFullYear()} StudyFlow AI. Built for study abroad consultancies in Nepal & South Asia.</p>
          <div className="flex gap-4 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="mailto:support@studyflow.ai" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
