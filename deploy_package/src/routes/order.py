from flask import Blueprint, jsonify, request, current_app
from src.models.order import Order, OrderItem, db
import jwt
import datetime
from sqlalchemy import desc

order_bp = Blueprint('order', __name__)

# Função auxiliar para verificar token
def verify_token(admin_required=False):
    token = request.headers.get('Authorization')
    if not token:
        return None, {'message': 'Token não fornecido!'}, 401
    
    try:
        token = token.split(' ')[1]
        data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        
        if admin_required and data.get('role') != 'admin':
            return None, {'message': 'Acesso não autorizado!'}, 403
        
        return data, None, None
    except:
        return None, {'message': 'Token inválido!'}, 401

# Rotas para pedidos
@order_bp.route('/', methods=['GET'])
def get_orders():
    # Verificar token
    data, error, code = verify_token(admin_required=True)
    if error:
        return jsonify(error), code
    
    # Parâmetros de filtro
    status = request.args.get('status')
    customer_id = request.args.get('customer_id')
    
    query = Order.query.order_by(desc(Order.created_at))
    
    if status:
        query = query.filter_by(status=status)
    
    if customer_id:
        query = query.filter_by(customer_id=customer_id)
    
    orders = query.all()
    
    result = []
    for order in orders:
        order_data = {
            'id': order.id,
            'customer_id': order.customer_id,
            'customer_name': order.customer_name,
            'customer_email': order.customer_email,
            'customer_phone': order.customer_phone,
            'delivery_address': order.delivery_address,
            'payment': order.payment,
            'notes': order.notes,
            'subtotal': order.subtotal,
            'delivery_fee': order.delivery_fee,
            'total': order.total,
            'status': order.status,
            'created_at': order.created_at.isoformat(),
            'items': []
        }
        
        # Adicionar itens do pedido
        for item in order.items:
            order_data['items'].append({
                'id': item.id,
                'product_id': item.product_id,
                'product_name': item.product_name,
                'price': item.price,
                'quantity': item.quantity
            })
        
        result.append(order_data)
    
    return jsonify(result), 200

@order_bp.route('/customer', methods=['GET'])
def get_customer_orders():
    # Verificar token
    data, error, code = verify_token()
    if error:
        return jsonify(error), code
    
    # Obter pedidos do cliente
    customer_id = data['user_id']
    orders = Order.query.filter_by(customer_id=customer_id).order_by(desc(Order.created_at)).all()
    
    result = []
    for order in orders:
        order_data = {
            'id': order.id,
            'delivery_address': order.delivery_address,
            'payment': order.payment,
            'subtotal': order.subtotal,
            'delivery_fee': order.delivery_fee,
            'total': order.total,
            'status': order.status,
            'created_at': order.created_at.isoformat(),
            'items': []
        }
        
        # Adicionar itens do pedido
        for item in order.items:
            order_data['items'].append({
                'product_id': item.product_id,
                'product_name': item.product_name,
                'price': item.price,
                'quantity': item.quantity
            })
        
        result.append(order_data)
    
    return jsonify(result), 200

@order_bp.route('/<int:order_id>', methods=['GET'])
def get_order(order_id):
    # Verificar token
    data, error, code = verify_token()
    if error:
        return jsonify(error), code
    
    # Obter pedido
    order = Order.query.get_or_404(order_id)
    
    # Verificar se o usuário tem permissão para acessar este pedido
    if data.get('role') != 'admin' and order.customer_id != data['user_id']:
        return jsonify({'message': 'Acesso não autorizado!'}), 403
    
    # Montar resposta
    order_data = {
        'id': order.id,
        'customer_id': order.customer_id,
        'customer_name': order.customer_name,
        'customer_email': order.customer_email,
        'customer_phone': order.customer_phone,
        'delivery_address': order.delivery_address,
        'payment': order.payment,
        'notes': order.notes,
        'subtotal': order.subtotal,
        'delivery_fee': order.delivery_fee,
        'total': order.total,
        'status': order.status,
        'created_at': order.created_at.isoformat(),
        'items': []
    }
    
    # Adicionar itens do pedido
    for item in order.items:
        order_data['items'].append({
            'id': item.id,
            'product_id': item.product_id,
            'product_name': item.product_name,
            'price': item.price,
            'quantity': item.quantity
        })
    
    return jsonify(order_data), 200

