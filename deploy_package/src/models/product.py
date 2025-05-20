from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Product(db.Model):
    __tablename__ = 'products'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500))
    price = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)  # kg, unid, bandeja, etc.
    image = Column(String(255))
    category_id = Column(Integer, ForeignKey('categories.id'), nullable=False)
    stock = Column(Integer, default=0)
    organic = Column(Boolean, default=False)
    featured = Column(Boolean, default=False)
    discount = Column(Integer, default=0)  # Percentual de desconto
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    category = relationship('Category', back_populates='products')
    
    def __repr__(self):
        return f'<Product {self.name}>'

class Category(db.Model):
    __tablename__ = 'categories'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500))
    image = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    products = relationship('Product', back_populates='category', lazy=True)
    
    def __repr__(self):
        return f'<Category {self.name}>'
