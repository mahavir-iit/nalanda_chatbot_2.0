<?php
/**
 * Simple Rate Limiter for API endpoints
 */

class RateLimiter {
    private $storageFile;
    private $maxRequests;
    private $timeWindow; // in seconds
    
    public function __construct($maxRequests = 60, $timeWindow = 60) {
        $this->storageFile = sys_get_temp_dir() . '/nalanda_rate_limit.json';
        $this->maxRequests = $maxRequests;
        $this->timeWindow = $timeWindow;
    }
    
    /**
     * Check if request should be allowed
     * @return bool True if allowed, false if rate limited
     */
    public function checkLimit($identifier = null) {
        // Use IP address as identifier if not provided
        if ($identifier === null) {
            $identifier = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        }
        
        // Clean up old entries and load current data
        $data = $this->loadData();
        $currentTime = time();
        $cutoffTime = $currentTime - $this->timeWindow;
        
        // Initialize or get user's request log
        if (!isset($data[$identifier])) {
            $data[$identifier] = [];
        }
        
        // Remove old requests outside the time window
        $data[$identifier] = array_filter($data[$identifier], function($timestamp) use ($cutoffTime) {
            return $timestamp > $cutoffTime;
        });
        
        // Check if limit exceeded
        if (count($data[$identifier]) >= $this->maxRequests) {
            return false; // Rate limit exceeded
        }
        
        // Add current request
        $data[$identifier][] = $currentTime;
        
        // Save updated data
        $this->saveData($data);
        
        return true; // Request allowed
    }
    
    /**
     * Get remaining requests for identifier
     */
    public function getRemainingRequests($identifier = null) {
        if ($identifier === null) {
            $identifier = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        }
        
        $data = $this->loadData();
        $currentTime = time();
        $cutoffTime = $currentTime - $this->timeWindow;
        
        if (!isset($data[$identifier])) {
            return $this->maxRequests;
        }
        
        // Count recent requests
        $recentRequests = array_filter($data[$identifier], function($timestamp) use ($cutoffTime) {
            return $timestamp > $cutoffTime;
        });
        
        return max(0, $this->maxRequests - count($recentRequests));
    }
    
    private function loadData() {
        if (!file_exists($this->storageFile)) {
            return [];
        }
        
        $content = @file_get_contents($this->storageFile);
        if ($content === false) {
            return [];
        }
        
        $data = json_decode($content, true);
        return is_array($data) ? $data : [];
    }
    
    private function saveData($data) {
        // Clean up data older than 2x time window to prevent file bloat
        $cutoffTime = time() - ($this->timeWindow * 2);
        foreach ($data as $identifier => $timestamps) {
            $data[$identifier] = array_filter($timestamps, function($ts) use ($cutoffTime) {
                return $ts > $cutoffTime;
            });
            
            // Remove empty entries
            if (empty($data[$identifier])) {
                unset($data[$identifier]);
            }
        }
        
        @file_put_contents($this->storageFile, json_encode($data), LOCK_EX);
    }
}
