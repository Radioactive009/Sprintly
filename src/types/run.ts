export interface RunSession {
  isRunning: boolean;
  startTime: number | null;
  elapsedTime: number;
  distance: number;

  averageSpeed: number;
  averagePace: number;
}