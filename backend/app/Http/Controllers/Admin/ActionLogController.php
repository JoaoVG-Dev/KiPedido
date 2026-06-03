<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActionLog;

class ActionLogController extends Controller
{
    public function index()
    {
        return ActionLog::query()
            ->with([
                'user:id,name,email,role',
                'table:id,name,number,status',
            ])
            ->latest('created_at')
            ->paginate(50);
    }
}
