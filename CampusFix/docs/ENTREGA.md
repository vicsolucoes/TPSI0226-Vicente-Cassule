# Entrega do projecto final

| Campo | Valor |
| --- | --- |
| Aluno | Vicente Cassule |
| Turma | TPSI-CAS-0226 |
| Projecto | CampusFix — Gestão de Pedidos de Suporte e Manutenção |
| Repositório | https://github.com/vicsolucoes/TPSI0226-Vicente-Cassule |
| Branch | `main` |
| Pasta da aplicação | `CampusFix/` (abrir `CampusFix/CampusFix.mpr`) |
| Versão Mendix | Studio Pro 11.6.0 |

O enunciado não indica o repositório oficial da disciplina nem o canal de entrega (os campos *Data de entrega* e *Repositório Git/GitHub* estão em branco). Confirmar com o professor se a publicação neste repositório basta ou se é preciso entregar noutro local.

## Entregáveis (secção 13)

| Entregável | Onde |
| --- | --- |
| Aplicação Mendix funcional e executável | `CampusFix/CampusFix.mpr` com `mprcontents/`, `theme/`, `widgets/` e restantes pastas; instruções em [README](../README.md#abrir) |
| Identificação do projecto e do repositório | Esta página e o [README da raiz](../../README.md) |
| Histórico de commits | [Commits em main](https://github.com/vicsolucoes/TPSI0226-Vicente-Cassule/commits/main) |
| Nome, funcionalidades, perfis e opcionais | [README](../README.md) |
| 3 a 5 capturas | [docs/evidencias](evidencias/README.md) (5 capturas) |
| Limitações e requisitos incompletos | [README › Limitações](../README.md#limitações), [VALIDACAO.md](VALIDACAO.md#limitações-desta-validação) |

## Checklist do aluno (secção 14)

| Item | Evidência |
| --- | --- |
| Entrar com perfis diferentes | Login de administrador, A, B e técnico nos testes CI e local |
| Utilizador cria e consulta os seus pedidos | RF02/RF03 PASS |
| Técnico trata e conclui pedidos | RF05/RF07 PASS |
| Administrador gere categorias | RF08 criar, editar, desativar PASS |
| Permissões impedem acessos indevidos | Isolamento de B e URLs diretos recusados PASS |
| Pelo menos quatro microflows com lógica | MF01 a MF04 e regra extra; 16 testes de regras |
| Dashboard com indicadores | Quatro indicadores |
| Fluxos testados sem erros | [VALIDACAO.md](VALIDACAO.md) |
| Vários commits com mensagens claras | Histórico em `main` |
| README e evidências | Este repositório |

## Mensagem de entrega (rascunho)

> Assunto: Projeto Final Mendix — CampusFix — Vicente Cassule (TPSI-CAS-0226)
>
> Professor,
>
> Envio o projeto final CampusFix.
>
> Repositório: https://github.com/vicsolucoes/TPSI0226-Vicente-Cassule (branch `main`)
> Projeto Mendix: pasta `CampusFix/`, ficheiro `CampusFix/CampusFix.mpr` (Mendix Studio Pro 11.6.0)
> Versão entregue: commit `<COMMIT>`
>
> Antes de executar, é necessário definir a palavra-passe do administrador em App Security › Administrator (o modelo publicado não guarda credenciais). As instruções, as funcionalidades, os perfis, as capturas, os resultados dos testes e as limitações estão no README da pasta `CampusFix`.
>
> Com os melhores cumprimentos,
> Vicente Cassule
