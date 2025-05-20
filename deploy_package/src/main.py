from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import sys
import jwt
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash

# Configuração do caminho para importações
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Inicialização da aplicação Flask
app = Flask(__name__, static_url_path='/static', static_folder='static')
CORS(app)

# Configuração do banco de dados
app.config['SECRET_KEY'] = 'hortifruti-delivery-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///hortifruti.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Importação dos modelos e inicialização do banco de dados
from src.models.user import User, db
from src.models.product import Product, Category
from src.models.order import Order, OrderItem

# Inicialização do banco de dados
db.init_app(app)

# Importação das rotas
from src.routes.user import user_bp
from src.routes.product import product_bp
from src.routes.order import order_bp

# Registro dos blueprints
app.register_blueprint(user_bp, url_prefix='/api/users')
app.register_blueprint(product_bp, url_prefix='/api/products')
app.register_blueprint(order_bp, url_prefix='/api/orders')

# Rota para verificar se a API está funcionando
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': 'API Hortifruti Delivery funcionando!'}), 200

# Rota para configurações da loja
@app.route('/api/settings', methods=['GET'])
def get_settings():
    # Configurações da loja (simuladas)
    settings = {
        'store_name': 'Hortifruti Delivery',
        'store_email': 'contato@hortifrutidelivery.com.br',
        'store_phone': '(11) 99999-9999',
        'store_address': 'Rua das Hortaliças, 123',
        'store_open_time': '08:00',
        'store_close_time': '20:00',
        'delivery_fee': 5.99,
        'min_order': 20.00,
        'payment_methods': ['money', 'credit', 'debit', 'pix'],
        'pix_key': 'contato@hortifrutidelivery.com.br',
        'notifications': {
            'new_order': True,
            'low_stock': True,
            'customer_message': True
        }
    }
    
    return jsonify(settings), 200

