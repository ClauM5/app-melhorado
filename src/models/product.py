from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from src.models.db import db

class Product(db.Model):
    __tablename__ = 'products'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500), nullable=True)
    price = Column(Float, nullable=False)
    image = Column(String(200), nullable=True)
    category_id = Column(Integer, ForeignKey('categories.id'), nullable=False)
    stock = Column(Integer, nullable=False, default=0)
    unit = Column(String(20), nullable=False, default='un')
    featured = Column(Integer, nullable=False, default=0)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'price': self.price,
            'image': self.image,
            'category_id': self.category_id,
            'stock': self.stock,
            'unit': self.unit,
            'featured': self.featured
        }
