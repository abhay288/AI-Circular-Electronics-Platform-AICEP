import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import logging

# Set up simple logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load the environment variables from the root .env file
load_dotenv(dotenv_path="../.env")

MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    raise ValueError("MONGODB_URI is not set in the environment variables.")

# Create the async client
client = AsyncIOMotorClient(MONGODB_URI)

# Connect to the "ecointel" initial database
db = client["ecointel"]

# Provide simple access to the requested collections
# This allows the backend to access them on-the-fly without manual creation in Atlas
users_collection = db["users"]
organizations_collection = db["organizations"]
devices_collection = db["devices"]
pcbs_collection = db["pcbs"]
components_collection = db["components"]
detections_collection = db["detections"]
predictions_collection = db["predictions"]
reconstruction_jobs_collection = db["reconstruction_jobs"]
metal_reports_collection = db["metal_reports"]
repair_reports_collection = db["repair_reports"]
passports_collection = db["passports"]
marketplace_listings_collection = db["marketplace_listings"]
transactions_collection = db["transactions"]
carbon_reports_collection = db["carbon_reports"]
ai_jobs_collection = db["ai_jobs"]
activity_logs_collection = db["activity_logs"]
notifications_collection = db["notifications"]

async def verify_connection():
    """Verify that we can connect to the database."""
    try:
        # Ping the server to confirm connection
        await client.admin.command('ping')
        logger.info("Successfully connected to MongoDB Atlas (ecointel database)!")
        return True
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB Atlas: {e}")
        return False
