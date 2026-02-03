<?php
/**
 * Minimal XLSX reader for accession register
 * Reads first worksheet and returns rows as associative arrays
 */

function readXlsxRows($filePath, $maxRows = 5000, $cachePath = null) {
    if (!file_exists($filePath)) {
        return [];
    }

    if ($cachePath && file_exists($cachePath)) {
        $cacheMtime = filemtime($cachePath);
        $fileMtime = filemtime($filePath);
        if ($cacheMtime !== false && $fileMtime !== false && $cacheMtime >= $fileMtime) {
            $cached = json_decode(file_get_contents($cachePath), true);
            if (is_array($cached)) {
                return $cached;
            }
        }
    }

    $zip = new ZipArchive();
    if ($zip->open($filePath) !== true) {
        return [];
    }

    $sharedStrings = [];
    $sharedXml = $zip->getFromName('xl/sharedStrings.xml');
    if ($sharedXml !== false) {
        $sharedReader = new XMLReader();
        $sharedReader->XML($sharedXml);
        $currentText = '';
        while ($sharedReader->read()) {
            if ($sharedReader->nodeType === XMLReader::ELEMENT && $sharedReader->name === 't') {
                $currentText .= $sharedReader->readInnerXML();
            }
            if ($sharedReader->nodeType === XMLReader::END_ELEMENT && $sharedReader->name === 'si') {
                $sharedStrings[] = $currentText;
                $currentText = '';
            }
        }
        $sharedReader->close();
    }

    $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
    if ($sheetXml === false) {
        $zip->close();
        return [];
    }

    $rows = [];
    $header = [];
    $rowCount = 0;

    $reader = new XMLReader();
    $reader->XML($sheetXml);

    while ($reader->read()) {
        if ($reader->nodeType === XMLReader::ELEMENT && $reader->name === 'row') {
            $rowData = [];
            $rowXml = $reader->readOuterXML();
            $rowReader = new XMLReader();
            $rowReader->XML($rowXml);

            $cellRef = '';
            $cellType = '';
            $value = '';

            while ($rowReader->read()) {
                if ($rowReader->nodeType === XMLReader::ELEMENT && $rowReader->name === 'c') {
                    $cellRef = $rowReader->getAttribute('r');
                    $cellType = $rowReader->getAttribute('t');
                    $value = '';
                }
                if ($rowReader->nodeType === XMLReader::ELEMENT && $rowReader->name === 'v') {
                    $value = $rowReader->readInnerXML();
                }
                if ($rowReader->nodeType === XMLReader::ELEMENT && $rowReader->name === 't') {
                    $value = $rowReader->readInnerXML();
                }
                if ($rowReader->nodeType === XMLReader::END_ELEMENT && $rowReader->name === 'c') {
                    $colLetters = preg_replace('/\d+/', '', $cellRef);
                    $colIndex = columnLettersToIndex($colLetters);
                    $cellValue = '';

                    if ($cellType === 's') {
                        $idx = (int)$value;
                        $cellValue = $sharedStrings[$idx] ?? '';
                    } else {
                        $cellValue = $value;
                    }

                    $rowData[$colIndex] = trim((string)$cellValue);
                }
            }

            $rowReader->close();

            if (empty($header)) {
                ksort($rowData);
                foreach ($rowData as $val) {
                    $header[] = normalizeHeader($val);
                }
                continue;
            }

            $assoc = [];
            foreach ($header as $i => $key) {
                $assoc[$key] = $rowData[$i] ?? '';
            }

            if (count(array_filter($assoc)) > 0) {
                $rows[] = $assoc;
                $rowCount++;
                if ($rowCount >= $maxRows) {
                    break;
                }
            }
        }
    }

    $reader->close();
    $zip->close();

    if ($cachePath) {
        file_put_contents($cachePath, json_encode($rows));
    }

    return $rows;
}

function columnLettersToIndex($letters) {
    $letters = strtoupper($letters);
    $index = 0;
    for ($i = 0; $i < strlen($letters); $i++) {
        $index = $index * 26 + (ord($letters[$i]) - ord('A') + 1);
    }
    return $index - 1;
}

