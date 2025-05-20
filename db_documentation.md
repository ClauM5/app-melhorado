# Documentação do Banco de Dados SQLite

## Visão Geral
O aplicativo Hortifruti Delivery utiliza SQLite como banco de dados, uma solução leve, simples e fácil de usar que não requer configuração de servidor separado. O SQLite armazena todo o banco de dados em um único arquivo, tornando-o ideal para aplicações que precisam de portabilidade e simplicidade.

## Estrutura do Banco de Dados
O banco de dados contém as seguintes tabelas:

1. **Users** - Armazena informações dos usuários
2. **Categories** - Categorias de produtos (Frutas, Verduras, etc.)
3. **Products** - Produtos disponíveis para venda
4. **Orders** - Pedidos realizados pelos clientes
5. **Order_Items** - Itens incluídos em cada pedido

## Localização do Arquivo de Banco de Dados
O arquivo SQLite é armazenado em:
```
/instance/hortifruti.db
```

## Como Acessar e Gerenciar o Banco de Dados

### Usando o Painel Administrativo
A maneira mais fácil de gerenciar os dados é através do painel administrativo do aplicativo:

1. Faça login com credenciais de administrador
2. Acesse as seções de Produtos, Categorias, Pedidos ou Clientes
3. Use as interfaces para adicionar, editar ou remover registros

### Usando SQLite CLI (para usuários avançados)
Se precisar acessar diretamente o banco de dados:

1. Conecte-se ao servidor onde o aplicativo está hospedado
2. Use o comando SQLite para abrir o banco de dados:
   ```
   sqlite3 instance/hortifruti.db
   ```
3. Execute comandos SQL para consultar ou modificar dados:
   ```sql
   -- Listar todas as tabelas
   .tables
   
   -- Ver estrutura de uma tabela
   .schema products
   
   -- Consultar produtos
   SELECT * FROM products;
   
   -- Adicionar novo produto
   INSERT INTO products (name, description, price, image, category_id, stock, unit, featured) 
   VALUES ('Nome', 'Descrição', 10.99, '/caminho/imagem.jpg', 1, 100, 'kg', 1);
   ```

## Backup do Banco de Dados
Para fazer backup do banco de dados:

1. Localize o arquivo `hortifruti.db` na pasta `instance`
2. Copie este arquivo para um local seguro
3. Para restaurar, substitua o arquivo existente pelo backup

## Integração com o Render
O aplicativo está configurado para funcionar no Render sem configurações adicionais:

1. O SQLite é inicializado automaticamente na primeira execução
2. Dados iniciais (admin, categorias, produtos) são criados automaticamente
3. O Render mantém o arquivo de banco de dados entre deploys

## Considerações Importantes
- O SQLite funciona bem para aplicações com volume moderado de acessos
- Para escalar para muitos usuários simultâneos, considere migrar para PostgreSQL
- Faça backups regulares do arquivo de banco de dados

## Solução de Problemas
Se encontrar problemas com o banco de dados:

1. Verifique se o arquivo `hortifruti.db` existe na pasta `instance`
2. Reinicie o aplicativo para recriar o banco de dados se necessário
3. Verifique os logs do aplicativo para mensagens de erro relacionadas ao banco de dados
