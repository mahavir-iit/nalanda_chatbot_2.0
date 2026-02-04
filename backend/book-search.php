<?php
/**
 * Nalanda Library - Book Search API
 * Searches OPAC (Koha) and returns real book results
 */

// Security Headers
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://www.iitrpr.ac.in');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');
header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");

// Force HTTPS (except for localhost development)
$isLocalhost = in_array($_SERVER['HTTP_HOST'], ['localhost', '127.0.0.1', '::1'], true);
if (!$isLocalhost && (empty($_SERVER['HTTPS']) || $_SERVER['HTTPS'] === 'off')) {
    header('Location: https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only handle direct requests to this file (not when included by other files)
if (basename($_SERVER['PHP_SELF']) === 'book-search.php') {
    // Rate limiting
    require_once __DIR__ . '/rate-limiter.php';
    $rateLimiter = new RateLimiter(40, 60); // 40 requests per minute
    
    if (!$rateLimiter->checkLimit()) {
        http_response_code(429);
        echo json_encode([
            'success' => false,
            'message' => 'Too many requests. Please try again later.',
            'code' => 'RATE_LIMIT_EXCEEDED'
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
    
    // Get and sanitize parameters
    $query = isset($_GET['q']) ? trim(strip_tags($_GET['q'])) : '';
    $searchType = isset($_GET['type']) ? preg_replace('/[^a-z_]/', '', strtolower($_GET['type'])) : 'all';
    $limit = isset($_GET['limit']) ? min(50, max(1, (int)$_GET['limit'])) : 5; // Limit between 1-50

    // Validate query length and characters
    if (empty($query) || strlen($query) < 2 || strlen($query) > 200) {
        echo json_encode([
            'success' => false,
            'message' => 'Please enter at least 2 characters to search',
            'code' => 'INVALID_QUERY',
            'opacUrl' => 'https://opac.iitrpr.ac.in/'
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // Search accession register XLSX first
    require_once __DIR__ . '/xlsx-reader.php';
    require_once __DIR__ . '/query-logger.php';
    $registerPath = __DIR__ . '/../acc register.xlsx';
    // Auto-cleaning cache (automatically cleans when file updates)
    $cachePath = __DIR__ . '/acc-register-cache-v3.json';
    $opacStatusMap = buildOpacStatusMap($query);
    $results = searchAccessionRegister($registerPath, $query, $limit, $opacStatusMap, $cachePath);

    // If no XLSX results, try OPAC API
    if (count($results) === 0) {
        $results = searchKohaOPAC($query, $limit);
    }

    // Log the book search query
    logQuery($query, 'book_search', count($results));

    // Generate OPAC search URL
    $opacUrl = 'https://opac.iitrpr.ac.in/cgi-bin/koha/opac-search.pl?q=' . urlencode($query);

    // Return results
    echo json_encode([
        'success' => true,
        'query' => $query,
        'searchType' => $searchType,
        'totalResults' => count($results),
        'results' => $results,
        'opacUrl' => $opacUrl,
        'message' => count($results) > 0 ? 'Books found in OPAC' : 'No books found - view OPAC for complete search'
    ], JSON_UNESCAPED_UNICODE);
}

/**
 * Search Koha OPAC using REST API
 */
function searchKohaOPAC($query, $limit = 5) {
    $results = [];
    
    try {
        // Koha REST API endpoint
        $apiUrl = 'https://opac.iitrpr.ac.in/api/v1/biblios?q=' . urlencode($query) . '&_per_page=' . $limit;
        
        // Set up cURL with proper headers
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Accept: application/json',
            'User-Agent: NalandaChatbot/1.0'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200 || !$response) {
            return fallbackSearch($query, $limit);
        }
        
        $books = json_decode($response, true);
        
        if (!is_array($books)) {
            return fallbackSearch($query, $limit);
        }
        
        // Format results
        foreach ($books as $book) {
            if (count($results) >= $limit) break;
            
            $formattedBook = [
                'id' => $book['biblionumber'] ?? 'N/A',
                'title' => $book['title'] ?? 'Unknown Title',
                'author' => $book['author'] ?? 'Unknown Author',
                'isbn' => $book['isbn'] ?? '',
                'publisher' => $book['publisher'] ?? 'Unknown',
                'year' => $book['publication_date'] ?? '',
                'subjects' => isset($book['subjects']) ? (array)$book['subjects'] : [],
                'availability' => getAvailability($book),
                'location' => getLocation($book),
                'callNumber' => $book['call_number'] ?? '',
                'copies' => getCopiesCount($book)
            ];
            
            $results[] = $formattedBook;
        }
        
    } catch (Exception $e) {
        error_log('OPAC search error: ' . $e->getMessage());
        return fallbackSearch($query, $limit);
    }
    
    return $results;
}

/**
 * Search accession register XLSX
 */
function searchAccessionRegister($filePath, $query, $limit = 5, $opacStatusMap = [], $cachePath = null) {
    static $cache = null;
    if ($cache === null) {
        // Use auto-cleaning function that automatically cleans data
        $result = readAccessionRegisterXLSX($filePath, $cachePath);
        $cache = $result['books'] ?? [];
    }

    if (empty($cache)) {
        return [];
    }

    $queryLower = mb_strtolower(trim($query));
    $results = [];
    
    // Split query into words for partial matching
    $queryWords = preg_split('/\s+/', $queryLower);
    $queryWords = array_filter($queryWords, function($word) {
        return mb_strlen($word) > 2; // Only words with 3+ chars
    });

    foreach ($cache as $row) {
        $score = 0;
        $haystack = mb_strtolower(implode(' ', $row));

        // Full query match in any field
        if (mb_stripos($haystack, $queryLower) !== false) {
            $score += 10;
        }

        $title = $row['title'] ?? $row['book_title'] ?? $row['name_of_book'] ?? '';
        $author = $row['author'] ?? $row['author_name'] ?? '';
        $publisher = $row['publisher'] ?? '';
        $publisherCode = $row['publishercode'] ?? '';
        $itemNumber = $row['item_number'] ?? $row['item_no'] ?? $row['item'] ?? '';
        $copies = $row['no_of_copies'] ?? $row['number_of_copies'] ?? $row['copies'] ?? '';
        $callNumber = $row['itemcallnumber'] ?? $row['call_number'] ?? $row['call_no'] ?? '';
        $accessionNumber = $row['accession_number'] ?? $row['accession_no'] ?? $row['accession'] ?? $row['acc_no'] ?? 'N/A';
        $availabilityFromFile = $row['availablity'] ?? $row['availability'] ?? '';
        $availability = 'Check OPAC'; // Will be rendered as 'click here' link in frontend

        if ($title) {
            $titleKey = mb_strtolower(trim($title));
            if (isset($opacStatusMap[$titleKey])) {
                $availability = $opacStatusMap[$titleKey];
            } elseif (!empty($availabilityFromFile)) {
                $availability = $availabilityFromFile;
            } else {
                $availability = 'Check OPAC'; // This will be rendered as 'click here' link in frontend
            }
        }

        $titleLower = mb_strtolower($title);
        $authorLower = mb_strtolower($author);
        
        // Exact phrase match in title (highest score)
        if ($title && mb_stripos($titleLower, $queryLower) !== false) {
            $score += 100;
        }
        // Exact phrase match in author
        if ($author && mb_stripos($authorLower, $queryLower) !== false) {
            $score += 60;
        }
        
        // Partial word matching for better fuzzy search
        $titleWordsMatched = 0;
        $authorWordsMatched = 0;
        foreach ($queryWords as $word) {
            if (mb_stripos($titleLower, $word) !== false) {
                $titleWordsMatched++;
                $score += 15; // Score per word match in title
            }
            if (mb_stripos($authorLower, $word) !== false) {
                $authorWordsMatched++;
                $score += 10; // Score per word match in author
            }
        }
        
        // Bonus for matching multiple words
        if (count($queryWords) > 1) {
            $matchRatio = $titleWordsMatched / count($queryWords);
            if ($matchRatio > 0.5) {
                $score += 20; // Bonus for matching >50% of query words
            }
        }

        if ($score > 0) {
            // Generate OPAC URL for this specific book (title + author for precise results)
            $searchQuery = trim($title);
            if (!empty($author)) {
                $searchQuery .= ' ' . trim($author);
            }
            $bookOpacUrl = 'https://opac.iitrpr.ac.in/cgi-bin/koha/opac-search.pl?q=' . urlencode($searchQuery);
            
            $results[] = [
                'id' => $accessionNumber,
                'title' => $title ?: 'Unknown Title',
                'author' => $author ?: 'Unknown Author',
                'isbn' => $row['isbn'] ?? '',
                'publisher' => $publisher,
                'publisherCode' => $publisherCode,
                'year' => $row['year'] ?? $row['publication_year'] ?? '',
                'subjects' => [],
                'availability' => $availability,
                'location' => $row['location'] ?? $row['shelf'] ?? 'See OPAC for location',
                'callNumber' => $callNumber,
                'itemNumber' => $itemNumber,
                'copies' => $copies !== '' ? (int)$copies : 1,
                'matchScore' => $score,
                'opacUrl' => $bookOpacUrl
            ];
        }
    }

    // Merge duplicates by title + author + publisher
    if (!empty($results)) {
        $merged = [];
        foreach ($results as $item) {
            $titleKey = mb_strtolower(trim($item['title'] ?? ''));
            $authorKey = mb_strtolower(trim($item['author'] ?? ''));
            $publisherKey = mb_strtolower(trim($item['publisher'] ?? ''));
            $mergeKey = $titleKey . '|' . $authorKey . '|' . $publisherKey;

            if (!isset($merged[$mergeKey])) {
                $merged[$mergeKey] = $item;
                // Initialize accession numbers array
                if (!isset($merged[$mergeKey]['accessionNumbers'])) {
                    $merged[$mergeKey]['accessionNumbers'] = [];
                }
                if (!empty($item['id'])) {
                    $merged[$mergeKey]['accessionNumbers'][] = $item['id'];
                }
                continue;
            }

            $merged[$mergeKey]['copies'] = (int)($merged[$mergeKey]['copies'] ?? 1) + (int)($item['copies'] ?? 1);
            
            // Initialize accession numbers array if not exists
            if (!isset($merged[$mergeKey]['accessionNumbers'])) {
                $merged[$mergeKey]['accessionNumbers'] = [];
                // Add the original item's accession if it exists
                if (!empty($merged[$mergeKey]['id'])) {
                    $merged[$mergeKey]['accessionNumbers'][] = $merged[$mergeKey]['id'];
                }
            }
            
            // Collect all accession numbers
            if (!empty($item['id']) && !in_array($item['id'], $merged[$mergeKey]['accessionNumbers'])) {
                $merged[$mergeKey]['accessionNumbers'][] = $item['id'];
            }

            if (empty($merged[$mergeKey]['callNumber']) && !empty($item['callNumber'])) {
                $merged[$mergeKey]['callNumber'] = $item['callNumber'];
            }
            if (empty($merged[$mergeKey]['publisherCode']) && !empty($item['publisherCode'])) {
                $merged[$mergeKey]['publisherCode'] = $item['publisherCode'];
            }
            if (empty($merged[$mergeKey]['itemNumber']) && !empty($item['itemNumber'])) {
                $merged[$mergeKey]['itemNumber'] = $item['itemNumber'];
            }

            if (($item['matchScore'] ?? 0) > ($merged[$mergeKey]['matchScore'] ?? 0)) {
                $merged[$mergeKey]['matchScore'] = $item['matchScore'];
            }
        }
        $results = array_values($merged);
    }

    usort($results, function($a, $b) {
        return $b['matchScore'] <=> $a['matchScore'];
    });

    $results = array_slice($results, 0, $limit);
    foreach ($results as &$r) {
        unset($r['matchScore']);
    }

    return $results;
}

/**
 * Build OPAC availability map by title (lowercased)
 */
function buildOpacStatusMap($query) {
    $map = [];
    $searchUrl = 'https://opac.iitrpr.ac.in/cgi-bin/koha/opac-search.pl';
    $htmlUrl = $searchUrl . '?' . http_build_query(['q' => $query]);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $htmlUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 6);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'User-Agent: NalandaChatbot/1.0'
    ]);

    $htmlResponse = curl_exec($ch);
    curl_close($ch);

    if (!$htmlResponse) {
        return $map;
    }

    $items = parseOpacHtmlResultsWithAvailability($htmlResponse);
    foreach ($items as $item) {
        $titleKey = mb_strtolower(trim($item['title']));
        if ($titleKey !== '') {
            $map[$titleKey] = $item['availability'] ?? 'Check OPAC';
        }
    }

    return $map;
}

/**
 * Parse OPAC HTML search results with availability heuristics
 */
function parseOpacHtmlResultsWithAvailability($html) {
    $results = [];

    libxml_use_internal_errors(true);
    $dom = new DOMDocument();
    $dom->loadHTML($html);
    $xpath = new DOMXPath($dom);

    $titleNodes = $xpath->query("//a[contains(@class,'title') or contains(@class,'title-link') or @itemprop='name']");

    foreach ($titleNodes as $node) {
        $title = trim($node->textContent);
        if ($title === '') continue;

        $recordNode = $node->parentNode;
        while ($recordNode && $recordNode->nodeType === XML_ELEMENT_NODE) {
            $classAttr = $recordNode->attributes && $recordNode->attributes->getNamedItem('class') ? $recordNode->attributes->getNamedItem('class')->nodeValue : '';
            if (preg_match('/record|result|search/i', $classAttr)) {
                break;
            }
            $recordNode = $recordNode->parentNode;
        }

        $availability = 'Check OPAC';
        if ($recordNode) {
            $availabilityNode = $xpath->query(".//*[contains(@class,'availability') or contains(@class,'item-status') or contains(text(),'Available') or contains(text(),'Checked') or contains(text(),'Not for loan')]", $recordNode)->item(0);
            if ($availabilityNode) {
                $availabilityText = trim($availabilityNode->textContent);
                if ($availabilityText !== '') {
                    $availability = $availabilityText;
                }
            }
        }

        $results[] = [
            'title' => $title,
            'availability' => $availability
        ];
    }

    return $results;
}

/**
 * Fallback search using Z39.50 gateway or simple title search
 */
function fallbackSearch($query, $limit = 5) {
    $results = [];
    
    try {
        // Try searching via OAI-PMH or Z39.50 interface
        $searchUrl = 'https://opac.iitrpr.ac.in/cgi-bin/koha/opac-search.pl';
        
        $params = [
            'q' => $query,
            'idx' => 'title',
            'format' => 'rss2'
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $searchUrl . '?' . http_build_query($params));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        if ($response) {
            // Parse RSS feed
            $xml = @simplexml_load_string($response);
            if ($xml) {
                foreach ($xml->channel->item as $item) {
                    if (count($results) >= $limit) break;
                    
                    $description = (string)$item->description;
                    
                    $results[] = [
                        'id' => 'web_' . md5((string)$item->link),
                        'title' => (string)$item->title,
                        'author' => extractFromDescription($description, 'Author'),
                        'isbn' => extractFromDescription($description, 'ISBN'),
                        'publisher' => extractFromDescription($description, 'Publisher'),
                        'year' => extractFromDescription($description, 'Date'),
                        'subjects' => [],
                        'availability' => 'Check OPAC',
                        'location' => extractFromDescription($description, 'Location'),
                        'callNumber' => extractFromDescription($description, 'Call Number'),
                        'copies' => 1
                    ];
                }
            }
        }

        // If RSS returns no results, fall back to HTML parsing
        if (count($results) === 0) {
            // Small delay before HTML scrape to reduce load and avoid OPAC blocking
            $minDelayMs = 600;
            $maxDelayMs = 1200;
            $delayMs = random_int($minDelayMs, $maxDelayMs);
            usleep($delayMs * 1000);

            $htmlParams = [
                'q' => $query
            ];
            $htmlUrl = $searchUrl . '?' . http_build_query($htmlParams);
            
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $htmlUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 6);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'User-Agent: NalandaChatbot/1.0'
            ]);
            
            $htmlResponse = curl_exec($ch);
            curl_close($ch);
            
            if ($htmlResponse) {
                $results = parseOpacHtmlResults($htmlResponse, $limit);
            }

            // If still no results, try a shorter prefix (e.g., "pyth")
            if (count($results) === 0 && strlen($query) > 4) {
                $prefixQuery = substr($query, 0, 4);
                $prefixUrl = $searchUrl . '?' . http_build_query(['q' => $prefixQuery]);
                
                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, $prefixUrl);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_TIMEOUT, 6);
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                curl_setopt($ch, CURLOPT_HTTPHEADER, [
                    'User-Agent: NalandaChatbot/1.0'
                ]);
                
                $prefixHtml = curl_exec($ch);
                curl_close($ch);
                
                if ($prefixHtml) {
                    $results = parseOpacHtmlResults($prefixHtml, $limit);
                }
            }
        }
        
    } catch (Exception $e) {
        error_log('Fallback search error: ' . $e->getMessage());
    }
    
    return $results;
}

