<?php

namespace Tests\Feature;

use App\Actions\Orders\CreateOrderAction;
use App\Models\Category;
use App\Models\Product;
use App\Models\RestaurantSetting;
use App\Models\RestaurantTable;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CashierDiscountLockTest extends TestCase
{
    use RefreshDatabase;

    public function test_discount_can_only_change_before_first_payment_and_table_can_still_be_released(): void
    {
        [$cashier, $table] = $this->createOpenTable();

        Sanctum::actingAs($cashier);

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

        $this->postJson("/api/cashier/tables/{$table->id}/apply-discount", [
            'discount_amount' => 10,
        ])
            ->assertUnprocessable()
            ->assertJsonPath(
                'errors.discount_amount.0',
                'Não é possível alterar o desconto depois que um pagamento já foi registrado.',
            );

        $this->postJson("/api/cashier/tables/{$table->id}/apply-discount", [
            'discount_amount' => 0,
        ])
            ->assertUnprocessable()
            ->assertJsonPath(
                'errors.discount_amount.0',
                'Não é possível alterar o desconto depois que um pagamento já foi registrado.',
            );

        $this->getJson("/api/cashier/tables/{$table->id}/bill")
            ->assertOk()
            ->assertJsonPath('discount_amount', 20)
            ->assertJsonPath('total_amount', 100)
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

        $this->getJson("/api/cashier/tables/{$table->id}/bill")
            ->assertUnprocessable()
            ->assertJsonPath('errors.table.0', 'Esta mesa não possui consumo aberto.');
    }

    /**
     * @return array{0: User, 1: RestaurantTable}
     */
    private function createOpenTable(): array
    {
        $cashier = User::create([
            'name' => 'Caixa Teste',
            'email' => 'cashier-discount@kipedido.test',
            'password' => 'password',
            'role' => 'cashier',
            'is_active' => true,
        ]);

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
            'description' => 'Produto usado no teste de trava de desconto',
            'price' => 120,
            'is_available' => true,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        app(CreateOrderAction::class)->execute($table->fresh(), [
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 1,
                    'notes' => null,
                ],
            ],
        ]);

        return [$cashier, $table];
    }
}
