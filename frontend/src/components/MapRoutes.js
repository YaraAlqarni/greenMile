import { GoogleMap, Polyline } from "@react-google-maps/api";

export default function MapRoutes({ polylines }) {
  const defaultCenter = { lat: 24.7136, lng: 46.6753 }; // Riyadh

  const colors = ["#0069ff", "#00b894", "#d63031"]; // 3 route colors

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "600px" }}
      center={defaultCenter}
      zoom={6}
    >
      {polylines.map((encoded, index) => {
        if (!window.google || !window.google.maps) return null;

        let decodedPath = [];

        try {
          decodedPath = window.google.maps.geometry.encoding.decodePath(encoded);
        } catch (e) {
          console.error("Failed to decode polyline:", encoded);
        }

        return (
          <Polyline
            key={index}
            path={decodedPath}
            options={{
              strokeColor: colors[index],
              strokeOpacity: 0.9,
              strokeWeight: 4,
            }}
          />
        );
      })}
    </GoogleMap>
  );
}
