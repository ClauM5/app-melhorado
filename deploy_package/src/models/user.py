from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    phone = Column(String(20))
    role = Column(String(20), default='customer')  # customer, admin
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    orders = relationship('Order', back_populates='customer', lazy=True)
    
    def __repr__(self):
        return f'<User {self.name}>'
