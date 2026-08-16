# @ezuikit/player-theme

[![npm version](https://img.shields.io/npm/v/@ezuikit/player-theme)](https://www.npmjs.com/package/@ezuikit/player-theme)
[![license](https://img.shields.io/npm/l/@ezuikit/player-theme)](https://www.npmjs.com/package/@ezuikit/player-theme)

萤石播放器主题（皮肤）库，负责播放器的 UI 展示与交互：头部/底部控件栏、各类控件（播放、音量、云台、清晰度、录制、对讲、时间轴、日历等）、封面、加载动画与消息提示。支持 `ezopen` / `flv` / `hls` / `mp4` / `ezhls` 多种流类型，内置多语言（中/英）与自定义主题模板。


## 特性

- 丰富的内置控件，按模板自动排布，容器尺寸变化时自动折叠到「更多」面板
- 6 套内置模板 + 平台自定义模板 + 完全自定义 `themeData`
- PC / 移动端适配，支持全屏、屏幕旋转、双击全屏
- 基于 [eventemitter3](https://github.com/primus/eventemitter3) 的事件系统，事件类型完备
- 内置中文、英文语言包，支持自定义多语言
- 提供完整的 TypeScript 类型定义

## 安装

```bash
# npm
npm install @ezuikit/player-theme

# yarn
yarn add @ezuikit/player-theme

# pnpm
pnpm add @ezuikit/player-theme
```

## 快速开始

### 模块化（ESM / 打包工具）

```js
import '@ezuikit/player-theme/dist/style.css';
import { Theme } from '@ezuikit/player-theme';

const theme = new Theme({
  container: () => document.querySelector('.player'),
  type: 'ezopen',
  url: 'ezopen://open.ys7.com/BC7799091/1.cloud.rec',
  accessToken: 'your-access-token',
  template: 'pcRec',
  language: 'zh',
  scaleMode: 1,
  height: 400,
});

// 事件监听
theme.on(Theme.EVENTS.play, (playing) => {
  console.log('playing:', playing);
});

// 销毁
// theme.destroy();
```

### script 标签（UMD / CDN）

UMD 包会在全局暴露 `Theme` 类（即 `window.Theme`）。

```html
<link rel="stylesheet" href="./dist/style.css" />
<script src="./dist/index.umd.js"></script>
<script>
  const theme = new Theme({
    container: () => document.querySelector('.player'),
    type: 'flv',
  });
</script>
```

## 入口与子路径导出

| 导入路径 | 说明 |
| --- | --- |
| `@ezuikit/player-theme` | 主入口（ESM: `dist/index.esm.js`，CJS: `dist/index.cjs`，UMD: `dist/index.umd.js`） |
| `@ezuikit/player-theme/dist/style.css` | 样式文件（必须引入） |
| `@ezuikit/player-theme/dist/style.js` | 以 JS 形式注入样式 |
| `@ezuikit/player-theme/dist/constant.js` | 常量（`EVENTS` 事件名、`THEME_SCALE_MODE_TYPE` 填充模式、`THEME_PROPS`、`PREFIX_CLASS` 等） |

### 具名导出

```ts
import {
  Theme, // 播放器主题主类
  EVENTS, // 事件名常量（等价于 Theme.EVENTS）
  Control, // 控件基类
  Play, Volume, Fullscreen, Loading, Message, Poster, Rec, Utils,
} from '@ezuikit/player-theme';
```

同时导出以下 TypeScript 类型：`ThemeOptions`、`ThemeEventMap`、`ThemeEventName`、`ThemeEventHandler`、`ThemeEventArgs`、`IThemeData`、`IThemeDataItem`、`ControlItem`、`ControlOptions`、`VolumeOptions`、`PosterOptions`、`LoadingOptions`、`MessageOptions`、`PlayOptions`、`RecOptions`、`FullscreenOptions`、`FullscreenChangeInfo`、`AudioInfo`、`VideoInfo`、`ResizeInfo`、`ScreenOrientation`、`OrientationAngle`、`PtzErrorInfo` 等。

## 构造配置项（ThemeOptions）

### 基础

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `container` | `HTMLElement \| (() => HTMLElement)` | — | **必填**，播放器挂载容器 |
| `type` | `'ezopen' \| 'flv' \| 'hls' \| 'mp4' \| 'ezhls'` | — | **必填**，播放器/流类型 |
| `url` | `string` | — | 播放地址 |
| `template` | `ThemeTemplateType \| string` | — | 模板名或平台自定义模板 ID，优先级高于 `themeData` |
| `themeData` | `IThemeData \| null` | — | 自定义主题数据，`null` 时不展示主题 |
| `scaleMode` | `0 \| 1 \| 2` | `0` | 画面填充模式，见下方说明 |
| `autoPlay` | `boolean` | `false` | 是否自动播放 |
| `width` | `number \| string` | 容器宽 | 容器宽度（数字默认 px，支持 `"80%"`、`"50vw"`） |
| `height` | `number \| string` | 容器高 | 容器高度 |
| `language` | `'zh' \| 'en' \| string` | `'zh'` | 语言 |
| `locales` | `Record<string, I18nTranslation>` | — | 自定义多语言，如 `{ zh: {}, en: {} }` |
| `muted` | `boolean` | `false` | 静音（优先级低于 `volumeOptions.muted`） |
| `volume` | `number` | `0.8` | 音量（优先级低于 `volumeOptions.volume`） |
| `spaceId` | `string \| number` | — | 指定回放空间 ID（优先级低于 url 中的 spaceId） |
| `dblClickFullscreen` | `boolean` | `true` | 双击全屏，仅 PC |
| `loggerOptions` | `LoggerOptions` | — | 日志配置，如 `{ level: 'INFO', showTime: true }` |
| `onInitializing` | `(theme: Theme) => void` | — | 初始化回调，可在此提前监听控件挂载事件 |

**填充模式 `scaleMode`：**

| 值 | 名称 | 说明 |
| --- | --- | --- |
| `0` | full | 画面完全填充容器，可能被拉伸 |
| `1` | auto | 等比缩放，大边对齐容器，可能有黑边 |
| `2` | fullAuto | 等比缩放铺满容器，无黑边但画面显示不全 |

### 控件配置

每个控件都可单独配置；将对应字段设为 `null` 即可不渲染该控件。

| 参数 | 说明 |
| --- | --- |
| `playOptions` | 播放/暂停控件 |
| `volumeOptions` | 音量控件，如 `{ volume: 0.8, muted: false, onChange, onOpenChange }` |
| `capturePictureOptions` | 截图控件，`type: 'download' \| 'base64' \| 'blob'`（默认 `download`），`quality` 默认 `0.9` |
| `ptzOptions` | 云台控件，如 `{ speed: 2 }` |
| `recordOptions` | 录制控件，`maxDuration` 默认 `3600`（秒） |
| `talkOptions` | 对讲控件 |
| `zoomOptions` | 电子放大控件，如 `{ max: 10 }` |
| `definitionOptions` | 清晰度控件 |
| `speedOptions` | 倍速控件 |
| `recOptions` | 回放类型切换控件 |
| `recListOptions` | 录像列表控件（`@since 3.1.1`） |
| `fullscreenOptions` / `globalFullscreenOptions` | 全屏 / 全局全屏控件 |
| `dateOptions` / `timeOptions` / `timeLineOptions` | 日历 / 时间 / 时间轴控件 |
| `posterOptions` | 封面控件，如 `{ poster: 'https://...' }` |
| `loadingOptions` | 加载动画控件，支持自定义 `render` |
| `messageOptions` | 消息提示控件 |
| `deviceOptions` | 设备信息控件 |
| `pauseOptions` | 暂停控件 |
| `mobileExtendOptions` | 移动端扩展，如 `{ controls: ['timeLine', 'date'] }`，`null` 时关闭 |

## 模板

内置模板名（`Theme.TEMPLATES`）：

| 模板 | 说明 |
| --- | --- |
| `pcLive` | PC 直播 |
| `pcRec` | PC 回放 |
| `mobileLive` | 移动端直播 |
| `mobileRec` | 移动端回放 |
| `security` | 安防 |
| `voice` | 语音 |

```js
const theme = new Theme({
  container: () => document.querySelector('.player'),
  type: 'ezopen',
  template: 'pcLive', // 使用内置模板
});
```

## 实例属性

`Theme` 实例提供以下只读/可写属性（部分变化会同步触发对应事件）：

| 属性 | 类型 | 读写 | 说明 |
| --- | --- | --- | --- |
| `url` | `string` | 读写 | 播放地址 |
| `urlInfo` | `object` | 读 | 解析后的地址信息 |
| `width` / `height` | `number` | 读 | 容器宽/高（px） |
| `videoInfo` | `ThemeVideoInfo` | 读 | 视频信息（`@since 3.1.2`） |
| `videoWidth` / `videoHeight` | `number` | 读 | 视频分辨率宽/高（`@since 3.1.2`） |
| `playing` | `boolean` | 读写 | 播放状态 |
| `loading` | `boolean` | 读写 | 加载状态 |
| `volume` | `number` | 读写 | 音量 `[0, 1]` |
| `muted` | `boolean` | 读写 | 是否静音 |
| `zooming` | `boolean` | 读写 | 是否处于可缩放状态 |
| `zoom` | `number` | 读写 | 电子放大倍数（需 `zooming = true`） |
| `speed` | `number` | 读写 | 倍速 |
| `talking` | `boolean` | 读 | 对讲中 |
| `talkGain` | `number \| null` | 读 | 对讲增益，仅 ezopen |
| `recording` | `boolean` | 读 | 录制中，仅 ezopen |
| `ptzing` | `boolean` | 读 | 云台开启中 |
| `videoLevelAuto` | `boolean` | 读 | 是否自动清晰度 |
| `isCurrentFullscreen` | `boolean` | 读 | 当前容器是否全屏 |
| `orientationAngle` | `0 \| 90 \| 180 \| 270` | 读 | 屏幕旋转角度 |
| `hasHeaderMoreControl` / `hasFooterMoreControl` | `boolean` | 读 | 顶/底部是否展示「更多」按钮 |
| `isEzopen` | `boolean` | 读 | 是否私有流地址 |
| `isEzviz` | `boolean` | 读 | 是否萤石播放地址（`@since 3.1.2`） |
| `controls` | `Record<string, Control>` | 读 | 所有控件，命名规则 `${iconId}Control`，如 `theme.controls.volumeControl` |

## 实例方法

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `resize` | `(width?, height?) => void` | 调整播放器窗口大小，支持 `600` / `"600px"` / `"50%"` 等 |
| `fullscreen` | `() => Promise<void>` | 进入全屏（PC/移动端） |
| `exitFullscreen` | `() => Promise<void>` | 退出全屏 |
| `changeTheme` | `(themeData: IThemeData) => void` | 切换主题，传 `null` 清空主题 |
| `setPoster` | `(poster?: string) => void` | 设置封面（仅设置，`''` 时不展示） |
| `setScaleMode` | `(scaleMode: 0 \| 1 \| 2) => void` | 设置画面缩放模式（`@since 1.0.1`） |
| `setLoggerOptions` | `(options?: LoggerOptions) => void` | 动态设置日志配置 |
| `destroy` | `() => void` | 销毁实例（事件、控件等） |

此外，`Theme` 继承自 `EventEmitter`，可使用 `on` / `once` / `off` / `emit` / `removeAllListeners` 等方法。

```js
theme.resize('100%', 400);
theme.fullscreen();
theme.changeTheme(Theme.TEMPLATES.pcLive);
theme.setPoster('https://example.com/poster.jpg');
theme.destroy();
```

## 事件

通过 `theme.on(eventName, handler)` 监听。事件名建议使用 `Theme.EVENTS` 常量，类型可参考 `ThemeEventMap`。

```js
theme.on(Theme.EVENTS.play, (playing) => {});
theme.on(Theme.EVENTS.loading, (loading) => {});
theme.on(Theme.EVENTS.volumechange, (volume, muted) => {});
theme.on(Theme.EVENTS.fullscreenChange, ({ isCurrentFullscreen, isFullscreen, isMobile }) => {});

// 控件挂载完成（首次需在 onInitializing 中监听）
theme.on(Theme.EVENTS.control.mountedControls, () => {});

// 生命周期
theme.on(Theme.EVENTS.theme.beforeDestroy, () => {});
theme.on(Theme.EVENTS.theme.destroyed, () => {});
```

常用事件：

| 事件 | 载荷 | 说明 |
| --- | --- | --- |
| `loading` | `(loading: boolean)` | 加载状态变化 |
| `play` | `(playing: boolean)` | 播放/暂停状态变化 |
| `firstFrameDisplay` | `()` | 首帧显示 |
| `volumechange` | `(volume: number, muted: boolean)` | 音量变化 |
| `zoomChange` | `(zoom: number)` | 缩放倍数变化 |
| `fullscreenChange` | `(info: FullscreenChangeInfo)` | 全屏状态变化 |
| `resize` | `(info: ResizeInfo)` | 容器尺寸变化 |
| `orientationChange` | `(angle: OrientationAngle)` | 屏幕旋转 |
| `changeTheme` | `(themeData: IThemeData \| null)` | 切换主题 |
| `recTypeChange` | `(type: string)` | 回放类型切换 |
| `definitionChange` | `(level: number, item?)` | 清晰度切换 |
| `speedChange` | `(speed: number, item?)` | 倍速切换 |
| `recordingChange` | `(recording: boolean)` | 录制状态变化 |
| `talkingChange` | `(talking: boolean)` | 对讲状态变化 |
| `message` | `(message: string, type: string, duration?: number)` | 统一消息提示 |

> 事件分为三类：对外事件（如 `play`）、控件事件（`Control.*`，通过 `Theme.EVENTS.control.*` 访问）、生命周期事件（`Theme.*`，通过 `Theme.EVENTS.theme.*` 访问）。完整列表见 `ThemeEventMap`。

## 静态成员

| 成员 | 说明 |
| --- | --- |
| `Theme.TEMPLATES` | 内置模板：`pcLive` / `pcRec` / `mobileLive` / `mobileRec` / `security` / `voice` |
| `Theme.EVENTS` | 事件名常量，含 `control` 与 `theme` 子对象 |
| `Theme.LOCALES` | 内置语言包 `{ zh, en }` |
| `Theme.THEME_VERSION` | 版本号字符串，如 `'3.1.2-beta.4'` |

## 自定义主题数据（IThemeData）

当不使用内置 `template` 时，可通过 `themeData` 完全自定义控件布局：

```js
const theme = new Theme({
  container: () => document.querySelector('.player'),
  type: 'ezopen',
  themeData: {
    autoFocus: 3, // 控件自动聚焦持续时间（秒），0 表示一直展示
    header: {
      btnList: [
        { iconId: 'deviceName', part: 'left' },
        { iconId: 'globalFullscreen', part: 'right' },
      ],
    },
    footer: {
      btnList: [
        { iconId: 'play', part: 'left' },
        { iconId: 'volume', part: 'left' },
        { iconId: 'definition', part: 'right' },
        { iconId: 'fullscreen', part: 'right' },
      ],
    },
  },
});
```

可用控件 `iconId`：`play`、`volume`、`capturePicture`、`ptz`、`record`、`talk`、`broadcast`、`aiChat`、`live`、`recDropdown`、`recList`、`alarmMessage`、`zoom`、`definition`、`fullscreen`、`globalFullscreen`、`speed`、`date`、`time`、`timeLine`，以及特殊项 `deviceID`、`deviceName`、`rec`、`cloudRec`、`cloudRecord`。

## TypeScript

包内置类型定义（`dist/types/index.d.ts`），无需额外安装 `@types`。

```ts
import { Theme, ThemeOptions, ThemeEventMap } from '@ezuikit/player-theme';

const options: ThemeOptions = {
  container: () => document.querySelector('.player')!,
  type: 'flv',
  scaleMode: 1,
};

const theme = new Theme(options);

// 事件处理函数类型可由 ThemeEventMap 推导
const onVolume: ThemeEventMap['volumechange'] = (volume, muted) => {};
theme.on(Theme.EVENTS.volumechange, onVolume);
```

## 示例

`examples/` 目录提供了可运行的示例：

- `examples/with-vue2.5` — Vue 2.5 + Vue CLI
- `examples/with-vue2.5.17` — Vue 2.5.17 + Webpack
- `examples/with-react-vite` — React 19 + Vite

## License

本项目基于 [MIT](https://opensource.org/licenses/MIT) 协议开源。
