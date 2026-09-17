import type { PassiveDefinition } from '../contracts/status';
export const TIME_SANDS:PassiveDefinition={id:'time-sands',name:'ทรายจำบาดแผล',trigger:'stance-cast',description:'รอยกาลบันทึกเฉพาะดาเมจที่ได้รับจริงหลังติดตรา · ไม่บันทึกดาเมจซ้ำจากรอยกาล และไม่ทบตราจากผู้ใช้คนเดิม · การย้อนคืนไม่ชุบชีวิต ไม่ล้างสถานะ และไม่เพิ่ม HP เกินตอนเริ่มอัลติ',aura:{clipId:'time-aura',sizeScale:1.85,opacity:.85}};
import { scaledDamage } from '../config/combat';
export const FATE_WEAVER:PassiveDefinition={id:'fate-weaver',name:'ไหมชะตาพันกาย',trigger:'stance-cast',
 description:'เข็มฝากด้ายเฉพาะเป้าหมายที่รับดาเมจจริง รอจังหวะชิ่งกำแพงเพื่อกระตุกด้ายขาด · อัลติถักด้ายเดิมเสริมแรงกระตุกสุดท้าย ไม่มีการหยุดเคลื่อนที่หรือปิดสกิล',
 aura:{clipId:'thread-aura',sizeScale:1.8,opacity:.9}};
export const BELL_RESONANCE:PassiveDefinition={id:'bell-resonance',name:'กังวานสะสม',trigger:'stance-cast',description:'รับดาเมจจริงจากสกิลโดยตรงสะสมกังวานสูงสุด 3 ครั้ง เว้นอย่างน้อย 0.6 วินาทีต่อครั้ง · ไม่นับการชน พิษ เผาไหม้ หรือดาเมจตนเอง · รับคลื่นอัลติตนเองเพิ่ม 1 กังวานต่อคลื่น สูงสุด 3 แยกจากช่วงเว้นเมื่อรับดาเมจ · ใช้กังวานทั้งหมดขยายคลื่นสกิลปกติ ไม่มีแต้มก็ปล่อยคลื่นได้',aura:{clipId:'bell-aura',sizeScale:1.75,opacity:1}};
export const BEAM_FOCUS: PassiveDefinition={id:'beam-focus',name:'รวมจิตเป็นหนึ่ง',trigger:'stance-cast',
 description:'หยุดเคลื่อนที่ขณะชาร์จและปล่อยดัชนี · ช่วงชาร์จถูกดาเมจจริงจากศัตรูจะเสียสมาธิและยกเลิกท่า ใช้ชาร์จไปแล้ว · ดัชนีปกติโจมตีโดนสะสมเจตดัชนี 1 ครั้งต่อการยิง แม้โดนหลายเป้าหมาย',
 aura:{clipId:'beam-aura',sizeScale:1.75,opacity:1}};
export const GO_INSIGHT: PassiveDefinition={id:'go-insight',name:'อ่านหมากล่วงหน้า',trigger:'ability-hit',
 description:'ศัตรูตัดผ่านแนวหมากดำ–ขาวและรับดาเมจจริง ติดแต้มเสียเปรียบสูงสุด 3 แต้ม อยู่ 8 วินาที · ระเบิดปิดกระดานสลายแต้มเพิ่มดาเมจ · หมายแยกตามผู้วาง ไม่เกิดจากลูกหมากหรือเส้นอัลติ',
 aura:{clipId:'go-aura',sizeScale:1.75,opacity:.9},status:{id:'go-disadvantage',name:'เสียเปรียบ',durationTicks:480,stacking:'stack',maxStacks:3,sourceScoped:true,vfxColor:'#f6dc94',effect:{kind:'go-mark',basicId:'go-placement',ultimateId:'go-checkmate',bonusPerStack:4}}};
export const CRESCENT_SCAR: PassiveDefinition={id:'crescent-scar',name:'รอยจันทร์ร้าว',trigger:'ability-hit',
 description:'เคียวปกติที่โดนจริงฝากรอยจันทร์บนศัตรู 8 วินาที สูงสุด 3 ตรา แยกตามผู้ใช้ · อัลติที่โจมตีโดนสลายตราเพิ่มดาเมจ และแรงขึ้นเมื่อเป้าหมายที่มีตราเหลือ HP ไม่เกิน 35% · ตราไม่สร้างดาเมจเอง อัลติพลาดหรือถูกหลบไม่สลายตรา',
 aura:{clipId:'scythe-aura',sizeScale:1.8,opacity:1.1},status:{id:'crescent-scar',name:'รอยจันทร์',durationTicks:480,stacking:'stack',maxStacks:3,sourceScoped:true,vfxColor:'#cfb9ff',effect:{kind:'crescent-mark',basicId:'scythe-cleave',ultimateId:'scythe-eclipse',bonusPerStack:4,threshold:.35,lowHealthMultiplier:1.25}}};
