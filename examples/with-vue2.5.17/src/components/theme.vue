<template>
  <div style="padding-top: 100px">
    <div class="player"></div>
  </div>
</template>

<script>
import '@ezuikit/player-theme/dist/style.css';
import { Theme } from '@ezuikit/player-theme';

let theme;

export default {
  name: 'Theme',
  mounted: () => {
    if (theme) {
      theme.destroy();
      theme = null;
    }

    theme = new Theme({
        container: () => document.querySelector('.player'),
        type: 'ezopen',
        language: 'zh',
        sdkType: 'base',
        template: 'pcRec',
        url: 'ezopen://open.ys7.com/BC7799091/1.cloud.rec',
        accessToken: 'at.83jbbwt02uf2e3z439l15j26a6tt0nii-2rvibsbk7l-1ui9xu3-hf5osf52z',
        // template: '9645e76e94cb4c3ba200b7cbd1dd11c6',
        // themeDate: 'simple',
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
        // width: '80%',
        // height: '2rem',
        loadingOptions: {
          //   render: () => `<div class="loading">
          //   <div class="loading-icon">222</div>
          // </div>`,
        },
        posterOptions: {
          poster:
            'https://ts1.tc.mm.bing.net/th/id/R-C.61723545e19c4d9cc20ed6251a74c958?rik=FB2hYrgo%2fbVQ8A&riu=http%3a%2f%2fimg95.699pic.com%2fphoto%2f50138%2f2980.jpg_wh860.jpg&ehk=va5JWRDV%2fIQGoh0MvvqVD8t33IYf7ZFNxg6AcVq5tdE%3d&risl=&pid=ImgRaw&r=0',
        },
        // 音量
        volumeOptions: {
          volume: 0.8,
          muted: false,
          onOpenChange: (open, volume, muted) => {
            console.warn('[theme.html theme volumeOptions onOpenChange] open: ', open, 'volume: ', volume, 'muted:', muted);
          },
          onChange: (volume, muted) => {
            console.warn('[theme.html theme volumeOptions onChange]', 'volume: ', volume, 'muted:', muted);
          },
        },
        // 电子放大
        zoomOptions: {
          max: 10,
        },
        // 倍速 value 需要是唯一值  0.5 1 2 4 8 16 32
        // speedOptions: {
        //   list: [
        //     {
        //       label: '0.5x',
        //       value: 0.5,
        //     },
        //     {
        //       label: '1x',
        //       value: 1,
        //     },
        //     {
        //       label: '2x',
        //       value: 2,
        //     },
        //     {
        //       label: '4x',
        //       value: 4,
        //     },
        //   ],
        // },
        onInitializing: (theme) => {
          // theme.on(Theme.EVENTS.control.beforeMountControls, () => {
          //   console.log('[theme.html theme]', Theme.EVENTS.control.beforeMountControls);
          // });
          // theme.on(Theme.EVENTS.control.mountedControls, () => {
          //   console.log('[theme.html theme]', Theme.EVENTS.control.mountedControls);
          // });
        },
      });

    // mobileTimeLine.updateTimeSections(DATA);
  },
  methods: {},
};
</script>
