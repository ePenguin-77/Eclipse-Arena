import { SOUL_KEEPER, TIME_SANDS, VOID_WALK } from './passives';
import { SCRIBE_MEMORY } from './passives';
import { FATE_WEAVER } from './passives';
import { FOX_CHARM } from './passives';
import { WIND_RESERVE, STAR_SIGHT, DRUNKEN_INSIGHT, CHAIN_RECOIL, SPEAR_REACH, QIN_ECHO, INK_MEMORY, MIRROR_GUILE, MOON_POISON, BLOOD_PULSE, FROST_VEIL } from './passives';
import type { CharacterDefinition } from '../contracts/characters';
import { CRESCENT_SCAR, GO_INSIGHT, BEAM_FOCUS, BELL_RESONANCE } from './passives';
import { NEUTRAL_BODY } from '../config/physics';
import { SOLAR_QI, JADE_CURRENT, ASTRAL_SEAL, BLOSSOM_BOND, SHADOW_STEP, MOUNTAIN_ROOT, LIGHTNING_BODY } from './passives';

// Presentation defaults remain independent of NEUTRAL_BODY.radius.
const STANDARD_VISUAL_RADIUS = 34;
const STANDARD_FACE_CROP = { x: 0.2, y: 0.02, size: 0.6 };

// Original xianxia prototypes; stable IDs preserve the existing shared loadouts.
const BASE_CHARACTERS: CharacterDefinition[] = [
  { id: 'vanguard', gender:'male',name: 'หยางเทียนหลง', epithet: 'จ้าวสุริยัน', discipline: 'วิถีสุริยันผลาญฟ้า', disciplineEn: 'SOLAR FLAME', role: 'ประชิด', description: 'เซียนสุริยันผู้ฝึกฝนฝ่ามือสะท้านฟ้า ทนทานและเชี่ยวชาญการปะทะระยะประชิด',
    stats: { maxHP: 115, damageMultiplier: 1 }, physics: { ...NEUTRAL_BODY, targetSpeed: 315, mass: 1.2 },
    kit: { passive: SOLAR_QI, basic: 'solar-palm', ultimate: 'solar-heavenfall' },
    abilityIds: ['solar-palm', 'solar-heavenfall'], visual: { radius: STANDARD_VISUAL_RADIUS, color: '#efa792', auraColor: '#ff573b', hudBackgroundAssetId: 'solar-frame-v3', hudBackgroundScaleY: 1.28, marker: 'diamond',
      artwork: { assetId: 'vanguard-aura-v1', width: 112, height: 112, anchor: { x: 0.5, y: 0.5 }, offset: { x: 0, y: 0 }, facing: 'fixed', portrait: { ...STANDARD_FACE_CROP } } } },
  { id: 'ranger', gender:'female',name: 'หลินชิงเยว่', epithet: 'เซียนธาราหยก', discipline: 'วิถีธาราหยก', disciplineEn: 'JADE CURRENT', role: 'ระยะไกล', description: 'เซียนหญิงแห่งธาราหยก เคลื่อนไหวคล่องแคล่ว ส่งดัชนีปราณทะลวงคู่ต่อสู้',
    stats: { maxHP: 105, damageMultiplier: 1 }, physics: { ...NEUTRAL_BODY, targetSpeed: 350, mass: 0.9 },
    kit: { passive: JADE_CURRENT, basic: 'jade-needle', ultimate: 'jade-nine-streams' },
    abilityIds: ['jade-needle', 'jade-nine-streams'], visual: { radius: STANDARD_VISUAL_RADIUS, color: '#74ddd0', auraColor: '#65dcb2', hudBackgroundAssetId: 'jade-frame-v3', hudBackgroundScaleY: 1.16, marker: 'ring',
      artwork: { assetId: 'ranger-aura-v1', width: 112, height: 112, anchor: { x: 0.5, y: 0.5 }, offset: { x: 0, y: 0 }, facing: 'fixed', portrait: { ...STANDARD_FACE_CROP } } } },
  { id: 'flux', gender:'male',name: 'เสิ่นซิงเหอ', epithet: 'ปราชญ์ดารา', discipline: 'วิถีดาราไร้ขอบเขต', disciplineEn: 'ASTRAL HEAVENS', role: 'ควบคุมพื้นที่', description: 'ปราชญ์ผู้หยั่งรู้วิถีดารา วางเขตระเบิด สะสมตราบนศัตรู และชักนำคู่ต่อสู้เข้าสู่ค่ายกลดารา',
    stats: { maxHP: 100, damageMultiplier: 1 }, physics: { ...NEUTRAL_BODY },
    kit: { passive: ASTRAL_SEAL, basic: 'astral-snare', ultimate: 'astral-prison' },
    abilityIds: ['astral-snare', 'astral-prison'], visual: { radius: STANDARD_VISUAL_RADIUS, color: '#b8acf0', auraColor: '#b291ff', hudBackgroundAssetId: 'astral-frame-v3', hudBackgroundScaleY: 1.2, marker: 'hexagon',
      artwork: { assetId: 'flux-aura-v1', width: 112, height: 112, anchor: { x: 0.5, y: 0.5 }, offset: { x: 0, y: 0 }, facing: 'fixed', portrait: { ...STANDARD_FACE_CROP } } } },
  { id: 'summoner', gender:'female',name: 'มู่หลิงซี', epithet: 'เซียนบุปผา', discipline: 'วิถีวิญญาณบุปผา', disciplineEn: 'BLOSSOM SPIRIT', role: 'อัญเชิญ',
    description: 'เซียนผู้ผูกพันกับวิญญาณบุปผา ฝากภูตเกาะศัตรูให้ครบสามตนแล้วระเบิดพันธะวิญญาณ ฝ่ายตรงข้ามสลายภูตได้ด้วยการกระแทก · การปะทะของตนเองไม่สร้างดาเมจ',
    stats: { maxHP: 110, damageMultiplier: 1, collisionDamageMultiplier: 0 }, physics: { ...NEUTRAL_BODY, targetSpeed: 320, mass: 1 },
    kit: { passive: BLOSSOM_BOND, basic: 'blossom-call', ultimate: 'blossom-myriad' },
    abilityIds: ['blossom-call', 'blossom-myriad'], visual: { radius: STANDARD_VISUAL_RADIUS, color: '#f4b2cf', auraColor: '#ef91bd', hudBackgroundAssetId: 'blossom-card-v1', hudBackgroundScaleY: 1.3, marker: 'ring',
      artwork: { assetId: 'summoner-aura-v1', width: 112, height: 112, anchor: { x: .5, y: .5 }, offset: { x: 0, y: 0 }, facing: 'fixed', portrait: { x: .2, y: .02, size: .6 } } } },
  { id: 'swordsman', gender:'male',name: 'เยี่ยอู๋เฉิน', epithet: 'กระบี่ไร้เงา', discipline: 'วิถีกระบี่ไร้เงา', disciplineEn: 'SHADOWLESS SWORD', role: 'พุ่งทะลวง',
    description: 'เซียนกระบี่ผู้เคลื่อนไหวดุจเงา ชนแล้วพุ่งผ่าน สั่งสมเจตกระบี่จากการโจมตีจริง ก่อนปลดปล่อยคมกระบี่ฟันรัวเจ็ดจังหวะ',
    stats: { maxHP: 100, damageMultiplier: 1 }, physics: { ...NEUTRAL_BODY, targetSpeed: 350, mass: 1 },
    kit: { passive: SHADOW_STEP, basic: 'shadow-cut', ultimate: 'shadow-myriad' },
    abilityIds: ['shadow-cut', 'shadow-myriad'], visual: { radius: STANDARD_VISUAL_RADIUS, color: '#c6e5ff', auraColor: '#c6e5ff', hudBackgroundAssetId: 'shadow-frame-v1', hudBackgroundScaleY: 1.2, marker: 'diamond',
      artwork: { assetId: 'swordsman-aura-v1', width: 112, height: 112, anchor: { x: .5, y: .5 }, offset: { x: 0, y: 0 }, facing: 'fixed', portrait: { x: .25, y: .045, size: .5 }, showcaseScale: 1.8 } } },
  { id: 'mountain', gender:'male',name: 'หลัวเจิ้นเยว่', epithet: 'จักรพรรดิศิลาดำ', discipline: 'วิถีภูผาอมตะ', disciplineEn: 'IMMORTAL MOUNTAIN', role: 'ตั้งรับและผลัก',
    description: 'เซียนเกราะศิลาผู้ใช้แรงปะทะผลักศัตรูเข้ากำแพง สะสมแรงสะท้อนเพื่อปลดปล่อยคลื่นภูผาทลายสวรรค์',
    stats: { maxHP: 125, damageMultiplier: 1 }, physics: { ...NEUTRAL_BODY, targetSpeed: 290, mass: 1.6 },
    kit: { passive: MOUNTAIN_ROOT, basic: 'mountain-palm', ultimate: 'mountain-heavenfall' }, abilityIds: ['mountain-palm', 'mountain-heavenfall'],
    visual: { radius: STANDARD_VISUAL_RADIUS, color: '#dfbf77', auraColor: '#d6aa51', hudBackgroundAssetId: 'mountain-frame-v1', hudBackgroundScaleY: 1.2, marker: 'hexagon',
      artwork: { assetId: 'mountain-portrait-v1', width: 112, height: 112, anchor: {x:.5,y:.5}, offset: {x:0,y:0}, facing: 'fixed', portrait: {x:.15,y:.06,size:.7} } } },
  {id:'lightning',gender:'male',name:'เหลยเทียนเซียว',epithet:'เทพบุตรทัณฑ์อัสนี',discipline:'วิถีอัสนีเก้าสวรรค์',disciplineEn:'NINE HEAVENS THUNDER',role:'ความเร็ว',
  description:'เซียนอัสนีผู้สะสมกระแสจากระยะทาง เร่งฝีเท้าก่อนปะทะ ต้านแรงผลักเมื่อกระแสเต็ม แล้วแปรกายปล่อยสายฟ้าขณะวิ่งเฉียดศัตรู',
  stats:{maxHP:105,damageMultiplier:1},physics:{...NEUTRAL_BODY,targetSpeed:350,minSpeed:300,maxSpeed:400,mass:.9},
  kit:{passive:LIGHTNING_BODY,basic:'lightning-strike',ultimate:'lightning-ninefold'},abilityIds:['lightning-strike','lightning-ninefold'],
  visual:{radius:STANDARD_VISUAL_RADIUS,color:'#a7cbff',auraColor:'#80baff',hudBackgroundAssetId:'lightning-frame-v1',hudBackgroundScaleY:1.2,marker:'diamond',
    artwork:{assetId:'lightning-portrait-v5',width:112,height:112,anchor:{x:.5,y:.5},offset:{x:0,y:0},facing:'fixed',portrait:{x:.15,y:.04,size:.6}}}},
  {id:'poison',gender:'female',name:'ถังเยว่หลี',epithet:'เซียนพิษจันทรา',discipline:'วิถีพิษเงาจันทร์',disciplineEn:'VENOM MOON',role:'พิษสะสม',
    description:'เซียนเข็มเงินผู้ซ่อนพิษไว้ในเงาจันทร์ ยิงเข็มสะสมพิษบนเป้าหมาย ก่อนระเบิดพิษสี่ชั้นเป็นท่าไม้ตาย',
    stats:{maxHP:95,damageMultiplier:1,collisionDamageMultiplier:.65},physics:{...NEUTRAL_BODY,targetSpeed:325,mass:.95},
    kit:{passive:MOON_POISON,basic:'poison-needles',ultimate:'poison-eclipse'},abilityIds:['poison-needles','poison-eclipse'],
    visual:{radius:STANDARD_VISUAL_RADIUS,color:'#92dcaa',auraColor:'#82e2a2',hudBackgroundAssetId:'poison-frame-v1',hudBackgroundScaleY:1.15,marker:'diamond',
      artwork:{assetId:'poison-portrait-v2',width:112,height:112,anchor:{x:.5,y:.5},offset:{x:0,y:0},facing:'fixed',portrait:{x:.245,y:0,size:.6}}}},
  { id: 'blood', gender:'female',name: 'เซวียหงเยียน', epithet: 'เซียนบัวโลหิต', discipline: 'วิถีโลหิตบัวแดง', disciplineEn: 'CRIMSON LOTUS', role: 'ดูดเลือดประชิด',
    description: 'เซียนบัวแดงผู้แลกโลหิตเพื่อกรีดวิญญาณศัตรู ดูดชีวิตคืนเมื่อโจมตีโดน และปลุกบัวโลหิตจากบาดแผลที่ได้รับ',
    stats: { maxHP: 105, damageMultiplier: 1 }, physics: { ...NEUTRAL_BODY, targetSpeed: 330, mass: 1 },
    kit: { passive: BLOOD_PULSE, basic: 'blood-petal', ultimate: 'blood-lotus' }, abilityIds: ['blood-petal', 'blood-lotus'],
    visual: { radius: STANDARD_VISUAL_RADIUS, color: '#f3a7ba', auraColor: '#e6537b', hudBackgroundAssetId: 'blood-frame-v1', hudBackgroundScaleY: 1.2, marker: 'ring',
      artwork: { assetId: 'blood-portrait-v3', width: 112, height: 112, anchor: { x: .5, y: .5 }, offset: { x: 0, y: 0 }, facing: 'fixed', portrait: { x: .18, y: .047, size: .64 } } } },
  { id: 'frost', gender:'female',name: 'ไป๋หนิงเสวี่ย', epithet: 'เซียนเหมันต์', discipline: 'วิถีเหมันต์นิรันดร์', disciplineEn: 'ETERNAL WINTER', role: 'กับดักและเขตน้ำแข็ง',
    description: 'เซียนพัดหิมะผู้วางดอกผลึกดักเส้นทางศัตรู สะสมพลังเหมันต์ก่อนเปิดวังวนเหมันต์และระเบิดผู้ที่ยังอยู่ในเขต',
    stats: { maxHP: 105, damageMultiplier: 1, collisionDamageMultiplier: .8 }, physics: { ...NEUTRAL_BODY, targetSpeed: 320, mass: .95 },
    kit: { passive: FROST_VEIL, basic: 'frost-flower', ultimate: 'frost-palace' }, abilityIds: ['frost-flower', 'frost-palace'],
    visual: { radius: STANDARD_VISUAL_RADIUS, color: '#c5e4ff', auraColor: '#a8d9ff', hudBackgroundAssetId: 'frost-frame-v1', hudBackgroundScaleY: 1.2, marker: 'hexagon',
      artwork: { assetId: 'frost-portrait-v1', width: 112, height: 112, anchor: { x: .5, y: .5 }, offset: { x: 0, y: 0 }, facing: 'fixed', portrait: { x: .19, y: .027, size: .6 } } } },
  { id: 'mirror', gender:'male',name: 'เซี่ยจิ่งหวน', epithet: 'คุณชายกระจกจันทร์', discipline: 'วิถีมายาพันกระจก', disciplineEn: 'THOUSAND MIRRORS', role: 'ร่างลวงและสลับตำแหน่ง',
    description: 'เซียนกระจกเจ้าเล่ห์ผู้สลับกายกับร่างลวง สะสมเศษกระจกเมื่อศัตรูโจมตีผิดตัว ก่อนล้อมเป้าหมายด้วยกระจกจันทร์สามบาน',
    stats: { maxHP: 110, damageMultiplier: 1, collisionDamageMultiplier: 1.1 }, physics: { ...NEUTRAL_BODY, targetSpeed: 340, mass: .9 },
    kit: { passive: MIRROR_GUILE, basic: 'mirror-double', ultimate: 'mirror-moonfall' }, abilityIds: ['mirror-double', 'mirror-moonfall'],
    visual: { radius: STANDARD_VISUAL_RADIUS, color: '#c3c7ff', auraColor: '#b9a5ef', hudBackgroundAssetId: 'mirror-frame-v1', hudBackgroundScaleY: 1.15, marker: 'diamond',
      artwork: { assetId: 'mirror-portrait-v1', width: 112, height: 112, anchor: { x: .5, y: .5 }, offset: { x: 0, y: 0 }, facing: 'fixed', portrait: { x: .273, y: .026, size: .51 } } } },
  {id:'ink',gender:'male',name:'ฉินมู่เหยียน',epithet:'จิตรกรลิขิตฟ้า',discipline:'วิถีหมึกเนรมิต',disciplineEn:'LIVING INK',role:'วาดรอยหมึกและปลุกมังกร',
    description:'บัณฑิตเซียนผู้จรดพู่กันเปลี่ยนลานประลองเป็นภาพวาด ทิ้งรอยหมึกบนเส้นทางคู่ต่อสู้ แล้วปลุกมังกรจากทุกเส้นที่วาดไว้',
    stats:{maxHP:110,damageMultiplier:1,collisionDamageMultiplier:.8},physics:{...NEUTRAL_BODY,targetSpeed:325,mass:.95},
    kit:{passive:INK_MEMORY,basic:'ink-brush',ultimate:'ink-dragon'},abilityIds:['ink-brush','ink-dragon'],
    visual:{radius:STANDARD_VISUAL_RADIUS,color:'#e8d6ac',auraColor:'#d8b878',hudBackgroundAssetId:'ink-frame-v1',hudBackgroundScaleY:1.5,marker:'diamond',
      artwork:{assetId:'ink-portrait-v1',width:112,height:112,anchor:{x:.5,y:.5},offset:{x:0,y:0},facing:'fixed',portrait:{x:.245,y:.064,size:.51}}}},
];
BASE_CHARACTERS.push({id:'qin',gender:'female',name:'เยว่หลิงอิน',epithet:'เซียนพิณกล่อมสวรรค์',discipline:'วิถีพิณสะท้านวิญญาณ',disciplineEn:'CELESTIAL RESONANCE',role:'คลื่นเสียงสะท้อน',
  description:'เซียนพิณผู้บรรเลงคลื่นเสียงให้สะท้อนทั่วลาน สะสมทำนองจากการโจมตี ก่อนปลดปล่อยเจ็ดสายประสานสวรรค์',
  stats:{maxHP:108,damageMultiplier:1,collisionDamageMultiplier:.8},physics:{...NEUTRAL_BODY,targetSpeed:330,mass:.95},
  kit:{passive:QIN_ECHO,basic:'qin-string',ultimate:'qin-sevenfold'},abilityIds:['qin-string','qin-sevenfold'],
  visual:{radius:STANDARD_VISUAL_RADIUS,color:'#bfd3ff',auraColor:'#b4ceff',hudBackgroundAssetId:'qin-frame-v1',hudBackgroundScaleY:1.2,marker:'ring',
    artwork:{assetId:'qin-portrait-v1',width:112,height:112,anchor:{x:.5,y:.5},offset:{x:0,y:0},facing:'fixed',portrait:{x:.246,y:.012,size:.52}}}});
