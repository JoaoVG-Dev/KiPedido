<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Logs\LogAction;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request, LogAction $logAction)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:120'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password) || ! $user->is_active) {
            throw ValidationException::withMessages([
                'email' => 'Credenciais inválidas ou usuário inativo.',
            ]);
        }

        $token = $user->createToken($data['device_name'] ?? 'admin-panel')->plainTextToken;

        $logAction->execute('user.login', "{$user->name} entrou no sistema.", [
            'user' => $user,
            'role' => $user->role,
        ]);

        return response()->json([
            'token' => $token,
            'user' => $user,
        ]);
    }

    public function logout(Request $request, LogAction $logAction)
    {
        $user = $request->user();

        $user?->currentAccessToken()?->delete();

        if ($user) {
            $logAction->execute('user.logout', "{$user->name} saiu do sistema.", [
                'user' => $user,
            ]);
        }

        return response()->json(['message' => 'Logout realizado com sucesso.']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }
}
