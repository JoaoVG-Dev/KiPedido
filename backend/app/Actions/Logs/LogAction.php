<?php

namespace App\Actions\Logs;

use App\Models\ActionLog;
use App\Models\RestaurantTable;
use App\Models\TableSession;
use App\Models\User;
use Illuminate\Support\Arr;

class LogAction
{
    public function execute(string $action, string $description, array $context = []): ActionLog
    {
        $user = $context['user'] ?? null;
        $table = $context['table'] ?? null;
        $session = $context['table_session'] ?? null;

        return ActionLog::create([
            'user_id' => $user instanceof User ? $user->id : ($context['user_id'] ?? null),
            'table_id' => $table instanceof RestaurantTable ? $table->id : ($context['table_id'] ?? null),
            'table_session_id' => $session instanceof TableSession ? $session->id : ($context['table_session_id'] ?? null),
            'action' => $action,
            'description' => $description,
            'metadata' => Arr::except($context, ['user', 'table', 'table_session', 'user_id', 'table_id', 'table_session_id']),
            'ip_address' => request()?->ip(),
        ]);
    }
}
