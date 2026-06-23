<?php

$frontendUrls = array_values(array_filter(array_map(
    static fn (string $url) => rtrim(trim($url), '/'),
    explode(',', env('FRONTEND_URLS', env('FRONTEND_URL', 'http://127.0.0.1:5173'))),
)));

$allowedOriginPatterns = array_values(array_filter(array_map(
    'trim',
    explode(';', env('CORS_ALLOWED_ORIGIN_PATTERNS', '')),
)));

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_values(array_unique([
        ...$frontendUrls,
        'http://127.0.0.1:5173',
        'http://localhost:5173',
    ])),
    'allowed_origins_patterns' => $allowedOriginPatterns,
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
