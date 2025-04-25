import Phaser from "phaser";

const MENU_OPTIONS = ["Start Game", "Load Game", "Options", "Exit"];

export default class MainMenuScene extends Phaser.Scene {
  private selectedOption: number = 0;
  private menuTexts: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: "MainMenuScene" });
  }

  create() {
    const title = this.add.text(400, 120, "JRPG Game", {
      font: "48px Arial",
      color: "#fff",
    }).setOrigin(0.5);

    MENU_OPTIONS.forEach((option, idx) => {
      const text = this.add.text(400, 250 + idx * 60, option, {
        font: "32px Arial",
        color: idx === this.selectedOption ? "#ff0" : "#fff",
      }).setOrigin(0.5);
      this.menuTexts.push(text);
    });

    this.input.keyboard!.on("keydown-UP", this.moveUp, this);
    this.input.keyboard!.on("keydown-DOWN", this.moveDown, this);
    this.input.keyboard!.on("keydown-ENTER", this.selectOption, this);
    this.input.keyboard!.on("keydown-SPACE", this.selectOption, this);
  }

  moveUp() {
    this.selectedOption = (this.selectedOption - 1 + MENU_OPTIONS.length) % MENU_OPTIONS.length;
    this.updateMenu();
  }

  moveDown() {
    this.selectedOption = (this.selectedOption + 1) % MENU_OPTIONS.length;
    this.updateMenu();
  }

  updateMenu() {
    this.menuTexts.forEach((text, idx) => {
      text.setColor(idx === this.selectedOption ? "#ff0" : "#fff");
    });
  }

  selectOption() {
    const option = MENU_OPTIONS[this.selectedOption];
    switch (option) {
      case "Start Game":
        this.scene.start("CharacterCreationScene");
        break;
      case "Load Game":
        // TODO: Implement load game
        break;
      case "Options":
        // TODO: Implement options menu
        break;
      case "Exit":
        // In browser, can't close tab, so maybe show a message
        this.add.text(400, 520, "Thank you for playing!", {
          font: "24px Arial",
          color: "#fff",
        }).setOrigin(0.5);
        break;
    }
  }
}
