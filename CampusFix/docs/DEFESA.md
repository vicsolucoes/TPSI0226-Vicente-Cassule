# Preparação da defesa

Guião de estudo com exemplos desta implementação. Os nomes indicados existem no projecto e podem ser abertos no Studio Pro durante a apresentação.

## Perguntas prováveis

1. **Que problema resolve?** Centraliza pedidos de suporte/manutenção e torna visíveis o responsável, o estado e o acompanhamento.
2. **Porque Administration.Account?** Reutiliza a autenticação e a gestão de contas do Mendix. Não cria um mecanismo próprio de palavras-passe. As contas são criadas em **Utilizadores e perfis** (`Administration.Account_Overview`), onde o administrador escolhe o perfil `Utilizador` ou `Tecnico`.
3. **Porque duas associações ao utilizador?** `Pedido_Criador` identifica o requerente; `Pedido_Tecnico` identifica quem o está a tratar. Uma pessoa pode ter funções diferentes em pedidos diferentes.
4. **Porque formulários não persistentes?** `FormularioPedido` só tem os campos editáveis (título, descrição, localização, prioridade e categoria). O cliente não tem escrita sobre `Pedido`; estado, datas, autor e técnico só mudam dentro dos microflows.
5. **Esconder botões chega?** Não. O Entity Access de `Pedido` para `CampusFix.Utilizador` tem a regra `[CampusFix.Pedido_Criador = '[%CurrentUser%]']`. Mesmo uma consulta da grelha administrativa enviada com a sessão de outro utilizador não devolve o pedido (teste automático). As ações `ACT_*` também confirmam perfil, autor, estado e versão no servidor.
6. **O que acontece ao concluir?** `SUB_Pedido_Concluir` confirma que o actor é o técnico atribuído, que o estado é Em análise ou Em tratamento e que a nota não está vazia. Cria o comentário `Resolução: …` e o histórico, e define `Estado = Resolvido` e `DataConclusao = [%CurrentDateTime%]`.
7. **Porque desativar categorias?** Eliminar poderia deixar pedidos antigos sem classificação. O combo do formulário usa `[Ativa = true]` e `SUB_Formulario_Validar` recusa uma categoria inativa num pedido novo, mesmo que o cliente a envie.
8. **Porque Actor nos SUB_*?** Separa a regra testável da sessão. O cliente só pode chamar `ACT_*` autorizados; estes obtêm o actor com `SUB_ActorActual` (`[%CurrentUser%]`). Os `SUB_*` não têm acesso de execução.
9. **Como se evitam números alheios no dashboard?** `DS_Resumo` tem `@applyentityaccess`: o retrieve só devolve pedidos que o perfil pode ler, antes de contar por estado.
10. **Que regra extra existe?** Cancelamento apenas pelo autor de um pedido aberto (`SUB_Pedido_Cancelar`), histórico de estados imutável e controlo de versão que recusa guardar um formulário desatualizado.
11. **Qual é a limitação da versão?** Deteta uma edição antiga, mas não garante atribuição atómica em vários servidores simultâneos. Essa evolução exigiria um mecanismo adicional.

## Onde mostrar cada decisão no Studio Pro

| Tema | Documento |
| --- | --- |
| Modelo e associações | Domain Model do módulo CampusFix |
| Estados e prioridades | Enumerações `Estado` e `Prioridade` |
| MF01 criar | `ACT_Pedido_Guardar` → `SUB_Pedido_Guardar` |
| MF02 assumir | `ACT_Pedido_Assumir` → `SUB_Pedido_Assumir` |
| MF03 concluir | `ACT_Pedido_Concluir` → `SUB_Pedido_Concluir` |
| MF04 comentar | `ACT_Comentario_Registar` → `SUB_Comentario_Registar` |
| Regra extra | `SUB_Pedido_Cancelar`, `SUB_Formulario_Validar` |
| Permissões | App Security → Module roles; Entity Access de `Pedido`, `Comentario` e `HistoricoEstado` |
| Navegação | Navigation → Responsive (os itens sem permissão desaparecem por perfil) |

## Percurso de demonstração (cerca de 8 minutos)

Preparar antes: aplicação a correr, uma janela normal e uma janela privada do navegador para ter duas sessões em simultâneo.

1. **Administrador** (`MxAdmin`): mostrar o menu (Painel inicial, Todos os pedidos, Categorias, Utilizadores e perfis). Em Categorias, criar *Informática* e *Mobiliário*; editar a descrição de *Informática*; desmarcar *Disponível para novos pedidos* em *Mobiliário*. Em Utilizadores e perfis, criar `cf_aluno_a` e `cf_aluno_b` (perfil Utilizador) e `cf_tecnico` (perfil Tecnico).
2. **Utilizador A**: o menu só tem Painel inicial, Os meus pedidos e Novo pedido. Criar *Computador da sala 12 não liga*; mostrar que *Mobiliário* não aparece no combo. No detalhe, apontar estado Novo, prioridade, categoria, autor e data automáticos. Acrescentar um comentário.
3. **Utilizador B** (janela privada): painel com 0 novos pedidos e lista vazia. Escrever `/p/categorias` na barra de endereço: a página não abre.
4. **Técnico**: Área do técnico → Assumir. Mostrar `Em análise` e o técnico na grelha. Abrir → Iniciar tratamento → Concluir pedido com nota.
5. **Utilizador A**: abrir o pedido Resolvido. Mostrar a data de conclusão, o comentário do aluno e a nota do técnico com os autores, e que Editar, Comentar e Cancelar já não aparecem.
6. **Filtros**: em Os meus pedidos, pesquisar por título e filtrar por estado Resolvido.
7. **Studio Pro**: abrir `SUB_Pedido_Concluir` e a regra XPath de `Pedido` para explicar que a restrição está no servidor.

Antes da apresentação, ensaiar este percurso e responder em voz alta às perguntas acima sem ler as respostas.
