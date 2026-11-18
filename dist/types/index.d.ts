import EventEmitter from 'eventemitter3';
import I18n, { TranslateVariables, I18nTranslation } from '@ezuikit/utils-i18n';
import { LoggerCls, LoggerOptions } from '@ezuikit/utils-logger';
import Picker from '@skax/picker';
import { BasePtzOptions } from '@ezuikit/control-ptz';
import { RecListModalOptions } from '@ezuikit/control-rec-list-modal';
import * as _ezuikit_utils_tools from '@ezuikit/utils-tools';
import Zoom from '@ezuikit/control-zoom';
import { TimeLineTimeSection } from '@ezuikit/control-time-line';
import { TimePickerOptions } from '@ezuikit/control-date-picker';

/** 填充模式 */
declare const THEME_SCALE_MODE_TYPE: {
    /** 画面完全填充canvas区域,画面会被拉伸 */
    readonly full: 0;
    /** 画面做等比缩放后,高或宽对齐canvas区域,画面不被拉伸,但有黑边 */
    readonly auto: 1;
    /** 视频画面做等比缩放后,完全填充canvas区域,画面不被拉伸,没有黑边,但画面显示不全 */
    readonly fullAuto: 2;
};
declare const THEME_PROPS: readonly ["width", "height", "playing", "volume", "muted", "loading", "playType", "isCurrentFullscreen", "orientationAngle", "zooming", "zoom", "recording", "recordList", "speed", "supportLocalRecordStreamType", "urlInfo", "videoLevelList", "videoLevel", "recMonth", "url", "playbackRange"];
/**
 * 全部播放类型：直播 + 三种回放
 *
 * 控件用静态属性 `supportedPlayTypes` 声明支持范围，默认取本数组（即全支持）。
 * 与 {@link REC_GROUP} 的区别：REC_GROUP 是「回放类型切换控件的 iconId 分组」，
 * 这里是「播放地址实际解析出的播放类型」，两者取值恰好在回放侧重合。
 */
declare const PLAY_TYPES: readonly ["live", "rec", "cloudRec", "cloudRecord"];
/**
 * 控件初始化完成事件名
 *
 * 键与 `Controls`（`src/Controls/index.ts`）的键一一对应，值为 `Control.<键>ControlInit`，
 * 在控件实例创建成功后由 `_renderTheme` 派发一次，无载荷。
 *
 * 这些成员会被展开进 {@link EVENTS}.control，因此既可以 `EVENTS.control.playControlInit`
 * 这样按名取用，也可以在只拿到 `iconId` 的场合用 `CONTROL_INIT_EVENTS[iconId]` 查表。
 *
 * @remarks `changeTheme` 会先卸载旧控件并重置 `theme.controls`，因此切换主题时这些事件会再次派发；
 * 同一次渲染内则由 `!theme.controls.xxxControl` 守卫保证只派发一次。
 */
declare const CONTROL_INIT_EVENTS: {
    /** 播放/暂停控件初始化完成 */
    readonly playControlInit: "Control.playControlInit";
    /** 音量控件初始化完成 */
    readonly volumeControlInit: "Control.volumeControlInit";
    /** 设备信息控件初始化完成 */
    readonly deviceControlInit: "Control.deviceControlInit";
    /** 截图控件初始化完成 */
    readonly capturePictureControlInit: "Control.capturePictureControlInit";
    /** 云台控件初始化完成 */
    readonly ptzControlInit: "Control.ptzControlInit";
    /** 录制控件初始化完成 */
    readonly recordControlInit: "Control.recordControlInit";
    /** 对讲控件初始化完成 */
    readonly talkControlInit: "Control.talkControlInit";
    /** 语音广播控件初始化完成 */
    readonly broadcastControlInit: "Control.broadcastControlInit";
    /** AI 对话控件初始化完成 */
    readonly aiChatControlInit: "Control.aiChatControlInit";
    /** 直播按钮控件初始化完成 */
    readonly liveControlInit: "Control.liveControlInit";
    /** 回放下拉控件初始化完成 */
    readonly recDropdownControlInit: "Control.recDropdownControlInit";
    /** 录像列表控件初始化完成 */
    readonly recListControlInit: "Control.recListControlInit";
    /** 告警消息控件初始化完成 */
    readonly alarmMessageControlInit: "Control.alarmMessageControlInit";
    /** 电子放大控件初始化完成 */
    readonly zoomControlInit: "Control.zoomControlInit";
    /** 清晰度控件初始化完成 */
    readonly definitionControlInit: "Control.definitionControlInit";
    /** web 全屏控件初始化完成 */
    readonly fullscreenControlInit: "Control.fullscreenControlInit";
    /** 全局全屏控件初始化完成 */
    readonly globalFullscreenControlInit: "Control.globalFullscreenControlInit";
    /** 回放类型控件初始化完成 */
    readonly recControlInit: "Control.recControlInit";
    /** 倍速控件初始化完成 */
    readonly speedControlInit: "Control.speedControlInit";
    /** 码流切换控件初始化完成 */
    readonly streamTypeControlInit: "Control.streamTypeControlInit";
    /** 日历控件初始化完成 */
    readonly dateControlInit: "Control.dateControlInit";
    /** 时间选择控件初始化完成 */
    readonly timeControlInit: "Control.timeControlInit";
    /** 时间轴控件初始化完成 */
    readonly timeLineControlInit: "Control.timeLineControlInit";
    /** 回放片段进度条控件初始化完成 */
    readonly segmentProgressControlInit: "Control.segmentProgressControlInit";
};
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
 */
declare const EVENTS: {
    readonly loading: "loading";
    /** 播放 */
    readonly play: "play";
    /** 截图 */
    readonly capturePicture: "capturePicture";
    /** 音量变化 */
    readonly volumechange: "volumechange";
    /** 缩放变化 */
    readonly zoomChange: "zoomChange";
    /** 缩放状态变化， true: 可缩放状态，false: 禁止缩放状态(不能缩放) */
    readonly zoomingChange: "zoomingChange";
    /** 缩放平移改变 */
    readonly zoomTranslateChange: "zoomTranslateChange";
    /** 音频信息 */
    readonly audioInfo: "audioInfo";
    /** 视频信息 */
    readonly videoInfo: "videoInfo";
    /** 首帧 */
    readonly firstFrameDisplay: "firstFrameDisplay";
    /** 全屏 */
    readonly fullscreen: "fullscreen";
    /** 退出全屏 */
    readonly exitFullscreen: "exitFullscreen";
    /**
     * 全屏变化(移动端也支持触发, 不过移动端是模拟的web全屏 即旋转 180度)
     * 当 isCurrentFullscreen 为 true 时，表示当前容器全局全屏状态
     *
     * 注意：同一个页面中只要有全屏的操作或取消全屏的操作，都会触发该事件 （移动端除外）
     */
    readonly fullscreenChange: "fullscreenChange";
    /** 重置容器尺寸 */
    readonly resize: "resize";
    /** 屏幕旋转方向变化 */
    readonly orientationChange: "orientationChange";
    /** 音频编码不支持 （暂时仅支持标准流 flv） */
    readonly audioCodecUnsupported: "audioCodecUnsupported";
    /** 切换主题 themeDate 变化时 */
    readonly changeTheme: "changeTheme";
    /** 回放类型切换 */
    readonly recTypeChange: "recTypeChange";
    /** 播放类型切换（live / rec / cloudRec / cloudRecord），回调参数 type 为切换后的播放类型 */
    readonly playTypeChange: "playTypeChange";
    /** 切换清晰度 */
    readonly definitionChange: "definitionChange";
    /** 播放速度切换 */
    readonly speedChange: "speedChange";
    /** 码流切换（1: 主码流, 2: 子码流） */
    readonly streamTypeChange: "streamTypeChange";
    /**
     * 设备（本地回放）支持主子码流切换，收到后才展示码流切换控件（默认不展示）。
     * 载荷可选：省略或 true 表示支持，false 表示不支持（重新隐藏）
     */
    readonly supportLocalRecordStreamType: "supportLocalRecordStreamType";
    /** 控件开始录制 */
    readonly recordingChange: "recordingChange";
    /** 对讲状态变化 */
    readonly talkingChange: "talkingChange";
    /** 麦克风音量变化 */
    readonly talkVolumeChange: "talkVolumeChange";
    /** 语音广播状态变化 */
    readonly broadcastPanelChange: "broadcastPanelChange";
    /** AI对话框状态变化 */
    readonly aichatChange: "aichatChange";
    /** 直播模式切换 */
    readonly liveChange: "liveChange";
    /** 回放下拉选择变化 */
    readonly recDropdownChange: "recDropdownChange";
    /** 录像列表面板状态变化 */
    readonly recListChange: "recListChange";
    /** 告警消息面板状态变化 */
    readonly alarmMessageChange: "alarmMessageChange";
    /** 动态切换日志配置 */
    readonly setLoggerOptions: "setLoggerOptions";
    readonly records: "records";
    readonly ptzSpeedChange: "ptzSpeedChange";
    readonly setVideoLevelList: "setVideoLevelList";
    readonly currentVideoLevel: "currentVideoLevel";
    readonly currentVideoLevelAuto: "currentVideoLevelAuto";
    readonly setAllDayRecTimes: "setAllDayRecTimes";
    readonly getOSDTime: "getOSDTime";
    /** 播放区间播放结束（SDK 层 playbackRange 特性） */
    readonly playbackEnd: "playbackEnd";
    /**
     * 控件相关
     */
    readonly control: {
        /** 点击播放播放／暂停按钮 */
        readonly play: "Control.play";
        /** 播放控件销毁 */
        readonly playDestroy: "Control.playDestroy";
        /** 截图 */
        readonly capturePicture: "Control.capturePicture";
        /** 截图结果 */
        readonly capturePictureResult: "Control.capturePictureResult";
        /** 截图控件销毁 */
        readonly capturePictureDestroy: "Control.capturePictureDestroy";
        /** 音量变化 */
        readonly volumechange: "Control.volumechange";
        /** 音量调节面板 展示隐藏变换 */
        readonly volumePanelOpenChange: "Control.volumePanelOpenChange";
        /** 音量控件销毁 */
        readonly volumeDestroy: "Control.volumeDestroy";
        /** 控件组件栏(Header/Footer)展示隐藏 */
        readonly controlsBarOpenChange: "Control.controlsBarOpenChange";
        /** 当顶部控件栏(header)控件放置不下时， 显示的更多按钮的控件列表变化 */
        readonly headerMoreShowControlsChange: "Control.headerMoreShowControlsChange";
        /** 当顶部控件栏(header)控件放置不下时， 更多按钮 展示隐藏变换 */
        readonly headerMorePanelOpenChange: "Control.headerMorePanelOpenChange";
        /** 当底部控件栏(footer)控件放置不下时， 显示的更多按钮的控件列表变化 */
        readonly footerMoreShowControlsChange: "Control.footerMoreShowControlsChange";
        /** 当底部控件栏(footer)控件放置不下时， 更多按钮 展示隐藏变换 */
        readonly footerMorePanelOpenChange: "Control.footerMorePanelOpenChange";
        /** 设备信息控件销毁 */
        readonly deviceDestroy: "Control.deviceDestroy";
        /** 回放类型切换控件 */
        readonly recTypeChange: "Control.recTypeChange";
        /** 回放类型控件销毁 */
        readonly recDestroy: "Control.recDestroy";
        /** 切换清晰度控件 */
        readonly definitionChange: "Control.definitionChange";
        readonly definitionList: "Control.definitionList";
        /** 切换清晰度面板 展示隐藏变换, (open, definition, item) */
        readonly definitionPanelOpenChange: "Control.definitionPanelOpenChange";
        /** 切换清晰度控件 */
        readonly definitionDestroy: "Control.definitionDestroy";
        /** 播放速度切换 */
        readonly speedChange: "Control.speedChange";
        /** 播放速度面板 显示隐藏变换 */
        readonly speedPanelOpenChange: "Control.speedPanelOpenChange";
        /** 播放速度控件销毁 */
        readonly speedDestroy: "Control.speedDestroy";
        /** 码流切换 (streamTypeIn: 1 主码流, 2 子码流, item) */
        readonly streamTypeChange: "Control.streamTypeChange";
        /** 码流面板 显示隐藏变换 */
        readonly streamTypePanelOpenChange: "Control.streamTypePanelOpenChange";
        /** 码流切换控件销毁 */
        readonly streamTypeDestroy: "Control.streamTypeDestroy";
        /** 云台面板 显示隐藏变换 */
        readonly ptzPanelOpenChange: "Control.ptzPanelOpenChange";
        /** 云台速度切换 */
        readonly ptzSpeedChange: "Control.ptzSpeedChange";
        readonly ptzError: "Control.ptzError";
        /** 云台控件销毁 */
        readonly ptzDestroy: "Control.ptzDestroy";
        /** 录制控件是否在录制中 */
        readonly recordingChange: "Control.recordingChange";
        readonly recordDestroy: "Control.recordDestroy";
        /** 开始对讲 */
        readonly talkingChange: "Control.talkingChange";
        /** 对讲错误, 一般是麦克风权限被拒绝 */
        readonly talkError: "Control.talkError";
        /** 对讲控件销毁 */
        readonly talkDestroy: "Control.talkDestroy";
        /** 语音广播状态变化 */
        readonly broadcastPanelChange: "Control.broadcastPanelChange";
        /** 语音广播控件销毁 */
        readonly broadcastDestroy: "Control.broadcastDestroy";
        /** 语音广播面板语音列表加载完成，参数为语音列表 `VoiceItem[]` */
        readonly broadcastVoiceListChange: "Control.broadcastVoiceListChange";
        /** 语音广播面板内置接口调用完成，参数 `{ api, success, code, msg, data }` */
        readonly broadcastApiResult: "Control.broadcastApiResult";
        /** 语音广播面板录到有效语音，参数 `{ voiceFile, deviceSerial, channelNo }`，紧挨着在下发之前派发 */
        readonly broadcastVoiceRecorded: "Control.broadcastVoiceRecorded";
        /** 语音广播面板开始录音 */
        readonly broadcastRecordStart: "Control.broadcastRecordStart";
        /** 语音广播面板停止录音并得到有效录音（随后请求下发）；关闭面板取消录音时不派发 */
        readonly broadcastRecordStop: "Control.broadcastRecordStop";
        /** 语音广播面板录音完成（正常停止，或达到最长时长自动停止），参数为 WAV 录音 `Blob` */
        readonly broadcastRecordComplete: "Control.broadcastRecordComplete";
        /** AI对话框状态变化 */
        readonly aichatChange: "Control.aichatChange";
        /** AI对话框控件销毁 */
        readonly aichatDestroy: "Control.aichatDestroy";
        /** 直播按钮点击 */
        readonly liveChange: "Control.liveChange";
        /** 直播控件销毁 */
        readonly liveDestroy: "Control.liveDestroy";
        /** 回放下拉选择变化 */
        readonly recDropdownChange: "Control.recDropdownChange";
        /** 回放下拉控件销毁 */
        readonly recDropdownDestroy: "Control.recDropdownDestroy";
        /** 录像列表面板状态变化 */
        readonly recListChange: "Control.recListChange";
        readonly recListCardClick: "Control.recListCardClick";
        /** 录像列表控件销毁 */
        readonly recListDestroy: "Control.recListDestroy";
        /** 告警消息面板开关 */
        readonly alarmMessageChange: "Control.alarmMessageChange";
        /** 告警消息面板销毁 */
        readonly alarmMessageDestroy: "Control.alarmMessageDestroy";
        /** 缩放比例改变 */
        readonly zoomChange: "Control.zoomChange";
        /** 音量调节面板 展示隐藏变换 */
        readonly zoomPanelOpenChange: "Control.zoomPanelOpenChange";
        /** 缩放控件销毁 */
        readonly zoomDestroy: "Control.zoomDestroy";
        /** 全屏控件销毁 */
        readonly fullscreenDestroy: "Control.fullscreenDestroy";
        /** 全局全屏控件销毁 */
        readonly globalFullscreenDestroy: "Control.globalFullscreenDestroy";
        /** 日期面板展示隐藏变换 */
        readonly datePanelOpenChange: "Control.datePanelOpenChange";
        /** 日期改变 */
        readonly dateChange: "Control.dateChange";
        /** 日期改变 */
        readonly dateMonthChange: "Control.dateMonthChange";
        /** 日期面板展示的月份变化 */
        readonly datePanelMonthChange: "Control.datePanelMonthChange";
        /** 日期面板展示的年份变化 */
        readonly datePanelYearChange: "Control.datePanelYearChange";
        /** 日期销毁 */
        readonly dateDestroy: "Control.dateDestroy";
        /** 时间面板展示隐藏变换 */
        readonly timePanelOpenChange: "Control.timePanelOpenChange";
        /** 时间改变 */
        readonly timeChange: "Control.timeChange";
        /** 时间轴拖动结束 */
        readonly timeLineChange: "Control.timeLineChange";
        /** 时间轴图片列表面板 */
        readonly timeLinePanelOpenChange: "Control.timeLinePanelOpenChange";
        /** 时间轴控件销毁 */
        readonly timeLineDestroy: "Control.timeLineDestroy";
        /** 控件不支持当前播放类型（仅提示，控件仍会渲染） */
        readonly unsupportedPlayType: "Control.unsupportedPlayType";
        /** 主题控件挂载前 切换新的主题也会触发，如果想首次获取需要在 onInitializing 回调中进行监听 */
        readonly beforeMountControls: "Control.beforeMountControls";
        /** 主题控件挂载完成, 切换新的主题也会触发，如果想首次获取需要在 onInitializing 回调中进行监听 */
        readonly mountedControls: "Control.mountedControls";
        /** 主题控件卸载前, 已有控件卸载时才可触发 */
        readonly beforeUnmountControls: "Control.beforeUnmountControls";
        /** 主题控件卸载完成, 已有控件卸载时才可触发 */
        readonly unmountedControls: "Control.unmountedControls";
        /** 封面控件销毁 */
        readonly posterDestroy: "Control.posterDestroy";
        /** 加载控件销毁 */
        readonly loadingDestroy: "Control.loadingDestroy";
        /** 消息控件销毁 */
        readonly messageDestroy: "Control.messageDestroy";
        /** 播放器内容区域销毁 */
        readonly contentDestroy: "Control.contentDestroy";
        /** 播放器内容区域重新渲染 */
        readonly contentRerender: "Control.contentRerender";
        /** 播放/暂停控件初始化完成 */
        readonly playControlInit: "Control.playControlInit";
        /** 音量控件初始化完成 */
        readonly volumeControlInit: "Control.volumeControlInit";
        /** 设备信息控件初始化完成 */
        readonly deviceControlInit: "Control.deviceControlInit";
        /** 截图控件初始化完成 */
        readonly capturePictureControlInit: "Control.capturePictureControlInit";
        /** 云台控件初始化完成 */
        readonly ptzControlInit: "Control.ptzControlInit";
        /** 录制控件初始化完成 */
        readonly recordControlInit: "Control.recordControlInit";
        /** 对讲控件初始化完成 */
        readonly talkControlInit: "Control.talkControlInit";
        /** 语音广播控件初始化完成 */
        readonly broadcastControlInit: "Control.broadcastControlInit";
        /** AI 对话控件初始化完成 */
        readonly aiChatControlInit: "Control.aiChatControlInit";
        /** 直播按钮控件初始化完成 */
        readonly liveControlInit: "Control.liveControlInit";
        /** 回放下拉控件初始化完成 */
        readonly recDropdownControlInit: "Control.recDropdownControlInit";
        /** 录像列表控件初始化完成 */
        readonly recListControlInit: "Control.recListControlInit";
        /** 告警消息控件初始化完成 */
        readonly alarmMessageControlInit: "Control.alarmMessageControlInit";
        /** 电子放大控件初始化完成 */
        readonly zoomControlInit: "Control.zoomControlInit";
        /** 清晰度控件初始化完成 */
        readonly definitionControlInit: "Control.definitionControlInit";
        /** web 全屏控件初始化完成 */
        readonly fullscreenControlInit: "Control.fullscreenControlInit";
        /** 全局全屏控件初始化完成 */
        readonly globalFullscreenControlInit: "Control.globalFullscreenControlInit";
        /** 回放类型控件初始化完成 */
        readonly recControlInit: "Control.recControlInit";
        /** 倍速控件初始化完成 */
        readonly speedControlInit: "Control.speedControlInit";
        /** 码流切换控件初始化完成 */
        readonly streamTypeControlInit: "Control.streamTypeControlInit";
        /** 日历控件初始化完成 */
        readonly dateControlInit: "Control.dateControlInit";
        /** 时间选择控件初始化完成 */
        readonly timeControlInit: "Control.timeControlInit";
        /** 时间轴控件初始化完成 */
        readonly timeLineControlInit: "Control.timeLineControlInit";
        /** 回放片段进度条控件初始化完成 */
        readonly segmentProgressControlInit: "Control.segmentProgressControlInit";
    };
    /**
     * 主题控件相关
     */
    readonly theme: {
        /** 销毁前 */
        readonly beforeDestroy: "Theme.beforeDestroy";
        /** 销毁后 */
        readonly destroyed: "Theme.destroyed";
        /** 移动端扩展销毁 */
        readonly mobileExtendDestroy: "Theme.mobileExtendDestroy";
        /** 回放页底部销毁 */
        readonly recFooterDestroy: "Theme.recFooterDestroy";
    };
    readonly message: "message";
    readonly http: {
        readonly getDeviceCapacity: "getDeviceCapacity";
        readonly getDeviceInfo: "getDeviceInfo";
        readonly getDeviceSupportQuality: "getDeviceSupportQuality";
        readonly getEzopenUrl: "getEzopenUrl";
        readonly queryVoiceList: "queryVoiceList";
        readonly sendVoiceOnce: "sendVoiceOnce";
        readonly sendVoice: "sendVoice";
        readonly postDevicePtzMirror: "postDevicePtzMirror";
        readonly getRecordMonth: "getRecordMonth";
        readonly getAppKey: "getAppKey";
        readonly getDeviceList: "getDeviceList";
        readonly setVideoLevel: "setVideoLevel";
        readonly getCloudInfo: "getCloudInfo";
        readonly getCloudUploadUrl: "getCloudUploadUrl";
        readonly getStreamAddressList: "getStreamAddressList";
        readonly getCloudRecordTimes: "getCloudRecordTimes";
        readonly getCloudTimes: "getCloudTimes";
        readonly getLocalRecTimes: "getLocalRecTimes";
        readonly getAlarmList: "getAlarmList";
        readonly captureSave: "captureSave";
        readonly createCaptureTask: "createCaptureTask";
        readonly getSpaceList: "getSpaceList";
        readonly getAddress: "getAddress";
        readonly getCDNLiveAddress: "getCDNLiveAddress";
        readonly getCDNRecordAddress: "getCDNRecordAddress";
        readonly getStreamInterruptInfo: "getStreamInterruptInfo";
    };
};

/**
 * 控件类型（iconId）不可以重复
 */
type ControlType = 
/** 播放/暂停 */
'play'
/** 音量， 兼容 sound */
 | 'volume'
/** 截图 */
 | 'capturePicture'
/** ptz 云台, 兼容 pantile */
 | 'ptz'
/** 录制, 兼容 recordvideo */
 | 'record'
/** 对讲 */
 | 'talk'
/** 语音广播 */
 | 'broadcast'
/** AI对话 */
 | 'aiChat'
/** 直播按钮 */
 | 'live'
/** 回放下拉 */
 | 'recDropdown'
/** 录像列表 */
 | 'recList'
/** 告警消息 */
 | 'alarmMessage'
/** 电子放大 */
 | 'zoom'
/** 清晰度， 兼容 hd */
 | 'definition'
/** web 全屏, 兼容 webExtend */
 | 'fullscreen'
/** 全局全屏, 兼容 extend */
 | 'globalFullscreen'
/** 倍速 */
 | 'speed'
/** 码流切换（主码流 / 子码流，本地回放） */
 | 'streamType'
/** 日期选择 */
 | 'date'
/** 时间选择 */
 | 'time'
/** 时间轴 */
 | 'timeLine'
/** 回放片段进度条（移动端，播放区间约束下渲染） */
 | 'segmentProgress';
type MergeControlType = 
/** 设备序列号 */
'deviceID'
/** 设备名称 */
 | 'deviceName'
/** 云存储 */
 | 'cloudRec'
/** 云录制 */
 | 'cloudRecord'
/** 本地存储 sdk */
 | 'rec';
/**
 * 控件
 */
interface ControlItem {
    /**
     * 控件id
     */
    iconId: ControlType | MergeControlType;
    /**
     * 控件位置
     * |    left     |    right     |
     * |:-----------:|:------------:|
     * | 控件栏的左部  |  控件栏的右部  |
     */
    part: 'left' | 'right';
    /** 是否激活 0 否 1 是 默认是 0 */
    /**
     * 是否渲染 0 否 1 是 默认是 undefined， 0 不渲染, 非 0 渲染
     */
    isrender?: 0 | 1;
}
interface IThemeDataItem {
    /**
     * 控件按钮或文本颜色
     * @since 0.0.1
     * @deprecated 从 0.0.1 开始不再推荐, 字体和图标颜色， 推荐 css 变量 --ezplayer-default-color
     */
    color?: string;
    /**
     * 控件栏（header/footer）背景颜色
     * @since 0.0.1
     * @deprecated 由于header/footer高度变化， 从 0.0.1 开始不再推荐, 可以通过 className 覆盖样式
     */
    backgroundColor?: string;
    /**
     * 控件激活后的颜色
     * @since 0.0.1
     * @deprecated 从 0.0.1 开始不再推荐,可以通过 className 覆盖样式，推荐 css 变量 --ezplayer-active-color
     */
    activeColor?: string;
    /**
     * 控件列表
     * @remarks
     * 控件列表， 按照 iconId 顺序渲染， 需要注意的是， 控件类型（iconId）不可以重复;
     * 注意 ⚠️： deviceID, deviceName, rec, cloudRec, cloudRecord  这五个控件特殊处理, deviceID 和 deviceName 是一组, rec、 cloudRec 和 cloudRecord 是一组
     *
     * @since 0.0.1
     */
    btnList?: ControlItem[];
}
/**
 * 主题数据， 优先级最高， 支持用户自定义
 */
interface IThemeData {
    /** 控件展示时长,默认自动聚焦持续 3s , 单位秒 0 表示一直展示 */
    autoFocus?: number;
    /** 优先级高于初始化 posterOptions.poster */
    poster?: string;
    themeType?: 'webLive' | 'webRec' | 'mobileLive' | 'mobileRec';
    /**
     * 头部工具栏
     */
    header?: Partial<IThemeDataItem> | null;
    /**
     * 底部工具栏
     */
    footer?: Partial<IThemeDataItem> | null;
}

/**
 * 消息类型
 * info 普通消息， 内容默认字体白色
 * warn 警告消息， 内容默认字体白色
 * error 错误消息， 内容默认字体白色
 */
type MessageType = 'info' | 'warn' | 'error';
/**
 * 消息控件配置项
 */
interface MessageOptions extends Omit<ControlOptions, 'tagName' | 'controlType'> {
    /** 自定义消息内容渲染函数， 默认使用内置的渲染函数
     *
     * @remarks 返回值会原样写入 `innerHTML`，**不做转义**。内置渲染会对 `msg`
     * 转义（消息文本可能来自内核或接口），一旦提供本函数，转义责任转交调用方。
     * @param {string} msg 消息内容
     * @param {number} duration 认自动关闭延时，单位秒， 默认 0 不关闭， 需手动调用 hide()
     * @param {MessageType} type 消息类型
     * @returns {string} html
     */
    render?: (msg: string, duration: number, type: MessageType) => string;
}
/**
 * 消息控件
 * @category Control
 */
