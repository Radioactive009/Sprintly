"use client";

import { useEffect, useRef, useState } from "react";
import { haversineDistance } from "@/lib/gps/haversine";
import { RunSession } from "@/types/run";
import { LocationPoint } from "@/types/location";

interface Location {
  lat: number;
  lng: number;
}

export default function RunPage() {
  const [location, setLocation] = useState<Location | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const [session, setSession] = useState<RunSession>({
    isRunning: false,
    startTime: null,
    elapsedTime: 0,
    distance: 0,
  });

  const [pathCoordinates, setPathCoordinates] = useState<
    LocationPoint[]
  >([]);

  const prevLocationRef = useRef<Location | null>(null);

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const currentAccuracy = position.coords.accuracy;

        setAccuracy(currentAccuracy);

        // Ignore bad GPS readings
        if (currentAccuracy > 20) {
          console.log(
            `Ignored GPS point. Accuracy too poor: ${currentAccuracy.toFixed(
              1
            )}m`
          );
          return;
        }

        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        if (session.isRunning) {
          const previousLocation = prevLocationRef.current;

          if (previousLocation) {
            const movedDistance = haversineDistance(
              previousLocation.lat,
              previousLocation.lng,
              newLocation.lat,
              newLocation.lng
            );

            console.log({
              accuracy: currentAccuracy,
              movedDistance,
            });

            // Ignore GPS jitter (<5m)
            // Ignore impossible jumps (>50m)
            if (
              movedDistance > 5 &&
              movedDistance < 50
            ) {
              setSession((prev) => ({
                ...prev,
                distance: prev.distance + movedDistance,
              }));

              setPathCoordinates((prev) => [
                ...prev,
                newLocation,
              ]);
            }
          }
        }

        prevLocationRef.current = newLocation;
        setLocation(newLocation);
      },
      (error) => {
        console.error(
          "GPS Error:",
          error.code,
          error.message
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [session.isRunning]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (session.isRunning) {
      interval = setInterval(() => {
        setSession((prev) => ({
          ...prev,
          elapsedTime: prev.elapsedTime + 1,
        }));
      }, 1000);
    }

    return () => {
      clearInterval(interval);
    };
  }, [session.isRunning]);

  const startRun = () => {
    setSession({
      isRunning: true,
      startTime: Date.now(),
      elapsedTime: 0,
      distance: 0,
    });

    setPathCoordinates([]);

    // Reset previous point
    prevLocationRef.current = location;
  };

  const stopRun = () => {
    setSession((prev) => ({
      ...prev,
      isRunning: false,
    }));

    console.log("Run Summary");
    console.log("Distance:", session.distance);
    console.log("GPS Points:", pathCoordinates.length);
    console.log("Path:", pathCoordinates);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(mins).padStart(2, "0")}:${String(
      secs
    ).padStart(2, "0")}`;
  };

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-5xl font-bold mb-8">
        Sprintly
      </h1>

      <div className="space-y-4 text-xl">
        <p>
          <strong>Status:</strong>{" "}
          {session.isRunning ? "🏃 Running" : "⏸️ Idle"}
        </p>

        <p>
          <strong>Distance:</strong>{" "}
          {(session.distance / 1000).toFixed(3)} km
        </p>

        <p>
          <strong>Time:</strong>{" "}
          {formatTime(session.elapsedTime)}
        </p>

        <p>
          <strong>GPS Points:</strong>{" "}
          {pathCoordinates.length}
        </p>

        <p>
          <strong>Accuracy:</strong>{" "}
          {accuracy !== null
            ? `${accuracy.toFixed(1)} m`
            : "Calculating..."}
        </p>

        {location && (
          <>
            <p>
              <strong>Latitude:</strong>{" "}
              {location.lat}
            </p>

            <p>
              <strong>Longitude:</strong>{" "}
              {location.lng}
            </p>
          </>
        )}
      </div>

      <div className="mt-8 flex gap-4">
        {!session.isRunning ? (
          <button
            onClick={startRun}
            className="bg-green-600 px-6 py-3 rounded-lg text-white font-semibold"
          >
            Start Run
          </button>
        ) : (
          <button
            onClick={stopRun}
            className="bg-red-600 px-6 py-3 rounded-lg text-white font-semibold"
          >
            Stop Run
          </button>
        )}
      </div>
    </main>
  );
}