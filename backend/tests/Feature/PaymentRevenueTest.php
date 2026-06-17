<?php

namespace Tests\Feature;

use App\Actions\Orders\CreateOrderAction;
use App\Actions\Payments\CloseTableSessionAction;
use App\Actions\Tables\CalculateTableBillAction;
use App\Models\Category;
use App\Models\Product;
use App\Models\RestaurantSetting;
use App\Models\RestaurantTable;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PaymentRevenueTest extends TestCase
{
    use RefreshDatabase;

    public function test_full_payment_records_actual_revenue_once(): void
    {
        [$user, $table] = $this->createOpenTable(price: 120);

        $payment = app(CloseTableSessionAction::class)->execute($table->fresh(), [
            'payment_method' => 'pix',
            'amount_paid' => 120,
        ], $user);

        $this->assertSame(120.0, (float) $payment->total_amount);
        $this->assertSame(120.0, (float) $payment->amount_paid);
        $this->assertSame(0.0, (float) $payment->change_amount);

        $this->assertDashboardRevenue($user, 120.0);
        $this->assertDailySalesTotals($user, [
            'payments_count' => 1,
            'gross_total' => 120.0,
            'discount_total' => 0.0,
            'service_fee_total' => 0.0,
            'net_total' => 120.0,
            'amount_paid_total' => 120.0,
            'change_total' => 0.0,
        ]);
    }

    public function test_partial_payment_records_only_the_transaction_amount(): void
    {
        [$user, $table] = $this->createOpenTable(price: 120);

        $payment = app(CloseTableSessionAction::class)->execute($table->fresh(), [
            'payment_method' => 'pix',
            'amount_paid' => 60,
        ], $user);

        $bill = app(CalculateTableBillAction::class)->execute($table->fresh());

        $this->assertSame(60.0, (float) $payment->total_amount);
        $this->assertSame(60.0, (float) $payment->amount_paid);
        $this->assertSame('waiting_payment', $payment->tableSession->status);
        $this->assertSame(60.0, (float) $bill['paid_amount']);
        $this->assertSame(60.0, (float) $bill['remaining_amount']);

        $this->assertDashboardRevenue($user, 60.0);
        $this->assertDailySalesTotals($user, [
            'payments_count' => 1,
            'gross_total' => 60.0,
            'discount_total' => 0.0,
            'service_fee_total' => 0.0,
            'net_total' => 60.0,
            'amount_paid_total' => 60.0,
            'change_total' => 0.0,
        ]);
    }

    public function test_split_payments_do_not_duplicate_dashboard_or_report_revenue(): void
    {
        [$user, $table] = $this->createOpenTable(price: 120);
        $closeTableSessionAction = app(CloseTableSessionAction::class);

        $firstPayment = $closeTableSessionAction->execute($table->fresh(), [
            'payment_method' => 'pix',
            'amount_paid' => 40,
        ], $user);
        $secondPayment = $closeTableSessionAction->execute($table->fresh(), [
            'payment_method' => 'credit_card',
            'amount_paid' => 50,
        ], $user);
        $finalPayment = $closeTableSessionAction->execute($table->fresh(), [
            'payment_method' => 'debit_card',
            'amount_paid' => 30,
        ], $user);

        $bill = app(CalculateTableBillAction::class)->execute($table->fresh());

        $this->assertSame(40.0, (float) $firstPayment->total_amount);
        $this->assertSame(50.0, (float) $secondPayment->total_amount);
        $this->assertSame(30.0, (float) $finalPayment->total_amount);
        $this->assertSame(120.0, (float) $bill['paid_amount']);
        $this->assertSame(0.0, (float) $bill['remaining_amount']);

        $this->assertDashboardRevenue($user, 120.0);
        $response = $this->dailySalesResponse($user);

        $this->assertSame(3, $response->json('payments_count'));
        $this->assertSame(120.0, (float) $response->json('net_total'));
        $this->assertSame(120.0, (float) $response->json('amount_paid_total'));
        $this->assertSame(40.0, (float) collect($response->json('payments_by_method'))->firstWhere('payment_method', 'pix')['total_amount']);
        $this->assertSame(50.0, (float) collect($response->json('payments_by_method'))->firstWhere('payment_method', 'credit_card')['total_amount']);
        $this->assertSame(30.0, (float) collect($response->json('payments_by_method'))->firstWhere('payment_method', 'debit_card')['total_amount']);
    }

    public function test_overpayment_records_change_without_inflating_revenue(): void
    {
        [$user, $table] = $this->createOpenTable(price: 120);

        $payment = app(CloseTableSessionAction::class)->execute($table->fresh(), [
            'payment_method' => 'cash',
            'amount_paid' => 150,
        ], $user);

        $bill = app(CalculateTableBillAction::class)->execute($table->fresh());

        $this->assertSame(120.0, (float) $payment->total_amount);
        $this->assertSame(150.0, (float) $payment->amount_paid);
        $this->assertSame(30.0, (float) $payment->change_amount);
        $this->assertSame(120.0, (float) $bill['paid_amount']);
        $this->assertSame(30.0, (float) $bill['change_amount']);

        $this->assertDashboardRevenue($user, 120.0);
        $this->assertDailySalesTotals($user, [
            'payments_count' => 1,
            'gross_total' => 120.0,
            'discount_total' => 0.0,
            'service_fee_total' => 0.0,
            'net_total' => 120.0,
            'amount_paid_total' => 150.0,
            'change_total' => 30.0,
        ]);
    }

    /**
     * @return array{0: User, 1: RestaurantTable}
     */
    private function createOpenTable(float $price, float $serviceFeePercentage = 0): array
    {
        $user = User::create([
            'name' => 'Administrador Teste',
            'email' => 'admin@kipedido.test',
            'password' => 'password',
            'role' => 'admin',
            'is_active' => true,
        ]);

        RestaurantSetting::create([
            'restaurant_name' => 'KiPedido Teste',
            'service_fee_percentage' => $serviceFeePercentage,
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
            'description' => 'Produto usado em testes financeiros',
            'price' => $price,
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

        return [$user, $table];
    }

    private function assertDashboardRevenue(User $user, float $expected): void
    {
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/admin/dashboard')
            ->assertOk();

        $this->assertSame($expected, (float) $response->json('metrics.today_revenue'));
    }

    /**
     * @param  array<string, float|int>  $expected
     */
    private function assertDailySalesTotals(User $user, array $expected): void
    {
        $response = $this->dailySalesResponse($user);

        foreach ($expected as $key => $value) {
            $actual = $key === 'payments_count'
                ? $response->json($key)
                : (float) $response->json($key);

            $this->assertSame($value, $actual, "Failed asserting daily sales key [{$key}].");
        }
    }

    private function dailySalesResponse(User $user)
    {
        Sanctum::actingAs($user);

        return $this->getJson('/api/admin/reports/daily-sales')
            ->assertOk();
    }
}
