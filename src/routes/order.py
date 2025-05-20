from flask import Blueprint, jsonify, request
from src.models.order import Order
from src.models.order_item import OrderItem
from src.models.product import Product
from src.models.user import User
from src.models.db import db
import datetime
import jwt
import os

order_bp = Blueprint('order_bp', __name__)

@order_bp.route('/api/orders', methods=['GET'])
def get_orders():
    # Aqui deveria ter autenticação JWT
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Token não fornecido'}), 401
    
    token = auth_header.split(' ')[1]
    
    try:
        payload = jwt.decode(
            token,
            os.environ.get('SECRET_KEY', 'hortifruti-delivery-secret-key'),
            algorithms=['HS256']
        )
        user_id = payload['user_id']
        is_admin = payload.get('is_admin', False)
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expirado'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Token inválido'}), 401
    
    if is_admin:
        # Administradores podem ver todos os pedidos
        orders = Order.query.all()
    else:
        # Usuários comuns só podem ver seus próprios pedidos
        orders = Order.query.filter_by(user_id=user_id).all()
    
    return jsonify({'orders': [order.to_dict() for order in orders]}), 200

@order_bp.route('/api/orders/<int:order_id>', methods=['GET'])
def get_order(order_id):
    # Aqui deveria ter autenticação JWT
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Token não fornecido'}), 401
    
    token = auth_header.split(' ')[1]
    
    try:
        payload = jwt.decode(
            token,
            os.environ.get('SECRET_KEY', 'hortifruti-delivery-secret-key'),
            algorithms=['HS256']
        )
        user_id = payload['user_id']
        is_admin = payload.get('is_admin', False)
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expirado'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Token inválido'}), 401
    
    order = Order.query.get(order_id)
    
    if not order:
        return jsonify({'error': 'Pedido não encontrado'}), 404
    
    # Verificar se o usuário tem permissão para ver este pedido
    if not is_admin and order.user_id != user_id:
        return jsonify({'error': 'Acesso negado'}), 403
    
    return jsonify({'order': order.to_dict()}), 200

@order_bp.route('/api/orders', methods=['POST'])
def create_order():
    # Aqui deveria ter autenticação JWT
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Token não fornecido'}), 401
    
    token = auth_header.split(' ')[1]
    
    try:
        payload = jwt.decode(
            token,
            os.environ.get('SECRET_KEY', 'hortifruti-delivery-secret-key'),
            algorithms=['HS256']
        )
        user_id = payload['user_id']
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expirado'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Token inválido'}), 401
    
    data = request.get_json()
    
    if not data or not data.get('items') or not data.get('address') or not data.get('payment_method'):
        return jsonify({'error': 'Dados incompletos'}), 400
    
    # Verificar se o usuário existe
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Usuário não encontrado'}), 404
    
    # Calcular o total do pedido
    total = 0
    items_data = []
    
    for item in data['items']:
        if not item.get('product_id') or not item.get('quantity'):
            return jsonify({'error': 'Dados de item incompletos'}), 400
        
        product = Product.query.get(item['product_id'])
        if not product:
            return jsonify({'error': f'Produto {item["product_id"]} não encontrado'}), 404
        
        # Verificar estoque
        if product.stock < item['quantity']:
            return jsonify({'error': f'Estoque insuficiente para o produto {product.name}'}), 400
        
        subtotal = product.price * item['quantity']
        total += subtotal
        
        items_data.append({
            'product_id': product.id,
            'quantity': item['quantity'],
            'price': product.price
        })
        
        # Atualizar estoque
        product.stock -= item['quantity']
    
    # Criar o pedido
    order = Order(
        user_id=user_id,
        status='pending',
        total=total,
        address=data['address'],
        payment_method=data['payment_method'],
        created_at=datetime.datetime.now()
    )
    
    db.session.add(order)
    db.session.flush()  # Para obter o ID do pedido
    
    # Criar os itens do pedido
    for item_data in items_data:
        order_item = OrderItem(
            order_id=order.id,
            product_id=item_data['product_id'],
            quantity=item_data['quantity'],
            price=item_data['price']
        )
        db.session.add(order_item)
    
    db.session.commit()
    
    return jsonify({'message': 'Pedido criado com sucesso', 'order': order.to_dict()}), 201

@order_bp.route('/api/orders/<int:order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    # Aqui deveria ter autenticação JWT para admin
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Token não fornecido'}), 401
    
    token = auth_header.split(' ')[1]
    
    try:
        payload = jwt.decode(
            token,
            os.environ.get('SECRET_KEY', 'hortifruti-delivery-secret-key'),
            algorithms=['HS256']
        )
        is_admin = payload.get('is_admin', False)
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expirado'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Token inválido'}), 401
    
    if not is_admin:
        return jsonify({'error': 'Acesso negado'}), 403
    
    order = Order.query.get(order_id)
    
    if not order:
        return jsonify({'error': 'Pedido não encontrado'}), 404
    
    data = request.get_json()
    
    if not data or not data.get('status'):
        return jsonify({'error': 'Status não fornecido'}), 400
    
    valid_statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
    if data['status'] not in valid_statuses:
        return jsonify({'error': 'Status inválido'}), 400
    
    order.status = data['status']
    db.session.commit()
    
    return jsonify({'message': 'Status do pedido atualizado com sucesso', 'order': order.to_dict()}), 200
