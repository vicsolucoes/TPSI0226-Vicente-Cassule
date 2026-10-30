# Rastreabilidade do enunciado

Fonte: Projeto_Final_Mendix_CampusFix.docx, sete páginas. A confirmação de execução está nos relatórios gerados pela CI, não nesta tabela.

| Requisito | Implementação |
| --- | --- |
| RF01 autenticação e navegação | Segurança Production, Administration.Account, perfis Utilizador/Tecnico/Administrator, navegação por permissões |
| RF02 criar pedido | ACT_Pedido_Novo / ACT_Pedido_Guardar / SUB_Pedido_Guardar |
| RF03 os meus pedidos | Pedido_Meus, Pedido_Detalhe, restrição por criador nas entidades |
| RF04 editar pedido aberto | FormularioPedido, verificação de autor/estado/versão no servidor |
| RF05 técnico | Pedido_Gestao, ACT_Pedido_Assumir, ACT_Pedido_IniciarTratamento |
| RF06 comentários | FormularioComentario, ACT_Comentario_Registar e autor/data automáticos |
| RF07 concluir | FormularioResolucao, ACT_Pedido_Concluir e nota/data de resolução |
| RF08 categorias | Categoria_Overview / Categoria_Formulario e desativação sem eliminação |
| RF09 pesquisa e filtros | Data Grid: título, estado, prioridade; também categorias por nome/ativa |
| RF10 dashboard | DS_Resumo: quatro indicadores visíveis calculados com Entity Access |
| MF01 a MF04 | Ações e submicroflows de criação, atribuição, conclusão e comentário |
| Regra extra | Cancelamento pelo autor, histórico imutável e controlo de versão da edição |
| Versionamento | Commits desde a criação da base, implementação e correções verificadas |
| Evidências | docs/evidencias e reports gerados pelo GitHub Actions |

## Testes automáticos de regras

`tests/regras.test.mdl` contém 16 cenários. Cobrem criação e autoria, isolamento entre utilizadores nas regras, atribuição, técnico errado, resolução com data, nota obrigatória, repetição, bloqueio da edição terminal, edição válida, comentários, categoria inativa, cancelamento e versão desatualizada.

São executados pelo runtime Mendix, em base HSQLDB descartável. O módulo CampusFixTest fornece fixtures temporárias e é removido do modelo antes de o projecto ser versionado. Os testes de regras correm em contexto de sistema; por isso, a validação das permissões de entidades é feita separadamente com sessões reais no teste de interface.

## Teste de interface

`scripts/ui-test.cjs` inicia sessões de utilizador A, utilizador B, técnico e administrador numa cópia descartável da aplicação. Cria uma categoria, regista e comenta um pedido, trata-o e conclui-o, e verifica o bloqueio da edição após resolução. Repete uma consulta real da grelha administrativa com a sessão de B para verificar que as permissões não expõem o pedido de A.

As contas de teste são exclusivamente dados fictícios. O ficheiro `tests/ui-demo.mdl` é aplicado só à cópia de teste em loopback; a aplicação entregue mantém contas demo desativadas.

Os resultados efetivos ficam em `reports/testes.xml`, `reports/testes.log` e `docs/evidencias/testes-interface.json`. As cinco capturas previstas são dashboard, meus pedidos, detalhe com comentário, área técnica e categorias.

## Repetir

```bash
bash scripts/build-ci.sh /caminho/para/mxcli
bash scripts/ui-ci.sh /caminho/para/mxcli
```

O segundo comando necessita de Node.js, acesso aos pacotes do Playwright e permissão para instalar as dependências do Chromium. Em alternativa, usar o workflow CampusFix Mendix no GitHub Actions.
