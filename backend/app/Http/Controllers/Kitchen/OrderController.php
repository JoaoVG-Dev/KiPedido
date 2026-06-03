<?php

namespace App\Http\Controllers\Kitchen;

use App\Actions\Orders\UpdateOrderStatusAction;
use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->query('status');

        return Order::query()
            ->with(['items', 'table'])
            ->when($status && $status !== 'all', fn ($query) => $query->where('status', $status))
            ->when(! $status, fn ($query) => $query->whereIn('status', ['received', 'preparing', 'ready']))
            ->oldest('sent_at')
            ->paginate(50);
    }

    public function show(Order $order)
    {
        return $order->load(['items', 'table', 'tableSession']);
    }

    public function updateStatus(Request $request, Order $order, UpdateOrderStatusAction $updateOrderStatusAction)
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(['received', 'preparing', 'ready', 'delivered', 'cancelled'])],
        ]);

        return response()->json(
            $updateOrderStatusAction->execute($order, $data['status'], $request->user()),
        );
    }
}