export const DEFAULT_CHARACTER_IDS = ['vanguard', 'ranger', 'flux', 'summoner'];
BASE_CHARACTERS.push({id:'spear',gender:'male',name:'กู้ฉางเฟิง',epithet:'ขุนพลหอกเมฆา',discipline:'วิถีหอกผ่าสวรรค์',disciplineEn:'HEAVEN PIERCING SPEAR',role:'หอกระยะกลาง',
  description:'ขุนพลเซียนผู้คุมระยะด้วยคมหอก แทงปลายหอกทะลวงศัตรู สั่งสมเจตหอกก่อนพุ่งแหวกเมฆา แล้วระเบิดปราณเปิดนภาที่ปลายทาง',
  stats:{maxHP:110,damageMultiplier:1,collisionDamageMultiplier:.75},physics:{...NEUTRAL_BODY,targetSpeed:335,mass:1.05},
  kit:{passive:SPEAR_REACH,basic:'spear-cloud',ultimate:'spear-heaven'},abilityIds:['spear-cloud','spear-heaven'],
  visual:{radius:STANDARD_VISUAL_RADIUS,color:'#a6d9f3',auraColor:'#95caff',hudBackgroundAssetId:'spear-frame-v1',hudBackgroundScaleY:1.35,marker:'diamond',
    artwork:{assetId:'spear-portrait-v1',width:112,height:112,anchor:{x:.5,y:.5},offset:{x:0,y:0},facing:'fixed',portrait:{x:.27,y:.005,size:.46},showcaseScale:1.2}}});
