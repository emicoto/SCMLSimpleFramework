
# SCMLSimpleFramework

---

## [中文]

**SCMLSimpleFramework** 是为 Sugarcube2 ModLoader 设计的简易内容添加框架，旨在简化游戏扩展模组的开发过程。  
通过该框架，您可以轻松集成新的内容，如 NPC、物品、侧边栏描述、菜单、按钮、模组设置面板、新地图入口和互动点。

### 主要功能：

- **简化内容添加：**  
  使用 `<<widget>>` 包装内容，并将其名称添加到相应的模块队列中，即可无缝集成各种元素到游戏中。
  
- **模块化支持：**  
  支持多种模块，详情请参考 `Readme` 文件夹中的 `.twee` 文件。
  
- **提供示例：**  
  在 `simple new content` 文件夹中提供了示例文件供参考。

### 使用说明：

1. **包装内容：**  
   使用 `<<widget>>` 封装您的内容。
   
2. **添加到模块队列：**  
   将 `widget` 名称添加到相应的模块队列中。
   
3. **加载顺序：**  
   确保此模组加载顺序靠前，但在本地化模组之后，以防止冲突。

### 注意事项：

- **下载：**  
  请从 [Releases](https://github.com/emicoto/SCMLSimpleFramework/releases) 页面下载，避免直接从 master 分支下载。
  
- **讨论与反馈：**  
  如有疑问或反馈，请加入 QQ 群：257791727。

### 示例代码：

```javascript
simpleFrameworks.addto('iModHeader', {
  passage: ['Start', 'Home'],
  widget: 'aSimpleTest',
});
```

### 参考资料：

- [简易框架说明书](https://github.com/emicoto/SCMLSimpleFramework/blob/main/Readme/SimpleFramework_Main.md)

SCMLSimpleFramework 提高了游戏扩展模组开发的效率，丰富了游戏的内容和多样性。

---

## [EN]

**SCMLSimpleFramework** is a simple content addition framework designed for Sugarcube2 ModLoader.  
It facilitates the development of game expansion mods by allowing easy integration of new content such as NPCs, items, sidebar descriptions, menus, buttons, mod setting panels, new map entries, and interaction points.

### Key Features:

- **Simplified Content Addition:**  
  Wrap your content using `<<widget>>` and add its name to the corresponding module queue to seamlessly integrate various elements into the game.
  
- **Modular Support:**  
  Supports multiple modules; refer to the `.twee` files in the `Readme` folder for details.
  
- **Examples Provided:**  
  Sample files are available in the `simple new content` folder for reference.

### Usage Instructions:

1. **Wrap Content:**  
   Encapsulate your content using `<<widget>>`.
   
2. **Add to Module Queue:**  
   Include the `widget` name in the appropriate module queue.
   
3. **Load Order:**  
   Ensure this mod is loaded early, but after localization mods to prevent conflicts.

### Note:

- **Download:**  
  Please download from the [Releases](https://github.com/emicoto/SCMLSimpleFramework/releases) page; avoid downloading directly from the master branch.
  
- **Discussion and Feedback:**  
  For queries or feedback, join the QQ group: 257791727.

### Example Code:

```javascript
simpleFrameworks.addto('iModHeader', {
  passage: ['Start', 'Home'],
  widget: 'aSimpleTest',
});
```

### Reference:

- [Simple Frameworks Manual](https://github.com/emicoto/DOLMods/blob/main/Simple%20Frameworks/README.md)

SCMLSimpleFramework enhances the efficiency of game expansion mod development, enriching the game's content and diversity.
