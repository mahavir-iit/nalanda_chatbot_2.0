/**
 * Nalanda Brain - JavaScript Backend (Converted from Python)
 * ================================================================
 * ✅ Intelligent Query Classification (General + Greeting)
 * ✅ Greeting Detection & Handling  
 * ✅ General Library Inquiries (JSON-based)
 * ✅ Professional Response Formatting
 * ✅ Comprehensive Error Handling & Logging
 * ✅ Ultra-Fast & Lightweight Client-Side Processing
 * ✅ Advanced 3-Layer Semantic Search
 * ✅ Synonym Expansion & Score-Based Matching
 */

console.log('🔄 NalandaBrain script loaded successfully!');
console.log('🔍 Current URL:', window.location.href);

class NalandaBrain {
    constructor(options = {}) {
        this.generalQueries = null;
        this.isInitialized = false;
        this.bookSearchEnabled = options.bookSearchEnabled !== undefined ? options.bookSearchEnabled : true;
        this.bookSearchApiPath = options.bookSearchApiPath || 'lib_chat/backend/book-search.php';
        this.basePath = options.basePath || '';
        
        // Comprehensive synonym mapping (enhanced with additional coverage)
        this.synonyms = {
            'hours': ['timing', 'timings', 'time', 'schedule', 'open', 'close', 'when', 'today'],
            'timing': ['hours', 'timings', 'time', 'schedule', 'open', 'when', 'today'],
            'timings': ['hours', 'timing', 'time', 'schedule', 'open', 'when', 'today'],
            'open': ['timing', 'hours', 'schedule', 'timings', 'available', 'accessible', 'today'],
            'today': ['timing', 'hours', 'schedule', 'open', 'now'],
            'when': ['timing', 'hours', 'time', 'schedule', 'what time'],
            'is': [],
            'the': [],
            'fine': ['penalty', 'charge', 'fee', 'fines', 'late fee', 'overdue'],
            'renew': ['renewal', 'extend', 'extension', 'reissue'],
            'renewal': ['renew', 'extend', 'extension', 'reissue'],
            'issue': ['borrow', 'checkout', 'take', 'get', 'loan', 'issued'],
            'issued': ['issue', 'borrow', 'checkout', 'take', 'get', 'loan'],
            'borrow': ['issue', 'checkout', 'take', 'get', 'loan', 'borrowing'],
            'borrowing': ['issue', 'checkout', 'borrow', 'take', 'get', 'loan'],
            'return': ['submit', 'give back', 'bring back'],
            'search': ['find', 'look', 'locate', 'discover'],
            'find': ['search', 'look', 'locate', 'get'],
            'e-journals': ['ejournal', 'ejournals', 'e-journal', 'journal', 'journals', 'e-resources', 'digital', 'online'],
            'ejournal': ['e-journals', 'ejournals', 'e-journal', 'journals', 'e-resources'],
            'e-resources': ['eresources', 'e-journals', 'ejournals', 'digital', 'online', 'electronic'],
            'help': ['assist', 'support', 'guide', 'information'],  
            'access': ['use', 'get', 'obtain', 'available'],
            'library': ['lib', 'central library', 'nalanda'],
            'book': ['books', 'publication', 'text', 'volume'],
            'books': ['book', 'publication', 'texts', 'volumes'],
            'collection': ['holdings', 'resources', 'materials', 'total'],
            'total': ['collection', 'number', 'how many', 'count'],
            'privilege': ['privileges', 'rights', 'benefits', 'entitlement'],
            'privileges': ['privilege', 'rights', 'benefits', 'entitlements'],
            'member': ['membership', 'registration', 'account'],
            'card': ['id card', 'library card', 'identity'],
            'database': ['db', 'databases', 'resource'],
            'journal': ['journals', 'periodical', 'publication'],
            'contact': ['reach', 'call', 'email', 'phone'],
            'faculty': ['teacher', 'professor', 'staff'],
            'student': ['pupil', 'scholar', 'learner'],
            'research': ['study', 'investigation', 'analysis'],
            'thesis': ['dissertation', 'project', 'paper'],
            'reference': ['ref', 'citation', 'source'],
            'digital': ['online', 'electronic', 'e-'],
            'wifi': ['internet', 'network', 'connection'],
            'computer': ['pc', 'laptop', 'system'],
            'room': ['space', 'area', 'hall'],
            'quiet': ['silent', 'noise-free', 'peaceful'],
            'reservation': ['booking', 'reserve', 'hold'],
            'location': ['address', 'place', 'where'],
            'floor': ['level', 'storey'],
            'section': ['department', 'division', 'area'],
            'catalogue': ['catalog', 'opac', 'database'],
            'available': ['accessibility', 'free', 'accessible'],
            'allowed': ['permitted', 'can i', 'able to', 'possible'],
            'closed': ['shut', 'not open', 'unavailable'],
            'holiday': ['vacation', 'break', 'festival'],
            'exam': ['examination', 'test', 'assessment'],
            'lost': ['missing', 'misplaced', 'can\'t find'],
            'damage': ['damaged', 'torn', 'broken'],
            'payment': ['pay', 'charge', 'cost', 'price'],
            'online': ['internet', 'web', 'digital'],
            'remote': ['off-campus', 'home', 'external'],
            'vpn': ['virtual private network', 'secure connection']
        };
        
        // Semantic field expansion for related concepts
        this.semanticFields = {
            'timing': ['open', 'close', 'hours', 'schedule', 'available', 'today', 'time', 'when'],
            'borrowing': ['issue', 'checkout', 'return', 'renew', 'due date', 'loan', 'borrow', 'issued', 'privilege', 'limit'],
            'fines': ['penalty', 'charge', 'overdue', 'late', 'fee', 'payment', 'fine'],
            'resources': ['ejournal', 'database', 'online', 'digital', 'access', 'e-resources', 'collection', 'books', 'holdings'],
            'facility': ['room', 'space', 'wifi', 'computer', 'printer', 'technobooth'],
            'membership': ['card', 'registration', 'account', 'student', 'faculty', 'member', 'who']
        };
        
        // Failed query logging for analytics
        this.failedQueries = [];
        this.maxFailedQueries = 100;
        
        // Query result caching for performance
        this.queryCache = new Map();
        this.maxCacheSize = 200;
        this.cacheHits = 0;
        this.cacheMisses = 0;
        
        // Input validation constraints
        this.maxQueryLength = 500;
        this.minQueryLength = 2;
        
        // Greeting variations (converted from Python)
        this.greetings = {
            'hello': "👋 Hello! I'm Nalanda Library Chatbot. I'm here to help you with all your library-related questions about timings, policies, services, and facilities.",
            'hi': "🌟 Hi there! Ready to explore the world of knowledge? I can help you find information about library hours, fine policies, e-resources, and much more!",
            'hey': "✨ Hey! Great to see you here. I'm your personal library guide - ask me anything about our services, policies, or facilities.",
            'good': "🎓 Good to meet you! I'm here to make your library experience smooth and enjoyable. What would you like to know today?",
            'nalanda': "Hello! I am Nalanda Library Chatbot."
        };
        
        // Rate limiting and security (converted from Python concepts)
        this.requestCount = 0;
        this.lastRequestTime = 0;
        this.maxRequestsPerMinute = 60;
    }

