<?php

namespace App\Actions\Orders;

use App\Actions\Logs\LogAction;
use App\Models\Order;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class UpdateOrderStatusAction
{
    public function __construct(private readonly LogAction $logAction)
    {
    }

    public function execute(Order $order, string $status, ?User $user = null): Order
    {
        if (! in_array($status, ['received', 'preparing', 'ready', 'delivered', 'cancelled'], true)) {
            throw ValidationException::withMessages([
                'status' => 'Status de pedido inválido.',
            ]);
        }

        $payload = ['status' => $status];

        if ($status === 'delivered') {
            $payload['delivered_at'] = now();
        }

        if ($status === 'cancelled') {
            $payload['cancelled_at'] = now();
        }

        $order->update($payload);

        $this->logAction->execute('order.status_changed', "Pedido {$order->code} alterado para {$status}.", [
            'user' => $user,
            'table_id' => $order->table_id,
            'table_session_id' => $order->table_session_id,
            'order_id' => $order->id,
            'status' => $status,
        ]);

        return $order->refresh()->load(['items', 'table']);
    }
}
