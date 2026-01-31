# FastAPI app for ECO MAP
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "ECO MAP backend is running"}