declare class Message extends Control {
    private readonly options;
    private _timer;
    private _toastTimer;
    private _$toast;
    constructor(options?: Partial<MessageOptions>);
    /**
     * info 普通消息， 内容默认字体白色
     * @param {string} msg 消息内容
     * @param {number} duration 认自动关闭延时，单位秒， 默认 2s后 关闭， 需手动 调用 hide()
     */
    info(msg: string, duration?: number): void;
    /**
     * warn 警告消息， 内容默认字体黄色
     * @param {string} msg 消息内容
     * @param {number} duration 认自动关闭延时，单位秒， 默认 2s后 关闭， 需手动 调用 hide()
     */
    warn(msg: string, duration?: number): void;
    /**
     * toast 错误消息（渲染在 rootContainer 上的浮层）
     * @param {string} msg 消息内容
     * @param {number} duration 自动关闭延时，单位秒， 默认 2s 后关闭
     */
    toastError(msg: string, duration?: number): void;
    /**
     * error 错误消息， 内容默认字体红色
     * @param {string} msg 消息内容
     * @param {number=} duration 认自动关闭延时，单位秒， 默认 0 不关闭， 需手动 调用 hide()
     */
    error(msg: string, duration?: number): void;
    private _toast;
    /**
     * 展示消息，如果同时调用多次只展示最后一次的消息
     * @param  {string} msg 消息内容， 支持 html dom 字符串
     * @param  {number} duration 认自动关闭延时，单位秒， 默认 0 不关闭 需手动 调用 hide()
     * @param  {MessageType} type 消息类型
     */
    private _show;
    /**
     * 销毁
     */
    destroy(): void;
    /**
     * 隐藏消息， 并清空消息内容
     */
    hide(): void;
    private _getIcon;
}

/**
 * 封面控件配置项
 */
interface PosterOptions extends Omit<ControlOptions, 'tagName'> {
    /** 默认封面 */
    poster?: string;
    /** 封面加载失败回调 */
    onLoadImgError?: (src: string) => void;
}
/**
 * 封面控件
 * @category Control
 */
declare class Poster extends Control {
    private readonly _options;
    constructor(options?: Partial<PosterOptions>);
    /**
     * 封面图片加载失败
     * @param error
     */
    private _imgLoadErrorEvent;
    /**
     * 设置封面 这里不对 poster 进行缓存，如果有值优先使用，如果没有值优先使用 初始化传入的值
     * @param {string} poster 封面地址或 base64 数据
     */
    setPoster(poster?: string): void;
    /**
     * 展示封面 这里不对 poster 进行缓存， 如果有值优先使用， 如果没有值优先使用 初始化传入的值
     */
    show(): void;
    /**
     * 隐藏封面
     */
    hide(): void;
    /**
     * 销毁
     */
    destroy(): void;
}

/**
 * 播放/暂停控件配置项
 */
interface PlayOptions extends Omit<ControlOptions, 'tagName'> {
}
/**
 * 播放/暂停控件
 * @category Control
 */
declare class Play extends Control {
    private readonly _options;
    private _playing;
    constructor(options: PlayOptions);
    /**
     * 播放状态
     */
    get playing(): boolean;
    /**
     * 点击 Control 会触发
     */
    protected _onControlClick(e: Event): void;
    private _render;
}

/**
 * 进度条配置项
 * @category Control
 */
interface ProgressOptions {
    /**
     * 进度条容器
     * @throws
     * Error('container is required')
     */
    container: HTMLElement;
    /**
     * 进度条容器的样式类名
     */
    className?: string;
    /**
     * 进度条的步长
     * @default 0.01
     * @example
     * ```ts
     * step: 0.01
     * ```
     */
    step?: number;
    /**
     * 区间， 默认 [0, 1]
     * @default [0, 1]
     * @throws
     * Error('Progress range must be an array with two elements.')
     * @throws
     * Error('Progress range first element must be less than the second element.')
     */
    range?: [number, number];
    /**
     * 展示百分比
     * @default true
     */
    showPercent?: boolean;
    /**
     * 显示加号按钮
     * @default false
     */
    showPlus?: boolean;
    /**
     * 显示减号按钮
     * @default false
     */
    showMinus?: boolean;
    /**
     * 默认进度条值
     * @default range[0]
     */
    defaultValue?: number;
    /**
     * 是否可拖拽
     * @default true
     */
    draggable?: boolean;
    /**
     * 是否禁用
     * @default false
     */
    disabled?: boolean;
    /**
     * 旋转状态, 默认 false (垂直方向)。 true (水平方向)
     */
    isRotated?: boolean;
    /**
     * 进度条百分比变化
     * @param value - 值
     * @param percent - 进度条百分比
     * @param range - 区间
     */
    onChange?: (value: number, percent: number, range: [number, number]) => void;
    /**
     * 点击加号按钮
     * @param value - 值
     * @param percent - 进度条百分比
     * @param range - 区间
     */
    onPlusClick?: (value: number, percent: number, range: [number, number]) => void;
    /**
     * 点击减号按钮
     * @param value - 值
     * @param percent - 进度条百分比
     * @param range - 区间
     */
    onMinusClick?: (value: number, percent: number, range: [number, number]) => void;
    /**
     * 点击进度条
     * @param value - 值
     * @param percent - 进度条百分比
     * @param range - 区间
     */
    onProgressClick?: (value: number, percent: number, range: [number, number]) => void;
    /**
     *
     * @param value - 值
     * @param percent - 进度条百分比
     * @param range 区间
     * @returns
     */
    renderText?: (value: number, percent: number, range: [number, number]) => string;
}
/**
 * 进度条
 *
 * @category Control
 * @example
 * ```ts
 * const progress = new Progress({
 *   container: document.getElementById('progress-container'),
 *   step: 0.01,
 *   range: [0, 1],
 *   onChange: (value, range) => {
 *     console.log(`Progress changed: ${value}, Range: ${range}`);
 *  },
 *  defaultValue: 0.5,
 *  draggable: true,
 *  disabled: false,
 * })
 */
declare class Progress {
    options: Required<ProgressOptions>;
    $container: HTMLElement;
    $content: HTMLElement;
    _percent: number;
    _value: number;
    _disabled: boolean;
    private _delegateSliderMouseDown;
    private _delegateSliderHandleMouseDown;
    private _delegateProgressMouseDown;
    private _delegatePlusClick;
    private _delegateMinusClick;
    private _isRotated;
    constructor(options: ProgressOptions);
    get disabled(): boolean;
    set disabled(disabled: boolean);
    /**
     * 获取进度条值
     * @returns {number} 当前进度条值
     * @example
     * ```ts
     * const value = progress.value; // 获取当前进度条值
     * console.log(value); // 输出值
     * ```
     */
    get value(): number;
    set value(value: number);
    /**
     * 获取进度百分比
     * @returns {number}   当前进度条百分比
     * @example
     * ```ts
     * const percent = progress.percent; // 获取当前进度条百分比
     * console.log(percent); // 输出百分比
     * ```
     */
    get percent(): number;
    set percent(percent: number);
    /**
     * 是否旋转了
     * @param rotated
     */
    isRotate(rotated: boolean): void;
    /**
     * 销毁 Progress 实例，移除事件监听器
     * @returns {void}
     * @memberof Progress
     * @example
     * ```ts
     * progress.destroy();
     * ```
     */
    destroy(): void;
    private _updateValuePercent;
    private _convertPercentToValue;
    private _convertValueToPercent;
    private _render;
    private _updateUI;
    private _eventListeners;
}

/**
 * 音量调节控件配置
 */
interface VolumeOptions extends Omit<ControlOptions, 'tagName'> {
    /** 是否静音， 默认false */
    muted?: boolean;
    /** 初始化音量大小， 默认 0.8 */
    volume?: number;
    /** 音量控制面板是否默认展示， 默认 false， (移动端不生效) */
    open?: boolean;
    /** 调节音量面板展开或隐藏变换触发 */
    onOpenChange?: (open: boolean, volume: number, muted: boolean) => void;
    /** 静音或音量变化时触发 (静音时音量返回静音前的音量) */
    onChange?: (volume: number, muted: boolean) => void;
    /**
     * picker 弹出方式, 默认 hover
     * - hover: 鼠标悬停时弹出
     * - click: 点击时弹出
     */
    trigger?: 'hover' | 'click';
}
/**
 * 音量调节控件
 * @category Control
 */
declare class Volume extends Control {
    private readonly _options;
    private _muted;
    private _volume;
    /** 用来记录静音前的音量 */
    private _lastVolume;
    /** 音量调节弹出面板实例（移动端及 ezopen/ezhls 私有流下为 null） */
    picker: Picker | null;
    /** 音量进度条实例 @private */
    _progress: Progress | null;
    constructor(options?: VolumeOptions);
    /**
     * 是否静音
     */
    get muted(): boolean;
    set muted(muted: boolean);
    /**
     * 当前音量值（真实值 即使静音）
     */
    get volume(): number;
    set volume(volume: number);
    /**
     * 是否禁用
     */
    get disabled(): boolean;
    set disabled(disabled: boolean);
    /**
     * 销毁
     */
    destroy(): void;
    private _toggleMute;
    private _updateUI;
    get _$content(): HTMLDivElement;
    private _render;
    /**
     * 点击 Control 会触发
     */
    protected _onControlClick(): void;
    private _addEventListener;
}

/**
 * 全屏信息
 */
interface FullscreenChangeInfo$1 {
    /** 当前窗口是否处于全屏 */
    isCurrentFullscreen: boolean;
    /** 浏览器中是否有全屏 （移动端中永远是 false） */
    isFullscreen: boolean;
    /** 是否是移动端 */
    isMobile: boolean;
}
/**
 * 全屏变化回调
 */
type FullscreenChange = (info: FullscreenChangeInfo$1) => void;
/**
 * 全屏配置项
 */
interface FullscreenOptions$1 {
    prefix?: string;
    isFullscreen?: boolean;
    onChange?: FullscreenChange;
    onError?: () => void;
}
/**
 *
 * 全屏控制 {@link https://developer.mozilla.org/zh-CN/docs/Web/API/Fullscreen_API | 全屏 API}
 *
 * 依赖 screenfull {@link https://github.com/sindresorhus/screenfull}
 *
 * 移动端限制与注意:
 * 微信、支付宝等内置浏览器通常不支持标准全屏 API。
 * Safari（iOS）对全屏支持有限，只能视频元素全屏。
 * 建议：在支持的浏览器使用标准 API，其余可用“模拟全屏”方式（如遮罩、固定定位等）
 * 当前库仅支持 PC 端全屏，不支持移动端全屏(模拟全屏)
 *
 * ios 中浏览器横屏（旋转 90度 或 -90度）时，左右有有留白（空隙） 系统限制没法解决
 *
 * 部分 safari 浏览器在全屏状态下 再次调用全屏 screenfull.element 为 undefined, 避免同一个节点多次调用全屏操作
 *
 * 注意：不要让当前节点全屏后，在不取消的情况下，再去全屏其他节点
 *
 * @example
 * ```ts
 * const fullscreen = new Fullscreen(document.getElementById('container'),
 *  {
 *    onChange: () => {}
 *  }
 * )
 *
 * fullscreen.fullscreen()
 * fullscreen.exitFullscreen()
 * fullscreen.toggle()
 * fullscreen.destroy()
 * ```
 */
declare class Fullscreen$1 {
    $container: HTMLElement;
    private readonly _options;
    private _isCurrentFullscreen;
    private _isFullscreen;
    /** safari 浏览器在全屏状态下 再次调用全屏 screenfull.element 为 undefined, 记录上一次的全屏节点， 避免同一个节点多次调用全屏操作 */
    private _currentFullscreenElementList;
    constructor(container: HTMLElement, options?: FullscreenOptions$1);
    /**
     * 全屏
     * @returns Promise<void>
     */
    fullscreen(): Promise<void>;
    /**
     * 退出全屏
     * @returns Promise<void>
     */
    exitFullscreen(): Promise<void>;
    /**
     * 全屏切换
     * @returns Promise<void>
     */
    toggle(): Promise<void>;
    /**
     * 全屏监听销毁
     */
    destroy(): void;
    /**
     * screenfull change event
     */
    private _fullscreenchange2;
    private _fullscreenchange;
}

/**
 * 全屏控件配置项
 */
interface FullscreenOptions extends Omit<ControlOptions, 'tagName'> {
    /**
     * 全屏改变
     * @param info FullscreenChangeInfo 全屏信息
     */
    onChange?: (info: FullscreenChangeInfo$1) => void;
}
/**
 * 全屏控件
 * @category Control
 */
declare class Fullscreen extends Control {
    protected readonly options: FullscreenOptions;
    /** 当前是否处于全屏状态 */
    isCurrentFullscreen: boolean;
    protected _fullscreenUtil: Fullscreen$1 | null;
    protected readonly _$rootContainer: HTMLElement;
    constructor(options: FullscreenOptions);
    /**
     * 销毁
     */
    destroy(): void;
    protected _render(): void;
    protected _fullscreenChange(info: FullscreenChangeInfo$1): void;
    /**
     * 点击 Control 会触发
     */
    protected _onControlClick(): void;
    private _event;
}

/**
 * 全屏控件配置
 */
interface GlobalFullscreenOptions extends FullscreenOptions {
}

/**
 * 截图类型, "download" | "base64" | "blob"， 分别表示下载图片、返回 base64 字符串、返回 blob 对象
 */
type CapturePictureType = 'download' | 'base64' | 'blob';
/**
 * 截图控件配置项, 仅对控件有效， 对单独调用api截图时无效
 */
interface CapturePictureOptions extends Omit<ControlOptions, 'tagName'> {
    /**
     * 截图类型，可选值有 "download" | "base64" | "blob"， 分别表示下载图片、返回 base64 字符串、返回 blob 对象, 对单独调用api截图时无效
     * @default "download"
     */
    type?: CapturePictureType;
    /**
     * 截图质量, 取值范围 0 - 1, 仅对 type 为 "download" 或 "base64" 有效， 对单独调用api截图时无效
     * @default 0.9
     */
    quality?: number;
    /**
     * 云录制上传, 默认true
     */
    cloudRecUpload?: boolean;
    /**
     * 截图回调函数，仅对 type 为 "base64" 或 "blob" 有效， 对单独调用api截图时无效
     * @param data 截图数据，类型由 type 决定
     * @param type 截图数据类型
     * @returns {void}
     */
    onCapture?: (data: string | Blob, type: CapturePictureType) => void;
}

/**
 * 选择器项
 */
interface SelectItem {
    /** 标签 */
    label?: string;
    /** 值 */
    value?: number | string;
    [key: string]: any;
}
/**
 * 选择器控件配置, PC 和 Mobile 都支持
 */
interface SelectOptions extends Omit<ControlOptions, 'tagName'> {
    /** 选中项 */
    value?: SelectItem['value'];
    /** 选项列表 */
    list?: SelectItem[];
    /** 列表项的 label 和 value 的字段名 */
    fieldNames?: {
        /** 标签字段名 */
        label?: string;
        /** 值字段名 */
        value?: string;
    };
    /** dom节点 title 属性值 */
    title?: string;
    /**
     * 自定义当前选中的 label 内容 render
     *
     * @remarks 返回值会原样写入 `innerHTML`，**不做转义**。内置实现会转义 `label`
     * （清晰度/倍速列表可能由内核下发），一旦提供本函数，转义责任转交调用方。
     */
    renderLabel?: (label: string, item: SelectItem, list: SelectItem[]) => string;
    /**
     * 选中项变化回调
     * @param value - 选中项的 value
     * @param item - 选中项
     * @returns {void}
     */
    onChange?: (value: SelectItem['value'], item: SelectItem) => void;
    /**
     * 选择是否打开面板
     * @param open - 是否打开
     * @param value - 选中项的 value
     * @param item - 选中项
     * @returns
     */
    onOpenChange?: (open: boolean, value: SelectItem['value'], item: SelectItem) => void;
}

/**
 * 清晰度项
 */
interface DefinitionItem {
    /** 清晰度 0: 流畅； 1: 标清; 2: 高清; 3: 超清; 4: 极清; 5: 3K; 6: 4K */
    level: number;
    /**
     * 清晰度名称, 默认为 level 对应的语言值， 也可以自定义名称
     * 如果传入的值是 ['VIDEO_LEVEL_FLUENT', 'VIDEO_LEVEL_STANDARD', 'VIDEO_LEVEL_HEIGH', 'VIDEO_LEVEL_SUPER', 'VIDEO_LEVEL_EXTREME', 'VIDEO_LEVEL_3K', 'VIDEO_LEVEL_4k'] 等值会使用 locale 进行转换
     */
    name?: string;
    /** 1: 主码流, 2: 子码流 （仅支持这两种） */
    streamTypeIn: 1 | 2;
    /** 如果 type === 'compatible' 代表兼容模式(没有查到清晰度列表)，兼容模式下 streamTypeIn 默认为 1， 因为有可能没有子码流， 如果开发者已知设备支持子码流可以设置 streamTypeIn: 2 */
    type?: 'compatible' | undefined;
}
type DefinitionOptions = Omit<SelectOptions, 'list' | 'fieldNames'> & {
    /** 清晰度列表, 默认值 [], 如果没有传 list，则使用接口（查询设备清晰度）查询的结果，如果有 list，则使用 list 内部不再请求接口（查询设备清晰度）查询 */
    list?: DefinitionItem[];
};

/**
 * 云台控件配置项
 */
interface PtzOptions extends Omit<ControlOptions, 'tagName'>, BasePtzOptions {
}

/**
 * 回放控件配置项
 */
interface RecOptions extends Omit<ControlOptions, 'tagName'> {
    /** 点击控件时的回调 */
    onClick?: (e: Event) => void;
    /** 回放类型切换时的回调 */
    onChange?: (type: ThemeRecType) => void;
    /** 默认回放类型， 默认 'rec' */
    playType?: ThemeRecType;
}
/**
 * 回放类型切换（本地回放(sdk 卡)， 云存储回放， 云录制回放）控件
 * @category Control
 */
declare class Rec extends Control {
    /** 回放类型切换组，本身就是三种回放之间的切换入口，直播下无意义 */
    static supportedPlayTypes: ThemePlayType[];
    private readonly _options;
    private _delegation;
    private recType;
    constructor(options: RecOptions);
    /**
     * 销毁
     */
    destroy(): void;
    /**
     * 添加回放类型图标
     * @param {string} id 回放类型 'rec' | 'cloudRec' | 'cloudRecord'
     */
    addRecType(id: string): void;
    private _activeIcon;
    private _onClickIcon;
    /**
     * 点击 Control 会触发
     */
    protected _onControlClick(e: Event): void;
}

/**
 * 录像列表按钮控件配置项
 */
interface RecListOptions extends Omit<ControlOptions, 'tagName'>, RecListModalOptions {
}

/**
 * 录制控件配置项
 */
interface RecordOptions extends Omit<ControlOptions, 'tagName'> {
    /**
     * 最长录制时长, 单位秒, 默认 3600 秒 (1 小时), 注意录制过程中会占用浏览器内存, 请根据实际情况进行配置
     * @default 3600
     */
    maxDuration?: number;
}

/**
 * 倍速控件配置
 *
 * - `list`：通用倍速列表，某类回放没有单独配置时使用。
 *   只配 `list` 时，三类回放（本地卡 / 云存储 / 云录制）共用这一份，行为与 9.1 之前一致。
 * - `rec` / `cloudRec` / `cloudRecord`：按回放类型单独配置，优先级高于 `list`。
 *
 * @example
 * ```ts
 * // 三类回放共用同一份列表
 * speedOptions: { list: [{ label: '1x', value: 1 }, { label: '2x', value: 2 }] }
 *
 * // 只给云存储回放单独放宽，其余沿用 list
 * speedOptions: {
 *   list: [{ label: '1x', value: 1 }, { label: '2x', value: 2 }],
 *   cloudRec: [{ label: '1x', value: 1 }, { label: '4x', value: 4 }, { label: '8x', value: 8 }],
 * }
 * ```
 */
interface SpeedOptions extends SelectOptions {
    /** 通用倍速列表，未单独配置某类回放时使用 */
    list?: SelectItem[];
    /** 本地卡回放倍速列表 */
    rec?: SelectItem[];
    /** 云存储回放倍速列表 */
    cloudRec?: SelectItem[];
    /** 云录制回放倍速列表 */
    cloudRecord?: SelectItem[];
}

/**
 * 码流类型：1 主码流，2 子码流（仅支持这两种）
 */
type StreamTypeIn = 1 | 2;
type StreamTypeOptions = Omit<SelectOptions, 'list' | 'fieldNames' | 'value'> & {
    /** 初始码流，默认取播放地址里的 streamTypeIn，都没有时为 1（主码流） */
    value?: StreamTypeIn;
};

/**
 * 对讲控件配置项
 */
interface TalkOptions extends Omit<ControlOptions, 'tagName'> {
    /**
     * 对讲音量改变
     * @param value 音量 [0, 1]
     * @returns
     */
    onChange: (value: number) => void;
}

/**
 * 电子放大控件配置项
 */
interface ZoomOptions extends Exclude<ControlOptions, 'tagName'> {
    onChange?: (value: number, percent: number, range: [number, number]) => void;
    open?: boolean;
    max?: number;
}

/**
 * 封面控件配置项
 */
interface PauseOptions extends Omit<ControlOptions, 'tagName'> {
}
/**
 * 暂停控件（仅在第一次非自动播放时可以点击播放）, 防止和放大有冲突
 * @category Control
 */
declare class Pause extends Control {
    private readonly _options;
    private _timer;
    private _timer2;
    private _timer3;
    private _firstFlag;
    constructor(options?: Partial<PauseOptions>);
    /**
     * 展示封面 这里不对 poster 进行缓存， 如果有值优先使用， 如果没有值优先使用 初始化传入的值
     */
    show(playing?: boolean, always?: boolean): void;
    /**
     * 销毁
     */
    destroy(): void;
    protected _onControlClick(e: Event): void;
}

interface EzopenToken {
    deviceToken?: {
        video?: string;
        global?: string;
    };
    streamToken?: {
        live?: string;
        rec?: string;
        talk?: string;
    };
    httpToken?: {
        url?: string;
    };
}
interface ServicesOptions {
    sdkType: string;
    baseURL?: string;
    accessToken: string;
    token?: EzopenToken;
    ezopenParams?: Record<string, any>;
    /** 播放地址 */
    url?: string;
    wsParams?: Record<string, any>;
    /**
     * 时区偏移（小时），中国以外的地区设备才需要；播放地址里带 `timeZone` 参数时以地址为准。
     * 回放片段查询（`getLocalRecTimes` / `getCloudTimes`）按它把返回的片段时间换算回本地时间
     * @since 3.2.0
     */
    timeZone?: number;
    videoLevelList?: EzvizVideoLevel[];
    clientType?: string;
}
/**
 * 视频清晰度能力项
 * @deprecated
 * 对应 `EzvizDeviceCapacity.video_quality_capacity` 数组中的一项，各字段均为字符串。
 */
interface IVideoQualityCapacity {
    /** 码流类型 */
    streamType?: string;
    /** 清晰度等级 */
    videoLevel?: string;
    /** 分辨率枚举 */
    resolution?: string;
    /** 视频码率枚举 */
    videoBitRate?: string;
    /** 最大码率 */
    maxBitRate?: string;
}
/**
 * 设备能力集
 *
 * 来自设备能力查询接口（https://open.ys7.com/help/678）返回的 `data`，字段名是设备侧的原始命名
 * （含下划线、大小写混用，个别字段名含 `.`），不做转换。
 *
 * @remarks
 * - 绝大多数字段是字符串形式的开关：`"1"` 支持，`"0"` 不支持；字段缺失按不支持处理。
 *   取值多于 0 / 1 的字段（如 `support_talk`、`support_wifi`）在注释里列出了各取值含义。
 * - 标注「文档未收录」的字段出现在设备实际返回里，但开放平台文档没有列出，含义由字段名推断，仅供参考。
 */
