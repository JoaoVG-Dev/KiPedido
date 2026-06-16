<?php

use App\Http\Controllers\Tablet\MenuController;
use App\Http\Controllers\Tablet\OrderController;
use App\Http\Controllers\Tablet\ServiceCallController;
use App\Http\Controllers\Tablet\SessionController;
use Illuminate\Support\Facades\Route;

Route::prefix('tablet/{token}')->group(function () {
    Route::get('menu', [MenuController::class, 'index']);
    Route::get('session', [SessionController::class, 'show']);
    Route::post('orders', [OrderController::class, 'store']);
    Route::get('orders', [OrderController::class, 'index']);
    Route::post('call-waiter', [ServiceCallController::class, 'callWaiter']);
    Route::post('request-bill', [ServiceCallController::class, 'requestBill']);
});
