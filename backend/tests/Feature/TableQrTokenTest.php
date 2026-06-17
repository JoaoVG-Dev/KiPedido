<?php

namespace Tests\Feature;

use App\Models\RestaurantTable;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TableQrTokenTest extends TestCase
{
    use RefreshDatabase;

    public function test_regenerating_table_token_invalidates_previous_tablet_link(): void
    {
        $admin = $this->createAdmin();
        $table = $this->createTable('mesa-antiga');

        Sanctum::actingAs($admin);

        $newToken = $this->postJson("/api/admin/tables/{$table->id}/regenerate-token")
            ->assertOk()
            ->assertJsonMissing(['token' => 'mesa-antiga'])
            ->json('token');

        $this->assertNotSame('mesa-antiga', $newToken);
        $this->assertGreaterThanOrEqual(32, strlen($newToken));

        $this->getJson('/api/tablet/mesa-antiga/session')
            ->assertUnprocessable()
            ->assertJsonPath('errors.token.0', 'Token de mesa invalido. Confira o QR code ou solicite um novo acesso a equipe.');

        $this->getJson("/api/tablet/{$newToken}/session")
            ->assertOk()
            ->assertJsonPath('table.id', $table->id);
    }

    public function test_revoked_table_token_cannot_open_tablet_session(): void
    {
        $admin = $this->createAdmin();
        $table = $this->createTable('mesa-ativa');

        Sanctum::actingAs($admin);

        $this->postJson("/api/admin/tables/{$table->id}/revoke-token")
            ->assertOk()
            ->assertJsonPath('token', 'mesa-ativa')
            ->assertJsonPath('token_revoked_at', fn ($value) => is_string($value));

        $this->getJson('/api/tablet/mesa-ativa/session')
            ->assertUnprocessable()
            ->assertJsonPath('errors.token.0', 'Este token de mesa foi revogado ou esta inativo. Solicite um novo QR code a equipe.');
    }

    private function createAdmin(): User
    {
        return User::create([
            'name' => 'Admin QR',
            'email' => 'admin-qr@kipedido.test',
            'password' => 'password',
            'role' => 'admin',
            'is_active' => true,
        ]);
    }

    private function createTable(string $token): RestaurantTable
    {
        return RestaurantTable::create([
            'name' => 'Mesa QR',
            'number' => 1,
            'token' => $token,
            'token_regenerated_at' => now(),
            'token_revoked_at' => null,
            'status' => 'available',
            'is_active' => true,
        ]);
    }
}
