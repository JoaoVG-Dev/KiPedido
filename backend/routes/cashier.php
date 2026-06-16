<?php

use App\Http\Controllers\Cashier\TableController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'role:admin,manager,cashier'])->prefix('cashier')->group(function () {
    Route::get('tables', [TableController::class, 'index']);
    Route::get('tables/{table}/bill', [TableController::class, 'bill']);
    Route::post('tables/{table}/apply-discount', [TableController::class, 'applyDiscount']);
    Route::post('tables/{table}/close', [TableController::class, 'close']);
    Route::post('tables/{table}/release', [TableController::class, 'release']);
});
