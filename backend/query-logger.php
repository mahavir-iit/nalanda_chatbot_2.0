<?php
/**
 * Nalanda Library - Query Logger
 * Logs all queries with type (book search vs general query)
 */

function logQuery($queryText, $queryType, $resultCount = 0) {
    $logFile = __DIR__ . '/query-log.txt';
    
    // Sanitize inputs to prevent log injection
    $queryText = preg_replace('/[\r\n\t]+/', ' ', $queryText); // Remove newlines
    $queryText = substr($queryText, 0, 500); // Limit length
    $queryType = preg_replace('/[^a-z_]/', '', strtolower($queryType));
    
    // Create log entry
    $timestamp = date('Y-m-d H:i:s');
    
    // Format: [Timestamp] | Type | Query | Results
    $logEntry = sprintf(
        "[%s] | %s | %s | Results: %d\n",
        $timestamp,
        strtoupper($queryType),
        $queryText,
        (int)$resultCount
    );
    
    // Write to log file (append mode)
    @file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}

function getQueryStats() {
    $logFile = __DIR__ . '/query-log.txt';
    
    if (!file_exists($logFile)) {
        return [
            'total_queries' => 0,
            'book_searches' => 0,
            'general_queries' => 0,
            'book_percentage' => 0,
            'general_percentage' => 0
        ];
    }
    
    $lines = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $totalQueries = count($lines);
    $bookSearches = 0;
    $generalQueries = 0;
    
    foreach ($lines as $line) {
        if (strpos($line, '| BOOK_SEARCH |') !== false) {
            $bookSearches++;
        } elseif (strpos($line, '| GENERAL_QUERY |') !== false) {
            $generalQueries++;
        }
    }
    
    return [
        'total_queries' => $totalQueries,
        'book_searches' => $bookSearches,
        'general_queries' => $generalQueries,
        'book_percentage' => $totalQueries > 0 ? round(($bookSearches / $totalQueries) * 100, 2) : 0,
        'general_percentage' => $totalQueries > 0 ? round(($generalQueries / $totalQueries) * 100, 2) : 0
    ];
}
