import { useState, useRef, useEffect } from 'react'
import { sendMessage } from '../../services/geminiService'

// ── Icons ─────────────────────────────────────────────────────────────────────

function ChatBubbleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
    </svg>
  )
}

// ── Message renderer (supports **bold**) ──────────────────────────────────────

function MessageText({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i}>{part.slice(2, -2)}</strong>
          : <span key={i}>{part}</span>
      )}
    </span>
  )
}

// ── Initial greeting ──────────────────────────────────────────────────────────

const GREETING = {
  role: 'assistant',
  text: 'Halo! Saya SADEWA Assistant 👋\n\nSaya siap membantu Anda dengan pertanyaan seputar layanan administrasi Desa Wates. Apa yang bisa saya bantu?',
}

const QUICK_QUESTIONS = [
  'Apa saja layanan yang tersedia?',
  'Bagaimana cara mengajukan surat?',
  'Apa persyaratan SKTM?',
  'Berapa lama proses surat domisili?',
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function ChatAssistant() {
  const [open, setOpen]         = useState(false)
  const [messages, setMessages] = useState([GREETING])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const bottomRef               = useRef(null)
  const inputRef                = useRef(null)

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      inputRef.current?.focus()
    }
  }, [open, messages])

  async function handleSend(text) {
    const msg = (text ?? input).trim()
    if (!msg || loading) return

    const userMsg = { role: 'user', text: msg }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setLoading(true)

    const result = await sendMessage(
      history.filter(m => m.role !== 'assistant' || m !== GREETING)
    )

    setMessages(prev => [...prev, { role: 'assistant', text: result.text }])
    setLoading(false)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 flex flex-col rounded-2xl overflow-hidden"
          style={{
            width: 360,
            height: 520,
            boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
            border: '1px solid #e5e7eb',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ background: 'linear-gradient(90deg, #1e40af 0%, #10b981 100%)' }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <ChatBubbleIcon />
              </div>
              <div>
                <p className="font-semibold text-[14px] text-white leading-4">SADEWA Assistant</p>
                <p className="text-[11px] text-white/75 leading-4">Layanan Administrasi Desa Wates</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer border-0 bg-transparent"
              aria-label="Tutup chat"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-[#f9fafb] px-4 py-4 flex flex-col gap-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full shrink-0 mr-2 mt-0.5 flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #1e40af, #10b981)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                      <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                    </svg>
                  </div>
                )}
                <div
                  className="max-w-[76%] px-3 py-2.5 rounded-2xl text-[13px] leading-5"
                  style={{
                    background: msg.role === 'user' ? '#1e40af' : 'white',
                    color: msg.role === 'user' ? 'white' : '#1a1a1a',
                    borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    boxShadow: msg.role === 'assistant' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  {msg.text.split('\n').map((line, j) => (
                    <span key={j}>{j > 0 && <br />}<MessageText text={line} /></span>
                  ))}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-full shrink-0 mr-2 mt-0.5 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #1e40af, #10b981)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                    <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                  </svg>
                </div>
                <div className="bg-white rounded-2xl px-4 py-3 flex items-center gap-1"
                  style={{ borderRadius: '18px 18px 18px 4px', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 bg-[#9ca3af] rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            )}

            {/* Quick questions — only show when just the greeting is there */}
            {messages.length === 1 && !loading && (
              <div className="flex flex-col gap-2 mt-1">
                <p className="text-[11px] text-[#9ca3af] text-center">Pertanyaan umum</p>
                {QUICK_QUESTIONS.map(q => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="text-left px-3 py-2 bg-white border border-[#e5e7eb] rounded-xl text-[12px] text-[#1e40af] leading-4 hover:bg-[#eff6ff] transition-colors cursor-pointer"
                    style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="bg-white border-t border-[#e5e7eb] px-3 py-3 flex items-end gap-2 shrink-0">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ketik pertanyaan Anda..."
              rows={1}
              disabled={loading}
              className="flex-1 bg-[#f3f4f6] border-0 rounded-xl px-3 py-2.5 text-[13px] text-[#1a1a1a] placeholder-[#9ca3af] leading-5 resize-none focus:outline-none focus:ring-2 focus:ring-[#1e40af] disabled:opacity-60"
              style={{ maxHeight: 80 }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors border-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#1e40af' }}
              aria-label="Kirim pesan"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center cursor-pointer border-0 transition-transform hover:scale-105 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #10b981 100%)',
          boxShadow: '0 4px 20px rgba(30,64,175,0.4)',
        }}
        aria-label={open ? 'Tutup asisten' : 'Buka asisten'}
      >
        {open ? <CloseIcon /> : <ChatBubbleIcon />}
      </button>
    </>
  )
}
