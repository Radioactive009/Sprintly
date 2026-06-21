"use client";

import { useEffect, useRef, useState } from "react";
import { haversineDistance } from "@/lib/gps/haversine";

interface Location {
  lat: number;
  lng: number;
}

export default function RunPage() {
  const [location, setLocation] = useState<Location | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [distance, setDistance] = useState<number>(0);

  const prevLocationRef = useRef<Location | null>(null);

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setAccuracy(position.coords.accuracy);

        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        const previousLocation = prevLocationRef.current;

        if (previousLocation) {
          const movedDistance = haversineDistance(
            previousLocation.lat,
            previousLocation.lng,
            newLocation.lat,
            newLocation.lng
          );

          console.log(
            "Movement detected:",
            movedDistance.toFixed(2),
            "meters"
          );

          // GPS jitter filter
          if (movedDistance > 5) {
            setDistance((prev) => prev + movedDistance);
          }
        }

        prevLocationRef.current = newLocation;
        setLocation(newLocation);
      },
      (error) => {
        console.error("Error Code:", error.code);
        console.error("Error Message:", error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 5000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return (
    <main className="p-6">
      <h1 className="text-4xl font-bold mb-6">
        Sprintly
      </h1>

      {location ? (
        <div className="space-y-3">
          <p>
            <strong>Latitude:</strong> {location.lat}
          </p>

          <p>
            <strong>Longitude:</strong> {location.lng}
          </p>

          <p>
            <strong>Accuracy:</strong>{" "}
            {accuracy !== null
              ? `${accuracy.toFixed(1)} m`
              : "Calculating..."}
          </p>

          <p>
            <strong>Distance:</strong>{" "}
            {(distance / 1000).toFixed(3)} km
          </p>
        </div>
      ) : (
        <p>Getting Location...</p>
      )}
    </main>
  );
}