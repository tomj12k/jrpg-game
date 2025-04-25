import Phaser from "phaser";
import MainMenuScene from "./scenes/MainMenuScene";
import CharacterCreationScene from "./scenes/CharacterCreationScene";
import TownScene from "./scenes/TownScene";
import WorldMapScene from "./scenes/WorldMapScene";
import BattleScene from "./scenes/BattleScene";
import InventoryScene from "./scenes/InventoryScene";
import AttributeScene from "./scenes/AttributeScene";
import EquipmentScene from "./scenes/EquipmentScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: "#222034",
  parent: "game-container",
  scene: [MainMenuScene, CharacterCreationScene, TownScene, WorldMapScene, BattleScene, InventoryScene, AttributeScene, EquipmentScene],
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
};

new Phaser.Game(config);
