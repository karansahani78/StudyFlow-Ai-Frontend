import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tenantApi, authApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { useForm } from 'react-hook-form'
import { Settings, Palette, MessageSquare, Code, Save, Copy, Check, User, Lock, X, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Tenant } from '@/types'

const tabs = [
  { id:'general',    label:'General',      icon:Settings      },
  { id:'branding',   label:'Branding',     icon:Palette       },
  { id:'chatbot',    label:'Chatbot',      icon:MessageSquare },
  { id:'profile',    label:'My Profile',   icon:User          },
  { id:'security',   label:'Security',     icon:Lock          },
  { id:'api',        label:'Integrations', icon:Code          },
] as const
type TabId = typeof tabs[number]['id']

export default function SettingsPage() {
  const [tab, setTab] = useState<TabId>('general')
  const [copied, setCopied] = useState(false)
  const { tenant, user, updateTenant, updateUser } = useAuthStore()
  const qc = useQueryClient()

  // WhatsApp modal state
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [whatsappPhoneId, setWhatsappPhoneId] = useState(tenant?.whatsappPhoneId || '')
  const [whatsappAccessToken, setWhatsappAccessToken] = useState(tenant?.whatsappAccessToken || '')
  const [whatsappSaving, setWhatsappSaving] = useState(false)
  const [showToken, setShowToken] = useState(false)

  // Tenant settings form
  const { register: regT, handleSubmit: hsT, reset: resetT, watch: watchT, formState: { isSubmitting: tSaving } } = useForm({ defaultValues: {
    timezone: tenant?.timezone || 'Asia/Kathmandu',
    currency: tenant?.currency || 'USD',
    chatbotName: tenant?.chatbotName || 'StudyFlow AI',
    chatbotGreeting: tenant?.chatbotGreeting || '',
    chatbotLanguage: tenant?.chatbotLanguage || 'en',
    chatbotEnabled: tenant?.chatbotEnabled ?? true,
    primaryColor: tenant?.primaryColor || '#6366f1',
    secondaryColor: tenant?.secondaryColor || '#8b5cf6',
  }})

  // Profile form
  const { register: regP, handleSubmit: hsP, formState: { isSubmitting: pSaving } } = useForm({ defaultValues: {
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    timezone: user?.timezone || 'Asia/Kathmandu',
  }})

  // Password form
  const { register: regPw, handleSubmit: hsPw, reset: resetPw, formState: { isSubmitting: pwSaving } } = useForm()

  const { data: tenantData } = useQuery<Tenant>({ queryKey:['tenant'], queryFn:()=>tenantApi.get().then(r=>r.data) })

  useEffect(() => {
    if (tenantData) {
      resetT({
        timezone: tenantData.timezone,
        currency: tenantData.currency,
        chatbotName: tenantData.chatbotName,
        chatbotGreeting: tenantData.chatbotGreeting || '',
        chatbotLanguage: tenantData.chatbotLanguage || 'en',
        chatbotEnabled: tenantData.chatbotEnabled,
        primaryColor: tenantData.primaryColor,
        secondaryColor: tenantData.secondaryColor,
      })
      setWhatsappPhoneId(tenantData.whatsappPhoneId || '')
      setWhatsappAccessToken(tenantData.whatsappAccessToken || '')
    }
  }, [tenantData])

  const saveTenantMutation = useMutation({
    mutationFn: (d: any) => tenantApi.updateSettings(d),
    onSuccess: (res) => { updateTenant(res.data); qc.invalidateQueries({ queryKey: ['tenant'] }); toast.success('Settings saved') },
  })

  const saveProfileMutation = useMutation({
    mutationFn: (d: any) => authApi.me().then(() => d),
    onSuccess: (d) => { updateUser(d); toast.success('Profile updated') },
  })

  const changePasswordMutation = useMutation({
    mutationFn: (d: any) => authApi.changePassword(d),
    onSuccess: () => { resetPw(); toast.success('Password changed successfully') },
  })

  const copyEmbed = () => {
    navigator.clipboard.writeText(`<script src="https://cdn.studyflow.ai/chatbot.js" data-tenant="${tenant?.slug}"></script>`)
    setCopied(true)
    toast.success('Embed code copied!')
    setTimeout(() => setCopied(false), 2500)
  }

  const handleSaveWhatsApp = async () => {
    if (!whatsappPhoneId.trim()) { toast.error('Phone Number ID is required'); return }
    if (!whatsappAccessToken.trim()) { toast.error('Access Token is required'); return }
    setWhatsappSaving(true)
    try {
      await tenantApi.updateSettings({ whatsappPhoneId, whatsappAccessToken })
      toast.success('WhatsApp settings saved successfully')
      setShowWhatsAppModal(false)
      qc.invalidateQueries({ queryKey: ['tenant'] })
    } catch {
      toast.error('Failed to save WhatsApp settings')
    } finally {
      setWhatsappSaving(false)
    }
  }

  const handleIntegrationConfigure = (name: string) => {
    switch (name) {
      case 'WhatsApp Business API':
        setShowWhatsAppModal(true)
        break
      case 'Stripe Payments':
        toast.success('Stripe configuration coming soon')
        break
      case 'Google Calendar':
        toast.success('Google Calendar configuration coming soon')
        break
      case 'Gmail':
        toast.success('Gmail configuration coming soon')
        break
      case 'Razorpay':
        toast.success('Razorpay configuration coming soon')
        break
      case 'Khalti':
        toast.success('Khalti configuration coming soon')
        break
      default:
        toast('Configuration not available yet')
    }
  }

  const primaryColor = watchT('primaryColor')
  const secondaryColor = watchT('secondaryColor')

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage your workspace configuration</p>
      </div>
      <div className="flex gap-5">
        {/* Tab nav */}
        <div className="w-48 flex-shrink-0 space-y-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === t.id ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30' : 'text-gray-400 hover:text-white hover:bg-white/8'}`}>
              <t.icon size={15}/>{t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 glass-card p-6">

          {/* GENERAL */}
          {tab === 'general' && (
            <form onSubmit={hsT(d => saveTenantMutation.mutate(d))} className="space-y-5">
              <h2 className="section-title">General Settings</h2>
              <div>
                <label className="label">Consultancy Name</label>
                <input defaultValue={tenant?.name} className="input-field opacity-60 cursor-not-allowed" disabled/>
                <p className="text-xs text-gray-500 mt-1">Contact support to change your consultancy name</p>
              </div>
              <div>
                <label className="label">Timezone</label>
                <select {...regT('timezone')} className="select-field">
                  <option value="Asia/Kathmandu">Asia/Kathmandu (NPT +5:45)</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                  <option value="Asia/Dhaka">Asia/Dhaka (BST +6:00)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                </select>
              </div>
              <div>
                <label className="label">Currency</label>
                <select {...regT('currency')} className="select-field">
                  <option value="USD">USD – US Dollar</option>
                  <option value="NPR">NPR – Nepalese Rupee</option>
                  <option value="INR">INR – Indian Rupee</option>
                  <option value="GBP">GBP – British Pound</option>
                  <option value="AUD">AUD – Australian Dollar</option>
                  <option value="CAD">CAD – Canadian Dollar</option>
                </select>
              </div>
              <button type="submit" disabled={tSaving} className="btn-primary">
                <Save size={14}/>{tSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          )}

          {/* BRANDING */}
          {tab === 'branding' && (
            <form onSubmit={hsT(d => saveTenantMutation.mutate(d))} className="space-y-5">
              <h2 className="section-title">Branding & White-Label</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Primary Color</label>
                  <div className="flex gap-3 items-center">
                    <input type="color" {...regT('primaryColor')} className="w-12 h-10 rounded-lg cursor-pointer bg-transparent border border-white/10 p-0.5"/>
                    <input {...regT('primaryColor')} className="input-field flex-1" placeholder="#6366f1"/>
                  </div>
                </div>
                <div>
                  <label className="label">Secondary Color</label>
                  <div className="flex gap-3 items-center">
                    <input type="color" {...regT('secondaryColor')} className="w-12 h-10 rounded-lg cursor-pointer bg-transparent border border-white/10 p-0.5"/>
                    <input {...regT('secondaryColor')} className="input-field flex-1" placeholder="#8b5cf6"/>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-white/3 rounded-xl border border-white/8">
                <p className="text-xs font-medium text-gray-400 mb-2">Preview</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                    style={{ background: `linear-gradient(135deg,${primaryColor},${secondaryColor})` }}>
                    {tenant?.name?.[0]}
                  </div>
                  <span className="text-sm font-medium text-white">{tenant?.name}</span>
                </div>
              </div>
              <div>
                <label className="label">Custom Domain</label>
                <input defaultValue={tenantData?.customDomain || ''} className="input-field" placeholder="crm.yourcompany.com"/>
                <p className="text-xs text-gray-500 mt-1">Add a CNAME pointing to studyflow.ai in your DNS</p>
              </div>
              <button type="submit" disabled={tSaving} className="btn-primary">
                <Save size={14}/>{tSaving ? 'Saving…' : 'Save Branding'}
              </button>
            </form>
          )}

          {/* CHATBOT */}
          {tab === 'chatbot' && (
            <form onSubmit={hsT(d => saveTenantMutation.mutate(d))} className="space-y-5">
              <h2 className="section-title">AI Chatbot Configuration</h2>
              <div className="flex items-center justify-between p-4 bg-white/3 rounded-xl border border-white/8">
                <div>
                  <p className="text-sm font-medium text-white">Chatbot Enabled</p>
                  <p className="text-xs text-gray-400">Show AI chatbot on your website widget</p>
                </div>
                <input type="checkbox" {...regT('chatbotEnabled')} className="w-5 h-5 accent-primary-500"/>
              </div>
              <div>
                <label className="label">Chatbot Name</label>
                <input {...regT('chatbotName')} className="input-field" placeholder="StudyFlow AI"/>
              </div>
              <div>
                <label className="label">Greeting Message</label>
                <textarea {...regT('chatbotGreeting')} className="input-field min-h-[80px]" placeholder="Hi! I'm your study abroad assistant. How can I help?"/>
              </div>
              <div>
                <label className="label">Default Language</label>
                <select {...regT('chatbotLanguage')} className="select-field">
                  <option value="en">English</option>
                  <option value="ne">Nepali (नेपाली)</option>
                  <option value="hi">Hindi (हिंदी)</option>
                </select>
              </div>
              <div className="p-4 bg-black/30 rounded-xl border border-white/8">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-white">Embed Code</p>
                  <button type="button" onClick={copyEmbed} className="btn-secondary text-xs py-1 px-2">
                    {copied ? <><Check size={11}/>Copied!</> : <><Copy size={11}/>Copy</>}
                  </button>
                </div>
                <code className="text-xs text-primary-300 font-mono block overflow-x-auto">
                  {`<script src="https://cdn.studyflow.ai/chatbot.js" data-tenant="${tenant?.slug}"></script>`}
                </code>
              </div>
              <button type="submit" disabled={tSaving} className="btn-primary">
                <Save size={14}/>{tSaving ? 'Saving…' : 'Save Chatbot Config'}
              </button>
            </form>
          )}

          {/* PROFILE */}
          {tab === 'profile' && (
            <form onSubmit={hsP(d => saveProfileMutation.mutate(d))} className="space-y-5">
              <h2 className="section-title">My Profile</h2>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">First Name</label><input {...regP('firstName')} className="input-field"/></div>
                <div><label className="label">Last Name</label><input {...regP('lastName')} className="input-field"/></div>
              </div>
              <div>
                <label className="label">Email</label>
                <input defaultValue={user?.email} className="input-field opacity-60 cursor-not-allowed" disabled/>
              </div>
              <div>
                <label className="label">Phone</label>
                <input {...regP('phone')} className="input-field" placeholder="+977-98…"/>
              </div>
              <div>
                <label className="label">Timezone</label>
                <select {...regP('timezone')} className="select-field">
                  <option value="Asia/Kathmandu">Asia/Kathmandu (NPT)</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
              <button type="submit" disabled={pSaving} className="btn-primary">
                <Save size={14}/>{pSaving ? 'Saving…' : 'Save Profile'}
              </button>
            </form>
          )}

          {/* SECURITY */}
          {tab === 'security' && (
            <form onSubmit={hsPw(d => changePasswordMutation.mutate(d))} className="space-y-5">
              <h2 className="section-title">Change Password</h2>
              <div>
                <label className="label">Current Password</label>
                <input {...regPw('currentPassword', { required: true })} type="password" autoComplete="current-password" className="input-field"/>
              </div>
              <div>
                <label className="label">New Password</label>
                <input {...regPw('newPassword', { required: true, minLength: { value: 8, message: 'Min 8 chars' } })} type="password" autoComplete="new-password" className="input-field" placeholder="Min 8 characters"/>
              </div>
              <button type="submit" disabled={pwSaving} className="btn-primary">
                <Lock size={14}/>{pwSaving ? 'Changing…' : 'Change Password'}
              </button>
            </form>
          )}

          {/* API / INTEGRATIONS */}
          {tab === 'api' && (
            <div className="space-y-5">
              <h2 className="section-title">API & Integrations</h2>
              <div className="space-y-3">
                {[
                  { name: 'WhatsApp Business API', desc: 'Automated WhatsApp messaging for leads',     status: 'Configure'   },
                  { name: 'Stripe Payments',        desc: 'Online payment collection from students',   status: 'Configure'   },
                  { name: 'Google Calendar',        desc: 'Sync appointments with Google Calendar',    status: 'Configure'   },
                  { name: 'Gmail',                  desc: 'Send emails via your Gmail account',        status: 'Configure'   },
                  { name: 'Razorpay',               desc: 'Payment gateway for India/South Asia',      status: 'Configure'   },
                  { name: 'Khalti',                 desc: 'Payment gateway for Nepal',                 status: 'Configure'   },
                  { name: 'Facebook Lead Ads',      desc: 'Auto-import leads from Facebook campaigns', status: 'Coming Soon' },
                  { name: 'Zapier',                 desc: 'Connect 5000+ apps via Zapier',             status: 'Coming Soon' },
                ].map(i => (
                  <div key={i.name} className="flex items-center justify-between p-4 bg-white/3 rounded-xl border border-white/8">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">{i.name}</p>
                        {i.name === 'WhatsApp Business API' && tenantData?.whatsappPhoneId && (
                          <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"/>Connected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{i.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        console.log('CONFIG CLICKED', i.name)
                        handleIntegrationConfigure(i.name)
                      }}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                        i.status === 'Coming Soon'
                          ? 'text-gray-500 border-gray-700 cursor-not-allowed'
                          : 'text-primary-400 border-primary-500/30 hover:bg-primary-500/10'
                      }`}
                      disabled={i.status === 'Coming Soon'}
                    >
                      {i.name === 'WhatsApp Business API' && tenantData?.whatsappPhoneId ? 'Reconfigure' : i.status}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── WhatsApp Configuration Modal ── */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowWhatsAppModal(false)}
          />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-md glass-card p-6 space-y-5 shadow-2xl">

            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">Configure WhatsApp Business API</h2>
                <p className="text-xs text-gray-400 mt-0.5">Connect your Meta Business account to send automated messages</p>
              </div>
              <button
                type="button"
                onClick={() => setShowWhatsAppModal(false)}
                className="text-gray-500 hover:text-white transition-colors ml-4 mt-0.5"
              >
                <X size={18}/>
              </button>
            </div>

            {/* Help link */}
            <a
              href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 transition-colors"
            >
              <ExternalLink size={11}/>
              <span>How to get your Phone ID & Access Token from Meta</span>
            </a>

            {/* Phone Number ID */}
            <div>
              <label className="label">WhatsApp Phone Number ID</label>
              <input
                type="text"
                value={whatsappPhoneId}
                onChange={e => setWhatsappPhoneId(e.target.value)}
                className="input-field"
                placeholder="1159791680550149"
                autoComplete="off"
              />
              <p className="text-xs text-gray-500 mt-1">Found in Meta Business → WhatsApp → API Setup</p>
            </div>

            {/* Access Token */}
            <div>
              <label className="label">WhatsApp Access Token</label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={whatsappAccessToken}
                  onChange={e => setWhatsappAccessToken(e.target.value)}
                  className="input-field pr-16 font-mono text-xs"
                  placeholder="EAAxxxxxxxxxxxxx..."
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  {showToken ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Permanent token from Meta System User or temporary token for testing</p>
            </div>

            {/* Currently saved indicator */}
            {tenantData?.whatsappPhoneId && (
              <div className="flex items-center gap-2 p-3 bg-emerald-500/8 border border-emerald-500/20 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"/>
                <p className="text-xs text-emerald-300">
                  Currently connected: <span className="font-mono">{tenantData.whatsappPhoneId}</span>
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowWhatsAppModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveWhatsApp}
                disabled={whatsappSaving}
                className="btn-primary flex-1"
              >
                <Save size={14}/>
                {whatsappSaving ? 'Saving…' : 'Save Configuration'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}