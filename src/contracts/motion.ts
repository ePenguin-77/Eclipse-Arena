export interface DashRequest {
  ownerId: string; targetId: string; abilityId: string; speed: number; durationTicks: number;
  direction?: { x: number; y: number };
  endOnCross?: boolean;
  /** Defaults to passing through the selected target; contact fighters keep collisions. */
  phaseTarget?: boolean;
}
export interface DashResult { ownerId: string; abilityId: string; crossed: boolean }