interface EzvizDeviceCapacity {
    /** 是否支持云台上下转动 0-不支持, 1-支持 */
    ptz_top_bottom?: string;
    /** 是否支持云台左右转动 0-不支持, 1-支持 */
    ptz_left_right?: string;
    /** 是否支持云台 45 度方向转动 0-不支持, 1-支持 */
    ptz_45?: string;
    /** 是否支持云台缩放控制 0-不支持, 1-支持 */
    ptz_zoom?: string;
    /** 是否支持云台预置点 0-不支持, 1-支持 */
    ptz_preset?: string;
    /** 是否支持普通巡航 0-不支持, 1-支持 */
    ptz_common_cruise?: string;
    /** 是否支持花样巡航 0-不支持, 1-支持 */
    ptz_figure_cruise?: string;
    /** 是否支持中心镜像 0-不支持, 1-支持 */
    ptz_center_mirror?: string;
    /** 是否支持左右镜像 0-不支持, 1-支持 */
    ptz_left_right_mirror?: string;
    /** 是否支持上下镜像 0-不支持, 1-支持 */
    ptz_top_bottom_mirror?: string;
    /** 是否支持关闭镜头 0-不支持, 1-支持 */
    ptz_close_scene?: string;
    /** 是否支持焦距模式 0-不支持, 1-支持 */
    ptz_focus?: string;
    /** 云台控制方式 0-支持直连+转发云台控制, 1-支持直连云台控制, 2-支持转发云台控制 */
    support_ptz_model?: string;
    /** 是否支持云台自动复位 0-不支持, 1-支持 */
    support_ptz_auto_reset?: string;
    /**
     * 是否支持全景云台功能 0-不支持, 1-支持（C6B 等云台摄像机支持）
     *
     * 如果存在 {@link EzvizDeviceCapacity.support_fullscreen_ptz_12}，优先参考它。
     */
    support_fullscreen_ptz?: string;
    /** 是否支持全景云台功能 0-不支持, 1-支持（C6B 等云台摄像机支持，12 张全景云台图片） */
    support_fullscreen_ptz_12?: string;
    /** 是否支持水平全景 0-不支持, 1-支持 */
    support_horizontal_panoramic?: string;
    /** 是否支持垂直全景（与 `support_horizontal_panoramic` 对应）0-不支持, 1-支持 */
    support_vertical_panoramic?: string;
    /** 是否支持预置点告警联动 0-不支持, 1-支持（C6B 等云台摄像机支持） */
    support_preset_alarm?: string;
    /** 是否支持智能跟踪 0-不支持, 1-支持（C6B 等云台摄像机支持） */
    support_intelligent_track?: string;
    /** 是否支持一键聚焦 0-不支持, 1-支持（F1、F2 等变焦摄像机支持） */
    support_key_focus?: string;
    /** 支持云台（总开关），`"1"` 支持（文档未收录） */
    support_ptz?: string;
    /** 通道数量（注意是 number，其余字段多为 string）（文档未收录） */
    support_channel_number?: number;
    /** 通道类型 1-数字通道, 2-模拟通道 */
    support_chan_type?: string;
    /** 是否支持通道名称配置到设备（IPC / NVR）0-不支持, 1-支持 */
    support_modify_chan_name?: string;
    /** 是否支持修改设备加密密码 0-不支持, 1-支持 */
    support_modify_pwd?: string;
    /** 是否支持设备升级 0-不支持, 1-支持 */
    support_upgrade?: string;
    /** 是否支持用户解绑设备 0-不支持, 1-支持 reset 键解绑, 2-支持界面点击确定按钮解绑 */
    support_unbind?: string;
    /** 是否支持时区配置 0-不支持, 1-支持 */
    support_timezone?: string;
    /** 支持的语言类型，逗号分隔，如 `"ENGLISH,SIMPCN"` */
    support_language?: string;
    /**
     * 是否支持设备设置功能 0-不支持, 1-支持
     *
     * 设备设置页新增「更多配置」，该项按设备能力集实现，进入 H5 网页展现。
     */
    support_more?: string;
    /** 是否支持睡眠功能 0-不支持, 1-支持 */
    support_sleep?: string;
    /** 设备重启时间，单位秒，默认 120 */
    support_restart_time?: string | number;
    /** 是否支持通过 UserID 关联设备 0-不支持, 1-支持 */
    support_userId?: string;
    /** 是否支持关联设备 0-无关联设备, 1-关联监控点或 N1, 2-关联探测器或 A1, 3-关联监控点探测器或 R1, 4-关联多通道设备 */
    support_related_device?: string;
    /** NVR / R1 是否支持关联 IPC 存储 0-不支持, 1-支持 */
    support_related_storage?: string;
    /** 是否支持设备自动上下线 0-不支持, 1-支持 */
    support_auto_offline?: string;
    /** 是否支持设备下线通知 0-不支持, 1-支持 */
    support_device_offline_notify?: string;
    /** 是否支持通道下线通知，支持后通道下线会触发 videoloss 告警 0-不支持, 1-支持 */
    support_channel_offline_notify?: string;
    /** X3 或 N1 可以关联的通道数 */
    replay_chan_nums?: string | number;
    /** 是否支持设备跨公网配置的能力级 0-不支持, 1-支持 */
    support_sdk_transport?: string;
    /** 是否支持多画面播放 0-不支持, 1-支持（客户端使用，与设备无关） */
    support_multi_screen?: string;
    /** 是否支持蓝牙 0-不支持, 1-支持 */
    support_bluetooth?: string;
    /** 是否支持畸形矫正 0-不支持, 1-支持 */
    support_rectify_image?: string;
    /** 是否支持显微镜功能 0-不支持, 1-支持 */
    support_microscope?: string;
    /** 是否支持鱼眼模式 0-不支持, 1-支持 */
    support_fisheye_mode?: string;
    /** 是否支持客流统计 0-不支持, 1-支持 */
    support_flow_statistics?: string;
    /** 是否支持儿歌播放功能 0-不支持, 1-支持 */
    support_music?: string;
    /** 是否支持语音识别 0-不支持, 1-支持 */
    support_speech_recognition?: string;
    /** 是否支持语音闹钟功能 0-不支持, 1-支持 */
    support_voice_alarmclock?: string;
    /** 是否支持微信互联 0-不支持, 1-支持 */
    support_weixin?: string;
    /** 是否支持声源定位 0-不支持, 1-支持（`ssl` 即 sound source localization，不是 SSL 证书） */
    support_ssl?: string;
    /** 是否支持留言 0-不支持, 1-支持 */
    support_message?: string;
    /** 是否支持留言封面 0-不支持, 1-支持 */
    support_message_cover?: string;
    /** 是否支持设备灯光，`"1"` 支持（文档未收录） */
    support_device_light?: string;
    /** 支持检查设备激活状态，`"1"` 支持（文档未收录） */
    support_check_activestatus?: string;
    /** 支持远程日志上传，`"1"` 支持（文档未收录） */
    support_remoteLogUpload?: string;
    /** 支持 HiDDNS 配置，`"1"` 支持（文档未收录） */
    support_hiddns_config?: string;
    /** 支持带宽检测，`"1"` 支持（文档未收录） */
    support_bwcheck?: string;
    /** 支持 DSTP 协议，`"1"` 支持（文档未收录） */
    support_DSTP?: string;
    /** 支持 GL，`"1"` 支持，具体含义由设备侧定义（文档未收录） */
    support_GL?: string;
    /** 是否支持 WI-FI 0-不支持, 1-支持 netsdk 配置 WI-FI, 2-支持带 userId 的新 WI-FI 配置方式, 3-支持一键配置 WI-FI */
    support_wifi?: string;
    /** 是否支持 WiFi userId */
    support_wifi_userId?: string;
    /** 是否支持智能 WiFi 配网 */
    support_smart_wifi?: string;
    /** 是否支持 2.4G 无线频段 0-不支持, 1-支持 */
    'support_wifi_2.4G'?: string;
    /** 是否支持 5G 无线频段 0-不支持, 1-支持 */
    support_wifi_5G?: string;
    /**
     * 是否支持营销 WiFi，只有 `support_wifi_2.4G` 为 `"1"` 时才生效
     *
     * 0-不支持, 1-支持但不能设置营销页（X1）, 2-支持且可以设置营销页
     */
    support_wifi_portal?: string;
    /** 是否支持添加设备配置 WiFi 使用 0-不支持, 1-smartconfig+声波失败后支持 AP 配网, 2-设备默认 AP 配网 */
    support_ap_mode?: string;
    /** 是否支持声波配置（高频版本）0-不支持, 1-支持 */
    support_new_sound_wave?: string;
    /** 是否支持 P2P 模式：默认 0 表示老的 P2P 协议，1 表示该版本支持新的 P2P 协议 */
    support_p2p_mode?: string;
    /** 是否支持 NAT 组合为 3-4 的 NAT 穿透（P2PV2.1）0-不支持, 1-支持 */
    support_nat_pass?: string;
    /** 是否支持视频图像加密 0-不支持, 1-支持 */
    support_encrypt?: string;
    /** 是否支持设备远程授权获取密码 0-不支持, 1-支持 */
    support_remote_auth_randcode?: string;
    /** 是否支持走代理时自动加密「没有开启视频加密」的流 0-不支持, 1-支持 */
    support_noencript_via_antproxy?: string;
    /** 是否支持反向直连功能 0-不支持, 1-支持 */
    support_reverse_direct?: string;
    /** 是否支持查询当前预览、回放链接信息 0-不支持, 1-支持 */
    support_query_play_connections?: string;
    /** 预览取流格式传输类型 0-tcp, 1-udp，默认 0 */
    support_transfertype?: string;
    /** 是否支持自适应码流 0-不支持, 1-支持 */
    support_auto_adjust?: string;
    /** 是否支持自定义码率 0-不支持, 1-支持 */
    support_customize_rate?: string;
    /** 是否支持高清码率限制 0-不支持码率限制, 1-支持高清码率限制 */
    support_rate_limit?: string;
    /** 支持快速取流，`"1"` 支持（文档未收录） */
    support_quick_get_streaming?: string;
    /**
     * 全链路加密能力集（数组）
     * @since 9.0.14
     *
     * 元素含义：
     *   0 = 不支持（一票否决：含 0 视作全部不支持）
     *   1 = 预览全链路加密
     *   2 = 回放全链路加密
     *   3 = 对讲全链路加密
     *   4 = 套包预览  5 = 套包回放  6 = 套包对讲  7 = UDP 预览
     *
     * 服务端实测返回形态：**逗号分隔字符串**（open.ys7.com 生产验证）
     *   "1"     → 支持预览
     *   "1,2"   → 支持预览 + 回放
     *   "0"     → 明确不支持
     *   缺失    → 视作不支持（多数存量设备）
     *
     * 判定统一走 ecdhHelper.isEcdhSupported（内部按 [,，] 切分归一）
     */
    support_ecdh_v2?: string;
    /** 该设备型号是否支持云存储 0-不支持, 1-支持 */
    support_cloud?: string;
    /**
     * 该设备版本是否支持云存储 0-不支持, 1-支持，需要和 `support_cloud` 组合使用：
     *
     * - `support_cloud = 1` 且 `support_cloud_version = 1`：支持云存储
     * - `support_cloud = 1` 且 `support_cloud_version = 0`：该型号支持云存储，但当前固件版本不支持
     * - `support_cloud = 0`：该型号不支持云存储
     */
    support_cloud_version?: string;
    /** 是否支持连续云存储 0-不支持, 1-支持（与 `support_cloud` 完全无关） */
    support_continuous_cloud?: string;
    /** 是否支持存储格式化 0-不支持, 1-支持 */
    support_disk?: string;
    /** 是否支持全天录像配置开关 0-不支持, 1-支持 */
    support_fullday_record?: string;
    /** 是否支持调节回放播放速度功能 0-不支持, 1-支持（仅 IPC 支持） */
    support_replay_speed?: string;
    /** 是否支持手机拍照上传到云存储 0-不支持, 1-支持 */
    support_upload_cloud_file?: string;
    /** 支持回放时拖动定位（seek），`"1"` 支持（文档未收录） */
    support_seek_playback?: string;
    /** 支持 seek v2 版本，`"1"` 支持（文档未收录） */
    support_seek_v2?: string;
    /** 支持录像检索过滤，值为支持的过滤类型列表，逗号分隔，如 `"1,2"`（文档未收录） */
    support_record_search_filter?: string;
    /**
     * 支持本地录像按码流类型（主 / 子码流）回放，`"1"` 支持（文档未收录）
     *
     * 看起来对应主题的 `supportLocalRecordStreamType`，为 `"1"` 时本地回放才会展示码流切换控件，需确认。
     */
    support_record_stream_type?: string;
    /** 支持回放下载，`"1"` 支持（文档未收录） */
    support_replay_download?: string;
    /** 支持检索本地录像延迟，`"1"` 支持（文档未收录） */
    support_search_local_record_delay?: string;
    /** 支持停止录像（录像视频），`"1"` 支持（文档未收录） */
    support_stoprecord_video?: string;
    /** 是否支持封面抓图 0-不支持, 1-支持 */
    support_capture?: string;
    /** 是否支持对讲 0-不支持, 1-全双工, 3-半双工 */
    support_talk?: string;
    /** 对讲使用的麦克风 0-采用上面的麦克风, 1-对讲采用下面的麦克风 */
    support_talk_type?: string;
    /** 是否支持新对讲服务 0-不支持, 1-支持 */
    support_new_talk?: string;
    /** 视频播放比例，`"16-9"` 表示 16:9 分辨率，默认 `"16-9"` */
    support_resolution?: string;
    /** 视频清晰度能力列表 */
    video_quality_capacity?: IVideoQualityCapacity[];
    /** 是否支持声音开关设置 0-不支持, 1-支持 */
    support_audio_onoff?: string;
    /** 是否支持音量调节 0-不支持, 1-支持 */
    support_volumn_set?: string;
    /** 是否支持麦克风音量调节 0-不支持, 1-支持 */
    support_mcvolumn_set?: string;
    /** 是否支持红外开关 0-不支持, 1-支持 */
    support_close_infrared_light?: string;
    /** 支持系统音量开关设置，`"1"` 支持（文档未收录） */
    support_sysvolsw_set?: string;
    /** 支持宽动态图像，`"1"` 支持（文档未收录） */
    support_wide_dynamic_image?: string;
    /** 支持智能夜视，值为支持的模式 / 档位，如 `"4"`，`"0"` 不支持（文档未收录） */
    support_smart_night_vision?: string;
    /** 是否支持布撤防、活动检测开关 */
    support_defence?: string;
    /** 是否支持布撤防计划 0-不支持, 1-支持, 2-支持新的设备计划协议 */
    support_defenceplan?: string;
    /** 是否支持通道布撤防 0-不支持, 1-支持 */
    support_chan_defence?: string;
    /**
     * 防护模式 0-无防护模式（可能有活动检测，根据 `support_defence` 判断）, 1-只有防护模式,
     * 2-有防护模式（可能有活动检测，根据 `support_defence` 判断）
     *
     * 举例：A1 为 `support_protection_mode=1`、`support_defence=1`；普通 IPC 为 0 / 1；C1S 为 2 / 1。
     */
    support_protection_mode?: string;
    /** 是否支持定时切换安全功能模式 0-不支持, 1-支持 */
    support_safe_mode_plan?: string;
    /** 是否支持隐私保护 0-不支持, 1-支持 */
    support_privacy?: string;
    /** 是否支持告警声音配置 0-不支持, 1-支持 */
    support_alarm_voice?: string;
    /** 是否支持自定义语音 0-不支持, 1-支持（语音闹钟、告警声音使用） */
    support_custom_voice?: string;
    /** 是否支持主动防御功能 0-不支持, 1-主动防御按钮, 2-主动防御按钮+灯光提醒开关 */
    support_active_defense?: string;
    /** 是否支持安防灯 0-不支持, 1-支持 */
    support_alarm_light?: string;
    /** 是否支持安防灯 0-不支持, 1-支持（文档说明与 `support_alarm_light` 完全相同，疑为笔误，含义待确认） */
    support_alarm_area?: string;
    /** 是否支持温湿度告警 0-不支持, 1-支持（F2、C1S 等带温湿度传感器的摄像机支持） */
    support_temperature_alarm?: string;
    /** A1 是否支持远程消警（静音）功能 0-不支持, 1-支持 */
    support_remote_quiet?: string;
    /** 是否支持移动侦测灵敏度调节 0-不支持, 1-支持（文档只写了 0 / 1 / 2） */
    support_sensibility_adjust?: string;
    /** 是否支持移动侦测区域绘制 0-不支持, 1-支持 */
    support_motion_detect_area?: string;
    /** 是否支持人形过滤能力 0-不支持, 1-支持（C5SI 型号，设备通过智能芯片硬件来支持） */
    support_human_filter?: string;
    /** 是否支持人形检测能力 0-不支持, 1-支持（设备 + 平台服务开通，设备更新软件版本后可支持） */
    support_human_service?: string;
    /** 是否支持红外检测能力 0-不支持, 1-支持（猫眼） */
    support_pir_detect?: string;
    /** 是否支持人脸检测能力 0-不支持, 1-支持（猫眼） */
    support_face_detect?: string;
    /** 是否支持 PIR（红外）区域设置 0-不支持, 1-支持 */
    support_pir_setting?: string;
    /** 自定义语音的最大条数（文档未收录） */
    support_custom_voice_max?: string;
    /** 支持免打扰通道模式，`"1"` 支持（文档未收录） */
    support_distrub_channel_mode?: string;
    /** 是否支持 app 远程添加删除外设（探测器）0-不支持, 1-支持 */
    support_add_del_detector?: string;
    /** 是否支持修改外设（探测器）名称 0-不支持, 1-支持 */
    support_modify_detectorname?: string;
    /**
     * A1 设备是否支持单独布撤防
     *
     * 字段不存在表示不支持；存在时各外设用逗号隔开，按下面的探测器顺序排列，每个值是 32 位数值，
     * 按位标识该探测器在每种模式下是否可以设置使能：bit0 外出模式、bit1 睡眠模式、bit2 在家模式，
     * 可以设置则对应位置 1。例如 `"0,0,7,7,7,0,7,0,0,0"`。
     *
     * 探测器顺序：烟感、紧急按钮、门磁、红外、幕帘、紧急按钮、单体门磁、警号、燃气探测器、水患探测器。
     */
    support_modify_detectorguard?: string;
    /** 是否支持 IPC 与 A1 联动关系设置 0-不支持, 1-支持 */
    support_ipc_link?: string;
    /** 是否支持关联探测器 0-不支持, 1-支持 */
    support_associate_detector?: string;
    /** 是否支持 W2D 关联摄像机功能 0-不支持, 1-支持 */
    support_relation_camera?: string;
    /** NVR 是否支持白名单成员管理 0-不支持, 1-支持 */
    support_nvr_whitelist?: string;
    /** 是否支持开锁 0-不支持, 1-支持 */
    support_unlock?: string;
    /** 是否支持修改门锁用户备注名称 0-不支持, 1-支持 */
    support_modify_username?: string;
    /** 是否支持门铃呼叫能力 0-不支持, 1-支持（猫眼） */
    support_doorbell_talk?: string;
    /** 是否支持门铃声音 0-不支持, 1-支持 */
    support_doorbell_sound?: string;
    /** 是否支持门铃扩展 0-不支持, 1-支持 */
    support_chime?: string;
    /** 是否支持 `support_video_mode` 0-不支持, 1-支持（文档未给出具体含义） */
    support_video_mode?: string;
    /** 是否支持电量管理 0-不支持, 1-支持 */
    support_battery_manage?: string;
    /** 电池数量（文档未收录） */
    support_battery_number?: string;
    /** 支持设置页面智能应用 0-不支持, 1-固定 c6 设备跳转, 2-动态智能应用 */
    support_smart_app?: string;
    /** 其余设备侧新增的能力字段，原样透传 */
    [key: string]: string | number | IVideoQualityCapacity[] | undefined;
}
/**
 * 设备信息 POST /api/lapp/device/info
 * @see https://open.ys7.com/help/672
 *
 * 查询失败时为 `{}`，所以字段全部可选
 */
interface EzvizDeviceInfo {
    /** 设备序列号 */
    deviceSerial?: string;
    /** 设备名称 */
    deviceName?: string;
    /** 设备上报名称 */
    localName?: string;
    /** 设备型号，如 CS-C2S-21WPFR-WX */
    model?: string;
    /** 在线状态：0-不在线，1-在线 */
    status?: number;
    /** 布撤防状态：具有防护能力的设备 0-睡眠 8-在家 16-外出；普通 IPC 0-撤防 1-布防 */
    defence?: number;
    /** 是否加密：0-不加密，1-加密 */
    isEncrypt?: number;
    /** 告警声音模式：0-短叫，1-长叫，2-静音 */
    alarmSoundMode?: number;
    /** 设备下线是否通知：0-不通知 1-通知 */
    offlineNotify?: number;
    /** 设备大类 */
    category?: string;
    /** 设备二级类目 */
    parentCategory?: string;
    /** 修改时间 */
    updateTime?: number;
    /** 网络类型，如有线连接 wire */
    netType?: string;
    /** 信号强度（%） */
    signal?: string;
    /** 设备风险安全等级：0-安全，大于 0 有风险，风险越高值越大 */
    riskLevel?: number;
    /** 设备 IP 地址 */
    netAddress?: string;
    [key: string]: string | number | undefined;
}
/**
 * 开放平台 lapp 接口通用返回结构（`code` 为 `'200'` 时成功）
 */
interface EzvizApiResponse<T = any> {
    /** 返回码，`'200'` 为成功 */
    code?: string | number;
    /** 返回信息 */
    msg?: string;
    /** 返回数据 */
    data?: T;
    /** 分页信息（分页接口才有） */
    page?: EzvizPage;
    [key: string]: any;
}
/**
 * service 接口通用返回结构（`meta.code` 为 200 时成功）
 */
interface EzvizMetaResponse<T = any> {
    meta?: {
        /** 返回码，200 为成功 */
        code?: number | string;
        /** 返回信息 */
        message?: string;
        moreInfo?: any;
    };
    /** 返回数据 */
    data?: T;
    [key: string]: any;
}
/** 分页信息 */
interface EzvizPage {
    /** 总数 */
    total: number;
    /** 当前页（从 0 开始） */
    page: number;
    /** 分页大小 */
    size: number;
}
/**
 * 通道信息（获取指定设备的通道信息接口返回项）
 * @see https://open.ys7.com/help/1478
 */
interface EzvizCameraInfo {
    /** 设备序列号 */
    deviceSerial: string;
    /** 关联的 IPC 序列号 */
    ipcSerial?: string;
    /** 通道号 */
    channelNo: number;
    /** 设备名称 */
    deviceName?: string;
    /** 通道名称 */
    channelName?: string;
    /** 在线状态：0-不在线，1-在线（-1 设备未上报） */
    status?: number;
    /** 是否分享：0-未分享，1-分享所有者，2-分享接受者 */
    isShared?: string;
    /** 图片地址（大图），若在萤石客户端设置封面则返回封面图片，未设置则返回默认图片 */
    picUrl?: string;
    /** 是否加密：0-不加密，1-加密 */
    isEncrypt?: number;
    /** 视频质量：0-流畅，1-均衡，2-高清，3-超清 */
    videoLevel?: number;
    /** 当前通道是否关联 IPC：true-是，false-否 */
    relatedIpc?: boolean;
    /** 是否显示：0-隐藏，1-显示 */
    isAdd?: number;
    [key: string]: any;
}
/**
 * 设备云存储信息（查询设备云存储信息接口 `data` 的第一项）
 * @see https://open.ys7.com/help/1404
 *
 * 查询失败或没有开通时为 `{}`，所以字段全部可选
 */
interface EzvizCloudInfo {
    /** 设备序列号 */
    deviceSerial?: string;
    /** 通道号 */
    channelNo?: number;
    /** 云存储套餐总天数 */
    totalDays?: number;
    /** 云存储状态：-2-设备不支持，-1-未开通云存储，0-未激活，1-激活，2-过期 */
    status?: number;
    /** 云存储套餐有效天数 */
    validDays?: number;
    /** 云存储服务开始时间（毫秒时间戳） */
    startTime?: number;
    /** 云存储服务到期时间（毫秒时间戳） */
    expireTime?: number;
    /** 云存储服务类型 */
    serviceType?: number;
    [key: string]: any;
}
/**
 * 语音文件（查询默认语音列表接口返回项）
 * @see https://open.ys7.com/help/1247
 */
interface EzvizVoiceItem {
    /** 语音名称 */
    voiceName: string;
    /** 下载地址，有效期 1 天 */
    fileUrl: string;
    /** 时长，单位秒 */
    duration: number;
    [key: string]: any;
}
/**
 * 告警消息（按设备获取告警消息列表接口返回项）
 * @see https://open.ys7.com/help/987
 */
interface EzvizAlarmItem {
    /** 告警消息 ID */
    alarmId: string;
    /** 告警源名称 */
    alarmName?: string;
    /** 告警类型 */
    alarmType?: number;
    /** 告警时间（毫秒时间戳） */
    alarmTime?: number;
    /** 通道号 */
    channelNo?: number;
    /** 告警图片是否加密：0-不加密，1-加密 */
    isEncrypt?: number;
    /** 是否已读：0-未读，1-已读 */
    isChecked?: number;
    /** 存储类型：0-无存储，1-萤石，2-百度，4-云存储；多种组合时值相加 */
    recState?: number;
    /** 预录时间，单位秒 */
    preTime?: number;
    /** 延迟录像时间，单位秒 */
    delayTime?: number;
    /** 设备序列号 */
    deviceSerial?: string;
    /** 告警图片地址 */
    alarmPicUrl?: string;
    /** 关联的告警消息 */
    relationAlarms?: any[];
    /** 拨打电话类型 */
    customerType?: string;
    /** 拨打电话信息 */
    customerInfo?: string;
    [key: string]: any;
}
/** 列表 + 分页（语音列表、告警消息列表等，services 已从接口返回体中提取） */
interface EzvizPageList<T> {
    /** 列表数据，接口失败时为 `[]` */
    data: T[];
    /** 分页信息 */
    page: EzvizPage;
}
/**
 * 即时云抓拍返回数据
 * @see https://open.ys7.com/help/5235
 */
interface EzvizCaptureSaveData {
    /** 抓拍图片下载地址 */
    picUrl: string;
    /** 文件节点 id */
    fileNodeId?: string;
}
/**
 * 创建抓图任务返回数据
 * @see https://open.ys7.com/help/1390
 */
interface EzvizCaptureTaskData {
    /** 抓图任务 id */
    taskId: string;
}
/**
 * 存储空间信息（空间列表查询接口返回项）
 * @see https://open.ys7.com/help/5230
 */
interface EzvizSpaceInfo {
    /** 空间 id(即创建抓拍任务/即时抓拍所需的存储空间 id) */
    spaceId: number;
    /** 空间名称 */
    spaceName: string;
    /** 空间业务类型:vod-云点播,record-云录制2.0,cloudCapture-云抓拍,capture-设备抓图 */
    bizType?: string;
    /** 空间业务类型描述 */
    bizTypeDesc?: string;
    /** 过期天数,-1 表示永久 */
    expireDays?: number;
    /** 存储类型 1-标准存储 */
    storageType?: number;
    /** 是否为默认空间 0-否 1-是 */
    defaultSpace?: number;
    /** 创建时间 */
    createTime?: string;
    /** 更新时间 */
    updateTime?: string;
    [key: string]: any;
}
/**
 * 存储空间列表查询返回数据
 * @see https://open.ys7.com/help/5230
 */
interface EzvizSpaceListData {
    /** 空间列表 */
    result: EzvizSpaceInfo[];
    /** 当前页最后一条记录的空间 id,用于翻页 */
    lastId?: number;
    /** 当前分页大小 */
    pageSize?: number;
    /** 是否有下一页 */
    hasNext?: boolean;
}
/** appKey 查询返回数据 */
interface EzvizAppKeyData {
    /** 用于上报的 appKey */
    appKey: string;
    [key: string]: any;
}
interface EzvizVideoLevel {
    name: string;
    level: number | 'auto';
    streamTypeIn: 1 | 2;
    type?: string;
    /** 标准流可以扩展 url 等数据 */
    [key: string]: any;
}
/**
 * 云录制录像信息查询参数 GET /api/service/cloudrecord/video/info/list
 * @see https://open.ys7.com/help/2043
 */
interface EzvizFetchCloudRecordRecParams {
    /** 访问令牌 */
    accessToken: string;
    /** 设备序列号 */
    deviceSerial: string;
    /** 通道号 */
    localIndex: number | string;
    /** 开始时间，格式 `YYYY-MM-DD HH:mm:ss`，不允许跨天， 内部会自动转化为 startTime */
    begin: string;
    /** 结束时间，格式 `YYYY-MM-DD HH:mm:ss`，不允许跨天， 内部会自动转化为 endTime */
    end: string;
    /** 云录制空间 ID，不传默认查询主空间 */
    spaceId?: number | string;
    [key: string]: any;
}
/**
 * 根据时间获取存储文件信息参数 POST /api/lapp/video/by/time（form-data）
 * @see https://open.ys7.com/help/1422
 */
interface EzvizFetchCloudRecParams {
    /** 访问令牌 */
    accessToken: string;
    /** 设备序列号 */
    deviceSerial: string;
    /** 通道号 */
    channelNo: number | string;
    /** 回放源，0-系统自动选择，1-云存储，2-本地录像，默认 0 */
    recType?: 0 | 1 | 2 | '0' | '1' | '2';
    /** 开始时间（毫秒时间戳）, 内部会自动转化为 startTime */
    begin: number | string;
    /** 结束时间（毫秒时间戳），内部会自动转化为 endTime */
    end: number | string;
    /** 接口版本，传 `2.0` 支持分页：返回 `{ files, isAll, nextFileTime }`，`isAll` 为 false 时以 `nextFileTime` 作为下一页的 `startTime` 继续查询；海外接口直接返回数组，不分页 */
    version?: string;
    [key: string]: any;
}
/**
 * 设备本地录像统一查询参数 GET /api/v3/device/local/video/unify/query
 * @see https://open.ys7.com/help/3922
 */
interface EzvizFetchLocalRecParams {
    /** 访问令牌 */
    accessToken: string;
    /** 设备序列号 */
    deviceSerial: string;
    /** 通道号，默认 1 */
    localIndex?: number | string;
    /** 开始时间（秒级时间戳），开始结束时间需在同一天, 内部会自动转化为 startTime */
    begin: number;
    /** 结束时间（秒级时间戳）, 内部会自动转化为 endTime */
    end: number;
    /** 每页个数，默认 200，最大 200；`hasMore` 为 true 时以 `nextFileTime` 作为下一页的 `startTime` 继续查询 */
    pageSize?: number;
    /** 主子码流， 仅本地回放支持 @since 3.2.0 */
    streamType?: 1 | 2;
    [key: string]: any;
}
/**
 * 获取播放地址参数 POST /api/lapp/v2/live/address/get（form-data）
 * @see https://open.ys7.com/help/1414
 *
 * 所有参数均可选，不传时默认取自当前播放地址 / 播放器配置
 */
interface EzvizFetchAddressParams {
    /** 访问令牌，默认取播放器配置的 accessToken */
    accessToken?: string;
    /** 设备序列号，默认取当前播放地址 */
    deviceSerial?: string;
    /** 通道号，默认取当前播放地址，缺省为 1 */
    channelNo?: number | string;
    /** 地址类型：1-预览，2-本地录像回放，3-云存储录像回放；默认按当前播放地址判断（回放地址未标注 rec 时按本地录像） */
    type?: 1 | 2 | 3 | '1' | '2' | '3';
    /** 流播放协议：1-ezopen，2-hls，3-rtmp，4-flv，5-ll-hls，默认 5 */
    protocol?: 1 | 2 | 3 | 4 | 5 | '1' | '2' | '3' | '4' | '5';
    /** 设备视频加密密码，默认取当前播放地址的 code */
    code?: string;
    /** 过期时长（秒），默认按当前播放地址的 expire 计算剩余时长 */
    expireTime?: number;
    /** 视频清晰度：1-高清（主码流），2-流畅（子码流） */
    quality?: 1 | 2 | '1' | '2';
    /** 回放开始时间，支持时间字符串和时间戳，默认取当前播放地址的 begin，内部会自动转化为 startTime（yyyy-MM-dd HH:mm:ss） */
    begin?: string | number;
    /** 回放结束时间，支持时间字符串和时间戳，默认取当前播放地址的 end，内部会自动转化为 stopTime（yyyy-MM-dd HH:mm:ss）；云存储开始结束时间必须在同一天 */
    end?: string | number;
    /** 是否支持 H265：1-支持，0-不支持，默认 1；传空串 `''` 表示不传该参数（由服务端按默认处理） */
    supportH265?: 0 | 1 | '0' | '1' | '';
    /** 回放倍速，默认取当前播放地址的 playbackSpeed；传空串 `''` 表示不传该参数 */
    playbackSpeed?: number | string;
    /** 是否静音：0-非静音，1-静音，默认取当前播放地址的 mute；传空串 `''` 表示不传该参数 */
    mute?: 0 | 1 | '0' | '1' | '';
    /** 国标设备通道编号 */
    gbchannel?: string;
    [key: string]: any;
}
/**
 * 获取播放地址接口返回
 * @see https://open.ys7.com/help/1414
 */
