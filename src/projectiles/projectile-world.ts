import type { AbilityEvent, ProjectileSnapshot } from '../contracts/abilities';
import type { DamageRequest } from '../contracts/combat';
import type { ArenaDefinition, BodySnapshot } from '../contracts/types';
import type { Vec2 } from '../contracts/types';
export interface ProjectileTransit {time:number;position:Vec2;velocity:Vec2;commit:()=>void}
export interface ProjectileCapture {time:number;commit:()=>void}
import { sweepCircle } from './sweep';
import {vortexVelocity} from '../physics/vortex';
import type {VortexField} from '../contracts/forces';

type Emit = (event: Omit<AbilityEvent, 'id'>) => void;
export class ProjectileWorld {
  private windFields:readonly VortexField[]=[];
  setWindFields(fields:readonly VortexField[]){this.windFields=fields;}
  private projectiles: ProjectileSnapshot[] = [];
  private nextId = 1;
  private groupHits = new Map<string,Set<string>>();
  constructor(private readonly capacity: number,private readonly idPrefix='projectile') {}
  spawn(projectile: Omit<ProjectileSnapshot, 'id'>): boolean {
    if (this.projectiles.length >= this.capacity) return false;
    this.projectiles.push({ ...structuredClone(projectile), id: `${this.idPrefix}-${this.nextId++}` });
    return true;
  }
  removeOwners(living: ReadonlySet<string>) { this.projectiles = this.projectiles.filter(p => living.has(p.ownerId)); }
  clear() { this.projectiles = []; this.groupHits.clear(); }
  removeAbilities(ownerId:string, ids:ReadonlySet<string>){this.projectiles=this.projectiles.filter(p=>p.ownerId!==ownerId||!ids.has(p.abilityId));}
  step(tick: number, dt: number, arena: ArenaDefinition, bodies: readonly BodySnapshot[], emit: Emit, intercept?: (request: DamageRequest) => boolean, transit?: (p:ProjectileSnapshot,start:Vec2,end:Vec2)=>ProjectileTransit|undefined, capture?: (p:ProjectileSnapshot,start:Vec2,end:Vec2)=>ProjectileCapture|undefined): DamageRequest[] {
    const requests: DamageRequest[] = [];
    const consumedTargets = new Set<string>();
    this.projectiles = this.projectiles.filter(p => {
      const event = (kind: AbilityEvent['kind'], targetId?: string) => emit({ tick, ownerId: p.ownerId, abilityId: p.abilityId, projectileId:p.id, kind, point: { ...p.position }, targetId });
      if (!bodies.some(b => b.id === p.ownerId)) return false;
      if (tick >= p.expiresTick) { event('expired'); return false; }
      if(p.seeking && tick<p.seeking.endsTick) {
        const target=bodies.find(b=>b.id===p.seeking!.targetId&&b.id!==p.ownerId&&b.ownerId!==p.ownerId);
        if(target){const speed=Math.hypot(p.velocity.x,p.velocity.y),angle=Math.atan2(p.velocity.y,p.velocity.x);
          const aim=Math.atan2(target.position.y-p.position.y,target.position.x-p.position.x),difference=Math.atan2(Math.sin(aim-angle),Math.cos(aim-angle));
          const turn=Math.max(-p.seeking.turnRate*dt,Math.min(p.seeking.turnRate*dt,difference));
          p.velocity={x:Math.cos(angle+turn)*speed,y:Math.sin(angle+turn)*speed};}
      }
      let start = { ...p.position };
      p.velocity=vortexVelocity(p.position,p.velocity,this.windFields,dt);
      if (start.x < p.radius || start.x > arena.width - p.radius || start.y < p.radius || start.y > arena.height - p.radius) { event('wall'); return false; }
      let remaining = 1, elapsed = 0;
      p.previousPosition = { ...start };
      // Echoes sweep the remaining movement after a wall reflection, including corner hits.
      for (let segment = 0; segment < 12; segment++) {
      const delta = { x: p.velocity.x * dt * remaining, y: p.velocity.y * dt * remaining };
      const end = { x: start.x + delta.x, y: start.y + delta.y };
      let wallTime = Infinity;
      if (end.x < p.radius) wallTime = Math.min(wallTime, (p.radius - start.x) / delta.x);
      if (end.x > arena.width - p.radius) wallTime = Math.min(wallTime, (arena.width - p.radius - start.x) / delta.x);
      if (end.y < p.radius) wallTime = Math.min(wallTime, (p.radius - start.y) / delta.y);
      if (end.y > arena.height - p.radius) wallTime = Math.min(wallTime, (arena.height - p.radius - start.y) / delta.y);
      let blockedByObstacle = false;
      for (const obstacle of arena.obstacles ?? []) {
        const t = sweepCircle({ x: start.x - obstacle.center.x, y: start.y - obstacle.center.y },
          { x: end.x - obstacle.center.x, y: end.y - obstacle.center.y }, p.radius + obstacle.radius);
        if (t !== null && t < wallTime) { wallTime = t; blockedByObstacle = true; }
      }
      let hit: BodySnapshot | undefined;
      let time = wallTime;
      for (const body of [...bodies].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)) {
        if (p.hitTargets?.includes(body.id) || consumedTargets.has(body.id) || body.id === p.ownerId || body.ownerId === p.ownerId) continue;
        // A projectile created this tick starts after character movement.
        const origin = p.spawnedTick === tick ? body.position : body.previousPosition;
        const previous = {x:origin.x+(body.position.x-origin.x)*elapsed,y:origin.y+(body.position.y-origin.y)*elapsed};
        const t = sweepCircle({ x: start.x - previous.x, y: start.y - previous.y }, { x: end.x - body.position.x, y: end.y - body.position.y }, p.radius + body.radius);
        if (t !== null && t < time) { time = t; hit = body; }
      }
      const warp=transit?.(p,start,end);
      const caught=capture?.(p,start,end);
      if(caught && caught.time<=1 && caught.time<Math.min(time,warp?.time??Infinity)){caught.commit();return false;}
      // Only the earliest swept interaction wins. Never warp through a nearer hit or pillar.
      if(warp&&warp.time<time){warp.commit();p.position={...warp.position};p.previousPosition={...warp.position};p.velocity={...warp.velocity};return true;}
      p.position = { x: start.x + delta.x * Math.min(1, time), y: start.y + delta.y * Math.min(1, time) };
      if (hit) {
        if (p.hitGroup) {
          const hits=this.groupHits.get(p.hitGroup)??new Set<string>();
          if (hits.has(hit.id)) return false;
          hits.add(hit.id);this.groupHits.set(p.hitGroup,hits);
        }
        const request: DamageRequest = { tick, ...(p.maskStrike?{maskStrike:p.maskStrike}:{}), source: { kind: 'projectile', attackerId: p.ownerId, abilityId: p.abilityId, projectileId: p.id }, targetId: hit.id, amount: p.damage };
        if (intercept?.(request)) consumedTargets.add(hit.id);
        else requests.push(request);
        event('hit', hit.id);
        if((p.pierce??0)<=0)return false;
        p.pierce!--; (p.hitTargets??=[]).push(hit.id);
        elapsed+=remaining*time; remaining*=1-time; start={...p.position};
        if(remaining<=1e-8)return true;
        continue;
      }
      if (wallTime <= 1) {
        event(blockedByObstacle ? 'obstacle' : 'wall');
        if (blockedByObstacle || !p.reflection || p.reflection.remaining <= 0) return false;
        const epsilon = 1e-6;
        if ((p.position.x <= p.radius+epsilon && p.velocity.x < 0) || (p.position.x >= arena.width-p.radius-epsilon && p.velocity.x > 0)) p.velocity.x *= -1;
        if ((p.position.y <= p.radius+epsilon && p.velocity.y < 0) || (p.position.y >= arena.height-p.radius-epsilon && p.velocity.y > 0)) p.velocity.y *= -1;
        p.reflection.remaining--;
        p.damage *= p.reflection.damageMultiplier;
        elapsed += remaining * wallTime;
        remaining *= 1-wallTime;
        start = { ...p.position };
        p.previousPosition = { ...start };
        if (remaining <= epsilon) return true;
        continue;
      }
      return true;
      }
      return true;
    });
    const groups=new Set(this.projectiles.map(p=>p.hitGroup));
    for (const key of this.groupHits.keys()) if (!groups.has(key)) this.groupHits.delete(key);
    return requests;
  }
  snapshot() { return structuredClone(this.projectiles); }
}
