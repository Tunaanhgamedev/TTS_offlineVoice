from database import SessionLocal, Voice, init_db

def seed_voices():
    init_db()
    db = SessionLocal()
    
    # Vietnamese Voices for Piper
    voices = [
        {
            "id": "vi_VN-vais1000-medium",
            "name": "Vais1000 (Giọng Chuẩn)",
            "gender": "male",
            "accent": "Northern",
            "model_path": "models/vi_VN-vais1000-medium.onnx"
        }
    ]
    
    for v_data in voices:
        voice = db.query(Voice).filter(Voice.id == v_data["id"]).first()
        if not voice:
            voice = Voice(**v_data)
            db.add(voice)
        else:
            # Update existing if needed
            for key, value in v_data.items():
                setattr(voice, key, value)
    
    db.commit()
    db.close()
    print("Voices seeded successfully!")

if __name__ == "__main__":
    seed_voices()
