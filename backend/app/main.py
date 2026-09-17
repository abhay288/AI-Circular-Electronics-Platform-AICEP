from fastapi import FastAPI, HTTPException
from contextlib import asynccontextmanager
from .database import verify_connection, users_collection

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Verify DB connection
    connected = await verify_connection()
    if not connected:
        print("Failed to connect to MongoDB Atlas during startup. Exiting...")
    yield
    # Shutdown logic goes here
    pass

app = FastAPI(
    title="EcoIntel FastAPI Backend",
    description="Backend services for the AI Circular Electronics Platform",
    version="1.0.0",
    lifespan=lifespan
)

@app.get("/health")
async def health_check():
    """Health check endpoint to verify the service and DB connection."""
    is_connected = await verify_connection()
    if not is_connected:
        raise HTTPException(status_code=503, detail="Database connection failed")
    
    # Just a small query to ensure collections are accessible dynamically
    user_count = await users_collection.count_documents({})
    
    return {
        "status": "healthy",
        "database": "connected",
        "collections_ready": True,
        "users_count": user_count
    }