/**
 * Parse OPAC HTML search results
 */
function parseOpacHtmlResults($html, $limit = 5) {
    $results = [];
    
    libxml_use_internal_errors(true);
    $dom = new DOMDocument();
    $dom->loadHTML($html);
    $xpath = new DOMXPath($dom);
    
    $titleNodes = $xpath->query("//a[contains(@class,'title') or contains(@class,'title-link') or @itemprop='name']");
    
    foreach ($titleNodes as $node) {
        if (count($results) >= $limit) break;
        
        $title = trim($node->textContent);
        if ($title === '') continue;
        
        $recordNode = $node->parentNode;
        while ($recordNode && $recordNode->nodeType === XML_ELEMENT_NODE) {
            $classAttr = $recordNode->attributes && $recordNode->attributes->getNamedItem('class') ? $recordNode->attributes->getNamedItem('class')->nodeValue : '';
            if (preg_match('/record|result|search/i', $classAttr)) {
                break;
            }
            $recordNode = $recordNode->parentNode;
        }
        
        $author = '';
        $publisher = '';
        $year = '';
        $callNumber = '';
        $location = '';
        
        if ($recordNode) {
            $authorNode = $xpath->query(".//span[contains(@class,'author') or @itemprop='author']", $recordNode)->item(0);
            $publisherNode = $xpath->query(".//span[contains(@class,'publisher') or contains(@class,'publication')]", $recordNode)->item(0);
            $yearNode = $xpath->query(".//span[contains(@class,'date') or contains(@class,'year') or @itemprop='datePublished']", $recordNode)->item(0);
            $callNode = $xpath->query(".//span[contains(@class,'call') or contains(@class,'callnumber')]", $recordNode)->item(0);
            $locationNode = $xpath->query(".//span[contains(@class,'location') or contains(@class,'branch')]", $recordNode)->item(0);
            
            if ($authorNode) $author = trim($authorNode->textContent);
            if ($publisherNode) $publisher = trim($publisherNode->textContent);
            if ($yearNode) $year = trim($yearNode->textContent);
            if ($callNode) $callNumber = trim($callNode->textContent);
            if ($locationNode) $location = trim($locationNode->textContent);
        }
        
        $results[] = [
            'id' => 'opac_' . md5($title),
            'title' => $title,
            'author' => $author,
            'isbn' => '',
            'publisher' => $publisher,
            'year' => $year,
            'subjects' => [],
            'availability' => 'Check OPAC',
            'location' => $location ?: 'See OPAC for location',
            'callNumber' => $callNumber,
            'copies' => 1
        ];
    }
    
    return $results;
}

/**
 * Extract field from book description
 */
function extractFromDescription($description, $field) {
    $pattern = '/' . preg_quote($field, '/') . ':\s*([^<\n]+)/i';
    if (preg_match($pattern, $description, $matches)) {
        return trim($matches[1]);
    }
    return '';
}

/**
 * Get availability status
 */
function getAvailability($book) {
    if (isset($book['available_count'])) {
        return ($book['available_count'] > 0) ? 'Available' : 'Checked Out';
    }
    return 'Check OPAC';
}

/**
 * Get location from book data
 */
function getLocation($book) {
    if (isset($book['holdings'])) {
        foreach ($book['holdings'] as $holding) {
            if (isset($holding['location'])) {
                return $holding['location'];
            }
        }
    }
    return 'See OPAC for location';
}

/**
 * Get copies count
 */
function getCopiesCount($book) {
    if (isset($book['total_count'])) {
        return (int)$book['total_count'];
    }
    if (isset($book['available_count'])) {
        return (int)$book['available_count'];
    }
    return 1;
}

?>
