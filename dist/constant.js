/*
* @ezuikit/player-theme v2.1.0-beta.1
* Copyright (c) 2025-12-29 Ezviz-OpenBiz
* Released under the MIT License.
*/
/**
 * 播放器的类名前缀
 */ var PREFIX_CLASS = 'ezplayer';
/** */ var DATE_PICKER_ICON_WIDTH = 36;
/** 填充模式 */ var THEME_SCALE_MODE_TYPE = {
    /** 画面完全填充canvas区域,画面会被拉伸 */ full: 0,
    /** 画面做等比缩放后,高或宽对齐canvas区域,画面不被拉伸,但有黑边 */ auto: 1,
    /** 视频画面做等比缩放后,完全填充canvas区域,画面不被拉伸,没有黑边,但画面显示不全 */ fullAuto: 2
};
// 切换主题时把当前的状态传给控件， 而不是传 theme 对象， 为了解耦
// 不要添加方法，只添加状态
var THEME_PROPS = [
    'width',
    'height',
    'playing',
    'volume',
    'muted',
    'loading',
    'recType',
    'isCurrentFullscreen',
    'orientationAngle',
    'zooming',
    'zoom',
    'recording',
    'recordList',
    'speed',
    'urlInfo',
    'videoLevelList',
    'videoLevel',
    'recMonth'
];
/**
 * 当移动端 picker 控件打开时需要关闭动画（定时器）
 */ var CLEAR_TIMER_HEADER_FOOTER_ANIMATION = 'CLEAR_TIMER_HEADER_FOOTER_ANIMATION';
/**
 * 'rec', 'cloudRec', 'cloudRecord' 是一个组，并且要在头部（移动端特殊处理)
 *
 * |          rec          |  cloudRec    |    cloudRecord  |
 * |:---------------------:|:------------:|:---------------:|
 * | 本地回放（SDK存储回放）   |    云存储回放 |     云录制回放    |
 */ var REC_GROUP = [
    'rec',
    'cloudRec',
    'cloudRecord'
];
/**
 * 设备信息
 *
 * |      deviceID       |  deviceName   |
 * |:-------------------:|:-------------:|
 * |   设备ID（唯一标识）   |   设备名称     |
 */ var DEVICE_INFO_GROUP = [
    'deviceID',
    'deviceName'
];
// /**
//  * 直播（预览）支持的控件
//  */
// export const LIVE_CONTROL_GROUP: string[] = [...DEVICE_INFO_GROUP, 'play', 'capturePicture', 'volume', 'ptz', 'record', 'talk', 'zoom', 'definition', 'fullscreen', 'globalFullscreen'] as const;
// /**
//  * 录像（录像）支持的控件
//  */
// export const REC_CONTROL_GROUP_BOTTOM: string[] = [...REC_GROUP, 'play', 'capturePicture', 'volume', 'record', 'zoom', 'speed', 'fullscreen', 'globalFullscreen', 'date', 'timeLine'] as const;
/**
 * 能在底部并放置到 More 中的控件
 */ var FOOTER_MORE_GROUP = [
    'play',
    'capturePicture',
    'volume',
    'ptz',
    'record',
    'zoom',
    'talk',
    'definition',
    'speed',
    'fullscreen',
    'globalFullscreen'
];
/**
 * 暂停时能禁用的控件按钮
 */ var PAUSE_DISABLED_BTN = [
    'capturePicture',
    'volume',
    'ptz',
    'record',
    'talk',
    'definition',
    'speed',
    'globalFullscreen'
];
/**
 * 移动端可以扩展的控件
 * ['ptz', 'talk', 'record', 'capturePicture', 'timeLine', 'rec', 'date'];
 */ var MOBILE_EXTENDS = [
    'ptz',
    'timeLine',
    'rec',
    'date'
];
/**
 * 回放时间轴和日历
 * 放置在最顶部
 */ var REC_BOTTOM_GROUP = [
    'timeLine',
    'date'
];
/**
 *
 * 事件名
 *
 * ---------------                                             ------------------
 * -             -           theme.emit(EVENTS.xxxxx)          -                -
 * -             -   ------------------------------------->    -                -
 * -             -                                             -                -
 * -   Theme     -                                             -    Controls    -
 * -             -        control.emit(EVENTS.control.xxx)     -                -
 * -             -   <--------------------------------------   -                -
 * ---------------                                             ------------------
 *
 * @example
 * ```ts
 * theme.on(EVENTS.loading)
 * theme.on(EVENTS.loading)
 * ```
 *
 */ // 事件命名不要超过两层
