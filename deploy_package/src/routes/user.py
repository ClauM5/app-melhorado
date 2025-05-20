from flask import Blueprint, jsonify, request, current_app
from src.models.user import User, db
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime

user_bp = Blueprint('user', __name__)

@user_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Verificar se o usuário já existe
    user = User.query.filter_by(email=data['email']).first()
    if user:
        return jsonify({'message': 'Usuário já existe!'}), 409
    
    # Criar novo usuário
    hashed_password = generate_password_hash(data['password'], method='sha256')
    new_user = User(
        name=data['name'],
        email=data['email'],
        password=hashed_password,
        role='customer'
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    # Gerar token
    token = jwt.encode({
        'user_id': new_user.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30)
    }, current_app.config['SECRET_KEY'])
    
    return jsonify({
        'id': new_user.id,
        'name': new_user.name,
        'email': new_user.email,
        'token': token
    }), 201

@user_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not check_password_hash(user.password, data['password']):
        return jsonify({'message': 'Credenciais inválidas!'}), 401
    
    # Gerar token
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30)
    }, current_app.config['SECRET_KEY'])
    
    return jsonify({
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'role': user.role,
        'token': token
    }), 200

@user_bp.route('/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json()
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not check_password_hash(user.password, data['password']) or user.role != 'admin':
        return jsonify({'message': 'Credenciais inválidas ou usuário sem permissão!'}), 401
    
    # Gerar token
    token = jwt.encode({
        'user_id': user.id,
        'role': user.role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
    }, current_app.config['SECRET_KEY'])
    
    return jsonify({
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'role': user.role,
        'token': token
    }), 200

@user_bp.route('/profile', methods=['GET'])
def get_profile():
    # Verificar token
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'message': 'Token não fornecido!'}), 401
    
    try:
        token = token.split(' ')[1]
        data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        user = User.query.filter_by(id=data['user_id']).first()
        
        if not user:
            return jsonify({'message': 'Usuário não encontrado!'}), 404
        
        return jsonify({
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role
        }), 200
    except:
        return jsonify({'message': 'Token inválido!'}), 401

@user_bp.route('/profile', methods=['PUT'])
def update_profile():
    # Verificar token
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'message': 'Token não fornecido!'}), 401
    
    try:
        token = token.split(' ')[1]
        data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        user = User.query.filter_by(id=data['user_id']).first()
        
        if not user:
            return jsonify({'message': 'Usuário não encontrado!'}), 404
        
        # Atualizar dados
        update_data = request.get_json()
        
        if 'name' in update_data:
            user.name = update_data['name']
        
        if 'email' in update_data and update_data['email'] != user.email:
            # Verificar se o email já está em uso
            existing_user = User.query.filter_by(email=update_data['email']).first()
            if existing_user:
                return jsonify({'message': 'Email já está em uso!'}), 409
            user.email = update_data['email']
        
        if 'password' in update_data:
            user.password = generate_password_hash(update_data['password'], method='sha256')
        
        db.session.commit()
        
        return jsonify({
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role
        }), 200
    except:
        return jsonify({'message': 'Token inválido!'}), 401
