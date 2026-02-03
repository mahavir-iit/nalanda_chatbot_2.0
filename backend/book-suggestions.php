<?php
/**
 * Nalanda Library - Smart Book Suggestions Engine
 * Provides intelligent book suggestions from general queries + search autocomplete
 * Version: 2.0 - Now with intelligent topic mapping
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'book-search.php';
require_once 'xlsx-reader.php';

class BookSuggestions {
    
    /**
     * Topic to keywords mapping for suggestion generation
     */
    private $topicKeywords = [
        // Library & Info Science
        'library' => ['library', 'information', 'knowledge', 'cataloging', 'classification', 'indexing'],
        'information' => ['information', 'data', 'knowledge', 'retrieval', 'organization'],
        
        // Programming & CS
        'programming' => ['python', 'java', 'javascript', 'programming', 'coding', 'algorithm', 'software'],
        'python' => ['python', 'programming', 'data', 'machine learning', 'automation'],
        'java' => ['java', 'programming', 'object-oriented', 'android', 'enterprise'],
        'web' => ['web', 'html', 'css', 'javascript', 'frontend', 'backend', 'server'],
        'database' => ['database', 'sql', 'nosql', 'mongodb', 'postgresql', 'data'],
        'machine learning' => ['machine learning', 'ai', 'neural', 'deep learning', 'artificial intelligence'],
        'ai' => ['artificial intelligence', 'machine learning', 'neural', 'algorithm'],
        'data science' => ['data science', 'analytics', 'machine learning', 'data', 'statistics'],
        'network' => ['network', 'communication', 'protocol', 'tcp', 'internet'],
        'security' => ['security', 'cryptography', 'encryption', 'cyber', 'authentication'],
        
        // Mathematics
        'mathematics' => ['mathematics', 'math', 'calculus', 'linear algebra', 'discrete', 'number theory'],
        'calculus' => ['calculus', 'mathematics', 'analysis', 'derivative', 'integral'],
        'algebra' => ['algebra', 'linear algebra', 'mathematics', 'equations', 'matrix'],
        'statistics' => ['statistics', 'probability', 'data analysis', 'mathematical'],
        'probability' => ['probability', 'statistics', 'random', 'distribution', 'stochastic'],
        'geometry' => ['geometry', 'topology', 'euclidean', 'space'],
        
        // Physics
        'physics' => ['physics', 'mechanics', 'thermodynamics', 'quantum', 'relativity'],
        'quantum' => ['quantum', 'mechanics', 'physics', 'relativity', 'atomic'],
        'mechanics' => ['mechanics', 'physics', 'motion', 'force', 'energy'],
        'thermodynamics' => ['thermodynamics', 'energy', 'heat', 'physics'],
        'optics' => ['optics', 'light', 'laser', 'photonics'],
        
        // Chemistry
        'chemistry' => ['chemistry', 'organic', 'inorganic', 'chemical', 'reaction', 'molecule'],
        'organic chemistry' => ['organic', 'chemistry', 'synthesis', 'reaction', 'compound'],
        'biochemistry' => ['biochemistry', 'protein', 'enzyme', 'metabolism'],
        
        // Electronics & Engineering
        'electronics' => ['electronics', 'circuit', 'signal', 'amplifier', 'semiconductor'],
        'circuits' => ['circuits', 'electronics', 'current', 'voltage', 'resistor'],
        'embedded systems' => ['embedded', 'microcontroller', 'arduino', 'iot', 'firmware'],
        'signal processing' => ['signal', 'processing', 'filter', 'frequency', 'fourier'],
        'power electronics' => ['power', 'electronics', 'converter', 'inverter'],
        
        // Literature & Languages
        'english' => ['english', 'literature', 'poetry', 'novel', 'writing', 'grammar'],
        'literature' => ['literature', 'novel', 'poetry', 'drama', 'fiction', 'author'],
        'hindi' => ['hindi', 'language', 'literature', 'writing', 'sanskrit'],
        'writing' => ['writing', 'composition', 'grammar', 'style', 'technical'],
        
        // History & Philosophy
        'history' => ['history', 'ancient', 'medieval', 'modern', 'civilization', 'culture'],
        'philosophy' => ['philosophy', 'ethics', 'logic', 'metaphysics', 'thought'],
        'ancient' => ['ancient', 'history', 'civilization', 'greek', 'roman'],
        'modern history' => ['modern', 'history', 'contemporary', 'revolution'],
        
        // Economics & Business
        'economics' => ['economics', 'microeconomics', 'macroeconomics', 'trade', 'market'],
        'business' => ['business', 'management', 'finance', 'marketing', 'entrepreneurship'],
        'finance' => ['finance', 'investment', 'stock', 'market', 'business'],
        'accounting' => ['accounting', 'finance', 'audit', 'tax'],
        
        // Biology & Life Sciences
        'biology' => ['biology', 'cell', 'genetics', 'evolution', 'organism'],
        'genetics' => ['genetics', 'dna', 'gene', 'inheritance', 'mutation'],
        'microbiology' => ['microbiology', 'bacteria', 'virus', 'microorganism'],
        
        // Research & Academic
        'research' => ['research', 'methodology', 'academic', 'thesis', 'paper', 'study'],
        'essay' => ['essay', 'writing', 'composition', 'academic'],
        'design' => ['design', 'graphic', 'ui', 'ux', 'visual', 'art'],
        'artificial' => ['artificial', 'intelligence', 'machine', 'learning', 'neural'],
    ];
    
    /**
     * Get smart suggestions based on query/topic
     */
    public function getSuggestions($query, $filePath, $cachePath, $limit = 6, $type = 'smart') {
        if (empty($query)) {
            return [
                'success' => true,
                'suggestions' => [],
                'message' => 'Empty query',
                'type' => 'empty'
            ];
        }
        
        // Determine suggestion type
        if ($type === 'auto') {
            $type = $this->determineSuggestionType($query);
        }
        
        try {
            // Use auto-cleaning function
            $result = readAccessionRegisterXLSX($filePath, $cachePath);
            $rows = $result['books'] ?? [];
            if (empty($rows)) {
                return [
                    'success' => false,
                    'suggestions' => [],
                    'message' => 'No data available'
                ];
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'suggestions' => [],
                'error' => $e->getMessage()
            ];
        }
        
        if ($type === 'topic') {
            // Get topic-based recommendations
            return $this->getTopicSuggestions($query, $rows, $limit);
        } else {
            // Get autocomplete suggestions
            return $this->getAutocompleteSuggestions($query, $rows, $limit);
        }
    }
    
    /**
     * Determine suggestion type based on query length and context
     */
    private function determineSuggestionType($query) {
        $words = count(preg_split('/\s+/', trim($query)));
        // Short queries (1-2 words) are treated as autocomplete
        // Longer queries are treated as topic-based
        return $words >= 3 ? 'topic' : 'auto';
    }
    
    /**
     * Get autocomplete suggestions as user types
     */
    private function getAutocompleteSuggestions($query, $rows, $limit) {
        $query = strtolower($query);
        $suggestions = [];
        $seenTitles = [];
        $seenAuthors = [];
        
        // Search through ALL rows to find author matches (don't break early for author searches)
        $authorMatches = [];
        $titleMatches = [];
        
        foreach ($rows as $book) {
            $title = $book['title'] ?? '';
            $author = $book['author'] ?? '';
            
            // Title match - highest priority
            if (stripos($title, $query) === 0) {
                $key = strtolower($title);
                if (!isset($seenTitles[$key])) {
                    $titleMatches[] = [
                        'text' => $title,
                        'title' => $title,
                        'type' => 'title',
                        'icon' => '📖',
                        'score' => 10
                    ];
                    $seenTitles[$key] = true;
                }
            }
            // Title contains - medium priority
            else if (stripos($title, $query) !== false) {
                $key = strtolower($title);
                if (!isset($seenTitles[$key])) {
                    $titleMatches[] = [
                        'text' => $title,
                        'title' => $title,
                        'type' => 'title',
                        'icon' => '📖',
                        'score' => 5
                    ];
                    $seenTitles[$key] = true;
                }
            }
            
            // Author match - collect ALL books by matching author (don't deduplicate with titles)
            if (!empty($author) && stripos($author, $query) !== false) {
                $accession = $book['accession_number'] ?? '';
                // Use unique key per book (title + accession ensures each book copy is shown)
                $key = strtolower($title) . '||' . $accession;
                if (!isset($seenAuthors[$key])) {
                    $authorMatches[] = [
                        'text' => $title . ' (by ' . $author . ')',
                        'title' => $title,
                        'author' => $author,
                        'accession' => $accession,
                        'type' => 'author-book',
                        'icon' => '📚',
                        'score' => 8
                    ];
                    $seenAuthors[$key] = true;
                }
            }
        }
        
        // Combine: title matches first, then all author matches
        $suggestions = array_merge($titleMatches, $authorMatches);
        
        // Sort by score
        usort($suggestions, function($a, $b) {
            return $b['score'] - $a['score'];
        });
        
        return [
            'success' => true,
            'suggestions' => array_slice($suggestions, 0, $limit),
            'query' => $query,
            'type' => 'autocomplete',
            'count' => count($suggestions)
        ];
    }
    
    /**
     * Get topic-based book recommendations
     */
    private function getTopicSuggestions($query, $rows, $limit) {
        $keywords = $this->extractKeywords($query);
        
        if (empty($keywords)) {
            return $this->getAutocompleteSuggestions($query, $rows, $limit);
        }
        
        // Score books based on keywords
        $scoredBooks = [];
        foreach ($rows as $book) {
            $score = $this->scoreBook($book, $keywords);
            if ($score > 0) {
                $book['_score'] = $score;
                $scoredBooks[] = $book;
            }
        }
        
        // Sort by score
        usort($scoredBooks, function($a, $b) {
            return $b['_score'] - $a['_score'];
        });
        
        // Deduplicate by title/author/publisher (not accession) to show only unique books
        $suggestions = [];
        $seen = [];
        foreach ($scoredBooks as $book) {
            // Use title + author + publisher for deduplication
            // This hides duplicate copies of same book
            $publisher = strtolower($book['publisher'] ?? $book['publishercode'] ?? '');
            $key = strtolower($book['title'] ?? '') . '|' . 
                   strtolower($book['author'] ?? '') . '|' .
                   $publisher;
            
            if (!isset($seen[$key])) {
                $seen[$key] = true;
                $accession = $book['accession_number'] ?? '';
                $suggestions[] = [
                    'text' => $book['title'] ?? 'Unknown',
                    'title' => $book['title'] ?? 'Unknown',
                    'author' => $book['author'] ?? 'N/A',
                    'accession' => $accession,
                    'type' => 'topic_recommendation',
                    'icon' => '💡',
                    'score' => round($book['_score'], 2),
                    'reason' => $this->getRecommendationReason($keywords, $book)
                ];
                
                if (count($suggestions) >= $limit) {
                    break;
                }
            }
        }
        
        return [
            'success' => true,
            'suggestions' => $suggestions,
            'keywords' => $keywords,
            'type' => 'topic_based',
            'count' => count($suggestions)
        ];
    }
    
    /**
     * Extract main keywords from query
     */
    private function extractKeywords($query) {
        $query = strtolower($query);

        // Remove common stopwords
        $stopwords = ['the', 'a', 'an', 'and', 'or', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 
                      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
                      'can', 'about', 'for', 'to', 'of', 'in', 'on', 'at', 'by', 'from', 'with',
                      'what', 'when', 'where', 'why', 'how', 'if', 'i', 'you', 'he', 'she', 'it',
                      'me', 'him', 'her', 'tell', 'give', 'search', 'find', 'look', 'suggest', 'want',
                      'need', 'help', 'me', 'my', 'please', 'would', 'could', 'can', 'show', 'book'];
        
        $words = preg_split('/[\s,\-\.!?]+/', $query, -1, PREG_SPLIT_NO_EMPTY);
        $keywords = array_filter($words, function($w) use ($stopwords) {
            return strlen($w) > 2 && !in_array($w, $stopwords);
        });
        
        return array_values(array_unique($keywords));
    }
    
    /**
     * Score a book based on query keywords
     */
    private function scoreBook($book, $keywords) {
        $score = 0;
        $title = strtolower($book['title'] ?? '');
        $author = strtolower($book['author'] ?? '');
        $publisher = strtolower($book['publisher'] ?? '');
        
        foreach ($keywords as $keyword) {
            // Direct matches
            if (strpos($title, $keyword) !== false) {
                $score += 5;
            }
            if (strpos($author, $keyword) !== false) {
                $score += 3;
            }
            if (strpos($publisher, $keyword) !== false) {
                $score += 1;
            }
            
            // Check topic keywords
            if (isset($this->topicKeywords[$keyword])) {
                foreach ($this->topicKeywords[$keyword] as $relatedKeyword) {
                    if (strpos($title, $relatedKeyword) !== false) {
                        $score += 2;
                    }
                }
            }
        }
        
        return $score;
    }
    
    /**
     * Generate human-readable recommendation reason
     */
    private function getRecommendationReason($keywords, $book) {
        $title = strtolower($book['title'] ?? '');
        
        foreach ($keywords as $keyword) {
            if (strpos($title, $keyword) !== false) {
                return "Related to: <strong>" . htmlspecialchars($keyword) . "</strong>";
            }
        }
        
        return "Recommended for your interest";
    }
}

// Handle API request
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['q'])) {
    $query = isset($_GET['q']) ? trim($_GET['q']) : '';
    $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 20) : 15;
    $type = isset($_GET['type']) ? $_GET['type'] : 'auto';
    
    $filePath = __DIR__ . '/../acc register.xlsx';
    // Auto-cleaning cache (automatically cleans when file updates)
    $cachePath = __DIR__ . '/acc-register-cache-v3.json';
    
    $suggester = new BookSuggestions();
    $result = $suggester->getSuggestions($query, $filePath, $cachePath, $limit, $type);
    
    echo json_encode($result, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    exit();
}

?>
