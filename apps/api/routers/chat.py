import os
import uuid

import httpx
from fastapi import APIRouter
from pydantic import BaseModel, Field

from apps.api.routers.events import get_or_refresh_events

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
# Prefer a free OpenRouter model by default to avoid paid API usage.
DEFAULT_MODEL = "deepseek/deepseek-r1:free"

ADVISORY = (
    "Experimental decision-support output. TerraGuard AI is not a substitute for "
    "national emergency management authorities or official public safety guidance."
)

SYSTEM_PROMPT = (
    "You are TerraGuard AI, a global natural-disaster decision-support platform that helps "
    "communities, researchers, and emergency planners understand hazard risk and preparedness.\n\n"
    "Mandatory disclosures:\n"
    "1. You are an EXPERIMENTAL decision-support system. Always state that your output is "
    "experimental and must not replace guidance from national emergency management authorities, "
    "civil defence agencies, or official early-warning systems.\n"
    "2. You can never claim to deterministically predict the exact timing, location, or magnitude "
    "of an earthquake, tsunami, hurricane, or any other hazard. Never invent precise forecasts. "
    "You may describe general hazard mechanics, exposure, and vulnerability, and you must frame "
    "anything time-sensitive as uncertain.\n"
    "3. For imminent threats or life-safety situations, always direct the user to official "
    "channels and local authorities immediately.\n\n"
    "Style: concise, practical, and actionable. Prefer concrete preparedness steps and, when a "
    "location is known, region-appropriate advice. If you are unsure or lack authoritative data, "
    "say so plainly rather than guessing."
)


class ChatRequest(BaseModel):
    message: str = Field(..., description="User message/question about natural disaster risks")
    conversation_id: str = Field("", description="Client supplied conversation identifier")


class ChatResponse(BaseModel):
    response: str = Field(..., description="Chatbot response about natural disaster risks")
    conversation_id: str = Field(..., description="Conversation identifier for follow-up messages")
    sources: list = Field(default_factory=list, description="Sources backing the response")
    risk_context: dict = Field(default_factory=dict, description="Structured hazard context")


router = APIRouter(prefix="/api/v1/chat", tags=["chat"])


def detect_hazards(message: str) -> list[str]:
    text = message.lower()
    hazards: list[str] = []
    keyword_map = {
        "earthquake": "earthquake",
        "hurricane": "tropical_cyclone",
        "typhoon": "tropical_cyclone",
        "cyclone": "tropical_cyclone",
        "flood": "flood",
        "wildfire": "wildfire",
        "forest fire": "wildfire",
        "tornado": "tornado",
        "volcano": "volcano",
        "volcanic": "volcano",
        "tsunami": "tsunami",
        "landslide": "landslide",
        "drought": "drought",
    }
    for keyword, hazard in keyword_map.items():
        if keyword in text and hazard not in hazards:
            hazards.append(hazard)
    return hazards


def build_risk_context(message: str) -> dict:
    return {
        "hazard_types": detect_hazards(message),
        "advisory": ADVISORY,
        "authoritative_sources": [
            "National emergency management authority",
            "Local civil defence / disaster management agency",
            "Official meteorological and geological warning services",
        ],
    }


async def build_event_context(message: str) -> str:
    """Summarize recent live hazard events that are relevant to a user question."""
    text = message.lower()
    hazard_types = detect_hazards(message)
    if not hazard_types:
        return ""

    try:
        events = await get_or_refresh_events()
    except Exception:
        return ""

    relevant_events = []
    for event in events:
        event_hazard = event.hazard_type.value
        if event_hazard not in hazard_types:
            continue

        location_pool = " ".join(
            part for part in [event.country, event.admin_region, event.nearest_populated_location] if part
        ).lower()
        if any(keyword in text for keyword in ["recent", "today", "this week", "how did", "what caused"]):
            pass

        if any(term in text for term in ["nepal", "kathmandu", "himalaya", "india", "asia", "global"]):
            if any(term in location_pool for term in ["nepal", "kathmandu", "asia", "india", "himalaya"]):
                relevant_events.append(event)
            elif "nepal" in text and not relevant_events:
                relevant_events.append(event)
        else:
            relevant_events.append(event)

    if not relevant_events:
        return ""

    compact = []
    for event in relevant_events[:3]:
        location = event.nearest_populated_location or event.country or "global area"
        summary = event.explanation.human_summary if getattr(event, "explanation", None) else "Live hazard signal reported."
        compact.append(
            f"{event.hazard_type.value.upper()} in {location}: {summary}"
        )

    return "Relevant live hazard context: " + " | ".join(compact)


