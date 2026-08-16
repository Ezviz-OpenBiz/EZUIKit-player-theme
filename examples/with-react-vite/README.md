# with-react-vite

基于 React 19 + Vite 的 `@ezuikit/player-theme@3.1.2-beta.4` 示例。

## 依赖版本

- react / react-dom `^19.2.0`
- vite `^8.2.1`
- @vitejs/plugin-react `^6.0.5`
- @ezuikit/player-theme `3.1.2-beta.4`
- @ezuikit/control-time-line `2.1.0`

> Node 要求：`^20.19.0 || >=22.12.0`

## 安装依赖

```bash
npm install
```

## 本地开发

```bash
npm run dev
```

## 生产构建

```bash
npm run build
npm run preview
```

## 说明

- `src/components/ThemePlayer.jsx`：`@ezuikit/player-theme` 的 `Theme` 用法示例。
  请将 `url` 与 `accessToken` 替换为你自己的取值。
- `src/components/TimeLine.jsx`：`@ezuikit/control-time-line` 的 `MobileTimeLine` 用法示例。
- 组件在 `useEffect` 中创建实例，并在 cleanup 中调用 `destroy()`，兼容
  React StrictMode 在开发环境下的二次挂载。
