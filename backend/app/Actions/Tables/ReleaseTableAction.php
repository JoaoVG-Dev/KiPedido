<?php

namespace App\Actions\Tables;

use App\Actions\Logs\LogAction;
use App\Models\RestaurantTable;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class ReleaseTableAction
{
    public function __construct(private readonly LogAction $logAction)
    {
    }

    public function execute(RestaurantTable $table, ?User $user = null): RestaurantTable
    {
        $hasOpenSession = $table->sessions()
            ->whereIn('status', ['open', 'waiting_payment'])
            ->exists();

        if ($hasOpenSession) {
            throw ValidationException::withMessages([
                'table' => 'Feche a conta antes de liberar a mesa.',
            ]);
        }

        $table->update(['status' => 'available']);

        $this->logAction->execute('table.released', "{$table->name} liberada.", [
            'user' => $user,
            'table' => $table,
        ]);

        return $table->refresh();
    }
}
