<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\PainelSenha;
use Doctrine\ORM\EntityManagerInterface;
use Novosga\Entity\UsuarioInterface;
use Novosga\Http\Envelope;
use Novosga\Service\ServicoServiceInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/novosga.monitor')]
class MonitorPanelController extends AbstractController
{
    #[Route('/painel', name: 'novosga_monitor_painel', methods: ['GET'])]
    public function painel(
        Request $request,
        EntityManagerInterface $em,
        ServicoServiceInterface $servicoService,
    ): Response {
        /** @var UsuarioInterface $usuario */
        $usuario = $this->getUser();
        $unidade = $usuario->getLotacao()->getUnidade();

        $param = (string) $request->get('servicos', '');
        $ids = array_values(
            array_filter(
                array_map('intval', explode(',', $param)),
                static fn (int $id): bool => $id > 0,
            )
        );

        if (empty($ids)) {
            $servicos = $servicoService->servicosUnidade($unidade, ['ativo' => true]);
            foreach ($servicos as $su) {
                $ids[] = $su->getServico()->getId();
            }
        }

        $envelope = new Envelope();
        if (empty($ids)) {
            return $this->json($envelope);
        }

        $qb = $em->createQueryBuilder();
        $qb
            ->select(['e', 's'])
            ->from(PainelSenha::class, 'e')
            ->join('e.servico', 's')
            ->where('e.unidade = :unidade')
            ->andWhere('s.id IN (:servicos)')
            ->orderBy('e.id', 'DESC')
            ->setParameter('unidade', $unidade)
            ->setParameter('servicos', $ids)
            ->setMaxResults(10);

        $senhas = $qb->getQuery()->getResult();
        $data = array_map(
            static fn (PainelSenha $senha): array => $senha->jsonSerialize(),
            $senhas,
        );

        $envelope->setData($data);

        return $this->json($envelope);
    }
}
