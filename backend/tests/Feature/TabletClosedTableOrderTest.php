<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\RestaurantTable;
use App\Models\TableSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TabletClosedTableOrderTest extends TestCase
{
    use RefreshDatabase;

    public function test_closed_table_with_paid_session_cannot_receive_new_tablet_order(): void
    {
        [$table, $product] = $this->createTableAndProduct('closed');
        $session = TableSession::create([
            'table_id' => $table->id,
            'opened_at' => now()->subHour(),
            'closed_at' => now(),
            'status' => 'paid',
            'subtotal' => 120,
            'service_fee_amount' => 0,
            'total_amount' => 120,
        ]);

        Order::create([
            'table_session_id' => $session->id,
            'table_id' => $table->id,
            'code' => 'KPOLD001',
            'status' => 'delivered',
            'sent_at' => now()->subHour(),
            'delivered_at' => now()->subMinutes(30),
        ]);

        $this->postJson("/api/tablet/{$table->token}/orders", [
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 1,
                    'notes' => null,
                ],
            ],
        ])
            ->assertUnprocessable()
            ->assertJsonPath(
                'errors.table.0',
                'Esta mesa está fechada aguardando liberação pelo caixa. Não é possível enviar novos pedidos.',
            );

        $this->assertSame('closed', $table->fresh()->status);
        $this->assertSame(1, TableSession::where('table_id', $table->id)->count());
        $this->assertSame(1, Order::where('table_id', $table->id)->count());
    }

    public function test_available_table_still_creates_tablet_order_normally(): void
    {
        [$table, $product] = $this->createTableAndProduct('available');

        $this->postJson("/api/tablet/{$table->token}/orders", [
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 1,
                    'notes' => null,
                ],
            ],
        ])
            ->assertCreated()
            ->assertJsonPath('status', 'received');

        $this->assertSame('occupied', $table->fresh()->status);
        $this->assertSame(1, TableSession::where('table_id', $table->id)->where('status', 'open')->count());
        $this->assertSame(1, Order::where('table_id', $table->id)->count());
    }

    /**
     * @return array{0: RestaurantTable, 1: Product}
     */
    private function createTableAndProduct(string $tableStatus): array
    {
        $table = RestaurantTable::create([
            'name' => 'Mesa 1',
            'number' => 1,
            'token' => 'mesa-01-teste',
            'status' => $tableStatus,
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
            'description' => 'Produto usado no teste de mesa fechada',
            'price' => 120,
            'is_available' => true,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        return [$table, $product];
    }
}
