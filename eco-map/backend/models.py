from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, Float
from sqlalchemy.orm import relationship, declarative_base
from geoalchemy2 import Geometry

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="user")  # 'admin' | 'user'
    total_points = Column(Integer, default=0)

    # Relationships
    drawings = relationship("UserDrawing", back_populates="user")

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    # Bounding box of the mission area 
    bounding_box = Column(Geometry(geometry_type='POLYGON', srid=4326))
    status = Column(String, default="active") # 'active' | 'archived'

    # Relationships
    segments = relationship("MapSegment", back_populates="project")

class MapSegment(Base):
    __tablename__ = "map_segments"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    # Individual tile geometry
    geom = Column(Geometry(geometry_type='POLYGON', srid=4326))
    completed = Column(Boolean, default=False)
    locked_by_user = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    project = relationship("Project", back_populates="segments")
    drawings = relationship("UserDrawing", back_populates="segment")

class UserDrawing(Base):
    __tablename__ = "user_drawings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    segment_id = Column(Integer, ForeignKey("map_segments.id"))
    # User-submitted spatial features 
    geom = Column(Geometry(geometry_type='GEOMETRY', srid=4326))
    score = Column(Float, default=0.0)

    # Relationships
    user = relationship("User", back_populates="drawings")
    segment = relationship("MapSegment", back_populates="drawings")