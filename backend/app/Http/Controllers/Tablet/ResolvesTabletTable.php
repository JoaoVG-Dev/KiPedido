<?php

namespace App\Http\Controllers\Tablet;

use App\Models\RestaurantTable;
use App\Models\TableSession;
use Illuminate\Validation\ValidationException;

trait ResolvesTabletTable
{
    protected function tableFromToken(string $token): RestaurantTable
    {
        $table = RestaurantTable::where('token', $token)->first();

        if (! $table || ! $table->is_active || $table->status === 'inactive') {
            throw ValidationException::withMessages([
                'token' => 'Token de mesa inválido.',
            ]);
        }

        return $table;
    }

    protected function activeSessionFor(RestaurantTable $table): ?TableSession
    {
        return TableSession::query()
            ->where('table_id', $table->id)
            ->whereIn('status', ['open', 'waiting_payment'])
            ->latest()
            ->first();
    }
}
