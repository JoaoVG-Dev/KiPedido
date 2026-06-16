<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class RestaurantTable extends Model
{
    protected $table = 'tables';

    protected $fillable = [
        'name',
        'number',
        'token',
        'status',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(TableSession::class, 'table_id');
    }

    public function activeSession(): HasOne
    {
        return $this->hasOne(TableSession::class, 'table_id')
            ->whereIn('status', ['open', 'waiting_payment'])
            ->latestOfMany();
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'table_id');
    }

    public function serviceCalls(): HasMany
    {
        return $this->hasMany(ServiceCall::class, 'table_id');
    }
}
