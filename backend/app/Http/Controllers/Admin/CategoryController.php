<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index()
    {
        return Category::query()
            ->withCount('products')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate(50);
    }

    public function store(Request $request)
    {
        $category = Category::create($this->validated($request));

        return response()->json($category, 201);
    }

    public function update(Request $request, Category $category)
    {
        $category->update($this->validated($request, true));

        return response()->json($category->refresh());
    }

    public function destroy(Category $category)
    {
        $category->update(['is_active' => false]);

        return response()->noContent();
    }

    private function validated(Request $request, bool $partial = false): array
    {
        $prefix = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'name' => [$prefix, 'string', 'max:160'],
            'description' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);
    }
}
