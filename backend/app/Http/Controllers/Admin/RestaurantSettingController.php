<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\RestaurantSetting;
use Illuminate\Http\Request;

class RestaurantSettingController extends Controller
{
    public function show()
    {
        return RestaurantSetting::firstOrCreate(['id' => 1], [
            'restaurant_name' => 'KiPedido Restaurante',
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'restaurant_name' => ['required', 'string', 'max:180'],
            'logo_path' => ['nullable', 'string', 'max:255'],
            'service_fee_percentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'currency' => ['required', 'string', 'size:3'],
            'printer_enabled' => ['required', 'boolean'],
            'sound_alerts_enabled' => ['required', 'boolean'],
        ]);

        $settings = RestaurantSetting::updateOrCreate(['id' => 1], $data);

        return response()->json($settings);
    }
}