type EzvizFetchAddressResult = EzvizApiResponse<EzvizFetchAddressData>;
/**
 * 获取播放地址接口返回数据
 * @see https://open.ys7.com/help/1414
 */
interface EzvizFetchAddressData {
    /** 播放地址 ID */
    id?: string;
    /** 播放地址 */
    url: string;
    /** 地址过期时间 */
    expireTime: string;
}
/**
 * 获取 CDN 加速直播地址的参数
 * @since 3.2.0
 */
interface EzvizFetchCDNAddressParams {
    /** CDN 应用名（开放平台 CDN 加速配置的 appName），必填 */
    appName: string;
    /** 视频清晰度：1-高清（主码流，默认），2-流畅（子码流） */
    quality?: 1 | 2 | '1' | '2';
    /** 流名称，同一设备通道每次取流应不同；默认随机生成 32 位十六进制串 */
    streamName?: string;
}
/**
 * 获取 CDN 加速回放地址的参数
 * @since 3.2.0
 */
interface EzvizFetchCDNRecordAddressParams extends EzvizFetchCDNAddressParams {
    /** 录像类型：1-本地录像回放（默认），2-云存储录像回放 */
    type?: 1 | 2 | '1' | '2';
    /** 录制片段开始时间，支持时间字符串和时间戳，开始时间和结束时间跨度最多 7 天 */
    begin: string | number;
    /** 录制片段结束时间，支持时间字符串和时间戳；不能小于等于当前时间，必须在 30 天内 */
    end: string | number;
}
/**
 * CDN 加速地址接口返回数据
 * @since 3.2.0
 */
interface EzvizCDNAddressData {
    /** CDN 播放地址 */
    cdnUrl?: string;
    [key: string]: any;
}
/**
 * 直播间断流信息（仅萤石直播间地址，接口返回最新一次的中断原因，可能滞后）
 * @since 3.2.0
 */
interface EzvizStreamInterruptInfo {
    /** 中断错误码，可直接作为多语言 key 取文案 */
    intrCode?: string | number;
    [key: string]: any;
}
/**
 * 回放片段
 */
interface EzvizFetchRecItem {
    /** 片段开始时间 单位秒 */
    startTime: number;
    /** 片段结束时间 单位秒 */
    endTime: number;
    /** 存储版本，1-单文件，2-连续存储，仅在下载非云空间录像时填写 云端支持 */
    iStorageVersion?: number;
    /** 7 是云录制 云端支持 */
    busType?: number;
    /** 下载地址 云端支持 */
    downloadPath?: string;
    [key: string]: any;
}
/**
 * 取流机房地址（主机房 + 备用机房）
 */
interface EzopenBackupAddress {
    domain: string;
    port: number;
    /** 过期时间（毫秒时间戳），过期后重新以接口结果为准 */
    expire?: number;
}
/**
 * 备用地址接口原始返回；海外返回的域名字段为 addr，国内为 domain
 */
interface StreamAddressBackup {
    domain?: string;
    addr?: string;
    port: number;
    backups?: Array<Omit<StreamAddressBackup, 'backups'>>;
}
interface IQueryVoiceParams {
    voiceName?: string;
    pageStart?: number;
    pageSize?: number;
}

/**
 * Header/Footer 的父组件
 */
interface ComponentOptions {
    /** 挂载节点 player id, 默认挂载 body 上 */
    getPopupContainer?: () => HTMLElement;
    /** 自定义类名 */
    className?: string;
    /** 文字/图标默认颜色（兼容老版本和平台配置） */
    color?: string;
    /** 文字/图标激活态颜色（兼容老版本和平台配置） */
    activeColor?: string;
    /** 背景色，支持 Hex / rgb / rgba，会自动转换为渐变背景（兼容老版本和平台配置） */
    backgroundColor?: string;
    /** 组件类型， header 或 footer */
    cType: 'header' | 'footer';
}
/**
 * Header
 */
declare class Component {
    $container: HTMLDivElement;
    $popupContainer: HTMLElement;
    private readonly _options;
    private readonly _defaultClass;
    $left: HTMLDivElement;
    $right: HTMLDivElement;
    constructor(options?: Partial<ComponentOptions>);
    /**
     * 销毁 header
     */
    destroy(): void;
}

/**
 * Footer options
 */
type FooterOptions = ComponentOptions;
declare class Footer extends Component {
    constructor(options?: Partial<FooterOptions>);
}

/**
 * Header options
 */
type HeaderOptions = ComponentOptions;
declare class Header extends Component {
    constructor(options?: Partial<HeaderOptions>);
}

/**
 * 内容区域配置项
 */
interface ContentOptions {
    /** 获取容器 */
    getContainer: () => HTMLElement;
    scaleMode: ThemeOptions['scaleMode'];
}
/**
 * 截图控件
 * @category Content
 */
declare class Content extends EventEmitter {
    /**
     * 容器为了兼容放大、封面和视频渲染超出容器， 最外层容器($wrapper)设置 overflow: hidden;
     */
    $wrapper: HTMLDivElement;
    /** 渲染区域 */
    $content: HTMLDivElement;
    /** 渲染区域 */
    $video: HTMLDivElement;
    /** 配置项 */
    options: ContentOptions;
    private _scaleMode?;
    private _cleanUpResizeObserver;
    private _originWidth;
    private _originHeight;
    private _width;
    private _height;
    constructor(options: ContentOptions);
    /**
     * 重新画面区域
     * @param {number} originWidth 画面宽度
     * @param {number} originHeight 画面高度
     * @returns {void}
     */
    private rerender;
    setScaleMode(scaleMode?: ThemeOptions['scaleMode']): void;
    destroy(): void;
}

/**
 * 移动端扩展
 */
declare class MobileExtend extends EventEmitter {
    $container: HTMLElement;
    /**
     * 移动端扩展面板容器, 仅控件有面板的才会渲染在这里
     */
    $controlPanel: HTMLElement;
    /**
     * 移动端扩展控件容器
     */
    $header: HTMLElement;
    /**
     * 移动端扩展控件容器
     */
    $content: HTMLElement;
    $topLeft: HTMLElement;
    $topRight: HTMLElement;
    $top: HTMLElement;
    /**
     * 回放片段进度条容器，位于扩展区最上方（紧贴播放控件下方）
     */
    $segmentProgress: HTMLElement;
    private readonly _$siblingContainer;
    constructor($siblingContainer: HTMLElement);
    render(): void;
    destroy(): void;
}

interface RecFooterOptions {
    hasDatePicker?: boolean;
    hasTimePicker?: boolean;
}
declare class RecFooter extends EventEmitter {
    $container: HTMLElement;
    $popupContainer: HTMLElement;
    $timeLineContainer: HTMLElement;
    $rightContainer: HTMLElement;
    $datePickerContainer: HTMLElement;
    $timePickerContainer: HTMLElement;
    options: RecFooterOptions;
    constructor(container: HTMLElement, options?: RecFooterOptions);
    destroy(): void;
}

/**
 * 更多控件配置项
 */
interface MoreOptions extends Omit<ControlOptions, 'tagName'> {
    /**
     * 弹出位置, 默认右上角 'tr'  'br' 右下角
     */
    placement?: 'tr' | 'br';
    /** 打开状态 */
    open?: boolean;
    /**
     * 弹出位置偏移量
     */
    offset?: [number, number];
    /**
     * 弹出容器自定义类名
     */
    wrapClassName?: string;
    /**
     * 打开状态变化回调
     * @param open 状态
     */
    onOpenChange?: (open: boolean) => void;
}
/**
 * 更多控件
 * @category Control
 */
declare class More extends Control {
    private readonly options;
    picker: Picker;
    $panel: HTMLDivElement;
    list: Array<{
        key: string;
        part: 'left' | 'right';
        control: Control;
        width: number;
        height: number;
    }>;
    constructor(options: MoreOptions);
    private _render;
    /**
     * 添加
     * @param control
     */
    add(key: string, part: 'left' | 'right', control: Control, props: {
        width: number;
        height: number;
    }): void;
    /**
     * 移除
     * @param control
     */
    remove(control: Control): void;
    destroy(): void;
    /**
     * 点击 Control 会触发
     */
    protected _onControlClick(e: Event): void;
}

type IMouseFunc = (e?: MouseEvent | TouchEvent | PointerEvent) => void;
type ICleanupFunc = () => void;
/**
 * 监听鼠标移动返回结果
 */
interface InteractiveHFResult {
    cleanup: ICleanupFunc;
    clearTimeout: ((e?: MouseEvent | TouchEvent) => void) | null;
    setTimeoutShow: IMouseFunc;
    hide: IMouseFunc;
}

declare class Services {
    deviceCapacity: Record<string, EzvizDeviceCapacity>;
    deviceInfo: Record<string, EzvizDeviceInfo>;
    videoLevelList: Record<string, EzvizVideoLevel[]>;
    /** 取流机房地址（主机房在第一个），按设备通道缓存 */
    streamAddressList: Record<string, EzopenBackupAddress[]>;
    private _options;
    private _controllers;
    /** 在途的模板请求，新请求发起前中止上一个 */
    private _templateAbortController;
    private _url;
    private get url();
    private set url(value);
    get urlInfo(): Partial<_ezuikit_utils_tools.EzopenURL>;
    /**
     * @param {ServicesOptions} options
     */
    constructor(options: ServicesOptions);
    /**
     * @param {ServicesOptions} options 配置
     */
    updateOptions(options: Partial<ServicesOptions>): void;
    /**
     * @description fetch请求
     * @param {string} url  请求地址
     * @param {RequestInit} options  请求参数
     * @private
     */
    _fetch(url: string, options?: RequestInit): Promise<Response>;
    /**
     * @description get请求
     * @param {string} url 请求地址
     */
    get(url: string, options?: {}): Promise<Response>;
    /**
     * @description post请求
     * @param {string} url 请求地址
     */
    post(url: string, options?: {}): Promise<Response>;
    /**
     * @description pust请求
     * @param {string} url 请求地址
     */
    put(url: string, options?: {}): Promise<Response>;
    /**
     * @description delete请求
     * @param {string} url 请求地址
     */
    delete(url: string, options?: {}): Promise<Response>;
    /**
     * 获取开放平台轻应用模板数据
     * @param id 开放平台轻应用模板id （https://open.ys7.com/console/ezuikit/template.html）
     * @returns
     */
    getThemeDataByTemplate(id: string): Promise<IThemeData>;
    /**
     * @description 获取设备能力集 https://open.ys7.com/help/678
     * @returns {Promise<EzvizDeviceCapacity>}
     *
     * 9.0.14 (OPOOL-11457): 在飞 Promise 去重
     *   - 同一时刻多个 caller (getEzopenUrl 前置 await + _deviceSerialChangeServices) 复用同一次 HTTP
     *   - 请求结束（无论成功失败）后清空缓存，允许后续新一轮调用重新发起
     *   - 成功后自动把结果回填到 this._options.deviceCapacity，供 ECDH 判定复用
     */
    getDeviceCapacity(): Promise<EzvizDeviceCapacity>;
    /** 在飞的能力集请求，key 同 {@link getKeyName} */
    private readonly _capacityPromises;
    private _fetchDeviceCapacity;
    /**
     * @description 获取设备信息 https://open.ys7.com/help/672
     */
    getDeviceInfo(): Promise<EzvizDeviceInfo>;
    /**
     * @description 获取设备清晰度列表接口
     * @returns {Promise<Array<EzvizVideoLevel>>}
     */
    getDeviceSupportQuality(): Promise<EzvizVideoLevel[]>;
    /**
     * @description 镜像翻转 https://open.ys7.com/help/681
     * @param {number} command 镜像方向：0-上下, 1-左右, 2-中心 , 和设备报备的能力集有关，即使设备支持，但是没有报备也一样不支持
     * @returns 不等待接口结果，始终 resolve undefined
     */
    postDevicePtzMirror(command: 0 | 1 | 2): Promise<void>;
    /**
     * 按月查询录像日历 （本地存储、云存储和云录制）
     * - 本地存储 / 云存储 https://open.ys7.com/help/4329
     * - 云录制 https://open.ys7.com/help/2042
     * @param recType 录像类型 -1 云录制 1-云存储，2-本地录像，3-关联录像
     * @param month 查询的月份，时间格式为：yyyy-MM
     * @param spaceId 云录制空间的 spaceId， 仅云录制需要
     * @returns 有录像的日期列表，如 `["2025-08-14", "2025-08-16"]`（云录制为接口原始 data）；失败时为 `[]`
     */
    getRecordMonth(recType: -1 | 1 | 2 | 3, month: string, spaceId?: string | number): Promise<string[]>;
    /**
     * 按月查询录像日历(本地存储和云存储)
     *
     * 录像日历查询 {@link https://open.ys7.com/help/4329}
     * @param recType 回放源，0-云存储和本地录像，1-云存储，2-本地录像，3-关联录像
     * @param queryMonth 查询的月份，时间格式为：yyyy-MM
     * @returns
     */
    private _getSdkCloudMonth;
    /**
     * 按月查询云录制日历查询接口 https://open.ys7.com/help/2042
     * @param spaceId 空间id,不填默认查询主空间下录像日历
     * @param month 查询的月份，时间格式为：yyyyMM / yyyy-MM / yyyy-MM
     * @returns
     */
    private _getCloudRecordMonth;
    /**
     * 获取appkey 用来上报
     * @returns 接口原始返回 `{ meta, data: { appKey } }`；请求失败时为空串
     */
    getAppKey(): Promise<EzvizMetaResponse<EzvizAppKeyData> | ''>;
    /**
     * @description 获取指定设备的通道信息 https://open.ys7.com/help/1478
     * @returns 通道列表；失败时为 `[]`
     */
    getDeviceList(): Promise<EzvizCameraInfo[]>;
    /**
     * @description 设置设备视频质量（清晰度）接口 https://open.ys7.com/help/2286
     * @param {string | number} videoLevel 设备视频清晰度等级 0-流畅 1-均衡 2-高清 3-超清 4-极清 5-3K 6-4K
     * @param {string=} clientLid 直播取流会话标识（无缝切换用，9.0.22 OPOOL-12269）。
     *   传入时服务端据此定位当前推流通道，在同一条流上完成切档（不断流）；
     *   不传则走旧逻辑（仅下发切档指令到设备），保持对老版本服务端与回放场景的兼容。
     * @param {number | string=} prevVideoLevel 切换前清晰度，用于计算 adaptive 方向（升/降/保持）
     * @returns 接口原始返回；videoLevel 小于 0 时不发请求，返回 `{}`
     */
    setVideoLevel(videoLevel: number | string, clientLid?: string, prevVideoLevel?: number | string): Promise<EzvizMetaResponse & EzvizApiResponse>;
    /**
     * 查询设备云存储信息 https://open.ys7.com/help/1404
     * @returns 当前通道的云存储信息（接口 data 的第一项）；接口失败或无数据时为 `{}`
     */
    getCloudInfo(): Promise<EzvizCloudInfo>;
    /**
     * @description 获取云录制截图上传地址
     * @param fileName 截图文件名
     * @returns 接口原始返回 `{ meta, data }`
     */
    getCloudUploadUrl(fileName: string): Promise<EzvizMetaResponse>;
    /**
     * @description 获取服务备用地址接口
     *
     * 机房地址按设备通道缓存在 {@link streamAddressList}，12 小时过期；
     * 接口返回的机房集合与缓存不一致、或缓存已过期时，以接口结果为准。
     *
     * @returns `[地址个数, 接口原始 data, 归一化后的地址列表（主机房在第一个）]`；
     *   接口非 200 时**不给第三位**，调用方保持已有列表不动，避免一次接口抖动把备用地址清空
     */
    getStreamAddressList(): Promise<[number, Partial<StreamAddressBackup>, EzopenBackupAddress[]?]>;
    /**
     * @description 获取播放地址接口（私有协议 ezopen 换 wss 取流地址）
     * @returns {string | Object} wss 取流地址；接口返回错误码时原样返回接口结果，请求失败返回空串
     * FIXME: 服务端接口有问题  预览 和 本地回放、 云存储 、云录制 同等条件下返回不一样， 海外和国内也是
     */
    getEzopenUrl(url?: string): Promise<string | EzvizApiResponse>;
    /**
     * @description 获取云录制片段接口 (云录制返回的时间不需要转时区) https://open.ys7.com/help/2043
     * @param {EzvizFetchCloudRecordRecParams} body 开始时间和结束时间 支持 时间字符串和时间戳 和 存储空间ID
     * ezopen://open.ys7.com/BC7799091/1.cloud.rec?begin=20250401000000&busType=7&spaceId=21536
     * @returns {Promise<EzvizFetchRecItem[]>}
     */
    getCloudRecordTimes(body: EzvizFetchCloudRecordRecParams): Promise<EzvizFetchRecItem[]>;
    /**
     * @description 获取云存储片段接口 (已处理时区问题) https://open.ys7.com/help/1422
     * ezopen://open.ys7.com/BD3664803/1.cloud.rec?begin=20250430050000
     * @param {EzvizFetchCloudRecParams} body 开始时间和结束时间 支持 时间字符串和时间戳
     * @returns {Promise<EzvizFetchRecItem[]>} (已处理时区问题)
     */
    getCloudTimes(body: EzvizFetchCloudRecParams): Promise<EzvizFetchRecItem[]>;
    /**
     * @description 获取查询设备本地录像 (开始结束时间必须在同一天, 有时区问题) https://open.ys7.com/help/3922
     * @param {EzvizFetchLocalRecParams | EzvizFetchCloudRecParams} params 开始时间和结束时间 支持 时间字符串和时间戳
     * @returns {EzvizFetchRecItem[]} (已处理时区问题)
     */
    getLocalRecTimes(params: EzvizFetchLocalRecParams | EzvizFetchCloudRecParams): Promise<EzvizFetchRecItem[]>;
    /**
     * @description 查询默认语音列表
     * @link https://open.ys7.com/help/1247
     * @param {Object} params 查询参数
     * @param {string} params.voiceName 模糊匹配语音名称（可选）
     * @param {number} params.pageStart 分页起始页，从0开始（可选）
     * @param {number} params.pageSize 分页大小，默认为10，最大为50（可选）
     * @returns `{ data, page }`；非 base 版本或接口失败时为空列表
     */
    queryVoiceList(params?: IQueryVoiceParams): Promise<EzvizPageList<EzvizVoiceItem>>;
    /**
     * @description 临时语音下发（一次性自定义语音下发到设备，不保存到语音列表）
     * @link https://open.ys7.com/help/1252
     * @param {File | Blob} voiceFile 语音文件，支持wav、mp3、aac格式，最大20M，最长60s
     * @param {number} channelNo 通道号，默认取播放地址里的通道号（可选）
     * @returns 接口原始返回 `{ code, msg }`；非 base 版本为 `{}`，请求失败为 `{ code: '500', msg, error }`
     * @description 需要设备支持能力集 support_talk=1或3
     */
    sendVoiceOnce(voiceFile: File | Blob, channelNo?: number): Promise<EzvizApiResponse>;
    /**
     * @description 语音文件下发（指定设备播放已上传的语音文件）
     * @link https://open.ys7.com/help/1253
     * @param {string} fileUrl 下载音频文件的url（从查询接口返回的url）
     * @param {number} channelNo 通道号，默认取播放地址里的通道号（可选）
     * @returns 接口原始返回 `{ code, msg }`；非 base 版本为 `{}`，请求失败为 `{ code: '500', msg, error }`
     * @description 需要设备支持能力集 support_talk=1或3
     */
    sendVoice(fileUrl: string, channelNo?: number): Promise<EzvizApiResponse>;
    /**
     * @description 按设备获取告警消息列表 https://open.ys7.com/help/987
     * @param params.startTime 告警查询开始时间（毫秒时间戳），默认今日0点
     * @param params.endTime 告警查询结束时间（毫秒时间戳），默认当前时间
     * @param params.pageStart 分页起始页，从0开始
     * @param params.pageSize 分页大小，默认20，最大50
     * @param params.status 告警状态：2-所有，1-已读，0-未读，默认2
     * @param params.alarmType 告警类型，默认-1（全部）
     * @returns `{ data, page }`；非 base 版本为空列表；接口非 200 时 reject 接口原始结果
     */
    getAlarmList(params?: {
        startTime?: number;
        endTime?: number;
        pageStart?: number;
        pageSize?: number;
        status?: number;
        alarmType?: number;
    }): Promise<EzvizPageList<EzvizAlarmItem>>;
    /**
     * @description 即时云抓拍(设备抓拍图片,支持生命周期) https://open.ys7.com/help/5235
     * 接口依据:《云抓拍接口.md》 POST /api/service/open/capture/device/capture (form)
     * @param params.resultSpaceId 抓图业务存储空间 id(由空间列表查询接口获取,必填)
     * @param params.quality 视频清晰度:0-流畅,1-高清(720P),2-FCIF,3-1080P,4-400w(可选)
     * @param params.channelNo 通道号,默认取播放地址里的通道号
     * @returns 接口原始返回 `{ meta, data: { picUrl, fileNodeId } }`
     */
    captureSave(params: {
        resultSpaceId: number | string;
        quality?: number | string;
        channelNo?: number | string;
    }): Promise<EzvizMetaResponse<EzvizCaptureSaveData>>;
    /**
     * @description 创建抓图任务(批量/定时抓拍计划),返回 taskId https://open.ys7.com/help/1390
     * 接口依据:《创建云抓拍计划接口.md》 POST /api/service/cloudrecord/pic/capture/task
     * header:accessToken/deviceSerial/localIndex;body:application/x-www-form-urlencoded
     * @param params.resultSpaceId 云抓拍业务空间 id(由空间列表查询接口获取,必填)
     * @param params.captureType 抓图模式:1 按时间点 / 2 按时间间隔(必填)
     * @param params.captureInterval 时间间隔(秒),captureType=2 必填
     * @param params.timingPoints 时间点列表 yyyyMMddHHmmss,英文逗号分隔,captureType=1 必填
     * @param params.startTime 开始时间 yyyyMMddHHmmss,captureType=2 必填
     * @param params.endTime 结束时间 yyyyMMddHHmmss,captureType=2 必填
     * @param params.frameSwitch 抽帧补偿开关,默认 false
     * @param params.filePrefix 文件 id 前缀
     * @param params.validateCode 视频解密密钥(加密设备必填)
     * @returns 接口原始返回 `{ meta, data: { taskId } }`
     */
    createCaptureTask(params: {
        resultSpaceId: number | string;
        captureType: 1 | 2;
        captureInterval?: number;
        timingPoints?: string;
        startTime?: string;
        endTime?: string;
        frameSwitch?: boolean;
        filePrefix?: string;
        validateCode?: string;
    }): Promise<EzvizMetaResponse<EzvizCaptureTaskData>>;
    /**
     * @description 查询存储空间列表(默认查询云抓拍 cloudCapture 空间),用于获取 resultSpaceId https://open.ys7.com/help/5230
     * 接口依据:《查询空间列表.md》 GET /api/service/open/storage/engine/space/listById
     * header:accessToken;query:startTime/endTime(必填,30天内)/lastSpaceId/pageSize/bizTypeList
     * @param params.startTime 查询开始时间 yyyy-MM-dd HH:mm:ss,默认近 30 天
     * @param params.endTime 查询结束时间 yyyy-MM-dd HH:mm:ss,默认当前时间
     * @param params.lastSpaceId 上一页最后空间 id,用于翻页
     * @param params.pageSize 分页大小,默认 10,范围 1-50
     * @param params.bizTypeList 存储空间类型,默认 cloudCapture
     * @returns 接口原始返回 `{ meta, data: { result, lastId, pageSize, hasNext } }`
     */
    getSpaceList(params?: {
        startTime?: string;
        endTime?: string;
        lastSpaceId?: number | string;
        pageSize?: number;
        bizTypeList?: string;
    }): Promise<EzvizMetaResponse<EzvizSpaceListData>>;
    /**
     * 获取播放地址 https://open.ys7.com/help/1414
     * @remarks
     * 所有参数均可选，不传时默认取自当前播放地址 / 播放器配置，默认生成标准流 LL-HLS（protocol=5）地址
     *
     * @warning 每次生成的地址实效不做变更，即第一次传入的地址是时效是多久， 新生成的地址也是一样的时效（不过是从当前时间开始计算）
     *
     * @param params 请求参数，见 {@link EzvizFetchAddressParams}
     * @returns 接口原始返回 `{ code, msg, data: { id, url, expireTime } }`；响应体解析失败时返回 undefined
     * @throws 请求失败（非 2xx）时抛错
     * @example
     * ```typescript
     * const res = await services.getAddress({ begin: '20260804000000', end: '20260804235959', playbackSpeed: 2 });
     * ```
     */
    getAddress(params?: EzvizFetchAddressParams): Promise<EzvizFetchAddressResult | undefined>;
    /**
     * 获取 CDN 加速直播地址（地址有效期为当天 00:00:00 - 23:59:59）
     * @param params 请求参数，见 {@link EzvizFetchCDNAddressParams}
     * @returns 接口原始返回 `{ meta, data: { cdnUrl } }`
     * @since 3.2.0
     */
    getCDNLiveAddress(params: EzvizFetchCDNAddressParams): Promise<EzvizMetaResponse<EzvizCDNAddressData>>;
    /**
     * 获取 CDN 加速回放地址（地址有效期为当天 00:00:00 - 23:59:59）
     * @param params 请求参数，见 {@link EzvizFetchCDNRecordAddressParams}
     * @returns 接口原始返回 `{ meta, data: { cdnUrl } }`
     * @since 3.2.0
     */
    getCDNRecordAddress(params: EzvizFetchCDNRecordAddressParams): Promise<EzvizMetaResponse<EzvizCDNAddressData>>;
    /**
     * 查询直播间断流信息（仅萤石直播间地址，地址里的 `sid` 即直播间流 ID）
     * @param streamId 直播间流 ID
     * @returns 接口原始返回 `{ meta, data: { intrCode } }`，`intrCode` 可作为多语言 key 取中断原因文案
     * @since 3.2.0
     */
    getStreamInterruptInfo(streamId: string): Promise<EzvizMetaResponse<EzvizStreamInterruptInfo>>;
    /** CDN 加速地址的公共请求：有效期固定为当天，播放协议固定为 2 */
    private _getCDNAddress;
    /** 时区偏移（小时），优先读取播放地址的 timeZone 参数，其次是配置项 timeZone；中国以外的地区设备才有 */
    private get timeZone();
    /** 时间字符串 / 时间戳 转秒级时间戳 */
    private _toSeconds;
    /** 把首尾片段裁剪到查询区间内（片段会跨天） */
    private _clampTimes;
    /**
     * 按时间查询录像片段（/api/lapp/video/by/time），自动翻页，已处理时区
     * @param recType 1-云存储，2-本地录像
     */
    private _getVideoByTime;
    get getKeyName(): string;
    abortAll(): void;
    destroy(): void;
}

/**
 * 业务事件来源：`'http'` 接口请求成功、`'httpError'` 接口请求失败、`'api'` 对外 api 调用、
 * `'stream'` / `'streamError'` 取流、`'message'` 提示消息
 */
type BuilderEventType = 'http' | 'httpError' | 'api' | 'stream' | 'streamError' | 'message';

/**
 * 云抓拍相关 API 编排（迁移自 ezuikit-js `ezopen/api/_cloudCapture.ts`，原 @since 9.0.9）
 *
 * - 即时云抓拍:POST /api/service/open/capture/device/capture(服务端字段 resultSpaceId)
 * - 创建抓拍计划:POST /api/service/cloudrecord/pic/capture/task(服务端字段 resultSpaceId)
 * - 空间列表查询:GET /api/service/open/storage/engine/space/listById
 *
 * 对外统一以 `spaceId` 表达"萤石云存储空间 id"概念,与云录制的 `spaceId` 共用同一个实例字段
 * （`theme.spaceId`，即 `options.spaceId`）；到 services 层时再映射成服务端协议字段 resultSpaceId。
 *
 * 接口请求走 `theme.xxxService()`：请求结果统一派发 `EVENTS.http.*` 事件，请求异常时返回 undefined（不抛错）。
 *
 * @since 3.2.0
 */

