import EventEmitter from 'eventemitter3';
import Picker from '@skax/picker';
import I18n, { I18nTranslation } from '@ezuikit/utils-i18n';
import { LoggerCls, LoggerOptions } from '@ezuikit/utils-logger';
import { BasePtzOptions } from '@ezuikit/control-ptz';
import Zoom from '@ezuikit/control-zoom';
import { ThemeOptions as ThemeOptions$1 } from '@/interface';
import { TimeLineTimeSection } from '@ezuikit/control-time-line';

/** 填充模式 */
declare const THEME_SCALE_MODE_TYPE: {
    /** 画面完全填充canvas区域,画面会被拉伸 */
    readonly full: 0;
    /** 画面做等比缩放后,高或宽对齐canvas区域,画面不被拉伸,但有黑边 */
    readonly auto: 1;
    /** 视频画面做等比缩放后,完全填充canvas区域,画面不被拉伸,没有黑边,但画面显示不全 */
    readonly fullAuto: 2;
};
declare const THEME_PROPS: readonly ["width", "height", "playing", "volume", "muted", "loading", "recType", "isCurrentFullscreen", "orientationAngle", "zooming", "zoom", "recording", "recordList", "speed", "urlInfo", "videoLevelList", "videoLevel", "recMonth"];

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
     * @param html 自定义动画内容, 如果不存在则使用默认动画
     */
    show(html?: string): void;
    /**
     * 隐藏动画
     */
    hide(): void;
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
 * Header/Footer 的父组件
 */
