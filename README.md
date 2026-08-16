## 简介

萤石播放器主题

## 快速入门

```ts
import Theme from '@ezuikit/player-theme';
// 引入样式
import '@ezuikit/player-theme/dist/style.css';

// 使用
const theme = new Theme({
  // ...
});

// 播放器接入主题
class Player extends Theme {
  constructor(options) {
    super(options);
    // ...
  }
  // ...
}
```