/** 统一返回结构 */
interface CloudCaptureResult<T = any> {
    /** 0 成功;非 0 失败(透传服务端 meta.code 或 -1) */
    code: number;
    /** 成功数据 */
    data?: T;
    /** 错误信息 */
    msg?: string;
}
/** 即时云抓拍入参 */
interface CaptureCameraOptions {
    /** 抓图存储空间 id(由空间列表查询接口获取);不传则取实例 spaceId(调用 > 实例) */
    spaceId?: number | string;
    /** 视频清晰度:0-流畅,1-高清(720P),2-FCIF,3-1080P,4-400w；不传则取初始化参数 quality */
    quality?: number | string;
    /** 通道号,默认取实例通道号 */
    channelNo?: number | string;
}
/** 即时云抓拍返回数据 */
type CaptureCameraData = EzvizCaptureSaveData;
/** 创建抓拍计划任务入参 */
interface CreateCaptureTaskOptions {
    /** 云抓拍业务空间 id;不传则取实例 spaceId(调用 > 实例) */
    spaceId?: number | string;
    /** 抓图模式:1 按时间点 / 2 按时间间隔 */
    captureType: 1 | 2;
    /** 时间点列表 yyyyMMddHHmmss,英文逗号分隔,captureType=1 必填 */
    timingPoints?: string;
    /** 时间间隔(秒),captureType=2 必填 */
    captureInterval?: number;
    /** 开始时间 yyyyMMddHHmmss,captureType=2 必填 */
    startTime?: string;
    /** 结束时间 yyyyMMddHHmmss,captureType=2 必填 */
    endTime?: string;
    /** 抽帧补偿开关,默认 false */
    frameSwitch?: boolean;
    /** 文件 id 前缀 */
    filePrefix?: string;
    /** 视频解密密钥(加密设备必填) */
    validateCode?: string;
}
/** 空间信息(空间列表查询接口返回项) */
type SpaceInfo = EzvizSpaceInfo;
/** 空间列表查询入参 */
interface GetSpaceListOptions {
    /** 查询开始时间 yyyy-MM-dd HH:mm:ss,基于 createTime 筛选;不传默认近 30 天 */
    startTime?: string;
    /** 查询结束时间 yyyy-MM-dd HH:mm:ss,与开始时间需在 30 天内;不传默认当前时间 */
    endTime?: string;
    /** 上一页最后空间 id,用于翻页 */
    lastSpaceId?: number | string;
    /** 分页大小,默认 10,范围 1-50 */
    pageSize?: number;
    /** 存储空间类型,默认查询云抓拍 cloudCapture。可选:vod/record/cloudCapture/capture */
    bizTypeList?: string;
}
/** 空间列表查询返回数据 */
type SpaceListData = EzvizSpaceListData;

/**
 * 播放器主题
 * @class Theme
 * @category Theme
 * @remarks
 * 萤石播放器主题，主要用于播放器的 UI 展示和交互，支持 flv, hls, mp4, ezopen 等流类型。
 * 提供了丰富的控件和配置选项，支持多语言和自定义样式。
 *
 * @example
 * ```ts
 * // import css file
 * import "@ezuikit/player-theme/dist/style.js"
 * import Theme from '@ezuikit/player-theme';
 *
 * // class Player extends Theme {}
 *
 * const theme = new Theme({
 *  container: () => document.querySelector('.player'),
 *  type: 'flv',
 * });
 * ```
 *
 * ```html
 * <!-- html script, static in `@ezuikit/player-theme/dist` -->
 * <link rel="stylesheet" href="./assets/@ezuikit/player-theme/dist/style.css" />
 * <script src="./assets/@ezuikit/player-theme/dist/index.umd.js"></script>
 * <script>
 *  const theme = new Theme({
 *      container: () => document.querySelector('.player'),
 *      type: 'flv',
 *  });
 * </script>
 * ```
 */
