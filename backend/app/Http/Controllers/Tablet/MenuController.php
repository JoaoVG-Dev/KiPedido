<?php

namespace App\Http\Controllers\Tablet;

use App\Http\Controllers\Controller;
use App\Models\Category;

class MenuController extends Controller
{
    use ResolvesTabletTable;

    public function index(string $token)
    {
        $table = $this->tableFromToken($token);

        $categories = Category::query()
            ->where('is_active', true)
            ->whereHas('products', fn ($query) => $query->where('is_active', true)->where('is_available', true))
            ->with(['products' => fn ($query) => $query
                ->where('is_active', true)
                ->where('is_available', true)
                ->orderBy('sort_order')
                ->orderBy('name')])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json([
            'table' => $table,
            'categories' => $categories,
        ]);
    }
}
