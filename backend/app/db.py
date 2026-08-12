import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

# Load env from backend directory
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'pdf_assistant')

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]
