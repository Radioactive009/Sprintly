"use client";

import { useEffect, useState, useRef } from "react";
import { haversineDistance } from "@/lib/gps/haversine";

interface Location {
  lat: number;
  lng: number;
}

export default function RunPage() {
  const [location, setLocation] = useState<Location | null>(null);
  const [previousLocation, setPreviousLocation] = useState<Location | null>(null);
  const [distance, setDistance] = useState(0);

  // Use a ref to avoid stale closure in the watchPosition callback
  const prevLocationRef = useRef<Location | null>(null);

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
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
        setPreviousLocation(newLocation);
        setLocation(newLocation);
      },
      (error) => {
        console.error(error);
      },
      {
        enableHighAccuracy: true,
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
        </>
      ) : (
        <p>Getting location...</p>
      )}
    </main>
  );
}