@order_bp.route('/', methods=['POST'])
def create_order():
    # Verificar token
    data, error, code = verify_token()
    if error:
        return jsonify(error), code
    
    # Obter dados do pedido
    order_data = request.get_json()
    
    # Criar novo pedido
    new_order = Order(
        customer_id=data['user_id'],
        customer_name=order_data['customer_name'],
        customer_email=order_data['customer_email'],
        customer_phone=order_data.get('customer_phone', ''),
        delivery_address=order_data['delivery_address'],
        payment=order_data['payment'],
        notes=order_data.get('notes', ''),
        subtotal=order_data['subtotal'],
        delivery_fee=order_data['delivery_fee'],
        total=order_data['total'],
        status='pending'
    )
    
    # Adicionar itens do pedido
    for item_data in order_data['items']:
        item = OrderItem(
            product_id=item_data['product_id'],
            product_name=item_data['product_name'],
            price=item_data['price'],
            quantity=item_data['quantity']
        )
        new_order.items.append(item)
    
    db.session.add(new_order)
    db.session.commit()
    
    return jsonify({
        'id': new_order.id,
        'message': 'Pedido criado com sucesso!'
    }), 201

@order_bp.route('/<int:order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    # Verificar token
    data, error, code = verify_token(admin_required=True)
    if error:
        return jsonify(error), code
    
    # Obter pedido
    order = Order.query.get_or_404(order_id)
    
    # Obter novo status
    status_data = request.get_json()
    new_status = status_data['status']
    
    # Validar status
    valid_statuses = ['pending', 'processing', 'shipping', 'delivered', 'cancelled']
    if new_status not in valid_statuses:
        return jsonify({'message': 'Status inválido!'}), 400
    
    # Atualizar status
    order.status = new_status
    db.session.commit()
    
    return jsonify({
        'id': order.id,
        'status': order.status,
        'message': 'Status do pedido atualizado com sucesso!'
    }), 200

@order_bp.route('/<int:order_id>/cancel', methods=['PUT'])
def cancel_order(order_id):
    # Verificar token
    data, error, code = verify_token()
    if error:
        return jsonify(error), code
    
    # Obter pedido
    order = Order.query.get_or_404(order_id)
    
    # Verificar se o usuário tem permissão para cancelar este pedido
    if data.get('role') != 'admin' and order.customer_id != data['user_id']:
        return jsonify({'message': 'Acesso não autorizado!'}), 403
    
    # Verificar se o pedido pode ser cancelado
    if order.status == 'delivered' or order.status == 'cancelled':
        return jsonify({'message': 'Este pedido não pode ser cancelado!'}), 400
    
    # Cancelar pedido
    order.status = 'cancelled'
    db.session.commit()
    
    return jsonify({
        'id': order.id,
        'status': order.status,
        'message': 'Pedido cancelado com sucesso!'
    }), 200

@order_bp.route('/count/today', methods=['GET'])
def get_today_orders_count():
    # Verificar token
    data, error, code = verify_token(admin_required=True)
    if error:
        return jsonify(error), code
    
    # Obter data de hoje
    today = datetime.datetime.utcnow().date()
    
    # Contar pedidos de hoje
    count = Order.query.filter(
        db.func.date(Order.created_at) == today
    ).count()
    
    return jsonify({'count': count}), 200

@order_bp.route('/sales/today', methods=['GET'])
def get_today_sales():
    # Verificar token
    data, error, code = verify_token(admin_required=True)
    if error:
        return jsonify(error), code
    
    # Obter data de hoje
    today = datetime.datetime.utcnow().date()
    
    # Calcular vendas de hoje
    result = db.session.query(db.func.sum(Order.total)).filter(
        db.func.date(Order.created_at) == today
    ).scalar()
    
    total = result if result else 0
    
    return jsonify({'total': total}), 200

@order_bp.route('/recent', methods=['GET'])
def get_recent_orders():
    # Verificar token
    data, error, code = verify_token(admin_required=True)
    if error:
        return jsonify(error), code
    
    # Obter pedidos recentes
    orders = Order.query.order_by(desc(Order.created_at)).limit(5).all()
    
    result = []
    for order in orders:
        result.append({
            'id': order.id,
            'customer_name': order.customer_name,
            'total': order.total,
            'status': order.status,
            'created_at': order.created_at.isoformat()
        })
    
    return jsonify(result), 200
