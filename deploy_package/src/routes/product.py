from flask import Blueprint, jsonify, request, current_app
from src.models.product import Product, Category, db
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import os
from werkzeug.utils import secure_filename

product_bp = Blueprint('product', __name__)

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

# Rotas para produtos
@product_bp.route('/', methods=['GET'])
def get_products():
    # Parâmetros de filtro
    category_id = request.args.get('category_id')
    featured = request.args.get('featured')
    organic = request.args.get('organic')
    
    query = Product.query
    
    if category_id:
        query = query.filter_by(category_id=category_id)
    
    if featured == 'true':
        query = query.filter_by(featured=True)
    
    if organic == 'true':
        query = query.filter_by(organic=True)
    
    # Filtrar apenas produtos ativos por padrão
    query = query.filter_by(active=True)
    
    products = query.all()
    
    result = []
    for product in products:
        result.append({
            'id': product.id,
            'name': product.name,
            'description': product.description,
            'price': product.price,
            'unit': product.unit,
            'image': product.image,
            'category_id': product.category_id,
            'stock': product.stock,
            'organic': product.organic,
            'featured': product.featured,
            'discount': product.discount,
            'active': product.active
        })
    
    return jsonify(result), 200

@product_bp.route('/featured', methods=['GET'])
def get_featured_products():
    products = Product.query.filter_by(featured=True, active=True).all()
    
    result = []
    for product in products:
        result.append({
            'id': product.id,
            'name': product.name,
            'description': product.description,
            'price': product.price,
            'unit': product.unit,
            'image': product.image,
            'category_id': product.category_id,
            'stock': product.stock,
            'organic': product.organic,
            'featured': product.featured,
            'discount': product.discount,
            'active': product.active
        })
    
    return jsonify(result), 200

@product_bp.route('/<int:product_id>', methods=['GET'])
def get_product(product_id):
    product = Product.query.get_or_404(product_id)
    
    result = {
        'id': product.id,
        'name': product.name,
        'description': product.description,
        'price': product.price,
        'unit': product.unit,
        'image': product.image,
        'category_id': product.category_id,
        'stock': product.stock,
        'organic': product.organic,
        'featured': product.featured,
        'discount': product.discount,
        'active': product.active
    }
    
    return jsonify(result), 200

@product_bp.route('/', methods=['POST'])
def create_product():
    # Verificar token
    data, error, code = verify_token(admin_required=True)
    if error:
        return jsonify(error), code
    
    # Obter dados do produto
    product_data = request.get_json()
    
    # Criar novo produto
    new_product = Product(
        name=product_data['name'],
        description=product_data.get('description', ''),
        price=product_data['price'],
        unit=product_data['unit'],
        image=product_data.get('image', ''),
        category_id=product_data['category_id'],
        stock=product_data.get('stock', 0),
        organic=product_data.get('organic', False),
        featured=product_data.get('featured', False),
        discount=product_data.get('discount', 0),
        active=product_data.get('active', True)
    )
    
    db.session.add(new_product)
    db.session.commit()
    
    return jsonify({
        'id': new_product.id,
        'name': new_product.name,
        'message': 'Produto criado com sucesso!'
    }), 201