declare class Theme extends EventEmitter {
    /** 所有私有流的模板 @since 0.0.1 */
    static TEMPLATES: {
        readonly pcLive: IThemeData;
        readonly pcRec: IThemeData;
        readonly mobileLive: IThemeData;
        readonly mobileRec: IThemeData;
        readonly security: IThemeData;
        readonly voice: IThemeData;
    };
    /** 事件名称 @since 0.0.1 */
    static EVENTS: {
        readonly loading: "loading";
        readonly play: "play";
        readonly capturePicture: "capturePicture";
        readonly volumechange: "volumechange";
        readonly zoomChange: "zoomChange";
        readonly zoomingChange: "zoomingChange";
        readonly zoomTranslateChange: "zoomTranslateChange";
        readonly audioInfo: "audioInfo";
        readonly videoInfo: "videoInfo";
        readonly firstFrameDisplay: "firstFrameDisplay";
        readonly fullscreen: "fullscreen";
        readonly exitFullscreen: "exitFullscreen";
        readonly fullscreenChange: "fullscreenChange";
        readonly resize: "resize";
        readonly orientationChange: "orientationChange";
        readonly audioCodecUnsupported: "audioCodecUnsupported";
        readonly changeTheme: "changeTheme";
        readonly recTypeChange: "recTypeChange";
        readonly playTypeChange: "playTypeChange"; /** 正在兜底的原始 scope，非 null 表示处于兜底取值中（用于避免 customizeMissing 无限递归） */
        readonly definitionChange: "definitionChange";
        readonly speedChange: "speedChange";
        readonly streamTypeChange: "streamTypeChange";
        readonly supportLocalRecordStreamType: "supportLocalRecordStreamType";
        readonly recordingChange: "recordingChange";
        readonly talkingChange: "talkingChange";
        readonly talkVolumeChange: "talkVolumeChange";
        readonly broadcastPanelChange: "broadcastPanelChange";
        readonly aichatChange: "aichatChange";
        readonly liveChange: "liveChange";
        readonly recDropdownChange: "recDropdownChange";
        readonly recListChange: "recListChange";
        readonly alarmMessageChange: "alarmMessageChange";
        readonly setLoggerOptions: "setLoggerOptions";
        readonly records: "records";
        readonly ptzSpeedChange: "ptzSpeedChange";
        readonly setVideoLevelList: "setVideoLevelList";
        readonly currentVideoLevel: "currentVideoLevel";
        readonly currentVideoLevelAuto: "currentVideoLevelAuto";
        readonly setAllDayRecTimes: "setAllDayRecTimes";
        readonly getOSDTime: "getOSDTime";
        readonly playbackEnd: "playbackEnd";
        readonly control: {
            readonly play: "Control.play";
            readonly playDestroy: "Control.playDestroy";
            readonly capturePicture: "Control.capturePicture";
            readonly capturePictureResult: "Control.capturePictureResult";
            readonly capturePictureDestroy: "Control.capturePictureDestroy";
            readonly volumechange: "Control.volumechange";
            readonly volumePanelOpenChange: "Control.volumePanelOpenChange";
            readonly volumeDestroy: "Control.volumeDestroy";
            readonly controlsBarOpenChange: "Control.controlsBarOpenChange";
            readonly headerMoreShowControlsChange: "Control.headerMoreShowControlsChange";
            readonly headerMorePanelOpenChange: "Control.headerMorePanelOpenChange";
            readonly footerMoreShowControlsChange: "Control.footerMoreShowControlsChange";
            readonly footerMorePanelOpenChange: "Control.footerMorePanelOpenChange";
            readonly deviceDestroy: "Control.deviceDestroy";
            readonly recTypeChange: "Control.recTypeChange";
            readonly recDestroy: "Control.recDestroy";
            readonly definitionChange: "Control.definitionChange";
            readonly definitionList: "Control.definitionList";
            readonly definitionPanelOpenChange: "Control.definitionPanelOpenChange";
            readonly definitionDestroy: "Control.definitionDestroy";
            readonly speedChange: "Control.speedChange";
            readonly speedPanelOpenChange: "Control.speedPanelOpenChange";
            readonly speedDestroy: "Control.speedDestroy";
            readonly streamTypeChange: "Control.streamTypeChange";
            readonly streamTypePanelOpenChange: "Control.streamTypePanelOpenChange";
            readonly streamTypeDestroy: "Control.streamTypeDestroy";
            readonly ptzPanelOpenChange: "Control.ptzPanelOpenChange";
            readonly ptzSpeedChange: "Control.ptzSpeedChange";
            readonly ptzError: "Control.ptzError";
            readonly ptzDestroy: "Control.ptzDestroy";
            readonly recordingChange: "Control.recordingChange";
            readonly recordDestroy: "Control.recordDestroy";
            readonly talkingChange: "Control.talkingChange";
            readonly talkError: "Control.talkError";
            readonly talkDestroy: "Control.talkDestroy";
            readonly broadcastPanelChange: "Control.broadcastPanelChange";
            readonly broadcastDestroy: "Control.broadcastDestroy";
            readonly broadcastVoiceListChange: "Control.broadcastVoiceListChange";
            readonly broadcastApiResult: "Control.broadcastApiResult";
            readonly broadcastVoiceRecorded: "Control.broadcastVoiceRecorded";
            readonly broadcastRecordStart: "Control.broadcastRecordStart";
            readonly broadcastRecordStop: "Control.broadcastRecordStop";
            readonly broadcastRecordComplete: "Control.broadcastRecordComplete";
            readonly aichatChange: "Control.aichatChange";
            readonly aichatDestroy: "Control.aichatDestroy";
            readonly liveChange: "Control.liveChange";
            readonly liveDestroy: "Control.liveDestroy";
            readonly recDropdownChange: "Control.recDropdownChange";
            readonly recDropdownDestroy: "Control.recDropdownDestroy";
            readonly recListChange: "Control.recListChange";
            readonly recListCardClick: "Control.recListCardClick";
            readonly recListDestroy: "Control.recListDestroy";
            readonly alarmMessageChange: "Control.alarmMessageChange";
            readonly alarmMessageDestroy: "Control.alarmMessageDestroy";
            readonly zoomChange: "Control.zoomChange";
            readonly zoomPanelOpenChange: "Control.zoomPanelOpenChange";
            readonly zoomDestroy: "Control.zoomDestroy";
            readonly fullscreenDestroy: "Control.fullscreenDestroy";
            readonly globalFullscreenDestroy: "Control.globalFullscreenDestroy";
            readonly datePanelOpenChange: "Control.datePanelOpenChange";
            readonly dateChange: "Control.dateChange";
            readonly dateMonthChange: "Control.dateMonthChange";
            readonly datePanelMonthChange: "Control.datePanelMonthChange";
            readonly datePanelYearChange: "Control.datePanelYearChange"; /**
             * 当前播放类型，由播放地址解析得出
             *
             * 取值 `'live' | 'rec' | 'cloudRec' | 'cloudRecord'`，无法判定时为空字符串 `''`。
             *
             * 与 {@link recType} 的关系：`recType` 只覆盖三种回放，直播时为空串；
             * 本 getter 把直播也纳入同一个枚举，作为「当前播放类型」的统一出口。
             *
             * @remarks 空串表示无法从地址判定（如 rtmp、webrtc、地址未设置）。
             * 此时控件支持性校验会整体跳过，避免对判不出类型的地址误报。
             * @since 3.1.7
             * ```ts
             * theme.playType // 'cloudRec'
             * ```
             */
            readonly dateDestroy: "Control.dateDestroy";
            readonly timePanelOpenChange: "Control.timePanelOpenChange";
            readonly timeChange: "Control.timeChange";
            readonly timeLineChange: "Control.timeLineChange";
            readonly timeLinePanelOpenChange: "Control.timeLinePanelOpenChange";
            readonly timeLineDestroy: "Control.timeLineDestroy";
            readonly unsupportedPlayType: "Control.unsupportedPlayType";
            readonly beforeMountControls: "Control.beforeMountControls";
            readonly mountedControls: "Control.mountedControls";
            readonly beforeUnmountControls: "Control.beforeUnmountControls"; /** 萤石直播 */
            readonly unmountedControls: "Control.unmountedControls";
            readonly posterDestroy: "Control.posterDestroy";
            readonly loadingDestroy: "Control.loadingDestroy";
            readonly messageDestroy: "Control.messageDestroy";
            readonly contentDestroy: "Control.contentDestroy";
            readonly contentRerender: "Control.contentRerender";
            readonly playControlInit: "Control.playControlInit";
            readonly volumeControlInit: "Control.volumeControlInit";
            readonly deviceControlInit: "Control.deviceControlInit";
            readonly capturePictureControlInit: "Control.capturePictureControlInit";
            readonly ptzControlInit: "Control.ptzControlInit";
            readonly recordControlInit: "Control.recordControlInit";
            readonly talkControlInit: "Control.talkControlInit";
            readonly broadcastControlInit: "Control.broadcastControlInit";
            readonly aiChatControlInit: "Control.aiChatControlInit";
            readonly liveControlInit: "Control.liveControlInit";
            readonly recDropdownControlInit: "Control.recDropdownControlInit";
            readonly recListControlInit: "Control.recListControlInit";
            readonly alarmMessageControlInit: "Control.alarmMessageControlInit";
            readonly zoomControlInit: "Control.zoomControlInit";
            readonly definitionControlInit: "Control.definitionControlInit";
            readonly fullscreenControlInit: "Control.fullscreenControlInit";
            readonly globalFullscreenControlInit: "Control.globalFullscreenControlInit";
            readonly recControlInit: "Control.recControlInit";
            readonly speedControlInit: "Control.speedControlInit";
            readonly streamTypeControlInit: "Control.streamTypeControlInit";
            readonly dateControlInit: "Control.dateControlInit";
            readonly timeControlInit: "Control.timeControlInit";
            readonly timeLineControlInit: "Control.timeLineControlInit";
            readonly segmentProgressControlInit: "Control.segmentProgressControlInit";
        };
        readonly theme: {
            readonly beforeDestroy: "Theme.beforeDestroy";
            readonly destroyed: "Theme.destroyed";
            readonly mobileExtendDestroy: "Theme.mobileExtendDestroy";
            readonly recFooterDestroy: "Theme.recFooterDestroy";
        };
        readonly message: "message";
        readonly http: {
            readonly getDeviceCapacity: "getDeviceCapacity";
            readonly getDeviceInfo: "getDeviceInfo";
            readonly getDeviceSupportQuality: "getDeviceSupportQuality";
            readonly getEzopenUrl: "getEzopenUrl";
            readonly queryVoiceList: "queryVoiceList";
            readonly sendVoiceOnce: "sendVoiceOnce";
            readonly sendVoice: "sendVoice";
            readonly postDevicePtzMirror: "postDevicePtzMirror";
            readonly getRecordMonth: "getRecordMonth";
            readonly getAppKey: "getAppKey";
            readonly getDeviceList: "getDeviceList";
            readonly setVideoLevel: "setVideoLevel";
            readonly getCloudInfo: "getCloudInfo";
            readonly getCloudUploadUrl: "getCloudUploadUrl";
            readonly getStreamAddressList: "getStreamAddressList";
            readonly getCloudRecordTimes: "getCloudRecordTimes";
            readonly getCloudTimes: "getCloudTimes";
            readonly getLocalRecTimes: "getLocalRecTimes";
            readonly getAlarmList: "getAlarmList";
            readonly captureSave: "captureSave";
            readonly createCaptureTask: "createCaptureTask";
            readonly getSpaceList: "getSpaceList";
            readonly getAddress: "getAddress";
            readonly getCDNLiveAddress: "getCDNLiveAddress";
            readonly getCDNRecordAddress: "getCDNRecordAddress";
            readonly getStreamInterruptInfo: "getStreamInterruptInfo";
        };
    };
    /** 语言包 @since 0.0.1 */
    static LOCALES: {
        zh: {
            391001: string;
            395000: string;
            395400: string;
            395402: string;
            395403: string;
            395404: string;
            395405: string;
            395406: string;
            395407: string;
            395409: string;
            395410: string;
            395411: string;
            395412: string;
            395413: string;
            395415: string;
            395416: string;
            395451: string;
            395452: string;
            395454: string;
            395455: string;
            395456: string;
            395457: string;
            395458: string;
            395459: string;
            395460: string;
            395492: string;
            395500: string;
            395501: string;
            395503: string;
            395504: string;
            395505: string;
            395506: string;
            395507: string;
            395530: string;
            395544: string;
            395545: string;
            395546: string;
            395547: string;
            395556: string;
            395557: string;
            395558: string;
            395560: string;
            395561: string;
            395562: string;
            395563: string;
            395564: string;
            395566: string;
            395567: string;
            395568: string;
            395569: string;
            395600: string;
            395601: string;
            395602: string;
            395610: string;
            395620: string;
            395701: string;
            395702: string;
            395703: string;
            396001: string;
            396099: string;
            396101: string;
            396102: string;
            396103: string;
            396104: string;
            396105: string;
            396106: string;
            396107: string;
            396108: string;
            396109: string;
            396110: string;
            396501: string;
            396502: string;
            396503: string;
            396504: string;
            396505: string;
            396506: string;
            396508: string;
            396509: string;
            396510: string;
            396511: string;
            396512: string;
            396513: string;
            396514: string;
            396515: string;
            396516: string;
            396517: string;
            396518: string;
            396519: string;
            396520: string;
            396700: string;
            396701: string;
            397001: string;
            397002: string;
            397003: string;
            397004: string;
            397005: string;
            397006: string;
            397007: string;
            399000: string;
            399001: string;
            399002: string;
            399016: string;
            399048: string;
            399049: string;
            399030: string;
            3810001: string;
            3810002: string;
            3810005: string;
            3820002: string;
            3820006: string;
            3820007: string;
            3820008: string;
            3820014: string;
            3820032: string;
            3849999: string;
            3860000: string;
            3860001: string;
            3860002: string;
            3860003: string;
            3860004: string;
            3860005: string;
            3860006: string;
            3860009: string;
            3860020: string;
            BTN_RETRY: string;
            BTN_RELOAD: string;
            LOADING: string;
            TIMEFORMAT_ERROR: string;
            USE_MULTITHREADING_WARING: string;
            OPEN_INSTRUCTIONS: string;
            INIT_FINSHED: string;
            INIT_SUCCESS: string;
            GET_PLAYURL_FAILED: string;
            VIDEO_LOADING: string;
            DISCONNECT: string;
            DEVICE_ENCRYPTED: string;
            NO_RECORD: string;
            PLAY_FAILED: string;
            PLAY_SUCCESS: string;
            STOP_SUCCESS: string;
            CHANGE_PLAYURL_SUCCESS: string;
            CHANGE_PLAYURL_FAILED: string;
            GET_OSD_TIME: string;
            GET_OSD_TIME_FAILED: string;
            SET_POSTER: string;
            RESIZE: string;
            SPEED: string;
            SPEED_RATE: string;
            SPEED_CANCEL: string;
            GET_SPEED: string;
            MAX_SPEED_LIMIT: string;
            MIN_SPEED_LIMIT: string;
            SPEED_SWITCH_ERROR: string;
            SPEED_SWITCH_NOT_SUPPORT: string;
            SEEK_CANNOT_CROSS_DAYS: string;
            SEEK_TIMEFORMAT_ERROR: string;
            PAUSE: string;
            PAUSE_FAILED: string;
            RESUME: string;
            RESUME_FAILED: string;
            CALL_END: string;
            USER_DO_NOT_OWN_DEVICE: string;
            NO_CLOUD_RECORD: string;
            CHANGE_VIDEO_LEVEL: string;
            CHANGE_VIDEO_LEVEL_FAIL: string;
            GET_VIDEO_LEVEL_LIST: string;
            PLEASE_INPUT_RIGHT_VIDEO_LEVEL: string;
            VIDEO_LEVEL_NOT_SUPPORT: string;
            VIDEO_LEVEL_AUTO: string;
            VIDEO_LEVEL_FLUENT: string;
            VIDEO_LEVEL_STANDARD: string;
            VIDEO_LEVEL_HEIGH: string;
            VIDEO_LEVEL_SUPER: string;
            VIDEO_LEVEL_EXTREME: string;
            VIDEO_LEVEL_3K: string;
            VIDEO_LEVEL_4k: string;
            RESET_THEME: string;
            BTN_PLAY: string;
            BTN_PAUSE: string;
            BTN_VOLUME: string;
            BTN_MUTED: string;
            BTN_RECORDVIDEO: string;
            BTN_CAPTURE: string;
            BTN_TALK: string;
            BTN_BROADCAST: string;
            BTN_AICHAT: string;
            BTN_LIVE: string;
            BTN_REC_DROPDOWN: string;
            BTN_ALARM_MESSAGE: string;
            REC_DROPDOWN_CLOUD_REC: string;
            REC_DROPDOWN_CLOUD_RECORD: string;
            REC_DROPDOWN_LOCAL_REC: string;
            BTN_ZOOM: string;
            BTN_3D_ZOOM: string;
            BTN_PTZ: string;
            BTN_GLOBAL_FULLSCREEN: string;
            BTN_EXIT_GLOBAL_FULLSCREEN: string;
            BTN_FULLSCREEN: string;
            /** 版本号 @since 0.0.1 */
            BTN_EXIR_FULLSCREEN: string;
            BTN_HD: string;
            BTN_SPEED: string; /** 播放器配置项 */
            BTN_STREAM_TYPE: string;
            STREAM_TYPE_MAIN: string;
            STREAM_TYPE_SUB: string; /** 主题挂载节点 */
            STREAM_SWITCH_ERROR: string;
            STREAM_SWITCH_NOT_SUPPORT: string;
            BTN_CLOUDREC: string;
            BTN_CLOUDRECORD: string;
            BTN_REC: string;
            BTN_CALENDAR: string;
            BTN_TIME: string;
            BTN_MORE: string;
            DEVICE_NAME: string;
            DEVICE_ID: string;
            CAPTURE_SUCCESS: string;
            CAPTURE_FAILED: string;
            START_RECORD_SUCCESS: string;
            START_RECORD_FAILED: string; /** 加载控件 @since 0.0.1  @private */
            STOP_RECORD_SUCCESS: string;
            STOP_RECORD_FAILED: string; /** 暂停控件 @since 0.0.1 @private */
            RECORD_TIPS: string;
            RECORDS: string;
            OPEN_SOUND: string;
            CLOSE_SOUND: string;
            SOUND_OPENED: string;
            ZOOM: string;
            START_ZOOM: string;
            CLOSE_ZOOM: string;
            ZOOM_ADD: string;
            ZOOM_SUB: string;
            ZOOM_ADD_MAX: string;
            ZOOM_SUB_MIN: string;
            ZOOM_LIMIT_MAX: string;
            ZOOM_LIMIT_MIN: string;
            ZOOM_NOT_ENABLED: string;
            '3D_ZOOM': string;
            '3D_ZOOM_DISABLE': string;
            '3D_ZOOM_FAILED': string;
            START_3D_ZOOM: string;
            CLOSE_3D_ZOOM: string;
            DEVICE_NOT_SUPPORT_3D_ZOOM: string;
            '3D_ZOOM_ACTIVED': string; /** 回放底部时间轴 @since 0.0.1 @private */
            '3D_ZOOM_NOT_ACTIVED': string;
            '3D_ZOOM_CLOSED': string;
            CHANGE_ZOOM_TYPE: string;
            FULLSCREEN: string;
            FULLSCREEN_EXIT: string;
            GET_WEB_FULLSCREEN_STATUS: string;
            WEB_FULLSCREEN: string;
            WEB_FULLSCREEN_EXIT: string;
            DESTROY: string;
            GET_CAPACITY_SUCCESS: string;
            GET_CAPACITY_FAILED: string;
            GET_DEVICE_INFO_SUCCESS: string;
            GET_DEVICE_INFO_FAILED: string;
            GET_DEVICE_SUPPORT_QUALITY_SUCCESS: string;
            GET_DEVICE_SUPPORT_QUALITY_FAILED: string;
            GET_EZOPEN_URL_SUCCESS: string;
            GET_EZOPEN_URL_FAILED: string;
            QUERY_VOICE_LIST_SUCCESS: string;
            QUERY_VOICE_LIST_FAILED: string;
            SEND_VOICE_SUCCESS: string;
            SEND_VOICE_FAILED: string;
            PTZ_MIRROR_SUCCESS: string;
            /** 当前容器的全屏状态  true: 全屏， false: 非全屏 */
            PTZ_MIRROR_FAILED: string;
            GET_RECORD_MONTH_SUCCESS: string;
            GET_RECORD_MONTH_FAILED: string;
            GET_APP_KEY_SUCCESS: string;
            GET_APP_KEY_FAILED: string;
            /** 是否播放中 @private */
            GET_DEVICE_LIST_SUCCESS: string;
            GET_DEVICE_LIST_FAILED: string;
            SET_VIDEO_LEVEL_SUCCESS: string;
            SET_VIDEO_LEVEL_FAILED: string;
            GET_CLOUD_INFO_SUCCESS: string;
            GET_CLOUD_INFO_FAILED: string;
            GET_CLOUD_UPLOAD_URL_SUCCESS: string;
            GET_CLOUD_UPLOAD_URL_FAILED: string;
            GET_STREAM_ADDRESS_LIST_SUCCESS: string;
            GET_STREAM_ADDRESS_LIST_FAILED: string;
            GET_REC_TIMES_SUCCESS: string;
            GET_REC_TIMES_FAILED: string;
            GET_ALARM_LIST_SUCCESS: string;
            GET_ALARM_LIST_FAILED: string;
            CAPTURE_SAVE_SUCCESS: string;
            CAPTURE_SAVE_FAILED: string;
            CREATE_CAPTURE_TASK_SUCCESS: string;
            CREATE_CAPTURE_TASK_FAILED: string;
            GET_SPACE_LIST_SUCCESS: string;
            GET_SPACE_LIST_FAILED: string;
            GET_ADDRESS_SUCCESS: string;
            GET_ADDRESS_FAILED: string;
            GET_CDN_ADDRESS_SUCCESS: string;
            GET_CDN_ADDRESS_FAILED: string;
            GET_STREAM_INTERRUPT_INFO_SUCCESS: string;
            /**
             * 录像回放的月份列表 @private
             */
            GET_STREAM_INTERRUPT_INFO_FAILED: string;
            GET_PTZ_STATUS: string;
            GET_PTZ_STATUS_FAILED: string;
            MOBILE_HIDE_PTZ: string;
            OPTION_PTZ_FAILED: string;
            MOBILE_PTZ_TIPS: string;
            PTZ_FAST: string;
            PTZ_MID: string;
            /**
             * 录像回放的月份列表 @private
             */
            PTZ_SLOW: string;
            PTZ_SPEED: string;
            DEVICE_ZOOM: string;
            DEVICE_FOCUS: string;
            NOT_SUPPORT_DEVICE_ZOOM: string;
            NOT_SUPPORT_FOCUS: string;
            MIRROR: string;
            MIRROR_TYPE_ERROR: string;
            CHANGE_FEC_TYPE: string;
            DEVICE_NOT_SUPPORT: string;
            TYPE_NOT_SUPPORT: string;
            FEC_SUPPORT_VERSION: string;
            NO_CANVAS_ID: string;
            SET_FEC_PARAMS: string;
            GET_FEC_PARAMS: string;
            SET_FEC_PARAMS_FAILED: string;
            GET_FEC_PARAMS_FAILED: string;
            GET_FEC_PARAMS_SUPPORT_VERSION: string;
            SET_WATERMARK: string;
            FETCH_THEME_FAILED: string;
            cancel: string;
            ok: string;
            close: string;
            BTN_REC_LIST_TITLE: string;
            UNKOWN_ISSUE: string;
            391004: string;
            SEEK_NOT_SUPPORT: string;
            VIDEO_LEVEL_SATNDARD: string;
            VIDEO_LEVEL_SPUER: string;
            BTN_SOUND: string;
            BTN_EXPEND: string;
            BTN_WEBEXPEND: string;
            SOUND_DISABLED_WHEN_TALKING: string;
        };
        en: {
            391001: string;
            395000: string;
            395400: string;
            395402: string;
            395403: string;
            395404: string;
            395405: string;
            395406: string;
            395407: string;
            395409: string;
            395410: string;
            395411: string;
            395412: string;
            395413: string;
            395415: string;
            395416: string;
            395451: string;
            395452: string;
            395454: string;
            395455: string;
            395456: string;
            395457: string;
            395458: string;
            395459: string;
            395460: string;
            395492: string;
            395500: string;
            395501: string;
            395503: string;
            395504: string;
            395505: string;
            395506: string;
            395507: string;
            395530: string;
            395544: string;
            395545: string;
            395546: string;
            395547: string;
            395556: string;
            395557: string;
            395558: string;
            395560: string;
            395561: string;
            395562: string;
            395563: string;
            395564: string;
            395566: string;
            395567: string;
            395568: string;
            395569: string;
            395600: string;
            395601: string;
            395602: string;
            395610: string;
            395620: string;
            395701: string;
            395702: string;
            395703: string;
            396001: string;
            396099: string;
            396101: string;
            396102: string;
            396103: string;
            396104: string;
            396105: string;
            396106: string;
            396107: string;
            396108: string;
            396109: string;
            396110: string;
            396501: string;
            /** 所有控件列表, 所有控件名称规则（`${iconId}Control`）， 如音量控件 this.controls["volumeControl"]  @since 0.0.1 */
            396502: string;
            396503: string;
            396504: string;
            396505: string;
            396506: string;
            396508: string;
            396509: string;
            396510: string;
            396511: string;
            396512: string;
            396513: string;
            396514: string;
            396515: string;
            396516: string; /**  @since 0.0.1 @private */
            396517: string;
            396518: string;
            396519: string;
            396520: string;
            396700: string;
            396701: string; /** 容器的宽 */
            397001: string;
            397002: string;
            397003: string;
            397004: string;
            397005: string; /** 静音 */
            397006: string;
            397007: string;
            399000: string;
            399001: string;
            399002: string;
            399016: string; /** 自定清晰度 @private */
            399048: string;
            399049: string;
            399030: string;
            3810001: string;
            3810002: string;
            3810005: string;
            3820002: string;
            3820006: string;
            3820007: string;
            /**
             * 录像回放的月份列表 @private
             */
            3820008: string;
            3820014: string;
            3820032: string;
            3849999: string;
            3860000: string;
            3860001: string;
            3860002: string;
            3860003: string;
            3860004: string;
            3860005: string;
            3860006: string;
            3860009: string;
            3860020: string;
            BTN_RETRY: string;
            BTN_RELOAD: string;
            LOADING: string;
            TIMEFORMAT_ERROR: string;
            USE_MULTITHREADING_WARING: string;
            OPEN_INSTRUCTIONS: string;
            INIT_FINSHED: string;
            INIT_SUCCESS: string;
            GET_PLAYURL_FAILED: string;
            VIDEO_LOADING: string;
            DISCONNECT: string;
            DEVICE_ENCRYPTED: string;
            NO_RECORD: string;
            PLAY_FAILED: string;
            PLAY_SUCCESS: string;
            STOP_SUCCESS: string;
            CHANGE_PLAYURL_SUCCESS: string;
            CHANGE_PLAYURL_FAILED: string;
            GET_OSD_TIME: string;
            GET_OSD_TIME_FAILED: string;
            SET_POSTER: string;
            RESIZE: string;
            SPEED: string;
            SPEED_RATE: string;
            SPEED_CANCEL: string;
            GET_SPEED: string;
            MAX_SPEED_LIMIT: string;
            MIN_SPEED_LIMIT: string;
            SPEED_SWITCH_ERROR: string;
            SPEED_SWITCH_NOT_SUPPORT: string;
            SEEK_CANNOT_CROSS_DAYS: string;
            SEEK_TIMEFORMAT_ERROR: string;
            PAUSE: string;
            PAUSE_FAILED: string;
            RESUME: string;
            RESUME_FAILED: string;
            CALL_END: string;
            USER_DO_NOT_OWN_DEVICE: string;
            NO_CLOUD_RECORD: string;
            CHANGE_VIDEO_LEVEL: string;
            CHANGE_VIDEO_LEVEL_FAIL: string;
            GET_VIDEO_LEVEL_LIST: string;
            PLEASE_INPUT_RIGHT_VIDEO_LEVEL: string;
            VIDEO_LEVEL_NOT_SUPPORT: string;
            VIDEO_LEVEL_AUTO: string;
            VIDEO_LEVEL_FLUENT: string;
            VIDEO_LEVEL_STANDARD: string;
            VIDEO_LEVEL_HEIGH: string;
            VIDEO_LEVEL_SUPER: string;
            VIDEO_LEVEL_EXTREME: string;
            VIDEO_LEVEL_3K: string;
            VIDEO_LEVEL_4k: string;
            RESET_THEME: string;
            BTN_PLAY: string;
            BTN_PAUSE: string;
            BTN_VOLUME: string;
            BTN_MUTED: string;
            BTN_RECORDVIDEO: string;
            BTN_CAPTURE: string;
            BTN_TALK: string;
            BTN_BROADCAST: string;
            BTN_AICHAT: string;
            BTN_LIVE: string;
            BTN_REC_DROPDOWN: string;
            BTN_ALARM_MESSAGE: string;
            REC_DROPDOWN_CLOUD_REC: string;
            REC_DROPDOWN_CLOUD_RECORD: string;
            REC_DROPDOWN_LOCAL_REC: string;
            BTN_ZOOM: string;
            BTN_3D_ZOOM: string;
            BTN_PTZ: string;
            BTN_GLOBAL_FULLSCREEN: string;
            BTN_EXIT_GLOBAL_FULLSCREEN: string;
            BTN_FULLSCREEN: string;
            BTN_EXIR_FULLSCREEN: string;
            BTN_EXPEND: string;
            BTN_WEBEXPEND: string;
            BTN_HD: string;
            BTN_SPEED: string;
            BTN_STREAM_TYPE: string;
            STREAM_TYPE_MAIN: string;
            STREAM_TYPE_SUB: string;
            STREAM_SWITCH_ERROR: string;
            STREAM_SWITCH_NOT_SUPPORT: string;
            BTN_CLOUDREC: string;
            BTN_CLOUDRECORD: string;
            BTN_REC: string;
            BTN_CALENDAR: string;
            BTN_TIME: string;
            BTN_MORE: string;
            DEVICE_NAME: string;
            DEVICE_ID: string;
            CAPTURE_SUCCESS: string;
            CAPTURE_FAILED: string;
            START_RECORD_SUCCESS: string;
            START_RECORD_FAILED: string;
            STOP_RECORD_SUCCESS: string;
            STOP_RECORD_FAILED: string;
            RECORD_TIPS: string;
            RECORDS: string;
            OPEN_SOUND: string;
            CLOSE_SOUND: string;
            SOUND_OPENED: string;
            ZOOM: string;
            START_ZOOM: string;
            CLOSE_ZOOM: string;
            ZOOM_ADD: string;
            ZOOM_SUB: string;
            ZOOM_ADD_MAX: string;
            ZOOM_SUB_MIN: string;
            ZOOM_LIMIT_MAX: string;
            ZOOM_LIMIT_MIN: string;
            ZOOM_NOT_ENABLED: string;
            '3D_ZOOM': string;
            '3D_ZOOM_DISABLE': string;
            '3D_ZOOM_FAILED': string;
            START_3D_ZOOM: string;
            CLOSE_3D_ZOOM: string;
            DEVICE_NOT_SUPPORT_3D_ZOOM: string;
            '3D_ZOOM_ACTIVED': string;
            '3D_ZOOM_NOT_ACTIVED': string;
            '3D_ZOOM_CLOSED': string;
            CHANGE_ZOOM_TYPE: string;
            FULLSCREEN: string;
            FULLSCREEN_EXIT: string;
            GET_WEB_FULLSCREEN_STATUS: string;
            WEB_FULLSCREEN: string;
            WEB_FULLSCREEN_EXIT: string;
            DESTROY: string;
            GET_CAPACITY_SUCCESS: string;
            GET_CAPACITY_FAILED: string;
            GET_DEVICE_INFO_SUCCESS: string;
            GET_DEVICE_INFO_FAILED: string;
            GET_DEVICE_SUPPORT_QUALITY_SUCCESS: string;
            GET_DEVICE_SUPPORT_QUALITY_FAILED: string;
            GET_EZOPEN_URL_SUCCESS: string;
            GET_EZOPEN_URL_FAILED: string;
            QUERY_VOICE_LIST_SUCCESS: string;
            /**
             * 视频分辨率 宽
             *
             * @version 3.1.2
             *
             * ```ts
             * theme.videoWidth // number
             * ```
             */
            QUERY_VOICE_LIST_FAILED: string;
            SEND_VOICE_SUCCESS: string;
            SEND_VOICE_FAILED: string;
            PTZ_MIRROR_SUCCESS: string; /**
             * 视频分辨率 高
             * @version 3.1.2
             */
            PTZ_MIRROR_FAILED: string;
            GET_RECORD_MONTH_SUCCESS: string;
            GET_RECORD_MONTH_FAILED: string;
            GET_APP_KEY_SUCCESS: string;
            GET_APP_KEY_FAILED: string;
            GET_DEVICE_LIST_SUCCESS: string;
            GET_DEVICE_LIST_FAILED: string;
            SET_VIDEO_LEVEL_SUCCESS: string;
            SET_VIDEO_LEVEL_FAILED: string;
            GET_CLOUD_INFO_SUCCESS: string;
            GET_CLOUD_INFO_FAILED: string;
            GET_CLOUD_UPLOAD_URL_SUCCESS: string;
            GET_CLOUD_UPLOAD_URL_FAILED: string;
            GET_STREAM_ADDRESS_LIST_SUCCESS: string;
            GET_STREAM_ADDRESS_LIST_FAILED: string;
            GET_REC_TIMES_SUCCESS: string;
            GET_REC_TIMES_FAILED: string;
            GET_ALARM_LIST_SUCCESS: string;
            GET_ALARM_LIST_FAILED: string;
            CAPTURE_SAVE_SUCCESS: string;
            CAPTURE_SAVE_FAILED: string;
            CREATE_CAPTURE_TASK_SUCCESS: string;
            CREATE_CAPTURE_TASK_FAILED: string;
            GET_SPACE_LIST_SUCCESS: string;
            GET_SPACE_LIST_FAILED: string;
            GET_ADDRESS_SUCCESS: string;
            GET_ADDRESS_FAILED: string;
            GET_CDN_ADDRESS_SUCCESS: string;
            GET_CDN_ADDRESS_FAILED: string;
            GET_STREAM_INTERRUPT_INFO_SUCCESS: string;
            GET_STREAM_INTERRUPT_INFO_FAILED: string;
            GET_PTZ_STATUS: string;
            GET_PTZ_STATUS_FAILED: string;
            MOBILE_HIDE_PTZ: string;
            OPTION_PTZ_FAILED: string;
            MOBILE_PTZ_TIPS: string;
            PTZ_FAST: string;
            PTZ_MID: string;
            PTZ_SLOW: string;
            PTZ_SPEED: string;
            DEVICE_ZOOM: string;
            DEVICE_FOCUS: string;
            NOT_SUPPORT_DEVICE_ZOOM: string;
            NOT_SUPPORT_FOCUS: string;
            MIRROR: string;
            MIRROR_TYPE_ERROR: string;
            /**
             * 静音
             * @example
             * ```ts
             * // 事件监听
             * theme.on(Theme.EVENTS.volumechange, (volume: number, muted: boolean) => {})
             * ```
             */
            CHANGE_FEC_TYPE: string;
            DEVICE_NOT_SUPPORT: string;
            TYPE_NOT_SUPPORT: string;
            FEC_SUPPORT_VERSION: string;
            NO_CANVAS_ID: string;
            SET_FEC_PARAMS: string;
            GET_FEC_PARAMS: string;
            SET_FEC_PARAMS_FAILED: string;
            GET_FEC_PARAMS_FAILED: string;
            GET_FEC_PARAMS_SUPPORT_VERSION: string;
            SET_WATERMARK: string;
            FETCH_THEME_FAILED: string;
            cancel: string;
            ok: string;
            close: string;
            BTN_REC_LIST_TITLE: string;
            UNKOWN_ISSUE: string;
            391004: string;
            /**
             * 电子放大倍数， 仅 ezopen 支持
             * @since 0.0.1
             * @example
             * ```ts
             * theme.zoom // 放大倍数
             * // 事件监听
             * theme.on(Theme.EVENTS.zoom, (zoom: number) => {})
             * ```
             */
            SEEK_NOT_SUPPORT: string;
            VIDEO_LEVEL_SATNDARD: string;
            VIDEO_LEVEL_SPUER: string;
            BTN_SOUND: string;
            SOUND_DISABLED_WHEN_TALKING: string; /**
             * 电子放大倍数，最多保留一位小数 (需要 zooming = true 才能进行缩放)
             * @example
             * ```ts
             * theme.zoom = 2 // 放大倍数
             * theme.zoom = 2.5 // 放大倍数
             * // 事件监听
             * theme.on(Theme.EVENTS.zoomChange, (zoom: number) => {})
             * ```
             */
        };
    };
    /** 版本号 @since 0.0.1 */
    static THEME_VERSION: string;
    /** 播放器配置项 */
    options: ThemeOptions;
    /** 主题挂载节点 */
    $container: HTMLElement;
    logger: LoggerCls;
    /** 多语言对象 https://www.npmjs.com/package/@ezuikit/utils-i18n  @since 0.0.1 */
    i18n: I18n;
    staticPath: string;
    /** 所有控件列表, 所有控件名称规则（`${iconId}Control`）， 如音量控件 this.controls["volumeControl"]  @since 0.0.1 */
    controls: Record<string, Control>;
    /** 内容控件 @since 0.0.1 */
    contentControl: Content;
    /** 加载控件 @since 0.0.1  @private */
    _loadingControl: Loading;
    /** 暂停控件 @since 0.0.1 @private */
    _pauseControl: Pause;
    /** 消息提示控件 @since 0.0.1 @private */
    messageControl: Message;
    /** 封面控件 @since 0.0.1 @private */
    posterControl: Poster;
    /**
     * @since 0.0.1
     * @private
     */
    _seekDate: Date | null;
    /**
     * 更多控件（header more）
     * @since 0.0.1
     * @private
     */
    _headerMoreControl: More | null;
    /**
     * 更多控件（footer more）
     * @since 0.0.1
     * @private
     */
    _footerMoreControl: More | null;
    /** 头部控件 @since 0.0.1 @private */
    _header: Header | null;
    /** 低部控件 @since 0.0.1 @private */
    _footer: Footer | null;
    /** 回放底部时间轴 @since 0.0.1 @private */
    _recFooter: RecFooter | null;
    /**
     * 移动端扩展容器, 扩展的控件渲染在指定容器以外， 仅只用端适用， 为了可以放置大的控件和方便开发接入
     * @private
     */
    _mobileExtend: MobileExtend | null;
    /**  @since 0.0.1 @private */
    _interactiveResult: InteractiveHFResult | null;
    /**  @since 0.0.1 @private */
    _themeData: IThemeData | null;
    private _fullscreen;
    zoomUtil: Zoom | null;
    /** 清除屏幕旋转 */
    private _cleanupOrientation;
    /**  resizeObserver 监听销毁 */
    private _cleanUpResizeObserver;
    private _throttleMobileInnerWidthHeight;
    /** 容器的宽 */
    private _width;
    /** 容器的高 */
    private _height;
    /** 当前容器的全屏状态  true: 全屏， false: 非全屏 */
    private _isCurrentFullscreen;
    /** 屏幕旋转角度 0 ｜ 90 ｜ 180 ｜ 270 */
    private _orientationAngle;
    _url: string;
    /** 是否播放中 @private */
    _playing: boolean;
    /** @private 加载中 */
    _loading: boolean;
    /** 音量 */
    private _volume;
    /** 静音 */
    private _muted;
    /** 正在兜底的原始 scope，非 null 表示处于兜底取值中（用于避免 customizeMissing 无限递归） */
    private _missingScope;
    /** 电子放大倍数 @private */
    _zoom: number;
    /** 放大中  true: 可缩放状态，false: 禁止缩放状态(不能缩放) @private */
    _zooming: boolean;
    /** 录制中 @private */
    _recording: boolean;
    /** 对讲中 @private */
    _talking: boolean;
    /** 倍速 @private */
    _speed: number;
    /** 自定清晰度 @private */
    _videoLevelAuto: boolean;
    /**
     * 当前清晰度
     */
    _currentVideoLevel: EzvizVideoLevel | null;
    /** 回放片段列表 */
    recordList: TimeLineTimeSection[];
    /**
     * 播放区间（片段分享），null 表示不约束。
     * 由 SDK 层在初始化时通过 props 下发，主题层据此决定日历/回放类型按钮
     * 是否渲染、片段进度条是否渲染。区间没有运行时变更入口。
     */
    playbackRange: {
        begin: string;
        end: string;
    } | null;
    /** 窗口尺寸变化时，设置窗口超出隐藏，防止出现滚动条 */
    private _resizeOverflowTimer;
    /**
     * 录像回放的月份列表 @private
     */
    recMonth: string[];
    /** 清理 header/footer 动画 定时器 @private */
    _onPauseTimingFunc: ((open: boolean) => void) | null;
    /**
     * 首帧同步 Live/RecDropdown 激活态的监听器引用。
     * 每次 `_renderTheme` 重新绑定前需先移除旧引用，避免 changeTheme 累积监听。
     * @private
     */
    _onFirstFrameSync: (() => void) | null;
    /**
     * 模板请求（getDetail）的中止控制器。
     * 重新渲染或销毁时中止在途请求，避免请求返回后在已销毁/已切换的 theme 上继续操作。
     * @private
     */
    _templateAbortController: AbortController | null;
    /** 销毁标识  @readonly */
    destroyed: boolean;
    scaleMode: ThemeOptions['scaleMode'];
    _videoInfo: ThemeVideoInfo;
    services: Services | null;
    constructor(options: ThemeOptions);
    get url(): string;
    set url(url: string);
    /**
     * url 信息 播放地址信息
     */
    get urlInfo(): Partial<_ezuikit_utils_tools.EzopenURL>;
    /**
     * 主子码流 1 | 2
     */
    get currentStreamTypeIn(): number | undefined;
    /**
     * 当前播放类型，由播放地址解析得出
     *
     * 取值 `'live' | 'rec' | 'cloudRec' | 'cloudRecord'`，无法判定时为空字符串 `''`。
     *
     * 与 {@link recType} 的关系：`recType` 只覆盖三种回放，直播时为空串；
     * 本 getter 把直播也纳入同一个枚举，作为「当前播放类型」的统一出口。
     *
     * @remarks 空串表示无法从地址判定（如 rtmp、webrtc、地址未设置）。
     * 此时控件支持性校验会整体跳过，避免对判不出类型的地址误报。
     * @since 3.1.7
     * ```ts
     * theme.playType // 'cloudRec'
     * ```
     */
    get playType(): ThemePlayType | '';
    /** 萤石直播 */
    get isEzvizLive(): boolean;
    /** 萤石本地存储 */
    get isLocalRec(): boolean;
    /** 萤石云存储 */
    get isCloudRec(): boolean;
    /** 萤石云录制 */
    get isCloudRecord(): boolean;
    /**
     * 容器的宽(单位 px)
     * ```ts
     * theme.width // number
     * ```
     */
    get width(): number;
    /**
     * 容器的高(单位 px)
     * ```ts
     * theme.height // number
     * ```
     */
    get height(): number;
    /**
     * 视频信息
     * @version 3.1.2
     * ```ts
     * theme.videoInfo // ThemeVideoInfo
     * ```
     */
    get videoInfo(): ThemeVideoInfo;
    set videoInfo(info: ThemeVideoInfo);
    /**
     * 视频分辨率 宽
     *
     * @version 3.1.2
     *
     * ```ts
     * theme.videoWidth // number
     * ```
     */
    get videoWidth(): number;
    /**
     * 视频分辨率 高
     * @version 3.1.2
     */
    get videoHeight(): number;
    /**
     * 当前播放状态
     * ```ts
     * theme.playing // boolean
     * ```
     */
    get playing(): boolean;
    /**
     * 播放状态
     * ```ts
     * // 事件监听
     * theme.on(Theme.EVENTS.play, (playing: boolean) => {})
     * ```
     */
    set playing(playing: boolean);
    /**
     * 加载中
     * ```ts
     * theme.loading // boolean
     * ```
     */
    get loading(): boolean;
    /**
     * 加载状态
     * ```ts
     * // 事件监听
     * theme.on(Theme.EVENTS.loading, (loading: boolean) => {})
     * ```
     */
    set loading(loading: boolean);
    /**
     * 音量值
     */
    get volume(): number;
    /**
     * 音量值
     * ```ts
     * // 事件监听
     * theme.on(Theme.EVENTS.volumechange, (volume: number, muted: boolean) => {})
     * ```
     */
    set volume(volume: number);
    /**
     * 静音
     *
     */
    get muted(): boolean;
    /**
     * 静音
     * @example
     * ```ts
     * // 事件监听
     * theme.on(Theme.EVENTS.volumechange, (volume: number, muted: boolean) => {})
     * ```
     */
    set muted(muted: boolean);
    /**
     * 是否在缩放中
     */
    get zooming(): boolean;
    /**
     * 是否在缩放中
     */
    set zooming(zooming: boolean);
    /**
     * 电子放大倍数， 仅 ezopen 支持
     * @since 0.0.1
     * @example
     * ```ts
     * theme.zoom // 放大倍数
     * // 事件监听
     * theme.on(Theme.EVENTS.zoom, (zoom: number) => {})
     * ```
     */
    get zoom(): number;
    /**
     * 电子放大倍数，最多保留一位小数 (需要 zooming = true 才能进行缩放)
     * @example
     * ```ts
     * theme.zoom = 2 // 放大倍数
     * theme.zoom = 2.5 // 放大倍数
     * // 事件监听
     * theme.on(Theme.EVENTS.zoomChange, (zoom: number) => {})
     * ```
     */
    set zoom(zoom: number);
    /**
     * 对讲中
     */
    get talking(): boolean;
    get speed(): number;
    /**
     * 倍速
     */
    set speed(speed: number);
    /**
     * 对讲增益(音量)， 仅 ezopen 支持
     *
     * {@link https://mdn.org.cn/en-US/docs/Web/API/Web_Audio_API/Using_Web_Audio_API}
     *
     * @since 0.0.1
     * @example
     * ```ts
     * theme.talkGain // 对讲音量
     * // 事件监听 event
     * theme.on(Theme.EVENTS.talk, (gain: number) => {})
     * ```
     */
    get talkGain(): any;
    /**
     * 录制中， 仅 ezopen 支持
     * @since 0.0.1
     */
    get recording(): boolean;
    /**
     * 云台开启中
     */
    get ptzing(): boolean;
    /**
     * 清晰度自动
     */
    get videoLevelAuto(): boolean;
    /**
     * 当前清晰度
     */
    get currentVideoLevel(): EzvizVideoLevel | null;
    /**
     * 当前容器的全屏状态  true: 全屏， false: 非全屏 ， 如果想获取当前浏览器是否全屏，请使用 document.fullscreenElement 判断
     * @since 0.0.1
     * @example
     * ```ts
     * theme.isCurrentFullscreen // 当前容器的全屏状态
     * ```
     */
    get isCurrentFullscreen(): boolean;
    /**
     * 屏幕旋转角度(0 | 90 | 180 | 270)
     * @example
     * ```ts
     * theme.orientationAngle // 0 | 90 | 180 | 270
     * // 事件监听
     * theme.on(Theme.EVENTS.orientationChange, (angle: 0 | 90 | 180 | 270) => {})
     * ```
     */
    get orientationAngle(): number;
    /**
     * 重新调整播放器窗口大小
     *
     * Adjust the player window size
     * @param {number | string} width 宽度（number 类型默认px, 支持字符串大小 "100%" | "50vw"）
     * @param {number | string} height 高度（number 类型默认px, 支持字符串大小 "100%" | "50vh"）
     * @since 0.0.1
     * @example
     * ```ts
     * theme.resize(600, 400) // 600px * 400px
     * theme.resize("600px", "400px") // 600px * 400px
     * theme.resize("50%", "1vh")
     * theme.resize("2em", "2rem")
     * // 事件监听 event, 这里是具体的宽高（单位px）
     * theme.on(Theme.EVENTS.resize, (width: number, height: number) => {})
     * ```
     */
    resize(width?: number | string, height?: number | string): void;
    /**
     * 全屏（支持PC/Mobile, 移动端默认 $container 旋转 90 度充满全屏, 层级 9999）；
     * 如果移动端屏幕已系统级别旋转 90° 或 270°，默认充满全屏（节点不旋转）
     * @since 0.0.1
     * @example
     * ```ts
     * theme.fullscreen()
     * // 事件监听
     * theme.on(Theme.EVENTS.fullscreenChange,
     *    ({isCurrentFullscreen, isFullscreen, isMobile}: {isCurrentFullscreen: boolean, isFullscreen: boolean, isMobile: boolean}) => {}
     * )
     * ```
     * @returns {Promise<void>}
     */
    fullscreen(): Promise<void>;
    /**
     * 退出全屏（支持PC/Mobile）,移动端不支持系统级别全屏
     *
     * Exits fullscreen mode (cross-platform support). Note: Mobile platforms are limited to application-level fullscreen only.
     * @since 0.0.1
     * @example
     * ```ts
     * theme.exitFullscreen()
     * // 事件监听 event
     * theme.on(Theme.EVENTS.fullscreenChange,
     *    ({isCurrentFullscreen, isFullscreen, isMobile}: {isCurrentFullscreen: boolean, isFullscreen: boolean, isMobile: boolean}) => {}
     * )
     * ```
     * @returns {Promise<void>}
     */
    exitFullscreen(): Promise<void>;
    /**
     * 切换主题（不会改变播放器的状态， 但是会打断其他操作如录制、对讲和云台控制等）， 如果传空值，则清空主题
     *
     * Change theme (does not affect player state but may disrupt ongoing operations like recording, talk, or PTZ control). Passing an `null` value clears the theme.
     * @param {IThemeData} themeData IThemeData
     * @since 0.0.1
     * @example
     * ```ts
     * theme.changeTheme({...})
     * // 事件监听 event
     * theme.on(Theme.EVENTS.changeTheme)
     * ```
     * @returns {void}
     */
    changeTheme(themeData: IThemeData): void;
    /**
     * 设置封面(仅设置，不会默认展示出来)
     * @param {string=} poster 封面地址， 当 poster = ''  不展示
     * @since 0.0.1
     * @example
     * ```ts
     * theme.setPoster("https://...................")
     * theme.setPoster("data:image/jpeg;base64,/............")
     * ```
     * @returns {void}
     */
    setPoster(poster?: string): void;
    /**
     * 主题Header中展示更多按钮控件
     * @since 0.0.1
     * @example
     * ```ts
     * theme.hasHeaderMoreControl // boolean
     * ```
     */
    get hasHeaderMoreControl(): boolean;
    /**
     * 主题Footer中展示更多按钮控件
     * @since 0.0.1
     * @example
     * ```ts
     * theme.hasFooterMoreControl // boolean
     * ```
     */
    get hasFooterMoreControl(): boolean;
    /**
     * @description 设置日志配置
     * @since 0.0.1
     * @param {LoggerOptions} options - 日志配置
     */
    setLoggerOptions(options?: LoggerOptions): void;
    /**
     * 设置视频画面缩放模式
     * @since 1.0.1
     * @param {0 | 1 | 2} scaleMode - 缩放模式， 0: 窗口铺满， 1: 等比缩放大边铺满， 2: 等比缩放小边铺满
     */
    setScaleMode(scaleMode: ThemeOptions['scaleMode']): void;
    /**
     * 获取多语言文案
     *
     * 相比直接用 `theme.i18n.t()`：返回类型收窄为 `string`（底层签名是 `string | number`，
     * 调用处不必再写 `as string`）。缺失 key 的兜底由 i18n 实例上的 `customizeMissing`
     * 统一处理，因此两者在兜底行为上一致。
     * @param scope 多语言 key
     * @param variables 插值变量，如 `{ zoom: 8 }`；传 `defaultvalue` 可指定自己的兜底文案
     * @returns 文案；scope 不存在时返回「未知问题 【scope】」
     * @example
     * ```ts
     * theme.t('ZOOM_LIMIT_MAX', { zoom: 8 });
     * theme.t('NOT_EXIST_KEY'); // 未知问题 【NOT_EXIST_KEY】
     * theme.t('NOT_EXIST_KEY', { defaultvalue: '自定义兜底' }); // 自定义兜底
     * ```
     */
    t(scope: string | number, variables?: TranslateVariables): string;
    /**
     * 语言包缺 key 时的兜底文案（`customizeMissing` 的实现）
     *
     * 注意底层是把本方法的返回值「原样返回」、不再做插值，所以这里借
     * `i18n.t(UNKOWN_ISSUE)` 完成插值。而这一次取值本身也可能缺失
     * （如 `language` 传了不存在的语言，当前语言包整体不存在），
     * 那会再次回调到这里造成无限递归，因此用重入标记兜住，退化为直接返回原始 scope。
     *
     * 注：`options.locales` 与内置语言包是深合并，无法移除内置的 UNKOWN_ISSUE，
     * 因此正常配置下不会走到退化分支。
     * @param scope 缺失的多语言 key
     * @param variables 原始插值变量
     */
    private _missingText;
    /**
     * 销毁包括事件、控件 ...
     *
     * Destroy (including events, controls...)
     * @since 0.0.1
     * @returns {void}
     * @example
     * ```ts
     * theme.destroy()
     * // 事件监听
     * theme.on(Theme.EVENTS.theme.beforeDestroy, () => {}) // 主题销毁前
     * theme.on(Theme.EVENTS.theme.destroyed, () => {}) // // 主题销毁后
     * ```
     */
    destroy(): void;
    /**
     * 判断是否为萤石播放地址（直播或回放，私有流 `ezopen://` 与标准流 flv / hls 都算）
     *
     * 只校验 `?` 之前的部分，查询参数不参与判断。判定规则见 `@ezuikit/utils-tools` 的 `isEzvizUrl`。
     *
     * 注意：`options.isEzviz` 为 `true`（默认值）时直接返回 `true`，不再看地址；
     * 需要按地址判定时请显式传 `isEzviz: false`。
     *
     * @param url - 待判断的地址，省略时使用当前播放地址 `theme.url`
     * @returns 是萤石播放地址返回 `true`，否则返回 `false`
     * @sine 3.2.0
     * @example
     * ```ts
     * theme.isEzvizUrl(); // 判断当前 theme.url
     * theme.isEzvizUrl('ezopen://open.ys7.com/BW3143164/1.hd.live'); // true
     * theme.isEzvizUrl('https://example.com/a.flv'); // false
     * ```
     */
    isEzvizUrl(url?: string): boolean;
    /**
     * 判断是否为萤石直播（预览）地址，包括私有流与标准流
     *
     * - `ezopen://` 地址：路径以 `.live` 结尾
     * - `http(s)://` 地址：路径包含 `/openlive/`
     *
     * @param url - 待判断的地址，省略时使用当前播放地址 `theme.url`
     * @returns 是萤石直播地址返回 `true`，否则返回 `false`
     * @sine 3.2.0
     * @example
     * ```ts
     * theme.isEzvizLiveUrl('ezopen://open.ys7.com/BW3143164/1.hd.live'); // true
     * theme.isEzvizLiveUrl('ezopen://open.ys7.com/BW3143164/1.rec'); // false
     * ```
     */
    isEzvizLiveUrl(url?: string): boolean;
    /**
     * 判断是否为萤石回放地址，包括私有流与标准流
     *
     * - `ezopen://` 地址：路径以 `.rec` 结尾（如 `1.rec`、`1.cloud.rec`、`1.hd.local.rec`）
     * - `http(s)://` 地址：路径包含 `/openpb/`
     *
     * @param url - 待判断的地址，省略时使用当前播放地址 `theme.url`
     * @returns 是萤石回放地址返回 `true`，否则返回 `false`
     * @sine 3.2.0
     * @example
     * ```ts
     * theme.isEzvizPlaybackUrl('ezopen://open.ys7.com/BW3143164/1.cloud.rec'); // true
     * theme.isEzvizPlaybackUrl('ezopen://open.ys7.com/BW3143164/1.hd.live'); // false
     * ```
     */
    isEzvizPlaybackUrl(url?: string): boolean;
    /** 初始化配置项 */
    private _initOptions;
    /**
     * 初始化设置类名和设置宽高
     */
    private _initClassName;
    /**
     * 渲染主题
     * @param themeData - 主题数据
     * @returns
     */
    private _renderTheme;
    /**
     * 移动端resize 获取屏幕宽高(innerHeight 和 innerWidth)。
     *
     * 不做 dpr 的计算;
     * 不做 dpr 的计算;
     * 不做 dpr 的计算;
     */
    private _mobileInnerWidthHeight;
    /**
     * 添加事件监听 （全屏，旋转方向 ）
     */
    private _addEventListener;
    /**
     * 窗口尺寸变化判断头部是否需要隐藏控件展示在更多中
     * 尺寸变化结束时 进行判断，为了节省开销
     */
    private _headerMoreControlShow;
    /**
     * 窗口尺寸变化判断底部是否需要隐藏控件展示在更多中（递归判断）
     * 尺寸变化结束时 进行判断，为了节省开销
     * @WARN：这里会闪一下， 原因：需要控件渲染后才知是否需要放置到 More 中，
     */
    private _footerMoreControlShow;
    private _displayMore;
    /**
     * 移除事件
     */
    private _removeEventListener;
    /**
     * 禁用按钮
     * @private
     */
    _disabled(disabled?: boolean): void;
    private _onDblClickFullscreen;
    private resetControl;
    /**
     * 窗口全屏后旋转 90度判断， 然后设置控件已经旋转 90度， 为了解决控件交互问题
     */
    private _isRotated;
    /**
     * 私有流地址
     */
    get isEzopen(): boolean;
    /**
     * 判断播放地址是萤石的播放地址
     * @since 3.2.0
     */
    get isEzviz(): boolean;
    /**
     * 设备能力集，字段见 {@link EzvizDeviceCapacity}；未查询到能力集时为空对象，按「不支持」处理， 需要
     * @since 3.2.0
     */
    get deviceCapacity(): EzvizDeviceCapacity;
    /**
     * 是否支持主子码流切换（本地回放），默认 false。
     * 由 SDK 层通过 `EVENTS.supportLocalRecordStreamType` 事件设置；为 true 且当前是本地回放时才展示码流切换控件。
     */
    get supportLocalRecordStreamType(): boolean;
    /**
     * 设备信息
     * @since 3.2.0
     */
    get deviceInfo(): EzvizDeviceCapacity;
    /**
     * 设备支持的清晰度列表, 如果外部传入默认使用传入的值， 不支持动态设置清晰度列表
     * @since 3.2.0
     */
    get videoLevelList(): EzvizVideoLevel[];
    /** 支持3D定位功能 （仅直播支持判断）@since 3.2.0 */
    get support3DZoom(): boolean;
    /**
     * 是否开启3D定位功能 （仅直播支持判断）
     * @since 3.2.0
     */
    get use3DZoom(): any;
    /**
     * 萤石云存储空间 id（云录制回放与云抓拍共用）
     *
     * 优先级：`setSpaceId()` 设置的值 > 播放地址中的 spaceId（ezopen 初始化时写入 options） > 初始化参数 `spaceId`
     * @since 3.2.0
     */
    get spaceId(): number | string | undefined;
    /**
     * 设置 / 更新存储空间 id（与云录制 spaceId 共用，支持实例化后更新）会同时修改 url 上的 spaceId
     * @param spaceId 存储空间 id（由 {@link getSpaceList} 获取）
     * @since 3.2.0
     */
    setSpaceId(spaceId: number | string): void;
    /**
     * @deprecated 请使用 {@link setSpaceId}，此别名仅作兼容保留
     * @param resultSpaceId 存储空间 id
     */
    setResultSpaceId(resultSpaceId: number | string): void;
    /**
     * 即时云抓拍（设备抓拍图片，支持生命周期）
     * @param options 抓拍参数，`spaceId` 不传时取实例 {@link spaceId}
     * @returns `{ code: 0, data: { picUrl, fileNodeId } }`；失败时 code 非 0（透传服务端 meta.code 或 -1），不会 reject
     * @since 3.2.0
     * @example
     * ```ts
     * await theme.captureCamera({ spaceId: 270328 }) // { code: 0, data: { picUrl, fileNodeId } }
     * ```
     */
    captureCamera(options?: CaptureCameraOptions): Promise<CloudCaptureResult<CaptureCameraData>>;
    /**
     * 创建抓拍计划任务（批量 / 定时）
     * @param options 抓拍计划参数，`spaceId` 不传时取实例 {@link spaceId}
     * @returns `{ code: 0, data: { taskId } }`；失败时 code 非 0，不会 reject
     * @since 3.2.0
     * @example
     * ```ts
     * await theme.createCaptureTask({ spaceId: 270328, captureType: 1, timingPoints: '20260101120000' })
     * ```
     */
    createCaptureTask(options: CreateCaptureTaskOptions): Promise<CloudCaptureResult<{
        taskId: string;
    }>>;
    /**
     * 查询存储空间列表（默认云抓拍 cloudCapture 空间），供用户选择 spaceId
     * @param options 查询参数 `{ startTime, endTime, lastSpaceId, pageSize, bizTypeList }`
     * @returns `{ code: 0, data: { result, lastId, pageSize, hasNext } }`；失败时 code 非 0，不会 reject
     * @since 3.2.0
     * @example
     * ```ts
     * const res = await theme.getSpaceList();
     * // res.data.result => [{ spaceId, spaceName, bizType, ... }]
     * ```
     */
    getSpaceList(options?: GetSpaceListOptions): Promise<CloudCaptureResult<SpaceListData>>;
    /**
     * 构造并派发统一结构的业务事件（接口请求结果、api 调用、取流等通知）
     *
     * 事件载荷为 `{ name, code, msg, type, ...data }`：
     * - `name`：事件名，同时作为第一个参数传给 `emit`
     * - `code`：结果码，`type` 以 `Error` 结尾（`'httpError'` / `'streamError'`）时为 `-1`，其余为 `0`
     * - `msg`：当前语言下的提示文案，由 `i18nKey` 翻译得到；未传 `i18nKey` 时为空串
     * - `type`：事件来源分类，同 `type` 参数
     * - `data` 的字段会展开合并到载荷里（如接口结果 `data`、接口路径 `path`），同名字段会覆盖前面的 `name` / `code` / `msg` / `type`
     *
     * @param name 事件名，如 `EVENTS.http.getDeviceCapacity`
     * @param type 事件来源：`'http'` 接口请求成功、`'httpError'` 接口请求失败、`'api'` 对外 api 调用、
     *   `'stream'` 取流、`'streamError'` 取流失败、`'message'` 提示消息
     * @param data 附加到载荷上的字段，可为空
     * @param i18nKey 多语言 key，用于生成 `msg`
     * @since 3.2.0
     * @example
     * ```ts
     * theme.on(EVENTS.http.sendVoice, ({ code, msg, data, path }) => {
     *   if (code === -1) console.error(msg, path, data);
     * });
     * ```
     */
    builderEvent(name: string, type: BuilderEventType, data?: object, i18nKey?: string): void;
    /**
     * 获取 ezopen 私有流的 wss 取流地址（含 ECDH 全链路加密判定，见 api/_services.ts `_getEzopenUrlService`）
     * @param url ezopen 地址，默认当前播放地址
     * @returns wss 取流地址；接口返回错误码时为接口原始结果，请求失败为空串，未初始化 services 时为 undefined
     * @since 3.2.0
     */
    getEzopenUrlService(url?: string): Promise<string | EzvizApiResponse<any> | undefined>;
    /**
     * 获取设备能力集 https://open.ys7.com/help/678
     * @since 3.2.0
     */
    getDeviceCapacityService(): Promise<EzvizDeviceCapacity | undefined>;
    /**
     * 获取设备信息 https://open.ys7.com/help/672
     * @since 3.2.0
     */
    getDeviceInfoService(): Promise<EzvizDeviceInfo | undefined>;
    /**
     * 获取设备支持清晰度列表
     * @since 3.2.0
     */
    getDeviceSupportQualityService(): Promise<EzvizVideoLevel[] | undefined>;
    /**
     * @description 查询默认语音列表 https://open.ys7.com/help/1247
     * @param {Object} params 查询参数
     * @param {string} params.voiceName 模糊匹配语音名称（可选）
     * @param {number} params.pageStart 分页起始页，从0开始（可选）
     * @param {number} params.pageSize 分页大小，默认为10，最大为50（可选）
     * @returns {Promise<{data: Array, page: Object}>}
     * @since v3.2.0
     * @example
     * player.queryVoiceList({ pageSize: 20 }).then(res => {
     *   console.log(res.data); // 语音列表
     *   console.log(res.page); // 分页信息
     * });
     */
    queryVoiceListService(params?: IQueryVoiceParams): Promise<EzvizPageList<EzvizVoiceItem> | undefined>;
    /**
     * @description 临时语音下发（一次性自定义语音下发到设备，不保存到语音列表） https://open.ys7.com/help/1252
     * @param {File | Blob} voiceFile 语音文件，支持wav、mp3、aac格式，最大20M，最长60s
     * @param {number} channelNo 通道号，默认使用播放器配置的通道号（可选）
     * @returns {Promise<{code: number, msg: string}>}
     * @since 3.2.0
     * @example
     * player.sendVoiceOnce(audioFile).then(res => {
     *   console.log('语音下发成功');
     * }).catch(err => {
     *   console.error('语音下发失败', err);
     * });
     */
    sendVoiceOnceService(voiceFile: File | Blob, channelNo?: number): Promise<EzvizApiResponse<any> | undefined>;
    /**
     * @description 语音文件下发（指定设备播放已上传的语音文件） https://open.ys7.com/help/1253
     * @param {string} fileUrl 下载音频文件的url（从查询接口返回的url）
     * @param {number=} channelNo 通道号，默认使用播放器配置的通道号（可选）
     * @returns {Promise<{code: number, msg: string}>}
     * @since 3.2.0
     * @example
     * player.sendVoice(fileUrl).then(res => {
     *   console.log('语音下发成功');
     * }).catch(err => {
     *   console.error('语音下发失败', err);
     * });
     */
    sendVoiceService(fileUrl: string, channelNo?: number): Promise<EzvizApiResponse<any> | undefined>;
    /**
     * 镜像翻转（需设备报备对应能力集） https://open.ys7.com/help/681
     * @param command 镜像方向：0-上下, 1-左右, 2-中心
     * @since 3.2.0
     */
    postDevicePtzMirrorService(command: 0 | 1 | 2): Promise<void | undefined>;
    /**
     * 按月查询录像日历（本地存储、云存储和云录制）
     * - 本地存储 / 云存储 https://open.ys7.com/help/4329
     * - 云录制 https://open.ys7.com/help/2042
     * @param recType 录像类型 -1 云录制 1-云存储，2-本地录像，3-关联录像
     * @param month 查询的月份，格式 yyyy-MM
     * @param spaceId 云录制空间的 spaceId，仅云录制需要
     * @returns 有录像的日期列表，如 `["2025-08-14", "2025-08-16"]`
     * @since 3.2.0
     */
    getRecordMonthService(recType: -1 | 1 | 2 | 3, month: string, spaceId?: string | number): Promise<string[] | undefined>;
    /**
     * 获取 appKey（用于上报）
     * @since 3.2.0
     */
    getAppKeyService(): Promise<"" | EzvizMetaResponse<EzvizAppKeyData> | undefined>;
    /**
     * 获取设备的通道信息 https://open.ys7.com/help/1478
     * @since 3.2.0
     */
    getDeviceListService(): Promise<EzvizCameraInfo[] | undefined>;
    /**
     * 设置设备视频质量（清晰度） https://open.ys7.com/help/2286
     * @param videoLevel 清晰度等级 0-流畅 1-均衡 2-高清 3-超清 4-极清 5-3K 6-4K
     * @param clientLid 直播取流会话标识（无缝切换用）
     * @param prevVideoLevel 切换前清晰度，用于计算 adaptive 方向
     * @since 3.2.0
     */
    setVideoLevelService(videoLevel: number | string, clientLid?: string, prevVideoLevel?: number | string): Promise<(EzvizMetaResponse<any> & EzvizApiResponse<any>) | undefined>;
    /**
     * 查询设备云存储信息 https://open.ys7.com/help/1404
     * @since 3.2.0
     */
    getCloudInfoService(): Promise<EzvizCloudInfo | undefined>;
    /**
     * 获取云录制截图上传地址
     * @param fileName 截图文件名
     * @since 3.2.0
     */
    getCloudUploadUrlService(fileName: string): Promise<EzvizMetaResponse<any> | undefined>;
    /**
     * 获取取流备用地址
     * @returns `[地址个数, 接口原始 data, 归一化后的地址列表]`
     * @since 3.2.0
     */
    getStreamAddressListService(): Promise<[number, Partial<StreamAddressBackup>, (EzopenBackupAddress[] | undefined)?] | undefined>;
    /**
     * 获取云录制回放片段 https://open.ys7.com/help/2043
     * @param params 查询参数
     * @param params.begin 开始时间，格式 `YYYY-MM-DD HH:mm:ss`，不允许跨天，内部会自动转化为接口的 startTime
     * @param params.end 结束时间，格式 `YYYY-MM-DD HH:mm:ss`，不允许跨天，内部会自动转化为接口的 endTime
     * @param params.spaceId 云录制空间 ID
     * @returns 回放片段列表（时间单位：秒）
     * @since 3.2.0
     */
    getCloudRecordTimesService(params: EzvizFetchCloudRecordRecParams): Promise<EzvizFetchRecItem[] | undefined>;
    /**
     * 获取云存储回放片段 https://open.ys7.com/help/1422
     * @param params 查询参数
     * @param params.begin 开始时间（毫秒时间戳），内部会自动转化为接口的 startTime
     * @param params.end 结束时间（毫秒时间戳），内部会自动转化为接口的 endTime
     * @returns 回放片段列表（时间单位：秒，已处理时区）
     * @since 3.2.0
     */
    getCloudTimesService(params: EzvizFetchCloudRecParams): Promise<EzvizFetchRecItem[] | undefined>;
    /**
     * 获取本地回放片段 https://open.ys7.com/help/3922
     * @param params 查询参数；custom 版本与云存储共用 /api/lapp/video/by/time，按 {@link EzvizFetchCloudRecParams} 传参
     * @param params.begin 开始时间（秒级时间戳），开始结束时间需在同一天，内部会自动转化为接口的 startTime
     * @param params.end 结束时间（秒级时间戳），内部会自动转化为接口的 endTime
     * @param params.streamType 主子码流，仅本地回放支持 （3.2.0 开始支持）
     * @returns 回放片段列表（时间单位：秒，已处理时区）
     * @since 3.2.0
     */
    getLocalRecTimesService(params: EzvizFetchLocalRecParams | EzvizFetchCloudRecParams): Promise<EzvizFetchRecItem[] | undefined>;
    /**
     * 按设备获取告警消息列表 https://open.ys7.com/help/987
     * @since 3.2.0
     */
    getAlarmListService(params?: Parameters<Services['getAlarmList']>[0]): Promise<EzvizPageList<EzvizAlarmItem> | undefined>;
    /**
     * 即时云抓拍 https://open.ys7.com/help/5235
     * @since 3.2.0
     */
    captureSaveService(params: Parameters<Services['captureSave']>[0]): Promise<EzvizMetaResponse<EzvizCaptureSaveData> | undefined>;
    /**
     * 创建抓图任务（批量 / 定时抓拍计划） https://open.ys7.com/help/1390
     * @since 3.2.0
     */
    createCaptureTaskService(params: Parameters<Services['createCaptureTask']>[0]): Promise<EzvizMetaResponse<EzvizCaptureTaskData> | undefined>;
    /**
     * 查询存储空间列表 https://open.ys7.com/help/5230
     * @since 3.2.0
     */
    getSpaceListService(params?: Parameters<Services['getSpaceList']>[0]): Promise<EzvizMetaResponse<EzvizSpaceListData> | undefined>;
    /**
     * 获取播放地址 https://open.ys7.com/help/1414
     * @param params 请求参数，均可选，不传时默认取自当前播放地址 / 播放器配置
     * @param params.begin 回放开始时间，支持时间字符串和时间戳，默认取当前播放地址的 begin，内部会自动转化为接口的 startTime
     * @param params.end 回放结束时间，支持时间字符串和时间戳，默认取当前播放地址的 end，内部会自动转化为接口的 stopTime
     * @param params.playbackSpeed 回放倍速，默认取当前播放地址的 playbackSpeed
     * @param params.protocol 流播放协议：1-ezopen，2-hls，3-rtmp，4-flv，5-ll-hls，默认 5
     * @param params.type 地址类型：1-预览，2-本地录像回放，3-云存储录像回放，默认按当前播放地址判断
     * @param params.quality 视频清晰度：1-高清（主码流），2-流畅（子码流）
     * @param params.expireTime 过期时长（秒），默认按当前播放地址的 expire 计算剩余时长
     * @returns 接口原始返回 `{ code, msg, data: { id, url, expireTime } }`
     * @since 3.2.0
     * @example
     * ```typescript
     * const res = await theme.getAddressService({ begin: '20260804000000', playbackSpeed: 2 });
     * ```
     */
    getAddressService(params?: EzvizFetchAddressParams): Promise<EzvizFetchAddressResult | undefined>;
    /**
     * 获取 CDN 加速直播地址（有效期为当天 00:00:00 - 23:59:59）
     * @param params 请求参数，`appName` 必填，见 {@link EzvizFetchCDNAddressParams}
     * @returns 接口原始返回 `{ meta, data: { cdnUrl } }`
     * @since 3.2.0
     */
    getCDNLiveAddressService(params: EzvizFetchCDNAddressParams): Promise<EzvizMetaResponse<EzvizCDNAddressData> | undefined>;
    /**
     * 获取 CDN 加速回放地址（有效期为当天 00:00:00 - 23:59:59）
     * @param params 请求参数，`appName` / `begin` / `end` 必填，见 {@link EzvizFetchCDNRecordAddressParams}
     * @returns 接口原始返回 `{ meta, data: { cdnUrl } }`
     * @since 3.2.0
     */
    getCDNRecordAddressService(params: EzvizFetchCDNRecordAddressParams): Promise<EzvizMetaResponse<EzvizCDNAddressData> | undefined>;
    /**
     * 查询直播间断流信息（仅萤石直播间地址）
     * @param streamId 直播间流 ID，即播放地址里的 `sid`
     * @returns 接口原始返回 `{ meta, data: { intrCode } }`
     * @since 3.2.0
     */
    getStreamInterruptInfoService(streamId: string): Promise<EzvizMetaResponse<EzvizStreamInterruptInfo> | undefined>;
    protected _updateServicesOptions(options: Partial<ServicesOptions>): void;
}

