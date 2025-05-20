from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from src.models.db import db

class Category(db.Model):
    __tablename__ = 'categories'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500), nullable=True)
    image = Column(String(200), nullable=True)
    
    # Usando string para evitar dependência circular
    products = relationship('Product', backref='category', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'image': self.image
        }