// Preserve relative archetype speeds; scale all three bands together.
BASE_CHARACTERS.push({id:'chain',gender:'male',name:'จ้าวอู๋เจี๋ย',epithet:'เซียนโซ่พันธนาการ',discipline:'วิถีโซ่ตรึงมังกร',disciplineEn:'DRAGON BINDING CHAINS',role:'เกี่ยวและดึงเข้าปะทะ',
  description:'เซียนโซ่ผู้ช่วงชิงระยะห่าง เหวี่ยงตะขอเกี่ยวศัตรูแล้วดึงเข้าปะทะ ก่อนปล่อยโซ่หัวมังกรพันเป้าหมาย บีบรัดสองจังหวะแล้วขย้ำปิดท้าย',
  stats:{maxHP:115,damageMultiplier:1,collisionDamageMultiplier:.9},physics:{...NEUTRAL_BODY,targetSpeed:325,mass:1.15},
  kit:{passive:CHAIN_RECOIL,basic:'chain-hook',ultimate:'chain-dragons'},abilityIds:['chain-hook','chain-dragons'],
  visual:{radius:STANDARD_VISUAL_RADIUS,color:'#e9bc7a',auraColor:'#e4ac55',hudBackgroundAssetId:'chain-frame-v1',hudBackgroundScaleY:1.1,marker:'ring',
    artwork:{assetId:'chain-portrait-v1',width:112,height:112,anchor:{x:.5,y:.5},offset:{x:0,y:0},facing:'fixed',portrait:{x:.22,y:.02,size:.6},cataloguePortrait:{x:.335,y:.045,size:.4},showcaseScale:1.28,showcaseOffsetY:.03}}});
export const CHARACTER_MOVEMENT_SCALE = 1.2;
BASE_CHARACTERS.push({id:'drunken',gender:'male',name:'หานจิ่วเซิง',epithet:'เซียนเมรัยไร้พันธะ',discipline:'วิถีเมรัยหมื่นจอก',disciplineEn:'TEN THOUSAND CUPS',role:'โยกหลบและสวนกลับ',
 description:'เซียนพเนจรผู้ซ่อนวิชาหมัดไว้ในท่วงท่าเมามาย ยกจอกตั้งรับ เบี่ยงตัวหลบแรงปะทะแล้วสวนด้วยหมัดปราณ ก่อนปลดฤทธิ์สุราโลดแล่นทั่วลาน',
 stats:{maxHP:110,damageMultiplier:1,collisionDamageMultiplier:.85},physics:{...NEUTRAL_BODY,targetSpeed:335,mass:1},
 kit:{passive:DRUNKEN_INSIGHT,basic:'drunken-sway',ultimate:'drunken-heaven'},abilityIds:['drunken-sway','drunken-heaven'],
 visual:{radius:STANDARD_VISUAL_RADIUS,color:'#f2c275',auraColor:'#e9b560',hudBackgroundAssetId:'drunken-frame-v1',hudBackgroundScaleY:1.5,marker:'ring',
 artwork:{assetId:'drunken-portrait-v1',width:112,height:112,anchor:{x:.5,y:.5},offset:{x:0,y:0},facing:'fixed',portrait:{x:.2,y:.02,size:.6},cataloguePortrait:{x:.27,y:.025,size:.46},showcaseScale:1.18,showcaseOffsetY:.04}}});
BASE_CHARACTERS.push({id:'archer',gender:'female',name:'ลั่วซิงเหยา',epithet:'เซียนศรล่าดารา',discipline:'วิถีศรดารา',disciplineEn:'CELESTIAL STARBOW',role:'รักษาระยะและยิงทะลวง',
 description:'เซียนนักธนูผู้ฝากตราดาวไว้กับคมศร ก้าวถอยยิงสวนเมื่อศัตรูเข้าประชิด สั่งสมเจตศรก่อนปล่อยศรดาราทะลวงแนวรบและระเบิดตราบนเป้าหมาย',
 stats:{maxHP:96,damageMultiplier:1,collisionDamageMultiplier:.45},physics:{...NEUTRAL_BODY,targetSpeed:340,mass:.9},
 kit:{passive:STAR_SIGHT,basic:'archer-step',ultimate:'archer-skyfall'},abilityIds:['archer-step','archer-skyfall'],
 visual:{radius:STANDARD_VISUAL_RADIUS,color:'#d9dcff',auraColor:'#a8bfff',hudBackgroundAssetId:'archer-frame-v1',hudBackgroundScaleY:1.17,marker:'diamond',
 artwork:{assetId:'archer-portrait-v1',width:112,height:112,anchor:{x:.5,y:.5},offset:{x:0,y:0},facing:'fixed',portrait:{x:.16,y:.01,size:.6},showcaseScale:1.08}}});
