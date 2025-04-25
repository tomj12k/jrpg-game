import Phaser from "phaser";

const ATTRIBUTES = ["Strength", "Agility", "Stamina", "Intellect", "Spirit", "Defence"];
const PLAYER_KEY = "playerData";

export default class AttributeScene extends Phaser.Scene {
  private player: any;
  private attrTexts: Phaser.GameObjects.Text[] = [];
  private infoText!: Phaser.GameObjects.Text;
  private attrIndex: number = 0;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: "AttributeScene" });
  }

  create() {
    this.player = { ...this.registry.get(PLAYER_KEY) };

    this.add.rectangle(400, 300, 800, 600, 0x223344);
    this.add.text(400, 60, "Attribute Allocation", { font: "32px Arial", color: "#fff" }).setOrigin(0.5);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.infoText = this.add.text(400, 120, "", { font: "22px Arial", color: "#ff0" }).setOrigin(0.5);

    this.renderAttributes();
    this.updateInfo();

    this.input.keyboard!.on("keydown-LEFT", this.moveLeft, this);
    this.input.keyboard!.on("keydown-RIGHT", this.moveRight, this);
    this.input.keyboard!.on("keydown-ENTER", this.spendPoint, this);
    this.input.keyboard!.on("keydown-ESC", this.closeScene, this);
  }

  renderAttributes() {
    this.attrTexts.forEach(t => t.destroy());
    this.attrTexts = [];
    ATTRIBUTES.forEach((attr, i) => {
      const value = this.player[attr.toLowerCase()];
      const text = this.add.text(180 + i * 100, 300, `${attr}\n${value}`, {
        font: "22px Arial",
        color: i === this.attrIndex ? "#ff0" : "#fff",
        align: "center"
      }).setOrigin(0.5);
      this.attrTexts.push(text);
    });
  }

  updateInfo() {
    this.infoText.setText(`Attribute Points: ${this.player.attributePoints}\nUse ←/→ to select, Enter to spend, ESC to exit`);
  }

  moveLeft() {
    this.attrIndex = (this.attrIndex - 1 + ATTRIBUTES.length) % ATTRIBUTES.length;
    this.renderAttributes();
    this.updateInfo();
  }

  moveRight() {
    this.attrIndex = (this.attrIndex + 1) % ATTRIBUTES.length;
    this.renderAttributes();
    this.updateInfo();
  }

  spendPoint() {
    if (this.player.attributePoints > 0) {
      const attr = ATTRIBUTES[this.attrIndex].toLowerCase();
      this.player[attr] += 1;
      this.player.attributePoints -= 1;
      if (attr === "stamina") {
        this.player.maxHp += 5;
        this.player.hp += 5;
      }
      this.registry.set(PLAYER_KEY, { ...this.player });
      this.renderAttributes();
      this.updateInfo();
    }
  }

  closeScene() {
    this.input.keyboard!.off("keydown-LEFT", this.moveLeft, this);
    this.input.keyboard!.off("keydown-RIGHT", this.moveRight, this);
    this.input.keyboard!.off("keydown-ENTER", this.spendPoint, this);
    this.input.keyboard!.off("keydown-ESC", this.closeScene, this);
    this.scene.stop();
    this.scene.resume("TownScene");
  }
}
