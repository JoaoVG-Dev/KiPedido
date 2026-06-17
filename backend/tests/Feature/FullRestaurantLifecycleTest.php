<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\RestaurantSetting;
use App\Models\RestaurantTable;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FullRestaurantLifecycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_full_restaurant_order_lifecycle_keeps_revenue_consistent(): void
    {
        [$admin, $kitchen, $cashier, $table, $product] = $this->createRestaurantFixture();

        $orderId = $this->postJson("/api/tablet/{$table->token}/orders", [
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 1,
                    'notes' => 'Sem cebola',
                ],
            ],
        ])
            ->assertCreated()
            ->assertJsonPath('status', 'received')
            ->json('id');

        Sanctum::actingAs($kitchen);

        $this->patchJson("/api/kitchen/orders/{$orderId}/status", ['status' => 'preparing'])
            ->assertOk()
            ->assertJsonPath('status', 'preparing');

        $this->patchJson("/api/kitchen/orders/{$orderId}/status", ['status' => 'ready'])
            ->assertOk()
            ->assertJsonPath('status', 'ready');

        $this->patchJson("/api/kitchen/orders/{$orderId}/status", ['status' => 'delivered'])
            ->assertOk()
            ->assertJsonPath('status', 'delivered');

        Sanctum::actingAs($cashier);

        $this->getJson("/api/cashier/tables/{$table->id}/bill")
            ->assertOk()
            ->assertJsonPath('subtotal', 120)
            ->assertJsonPath('total_amount', 120);

        $this->postJson("/api/cashier/tables/{$table->id}/apply-discount", [
            'discount_amount' => 20,
        ])
            ->assertOk()
            ->assertJsonPath('discount_amount', 20)
            ->assertJsonPath('total_amount', 100);

        $this->postJson("/api/cashier/tables/{$table->id}/close", [
            'payment_method' => 'pix',
            'amount_paid' => 40,
        ])
            ->assertCreated()
            ->assertJsonPath('total_amount', '40.00')
            ->assertJsonPath('amount_paid', '40.00');

        $this->getJson("/api/cashier/tables/{$table->id}/bill")
            ->assertOk()
            ->assertJsonPath('paid_amount', 40)
            ->assertJsonPath('remaining_amount', 60);

        $this->postJson("/api/cashier/tables/{$table->id}/close", [
            'payment_method' => 'debit_card',
            'amount_paid' => 60,
        ])
            ->assertCreated()
            ->assertJsonPath('total_amount', '60.00')
            ->assertJsonPath('amount_paid', '60.00');

        $this->postJson("/api/cashier/tables/{$table->id}/release")
            ->assertOk()
            ->assertJsonPath('status', 'available');

        Sanctum::actingAs($admin);

        $this->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('metrics.today_revenue', 100);

        $this->getJson('/api/admin/reports/daily-sales')
            ->assertOk()
            ->assertJsonPath('payments_count', 2)
            ->assertJsonPath('gross_total', 120)
            ->assertJsonPath('discount_total', 20)
            ->assertJsonPath('net_total', 100)
            ->assertJsonPath('amount_paid_total', 100)
            ->assertJsonPath('change_total', 0);
    }

    /**
     * @return array{0: User, 1: User, 2: User, 3: RestaurantTable, 4: Product}
     */
    private function createRestaurantFixture(): array
    {
        $admin = $this->createUser('admin@kipedido.test', 'admin');
        $kitchen = $this->createUser('kitchen@kipedido.test', 'kitchen');
        $cashier = $this->createUser('cashier@kipedido.test', 'cashier');

        RestaurantSetting::create([
            'restaurant_name' => 'KiPedido Teste',
            'service_fee_percentage' => 0,
            'currency' => 'BRL',
            'printer_enabled' => false,
            'sound_alerts_enabled' => false,
        ]);

        $table = RestaurantTable::create([
            'name' => 'Mesa 1',
            'number' => 1,
            'token' => 'mesa-01-teste',
            'status' => 'available',
            'is_active' => true,
        ]);

        $category = Category::create([
            'name' => 'Pratos',
            'description' => 'Pratos de teste',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Combo Teste',
            'description' => 'Produto usado no teste de ciclo completo',
            'price' => 120,
            'is_available' => true,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        return [$admin, $kitchen, $cashier, $table, $product];
    }

    private function createUser(string $email, string $role): User
    {
        return User::create([
            'name' => ucfirst($role).' Teste',
            'email' => $email,
            'password' => 'password',
            'role' => $role,
            'is_active' => true,
        ]);
    }
}