# Inicialização do banco de dados e criação de dados iniciais
@app.before_first_request
def create_tables_and_initial_data():
    db.create_all()
    
    # Verificar se já existem dados
    if User.query.count() == 0:
        # Criar usuário administrador
        admin = User(
            name='Administrador',
            email='admin@hortifrutidelivery.com.br',
            password=generate_password_hash('admin123'),
            role='admin'
        )
        
        # Criar usuário cliente de teste
        customer = User(
            name='Cliente Teste',
            email='cliente@teste.com',
            password=generate_password_hash('cliente123'),
            role='customer'
        )
        
        db.session.add(admin)
        db.session.add(customer)
        
        # Criar categorias
        categories = [
            Category(name='Frutas', description='Frutas frescas e selecionadas', image='/static/images/frutas.jpg'),
            Category(name='Verduras', description='Verduras frescas e selecionadas', image='/static/images/verduras.jpg'),
            Category(name='Legumes', description='Legumes frescos e selecionados', image='/static/images/legumes.jpg'),
            Category(name='Orgânicos', description='Produtos orgânicos certificados', image='/static/images/organicos.jpg')
        ]
        
        for category in categories:
            db.session.add(category)
        
        db.session.commit()
        
        # Criar produtos
        products = [
            Product(
                name='Maçã Gala',
                description='Maçã fresca e suculenta',
                price=5.99,
                unit='kg',
                image='/static/images/apple.jpg',
                category_id=1,
                stock=20,
                organic=False,
                featured=True,
                active=True
            ),
            Product(
                name='Banana Prata',
                description='Banana madura e doce',
                price=4.50,
                unit='kg',
                image='/static/images/banana.jpg',
                category_id=1,
                stock=30,
                organic=False,
                featured=True,
                active=True,
                discount=10
            ),
            Product(
                name='Alface Crespa',
                description='Alface fresca e crocante',
                price=2.99,
                unit='unid',
                image='/static/images/lettuce.jpg',
                category_id=2,
                stock=15,
                organic=True,
                featured=False,
                active=True
            ),
            Product(
                name='Tomate Italiano',
                description='Tomate maduro e suculento',
                price=6.99,
                unit='kg',
                image='/static/images/tomato.jpg',
                category_id=3,
                stock=25,
                organic=False,
                featured=True,
                active=True
            ),
            Product(
                name='Cenoura',
                description='Cenoura fresca e crocante',
                price=3.99,
                unit='kg',
                image='/static/images/carrot.jpg',
                category_id=3,
                stock=18,
                organic=True,
                featured=False,
                active=True,
                discount=15
            ),
            Product(
                name='Morango',
                description='Morango doce e suculento',
                price=8.99,
                unit='bandeja',
                image='/static/images/strawberry.jpg',
                category_id=1,
                stock=12,
                organic=True,
                featured=True,
                active=True
            ),
            Product(
                name='Brócolis',
                description='Brócolis fresco e nutritivo',
                price=5.50,
                unit='unid',
                image='/static/images/broccoli.jpg',
                category_id=2,
                stock=10,
                organic=False,
                featured=False,
                active=True
            ),
            Product(
                name='Abacate',
                description='Abacate maduro e cremoso',
                price=7.99,
                unit='unid',
                image='/static/images/avocado.jpg',
                category_id=1,
                stock=8,
                organic=False,
                featured=True,
                active=True,
                discount=20
            )
        ]
        
        for product in products:
            db.session.add(product)
        
        db.session.commit()
        
        # Criar pedidos de exemplo
        order1 = Order(
            customer_id=2,
            customer_name='Cliente Teste',
            customer_email='cliente@teste.com',
            customer_phone='(11) 98765-4321',
            delivery_address={
                'address': 'Rua das Flores',
                'number': '123',
                'complement': 'Apto 101',
                'neighborhood': 'Jardim Primavera',
                'city': 'São Paulo'
            },
            payment={
                'method': 'credit',
                'change': None
            },
            notes='Entregar no período da tarde.',
            subtotal=24.97,
            delivery_fee=5.99,
            total=30.96,
            status='delivered',
            created_at=datetime.utcnow() - timedelta(days=2)
        )
        
        order1_item1 = OrderItem(
            product_id=1,
            product_name='Maçã Gala',
            price=5.99,
            quantity=2
        )
        
        order1_item2 = OrderItem(
            product_id=2,
            product_name='Banana Prata',
            price=4.50,
            quantity=1.5
        )
        
        order1_item3 = OrderItem(
            product_id=4,
            product_name='Tomate Italiano',
            price=6.99,
            quantity=1
        )
        
        order1.items.append(order1_item1)
        order1.items.append(order1_item2)
        order1.items.append(order1_item3)
        
        order2 = Order(
            customer_id=2,
            customer_name='Cliente Teste',
            customer_email='cliente@teste.com',
            customer_phone='(11) 98765-4321',
            delivery_address={
                'address': 'Rua das Flores',
                'number': '123',
                'complement': 'Apto 101',
                'neighborhood': 'Jardim Primavera',
                'city': 'São Paulo'
            },
            payment={
                'method': 'pix',
                'change': None
            },
            notes='',
            subtotal=15.47,
            delivery_fee=5.99,
            total=21.46,
            status='pending',
            created_at=datetime.utcnow()
        )
        
        order2_item1 = OrderItem(
            product_id=3,
            product_name='Alface Crespa',
            price=2.99,
            quantity=2
        )
        
        order2_item2 = OrderItem(
            product_id=5,
            product_name='Cenoura',
            price=3.99,
            quantity=1
        )
        
        order2_item3 = OrderItem(
            product_id=7,
            product_name='Brócolis',
            price=5.50,
            quantity=1
        )
        
        order2.items.append(order2_item1)
        order2.items.append(order2_item2)
        order2.items.append(order2_item3)
        
        db.session.add(order1)
        db.session.add(order2)
        
        db.session.commit()

# Rota para servir o aplicativo PWA
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_pwa(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return app.send_static_file(path)
    return app.send_static_file('index.html')

# Inicialização da aplicação
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
