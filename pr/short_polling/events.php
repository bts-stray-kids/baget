<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$path = __DIR__ . '/events.json';
$events = file_exists($path) ? json_decode(file_get_contents($path), true) : [];

echo json_encode([
    'events' => $events,
    'serverTime' => date('c')
], JSON_UNESCAPED_UNICODE);