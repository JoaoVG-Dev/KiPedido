<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\TableSession;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function dailySales()
    {
        $payments = Payment::query()
            ->where('status', 'paid')
            ->whereDate('paid_at', today())
            ->get();

        return response()->json([
            'date' => today()->toDateString(),
            'payments_count' => $payments->count(),
            'gross_total' => $payments->sum('subtotal'),
            'discount_total' => $payments->sum('discount_amount'),
            'service_fee_total' => $payments->sum('service_fee_amount'),
            'net_total' => $payments->sum('total_amount'),
        ]);
    }

    public function productsRanking()
    {
        return OrderItem::query()
            ->select('product_name', DB::raw('SUM(quantity) as quantity_sold'), DB::raw('SUM(total_price) as total_sold'))
            ->whereHas('order', fn ($query) => $query->where('status', '!=', 'cancelled'))
            ->groupBy('product_name')
            ->orderByDesc('quantity_sold')
            ->limit(20)
            ->get();
    }

    public function tablesUsage()
    {
        return TableSession::query()
            ->select('table_id', DB::raw('COUNT(*) as sessions_count'), DB::raw('SUM(total_amount) as total_consumed'))
            ->with('table:id,name,number')
            ->groupBy('table_id')
            ->orderByDesc('sessions_count')
            ->get();
    }
}
