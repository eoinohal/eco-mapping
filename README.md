
# ECO MAP


---

## How to Run

### 1. Clone the repository

```sh
git clone https://github.com/eoinohal/eco-map
cd eco-map/eco-map
```


### 2. Set up the Database
### USE DOCKER INSTEAD?
- Install **PostgreSQL** and **PostGIS**
```sh
brew install postgresql
brew install postgis
```

- Create a database and enable the PostGIS extension:
  ```sql
  psql postgres
  CREATE DATABASE ecomap;
  \c ecomap
  CREATE EXTENSION postgis;
  ```

- (Add dump file instructions here)


### 3. Set up Environment Variables

```sh
cd backend
cp .env.example .env
# Open .env in your editor and set secrets
```
- NASA API key = https://api.nasa.gov/
- Any others ...



### 4. Run Backend

```sh
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```
Backend hosted on http://127.0.0.1:8000


### 5. Run Frontend 

```sh
cd frontend
npm install
npm run dev
```
Frotend hosted on http://localhost:5173


---

## Project Structure

```
eco-map/
├── backend/
│   ├── main.py              # FastAPI backend entrypoint
│   └── requirements.txt     # Python dependencies
│   └── .env.example         # env variables
├── frontend/
│   ├── App.tsx             # Main React app component
│   ├── main.tsx            # React entrypoint
│   ├── index.html          # HTML template
│   ├── index.css           # Tailwind
│   ├── package.json        # Frontend dependencies & scripts
│   └── tailwind.config.js  # Tailwind config
├── readMe.md               # Project documentation
└── .gitignore              # Git ignore
```


---
