<?php

namespace App\Http\Controllers\Tablet;

use App\Actions\Orders\CreateOrderAction;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    use ResolvesTabletTable;

    public function index(string $token)
    {
        $table = $this->tableFromToken($token);
        $session = $this->activeSessionFor($table);

        return response()->json([
            'orders' => $session
                ? $session->orders()->with('items')->latest()->get()
                : [],
        ]);
    }

    public function store(Request $request, string $token, CreateOrderAction $createOrderAction)
    {
        $table = $this->tableFromToken($token);

        $data = $request->validate([
            'notes' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:99'],
            'items.*.notes' => ['nullable', 'string', 'max:500'],
        ]);

        $order = $createOrderAction->execute($table, $data);

        return response()->json($order, 201);
    }
}
