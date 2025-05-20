from flask import Blueprint, jsonify, request
from src.models.order_item import OrderItem
from src.models.db import db

order_item_bp = Blueprint('order_item_bp', __name__)

@order_item_bp.route('/api/order-items/<int:order_id>', methods=['GET'])
def get_order_items(order_id):
    # Esta rota seria normalmente protegida por autenticação
    order_items = OrderItem.query.filter_by(order_id=order_id).all()
    return jsonify({'order_items': [item.to_dict() for item in order_items]}), 200

@order_item_bp.route('/api/order-items/<int:item_id>', methods=['PUT'])
def update_order_item(item_id):
    # Esta rota seria normalmente protegida por autenticação de admin
    order_item = OrderItem.query.get(item_id)
    
    if not order_item:
        return jsonify({'error': 'Item de pedido não encontrado'}), 404
    
    data = request.get_json()
    
    if data.get('quantity') is not None:
        order_item.quantity = data['quantity']
    
    if data.get('price') is not None:
        order_item.price = data['price']
    
    db.session.commit()
    
    return jsonify({'message': 'Item de pedido atualizado com sucesso', 'order_item': order_item.to_dict()}), 200

@order_item_bp.route('/api/order-items/<int:item_id>', methods=['DELETE'])
def delete_order_item(item_id):
    # Esta rota seria normalmente protegida por autenticação de admin
    order_item = OrderItem.query.get(item_id)
    
    if not order_item:
        return jsonify({'error': 'Item de pedido não encontrado'}), 404
    
    db.session.delete(order_item)
    db.session.commit()
    
    return jsonify({'message': 'Item de pedido excluído com sucesso'}), 200
