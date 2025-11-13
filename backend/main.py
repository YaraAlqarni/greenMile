from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import os, requests
from dotenv import load_dotenv
from geopy.distance import geodesic

# ===============================
# Load Environment Variables
# ===============================
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

app = FastAPI()

# ===============================
# CORS Setup
# ===============================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===============================
# Route Finder API
# ===============================
@app.get("/routes")
def get_routes(origin: str = Query(...), destination: str = Query(...)):
    """
    Fetch up to 3 alternative driving routes between origin and destination.
    - If distance < 50 km → last-mile mode (traffic-aware)
    - If distance >= 50 km → intercity mode
    Returns: list of routes (distance, duration, summary)
    """

    geo_url = "https://maps.googleapis.com/maps/api/geocode/json"
    directions_url = "https://maps.googleapis.com/maps/api/directions/json"

    # --- Get coordinates to estimate air distance ---
    o_data = requests.get(geo_url, params={"address": origin, "key": GOOGLE_API_KEY}).json()
    d_data = requests.get(geo_url, params={"address": destination, "key": GOOGLE_API_KEY}).json()

    try:
        o_coords = (
            o_data["results"][0]["geometry"]["location"]["lat"],
            o_data["results"][0]["geometry"]["location"]["lng"],
        )
        d_coords = (
            d_data["results"][0]["geometry"]["location"]["lat"],
            d_data["results"][0]["geometry"]["location"]["lng"],
        )
        distance_km = geodesic(o_coords, d_coords).km
    except Exception:
        distance_km = 0

    # --- Mode detection ---
    if distance_km > 50:
        mode = "intercity"
    else:
        mode = "lastmile"

    all_routes = []

    # --- Try multiple configurations to encourage diverse routes ---
    strategies = [
        {"avoid": None, "traffic_model": "best_guess"},
        {"avoid": "tolls", "traffic_model": "pessimistic"},
        {"avoid": "highways", "traffic_model": "optimistic"},
        {"avoid": "ferries", "traffic_model": "best_guess"},
    ]

    for s in strategies:
        params = {
            "origin": origin,
            "destination": destination,
            "mode": "driving",
            "alternatives": "true",
            "region": "sa",
            "key": GOOGLE_API_KEY,
        }

        # Use traffic model only for short/urban trips
        if mode == "lastmile":
            params["departure_time"] = "now"
            params["traffic_model"] = s["traffic_model"]
        if s["avoid"]:
            params["avoid"] = s["avoid"]

        # Send request to Google
        r = requests.get(directions_url, params=params)
        data = r.json()

        print(f"Google returned {len(data.get('routes', []))} routes using {s}")

        if data.get("status") != "OK":
            print("⚠️ Google Directions API error:", data.get("status"))
            continue

        # Extract route data
        for route in data["routes"]:
            leg = route["legs"][0]
            dist_text = leg["distance"]["text"]
            dur_text = leg["duration"]["text"]
            summary = route.get("summary", "Unnamed Route")

            # Avoid duplicates
            if not any(x["distance"] == dist_text and x["duration"] == dur_text for x in all_routes):
                all_routes.append({
                    "summary": summary,
                    "distance": dist_text,
                    "duration": dur_text
                })

            if len(all_routes) >= 3:
                break

        if len(all_routes) >= 3:
            break

    # --- Return results ---
    if not all_routes:
        return {"error": "No routes found"}

    print(f"✅ Returning {len(all_routes)} unique routes.")
    return {"routes": all_routes[:3]}