BASE_CHARACTERS.push({id:'umbrella',gender:'female',name:'ซูหว่านถัง',epithet:'เซียนร่มบุปผา',discipline:'วิถีร่มหวนวายุ',disciplineEn:'RETURNING WIND PARASOL',role:'รับแรงและสวนกลับ',
 description:'เซียนร่มแดงผู้พลิกแรงโจมตีเป็นสายลม ขว้างร่มโค้งโจมตีทั้งขาไปและขากลับ รับแรงด้วยร่มในมือก่อนกางม่านวายุ สะสมแรงป้องกันแล้วสวนกลับรอบตัว',
 stats:{maxHP:108,damageMultiplier:1,collisionDamageMultiplier:.65},physics:{...NEUTRAL_BODY,targetSpeed:325,mass:1},
 kit:{passive:WIND_RESERVE,basic:'umbrella-return',ultimate:'umbrella-heaven'},abilityIds:['umbrella-return','umbrella-heaven'],
 visual:{radius:STANDARD_VISUAL_RADIUS,color:'#f5c6a3',auraColor:'#f4bc70',hudBackgroundAssetId:'umbrella-frame-v1',hudBackgroundScaleY:1.38,marker:'ring',
 artwork:{assetId:'umbrella-portrait-v1',width:112,height:112,anchor:{x:.5,y:.5},offset:{x:0,y:0},facing:'fixed',portrait:{x:.2,y:.015,size:.6},showcaseScale:1.08}}});
BASE_CHARACTERS.push({id:'scythe',gender:'female',name:'หนิงเยี่ยหลัน',epithet:'เซียนเคียวจันทร์ดับ',discipline:'วิถีเคียวจันทร์ดับ',disciplineEn:'ECLIPSE REAPER',role:'กวาดเคียวและปิดฉาก',
 description:'เซียนเคียวผู้ฝากรอยร้าวแห่งจันทร์ไว้ในแนวฟัน รักษาระยะปลายเคียวเพื่อกวาดศัตรู ก่อนพุ่งผ่านและฟันย้อนสลายตรา ปิดฉากผู้ที่บาดเจ็บด้วยจันทร์ดับ',
 stats:{maxHP:103,damageMultiplier:1,collisionDamageMultiplier:.8},physics:{...NEUTRAL_BODY,targetSpeed:335,mass:1},
 kit:{passive:CRESCENT_SCAR,basic:'scythe-cleave',ultimate:'scythe-eclipse'},abilityIds:['scythe-cleave','scythe-eclipse'],
 visual:{radius:STANDARD_VISUAL_RADIUS,color:'#d4c0f7',auraColor:'#c5a5ff',hudBackgroundAssetId:'scythe-frame-v1',hudBackgroundScaleY:1.05,marker:'ring',
 artwork:{assetId:'scythe-portrait-v1',width:112,height:112,anchor:{x:.5,y:.5},offset:{x:0,y:0},facing:'fixed',portrait:{x:.2,y:0,size:.6},showcaseScale:1.08,showcaseOffsetY:.075}}});
BASE_CHARACTERS.push({id:'go',gender:'male',name:'เผยจิ่นอัน',epithet:'เซียนหมากลิขิตชะตา',discipline:'วิถีหมากล้อมฟ้าดิน',disciplineEn:'HEAVEN AND EARTH GO',role:'วางหมากและตัดเส้นทาง',
 description:'เซียนหมากผู้มองทะลุเส้นทางคู่ต่อสู้ วางหมากดำ–ขาวเชื่อมแนวปราณ สั่งสมความเสียเปรียบจากทุกก้าวที่พลาด ก่อนปิดกระดานตัดชะตาด้วยหกหมาก',
 stats:{maxHP:108,damageMultiplier:1,collisionDamageMultiplier:.65},physics:{...NEUTRAL_BODY,targetSpeed:325,mass:1},
 kit:{passive:GO_INSIGHT,basic:'go-placement',ultimate:'go-checkmate'},abilityIds:['go-placement','go-checkmate'],
 visual:{radius:STANDARD_VISUAL_RADIUS,color:'#f2dfae',auraColor:'#e6c67e',hudBackgroundAssetId:'go-frame-v1',hudScene:{assetId:'go-hud-scene-v1',insetX:0.042,insetY:0.12},hudBackgroundScaleY:1.08,marker:'ring',
 artwork:{assetId:'go-portrait-v2',width:112,height:112,anchor:{x:.5,y:.5},offset:{x:0,y:0},facing:'fixed',portrait:{x:.26,y:0,size:.6},showcaseScale:1.05,showcaseOffsetY:.07}}});
BASE_CHARACTERS.push({id:'beam',gender:'male',name:'เซียวจิ่งเฉิน',epithet:'เซียนดัชนีสุญญะ',discipline:'วิถีดัชนีทะลวงสุญญะ',disciplineEn:'VOID PIERCING FINGER',role:'หยุดชาร์จและยิงลำแสง',
 description:'เซียนดัชนีผู้หยุดกายรวมปราณไว้ในจุดเดียว ก่อนปล่อยลำแสงทะลวงศัตรูถึงกำแพง ต้องรักษาสมาธิให้พ้นการโจมตี จึงเผยพลังดัชนีมหาสุญญะได้เต็มที่',
 stats:{maxHP:105,damageMultiplier:1,collisionDamageMultiplier:.55},physics:{...NEUTRAL_BODY,targetSpeed:325,mass:1},
 kit:{passive:BEAM_FOCUS,basic:'beam-finger',ultimate:'beam-void'},abilityIds:['beam-finger','beam-void'],
 visual:{radius:STANDARD_VISUAL_RADIUS,color:'#c1e9ff',auraColor:'#80d8ff',hudBackgroundAssetId:'beam-frame-v1',hudScene:{assetId:'beam-hud-scene-v1',insetX:0.05,insetY:0.15},hudBackgroundScaleY:1.1,marker:'ring',
 artwork:{assetId:'beam-portrait-v1',auraAssetId:'beam-portrait-aura-v1',width:112,height:112,anchor:{x:.5,y:.5},offset:{x:0,y:0},facing:'fixed',portrait:{x:.2,y:.015,size:.6},showcaseScale:1.05}}});
BASE_CHARACTERS.push({id:'bell',gender:'male',name:'เว่ยอวิ๋นโจว',epithet:'เซียนระฆังทอง',discipline:'วิถีระฆังสะท้านฟ้า',disciplineEn:'HEAVEN RESOUNDING BELL',role:'รับแรงและสวนคลื่นเสียง',
 description:'เซียนระฆังผู้เปลี่ยนแรงโจมตีเป็นกังวานสะสม ปล่อยคลื่นปราณขยายวงรอบตัว ก่อนวางมหาระฆังกลางสนามปล่อยเสียงพิพากษาสามจังหวะ รับคลื่นของตนเพื่อสะสมกังวาน',
 stats:{maxHP:113,damageMultiplier:1,collisionDamageMultiplier:.75},physics:{...NEUTRAL_BODY,targetSpeed:315,mass:1.15},kit:{passive:BELL_RESONANCE,basic:'bell-resound',ultimate:'bell-judgment'},abilityIds:['bell-resound','bell-judgment'],
 visual:{radius:STANDARD_VISUAL_RADIUS,color:'#efd299',auraColor:'#efce87',hudBackgroundAssetId:'bell-frame-v1',hudScene:{assetId:'bell-hud-scene-v1',insetX:0.045,insetY:0.13},hudBackgroundScaleY:1.08,marker:'ring',artwork:{assetId:'bell-portrait-v1',auraAssetId:'bell-portrait-aura-v1',width:112,height:112,anchor:{x:.5,y:.5},offset:{x:0,y:0},facing:'fixed',portrait:{x:.2,y:0,size:.6},showcaseScale:1.05,showcaseOffsetY:.05}}});
