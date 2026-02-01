from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, text, and_
from geoalchemy2.elements import WKTElement
from geoalchemy2.shape import to_shape 
from shapely.geometry import mapping, box, shape
from typing import List, Optional
from datetime import timedelta

# Local modules
from database import engine, Base, get_db
import models
import schemas
import security 

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="EcoMap Backend")

origins = [
    "http://localhost:5173", 
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"], 
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# ----------------------------------------------------------------
# AUTH DEPENDENCIES 
# ----------------------------------------------------------------

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Decodes the token to find the user. 
    If token is invalid or user doesn't exist -> 401 Error.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decode token
        payload = security.jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except security.jwt.JWTError:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_admin(current_user: models.User = Depends(get_current_user)):
    """
    Ensures the logged-in user has is_admin=True.
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not enough privileges")
    return current_user

# ----------------------------------------------------------------
# LOGIN ENDPOINT
# ----------------------------------------------------------------

@app.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Finds user by username and verifies password.
    """
    user = db.query(models.User).filter(models.User.username == form_data.username).first()

    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create Token
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# ----------------------------------------------------------------
# GENERAL ENDPOINTS
# ----------------------------------------------------------------

@app.get("/")
def read_root():
    return {"status": "eco-mapping online", "message": "Go to /docs to test the API"}

# ----------------------------------------------------------------
# USER ENDPOINTS
# ----------------------------------------------------------------

@app.post("/users/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Create Admin or Reviewer.
    """
    # Check for duplicate
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    # Hash the password
    hashed_pwd = security.get_password_hash(user.password)
    
    new_user = models.User(
        username=user.username, 
        hashed_password=hashed_pwd, 
        is_admin=user.is_admin
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.get("/users/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# ----------------------------------------------------------------
# PROJECT ENDPOINTS
# ----------------------------------------------------------------

@app.get("/projects/", response_model=List[schemas.ProjectResponse])
def read_projects(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    projects = db.query(models.Project).filter(models.Project.is_active == True).offset(skip).limit(limit).all()
    for project in projects:
        if project.boundary_geom is not None:
            project.geometry = mapping(to_shape(project.boundary_geom))
    return projects


@app.post("/projects/", response_model=schemas.ProjectResponse)
def create_project(
    project: schemas.ProjectCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """
    Create a new project.
    """
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
    
    # Convert Database Binary -> GeoJSON for the frontend map
    if project.boundary_geom is not None:
        project.geometry = mapping(to_shape(project.boundary_geom))
    
    return project


@app.get("/projects/{project_id}/tasks/next", response_model=schemas.SubdivisionResponse)
def get_next_task(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    completed_subq = db.query(models.Annotation.subdivision_id).filter(
        models.Annotation.project_id == project_id,
        models.Annotation.user_id == current_user.id
    ).subquery()

    task = db.query(models.Subdivision).filter(
        models.Subdivision.project_id == project_id,
        ~models.Subdivision.id.in_(completed_subq)
    ).order_by(func.random()).first()

    if task is None:
        raise HTTPException(status_code=404, detail="No available tasks")

    if task.geom is not None:
        task.geometry = mapping(to_shape(task.geom))

    return task


@app.get("/projects/{project_id}/progress", response_model=schemas.ProjectProgressResponse)
def get_project_progress(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    completion_threshold = 10
    total_subtasks = db.query(models.Subdivision).filter(models.Subdivision.project_id == project_id).count()
    completed_subtasks = db.query(models.Subdivision).filter(
        models.Subdivision.project_id == project_id,
        models.Subdivision.completion_count >= completion_threshold
    ).count()
    uncompleted_subtasks = db.query(models.Subdivision).filter(
        models.Subdivision.project_id == project_id,
        models.Subdivision.completion_count < completion_threshold
    ).count()
    zero_completed_subtasks = db.query(models.Subdivision).filter(
        models.Subdivision.project_id == project_id,
        models.Subdivision.completion_count == 0
    ).count()
    avg_completion_count = db.query(func.avg(models.Subdivision.completion_count)).filter(
        models.Subdivision.project_id == project_id
    ).scalar()

    user_completed = db.query(func.count(func.distinct(models.Annotation.subdivision_id))).filter(
        models.Annotation.project_id == project_id,
        models.Annotation.user_id == current_user.id
    ).scalar()

    return schemas.ProjectProgressResponse(
        project_id=project_id,
        total_subtasks=total_subtasks,
        completed_subtasks=completed_subtasks,
        uncompleted_subtasks=uncompleted_subtasks,
        zero_completed_subtasks=zero_completed_subtasks,
        avg_completion_count=avg_completion_count,
        completion_threshold=completion_threshold,
        user_completed=user_completed
    )

@app.get("/users/me/projects", response_model=List[schemas.ProjectContributionResponse])
def read_my_projects(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Join Projects and Annotations, filter by user_id, group by Project
    results = db.query(
        models.Project, 
        func.count(models.Annotation.id).label('count')
    ).join(models.Annotation)\
     .filter(models.Annotation.user_id == current_user.id)\
     .group_by(models.Project.id)\
     .all()

    response = []
    for project, count in results:
        proj_data = schemas.ProjectContributionResponse(
            id=project.id,
            name=project.name,
            description=project.description,
            nasa_layer_id=project.nasa_layer_id,
            created_at=project.created_at,
            is_active=project.is_active,
            user_contribution_count=count
        )
        if project.boundary_geom is not None:
            proj_data.geometry = mapping(to_shape(project.boundary_geom))
        response.append(proj_data)
        
    return response

# ----------------------------------------------------------------
# ASIGNER ENDPOINTS
# ----------------------------------------------------------------
@app.patch("/projects/{project_id}", response_model=schemas.ProjectResponse)
def update_project_status(
    project_id: int,
    status_update: schemas.ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin) 
):
    """
    Update project status (e.g., close a project by setting is_active=False).
    """
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project.is_active = status_update.is_active
    db.commit()
    db.refresh(project)
    
    # Handle Geometry serialization for response
    if project.boundary_geom is not None:
        project.geometry = mapping(to_shape(project.boundary_geom))

    return project

# ----------------------------------------------------------------
# ANNOTATION ENDPOINTS
# ----------------------------------------------------------------

@app.post("/annotations/", response_model=schemas.AnnotationResponse)
def create_annotation(
    annotation: schemas.AnnotationCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Create an annotation and verify it lies within project boundaries.
    """

    project = db.query(models.Project).filter(models.Project.id == annotation.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    subdivision = db.query(models.Subdivision).filter(
        models.Subdivision.id == annotation.subdivision_id,
        models.Subdivision.project_id == annotation.project_id
    ).first()
    if not subdivision:
        raise HTTPException(status_code=404, detail="Subdivision not found")

    existing = db.query(models.Annotation).filter(
        models.Annotation.project_id == annotation.project_id,
        models.Annotation.subdivision_id == annotation.subdivision_id,
        models.Annotation.user_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Task already completed by this user")

    # GEOSPATIAL CHECK 
    point_wkt = WKTElement(annotation.geom, srid=4326)
    is_inside = db.scalar(func.ST_Contains(project.boundary_geom, point_wkt))

    if not is_inside:
        raise HTTPException(
            status_code=400, 
            detail="Location Error: This point is outside the project boundaries."
        )

    # Save Record
    db_annotation = models.Annotation(
            project_id=annotation.project_id,
            subdivision_id=annotation.subdivision_id,
            label_type=annotation.label_type,
            geom=point_wkt,
            user_id=current_user.id 
        )

    subdivision.completion_count += 1

    db.add(db_annotation)
    db.commit()
    db.refresh(db_annotation)
    
    # Convert Binary -> GeoJSON 
    if db_annotation.geom is not None:
        db_annotation.geometry = mapping(to_shape(db_annotation.geom))
        
    return db_annotation


@app.post("/annotations/batch")
def create_annotation_batch(
    batch: schemas.AnnotationBatchCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    project = db.query(models.Project).filter(models.Project.id == batch.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    subdivision = db.query(models.Subdivision).filter(
        models.Subdivision.id == batch.subdivision_id,
        models.Subdivision.project_id == batch.project_id
    ).first()
    if not subdivision:
        raise HTTPException(status_code=404, detail="Subdivision not found")

    existing = db.query(models.Annotation).filter(
        models.Annotation.project_id == batch.project_id,
        models.Annotation.subdivision_id == batch.subdivision_id,
        models.Annotation.user_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Task already completed by this user")

    if not batch.annotations:
        raise HTTPException(status_code=400, detail="No annotations provided")

    created = 0
    for item in batch.annotations:
        point_wkt = WKTElement(item.geom, srid=4326)
        db_annotation = models.Annotation(
            project_id=batch.project_id,
            subdivision_id=batch.subdivision_id,
            label_type=item.label_type,
            geom=point_wkt,
            user_id=current_user.id
        )
        db.add(db_annotation)
        created += 1

    subdivision.completion_count += 1
    db.commit()

    return {"status": "success", "created": created}


@app.get("/projects/{project_id}/annotations", response_model=List[schemas.AnnotationResponse])
def get_project_annotations(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """
    Fetch all annotations for a project (admin only).
    Returns annotations with geometry serialized to GeoJSON.
    """
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    annotations = db.query(models.Annotation).filter(
        models.Annotation.project_id == project_id
    ).all()

    # Convert geometry to GeoJSON for each annotation
    result = []
    for annotation in annotations:
        if annotation.geom is not None:
            annotation.geometry = mapping(to_shape(annotation.geom))
        result.append(annotation)

    return result

# ----------------------------------------------------------------
# SUBDIVISION ENDPOINTS
# ----------------------------------------------------------------

@app.post("/projects/{project_id}/generate-grid", response_model=List[schemas.SubdivisionResponse])
def generate_grid(
    project_id: int, 
    grid: schemas.GridRequest, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin) 
):
    """
    Generates a grid of subdivisions for a project.
    """
    # Fetch Project
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get the bounds of the project geometry 
    project_shape = to_shape(project.boundary_geom)
    minx, miny, maxx, maxy = project_shape.bounds

    # Calculate step sizes
    width = maxx - minx
    height = maxy - miny
    step_x = width / grid.cols
    step_y = height / grid.rows

    new_subdivisions = []

    # Loop and Create Cells
    for i in range(grid.cols):
        for j in range(grid.rows):
            cell_minx = minx + (i * step_x)
            cell_maxx = minx + ((i + 1) * step_x)
            cell_miny = miny + (j * step_y)
            cell_maxy = miny + ((j + 1) * step_y)
            cell_poly = box(cell_minx, cell_miny, cell_maxx, cell_maxy)
            # Only keep cells that touch the project shape
            if project_shape.intersects(cell_poly):
                # Convert back to WKT
                wkt_cell = cell_poly.wkt
                sub = models.Subdivision(
                    project_id=project.id,
                    geom=WKTElement(wkt_cell, srid=4326),
                    completion_count=0
                )
                db.add(sub)
                new_subdivisions.append(sub)
    db.commit()
    
    response_data = []
    for sub in new_subdivisions:
        db.refresh(sub) 
        sub_resp = schemas.SubdivisionResponse(
            id=sub.id,
            project_id=sub.project_id,
            completion_count=sub.completion_count
        )
        if sub.geom is not None:
            sub_resp.geometry = mapping(to_shape(sub.geom))
        response_data.append(sub_resp)

    return response_data


@app.get("/projects/{project_id}/subdivisions", response_model=List[schemas.SubdivisionResponse])
def get_subdivisions(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Fetch all subdivisions (grid squares) for a project.
    """
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    subdivisions = db.query(models.Subdivision).filter(
        models.Subdivision.project_id == project_id
    ).all()

    response_data = []
    for sub in subdivisions:
        sub_resp = schemas.SubdivisionResponse(
            id=sub.id,
            project_id=sub.project_id,
            completion_count=sub.completion_count
        )
        if sub.geom is not None:
            sub_resp.geometry = mapping(to_shape(sub.geom))
        response_data.append(sub_resp)

    return response_data

# ----------------------------------------------------------------
# BATCH TASKS ENDPOINTS
# ----------------------------------------------------------------

@app.post("/projects/{project_id}/tasks/batch")
def create_batch_tasks(
    project_id: int, 
    batch: schemas.TaskList, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin) 
):
    """
    REVIEW Mode: Upload a specific list of geometries instead of generating a grid.
    """
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    created_count = 0
    
    # Loop through the list and save each as a subdivision
    for task in batch.tasks:
        try:
            # Convert string input to WKT for PostGIS
            poly_wkt = WKTElement(task.geom, srid=4326)
            
            new_subdivision = models.Subdivision(
                project_id=project_id,
                geom=poly_wkt,
                completion_count=0
            )
            db.add(new_subdivision)
            created_count += 1
        except Exception as e:
            print(f"Skipping bad geometry: {e}")
            continue

    db.commit()
    
    return {"status": "success", "tasks_created": created_count}