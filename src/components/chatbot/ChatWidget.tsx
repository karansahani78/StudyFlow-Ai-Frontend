import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Send, Bot, Loader2 } from 'lucide-react'
import axios from 'axios'

interface Message { role: 'user' | 'ai'; content: string; ts: Date }

interface Props { tenantSlug: string; chatbotName?: string; primaryColor?: string }

export function ChatWidget({ tenantSlug, chatbotName = 'StudyFlow AI', primaryColor = '#6366f1' }: Props) {
    const [open, setOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([{ role: 'ai', content: `Hi! I'm ${chatbotName}. How can I help you today? 🎓`, ts: new Date() }])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [sessionId] = useState(() => Math.random().toString(36).slice(2))
    const endRef = useRef<HTMLDivElement>(null)

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

    const send = async () => {
        if (!input.trim() || loading) return
        const userMsg = input.trim()
        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: userMsg, ts: new Date() }])
        setLoading(true)
        try {
            const { data } = await axios.post(`/api/public/chat/${tenantSlug}`, { message: userMsg }, { headers: { 'X-Session-Id': sessionId } })
            setMessages(prev => [...prev, { role: 'ai', content: data.message, ts: new Date() }])
        } catch {
            setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I had trouble responding. Please try again.', ts: new Date() }])
        } finally { setLoading(false) }
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
            <AnimatePresence>
                {open && (
                    <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="w-80 h-[480px] bg-gray-900 border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="p-4 flex items-center gap-3 border-b border-white/10" style={{ background: `linear-gradient(135deg, ${primaryColor}33, ${primaryColor}11)` }}>
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: primaryColor }}>
                                <Bot size={18} className="text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-white">{chatbotName}</p>
                                <p className="text-xs text-green-400 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full" />Online 24/7</p>
                            </div>
                            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white p-1"><X size={16} /></button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    {msg.role === 'ai' && (
                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${primaryColor}33` }}>
                                            <Bot size={13} style={{ color: primaryColor }} />
                                        </div>
                                    )}
                                    <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${msg.role === 'user' ? 'text-white rounded-tr-sm' : 'text-gray-200 rounded-tl-sm bg-white/8'}`}
                                        style={msg.role === 'user' ? { background: primaryColor } : {}}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex gap-2.5">
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${primaryColor}33` }}>
                                        <Bot size={13} style={{ color: primaryColor }} />
                                    </div>
                                    <div className="bg-white/8 rounded-2xl rounded-tl-sm px-4 py-3">
                                        <Loader2 size={14} className="animate-spin text-gray-400" />
                                    </div>
                                </div>
                            )}
                            <div ref={endRef} />
                        </div>

                        {/* Input */}
                        <div className="p-3 border-t border-white/10">
                            <div className="flex gap-2">
                                <input value={input} onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                                    className="flex-1 bg-white/8 border border-white/10 text-white text-sm rounded-xl px-3.5 py-2.5 placeholder-gray-500 focus:outline-none focus:border-primary-500"
                                    placeholder="Ask me anything..." />
                                <button onClick={send} disabled={!input.trim() || loading}
                                    className="p-2.5 rounded-xl text-white disabled:opacity-40 transition-opacity" style={{ background: primaryColor }}>
                                    <Send size={15} />
                                </button>
                            </div>
                            <p className="text-center text-xs text-gray-600 mt-2">Powered by StudyFlow AI</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setOpen(!open)}
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg text-white transition-all"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)` }}>
                <AnimatePresence mode="wait">
                    {open ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X size={22} /></motion.div>
                          : <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><MessageSquare size={22} /></motion.div>}
                </AnimatePresence>
            </motion.button>
        </div>
    )
}
