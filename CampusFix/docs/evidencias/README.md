# Evidências da execução

Capturas geradas pelo Playwright a partir da aplicação Mendix em execução, com sessões independentes e dados fictícios. O workflow guarda também o resultado dos testes em `testes-interface.json`.

| Captura | O que demonstra |
| --- | --- |
| [01-dashboard.png](01-dashboard.png) | Quatro indicadores; a conta do autor vê o seu pedido novo |
| [02-meus-pedidos.png](02-meus-pedidos.png) | Pedido criado e filtros de título, estado e prioridade |
| [03-detalhe-com-comentario.png](03-detalhe-com-comentario.png) | Detalhe, autoria, comentário e histórico de estados |
| [04-area-tecnico.png](04-area-tecnico.png) | Pedido assumido, em análise e atribuído ao técnico |
| [05-categorias.png](05-categorias.png) | Administração do catálogo de categorias |

A ausência do pedido de A na sessão de B é verificada automaticamente tanto na interface e nos indicadores como numa consulta ao runtime. Uma imagem isolada não comprova esta restrição; a verificação está no script `scripts/ui-test.cjs` e no resultado JSON.
