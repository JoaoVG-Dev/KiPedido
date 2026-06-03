<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RestaurantSetting extends Model
{
    protected $fillable = [
        'restaurant_name',
        'logo_path',
        'service_fee_percentage',
        'currency',
        'printer_enabled',
        'sound_alerts_enabled',
    ];

    protected function casts(): array
    {
        return [
            'service_fee_percentage' => 'decimal:2',
            'printer_enabled' => 'boolean',
            'sound_alerts_enabled' => 'boolean',
        ];
    }
}