export const CHAIN_RECOIL: PassiveDefinition={id:'chain-recoil',name:'แรงโซ่สะท้อน',trigger:'hook-contact',
  description:`เกี่ยวด้วยโซ่ปกติแล้วปะทะผู้ถูกเกี่ยวภายใน 0.8 วินาที เพิ่มดาเมจ ${scaledDamage(8)}–${scaledDamage(24)} HP ตามระยะเกี่ยว · ใช้ได้ครั้งเดียวต่อโซ่ หนีจนโซ่หมดเวลาหรือมีแท่นขวางจะหลุด`,
  aura:{clipId:'chain-aura',sizeScale:1.75,opacity:1.05}};

export const QIN_ECHO: PassiveDefinition = {
  id:'qin-echo',name:'เสียงก้องมิสิ้น',trigger:'projectile-wall',
  description:'คลื่นพิณสะท้อนกำแพงตามมุมจริงได้หนึ่งครั้ง ดาเมจหลังสะท้อนเหลือ 65% · คลื่นสลายเมื่อโดนเป้าหมายหรือแท่นกลาง · ไม่มีสตัน',
  aura:{clipId:'qin-aura',sizeScale:1.8,opacity:1.1},
};

export const INK_MEMORY: Extract<PassiveDefinition,{trigger:'field-contact'}> = {
  id:'ink-memory',name:'หมึกมิเลือน',trigger:'field-contact',
  description:'รอยหมึกอยู่ 8 วินาที · ศัตรูผ่านรอยติดเปื้อนหมึก 2 วินาที รับดาเมจวิชาของเจ้าของรอยเพิ่ม 15% ไม่ทบซ้อน ไม่เพิ่มดาเมจปะทะหรือวิชาของผู้อื่น',
  aura:{clipId:'ink-aura',sizeScale:1.8,opacity:1.15},
  status:{id:'ink-stain',name:'เปื้อนหมึก',durationTicks:120,stacking:'refresh',sourceScoped:true,
    effect:{kind:'source-ability-vulnerability',multiplier:1.15},vfxColor:'#d5b574'},
};

export const MIRROR_GUILE: PassiveDefinition = {
  id: 'mirror-guile', name: 'มายาลวงจิต', trigger: 'decoy-hit',
  description: 'ศัตรูชนหรือโจมตีร่างลวงแตก ได้เศษกระจก 1 ชิ้นต่อร่าง · ครบ 2 ชิ้นปลดอัลติ · ร่างลวงไม่สร้างดาเมจและหมดเวลาแล้วไม่ได้แต้ม',
  aura: { clipId: 'mirror-aura', sizeScale: 1.7, opacity: .85 },
};

export const FROST_VEIL: PassiveDefinition = {
  id: 'frost-veil', name: 'อาภรณ์หิมะ', trigger: 'collision-received', cooldownTicks: 150,
  description: 'เมื่อรับดาเมจปะทะจากตัวละคร ทำให้ผู้โจมตีเย็นเยียบ ลดความเร็ว 18% นาน 0.9 วินาที · เว้น 2.5 วินาทีต่อการทำงาน · ความเย็นจากวิถีเหมันต์ใช้เฉพาะผลที่แรงที่สุด ไม่ทบกัน',
  aura: { clipId: 'frost-aura', sizeScale: 1.95, opacity: 1.3 },
  status: { id: 'frost-veil', name: 'เย็นเยียบ', durationTicks: 54, stacking: 'refresh', effect: { kind: 'speed-modifier', reductionPerStack: .18, group: 'frost' }, vfxColor: '#a8d9ff' },
};

