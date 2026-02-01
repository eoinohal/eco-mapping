
# eco-mapping

## Description

A gamified web platform for crowdsourcing human reviewed satellite imagery to collect geospatial datasets for environmental monitoring missions.


---


## How to Run

### 1. Clone the repository

```sh
git clone https://github.com/eoinohal/eco-mapping
cd eco-mapping/eco-map
```


### 2. Set up Environment Variables

```sh
cd backend
cp .env.example .env
```

Edit `.env`:
- `SECRET_KEY` - Replace with random string



### 3. Start Backend

```sh
cd backend
docker compose up --build
```

- Backend: http://localhost:8000
- Docs: http://localhost:8000/docs

### 4. Start Frontend

```sh
cd frontend
npm install
npm run dev
```

- Frontend: http://localhost:5173

---

## Project Structure

```
eco-map/
├── backend/            # FastAPI server
│   ├── main.py         # API endpoints
│   ├── models.py       # SQLAlchemy ORM
│   ├── schemas.py      # Pydantic validators
│   └── database.py     # DB connection
├── frontend/        
│   ├── src/
│   │   ├── pages/      # User flows
│   │   ├── components/
│   │   └── utils/
│   └── package.json
└── README.md
```

---

## Tech Stack

**Backend:**
- FastAPI (Python)
- SQLAlchemy ORM
- PostgreSQL + PostGIS (geospatial)
- JWT authentication

**Frontend:**
- React 18
- React Router
- Leaflet (mapping)
- Tailwind CSS
- Vite

---
