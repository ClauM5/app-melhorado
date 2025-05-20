from flask import Blueprint, jsonify, request
from src.models.user import User
from src.models.db import db
import datetime
import jwt
import os

user_bp = Blueprint('user_bp', __name__)

@user_bp.route('/api/users/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password') or not data.get('name'):
        return jsonify({'error': 'Dados incompletos'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email já cadastrado'}), 400
    
    user = User(
        name=data['name'],
        email=data['email'],
        password=data['password'],  # Em produção, deve-se usar hash
        is_admin=False,
        created_at=datetime.datetime.now()
    )
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'message': 'Usuário cadastrado com sucesso', 'user': user.to_dict()}), 201

@user_bp.route('/api/users/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Dados incompletos'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or user.password != data['password']:  # Em produção, deve-se verificar o hash
        return jsonify({'error': 'Credenciais inválidas'}), 401
    
    # Gerar token JWT
    token = jwt.encode(
        {
            'user_id': user.id,
            'is_admin': user.is_admin,
            'exp': datetime.datetime.now() + datetime.timedelta(days=1)
        },
        os.environ.get('SECRET_KEY', 'hortifruti-delivery-secret-key'),
        algorithm='HS256'
    )
    
    return jsonify({
        'message': 'Login realizado com sucesso',
        'token': token,
        'user': user.to_dict()
    }), 200

@user_bp.route('/api/users/profile', methods=['GET'])
def profile():
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
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Usuário não encontrado'}), 404
    
    return jsonify({'user': user.to_dict()}), 200

@user_bp.route('/api/users/update', methods=['PUT'])
def update():
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
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Usuário não encontrado'}), 404
    
    data = request.get_json()
    
    if data.get('name'):
        user.name = data['name']
    
    if data.get('email') and data['email'] != user.email:
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email já cadastrado'}), 400
        user.email = data['email']
    
    if data.get('password'):
        user.password = data['password']  # Em produção, deve-se usar hash
    
    db.session.commit()
    
    return jsonify({'message': 'Usuário atualizado com sucesso', 'user': user.to_dict()}), 200
