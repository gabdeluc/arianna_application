from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel, Field
import random
from config.config_loader import config_loader

app = FastAPI(title="Meeting Transcript API - Minimal")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# MODELLI
# ============================================

class TranscriptEntry(BaseModel):
    uid: str
    nickname: str
    text: str
    from_field: str = Field(..., alias="from", description="Timestamp iniziale formato HH:MM:SS.mmm")
    to: str = Field(..., description="Timestamp finale formato HH:MM:SS.mmm")

class Participant(BaseModel):
    id: str
    name: str

class MeetingMetadata(BaseModel):
    participants: List[Participant]
    date: str

class TranscriptMetadata(BaseModel):
    language: str

class TranscriptResponse(BaseModel):
    transcript: List[TranscriptEntry]
    metadata: TranscriptMetadata

class MeetingResponse(BaseModel):
    metadata: MeetingMetadata

# ============================================
# CARICA CONFIGURAZIONE DA FILE
# ============================================

# Carica dati da YAML
SAMPLE_PHRASES = config_loader.get_sample_phrases()
PARTICIPANTS_CONFIG = config_loader.get_participants()
MEETINGS_CONFIG = config_loader.get_meetings()
GENERATION_CONFIG = config_loader.get_generation_config()

# Converti in oggetti Pydantic
PARTICIPANTS = [Participant(**p) for p in PARTICIPANTS_CONFIG]

