import { LoadScript } from "@react-google-maps/api";
import CreateTrip from "./components/CreateTrip";

function App() {
  return (
    <LoadScript
      googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_KEY}
      libraries={["geometry"]}  // <-- REQUIRED for decoding polylines
    >
      <CreateTrip />
    </LoadScript>
  );
}

export default App;
