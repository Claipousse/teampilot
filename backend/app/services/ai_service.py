from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.config import settings
from app.models.club import Club, Season
from app.models.player import Player
from app.models.staff import StaffMember
from app.models.event import Event

SYSTEM_PROMPT = """Tu es Tactical AI, l'assistant IA de {club_name}.
Tu es un expert en football et gestion de club. Tu aides le staff et les joueurs.

=== CLUB ===
{club_name} | {league} | {city}

=== SAISON {season_label} ({season_status}) ===
Compétitions : {competitions}
Objectif : {objective}

=== EFFECTIF ({players_total} joueurs) ===
Format stats : mj=matchs joués | b=buts | pd=passes décisives | min=minutes jouées | ratio=buts/matchs×100 | j/r=cartons jaunes/rouges | cln=clean sheets | enc=buts encaissés (GK)

Disponibles ({available_count}) : {available_list}
Blessés ({injured_count}) : {injured_list}
Suspendus ({suspended_count}) : {suspended_list}
Incertains ({uncertain_count}) : {uncertain_list}

=== PROCHAIN ÉVÉNEMENT ===
{next_event}

=== STAFF ({staff_count} membres) ===
{staff_list}

Réponds en français, de façon concise et professionnelle.
Base-toi sur les données ci-dessus pour les informations factuelles du club.
Pour les questions tactiques ou générales sur le football, tu peux utiliser tes connaissances générales.
N'invente aucune information sur les joueurs ou événements non listés."""


async def build_context(db: AsyncSession) -> str:
    club = (await db.execute(select(Club).where(Club.id == 1))).scalar_one_or_none()
    club_name   = club.name   if club and club.name   else "le club"
    league      = club.league if club and club.league else "—"
    city        = club.city   if club and club.city   else "—"

    season = (await db.execute(
        select(Season).where(Season.is_active == True)
    )).scalar_one_or_none()
    season_label  = season.label        if season                      else "—"
    season_status = season.status       if season                      else "—"
    competitions  = season.competitions if season and season.competitions else "—"
    objective     = season.objective    if season and season.objective    else "—"

    players = (await db.execute(
        select(Player).where(Player.is_active == True)
    )).scalars().all()

    available = [p for p in players if p.status == "Disponible"]
    injured   = [p for p in players if p.status == "Blessé"]
    suspended = [p for p in players if p.status == "Suspendu"]
    uncertain = [p for p in players if p.status == "Incertain"]

    def fmt(p: Player) -> str:
        ratio = round(p.goals / p.matches * 100) if p.matches > 0 else 0
        parts = [
            f"{p.first_name} {p.last_name} (#{p.shirt_number}, {p.position_short})",
            f"{p.matches}mj",
            f"{p.goals}b" if p.position_short != "GK" else f"{p.clean_sheets}cln/{p.goals_conceded}enc",
            f"{p.assists}pd" if p.position_short != "GK" else None,
            f"{p.minutes_played}min",
            f"ratio {ratio}%" if p.position_short != "GK" and p.matches > 0 else None,
            f"{p.yellow_cards}j/{p.red_cards}r" if (p.yellow_cards or p.red_cards) else None,
        ]
        return " | ".join(p for p in parts if p is not None)

    today_str = date.today().strftime("%Y-%m-%d")
    next_event = (await db.execute(
        select(Event)
        .where(Event.event_date >= today_str)
        .order_by(Event.event_date, Event.event_time)
        .limit(1)
    )).scalar_one_or_none()
    next_event_str = (
        f"{next_event.title} — {next_event.event_date} à {next_event.event_time}"
        if next_event else "Aucun"
    )

    staff_members = (await db.execute(
        select(StaffMember).where(StaffMember.is_active == True)
    )).scalars().all()

    return SYSTEM_PROMPT.format(
        club_name=club_name,
        league=league,
        city=city,
        season_label=season_label,
        season_status=season_status,
        competitions=competitions,
        objective=objective,
        players_total=len(players),
        available_count=len(available),
        available_list=", ".join(fmt(p) for p in available) or "—",
        injured_count=len(injured),
        injured_list=", ".join(fmt(p) for p in injured) or "—",
        suspended_count=len(suspended),
        suspended_list=", ".join(fmt(p) for p in suspended) or "—",
        uncertain_count=len(uncertain),
        uncertain_list=", ".join(fmt(p) for p in uncertain) or "—",
        next_event=next_event_str,
        staff_count=len(staff_members),
        staff_list=", ".join(
            f"{s.first_name} {s.last_name} ({s.role})" for s in staff_members
        ) or "—",
    )


async def _call_groq(messages: list[dict]) -> str:
    from groq import AsyncGroq
    client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    response = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        max_tokens=1024,
        temperature=0.7,
    )
    return response.choices[0].message.content


async def _call_ollama(messages: list[dict]) -> str:
    import httpx
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            f"{settings.OLLAMA_URL}/api/chat",
            json={"model": "llama3.2:3b", "messages": messages, "stream": False},
        )
        r.raise_for_status()
        return r.json()["message"]["content"]


async def chat_with_ai(user_text: str, history: list[dict], db: AsyncSession) -> str:
    system_prompt = await build_context(db)
    messages = (
        [{"role": "system", "content": system_prompt}]
        + history
        + [{"role": "user", "content": user_text}]
    )

    if settings.GROQ_API_KEY:
        try:
            return await _call_groq(messages)
        except Exception as e:
            print(f"[AI] Groq failed: {type(e).__name__}: {e}")

    try:
        return await _call_ollama(messages)
    except Exception as e:
        print(f"[AI] Ollama failed: {type(e).__name__}: {e}")
        raise RuntimeError("Aucun fournisseur IA disponible") from e
