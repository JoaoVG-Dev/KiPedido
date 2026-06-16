<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActionLog;
use App\Models\Category;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\RestaurantSetting;
use App\Models\RestaurantTable;
use App\Models\ServiceCall;

class DashboardController extends Controller
{
    public function __invoke()
    {
        $todayPayments = Payment::query()
            ->where('status', 'paid')
            ->whereDate('paid_at', today())
            ->get();

        return response()->json([
            'settings' => RestaurantSetting::query()->first(),
            'metrics' => [
                'open_tables' => RestaurantTable::query()->whereIn('status', ['occupied', 'waiting_payment'])->count(),
                'available_tables' => RestaurantTable::query()->where('status', 'available')->count(),
                'today_orders' => Order::query()->whereDate('created_at', today())->count(),
                'active_kitchen_orders' => Order::query()->whereIn('status', ['received', 'preparing', 'ready'])->count(),
                'pending_service_calls' => ServiceCall::query()->where('status', 'pending')->count(),
                'today_revenue' => (float) $todayPayments->sum('total_amount'),
                'categories_count' => Category::query()->where('is_active', true)->count(),
                'products_count' => Product::query()->where('is_active', true)->count(),
            ],
            'tables' => RestaurantTable::query()
                ->with('activeSession')
                ->where('is_active', true)
                ->orderBy('number')
                ->limit(8)
                ->get(),
            'recent_logs' => ActionLog::query()
                ->latest('created_at')
                ->limit(8)
                ->get(),
        ]);
    }
}
