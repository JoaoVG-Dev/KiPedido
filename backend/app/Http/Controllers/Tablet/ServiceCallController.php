<?php

namespace App\Http\Controllers\Tablet;

use App\Actions\Logs\LogAction;
use App\Http\Controllers\Controller;
use App\Models\ServiceCall;
use Illuminate\Http\Request;

class ServiceCallController extends Controller
{
    use ResolvesTabletTable;

    public function callWaiter(Request $request, string $token, LogAction $logAction)
    {
        $request->validate([
            'message' => ['nullable', 'string', 'max:500'],
        ]);

        return $this->createCall($request, $token, 'call_waiter', 'Garçom chamado pela mesa.', $logAction);
    }

    public function requestBill(Request $request, string $token, LogAction $logAction)
    {
        $response = $this->createCall($request, $token, 'request_bill', 'Conta solicitada pela mesa.', $logAction);
        $table = $this->tableFromToken($token);
        $session = $this->activeSessionFor($table);

        if ($session) {
            $session->update(['status' => 'waiting_payment']);
            $table->update(['status' => 'waiting_payment']);
        }

        return $response;
    }

    private function createCall(Request $request, string $token, string $type, string $description, LogAction $logAction)
    {
        $table = $this->tableFromToken($token);
        $session = $this->activeSessionFor($table);

        $call = ServiceCall::create([
            'table_id' => $table->id,
            'table_session_id' => $session?->id,
            'type' => $type,
            'status' => 'pending',
            'message' => $request->input('message'),
        ]);

        $logAction->execute($type === 'request_bill' ? 'table.bill_requested' : 'table.waiter_called', $description, [
            'table' => $table,
            'table_session' => $session,
            'service_call_id' => $call->id,
        ]);

        return response()->json($call, 201);
    }
}