    resolveBookSearchApiUrl() {
        let path = this.bookSearchApiPath || 'lib_chat/backend/book-search.php';
        const basePath = this.basePath || '';
        let url = '';

        if (/^https?:\/\//i.test(path)) {
            url = path;
        } else if (path.startsWith('/')) {
            url = window.location.origin + path;
        } else if (basePath) {
            let normalizedPath = path;
            try {
                const baseUrl = new URL(basePath, window.location.href);
                if (baseUrl.pathname.endsWith('/lib_chat/') && normalizedPath.startsWith('lib_chat/')) {
                    normalizedPath = normalizedPath.replace(/^lib_chat\//, '');
                }
                url = new URL(normalizedPath, baseUrl).toString();
            } catch (error) {
                console.warn('Failed to resolve base path, falling back to window location:', error);
                url = new URL(path, window.location.href).toString();
            }
        } else {
            url = new URL(path, window.location.href).toString();
        }

        return url;
    }

    /**
     * Initialize with retry logic and caching
     */
    async initialize(maxRetries = 3) {
        if (this.isInitialized) return true;
        
        // Try cache first
        const cached = localStorage.getItem('nalanda_queries_cache');
        const cacheTime = localStorage.getItem('nalanda_queries_cache_time');
        if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < 86400000) {
            this.generalQueries = JSON.parse(cached);
            this.isInitialized = true;
            console.log('✅ Loaded from cache');
            return true;
        }
        
        // Retry with exponential backoff
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🚀 Initializing (attempt ${attempt}/${maxRetries})...`);
                const response = await fetch('lib_chat/backend/general_queries.json');
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                this.generalQueries = await response.json();
                this.isInitialized = true;
                
                // Cache to localStorage
                try {
                    localStorage.setItem('nalanda_queries_cache', JSON.stringify(this.generalQueries));
                    localStorage.setItem('nalanda_queries_cache_time', Date.now().toString());
                } catch (e) { console.warn('Cache failed:', e); }
                
                console.log(`✅ Initialized with ${Object.keys(this.generalQueries).length} queries`);
                return true;
            } catch (error) {
                console.error(`❌ Attempt ${attempt} failed:`, error.message);
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
                }
            }
        }
        
        // Fallback
        this.generalQueries = this.createFallbackQueries();
        this.isInitialized = true;
        console.log('⚠️ Using fallback queries');
        return false;
    }

    /**
     * Create fallback queries for offline use
     */
    createFallbackQueries() {
        return {
            "library hours": {
                "intent": "timing",
                "answer": "The library is open all year. Ground Floor (Stack & Reading Area 2) is open 24/7. First Floor is open from 6 AM to 2 AM. Issue/Return via Kiosk is available 24/7; staff counter timings are 9 AM to 5:30 PM (working days)."
            },
            "fine policy": {
                "intent": "policy",
                "answer": "Library Fine Policy:<br><br>1. Book Fines:<br>- For students: ₹2 per day per book<br>- For faculty/staff: ₹5 per day per book<br>- Maximum fine capped at book price<br><br>2. Magazine/Journal Fines:<br>- ₹10 per day per item<br><br>3. Lost Books:<br>- Cost of book + processing fee ₹100<br>- If out of print: 150% of original price + ₹100<br><br>4. Payment:<br>- Online payment preferred<br>- Cash/DD at library counter<br><br>5. Grace Period:<br>- 3 days grace for renewals<br>- No fine during institute holidays<br><br>Contact: libraryhelpdesk@iitrpr.ac.in"
            },
            "e-resources": {
                "intent": "resources",
                "answer": "E-Resources & Services:<br><br>1. Digital Library Portal:<br>- Access via: http://14.139.182.11/gsdl/cgi-bin/library.cgi<br>- Contains local digital collections<br><br>2. Major Databases:<br>- IEEE Xplore, ACM Digital Library<br>- Science Direct, Springer Link<br>- Web of Science, Scopus<br>- JSTOR, Nature, ASME<br><br>3. E-Books:<br>- Cengage, McGraw Hill<br>- Taylor & Francis<br>- Cambridge University Press<br><br>4. Access Methods:<br>- On-campus: Direct access<br>- Off-campus: VPN required<br>- Mobile: Available via ezproxy<br><br>5. Support:<br>- Training sessions available<br>- Email: libraryhelpdesk@iitrpr.ac.in<br><br>Visit library website for complete list and access instructions."
            },
            "contact information": {
                "intent": "contact",
                "answer": "Library Contact Information:<br><br>📍 Address:<br>Nalanda Library<br>Indian Institute of Technology Ropar<br>Rupnagar, Punjab - 140001<br><br>📞 Phone Numbers:<br>- Main: 01881-242175<br>- Librarian: 01881-242176<br>- Circulation: 01881-242177<br><br>📧 Email:<br>- General: library@iitrpr.ac.in<br>- Help Desk: libraryhelpdesk@iitrpr.ac.in<br><br>🌐 Website:<br>https://www.iitrpr.ac.in/library/<br><br>⏰ Service Hours:<br>- Library: 24/7 (Ground Floor)<br>- Staff Counter: 9 AM - 5:30 PM (working days)<br>- Help Desk: 9 AM - 5 PM (Mon-Fri)"
            }
        };
    }

    /**
     * Rate limiting check (converted from Python)
     */
    checkRateLimit() {
        const currentTime = Date.now();
        
        // Reset counter if a minute has passed
        if (currentTime - this.lastRequestTime > 60000) {
            this.requestCount = 0;
            this.lastRequestTime = currentTime;
        }
        
        this.requestCount++;
        
        if (this.requestCount > this.maxRequestsPerMinute) {
            return false;
        }
        
        return true;
    }

    /**
     * Extract query intent and generate alternatives (converted from Python)
     */
    extractQueryIntent(query) {
        const normalizedQuery = query.toLowerCase().trim()
            .replace(/[^\w\s-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        
        const alternatives = new Set([normalizedQuery]);
        
        // Add variations
        alternatives.add(normalizedQuery.replace(/\s+/g, ''));
        alternatives.add(normalizedQuery.replace(/\s/g, '-'));
        alternatives.add(normalizedQuery.replace(/-/g, ' '));
        
        // Add plural/singular variations
        const words = normalizedQuery.split(' ');
        words.forEach(word => {
            if (word.endsWith('s') && word.length > 3) {
                alternatives.add(normalizedQuery.replace(word, word.slice(0, -1)));
            } else if (word.length > 2) {
                alternatives.add(normalizedQuery.replace(word, word + 's'));
            }
        });
        
        return {
            normalized: normalizedQuery,
            alternatives: Array.from(alternatives),
            words: words
        };
    }

    /**
     * Classify query type (converted from Python)
     */
    classifyQuery(query) {
        // Greeting patterns (case-insensitive regex with /i flag)
        const greetingPatterns = [
            /^(hi|hello|hey|good\s+(morning|afternoon|evening)|nalanda|hii+|helo+)(\s+.*)?$/i,
            /^(what\'s\s+up|how\s+are\s+you|nice\s+to\s+meet\s+you)(\s+.*)?$/i
        ];
        
        for (const pattern of greetingPatterns) {
            if (pattern.test(query)) {
                return 'greeting';
            }
        }
        
        // Book search patterns
        const bookSearchPatterns = [
            /^(search|find|look for|show|give|list)\s+(me\s+)?(books?|titles?|novels?|publications?)\s+(on|about|for|by|called|named)/i,
            /^books?\s+(on|about|for|by|called|named)\s+/i,
            /search\s+(catalogue|catalog|opac|library)\s+for/i,
            /^(where|how)\s+.*(find|search).*books?\s+(on|about|for|by)/i
        ];
        
        for (const pattern of bookSearchPatterns) {
            if (pattern.test(query)) {
                return 'book_search';
            }
        }
        
        return 'general';
    }

    /**
     * Search books by title, author, or subject
     */
    async searchBooks(query, type = 'all') {
        try {
            if (!this.bookSearchEnabled) {
                return {
                    response: "📖 Book search is currently disabled. Please use the OPAC catalogue instead.",
                    response_type: "book_search_disabled"
                };
            }
            // Extract search term from query
            const searchTerm = query
                .replace(/\b(search|find|books?|on|about|for|look|what|by|author|catalogue|catalog|opac)\b/gi, '')
                .replace(/\s+/g, ' ')
                .trim();
            
            console.log('🔍 Original query:', query);
            console.log('🔍 Extracted search term:', searchTerm);
            
            if (!searchTerm || searchTerm.length < 2) {
                return {
                    response: "📚 <strong>What would you like to search for?</strong><br><br>" +
                             "You can search our 25,000+ book collection by:<br>" +
                             "• <strong>Title:</strong> 'Search for Python programming'<br>" +
                             "• <strong>Author:</strong> 'Search books by Knuth'<br>" +
                             "• <strong>Subject:</strong> 'Find books on machine learning'<br><br>" +
                             "<a href='https://opac.iitrpr.ac.in/' target='_blank' style='background: #42b72a; color: white; padding: 8px 12px; border-radius: 4px; text-decoration: none; font-weight: bold;'>📖 Browse Full Catalogue</a>",
                    response_type: "book_search_help"
                };
            }
            
            // Call book search API
            const apiBaseUrl = this.resolveBookSearchApiUrl();
            const apiUrl = apiBaseUrl + '?q=' + 
                          encodeURIComponent(searchTerm) + 
                          '&type=' + type + 
                          '&limit=5';
            
            console.log('🔍 Searching books for:', searchTerm);
            console.log('📍 API URL:', apiUrl);
            const response = await fetch(apiUrl);
            console.log('📡 Response status:', response.status, response.statusText);
            const data = await response.json();
            console.log('📦 API Response:', data);
            
            if (!data.success) {
                console.error('❌ Search failed:', data);
                return {
                    response: '❌ Search failed. Please try again or <a href="' + data.opacUrl + '" target="_blank" style="color: #42b72a; font-weight: bold;">search OPAC →</a>',
                    response_type: "book_search_error"
                };
            }
            
            let html = `<strong>Search Results for: "${searchTerm}"</strong><br><br>`;
            
            if (data.results && data.results.length > 0) {
                console.log(`✅ Found ${data.results.length} books, generating HTML...`);
                html += `<strong>${data.totalResults} Book(s) Found:</strong><br><br>`;
                
                data.results.forEach((book, idx) => {
                    const statusColor = book.availability === 'Available' ? '#42b72a' : (book.availability === 'Checked Out' ? '#d9534f' : '#f0ad4e');
                    const statusIcon = book.availability === 'Available' ? '✅' : (book.availability === 'Checked Out' ? '❌' : 'ℹ️');
                    
                    html += `<div style="margin-bottom: 12px; padding: 12px; background: #f9f9f9; border-left: 4px solid ${statusColor}; border-radius: 3px;">`;
                    html += `<strong style="font-size: 16px;">${idx + 1}. ${book.title}</strong><br>`;
                    if (book.author) html += `<span style="font-size: 14px;"><strong>Author:</strong> ${book.author}</span><br>`;
                    
                    // Display accession numbers
                    if (book.accessionNumbers && book.accessionNumbers.length > 0) {
                        html += `<span style="font-size: 14px;"><strong>Accession:</strong> ${book.accessionNumbers.join(', ')}</span><br>`;
                    } else if (book.id && book.id !== 'N/A') {
                        html += `<span style="font-size: 14px;"><strong>Accession:</strong> ${book.id}</span><br>`;
                    }
                    
                    if (book.callNumber) html += `<span style="font-size: 14px;"><strong>Call Number:</strong> <span style="background: #fff3cd; padding: 2px 6px; border-radius: 3px; font-weight: bold; color: #856404;">${book.callNumber}</span></span><br>`;
                    if (book.copies) html += `<span style="font-size: 14px;"><strong>Copies:</strong> ${book.copies}</span><br>`;
                    if (book.publisher) html += `<span style="font-size: 14px;"><strong>Publisher:</strong> ${book.publisher}</span><br>`;
                    if (book.publisherCode) html += `<span style="font-size: 14px;"><strong>Publisher:</strong> ${book.publisherCode}</span><br>`;
                    if (book.location && book.location !== 'See OPAC for location') html += `<span style="font-size: 14px;"><strong>Location:</strong> ${book.location}</span><br>`;
                    
                    // Add clickable availability
                    if (book.availability !== 'Check OPAC') {
                        html += `<span style="font-size: 14px; color: ${statusColor};"><strong>${statusIcon} Availability: ${book.availability}</strong></span> `;
                    } else {
                        html += `<span style="font-size: 14px;"><strong>Availability:</strong></span> `;
                    }
                    const bookOpacUrl = book.opacUrl || data.opacUrl;
                    html += `<a href="${bookOpacUrl}" target="_blank" style="color: #007bff; text-decoration: none; font-size: 14px; cursor: pointer; font-weight: bold;">Click Here</a>`;
                    
                    html += `</div>`;
                });
                html += `<br>`;
            } else {
                html += `No books found in search. Check OPAC for complete results.<br><br>`;
            }
            
            // Always show OPAC search link
            html += `<a href="${data.opacUrl}" target="_blank" style="background: #42b72a; color: white; padding: 12px 16px; border-radius: 4px; text-decoration: none; font-weight: bold; display: inline-block; text-align: center; width: 100%; box-sizing: border-box;">Search Catalogue →</a>`;
            
            console.log('✅ Generated HTML length:', html.length);
            console.log('📤 Returning response...');
            return {
                response: html,
                response_type: "book_search",
                search_term: searchTerm,
                opac_url: data.opacUrl
            };
            
        } catch (error) {
            console.error('❌ Book search error:', error);
            console.error('Error stack:', error.stack);
            return {
                response: '<a href="https://opac.iitrpr.ac.in/" target="_blank" style="background: #42b72a; color: white; padding: 6px 10px; border-radius: 4px; text-decoration: none; font-weight: bold; font-size: 13px;">📖 Open OPAC Catalogue</a><br><br>Search our complete collection of 25,000+ books directly!',
                response_type: "book_search_fallback"
            };
        }
    }

    /**
     * Get greeting response (converted from Python)
     */
    getGreetingResponse(query) {
        const queryLower = query.toLowerCase();
        
        // Check for specific greeting type
        for (const [key, response] of Object.entries(this.greetings)) {
            if (queryLower.includes(key)) {
                return response;
            }
        }
        
        // Default greeting
        const greetingKeys = Object.keys(this.greetings);
        const randomKey = greetingKeys[Math.floor(Math.random() * greetingKeys.length)];
        return this.greetings[randomKey];
    }

    /**
     * Helper: Get all variants of a key (handles pipe-separated keys)
     * @param {string} key - The key to split
     * @returns {string[]} - Array of key variants
     */
    getKeyVariants(key) {
        return key.includes('|') ? key.split('|').map(v => v.trim()) : [key];
    }

    /**
     * Helper: Normalize query string
     * @param {string} query - The query to normalize
     * @returns {string} - Normalized query
     */
    normalizeQuery(query) {
        return query.toLowerCase().trim();
    }

    /**
     * Find a matching key in generalQueries, handling pipe-separated keys
     * @param {string} query - The query to match
     * @returns {string|null} - The matching key or null
     */
    findMatchingKey(query) {
        const queryLower = this.normalizeQuery(query);
        
        // First check for direct key match
        if (this.generalQueries[queryLower]) {
            console.log(`✅ Direct key match: "${queryLower}"`);
            return queryLower;
        }
        
        // Check pipe-separated keys
        for (const key of Object.keys(this.generalQueries)) {
            const variants = this.getKeyVariants(key);
            for (const variant of variants) {
                if (this.normalizeQuery(variant) === queryLower) {
                    console.log(`✅ Variant match: "${queryLower}" matches variant "${variant}" of key "${key}"`);
                    return key;
                }
            }
        }
        
        console.log(`❌ No key match for: "${queryLower}"`);
        return null;
    }

    /**
     * Calculate Jaccard similarity (converted from Python)
     */
    calculateJaccardSimilarity(setA, setB) {
        const intersection = new Set([...setA].filter(x => setB.has(x)));
        const union = new Set([...setA, ...setB]);
        
        return union.size === 0 ? 0 : intersection.size / union.size;
    }

    /**
     * Calculate word overlap score (converted from Python)
     */
    calculateWordOverlap(queryWords, keyWords) {
        const intersection = new Set([...queryWords].filter(x => keyWords.has(x)));
        
        return keyWords.size === 0 ? 0 : intersection.size / keyWords.size;
    }
    
    /**
     * Calculate Levenshtein distance for typo handling
     */
    levenshteinDistance(str1, str2) {
        const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
        
        for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
        for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
        
        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1,
                    matrix[j - 1][i] + 1,
                    matrix[j - 1][i - 1] + indicator
                );
            }
        }
        
        return matrix[str2.length][str1.length];
    }
    
    /**
     * Extract n-grams (bigrams, trigrams) from text for phrase matching
     */
    extractNgrams(text, n = 2) {
        const words = text.toLowerCase().split(/\s+/);
        const ngrams = [];
        for (let i = 0; i <= words.length - n; i++) {
            ngrams.push(words.slice(i, i + n).join(' '));
        }
        return ngrams;
    }
    
    /**
     * Log failed queries for analytics and improvement
     */
    logFailedQuery(query, bestMatch, bestScore) {
        const logEntry = {
            query: query,
            bestMatch: bestMatch ? bestMatch.substring(0, 100) : null,
            bestScore: bestScore,
            timestamp: new Date().toISOString()
        };
        
        this.failedQueries.push(logEntry);
        
        // Keep only recent failed queries
        if (this.failedQueries.length > this.maxFailedQueries) {
            this.failedQueries.shift();
        }
        
        console.log('📊 Failed query logged:', logEntry);
    }
    
    /**
     * Get failed queries for analytics
     */
    getFailedQueries() {
        return this.failedQueries;
    }
    
    /**
     * Sanitize input to prevent XSS attacks
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        return input.replace(/<script[^>]*>.*?<\/script>/gi, '').replace(/<[^>]+>/g, '').trim();
    }
    
    /**
     * Validate query input
     */
    validateQuery(query) {
        if (!query || typeof query !== 'string') {
            return { valid: false, error: 'Query must be a non-empty string' };
        }
        const sanitized = this.sanitizeInput(query);
        if (sanitized.length < this.minQueryLength) {
            return { valid: false, error: 'Query is too short. Please provide more details.' };
        }
        if (sanitized.length > this.maxQueryLength) {
            return { valid: false, error: `Query is too long (max ${this.maxQueryLength} characters).` };
        }
        return { valid: true, sanitized };
    }
    
    /**
     * Get cached result
     */
    getCachedResult(query) {
        const cached = this.queryCache.get(query.toLowerCase().trim());
        if (cached) { this.cacheHits++; return cached; }
        this.cacheMisses++; return null;
    }
    
    /**
     * Cache result
     */
    cacheResult(query, result) {
        if (this.queryCache.size >= this.maxCacheSize) {
            const firstKey = this.queryCache.keys().next().value;
            this.queryCache.delete(firstKey);
        }
        this.queryCache.set(query.toLowerCase().trim(), result);
    }

    /**
     * Find fuzzy matches (enhanced with Levenshtein distance)
     * Updated to handle pipe-separated keys and typos
     */
    findFuzzyMatches(query, cutoff = 0.75) {
        if (!this.generalQueries) return [];
        
        const matches = [];
        const queryLower = this.normalizeQuery(query);
        
        for (const key of Object.keys(this.generalQueries)) {
            const keyVariants = this.getKeyVariants(key);
            let bestScore = 0;
            
            for (const variant of keyVariants) {
                const variantLower = this.normalizeQuery(variant);
                let score = 0;
                
                if (variantLower === queryLower) {
                    score = 1.0;
                } else if (variantLower.includes(queryLower) || queryLower.includes(variantLower)) {
                    score = Math.min(queryLower.length, variantLower.length) / Math.max(queryLower.length, variantLower.length);
                } else {
                    // Use Levenshtein distance for better typo handling
                    const distance = this.levenshteinDistance(queryLower, variantLower);
                    const maxLength = Math.max(queryLower.length, variantLower.length);
                    score = 1 - (distance / maxLength);
                    
                    // Fallback to character-based similarity if Levenshtein is low
                    if (score < 0.5) {
                        const chars1 = new Set(queryLower.split(''));
                        const chars2 = new Set(variantLower.split(''));
                        const charScore = this.calculateJaccardSimilarity(chars1, chars2);
                        score = Math.max(score, charScore);
                    }
                }
                
                if (score > bestScore) {
                    bestScore = score;
                }
            }
            
            if (bestScore >= cutoff) {
                matches.push({ key, score: bestScore });
            }
        }
        
        return matches.sort((a, b) => b.score - a.score);
    }

    /**
     * Get general answer with 3-layer semantic search (converted from Python)
     */
    getGeneralAnswer(query) {
        if (!this.generalQueries) {
            console.error('General queries not loaded');
            return null;
        }
        
        try {
            // Extract intent and generate alternatives
            const intentData = this.extractQueryIntent(query);
            const queryLower = intentData.normalized;
            const queryAlternatives = intentData.alternatives;
            
            console.log(`🔍 Query: "${query}" → Normalized: "${queryLower}"`);
            console.log(`🔍 Alternatives:`, queryAlternatives);
            
            // STRATEGY 1: Exact match on original and alternatives (including pipe-separated keys)
            for (const altQuery of [queryLower, ...queryAlternatives]) {
                const matchingKey = this.findMatchingKey(altQuery);
                if (matchingKey) {
                    console.log(`✅ Exact match found for '${altQuery}' → '${matchingKey.substring(0, 50)}...'`);
                    const result = this.generalQueries[matchingKey];
                    const answerText = typeof result === 'object' && result.answer ? result.answer : result;
                    return { intent: "general", answer: answerText, source: "exact_match" };
                } else {
                    console.log(`❌ No exact match for alternative: "${altQuery}"`);
                }
            }
            
            // STRATEGY 2: Fuzzy string matching
            for (const altQuery of queryAlternatives) {
                const matches = this.findFuzzyMatches(altQuery, 0.8);
                if (matches.length > 0) {
                    const bestMatch = matches[0];
                    console.log(`✅ Fuzzy match found: '${altQuery}' → '${bestMatch.key}'`);
                    const result = this.generalQueries[bestMatch.key];
                    const answerText = typeof result === 'object' && result.answer ? result.answer : result;
                    return { intent: "general", answer: answerText, source: "fuzzy_match" };
                }
            }
            
            // STRATEGY 3: Advanced semantic matching with expanded synonyms and n-grams
            const queryWords = new Set(queryLower.split(/\s+/));
            
            // Filter out stopwords that don't help matching
            const stopwords = ['is', 'are', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
            const filteredQueryWords = new Set(Array.from(queryWords).filter(word => !stopwords.includes(word)));
            
            // Extract n-grams for phrase matching (bigrams and trigrams)
            const bigrams = this.extractNgrams(queryLower, 2);
            const trigrams = this.extractNgrams(queryLower, 3);
            const phrases = new Set([...bigrams, ...trigrams]);
            
            // Expand query words with synonyms
            const expandedQuery = new Set(filteredQueryWords);
            for (const word of filteredQueryWords) {
                if (this.synonyms[word]) {
                    this.synonyms[word].forEach(synonym => expandedQuery.add(synonym));
                }
            }
            
            // Add semantic field expansion
            for (const word of filteredQueryWords) {
                for (const [field, relatedTerms] of Object.entries(this.semanticFields)) {
                    if (relatedTerms.includes(word)) {
                        relatedTerms.forEach(term => expandedQuery.add(term));
                        break;
                    }
                }
            }
            
            // Score-based matching (enhanced with phrase matching)
            let bestMatch = null;
            let bestScore = 0;
            
            for (const key of Object.keys(this.generalQueries)) {
                const keyVariants = this.getKeyVariants(key);
                
                for (const variant of keyVariants) {
                    const keyWords = new Set(this.normalizeQuery(variant).split(/\s+/));
                    const keyPhrases = new Set([...this.extractNgrams(this.normalizeQuery(variant), 2), ...this.extractNgrams(this.normalizeQuery(variant), 3)]);
                    
                    // Calculate similarity score (Jaccard similarity + word overlap + phrase matching)
                    const jaccardScore = this.calculateJaccardSimilarity(expandedQuery, keyWords);
                    const overlapScore = this.calculateWordOverlap(expandedQuery, keyWords);
                    
                    // Phrase matching score
                    const phraseMatches = [...phrases].filter(p => keyPhrases.has(p)).length;
                    const phraseScore = phrases.size > 0 ? phraseMatches / phrases.size : 0;
                    
                    // Word count similarity penalty - prevent matching very different length queries
                    const queryWordCount = filteredQueryWords.size;
                    const keyWordCount = keyWords.size;
                    const wordCountDiff = Math.abs(queryWordCount - keyWordCount);
                    const wordCountPenalty = wordCountDiff > 3 ? 0.5 : 1.0; // 50% penalty if >3 word difference
                    
                    // Combined score with phrase matching (Jaccard 25% + Overlap 60% + Phrase 15%)
                    let combinedScore = (jaccardScore * 0.25) + (overlapScore * 0.60) + (phraseScore * 0.15);
                    combinedScore *= wordCountPenalty;
                    
                    // Boost score if key query words match (important words)
                    const importantWords = ['library', 'book', 'books', 'timing', 'hours', 'fine', 'vpn', 'dspace', 'koha', 'technobooth', 'renewal', 'borrow', 'issue', 'issued', 'privilege', 'privileges', 'collection', 'total', 'many', 'number'];
                    const hasImportantMatch = Array.from(filteredQueryWords).some(word => 
                        importantWords.includes(word) && keyWords.has(word)
                    );
                    if (hasImportantMatch) {
                        combinedScore *= 1.2; // 20% boost for important word matches
                    }
                    
                    // Boost for exact phrase matches
                    if (phraseMatches > 0) {
                        combinedScore *= 1.15; // 15% boost for phrase matches
                    }
                    
                    // Strong penalty for mismatched key topics (prevent dspace matching to timing queries)
                    const queryHasTiming = Array.from(filteredQueryWords).some(w => ['open', 'timing', 'hours', 'schedule', 'close', 'today', 'time'].includes(w));
                    const keyHasDspace = variant.toLowerCase().includes('dspace') || variant.toLowerCase().includes('repository');
                    const keyHasKoha = variant.toLowerCase().includes('koha');
                    
                    if (queryHasTiming && (keyHasDspace || keyHasKoha)) {
                        combinedScore *= 0.1; // Heavy penalty - timing queries shouldn't match dspace/koha
                    }
                    
                    if (combinedScore > bestScore) {
                        bestScore = combinedScore;
                        bestMatch = key;
                    }
                }
            }
            
            // Dynamic threshold based on query type
            let threshold = 0.40; // Default threshold
            
            // Lower threshold for high-priority queries
            const isHighPriorityQuery = queryLower.includes('library') || 
                                       queryLower.includes('timing') || 
                                       queryLower.includes('hours') || 
                                       queryLower.includes('open') ||
                                       queryLower.includes('borrow') ||
                                       queryLower.includes('fine');
            
            if (isHighPriorityQuery) {
                threshold = 0.30; // More lenient for common queries
            }
            
            // Even lower threshold for very specific technical terms
            const hasSpecificTerm = queryLower.includes('technobooth') || 
                                   queryLower.includes('dspace') || 
                                   queryLower.includes('koha') ||
                                   queryLower.includes('vpn') ||
                                   queryLower.includes('opac');
            
            if (hasSpecificTerm) {
                threshold = 0.25; // Very lenient for specific terms
            }
            
            // Check if we have a match above threshold
            if (bestMatch && bestScore > threshold) {
                console.log(`✅ Semantic match found: '${query}' → '${bestMatch.substring(0, 60)}...' (score: ${bestScore.toFixed(2)}, threshold: ${threshold})`);
                const result = this.generalQueries[bestMatch];
                const answerText = typeof result === 'object' && result.answer ? result.answer : result;
                return { intent: "general", answer: answerText, source: "semantic_match", score: bestScore };
            }
            
            // Log failed query for analytics
            console.log(`⚠️ No match found for '${query}' (best: '${bestMatch ? bestMatch.substring(0, 40) : 'none'}...', score: ${bestScore.toFixed(2)}, threshold: ${threshold})`);
            this.logFailedQuery(query, bestMatch, bestScore);
            return null;
            
        } catch (error) {
            console.error('Error in getGeneralAnswer:', error);
            return null;
        }
    }

    /**
     * Generate clarification response (converted from Python)
     */
    generateClarificationResponse(query) {
        const queryLower = query.toLowerCase().trim();
        
        // Analyze query for context clues (converted from Python)
        const hasTimeWords = ['time', 'timing', 'hours', 'open', 'close', 'schedule', 'when'].some(word => queryLower.includes(word));
        const hasServiceWords = ['borrow', 'return', 'fine', 'penalty', 'issue', 'renew', 'membership'].some(word => queryLower.includes(word));
        const hasResourceWords = ['journal', 'database', 'eresource', 'vpn', 'online'].some(word => queryLower.includes(word));
        const hasFacilityWords = ['room', 'reading', 'technobooth', 'printer', 'wifi', 'computer'].some(word => queryLower.includes(word));
        
        // Generate dynamic clarification with varied prefixes (converted from Python)
        const clarificationPrefixes = [
            "🤔 <strong>I'd like to help, but I need more details.</strong><br><br>",
            "💭 <strong>Could you be more specific?</strong><br><br>",
            "❓ <strong>I want to give you the right information.</strong><br><br>",
            "🎯 <strong>Let me understand better.</strong><br><br>",
            "💡 <strong>I'm here to help!</strong><br><br>"
        ];
        
        const prefix = clarificationPrefixes[Math.floor(Math.random() * clarificationPrefixes.length)];
        
        let suggestions = [];
        
        if (hasTimeWords) {
            suggestions = [
                "📅 **Library hours and schedules**",
                "⏰ **Specific timing information**",
                "🕐 **Holiday and exam timings**"
            ];
        } else if (hasServiceWords) {
            suggestions = [
                "📖 **Book borrowing procedures**",
                "🔄 **Renewal and return policies**",
                "💰 **Fine and penalty information**"
            ];
        } else if (hasResourceWords) {
            suggestions = [
                "🌐 **E-resources and databases**",
                "📚 **Online journal access**",
                "🔐 **VPN and remote access**"
            ];
        } else if (hasFacilityWords) {
            suggestions = [
                "🏢 **Library facilities and services**",
                "💻 **Computer and printing services**",
                "📖 **Study rooms and spaces**"
            ];
        } else {
            suggestions = [
                "⏰ **Library hours and timings**",
                "📖 **Book borrowing and policies**",
                "💰 **Fine policies and charges**",
                "🌐 **E-resources and digital access**",
                "🏢 **Library facilities and services**"
            ];
        }
        
        const suggestionsList = suggestions.map(s => `• ${s}`).join('<br>');
        
        return `${prefix}${suggestionsList}<br><br>📞 <strong>Direct Help:</strong> libraryhelpdesk@iitrpr.ac.in`;
    }

    /**
     * Main query processing with validation and caching
     */
    async processQuery(query) {
        const startTime = Date.now();
        
        try {
            if (!this.isInitialized) await this.initialize();
            
            // Rate limiting
            if (!this.checkRateLimit()) {
                return {
                    response: "⚠️ Too many requests. Please wait.",
                    response_type: "rate_limited",
                    processing_time: Date.now() - startTime
                };
            }
            
            // Validate and sanitize
            const validation = this.validateQuery(query);
            if (!validation.valid) {
                return {
                    response: validation.error,
                    response_type: "validation_error",
                    processing_time: Date.now() - startTime
                };
            }
            
            const cleanQuery = validation.sanitized;
            
            // Check cache
            const cached = this.getCachedResult(cleanQuery);
            if (cached) {
                return { ...cached, from_cache: true, processing_time: Date.now() - startTime };
            }
            console.log(`🔍 Processing query: "${cleanQuery}"`);
            
            // Classify query type
            const queryType = this.classifyQuery(cleanQuery);
            
            if (queryType === 'greeting') {
                const greeting = this.getGreetingResponse(cleanQuery);
                const result = {
                    response: greeting,
                    response_type: "greeting",
                    processing_time: Date.now() - startTime
                };
                return result;
            }
            
            // Handle book search queries
            if (queryType === 'book_search') {
                const bookResult = await this.searchBooks(cleanQuery);
                return {
                    ...bookResult,
                    processing_time: Date.now() - startTime
                };
            }
            
            // Handle general queries
            const generalAnswer = this.getGeneralAnswer(cleanQuery);
            
            if (generalAnswer) {
                const formattedAnswer = this.formatResponse(generalAnswer.answer, cleanQuery);
                const result = {
                    response: formattedAnswer,
                    response_type: "general",
                    source: generalAnswer.source,
                    match_score: generalAnswer.score,
                    processing_time: Date.now() - startTime
                };
                this.cacheResult(cleanQuery, result);
                // Log general query
                this.logGeneralQuery(cleanQuery, result.response_type);
                return result;
            }

            // Fallback to book search for book-like or short queries
            const isBookLikeQuery = /\b(book|books|catalog|catalogue|opac|author|title|subject|search|find|look|novel|publication|isbn)\b/i.test(cleanQuery);
            const isShortQuery = cleanQuery.trim().split(/\s+/).length <= 2;
            if (this.bookSearchEnabled && (isBookLikeQuery || isShortQuery)) {
                const bookResult = await this.searchBooks(cleanQuery);
                return {
                    ...bookResult,
                    processing_time: Date.now() - startTime
                };
            }
            
            // Fallback clarification
            const clarificationResponse = this.generateClarificationResponse(cleanQuery);
            const result = {
                response: clarificationResponse,
                response_type: "clarification",
                processing_time: Date.now() - startTime
            };
            this.cacheResult(cleanQuery, result);
            // Log clarification query
            this.logGeneralQuery(cleanQuery, result.response_type);
            return result;
            
        } catch (error) {
            console.error('Error processing query:', error);
            return {
                response: "❌ Sorry, I encountered an error while processing your query. Please try again or contact the library directly.",
                response_type: "error",
                error: error.message,
                processing_time: Date.now() - startTime
            };
        }
    }

    /**
     * Get smart book suggestions based on a query
     */
    async getBookSuggestions(query) {
        try {
            if (!this.bookSearchEnabled) {
                return {
                    success: false,
                    suggestions: [],
                    message: 'Book search disabled'
                };
            }

            const apiPath = this.basePath + this.bookSearchApiPath.replace('book-search.php', 'book-suggestions.php');
            const url = apiPath + '?q=' + encodeURIComponent(query) + '&type=topic&limit=6';

            console.log('🔍 Fetching smart suggestions for:', query);
            const response = await fetch(url);
            const data = await response.json();

            if (data.success && data.suggestions) {
                return {
                    success: true,
                    suggestions: data.suggestions,
                    keywords: data.keywords || [],
                    type: data.type || 'topic_based'
                };
            }

            return {
                success: false,
                suggestions: [],
                message: 'No suggestions found'
            };

        } catch (error) {
            console.error('Error fetching book suggestions:', error);
            return {
                success: false,
                suggestions: [],
                error: error.message
            };
        }
    }

    /**
     * Format response with context-aware prefixes (converted from Python)
     */
    formatResponse(answer, query = "") {
        const queryLower = query.toLowerCase();
        
        // Context-aware prefixes (converted from Python)
        let prefix = "";
        
        if (queryLower.includes('hour') || queryLower.includes('timing') || queryLower.includes('time')) {
            prefix = "⏰ <strong>Library Hours:</strong><br><br>";
        } else if (queryLower.includes('fine') || queryLower.includes('penalty') || queryLower.includes('charge')) {
            prefix = "💰 <strong>Fine & Penalty Information:</strong><br><br>";
        } else if (queryLower.includes('e-resource') || queryLower.includes('online') || queryLower.includes('database')) {
            prefix = "🌐 <strong>Digital Resources:</strong><br><br>";
        } else if (queryLower.includes('contact') || queryLower.includes('phone') || queryLower.includes('email')) {
            prefix = "📞 <strong>Contact Information:</strong><br><br>";
        } else {
            const prefixes = [
                "💡 <strong>Here's what I found:</strong><br><br>",
                "ℹ️ <strong>Library Information:</strong><br><br>",
                "✨ <strong>Here's the information you need:</strong><br><br>",
                "📚 <strong>From our library database:</strong><br><br>"
            ];
            prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        }
        
        return prefix + answer;
    }

    /**
     * Log general query to backend for analytics
     */
    async logGeneralQuery(query, responseType) {
        try {
            const logUrl = 'lib_chat/backend/log-general-query.php';
            await fetch(logUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: query,
                    response_type: responseType
                })
            });
        } catch (error) {
            // Silent fail - don't disrupt user experience
            console.warn('Failed to log query:', error);
        }
    }
}

// Create global instance for use in chatbot
window.nalandaBrain = new NalandaBrain();

// Auto-initialize when script loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await window.nalandaBrain.initialize();
        console.log('🎉 Nalanda Brain ready for queries!');
    } catch (error) {
        console.error('Failed to auto-initialize Nalanda Brain:', error);
    }
});

// Make NalandaBrain available globally
window.NalandaBrain = NalandaBrain;
console.log('✅ NalandaBrain class registered on window object');

// Export for module use if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NalandaBrain;
}