BASE_CHARACTERS.push({id:'fox',gender:'female',name:'หลีเยว่จิ่ว',epithet:'เซียนจิ้งจอกเก้าหาง',discipline:'วิถีจิ้งจอกเก้าหาง',disciplineEn:'NINE-TAILED FOX',role:'เสน่ห์ลวงและพุ่งล่า',
 description:'หญิงเซียนผู้ใช้เพลิงจิ้งจอกลวงทิศคู่ต่อสู้ ก่อนแผ่เก้าหางพุ่งล่าจากหลายมุม ทิ้งเพลิงภูตระเบิดตามรอยก้าว งดงามเจ้าเล่ห์และพร้อมลงโทษผู้หลงเสน่ห์',
 stats:{maxHP:103,damageMultiplier:1,collisionDamageMultiplier:.85},physics:{...NEUTRAL_BODY,targetSpeed:340,mass:.95},kit:{passive:FOX_CHARM,basic:'fox-flame',ultimate:'fox-ninefold'},abilityIds:['fox-flame','fox-ninefold'],
 visual:{radius:34,color:'#ffd7b0',auraColor:'#ffaebd',hudBackgroundAssetId:'fox-frame-v1',hudBackgroundScaleY:1.28,marker:'ring',artwork:{assetId:'fox-portrait-v1',width:112,height:112,anchor:{x:.5,y:.5},offset:{x:0,y:0},facing:'fixed',portrait:{x:.2,y:0,size:.6},showcaseScale:1.05,showcaseOffsetY:.05}}});
BASE_CHARACTERS.push({id:'scribe',gender:'female',name:'เหวินซูฉี',epithet:'บัณฑิตหมื่นวิชา',discipline:'วิถีคัมภีร์หมื่นวิชา',disciplineEn:'SCRIPTURE OF TEN THOUSAND ARTS',role:'บันทึกและคืนวิชา',
 description:'หญิงเซียนบัณฑิตผู้ใช้อักขระทะลวงปราณ บันทึกวิชาที่คู่ต่อสู้ฝากไว้บนกาย ก่อนเปิดคัมภีร์คืนกระบวนท่าในรูปแบบของตน ทุกคู่ประลองจึงเป็นบทเรียนใหม่',
 stats:{maxHP:106,damageMultiplier:1,collisionDamageMultiplier:.6},physics:{...NEUTRAL_BODY,targetSpeed:325,mass:1},kit:{passive:SCRIBE_MEMORY,basic:'scribe-glyph',ultimate:'scribe-return'},abilityIds:['scribe-glyph','scribe-return'],
 visual:{radius:STANDARD_VISUAL_RADIUS,color:'#e1d5a9',auraColor:'#88d5b5',hudBackgroundAssetId:'scribe-frame-v1',hudBackgroundScaleY:1.2,marker:'ring',artwork:{assetId:'scribe-portrait-v1',width:112,height:112,anchor:{x:.5,y:.5},offset:{x:0,y:0},facing:'fixed',portrait:{x:.24,y:0,size:.54},showcaseScale:1.05,showcaseOffsetY:.07}}});
BASE_CHARACTERS.push({id:'thread',gender:'female',name:'ถังเยียนหลัว',epithet:'เซียนไหมแดงผูกชะตา',discipline:'วิถีด้ายแดงชะตา',disciplineEn:'CRIMSON THREADS OF FATE',role:'ฝากด้ายและคุมจังหวะชิ่ง',
 description:'หญิงเซียนผู้ถักเส้นไหมเข้ากับชะตาคู่ต่อสู้ ฝากด้ายด้วยเข็มทองแล้วรอจังหวะชิ่งกำแพง ก่อนขึงด้ายผูกสนาม ทุกครั้งที่เส้นไหมตึงคือจังหวะพลิกชะตา',
 stats:{maxHP:105,damageMultiplier:1,collisionDamageMultiplier:.65},physics:{...NEUTRAL_BODY,targetSpeed:330,mass:.95},kit:{passive:FATE_WEAVER,basic:'thread-needle',ultimate:'thread-fate'},abilityIds:['thread-needle','thread-fate'],
 visual:{radius:STANDARD_VISUAL_RADIUS,color:'#f0b2a3',auraColor:'#ed677d',hudBackgroundAssetId:'thread-frame-v1',hudScene:{assetId:'thread-hud-scene-v1',insetX:0.04,insetY:0.14},hudBackgroundScaleY:1.05,marker:'ring',artwork:{assetId:'thread-portrait-v1',auraAssetId:'thread-portrait-aura-v1',width:112,height:112,anchor:{x:.5,y:.5},offset:{x:0,y:0},facing:'fixed',portrait:{x:.255,y:.005,size:.49},cataloguePortrait:{x:.275,y:.002,size:.425},hudPortrait:{x:.275,y:.005,size:.45},showcaseScale:1.24,showcaseOffsetY:.10}}});
BASE_CHARACTERS.push({id:'portal',gender:'female',name:'ลู่ชิงหลี',epithet:'เซียนสาวผู้พับฟ้า',discipline:'วิถีประตูสุญญะ',disciplineEn:'GATES OF THE VOID',role:'วาร์ปและเปลี่ยนทิศโจมตี',
 description:'เซียนผู้ก้าวข้ามระยะทางดุจเปิดม่าน พับช่องว่างเชื่อมสองฟากสนาม เคลื่อนกายผ่านประตูสุญญะ แล้วส่งคมมิติเข้าจู่โจมจากทิศที่คาดไม่ถึง',
 stats:{maxHP:108,damageMultiplier:1,collisionDamageMultiplier:.75},physics:{...NEUTRAL_BODY,targetSpeed:335,mass:.95},kit:{passive:VOID_WALK,basic:'portal-step',ultimate:'portal-fold'},abilityIds:['portal-step','portal-fold'],
 visual:{radius:STANDARD_VISUAL_RADIUS,color:'#b5e3ff',auraColor:'#78cfff',hudBackgroundAssetId:'portal-frame-v1',hudScene:{assetId:'portal-hud-scene-v1',insetX:0.053,insetY:0.17},hudBackgroundScaleY:1.24,marker:'ring',artwork:{assetId:'portal-portrait-v1',auraAssetId:'portal-portrait-aura-v1',width:112,height:112,anchor:{x:.5,y:.5},offset:{x:0,y:0},facing:'fixed',portrait:{x:.29,y:.005,size:.45},cataloguePortrait:{x:.29,y:.005,size:.45},hudPortrait:{x:.29,y:.005,size:.45},showcaseScale:1.18,showcaseOffsetY:.075}}});
BASE_CHARACTERS.push({id:'time',gender:'female',name:'เสิ่นสืออวี้',epithet:'เซียนทรายย้อนกาล',discipline:'วิถีทรายย้อนกาล',disciplineEn:'SANDS OF RETURN',role:'สะสมรอยกาลและย้อนคืน',
 description:'เซียนหญิงผู้ฟังเสียงเวลาในเม็ดทราย ฝากรอยกาลไว้บนบาดแผล ก่อนหวนคืนหนึ่งลมหายใจ นาฬิกาหยกบันทึกทางที่จากมา แล้วสลายเป็นคลื่นทรายทอง',
 stats:{maxHP:104,damageMultiplier:1,collisionDamageMultiplier:.7},physics:{...NEUTRAL_BODY,targetSpeed:325,mass:.95},kit:{passive:TIME_SANDS,basic:'time-sand',ultimate:'time-return'},abilityIds:['time-sand','time-return'],
 visual:{radius:STANDARD_VISUAL_RADIUS,color:'#e8d3b5',auraColor:'#c8a7ef',hudBackgroundAssetId:'time-frame-v1',hudScene:{assetId:'time-hud-scene-v1',insetX:0.04,insetY:0.145},hudBackgroundScaleY:1.24,marker:'ring',artwork:{assetId:'time-portrait-v1',auraAssetId:'time-portrait-aura-v1',width:112,height:112,anchor:{x:.5,y:.5},offset:{x:0,y:0},facing:'fixed',portrait:{x:.30,y:.005,size:.43},cataloguePortrait:{x:.30,y:.005,size:.43},hudPortrait:{x:.30,y:.005,size:.43},showcaseScale:1.26,showcaseOffsetY:.075}}});
