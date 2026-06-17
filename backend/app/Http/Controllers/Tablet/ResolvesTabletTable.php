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

        if (! $table) {
            throw ValidationException::withMessages([
                'token' => 'Token de mesa invalido. Confira o QR code ou solicite um novo acesso a equipe.',
            ]);
        }

        if ($table->token_revoked_at || ! $table->is_active || $table->status === 'inactive') {
            throw ValidationException::withMessages([
                'token' => 'Este token de mesa foi revogado ou esta inativo. Solicite um novo QR code a equipe.',
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
