<?php
/**
 * NexusOrbital 用户反馈收集API
 * 
 * 该脚本负责接收、验证和存储用户提交的反馈数据
 */

// 允许跨域请求（仅在开发环境中使用）
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// 处理预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 检查请求方法
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => '不支持的请求方法', 'method' => $_SERVER['REQUEST_METHOD']]);
    exit;
}

// 获取POST数据
$postData = file_get_contents('php://input');
$feedbackData = json_decode($postData, true);

// 验证数据
if (!$feedbackData || !isset($feedbackData['content']) || empty($feedbackData['content'])) {
    http_response_code(400);
    echo json_encode(['error' => '无效的反馈数据', 'received' => $feedbackData]);
    exit;
}

// 添加时间戳和IP地址（匿名化处理）
$feedbackData['server_timestamp'] = date('Y-m-d H:i:s');
$feedbackData['ip_hash'] = md5($_SERVER['REMOTE_ADDR']);

// 保存到文件（在实际项目中应该保存到数据库）
$feedbacksDir = '../data/feedbacks';
if (!file_exists($feedbacksDir)) {
    mkdir($feedbacksDir, 0755, true);
}

$feedbacksFile = $feedbacksDir . '/feedbacks.json';
$existingFeedbacks = [];

if (file_exists($feedbacksFile)) {
    $fileContent = file_get_contents($feedbacksFile);
    if (!empty($fileContent)) {
        $existingFeedbacks = json_decode($fileContent, true) ?: [];
    }
}

// 添加新反馈
$existingFeedbacks[] = $feedbackData;

// 写入文件
if (file_put_contents($feedbacksFile, json_encode($existingFeedbacks, JSON_PRETTY_PRINT))) {
    // 返回成功响应
    echo json_encode([
        'success' => true, 
        'message' => '反馈已成功接收',
        'feedback_id' => count($existingFeedbacks)
    ]);
} else {
    // 返回错误响应
    http_response_code(500);
    echo json_encode(['error' => '保存反馈时出错']);
}

// 记录日志
$logFile = $feedbacksDir . '/feedback_log.txt';
$logMessage = date('Y-m-d H:i:s') . ' - ' . 
              'Type: ' . $feedbackData['type'] . ' - ' .
              'Page: ' . $feedbackData['page'] . ' - ' .
              'Rating: ' . $feedbackData['rating'] . "\n";
file_put_contents($logFile, $logMessage, FILE_APPEND);
