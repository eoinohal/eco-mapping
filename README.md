
# eco-mapping

## Description
Hack-Earth submission

eco-mapping is a gamified web platform to crowdsources human reviewed satellite data for collecting geospatial datasets for environmental monitoring missions. 

**Note:** No security setup so far

---

## How to Run

### 1. Clone the repository

```sh
git clone https://github.com/eoinohal/eco-map
cd eco-map/eco-map
```


### 2. Set up Environment Variables

```sh
# From the root project folder
cd backend
cp .env.example .env
# Open .env in your editor and set secrets
```
- NASA API key = https://api.nasa.gov/
- Any others ...



### 3. Start the Application (Docker)

```sh
# From the root project folder
docker compose up --build
```
Backend hosted on http://127.0.0.1:8000
API Documentation: http://localhost:8000/docs


### 5. Run Frontend 

```sh
# From the root project folder
cd frontend
npm install
npm run dev
```
Frotend hosted on http://localhost:5173


---

## Project Structure
**UPDATE NEEDED**
```
eco-map/
├── docker-compose.yml       
├── backend/
│   ├── Dockerfile         
│   ├── main.py              # Backend Entrypoint
│   ├── database.py          
│   ├── models.py            # Database Models
│   ├── schemas.py           # Pydantic Validation Models
│   ├── requirements.txt     
│   └── .env                 # API Keys and Database URL
├── frontend/
│   ├── App.tsx              # React app
│   ├── main.tsx             # React entrypoint
│   ├── package.json         
│   └── ...
└── README.md               
```


---
