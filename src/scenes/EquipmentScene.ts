import Phaser from "phaser";

const EQUIPMENT_SLOTS = [
  "Helmet", "Chest", "Legs", "Accessory 1", "Accessory 2", "Accessory 3", "Weapon 1", "Weapon 2"
];
const PLAYER_KEY = "playerData";
const INVENTORY_KEY = "playerInventory";
const ITEMS = [
  { name: "Iron Helmet", slot: "Helmet", stats: { defence: 2 } },
  { name: "Iron Chest", slot: "Chest", stats: { defence: 4 } },
  { name: "Iron Leggings", slot: "Legs", stats: { defence: 3 } },
  { name: "Ring of Power", slot: "Accessory", stats: { strength: 2 } },
  { name: "Amulet of Spirit", slot: "Accessory", stats: { spirit: 2 } },
  { name: "Iron Sword", slot: "Weapon", stats: { attack: 5 } },
  { name: "Wooden Shield", slot: "Weapon", stats: { defence: 2 } }
];

type Equipment = { [slot: string]: string | null };

export default class EquipmentScene extends Phaser.Scene {
  private player: any;
  private inventory: { name: string; count: number }[] = [];
  private equipment: Equipment = {};
  private slotIndex: number = 0;
  private slotTexts: Phaser.GameObjects.Text[] = [];
  private infoText!: Phaser.GameObjects.Text;
  private statText!: Phaser.GameObjects.Text;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: "EquipmentScene" });
  }

  create() {
    this.player = { ...this.registry.get(PLAYER_KEY) };
    this.inventory = [...(this.registry.get(INVENTORY_KEY) || [])];
    this.equipment = this.player.equipment || {};
    for (let i = 0; i < EQUIPMENT_SLOTS.length; i++) {
      const slot = EQUIPMENT_SLOTS[i];
      if (!(slot in this.equipment)) this.equipment[slot] = null;
    }

    this.add.rectangle(400, 300, 800, 600, 0x333355);
    this.add.text(400, 60, "Equipment", { font: "32px Arial", color: "#fff" }).setOrigin(0.5);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.infoText = this.add.text(400, 120, "", { font: "22px Arial", color: "#ff0" }).setOrigin(0.5);
    this.statText = this.add.text(600, 300, "", { font: "20px Arial", color: "#fff", align: "center" }).setOrigin(0.5);

    this.renderSlots();
    this.updateInfo();

    this.input.keyboard!.on("keydown-UP", this.moveUp, this);
    this.input.keyboard!.on("keydown-DOWN", this.moveDown, this);
    this.input.keyboard!.on("keydown-ENTER", this.equipOrUnequip, this);
    this.input.keyboard!.on("keydown-ESC", this.closeScene, this);
  }

  renderSlots() {
    this.slotTexts.forEach(t => t.destroy());
    this.slotTexts = [];
    for (let i = 0; i < EQUIPMENT_SLOTS.length; i++) {
      const slot = EQUIPMENT_SLOTS[i];
      const equipped = this.equipment[slot];
      const label = `${slot}: ${equipped ? equipped : "(empty)"}`;
      const text = this.add.text(200, 180 + i * 36, label, {
        font: "22px Arial",
        color: i === this.slotIndex ? "#ff0" : "#fff"
      });
      this.slotTexts.push(text);
    }
  }

  updateInfo() {
    const slot = EQUIPMENT_SLOTS[this.slotIndex];
    const equipped = this.equipment[slot];
    let info = `Slot: ${slot}\n`;
    if (equipped) {
      info += `Equipped: ${equipped}\nPress Enter to unequip.`;
    } else {
      // Show possible items to equip
      const candidates = this.inventory.filter(i => {
        const itemDef = ITEMS.find(it => it.name === i.name);
        if (!itemDef) return false;
        if (slot.startsWith("Accessory")) return itemDef.slot === "Accessory";
        if (slot.startsWith("Weapon")) return itemDef.slot === "Weapon";
        return itemDef.slot === slot;
      });
      if (candidates.length > 0) {
        info += `Press Enter to equip: ${candidates[0].name}`;
      } else {
        info += "No items to equip.";
      }
    }
    this.infoText.setText(info);

    // Show stat preview
    const currentStats = this.calculateStats(this.equipment);
    let previewStats = { ...currentStats };
    const slotName = EQUIPMENT_SLOTS[this.slotIndex];
    if (!equipped) {
      // Preview first available item
      const candidates = this.inventory.filter(i => {
        const itemDef = ITEMS.find(it => it.name === i.name);
        if (!itemDef) return false;
        if (slotName.startsWith("Accessory")) return itemDef.slot === "Accessory";
        if (slotName.startsWith("Weapon")) return itemDef.slot === "Weapon";
        return itemDef.slot === slotName;
      });
      if (candidates.length > 0) {
        const itemDef = ITEMS.find(it => it.name === candidates[0].name);
        if (itemDef) {
          const newEquip = { ...this.equipment };
          newEquip[slotName] = itemDef.name;
          previewStats = this.calculateStats(newEquip);
        }
      }
    }
    let statStr = "Current Stats:\n";
    for (const k in currentStats) {
      statStr += `${k}: ${currentStats[k]}`;
      if (previewStats[k] !== currentStats[k]) statStr += ` → ${previewStats[k]}`;
      statStr += "\n";
    }
    this.statText.setText(statStr);
  }

  calculateStats(equip: Equipment) {
    // Base stats
    let stats: any = {
      attack: this.player.attack,
      defence: this.player.defense,
      strength: this.player.strength,
      agility: this.player.agility,
      stamina: this.player.stamina,
      intellect: this.player.intellect,
      spirit: this.player.spirit
    };
    for (const slot in equip) {
      const name = equip[slot];
      if (!name) continue;
      const itemDef = ITEMS.find(i => i.name === name);
      if (itemDef && itemDef.stats) {
        for (const k in itemDef.stats) {
          stats[k] = (stats[k] || 0) + (itemDef.stats as any)[k];
        }
      }
    }
    return stats;
  }

  moveUp() {
    this.slotIndex = (this.slotIndex - 1 + EQUIPMENT_SLOTS.length) % EQUIPMENT_SLOTS.length;
    this.renderSlots();
    this.updateInfo();
  }

  moveDown() {
    this.slotIndex = (this.slotIndex + 1) % EQUIPMENT_SLOTS.length;
    this.renderSlots();
    this.updateInfo();
  }

  equipOrUnequip() {
    const slot = EQUIPMENT_SLOTS[this.slotIndex];
    const equipped = this.equipment[slot];
    if (equipped) {
      // Unequip
      this.equipment[slot] = null;
      this.player.equipment = { ...this.equipment };
      this.registry.set(PLAYER_KEY, { ...this.player });
      this.renderSlots();
      this.updateInfo();
      return;
    }
    // Equip first available item
    const candidates = this.inventory.filter(i => {
      const itemDef = ITEMS.find(it => it.name === i.name);
      if (!itemDef) return false;
      if (slot.startsWith("Accessory")) return itemDef.slot === "Accessory";
      if (slot.startsWith("Weapon")) return itemDef.slot === "Weapon";
      return itemDef.slot === slot;
    });
    if (candidates.length > 0) {
      const itemDef = ITEMS.find(it => it.name === candidates[0].name);
      if (itemDef) {
        this.equipment[slot] = itemDef.name;
        this.player.equipment = { ...this.equipment };
        this.registry.set(PLAYER_KEY, { ...this.player });
        this.renderSlots();
        this.updateInfo();
      }
    }
  }

  closeScene() {
    this.input.keyboard!.off("keydown-UP", this.moveUp, this);
    this.input.keyboard!.off("keydown-DOWN", this.moveDown, this);
    this.input.keyboard!.off("keydown-ENTER", this.equipOrUnequip, this);
    this.input.keyboard!.off("keydown-ESC", this.closeScene, this);
    this.scene.stop();
    this.scene.resume("TownScene");
  }
}
