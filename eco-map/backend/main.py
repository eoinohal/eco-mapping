from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from geoalchemy2.elements import WKTElement
from geoalchemy2.shape import to_shape 
import json
from shapely.geometry import mapping
from database import engine, Base, get_db
import models
import schemas

# Create Tables
models.Base.metadata.create_all(bind=engine)
app = FastAPI(title="EcoMap Backend")
@app.get("/")
def read_root(): return {"status": "eco-mapping online", "message": "Go to /docs to test the API"}

# User Endpoint
@app.post("/users/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    new_user = models.User(
        username=user.username, 
        hashed_password=user.password,
        is_admin=True  
    )
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Username already exists")
    

# Project Endpoint
@app.post("/projects/", response_model=schemas.ProjectResponse)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    # Convert Pydantic Schema -> SQLAlchemy Model
    new_project = models.Project(
        name=project.name,
        description=project.description,
        nasa_layer_id=project.nasa_layer_id,
        date_target=project.date_target,
        boundary_geom=WKTElement(project.boundary_geom, srid=4326)
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project
@app.get("/projects/{project_id}", response_model=schemas.ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    # Convert Database Binary -> GeoJSON
    if project.boundary_geom is not None:
        project.geometry = mapping(to_shape(project.boundary_geom))
    return project


# Annotation Endpoint
@app.post("/annotations/", response_model=schemas.AnnotationResponse)
def create_annotation(annotation: schemas.AnnotationCreate, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == annotation.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db_annotation = models.Annotation(
        project_id=annotation.project_id,
        label_type=annotation.label_type,
        geom=WKTElement(annotation.geom, srid=4326),
        user_id=1  # Temp USER ID 1 
    )
    db.add(db_annotation)
    db.commit()
    db.refresh(db_annotation)
    # Convert Binary -> GeoJSON for response
    if db_annotation.geom is not None:
        db_annotation.geometry = mapping(to_shape(db_annotation.geom))
    return db_annotation