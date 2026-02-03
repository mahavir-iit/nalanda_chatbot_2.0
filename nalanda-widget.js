/**
 * Nalanda Library Chatbot Widget
 * Official IIT Ropar Library Website Integration
 * Version: 2.0.1 - With More Button & Search-as-you-type
 * Last Updated: Dec 9, 2025
 * 
 * Usage:
 * 1. Include CSS: <link rel="stylesheet" href="nalanda-widget.css">
 * 2. Include this script: <script src="nalanda-widget.js"></script>
 * 3. Initialize: NalandaWidget.init();
 * 
 * Or use auto-initialization by adding data-auto-init="true" to the script tag
 */

(function(window, document) {
    'use strict';
    
    const NalandaWidget = {
        
        // Configuration optimized for IIT Ropar Library Website
        config: {
            // Relative paths for library website integration
            brainScriptPath: 'lib_chat/assets/js/nandu_brain.js',
            queriesDataPath: 'lib_chat/backend/general_queries.json',
            bookSearchApiPath: 'lib_chat/backend/book-search.php',
            position: 'bottom-right',        // Overlay positioning
            theme: 'green',                  // Library theme match
            autoInit: true,                  // Auto-initialize for easy integration
            debug: false,                    // Production ready
            libraryMode: true,               // Optimized for library website
            logoPath: 'images/logo.png',     // Library logo path
            bookSearchEnabled: true,         // Enable book search feature
            welcomeMessage: "Hello! 👋 I am the Nalanda Library chatbot. How can I assist you today? You can ask me about library timings, membership, borrowing rules, plagiarism check, e-resources, or search our 25,000+ book collection!"
        },
        
        // Internal state
        state: {
            isInitialized: false,
            isOpen: false,
            nalandaBrain: null,
            isReady: false,
            allQuestions: [],
            selectedSuggestionIndex: -1,
            messageQueue: [],
            processingMessages: 0,
            basePath: '',
            bookSearchMode: false
        },
        
        // DOM elements cache
        elements: {},
        
        // Initialize the widget
        init: function(options = {}) {
            if (this.state.isInitialized) {
                console.warn('Nalanda Widget already initialized');
                return;
            }
            
            // Merge configuration
            Object.assign(this.config, options);
            this.state.basePath = this.getScriptBasePath();
            
            console.log('🔄 Initializing Nalanda Library Chatbot Widget...');
            
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.createWidget());
            } else {
                this.createWidget();
            }
        },
        
        // Create widget with accessibility
        createWidget: function() {
            const widgetHTML = `
                <div class="nalanda-chatbot-widget nalanda-theme-${this.config.theme}" id="nalanda-widget" role="region" aria-label="Library Chatbot">
                    <button id="nalanda-chat-toggle" class="nalanda-chat-toggle-btn" aria-label="Open library chatbot" aria-expanded="false">
                        💬 Ask Chatbot
                    </button>
                    
                    <div id="nalanda-chat-window" class="nalanda-chat-window" role="dialog" aria-labelledby="nalanda-chat-title">
                        <div class="nalanda-chat-header">
                            <img src="https://www.iitrpr.ac.in/static/media/logo.a92a57bab4085ce17521.png" alt="Library Logo" class="nalanda-chat-header-logo">
                            <div id="nalanda-chat-title" class="nalanda-chat-header-title">Nalanda Library Chatbot</div>
                            <button id="nalanda-chat-close" class="nalanda-chat-close-btn" aria-label="Close chatbot">×</button>
                        </div>
                        
                        <div id="nalanda-chat-messages" class="nalanda-chat-messages" role="log" aria-live="polite">
                        </div>
                        
                        <div class="nalanda-chat-input-area">
                            <div class="nalanda-input-container" style="position: relative;">
                                <div id="nalanda-suggestions" class="nalanda-suggestions-dropdown" style="display: none;"></div>
                                <div id="nalanda-book-search-mode" class="nalanda-book-search-mode" style="display: none; background: #e8f5e9; padding: 8px; border-radius: 4px; margin-bottom: 8px; font-size: 12px; color: #2e7d32; text-align: center;">Searching books only - For general queries, untick the button</div>
                                <div class="nalanda-chat-input-wrapper">
                                    <button id="nalanda-chat-books-btn" class="nalanda-chat-books-btn" aria-label="Search books" title="Search books only">Book Search 🔍</button>
                                    <input type="text" id="nalanda-chat-input" class="nalanda-chat-input" placeholder="Type your message..." maxlength="500" aria-label="Type your library question" autocomplete="off" />
                                    <button id="nalanda-chat-send" class="nalanda-chat-send-btn" aria-label="Send message">Send</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Insert widget into page
            document.body.insertAdjacentHTML('beforeend', widgetHTML);
            
            // Cache DOM elements
            this.elements = {
                widget: document.getElementById('nalanda-widget'),
                toggleBtn: document.getElementById('nalanda-chat-toggle'),
                closeBtn: document.getElementById('nalanda-chat-close'),
                chatWindow: document.getElementById('nalanda-chat-window'),
                messagesContainer: document.getElementById('nalanda-chat-messages'),
                inputField: document.getElementById('nalanda-chat-input'),
                sendBtn: document.getElementById('nalanda-chat-send'),
                booksBtn: document.getElementById('nalanda-chat-books-btn'),
                bookSearchModeIndicator: document.getElementById('nalanda-book-search-mode'),
                suggestionsDropdown: document.getElementById('nalanda-suggestions')
            };
            
            // Apply positioning class
            this.elements.widget.classList.add(`nalanda-position-${this.config.position}`);
            
            // Bind events
            this.bindEvents();
            
            // Load backend
            this.loadBackend();
            
            this.state.isInitialized = true;
            console.log('✅ Nalanda Widget initialized successfully');
        },
        
        // Bind event listeners
        bindEvents: function() {
            // Toggle button
            this.elements.toggleBtn.addEventListener('click', () => this.toggleChat());
            
            // Close button
            this.elements.closeBtn.addEventListener('click', () => this.closeChat());
            
            // Send button
            this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
            
            // Books button - toggle book search mode
            this.elements.booksBtn.addEventListener('click', () => this.toggleBookSearchMode());
            
            // Enter key to send
            this.elements.inputField.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
            
            // Search-as-you-type
            this.elements.inputField.addEventListener('input', (e) => {
                const value = e.target.value;
                console.log('=== INPUT EVENT FIRED ===');
                console.log('Input value:', value);
                console.log('Value length:', value.length);
                console.log('Will process:', value.length >= 2);
                this.handleSearchInput(value);
            });
            
            // Keyboard navigation for suggestions
            this.elements.inputField.addEventListener('keydown', (e) => {
                this.handleSuggestionKeyboard(e);
            });
            
            // Click outside to close suggestions
            document.addEventListener('click', (e) => {
                if (!this.elements.chatWindow.contains(e.target)) {
                    this.hideSuggestions();
                }
            });
        },
        
        // Toggle chat window
        toggleChat: function() {
            this.elements.chatWindow.classList.toggle('nalanda-active');
            this.state.isOpen = this.elements.chatWindow.classList.contains('nalanda-active');
            this.elements.toggleBtn.setAttribute('aria-expanded', this.state.isOpen.toString());
            
            if (this.state.isOpen) {
                this.elements.inputField.focus();
                
                // Load questions for search if not already loaded
                if (!this.state.allQuestions || this.state.allQuestions.length === 0) {
                    console.log('Chat opened, loading questions for search...');
                    this.loadQueriesForSearch();
                }
                
                // Show welcome message on opening
                if (this.elements.messagesContainer.children.length === 0) {
                    setTimeout(() => {
                        this.addMessage(
                            this.config.welcomeMessage,
                            'bot',
                            true
                        );
                    }, 300);
                }
            }
        },
        
        // Close chat and save history
        closeChat: function() {
            this.elements.chatWindow.classList.remove('nalanda-active');
            this.state.isOpen = false;
            
            // Clear chat messages when closing
            this.elements.messagesContainer.innerHTML = '';
            
            // Clear session storage
            try {
                sessionStorage.removeItem('nalanda_chat_history');
            } catch (e) {}
            
            // Reset to show welcome message when reopened
            this.state.welcomeShown = false;
        },
        
        // Add message to chat (now returns a promise)
        addMessage: function(text, sender, useTypewriter = false) {
            return new Promise((resolve) => {
                const messageDiv = document.createElement('div');
                messageDiv.className = `nalanda-message nalanda-message-${sender}`;
                
                const bubbleDiv = document.createElement('div');
                bubbleDiv.className = 'nalanda-message-bubble nalanda-welcome-message';
                
                // Convert URLs to clickable links
                const processedText = this.makeLinksClickable(text);
                
                if (useTypewriter && sender === 'bot') {
                    // Show typing indicator first
                    this.showTypingIndicator();
                    
                    setTimeout(() => {
                        this.hideTypingIndicator();
                        
                        // WhatsApp-style typewriter effect
                        bubbleDiv.innerHTML = '';
                        messageDiv.appendChild(bubbleDiv);
                        this.elements.messagesContainer.appendChild(messageDiv);
                        
                        let i = 0;
                        const speed = 20; // Faster typing like WhatsApp
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = processedText;
                        const plainText = tempDiv.textContent || tempDiv.innerText || '';
                        
                        const typeWriter = () => {
                            if (i < plainText.length) {
                                const partialText = plainText.substring(0, i + 1);
                                const partialProcessed = this.makeLinksClickable(partialText);
                                bubbleDiv.innerHTML = partialProcessed + '<span class="nalanda-typing-cursor">▊</span>';
                                i++;
                                // Variable speed for more natural typing
                                const randomDelay = speed + Math.random() * 10;
                                setTimeout(typeWriter, randomDelay);
                            } else {
                                bubbleDiv.innerHTML = processedText;
                                // Add message timestamp
                                const timestamp = document.createElement('span');
                                timestamp.className = 'nalanda-timestamp';
                                const now = new Date();
                                timestamp.textContent = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                                bubbleDiv.appendChild(timestamp);
                                // Resolve promise when typewriter is complete
                                resolve();
                            }
                            this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
                        };
                        
                        typeWriter();
                    }, 800); // Delay before typing starts
                } else {
                    // Regular message
                    bubbleDiv.innerHTML = processedText;
                    messageDiv.appendChild(bubbleDiv);
                    this.elements.messagesContainer.appendChild(messageDiv);
                    this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
                    // Resolve immediately for non-typewriter messages
                    resolve();
                }
            });
        },
        
        // Show typing indicator (WhatsApp style)
        showTypingIndicator: function() {
            const typingDiv = document.createElement('div');
            typingDiv.className = 'nalanda-message nalanda-message-bot nalanda-typing-indicator';
            typingDiv.id = 'nalanda-typing';
            
            const bubbleDiv = document.createElement('div');
            bubbleDiv.className = 'nalanda-message-bubble nalanda-typing-bubble';
            bubbleDiv.innerHTML = `
                <div class="nalanda-typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            `;
            
            typingDiv.appendChild(bubbleDiv);
            this.elements.messagesContainer.appendChild(typingDiv);
            this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
        },
        
        // Hide typing indicator
        hideTypingIndicator: function() {
            const typingIndicator = document.getElementById('nalanda-typing');
            if (typingIndicator) {
                typingIndicator.remove();
            }
        },
        
        // Convert URLs to clickable links with XSS protection
        makeLinksClickable: function(text) {
            // Remove dangerous tags (script, iframe, object, embed, etc.)
            let sanitized = text
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
                .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
                .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
                .replace(/<link\b[^>]*>/gi, '')
                .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                .replace(/on\w+\s*=\s*["'][^"']*["']/gi, ''); // Remove event handlers

            // If content already contains HTML tags, avoid auto-linkifying to prevent breaking markup
            if (/<[^>]+>/.test(sanitized)) {
                return sanitized;
            }
            
            // Convert URLs to clickable links
            const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi;
            return sanitized.replace(urlRegex, function(url) {
                const cleanUrl = url.replace(/[.,;:!?]+$/, '');
                const trailingPunc = url.slice(cleanUrl.length);
                if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
                    return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" style="color: #059669; text-decoration: underline; font-weight: 500;">${cleanUrl}</a>${trailingPunc}`;
                }
                return url;
            });
        },
        
        // Toggle book search mode
        toggleBookSearchMode: function() {
            this.state.bookSearchMode = !this.state.bookSearchMode;
            
            if (this.state.bookSearchMode) {
                this.elements.booksBtn.style.background = '#42b72a';
                this.elements.booksBtn.style.color = 'white';
                this.elements.booksBtn.style.boxShadow = '0 0 8px rgba(66, 183, 42, 0.6)';
                this.elements.bookSearchModeIndicator.style.display = 'block';
                this.elements.inputField.placeholder = 'Search for a book...';
            } else {
                this.elements.booksBtn.style.background = 'transparent';
                this.elements.booksBtn.style.color = '#42b72a';
                this.elements.booksBtn.style.boxShadow = 'none';
                this.elements.bookSearchModeIndicator.style.display = 'none';
                this.elements.inputField.placeholder = 'Type your message...';
            }
            
            console.log('Book search mode:', this.state.bookSearchMode ? 'ON' : 'OFF');
        },
        
        // Send message with button state management
        sendMessage: async function() {
            const message = this.elements.inputField.value.trim();
            if (!message) return;
            
            // Add user message to chat immediately
            await this.addMessage(message, 'user');
            this.elements.inputField.value = '';
            this.hideSuggestions();
            
            if (!this.state.isReady) {
                await this.addMessage('Please wait for the system to initialize...', 'bot', true);
                return;
            }
            
            // Disable send button and add to processing counter
            this.state.processingMessages++;
            this.updateSendButtonState();
            
            // Process message with backend
            try {
                console.log('Processing message:', message, '(book search mode:', this.state.bookSearchMode, ')');
                let response;
                
                // If in book search mode, skip classification and go directly to book search
                if (this.state.bookSearchMode) {
                    response = await this.state.nalandaBrain.searchBooks(message);
                    response.processing_time = 0;
                } else {
                    response = await this.state.nalandaBrain.processQuery(message);
                }
                console.log('Backend response:', response);
                
                // Determine if this is a book search response (disable typewriter for book results)
                const isBookResponse = response && response.response_type && response.response_type.includes('book');
                
                if (response && response.response) {
                    await this.addMessage(response.response, 'bot', !isBookResponse);
                } else if (response && response.answer) {
                    await this.addMessage(response.answer, 'bot', !isBookResponse);
                } else {
                    console.warn('Invalid response format:', response);
                    await this.addMessage('Sorry, I could not process your request. Please try asking in a different way.', 'bot', true);
                }
            } catch (error) {
                console.error('Error processing message:', error);
                await this.addMessage('Sorry, I encountered an error. Please try again or contact support.', 'bot', true);
            } finally {
                // Decrease processing counter and re-enable button if no more messages
                this.state.processingMessages--;
                this.updateSendButtonState();
                console.log('Message processing completed. Remaining:', this.state.processingMessages);
            }
        },
        
        // Update send button state based on processing status
        updateSendButtonState: function() {
            if (this.state.processingMessages > 0) {
                this.elements.sendBtn.disabled = true;
                this.elements.sendBtn.style.opacity = '0.6';
                this.elements.sendBtn.style.cursor = 'not-allowed';
            } else {
                this.elements.sendBtn.disabled = false;
                this.elements.sendBtn.style.opacity = '1';
                this.elements.sendBtn.style.cursor = 'pointer';
            }
        },
        
        // Load backend brain script
        loadBackend: function() {
            const script = document.createElement('script');
            script.src = this.config.brainScriptPath;
            script.onload = () => this.initializeBackend();
            script.onerror = async () => {
                console.error('Failed to load backend script');
                await this.addMessage('Backend system failed to load. Some features may not work.', 'bot');
            };
            document.head.appendChild(script);
        },
        
        // Initialize backend brain
        initializeBackend: async function() {
            try {
                console.log('Initializing backend...');
                
                if (typeof NalandaBrain === 'undefined') {
                    throw new Error('NalandaBrain class not found - script may not have loaded properly');
                }
                
                this.state.nalandaBrain = new NalandaBrain({
                    bookSearchApiPath: this.config.bookSearchApiPath,
                    bookSearchEnabled: this.config.bookSearchEnabled,
                    basePath: this.state.basePath
                });
                console.log('NalandaBrain instance created');
                
                const initResult = await this.state.nalandaBrain.initialize();
                console.log('Initialization result:', initResult);
                
                this.state.isReady = true;
                console.log('✅ Backend initialized successfully');
                
                // Load all queries for search suggestions
                await this.loadQueriesForSearch();
                
                // Test the backend with a simple query
                try {
                    const testResponse = await this.state.nalandaBrain.processQuery('hello');
                    console.log('Backend test successful:', testResponse);
                } catch (testError) {
                    console.warn('Backend test failed:', testError);
                }
                
            } catch (error) {
                console.error('Backend initialization failed:', error);
                console.error('Error details:', error.message, error.stack);
                
                // Try to provide fallback functionality
                this.state.isReady = false;
                
                setTimeout(async () => {
                    await this.addMessage('⚠️ Backend system is having issues. I can still help with basic queries. Please try asking about library hours, services, or contact information.', 'bot', true);
                }, 1000);
            }
        },

        // Resolve base path for assets from current script location
        getScriptBasePath: function() {
            const script = document.currentScript || document.querySelector('script[src*="nalanda-widget.js"]');
            if (!script) {
                return '';
            }
            const src = script.getAttribute('src');
            if (!src) {
                return '';
            }
            const absoluteSrc = new URL(src, window.location.href).toString();
            return absoluteSrc.substring(0, absoluteSrc.lastIndexOf('/') + 1);
        },
        
        // Load queries for search suggestions
        loadQueriesForSearch: async function() {
            try {
                console.log('Loading questions from:', this.config.queriesDataPath);
                const response = await fetch(this.config.queriesDataPath);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('JSON data loaded, keys count:', Object.keys(data).length);
                
                // Extract all question patterns
                this.state.allQuestions = [];
                for (const [key, value] of Object.entries(data)) {
                    // Split pipe-separated patterns
                    const patterns = key.split('|');
                    patterns.forEach(pattern => {
                        if (pattern.trim()) {
                            this.state.allQuestions.push({
                                question: pattern.trim(),
                                intent: value.intent
                            });
                        }
                    });
                }
                
                console.log(`✅ Loaded ${this.state.allQuestions.length} questions for search`);
            } catch (error) {
                console.error('Failed to load questions for search:', error);
                this.state.allQuestions = [];
            }
        },
        
        // Handle search input for suggestions
        handleSearchInput: function(query) {
            console.log('[handleSearchInput] Called with query:', query);
            
            if (!query || query.length < 2) {
                console.log('[handleSearchInput] Query too short, hiding suggestions');
                this.hideSuggestions();
                return;
            }
            
            console.log('[handleSearchInput] Query length OK, checking mode...');
            console.log('[handleSearchInput] Book search mode:', this.state.bookSearchMode);
            
            // In book search mode, show book suggestions
            // In normal mode, show general query suggestions
            if (this.state.bookSearchMode) {
                console.log('[handleSearchInput] Fetching BOOK suggestions...');
                this.fetchBookSuggestions(query);
            } else {
                console.log('[handleSearchInput] Fetching GENERAL QUERY suggestions...');
                this.fetchGeneralQuerySuggestions(query);
            }
        },
        
        // Fetch general query suggestions from JSON
        fetchGeneralQuerySuggestions: function(query) {
            console.log('[fetchGeneralQuerySuggestions] Starting for query:', query);
            
            if (!this.state.allQuestions || this.state.allQuestions.length === 0) {
                console.log('[fetchGeneralQuerySuggestions] No questions loaded yet');
                this.hideSuggestions();
                return;
            }
            
            const queryLower = query.toLowerCase();
            const matches = [];
            
            // Find matching questions
            for (const item of this.state.allQuestions) {
                if (item.question.toLowerCase().includes(queryLower)) {
                    matches.push({
                        text: item.question,
                        type: 'question',
                        icon: '',
                        score: item.question.toLowerCase().startsWith(queryLower) ? 10 : 5
                    });
                    
                    if (matches.length >= 8) break; // Limit to 8 suggestions
                }
            }
            
            console.log('[fetchGeneralQuerySuggestions] Found', matches.length, 'matches');
            
            if (matches.length > 0) {
                // Sort by score (prioritize matches at start)
                matches.sort((a, b) => b.score - a.score);
                this.showGeneralQuerySuggestions(matches);
            } else {
                console.log('[fetchGeneralQuerySuggestions] No matches found');
                this.hideSuggestions();
            }
        },
        
        // Show general query suggestions
        showGeneralQuerySuggestions: function(suggestions) {
            console.log('[showGeneralQuerySuggestions] Called with:', suggestions.length, 'items');
            
            if (!this.elements.suggestionsDropdown) {
                console.error('[showGeneralQuerySuggestions] ERROR: Dropdown element not found!');
                return;
            }
            
            this.elements.suggestionsDropdown.innerHTML = '';
            this.state.selectedSuggestionIndex = -1;
            
            // Add header
            const header = document.createElement('div');
            header.className = 'nalanda-suggestion-header';
            header.textContent = 'Suggested Questions:';
            header.style.cssText = 'padding: 8px 10px; font-weight: bold; font-size: 12px; background: #f0f0f0; color: #333; border-bottom: 1px solid #ddd;';
            this.elements.suggestionsDropdown.appendChild(header);
            
            suggestions.forEach((item, index) => {
                const suggestionDiv = document.createElement('div');
                suggestionDiv.className = 'nalanda-suggestion-item';
                
                let html = `<span>${item.text}</span>`;
                suggestionDiv.innerHTML = html;
                suggestionDiv.setAttribute('data-index', index);
                suggestionDiv.setAttribute('data-question', item.text);
                suggestionDiv.style.cssText = 'padding: 10px; border-bottom: 1px solid #eee; cursor: pointer; font-size: 13px; line-height: 1.4;';
                
                suggestionDiv.addEventListener('click', () => {
                    console.log('[showGeneralQuerySuggestions] Question clicked:', item.text);
                    // Fill input with just the question text (no emoji)
                    this.elements.inputField.value = item.text;
                    this.hideSuggestions();
                    // Send the message - bot will recognize it as a general query
                    this.sendMessage();
                });
                
                suggestionDiv.addEventListener('mouseenter', () => {
                    this.highlightSuggestion(index);
                });
                
                suggestionDiv.addEventListener('mouseleave', () => {
                    suggestionDiv.style.backgroundColor = 'transparent';
                });
                
                this.elements.suggestionsDropdown.appendChild(suggestionDiv);
            });
            
            this.elements.suggestionsDropdown.style.display = 'block';
            console.log('[showGeneralQuerySuggestions] COMPLETE. Dropdown visible with', suggestions.length, 'items');
        },
        
        // Fetch smart book suggestions from backend
        fetchBookSuggestions: async function(query) {
            console.log('[fetchBookSuggestions] Starting for query:', query);
            
            try {
                const apiBaseUrl = this.resolveApiUrl('book-suggestions.php');
                console.log('[fetchBookSuggestions] API base URL:', apiBaseUrl);
                
                // In book search mode, use topic-based suggestions; otherwise use autocomplete
                const suggestionType = this.state.bookSearchMode ? 'topic' : 'auto';
                const limit = this.state.bookSearchMode ? 15 : 15;
                const url = apiBaseUrl + '?q=' + encodeURIComponent(query) + '&type=' + suggestionType + '&limit=' + limit;
                
                console.log('[fetchBookSuggestions] Full URL:', url);
                console.log('[fetchBookSuggestions] Suggestion type:', suggestionType, 'Limit:', limit);
                
                const response = await fetch(url);
                console.log('[fetchBookSuggestions] API Response status:', response.status, response.statusText);
                
                const data = await response.json();
                console.log('[fetchBookSuggestions] API Response data:', data);
                
                if (data.success && data.suggestions && data.suggestions.length > 0) {
                    console.log('[fetchBookSuggestions] SUCCESS: Got', data.suggestions.length, 'suggestions');
                    console.log('[fetchBookSuggestions] Calling showBookSuggestions with type:', data.type);
                    this.showBookSuggestions(data.suggestions, data.type);
                } else {
                    console.log('[fetchBookSuggestions] No suggestions found for query:', query);
                    if (this.state.bookSearchMode) {
                        this.fetchGeneralQuerySuggestions(query);
                    } else {
                        this.hideSuggestions();
                    }
                }
            } catch (error) {
                console.error('[fetchBookSuggestions] ERROR:', error);
                console.error('[fetchBookSuggestions] Error stack:', error.stack);
                this.hideSuggestions();
            }
        },
        
        // Helper to resolve API URL
        resolveApiUrl: function(endpoint) {
            // The bookSearchApiPath is relative to website root (e.g., 'lib_chat/backend/book-search.php')
            // We want to replace 'book-search.php' with the endpoint (e.g., 'book-suggestions.php')
            // Result should be: 'lib_chat/backend/book-suggestions.php'
            
            // Get just the directory part from bookSearchApiPath
            const configPath = this.config.bookSearchApiPath;
            const lastSlash = configPath.lastIndexOf('/');
            const apiDir = configPath.substring(0, lastSlash + 1); // e.g., 'lib_chat/backend/'
            
            // Build the relative API path
            let apiUrl = apiDir + endpoint; // e.g., 'lib_chat/backend/book-suggestions.php'
            
            console.log('[resolveApiUrl] Endpoint:', endpoint);
            console.log('[resolveApiUrl] Relative URL:', apiUrl);
            console.log('[resolveApiUrl] Resolved API URL:', apiUrl);
            
            return apiUrl;
        },
        
        // Show book suggestions in dropdown
        showBookSuggestions: function(suggestions, type) {
            console.log('[showBookSuggestions] Called with:', suggestions.length, 'items, type:', type);
            
            if (!this.elements.suggestionsDropdown) {
                console.error('[showBookSuggestions] ERROR: Suggestions dropdown element NOT FOUND!');
                console.error('[showBookSuggestions] this.elements:', Object.keys(this.elements));
                return;
            }
            
            console.log('[showBookSuggestions] Dropdown element found:', this.elements.suggestionsDropdown);
            console.log('[showBookSuggestions] Current dropdown display:', this.elements.suggestionsDropdown.style.display);
            
            if (!suggestions || suggestions.length === 0) {
                console.log('[showBookSuggestions] No suggestions provided, hiding dropdown');
                this.hideSuggestions();
                return;
            }
            
            this.elements.suggestionsDropdown.innerHTML = '';
            this.state.selectedSuggestionIndex = -1;
            
            console.log('[showBookSuggestions] Cleared dropdown, adding header...');
            
            // Add header based on type
            const header = document.createElement('div');
            header.className = 'nalanda-suggestion-header';
            header.textContent = type === 'topic_based' ? 'Suggested Books:' : 'Search Results:';
            header.style.cssText = 'padding: 8px 10px; font-weight: bold; font-size: 12px; background: #f0f0f0; color: #333; border-bottom: 1px solid #ddd;';
            this.elements.suggestionsDropdown.appendChild(header);
            console.log('[showBookSuggestions] Header added');
            
            suggestions.forEach((item, index) => {
                const suggestionDiv = document.createElement('div');
                suggestionDiv.className = 'nalanda-suggestion-item nalanda-book-suggestion';
                
                // Use item.title, item.text, or item.title with author
                const rawTitle = item.title || item.text || '';
                console.log('[showBookSuggestions] Raw item:', item);
                console.log('[showBookSuggestions] Raw title from API:', rawTitle);
                
                // Clean the title thoroughly, but preserve author for author searches
                let cleanTitle = rawTitle;
                let displayAuthor = item.author || '';
                
                // Step 1: Remove emoji prefixes
                cleanTitle = cleanTitle.replace(/^[📖📚💡✨🔍✍️]\s*/g, '').trim();
                
                // Step 2: For non-author-book types, remove "by Author" pattern
                // For author-book types, KEEP the author info
                if (item.type !== 'author-book') {
                    cleanTitle = cleanTitle.replace(/\s*by\s+.+$/i, '').trim();
                }
                
                // Step 3: Remove recommendation suffixes
                cleanTitle = cleanTitle.replace(/\s*Recommended for your interest.*$/i, '').trim();
                cleanTitle = cleanTitle.replace(/\s*Related to:.*$/i, '').trim();
                cleanTitle = cleanTitle.replace(/\s*Matches your interest in:.*$/i, '').trim();
                
                // Step 4: Remove any trailing punctuation
                cleanTitle = cleanTitle.replace(/[,;:\s]+$/, '').trim();
                
                console.log('[showBookSuggestions] Clean title after removal:', cleanTitle);
                
                // Build HTML content - handle different data formats
                let html = '';
                
                // Display the clean title
                html += `<strong>${cleanTitle}</strong>`;
                
                // Add author if not already in title and available
                if (displayAuthor && displayAuthor !== 'N/A' && displayAuthor !== '') {
                    // Check if author not already in cleanTitle
                    if (!cleanTitle.toLowerCase().includes(displayAuthor.toLowerCase())) {
                        html += `<br><small>by ${displayAuthor}</small>`;
                    }
                }
                
                suggestionDiv.innerHTML = html;
                suggestionDiv.setAttribute('data-index', index);
                suggestionDiv.setAttribute('data-title', cleanTitle);
                suggestionDiv.style.cssText = 'padding: 10px; border-bottom: 1px solid #eee; cursor: pointer; font-size: 13px; line-height: 1.4;';
                
                suggestionDiv.addEventListener('click', () => {
                    console.log('[showBookSuggestions] Suggestion clicked - Clean title:', cleanTitle);
                    console.log('[showBookSuggestions] Will search for:', cleanTitle);
                    
                    // Fill input with clean title
                    this.elements.inputField.value = cleanTitle;
                    this.hideSuggestions();
                    
                    // Send the search immediately
                    this.sendMessage();
                });
                
                suggestionDiv.addEventListener('mouseenter', () => {
                    this.highlightSuggestion(index);
                });
                
                suggestionDiv.addEventListener('mouseleave', () => {
                    suggestionDiv.style.backgroundColor = 'transparent';
                });
                
                this.elements.suggestionsDropdown.appendChild(suggestionDiv);
            });
            
            console.log('[showBookSuggestions] Added', suggestions.length, 'items to dropdown');
            console.log('[showBookSuggestions] Setting dropdown display to block');
            
            this.elements.suggestionsDropdown.style.display = 'block';
            
            console.log('[showBookSuggestions] COMPLETE. Dropdown display now:', this.elements.suggestionsDropdown.style.display);
            console.log('[showBookSuggestions] Dropdown offsetHeight:', this.elements.suggestionsDropdown.offsetHeight);
            console.log('[showBookSuggestions] Dropdown offsetWidth:', this.elements.suggestionsDropdown.offsetWidth);
        },
        
        // Show suggestions dropdown
        showSuggestions: function(suggestions) {
            console.log('showSuggestions called with', suggestions.length, 'items');
            
            if (!this.elements.suggestionsDropdown) {
                console.error('Suggestions dropdown element not found!');
                return;
            }
            
            this.elements.suggestionsDropdown.innerHTML = '';
            this.state.selectedSuggestionIndex = -1;
            
            suggestions.forEach((item, index) => {
                const suggestionDiv = document.createElement('div');
                suggestionDiv.className = 'nalanda-suggestion-item';
                suggestionDiv.textContent = item.question;
                suggestionDiv.setAttribute('data-index', index);
                
                suggestionDiv.addEventListener('click', () => {
                    this.selectSuggestion(item.question);
                });
                
                suggestionDiv.addEventListener('mouseenter', () => {
                    this.highlightSuggestion(index);
                });
                
                this.elements.suggestionsDropdown.appendChild(suggestionDiv);
            });
            
            this.elements.suggestionsDropdown.style.display = 'block';
            console.log('Suggestions dropdown display set to block');
        },
        
        // Hide suggestions dropdown
        hideSuggestions: function() {
            this.elements.suggestionsDropdown.style.display = 'none';
            this.state.selectedSuggestionIndex = -1;
        },
        
        // Select a suggestion
        selectSuggestion: function(question) {
            this.elements.inputField.value = question;
            this.hideSuggestions();
            this.elements.inputField.focus();
        },
        
        // Highlight suggestion
        highlightSuggestion: function(index) {
            const items = this.elements.suggestionsDropdown.querySelectorAll('.nalanda-suggestion-item');
            items.forEach((item, i) => {
                if (i === index) {
                    item.classList.add('nalanda-suggestion-highlighted');
                } else {
                    item.classList.remove('nalanda-suggestion-highlighted');
                }
            });
            this.state.selectedSuggestionIndex = index;
        },
        
        // Handle keyboard navigation in suggestions
        handleSuggestionKeyboard: function(e) {
            const items = this.elements.suggestionsDropdown.querySelectorAll('.nalanda-suggestion-item');
            
            if (items.length === 0 || this.elements.suggestionsDropdown.style.display === 'none') {
                return;
            }
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const newIndex = this.state.selectedSuggestionIndex + 1;
                if (newIndex < items.length) {
                    this.highlightSuggestion(newIndex);
                    items[newIndex].scrollIntoView({ block: 'nearest' });
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const newIndex = this.state.selectedSuggestionIndex - 1;
                if (newIndex >= 0) {
                    this.highlightSuggestion(newIndex);
                    items[newIndex].scrollIntoView({ block: 'nearest' });
                }
            } else if (e.key === 'Enter' && this.state.selectedSuggestionIndex >= 0) {
                e.preventDefault();
                const selectedText = items[this.state.selectedSuggestionIndex].textContent;
                this.selectSuggestion(selectedText);
            } else if (e.key === 'Escape') {
                this.hideSuggestions();
            }
        }
    };
    
    // Auto-initialization if script has data-auto-init="true"
    document.addEventListener('DOMContentLoaded', function() {
        const script = document.querySelector('script[src*="nalanda-widget.js"]');
        if (script && script.getAttribute('data-auto-init') === 'true') {
            NalandaWidget.init();
        }
    });
    
    // Expose to global scope
    window.NalandaWidget = NalandaWidget;
    
})(window, document);