interface ComponentOptions {
    /** 挂载节点 player id, 默认挂载 body 上 */
    getPopupContainer?: () => HTMLElement;
    className?: string;
    color?: string;
    activeColor?: string;
    backgroundColor?: string;
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
 * Header options
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
    picker: Picker | null;
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
interface FullscreenChangeInfo {
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
type FullscreenChange = (info: FullscreenChangeInfo) => void;
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

interface FullscreenOptions extends Omit<ControlOptions, 'tagName'> {
    /**
     * 全屏改变
     * @param info FullscreenChangeInfo 全屏信息
     */
    onChange?: (info: FullscreenChangeInfo) => void;
}
/**
 * 全屏控件
 * @category Control
 */
declare class Fullscreen extends Control {
    protected readonly options: FullscreenOptions;
    isCurrentFullscreen: boolean;
    protected _fullscreenUtil: Fullscreen$1 | null;
    protected readonly _$rootContainer: HTMLElement;
    constructor(options: FullscreenOptions);
    /**
     * 销毁
     */
    destroy(): void;
    protected _render(): void;
    protected _fullscreenChange(info: FullscreenChangeInfo): void;
    /**
     * 点击 Control 会触发
     */
    protected _onControlClick(): void;
    private _event;
}

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
/** 日期选择 */
 | 'date'
/** 时间轴 */
 | 'timeLine';
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
     * 是否渲染 0 否 1 是 默认是 0
     */
    isrender: 0 | 1;
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
    /** 自定义当前选中的 label 内容 render  */
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
 * 录制控件配置项
 */
interface RecordOptions extends Omit<ControlOptions, 'tagName'> {
    /**
     * 最长录制时长, 单位秒, 默认 3600 秒 (1 小时), 注意录制过程中会占用浏览器内存, 请根据实际情况进行配置
     * @default 3600
     */
    maxDuration?: number;
}

type SpeedOptions = SelectOptions;

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

/**
 * 内容区域配置项
 */
interface ContentOptions {
    /** 获取容器 */
    getContainer: () => HTMLElement;
    scaleMode: ThemeOptions$1['scaleMode'];
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
    private _rerender;
    setScaleMode(scaleMode?: ThemeOptions$1['scaleMode']): void;
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
    private readonly _$siblingContainer;
    constructor($siblingContainer: HTMLElement);
    render(): void;
    destroy(): void;
}

interface RecFooterOptions {
    hasDatePicker?: boolean;
}
declare class RecFooter extends EventEmitter {
    $container: HTMLElement;
    $popupContainer: HTMLElement;
    $timeLineContainer: HTMLElement;
    $datePickerContainer: HTMLElement;
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
    }>;
    constructor(options: MoreOptions);
    private _render;
    /**
     * 添加
     * @param control
     */
    add(key: string, part: 'left' | 'right', control: Control): void;
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
        readonly videoInfo: "videoInfo"; /** 版本号 @since 0.0.1 */
        readonly firstFrameDisplay: "firstFrameDisplay";
        readonly fullscreen: "fullscreen";
        readonly exitFullscreen: "exitFullscreen";
        readonly fullscreenChange: "fullscreenChange";
        readonly resize: "resize";
        readonly orientationChange: "orientationChange";
        readonly audioCodecUnsupported: "audioCodecUnsupported";
        readonly changeTheme: "changeTheme";
        readonly recTypeChange: "recTypeChange";
        readonly definitionChange: "definitionChange";
        readonly speedChange: "speedChange";
        readonly recordingChange: "recordingChange";
        readonly talkingChange: "talkingChange";
        readonly talkVolumeChange: "talkVolumeChange";
        readonly setLoggerOptions: "setLoggerOptions";
        readonly records: "records";
        readonly ptzSpeedChange: "ptzSpeedChange"; /**
         * 更多控件（footer more）
         * @since 0.0.1
         * @private
         */
        readonly setVideoLevelList: "setVideoLevelList";
        readonly currentVideoLevel: "currentVideoLevel";
        readonly currentVideoLevelAuto: "currentVideoLevelAuto";
        readonly setAllDayRecTimes: "setAllDayRecTimes"; /** 低部控件 @since 0.0.1 @private */
        readonly getOSDTime: "getOSDTime";
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
            readonly deviceDestroy: "Control.deviceDestroy"; /** 对讲中 @private */
            readonly recTypeChange: "Control.recTypeChange";
            readonly recDestroy: "Control.recDestroy";
            readonly definitionChange: "Control.definitionChange";
            readonly definitionList: "Control.definitionList";
            readonly definitionPanelOpenChange: "Control.definitionPanelOpenChange";
            readonly definitionDestroy: "Control.definitionDestroy";
            readonly speedChange: "Control.speedChange";
            readonly speedPanelOpenChange: "Control.speedPanelOpenChange";
            readonly speedDestroy: "Control.speedDestroy";
            readonly ptzPanelOpenChange: "Control.ptzPanelOpenChange";
            readonly ptzSpeedChange: "Control.ptzSpeedChange";
            readonly ptzError: "Control.ptzError";
            readonly ptzDestroy: "Control.ptzDestroy";
            readonly recordingChange: "Control.recordingChange";
            readonly recordDestroy: "Control.recordDestroy";
            readonly talkingChange: "Control.talkingChange";
            readonly talkError: "Control.talkError";
            readonly talkDestroy: "Control.talkDestroy";
            readonly zoomChange: "Control.zoomChange";
            readonly zoomPanelOpenChange: "Control.zoomPanelOpenChange";
            readonly zoomDestroy: "Control.zoomDestroy";
            readonly fullscreenDestroy: "Control.fullscreenDestroy";
            readonly globalFullscreenDestroy: "Control.globalFullscreenDestroy";
            readonly datePanelOpenChange: "Control.datePanelOpenChange";
            readonly dateChange: "Control.dateChange";
            readonly dateMonthChange: "Control.dateMonthChange";
            readonly dateDestroy: "Control.datePanelDestroy";
            readonly timeLineChange: "Control.timeLineChange";
            readonly timeLinePanelOpenChange: "Control.timeLinePanelOpenChange";
            readonly timeLineDestroy: "Control.timeLineDestroy";
            readonly beforeMountControls: "Control.beforeMountControls";
            readonly mountedControls: "Control.mountedControls";
            readonly beforeUnmountControls: "Control.beforeUnmountControls";
            readonly unmountedControls: "Control.unmountedControls";
            readonly posterDestroy: "Control.posterDestroy";
            readonly loadingDestroy: "Control.loadingDestroy";
            readonly messageDestroy: "Control.messageDestroy";
            readonly contentDestroy: "Control.contentDestroy";
            readonly contentRerender: "Control.contentRerender";
        };
        readonly theme: {
            readonly beforeDestroy: "Theme.beforeDestroy";
            readonly destroyed: "Theme.destroyed";
            readonly mobileExtendDestroy: "Theme.mobileExtendDestroy";
            readonly recFooterDestroy: "Theme.recFooterDestroy";
        };
        readonly message: "message";
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
            396520: string; /** 移动端竖屏, 全屏情况下不展示扩张，放置在 footer 中 */
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
            INIT_SUCCESS: string; /** 版本号 @since 0.0.1 */
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
            SEEK_CANNOT_CROSS_DAYS: string; /** 暂停控件 @since 0.0.1 @private */
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
            /**
             * 更多控件（footer more）
             * @since 0.0.1
             * @private
             */
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
            BTN_ZOOM: string;
            BTN_3D_ZOOM: string;
            BTN_PTZ: string;
            BTN_GLOBAL_FULLSCREEN: string;
            BTN_EXIT_GLOBAL_FULLSCREEN: string;
            BTN_FULLSCREEN: string; /**  @since 0.0.1 @private */
            BTN_EXIR_FULLSCREEN: string;
            BTN_HD: string;
            BTN_SPEED: string;
            BTN_CLOUDREC: string;
            BTN_CLOUDRECORD: string;
            BTN_REC: string;
            BTN_CALENDAR: string;
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
            /** 自定清晰度 @private */
            FULLSCREEN: string;
            FULLSCREEN_EXIT: string;
            GET_WEB_FULLSCREEN_STATUS: string;
            WEB_FULLSCREEN: string;
            WEB_FULLSCREEN_EXIT: string;
            DESTROY: string;
            GET_CAPACITY: string;
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
            396107: string; /**  resizeObserver 监听销毁 */
            396108: string;
            396109: string;
            396110: string;
            396501: string;
            396502: string;
            396503: string;
            396504: string;
            396505: string;
            396506: string;
            396508: string; /** 倍速 @private */
            396509: string;
            396510: string;
            396511: string;
            396512: string;
            /**
             * 录像回放的月份列表 @private
             */
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
            LOADING: string; /**
             * 播放状态
             * ```ts
             * // 事件监听
             * theme.on(Theme.EVENTS.play, (playing: boolean) => {})
             * ```
             */
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
            BTN_CLOUDREC: string;
            BTN_CLOUDRECORD: string;
            BTN_REC: string;
            BTN_CALENDAR: string;
            BTN_MORE: string;
            DEVICE_NAME: string;
            DEVICE_ID: string;
            CAPTURE_SUCCESS: string;
            CAPTURE_FAILED: string;
            START_RECORD_SUCCESS: string;
            START_RECORD_FAILED: string;
            STOP_RECORD_SUCCESS: string;
            STOP_RECORD_FAILED: string;
            RECORD_TIPS: string; /**
             * 电子放大倍数， 仅 ezopen 支持
             * @since 0.0.1
             * @example
             * ```ts
             * theme.zoom // 放大倍数
             * // 事件监听
             * theme.on(Theme.EVENTS.zoom, (zoom: number) => {})
             * ```
             */
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
            GET_CAPACITY: string;
            GET_PTZ_STATUS: string;
            GET_PTZ_STATUS_FAILED: string;
            MOBILE_HIDE_PTZ: string;
            OPTION_PTZ_FAILED: string;
            MOBILE_PTZ_TIPS: string;
            PTZ_FAST: string;
            PTZ_MID: string;
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
     * @type { "rec" | "cloudRec" | "cloudRecord" } recType 回放类型
     * ```ts
     * theme.recType // 回放类型
     * ```
     */
    recType: string;
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
    /** 是否播放中 @private */
    _playing: boolean;
    /** 加载中 */
    private _loading;
    /** 音量 */
    private _volume;
    /** 静音 */
    private _muted;
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
    /** 清晰度列表 */
    videoLevelList: DefinitionItem[];
    /** 回放片段列表 */
    recordList: TimeLineTimeSection[];
    /** 窗口尺寸变化时，设置窗口超出隐藏，防止出现滚动条 */
    private _resizeOverflowTimer;
    /**
     * 录像回放的月份列表 @private
     */
    recMonth: string[];
    /** 清理 header/footer 动画 定时器 @private */
    _onPauseTimingFunc: ((open: boolean) => void) | null;
    /** 销毁标识  @readonly */
    destroyed: boolean;
    /** 播放地址信息 */
    urlInfo: any | null;
    scaleMode: ThemeOptions['scaleMode'];
    constructor(options: ThemeOptions);
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
    /**
     * 移除事件
     */
    private _removeEventListener;
    /**
     * 设置清晰度列表（临时方案，后期会有改动）
     */
    protected _setVideoLevelList(list: DefinitionItem[]): void;
    /**
     * 禁用按钮
     * @private
     */
    _disabled(disabled?: boolean): void;
    private _onDblClickFullscreen;
    protected _getRecType(url: string): "" | "rec" | "cloudRec" | "cloudRecord";
    private resetControl;
    /**
     * 窗口全屏后旋转 90度判断， 然后设置控件已经旋转 90度， 为了解决控件交互问题
     */
    private _isRotated;
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
 * 主题配置项
 *
 * Theme configuration options
 * @since 0.0.1
 */
interface ThemeOptions {
    /** 容器 @since 0.0.1 */
    container: HTMLElement | (() => HTMLElement);
    url?: '';
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
     * | ezopen |  flv       |    hls   |  mp4    |
     * |:------:|:----------:|:--------:|:-------:|
     * | 私有流  | flv 标准流  | hls标准流 |   mp4   |
     * @since 0.0.1
     */
    type: 'ezopen' | 'flv' | 'hls' | 'mp4';
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
    /** 加载动画控件配置, 默认 undefined, 初始化 null 不渲染控件 @since 0.0.1 */
    loadingOptions?: OmitControlOptions<LoadingOptions> | null;
    /** 暂停控件配置, 默认 undefined, 初始化 null 不渲染控件 @since 0.0.1 */
    pauseOptions?: OmitControlOptions<PauseOptions> | null;
    /** 消息控件配置，默认 undefined, 初始化 null 不渲染控件@since 0.0.1  */
    messageOptions?: OmitControlOptions<MessageOptions> | null;
    /** 封面控件配置， 默认 undefined, 初始化 null 不渲染控件 @since 0.0.1 */
    posterOptions?: OmitControlOptions<PosterOptions> | null;
    /** 设备信息控件配置，默认 undefined, 初始化 null 不渲染控件 @since 0.0.1 */
    deviceOptions?: OmitControlOptions<DeviceOptions> | null;
    /** 播放控件配置，默认 undefined, 初始化 null 不渲染控件 @since 0.0.1 */
    playOptions?: OmitControlOptions<PlayOptions> | null;
    /** 音量控件配置 @since 0.0.1 */
    volumeOptions?: OmitControlOptions<VolumeOptions>;
    /** 截图控件配置 @since 0.0.1 */
    capturePictureOptions?: OmitControlOptions<CapturePictureOptions>;
    /** 清晰度控件配置 @since 0.0.1 */
    definitionOptions?: OmitControlOptions<DefinitionOptions>;
    /** 云台控件配置 @since 0.0.1 */
    ptzOptions?: OmitControlOptions<PtzOptions>;
    /** 回放类型控件配置 @since 0.0.1 */
    recOptions?: OmitControlOptions<RecOptions>;
    /** 录制控件配置 @since 0.0.1 */
    recordOptions?: OmitControlOptions<RecordOptions>;
    /** 倍速控件配置 @since 0.0.1 */
    speedOptions?: OmitControlOptions<SpeedOptions>;
    /** 对讲控件配置 @since 0.0.1 */
    talkOptions?: OmitControlOptions<TalkOptions>;
    /** 缩放控件配置 @since 0.0.1 */
    zoomOptions?: OmitControlOptions<ZoomOptions>;
    /** 全屏控件配置 @since 0.0.1 */
    fullscreenOptions?: OmitControlOptions<FullscreenOptions>;
    /** 全局全屏控件配置 @since 0.0.1 */
    globalFullscreenOptions?: OmitControlOptions<GlobalFullscreenOptions>;
    /** 日历控件配置 @since 0.0.1 */
    dateOptions?: any;
    /** 时间轴控件配置 @since 0.0.1 */
    timeLineOptions?: any;
    /** 初始化开始回调, 在内部可以添加事件(Control.beforeMountControls, Control.mountedControls)监听 @since 0.0.1 */
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
    /**
     * 默认 false
     * @deprecated
     * 9.x 开始弃用  请使用 ptzOptions: null来关闭云台
     */
    disabledPTZ?: boolean;
    [kye: string]: any;
}
/**
 * 回放控件类型
 * @since 0.0.1
 */
type ThemeRecType = 'rec' | 'cloudRec' | 'cloudRecord';

/**
 * 回放控件配置项
 */
interface RecOptions extends Omit<ControlOptions, 'tagName'> {
    onClick?: (e: Event) => void;
    onChange?: (type: ThemeRecType) => void;
    recType?: ThemeRecType;
}
/**
 * 回放类型切换（本地回放(sdk 卡)， 云存储回放， 云录制回放）控件
 * @category Control
 */
declare class Rec extends Control {
    private readonly _options;
    private _delegation;
    private recType;
    constructor(options: RecOptions);
    destroy(): void;
    addRecType(id: string): void;
    private _activeIcon;
    private _onClickIcon;
    /**
     * 点击 Control 会触发
     */
    protected _onControlClick(e: Event): void;
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

export { Control, Fullscreen, Loading, Message, Play, Poster, Rec, Theme, Utils, Volume };
export type { CleanUpResizeObserver, CleanUpScreenOrientationFun, ControlItem, ControlOptions, FooterOptions, FullscreenOptions, HeaderOptions, IThemeData, IThemeDataItem, LoadingOptions, MessageOptions, PlayOptions, PosterOptions, RecOptions, ScreenOrientation, ThemeOptions, VolumeOptions };
