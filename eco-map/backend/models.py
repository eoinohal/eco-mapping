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
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    score = Column(Integer, default=0)
    annotations = relationship("Annotation", back_populates="user")


class Project(Base):
    """
    Project model, individual mapping project.
    """
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    nasa_layer_id = Column(String) 
    date_target = Column(DateTime) 
    boundary_geom = Column(Geometry('POLYGON', srid=4326))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True) 
    required_annotations = Column(Integer, default=100) 
    annotations = relationship("Annotation", back_populates="project", cascade="all, delete-orphan")
    subdivisions = relationship("Subdivision", back_populates="project", cascade="all, delete-orphan")

class Subdivision(Base):
    """
    Subdivisions of a project area for annotation.
    """
    __tablename__ = "subdivisions"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    geom = Column(Geometry('POLYGON', srid=4326))
    completion_count = Column(Integer, default=0)
    project = relationship("Project", back_populates="subdivisions")
    annotations = relationship("Annotation", back_populates="subdivision")
class Annotation(Base):
    '''
    Annotations made by users on project subdivisions.
    '''
    __tablename__ = "annotations"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    subdivision_id = Column(Integer, ForeignKey("subdivisions.id"))
    label_type = Column(String)
    quality_score = Column(Integer, default=0)
    geom = Column(Geometry('POINT', srid=4326))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    project = relationship("Project", back_populates="annotations")
    user = relationship("User", back_populates="annotations")
    subdivision = relationship("Subdivision", back_populates="annotations") 