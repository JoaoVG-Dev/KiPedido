<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Logs\LogAction;
use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index()
    {
        return Product::query()
            ->with('category')
            ->orderBy('category_id')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate(50);
    }

    public function store(Request $request, LogAction $logAction)
    {
        $product = Product::create($this->validated($request));

        $logAction->execute('product.created', "Produto {$product->name} criado.", [
            'user' => $request->user(),
            'product_id' => $product->id,
        ]);

        return response()->json($product->load('category'), 201);
    }

    public function show(Product $product)
    {
        return $product->load('category');
    }

    public function update(Request $request, Product $product, LogAction $logAction)
    {
        $product->update($this->validated($request, true));

        $logAction->execute('product.updated', "Produto {$product->name} atualizado.", [
            'user' => $request->user(),
            'product_id' => $product->id,
        ]);

        return response()->json($product->refresh()->load('category'));
    }

    public function destroy(Product $product)
    {
        $product->update(['is_active' => false, 'is_available' => false]);

        return response()->noContent();
    }

    public function toggleAvailability(Request $request, Product $product, LogAction $logAction)
    {
        $product->update(['is_available' => ! $product->is_available]);

        $logAction->execute('product.availability_changed', "Disponibilidade de {$product->name} alterada.", [
            'user' => $request->user(),
            'product_id' => $product->id,
            'is_available' => $product->is_available,
        ]);

        return response()->json($product->refresh());
    }

    public function uploadImage(Request $request, Product $product)
    {
        $request->validate([
            'image' => ['required', 'image', 'max:4096'],
        ]);

        $path = $request->file('image')->store('products', 'public');
        $product->update(['image_path' => $path]);

        return response()->json($product->refresh());
    }

    private function validated(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'category_id' => [$required, 'integer', 'exists:categories,id'],
            'name' => [$required, 'string', 'max:180'],
            'description' => ['nullable', 'string'],
            'price' => [$required, 'numeric', 'min:0'],
            'image_path' => ['nullable', 'string', 'max:255'],
            'is_available' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);
    }
}
