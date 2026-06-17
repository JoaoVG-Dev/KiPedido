<?php

namespace Tests\Feature;

use App\Actions\Orders\CreateOrderAction;
use App\Actions\Payments\CloseTableSessionAction;
use App\Actions\Tables\CalculateTableBillAction;
use App\Actions\Tables\ReleaseTableAction;
use App\Models\Category;
use App\Models\Product;
use App\Models\RestaurantSetting;
use App\Models\RestaurantTable;
use App\Models\TableSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class CashierSplitPaymentTest extends TestCase
{
    use RefreshDatabase;

    public function test_cashier_split_payment_flow_keeps_table_waiting_until_total_is_paid_and_clears_bill_after_release(): void
    {
        $user = User::create([
            'name' => 'Caixa Teste',
            'email' => 'cashier@kipedido.test',
            'password' => Hash::make('password'),
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
            'description' => 'Produto usado no teste de pagamento dividido',
            'price' => 120,
            'is_available' => true,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $createOrderAction = app(CreateOrderAction::class);
        $closeTableSessionAction = app(CloseTableSessionAction::class);
        $calculateTableBillAction = app(CalculateTableBillAction::class);
        $releaseTableAction = app(ReleaseTableAction::class);

        $order = $createOrderAction->execute($table->fresh(), [
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 1,
                    'notes' => null,
                ],
            ],
        ]);

        $sessionId = $order->table_session_id;

        $bill = $calculateTableBillAction->execute($table->fresh());

        $this->assertSame(120.0, (float) $bill['total_amount']);
        $this->assertSame(0.0, (float) $bill['paid_amount']);
        $this->assertSame(120.0, (float) $bill['remaining_amount']);

        $firstPayment = $closeTableSessionAction->execute($table->fresh(), [
            'payment_method' => 'pix',
            'amount_paid' => 60,
        ], $user);

        $this->assertSame('paid', $firstPayment->status);
        $this->assertSame(60.0, (float) $firstPayment->amount_paid);
        $this->assertSame(0.0, (float) $firstPayment->change_amount);

        $table->refresh();
        $session = TableSession::findOrFail($sessionId);

        $this->assertSame('waiting_payment', $table->status);
        $this->assertSame('waiting_payment', $session->status);

        $billAfterFirstPayment = $calculateTableBillAction->execute($table->fresh());

        $this->assertSame(60.0, (float) $billAfterFirstPayment['paid_amount']);
        $this->assertSame(60.0, (float) $billAfterFirstPayment['remaining_amount']);
        $this->assertCount(1, $billAfterFirstPayment['session']->payments);

        $finalPayment = $closeTableSessionAction->execute($table->fresh(), [
            'payment_method' => 'debit_card',
            'amount_paid' => 60,
        ], $user);

        $this->assertSame('paid', $finalPayment->status);
        $this->assertSame(60.0, (float) $finalPayment->amount_paid);
        $this->assertSame(0.0, (float) $finalPayment->change_amount);

        $table->refresh();
        $session->refresh();

        $this->assertSame('closed', $table->status);
        $this->assertSame('paid', $session->status);
        $this->assertNotNull($session->closed_at);

        $closedBill = $calculateTableBillAction->execute($table->fresh());

        $this->assertSame(120.0, (float) $closedBill['paid_amount']);
        $this->assertSame(0.0, (float) $closedBill['remaining_amount']);
        $this->assertCount(2, $closedBill['session']->payments);

        $releaseTableAction->execute($table->fresh(), $user);

        $table->refresh();

        $this->assertSame('available', $table->status);

        try {
            $calculateTableBillAction->execute($table->fresh());

            $this->fail('A mesa liberada não deve retornar a conta antiga.');
        } catch (ValidationException $exception) {
            $this->assertSame(
                'Esta mesa não possui consumo aberto.',
                $exception->errors()['table'][0],
            );
        }

        $newOrder = $createOrderAction->execute($table->fresh(), [
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 1,
                    'notes' => null,
                ],
            ],
        ]);

        $this->assertNotSame($sessionId, $newOrder->table_session_id);

        $table->refresh();

        $this->assertSame('occupied', $table->status);
    }
}