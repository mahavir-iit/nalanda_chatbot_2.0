<?php
/**
 * CSRF Token Generator and Validator
 * Protects against Cross-Site Request Forgery attacks
 */

class CSRFProtection {
    private static $tokenName = 'csrf_token';
    private static $tokenLifetime = 3600; // 1 hour
    
    /**
     * Generate a new CSRF token
     * @return string The generated token
     */
    public static function generateToken() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        $token = bin2hex(random_bytes(32));
        $_SESSION[self::$tokenName] = $token;
        $_SESSION[self::$tokenName . '_time'] = time();
        
        return $token;
    }
    
    /**
     * Get the current CSRF token (generate if doesn't exist)
     * @return string The current token
     */
    public static function getToken() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION[self::$tokenName]) || self::isTokenExpired()) {
            return self::generateToken();
        }
        
        return $_SESSION[self::$tokenName];
    }
    
    /**
     * Validate a CSRF token
     * @param string $token The token to validate
     * @return bool True if valid, false otherwise
     */
    public static function validateToken($token) {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION[self::$tokenName])) {
            return false;
        }
        
        if (self::isTokenExpired()) {
            unset($_SESSION[self::$tokenName]);
            unset($_SESSION[self::$tokenName . '_time']);
            return false;
        }
        
        return hash_equals($_SESSION[self::$tokenName], $token);
    }
    
    /**
     * Check if token is expired
     * @return bool True if expired
     */
    private static function isTokenExpired() {
        if (!isset($_SESSION[self::$tokenName . '_time'])) {
            return true;
        }
        
        return (time() - $_SESSION[self::$tokenName . '_time']) > self::$tokenLifetime;
    }
    
    /**
     * Generate hidden input field for forms
     * @return string HTML input field
     */
    public static function getHiddenInput() {
        $token = self::getToken();
        return '<input type="hidden" name="csrf_token" value="' . htmlspecialchars($token) . '">';
    }
    
    /**
     * Validate token from POST request
     * @return bool True if valid
     */
    public static function validateRequest() {
        $token = $_POST['csrf_token'] ?? $_GET['csrf_token'] ?? '';
        return self::validateToken($token);
    }
}
