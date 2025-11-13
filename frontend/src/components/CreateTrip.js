import { useState } from "react";
import { GoogleMap, LoadScript, DirectionsRenderer } from "@react-google-maps/api";
import "./CreateTrip.css";

export default function CreateTrip() {
  const [vehicleType, setVehicleType] = useState("");
  const [modelYear, setModelYear] = useState("");
  const [fuelType, setFuelType] = useState("Petrol");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [routes, setRoutes] = useState([]);
  const [directions, setDirections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const years = Array.from({ length: 25 }, (_, i) => 2025 - i);
  const googleKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setRoutes([]);
    setDirections([]);

    try {
      const url = `http://127.0.0.1:8000/routes?origin=${encodeURIComponent(
        origin
      )}&destination=${encodeURIComponent(destination)}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || data.error) throw new Error(data.error || "Unable to fetch routes");

      setRoutes(data.routes || []);

      // Load directions directly from Google Maps for drawing
      const directionsService = new window.google.maps.DirectionsService();
      const colors = ["#2ecc71", "#3498db", "#e74c3c"]; // green, blue, red
      const routeData = [];

      for (let i = 0; i < data.routes.length; i++) {
        const result = await directionsService.route({
          origin,
          destination,
          travelMode: window.google.maps.TravelMode.DRIVING,
          provideRouteAlternatives: true,
        });

        if (result.routes[i]) {
          routeData.push({
            route: result.routes[i],
            color: colors[i % colors.length],
          });
        }
      }

      setDirections(routeData);
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="trip-container">
      {/* Left Side: Form */}
      <div className="form-section">
        <h2>
          Create a <span className="highlight">Trip</span>
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Vehicle & Model Year */}
          <div className="form-row">
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              required
            >
              <option value="">Vehicle Type</option>
              <option value="Car">Car</option>
              <option value="Van">Van</option>
              <option value="Truck">Truck</option>
            </select>

            <select
              value={modelYear}
              onChange={(e) => setModelYear(e.target.value)}
              required
            >
              <option value="">Model Year</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Fuel Toggle */}
          <div className="fuel-toggle">
            <button
              type="button"
              className={fuelType === "Petrol" ? "active" : ""}
              onClick={() => setFuelType("Petrol")}
            >
              Petrol
            </button>
            <button
              type="button"
              className={fuelType === "Diesel" ? "active" : ""}
              onClick={() => setFuelType("Diesel")}
            >
              Diesel
            </button>
          </div>

          {/* Origin & Destination */}
          <input
            type="text"
            placeholder="Origin (e.g., Jeddah)"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Destination (e.g., Riyadh)"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Fetching routes..." : "Create Trip"}
          </button>
        </form>

        {/* Error Message */}
        {error && <p className="error-message">⚠️ {error}</p>}

        {/* Routes Display */}
        {routes.length > 0 && (
          <div className="routes-container">
            <h3>Available Routes</h3>
            {routes.map((r, i) => (
              <div key={i} className="route-box">
                <h4>Route {i + 1}</h4>
                <p>
                  <b>Summary:</b> {r.summary || "Unnamed Road"}
                </p>
                <p>
                  <b>Distance:</b> {r.distance}
                </p>
                <p>
                  <b>Duration:</b> {r.duration}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Side Map */}
      <div className="map-placeholder">
        <LoadScript googleMapsApiKey={googleKey}>
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={{ lat: 21.4858, lng: 39.1925 }} // Centered around Jeddah
            zoom={12}
          >
            {directions.map((dir, i) => (
              <DirectionsRenderer
                key={i}
                directions={{ routes: [dir.route] }}
                options={{
                  polylineOptions: {
                    strokeColor: dir.color,
                    strokeWeight: 5,
                    opacity: 0.8,
                  },
                  suppressMarkers: false,
                }}
              />
            ))}
          </GoogleMap>
        </LoadScript>
      </div>
    </div>
  );
}
