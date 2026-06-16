<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\RestaurantSetting;
use App\Models\RestaurantTable;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@kipedido.local'],
            [
                'name' => 'Administrador KiPedido',
                'password' => Hash::make('KiPedido@123'),
                'role' => 'admin',
                'is_active' => true,
            ],
        );

        RestaurantSetting::updateOrCreate(['id' => 1], [
            'restaurant_name' => 'KiPedido Restaurante',
            'service_fee_percentage' => 10,
            'currency' => 'BRL',
            'printer_enabled' => false,
            'sound_alerts_enabled' => true,
        ]);

        for ($number = 1; $number <= 10; $number++) {
            RestaurantTable::updateOrCreate(
                ['number' => $number],
                [
                    'name' => "Mesa {$number}",
                    'token' => sprintf('mesa-%02d-teste', $number),
                    'status' => 'available',
                    'is_active' => true,
                ],
            );
        }

        $categories = [
            ['name' => 'Entradas', 'description' => 'Porções para começar bem.', 'sort_order' => 1],
            ['name' => 'Pratos principais', 'description' => 'Receitas da casa para almoço e jantar.', 'sort_order' => 2],
            ['name' => 'Bebidas', 'description' => 'Sucos, refrigerantes e bebidas sem álcool.', 'sort_order' => 3],
            ['name' => 'Sobremesas', 'description' => 'Doces para fechar a experiência.', 'sort_order' => 4],
        ];

        foreach ($categories as $categoryData) {
            Category::updateOrCreate(['name' => $categoryData['name']], $categoryData + ['is_active' => true]);
        }

        $products = [
            ['category' => 'Entradas', 'name' => 'Bolinho de queijo', 'description' => 'Porção com 8 unidades crocantes.', 'price' => 28.90, 'sort_order' => 1],
            ['category' => 'Entradas', 'name' => 'Batata rústica', 'description' => 'Batatas com páprica, alecrim e molho da casa.', 'price' => 32.50, 'sort_order' => 2],
            ['category' => 'Pratos principais', 'name' => 'Filé ao molho madeira', 'description' => 'Acompanha arroz, fritas e legumes.', 'price' => 68.00, 'sort_order' => 1],
            ['category' => 'Pratos principais', 'name' => 'Risoto de camarão', 'description' => 'Arroz arbóreo, camarões salteados e parmesão.', 'price' => 74.90, 'sort_order' => 2],
            ['category' => 'Bebidas', 'name' => 'Suco natural', 'description' => 'Laranja, limão ou maracujá.', 'price' => 12.00, 'sort_order' => 1],
            ['category' => 'Bebidas', 'name' => 'Refrigerante lata', 'description' => 'Consulte sabores disponíveis.', 'price' => 8.50, 'sort_order' => 2],
            ['category' => 'Sobremesas', 'name' => 'Pudim da casa', 'description' => 'Calda de caramelo e textura cremosa.', 'price' => 18.00, 'sort_order' => 1],
            ['category' => 'Sobremesas', 'name' => 'Brownie com sorvete', 'description' => 'Brownie quente com sorvete de creme.', 'price' => 24.00, 'sort_order' => 2],
        ];

        foreach ($products as $productData) {
            $category = Category::where('name', $productData['category'])->firstOrFail();

            Product::updateOrCreate(
                ['name' => $productData['name']],
                [
                    'category_id' => $category->id,
                    'description' => $productData['description'],
                    'price' => $productData['price'],
                    'is_available' => true,
                    'is_active' => true,
                    'sort_order' => $productData['sort_order'],
                ],
            );
        }
    }
}