var EVENTS = {
    loading: 'loading',
    /** 播放 */ play: 'play',
    /** 截图 */ capturePicture: 'capturePicture',
    /** 音量变化 */ volumechange: 'volumechange',
    /** 缩放变化 */ zoomChange: 'zoomChange',
    /** 缩放状态变化， true: 可缩放状态，false: 禁止缩放状态(不能缩放) */ zoomingChange: 'zoomingChange',
    /** 缩放平移改变 */ zoomTranslateChange: 'zoomTranslateChange',
    /** 音频信息 */ audioInfo: 'audioInfo',
    /** 视频信息 */ videoInfo: 'videoInfo',
    /** 首帧 */ firstFrameDisplay: 'firstFrameDisplay',
    /** 全屏 */ fullscreen: 'fullscreen',
    /** 退出全屏 */ exitFullscreen: 'exitFullscreen',
    /**
   * 全屏变化(移动端也支持触发, 不过移动端是模拟的web全屏 即旋转 180度)
   * 当 isCurrentFullscreen 为 true 时，表示当前容器全局全屏状态
   *
   * 注意：同一个页面中只要有全屏的操作或取消全屏的操作，都会触发该事件 （移动端除外）
   */ fullscreenChange: 'fullscreenChange',
    /** 重置容器尺寸 */ resize: 'resize',
    /** 屏幕旋转方向变化 */ orientationChange: 'orientationChange',
    /** 音频编码不支持 （暂时仅支持标准流 flv） */ audioCodecUnsupported: 'audioCodecUnsupported',
    /** 切换主题 themeDate 变化时 */ changeTheme: 'changeTheme',
    /** 回放类型切换 */ recTypeChange: 'recTypeChange',
    /** 切换清晰度 */ definitionChange: 'definitionChange',
    /** 播放速度切换 */ speedChange: 'speedChange',
    /** 控件开始录制 */ recordingChange: 'recordingChange',
    /** 对讲状态变化 */ talkingChange: 'talkingChange',
    /** 麦克风音量变化 */ talkVolumeChange: 'talkVolumeChange',
    /** 动态切换日志配置 */ setLoggerOptions: 'setLoggerOptions',
    records: 'records',
    ptzSpeedChange: 'ptzSpeedChange',
    setVideoLevelList: 'setVideoLevelList',
    currentVideoLevel: 'currentVideoLevel',
    currentVideoLevelAuto: 'currentVideoLevelAuto',
    setAllDayRecTimes: 'setAllDayRecTimes',
    getOSDTime: 'getOSDTime',
    /**
   * 控件相关
   */ control: {
        /** 点击播放播放／暂停按钮 */ play: 'Control.play',
        /** 播放控件销毁 */ playDestroy: 'Control.playDestroy',
        /** 截图 */ capturePicture: 'Control.capturePicture',
        /** 截图结果 */ capturePictureResult: 'Control.capturePictureResult',
        /** 截图控件销毁 */ capturePictureDestroy: 'Control.capturePictureDestroy',
        /** 音量变化 */ volumechange: 'Control.volumechange',
        /** 音量调节面板 展示隐藏变换 */ volumePanelOpenChange: 'Control.volumePanelOpenChange',
        /** 音量控件销毁 */ volumeDestroy: 'Control.volumeDestroy',
        /** 控件组件栏(Header/Footer)展示隐藏 */ controlsBarOpenChange: 'Control.controlsBarOpenChange',
        /** 当顶部控件栏(header)控件放置不下时， 显示的更多按钮的控件列表变化 */ headerMoreShowControlsChange: 'Control.headerMoreShowControlsChange',
        /** 当顶部控件栏(header)控件放置不下时， 更多按钮 展示隐藏变换 */ headerMorePanelOpenChange: 'Control.headerMorePanelOpenChange',
        /** 当底部控件栏(footer)控件放置不下时， 显示的更多按钮的控件列表变化 */ footerMoreShowControlsChange: 'Control.footerMoreShowControlsChange',
        /** 当底部控件栏(footer)控件放置不下时， 更多按钮 展示隐藏变换 */ footerMorePanelOpenChange: 'Control.footerMorePanelOpenChange',
        /** 设备信息控件销毁 */ deviceDestroy: 'Control.deviceDestroy',
        /** 回放类型切换控件 */ recTypeChange: 'Control.recTypeChange',
        /** 回放类型控件销毁 */ recDestroy: 'Control.recDestroy',
        /** 切换清晰度控件 */ definitionChange: 'Control.definitionChange',
        definitionList: 'Control.definitionList',
        /** 切换清晰度面板 展示隐藏变换, (open, definition, item) */ definitionPanelOpenChange: 'Control.definitionPanelOpenChange',
        /** 切换清晰度控件 */ definitionDestroy: 'Control.definitionDestroy',
        /** 播放速度切换 */ speedChange: 'Control.speedChange',
        /** 播放速度面板 显示隐藏变换 */ speedPanelOpenChange: 'Control.speedPanelOpenChange',
        /** 播放速度控件销毁 */ speedDestroy: 'Control.speedDestroy',
        /** 云台面板 显示隐藏变换 */ ptzPanelOpenChange: 'Control.ptzPanelOpenChange',
        /** 云台速度切换 */ ptzSpeedChange: 'Control.ptzSpeedChange',
        ptzError: 'Control.ptzError',
        /** 云台控件销毁 */ ptzDestroy: 'Control.ptzDestroy',
        /** 录制控件是否在录制中 */ recordingChange: 'Control.recordingChange',
        recordDestroy: 'Control.recordDestroy',
        /** 开始对讲 */ talkingChange: 'Control.talkingChange',
        /** 对讲错误, 一般是麦克风权限被拒绝 */ talkError: 'Control.talkError',
        /** 对讲控件销毁 */ talkDestroy: 'Control.talkDestroy',
        /** 缩放比例改变 */ zoomChange: 'Control.zoomChange',
        /** 音量调节面板 展示隐藏变换 */ zoomPanelOpenChange: 'Control.zoomPanelOpenChange',
        /** 缩放控件销毁 */ zoomDestroy: 'Control.zoomDestroy',
        /** 全屏控件销毁 */ fullscreenDestroy: 'Control.fullscreenDestroy',
        /** 全局全屏控件销毁 */ globalFullscreenDestroy: 'Control.globalFullscreenDestroy',
        /** 日期面板展示隐藏变换 */ datePanelOpenChange: 'Control.datePanelOpenChange',
        /** 日期改变 */ dateChange: 'Control.dateChange',
        /** 日期改变 */ dateMonthChange: 'Control.dateMonthChange',
        /** 日期销毁 */ dateDestroy: 'Control.datePanelDestroy',
        /** 时间轴拖动结束 */ timeLineChange: 'Control.timeLineChange',
        /** 时间轴图片列表面板 */ timeLinePanelOpenChange: 'Control.timeLinePanelOpenChange',
        /** 时间轴控件销毁 */ timeLineDestroy: 'Control.timeLineDestroy',
        /** 主题控件挂载前 切换新的主题也会触发，如果想首次获取需要在 onInitializing 回调中进行监听 */ beforeMountControls: 'Control.beforeMountControls',
        /** 主题控件挂载完成, 切换新的主题也会触发，如果想首次获取需要在 onInitializing 回调中进行监听 */ mountedControls: 'Control.mountedControls',
        /** 主题控件卸载前, 已有控件卸载时才可触发 */ beforeUnmountControls: 'Control.beforeUnmountControls',
        /** 主题控件卸载完成, 已有控件卸载时才可触发 */ unmountedControls: 'Control.unmountedControls',
        /** 封面控件销毁 */ posterDestroy: 'Control.posterDestroy',
        /** 加载控件销毁 */ loadingDestroy: 'Control.loadingDestroy',
        /** 消息控件销毁 */ messageDestroy: 'Control.messageDestroy',
        /** 播放器内容区域销毁 */ contentDestroy: 'Control.contentDestroy',
        /** 播放器内容区域重新渲染 */ contentRerender: 'Control.contentRerender'
    },
    /**
   * 主题控件相关
   */ theme: {
        /** 销毁前 */ beforeDestroy: 'Theme.beforeDestroy',
        /** 销毁后 */ destroyed: 'Theme.destroyed',
        /** 移动端扩展销毁 */ mobileExtendDestroy: 'Theme.mobileExtendDestroy',
        /** 回放页底部销毁 */ recFooterDestroy: 'Theme.recFooterDestroy'
    },
    message: 'message'
};

export { CLEAR_TIMER_HEADER_FOOTER_ANIMATION, DATE_PICKER_ICON_WIDTH, DEVICE_INFO_GROUP, EVENTS, FOOTER_MORE_GROUP, MOBILE_EXTENDS, PAUSE_DISABLED_BTN, PREFIX_CLASS, REC_BOTTOM_GROUP, REC_GROUP, THEME_PROPS, THEME_SCALE_MODE_TYPE };
