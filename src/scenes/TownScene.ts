import Phaser from "phaser";

type NPCData = { x: number; y: number; color: number; message: string };

const TOWN_NPCS: Record<string, NPCData[]> = {
  "Start Town": [
    { x: 600, y: 300, color: 0x00ccff, message: "Welcome to Start Town! Find quests and explore." },
    { x: 300, y: 200, color: 0xff66cc, message: "Have you visited the world map? Press M!" },
    { x: 500, y: 500, color: 0x66ff66, message: "I heard there are treasures in the mountains." }
  ],
  "River City": [
    { x: 400, y: 250, color: 0x3399ff, message: "River City is famous for its bridges." },
    { x: 600, y: 400, color: 0xffcc00, message: "The river is dangerous at night." }
  ],
  "Mountain Village": [
    { x: 200, y: 400, color: 0x996633, message: "Welcome to the mountains!" },
    { x: 700, y: 200, color: 0xcccccc, message: "The air is thin up here." }
  ],
  "Forest Hamlet": [
    { x: 350, y: 500, color: 0x33cc33, message: "The forest is full of secrets." }
  ],
  "Desert Outpost": [
    { x: 700, y: 120, color: 0xff9933, message: "It's hot in the desert!" }
  ]
};

export default class TownScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private npcs: { sprite: Phaser.GameObjects.Rectangle; x: number; y: number; message: string }[] = [];
  private interactKey!: Phaser.Input.Keyboard.Key;
  private interactText?: Phaser.GameObjects.Text;
  private messageText?: Phaser.GameObjects.Text;
  private mapKey!: Phaser.Input.Keyboard.Key;
  private mapPromptText?: Phaser.GameObjects.Text;
  private inventoryKey!: Phaser.Input.Keyboard.Key;
  private townName: string = "Start Town";
  private attributeKey!: Phaser.Input.Keyboard.Key;
  private equipmentKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: "TownScene" });
  }

  init(data: { townName?: string }) {
    if (data.townName) {
      this.townName = data.townName;
    }
  }

  create() {
    // Debug log
    // @ts-ignore
    window.console && console.log("TownScene create() for", this.townName);
    // Placeholder: simple background
    this.add.rectangle(400, 300, 800, 600, 0x334455);

    // Player: simple rectangle for now
    this.player = this.add.rectangle(400, 300, 32, 48, 0xffcc00);
    this.cursors = this.input.keyboard!.createCursorKeys();

    // NPCs: unique per town
    const npcData = TOWN_NPCS[this.townName] || [];
    this.npcs = npcData.map(data => ({
      sprite: this.add.rectangle(data.x, data.y, 32, 48, data.color),
      x: data.x,
      y: data.y,
      message: data.message
    }));

    // Interaction key
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // Map key
    this.mapKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.M);

    // Inventory key
    this.inventoryKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.I);

    // Instructions
    this.add.text(400, 40, `Use arrow keys to move. (8 directions)`, {
      font: "20px Arial",
      color: "#fff",
    }).setOrigin(0.5);

    // Attribute key
    this.attributeKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);

    // Equipment key
    this.equipmentKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Q);

    // Map prompt
    this.mapPromptText = this.add.text(400, 70, "M: World Map  I: Inventory  A: Attributes  Q: Equipment", {
      font: "18px Arial",
      color: "#fff",
    }).setOrigin(0.5);

    // Town name display
    this.add.text(400, 100, this.townName, {
      font: "24px Arial",
      color: "#ff0",
    }).setOrigin(0.5);
  }

  update() {
    const speed = 3;
    let vx = 0;
    let vy = 0;

    if (this.cursors.left?.isDown) vx -= 1;
    if (this.cursors.right?.isDown) vx += 1;
    if (this.cursors.up?.isDown) vy -= 1;
    if (this.cursors.down?.isDown) vy += 1;

    // Normalize for diagonal movement
    if (vx !== 0 && vy !== 0) {
      vx *= Math.SQRT1_2;
      vy *= Math.SQRT1_2;
    }

    this.player.x += vx * speed;
    this.player.y += vy * speed;

    // NPC interaction (for all NPCs)
    let foundNearby = false;
    for (const npc of this.npcs) {
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        npc.x, npc.y
      );
      if (dist < 50) {
        foundNearby = true;
        if (!this.interactText) {
          this.interactText = this.add.text(npc.x, npc.y - 40, "Press E to talk", {
            font: "18px Arial",
            color: "#fff",
            backgroundColor: "#222",
            padding: { left: 6, right: 6, top: 2, bottom: 2 },
          }).setOrigin(0.5);
        }
        if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
          this.showMessage("NPC: " + npc.message);
        }
        break;
      }
    }
    if (!foundNearby && this.interactText) {
      this.interactText.destroy();
      this.interactText = undefined;
    }

    // Inventory open
    if (Phaser.Input.Keyboard.JustDown(this.inventoryKey)) {
      this.scene.launch("InventoryScene");
      this.scene.pause();
    }

    // Attribute allocation open
    if (Phaser.Input.Keyboard.JustDown(this.attributeKey)) {
      this.scene.launch("AttributeScene");
      this.scene.pause();
    }

    // Equipment menu open
    if (Phaser.Input.Keyboard.JustDown(this.equipmentKey)) {
      this.scene.launch("EquipmentScene");
      this.scene.pause();
    }

    // World map open
    if (Phaser.Input.Keyboard.JustDown(this.mapKey)) {
      this.scene.start("WorldMapScene");
    }
  }

  showMessage(msg: string) {
    if (this.messageText) this.messageText.destroy();
    this.messageText = this.add.text(400, 550, msg, {
      font: "20px Arial",
      color: "#ff0",
      backgroundColor: "#222",
      padding: { left: 10, right: 10, top: 4, bottom: 4 },
    }).setOrigin(0.5);

    this.time.delayedCall(2500, () => {
      if (this.messageText) {
        this.messageText.destroy();
        this.messageText = undefined;
      }
    });
  }
}
