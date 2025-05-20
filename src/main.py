from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os
import datetime
import jwt

# Importar db do novo arquivo
from src.models.db import db

app = Flask(__name__, static_folder='static')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///hortifruti.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'hortifruti-delivery-secret-key')

# Inicializar o db com o app
db.init_app(app)

# Configurar CORS
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Importar blueprints
from src.routes.user import user_bp
from src.routes.product import product_bp
from src.routes.category import category_bp
from src.routes.order import order_bp
from src.routes.order_item import order_item_bp

# Registrar blueprints
app.register_blueprint(user_bp)
app.register_blueprint(product_bp)
app.register_blueprint(category_bp)
app.register_blueprint(order_bp)
app.register_blueprint(order_item_bp)

# Rota para servir arquivos estáticos
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

# Rota de verificação de saúde da API
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'message': 'API Hortifruti Delivery funcionando!'
    }), 200

# Função para criar tabelas e dados iniciais
@app.before_first_request
def create_tables_and_initial_data():
    # Importar modelos
    from src.models.user import User
    from src.models.category import Category
    from src.models.product import Product
    from src.models.order import Order
    from src.models.order_item import OrderItem
    
    db.create_all()
    
    # Criar usuário admin se não existir
    if User.query.count() == 0:
        admin = User(
            name='Administrador',
            email='admin@hortifrutidelivery.com.br',
            password='admin123',  # Em produção, deve-se usar hash
            is_admin=True,
            created_at=datetime.datetime.now()
        )
        
        user = User(
            name='Cliente Teste',
            email='cliente@teste.com',
            password='cliente123',  # Em produção, deve-se usar hash
            is_admin=False,
            created_at=datetime.datetime.now()
        )
        
        db.session.add(admin)
        db.session.add(user)
        db.session.commit()
    
    # Criar categorias se não existirem
    if Category.query.count() == 0:
        categories = [
            Category(name='Frutas', description='Frutas frescas', image='/static/images/categories/frutas.jpg'),
            Category(name='Verduras', description='Verduras frescas', image='/static/images/categories/verduras.jpg'),
            Category(name='Legumes', description='Legumes frescos', image='/static/images/categories/legumes.jpg')
        ]
        
        db.session.add_all(categories)
        db.session.commit()
    
    # Criar produtos se não existirem
    if Product.query.count() == 0:
        products = [
            Product(name='Maçã', description='Maçã fresca', price=5.99, image='/static/images/products/maca.jpg', category_id=1, stock=100, unit='kg', featured=1),
            Product(name='Banana', description='Banana fresca', price=4.99, image='/static/images/products/banana.jpg', category_id=1, stock=100, unit='kg', featured=1),
            Product(name='Alface', description='Alface fresca', price=2.99, image='/static/images/products/alface.jpg', category_id=2, stock=50, unit='un', featured=0),
            Product(name='Cenoura', description='Cenoura fresca', price=3.99, image='/static/images/products/cenoura.jpg', category_id=3, stock=80, unit='kg', featured=1)
        ]
        
        db.session.add_all(products)
        db.session.commit()

# Middleware para verificar token JWT
def token_required(f):
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'error': 'Token não fornecido'}), 401
        
        try:
            payload = jwt.decode(
                token,
                app.config['SECRET_KEY'],
                algorithms=['HS256']
            )
            
            # Adicionar payload ao request para uso nas rotas
            request.user = payload
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expirado'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token inválido'}), 401
        
        return f(*args, **kwargs)
    
    decorated.__name__ = f.__name__
    return decorated

# Middleware para verificar se o usuário é admin
def admin_required(f):
    def decorated(*args, **kwargs):
        if not request.user.get('is_admin', False):
            return jsonify({'error': 'Acesso negado'}), 403
        
        return f(*args, **kwargs)
    
    decorated.__name__ = f.__name__
    return decorated

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
