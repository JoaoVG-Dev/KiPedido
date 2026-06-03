<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Logs\LogAction;
use App\Http\Controllers\Controller;
use App\Models\RestaurantTable;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TableController extends Controller
{
    public function index()
    {
        return RestaurantTable::query()
            ->with('activeSession')
            ->orderBy('number')
            ->paginate(30);
    }

    public function store(Request $request, LogAction $logAction)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'number' => ['required', 'integer', 'min:1', 'unique:tables,number'],
            'status' => ['nullable', Rule::in(['available', 'occupied', 'waiting_payment', 'closed', 'inactive'])],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $table = RestaurantTable::create($data + [
            'token' => Str::lower(Str::random(32)),
            'status' => $data['status'] ?? 'available',
            'is_active' => $data['is_active'] ?? true,
        ]);

        $logAction->execute('table.created', "{$table->name} cadastrada.", [
            'user' => $request->user(),
            'table' => $table,
        ]);

        return response()->json($table, 201);
    }

    public function show(RestaurantTable $table)
    {
        return $table->load(['activeSession.orders.items', 'serviceCalls']);
    }

    public function update(Request $request, RestaurantTable $table)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'number' => ['sometimes', 'required', 'integer', 'min:1', Rule::unique('tables', 'number')->ignore($table->id)],
            'status' => ['sometimes', 'required', Rule::in(['available', 'occupied', 'waiting_payment', 'closed', 'inactive'])],
            'is_active' => ['sometimes', 'required', 'boolean'],
        ]);

        $table->update($data);

        return response()->json($table->refresh());
    }

    public function destroy(RestaurantTable $table)
    {
        $table->update([
            'is_active' => false,
            'status' => 'inactive',
        ]);

        return response()->noContent();
    }

    public function regenerateToken(Request $request, RestaurantTable $table, LogAction $logAction)
    {
        $table->update(['token' => Str::lower(Str::random(32))]);

        $logAction->execute('table.token_regenerated', "Token da {$table->name} regenerado.", [
            'user' => $request->user(),
            'table' => $table,
        ]);

        return response()->json($table->refresh());
    }
}
