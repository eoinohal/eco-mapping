from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any, Dict 

# ======== User Schemas =======
class UserCreate(BaseModel):
    username: str
    password: str # hash not used!!!

class UserResponse(BaseModel):
    id: int
    username: str
    is_admin: bool
    
    class Config:
        from_attributes = True


# ======= Project Schemas =======
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    nasa_layer_id: Optional[str] = None

class ProjectCreate(ProjectBase):
    boundary_geom: str 
    date_target: datetime

class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime
    geometry: Optional[Dict[str, Any]] = None 

    class Config:
        from_attributes = True


# ======= Annotation Schemas =======
class AnnotationBase(BaseModel):
    label_type: str  

class AnnotationCreate(AnnotationBase):
    project_id: int
    geom: str 

class AnnotationResponse(AnnotationBase):
    id: int
    project_id: int
    created_at: datetime
    geometry: Optional[Dict[str, Any]] = None  

    class Config:
        from_attributes = True

        