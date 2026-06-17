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

            $alreadyPaid = round((float) Payment::query()
                ->where('table_session_id', $session->id)
                ->where('status', 'paid')
                ->sum('amount_paid'), 2);

            $totalPaidAfterCurrentPayment = round($alreadyPaid + $amountPaid, 2);
            $remainingAmount = max(round($totalAmount - $totalPaidAfterCurrentPayment, 2), 0);
            $change = max(round($totalPaidAfterCurrentPayment - $totalAmount, 2), 0);
            $shouldCloseSession = $totalPaidAfterCurrentPayment >= $totalAmount;

            $payment = Payment::create([
                'table_session_id' => $session->id,
                'payment_method' => $data['payment_method'],
                'subtotal' => $bill['subtotal'],
                'discount_amount' => $bill['discount_amount'],
                'service_fee_amount' => $bill['service_fee_amount'],
                'total_amount' => $totalAmount,
                'amount_paid' => $amountPaid,
                'change_amount' => $shouldCloseSession ? $change : 0,
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
                    'amount_paid' => $amountPaid,
                    'already_paid' => $alreadyPaid,
                    'total_paid' => $totalPaidAfterCurrentPayment,
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
                    'amount_paid' => $amountPaid,
                    'already_paid' => $alreadyPaid,
                    'total_paid' => $totalPaidAfterCurrentPayment,
                    'remaining_amount' => $remainingAmount,
                ]);
            }

            return $payment->load('tableSession.table');
        });
    }
}
