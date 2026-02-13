import axios from "axios";
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export const getCoordinatesFromPincode = async (pincode) => {
  try {
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/geocode/json",
      {
        params: {
          address: pincode,
          key: GOOGLE_MAPS_API_KEY,
        },
      }
    );

    if (response.data.results.length === 0) {
      throw new Error("Invalid pincode");
    }

    const location = response.data.results[0].geometry.location;

    return {
      lat: location.lat,
      lng: location.lng,
    };
  } catch (error) {
    throw error;
  }
};


