import Phaser from "phaser";

type Combatant = {
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  xp: number;
  level: number;
  attributePoints: number;
  strength: number;
  agility: number;
  stamina: number;
  intellect: number;
  spirit: number;
  defence: number;
};

export default class BattleScene extends Phaser.Scene {
  private player!: Combatant;
  private playerKey: string = "playerData";
  private enemy!: Combatant;
  private pendingDrop?: string;
  private inventory: { name: string; count: number }[] = [];
  private playerHpText!: Phaser.GameObjects.Text;
  private enemyHpText!: Phaser.GameObjects.Text;
  private playerXpText!: Phaser.GameObjects.Text;
  private playerLevelText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;
  private attrTexts: Phaser.GameObjects.Text[] = [];
  private inAttributeSpend: boolean = false;
  private attrIndex: number = 0;
  private attributes = ["Strength", "Agility", "Stamina", "Intellect", "Spirit", "Defence"];
  private actionIndex: number = 0;
  private actions = ["Attack", "Defend", "Items", "Run", "Spells", "Abilities"];
  private actionTexts: Phaser.GameObjects.Text[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;
  private inPlayerTurn: boolean = true;
  private inItemMenu: boolean = false;
  private itemMenuIndex: number = 0;
  private itemMenuTexts: Phaser.GameObjects.Text[] = [];
  private maxLevel: number = 100;

  constructor() {
    super({ key: "BattleScene" });
  }

  create(data: { enemy?: any } = {}) {
    // Reset all state
    this.inPlayerTurn = true;
    this.inAttributeSpend = false;
    this.inItemMenu = false;
    this.actionIndex = 0;
    this.attrIndex = 0;
    this.itemMenuIndex = 0;
    this.pendingDrop = undefined;
    this.actionTexts = [];
    this.attrTexts = [];
    this.itemMenuTexts = [];
    this.inventory = [];
    // Load player from registry or create new
    const regPlayer = this.registry.get(this.playerKey);
    if (regPlayer) {
      this.player = { ...regPlayer };
    } else {
      this.player = {
        name: "Hero",
        hp: 30,
        maxHp: 30,
        attack: 8,
        defense: 3,
        xp: 0,
        level: 1,
        attributePoints: 0,
        strength: 5,
        agility: 5,
        stamina: 5,
        intellect: 5,
        spirit: 5,
        defence: 5
      };
      this.registry.set(this.playerKey, { ...this.player });
    }
    // Load inventory from registry
    this.inventory = [...(this.registry.get("playerInventory") || [])];

    // Use passed enemy or default
    if (data.enemy) {
      // Only assign known Combatant properties
      const { name, hp, maxHp, attack, defense, strength, agility, stamina, intellect, spirit, defence } = data.enemy;
      this.enemy = {
        name, hp, maxHp, attack, defense, xp: 0, level: 1, attributePoints: 0,
        strength, agility, stamina, intellect, spirit, defence
      };
      this.pendingDrop = data.enemy.drop;
    } else {
      this.enemy = {
        name: "Slime",
        hp: 18,
        maxHp: 18,
        attack: 5,
        defense: 1,
        xp: 0,
        level: 1,
        attributePoints: 0,
        strength: 3,
        agility: 2,
        stamina: 2,
        intellect: 1,
        spirit: 1,
        defence: 1
      };
      this.pendingDrop = "Potion";
    }

    this.add.rectangle(400, 300, 800, 600, 0x222222);

    this.add.text(400, 60, "Battle!", { font: "32px Arial", color: "#fff" }).setOrigin(0.5);

    this.playerHpText = this.add.text(100, 120, "", { font: "20px Arial", color: "#fff" });
    this.enemyHpText = this.add.text(600, 120, "", { font: "20px Arial", color: "#fff" });
    this.playerXpText = this.add.text(100, 160, "", { font: "20px Arial", color: "#fff" });
    this.playerLevelText = this.add.text(100, 200, "", { font: "20px Arial", color: "#fff" });

    this.messageText = this.add.text(400, 400, "", { font: "24px Arial", color: "#ff0" }).setOrigin(0.5);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.createActionMenu();
    this.updateStatsTexts();
    this.showMessage("A wild Slime appears!");
  }

  createActionMenu() {
    this.actionTexts.forEach(t => t.destroy());
    this.actionTexts = [];
    const startX = 120;
    const y = 540;
    const spacing = 160;
    this.actions.forEach((action, idx) => {
      const text = this.add.text(startX + idx * spacing, y, action, {
        font: "28px Arial",
        color: idx === this.actionIndex ? "#ff0" : "#fff",
      }).setOrigin(0.5);
      this.actionTexts.push(text);
    });
  }

  updateActionMenu() {
    this.actionTexts.forEach((text, idx) => {
      text.setColor(idx === this.actionIndex ? "#ff0" : "#fff");
    });
  }

  updateStatsTexts() {
    this.playerHpText.setText(`${this.player.name} HP: ${this.player.hp}/${this.player.maxHp}`);
    this.enemyHpText.setText(`${this.enemy.name} HP: ${this.enemy.hp}/${this.enemy.maxHp}`);
    this.playerXpText.setText(`XP: ${this.player.xp} / ${this.xpForNextLevel()}`);
    this.playerLevelText.setText(`Level: ${this.player.level}  AP: ${this.player.attributePoints}`);

    // Show attributes
    this.attrTexts.forEach(t => t.destroy());
    this.attrTexts = [];
    const attrs = [
      `STR: ${this.player.strength}`,
      `AGI: ${this.player.agility}`,
      `STA: ${this.player.stamina}`,
      `INT: ${this.player.intellect}`,
      `SPI: ${this.player.spirit}`,
      `DEF: ${this.player.defence}`
    ];
    attrs.forEach((txt, i) => {
      const t = this.add.text(300, 120 + i * 24, txt, {
        font: "18px Arial",
        color: "#fff"
      });
      this.attrTexts.push(t);
    });
  }

  showMessage(msg: string) {
    this.messageText.setText(msg);
  }

  update() {
    if (this.inAttributeSpend) {
      this.handleAttributeSpendInput();
      return;
    }

    if (this.inItemMenu) {
      this.handleItemMenuInput();
      return;
    }

    if (!this.inPlayerTurn) return;

    if (Phaser.Input.Keyboard.JustDown(this.cursors.left!)) {
      this.actionIndex = (this.actionIndex - 1 + this.actions.length) % this.actions.length;
      this.updateActionMenu();
    }
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right!)) {
      this.actionIndex = (this.actionIndex + 1) % this.actions.length;
      this.updateActionMenu();
    }
    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.handlePlayerAction();
    }
  }

  handlePlayerAction() {
    const action = this.actions[this.actionIndex];
    if (action === "Attack") {
      // Strength increases attack, enemy defence reduces damage
      const dmg = Math.max(1, (this.player.attack + Math.floor(this.player.strength / 2)) - (this.enemy.defense + Math.floor(this.enemy.defence / 2)));
      this.enemy.hp = Math.max(0, this.enemy.hp - dmg);
      this.updateStatsTexts();
      this.showMessage(`You attack! ${this.enemy.name} takes ${dmg} damage.`);
      this.inPlayerTurn = false;
      this.time.delayedCall(1200, () => this.checkBattleEndOrEnemyTurn());
    } else if (action === "Defend") {
      this.showMessage("You brace for the next attack!");
      this.inPlayerTurn = false;
      this.time.delayedCall(1200, () => this.enemyTurn(true));
    } else if (action === "Items") {
      this.openItemMenu();
    } else if (action === "Run") {
      this.showMessage("You attempt to run...");
      this.inPlayerTurn = false;
      this.time.delayedCall(1000, () => {
        if (Math.random() < 0.5) {
          this.showMessage("You escaped!");
          this.time.delayedCall(1200, () => this.scene.start("WorldMapScene"));
        } else {
          this.showMessage("Couldn't escape!");
          this.time.delayedCall(1000, () => this.enemyTurn(false));
        }
      });
    } else if (action === "Spells") {
      this.showMessage("No spells learned yet.");
    } else if (action === "Abilities") {
      this.showMessage("No abilities unlocked yet.");
    }
  }

  openItemMenu() {
    this.inItemMenu = true;
    this.itemMenuIndex = 0;
    this.itemMenuTexts.forEach(t => t.destroy());
    this.itemMenuTexts = [];
    const usableItems = this.inventory.filter(i => i.name === "Potion" && i.count > 0);
    if (usableItems.length === 0) {
      this.showMessage("No usable items.");
      this.inItemMenu = false;
      return;
    }
    usableItems.forEach((item, idx) => {
      const text = this.add.text(400, 480 + idx * 32, `${item.name} x${item.count} (Enter to use)`, {
        font: "22px Arial",
        color: idx === this.itemMenuIndex ? "#ff0" : "#fff",
      }).setOrigin(0.5);
      this.itemMenuTexts.push(text);
    });
    this.showMessage("Select an item to use (←/→, Enter, ESC to cancel)");
  }

  handleItemMenuInput() {
    const usableItems = this.inventory.filter(i => i.name === "Potion" && i.count > 0);
    if (usableItems.length === 0) {
      this.inItemMenu = false;
      this.itemMenuTexts.forEach(t => t.destroy());
      this.itemMenuTexts = [];
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left!)) {
      this.itemMenuIndex = (this.itemMenuIndex - 1 + usableItems.length) % usableItems.length;
      this.updateItemMenu();
    }
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right!)) {
      this.itemMenuIndex = (this.itemMenuIndex + 1) % usableItems.length;
      this.updateItemMenu();
    }
    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      // Use potion
      const item = usableItems[this.itemMenuIndex];
      const idx = this.inventory.findIndex(i => i.name === item.name);
      if (idx >= 0 && this.inventory[idx].count > 0) {
        this.inventory[idx].count -= 1;
        this.registry.set("playerInventory", [...this.inventory]);
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 20);
        this.updateStatsTexts();
        this.showMessage("You used a Potion! Restored 20 HP.");
        this.inItemMenu = false;
        this.itemMenuTexts.forEach(t => t.destroy());
        this.itemMenuTexts = [];
        this.inPlayerTurn = false;
        this.time.delayedCall(1000, () => this.enemyTurn(false));
      }
    }
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.inItemMenu = false;
      this.itemMenuTexts.forEach(t => t.destroy());
      this.itemMenuTexts = [];
      this.showMessage("Item use cancelled.");
    }
  }

  updateItemMenu() {
    this.itemMenuTexts.forEach((text, idx) => {
      text.setColor(idx === this.itemMenuIndex ? "#ff0" : "#fff");
    });
  }

  checkBattleEndOrEnemyTurn() {
    if (this.enemy.hp <= 0) {
      this.showMessage("Victory! You defeated the enemy.");
      this.gainExperience(10); // Example XP gain
      if (this.pendingDrop) {
        this.time.delayedCall(1200, () => {
          // Stack item in inventory
          const idx = this.inventory.findIndex(i => i.name === this.pendingDrop);
          if (idx >= 0) {
            this.inventory[idx].count += 1;
          } else {
            this.inventory.push({ name: this.pendingDrop!, count: 1 });
          }
          this.registry.set("playerInventory", [...this.inventory]);
          this.showMessage(`You found: ${this.pendingDrop}!`);
          this.time.delayedCall(1200, () => {
            this.savePlayerData();
            this.scene.start("WorldMapScene");
          });
        });
      } else {
        this.time.delayedCall(1800, () => {
          this.savePlayerData();
          this.scene.start("WorldMapScene");
        });
      }
    } else {
      this.enemyTurn(false);
    }
  }

  gainExperience(amount: number) {
    this.player.xp += amount;
    let leveledUp = false;
    while (this.player.level < this.maxLevel && this.player.xp >= this.xpForNextLevel()) {
      this.player.xp -= this.xpForNextLevel();
      this.player.level += 1;
      this.player.attributePoints += 5;
      leveledUp = true;
    }
    this.updateStatsTexts();
    this.savePlayerData();
    if (leveledUp) {
      this.inAttributeSpend = true;
      this.inPlayerTurn = false;
      this.attrIndex = 0;
      this.showMessage(`Level up! You are now level ${this.player.level}. Attribute points: ${this.player.attributePoints}`);
      // Show attribute spend UI immediately (no delay)
      this.showAttributeSpendUI();
    }
  }

  savePlayerData() {
    this.registry.set(this.playerKey, { ...this.player });
  }

  showAttributeSpendUI() {
    this.showMessage(`Level up! Use arrow keys to select attribute, Enter to spend point.`);
    this.updateAttributeSpendMenu();
  }

  updateAttributeSpendMenu() {
    // Highlight the selected attribute
    this.attrTexts.forEach((t, i) => {
      t.setColor(i === this.attrIndex ? "#ff0" : "#fff");
    });
  }

  handleAttributeSpendInput() {
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left!)) {
      this.attrIndex = (this.attrIndex - 1 + this.attributes.length) % this.attributes.length;
      this.updateAttributeSpendMenu();
    }
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right!)) {
      this.attrIndex = (this.attrIndex + 1) % this.attributes.length;
      this.updateAttributeSpendMenu();
    }
    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      if (this.player.attributePoints > 0) {
        const attr = this.attributes[this.attrIndex];
        if (attr === "Strength") this.player.strength += 1;
        if (attr === "Agility") this.player.agility += 1;
        if (attr === "Stamina") {
          this.player.stamina += 1;
          this.player.maxHp += 5;
          this.player.hp += 5;
        }
        if (attr === "Intellect") this.player.intellect += 1;
        if (attr === "Spirit") this.player.spirit += 1;
        if (attr === "Defence") this.player.defence += 1;
        this.player.attributePoints -= 1;
        this.updateStatsTexts();
        this.updateAttributeSpendMenu();
        if (this.player.attributePoints === 0) {
          this.inAttributeSpend = false;
          this.showMessage("Attribute points spent! Continue your adventure.");
        }
      }
    }
  }

  xpForNextLevel() {
    // Example XP curve: 20 * level
    return 20 * this.player.level;
  }

  enemyTurn(playerDefending: boolean) {
    // Apply easy mode modifier
    let enemyAttack = this.enemy.attack + Math.floor(this.enemy.strength / 2);
    const difficulty = this.registry.get("difficulty");
    if (difficulty === "Easy") {
      enemyAttack = Math.floor(enemyAttack * 0.5);
    }
    let dmg = Math.max(1, enemyAttack - (this.player.defense + Math.floor(this.player.defence / 2)));
    if (playerDefending) dmg = Math.floor(dmg / 2);
    this.player.hp = Math.max(0, this.player.hp - dmg);
    this.updateStatsTexts();
    this.showMessage(`${this.enemy.name} attacks! You take ${dmg} damage.`);
    if (this.player.hp <= 0) {
      this.time.delayedCall(1800, () => this.showMessage("You were defeated..."));
      this.time.delayedCall(3000, () => this.scene.start("WorldMapScene"));
    } else {
      this.time.delayedCall(1200, () => {
        this.showMessage("Choose your action.");
        this.inPlayerTurn = true;
      });
    }
  }
}
