<?php

declare(strict_types=1);

namespace App\Security;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAuthenticationException;
use Symfony\Component\Security\Core\User\UserProviderInterface;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Passport;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;

final class AutoLoginAuthenticator extends AbstractAuthenticator
{
    public function __construct(
        private readonly UserProviderInterface $userProvider,
        private readonly TokenStorageInterface $tokenStorage,
    ) {
    }

    public function supports(Request $request): bool
    {
        if (!$this->isEnabled()) {
            return false;
        }

        $token = $this->tokenStorage->getToken();
        if ($token && $token->getUser()) {
            return false;
        }

        return true;
    }

    public function authenticate(Request $request): Passport
    {
        $username = $this->resolveUsername($request);
        if (!$username) {
            throw new CustomUserMessageAuthenticationException('Auto login user not configured.');
        }

        return new SelfValidatingPassport(
            new UserBadge($username, fn (string $userIdentifier) => $this->userProvider->loadUserByIdentifier($userIdentifier))
        );
    }

    public function onAuthenticationSuccess(Request $request, $token, string $firewallName): ?\Symfony\Component\HttpFoundation\Response
    {
        return null;
    }

    public function onAuthenticationFailure(Request $request, \Symfony\Component\Security\Core\Exception\AuthenticationException $exception): ?\Symfony\Component\HttpFoundation\Response
    {
        return null;
    }

    private function resolveUsername(Request $request): ?string
    {
        $admin = $this->env('NOVOSGA_AUTO_LOGIN_ADMIN');
        $attendant = $this->env('NOVOSGA_AUTO_LOGIN_ATTENDANT');
        $default = $this->env('NOVOSGA_AUTO_LOGIN_USER');

        $path = $request->getPathInfo();
        if ($admin && str_starts_with($path, '/admin')) {
            return $admin;
        }

        if ($attendant) {
            return $attendant;
        }

        return $default ?: $admin;
    }

    private function isEnabled(): bool
    {
        $flag = $this->env('NOVOSGA_AUTO_LOGIN');
        return $flag === '1' || $flag === 'true';
    }

    private function env(string $name): ?string
    {
        $value = $_ENV[$name] ?? getenv($name);
        return $value !== false ? $value : null;
    }
}