export const BLOOD_PULSE: PassiveDefinition = {
  id: 'blood-pulse', name: 'ชีพจรโลหิต', trigger: 'direct-damage',
  description: 'ดูดเลือดจากดาเมจปะทะและวิชาที่ทำได้จริง 28% เพิ่มตามสัดส่วน HP ที่ขาดได้อีก 27% · อัลติเพิ่มอีก 25% รวมไม่เกิน 80% · ฟื้นไม่เกิน 8% HP สูงสุดใน 1 วินาที · ไม่ดูดจากพิษ ภูต หรือดาเมจส่วนเกิน ไม่ฟื้นคืนจากการตาย',
  lifesteal: { baseRatio: .28, missingHPRatio: .27, maxRatio: .8, maxHPPerSecond: .08 },
  aura: { clipId: 'blood-aura', sizeScale: 1.75, opacity: .95 },
};

export const MOON_POISON: Extract<PassiveDefinition,{trigger:'basic-hit'|'ability-hit'}> = {
  id:'moon-poison',name:'พิษซึมปราณ',trigger:'basic-hit',
  description:`เข็มที่โดนจริงฝากพิษ ${scaledDamage(.7)} HP ต่อชั้นทุกวินาที นาน 9 วินาที · สูงสุด 4 ชั้น · ยิงซ้ำต่ออายุ · นับแยกผู้ใช้และเป้าหมาย ไม่ทบพิษหลายชั้นจากเข็มชุดเดียว · ลดการฟื้น HP ของเป้าหมาย 20% ไม่ทบตามชั้น`,
  aura:{clipId:'poison-aura',sizeScale:1.75,opacity:1.05},
  status:{id:'moon-poison',name:'พิษจันทรา',durationTicks:540,stacking:'stack',maxStacks:4,sourceScoped:true,
    effect:{kind:'periodic-damage',amount:.7,intervalTicks:60,healingMultiplier:.8},vfxClipId:'poison-aura',vfxColor:'#79dc99'},
};

export const LIGHTNING_BODY: PassiveDefinition = {
  id:'lightning-body', name:'กายาอัสนีไร้พันธนาการ', trigger:'distance',
  description:'เคลื่อนที่จริงทุก 160 WU สะสมกระแสอัสนี 1 ขั้น สูงสุด 3 · เพิ่มความเร็วขั้นละ 8% · เมื่อเต็ม ลดดาเมจชน 10% ต้านแรงผลักจากวิชา 85% และลดดาเมจแรงสะท้อนจากการถูกผลักชนกำแพง 65% · โจมตีปกติด้วยกระแสเต็มสำเร็จคงการป้องกันอีก 0.6 วินาที · ใช้กระแสทั้งหมดเมื่อโจมตี และหยุดสะสมระหว่างร่างอัสนี',
  aura:{clipId:'lightning-aura',sizeScale:1.8,opacity:1.15},
};

export const MOUNTAIN_ROOT: Extract<PassiveDefinition, { trigger: 'physics' }> = {
  id: 'mountain-root', name: 'รากฐานภูผา', trigger: 'physics', knockbackMultiplier: .55,
  description: 'รากฐานศิลาลดแรงผลักจากวิชา 45% · มวลที่มากช่วยต้านแรงปะทะและแรงดึง แต่ยังชน เด้ง และเคลื่อนที่ตามฟิสิกส์ · ไม่ลดดาเมจ',
  aura: { clipId: 'stone-aura', sizeScale: 2.12, opacity: 1.35 },
};

export const SHADOW_STEP: PassiveDefinition = {
  id: 'shadow-step', name: 'ย่างเงาไร้รอย', trigger: 'dash-cross',
  description: 'เมื่อกระบี่ตัดเงาพุ่งผ่านสำเร็จ ทิ้งเงารับคมไว้ 3 วินาที · ลดดาเมจการโจมตีครั้งถัดไป 65% ทั้งการชน วิชา กระสุน และอัลติ แล้วสลาย · ไม่ลดดาเมจสถานะ เช่น เผาไหม้ · รับได้ครั้งเดียว ไม่สะสมเงา',
  aura: { clipId: 'shadow-aura', sizeScale: 1.8, opacity: .9 },
  status: { id: 'shadow-guard', name: 'ไร้เงา', durationTicks: 180, stacking: 'refresh',
    effect: { kind: 'direct-guard', multiplier: .35 }, vfxClipId: 'shadow-aura', vfxColor: '#c6e5ff' },
};

