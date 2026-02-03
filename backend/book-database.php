<?php
/**
 * Nalanda Library - Book Database
 * Contains book collection data
 * Note: Sample entries removed - using OPAC for complete library catalogue
 */

function getBookDatabase() {
    // Returns empty array - all book searches directed to OPAC
    return [];
}

function searchBooksInDatabase($query, $type = 'all', $limit = 5) {
    $books = getBookDatabase();
    $results = [];

    foreach ($books as $book) {
        $score = 0;

        // Title search
        if ($type === 'title' || $type === 'all') {
            if (stripos($book['title'], $query) === 0) {
                $score += 100;
            } elseif (stripos($book['title'], $query) !== false) {
                $score += 50;
            }
        }

        // Author search
        if ($type === 'author' || $type === 'all') {
            if (stripos($book['author'], $query) === 0) {
                $score += 100;
            } elseif (stripos($book['author'], $query) !== false) {
                $score += 50;
            }
        }

        // Subject search
        if ($type === 'subject' || $type === 'all') {
            foreach ($book['subjects'] as $subject) {
                if (stripos($subject, $query) !== false) {
                    $score += 30;
                }
            }
        }

        if ($score > 0) {
            $book['matchScore'] = $score;
            $results[] = $book;
        }
    }

    // Sort by relevance score
    usort($results, function($a, $b) {
        return $b['matchScore'] - $a['matchScore'];
    });

    return array_slice($results, 0, $limit);
}
