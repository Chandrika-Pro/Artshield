from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, DateTime, text
from sqlalchemy.orm import declarative_base, sessionmaker
from PIL import Image
import imagehash
import hashlib
import io
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# =========================
# App Setup
# =========================
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# Database Setup
# =========================
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise Exception("❌ DATABASE_URL not found! Check your .env file.")

engine = create_engine(DATABASE_URL)
Base = declarative_base()
SessionLocal = sessionmaker(bind=engine)


class Artwork(Base):
    __tablename__ = "artworks"

    id = Column(Integer, primary_key=True, index=True)
    sha256 = Column(String, unique=True, index=True)
    phash = Column(String)
    filename = Column(String, nullable=True)
    owner_name = Column(String)
    owner_email = Column(String)
    registered_at = Column(DateTime)


# Create tables
Base.metadata.create_all(bind=engine)

# Add filename column if it doesn't exist yet (safe migration)
try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE artworks ADD COLUMN IF NOT EXISTS filename VARCHAR"))
        conn.commit()
except Exception:
    pass


# =========================
# Utility Functions
# =========================
def calculate_sha256(file_bytes):
    return hashlib.sha256(file_bytes).hexdigest()


def calculate_phash(image):
    return str(imagehash.phash(image))


def calculate_similarity(phash1, phash2):
    hash1 = imagehash.hex_to_hash(phash1)
    hash2 = imagehash.hex_to_hash(phash2)
    distance = hash1 - hash2
    similarity = (1 - distance / 64) * 100
    return round(similarity, 2)


# =========================
# Routes
# =========================
@app.get("/")
def root():
    return {"message": "ArtShield Backend Running 🚀"}


# =========================
# History Endpoint
# =========================
@app.get("/history")
def get_history(email: str):
    db = SessionLocal()
    try:
        artworks = db.query(Artwork).filter(
            Artwork.owner_email == email
        ).order_by(Artwork.registered_at.desc()).all()
        return {
            "history": [
                {
                    "id": art.id,
                    "hash": art.phash,
                    "filename": art.filename or "Unknown file",
                    "owner_name": art.owner_name,
                    "owner_email": art.owner_email,
                    "registered_at": art.registered_at.strftime(
                        "%B %d, %Y at %I:%M %p"
                    ),
                }
                for art in artworks
            ],
            "total": len(artworks),
        }
    except Exception as e:
        return {"error": str(e), "history": []}
    finally:
        db.close()


# =========================
# Upload Endpoint
# =========================
@app.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    owner_name: str = Form(default="Unknown"),
    owner_email: str = Form(default="Unknown"),
):
    db = SessionLocal()

    try:
        file_bytes = await file.read()
        filename = file.filename or "unknown"

        # Calculate SHA256
        sha256_hash = calculate_sha256(file_bytes)

        # Check if exact duplicate exists
        existing_exact = db.query(Artwork).filter(
            Artwork.sha256 == sha256_hash
        ).first()

        # If exact duplicate — don't save
        if existing_exact:
            return {
                "hash": sha256_hash,
                "similarity": 100.0,
                "message": "⚠️ Exact duplicate found",
                "is_duplicate": True,
                "filename": existing_exact.filename or "Unknown file",
                "original_owner": existing_exact.owner_name,
                "original_email": existing_exact.owner_email,
                "registered_at": existing_exact.registered_at.strftime(
                    "%B %d, %Y at %I:%M %p"
                ),
            }

        # Open image and calculate pHash
        image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
        phash_value = calculate_phash(image)

        highest_similarity = 0
        most_similar_artwork = None

        # Compare with existing artworks
        all_artworks = db.query(Artwork).all()
        for artwork in all_artworks:
            similarity = calculate_similarity(phash_value, artwork.phash)
            if similarity > highest_similarity:
                highest_similarity = similarity
                most_similar_artwork = artwork

        # If visually similar above 85% — don't save
        if highest_similarity >= 85 and most_similar_artwork:
            return {
                "hash": phash_value,
                "similarity": highest_similarity,
                "message": f"⚠️ Potential Copy Detected ({highest_similarity}% similar)",
                "is_duplicate": True,
                "filename": most_similar_artwork.filename or "Unknown file",
                "original_owner": most_similar_artwork.owner_name,
                "original_email": most_similar_artwork.owner_email,
                "registered_at": most_similar_artwork.registered_at.strftime(
                    "%B %d, %Y at %I:%M %p"
                ),
            }

        # Save new original artwork
        new_artwork = Artwork(
            sha256=sha256_hash,
            phash=phash_value,
            filename=filename,
            owner_name=owner_name,
            owner_email=owner_email,
            registered_at=datetime.now(timezone.utc),
        )

        db.add(new_artwork)
        db.commit()

        return {
            "hash": phash_value,
            "similarity": highest_similarity,
            "message": "✅ Original Image — Registered Successfully!",
            "is_duplicate": False,
            "filename": filename,
            "original_owner": owner_name,
            "original_email": owner_email,
            "registered_at": new_artwork.registered_at.strftime(
                "%B %d, %Y at %I:%M %p"
            ),
        }

    except Exception as e:
        return {"error": str(e)}

    finally:
        db.close()