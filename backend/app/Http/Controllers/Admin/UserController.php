<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;

class UserController extends Controller
{
    public function index()
    {
        return User::query()
            ->select(['id', 'name', 'email', 'role', 'is_active', 'created_at', 'updated_at'])
            ->orderBy('name')
            ->paginate(50);
    }
}
