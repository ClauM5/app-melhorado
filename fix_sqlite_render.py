# Salve como fix_sqlite_render.py na pasta raiz do projeto

import os

def get_database_path():
    """Retorna o caminho correto para o banco de dados SQLite no Render"""
    
    # Verifica se estamos no ambiente Render
    if os.environ.get('RENDER'):
        # No Render, use a pasta tmp que tem permissão de escrita
        db_path = "/tmp/hortifruti.db"
    else:
        # Localmente, use o caminho padrão
        db_path = "instance/hortifruti.db"
    
    # Certifique-se de que o diretório existe
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    return f"sqlite:///{db_path}"
