import Phaser from "phaser";

type City = {
  name: string;
  x: number;
  y: number;
};

const CITIES: City[] = [
  { name: "Start Town", x: 200, y: 300 },
  { name: "River City", x: 400, y: 180 },
  { name: "Mountain Village", x: 600, y: 400 },
  { name: "Forest Hamlet", x: 300, y: 500 },
  { name: "Desert Outpost", x: 700, y: 120 },
];

type EnemyType = {
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  strength: number;
  agility: number;
  stamina: number;
  intellect: number;
  spirit: number;
  defence: number;
  drop?: string;
};

const ENEMIES: EnemyType[] = [
  {
    name: "Slime",
    hp: 18,
    maxHp: 18,
    attack: 5,
    defense: 1,
    strength: 3,
    agility: 2,
    stamina: 2,
    intellect: 1,
    spirit: 1,
    defence: 1,
    drop: "Potion"
  },
  {
    name: "Goblin",
    hp: 24,
    maxHp: 24,
    attack: 7,
    defense: 2,
    strength: 5,
    agility: 4,
    stamina: 3,
    intellect: 1,
    spirit: 1,
    defence: 2,
    drop: "Iron Sword"
  },
  {
    name: "Bat",
    hp: 14,
    maxHp: 14,
    attack: 4,
    defense: 1,
    strength: 2,
    agility: 6,
    stamina: 2,
    intellect: 1,
    spirit: 1,
    defence: 1,
    drop: "Mana Herb"
  },
  {
    name: "Skeleton",
    hp: 30,
    maxHp: 30,
    attack: 8,
    defense: 3,
    strength: 6,
    agility: 3,
    stamina: 4,
    intellect: 2,
    spirit: 2,
    defence: 3,
    drop: "Cloth Robe"
  }
];

export default class WorldMapScene extends Phaser.Scene {
  private cityMarkers: Phaser.GameObjects.Ellipse[] = [];
  private cityTexts: Phaser.GameObjects.Text[] = [];
  private selectedCity: number = 0;
  private playerMarker!: Phaser.GameObjects.Triangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private enterKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: "WorldMapScene" });
  }

  create() {
    // Debug log
    // @ts-ignore
    window.console && console.log("WorldMapScene create()");
    // Background
    this.add.rectangle(400, 300, 800, 600, 0x224422);

    // Draw cities
    CITIES.forEach((city, idx) => {
      const marker = this.add.ellipse(city.x, city.y, 32, 32, 0xcccccc);
      this.cityMarkers.push(marker);
      const text = this.add.text(city.x, city.y + 28, city.name, {
        font: "18px Arial",
        color: "#fff",
      }).setOrigin(0.5, 0);
      this.cityTexts.push(text);
    });

    // Player marker (triangle)
    const city = CITIES[this.selectedCity];
    this.playerMarker = this.add.triangle(city.x, city.y - 28, 0, 32, 16, 0, 32, 32, 0xffcc00);

    // Controls
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    // Instructions
    this.add.text(400, 40, "World Map: Arrow keys to move, Enter to enter city", {
      font: "20px Arial",
      color: "#fff",
    }).setOrigin(0.5);
  }

  update() {
    let moved = false;
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left!)) {
      this.selectedCity = (this.selectedCity - 1 + CITIES.length) % CITIES.length;
      moved = true;
    }
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right!)) {
      this.selectedCity = (this.selectedCity + 1) % CITIES.length;
      moved = true;
    }
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up!)) {
      this.selectedCity = (this.selectedCity - 1 + CITIES.length) % CITIES.length;
      moved = true;
    }
    if (Phaser.Input.Keyboard.JustDown(this.cursors.down!)) {
      this.selectedCity = (this.selectedCity + 1) % CITIES.length;
      moved = true;
    }
    if (moved) {
      // 80% chance for a random encounter (faster for testing)
      if (Math.random() < 0.8) {
        // Pick a random enemy
        const enemy = ENEMIES[Math.floor(Math.random() * ENEMIES.length)];
        this.scene.start("BattleScene", { enemy });
        return;
      }
      const city = CITIES[this.selectedCity];
      this.playerMarker.setPosition(city.x, city.y - 28);
    }

    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      // Enter the selected city, pass the city name to TownScene
      const city = CITIES[this.selectedCity];
      this.scene.start("TownScene", { townName: city.name });
    }
  }
}
