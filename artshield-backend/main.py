from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import imagehash
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import sessionmaker, declarative_base
import io

app = FastAPI()

# Allow frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------
# DATABASE SETUP
# -----------------------

DATABASE_URL = "sqlite:///./artshield.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class Artwork(Base):
    __tablename__ = "artworks"
    id = Column(Integer, primary_key=True, index=True)
    hash = Column(String, index=True)
    filename = Column(String)

Base.metadata.create_all(bind=engine)

# -----------------------
# UPLOAD ENDPOINT
# -----------------------

@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))

    new_hash = str(imagehash.phash(image))

    db = SessionLocal()
    artworks = db.query(Artwork).all()

    similarity_found = False
    similarity_percentage = 0

    for art in artworks:
        old_hash = imagehash.hex_to_hash(art.hash)
        diff = imagehash.hex_to_hash(new_hash) - old_hash
        similarity = (64 - diff) * 100 / 64

        if similarity > 85:
            similarity_found = True
            similarity_percentage = similarity
            break

    # Store new hash
    new_artwork = Artwork(hash=new_hash, filename=file.filename)
    db.add(new_artwork)
    db.commit()
    db.close()

    if similarity_found:
        return {
            "hash": new_hash,
            "message": f"⚠ Potential Copy Detected ({similarity_percentage:.2f}% similar)"
        }

    return {
        "hash": new_hash,
        "message": "✅ Original Image"
    }