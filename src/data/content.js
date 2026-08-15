// All of pontaxi.fun's copy lives here: the six enterable buildings and the
// locals you meet on the street.

export const X_URL = 'https://x.com/pontaxi'
export const X_HANDLE = '@pontaxi'

export const ACCENT = {
  gold: '#f2b632',
  teal: '#5cc0ac',
  blue: '#7aa7e8',
  pink: '#ef9ec4',
  orange: '#f2925c',
  coral: '#ee5f56',
}

/** The six landmarks. `block` is [i, j] on the 5x5 grid, `side` is the door facing. */
export const LANDMARKS = [
  {
    key: 'hq',
    name: 'Dispatch HQ',
    tag: 'HOME',
    blurb: 'Where the radio never stops crackling.',
    accent: ACCENT.gold,
    block: [3, 3],
    side: 'north',
    size: [16, 13, 17],
    interior: {
      npc: 'Yara',
      role: 'Dispatch Lead',
      look: { skin: '#f0c9a4', hair: '#3c3229', shirt: '#2f3a52', pants: '#232a3a' },
      lines: [
        'Welcome to PONTAXI. Six cars, one city, and a radio that has not been quiet since Tuesday.',
        'Everything here is somewhere you can stand. The Garage is the fleet, the Depot is where the trips get logged, the Meter is what it costs.',
        'Go on, wander. Nobody in this town is in a hurry except me.',
      ],
      cta: { label: 'Follow @pontaxi', href: X_URL },
    },
  },
  {
    key: 'garage',
    name: 'The Garage',
    tag: 'FLEET',
    blurb: 'Six cabs, one of which is always on the lift.',
    accent: ACCENT.teal,
    block: [1, 1],
    side: 'south',
    size: [17, 11, 15],
    interior: {
      npc: 'Kova',
      role: 'Chief Mechanic',
      look: { skin: '#c98d63', hair: '#20242e', shirt: '#3f8f7f', pants: '#2b3340' },
      lines: [
        'Six cabs. Five run. The sixth is a philosophy project I have been working on since spring.',
        'Every one of them is yellow because a taxi that is not yellow is just a car with opinions.',
        'Do not touch the blue one. The blue one is not ready to be seen.',
      ],
      cta: { label: 'Fleet photos on X', href: X_URL },
    },
  },
  {
    key: 'depot',
    name: 'The Depot',
    tag: 'RIDES',
    blurb: 'Every trip this city has ever taken, written down.',
    accent: ACCENT.blue,
    block: [2, 0],
    side: 'south',
    size: [18, 15, 16],
    interior: {
      npc: 'Sol',
      role: 'Log Keeper',
      look: { skin: '#f2d3b3', hair: '#7a4a2b', shirt: '#5a86c7', pants: '#333c4d' },
      lines: [
        'Eleven thousand four hundred rides. I have read all of them and I would do it again.',
        'Best fare: a man who paid to be driven twice around the park so he could finish a phone call.',
        'Worst fare: same man, next week, same call.',
      ],
      cta: { label: 'Ride log on X', href: X_URL },
    },
  },
  {
    key: 'crew',
    name: 'The Crew',
    tag: 'DRIVERS',
    blurb: 'Five drivers who all swear they know a shortcut.',
    accent: ACCENT.pink,
    block: [3, 1],
    side: 'west',
    size: [15, 10, 16],
    interior: {
      npc: 'Pim',
      role: 'Driver',
      look: { skin: '#e8b892', hair: '#b5543f', shirt: '#e488b5', pants: '#3a3f52' },
      lines: [
        'Five of us. All of us know a shortcut. None of the shortcuts agree with each other.',
        'You get the same face every time you get in. That is the entire business model.',
        'Ask Ren about the roundabout. Do not ask Ren about the roundabout.',
      ],
      cta: { label: 'Meet the crew on X', href: X_URL },
    },
  },
  {
    key: 'nightshift',
    name: 'Night Shift',
    tag: 'JOBS',
    blurb: 'The lights stay on. Somebody has to sit under them.',
    accent: ACCENT.orange,
    block: [0, 2],
    side: 'east',
    size: [15, 12, 15],
    interior: {
      npc: 'Ren',
      role: 'Night Shift',
      look: { skin: '#a86f4c', hair: '#161a22', shirt: '#e08048', pants: '#262c3a' },
      lines: [
        'Night shift is hiring. One seat. It has been one seat for two years.',
        'What we want: you can find your way without the map, and you can sit with a stranger in silence.',
        'The pay is fine. The stories are better than the pay.',
      ],
      cta: { label: 'Apply on X', href: X_URL },
    },
  },
  {
    key: 'meter',
    name: 'The Meter',
    tag: 'FARES',
    blurb: 'It only runs while the wheels are turning.',
    accent: ACCENT.coral,
    block: [1, 3],
    side: 'east',
    size: [16, 11, 14],
    interior: {
      npc: 'Tam',
      role: 'The Meter',
      look: { skin: '#f0c9a4', hair: '#4a3b2f', shirt: '#ee6f66', pants: '#2f3644' },
      lines: [
        'The meter is honest. Same rate for everyone, printed on the door, and it only runs while the wheels turn.',
        'No surge. Nobody here has ever looked at the weather and thought about money.',
        'Short trips are fine. Half this city is a short trip.',
      ],
      cta: { label: 'Hail us on X', href: X_URL },
    },
  },
]

