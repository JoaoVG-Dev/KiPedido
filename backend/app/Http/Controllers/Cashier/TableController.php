<?php

namespace App\Http\Controllers\Cashier;

use App\Actions\Logs\LogAction;
use App\Actions\Payments\CloseTableSessionAction;
use App\Actions\Tables\CalculateTableBillAction;
use App\Actions\Tables\ReleaseTableAction;
use App\Http\Controllers\Controller;
use App\Models\RestaurantTable;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class TableController extends Controller
{
    public function index()
    {
        return RestaurantTable::query()
            ->where('is_active', true)
            ->with('activeSession')
            ->orderBy('number')
            ->get();
    }

    public function bill(RestaurantTable $table, CalculateTableBillAction $calculateTableBillAction)
    {
        return response()->json($calculateTableBillAction->execute($table));
    }

    public function applyDiscount(
        Request $request,
        RestaurantTable $table,
        CalculateTableBillAction $calculateTableBillAction,
        LogAction $logAction,
    ) {
        $data = $request->validate([
            'discount_amount' => ['required', 'numeric', 'min:0'],
        ]);

        $session = $table->sessions()
            ->whereIn('status', ['open', 'waiting_payment'])
            ->latest()
            ->first();

        if (! $session) {
            throw ValidationException::withMessages([
                'table' => 'Esta mesa não possui consumo aberto.',
            ]);
        }

        if ($session->payments()->where('status', 'paid')->exists()) {
            throw ValidationException::withMessages([
                'discount_amount' => 'Não é possível alterar o desconto depois que um pagamento já foi registrado.',
            ]);
        }

        $bill = $calculateTableBillAction->execute($table);
        $maxDiscount = round((float) $bill['subtotal'] + (float) $bill['service_fee_amount'], 2);
        $discountAmount = round((float) $data['discount_amount'], 2);

        if ($discountAmount > $maxDiscount) {
            throw ValidationException::withMessages([
                'discount_amount' => 'O desconto não pode ser maior que o subtotal mais a taxa de serviço.',
            ]);
        }

        $session->update(['discount_amount' => $discountAmount]);

        $logAction->execute('table.discount_applied', "Desconto aplicado na {$table->name}.", [
            'user' => $request->user(),
            'table' => $table,
            'table_session' => $session,
            'discount_amount' => $discountAmount,
        ]);

        return response()->json($calculateTableBillAction->execute($table));
    }

    public function close(Request $request, RestaurantTable $table, CloseTableSessionAction $closeTableSessionAction)
    {
        $data = $request->validate([
            'payment_method' => ['required', Rule::in(['cash', 'credit_card', 'debit_card', 'pix', 'mixed'])],
            'amount_paid' => ['nullable', 'numeric', 'min:0'],
        ]);

        return response()->json($closeTableSessionAction->execute($table, $data, $request->user()), 201);
    }

    public function release(Request $request, RestaurantTable $table, ReleaseTableAction $releaseTableAction)
    {
        return response()->json($releaseTableAction->execute($table, $request->user()));
    }
}
