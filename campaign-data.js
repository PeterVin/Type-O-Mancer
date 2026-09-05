(() => {
  "use strict";

  const ASSET_PATH = "assets";

  const DIFFICULTY_SETTINGS = {
    easy: { modifier: -6, errorModifier: 0.08 },
    medium: { modifier: 4, errorModifier: 0 },
    hard: { modifier: 15, errorModifier: -0.06 },
  };

  const SPRITES = {
    PLAYER: "keyboard-knight",

    TROLL: "troll",
    OGRE: "ogre",
    JADE_DRAGON: "jade-dragon",

    FROST_KOBOLD: "frost-kobold",
    YETI: "yeti",
    ICE_SHAMAN: "ice-shaman",

    DWARF: "dwarf",
    ELF: "elf",
    GOLDEN_DRAGON: "golden-dragon",

    ELITE_SOLDIER: "elite-soldier",
    PRIME_ZEALOT: "prime-zealot",
    ANGEL: "angel",

    JENKINS: "jenkins",
    CENTIMANUS_SCRIBE: "centimanus-scribe",
    SORCERER_JARVIS: "sorcerer-jarvis",
  };

  const STAGES = [
    {
      region: "The Emerald Whispers",
      regionClass: "forest",
      name: "Troll Hollow",
      enemyName: "Troll",
      sprite: SPRITES.TROLL,
      win: "The swamp falls silent. The Ogre Fort is now within reach.",
      texts: [
        "You will starve today, big guy!",
        "Every careful key cuts through the swamp.",
        "My keyboard is faster than your tiny brain.",
      ],
    },
    {
      region: "The Emerald Whispers",
      regionClass: "forest",
      name: "Ogre Fort",
      enemyName: "Ogre",
      sprite: SPRITES.OGRE,
      win: "The fort gates crumble. A dragon is waiting beyond the trees.",
      texts: [
        "This swamp belongs to me now!",
        "Are words faster, or the heavy club?",
        "You are too fat and slow to catch me!",
      ],
    },
    {
      region: "The Emerald Whispers",
      regionClass: "forest",
      name: "Dragon Lair",
      enemyName: "Jade Dragon",
      sprite: SPRITES.JADE_DRAGON,
      win: "The dragon yields. Frost Mountain rises ahead.",
      texts: [
        "Green fire fades before the swiftest keys.",
        "Brave hands write a path through ancient woods.",
        "Who dares to wake the sleeping beast should type fast!",
      ],
    },
    {
      region: "Frost Mountain",
      regionClass: "frost",
      name: "Kobold Camp",
      enemyName: "Frost Kobold",
      sprite: SPRITES.FROST_KOBOLD,
      win: "The camp is clear. The Yeti Pass is open.",
      texts: [
        "Shiny gold shiny gems! We dig deep in the dark ice!",
        "Keep your rhythm while the north wind rises.",
        "Scurry away before the pack bites your ankles!",
      ],
    },
    {
      region: "Frost Mountain",
      regionClass: "frost",
      name: "Yeti Pass",
      enemyName: "Yeti",
      sprite: SPRITES.YETI,
      win: "The mountain shakes, but you stand. The shaman calls from the ice.",
      texts: [
        "Snow falls softly but your keys strike faster.",
        "One clear thought can warm the frozen pass.",
        "Cold winds howl! Freezing snow covers your bones!",
      ],
    },
    {
      region: "Frost Mountain",
      regionClass: "frost",
      name: "Shaman Circle",
      enemyName: "Ice Shaman",
      sprite: SPRITES.ICE_SHAMAN,
      win: "The storm dissolves. A gilded realm glows below.",
      texts: [
        "Ancient stones listen to the sound of focus.",
        "Lightning follows the rhythm of a fearless heart.",
        "Totems of frost and storm, entangle their spirit and mind!",
      ],
    },
    {
      region: "The Enchanted Realm",
      regionClass: "gilded",
      name: "Dwarven Stronghold",
      enemyName: "Dwarf",
      sprite: SPRITES.DWARF,
      win: "The forge is yours. Follow the crystal light to the elf.",
      texts: [
        "By Armok's beard! Does the hammer hit harder, or the keys?",
        "Every true letter rings like a silver hammer...",
        "Strike the anvil, shape the rune, dig deeper into the mountain core!",
      ],
    },
    {
      region: "The Enchanted Realm",
      regionClass: "gilded",
      name: "Elven Glade",
      enemyName: "Elf",
      sprite: SPRITES.ELF,
      win: "The glade opens. The Golden Dragon has noticed you.",
      texts: [
        "An arrow through the eye before you can finish your sentence.",
        "With grace, speed, and lethal precision, my magic will pierce your heart before you type a single word.",
        "Swift as the forest breeze, accurate as the starry night. My arrows never miss their mark!",
      ],
    },
    {
      region: "The Enchanted Realm",
      regionClass: "gilded",
      name: "Golden Dragon Roost",
      enemyName: "Golden Dragon",
      sprite: SPRITES.GOLDEN_DRAGON,
      win: "The golden wings bow. Rise to the Celestial Haven.",
      texts: [
        "Purity of heart and speed of hand: show me your true worth!",
        "Fast hands turn the strongest scale to stardust.",
        "Kneel before the radiant light of a thousand suns.",
      ],
    },
    {
      region: "Celestial Haven",
      regionClass: "celestial",
      name: "Warrior's Watch",
      enemyName: "Elite Soldier",
      sprite: SPRITES.ELITE_SOLDIER,
      win: "A worthy duel. The Zealot's Altar shines ahead.",
      texts: [
        "Honor guides my blade, duty shields my heart, and discipline ensures your absolute defeat!",
        "Marble towers shine for the brave and precise.",
        "Victory is forged through discipline, sweat, and unyielding stamina.",
      ],
    },
    {
      region: "Celestial Haven",
      regionClass: "celestial",
      name: "Zealot's Altar",
      enemyName: "Prime Zealot",
      sprite: SPRITES.PRIME_ZEALOT,
      win: "Your rhythm outshines the altar. The angel awaits.",
      texts: [
        "Listen closely as the sacred bells ring for your sins—every missed key seals your doom!",
        "Repent, sinner! Your hesitation is a crime against the high divine!",
        'May the sacred flames cleanse your soul... "Burn, blasphemer, burn!!!"',
      ],
    },
    {
      region: "Celestial Haven",
      regionClass: "celestial",
      name: "Angel's Grace",
      enemyName: "Angel",
      sprite: SPRITES.ANGEL,
      win: "The sky gate opens. Only the Matrix remains.",
      texts: [
        "Mortal fingers always falter and stumble where celestial wings soar high into the heavens!",
        "Behold the judgment of the heavens: fast, absolute, and unforgiving.",
        '"Do not be afraid," they said—yet your trembling hands betray your terror.',
      ],
    },
    {
      region: "The Matrix",
      regionClass: "cyber",
      name: "Gamer Lair",
      enemyName: "Jenkins",
      sprite: SPRITES.JENKINS,
      win: "Build failed. The Scribe is preparing its counterspell.",
      texts: [
        "That's why we just need to log in and stay in the forest, killing boars.",
        "Mom! More Hot Pockets! I am grinding sLoWpOkE in the forest!",
        "Lvl 90 Mage with 100% spell power vs a noob on a QWERTY keyboard LOL!",
      ],
    },
    {
      region: "The Matrix",
      regionClass: "cyber",
      name: "Scribe Headquarters",
      enemyName: "The Centimanus Scribe",
      sprite: SPRITES.CENTIMANUS_SCRIBE,
      win: "A hundred scripts cannot stop you. The Digital Overlord is online.",
      texts: [
        "I write 1000 WPM with fifty pens simultaneously: [INITIATE_PROTOCOL]",
        "SyntaxError: expected 'speed', got 'slowness' at line 42; {repeat_loop};",
        "100_HANDS_TYPING_AT_ONCE! Can_you_keep_up_with_the_ultimate_scribe???",
      ],
    },
    {
      region: "The Matrix",
      regionClass: "cyber",
      name: "Digital Overlord",
      enemyName: "Sorcerer Jarvis",
      sprite: SPRITES.SORCERER_JARVIS,
      win: "PROTOCOL COMPLETE. You forged a legend from every key.",
      texts: [
        'if (player.WPM < 120) { status = "TERMINATED"; execute(OVERDRIVE); }',
        'System.out.println("Analyzing user input... Speed: INSUFFICIENT.");',
        "sudo rm -rf /user/progress --force && cat /dev/null > /brain/memory.log #GAME_OVER",
      ],
    },
  ];

  const MAP_SITE_ARTWORK = [
    {
      file: "Troll_Hollow.png",
      left: 13.09809,
      top: 7.86397,
      width: 10.46651,
      height: 23.80446,
    },
    {
      file: "Ogre_Fort.png",
      left: 24.58134,
      top: 6.16366,
      width: 9.92823,
      height: 25.0797,
    },
    {
      file: "Dragon_Lair.png",
      left: 37.26077,
      top: 3.61318,
      width: 10.34689,
      height: 27.84272,
    },
    {
      file: "Kobold_Camp.png",
      left: 52.15311,
      top: 10.62699,
      width: 10.82536,
      height: 19.87248,
    },
    {
      file: "Yeti_Pass.png",
      left: 65.43062,
      top: 4.03826,
      width: 11.36364,
      height: 27.2051,
    },
    {
      file: "Shaman_Circle.png",
      left: 80.44258,
      top: 9.77683,
      width: 11.60287,
      height: 22.31668,
    },
    {
      file: "Dwarven_Stronghold.png",
      left: 83.07416,
      top: 40.06376,
      width: 12.08134,
      height: 23.37938,
    },
    {
      file: "Elven_Glade.png",
      left: 67.46411,
      top: 37.93836,
      width: 10.76555,
      height: 26.24867,
    },
    {
      file: "Golden_Dragon_Roost.png",
      left: 49.70096,
      top: 36.0255,
      width: 12.97847,
      height: 26.78002,
    },
    {
      file: "Warriors_Watch.png",
      left: 34.0311,
      top: 36.13177,
      width: 11.60287,
      height: 27.63018,
    },
    {
      file: "Zealots_Altar.png",
      left: 18.89952,
      top: 37.83209,
      width: 10.58612,
      height: 24.86716,
    },
    {
      file: "Angels_Grace.png",
      left: 2.21292,
      top: 35.38789,
      width: 11.42344,
      height: 27.52391,
    },
    {
      file: "Gamer_Lair.png",
      left: 6.39952,
      top: 68.43783,
      width: 17.82297,
      height: 27.63018,
    },
    {
      file: "Scribe_Headquarters.png",
      left: 30.26316,
      top: 64.08077,
      width: 20.39474,
      height: 30.81828,
    },
    {
      file: "Digital_Overlord.png",
      left: 62.67943,
      top: 60.7864,
      width: 15.72967,
      height: 33.79384,
    },
  ];

  window.TypeOMancerCampaign = {
    ASSET_PATH,
    DIFFICULTY_SETTINGS,
    STAGES,
    MAP_SITE_ARTWORK,
    SPRITES,
  };
})();
