import { NEUTRAL_BODY } from '../config/physics';
import { SeededRng } from '../core/seeded-rng';
import type { BodySpawn } from '../physics/body';
import type { BodyDefinition, Vec2 } from '../contracts/types';
import type { ArenaBlueprint } from '../contracts/arenas';
import { arenaSpawnPositions } from '../arenas/spawn-layout';
import { ARENAS } from './arenas';

export const SCENARIOS = [
  { id: 'duel', name: 'AW Opening', description: 'ฉากอ้างอิงมุมคงที่จาก Afterimage War · เลือกจำนวนตัวเพื่อเล่นแบบสุ่ม' },
  { id: 'chaos', name: 'Chaos Arena', description: 'สุ่มทิศออกตัวอิสระ 360° · กดจำนวนตัวหรือรอบใหม่เพื่อสุ่มอีกครั้ง' },
  { id: 'head-on', name: 'Head-on', description: 'ชนตรงแบบสมมาตร · ตรวจการสลับทิศและรักษาความเร็ว' },
  { id: 'glancing', name: 'Glancing', description: 'ชนเฉียง · ตรวจทิศทางหลัง Impulse' },
  { id: 'corner', name: 'Corner bounce', description: 'ชนผนังสองด้านพร้อมกัน · นับเป็นหนึ่ง Corner Event' },
  { id: 'mass', name: 'Unequal mass', description: 'ชนเฉียงระหว่าง Mass 1 กับ 1.45 · ค่าหนักอ้างอิง Crusher' },
  { id: 'overlap', name: 'Overlap recovery', description: 'เริ่มซ้อนกันเพื่อทดสอบการแยก Body และหลีกเลี่ยง NaN' },
  { id: 'speed', name: 'High speed', description: '950 WU/s อ้างอิงเพดาน Velocity · เปิด Substeps ตามระยะเดินทาง' },
] as const;
export type ScenarioId = typeof SCENARIOS[number]['id'];
export type ParticipantCount = 2 | 3 | 4;
export interface SandboxConfig { scenario: ScenarioId; count: ParticipantCount; seed: number; arenaId?: string; combatEnabled?: boolean; combatHP?: number[]; abilitiesEnabled?: boolean; abilityAutoCast?: boolean; characterIds?: string[]; artworkChoices?: Record<string,string> }
export const DEFAULT_CONFIG: SandboxConfig = { scenario: 'duel', count: 2, seed: 260912 };
export function scenarioPhysicsOverrides(scenario: ScenarioId, index: number): Partial<BodyDefinition> {
  if (scenario === 'speed') return { targetSpeed: 950, maxSpeed: 950, minSpeed: 295 };
  if (scenario === 'mass' && index === 1) return { mass: 1.45 };
  return {};
}
export function createScenario(config: SandboxConfig, arena: ArenaBlueprint = ARENAS[0]!): BodySpawn[] {
  if (config.arenaId && config.arenaId !== arena.id) throw new Error('Arena configuration mismatch');
  if (!arena.supportsDiagnostics && config.scenario !== 'chaos') throw new Error('This arena supports Chaos scenarios only');
  const spawn = (index: number, position: Vec2, direction: Vec2, overrides: Partial<BodySpawn> = {}): BodySpawn => ({
    ...NEUTRAL_BODY, id: `body-${index + 1}`, position, direction, ...overrides,
  });
  if (config.scenario === 'duel') return [spawn(0, { x: 140, y: 227.7 }, { x: 1, y: 0.65 }), spawn(1, { x: 332, y: 426.3 }, { x: -1, y: -0.55 })];
  if (config.scenario === 'chaos') {
    const rng = new SeededRng(config.seed);
    return arenaSpawnPositions(arena, config.count).map((position, index) => {
      // Independent headings break mirrored openings; every seed remains replayable.
      const angle = rng.next() * Math.PI * 2;
      return spawn(index, position, { x: Math.cos(angle), y: Math.sin(angle) });
    });
  }
  if (config.scenario === 'corner') return [spawn(0, { x: 90, y: 90 }, { x: -1, y: -1 }), spawn(1, { x: 382, y: 564 }, { x: 1, y: 1 })];
  if (config.scenario === 'overlap') return [spawn(0, { x: 236, y: 327 }, { x: 0, y: 1 }), spawn(1, { x: 236, y: 327 }, { x: 0, y: -1 })];
  const offset = config.scenario === 'glancing' || config.scenario === 'mass' ? 22 : 0;
  return [
    spawn(0, { x: 115, y: 327 - offset }, { x: 1, y: 0 }, scenarioPhysicsOverrides(config.scenario, 0)),
    spawn(1, { x: 357, y: 327 + offset }, { x: -1, y: 0 }, scenarioPhysicsOverrides(config.scenario, 1)),
  ];
}
