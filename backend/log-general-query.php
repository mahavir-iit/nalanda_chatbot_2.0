<?php
/**
 * Nalanda Library - General Query Logger Endpoint
 * Logs general (non-book) queries from the chatbot
 */

// Security Headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://www.iitrpr.ac.in');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/query-logger.php';
require_once __DIR__ . '/rate-limiter.php';

// Rate limiting
$rateLimiter = new RateLimiter(40, 60); // 40 requests per minute

if (!$rateLimiter->checkLimit()) {
    http_response_code(429);
    echo json_encode(['success' => false, 'error' => 'Rate limit exceeded']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate and sanitize input
    $query = isset($input['query']) ? trim(strip_tags($input['query'])) : '';
    $responseType = isset($input['response_type']) ? preg_replace('/[^a-z_]/', '', strtolower($input['response_type'])) : 'unknown';
    
    // Validate query length
    if (!empty($query) && strlen($query) <= 1000) {
        logQuery($query, 'general_query', 0);
        echo json_encode(['success' => true, 'logged' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Invalid query']);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}
