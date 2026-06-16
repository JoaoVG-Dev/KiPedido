<?php

use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\ActionLogController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\RestaurantSettingController;
use App\Http\Controllers\Admin\TableController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Reports\ReportController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'role:admin,manager'])->prefix('admin')->group(function () {
    Route::get('dashboard', DashboardController::class);

    Route::apiResource('tables', TableController::class);
    Route::post('tables/{table}/regenerate-token', [TableController::class, 'regenerateToken']);

    Route::apiResource('categories', CategoryController::class)->except(['show']);

    Route::apiResource('products', ProductController::class);
    Route::post('products/{product}/toggle-availability', [ProductController::class, 'toggleAvailability']);
    Route::post('products/{product}/image', [ProductController::class, 'uploadImage']);

    Route::get('settings', [RestaurantSettingController::class, 'show']);
    Route::put('settings', [RestaurantSettingController::class, 'update']);

    Route::get('users', [UserController::class, 'index']);
    Route::get('logs', [ActionLogController::class, 'index']);

    Route::get('reports/daily-sales', [ReportController::class, 'dailySales']);
    Route::get('reports/products-ranking', [ReportController::class, 'productsRanking']);
    Route::get('reports/tables-usage', [ReportController::class, 'tablesUsage']);
});
