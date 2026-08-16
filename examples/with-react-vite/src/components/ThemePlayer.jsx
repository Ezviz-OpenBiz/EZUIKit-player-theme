import { useEffect, useRef } from 'react';
import '@ezuikit/player-theme/dist/style.css';
import { Theme } from '@ezuikit/player-theme';

/**
 * 播放器主题（皮肤）示例
 *
 * 说明：
 * - `@ezuikit/player-theme` 负责播放器的 UI（头部/底部控件栏、控件、封面、加载动画等）。
 * - 通过 `new Theme(options)` 创建实例，销毁时调用 `theme.destroy()`。
 * - React 18/19 的 StrictMode 在开发环境会触发两次 effect（挂载 -> 卸载 -> 挂载），
 *   下方的 cleanup 会调用 `destroy()`，配合 ref 守卫可避免残留实例。
 *
 * 请将 `url` 与 `accessToken` 替换为你自己的取值。
 */
export default function ThemePlayer() {
  const containerRef = useRef(null);
  const themeRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return undefined;

    const theme = new Theme({
      container: () => containerRef.current,
      type: 'ezopen',
      language: 'zh',
      sdkType: 'base',
      template: 'pcRec',
      height: 400,
      url: 'ezopen://open.ys7.com/BC7799091/1.cloud.rec',
      accessToken: 'at.83jbbwt02uf2e3z439l15j26a6tt0nii-2rvibsbk7l-1ui9xu3-hf5osf52z',
      scaleMode: 1,
      staticPath: '',
      locales: {}, // 自定义多语言 {zh: {}, en: {}}
      autoPlay: false,
      ptzOptions: {
        speed: 2,
      },
      loggerOptions: {
        level: 'INFO',
        showTime: true,
      },
      env: {
        domain: 'https://open.ys7.com',
      },
      loadingOptions: {},
      posterOptions: {
        poster:
          'https://ts1.tc.mm.bing.net/th/id/R-C.61723545e19c4d9cc20ed6251a74c958?rik=FB2hYrgo%2fbVQ8A&riu=http%3a%2f%2fimg95.699pic.com%2fphoto%2f50138%2f2980.jpg_wh860.jpg&ehk=va5JWRDV%2fIQGoh0MvvqVD8t33IYf7ZFNxg6AcVq5tdE%3d&risl=&pid=ImgRaw&r=0',
      },
      // 音量
      volumeOptions: {
        volume: 0.8,
        muted: false,
        onOpenChange: (open, volume, muted) => {
          console.warn('[ThemePlayer volumeOptions onOpenChange] open:', open, 'volume:', volume, 'muted:', muted);
        },
        onChange: (volume, muted) => {
          console.warn('[ThemePlayer volumeOptions onChange] volume:', volume, 'muted:', muted);
        },
      },
      // 电子放大
      zoomOptions: {
        max: 10,
      },
      onInitializing: (t) => {
        // 可在此监听控件挂载事件
        // t.on(Theme.EVENTS.control.mountedControls, () => {
        //   console.log('[ThemePlayer]', Theme.EVENTS.control.mountedControls);
        // });
      },
    });

    themeRef.current = theme;

    return () => {
      theme.destroy();
      themeRef.current = null;
    };
  }, []);

  return (
    <div style={{ paddingTop: 24 }}>
      <div className="player" ref={containerRef}></div>
    </div>
  );
}
