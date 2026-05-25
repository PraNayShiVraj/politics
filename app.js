/**
 * ElectIQ — Frontend Application Logic
 * Implements chat states, timeline accordion animations, API integration,
 * markdown parsing, and fallback key configuration.
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- STATE ---
  let chatHistory = [];
  let isChatActive = false;
  let isThinking = false;

  // --- UI ELEMENTS ---
  const body = document.body;
  const askForm = document.getElementById('ask-form');
  const userInput = document.getElementById('user-input');
  const submitBtn = document.getElementById('submit-btn');
  const thinkingIndicator = document.getElementById('thinking-indicator');
  const chatSection = document.getElementById('chat-section');
  const chatHistoryContainer = document.getElementById('chat-history');
  const typingIndicator = document.getElementById('typing-indicator');
  const clearChatBtn = document.getElementById('clear-chat-btn');
  const mobileChatAnchor = document.getElementById('mobile-chat-anchor');
  const jumpToChatBtn = document.getElementById('jump-to-chat');

  // Interactive Timeline Nodes
  const timelineNodes = document.querySelectorAll('.timeline-node');
  const stageAccordions = document.querySelectorAll('.stage-accordion');

  // Modals & Drawers
  const modalOverlay = document.getElementById('modal-overlay');
  const settingsModal = document.getElementById('modal-settings');
  const drawerGlossary = document.getElementById('drawer-glossary');
  const drawerHowItWorks = document.getElementById('drawer-how-it-works');
  const drawerAbout = document.getElementById('drawer-about');

  // Navigation Links
  const navGlossary = document.getElementById('nav-glossary');
  const navHowItWorks = document.getElementById('nav-how-it-works');
  const navAbout = document.getElementById('nav-about');
  const logoHome = document.getElementById('logo-home');

  // Footer Links
  const footerGlossary = document.getElementById('footer-glossary');
  const footerHowItWorks = document.getElementById('footer-how-it-works');
  const footerAbout = document.getElementById('footer-about');

  // Settings Modal Buttons
  const openSettingsBtn = document.getElementById('open-settings');
  const closeSettingsBtn = document.getElementById('close-settings');
  const saveSettingsBtn = document.getElementById('save-settings');
  const clearSettingsBtn = document.getElementById('clear-settings');
  const apiKeyInput = document.getElementById('api-key-input');
  const settingsStatus = document.getElementById('settings-status');

  // --- INITIALIZATION ---
  // Load saved API key from localStorage if it exists
  const savedKey = localStorage.getItem('electiq_api_key');
  if (savedKey) {
    apiKeyInput.value = savedKey;
  }

  // --- EVENT LISTENERS: NAV & HOME ---
  logoHome.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // --- EVENT LISTENERS: ACCORDIONS & TIMELINE ---
  
  // Timeline nodes click
  timelineNodes.forEach(node => {
    node.addEventListener('click', () => {
      const stageId = node.getAttribute('data-stage');
      activateStage(stageId);
    });
  });

  // Accordion header click
  stageAccordions.forEach(accordion => {
    const header = accordion.querySelector('.accordion-header');
    header.addEventListener('click', () => {
      const isActive = accordion.classList.contains('active');
      const stageId = accordion.id.replace('stage-acc-', '');

      if (isActive) {
        accordion.classList.remove('active');
        // Deactivate node visual as well
        const node = document.querySelector(`.timeline-node[data-stage="${stageId}"]`);
        if (node) node.classList.remove('active');
      } else {
        activateStage(stageId);
      }
    });
  });

  // Stage "Ask about this Stage" buttons inside accordions
  document.querySelectorAll('.stage-ask-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const queryText = btn.getAttribute('data-ask');
      triggerQuery(queryText);
    });
  });

  // Helper to activate a specific timeline stage
  function activateStage(stageId) {
    // Update timeline nodes visual status
    timelineNodes.forEach(node => {
      const nodeStage = node.getAttribute('data-stage');
      if (nodeStage === stageId) {
        node.classList.add('active');
      } else {
        node.classList.remove('active');
      }
    });

    // Update accordions active status
    stageAccordions.forEach(acc => {
      const accStage = acc.id.replace('stage-acc-', '');
      if (accStage === stageId) {
        acc.classList.add('active');
        // Smooth scroll to this accordion
        setTimeout(() => {
          acc.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
      } else {
        acc.classList.remove('active');
      }
    });
  }

  // --- EVENT LISTENERS: DRAWERS & MODALS ---
  
  // Close everything on overlay click
  modalOverlay.addEventListener('click', closeAllOverlays);

  // Setup Drawer triggers
  setupDrawer(navGlossary, drawerGlossary);
  setupDrawer(footerGlossary, drawerGlossary);
  document.getElementById('close-glossary').addEventListener('click', () => closeDrawer(drawerGlossary));

  setupDrawer(navHowItWorks, drawerHowItWorks);
  setupDrawer(footerHowItWorks, drawerHowItWorks);
  document.getElementById('close-how-it-works').addEventListener('click', () => closeDrawer(drawerHowItWorks));

  setupDrawer(navAbout, drawerAbout);
  setupDrawer(footerAbout, drawerAbout);
  document.getElementById('close-about').addEventListener('click', () => closeDrawer(drawerAbout));

  // Settings Modal triggers
  openSettingsBtn.addEventListener('click', () => openModal(settingsModal));
  closeSettingsBtn.addEventListener('click', () => closeModal(settingsModal));
  
  // Save API key locally
  saveSettingsBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key) {
      localStorage.setItem('electiq_api_key', key);
      showSettingsStatus('API key saved successfully!', 'success');
      setTimeout(() => closeModal(settingsModal), 800);
    } else {
      showSettingsStatus('Please paste an API key first.', 'error');
    }
  });

  // Clear API key locally
  clearSettingsBtn.addEventListener('click', () => {
    localStorage.removeItem('electiq_api_key');
    apiKeyInput.value = '';
    showSettingsStatus('API key removed.', 'success');
  });

  function setupDrawer(triggerEl, drawerEl) {
    triggerEl.addEventListener('click', (e) => {
      e.preventDefault();
      closeAllOverlays();
      modalOverlay.classList.remove('hidden');
      drawerEl.classList.remove('hidden');
      body.style.overflow = 'hidden'; // Disable background scrolling
    });
  }

  function closeDrawer(drawerEl) {
    drawerEl.classList.add('hidden');
    modalOverlay.classList.add('hidden');
    body.style.overflow = '';
  }

  function openModal(modalEl) {
    closeAllOverlays();
    modalOverlay.classList.remove('hidden');
    modalEl.classList.remove('hidden');
    body.style.overflow = 'hidden';
  }

  function closeModal(modalEl) {
    modalEl.classList.add('hidden');
    modalOverlay.classList.add('hidden');
    body.style.overflow = '';
  }

  function closeAllOverlays() {
    [drawerGlossary, drawerHowItWorks, drawerAbout, settingsModal].forEach(el => {
      if (el) el.classList.add('hidden');
    });
    modalOverlay.classList.add('hidden');
    body.style.overflow = '';
  }

  function showSettingsStatus(text, type) {
    settingsStatus.textContent = text;
    settingsStatus.className = 'settings-status-msg visible';
    settingsStatus.style.color = type === 'success' ? 'var(--accent)' : '#d32f2f';
    setTimeout(() => {
      settingsStatus.className = 'settings-status-msg';
    }, 3000);
  }

  // --- TEXTAREA AUTO-RESIZE & KEYBOARD SHORTCUTS ---
  userInput.addEventListener('input', () => {
    autoGrowTextarea(userInput);
  });

  userInput.addEventListener('keydown', (e) => {
    // Enter sends, Shift+Enter inputs newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      askForm.requestSubmit();
    }
  });

  function autoGrowTextarea(element) {
    element.style.height = 'auto';
    element.style.height = (element.scrollHeight) + 'px';
  }

  // --- SUGGESTION CHIPS CLICK ---
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const question = chip.getAttribute('data-question');
      triggerQuery(question);
    });
  });

  function triggerQuery(text) {
    userInput.value = text;
    autoGrowTextarea(userInput);
    // Smooth scroll back to input if timeline was active
    window.scrollTo({ top: userInput.getBoundingClientRect().top + window.scrollY - 180, behavior: 'smooth' });
    userInput.focus();
    setTimeout(() => {
      askForm.requestSubmit();
    }, 100);
  }

  // --- CHAT INTERACTION & SUBMISSION ---
  askForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isThinking) return;

    const query = userInput.value.trim();
    if (!query) return;

    // Reset Input
    userInput.value = '';
    userInput.style.height = 'auto';

    // 1. Activate Chat Mode
    if (!isChatActive) {
      isChatActive = true;
      chatSection.classList.remove('hidden');
      body.classList.add('sticky-input-active');
      
      // Smooth transition to chat
      setTimeout(() => {
        chatSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }

    // 2. Add message to UI
    appendUserMessage(query);
    
    // 3. Add to array history
    chatHistory.push({ role: 'user', content: query });

    // 4. Trigger Loader
    setThinkingState(true);

    try {
      // 5. Fire API request
      const responseText = await fetchMistralResponse(chatHistory);
      
      // 6. Handle successful response
      appendAIMessage(responseText);
      chatHistory.push({ role: 'assistant', content: responseText });
    } catch (error) {
      console.error('ElectIQ API Error:', error);
      appendErrorCard(error);
    } finally {
      setThinkingState(false);
    }
  });

  // Clear Chat and Reset State
  clearChatBtn.addEventListener('click', () => {
    chatHistory = [];
    isChatActive = false;
    body.classList.remove('sticky-input-active');
    chatSection.classList.add('hidden');
    mobileChatAnchor.classList.remove('visible');
    
    // Clear chat DOM history (except typing indicator wrapper)
    chatHistoryContainer.innerHTML = '';
    
    // Scroll back to Hero section smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Mobile Jump to Chat scroll button
  jumpToChatBtn.addEventListener('click', () => {
    chatSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // Track scrolling to show/hide mobile quick jump anchor
  window.addEventListener('scroll', () => {
    if (!isChatActive) return;

    const rect = chatSection.getBoundingClientRect();
    const inputRect = userInput.getBoundingClientRect();

    // Show jump icon if chat is out of view (scrolled too far down stages or far up hero)
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      mobileChatAnchor.classList.add('visible');
    } else {
      mobileChatAnchor.classList.remove('visible');
    }
  });

  // --- UI RENDER HELPERS ---
  
  function appendUserMessage(text) {
    const row = document.createElement('div');
    row.className = 'user-msg-row';
    
    const bubble = document.createElement('div');
    bubble.className = 'user-bubble';
    bubble.textContent = text;
    
    row.appendChild(bubble);
    chatHistoryContainer.appendChild(row);
    scrollToBottom();
  }

  function appendAIMessage(markdownText) {
    const row = document.createElement('div');
    row.className = 'ai-msg-row';

    const avatar = document.createElement('div');
    avatar.className = 'ai-avatar';
    avatar.textContent = '🗳️';

    const card = document.createElement('div');
    card.className = 'ai-card';

    const label = document.createElement('span');
    label.className = 'avatar-label';
    label.textContent = 'ElectIQ';

    const textEl = document.createElement('div');
    textEl.className = 'ai-text';
    textEl.innerHTML = parseMarkdown(markdownText);

    // Follow up action button
    const followUpBtn = document.createElement('button');
    followUpBtn.className = 'follow-up-btn';
    followUpBtn.innerHTML = 'Ask a follow-up ↗';
    followUpBtn.addEventListener('click', () => {
      userInput.placeholder = "Ask a follow-up question...";
      window.scrollTo({ top: userInput.getBoundingClientRect().top + window.scrollY - 180, behavior: 'smooth' });
      userInput.focus();
    });

    card.appendChild(label);
    card.appendChild(textEl);
    card.appendChild(followUpBtn);
    row.appendChild(avatar);
    row.appendChild(card);

    chatHistoryContainer.appendChild(row);
    scrollToBottom();
  }

  function appendErrorCard(error) {
    const row = document.createElement('div');
    row.className = 'ai-msg-row';

    const avatar = document.createElement('div');
    avatar.className = 'ai-avatar';
    avatar.textContent = '⚠️';

    const card = document.createElement('div');
    card.className = 'ai-card';
    card.style.borderColor = '#ffcccc';
    card.style.backgroundColor = '#fffbfb';

    const label = document.createElement('span');
    label.className = 'avatar-label';
    label.textContent = 'System Status';
    label.style.color = '#d32f2f';

    const textEl = document.createElement('div');
    textEl.className = 'ai-text';
    
    let errorHTML = `<p><strong>Connection Notice:</strong> ElectIQ had difficulty communicating with the Mistral AI API.</p>`;
    
    if (error.message && error.message.includes('API key missing')) {
      errorHTML += `
        <p>Your local ElectIQ proxy server is running, but the server's <code>MISTRAL_API_KEY</code> environment variable is empty.</p>
        <p style="margin-top: 0.5rem;"><button class="stage-ask-btn" id="err-open-settings" style="background:#fcedec; color:#d32f2f; border-color:#ffcccc;">Configure API Key Fallback ⚙</button></p>
      `;
    } else {
      errorHTML += `
        <p>Details: ${error.message || 'Network request failed.'}</p>
        <p>If you are not running the Node.js backend proxy server, please open the developer settings (cog icon in top right) and supply a Mistral API Key directly.</p>
        <p style="margin-top: 0.5rem;"><button class="stage-ask-btn" id="err-open-settings" style="background:#fcedec; color:#d32f2f; border-color:#ffcccc;">Open API Settings ⚙</button></p>
      `;
    }

    textEl.innerHTML = errorHTML;
    
    card.appendChild(label);
    card.appendChild(textEl);
    row.appendChild(avatar);
    row.appendChild(card);
    
    chatHistoryContainer.appendChild(row);
    
    // Attach event listeners to error button
    const errBtn = document.getElementById('err-open-settings');
    if (errBtn) {
      errBtn.addEventListener('click', () => openModal(settingsModal));
    }
    
    scrollToBottom();
  }

  function setThinkingState(active) {
    isThinking = active;
    if (active) {
      submitBtn.disabled = true;
      thinkingIndicator.classList.add('visible');
      typingIndicator.classList.remove('hidden');
    } else {
      submitBtn.disabled = false;
      thinkingIndicator.classList.remove('visible');
      typingIndicator.classList.add('hidden');
    }
    scrollToBottom();
  }

  function scrollToBottom() {
    setTimeout(() => {
      chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;
    }, 50);
  }

  // --- API SERVICE ---
  
  async function fetchMistralResponse(history) {
    // 1. Attempt Server Proxy Call
    try {
      const isDirectServer = window.location.port === '3000' || window.location.hostname.includes('onrender.com');
      const endpoint = isDirectServer
        ? '/api/chat'
        : 'https://politics-quw3.onrender.com/api/chat';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ messages: history })
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        throw new Error(`Failed to parse server response: ${response.statusText}`);
      }
      
      if (!response.ok) {
        // Special case: Server indicates API key is missing
        if (data.error === 'API key missing') {
          throw new Error('API key missing on server');
        }
        const err = new Error(data.message || `Proxy responded with error ${response.status}`);
        err.isProxyResponse = true; // Set flag to bypass local fallback
        throw err;
      }

      if (data.content && data.content[0] && data.content[0].text) {
        return data.content[0].text;
      }
      throw new Error('Unexpected payload format from proxy');
      
    } catch (proxyError) {
      // If the proxy actually responded with a structured error, do not fallback; throw it directly!
      if (proxyError.isProxyResponse || proxyError.message === 'API key missing on server') {
        throw proxyError;
      }

      console.warn('Proxy server attempt failed, attempting fallback local browser call.', proxyError);

      // 2. Browser Direct Fallback (uses local storage API Key)
      const userApiKey = localStorage.getItem('electiq_api_key');
      if (!userApiKey) {
        throw new Error('Local proxy is not reachable, and no fallback API Key is configured in settings.');
      }

      // Hit Mistral API directly
      const directResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'Authorization': `Bearer ${userApiKey}`
        },
        body: JSON.stringify({
          model: 'mistral-small-latest',
          messages: [
            {
              role: 'system',
              content: 'You are ElectIQ, a friendly and strictly non-partisan election process guide. Explain election stages, timelines, terminology, and steps in clear simple language. Use bold for key terms. Never take political sides. Keep answers to 2–4 short paragraphs.'
            },
            ...history
          ]
        })
      });

      const directData = await directResponse.json();

      if (!directResponse.ok) {
        throw new Error(directData.message || `Direct Mistral API call error: ${directResponse.status}`);
      }

      if (directData.choices && directData.choices[0] && directData.choices[0].message) {
        return directData.choices[0].message.content;
      }
      throw new Error('Unexpected payload format from Direct Mistral API');
    }
  }

  // --- SIMPLE MARKDOWN PARSER FOR Front-End ---
  // Converts bold, paragraphs, and list formats to gorgeous styled HTML
  function parseMarkdown(text) {
    if (!text) return '';
    
    let html = text;

    // Escaping basic HTML to prevent injection
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 1. Format **bold text** to custom strong spans
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 2. Format numbered lists: e.g. "1. Announcement"
    // Capture consecutive numbered lines and group into <ol>
    const lines = html.split('\n');
    let inList = false;
    let listHTML = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const numMatch = line.match(/^\d+\.\s+(.*)/);
      const bulletMatch = line.match(/^[\*\-]\s+(.*)/);

      if (numMatch) {
        if (!inList) {
          listHTML.push('<ol>');
          inList = 'ol';
        }
        listHTML.push(`<li>${numMatch[1]}</li>`);
      } else if (bulletMatch) {
        if (!inList) {
          listHTML.push('<ul>');
          inList = 'ul';
        }
        listHTML.push(`<li>${bulletMatch[1]}</li>`);
      } else {
        if (inList) {
          listHTML.push(`</${inList}>`);
          inList = false;
        }
        if (line) {
          listHTML.push(`<p>${line}</p>`);
        }
      }
    }

    if (inList) {
      listHTML.push(`</${inList}>`);
    }

    return listHTML.join('');
  }
});
