# Rastreabilidade do enunciado

Fonte: `Projeto_Final_Mendix_CampusFix.docx`, lido na íntegra (secções 1 a 14 e 17; o documento não tem secções 15 e 16). Cada resultado refere uma execução real descrita em [VALIDACAO.md](VALIDACAO.md): **CI** = GitHub Actions com Mendix 11.6.0; **Local** = Windows 11 do aluno, cópia convertida para 11.12.5.

## Matriz

| Requisito | Implementação | Teste realizado | Resultado | Pendência |
| --- | --- | --- | --- | --- |
| RF01 autenticação e navegação | Segurança Production, `Administration.Account`, perfis Utilizador/Tecnico/Administrator, menu filtrado por permissões | Login dos quatro perfis; menu esperado por perfil; cada item aberto sem erro; B não abre `/p/categorias`, `/p/todos-pedidos`, `/p/gestao-pedidos` | PASS CI e Local | — |
| RF02 criar pedido | `ACT_Pedido_Novo` / `ACT_Pedido_Guardar` / `SUB_Pedido_Guardar` | Regra *RF02 criação com autor data e estado automáticos*; interface mostra Estado Novo, autor e data | PASS CI e Local | — |
| RF03 os meus pedidos | `Pedido_Meus`, `Pedido_Detalhe`, Entity Access por criador | A volta a ver o pedido; B não o vê; regra *RF03 outro utilizador não pode consultar* | PASS CI e Local | — |
| RF04 editar pedido aberto | `FormularioPedido`, autor/estado/versão verificados no servidor | Regras de edição válida, de outro autor, resolvida e desatualizada; interface sem Editar após resolução | PASS CI e Local | — |
| RF05 técnico | `Pedido_Gestao`, `ACT_Pedido_Assumir`, `ACT_Pedido_IniciarTratamento` | Assumir mostra `cf_tecnico` na grelha e no detalhe; segundo técnico não substitui (regra) | PASS CI e Local | — |
| RF06 comentários | `ACT_Comentario_Registar`, autor/data no servidor | Comentário do aluno e nota do técnico com autor; não aparece noutro pedido; regra valida `Comentario_Autor`/`Comentario_Pedido` | PASS CI e Local | — |
| RF07 concluir | `ACT_Pedido_Concluir`, nota obrigatória, `DataConclusao` | Detalhe mostra Resolvido e data de conclusão; regra impede repetir ou concluir sem nota | PASS CI e Local | — |
| RF08 categorias | `Categoria_Overview` / `Categoria_Formulario`, desativação sem eliminação | Criar, editar e desativar (reaberto para confirmar); inativa fora do combo; regra recusa inativa | PASS CI e Local | — |
| RF09 pesquisa e filtros | Data Grid com pesquisa por título e filtros de estado e prioridade | Pesquisa "Projetor" e filtro Resolvido em Os meus pedidos | PASS CI e Local | — |
| RF10 dashboard | `DS_Resumo` com `@applyentityaccess`, quatro indicadores | A vê 1 novo; B vê 0 | PASS CI e Local | — |
| Detalhe completo (secção 7) | Título, número, estado, prioridade, categoria, autor, técnico, datas, descrição, localização, comentários, histórico | Verificados na interface | PASS CI e Local | Corrigido nesta versão: faltava a categoria |
| Administração de utilizadores/perfis | Módulo Administration (`Account_Overview`) | Administrador cria três contas com perfis | PASS Local | Não corre na CI, que usa contas demo |
| MF01 a MF04 | `SUB_Pedido_Guardar`, `SUB_Pedido_Assumir`, `SUB_Pedido_Concluir`, `SUB_Comentario_Registar` | 16 testes de regras | PASS CI | — |
| Regra extra | Cancelamento pelo autor, histórico imutável, controlo de versão | Regras *Extra cancelamento…* e *Extra edição desatualizada…* | PASS CI | — |
| Segurança no servidor | Entity Access XPath; `SUB_*` sem acesso de cliente; rascunhos sem escrita nos destinos | Consulta administrativa repetida com a sessão de B não devolve o pedido | PASS CI e Local | — |
| Versionamento | Commits desde a base até às correções | `git log` no GitHub | Cumprido | — |
| Evidências | 5 capturas e resultados JSON | Geradas pela execução CI 11.6.0 | Cumprido | — |
| Execução no Studio Pro 11.6.0 local | — | — | Não executado | Instalar o Studio Pro 11.6.0 (aprovação de administrador do Windows) |

## Testes automáticos de regras

`tests/regras.test.mdl` contém 16 cenários. Cobrem criação e autoria, isolamento entre utilizadores, atribuição, técnico errado, resolução com data, nota obrigatória, repetição, bloqueio da edição terminal, edição válida, comentários, categoria inativa, cancelamento e versão desatualizada.

São executados pelo runtime Mendix, em base HSQLDB descartável. O módulo CampusFixTest fornece fixtures temporárias e é removido do modelo antes de o projecto ser versionado. Os testes de regras correm em contexto de sistema; por isso, as permissões de entidades são verificadas separadamente com sessões reais no teste de interface.

## Teste de interface

`scripts/ui-test.cjs` abre sessões independentes de administrador, utilizador A, utilizador B e técnico. Percorre categorias (criar, editar, desativar), criação e comentário do pedido, isolamento de B (interface, painel, consulta repetida e URLs diretos), atribuição, tratamento e conclusão, bloqueio após resolução, autores dos comentários, pesquisa e filtro, e a navegação de cada perfil.

Variáveis:

| Variável | Uso |
| --- | --- |
| `CAMPUSFIX_TEST_PASSWORD` | Palavra-passe das contas `cf_*` (obrigatória) |
| `CAMPUSFIX_EVIDENCIAS` | Pasta das capturas e do JSON |
| `CAMPUSFIX_ADMIN_USER`, `CAMPUSFIX_ADMIN_PASSWORD` | Administrador; por omissão `cf_admin` e a palavra-passe de teste |
| `CAMPUSFIX_CREATE_ACCOUNTS=1` | O administrador cria `cf_aluno_a`, `cf_aluno_b` e `cf_tecnico` pela interface |
| `CAMPUSFIX_BASE_URL` | Por omissão `http://127.0.0.1:8080` |

`scripts/ui-ci.sh` gera contas e palavras-passe aleatórias apenas numa cópia descartável em loopback. `tests/ui-demo.mdl` documenta este procedimento; não contém credenciais. Antes da exportação, o modelo é limpo: não tem palavras-passe administrativas nem definições de contas demo, e mantém o acesso anónimo desativado.

Os resultados ficam em `reports/testes.xml`, `reports/testes.log` e `docs/evidencias/testes-interface.json`.

## Repetir

```bash
bash scripts/build-ci.sh /caminho/para/mxcli
bash scripts/ui-ci.sh /caminho/para/mxcli
```

Estes scripts são para Linux (como a CI): o MxBuild publicado no CDN da Mendix só existe para Linux. Necessitam de mxcli v0.28.0, Java 21, .NET 8, Node.js e Playwright. Em Windows, usar o workflow CampusFix Mendix no GitHub Actions ou o Studio Pro 11.6.0, cujo MxBuild o mxcli encontra automaticamente.
