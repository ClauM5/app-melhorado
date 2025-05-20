# Instruções de Deploy - Hortifruti Delivery

Este documento contém instruções detalhadas para instalar e configurar o aplicativo Hortifruti Delivery, um sistema completo de delivery para hortifruti com funcionalidades PWA e painel administrativo.

## Requisitos do Sistema

- Python 3.8 ou superior
- Pip (gerenciador de pacotes Python)
- Navegador web moderno (Chrome, Firefox, Edge, Safari)

## Estrutura do Projeto

```
hortifruti_delivery/
├── src/                    # Código-fonte do aplicativo
│   ├── models/             # Modelos de dados
│   ├── routes/             # Rotas da API
│   ├── static/             # Arquivos estáticos (CSS, JS, imagens)
│   │   ├── css/            # Estilos CSS
│   │   ├── js/             # Scripts JavaScript
│   │   ├── images/         # Imagens
│   │   ├── admin/          # Painel administrativo
│   │   ├── manifest.json   # Configuração PWA
│   ├── main.py             # Ponto de entrada da aplicação
├── requirements.txt        # Dependências do projeto
```

## Passos para Instalação

1. **Extraia o arquivo zip** em um diretório de sua escolha

2. **Crie um ambiente virtual Python**:
   ```bash
   python -m venv venv
   ```

3. **Ative o ambiente virtual**:
   - No Windows:
     ```bash
     venv\Scripts\activate
     ```
   - No Linux/Mac:
     ```bash
     source venv/bin/activate
     ```

4. **Instale as dependências**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Execute a aplicação**:
   ```bash
   cd src
   python main.py
   ```

6. **Acesse a aplicação**:
   - Cliente: http://localhost:5000
   - Painel Admin: http://localhost:5000/static/admin/index.html

## Credenciais de Acesso

### Painel Administrativo
- **Email**: admin@hortifrutidelivery.com.br
- **Senha**: admin123

### Cliente de Teste
- **Email**: cliente@teste.com
- **Senha**: cliente123

## Configuração para Produção

Para deploy em ambiente de produção, recomendamos:

1. **Configurar um servidor web** (Nginx, Apache) como proxy reverso

2. **Usar Gunicorn como servidor WSGI**:
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 src.main:app
   ```

3. **Configurar um banco de dados** mais robusto como MySQL ou PostgreSQL:
   - Descomente e configure a linha `SQLALCHEMY_DATABASE_URI` no arquivo `src/main.py`
   - Instale o driver correspondente (pymysql para MySQL)

4. **Configurar variáveis de ambiente** para senhas e chaves secretas

## Funcionalidades Principais

### Cliente (PWA)
- Catálogo de produtos por categoria
- Carrinho de compras
- Sistema de pedidos
- Autenticação de usuários
- Histórico de pedidos
- Instalação como aplicativo (PWA)

### Painel Administrativo
- Gerenciamento de produtos e categorias
- Visualização e gerenciamento de pedidos
- Relatórios de vendas
- Configurações da loja

## Personalização

Para personalizar o aplicativo para seu negócio:

1. **Altere o logo e cores**: 
   - Substitua as imagens em `src/static/images/`
   - Modifique os estilos em `src/static/css/styles.css`

2. **Atualize as informações da loja**:
   - Edite os dados em `src/main.py` na função `get_settings()`

3. **Personalize o manifesto PWA**:
   - Edite o arquivo `src/static/manifest.json`

## Suporte

Para dúvidas ou problemas, entre em contato através do email: suporte@hortifrutidelivery.com.br
