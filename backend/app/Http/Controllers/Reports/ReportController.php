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
        $paymentsByMethod = Payment::query()
            ->select(
                'payment_method',
                DB::raw('COUNT(*) as payments_count'),
                DB::raw('SUM(total_amount) as total_amount'),
                DB::raw('SUM(amount_paid) as amount_paid'),
                DB::raw('SUM(change_amount) as change_amount'),
            )
            ->where('status', 'paid')
            ->whereDate('paid_at', today())
            ->groupBy('payment_method')
            ->orderBy('payment_method')
            ->get();

        return response()->json([
            'date' => today()->toDateString(),
            'payments_count' => $payments->count(),
            'gross_total' => $payments->sum('subtotal'),
            'discount_total' => $payments->sum('discount_amount'),
            'service_fee_total' => $payments->sum('service_fee_amount'),
            'net_total' => $payments->sum('total_amount'),
            'amount_paid_total' => $payments->sum('amount_paid'),
            'change_total' => $payments->sum('change_amount'),
            'payments_by_method' => $paymentsByMethod,
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
