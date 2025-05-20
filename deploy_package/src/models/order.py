from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Order(db.Model):
    __tablename__ = 'orders'
    
    id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    customer_name = Column(String(100), nullable=False)
    customer_email = Column(String(100), nullable=False)
    customer_phone = Column(String(20))
    delivery_address = Column(JSON, nullable=False)
    payment = Column(JSON, nullable=False)
    notes = Column(String(500))
    subtotal = Column(Float, nullable=False)
    delivery_fee = Column(Float, nullable=False)
    total = Column(Float, nullable=False)
    status = Column(String(20), default='pending')  # pending, processing, shipping, delivered, cancelled
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    customer = relationship('User', back_populates='orders')
    items = relationship('OrderItem', back_populates='order', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Order {self.id}>'

class OrderItem(db.Model):
    __tablename__ = 'order_items'
    
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey('orders.id'), nullable=False)
    product_id = Column(Integer, nullable=False)
    product_name = Column(String(100), nullable=False)
    price = Column(Float, nullable=False)
    quantity = Column(Float, nullable=False)
    
    # Relacionamentos
    order = relationship('Order', back_populates='items')
    
    def __repr__(self):
        return f'<OrderItem {self.product_name}>'