@product_bp.route('/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    # Verificar token
    data, error, code = verify_token(admin_required=True)
    if error:
        return jsonify(error), code
    
    # Obter produto
    product = Product.query.get_or_404(product_id)
    
    # Obter dados atualizados
    product_data = request.get_json()
    
    # Atualizar produto
    if 'name' in product_data:
        product.name = product_data['name']
    
    if 'description' in product_data:
        product.description = product_data['description']
    
    if 'price' in product_data:
        product.price = product_data['price']
    
    if 'unit' in product_data:
        product.unit = product_data['unit']
    
    if 'image' in product_data:
        product.image = product_data['image']
    
    if 'category_id' in product_data:
        product.category_id = product_data['category_id']
    
    if 'stock' in product_data:
        product.stock = product_data['stock']
    
    if 'organic' in product_data:
        product.organic = product_data['organic']
    
    if 'featured' in product_data:
        product.featured = product_data['featured']
    
    if 'discount' in product_data:
        product.discount = product_data['discount']
    
    if 'active' in product_data:
        product.active = product_data['active']
    
    db.session.commit()
    
    return jsonify({
        'id': product.id,
        'name': product.name,
        'message': 'Produto atualizado com sucesso!'
    }), 200

@product_bp.route('/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    # Verificar token
    data, error, code = verify_token(admin_required=True)
    if error:
        return jsonify(error), code
    
    # Obter produto
    product = Product.query.get_or_404(product_id)
    
    # Excluir produto
    db.session.delete(product)
    db.session.commit()
    
    return jsonify({
        'message': 'Produto excluído com sucesso!'
    }), 200

@product_bp.route('/upload', methods=['POST'])
def upload_image():
    # Verificar token
    data, error, code = verify_token(admin_required=True)
    if error:
        return jsonify(error), code
    
    # Verificar se o arquivo foi enviado
    if 'image' not in request.files:
        return jsonify({'message': 'Nenhum arquivo enviado!'}), 400
    
    file = request.files['image']
    
    # Verificar se o arquivo tem nome
    if file.filename == '':
        return jsonify({'message': 'Nenhum arquivo selecionado!'}), 400
    
    # Verificar extensão do arquivo
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    if '.' not in file.filename or file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
        return jsonify({'message': 'Extensão de arquivo não permitida!'}), 400
    
    # Salvar arquivo
    filename = secure_filename(file.filename)
    upload_folder = os.path.join(current_app.static_folder, 'images', 'products')
    
    # Criar pasta se não existir
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)
    
    file_path = os.path.join(upload_folder, filename)
    file.save(file_path)
    
    # Retornar URL da imagem
    image_url = f'/static/images/products/{filename}'
    
    return jsonify({
        'url': image_url,
        'message': 'Imagem enviada com sucesso!'
    }), 201

@product_bp.route('/count', methods=['GET'])
def get_products_count():
    count = Product.query.count()
    return jsonify({'count': count}), 200

@product_bp.route('/low-stock', methods=['GET'])
def get_low_stock_products():
    # Produtos com estoque menor ou igual a 10
    products = Product.query.filter(Product.stock <= 10).all()
    
    result = []
    for product in products:
        result.append({
            'id': product.id,
            'name': product.name,
            'category_id': product.category_id,
            'price': product.price,
            'stock': product.stock
        })
    
    return jsonify(result), 200

# Rotas para categorias
@product_bp.route('/categories', methods=['GET'])
def get_categories():
    categories = Category.query.all()
    
    result = []
    for category in categories:
        result.append({
            'id': category.id,
            'name': category.name,
            'description': category.description,
            'image': category.image
        })
    
    return jsonify(result), 200

@product_bp.route('/categories/<int:category_id>', methods=['GET'])
def get_category(category_id):
    category = Category.query.get_or_404(category_id)
    
    result = {
        'id': category.id,
        'name': category.name,
        'description': category.description,
        'image': category.image
    }
    
    return jsonify(result), 200

@product_bp.route('/categories', methods=['POST'])
def create_category():
    # Verificar token
    data, error, code = verify_token(admin_required=True)
    if error:
        return jsonify(error), code
    
    # Obter dados da categoria
    category_data = request.get_json()
    
    # Criar nova categoria
    new_category = Category(
        name=category_data['name'],
        description=category_data.get('description', ''),
        image=category_data.get('image', '')
    )
    
    db.session.add(new_category)
    db.session.commit()
    
    return jsonify({
        'id': new_category.id,
        'name': new_category.name,
        'message': 'Categoria criada com sucesso!'
    }), 201

@product_bp.route('/categories/<int:category_id>', methods=['PUT'])
def update_category(category_id):
    # Verificar token
    data, error, code = verify_token(admin_required=True)
    if error:
        return jsonify(error), code
    
    # Obter categoria
    category = Category.query.get_or_404(category_id)
    
    # Obter dados atualizados
    category_data = request.get_json()
    
    # Atualizar categoria
    if 'name' in category_data:
        category.name = category_data['name']
    
    if 'description' in category_data:
        category.description = category_data['description']
    
    if 'image' in category_data:
        category.image = category_data['image']
    
    db.session.commit()
    
    return jsonify({
        'id': category.id,
        'name': category.name,
        'message': 'Categoria atualizada com sucesso!'
    }), 200

@product_bp.route('/categories/<int:category_id>', methods=['DELETE'])
def delete_category(category_id):
    # Verificar token
    data, error, code = verify_token(admin_required=True)
    if error:
        return jsonify(error), code
    
    # Verificar se existem produtos associados a esta categoria
    products_count = Product.query.filter_by(category_id=category_id).count()
    if products_count > 0:
        return jsonify({
            'message': f'Não é possível excluir esta categoria. Existem {products_count} produtos associados a ela.'
        }), 400
    
    # Obter categoria
    category = Category.query.get_or_404(category_id)
    
    # Excluir categoria
    db.session.delete(category)
    db.session.commit()
    
    return jsonify({
        'message': 'Categoria excluída com sucesso!'
    }), 200

@product_bp.route('/categories/upload', methods=['POST'])
def upload_category_image():
    # Verificar token
    data, error, code = verify_token(admin_required=True)
    if error:
        return jsonify(error), code
    
    # Verificar se o arquivo foi enviado
    if 'image' not in request.files:
        return jsonify({'message': 'Nenhum arquivo enviado!'}), 400
    
    file = request.files['image']
    
    # Verificar se o arquivo tem nome
    if file.filename == '':
        return jsonify({'message': 'Nenhum arquivo selecionado!'}), 400
    
    # Verificar extensão do arquivo
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    if '.' not in file.filename or file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
        return jsonify({'message': 'Extensão de arquivo não permitida!'}), 400
    
    # Salvar arquivo
    filename = secure_filename(file.filename)
    upload_folder = os.path.join(current_app.static_folder, 'images', 'categories')
    
    # Criar pasta se não existir
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)
    
    file_path = os.path.join(upload_folder, filename)
    file.save(file_path)
    
    # Retornar URL da imagem
    image_url = f'/static/images/categories/{filename}'
    
    return jsonify({
        'url': image_url,
        'message': 'Imagem enviada com sucesso!'
    }), 201
