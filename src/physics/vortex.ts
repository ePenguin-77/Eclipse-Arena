import type {Vec2} from '../contracts/types';
import type {VortexField} from '../contracts/forces';

/** Pure steering shared by physics and projectiles. Eye and outside are unaffected.
 * Overlapping storms average their requested turn and share a single bounded budget. */
export function vortexVelocity(position:Vec2,velocity:Vec2,fields:readonly VortexField[],dt:number):Vec2 {
 const speed=Math.hypot(velocity.x,velocity.y);if(speed<1e-8||dt<=0||!fields.length)return velocity;
 const angle=Math.atan2(velocity.y,velocity.x);let turn=0,count=0;
 for(const f of fields){
  const dx=position.x-f.position.x,dy=position.y-f.position.y,r=Math.hypot(dx,dy);
  if(r<=f.eyeRadius||r>=f.radius)continue;
  const target=Math.atan2(dx,-dy),difference=Math.atan2(Math.sin(target-angle),Math.cos(target-angle));
  const edge=Math.min(1,(r-f.eyeRadius)/16,(f.radius-r)/16),limit=f.turnRate*edge*dt;
  turn+=Math.max(-limit,Math.min(limit,difference));count++;
 }
 if(!count)return velocity;
 const next=angle+Math.max(-3*dt,Math.min(3*dt,turn/count));
 return {x:Math.cos(next)*speed,y:Math.sin(next)*speed};
}