def generate_mock_transcript(num_entries: int = 20) -> List[TranscriptEntry]:
    """Genera un transcript mock usando configurazione da file"""
    transcript = []
    current_time = 0
    
    # Usa configurazione per parametri di generazione
    min_duration = GENERATION_CONFIG['min_duration_seconds']
    max_pause = GENERATION_CONFIG['max_pause_seconds']
    chars_per_sec = GENERATION_CONFIG['chars_per_second']
    
    for i in range(num_entries):
        participant = random.choice(PARTICIPANTS)
        text = random.choice(SAMPLE_PHRASES)
        duration = max(min_duration, len(text) // chars_per_sec)
        
        # Formato: HH:MM:SS.mmm
        from_time = f"{current_time // 3600:02d}:{(current_time % 3600) // 60:02d}:{current_time % 60:02d}.000"
        current_time += duration
        to_time = f"{current_time // 3600:02d}:{(current_time % 3600) // 60:02d}:{current_time % 60:02d}.000"
        
        transcript.append(TranscriptEntry(
            uid=str(12345 + i),
            nickname=participant.name,
            text=text,
            **{"from": from_time},
            to=to_time
        ))
        
        current_time += random.randint(1, max_pause)
    
    return transcript

# Genera mock database da configurazione
MOCK_MEETINGS = {}
for meeting_config in MEETINGS_CONFIG:
    meeting_id = meeting_config['id']
    MOCK_MEETINGS[meeting_id] = {
        "metadata": MeetingMetadata(
            participants=PARTICIPANTS,
            date=meeting_config['date']
        ),
        "transcript": generate_mock_transcript(meeting_config['num_entries'])
    }

# ============================================
# ENDPOINTS - RISPETTANO IL TUO SCHEMA
# ============================================

@app.get("/")
def root():
    """Health check"""
    return {
        "status": "ok",
        "config": {
            "loaded_from": "config/mock_data.yaml",
            "participants": len(PARTICIPANTS),
            "meetings": len(MOCK_MEETINGS),
            "sample_phrases": len(SAMPLE_PHRASES)
        },
        "endpoints": [
            {
                "method": "GET",
                "route": "meeting/{meetingId}",
                "description": "Get meeting metadata"
            },
            {
                "method": "GET",
                "route": "meeting/{meetingId}/transcript/",
                "description": "Get full transcript"
            },
            {
                "method": "GET",
                "route": "meeting/{meetingId}/transcript?participant-id={participantId}",
                "description": "Get transcript filtered by participant"
            },
            {
                "method": "GET",
                "route": "meeting/{meetingId}/character-count",
                "description": "Count characters (custom endpoint)"
            }
        ]
    }

@app.get("/config")
def get_config():
    """Visualizza la configurazione corrente"""
    return {
        "sample_phrases": SAMPLE_PHRASES,
        "participants": [p.dict() for p in PARTICIPANTS],
        "meetings": MEETINGS_CONFIG,
        "generation": GENERATION_CONFIG
    }

@app.get("/meeting/{meetingId}", response_model=MeetingResponse)
def get_meeting(meetingId: str):
    """
    GET meeting/{meetingId}
    
    Response come da tuo formato:
    {
      "metadata": {
        "participants": [...],
        "date": "2024-06-01T10:00:00Z"
      }
    }
    """
    meeting = MOCK_MEETINGS.get(meetingId)
    if not meeting:
        raise HTTPException(status_code=404, detail=f"Meeting {meetingId} not found")
    
    return MeetingResponse(metadata=meeting["metadata"])

@app.get("/meeting/{meetingId}/transcript/", response_model=TranscriptResponse)
def get_transcript_full(meetingId: str):
    """
    GET meeting/{meetingId}/transcript/
    
    Response come da tuo formato:
    {
      "transcript": [
        {
          "uid": "12345",
          "nickname": "Bob",
          "text": "Hello, everyone...",
          "from": "00:00:01.000",
          "to": "00:00:05.000"
        }
      ],
      "metadata": {
        "language": "en"
      }
    }
    """
    meeting = MOCK_MEETINGS.get(meetingId)
    if not meeting:
        raise HTTPException(status_code=404, detail=f"Meeting {meetingId} not found")
    
    return TranscriptResponse(
        transcript=meeting["transcript"],
        metadata=TranscriptMetadata(language="en")
    )

@app.get("/meeting/{meetingId}/transcript")
def get_transcript_filtered(
    meetingId: str,
    participant_id: Optional[str] = None
):
    """
    GET meeting/{meetingId}/transcript?participant-id={participantId}
    
    Filtra il transcript per partecipante
    """
    meeting = MOCK_MEETINGS.get(meetingId)
    if not meeting:
        raise HTTPException(status_code=404, detail=f"Meeting {meetingId} not found")
    
    transcript = meeting["transcript"]
    
    # Filtra per partecipante se richiesto
    if participant_id:
        participant_name = next(
            (p.name for p in PARTICIPANTS if p.id == participant_id),
            None
        )
        if participant_name:
            transcript = [e for e in transcript if e.nickname == participant_name]
    
    return {
        "transcript": transcript,
        "metadata": {"language": "en"}
    }

@app.get("/meeting/{meetingId}/character-count")
def get_character_count(
    meetingId: str,
    participant_id: Optional[str] = None
):
    """
    Endpoint CUSTOM per contare i caratteri
    
    Query params:
    - participant_id: conta solo per un partecipante (opzionale)
    
    Example:
    - /meeting/mtg001/character-count
    - /meeting/mtg001/character-count?participant_id=fj93829
    """
    response = get_transcript_filtered(meetingId, participant_id)
    transcript = response["transcript"]
    
    total_chars = sum(len(entry.text) for entry in transcript)
    total_words = sum(len(entry.text.split()) for entry in transcript)
    
    result = {
        "meeting_id": meetingId,
        "total_characters": total_chars,
        "total_words": total_words,
        "total_messages": len(transcript)
    }
    
    # Se filtrato per partecipante, aggiungi info
    if participant_id:
        participant = next((p for p in PARTICIPANTS if p.id == participant_id), None)
        if participant:
            result["participant"] = {
                "id": participant_id,
                "name": participant.name
            }
    
    return result

@app.get("/participants")
def get_participants():
    """Lista dei partecipanti disponibili (da config)"""
    return {"participants": PARTICIPANTS}

@app.get("/meetings")
def get_all_meetings():
    """Lista di tutti i meeting disponibili (da config)"""
    return {
        "meetings": [
            {
                "id": meeting_id,
                "date": meeting["metadata"].date,
                "participants_count": len(meeting["metadata"].participants),
                "messages_count": len(meeting["transcript"])
            }
            for meeting_id, meeting in MOCK_MEETINGS.items()
        ]
    }