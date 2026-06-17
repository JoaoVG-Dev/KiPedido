<?php

namespace App\Actions\Tables;

use App\Models\RestaurantSetting;
use App\Models\RestaurantTable;
use App\Models\TableSession;
use Illuminate\Validation\ValidationException;

class CalculateTableBillAction
{
    public function execute(RestaurantTable $table): array
    {
        $session = TableSession::query()
            ->where('table_id', $table->id)
            ->whereIn('status', ['open', 'waiting_payment'])
            ->latest()
            ->first();

        if (! $session) {
            throw ValidationException::withMessages([
                'table' => 'Esta mesa não possui consumo aberto.',
            ]);
        }

        $subtotal = (float) $session->orders()
            ->where('status', '!=', 'cancelled')
            ->withSum('items', 'total_price')
            ->get()
            ->sum('items_sum_total_price');

        $settings = RestaurantSetting::query()->first();
        $serviceFeePercentage = (float) ($settings?->service_fee_percentage ?? 10);
        $discount = (float) $session->discount_amount;
        $serviceFee = round($subtotal * ($serviceFeePercentage / 100), 2);
        $total = max(round($subtotal + $serviceFee - $discount, 2), 0);

        $session->update([
            'subtotal' => $subtotal,
            'service_fee_amount' => $serviceFee,
            'total_amount' => $total,
        ]);

        $payments = $session->payments()
            ->where('status', 'paid')
            ->latest('paid_at')
            ->get();

        $paidAmount = round((float) $payments->sum('amount_paid'), 2);
        $remainingAmount = max(round($total - $paidAmount, 2), 0);
        $changeAmount = max(round($paidAmount - $total, 2), 0);

        $session->refresh()->load([
            'orders' => fn ($query) => $query
                ->where('status', '!=', 'cancelled')
                ->with('items')
                ->latest('sent_at'),
            'payments' => fn ($query) => $query
                ->where('status', 'paid')
                ->latest('paid_at'),
        ]);

        return [
            'session' => $session,
            'subtotal' => $subtotal,
            'discount_amount' => $discount,
            'service_fee_percentage' => $serviceFeePercentage,
            'service_fee_amount' => $serviceFee,
            'total_amount' => $total,
            'paid_amount' => $paidAmount,
            'remaining_amount' => $remainingAmount,
            'change_amount' => $changeAmount,
        ];
    }
}
