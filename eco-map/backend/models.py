from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
from database import Base

class User(Base):
    """
    Basic user model
    """
    __tablename__ = "users"
    # User details
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # Score by project
    score = Column(Integer, default=0)
    # Marks by project
    annotations = relationship("Annotation", back_populates="user")


class Project(Base):
    """
    Project model, individual mapping project.
    """
    __tablename__ = "projects"
    # Project details
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    # NASA API Metadata - map data here
    nasa_layer_id = Column(String) 
    date_target = Column(DateTime) 
    boundary_geom = Column(Geometry('POLYGON', srid=4326))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # Annonations related to this project - cascade delete ON 
    annotations = relationship("Annotation", back_populates="project", cascade="all, delete-orphan")


class Annotation(Base):
    """
    The raw data points/shapes drawn by users.
    """
    __tablename__ = "annotations"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    project_id = Column(Integer, ForeignKey("projects.id"))
    # points, lines, polygons 
    geom = Column(Geometry('GEOMETRY', srid=4326))
    # To handle 'modes'
    label_type = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User", back_populates="annotations")
    project = relationship("Project", back_populates="annotations")