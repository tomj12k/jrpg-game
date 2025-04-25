import Phaser from "phaser";

type Item = {
  name: string;
  type: "consumable" | "equipment";
  description: string;
};

const ITEMS: Item[] = [
  { name: "Potion", type: "consumable", description: "Restores 20 HP." },
  { name: "Hi-Potion", type: "consumable", description: "Restores 50 HP." },
  { name: "Mana Herb", type: "consumable", description: "Restores 20 MP." },
  { name: "Iron Sword", type: "equipment", description: "A basic sword for warriors." },
  { name: "Cloth Robe", type: "equipment", description: "Simple robe for mages." },
];

const INVENTORY_KEY = "playerInventory";

export default class InventoryScene extends Phaser.Scene {
  private inventory: { name: string; count: number }[] = [];
  private selectedIndex: number = 0;
  private itemTexts: Phaser.GameObjects.Text[] = [];
  private descText?: Phaser.GameObjects.Text;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private escKey!: Phaser.Input.Keyboard.Key;
  private equipKey!: Phaser.Input.Keyboard.Key;
  private equipped: { weapon?: Item; armor?: Item } = {};

  constructor() {
    super({ key: "InventoryScene" });
  }

  create() {
    // Load inventory from registry (shared, stacked)
    this.inventory = [...(this.registry.get(INVENTORY_KEY) || [])];

    this.add.rectangle(400, 300, 800, 600, 0x222244);
    this.add.text(400, 60, "Inventory", { font: "32px Arial", color: "#fff" }).setOrigin(0.5);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.renderInventory();
    this.showDescription();

    this.input.keyboard!.on("keydown-UP", this.moveUp, this);
    this.input.keyboard!.on("keydown-DOWN", this.moveDown, this);
    this.input.keyboard!.on("keydown-ESC", this.closeInventory, this);
  }

  renderInventory() {
    this.itemTexts.forEach(t => t.destroy());
    this.itemTexts = [];
    this.inventory.forEach((item, idx) => {
      let label = `${item.name} x${item.count}`;
      // Find item type for display
      const itemDef = ITEMS.find(i => i.name === item.name);
      if (itemDef && itemDef.type === "equipment") {
        if (this.equipped.weapon && this.equipped.weapon.name === item.name) {
          label += " (Equipped)";
        }
        if (this.equipped.armor && this.equipped.armor.name === item.name) {
          label += " (Equipped)";
        }
      }
      const text = this.add.text(200, 120 + idx * 40, label, {
        font: "24px Arial",
        color: idx === this.selectedIndex ? "#ff0" : "#fff",
      });
      this.itemTexts.push(text);
    });
  }

  showDescription() {
    if (this.descText) this.descText.destroy();
    const item = this.inventory[this.selectedIndex];
    const itemDef = item ? ITEMS.find(i => i.name === item.name) : undefined;
    let desc = itemDef ? itemDef.description : "";
    if (itemDef && itemDef.type === "equipment") {
      if (this.equipped.weapon && this.equipped.weapon.name === item.name) {
        desc += " (Currently equipped as weapon)";
      }
      if (this.equipped.armor && this.equipped.armor.name === item.name) {
        desc += " (Currently equipped as armor)";
      }
    }
    this.descText = this.add.text(400, 500, desc, {
      font: "22px Arial",
      color: "#fff",
      backgroundColor: "#222",
      padding: { left: 10, right: 10, top: 4, bottom: 4 },
    }).setOrigin(0.5);
  }

  moveUp() {
    this.selectedIndex = (this.selectedIndex - 1 + this.inventory.length) % this.inventory.length;
    this.renderInventory();
    this.showDescription();
  }

  moveDown() {
    this.selectedIndex = (this.selectedIndex + 1) % this.inventory.length;
    this.renderInventory();
    this.showDescription();
  }

  equipItem() {
    const item = this.inventory[this.selectedIndex];
    const itemDef = item ? ITEMS.find(i => i.name === item.name) : undefined;
    if (item && itemDef && itemDef.type === "equipment") {
      // For demo: if name contains "Sword", equip as weapon; if "Robe", equip as armor
      if (item.name.toLowerCase().includes("sword")) {
        this.equipped.weapon = itemDef;
      } else if (item.name.toLowerCase().includes("robe")) {
        this.equipped.armor = itemDef;
      }
      this.renderInventory();
      this.showDescription();
    }
  }

  closeInventory() {
    this.input.keyboard!.off("keydown-UP", this.moveUp, this);
    this.input.keyboard!.off("keydown-DOWN", this.moveDown, this);
    this.input.keyboard!.off("keydown-ESC", this.closeInventory, this);
    this.input.keyboard!.off("keydown-E", this.equipItem, this);
    this.scene.stop();
    this.scene.resume("TownScene");
  }
}
