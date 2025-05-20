from flask import Blueprint, jsonify, request
from src.models.category import Category
from src.models.db import db

category_bp = Blueprint('category_bp', __name__)

@category_bp.route('/api/categories', methods=['GET'])
def get_categories():
    categories = Category.query.all()
    return jsonify({'categories': [category.to_dict() for category in categories]}), 200

@category_bp.route('/api/categories/<int:category_id>', methods=['GET'])
def get_category(category_id):
    category = Category.query.get(category_id)
    
    if not category:
        return jsonify({'error': 'Categoria não encontrada'}), 404
    
    return jsonify({'category': category.to_dict()}), 200

@category_bp.route('/api/categories', methods=['POST'])
def create_category():
    # Aqui deveria ter autenticação JWT para admin
    data = request.get_json()
    
    if not data or not data.get('name'):
        return jsonify({'error': 'Dados incompletos'}), 400
    
    category = Category(
        name=data['name'],
        description=data.get('description', ''),
        image=data.get('image', '')
    )
    
    db.session.add(category)
    db.session.commit()
    
    return jsonify({'message': 'Categoria criada com sucesso', 'category': category.to_dict()}), 201

@category_bp.route('/api/categories/<int:category_id>', methods=['PUT'])
def update_category(category_id):
    # Aqui deveria ter autenticação JWT para admin
    category = Category.query.get(category_id)
    
    if not category:
        return jsonify({'error': 'Categoria não encontrada'}), 404
    
    data = request.get_json()
    
    if data.get('name'):
        category.name = data['name']
    
    if data.get('description') is not None:
        category.description = data['description']
    
    if data.get('image') is not None:
        category.image = data['image']
    
    db.session.commit()
    
    return jsonify({'message': 'Categoria atualizada com sucesso', 'category': category.to_dict()}), 200

@category_bp.route('/api/categories/<int:category_id>', methods=['DELETE'])
def delete_category(category_id):
    # Aqui deveria ter autenticação JWT para admin
    category = Category.query.get(category_id)
    
    if not category:
        return jsonify({'error': 'Categoria não encontrada'}), 404
    
    # Verificar se há produtos associados
    if category.products and len(category.products) > 0:
        return jsonify({'error': 'Não é possível excluir uma categoria com produtos associados'}), 400
    
    db.session.delete(category)
    db.session.commit()
    
    return jsonify({'message': 'Categoria excluída com sucesso'}), 200
