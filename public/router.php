<?php

declare(strict_types=1);

// Router for PHP built-in server to serve static files correctly.
if (PHP_SAPI !== 'cli-server') {
    return false;
}

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
if ($path !== '/' && $path !== null) {
    $file = __DIR__ . $path;
    if (is_file($file)) {
        return false;
    }
}

// Ensure Symfony Runtime uses the real front controller.
$_SERVER['SCRIPT_FILENAME'] = __DIR__ . '/index.php';
$_SERVER['SCRIPT_NAME'] = '/index.php';
$_SERVER['PHP_SELF'] = '/index.php';

require __DIR__ . '/index.php';