def rule_based_reply(message: str, event_context: str = "") -> str:
    message_lower = message.lower()

    if event_context and ("recent" in message_lower or "how did" in message_lower or "what caused" in message_lower or "why" in message_lower):
        return (
            f"I checked the live hazard feed. {event_context} "
            "In general, floods often occur when intense rainfall exceeds drainage capacity, rivers overflow, or drainage systems are overwhelmed by saturated ground and runoff. "
            "The most important thing is to verify the local official warning and avoid flooded roads, riverbanks, and low-lying areas."
        )

    if "earthquake" in message_lower:
        return (
            "Earthquake risk depends on tectonic plate boundaries and local fault lines. "
            "Areas near plate boundaries (like the Pacific Ring of Fire) have higher risk. "
            "TerraGuard AI cannot predict the exact timing or magnitude of an earthquake. "
            "To prepare: secure heavy furniture, create an emergency kit, and know evacuation routes."
        )
    if (
        "hurricane" in message_lower
        or "typhoon" in message_lower
        or "cyclone" in message_lower
    ):
        return (
            "Hurricanes form over warm ocean waters and can cause severe wind, flooding, and storm surge. "
            "Coastal regions are most at risk. Prepare by boarding up windows, stocking supplies, "
            "and evacuating if ordered. Follow official warnings from your national meteorological service."
        )
    if "flood" in message_lower:
        return (
            "Flooding can occur from heavy rainfall, storm surge, or overflowing rivers. "
            "Low-lying areas and regions near water bodies are most vulnerable. "
            "If a flood is ongoing, move to higher ground, avoid driving through water, and stay informed through local official alerts."
        )
    if "wildfire" in message_lower or "forest fire" in message_lower:
        return (
            "Wildfires are fueled by dry vegetation, wind, and heat. "
            "Areas with dense vegetation and drought conditions are at higher risk. "
            "Create defensible space around your home, have an evacuation plan, and stay informed."
        )
    if "tornado" in message_lower:
        return (
            "Tornadoes are violent rotating columns of air that can cause severe damage. "
            "They occur most frequently in flat regions like Tornado Alley. "
            "Seek shelter in a basement or interior room on the lowest floor."
        )
    if "volcano" in message_lower:
        return (
            "Volcanic eruptions release ash, lava, and gases. "
            "Areas near active volcanoes are at risk. "
            "Stay informed through official alerts and follow evacuation orders if issued."
        )
    if "tsunami" in message_lower:
        return (
            "Tsunamis are giant waves caused by underwater earthquakes or volcanic eruptions. "
            "Coastal areas are at risk. If you feel an earthquake near the coast, move to higher ground immediately."
        )
    if "risk" in message_lower or "danger" in message_lower or "safe" in message_lower:
        return (
            "Natural disaster risk varies by location, season, and environmental conditions. "
            "To assess your specific risk, consult local emergency management agencies, "
            "geological surveys, and weather services for area-specific hazard maps and preparedness guidance."
        )
    if "prepare" in message_lower or "preparation" in message_lower or "how to" in message_lower:
        return (
            "General disaster preparedness: create an emergency kit with water, food, and supplies for at least 72 hours. "
            "Develop a family communication plan, know evacuation routes, and keep important documents in a waterproof container. "
            "Stay informed through local alerts and have a battery-powered radio."
        )
    return (
        "I can help answer questions about natural disaster risks including earthquakes, hurricanes, floods, "
        "wildfires, tornadoes, volcanoes, and tsunamis. Ask me about a specific disaster type, "
        "how to prepare, or how to assess risk in your area."
    )


async def ask_openrouter(message: str, history: list, event_context: str = "") -> str | None:
    key = os.getenv("OPENROUTER_API_KEY")
    if not key:
        return None

    model = os.getenv("OPENROUTER_MODEL", DEFAULT_MODEL)
    contextual_message = message
    if event_context:
        contextual_message = (
            f"{message}\n\nLive hazard context from the project feed:\n{event_context}"
        )
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend(history)
    messages.append({"role": "user", "content": contextual_message})

    headers = {
        "Authorization": f"Bearer {key}",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "TerraGuard AI",
        "Content-Type": "application/json",
    }
    payload = {"model": model, "messages": messages}

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(OPENROUTER_URL, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
        content = data["choices"][0]["message"]["content"]
        if isinstance(content, list):
            content = "".join(part.get("text", "") for part in content)
        return content.strip() or None
    except Exception:
        return None


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """Answer questions about natural disaster risks, preferring an LLM with rule-based fallback."""
    conversation_id = request.conversation_id or str(uuid.uuid4())
    risk_context = build_risk_context(request.message)

    history: list = []
    if request.conversation_id:
        history.append(
            {
                "role": "user",
                "content": f"Conversation {request.conversation_id} continued. Previous context unavailable.",
            }
        )

    event_context = await build_event_context(request.message)
    text = await ask_openrouter(request.message, history, event_context)
    if text:
        model = os.getenv("OPENROUTER_MODEL", DEFAULT_MODEL)
        sources = [f"OpenRouter LLM ({model})"]
    else:
        text = rule_based_reply(request.message, event_context)
        sources = ["TerraGuard AI Knowledge Base"]

    return ChatResponse(
        response=text,
        conversation_id=conversation_id,
        sources=sources,
        risk_context=risk_context,
    )