BASE_CHARACTERS.push({id:'lantern',gender:'male',name:'เจียงเยี่ยหมิง',epithet:'ผู้เฝ้าประตูวิญญาณ',discipline:'วิถีตะเกียงกลืนวิญญาณ',disciplineEn:'SOUL DEVOURING LANTERN',role:'รับเคราะห์และปล่อยภูตสวน',
 description:'เซียนผู้ถือตะเกียงหยกดำ เคลื่อนผ่านม่านแพรปราณสีมรกต รับพลังโจมตีมาเป็นเชื้อวิญญาณ ก่อนเปิดโคมปล่อยขบวนภูตคืนเคราะห์แก่คู่ต่อสู้',
 stats:{maxHP:106,damageMultiplier:1,collisionDamageMultiplier:.75},physics:{...NEUTRAL_BODY,targetSpeed:315,mass:1},kit:{passive:SOUL_KEEPER,basic:'lantern-ward',ultimate:'lantern-souls'},abilityIds:['lantern-ward','lantern-souls'],
 visual:{radius:STANDARD_VISUAL_RADIUS,color:'#c6e6d3',auraColor:'#77dec7',hudBackgroundAssetId:'lantern-frame-v1',hudScene:{assetId:'lantern-hud-scene-v1',insetX:0.063,insetY:0.215},hudBackgroundScaleY:1.4,marker:'ring',artwork:{assetId:'lantern-portrait-v1',auraAssetId:'lantern-portrait-aura-v1',width:112,height:112,anchor:{x:.5,y:.5},offset:{x:0,y:0},facing:'fixed',portrait:{x:.33,y:.025,size:.35},cataloguePortrait:{x:.33,y:.025,size:.35},hudPortrait:{x:.33,y:.025,size:.35},showcaseScale:1.65,showcaseOffsetY:.08}}});
BASE_CHARACTERS.push({id:'feather',gender:'female',name:'ไป๋หลิงซู',epithet:'เซียนปีกเงินคืนฟ้า',discipline:'วิถีขนนกหวนฟ้า',disciplineEn:'RETURNING SILVER WINGS',role:'ฝากขนนกและเรียกกลับ',description:'เซียนอาภรณ์ขาวครามผู้ฝากขนเงินไว้ทั่วนภา ส่งคมขนนกผ่านคู่ต่อสู้ไปปักขอบสนาม ก่อนเรียกคืนทีละเล่ม ทุกก้าวของนางจึงเปลี่ยนเส้นทางที่ปีกเงินหวนกลับ',
 stats:{maxHP:108,damageMultiplier:1,collisionDamageMultiplier:.75},physics:{...NEUTRAL_BODY,targetSpeed:335,mass:.95},kit:{passive:{id:'silver-nest',name:'ขนนกฝากฟ้า',trigger:'stance-cast',description:'ขนนกปกติทะลุศัตรูแล้วปักกำแพง เก็บได้สูงสุด 5 เล่ม เล่มเก่าหายเมื่อเกินจำนวน · อัลติเรียกขนเงินกลับเข้าจุดที่ผู้ใช้อยู่ตอนปล่อยแต่ละเล่ม · ไม่มีการป้องกันหรือฟื้นเลือด',aura:{clipId:'feather-aura',sizeScale:1.8,opacity:.8}},basic:'feather-silver',ultimate:'feather-home'},abilityIds:['feather-silver','feather-home'],
 visual:{radius:STANDARD_VISUAL_RADIUS,color:'#dce7ff',auraColor:'#95b4ff',hudBackgroundAssetId:'feather-frame-v1',hudScene:{assetId:'feather-hud-scene-v1',insetX:0.055,insetY:0.14},hudBackgroundScaleY:1.12,marker:'ring',artwork:{assetId:'feather-portrait-v1',auraAssetId:'feather-portrait-aura-v1',width:112,height:112,anchor:{x:.5,y:.5},offset:{x:0,y:0},facing:'fixed',portrait:{x:.32,y:.035,size:.35},cataloguePortrait:{x:.32,y:.035,size:.35},hudPortrait:{x:.32,y:.035,size:.35},showcaseScale:1.8,showcaseOffsetY:.08}}});
BASE_CHARACTERS.push({id:'dream',gender:'female',name:'เมิ่งชิงเหยา',epithet:'เซียนผีเสื้อทอฝัน',discipline:'วิถีผีเสื้อห้วงฝัน',disciplineEn:'BUTTERFLIES OF THE DREAM',role:'สะสมฝันและปลุกปิดฉาก',description:'เซียนหญิงผู้ทอห้วงฝันด้วยปีกผีเสื้อ ฝากความง่วงงุนจนศัตรูเผลอหลับ ก่อนกางราตรีพันฝันแล้วส่งผีเสื้อปลุกวิญญาณ ทุกบาดแผลอาจปลุกคู่ต่อสู้ให้ตื่นก่อนถึงจังหวะปิดฉาก',
 stats:{maxHP:102,damageMultiplier:1,collisionDamageMultiplier:.65},physics:{...NEUTRAL_BODY,targetSpeed:325,mass:.95},kit:{passive:{id:'dream-weaver',name:'ฝันและตื่น',trigger:'stance-cast',description:'ผีเสื้อปกติโดนสะสมง่วงงุน 3 ชั้นแล้วหลับจนกว่าจะเสีย HP จริง · ดาเมจจริงทุกชนิดปลุกให้ตื่น · หลังตื่นต้านการหลับและง่วงงุน 2.5 วินาที · กระสุนที่ยิงไปแล้วไม่หาย',aura:{clipId:'dream-aura',sizeScale:1.8,opacity:.8}},basic:'dream-butterfly',ultimate:'dream-night'},abilityIds:['dream-butterfly','dream-night'],
 visual:{radius:STANDARD_VISUAL_RADIUS,color:'#e4d1f7',auraColor:'#c4a0e8',hudBackgroundAssetId:'dream-frame-v1',hudScene:{assetId:'dream-hud-scene-v1',insetX:0.05,insetY:0.13},hudBackgroundScaleY:1.12,marker:'ring',artwork:{assetId:'dream-portrait-v1',auraAssetId:'dream-portrait-aura-v1',width:112,height:112,anchor:{x:.5,y:.5},offset:{x:0,y:0},facing:'fixed',portrait:{x:.31,y:.02,size:.38},cataloguePortrait:{x:.31,y:.02,size:.38},hudPortrait:{x:.31,y:.02,size:.38},showcaseScale:1.5,showcaseOffsetY:.08}}});
BASE_CHARACTERS.push({id:'crystal',gender:'female',name:'เซี่ยอวี้หลัน',epithet:'เซียนผลึกเจ็ดประกาย',discipline:'วิถีผลึกหักนภา',disciplineEn:'HEAVEN REFRACTING CRYSTALS',role:'หักเหกระสุนและตัดทางหนี',description:'เซียนหญิงผู้มองเห็นทางแสงในทุกเหลี่ยมผลึก ฝากปริซึมไว้ริมขอบฟ้าแล้วหักเหหอกเป็นสามประกาย ก่อนเรียงผลึกเจ็ดเหลี่ยมให้ลำแสงชิ่งตัดผ่านนภาจากหลายทิศ',
 stats:{maxHP:105,damageMultiplier:1,collisionDamageMultiplier:.65},physics:{...NEUTRAL_BODY,targetSpeed:330,mass:.95},kit:{passive:{id:'crystal-refraction',name:'เหลี่ยมแสงแปรวิชา',trigger:'stance-cast',description:'หอกปกติทะลุศัตรูไปปักกำแพง เก็บปริซึมได้ 2 จุด · สลับยิงตรงกับยิงผ่านปริซึมที่มีทางเปิด แล้วแตกเป็น 3 แฉกเบาลง · หนึ่งชุดโดนศัตรูแต่ละตัวได้ครั้งเดียว เศษหอกไม่ปักผลึกหรือแตกซ้ำ',aura:{clipId:'crystal-aura',sizeScale:1.8,opacity:.8}},basic:'crystal-lance',ultimate:'crystal-heaven'},abilityIds:['crystal-lance','crystal-heaven'],
 visual:{radius:STANDARD_VISUAL_RADIUS,color:'#d6edff',auraColor:'#87d3ff',hudBackgroundAssetId:'crystal-frame-v1',hudScene:{assetId:'crystal-hud-scene-v1',insetX:0.065,insetY:0.2},hudBackgroundScaleY:1.12,marker:'diamond',artwork:{assetId:'crystal-portrait-v1',auraAssetId:'crystal-portrait-aura-v1',width:112,height:112,anchor:{x:.5,y:.5},offset:{x:0,y:0},facing:'fixed',portrait:{x:.29,y:.02,size:.42},cataloguePortrait:{x:.265,y:.005,size:.47},hudPortrait:{x:.28,y:.02,size:.44},showcaseScale:1.28,showcaseOffsetY:.08}}});
