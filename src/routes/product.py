from flask import Blueprint, jsonify, request
from src.models.product import Product
from src.models.category import Category
from src.models.db import db
import datetime
import os

product_bp = Blueprint('product_bp', __name__)

@product_bp.route('/api/products', methods=['GET'])
def get_products():
    category_id = request.args.get('category_id')
    search = request.args.get('search')
    featured = request.args.get('featured')
    
    query = Product.query
    
    if category_id:
        query = query.filter_by(category_id=category_id)
    
    if search:
        query = query.filter(Product.name.ilike(f'%{search}%'))
    
    if featured:
        query = query.filter_by(featured=1)
    
    products = query.all()
    
    return jsonify({'products': [product.to_dict() for product in products]}), 200

@product_bp.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    product = Product.query.get(product_id)
    
    if not product:
        return jsonify({'error': 'Produto não encontrado'}), 404
    
    return jsonify({'product': product.to_dict()}), 200

@product_bp.route('/api/products', methods=['POST'])
def create_product():
    # Aqui deveria ter autenticação JWT para admin
    data = request.get_json()
    
    if not data or not data.get('name') or not data.get('price') or not data.get('category_id'):
        return jsonify({'error': 'Dados incompletos'}), 400
    
    # Verificar se a categoria existe
    category = Category.query.get(data['category_id'])
    if not category:
        return jsonify({'error': 'Categoria não encontrada'}), 404
    
    product = Product(
        name=data['name'],
        description=data.get('description', ''),
        price=data['price'],
        image=data.get('image', ''),
        category_id=data['category_id'],
        stock=data.get('stock', 0),
        unit=data.get('unit', 'un'),
        featured=data.get('featured', 0)
    )
    
    db.session.add(product)
    db.session.commit()
    
    return jsonify({'message': 'Produto criado com sucesso', 'product': product.to_dict()}), 201

@product_bp.route('/api/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    # Aqui deveria ter autenticação JWT para admin
    product = Product.query.get(product_id)
    
    if not product:
        return jsonify({'error': 'Produto não encontrado'}), 404
    
    data = request.get_json()
    
    if data.get('name'):
        product.name = data['name']
    
    if data.get('description') is not None:
        product.description = data['description']
    
    if data.get('price') is not None:
        product.price = data['price']
    
    if data.get('image') is not None:
        product.image = data['image']
    
    if data.get('category_id') is not None:
        # Verificar se a categoria existe
        category = Category.query.get(data['category_id'])
        if not category:
            return jsonify({'error': 'Categoria não encontrada'}), 404
        product.category_id = data['category_id']
    
    if data.get('stock') is not None:
        product.stock = data['stock']
    
    if data.get('unit') is not None:
        product.unit = data['unit']
    
    if data.get('featured') is not None:
        product.featured = data['featured']
    
    db.session.commit()
    
    return jsonify({'message': 'Produto atualizado com sucesso', 'product': product.to_dict()}), 200

@product_bp.route('/api/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    # Aqui deveria ter autenticação JWT para admin
    product = Product.query.get(product_id)
    
    if not product:
        return jsonify({'error': 'Produto não encontrado'}), 404
    
    db.session.delete(product)
    db.session.commit()
    
    return jsonify({'message': 'Produto excluído com sucesso'}), 200
