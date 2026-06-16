<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ! $user->is_active) {
            return response()->json(['message' => 'Usuário inativo ou não autenticado.'], 403);
        }

        if (! in_array($user->role, $roles, true)) {
            return response()->json(['message' => 'Você não tem permissão para acessar este recurso.'], 403);
        }

        return $next($request);
    }
}
