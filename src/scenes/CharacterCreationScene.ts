import Phaser from "phaser";

const CLASSES = [
  { name: "Warrior", description: "Strong melee fighter with heavy armor." },
  { name: "Mage", description: "Master of spells and elemental magic." },
  { name: "Healer", description: "Restores health and supports allies." },
  { name: "Rogue", description: "Agile and stealthy, excels at critical hits." },
];

const DIFFICULTIES = ["Easy", "Medium", "Hard"];

export default class CharacterCreationScene extends Phaser.Scene {
  private step: number = 0;
  private playerName: string = "adam";
  private selectedClass: number = 0;
  private selectedDifficulty: number = 0;
  private inputText?: Phaser.GameObjects.Text;
  private promptText?: Phaser.GameObjects.Text;
  private classTexts: Phaser.GameObjects.Text[] = [];
  private difficultyTexts: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: "CharacterCreationScene" });
  }

  create() {
    this.step = 0;
    this.showNamePrompt();
  }

  showNamePrompt() {
    this.clearScene();
    this.promptText = this.add.text(400, 180, "Enter your character's name:", {
      font: "28px Arial",
      color: "#fff",
    }).setOrigin(0.5);

    this.inputText = this.add.text(400, 240, this.playerName, {
      font: "32px Arial",
      color: "#ff0",
      backgroundColor: "#222",
      padding: { left: 10, right: 10, top: 4, bottom: 4 },
    }).setOrigin(0.5);

    this.input.keyboard!.on("keydown", this.handleNameInput, this);
  }

  handleNameInput(event: KeyboardEvent) {
    if (!this.inputText) return;
    if (event.key === "Backspace") {
      this.playerName = this.playerName.slice(0, -1);
      if (this.inputText) this.inputText.setText(this.playerName);
    } else if (event.key === "Enter") {
      if (this.playerName.length > 0) {
        this.input.keyboard!.off("keydown", this.handleNameInput, this);
        if (this.inputText) this.inputText.setText(this.playerName);
        this.showClassSelection();
      }
    } else if (event.key.length === 1 && this.playerName.length < 12) {
      this.playerName += event.key;
      if (this.inputText) this.inputText.setText(this.playerName);
    }
  }

  showClassSelection() {
    this.clearScene();
    this.promptText = this.add.text(400, 120, "Choose your class:", {
      font: "28px Arial",
      color: "#fff",
    }).setOrigin(0.5);

    CLASSES.forEach((cls, idx) => {
      const text = this.add.text(400, 200 + idx * 60, `${cls.name} - ${cls.description}`, {
        font: "24px Arial",
        color: idx === this.selectedClass ? "#ff0" : "#fff",
      }).setOrigin(0.5);
      this.classTexts.push(text);
    });

    this.input.keyboard!.on("keydown-UP", this.moveClassUp, this);
    this.input.keyboard!.on("keydown-DOWN", this.moveClassDown, this);
    this.input.keyboard!.on("keydown-ENTER", this.selectClass, this);
    this.input.keyboard!.on("keydown-SPACE", this.selectClass, this);
  }

  moveClassUp() {
    this.selectedClass = (this.selectedClass - 1 + CLASSES.length) % CLASSES.length;
    this.updateClassMenu();
  }

  moveClassDown() {
    this.selectedClass = (this.selectedClass + 1) % CLASSES.length;
    this.updateClassMenu();
  }

  updateClassMenu() {
    this.classTexts.forEach((text, idx) => {
      text.setColor(idx === this.selectedClass ? "#ff0" : "#fff");
    });
  }

  selectClass() {
    this.input.keyboard!.off("keydown-UP", this.moveClassUp, this);
    this.input.keyboard!.off("keydown-DOWN", this.moveClassDown, this);
    this.input.keyboard!.off("keydown-ENTER", this.selectClass, this);
    this.input.keyboard!.off("keydown-SPACE", this.selectClass, this);
    this.showDifficultySelection();
  }

  showDifficultySelection() {
    this.clearScene();
    this.promptText = this.add.text(400, 120, "Select difficulty:", {
      font: "28px Arial",
      color: "#fff",
    }).setOrigin(0.5);

    DIFFICULTIES.forEach((diff, idx) => {
      const text = this.add.text(400, 220 + idx * 60, diff, {
        font: "28px Arial",
        color: idx === this.selectedDifficulty ? "#ff0" : "#fff",
      }).setOrigin(0.5);
      this.difficultyTexts.push(text);
    });

    this.input.keyboard!.on("keydown-UP", this.moveDifficultyUp, this);
    this.input.keyboard!.on("keydown-DOWN", this.moveDifficultyDown, this);
    this.input.keyboard!.on("keydown-ENTER", this.selectDifficulty, this);
    this.input.keyboard!.on("keydown-SPACE", this.selectDifficulty, this);
  }

  moveDifficultyUp() {
    this.selectedDifficulty = (this.selectedDifficulty - 1 + DIFFICULTIES.length) % DIFFICULTIES.length;
    this.updateDifficultyMenu();
  }

  moveDifficultyDown() {
    this.selectedDifficulty = (this.selectedDifficulty + 1) % DIFFICULTIES.length;
    this.updateDifficultyMenu();
  }

  updateDifficultyMenu() {
    this.difficultyTexts.forEach((text, idx) => {
      text.setColor(idx === this.selectedDifficulty ? "#ff0" : "#fff");
    });
  }

  selectDifficulty() {
    this.input.keyboard!.off("keydown-UP", this.moveDifficultyUp, this);
    this.input.keyboard!.off("keydown-DOWN", this.moveDifficultyDown, this);
    this.input.keyboard!.off("keydown-ENTER", this.selectDifficulty, this);
    this.input.keyboard!.off("keydown-SPACE", this.selectDifficulty, this);

    // Save selected difficulty to registry
    this.registry.set("difficulty", DIFFICULTIES[this.selectedDifficulty]);

    // Initialize inventory with 5 potions (stacked)
    this.registry.set("playerInventory", [
      { name: "Potion", count: 5 }
    ]);

    // Optionally, pass character data to TownScene via registry or a global object
    // For now, just start the town scene
    this.scene.start("TownScene");
  }

  clearScene() {
    this.children.removeAll();
    this.classTexts = [];
    this.difficultyTexts = [];
    this.inputText = undefined;
    this.promptText = undefined;
  }
}