/** Named locals on the street. `at` is a world position; they wander a little around it. */
export const LOCALS = [
  {
    id: 'bo',
    name: 'Bo the Courier',
    role: 'Courier',
    at: [8, 22],
    look: { skin: '#e8b892', hair: '#2b2f3a', hat: '#f2b632', shirt: '#f4d774', pants: '#333b4d' },
    quest: true,
    lines: [
      'You look like you are walking that way anyway. Take this parcel to Dispatch HQ for me?',
      'Gold building, east side of the park. Yara is behind the desk. Do not shake it.',
    ],
    done: ['Parcel arrived in one piece. You are an honorary driver now. There is no badge.'],
  },
  {
    id: 'mira',
    name: 'Mira',
    role: 'Dispatcher',
    at: [-20, 14],
    look: { skin: '#c98d63', hair: '#3a2d24', shirt: '#5cc0ac', pants: '#2c3442' },
    lines: [
      'Two fares waiting and one cab free. This is a normal Tuesday.',
      'If you want a ride, the Meter is the coral building south-west. You cannot miss it, it is the loud one.',
    ],
  },
  {
    id: 'ada',
    name: 'Ada',
    role: 'Night Driver',
    at: [24, -12],
    look: { skin: '#f2d3b3', hair: '#8c4a2f', shirt: '#7aa7e8', pants: '#39415a' },
    lines: [
      'I have driven this whole city with my eyes shut. Once. It went badly and we do not discuss it.',
      'Three in the morning is the best shift. Nobody lies to you at three in the morning.',
    ],
  },
  {
    id: 'ozz',
    name: 'Ozz',
    role: 'Cart Coffee',
    at: [-14, -20],
    look: { skin: '#a86f4c', hair: '#20242e', hat: '#ffffff', shirt: '#f0f2f6', pants: '#4a5266' },
    lines: [
      'Flat white, no charge, you are inside a website.',
      'Every driver comes through here around three. That is when the arguing gets good.',
    ],
  },
  {
    id: 'juno',
    name: 'Juno',
    role: 'Local',
    at: [4, -8],
    kid: true,
    look: { skin: '#f0c9a4', hair: '#e07aa8', hat: '#ef9ec4', shirt: '#f8e08a', pants: '#3a4256' },
    lines: [
      'I counted the buildings you can walk into. Six! I checked twice.',
      'The fountain is still the best one though, and nobody built that on purpose.',
    ],
  },
  {
    id: 'nell',
    name: 'Nell',
    role: 'First Week',
    at: [-34, -12],
    look: { skin: '#e8b892', hair: '#4a3b2f', shirt: '#b4d8f0', pants: '#333b4d' },
    lines: [
      'First week driving. They gave me the good cab on day two and sat in the back the whole shift.',
      'Night Shift is the orange building on the west road, if you were thinking about it.',
    ],
  },
  {
    id: 'yuri',
    name: 'Yuri',
    role: 'Traffic',
    at: [40, 17],
    look: { skin: '#c98d63', hair: '#161a22', shirt: '#8e7ad0', pants: '#2b3340' },
    lines: [
      'Everything you are walking on is one page of geometry. No downloads, no waiting.',
      'That is the whole trick. It has to open on a phone on a bad signal, or it does not open at all.',
    ],
  },
  {
    id: 'kit',
    name: 'Kit',
    role: 'Street Sweeper',
    at: [-46, 20],
    look: { skin: '#f2d3b3', hair: '#6b5b4a', hat: '#f2925c', shirt: '#f2925c', pants: '#414a5e' },
    lines: [
      'Somebody has to keep the roads clean. Turns out it is me, forever.',
      'Head north for the Depot if you like reading. Blue one, big windows.',
    ],
  },
]

/** Ambient, silent pedestrians — how many, and the palette they are built from. */
export const CROWD = {
  count: 26,
  skin: ['#f2d3b3', '#e8b892', '#c98d63', '#a86f4c', '#f0c9a4', '#8a5738'],
  hair: ['#2b2f3a', '#4a3b2f', '#7a4a2b', '#161a22', '#8c6239', '#b5543f', '#e07aa8'],
  shirt: ['#7aa7e8', '#5cc0ac', '#f2b632', '#ee6f66', '#ef9ec4', '#f8e08a', '#b4d8f0', '#8e7ad0', '#f0f2f6', '#f2925c'],
  pants: ['#333b4d', '#2c3442', '#4a5266', '#39415a', '#5b6478', '#2f3644'],
}

export const QUEST = {
  pickup: 'Parcel accepted. Dispatch HQ is the gold building east of the park.',
  deliver: 'Parcel delivered. Bo owes you a coffee.',
}
