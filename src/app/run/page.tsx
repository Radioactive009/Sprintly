"use client";

import { useEffect, useState, useRef } from "react";
import { haversineDistance } from "@/lib/gps/haversine";

interface Location {
  lat: number;
  lng: number;
}

export default function RunPage() {
  const [location, setLocation] = useState<Location | null>(null);
  const [distance, setDistance] = useState(0);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  // Use a ref to avoid stale closure in the watchPosition callback
  const prevLocationRef = useRef<Location | null>(null);

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setAccuracy(position.coords.accuracy);
        if (position.coords.accuracy > 20) {
          return;
        }

        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        const prev = prevLocationRef.current;
        if (prev) {
          const movedDistance = haversineDistance(
            prev.lat,
            prev.lng,
            newLocation.lat,
            newLocation.lng
          );

          // GPS jitter filter
          if (movedDistance > 5) {
            setDistance((prevDist) => prevDist + movedDistance);
          }
        }

        prevLocationRef.current = newLocation;
        setLocation(newLocation);
      },
      (error) => {
        console.error(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold">
        Sprintly
      </h1>

      {location ? (
        <>
          <p>Latitude: {location.lat}</p>
          <p>Longitude: {location.lng}</p>
          <p>Distance: {(distance / 1000).toFixed(2)} km</p>
          <p>Accuracy: {accuracy?.toFixed(1)} m</p>
        </>
      ) : (
        <p>Getting location...</p>
      )}
    </main>
  );
}