export const SOLAR_QI: Extract<PassiveDefinition, { trigger: 'basic-hit' | 'ability-hit' }> = {
  id: 'solar-qi', name: 'ปราณเพลิง', description: `วิชาที่โจมตีโดนทำให้เผาไหม้ ${scaledDamage(2)} HP ทุก 1 วินาที นาน 3 วินาที โดนซ้ำต่ออายุ ไม่ทบความแรง`,
  trigger: 'ability-hit',
  aura: { clipId: 'solar-aura', sizeScale: 1.8, opacity: 1.3 },
  status: { id: 'burn', name: 'เผาไหม้', durationTicks: 180, stacking: 'refresh',
    effect: { kind: 'periodic-damage', amount: 2, intervalTicks: 60 }, vfxClipId: 'solar-aura' },
};

export const JADE_CURRENT: Extract<PassiveDefinition, { trigger: 'basic-hit' | 'ability-hit' }> = {
  id: 'jade-current', name: 'กระแสธารหยก', trigger: 'ability-hit',
  aura: { clipId: 'jade-current-aura', sizeScale: 1.9, opacity: 1.35 },
  description: 'วิชาที่โจมตีโดนทำให้เปียกชื้น 4 วินาที · สะสมสูงสุด 3 ชั้น ลดความเร็วชั้นละ 5% สูงสุด 15% · โดนซ้ำต่ออายุ โดยไม่เพิ่มดาเมจเอง',
  status: { id: 'wet', name: 'เปียกชื้น', durationTicks: 240, stacking: 'stack', maxStacks: 3,
    effect: { kind: 'speed-modifier', reductionPerStack: .05 }, vfxClipId: 'jade-current-aura', vfxColor: '#74ddd0' },
};

export const ASTRAL_SEAL: Extract<PassiveDefinition, { trigger: 'basic-hit' | 'ability-hit' }> = {
  id: 'astral-seal', name: 'ตราประทับดารา', trigger: 'basic-hit',
  description: 'ดาราตรึงนภาที่โดนจริงฝากตราดารา 8 วินาที · ครบ 3 ตราจะสลายตรา ดึงศัตรูเข้าหาผู้ใช้ชั่วครู่ และสะสมท่าไม้ตาย 1 ครั้ง · ตรานับแยกตามผู้ใช้',
  aura: { clipId: 'astral-orbit', sizeScale: 1.7, opacity: .85 },
  status: { id: 'astral-mark', name: 'ตราดารา', durationTicks: 480, stacking: 'stack', maxStacks: 3,
    effect: { kind: 'mark', pull: { radius: 1200, acceleration: 900, durationTicks: 18 } },
    vfxClipId: 'astral-orbit', vfxColor: '#c3a1ff' },
};

export const BLOSSOM_BOND: PassiveDefinition = {
  id: 'blossom-bond', name: 'พันธะวิญญาณบุปผา', trigger: 'summon-attachment',
  description: 'ภูตที่เกาะศัตรูไม่มี HP · ทุกการกระแทกจริงของผู้ถูกเกาะกับกำแพง แท่น หรือผู้ประลอง นับ 1 ครั้งต่อภูต · ครบ 4 ครั้งภูตสลายและจำนวนลดลง',
  aura: { clipId: 'blossom-aura', sizeScale: 1.65, opacity: .8 },
};
export const SPEAR_REACH: PassiveDefinition = {
  id:'spear-reach',name:'คมหอกเหนือระยะ',trigger:'weapon-tip',
  description:'หอกแหวกเมฆาที่โดนด้วยช่วงปลาย 35% ของแนวหอก สร้างดาเมจเพิ่ม 40% · ระยะประชิดไม่ได้โบนัส และแทงพลาดไม่สะสมเจตหอก',
  aura:{clipId:'spear-aura',sizeScale:1.85,opacity:1.1},
};

export const DRUNKEN_INSIGHT: PassiveDefinition = {
 id:'drunken-insight',name:'ยิ่งเมายิ่งรู้แจ้ง',trigger:'stance-cast',
 description:'ยกจอกเข้าสู่ก้าวเมาหลบเงาแต่ละครั้งสะสมฤทธิ์สุรา 1 จอก · ครบ 4 จอกปลดอัลติ · ตั้งท่าแล้วไม่มีใครชนยังได้จอก แต่ไม่มีหมัดสวน · ระหว่างอัลติไม่สะสมเพิ่ม',
 aura:{clipId:'drunken-aura',sizeScale:1.7,opacity:.85},
};