BASE_CHARACTERS.push({id:'cannon',gender:'female',name:'ฉีเยี่ยนซิน',epithet:'เซียนปืนเพลิงคราม',discipline:'วิถีปืนใหญ่เพลิงคราม',disciplineEn:'AZURE FLAME CANNON',role:'ยิงระเบิดและถอยด้วยแรงปืน',
 description:'เซียนหญิงผู้แบกปืนสำริดฝ่าแนวเมฆา รวมเพลิงครามไว้ในกระสุนแล้วอาศัยแรงถีบพลิกทิศร่างกาย ยิงสวนถอนระยะก่อนลั่นสามนัดทลายนภาจากตำแหน่งใหม่ทุกครั้ง',
 stats:{maxHP:104,damageMultiplier:1,collisionDamageMultiplier:.6},physics:{...NEUTRAL_BODY,targetSpeed:320,mass:1.05},kit:{passive:{id:'cannon-recoil',name:'แรงปืนพลิกเมฆา',trigger:'stance-cast',description:'ทุกนัดที่ยิงจริงเกิดแรงถีบสวนทิศปืน เปลี่ยนทิศเคลื่อนที่ตามฟิสิกส์ · ยังโดนโจมตีได้ตามปกติ',aura:{clipId:'cannon-aura',sizeScale:2.65,opacity:1.2}},basic:'cannon-round',ultimate:'cannon-salvo'},abilityIds:['cannon-round','cannon-salvo'],
 visual:{radius:STANDARD_VISUAL_RADIUS,color:'#badcff',auraColor:'#368cff',hudBackgroundAssetId:'cannon-frame-v1',hudBackgroundScaleY:1.12,hudScene:{assetId:'cannon-hud-scene-v1',insetX:.055,insetY:.16},marker:'ring',artwork:{assetId:'cannon-portrait-v1',auraAssetId:'cannon-portrait-aura-v1',width:112,height:112,anchor:{x:.5,y:.5},offset:{x:0,y:0},facing:'fixed',portrait:{x:.28,y:.055,size:.44},cataloguePortrait:{x:.30,y:.06,size:.37},hudPortrait:{x:.28,y:.055,size:.44},showcaseScale:1.4,showcaseOffsetY:.01}}});
BASE_CHARACTERS.push({id:'wind',gender:'female',name:'หลิ่วเยียนหนิง',epithet:'เซียนพัดบัญชาลม',discipline:'วิถีพัดหวนมรสุม',disciplineEn:'MONSOON FAN',role:'เบนวิถีและคุมวงพายุ',
 description:'เซียนหญิงผู้ฟังเสียงลมเหนือยอดหลิว ใช้พัดแพรหยกเปลี่ยนทิศคู่ต่อสู้ ก่อนเรียกมรสุมให้ทุกวิถีโค้งวน ผู้ใดอ่านกระแสลมออกย่อมพบความสงบในตาพายุ',
 stats:{maxHP:106,damageMultiplier:1,collisionDamageMultiplier:.6},physics:{...NEUTRAL_BODY,targetSpeed:325,mass:.95},kit:{passive:{id:'wind-current',name:'รำตามกระแส',trigger:'stance-cast',description:'พัดผลักคู่ต่อสู้ออกด้านข้าง · ระหว่างอัลติ ตัวเองรับแรงลมเช่นเดียวกับศัตรู แต่ไม่รับดาเมจจากพายุของตัวเอง',aura:{clipId:'wind-aura',sizeScale:2.2,opacity:1}},basic:'wind-fan',ultimate:'wind-monsoon'},abilityIds:['wind-fan','wind-monsoon'],
 visual:{radius:STANDARD_VISUAL_RADIUS,color:'#d4eee0',auraColor:'#90cbb9',hudBackgroundAssetId:'wind-frame-v1',hudBackgroundScaleY:1.12,hudScene:{assetId:'wind-hud-scene-v1',insetX:.06,insetY:.17},marker:'ring',artwork:{assetId:'wind-portrait-v1',auraAssetId:'wind-portrait-aura-v1',width:112,height:112,anchor:{x:.5,y:.5},offset:{x:0,y:0},facing:'fixed',portrait:{x:.27,y:.025,size:.46},cataloguePortrait:{x:.275,y:.012,size:.41},hudPortrait:{x:.27,y:.025,size:.46},showcaseScale:1.3,showcaseOffsetY:.03}}});
BASE_CHARACTERS.push({id:'thorn',gender:'female',name:'เยี่ยนจื่อหลิง',epithet:'เซียนบุปผาคมหนาม',discipline:'วิถีบุปผาหนามล้อมสังหาร',disciplineEn:'RAZOR BLOSSOM ENCLOSURE',role:'วางกับดักตามขอบกำแพง',
 description:'เซียนหญิงผู้ฝากบุปผาโลหะไว้ตามขอบสนาม รอจังหวะศัตรูเด้งเข้าคมหนาม ก่อนแผ่เถาปิดแนวกำแพง ทุกดอกที่บานคือทางหนีที่แคบลง ส่วนกลางลานยังเป็นช่องให้ผู้รู้ทันหลบพ้น',
 stats:{maxHP:108,damageMultiplier:1,collisionDamageMultiplier:0},physics:{...NEUTRAL_BODY,targetSpeed:325,mass:1.05},kit:{passive:{id:'thorn-petals',name:'กลีบคมรอผลิบาน',trigger:'stance-cast',description:'ตัวบอลชนแล้วไม่สร้างดาเมจ แต่ยังผลักและเด้งได้ตามปกติ · ดาเมจทั้งหมดมาจากดอกหนามเมื่อศัตรูชนขอบกำแพงจริง · ไม่ทำร้ายตัวเองหรือบริวารของตัวเอง · ถูกผนึกจะพักการทำงานของดอก',aura:{clipId:'thorn-aura',sizeScale:2.25,opacity:1}},basic:'thorn-plant',ultimate:'thorn-garden'},abilityIds:['thorn-plant','thorn-garden'],
 visual:{radius:STANDARD_VISUAL_RADIUS,color:'#ffc8c7',auraColor:'#c9536b',hudBackgroundAssetId:'thorn-frame-v1',hudBackgroundScaleY:1.12,hudScene:{assetId:'thorn-hud-scene-v1',insetX:.06,insetY:.18},marker:'ring',artwork:{assetId:'thorn-portrait-v1',auraAssetId:'thorn-portrait-aura-v1',width:112,height:112,anchor:{x:.5,y:.5},offset:{x:0,y:0},facing:'fixed',portrait:{x:.34,y:.02,size:.35},cataloguePortrait:{x:.34,y:.02,size:.35},hudPortrait:{x:.34,y:.02,size:.35},showcaseScale:1.5,showcaseOffsetY:.05}}});
BASE_CHARACTERS.push({id:'retrace',gender:'male',name:'เซียวมู่หาน',epithet:'เซียนกระบี่จดจำวิถี',discipline:'วิถีกระบี่ย้อนรอย',disciplineEn:'RETRACING SWORD',role:'ฝากกระบี่ตามรอยและย้อนทาง',
 description:'เซียนอาภรณ์ครามผู้ฝากเจตจำนงไว้ในทุกย่างก้าว กระบี่เงาตามทางที่เขาเพิ่งผ่าน ก่อนสามคมเงินย้อนคืนบนรอยเดิม แม้ร่างจะจากไป วิถีกระบี่ยังคงจดจำ',
 stats:{maxHP:110,damageMultiplier:1,collisionDamageMultiplier:.75},physics:{...NEUTRAL_BODY,targetSpeed:330,mass:1},kit:{passive:{id:'retrace-memory',name:'เศษกระบี่จำทาง',trigger:'stance-cast',description:'จดจำทางเดินจริงรวมการชิ่งและการปะทะ · กระบี่ไม่เปลี่ยนทางไล่ศัตรู · การย้ายตำแหน่งฉับพลันไม่สร้างเส้นโจมตีข้ามสนาม · ไม่ทำร้ายตัวเองหรือบริวารของตัวเอง',aura:{clipId:'retrace-aura',sizeScale:2.15,opacity:1.05}},basic:'retrace-follow',ultimate:'retrace-return'},abilityIds:['retrace-follow','retrace-return'],
 visual:{radius:STANDARD_VISUAL_RADIUS,color:'#d4e7ff',auraColor:'#82bde8',hudBackgroundAssetId:'retrace-frame-v1',hudBackgroundScaleY:1.12,hudScene:{assetId:'retrace-hud-scene-v1',insetX:.06,insetY:.18},marker:'ring',artwork:{assetId:'retrace-portrait-v2',auraAssetId:'retrace-portrait-aura-v1',width:112,height:112,anchor:{x:.5,y:.5},offset:{x:0,y:0},facing:'fixed',portrait:{x:.33,y:.075,size:.34},cataloguePortrait:{x:.335,y:.075,size:.33},hudPortrait:{x:.32,y:.025,size:.37},showcaseScale:1.6,showcaseOffsetY:.025}}});
