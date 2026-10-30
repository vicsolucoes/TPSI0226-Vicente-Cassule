# Preparação da defesa

1. **Que problema resolve?** Centraliza pedidos de suporte/manutenção e torna visíveis o responsável, o estado e o acompanhamento.
2. **Porque Administration.Account?** Reutiliza a autenticação e a gestão de contas do Mendix. Não cria um mecanismo próprio de palavras-passe.
3. **Porque duas associações ao utilizador?** Pedido_Criador identifica o requerente; Pedido_Tecnico identifica quem o está a tratar. Uma pessoa pode ter funções diferentes em pedidos diferentes.
4. **Porque formulários não persistentes?** Para permitir editar título/descrição/categoria/prioridade sem dar ao cliente escrita sobre estado, datas ou identidades do pedido persistido.
5. **Esconder botões chega?** Não. Entity Access restringe os dados; as ações públicas validam também perfil, autor, estado e versão no servidor.
6. **O que acontece ao concluir?** Confirma técnico responsável e estado em análise/tratamento, exige uma nota, cria comentário e histórico, e define Resolvido com DataConclusao.
7. **Porque desativar categorias?** Uma eliminação poderia perder a classificação dos pedidos antigos. Novos pedidos só podem escolher categorias ativas.
8. **Porque Actor nos SUB_*?** Para separar a regra testável da sessão. O cliente só pode chamar ACT_* autorizados; esses obtêm Actor da sessão. Os SUB_* não têm acesso público.
9. **Como se evitam números alheios no dashboard?** DS_Resumo aplica Entity Access antes de contar os pedidos por estado.
10. **Qual é a limitação da versão?** Deteta uma edição antiga, mas não garante atribuição atómica em vários servidores simultâneos. Essa evolução exigiria um mecanismo adicional.

Demonstração sugerida: administrador cria categoria e contas → utilizador A regista pedido → B confirma que não o vê → técnico assume, trata e conclui → A consulta a resolução e confirma que já não pode editar.
