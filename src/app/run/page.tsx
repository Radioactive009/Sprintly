"use client";

import { useEffect, useRef, useState } from "react";
import { haversineDistance } from "@/lib/gps/haversine";
import { RunSession } from "@/types/run";
import { RunSummary } from "@/types/run-summary";
import { LocationPoint } from "@/types/location";

interface Location {
  lat: number;
  lng: number;
}

export default function RunPage() {
  const [location, setLocation] = useState<Location | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const [summary, setSummary] =
    useState<RunSummary | null>(null);

  const [session, setSession] = useState<RunSession>({
    isRunning: false,
    startTime: null,
    elapsedTime: 0,
    distance: 0,
    averageSpeed: 0,
    averagePace: 0,
  });

  const [pathCoordinates, setPathCoordinates] = useState<
    LocationPoint[]
  >([]);

  const prevLocationRef = useRef<Location | null>(null);

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const currentAccuracy =
          position.coords.accuracy;

        setAccuracy(currentAccuracy);

        if (currentAccuracy > 20) {
          return;
        }

        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        if (session.isRunning) {
          const previousLocation =
            prevLocationRef.current;

          if (previousLocation) {
            const movedDistance =
              haversineDistance(
                previousLocation.lat,
                previousLocation.lng,
                newLocation.lat,
                newLocation.lng
              );

            if (
              movedDistance > 5 &&
              movedDistance < 50
            ) {
              setSession((prev) => ({
                ...prev,
                distance:
                  prev.distance +
                  movedDistance,
              }));

              setPathCoordinates((prev) => [
                ...prev,
                newLocation,
              ]);
            }
          }
        }

        prevLocationRef.current =
          newLocation;

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
      navigator.geolocation.clearWatch(
        watchId
      );
    };
  }, [session.isRunning]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (session.isRunning) {
      interval = setInterval(() => {
        setSession((prev) => {
          const newElapsedTime =
            prev.elapsedTime + 1;

          const distanceKm =
            prev.distance / 1000;

          const hours =
            newElapsedTime / 3600;

          const averageSpeed =
            hours > 0
              ? distanceKm / hours
              : 0;

          const averagePace =
            distanceKm > 0
              ? (newElapsedTime / 60) /
                distanceKm
              : 0;

          return {
            ...prev,
            elapsedTime:
              newElapsedTime,
            averageSpeed,
            averagePace,
          };
        });
      }, 1000);
    }

    return () => {
      clearInterval(interval);
    };
  }, [session.isRunning]);

  const startRun = () => {
    setSummary(null);

    setSession({
      isRunning: true,
      startTime: Date.now(),
      elapsedTime: 0,
      distance: 0,
      averageSpeed: 0,
      averagePace: 0,
    });

    setPathCoordinates([]);

    prevLocationRef.current =
      location;
  };

  const stopRun = () => {
    setSummary({
      distance: session.distance,
      elapsedTime: session.elapsedTime,
      averageSpeed:
        session.averageSpeed,
      averagePace:
        session.averagePace,
      gpsPoints:
        pathCoordinates.length,
    });

    setSession((prev) => ({
      ...prev,
      isRunning: false,
    }));
  };

  const formatTime = (
    seconds: number
  ) => {
    const mins = Math.floor(
      seconds / 60
    );
    const secs = seconds % 60;

    return `${String(mins).padStart(
      2,
      "0"
    )}:${String(secs).padStart(
      2,
      "0"
    )}`;
  };

  const formatPace = (
    pace: number
  ) => {
    if (
      pace === 0 ||
      !isFinite(pace)
    ) {
      return "--";
    }

    const mins = Math.floor(pace);

    const secs = Math.round(
      (pace - mins) * 60
    );

    return `${mins}:${String(
      secs
    ).padStart(2, "0")} /km`;
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
          {(
            session.distance / 1000
          ).toFixed(3)}{" "}
          km
        </p>

        <p>
          <strong>Time:</strong>{" "}
          {formatTime(
            session.elapsedTime
          )}
        </p>

        <p>
          <strong>
            Average Speed:
          </strong>{" "}
          {session.averageSpeed.toFixed(
            2
          )}{" "}
          km/h
        </p>

        <p>
          <strong>
            Average Pace:
          </strong>{" "}
          {formatPace(
            session.averagePace
          )}
        </p>

        <p>
          <strong>
            GPS Points:
          </strong>{" "}
          {pathCoordinates.length}
        </p>

        <p>
          <strong>
            Accuracy:
          </strong>{" "}
          {accuracy !== null
            ? `${accuracy.toFixed(
                1
              )} m`
            : "Calculating..."}
        </p>

        {location && (
          <>
            <p>
              <strong>
                Latitude:
              </strong>{" "}
              {location.lat}
            </p>

            <p>
              <strong>
                Longitude:
              </strong>{" "}
              {location.lng}
            </p>
          </>
        )}
      </div>

      {summary && (
        <div className="mt-10 border border-gray-700 bg-zinc-900 rounded-xl p-6">
          <h2 className="text-3xl font-bold mb-4">
            🏁 Run Complete
          </h2>

          <div className="space-y-2">
            <p>
              <strong>
                Distance:
              </strong>{" "}
              {(
                summary.distance /
                1000
              ).toFixed(3)}{" "}
              km
            </p>

            <p>
              <strong>
                Time:
              </strong>{" "}
              {formatTime(
                summary.elapsedTime
              )}
            </p>

            <p>
              <strong>
                Average Speed:
              </strong>{" "}
              {summary.averageSpeed.toFixed(
                2
              )}{" "}
              km/h
            </p>

            <p>
              <strong>
                Average Pace:
              </strong>{" "}
              {formatPace(
                summary.averagePace
              )}
            </p>

            <p>
              <strong>
                GPS Points:
              </strong>{" "}
              {summary.gpsPoints}
            </p>
          </div>
        </div>
      )}

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