BASE_CHARACTERS.push({id:'automaton',gender:'male',name:'โม่เทียนจี',epithet:'เซียนช่างกลบัญชาศึก',discipline:'วิถีหุ่นกลพันกลศึก',disciplineEn:'CELESTIAL AUTOMATON',role:'ป้อมยิงและหุ่นนักรบ',
 description:'เซียนช่างกลผู้ประสานปราณเข้ากับเฟืองสำริด ฝากหุ่นพิทักษ์ไว้คุมลานแล้วเติมพลังยามผ่านใกล้ ก่อนปลุกแขนจักรกลให้ออกไล่ล่า ทุกชิ้นส่วนล้วนมีวิถีของตน',
 stats:{maxHP:107,damageMultiplier:1,collisionDamageMultiplier:.7},physics:{...NEUTRAL_BODY,targetSpeed:320,mass:1.05},kit:{passive:{id:'automaton-refill',name:'เติมปราณจักรกล',trigger:'stance-cast',description:'ออกห่างป้อมเกิน 132 แล้วกลับผ่านในระยะ 96 เพื่อเติมพลังให้ชุดยิงถัดไป แรงขึ้น 30% และเจาะต่อได้อีก 2 เป้าหมาย · เก็บได้หนึ่งชุด เติมซ้ำได้ทุก 3 วินาที · ยืนแช่ข้างหุ่นไม่เติมซ้ำ · ไม่ฟื้น HP',aura:{clipId:'automaton-aura',sizeScale:2.1,opacity:1.1}},basic:'automaton-command',ultimate:'automaton-awaken'},abilityIds:['automaton-command','automaton-awaken'],
 visual:{radius:STANDARD_VISUAL_RADIUS,color:'#ecd3a2',auraColor:'#72cbd4',hudBackgroundAssetId:'automaton-frame-v1',hudBackgroundScaleY:1.12,hudScene:{assetId:'automaton-hud-scene-v1',insetX:.06,insetY:.18},marker:'ring',artwork:{assetId:'automaton-portrait-v1',auraAssetId:'automaton-portrait-aura-v1',width:112,height:112,anchor:{x:.5,y:.5},offset:{x:0,y:0},facing:'fixed',portrait:{x:.32,y:.05,size:.36},cataloguePortrait:{x:.32,y:.05,size:.36},hudPortrait:{x:.32,y:.025,size:.37},showcaseScale:1.5,showcaseOffsetY:.025}}});
BASE_CHARACTERS.push({id:'gates',gender:'male',name:'ลู่เหยียนโจว',epithet:'เซียนหมัดทะลวงขีดจำกัด',discipline:'วิถีหมัดแปดประตู',disciplineEn:'EIGHT CELESTIAL GATES',role:'สะสมประตูและระเบิดชุดหมัด',
 description:'นักยุทธ์ผู้ใช้สองหมัดเปิดประตูปราณในกาย ยิ่งต่อยเข้าเป้ายิ่งทะลวงขีดจำกัด ก่อนปลดปล่อยพลังที่สะสมเป็นชุดหมัดสะท้านฟ้า ทุกประตูที่เปิดล้วนมีราคาต้องจ่าย',
 stats:{maxHP:118,damageMultiplier:1,collisionDamageMultiplier:.55},physics:{...NEUTRAL_BODY,targetSpeed:320,mass:1.08},kit:{passive:{id:'gates-meridians',name:'แปดประตูในกาย',trigger:'stance-cast',description:'หมัดปกติที่ลด HP ศัตรูได้จริงเปิดประตูหนึ่งขั้น สูงสุด 8 · เพิ่มพลัง ระยะพุ่ง และความเข้มออร่า · ขั้น 5–6 ใช้วิชาเสีย 1 HP ขั้น 7–8 เสีย 2 HP เหลืออย่างน้อย 1 · อัลติใช้ประตูทั้งหมด ไม่ฟื้นเลือดหรือป้องกันดาเมจ',aura:{clipId:'gates-aura',sizeScale:2.25,opacity:1}},basic:'gates-strike',ultimate:'gates-unleash'},abilityIds:['gates-strike','gates-unleash'],
 visual:{radius:STANDARD_VISUAL_RADIUS,color:'#ffe2a1',auraColor:'#edb54f',hudBackgroundAssetId:'gates-frame-v1',hudBackgroundScaleY:1.12,hudScene:{assetId:'gates-hud-scene-v1',insetX:.06,insetY:.18},marker:'ring',artwork:{assetId:'gates-portrait-v1',width:112,height:112,anchor:{x:.5,y:.5},offset:{x:0,y:0},facing:'fixed',portrait:{x:.30,y:.065,size:.40},cataloguePortrait:{x:.30,y:.065,size:.40},hudPortrait:{x:.30,y:.04,size:.40},showcaseScale:1.4,showcaseOffsetY:.04}}});
BASE_CHARACTERS.push({id:'masks',gender:'male',name:'เสิ่นหลัวเซิง',epithet:'เซียนพันพักตร์',discipline:'วิถีหน้ากากสามวิญญาณ',disciplineEn:'THREE SPIRIT MASKS',role:'เปลี่ยนหน้ากากและเสริมวิญญาณ',
 description:'ใต้ใบหน้าสงบนิ่งซ่อนสามวิญญาณ พิโรธเข้าประชิด โศกส่งปราณไกล ยิ้มรับแรงแล้วสวนกลับ เมื่อปลุกหน้ากากทั้งสาม ทุกอารมณ์ล้วนกลายเป็นวิชาสังหาร',
 stats:{maxHP:104,damageMultiplier:1,collisionDamageMultiplier:.45},physics:{...NEUTRAL_BODY,targetSpeed:300,mass:1},kit:{passive:{id:'masks-cycle',name:'สามพักตร์หนึ่งวิญญาณ',trigger:'stance-cast',description:'หน้ากากวน พิโรธ → โศก → ยิ้ม ตามการออกท่าจริง · ไอคอนในวงตัวแสดงใบปัจจุบัน · อัลติทำให้หน้ากากสามใบล้อมออร่า ใช้แล้วดับทีละใบจนจบรอบ ไม่มีเวลาหมดระหว่างรอ และไม่สะสมอัลติรอบใหม่ระหว่างบัพ',aura:{clipId:'masks-aura',sizeScale:2.15,opacity:.9}},basic:'masks-shift',ultimate:'masks-awaken'},abilityIds:['masks-shift','masks-awaken'],
 visual:{radius:STANDARD_VISUAL_RADIUS,color:'#fff0d4',auraColor:'#d95752',hudBackgroundAssetId:'masks-frame-v1',hudBackgroundScaleY:1.12,hudScene:{assetId:'masks-hud-scene-v1',insetX:.06,insetY:.18},marker:'ring',artwork:{assetId:'masks-portrait-v1',width:112,height:112,anchor:{x:.5,y:.5},offset:{x:0,y:0},facing:'fixed',portrait:{x:.26,y:.06,size:.48},cataloguePortrait:{x:.26,y:.06,size:.48},hudPortrait:{x:.26,y:.035,size:.48},showcaseScale:1.3,showcaseOffsetY:.035}}});
export const PROTOTYPE_CHARACTERS: CharacterDefinition[] = BASE_CHARACTERS.map(c => ({...c,physics:{...c.physics,
  targetSpeed:Math.round(c.physics.targetSpeed * CHARACTER_MOVEMENT_SCALE),
  minSpeed:Math.round(c.physics.minSpeed * CHARACTER_MOVEMENT_SCALE),
  maxSpeed:Math.round(c.physics.maxSpeed * CHARACTER_MOVEMENT_SCALE)}}));
