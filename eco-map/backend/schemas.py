from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any, Dict, List

# ======== Token Schemas =======
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

    
# ======== User Schemas =======
class UserCreate(BaseModel):
    username: str
    password: str
    is_admin: bool = False

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

class ProjectUpdate(BaseModel):
    description: Optional[str] = None
    is_active: Optional[bool] = None

class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime
    is_active: bool 
    geometry: Optional[Dict[str, Any]] = None 

    class Config:
        from_attributes = True

class ProjectContributionResponse(ProjectResponse):
    user_contribution_count: int


class ProjectProgressResponse(BaseModel):
    project_id: int
    total_subtasks: int
    completed_subtasks: int
    uncompleted_subtasks: int
    zero_completed_subtasks: int
    avg_completion_count: Optional[float] = None
    completion_threshold: int
    user_completed: int


# ======= Subdivision Schemas =======
class GridRequest(BaseModel):
    rows: int
    cols: int

class SubdivisionResponse(BaseModel):
    id: int
    project_id: int
    completion_count: int
    geometry: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


# ======= Annotation Schemas =======
class AnnotationBase(BaseModel):
    label_type: str  

class AnnotationCreate(BaseModel):
    project_id: int
    subdivision_id: int
    geom: str 
    label_type: str


class AnnotationBatchItem(BaseModel):
    geom: str
    label_type: str


class AnnotationBatchCreate(BaseModel):
    project_id: int
    subdivision_id: int
    annotations: List[AnnotationBatchItem]

class AnnotationResponse(BaseModel):
    id: int
    project_id: int
    subdivision_id: int 
    user_id: int
    label_type: Optional[str] = None
    geometry: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ======= Task Schemas =======
class TaskItem(BaseModel):
    geom: str  

class TaskList(BaseModel):
    tasks: List[TaskItem]