/**
 * standard 做特殊处理
 *
 * WARN： 除了 'deviceID', 'deviceName'， 'rec', 'cloudRec', 'cloudRecord' 做特殊处理, 只能放置在顶部， 其它不做处理，如果配置渲染的有问题需要开发者自行修改
 * FIXME: 暂时不去重， 让开发者自己去修改
 */
declare const TEMPLATES: {
    readonly pcLive: IThemeData;
    readonly pcRec: IThemeData;
    readonly mobileLive: IThemeData;
    readonly mobileRec: IThemeData;
    readonly security: IThemeData;
    readonly voice: IThemeData;
};
/**
 * 模板类型名
 */
type ThemeTemplateType = keyof typeof TEMPLATES;

/**
 * 设备序列号控件配置项
 */
interface DeviceOptions extends Omit<ControlOptions, 'tagName'> {
    deviceName?: string;
}

/**
 * 时间选择器控件配置项
 */
interface TimePickerControlOptions extends Omit<ControlOptions, 'tagName'>, Partial<Omit<TimePickerOptions, 'locale' | 'locales'>> {
    onPanelChange?: (open: boolean, time: string) => void;
}

/**
 * 回放下拉控件配置项
 */
interface RecDropdownOptions extends Omit<ControlOptions, 'tagName'> {
    /** 当前回放类型 */
    playType?: ThemeRecType;
    /** 回放支持类型(['rec', 'cloudRec', 'cloudRecord']) @since 3.1.8 */
    list?: ThemeRecType[];
    /**
     * 回放类型选择回调
     */
    onChange?: (type: ThemeRecType) => void;
}

/**
 * 主题配置项
 *
 * Theme configuration options
 * @since 0.0.1
 */
