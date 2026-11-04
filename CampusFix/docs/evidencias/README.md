# Evidências da execução

Capturas geradas pelo Playwright a partir da aplicação Mendix 11.6.0 em execução, na [execução 41867763370 do GitHub Actions](https://github.com/vicsolucoes/TPSI0226-Vicente-Cassule/actions/runs/41867763370) de 04/11/2026, com sessões independentes e dados fictícios. O mesmo percurso guarda o resultado em `testes-interface.json` (21 verificações aprovadas).

| Captura | O que demonstra |
| --- | --- |
| [01-dashboard.png](01-dashboard.png) | Painel inicial com quatro indicadores; o autor vê o seu pedido novo |
| [02-meus-pedidos.png](02-meus-pedidos.png) | Lista dos pedidos do utilizador com pesquisa e filtros |
| [03-detalhe-com-comentario.png](03-detalhe-com-comentario.png) | Detalhe com estado, prioridade, categoria, autor, técnico, datas, comentário e histórico |
| [04-area-tecnico.png](04-area-tecnico.png) | Área do técnico: pedido assumido, em análise, com categoria e técnico responsável |
| [05-categorias.png](05-categorias.png) | Administração de categorias, com uma editada e outra desativada |

A ausência do pedido de A na sessão de B é verificada automaticamente na interface, no painel, numa consulta repetida ao runtime e no acesso direto aos URLs. Uma imagem isolada não comprova esta restrição; a verificação está em `scripts/ui-test.cjs` e no resultado JSON.