export const STAR_SIGHT: PassiveDefinition = {
 id:'star-sight',name:'เนตรล่าดารา',trigger:'ability-hit',
 description:'ศรปกติที่โดนจริงฝากตราดาว 8 วินาที สูงสุด 3 ตรา แยกตามผู้ยิงและเป้าหมาย · ศรถัดไปเมื่อครบ 3 ตรา หรือศรอัลติ จะสลายตรา เพิ่มดาเมจตราละ 2.28 HP · สลายครบ 3 ตราเปิดจุดอ่อน ให้รับศรจากผู้ยิงแรงขึ้น 20% นาน 2.5 วินาที · ยิงพลาดหรือถูกหลบไม่สลายตรา',
 aura:{clipId:'archer-aura',sizeScale:1.85,opacity:1.1},
 status:{id:'star-quarry',name:'ตราล่าดาว',durationTicks:480,stacking:'stack',maxStacks:3,sourceScoped:true,vfxColor:'#e9cc83',effect:{kind:'star-mark',basicId:'archer-step',ultimateId:'archer-skyfall',bonusPerStack:6}},
};

export const WIND_RESERVE: PassiveDefinition = {
 id:'wind-reserve',name:'เก็บวายุ',trigger:'guard-block',
 description:'เมื่อร่มอยู่ในมือ ลดดาเมจโดยตรง 25% · รับการโจมตีหรือขว้างร่มโดนจริงสะสมวายุ 1 ครั้ง เว้นร่วมกันอย่างน้อย 0.75 วินาที สูงสุด 3 และร่มแต่ละรอบให้แต้มได้ครั้งเดียว · ไม่ลดดาเมจพิษหรือไฟ ไม่กันสถานะควบคุม · ร่มลอยหรือถูกผนึกวิชาจะเสียการป้องกัน · ไม่สะสมระหว่างอัลติ',
 aura:{clipId:'umbrella-aura',sizeScale:1.8,opacity:.85},
};

export const FOX_CHARM:PassiveDefinition={id:'fox-charm',name:'เสน่ห์จิ้งจอก',trigger:'basic-hit',description:'เพลิงปกติที่โดนจริงทำให้หลงเสน่ห์ 2 วินาที · เบนทิศเข้าหาผู้ใช้เฉพาะ 0.6 วินาทีแรก ไม่หยุดกายหรือปิดสกิล · จังหวะสุดท้ายของอัลติแรงขึ้น 25% ต่อเป้าหมายที่ยังหลงเสน่ห์จากตน',status:{id:'fox-charm',name:'หลงเสน่ห์',durationTicks:120,stacking:'refresh',sourceScoped:true,effect:{kind:'charm',steerTicks:36,acceleration:900},vfxColor:'#ffc1be'},aura:{clipId:'fox-aura',sizeScale:1.9,opacity:.82}};

export const SCRIBE_MEMORY:PassiveDefinition={id:'scribe-memory',name:'อ่านร้อยวิชา',trigger:'stance-cast',description:'รับดาเมจจริงจากสกิลปกติของศัตรูแล้วจำวิชาล่าสุด 1 ช่อง · ไม่นับอัลติ พิษ เผาไหม้ หรือการชน · อัลติใช้บันทึกคืนรูปแบบวิชาโดยคุมดาเมจและระยะเวลา ไม่คัดลอกสถานะควบคุมหรือการฟื้นเลือด',aura:{clipId:'scribe-aura',sizeScale:1.9,opacity:.9}};

export const VOID_WALK:PassiveDefinition={id:'void-walk',name:'วงแหวนสุญญะ',trigger:'stance-cast',description:'ก้าวผ่านประตูแล้วพุ่งหาเป้าหมาย ประตูรับเฉพาะผู้ใช้และกระสุนของตน · กระสุนหนึ่งลูกผ่านได้ครั้งเดียว จุดออกถูกขวางจะยังไม่ใช้จำนวนครั้ง ไม่มีความเป็นอมตะระหว่างผ่านประตู',aura:{clipId:'portal-aura',sizeScale:1.8,opacity:1}};
export const SOUL_KEEPER:PassiveDefinition={id:'soul-keeper',name:'เชื้อวิญญาณ',trigger:'stance-cast',description:'โคมรับเคราะห์รับกระสุนหรือช่วยรับประชิดได้ครั้งเดียวต่อรอบ รับสำเร็จสะสมเชื้อวิญญาณ 1/3 เพื่อเพิ่มจำนวนภูตอัลติ · ไม่รับพิษหรือเผาไหม้ ไม่กันสถานะควบคุม และไม่มีการฟื้นเลือด',aura:{clipId:'lantern-aura',sizeScale:1.8,opacity:.9}};
