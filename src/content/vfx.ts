import type {VfxDefinition} from '../contracts/vfx';
export const VFX_DEFINITION: VfxDefinition = {
  "clips": [
    {
      "id": "masks-aura",
      "assetId": "masks-aura-v2",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        2000
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "outsideBall": true,
      "rotationDegreesPerSecond": 7
    },
    {
      "id": "masks-strike",
      "assetId": "masks-strike-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        40,
        40,
        50,
        65,
        60,
        50,
        45,
        40
      ],
      "crossfadeMs": 10,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "aspectRatio": 1,
      "noTrail": true
    },
    {
      "id": "masks-sorrow",
      "assetId": "masks-sorrow-v2",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        50,
        50,
        55,
        70,
        60,
        55,
        50,
        50
      ],
      "crossfadeMs": 10,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "aspectRatio": 1,
      "noTrail": true
    },
    {
      "id": "masks-impact",
      "assetId": "masks-impact-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        40,
        40,
        45,
        65,
        65,
        55,
        50,
        45
      ],
      "crossfadeMs": 10,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "aspectRatio": 1
    },
    {
      "id": "gates-aura",
      "assetId": "gates-aura-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        2000
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "outsideBall": true,
      "rotationDegreesPerSecond": 8
    },
    {
      "id": "gates-punch",
      "assetId": "gates-punch-v2",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        40,
        40,
        40,
        55,
        55,
        45,
        40,
        40
      ],
      "crossfadeMs": 8,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "aspectRatio": 1,
      "noTrail": true
    },
    {
      "id": "gates-impact",
      "assetId": "gates-impact-v2",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        40,
        40,
        40,
        60,
        55,
        45,
        40,
        40
      ],
      "crossfadeMs": 10,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "aspectRatio": 1
    },
    {
      "id": "gates-finisher",
      "assetId": "gates-finisher-v2",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        40,
        40,
        50,
        80,
        75,
        65,
        50,
        45
      ],
      "crossfadeMs": 12,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "aspectRatio": 1,
      "noTrail": true
    },
    {
      "id": "automaton-aura",
      "assetId": "automaton-aura-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        2000
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "rotationDegreesPerSecond": 12,
      "outsideBall": true,
      "overlayClipId": "automaton-inner"
    },
    {
      "id": "automaton-inner",
      "assetId": "automaton-aura-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        2000
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "rotationDegreesPerSecond": -18,
      "outsideBall": true,
      "spriteScale": 0.8
    },
    {
      "id": "automaton-turret",
      "assetId": "automaton-turret-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        100,
        100,
        100,
        100,
        100,
        100,
        100,
        100
      ],
      "crossfadeMs": 15,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "noTrail": true
    },
    {
      "id": "automaton-warrior",
      "assetId": "automaton-warrior-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        80,
        80,
        80,
        80,
        80,
        80,
        80,
        80
      ],
      "crossfadeMs": 15,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "noTrail": true
    },
    {
      "id": "automaton-bolt",
      "assetId": "automaton-bolt-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        1000
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.65,
        "y": 0.5
      },
      "aspectRatio": 3,
      "noTrail": true
    },
    {
      "id": "automaton-impact",
      "assetId": "automaton-impact-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        40,
        50,
        60,
        80,
        80,
        70,
        60,
        50
      ],
      "crossfadeMs": 15,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "automaton-sweep",
      "assetId": "automaton-sweep-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        40,
        40,
        45,
        55,
        55,
        45,
        40,
        40
      ],
      "crossfadeMs": 10,
      "loop": false,
      "anchor": {
        "x": 0.3,
        "y": 0.5
      }
    },
    {
      "id": "retrace-aura",
      "assetId": "retrace-aura-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        2000
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "outsideBall": true
    },
    {
      "id": "retrace-sword",
      "assetId": "retrace-sword-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        1000
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.6,
        "y": 0.5
      },
      "aspectRatio": 3,
      "noTrail": true
    },
    {
      "id": "retrace-impact",
      "assetId": "retrace-impact-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        45,
        55,
        65,
        85,
        85,
        70,
        60,
        55
      ],
      "crossfadeMs": 15,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "thorn-aura",
      "assetId": "thorn-aura-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        2000
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "rotationDegreesPerSecond": 9,
      "outsideBall": true
    },
    {
      "id": "thorn-bud",
      "assetId": "thorn-bud-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        120,
        120,
        120,
        120,
        120,
        120,
        120,
        120
      ],
      "crossfadeMs": 25,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "noTrail": true
    },
    {
      "id": "thorn-strike",
      "assetId": "thorn-strike-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        45,
        55,
        65,
        85,
        85,
        70,
        60,
        55
      ],
      "crossfadeMs": 15,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "thorn-hedge",
      "assetId": "thorn-hedge-v1",
      "columns": 1,
      "rows": 4,
      "frameMs": [
        170,
        170,
        170,
        170
      ],
      "crossfadeMs": 40,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "frameAnchors": [
        {
          "x": 0.5,
          "y": 0.62
        },
        {
          "x": 0.5,
          "y": 0.5
        },
        {
          "x": 0.5,
          "y": 0.5
        },
        {
          "x": 0.5,
          "y": 0.5
        }
      ],
      "aspectRatio": 3
    },
    {
      "id": "wind-aura",
      "assetId": "wind-aura-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        2000
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "rotationDegreesPerSecond": 16,
      "outsideBall": true
    },
    {
      "id": "wind-sweep",
      "assetId": "wind-sweep-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        40,
        45,
        50,
        65,
        65,
        60,
        55,
        50
      ],
      "crossfadeMs": 15,
      "loop": false,
      "anchor": {
        "x": 0.3,
        "y": 0.5
      }
    },
    {
      "id": "wind-storm",
      "assetId": "wind-storm-v2",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        100,
        100,
        100,
        100,
        100,
        100,
        100,
        100
      ],
      "crossfadeMs": 30,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "rotationDegreesPerSecond": 20
    },
    {
      "id": "wind-impact",
      "assetId": "wind-impact-v2",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        40,
        45,
        60,
        75,
        75,
        65,
        55,
        50
      ],
      "crossfadeMs": 15,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "cannon-aura",
      "assetId": "cannon-aura-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        2000
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "rotationDegreesPerSecond": 10,
      "outsideBall": true
    },
    {
      "id": "cannon-bolt",
      "assetId": "cannon-bolt-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        65,
        65,
        65,
        65,
        65,
        65,
        65,
        65
      ],
      "crossfadeMs": 15,
      "loop": true,
      "anchor": {
        "x": 0.72,
        "y": 0.59
      },
      "noTrail": true
    },
    {
      "id": "cannon-heavy",
      "assetId": "cannon-heavy-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        65,
        65,
        65,
        65,
        65,
        65,
        65,
        65
      ],
      "crossfadeMs": 15,
      "loop": true,
      "anchor": {
        "x": 0.75,
        "y": 0.49
      },
      "noTrail": true
    },
    {
      "id": "cannon-muzzle",
      "assetId": "cannon-muzzle-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        40,
        40,
        40,
        45,
        45,
        40,
        40,
        40
      ],
      "crossfadeMs": 10,
      "loop": false,
      "anchor": {
        "x": 0.23,
        "y": 0.54
      }
    },
    {
      "id": "cannon-impact",
      "assetId": "cannon-impact-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        40,
        50,
        65,
        80,
        80,
        70,
        60,
        55
      ],
      "crossfadeMs": 15,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "crystal-aura",
      "assetId": "crystal-aura-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        2000
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "rotationDegreesPerSecond": 9,
      "outsideBall": true
    },
    {
      "id": "crystal-prism",
      "assetId": "crystal-prism-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        90,
        90,
        90,
        90,
        90,
        90,
        90,
        90
      ],
      "crossfadeMs": 20,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "fixedOrientation": true,
      "noTrail": true
    },
    {
      "id": "crystal-bolt",
      "assetId": "crystal-bolt-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        65,
        65,
        65,
        65,
        65,
        65,
        65,
        65
      ],
      "crossfadeMs": 15,
      "loop": true,
      "anchor": {
        "x": 0.84,
        "y": 0.5
      },
      "noTrail": true
    },
    {
      "id": "crystal-impact",
      "assetId": "crystal-impact-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        45,
        55,
        65,
        75,
        75,
        65,
        60,
        50
      ],
      "crossfadeMs": 15,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "crystal-beam",
      "assetId": "crystal-beam-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        60,
        60,
        60,
        60,
        60,
        60,
        60,
        60
      ],
      "crossfadeMs": 15,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "dream-aura",
      "assetId": "dream-aura-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        2000
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "rotationDegreesPerSecond": 8,
      "outsideBall": true
    },
    {
      "id": "dream-bolt",
      "assetId": "dream-bolt-v2",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        70,
        70,
        70,
        70,
        70,
        70,
        70,
        70
      ],
      "crossfadeMs": 15,
      "loop": true,
      "anchor": {
        "x": 0.63,
        "y": 0.5
      },
      "noTrail": true
    },
    {
      "id": "dream-impact",
      "assetId": "dream-impact-v2",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        45,
        55,
        65,
        85,
        80,
        70,
        65,
        60
      ],
      "crossfadeMs": 15,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "dream-wave",
      "assetId": "dream-wave-v2",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        75,
        75,
        75,
        75,
        75,
        75,
        75,
        75
      ],
      "crossfadeMs": 15,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "feather-aura",
      "assetId": "feather-aura-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        2000
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "rotationDegreesPerSecond": 12,
      "outsideBall": true
    },
    {
      "id": "feather-bolt",
      "assetId": "feather-bolt-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        80,
        80,
        80,
        80,
        80,
        80,
        80,
        80
      ],
      "crossfadeMs": 20,
      "loop": true,
      "anchor": {
        "x": 0.88,
        "y": 0.5
      },
      "noTrail": true
    },
    {
      "id": "feather-impact",
      "assetId": "feather-impact-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        45,
        55,
        65,
        85,
        75,
        65,
        60,
        50
      ],
      "crossfadeMs": 20,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "lantern-aura",
      "assetId": "lantern-aura-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        2000
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "rotationDegreesPerSecond": 10,
      "outsideBall": true
    },
    {
      "id": "lantern-lamp",
      "assetId": "lantern-lamp-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        100,
        100,
        100,
        100,
        100,
        100,
        100,
        100
      ],
      "crossfadeMs": 25,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "noTrail": true,
      "fixedOrientation": true
    },
    {
      "id": "lantern-spirit",
      "assetId": "lantern-spirit-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        80,
        80,
        80,
        80,
        80,
        80,
        80,
        80
      ],
      "crossfadeMs": 20,
      "loop": true,
      "anchor": {
        "x": 0.85,
        "y": 0.5
      },
      "noTrail": true
    },
    {
      "id": "lantern-impact",
      "assetId": "lantern-impact-v2",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        45,
        55,
        65,
        85,
        75,
        65,
        60,
        50
      ],
      "crossfadeMs": 20,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "time-aura",
      "assetId": "time-aura-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        2000
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "rotationDegreesPerSecond": -12,
      "outsideBall": true
    },
    {
      "id": "time-bolt",
      "assetId": "time-bolt-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        80,
        80,
        80,
        80,
        80,
        80,
        80,
        80
      ],
      "crossfadeMs": 20,
      "loop": true,
      "anchor": {
        "x": 0.78,
        "y": 0.5
      },
      "noTrail": true
    },
    {
      "id": "time-hourglass",
      "assetId": "time-hourglass-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        2000
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "noTrail": true
    },
    {
      "id": "time-impact",
      "assetId": "time-impact-v2",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        45,
        55,
        65,
        85,
        75,
        65,
        60,
        50
      ],
      "crossfadeMs": 20,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "portal-aura",
      "assetId": "portal-aura-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        2000
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "rotationDegreesPerSecond": 16,
      "outsideBall": true
    },
    {
      "id": "portal-gate",
      "assetId": "portal-gate-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        90,
        90,
        90,
        90,
        90,
        90,
        90,
        90
      ],
      "crossfadeMs": 25,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "noTrail": true
    },
    {
      "id": "portal-impact",
      "assetId": "portal-impact-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        45,
        55,
        65,
        85,
        70,
        60,
        60,
        60
      ],
      "crossfadeMs": 20,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "thread-aura",
      "assetId": "thread-aura-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        2000
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "rotationDegreesPerSecond": 14,
      "outsideBall": true
    },
    {
      "id": "thread-cord",
      "assetId": "thread-cord-v1",
      "columns": 1,
      "rows": 8,
      "frameMs": [
        90,
        90,
        90,
        90,
        90,
        90,
        90,
        90
      ],
      "crossfadeMs": 30,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "aspectRatio": 8
    },
    {
      "id": "thread-needle",
      "assetId": "thread-needle-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        1000
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.92,
        "y": 0.46
      },
      "aspectRatio": 3,
      "noTrail": true
    },
    {
      "id": "thread-impact",
      "assetId": "thread-impact-v2",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        45,
        55,
        65,
        85,
        75,
        65,
        55,
        55
      ],
      "crossfadeMs": 20,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "scribe-aura",
      "assetId": "scribe-aura-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        2000
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "rotationDegreesPerSecond": 16,
      "outsideBall": true
    },
    {
      "id": "scribe-glyph",
      "assetId": "scribe-glyph-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        1000
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.7,
        "y": 0.5
      },
      "noTrail": true
    },
    {
      "id": "scribe-impact",
      "assetId": "scribe-impact-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        400
      ],
      "crossfadeMs": 0,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "fox-flame",
      "assetId": "fox-flame-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        600
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.8,
        "y": 0.53
      },
      "noTrail": true
    },
    {
      "id": "fox-aura",
      "assetId": "fox-aura-v2",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        2000
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "rotationDegreesPerSecond": 18,
      "outsideBall": true
    },
    {
      "id": "fox-tails",
      "assetId": "fox-tails-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        2000
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "rotationDegreesPerSecond": 28,
      "outsideBall": true
    },
    {
      "id": "fox-impact",
      "assetId": "fox-impact-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        350
      ],
      "crossfadeMs": 0,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "bell-aura",
      "assetId": "bell-aura-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        2000
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "rotationDegreesPerSecond": 14,
      "outsideBall": true
    },
    {
      "id": "bell-wave",
      "assetId": "bell-wave-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        380
      ],
      "crossfadeMs": 0,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "beam-aura",
      "assetId": "beam-aura-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        2000
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "rotationDegreesPerSecond": 20,
      "outsideBall": true
    },
    {
      "id": "beam-impact",
      "assetId": "beam-impact-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        40,
        40,
        50,
        65,
        60,
        60,
        50,
        50
      ],
      "crossfadeMs": 15,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "go-aura",
      "assetId": "go-aura-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        2000
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "rotationDegreesPerSecond": 15,
      "outsideBall": true
    },
    {
      "id": "go-impact",
      "assetId": "go-impact-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        40,
        45,
        50,
        65,
        65,
        60,
        55,
        60
      ],
      "crossfadeMs": 18,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "scythe-aura",
      "assetId": "scythe-aura-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        2000
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "rotationDegreesPerSecond": 20,
      "outsideBall": true
    },
    {
      "id": "scythe-slash",
      "assetId": "scythe-slash-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        40,
        40,
        40,
        40,
        40,
        40,
        40,
        40
      ],
      "crossfadeMs": 15,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "scythe-eclipse",
      "assetId": "scythe-ultimate-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        40,
        40,
        55,
        75,
        80,
        65,
        55,
        60
      ],
      "crossfadeMs": 18,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "chain-dragon-head",
      "assetId": "chain-dragon-head-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        1000
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.86,
        "y": 0.5
      },
      "aspectRatio": 2,
      "noTrail": true
    },
    {
      "id": "chain-constriction",
      "assetId": "chain-constriction-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        200,
        200,
        200,
        200,
        200,
        200,
        100,
        140
      ],
      "crossfadeMs": 45,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "outsideBall": true
    },
    {
      "id": "umbrella-aura",
      "assetId": "umbrella-aura-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        2000
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "rotationDegreesPerSecond": 18,
      "outsideBall": true
    },
    {
      "id": "umbrella-weapon",
      "assetId": "umbrella-weapon-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        1000
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "rotationDegreesPerSecond": 360,
      "noTrail": true
    },
    {
      "id": "umbrella-guard",
      "assetId": "umbrella-weapon-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        2000
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "rotationDegreesPerSecond": 45,
      "outsideBall": true
    },
    {
      "id": "umbrella-impact",
      "assetId": "umbrella-impact-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        40,
        55,
        75,
        95,
        85,
        75,
        65,
        70
      ],
      "crossfadeMs": 20,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "archer-aura",
      "assetId": "archer-aura-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        160,
        160,
        160,
        160,
        160,
        160,
        160,
        160
      ],
      "crossfadeMs": 65,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "outsideBall": true
    },
    {
      "id": "archer-arrow",
      "assetId": "archer-arrow-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        1000
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.9,
        "y": 0.5
      },
      "aspectRatio": 3,
      "noTrail": true
    },
    {
      "id": "archer-impact",
      "assetId": "archer-impact-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        40,
        50,
        70,
        100,
        90,
        70,
        60,
        60
      ],
      "crossfadeMs": 20,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "drunken-aura",
      "assetId": "drunken-aura-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        160,
        160,
        160,
        160,
        160,
        160,
        160,
        160
      ],
      "crossfadeMs": 70,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "outsideBall": true
    },
    {
      "id": "drunken-impact",
      "assetId": "drunken-impact-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        45,
        55,
        85,
        95,
        70,
        55,
        45,
        40
      ],
      "crossfadeMs": 16,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "drunken-ultimate",
      "assetId": "drunken-ultimate-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        140,
        140,
        140,
        140,
        140,
        140,
        140,
        140
      ],
      "crossfadeMs": 60,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "outsideBall": true
    },
    {
      "id": "chain-aura",
      "assetId": "chain-aura-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        150,
        150,
        150,
        150,
        150,
        150,
        150,
        150
      ],
      "crossfadeMs": 65,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "outsideBall": true
    },
    {
      "id": "chain-hook",
      "assetId": "chain-hook-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        1000
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.6,
        "y": 0.5
      },
      "noTrail": true
    },
    {
      "id": "chain-link",
      "assetId": "chain-link-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        1000
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "chain-impact",
      "assetId": "chain-impact-v2",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        40,
        40,
        60,
        60,
        50,
        50,
        50,
        50
      ],
      "crossfadeMs": 18,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "spear-aura",
      "assetId": "spear-aura-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        150,
        150,
        150,
        150,
        150,
        150,
        150,
        150
      ],
      "crossfadeMs": 60,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "outsideBall": true
    },
    {
      "id": "spear-thrust",
      "assetId": "spear-thrust-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        40,
        40,
        40,
        40,
        40,
        40,
        40,
        40
      ],
      "crossfadeMs": 18,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "spear-ultimate",
      "assetId": "spear-ultimate-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        50,
        50,
        50,
        50,
        50,
        50,
        50,
        50
      ],
      "crossfadeMs": 20,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "spear-impact",
      "assetId": "spear-impact-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        60,
        60,
        70,
        80,
        80,
        70,
        70,
        70
      ],
      "crossfadeMs": 25,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "qin-aura",
      "assetId": "qin-aura-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        160,
        160,
        160,
        160,
        160,
        160,
        160,
        160
      ],
      "crossfadeMs": 70,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "outsideBall": true
    },
    {
      "id": "qin-wave",
      "assetId": "qin-wave-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        100,
        100,
        100,
        100,
        100,
        100,
        100,
        100
      ],
      "crossfadeMs": 40,
      "loop": true,
      "anchor": {
        "x": 0.6,
        "y": 0.5
      }
    },
    {
      "id": "qin-finale",
      "assetId": "qin-finale-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        100,
        100,
        100,
        100,
        100,
        100,
        100,
        100
      ],
      "crossfadeMs": 40,
      "loop": true,
      "anchor": {
        "x": 0.6,
        "y": 0.5
      }
    },
    {
      "id": "qin-instrument",
      "assetId": "qin-ultimate-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        1200
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "qin-impact",
      "assetId": "qin-impact-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        60,
        70,
        90,
        100,
        100,
        90,
        80,
        80
      ],
      "crossfadeMs": 30,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "ink-aura",
      "assetId": "ink-aura-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        180,
        180,
        180,
        180,
        180,
        180,
        180,
        180
      ],
      "crossfadeMs": 90,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "outsideBall": true
    },
    {
      "id": "ink-stroke",
      "assetId": "ink-stroke-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        1000
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "aspectRatio": 2
    },
    {
      "id": "ink-dragon",
      "assetId": "ink-dragon-topdown-v2",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        100,
        100,
        100,
        100,
        100,
        100,
        100,
        100
      ],
      "crossfadeMs": 50,
      "loop": true,
      "anchor": {
        "x": 0.87,
        "y": 0.5
      }
    },
    {
      "id": "ink-burst",
      "assetId": "ink-burst-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        60,
        70,
        90,
        100,
        100,
        90,
        80,
        80
      ],
      "crossfadeMs": 30,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "mirror-aura",
      "assetId": "mirror-aura-v2",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        180,
        180,
        180,
        180,
        180,
        180,
        180,
        180
      ],
      "crossfadeMs": 90,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "outsideBall": true
    },
    {
      "id": "mirror-surface",
      "assetId": "mirror-surface-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        600
      ],
      "crossfadeMs": 0,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "mirror-triad",
      "assetId": "mirror-surface-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        500
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "radial": {
        "count": 3,
        "radius": 0.35,
        "scale": 0.34
      },
      "overlayClipId": "mirror-convergence"
    },
    {
      "id": "mirror-convergence",
      "assetId": "mirror-blade-v1",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        500
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "aspectRatio": 2,
      "radial": {
        "count": 3,
        "radius": 0.35,
        "scale": 0.34,
        "convergeAfter": 0.6,
        "pointInward": true
      }
    },
    {
      "id": "mirror-break",
      "assetId": "mirror-break-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        60,
        70,
        80,
        100,
        100,
        90,
        80,
        70
      ],
      "crossfadeMs": 30,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "frost-aura",
      "assetId": "frost-aura-v2",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        170,
        170,
        170,
        170,
        170,
        170,
        170,
        170
      ],
      "crossfadeMs": 80,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.473
      },
      "outsideBall": true
    },
    {
      "id": "frost-trap",
      "assetId": "frost-flower-static-v3",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        1440
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "spriteScale": 0.8
    },
    {
      "id": "frost-burst",
      "assetId": "frost-burst-v2-a",
      "additionalAssetIds": [
        "frost-burst-v2-b"
      ],
      "columns": 2,
      "rows": 2,
      "frameMs": [
        80,
        90,
        100,
        120,
        120,
        110,
        100,
        90
      ],
      "crossfadeMs": 40,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "frost-palace",
      "assetId": "frost-palace-aura-v3",
      "columns": 1,
      "rows": 1,
      "frameMs": [
        1440
      ],
      "crossfadeMs": 0,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "rotationDegreesPerSecond": 65
    },
    {
      "id": "blood-aura",
      "assetId": "blood-aura-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        170,
        170,
        170,
        170,
        170,
        170,
        170,
        170
      ],
      "crossfadeMs": 70,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "outsideBall": true
    },
    {
      "id": "blood-slash",
      "assetId": "blood-slash-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        70,
        80,
        90,
        120,
        110,
        90,
        80,
        80
      ],
      "crossfadeMs": 35,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "blood-empowered",
      "assetId": "blood-ultimate-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        170,
        170,
        170,
        170,
        170,
        170,
        170,
        170
      ],
      "crossfadeMs": 70,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "outsideBall": true
    },
    {
      "id": "poison-aura",
      "assetId": "poison-aura-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        150,
        150,
        150,
        150,
        150,
        150,
        150,
        150
      ],
      "crossfadeMs": 65,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "outsideBall": true
    },
    {
      "id": "poison-needle",
      "assetId": "poison-needle-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        110,
        110,
        110,
        110,
        110,
        110,
        110,
        110
      ],
      "crossfadeMs": 45,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "poison-burst",
      "assetId": "poison-ultimate-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        100,
        100,
        110,
        110,
        140,
        140,
        120,
        120
      ],
      "crossfadeMs": 45,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "shadow-slash",
      "assetId": "shadow-slash-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        60,
        60,
        70,
        90,
        90,
        70,
        60,
        60
      ],
      "crossfadeMs": 25,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "shadow-flurry",
      "assetId": "shadow-flurry-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        80,
        80,
        100,
        110,
        140,
        110,
        100,
        100
      ],
      "crossfadeMs": 35,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "shadow-aura",
      "assetId": "shadow-aura-v3",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        180,
        180,
        180,
        180,
        180,
        180,
        180,
        180
      ],
      "crossfadeMs": 75,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "mirrorLeftHalf": true
    },
    {
      "id": "blossom-spirit",
      "assetId": "blossom-spirit-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        150,
        150,
        150,
        150,
        150,
        150,
        150,
        150
      ],
      "crossfadeMs": 55,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "blossom-aura",
      "assetId": "blossom-centered-v2",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        180,
        180,
        180,
        180,
        180,
        180,
        180,
        180
      ],
      "crossfadeMs": 65,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "rotationDegreesPerSecond": 18
    },
    {
      "id": "blossom-pulse",
      "assetId": "blossom-centered-v2",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        80,
        80,
        100,
        120,
        120,
        100,
        80,
        80
      ],
      "crossfadeMs": 35,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "rotationDegreesPerSecond": 40
    },
    {
      "id": "astral-orbit",
      "assetId": "astral-orbit-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        150,
        150,
        150,
        150,
        150,
        150,
        150,
        150
      ],
      "crossfadeMs": 60,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "astral-burst",
      "assetId": "astral-burst-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        120,
        120,
        160,
        180,
        160,
        140,
        140,
        140
      ],
      "crossfadeMs": 60,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "astral-prison",
      "assetId": "astral-prison-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        150,
        150,
        150,
        150,
        150,
        150,
        150,
        150
      ],
      "crossfadeMs": 60,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "jade-needle-flow",
      "assetId": "jade-needle-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        120,
        120,
        120,
        120,
        120,
        120,
        120,
        120
      ],
      "crossfadeMs": 50,
      "loop": true,
      "anchor": {
        "x": 0.9,
        "y": 0.5
      }
    },
    {
      "id": "jade-nine-streams",
      "assetId": "jade-wave-v2",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        150,
        150,
        150,
        150,
        150,
        150,
        150,
        150
      ],
      "crossfadeMs": 60,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "rotationDegreesPerSecond": 180
    },
    {
      "id": "jade-current-aura",
      "assetId": "jade-current-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        150,
        150,
        150,
        150,
        150,
        150,
        150,
        150
      ],
      "crossfadeMs": 60,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "jade-water-impact",
      "assetId": "jade-current-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        120,
        120,
        120,
        120,
        120,
        120,
        120,
        120
      ],
      "crossfadeMs": 50,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "solar-fire-palm",
      "assetId": "solar-palm-v2",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        100,
        100,
        120,
        160,
        160,
        120,
        120,
        120
      ],
      "crossfadeMs": 45,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "solar-heavenfall",
      "assetId": "solar-ultimate-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        120,
        120,
        140,
        180,
        180,
        140,
        120,
        120
      ],
      "crossfadeMs": 50,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "solar-aura",
      "assetId": "solar-aura-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        140,
        140,
        140,
        140,
        140,
        140,
        140,
        140
      ],
      "crossfadeMs": 60,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "solar-palm",
      "assetId": "palm-atlas-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        100,
        100,
        100,
        140,
        140,
        100,
        100,
        100
      ],
      "crossfadeMs": 35,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "stone-aura",
      "assetId": "stone-lift-v4",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        250,
        250,
        250,
        250,
        250,
        250,
        250,
        250
      ],
      "crossfadeMs": 125,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "outsideBall": true,
      "frameAnchors": [
        {
          "x": 0.524,
          "y": 0.505
        },
        {
          "x": 0.524,
          "y": 0.515
        },
        {
          "x": 0.523,
          "y": 0.494
        },
        {
          "x": 0.492,
          "y": 0.492
        },
        {
          "x": 0.533,
          "y": 0.489
        },
        {
          "x": 0.507,
          "y": 0.495
        },
        {
          "x": 0.518,
          "y": 0.499
        },
        {
          "x": 0.522,
          "y": 0.5
        }
      ]
    },
    {
      "id": "lightning-aura",
      "assetId": "lightning-aura-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        140,
        140,
        140,
        140,
        140,
        140,
        140,
        140
      ],
      "crossfadeMs": 65,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "outsideBall": true
    },
    {
      "id": "lightning-impact",
      "assetId": "lightning-impact-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        80,
        90,
        110,
        130,
        130,
        110,
        90,
        80
      ],
      "crossfadeMs": 40,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "stone-palm",
      "assetId": "stone-palm-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        90,
        100,
        120,
        140,
        140,
        120,
        100,
        90
      ],
      "crossfadeMs": 40,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "stone-ultimate",
      "assetId": "stone-ultimate-v1",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        100,
        100,
        120,
        140,
        140,
        120,
        100,
        100
      ],
      "crossfadeMs": 40,
      "loop": false,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": "lightning-ultimate-aura",
      "assetId": "lightning-ultimate-aura-v3",
      "columns": 4,
      "rows": 2,
      "frameMs": [
        150,
        150,
        150,
        150,
        150,
        150,
        150,
        150
      ],
      "crossfadeMs": 65,
      "loop": true,
      "anchor": {
        "x": 0.5,
        "y": 0.5
      },
      "outsideBall": true
    }
  ],
  "abilities": [
    {
      "abilityId": "masks-shift",
      "color": "#f0d4b4",
      "impact": {
        "clipId": "masks-impact",
        "size": 115
      }
    },
    {
      "abilityId": "masks-sorrow",
      "color": "#c2e8fa",
      "projectile": {
        "clipId": "masks-sorrow",
        "size": 78
      },
      "impact": {
        "clipId": "masks-impact",
        "size": 115
      }
    },
    {
      "abilityId": "masks-awaken",
      "color": "#fff0c4",
      "impact": {
        "clipId": "masks-impact",
        "size": 130
      }
    },
    {
      "abilityId": "gates-strike",
      "color": "#ffd778",
      "release": {
        "clipId": "gates-punch",
        "size": 145
      },
      "impact": {
        "clipId": "gates-impact",
        "size": 135
      }
    },
    {
      "abilityId": "gates-unleash",
      "color": "#ffe7ab",
      "release": {
        "clipId": "gates-finisher",
        "size": 225
      },
      "impact": {
        "clipId": "gates-impact",
        "size": 155
      }
    },
    {
      "abilityId": "automaton-command",
      "color": "#83dae2",
      "projectile": {
        "clipId": "automaton-bolt",
        "size": 55
      },
      "impact": {
        "clipId": "automaton-impact",
        "size": 90
      }
    },
    {
      "abilityId": "automaton-awaken",
      "color": "#f2db9a",
      "impact": {
        "clipId": "automaton-impact",
        "size": 120
      }
    },
    {
      "abilityId": "retrace-follow",
      "color": "#bbdfff",
      "projectile": {
        "clipId": "retrace-sword",
        "size": 78
      },
      "impact": {
        "clipId": "retrace-impact",
        "size": 108
      }
    },
    {
      "abilityId": "retrace-return",
      "color": "#e1efff",
      "impact": {
        "clipId": "retrace-impact",
        "size": 138
      }
    },
    {
      "abilityId": "thorn-plant",
      "color": "#ed7e91",
      "zone": {
        "clipId": "thorn-bud",
        "detonationClipId": "thorn-strike",
        "artRadiusFraction": 0.42
      },
      "impact": {
        "clipId": "thorn-strike",
        "size": 150
      }
    },
    {
      "abilityId": "thorn-garden",
      "color": "#ffafbd",
      "aura": {
        "clipId": "thorn-aura",
        "size": 165
      },
      "impact": {
        "clipId": "thorn-strike",
        "size": 170
      }
    },
    {
      "abilityId": "wind-fan",
      "color": "#d1f2e5",
      "release": {
        "clipId": "wind-sweep",
        "size": 250
      },
      "impact": {
        "clipId": "wind-impact",
        "size": 130
      }
    },
    {
      "abilityId": "wind-monsoon",
      "color": "#9dd8c7",
      "impact": {
        "clipId": "wind-impact",
        "size": 100
      }
    },
    {
      "abilityId": "cannon-round",
      "color": "#87caff",
      "projectile": {
        "clipId": "cannon-bolt",
        "size": 110
      },
      "release": {
        "clipId": "cannon-muzzle",
        "size": 115
      },
      "impact": {
        "clipId": "cannon-impact",
        "size": 85
      }
    },
    {
      "abilityId": "cannon-salvo",
      "color": "#b2e4ff",
      "projectile": {
        "clipId": "cannon-heavy",
        "size": 145
      },
      "release": {
        "clipId": "cannon-muzzle",
        "size": 150
      },
      "impact": {
        "clipId": "cannon-impact",
        "size": 110
      }
    },
    {
      "abilityId": "crystal-lance",
      "color": "#b3e9ff",
      "projectile": {
        "clipId": "crystal-bolt",
        "size": 125
      },
      "impact": {
        "clipId": "crystal-impact",
        "size": 180
      }
    },
    {
      "abilityId": "crystal-heaven",
      "color": "#dcefff",
      "projectile": {
        "clipId": "crystal-bolt",
        "size": 120
      },
      "impact": {
        "clipId": "crystal-impact",
        "size": 200
      }
    },
    {
      "abilityId": "dream-butterfly",
      "color": "#d5b9ff",
      "projectile": {
        "clipId": "dream-bolt",
        "size": 110
      },
      "impact": {
        "clipId": "dream-impact",
        "size": 175
      }
    },
    {
      "abilityId": "dream-night",
      "color": "#edceff",
      "projectile": {
        "clipId": "dream-bolt",
        "size": 195
      },
      "impact": {
        "clipId": "dream-impact",
        "size": 240
      }
    },
    {
      "abilityId": "feather-silver",
      "color": "#afcaff",
      "projectile": {
        "clipId": "feather-bolt",
        "size": 65
      },
      "impact": {
        "clipId": "feather-impact",
        "size": 112
      }
    },
    {
      "abilityId": "feather-home",
      "color": "#e2edff",
      "projectile": {
        "clipId": "feather-bolt",
        "size": 95
      },
      "impact": {
        "clipId": "feather-impact",
        "size": 135
      }
    },
    {
      "abilityId": "lantern-ward",
      "color": "#88e6cd",
      "projectile": {
        "clipId": "lantern-lamp",
        "size": 64
      },
      "impact": {
        "clipId": "lantern-impact",
        "size": 125
      }
    },
    {
      "abilityId": "lantern-souls",
      "color": "#b7f3de",
      "projectile": {
        "clipId": "lantern-spirit",
        "size": 78
      },
      "impact": {
        "clipId": "lantern-impact",
        "size": 140
      }
    },
    {
      "abilityId": "time-sand",
      "color": "#e8c985",
      "projectile": {
        "clipId": "time-bolt",
        "size": 66
      },
      "impact": {
        "clipId": "time-impact",
        "size": 88
      }
    },
    {
      "abilityId": "time-return",
      "color": "#d7b4ef",
      "impact": {
        "clipId": "time-impact",
        "size": 108
      }
    },
    {
      "abilityId": "portal-step",
      "color": "#94d9ff",
      "projectile": {
        "clipId": "portal-gate",
        "size": 30
      },
      "impact": {
        "clipId": "portal-impact",
        "size": 95
      }
    },
    {
      "abilityId": "portal-fold",
      "color": "#a1caff",
      "projectile": {
        "clipId": "portal-gate",
        "size": 36
      },
      "impact": {
        "clipId": "portal-impact",
        "size": 115
      }
    },
    {
      "abilityId": "thread-needle",
      "color": "#ff9aab",
      "projectile": {
        "clipId": "thread-needle",
        "size": 85
      },
      "impact": {
        "clipId": "thread-impact",
        "size": 68
      }
    },
    {
      "abilityId": "thread-fate",
      "color": "#ffd58c",
      "projectile": {
        "clipId": "thread-needle",
        "size": 120
      },
      "impact": {
        "clipId": "thread-impact",
        "size": 115
      }
    },
    {
      "abilityId": "scribe-glyph",
      "color": "#b3ebc6",
      "projectile": {
        "clipId": "scribe-glyph",
        "size": 52
      },
      "impact": {
        "clipId": "scribe-impact",
        "size": 82
      }
    },
    {
      "abilityId": "scribe-return",
      "color": "#eddaa1",
      "projectile": {
        "clipId": "scribe-glyph",
        "size": 66
      },
      "aura": {
        "clipId": "scribe-aura",
        "size": 136
      },
      "impact": {
        "clipId": "scribe-impact",
        "size": 112
      }
    },
    {
      "abilityId": "fox-flame",
      "color": "#ffd9aa",
      "projectile": {
        "clipId": "fox-flame",
        "size": 64
      },
      "impact": {
        "clipId": "fox-impact",
        "size": 86
      }
    },
    {
      "abilityId": "fox-ninefold",
      "color": "#ffb5bd",
      "aura": {
        "clipId": "fox-tails",
        "size": 165
      },
      "activeAura": {
        "clipId": "fox-tails",
        "size": 165
      },
      "impact": {
        "clipId": "fox-impact",
        "size": 120
      }
    },
    {
      "abilityId": "bell-resound",
      "color": "#efd299",
      "impact": {
        "clipId": "bell-wave",
        "size": 72
      }
    },
    {
      "abilityId": "bell-judgment",
      "color": "#ffdf9c",
      "aura": {
        "clipId": "bell-aura",
        "size": 150
      },
      "impact": {
        "clipId": "bell-wave",
        "size": 90
      }
    },
    {
      "abilityId": "beam-finger",
      "color": "#9bddff",
      "aura": {
        "clipId": "beam-aura",
        "size": 120
      },
      "impact": {
        "clipId": "beam-impact",
        "size": 85
      }
    },
    {
      "abilityId": "beam-void",
      "color": "#d9f5ff",
      "aura": {
        "clipId": "beam-aura",
        "size": 155
      },
      "impact": {
        "clipId": "beam-impact",
        "size": 125
      }
    },
    {
      "abilityId": "go-placement",
      "color": "#f3d58d",
      "impact": {
        "clipId": "go-impact",
        "size": 85
      }
    },
    {
      "abilityId": "go-checkmate",
      "color": "#ffe9a8",
      "impact": {
        "clipId": "go-impact",
        "size": 100
      }
    },
    {
      "abilityId": "scythe-cleave",
      "color": "#cfb9ff",
      "release": {
        "clipId": "scythe-slash",
        "size": 450
      },
      "aura": {
        "clipId": "scythe-aura",
        "size": 125
      },
      "impact": {
        "clipId": "scythe-eclipse",
        "size": 75
      }
    },
    {
      "abilityId": "scythe-eclipse",
      "color": "#e7d9ff",
      "release": {
        "clipId": "scythe-eclipse",
        "size": 350
      },
      "aura": {
        "clipId": "scythe-aura",
        "size": 145
      },
      "impact": {
        "clipId": "scythe-eclipse",
        "size": 90
      }
    },
    {
      "abilityId": "umbrella-return",
      "color": "#f5c681",
      "aura": {
        "clipId": "umbrella-aura",
        "size": 125
      },
      "projectile": {
        "clipId": "umbrella-weapon",
        "size": 70
      },
      "impact": {
        "clipId": "umbrella-impact",
        "size": 110
      }
    },
    {
      "abilityId": "umbrella-heaven",
      "color": "#ffda91",
      "aura": {
        "clipId": "umbrella-aura",
        "size": 160
      },
      "impact": {
        "clipId": "umbrella-impact",
        "size": 130
      }
    },
    {
      "abilityId": "archer-step",
      "color": "#c8d9ff",
      "aura": {
        "clipId": "archer-aura",
        "size": 116
      },
      "projectile": {
        "clipId": "archer-arrow",
        "size": 110
      },
      "impact": {
        "clipId": "archer-impact",
        "size": 82
      }
    },
    {
      "abilityId": "archer-skyfall",
      "color": "#f2d490",
      "aura": {
        "clipId": "archer-aura",
        "size": 145
      },
      "projectile": {
        "clipId": "archer-arrow",
        "size": 205
      },
      "impact": {
        "clipId": "archer-impact",
        "size": 145
      }
    },
    {
      "abilityId": "drunken-sway",
      "color": "#e9b560",
      "aura": {
        "clipId": "drunken-aura",
        "size": 120
      },
      "activeAura": {
        "clipId": "drunken-aura",
        "size": 124
      },
      "impact": {
        "clipId": "drunken-impact",
        "size": 100
      }
    },
    {
      "abilityId": "drunken-heaven",
      "color": "#f7dcb0",
      "aura": {
        "clipId": "drunken-ultimate",
        "size": 143
      },
      "activeAura": {
        "clipId": "drunken-ultimate",
        "size": 146
      },
      "impact": {
        "clipId": "drunken-impact",
        "size": 125
      }
    },
    {
      "abilityId": "chain-hook",
      "color": "#e9bc7a",
      "projectile": {
        "clipId": "chain-hook",
        "size": 55
      },
      "aura": {
        "clipId": "chain-aura",
        "size": 118
      },
      "impact": {
        "clipId": "chain-impact",
        "size": 80
      },
      "tetherClipId": "chain-link"
    },
    {
      "abilityId": "chain-dragons",
      "color": "#ffe0a0",
      "projectile": {
        "clipId": "chain-dragon-head",
        "size": 115
      },
      "tetherClipId": "chain-link",
      "aura": {
        "clipId": "chain-aura",
        "size": 135
      },
      "impact": {
        "clipId": "chain-impact",
        "size": 115
      }
    },
    {
      "abilityId": "spear-cloud",
      "color": "#a6d9f3",
      "release": {
        "clipId": "spear-thrust",
        "size": 210
      },
      "impact": {
        "clipId": "spear-impact",
        "size": 65
      }
    },
    {
      "abilityId": "spear-heaven",
      "color": "#e8d39c",
      "release": {
        "clipId": "spear-ultimate",
        "size": 300
      },
      "activeAura": {
        "clipId": "spear-aura",
        "size": 145
      },
      "impact": {
        "clipId": "spear-impact",
        "size": 85
      }
    },
    {
      "abilityId": "qin-string",
      "color": "#b4ceff",
      "projectile": {
        "clipId": "qin-wave",
        "size": 80
      },
      "aura": {
        "clipId": "qin-aura",
        "size": 110
      },
      "impact": {
        "clipId": "qin-impact",
        "size": 70
      }
    },
    {
      "abilityId": "qin-sevenfold",
      "color": "#e9deb9",
      "projectile": {
        "clipId": "qin-wave",
        "finisherClipId": "qin-finale",
        "size": 85
      },
      "aura": {
        "clipId": "qin-aura",
        "size": 120
      },
      "activeAura": {
        "clipId": "qin-instrument",
        "size": 135
      },
      "impact": {
        "clipId": "qin-impact",
        "size": 90
      }
    },
    {
      "abilityId": "ink-brush",
      "color": "#d8b878",
      "area": {
        "clipId": "ink-stroke",
        "artRadiusFraction": 0.4
      },
      "aura": {
        "clipId": "ink-aura",
        "size": 110
      },
      "impact": {
        "clipId": "ink-burst",
        "size": 85
      }
    },
    {
      "abilityId": "ink-dragon",
      "color": "#d8b878",
      "projectile": {
        "clipId": "ink-dragon",
        "size": 120
      },
      "aura": {
        "clipId": "ink-aura",
        "size": 115
      },
      "impact": {
        "clipId": "ink-burst",
        "size": 125
      }
    },
    {
      "abilityId": "mirror-double",
      "color": "#c3b7fa",
      "release": {
        "clipId": "mirror-surface",
        "size": 110
      },
      "impact": {
        "clipId": "mirror-break",
        "size": 110
      }
    },
    {
      "abilityId": "mirror-moonfall",
      "color": "#d8cafa",
      "zone": {
        "clipId": "mirror-triad",
        "detonationClipId": "mirror-break",
        "artRadiusFraction": 0.35
      },
      "impact": {
        "clipId": "mirror-break",
        "size": 90
      }
    },
    {
      "abilityId": "frost-flower",
      "color": "#a8d9ff",
      "zone": {
        "clipId": "frost-trap",
        "detonationClipId": "frost-burst",
        "artRadiusFraction": 0.43
      },
      "impact": {
        "clipId": "frost-burst",
        "size": 62
      }
    },
    {
      "abilityId": "frost-palace",
      "color": "#c5e4ff",
      "zone": {
        "clipId": "frost-palace",
        "detonationClipId": "frost-burst",
        "artRadiusFraction": 0.49
      },
      "aura": {
        "clipId": "frost-aura",
        "size": 115
      },
      "impact": {
        "clipId": "frost-burst",
        "size": 86
      }
    },
    {
      "abilityId": "blood-petal",
      "color": "#e6537b",
      "release": {
        "clipId": "blood-slash",
        "size": 105
      },
      "impact": {
        "clipId": "blood-slash",
        "size": 75
      }
    },
    {
      "abilityId": "blood-lotus",
      "color": "#ffb7c9",
      "release": {
        "clipId": "blood-slash",
        "size": 130
      },
      "impact": {
        "clipId": "blood-slash",
        "size": 110
      },
      "aura": {
        "clipId": "blood-empowered",
        "size": 140
      },
      "activeAura": {
        "clipId": "blood-empowered",
        "size": 140
      }
    },
    {
      "abilityId": "poison-needles",
      "color": "#82e2a2",
      "projectile": {
        "clipId": "poison-needle",
        "size": 58
      },
      "impact": {
        "clipId": "poison-burst",
        "size": 46
      }
    },
    {
      "abilityId": "poison-eclipse",
      "color": "#b59ae9",
      "aura": {
        "clipId": "poison-aura",
        "size": 110
      },
      "impact": {
        "clipId": "poison-burst",
        "size": 180
      }
    },
    {
      "abilityId": "lightning-strike",
      "color": "#80baff",
      "release": {
        "clipId": "lightning-impact",
        "size": 100
      },
      "impact": {
        "clipId": "lightning-impact",
        "size": 72
      }
    },
    {
      "abilityId": "lightning-ninefold",
      "color": "#c79bff",
      "release": {
        "clipId": "lightning-impact",
        "size": 125
      },
      "impact": {
        "clipId": "lightning-impact",
        "size": 95
      },
      "aura": {
        "clipId": "lightning-ultimate-aura",
        "size": 142
      },
      "activeAura": {
        "clipId": "lightning-ultimate-aura",
        "size": 142
      }
    },
    {
      "abilityId": "mountain-palm",
      "color": "#dfbf77",
      "release": {
        "clipId": "stone-palm",
        "size": 112
      },
      "impact": {
        "clipId": "stone-palm",
        "size": 80
      }
    },
    {
      "abilityId": "mountain-heavenfall",
      "color": "#dfbf77",
      "area": {
        "clipId": "stone-ultimate",
        "artRadiusFraction": 0.43
      },
      "aura": {
        "clipId": "stone-aura",
        "size": 122
      },
      "impact": {
        "clipId": "stone-palm",
        "size": 80
      }
    },
    {
      "abilityId": "shadow-cut",
      "color": "#c6e5ff",
      "release": {
        "clipId": "shadow-slash",
        "size": 125
      },
      "impact": {
        "clipId": "shadow-slash",
        "size": 65
      }
    },
    {
      "abilityId": "shadow-myriad",
      "color": "#c6e5ff",
      "aura": {
        "clipId": "shadow-aura",
        "size": 125
      },
      "sequence": {
        "slashClipId": "shadow-slash",
        "finisherClipId": "shadow-flurry",
        "telegraphClipId": "shadow-aura",
        "artRadiusFraction": 0.45
      },
      "impact": {
        "clipId": "shadow-slash",
        "size": 54
      }
    },
    {
      "abilityId": "blossom-call",
      "color": "#f4b2cf",
      "summon": {
        "clipId": "blossom-spirit",
        "size": 40
      },
      "aura": {
        "clipId": "blossom-aura",
        "size": 105
      },
      "impact": {
        "clipId": "blossom-pulse",
        "size": 58
      }
    },
    {
      "abilityId": "blossom-myriad",
      "color": "#f4b2cf",
      "aura": {
        "clipId": "blossom-aura",
        "size": 125
      },
      "release": {
        "clipId": "blossom-pulse",
        "size": 135
      },
      "impact": {
        "clipId": "blossom-pulse",
        "size": 70
      }
    },
    {
      "abilityId": "astral-snare",
      "color": "#c3a1ff",
      "zone": {
        "clipId": "astral-orbit",
        "detonationClipId": "astral-burst",
        "artRadiusFraction": 0.45
      },
      "impact": {
        "clipId": "astral-burst",
        "size": 72
      }
    },
    {
      "abilityId": "astral-prison",
      "color": "#c3a1ff",
      "zone": {
        "clipId": "astral-prison",
        "detonationClipId": "astral-burst",
        "artRadiusFraction": 0.45
      },
      "aura": {
        "clipId": "astral-orbit",
        "size": 124
      },
      "impact": {
        "clipId": "astral-burst",
        "size": 94
      }
    },
    {
      "abilityId": "jade-needle",
      "color": "#74ddd0",
      "projectile": {
        "clipId": "jade-needle-flow",
        "size": 70
      },
      "impact": {
        "clipId": "jade-water-impact",
        "size": 76
      }
    },
    {
      "abilityId": "jade-nine-streams",
      "color": "#74ddd0",
      "area": {
        "clipId": "jade-nine-streams",
        "artRadiusFraction": 0.43
      },
      "impact": {
        "clipId": "jade-water-impact",
        "size": 90
      },
      "aura": {
        "clipId": "jade-current-aura",
        "size": 116
      }
    },
    {
      "abilityId": "solar-palm",
      "color": "#ff713d",
      "release": {
        "clipId": "solar-fire-palm",
        "size": 100
      },
      "impact": {
        "clipId": "solar-fire-palm",
        "size": 70
      }
    },
    {
      "abilityId": "solar-heavenfall",
      "color": "#ff713d",
      "release": {
        "clipId": "solar-heavenfall",
        "size": 154
      },
      "impact": {
        "clipId": "solar-heavenfall",
        "size": 100
      },
      "aura": {
        "clipId": "solar-aura",
        "size": 104
      }
    }
  ]
};
