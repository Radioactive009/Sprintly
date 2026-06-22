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

    currentSpeed: 0,
    averageSpeed: 0,

    currentPace: 0,
    averagePace: 0,
  });

  const [pathCoordinates, setPathCoordinates] = useState<
    LocationPoint[]
  >([]);

  const prevLocationRef = useRef<Location | null>(null);
  const previousTimestampRef = useRef<number | null>(null);

  // GPS Tracking
  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const currentAccuracy = position.coords.accuracy;

        setAccuracy(currentAccuracy);

        // Ignore poor GPS readings
        if (currentAccuracy > 20) {
          return;
        }

        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        const currentTimestamp = position.timestamp;

        if (session.isRunning) {
          const previousLocation = prevLocationRef.current;
          const previousTimestamp =
            previousTimestampRef.current;

          if (
            previousLocation &&
            previousTimestamp
          ) {
            const movedDistance = haversineDistance(
              previousLocation.lat,
              previousLocation.lng,
              newLocation.lat,
              newLocation.lng
            );

            const timeDeltaSeconds =
              (currentTimestamp -
                previousTimestamp) /
              1000;

            // Ignore GPS jitter and teleportation
            if (
              movedDistance > 5 &&
              movedDistance < 50 &&
              timeDeltaSeconds > 0
            ) {
              const currentSpeed =
                (movedDistance /
                  timeDeltaSeconds) *
                3.6; // m/s -> km/h

              setSession((prev) => {
                const newDistance =
                  prev.distance +
                  movedDistance;

                const totalHours =
                  prev.elapsedTime / 3600;

                const averageSpeed =
                  totalHours > 0
                    ? newDistance /
                      1000 /
                      totalHours
                    : 0;

                const currentPace =
                  currentSpeed > 0
                    ? 60 / currentSpeed
                    : 0;

                const averagePace =
                  averageSpeed > 0
                    ? 60 / averageSpeed
                    : 0;

                return {
                  ...prev,
                  distance: newDistance,

                  currentSpeed,
                  averageSpeed,

                  currentPace,
                  averagePace,
                };
              });

              setPathCoordinates((prev) => [
                ...prev,
                newLocation,
              ]);
            }
          }
        }

        prevLocationRef.current = newLocation;
        previousTimestampRef.current =
          currentTimestamp;

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

  // Timer
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

      currentSpeed: 0,
      averageSpeed: 0,

      currentPace: 0,
      averagePace: 0,
    });

    setPathCoordinates([]);

    prevLocationRef.current = location;
    previousTimestampRef.current = Date.now();
  };

  const stopRun = () => {
    setSession((prev) => ({
      ...prev,
      isRunning: false,
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(mins).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

  const formatPace = (
    pace: number
  ) => {
    if (!pace || !isFinite(pace))
      return "--";

    const mins = Math.floor(pace);
    const secs = Math.round(
      (pace - mins) * 60
    );

    return `${mins}:${String(secs).padStart(
      2,
      "0"
    )} /km`;
  };

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-5xl font-bold mb-8">
        Sprintly
      </h1>

      <div className="space-y-4 text-xl">
        <p>
          <strong>Status:</strong>{" "}
          {session.isRunning
            ? "🏃 Running"
            : "⏸️ Idle"}
        </p>

        <p>
          <strong>Distance:</strong>{" "}
          {(session.distance / 1000).toFixed(
            3
          )}{" "}
          km
        </p>

        <p>
          <strong>Time:</strong>{" "}
          {formatTime(
            session.elapsedTime
          )}
        </p>

        <p>
          <strong>Current Speed:</strong>{" "}
          {session.currentSpeed.toFixed(
            2
          )}{" "}
          km/h
        </p>

        <p>
          <strong>Average Speed:</strong>{" "}
          {session.averageSpeed.toFixed(
            2
          )}{" "}
          km/h
        </p>

        <p>
          <strong>Current Pace:</strong>{" "}
          {formatPace(
            session.currentPace
          )}
        </p>

        <p>
          <strong>Average Pace:</strong>{" "}
          {formatPace(
            session.averagePace
          )}
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