<?php

declare(strict_types=1);

namespace App\Controller;

use Novosga\Entity\UsuarioInterface;
use Novosga\Repository\PrioridadeRepositoryInterface;
use Novosga\Service\ServicoServiceInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

final class TotemController extends AbstractController
{
    #[Route('/totem', name: 'totem_index', methods: ['GET'])]
    public function index(
        ServicoServiceInterface $servicoService,
        PrioridadeRepositoryInterface $prioridadeRepository,
    ): Response {
        /** @var UsuarioInterface $usuario */
        $usuario = $this->getUser();
        $unidade = $usuario?->getLotacao()?->getUnidade();

        if (!$usuario || !$unidade) {
            return $this->redirectToRoute('app_login');
        }

        $prioridades = $prioridadeRepository->findAtivas();
        $servicos = $servicoService->servicosUnidade($unidade, ['ativo' => true]);

        return $this->render('totem/index.html.twig', [
            'usuario' => $usuario,
            'unidade' => $unidade,
            'servicos' => $servicos,
            'prioridades' => $prioridades,
        ]);
    }
}
