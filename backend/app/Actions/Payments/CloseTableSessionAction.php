<?php

namespace App\Actions\Payments;

use App\Actions\Logs\LogAction;
use App\Actions\Tables\CalculateTableBillAction;
use App\Models\Payment;
use App\Models\RestaurantTable;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CloseTableSessionAction
{
    public function __construct(
        private readonly CalculateTableBillAction $calculateTableBillAction,
        private readonly LogAction $logAction,
    ) {
    }

    public function execute(RestaurantTable $table, array $data, ?User $user = null): Payment
    {
        return DB::transaction(function () use ($table, $data, $user): Payment {
            $bill = $this->calculateTableBillAction->execute($table);
            $session = $bill['session'];
            $totalAmount = round((float) $bill['total_amount'], 2);
            $amountPaid = round((float) ($data['amount_paid'] ?? $totalAmount), 2);

            if ($amountPaid <= 0) {
                throw ValidationException::withMessages([
                    'amount_paid' => 'Informe um valor pago maior que zero.',
                ]);
            }

            if (in_array($session->status, ['paid', 'closed', 'cancelled'], true)) {
                throw ValidationException::withMessages([
                    'table_session' => 'Esta conta já foi finalizada.',
                ]);
            }

            $paidPaymentsQuery = Payment::query()
                ->where('table_session_id', $session->id)
                ->where('status', 'paid');

            $alreadyApplied = round((float) (clone $paidPaymentsQuery)->sum('total_amount'), 2);
            $remainingBeforePayment = max(round($totalAmount - $alreadyApplied, 2), 0);

            if ($remainingBeforePayment <= 0) {
                throw ValidationException::withMessages([
                    'table_session' => 'Esta conta já foi quitada.',
                ]);
            }

            $appliedAmount = round(min($amountPaid, $remainingBeforePayment), 2);
            $totalAppliedAfterCurrentPayment = round($alreadyApplied + $appliedAmount, 2);
            $remainingAmount = max(round($totalAmount - $totalAppliedAfterCurrentPayment, 2), 0);
            $shouldCloseSession = $remainingAmount <= 0;
            $change = $shouldCloseSession ? max(round($amountPaid - $remainingBeforePayment, 2), 0) : 0;
            $alreadyAllocatedAmounts = [
                'subtotal' => round((float) (clone $paidPaymentsQuery)->sum('subtotal'), 2),
                'discount_amount' => round((float) (clone $paidPaymentsQuery)->sum('discount_amount'), 2),
                'service_fee_amount' => round((float) (clone $paidPaymentsQuery)->sum('service_fee_amount'), 2),
            ];
            $paymentAmounts = $this->allocatedPaymentAmounts(
                bill: $bill,
                appliedAmount: $appliedAmount,
                isFinalPayment: $shouldCloseSession,
                alreadyAllocatedAmounts: $alreadyAllocatedAmounts,
            );

            $payment = Payment::create([
                'table_session_id' => $session->id,
                'payment_method' => $data['payment_method'],
                'subtotal' => $paymentAmounts['subtotal'],
                'discount_amount' => $paymentAmounts['discount_amount'],
                'service_fee_amount' => $paymentAmounts['service_fee_amount'],
                'total_amount' => $appliedAmount,
                'amount_paid' => $amountPaid,
                'change_amount' => $change,
                'status' => 'paid',
                'paid_by_user_id' => $user?->id,
                'paid_at' => now(),
            ]);

            if ($shouldCloseSession) {
                $session->update([
                    'status' => 'paid',
                    'closed_at' => now(),
                    'closed_by_user_id' => $user?->id,
                ]);

                $table->update(['status' => 'closed']);

                $this->logAction->execute('payment.created', "Pagamento da {$table->name} registrado e conta finalizada.", [
                    'user' => $user,
                    'table' => $table,
                    'table_session' => $session,
                    'payment_id' => $payment->id,
                    'total_amount' => $totalAmount,
                    'applied_amount' => $appliedAmount,
                    'amount_paid' => $amountPaid,
                    'already_paid' => $alreadyApplied,
                    'total_paid' => $totalAppliedAfterCurrentPayment,
                    'change_amount' => $change,
                ]);

                $this->logAction->execute('table.closed', "Conta da {$table->name} fechada.", [
                    'user' => $user,
                    'table' => $table,
                    'table_session' => $session,
                ]);
            } else {
                $session->update([
                    'status' => 'waiting_payment',
                ]);

                $table->update(['status' => 'waiting_payment']);

                $this->logAction->execute('payment.partial_created', "Pagamento parcial da {$table->name} registrado.", [
                    'user' => $user,
                    'table' => $table,
                    'table_session' => $session,
                    'payment_id' => $payment->id,
                    'total_amount' => $totalAmount,
                    'applied_amount' => $appliedAmount,
                    'amount_paid' => $amountPaid,
                    'already_paid' => $alreadyApplied,
                    'total_paid' => $totalAppliedAfterCurrentPayment,
                    'remaining_amount' => $remainingAmount,
                ]);
            }

            return $payment->load('tableSession.table');
        });
    }

    /**
     * Split bill components across payments so report sums match the real bill.
     *
     * @param  array{subtotal: float|int|string, discount_amount: float|int|string, service_fee_amount: float|int|string, total_amount: float|int|string}  $bill
     * @param  array{subtotal: float, discount_amount: float, service_fee_amount: float}  $alreadyAllocatedAmounts
     * @return array{subtotal: float, discount_amount: float, service_fee_amount: float}
     */
    private function allocatedPaymentAmounts(
        array $bill,
        float $appliedAmount,
        bool $isFinalPayment,
        array $alreadyAllocatedAmounts,
    ): array {
        $totalAmount = round((float) $bill['total_amount'], 2);

        if ($isFinalPayment) {
            return [
                'subtotal' => max(round((float) $bill['subtotal'] - $alreadyAllocatedAmounts['subtotal'], 2), 0),
                'discount_amount' => max(round((float) $bill['discount_amount'] - $alreadyAllocatedAmounts['discount_amount'], 2), 0),
                'service_fee_amount' => max(round((float) $bill['service_fee_amount'] - $alreadyAllocatedAmounts['service_fee_amount'], 2), 0),
            ];
        }

        if ($totalAmount <= 0) {
            return [
                'subtotal' => 0,
                'discount_amount' => 0,
                'service_fee_amount' => 0,
            ];
        }

        $ratio = $appliedAmount / $totalAmount;

        return [
            'subtotal' => round((float) $bill['subtotal'] * $ratio, 2),
            'discount_amount' => round((float) $bill['discount_amount'] * $ratio, 2),
            'service_fee_amount' => round((float) $bill['service_fee_amount'] * $ratio, 2),
        ];
    }
}
