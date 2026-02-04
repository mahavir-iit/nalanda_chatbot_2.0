<?php
// Test book search API
error_reporting(E_ALL);
ini_set('display_errors', 1);

$_GET['q'] = 'data science';
$_GET['limit'] = '3';
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['HTTPS'] = 'on';
$_SERVER['PHP_SELF'] = 'book-search.php';  // Must match the filename
$_SERVER['HTTP_HOST'] = 'localhost';
$_SERVER['REQUEST_URI'] = '/test';

// Capture output
ob_start();
include 'book-search.php';
$output = ob_get_clean();

echo "=== RAW OUTPUT ===\n";
echo $output;
echo "\n=== END ===\n";

// Try to decode
$data = json_decode($output, true);
if ($data) {
    echo "\n=== DECODED ===\n";
    echo "Success: " . ($data['success'] ? 'true' : 'false') . "\n";
    echo "Books found: " . (isset($data['books']) ? count($data['books']) : 0) . "\n";
    if (isset($data['books']) && count($data['books']) > 0) {
        echo "First book: " . $data['books'][0]['title'] . "\n";
    }
}
?>
