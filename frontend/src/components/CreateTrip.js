import { useState } from "react";
import "./CreateTrip.css";
import MapRoutes from "./MapRoutes";  // <-- IMPORTANT

export default function CreateTrip() {
  const [vehicleType, setVehicleType] = useState("");
  const [modelYear, setModelYear] = useState("");
  const [fuelType, setFuelType] = useState("Petrol");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const years = Array.from({ length: 25 }, (_, i) => 2025 - i);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setRoutes([]);

    try {
      const url = `http://127.0.0.1:8000/routes?origin=${encodeURIComponent(
        origin
      )}&destination=${encodeURIComponent(destination)}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Unable to fetch routes");
      }

      setRoutes(data.routes || []);
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

      {/* Right Side: MAP */}
      <div className="map-placeholder">
        <div className="map-card">
          {routes.length > 0 ? (
            <MapRoutes polylines={routes.map((r) => r.polyline)} />
          ) : (
            "🗺️ Map will be added later"
          )}
        </div>
      </div>
    </div>
  );
}
