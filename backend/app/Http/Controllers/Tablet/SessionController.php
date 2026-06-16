<?php

namespace App\Http\Controllers\Tablet;

use App\Actions\Tables\CalculateTableBillAction;
use App\Http\Controllers\Controller;

class SessionController extends Controller
{
    use ResolvesTabletTable;

    public function show(string $token, CalculateTableBillAction $calculateTableBillAction)
    {
        $table = $this->tableFromToken($token);
        $session = $this->activeSessionFor($table);

        return response()->json([
            'table' => $table,
            'session' => $session,
            'bill' => $session ? $calculateTableBillAction->execute($table) : null,
        ]);
    }
}
