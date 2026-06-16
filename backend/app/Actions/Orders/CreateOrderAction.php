<?php

namespace App\Actions\Orders;

use App\Actions\Logs\LogAction;
use App\Models\Order;
use App\Models\Product;
use App\Models\RestaurantTable;
use App\Models\TableSession;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreateOrderAction
{
    public function __construct(private readonly LogAction $logAction)
    {
    }

    public function execute(RestaurantTable $table, array $data): Order
    {
        if (! $table->is_active || $table->status === 'inactive') {
            throw ValidationException::withMessages([
                'table' => 'Esta mesa não está disponível para pedidos.',
            ]);
        }

        return DB::transaction(function () use ($table, $data): Order {
            $blockedSession = TableSession::query()
                ->where('table_id', $table->id)
                ->where('status', 'waiting_payment')
                ->latest()
                ->first();

            if ($blockedSession) {
                throw ValidationException::withMessages([
                    'table_session' => 'A conta desta mesa já foi solicitada. Não é possível enviar novos pedidos até o caixa finalizar ou reabrir a mesa.',
                ]);
            }

            $session = TableSession::query()
                ->where('table_id', $table->id)
                ->where('status', 'open')
                ->latest()
                ->first();

            if (! $session) {
                $session = TableSession::create([
                    'table_id' => $table->id,
                    'opened_at' => now(),
                    'status' => 'open',
                ]);

                $table->update(['status' => 'occupied']);

                $this->logAction->execute('table.opened', "Mesa {$table->name} aberta.", [
                    'table' => $table,
                    'table_session' => $session,
                ]);
            }

            /** @var Collection<int, Product> $products */
            $products = Product::query()
                ->whereIn('id', collect($data['items'])->pluck('product_id'))
                ->where('is_active', true)
                ->where('is_available', true)
                ->get()
                ->keyBy('id');

            if ($products->count() !== collect($data['items'])->pluck('product_id')->unique()->count()) {
                throw ValidationException::withMessages([
                    'items' => 'Um ou mais produtos estão indisponíveis.',
                ]);
            }

            $order = Order::create([
                'table_session_id' => $session->id,
                'table_id' => $table->id,
                'code' => 'KP'.now()->format('ymdHis').random_int(100, 999),
                'status' => 'received',
                'notes' => $data['notes'] ?? null,
                'sent_at' => now(),
            ]);

            foreach ($data['items'] as $item) {
                $product = $products->get($item['product_id']);
                $quantity = (int) $item['quantity'];

                $order->items()->create([
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'unit_price' => $product->price,
                    'quantity' => $quantity,
                    'notes' => $item['notes'] ?? null,
                    'status' => 'active',
                    'total_price' => (float) $product->price * $quantity,
                ]);
            }

            $this->logAction->execute('order.created', "Pedido {$order->code} criado pela {$table->name}.", [
                'table' => $table,
                'table_session' => $session,
                'order_id' => $order->id,
                'items_count' => count($data['items']),
            ]);

            return $order->load(['items', 'table']);
        });
    }
}