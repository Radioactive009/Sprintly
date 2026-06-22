export interface RunSession {
  isRunning: boolean;
  startTime: number | null;
  elapsedTime: number;
  distance: number;

  currentSpeed: number;
  averageSpeed: number;

  currentPace: number;
  averagePace: number;
}