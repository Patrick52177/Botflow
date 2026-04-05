;(function () {
  'use strict'

  const script    = document.currentScript
  const TENANT_ID = script?.getAttribute('data-tenant-id') || ''
  const BOT_ID    = script?.getAttribute('data-bot-id')    || ''
  const THEME     = script?.getAttribute('data-theme')     || '#6C63FF'
  const LANG      = script?.getAttribute('data-lang')      || 'fr'
  const API_URL   = script?.getAttribute('data-api-url')   || 'https://api.botflow.io'
  const WS_URL    = script?.getAttribute('data-ws-url')    || 'https://api.botflow.io'

  if (!TENANT_ID || !BOT_ID) {
    console.warn('[BotFlow] Missing data-tenant-id or data-bot-id attributes.')
    return
  }

  let isOpen         = false
  let sessionId      = sessionStorage.getItem('bf_session') || generateId()
  let conversationId = sessionStorage.getItem('bf_conv_' + BOT_ID) || null
  let messages       = []
  let connection     = null
  let isConnecting   = false

  sessionStorage.setItem('bf_session', sessionId)

  const i18n = {
    fr: { placeholder: "Tapez votre message...", send: 'Envoyer', online: 'En ligne', offline: 'Hors ligne', typing: "En train d'écrire...", startChat: 'Démarrer la conversation' },
    en: { placeholder: 'Type your message...', send: 'Send', online: 'Online', offline: 'Offline', typing: 'Typing...', startChat: 'Start chat' },
    ar: { placeholder: 'اكتب رسالتك...', send: 'إرسال', online: 'متصل', offline: 'غير متصل', typing: 'جارٍ الكتابة...', startChat: 'ابدأ المحادثة' },
  }
  const t = i18n[LANG] || i18n.en

  const style = document.createElement('style')
  style.textContent = `
    #bf-root * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    #bf-launcher { position: fixed; bottom: 24px; right: 24px; z-index: 9999; width: 56px; height: 56px; background: ${THEME}; border-radius: 50%; box-shadow: 0 4px 24px ${THEME}66; cursor: pointer; display: flex; align-items: center; justify-content: center; border: none; transition: transform .2s; }
    #bf-launcher:hover { transform: scale(1.08); }
    #bf-launcher svg { transition: transform .2s; }
    #bf-launcher.open svg { transform: rotate(45deg); }
    #bf-window { position: fixed; bottom: 94px; right: 24px; z-index: 9998; width: 340px; height: 520px; background: #fff; border-radius: 16px; box-shadow: 0 24px 64px rgba(0,0,0,.18); display: flex; flex-direction: column; overflow: hidden; opacity: 0; transform: translateY(16px) scale(.97); pointer-events: none; transition: opacity .22s, transform .22s; }
    #bf-window.open { opacity: 1; transform: none; pointer-events: all; }
    #bf-header { background: ${THEME}; padding: 16px 18px; display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
    #bf-header-avatar { width: 38px; height: 38px; background: rgba(255,255,255,.25); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
    #bf-header-info { flex: 1; }
    #bf-header-title { font-size: 14px; font-weight: 600; color: #fff; margin: 0 0 2px; }
    #bf-header-status { font-size: 11px; color: rgba(255,255,255,.75); display: flex; align-items: center; gap: 5px; }
    #bf-header-dot { width: 6px; height: 6px; border-radius: 50%; background: #4ade80; animation: bf-pulse 2s infinite; }
    @keyframes bf-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
    #bf-messages { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 9px; background: #f8f8fb; }
    #bf-messages::-webkit-scrollbar { width: 4px; }
    #bf-messages::-webkit-scrollbar-thumb { background: #ddd; border-radius: 2px; }
    .bf-msg { max-width: 80%; padding: 9px 13px; border-radius: 14px; font-size: 13px; line-height: 1.55; word-break: break-word; }
    .bf-msg-bot { background: #fff; border: 1px solid #e8e8f0; border-radius: 14px 14px 14px 4px; color: #1a1a2e; align-self: flex-start; }
    .bf-msg-user { background: ${THEME}; color: #fff; border-radius: 14px 14px 4px 14px; align-self: flex-end; }
    .bf-msg-agent { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px 14px 14px 4px; color: #14532d; align-self: flex-start; }
    .bf-ai-badge { font-size: 9px; background: ${THEME}18; color: ${THEME}; padding: 2px 6px; border-radius: 8px; margin-bottom: 4px; font-weight: 600; display: inline-block; }
    .bf-typing { display: flex; gap: 4px; align-items: center; padding: 10px 14px; }
    .bf-dot { width: 7px; height: 7px; background: #aaa; border-radius: 50%; animation: bf-typing .8s infinite; }
    .bf-dot:nth-child(2) { animation-delay: .16s; }
    .bf-dot:nth-child(3) { animation-delay: .32s; }
    @keyframes bf-typing { 0%,60%,100%{transform:none} 30%{transform:translateY(-4px)} }
    #bf-input-row { padding: 10px 12px; border-top: 1px solid #eee; display: flex; gap: 8px; background: #fff; flex-shrink: 0; }
    #bf-input { flex: 1; background: #f4f4f8; border: 1px solid #e0e0ea; border-radius: 8px; padding: 8px 11px; font-size: 13px; color: #1a1a2e; outline: none; transition: border-color .15s; resize: none; font-family: inherit; }
    #bf-input:focus { border-color: ${THEME}; }
    #bf-send { width: 34px; height: 34px; background: ${THEME}; border: none; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: opacity .15s; flex-shrink: 0; }
    #bf-send:hover { opacity: .85; }
    #bf-branding { text-align: center; font-size: 10px; color: #aaa; padding: 5px 0 7px; background: #fff; }
    #bf-branding a { color: ${THEME}; text-decoration: none; }
  `
  document.head.appendChild(style)

  const root = document.createElement('div')
  root.id = 'bf-root'
  root.innerHTML = `
    <button id="bf-launcher" aria-label="Ouvrir le chat">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        <line x1="12" y1="11" x2="12" y2="11" stroke-width="3"/>
        <line x1="8" y1="11" x2="8" y2="11" stroke-width="3"/>
        <line x1="16" y1="11" x2="16" y2="11" stroke-width="3"/>
      </svg>
    </button>
    <div id="bf-window" role="dialog" aria-label="Chat support">
      <div id="bf-header">
        <div id="bf-header-avatar">🤖</div>
        <div id="bf-header-info">
          <p id="bf-header-title">Support</p>
          <div id="bf-header-status">
            <span id="bf-header-dot"></span>
            <span id="bf-status-text">${t.online}</span>
          </div>
        </div>
      </div>
      <div id="bf-messages"></div>
      <div id="bf-input-row">
        <textarea id="bf-input" rows="1" placeholder="${t.placeholder}"></textarea>
        <button id="bf-send" aria-label="${t.send}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
      <div id="bf-branding">Propulsé par <a href="https://botflow.io" target="_blank">BotFlow</a></div>
    </div>
  `
  document.body.appendChild(root)

  const launcher  = document.getElementById('bf-launcher')
  const window_   = document.getElementById('bf-window')
  const msgList   = document.getElementById('bf-messages')
  const input     = document.getElementById('bf-input')
  const sendBtn   = document.getElementById('bf-send')
  const statusTxt = document.getElementById('bf-status-text')
  const statusDot = document.getElementById('bf-header-dot')

  launcher.addEventListener('click', () => {
    isOpen = !isOpen
    window_.classList.toggle('open', isOpen)
    launcher.classList.toggle('open', isOpen)
    if (isOpen && !conversationId) initConversation()
    if (isOpen) input.focus()
  })

  async function initConversation() {
    try {
      const res = await fetch(`${API_URL}/api/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId:  TENANT_ID,
          chatbotId: BOT_ID,
          channel:   'webchat',
          sessionId: sessionId,
        }),
      })
      if (!res.ok) {
        const err = await res.text()
        console.error('[BotFlow] API error:', res.status, err)
        return
      }
      const data = await res.json()
      conversationId = data.id
      sessionStorage.setItem('bf_conv_' + BOT_ID, conversationId)

      // Show welcome message if available
      if (data.chatbot && data.chatbot.welcomeMessage) {
        addMessage({ role: 'bot', content: data.chatbot.welcomeMessage, id: generateId(), createdAt: new Date().toISOString() })
      }

      connectWebSocket()
    } catch (err) {
      console.error('[BotFlow] Failed to create conversation:', err)
    }
  }

  async function connectWebSocket() {
    if (isConnecting || connection) return
    isConnecting = true

    if (!window.signalR) {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/microsoft-signalr/8.0.0/signalr.min.js')
    }

    connection = new window.signalR.HubConnectionBuilder()
      .withUrl(`${WS_URL}/hubs/chat`)
      .withAutomaticReconnect([0, 2000, 5000, 15000])
      .configureLogging(window.signalR.LogLevel.Warning)
      .build()

    connection.on('MessageReceived', (msg) => {
      if (msg.role !== 'user') addMessage(msg)
    })

    connection.on('BotTyping', (_id, isTyping) => {
      setTypingIndicator(isTyping)
    })

    connection.on('BotError', (err) => {
      console.warn('[BotFlow] Bot error:', err)
    })

    connection.on('ConversationEscalated', () => {
      addMessage({
        role: 'bot',
        content: 'Votre demande a été transmise à un agent humain. Veuillez patienter.',
        id: generateId(),
        createdAt: new Date().toISOString()
      })
    })

    connection.onreconnecting(() => {
      if (statusDot) statusDot.style.background = '#fbbf24'
      if (statusTxt) statusTxt.textContent = 'Reconnexion...'
    })

    connection.onreconnected(async () => {
      if (statusDot) statusDot.style.background = '#4ade80'
      if (statusTxt) statusTxt.textContent = t.online
      if (conversationId) await connection.invoke('JoinConversation', conversationId)
    })

    connection.onclose(() => {
      if (statusDot) statusDot.style.background = '#ef4444'
      if (statusTxt) statusTxt.textContent = t.offline
    })

    try {
      await connection.start()
      if (statusTxt) statusTxt.textContent = t.online
      if (conversationId) await connection.invoke('JoinConversation', conversationId)
    } catch (err) {
      console.error('[BotFlow] WebSocket error:', err)
      if (statusDot) statusDot.style.background = '#ef4444'
      if (statusTxt) statusTxt.textContent = t.offline
    } finally {
      isConnecting = false
    }
  }

  async function sendMessage() {
    const content = input.value.trim()
    if (!content || !conversationId) return
    input.value = ''
    autoResizeTextarea()

    addMessage({ role: 'user', content, id: generateId(), createdAt: new Date().toISOString() })

    try {
      if (connection && connection.state === 'Connected') {
        await connection.invoke('SendMessage', conversationId, TENANT_ID, BOT_ID, content)
      } else {
        // Fallback REST si WebSocket non connecté
        const res = await fetch(`${API_URL}/api/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenantId: TENANT_ID, content }),
        })
        if (res.ok) {
          const msg = await res.json()
          if (msg && msg.role !== 'user') addMessage(msg)
        }
      }
    } catch (err) {
      console.error('[BotFlow] Failed to send message:', err)
      addMessage({
        role: 'bot',
        content: "Désolé, une erreur s'est produite. Veuillez réessayer.",
        id: generateId(),
        createdAt: new Date().toISOString()
      })
    }
  }

  sendBtn.addEventListener('click', sendMessage)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  })
  input.addEventListener('input', autoResizeTextarea)

  function addMessage(msg) {
    messages.push(msg)
    const isUser  = msg.role === 'user'
    const isAgent = msg.role === 'agent'

    const wrap = document.createElement('div')
    wrap.style.display        = 'flex'
    wrap.style.flexDirection  = 'column'
    wrap.style.alignItems     = isUser ? 'flex-end' : 'flex-start'

    let inner = ''
    if (msg.isAiGenerated) {
      inner += `<span class="bf-ai-badge">IA • ${msg.aiProvider || 'bot'}</span><br>`
    }
    if (isAgent) {
      inner += `<span class="bf-ai-badge" style="background:#f0fdf4;color:#16a34a">Agent</span><br>`
    }

    const div = document.createElement('div')
    div.className = `bf-msg ${isUser ? 'bf-msg-user' : isAgent ? 'bf-msg-agent' : 'bf-msg-bot'}`
    div.innerHTML = inner + escapeHtml(msg.content)
    wrap.appendChild(div)

    msgList.appendChild(wrap)
    msgList.scrollTop = msgList.scrollHeight
  }

  let typingEl = null
  function setTypingIndicator(show) {
    if (show && !typingEl) {
      typingEl = document.createElement('div')
      typingEl.className = 'bf-msg bf-msg-bot bf-typing'
      typingEl.innerHTML = '<div class="bf-dot"></div><div class="bf-dot"></div><div class="bf-dot"></div>'
      msgList.appendChild(typingEl)
      msgList.scrollTop = msgList.scrollHeight
    } else if (!show && typingEl) {
      typingEl.remove()
      typingEl = null
    }
  }

  function autoResizeTextarea() {
    input.style.height = 'auto'
    input.style.height = Math.min(input.scrollHeight, 96) + 'px'
  }

  function generateId() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36)
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s    = document.createElement('script')
      s.src      = src
      s.onload   = resolve
      s.onerror  = reject
      document.head.appendChild(s)
    })
  }

})()