interface ThemeOptions {
    /** 容器 @since 0.0.1 */
    container: HTMLElement | (() => HTMLElement);
    /** 播放地址 */
    url?: string;
    /**
     * 主题数据, 当值为 null 时不展示主题。
     * 优先级低于 template, 不推荐同时使用
     * @since 0.0.1
     */
    themeData?: IThemeData | null;
    /**
     * 播放器模板，支持开放平台官方和自定义的模板(https://open.ys7.com/console/ezuikit/template.html)
     * 优先级高于 themeData, 不推荐同时使用
     * @since 0.0.1
     */
    template?: ThemeTemplateType | string;
    /** 主题样式类 @since 0.0.1 */
    className?: string;
    /** 是否自动播放 @since 0.0.1 */
    autoPlay?: boolean;
    /**
     * 播放器类型
     *
     * | ezopen |  flv       |    hls   |  mp4    |  ezhls  |
     * |:------:|:----------:|:--------:|:-------:|:-------:|
     * | 私有流  | flv 标准流  | hls标准流 |   mp4   | ezopen hls 标准流 |
     * @since 0.0.1
     */
    type: 'ezopen' | 'flv' | 'hls' | 'mp4' | 'ezhls';
    /** 播放器容器宽度，默认容器宽度，不要设置为 0 @since 0.0.1 */
    width?: number | string;
    /** 播放器容器高度，默认容器宽度， 不要设置为 0 @since 0.0.1 */
    height?: number | string;
    /** 语言包  'zh' | 'en' @since 0.0.1 */
    language?: 'zh' | 'en' | string;
    /** 指定回放的空间ID @since 0.0.1, 优先级小于 url 中的 spaceId */
    spaceId?: string | number;
    /** 静音, 优先级小于 volumeOptions.muted */
    muted?: false;
    /** 音量大小， 优先级小于 volumeOptions.volume  */
    volume?: number;
    /**
     * 语言包
     * {
     *  zh: {},
     *  en: {}
     * }
     * @since 0.0.1
     */
    locales?: Record<string, I18nTranslation>;
    /** 画面填充模式, 默认 0 */
    scaleMode: (typeof THEME_SCALE_MODE_TYPE)[keyof typeof THEME_SCALE_MODE_TYPE];
    /** 日志配置 @since 0.0.1 */
    loggerOptions?: LoggerOptions;
    /** 双击全屏, 默认true, 仅 PC 支持 @since 0.0.1 */
    dblClickFullscreen?: boolean;
    /** 加载动画控件配置, 默认 undefined, 设置 null 不渲染控件 @since 0.0.1 */
    loadingOptions?: OmitControlOptions<LoadingOptions> | null;
    /** 暂停控件配置, 默认 undefined, 设置 null 不渲染控件 @since 0.0.1 */
    pauseOptions?: OmitControlOptions<PauseOptions> | null;
    /** 消息控件配置，默认 undefined, 设置 null 不渲染控件@since 0.0.1  */
    messageOptions?: OmitControlOptions<MessageOptions> | null;
    /** 封面控件配置， 默认 undefined, 设置 null 不渲染控件 @since 0.0.1 */
    posterOptions?: OmitControlOptions<PosterOptions> | null;
    /** 设备信息控件配置，默认 undefined, 设置 null 不渲染控件 @since 0.0.1 */
    deviceOptions?: OmitControlOptions<DeviceOptions> | null;
    /** 播放控件配置，默认 undefined, 设置 null 不渲染控件 @since 0.0.1 */
    playOptions?: OmitControlOptions<PlayOptions> | null;
    /** 音量控件配置， 设置 null 不渲染控件 @since 0.0.1 */
    volumeOptions?: OmitControlOptions<VolumeOptions> | null;
    /** 截图控件配置， 设置 null 不渲染控件 @since 0.0.1 */
    capturePictureOptions?: OmitControlOptions<CapturePictureOptions> | null;
    /** 清晰度控件配置， 设置 null 不渲染控件 @since 0.0.1 */
    definitionOptions?: OmitControlOptions<DefinitionOptions> | null;
    /** 云台控件配置， 设置 null 不渲染控件 @since 0.0.1 */
    ptzOptions?: OmitControlOptions<PtzOptions> | null;
    /** 回放类型控件配置， 设置 null 不渲染控件 @since 0.0.1 */
    recOptions?: OmitControlOptions<RecOptions> | null;
    /** 录像列表控件配置， 设置 null 不渲染控件 @since 3.1.1 */
    recListOptions?: OmitControlOptions<RecListOptions> | null;
    /** 录制控件配置 ，设置 null 不渲染控件 @since 0.0.1 */
    recordOptions?: OmitControlOptions<RecordOptions> | null;
    /**
     * 倍速控件配置， 设置 null 不渲染控件 @since 0.0.1
     *
     * `list` 为通用倍速列表（只配 list 时三类回放倍速一致）；
     * `rec` / `cloudRec` / `cloudRecord` 可按回放类型单独配置，优先级高于 `list`。
     */
    speedOptions?: OmitControlOptions<SpeedOptions> | null;
    /** 码流切换控件（主码流 / 子码流）配置， 设置 null 不渲染控件 */
    streamTypeOptions?: OmitControlOptions<StreamTypeOptions> | null;
    /** 对讲控件配置， 设置 null 不渲染控件 @since 0.0.1 */
    talkOptions?: OmitControlOptions<TalkOptions> | null;
    /** 缩放控件配置， 设置 null 不渲染控件 @since 0.0.1 */
    zoomOptions?: OmitControlOptions<ZoomOptions> | null;
    /** 全屏控件配置， 设置 null 不渲染控件 @since 0.0.1 */
    fullscreenOptions?: OmitControlOptions<FullscreenOptions> | null;
    /** 全局全屏控件配置， 设置 null 不渲染控件 @since 0.0.1 */
    globalFullscreenOptions?: OmitControlOptions<GlobalFullscreenOptions> | null;
    /** 日历控件配置， 设置 null 不渲染控件 @since 0.0.1 */
    dateOptions?: any;
    /** 时间控件配置，  设置 null 不渲染控件 @since 3.0.3 */
    timeOptions?: OmitControlOptions<TimePickerControlOptions> | null;
    /** 时间轴控件配置， 设置 null 不渲染控件 @since 0.0.1 */
    timeLineOptions?: any | null;
    /** 回放片段进度条配置（移动端，仅在设置了播放区间时渲染）， 设置 null 不渲染控件 */
    segmentProgressOptions?: any | null;
    /** 下拉回放类型控件配置， 设置 null 不渲染控件 */
    recDropdownOptions?: OmitControlOptions<RecDropdownOptions> | null;
    /** 初始化开始回调, 在内部可以添加事件(Control.beforeMountControls, Control.mountedControls)监听 */
    onInitializing?: (theme: Theme) => void;
    /**
     * 移动端扩展 仅针对 ezopen 有效 @since 0.0.1 (2025-08-01),  默认 true, 当值为 null 不展示扩展
     * 意味着在移动端 header/footer 仅展示部分控件, 由扩展区域显示更多按钮
     *
     * 注意⚠️：当支持扩展配置时。每一个页面最多只支持一个实例， 不然会有冲突， 如果想要多播放器窗口需要 设置 `mobileExtendConfig` 为 null
     */
    mobileExtendOptions?: {
        /**
         * 在扩展中展示的控件，（在扩展中展示， 就不会在 header/footer 中展示， 全屏除外）
         * 默认值: ["timeLine", "date"]）
         */
        controls: string[] | null;
    } | null;
    /**
     * 默认 false
     * @deprecated
     * 9.x 开始弃用  请使用 timeLineOptions: null来关闭时间轴
     */
    disabledTimeLine?: boolean;
    /** 是萤石的播放地址，默认 true, 仅对标准流很有效 */
    isEzviz?: boolean;
    /** 基线 和 定制 */
    sdkType: 'base' | 'custom';
    /**
     * 设备时区偏移（小时），中国以外的地区设备才需要。
     * ezopen 回放地址会自动追加为 `timeZone` 参数；播放地址里没有该参数时（如 flv / hls 标准流），回放片段查询按此配置换算
     */
    timeZone?: number;
    [kye: string]: any;
}
interface ThemeVideoInfo {
    width?: number;
    height?: number;
    [key: string]: any;
}
/**
 * 回放控件类型
 * @since 0.0.1
 */
type ThemeRecType = 'rec' | 'cloudRec' | 'cloudRecord';
/**
 * 播放类型：直播 + 三种回放
 *
 * 由播放地址解析得出，见 `theme.playType`。控件通过静态属性 `supportedPlayTypes`
 * 声明自己支持哪几种，渲染时不匹配只提示、不阻止渲染。
 *
 * 类型直接由 `PLAY_TYPES` 常量推导，保证值与类型不会漂移。
 * @since 3.1.7
 */
type ThemePlayType = (typeof PLAY_TYPES)[number];

/**
 * 控件基类配置项
 */
interface ControlOptions {
    /** 播放器窗口节点 */
    rootContainer?: HTMLElement;
    /** 挂载节点 player id, 默认挂载 body 上 */
    getPopupContainer?: () => HTMLElement;
    /** 给控件新增自定义类名 */
    className?: string;
    /** 语言数据 */
    locale?: Record<string, string>;
    /** 样式类后缀 */
    classNameSuffix?: string;
    /**
     * 渲染节点标签
     */
    tagName?: 'div' | 'span';
    /**
     * 控件类型, 默认 button
     */
    controlType?: 'button' | 'text' | 'block';
    /**
     * 当前语言
     */
    language?: 'zh' | 'en' | string;
    /**
     * 所有语言数据
     */
    locales?: Record<string, Record<string | number, string | number>>;
    /** 点击控件时的回调 */
    onClick?: (e: Event) => void;
    /**
     * ----- 播放器状态 -------
     * 窗口宽度  width?: number;
     * 窗口高度  height?: number;
     * 窗口是否全屏 isCurrentFullscreen?: boolean;
     * 播放器是否播放中 playing?: boolean;
     * 音量大小 0-1  volume?: number;
     * 是否静音 muted?: boolean;
     * 浏览器选择角度 0 ｜ 90 ｜ 180 ｜ 270  orientationAngle?: number;
     * 所有属性值来源 constant.ts 文中 THEME_PROPS
     */
    props?: Record<(typeof THEME_PROPS)[number], number | string | Record<string, unknown>>;
    [key: string]: any;
}
/**
 * 不允许控件自定义的参数
 * @typeParam T - 控件配置项
 */
type OmitControlOptions<T extends ControlOptions> = Omit<T, 'rootContainer' | 'getPopupContainer' | 'classNameSuffix' | 'type' | 'tagName' | 'controlType'>;
/**
 * 控件基类
 * @category Control
 * @example
 * ```ts
 * // 创建控件
 * class MyControl extends Control {}
 *
 * // 使用控件
 * const myControl = new MyControl({})
 * ```
 */
declare class Control extends EventEmitter {
    /**
     * 该控件支持的播放类型，默认全支持
     *
     * 子类用 `static supportedPlayTypes = [...]` 覆盖来收窄范围。声明是**静态**的，
     * 因为渲染层需要在不实例化控件的前提下就能读到（`Controls[iconId].supportedPlayTypes`）。
     *
     * 渲染时会拿 `theme.playType` 与此比对，不匹配只发警告与 `Control.unsupportedPlayType`
     * 事件，**不阻止渲染**，控件照常创建、照常可交互，行为是否生效由 SDK 层与设备能力决定。
     *
     * @since 3.1.7
     * @example
     * ```ts
     * class MyControl extends Control {
     *   // 只在云存储回放下有意义
     *   static supportedPlayTypes: ThemePlayType[] = ['cloudRec'];
     * }
     * ```
     */
    static supportedPlayTypes: ThemePlayType[];
    /**
     * 判断某个播放类型是否被本控件支持
     *
     * @param playType 播放类型；传空串（无法从地址判定）时一律返回 `true`，避免误报
     * @returns 是否支持
     * @since 3.1.7
     */
    static supportsPlayType(playType: ThemePlayType | ''): boolean;
    /**
     * 控件内容
     */
    $container: HTMLDivElement | HTMLSpanElement;
    /**
     * 控件挂载的节点
     */
    $popupContainer: HTMLElement;
    /** 具体语言对应的值 */
    locale: Record<string | number, string> | null;
    protected __options: ControlOptions;
    protected _disabled: boolean;
    protected _active: boolean;
    private readonly _camelCaseName;
    /** click 监听引用，销毁时需显式移除 */
    private _onClickHandler;
    constructor(options: Partial<ControlOptions>);
    /**
     * 是否激活
     */
    get active(): boolean;
    set active(active: boolean);
    /**
     * 是否禁用
     */
    get disabled(): boolean;
    set disabled(disabled: boolean);
    /**
     * 重置整个控件
     */
    reset(hide?: boolean): void;
    /**
     * 重置控件挂载节点
     * @param popupContainer 重新挂载的节点
     * @param append 添加的方式， 默认 append
     * @param element 当 append = before 时 需要 element, 插入 element 前
     *
     * |     prepend   |    append       |
     * |:-------------:|:---------------:|
     * | 插入第一个位置 |    追加在末尾    |
     */
    resetPopupContainer(popupContainer: Element, append?: 'prepend' | 'append' | 'before', element?: Element): void;
    /**
     * 隐藏整个控件
     */
    hide(): void;
    /**
     * 销毁控件
     */
    destroy(): void;
    protected _updateDisabledState(disabled: boolean): void;
    protected _updateActiveState(active: boolean): void;
    /**
     * 当点击 Control 时 触发子类的 _onControlClick
     */
    protected _onClick(): void;
    protected _onDBlClick(e: Event): void;
    /**
     * 点击 Control 控件触发
     * @param {Event} e
     * @returns {void}
     */
    protected _onControlClick(e: Event): void;
}

/**
 * 加载动画控件配置项
 */
interface LoadingOptions extends Omit<ControlOptions, 'tagName' | 'controlType'> {
    /**
     * 自定义加载动画的 HTML 结构, 当 theme.loading = true 时展示
     *
     * @remarks 返回值会原样写入 `innerHTML`，**不做转义**。拼接的数据需由调用方
     * 保证来源可信；若内容可能来自接口、设备或用户输入，请先自行转义。
     * @returns HTML 字符串
     */
    render?: () => string;
}
/**
 * 加载动画控件
 * @category Control
 */
declare class Loading extends Control {
    private readonly _options;
    constructor(options?: Partial<LoadingOptions>);
    private _html;
    /**
     * 动画展示
     *
     * @remarks `html` 会原样写入 `innerHTML`，**不做转义**，仅接受可信内容。
     * @param html 自定义动画内容, 如果不存在则使用默认动画
     */
    show(html?: string): void;
    /**
     * 隐藏动画
     */
    hide(): void;
}

/**
 * 屏幕旋转方向
 */
interface ScreenOrientation {
    /** 旋转角度 0 | 90 | 180 | 270, 浏览器不支持 screen.orientation 或 window.orientation 时，仅支持 0 | 90 */
    angle: number;
    /** */
    type: 'landscape' | 'landscape-primary' | 'landscape-secondary' | 'portrait' | 'portrait-primary' | 'portrait-secondary' | 'unknow';
}
/**
 * 屏幕旋转方向变化回调
 */
type OrientationChangeCallback = (orientation: ScreenOrientation) => void;
/**
 * 清除屏幕旋转监听
 */
type CleanUpScreenOrientationFun = () => void;
/**
 * 清除resize 监听
 */
interface CleanUpResizeObserver {
    /** 取消 */
    unobserve: () => void;
    /** 断开 */
    disconnect: () => void;
}
/**
 * 工具类
 * @category Util
 */
declare class Utils {
    /**
     * 判断是否是移动端, (iPadOS 13+ 移除了 "iPad" 标识)
     * @example
     * ```ts
     * Utils.isMobile  // true | false
     * ```
     */
    static isMobile: boolean;
    /**
     * 监听手机旋转, 参考 {@link https://developer.mozilla.org/zh-CN/docs/Web/API/Screen/orientation}
     * @param {OrientationChangeCallback} change 手机旋转回调
     * @returns {[ScreenOrientation, CleanUpScreenOrientationFun]} [第一次的结果， 事件移除]
     *
     * @example
     * ```ts
     * const [orientation, cleanUp] = Utils.orientationEventListener((orientation) => {
     *    console.log("orientation", orientation)
     * })
     *
     * console.log("orientation", orientation)
     * // 清除监听
     * cleanUp()
     * ```
     */
    static orientationEventListener(change?: OrientationChangeCallback): [ScreenOrientation, CleanUpScreenOrientationFun];
    /**
     * 监听节点尺寸变化， 参考 {@link https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver}
     * @param {Element} node
     * @param callback
     * @returns {CleanUpResizeObserver}
     * @example
     * ```ts
     * const [unobserve, disconnect] = Utils.resizeObserver(node, (entries, observer) => {});
     *
     * // 移除监听
     * unobserve()
     * ```
     */
    static resizeObserver(node: Element, callback?: (entries: ResizeObserverEntry[], observer: ResizeObserver) => void): CleanUpResizeObserver;
}

/**
 * 事件类型定义
 *
 * 本文件根据 `src/constant.ts` 的 `EVENTS` 常量生成对应的「事件名」与「事件载荷」类型，
 * 用于给 `theme.on / once / off / emit` 提供类型提示。
 *
 * - 事件名（`ThemeEventName` 等）直接由 `typeof EVENTS` 推导，随 `EVENTS` 自动同步。
 * - 事件载荷（`ThemeEventMap`）依据事件文档与实际 emit 现场（`_bindEventemitter.ts` 等）手写，
 *   键为事件的「字符串值」（如 `'play'`、`'Control.play'`、`'Theme.destroyed'`），
 *   与 `EVENTS.play` / `EVENTS.control.play` / `EVENTS.theme.destroyed` 的取值一致。
 * - 文件末尾有编译期断言：保证 `EVENTS` 中的每个事件都在 `ThemeEventMap` 中声明了类型，
 *   反之亦然（防止漏写或写错事件名）。
 *
 * @remarks 载荷见 guide/events.md。标注为 `unknown` 的表示载荷由内核/插件决定，未固定结构。
 */

type EventsConst = typeof EVENTS;
/** 对外事件名，如 `'play'`、`'volumechange'`、`'message'` */
type ThemeOuterEventName = EventsConst[Exclude<keyof EventsConst, 'control' | 'theme'>];
/** 控件事件名，如 `'Control.play'`、`'Control.volumechange'` */
type ControlEventName = EventsConst['control'][keyof EventsConst['control']];
/** 主题生命周期事件名，如 `'Theme.destroyed'` */
type ThemeLifecycleEventName = EventsConst['theme'][keyof EventsConst['theme']];
/** 所有事件名（对外 + 控件 + 生命周期）的并集 */
type ThemeEventName = ThemeOuterEventName | ControlEventName | ThemeLifecycleEventName;
/** 屏幕旋转角度 */
type OrientationAngle = 0 | 90 | 180 | 270;
/** 全屏状态变化载荷 */
interface FullscreenChangeInfo {
    /** 当前容器是否处于全局全屏 */
    isCurrentFullscreen: boolean;
    /** 是否浏览器全屏 */
    isFullscreen: boolean;
    /** 是否移动端（移动端为模拟全屏） */
    isMobile: boolean;
    /** 旋转角度 */
    orientationAngle?: OrientationAngle;
}
/** 容器尺寸变化载荷 */
interface ResizeInfo {
    width: number;
    height: number;
    isCurrentFullscreen?: boolean;
    orientationAngle?: OrientationAngle;
}
/** 音频信息（用于解禁音量控件） */
interface AudioInfo {
    /** 标准流编码类型 */
    encType?: string;
    /** 私有流音频格式名 */
    audioFormatName?: string;
    [key: string]: unknown;
}
/** 视频信息（用于重渲染画面） */
interface VideoInfo {
    width: number;
    height: number;
    [key: string]: unknown;
}
/** 云台错误信息 */
interface PtzErrorInfo {
    code: string | number;
    localeKey?: string;
    msg?: string;
    [key: string]: unknown;
}
/**
 * 事件名 → 监听器签名 的映射表。
 *
 * 可用于给 eventemitter3 提供泛型：`class Theme extends EventEmitter<ThemeEventMap>`，
 * 或直接查询单个事件的处理函数类型：`ThemeEventMap['play']`。
 */
/**
 * 各控件初始化完成事件的载荷（统一为无参）。
 *
 * 由 `CONTROL_INIT_EVENTS` 的值映射生成，新增控件只需往常量里加一项，
 * 类型侧自动跟上，无需在 {@link ThemeEventMap} 里手写。
 */
type ControlInitEventMap = {
    [K in (typeof CONTROL_INIT_EVENTS)[keyof typeof CONTROL_INIT_EVENTS]]: () => void;
};
interface ThemeEventMap extends ControlInitEventMap {
    /** 加载状态变化 */
    loading: (loading: boolean) => void;
    /** 播放/暂停状态变化 */
    play: (playing: boolean) => void;
    /** 首帧显示（内部会解禁控件） */
    firstFrameDisplay: () => void;
    /** 截图 */
    capturePicture: () => void;
    /** 音量变化 */
    volumechange: (volume: number, muted: boolean) => void;
    /** 缩放倍数变化 */
    zoomChange: (zoom: number) => void;
    /** 缩放状态变化（true 可缩放 / false 禁止） */
    zoomingChange: (zooming: boolean) => void;
    /** 缩放平移改变（载荷来自缩放插件） */
    zoomTranslateChange: (translate: unknown) => void;
    /** 音频信息 */
    audioInfo: (info: AudioInfo) => void;
    /** 视频信息 */
    videoInfo: (info: VideoInfo) => void;
    /** 音频编码不支持（仅标准流 flv） */
    audioCodecUnsupported: (flag: boolean) => void;
    /** 进入全屏 */
    fullscreen: () => void;
    /** 退出全屏 */
    exitFullscreen: () => void;
    /** 全屏状态变化 */
    fullscreenChange: (info: FullscreenChangeInfo) => void;
    /** 容器尺寸变化 */
    resize: (info: ResizeInfo) => void;
    /** 屏幕旋转方向变化 */
    orientationChange: (angle: OrientationAngle) => void;
    /** 切换主题 */
    changeTheme: (themeData: IThemeData | null) => void;
    /** 回放类型切换 */
    recTypeChange: (type: string) => void;
    /** 播放类型切换，type 为切换后的播放类型：'live' | 'rec' | 'cloudRec' | 'cloudRecord' */
    playTypeChange: (type: string) => void;
    /** 切换清晰度 */
    definitionChange: (definition: number, item?: DefinitionItem) => void;
    /** 播放速度切换 */
    speedChange: (speed: number, item?: unknown) => void;
    /** 码流切换（1: 主码流, 2: 子码流） */
    streamTypeChange: (streamTypeIn: 1 | 2) => void;
    /** 支持主子码流切换：收到后才展示码流切换控件；省略载荷或 true 表示支持，false 表示不支持 */
    supportLocalRecordStreamType: (support?: boolean, streamTypeIn?: 1 | 2) => void;
    /** 录制状态变化 */
    recordingChange: (recording: boolean) => void;
    /** 对讲状态变化 */
    talkingChange: (talking: boolean) => void;
    /** 麦克风音量变化（高频） */
    talkVolumeChange: (value: number) => void;
    /** 语音广播状态变化 */
    broadcastPanelChange: (active: boolean) => void;
    /** AI 对话框状态变化 */
    aichatChange: (active: boolean) => void;
    /** 直播模式切换 */
    liveChange: () => void;
    /** 回放下拉选择变化 */
    recDropdownChange: (type: string) => void;
    /** 录像列表面板状态变化 */
    recListChange: (active: boolean) => void;
    /** 告警消息面板状态变化 */
    alarmMessageChange: (active: boolean) => void;
    /** 动态切换日志配置 */
    setLoggerOptions: (options: LoggerOptions) => void;
    /** 回放片段 */
    records: (records: unknown) => void;
    /** 云台速度变化 */
    ptzSpeedChange: (speed: number) => void;
    /** 设置清晰度列表 */
    setVideoLevelList: (list: DefinitionItem[]) => void;
    /** 当前清晰度 */
    currentVideoLevel: (item: DefinitionItem | number, level: number) => void;
    /** 当前是否自动清晰度 */
    currentVideoLevelAuto: (auto: boolean) => void;
    /** 设置全天回放片段（高频） */
    setAllDayRecTimes: (data: {
        list: unknown[];
    }) => void;
    /** OSD 时间（高频） */
    getOSDTime: (time: {
        data: number;
    }) => void;
    /** 统一消息提示入口（duration 单位秒） */
    message: (message: string, type: string, duration?: number) => void;
    /**
     * 控件不支持当前播放类型（仅提示，控件仍会渲染）
     *
     * @param iconId 控件 iconId
     * @param playType 当前播放类型
     * @param supportedPlayTypes 该控件声明支持的播放类型
     */
    'Control.unsupportedPlayType': (iconId: string, playType: ThemePlayType, supportedPlayTypes: ThemePlayType[]) => void;
    /** 控件挂载前 */
    'Control.beforeMountControls': () => void;
    /** 控件挂载完成 */
    'Control.mountedControls': () => void;
    /** 控件卸载前 */
    'Control.beforeUnmountControls': () => void;
    /** 控件卸载完成 */
    'Control.unmountedControls': () => void;
    /** Header/Footer 显隐变化 */
    'Control.controlsBarOpenChange': (open: boolean) => void;
    /** Header 更多按钮列表变化 */
    'Control.headerMoreShowControlsChange': (show: boolean) => void;
    /** Header 更多面板显隐 */
    'Control.headerMorePanelOpenChange': (open: boolean) => void;
    /** Footer 更多按钮列表变化 */
    'Control.footerMoreShowControlsChange': (show: boolean, controls?: unknown[]) => void;
    /** Footer 更多面板显隐 */
    'Control.footerMorePanelOpenChange': (open: boolean) => void;
    /** 点击播放/暂停 */
    'Control.play': (playing: boolean, from?: unknown) => void;
    'Control.playDestroy': () => void;
    'Control.capturePicture': (options?: unknown) => void;
    'Control.capturePictureResult': (result: unknown) => void;
    'Control.capturePictureDestroy': () => void;
    'Control.volumechange': (volume: number, muted: boolean) => void;
    'Control.volumePanelOpenChange': (open: boolean, volume: number, muted: boolean) => void;
    'Control.volumeDestroy': () => void;
    'Control.ptzPanelOpenChange': (open: boolean) => void;
    'Control.ptzSpeedChange': (speed: number) => void;
    'Control.ptzError': (info: PtzErrorInfo) => void;
    'Control.ptzDestroy': () => void;
    'Control.recordingChange': (recording: boolean) => void;
    'Control.recordDestroy': () => void;
    'Control.talkingChange': (talking: boolean) => void;
    'Control.talkError': (info: unknown) => void;
    'Control.talkDestroy': () => void;
    'Control.broadcastPanelChange': (active: boolean) => void;
    'Control.broadcastDestroy': () => void;
    'Control.broadcastVoiceListChange': (voiceList: Array<{
        voiceName: string;
        fileUrl: string;
        duration: number;
    }>) => void;
    'Control.broadcastApiResult': (result: {
        api: 'queryVoiceList' | 'sendVoice' | 'sendVoiceOnce';
        success: boolean;
        code: string;
        msg: string;
        data?: unknown;
    }) => void;
    'Control.broadcastVoiceRecorded': (data: {
        voiceFile: Blob;
        deviceSerial: string;
        channelNo?: string | number;
    }) => void;
    'Control.broadcastRecordStart': () => void;
    'Control.broadcastRecordStop': () => void;
    'Control.broadcastRecordComplete': (voiceFile: Blob) => void;
    'Control.aichatChange': (active: boolean) => void;
    'Control.aichatDestroy': () => void;
    'Control.liveChange': () => void;
    'Control.liveDestroy': () => void;
    'Control.recDropdownChange': (type: string) => void;
    'Control.recDropdownDestroy': () => void;
    'Control.alarmMessageChange': (active: boolean) => void;
    'Control.alarmMessageDestroy': () => void;
    'Control.recTypeChange': (type: string) => void;
    'Control.recDestroy': () => void;
    'Control.recListChange': (active: boolean) => void;
    'Control.recListCardClick': (section: unknown, index: number, sections: unknown[]) => void;
    'Control.recListDestroy': () => void;
    'Control.definitionChange': (definition: number, item?: DefinitionItem) => void;
    'Control.definitionList': (list: DefinitionItem[]) => void;
    'Control.definitionPanelOpenChange': (open: boolean, definition: number, item?: DefinitionItem) => void;
    'Control.definitionDestroy': () => void;
    'Control.speedChange': (speed: number, item?: unknown) => void;
    'Control.speedPanelOpenChange': (open: boolean, speed: number, item?: unknown) => void;
    'Control.speedDestroy': () => void;
    'Control.streamTypeChange': (streamTypeIn: 1 | 2, item?: unknown) => void;
    'Control.streamTypePanelOpenChange': (open: boolean, streamTypeIn: 1 | 2, item?: unknown) => void;
    'Control.streamTypeDestroy': () => void;
    'Control.zoomChange': (zoom: number) => void;
    'Control.zoomPanelOpenChange': (open: boolean) => void;
    'Control.zoomDestroy': () => void;
    'Control.fullscreenDestroy': () => void;
    'Control.globalFullscreenDestroy': () => void;
    'Control.deviceDestroy': () => void;
    'Control.datePanelOpenChange': (open: boolean, date: Date) => void;
    'Control.dateChange': (date: Date) => void;
    'Control.dateMonthChange': (dates: string[]) => void;
    /** 日历面板展示的月份变化，`month` 格式 `YYYY-MM` */
    'Control.datePanelMonthChange': (date: Date, month: string) => void;
    /** 日历面板展示的年份变化，`year` 格式 `YYYY` */
    'Control.datePanelYearChange': (date: Date, year: string) => void;
    /** 日历控件销毁 */
    'Control.dateDestroy': () => void;
    'Control.timePanelOpenChange': (open: boolean, time: string) => void;
    'Control.timeChange': (time: string) => void;
    'Control.timeLineChange': (date: Date | string) => void;
    'Control.timeLinePanelOpenChange': (open: boolean) => void;
    'Control.timeLineDestroy': () => void;
    'Control.posterDestroy': () => void;
    'Control.loadingDestroy': () => void;
    'Control.messageDestroy': () => void;
    'Control.contentDestroy': () => void;
    'Control.contentRerender': (info: unknown) => void;
    'Theme.beforeDestroy': () => void;
    'Theme.destroyed': () => void;
    'Theme.mobileExtendDestroy': () => void;
    'Theme.recFooterDestroy': () => void;
}
/** 单个事件的监听器类型，如 `ThemeEventHandler<'volumechange'>` */
type ThemeEventHandler<K extends ThemeEventName> = K extends keyof ThemeEventMap ? ThemeEventMap[K] : (...args: unknown[]) => void;
/** 单个事件的参数元组，如 `ThemeEventArgs<'volumechange'>` = `[number, boolean]` */
type ThemeEventArgs<K extends ThemeEventName> = K extends keyof ThemeEventMap ? Parameters<ThemeEventMap[K]> : unknown[];

export { CONTROL_INIT_EVENTS, Control, EVENTS, Fullscreen, Loading, Message, Play, Poster, Rec, Theme, Utils, Volume };
export type { AudioInfo, CaptureCameraData, CaptureCameraOptions, CleanUpResizeObserver, CleanUpScreenOrientationFun, CloudCaptureResult, ControlEventName, ControlInitEventMap, ControlItem, ControlOptions, CreateCaptureTaskOptions, FooterOptions, FullscreenChangeInfo, FullscreenOptions, GetSpaceListOptions, HeaderOptions, IThemeData, IThemeDataItem, LoadingOptions, MessageOptions, OrientationAngle, PlayOptions, PosterOptions, PtzErrorInfo, RecOptions, ResizeInfo, ScreenOrientation, SpaceInfo, SpaceListData, ThemeEventArgs, ThemeEventHandler, ThemeEventMap, ThemeEventName, ThemeLifecycleEventName, ThemeOptions, ThemeOuterEventName, VideoInfo, VolumeOptions };
