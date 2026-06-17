<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tables', function (Blueprint $table) {
            $table->timestamp('token_regenerated_at')->nullable()->after('token');
            $table->timestamp('token_revoked_at')->nullable()->after('token_regenerated_at');
        });
    }

    public function down(): void
    {
        Schema::table('tables', function (Blueprint $table) {
            $table->dropColumn(['token_regenerated_at', 'token_revoked_at']);
        });
    }
};