function normalizeHeader($text) {
    $text = strtolower(trim($text));
    $text = preg_replace('/[^a-z0-9]+/', '_', $text);
    return trim($text, '_');
}

/**
 * Auto-clean and normalize book data
 * Automatically removes special characters, extra whitespace, and validates entries
 */
function autoCleanBookData($rows) {
    $cleaned = [];
    
    foreach ($rows as $row) {
        $cleanedRow = [];
        
        // Clean title
        $title = $row['title'] ?? $row['book_title'] ?? $row['name_of_book'] ?? '';
        $title = trim($title);
        $title = preg_replace('/\s+/', ' ', $title); // Remove extra whitespace
        $title = preg_replace('/[^\p{L}\p{N}\s\-:().,&\/]/u', '', $title); // Remove special chars
        $cleanedRow['title'] = $title;
        
        // Clean author
        $author = $row['author'] ?? $row['author_name'] ?? '';
        $author = trim($author);
        $author = preg_replace('/\s+/', ' ', $author);
        $author = preg_replace('/[^\p{L}\p{N}\s\-,.]/u', '', $author);
        $cleanedRow['author'] = $author;
        
        // Clean publisher
        $publisher = $row['publisher'] ?? '';
        $publisher = trim($publisher);
        $publisher = preg_replace('/\s+/', ' ', $publisher);
        $cleanedRow['publisher'] = $publisher;
        
        // Copy other fields with trimming
        $cleanedRow['accession_number'] = trim($row['accession_number'] ?? $row['accession_no'] ?? $row['accession'] ?? $row['acc_no'] ?? '');
        $cleanedRow['isbn'] = trim($row['isbn'] ?? '');
        $cleanedRow['year'] = trim($row['year'] ?? $row['publication_year'] ?? '');
        $cleanedRow['publishercode'] = trim($row['publishercode'] ?? '');
        $cleanedRow['itemcallnumber'] = trim($row['itemcallnumber'] ?? $row['call_number'] ?? $row['call_no'] ?? '');
        $cleanedRow['item_number'] = trim($row['item_number'] ?? $row['item_no'] ?? $row['item'] ?? '');
        $cleanedRow['no_of_copies'] = trim($row['no_of_copies'] ?? $row['number_of_copies'] ?? $row['copies'] ?? '1');
        $cleanedRow['availablity'] = trim($row['availablity'] ?? $row['availability'] ?? '');
        $cleanedRow['location'] = trim($row['location'] ?? $row['shelf'] ?? '');
        
        // Only keep entries with valid title
        if (!empty($cleanedRow['title'])) {
            $cleaned[] = $cleanedRow;
        }
    }
    
    return $cleaned;
}

/**
 * Read and auto-clean accession register
 * Automatically cleans data whenever file is updated
 */
function readAccessionRegisterXLSX($filePath, $cachePath = null) {
    if (!file_exists($filePath)) {
        return ['success' => false, 'error' => 'File not found', 'books' => []];
    }
    
    // Check if we should use cache
    $useCache = false;
    if ($cachePath && file_exists($cachePath)) {
        $cacheMtime = filemtime($cachePath);
        $fileMtime = filemtime($filePath);
        if ($cacheMtime !== false && $fileMtime !== false && $cacheMtime >= $fileMtime) {
            $useCache = true;
        }
    }
    
    // Use cached cleaned data if available and up-to-date
    if ($useCache) {
        $cached = json_decode(file_get_contents($cachePath), true);
        if (is_array($cached) && !empty($cached)) {
            return ['success' => true, 'books' => $cached, 'source' => 'cache'];
        }
    }
    
    // Read raw data from Excel (increase max rows to cover full register)
    $rawData = readXlsxRows($filePath, 50000, null);
    
    if (empty($rawData)) {
        return ['success' => false, 'error' => 'Could not read Excel file', 'books' => []];
    }
    
    // Auto-clean the data
    $cleanedData = autoCleanBookData($rawData);
    
    // Save cleaned data to cache
    if ($cachePath) {
        file_put_contents($cachePath, json_encode($cleanedData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }
    
    return ['success' => true, 'books' => $cleanedData, 'source' => 'file', 'cleaned' => count($cleanedData), 'original' => count($rawData)];
}
