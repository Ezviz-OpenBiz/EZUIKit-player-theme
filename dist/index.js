/*
* @ezuikit/player-theme v2.1.0-beta.3
* Copyright (c) 2025-12-30 Ezviz-OpenBiz
* Released under the MIT License.
*/
'use strict';

var EventEmitter = require('eventemitter3');
var Picker = require('@skax/picker');
var delegate = require('@skax/delegate');
var deepmerge = require('deepmerge');
var require$$1 = require('@ezuikit/utils-tools');
var screenfull = require('screenfull');
var I18n = require('@ezuikit/utils-i18n');
var Logger = require('@ezuikit/utils-logger');
var controlDatePicker = require('@ezuikit/control-date-picker');
var controlTimeLine = require('@ezuikit/control-time-line');

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

function getLocale(locales, language) {
    if (language === void 0) language = 'zh';
    return (locales == null ? void 0 : locales[language]) || (locales == null ? void 0 : locales['zh']) || {};
}

function _defineProperties$9(target, props) {
    for(var i = 0; i < props.length; i++){
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
    }
}
function _create_class$9(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties$9(Constructor.prototype, protoProps);
    return Constructor;
}
function _inherits$r(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            writable: true,
            configurable: true
        }
    });
    if (superClass) _set_prototype_of$r(subClass, superClass);
}
function _set_prototype_of$r(o, p) {
    _set_prototype_of$r = Object.setPrototypeOf || function setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
    };
    return _set_prototype_of$r(o, p);
}
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
 */ var Control = /*#__PURE__*/ function(EventEmitter) {
    _inherits$r(Control, EventEmitter);
    function Control(options) {
        var _this;
        var _this___options;
        _this = EventEmitter.call(this) || this, /** 具体语言对应的值 */ _this.locale = null, _this.__options = {}, _this._disabled = false, _this._active = false, _this._camelCaseName = '';
        _this.__options = options;
        _this.locale = getLocale(_this.__options.locales, _this.__options.language);
        _this._camelCaseName = _this.__options.classNameSuffix ? _this.__options.classNameSuffix.replace(/[-_\s]+(.)?/g, function(_, c) {
            return c ? c.toUpperCase() : '';
        }).replace(/^(.)/, function(first) {
            return first.toLowerCase();
        }) : '';
        _this.$container = document.createElement(options.tagName || 'span');
        _this.$container.classList.add("" + PREFIX_CLASS + "-control"); // 默认隐藏
        if ((options == null ? void 0 : options.controlType) === 'text') {
            _this.$container.classList.add("" + PREFIX_CLASS + "-control-text");
        } else if ((options == null ? void 0 : options.controlType) === 'block') {
            _this.$container.classList.add("" + PREFIX_CLASS + "-control-block"); // 块
        } else {
            _this.$container.classList.add("" + PREFIX_CLASS + "-control-btn"); // 默认隐藏
        }
        if (options == null ? void 0 : options.classNameSuffix) {
            // prettier-ignore
            _this.$container.classList.add(PREFIX_CLASS + "-control-" + (options == null ? void 0 : options.classNameSuffix));
        }
        if (options == null ? void 0 : options.className) {
            _this.$container.classList.add(options.className);
        }
        if (options.getPopupContainer) {
            _this.$popupContainer = options.getPopupContainer == null ? void 0 : options.getPopupContainer.call(options);
        } else {
            _this.$popupContainer = document.body;
        }
        _this.$popupContainer.appendChild(_this.$container);
        _this._onDBlClick = _this._onDBlClick.bind(_this);
        _this._onClick();
        if (((_this___options = _this.__options) == null ? void 0 : _this___options.controlType) !== 'block') _this.$container.addEventListener('dblclick', _this._onDBlClick);
        return _this;
    }
    var _proto = Control.prototype;
    /**
   * 重置整个控件
   */ _proto.reset = function reset(hide) {
        if (this._camelCaseName) {
            this.emit("Control." + this._camelCaseName + "Reset", hide);
        }
    };
    /**
   * 重置控件挂载节点
   * @param popupContainer 重新挂载的节点
   * @param append 添加的方式， 默认 append
   * @param element 当 append = before 时 需要 element, 插入 element 前
   *
   * |     prepend   |    append       |
   * |:-------------:|:---------------:|
   * | 插入第一个位置 |    追加在末尾    |
   */ _proto.resetPopupContainer = function resetPopupContainer(popupContainer, append, element) {
        if (popupContainer !== this.$popupContainer) {
            if (this.$popupContainer.contains(this.$container)) {
                this.$popupContainer.removeChild(this.$container);
            }
            this.$popupContainer = popupContainer;
            if (append === 'prepend') {
                // https://caniuse.com/?search=prepend
                this.$popupContainer.prepend(this.$container);
            } else if (append === 'before') {
                if (element) {
                    this.$popupContainer.insertBefore(this.$container, element);
                }
            } else {
                this.$popupContainer.appendChild(this.$container);
            }
            if (this._camelCaseName) {
                this.emit("Control." + this._camelCaseName + "ResetContainer", this.__options.classNameSuffix, popupContainer);
            }
        }
    };
    /**
   * 隐藏整个控件
   */ _proto.hide = function hide() {
        if (this.$container) {
            this.$container.style.display = 'none';
            this.$container.classList.add("" + PREFIX_CLASS + "-hide");
        }
    };
    /**
   * 销毁控件
   */ _proto.destroy = function destroy() {
        var _this___options, _this_$container_remove, _this_$container;
        if (this._camelCaseName) {
            this.emit("Control." + this._camelCaseName + "Destroy");
        }
        if (((_this___options = this.__options) == null ? void 0 : _this___options.controlType) !== 'block') this.$container.addEventListener('dblclick', this._onDBlClick);
        this._active = false;
        this.removeAllListeners();
        (_this_$container = this.$container) == null ? void 0 : (_this_$container_remove = _this_$container.remove) == null ? void 0 : _this_$container_remove.call(_this_$container);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.$container = null;
    };
    _proto._updateDisabledState = function _updateDisabledState(disabled) {
        if (disabled) {
            var _this_$container;
            (_this_$container = this.$container) == null ? void 0 : _this_$container.classList.add("" + PREFIX_CLASS + "-disabled");
        } else {
            var _this_$container1;
            (_this_$container1 = this.$container) == null ? void 0 : _this_$container1.classList.remove("" + PREFIX_CLASS + "-disabled");
        }
    };
    _proto._updateActiveState = function _updateActiveState(active) {
        if (active) {
            var _this_$container;
            (_this_$container = this.$container) == null ? void 0 : _this_$container.classList.add("" + PREFIX_CLASS + "-active");
        } else {
            var _this_$container1;
            (_this_$container1 = this.$container) == null ? void 0 : _this_$container1.classList.remove("" + PREFIX_CLASS + "-active");
        }
    };
    /**
   * 当点击 Control 时 触发子类的 _onControlClick
   */ _proto._onClick = function _onClick() {
        var _this = this;
        this.$container.addEventListener('click', function(e) {
            var _this_$container;
            // prettier-ignore
            if (!((_this_$container = _this.$container) == null ? void 0 : _this_$container.classList.contains("" + PREFIX_CLASS + "-disabled"))) {
                // _onControlClick 来源自子类中
                _this._onControlClick == null ? void 0 : _this._onControlClick.call(_this, e);
            }
        });
    };
    _proto._onDBlClick = function _onDBlClick(e) {
        e.stopPropagation();
        e.preventDefault();
    };
    /**
   * 点击 Control 控件触发
   * @param {Event} e
   * @returns {void}
   */ _proto._onControlClick = function _onControlClick(e) {
        // 这是一个空函数， 子类可以实现重新改方法
        this.__options.onClick == null ? void 0 : this.__options.onClick.call(this.__options, e);
    };
    _create_class$9(Control, [
        {
            key: "active",
            get: /**
   * 是否激活
   */ function get() {
                return this._active;
            },
            set: function set(active) {
                if (this._disabled && !this._active) {
                    // 不允许禁用情况下激活
                    return;
                }
                this._active = active;
                this._updateActiveState(active);
            }
        },
        {
            key: "disabled",
            get: /**
   * 是否禁用
   */ function get() {
                return this._disabled;
            },
            set: function set(disabled) {
                this._disabled = disabled;
                this._updateDisabledState(disabled);
            }
        }
    ]);
    return Control;
}(EventEmitter);

function _extends$q() {
    _extends$q = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends$q.apply(this, arguments);
}
function _inherits$q(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            writable: true,
            configurable: true
        }
    });
    if (superClass) _set_prototype_of$q(subClass, superClass);
}
function _set_prototype_of$q(o, p) {
    _set_prototype_of$q = Object.setPrototypeOf || function setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
    };
    return _set_prototype_of$q(o, p);
}
var LOADING_DEFAULT_OPTIONS = {};
/**
 * 加载动画控件
 * @category Control
 */ var Loading = /*#__PURE__*/ function(Control) {
    _inherits$q(Loading, Control);
    function Loading(options) {
        if (options === void 0) options = {};
        var _this;
        _this = Control.call(this, Object.assign({}, LOADING_DEFAULT_OPTIONS, _extends$q({}, options, {
            tagName: 'div',
            controlType: 'block',
            classNameSuffix: 'loading'
        }))) || this;
        _this._options = Object.assign({}, options);
        _this.$container.classList.add("" + PREFIX_CLASS + "-loading", "" + PREFIX_CLASS + "-hide"); // 默认隐藏
        _this._html();
        return _this;
    }
    var _proto = Loading.prototype;
    _proto._html = function _html() {
        if (typeof this._options.render === 'function') {
            this.$container.innerHTML = this._options.render();
        } else {
            var _this_locale;
            this.$container.innerHTML = '\n          <span class="' + PREFIX_CLASS + "-loading-dot " + PREFIX_CLASS + '-loading-dot-load">\n            <i class="' + PREFIX_CLASS + '-loading-dot-item"></i>\n            <i class="' + PREFIX_CLASS + '-loading-dot-item"></i>\n            <i class="' + PREFIX_CLASS + '-loading-dot-item"></i>\n            <i class="' + PREFIX_CLASS + '-loading-dot-item"></i>\n          </span>\n        <div class="' + PREFIX_CLASS + '-loading-text">' + (((_this_locale = this.locale) == null ? void 0 : _this_locale.LOADING) || 'loading...') + "</div>\n        ";
        }
    };
    /**
   * 动画展示
   * @param html 自定义动画内容, 如果不存在则使用默认动画
   */ _proto.show = function show(html) {
        if (html) this.$container.innerHTML = html;
        // 初始化， 出流再等待中（回放出流结束不包括）
        this.$container.style.display = 'flex';
        this.$container.classList.remove("" + PREFIX_CLASS + "-hide");
        this.$popupContainer.classList.add("" + PREFIX_CLASS + "-has-loading");
    };
    /**
   * 隐藏动画
   */ _proto.hide = function hide() {
        Control.prototype.hide.call(this);
        this.$popupContainer.classList.remove("" + PREFIX_CLASS + "-has-loading");
    };
    return Loading;
}(Control);

function _extends$p() {
    _extends$p = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends$p.apply(this, arguments);
}
function _inherits$p(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            writable: true,
            configurable: true
        }
    });
    if (superClass) _set_prototype_of$p(subClass, superClass);
}
function _set_prototype_of$p(o, p) {
    _set_prototype_of$p = Object.setPrototypeOf || function setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
    };
    return _set_prototype_of$p(o, p);
}
// 不放在服务器上 是因为有可能http加载失败
// prettier-ignore
var DEFAULT_POSTER = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//gAfQ29tcHJlc3NlZCBieSBqcGVnLXJlY29tcHJlc3P/2wCEAAkJCQkJCQoLCwoODw0PDhQSERESFB4WFxYXFh4uHSEdHSEdLikxKCUoMSlJOTMzOUlUR0NHVGZbW2aBeoGoqOIBCQkJCQkJCgsLCg4PDQ8OFBIRERIUHhYXFhcWHi4dIR0dIR0uKTEoJSgxKUk5MzM5SVRHQ0dUZltbZoF6gaio4v/CABEIA/0HHgMBIgACEQEDEQH/xAAZAAEBAQEBAQAAAAAAAAAAAAAAAQIEAwf/2gAIAQEAAAAA+WgAgAQAACTxAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHUAEACAAAE8YAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAdQBAAgAAAPPzAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOoCABAAAAGfEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA6ggAIAAAATxgAAAAAAAAAAAAAAAAAAAAAAAAAAAAADqIACAAAACPLIAAAAAAAAAAAAAAAAAAAAAAAAAAAAADqgAIAAAAEMeYAAAAAAAAAAAAAAAAAAAAAAAAAAAAADpACAAAABAz5AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOkAgAAAAQCeUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA6QIAAAAEAHjAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOkIAAAAEAEeeQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOkQAAAAQAQYwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB0oAAAAIAIDGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOgAAAAIAIBnzAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA6AAAACACAGfMAAAAAAAAAAAAAAAAAAAAAAAAAAAAADoAAAAgAgBE8wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOgAAAIAIAQTzAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA6AAACACACBPMAAAAAAAAAAAAAAAAAAAAAAAAAAAAADoAAAgAgAgE8wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOgAAIAIAIAZwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB0AAEAEAEAImAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOgABABACAEGcgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAdAAIAIAQAgMwCAAAAAAAAAAAAAAAAAAAAAAAAAAAAA6ABABACACBbAJEkAAAAAAAAAAAAAAAAAAAAAAAAAAAAdACACACAEDWjAEDMgAAAAAAAAAAAAAAAAAAAAAAAAAAAOgEAEAEAIGtoYBAJJAAAAAAAAAAAAAAAAAAAAAAAAAAAB0CACACAEBvREyEAgzAAAAAAAAAAAAAAAAAAAAAAAAAAADoQAQAQAgLuoJkICBc5AAAAAAAAAAAAAAAAAAAAAAAAAAAdEAEAIAQC+iAzBAIKkyAAAAAAAAAAAAAAAAAAAAAAAAAAB7gEAIAQA9ADAQEFQzAAAAAAAAAAAAAAAAAAAAAAAAAAAe4EAIAIAboCZEAgqDMAAAAAAAAAAAAAAAAAAAAAAAAAAD3CAEAEAJrYCSEAgqBMgAAAAAAAAAAAAAAAAAAAAAAAAAB7kAEAIARfQAmRAQLASQAAAAAAAAAAAAAAAAAAAAAAAAAAe8AEAIAQb0AjJAIKgIkAAAAAAAAAAAAAAAAAAAAAAAAAAPYAgBACCvQBEiAQVAQkAAAAAAAAAAAAAAAAAAAAAAAAAAPYCAEAIKa0AjJAQKgQMgAAAAAAAAAAAAAAAAAAAAAAAAAHsEAIAQKNaBCRAIKgIEgAAAAAAAAAAAAAAAAAAAAAAAAAD2IAIAQUR6UQMkBBUBASAAAAAAAAAAAAAAAAAAAAAAAAAAPaACAEFEL6CBIgEFQICIAAAAAAAAAAAAAAAAAAAAAAAAAA9QCAEFEDWyCIgEFQECEAAAAAAAAAAAAAAAAAAAAAAAAAAeoEAIKIBraCIQECwEBCAAAAAAAAAAAAAAAAAAAAAAAAAAPUIAQUIA1tBEQCCoCBBAAAAAAAAAAAAAAAAAAAAAAAAAAHqQAgoQBGthEQCCoCBAgAAAAAAAAAAAAAAAAAAAAAAAAAD1gBBQgBDWyEIBBUCAgQAAAAAAAAAAAAAAAAAAAAAAAAAB6AEFEAIF9IEQCCoCBAgAAAAAAAAAAAAAAAAAAAAAAAAAB6AQUQAgD0CEBAsBAQIAAAAAAAAAAAAAAAAAAAAAAAAAAegQUQAgCPSkIBBUCAgQAAAAAAAAAAAAAAAAAAAAAAAAAAehBRACAINbQgEFQECAgAAAAAAAAAAAAAAAAAAAAAAAAAA9IKEAQAgXYQECwEBAgAAAAAAAAAAAAAAAAAAAAAAAAAAbKEAQAgDWiAQVAQIEAAAAAAAAAAAAAAAAAAAAAAAAAABuhAEAIAi+iAQVAQICAAAAAAAAAAAAAAAAAAAAAAAAAAA9BACAIAgb1AIKgQECAAAAAAAAAAAAAAAAAAAAAAAAAAAeiAEAQBALsCCoCBAQAAAAAAAAAAAAAAAAAAAAAAAAAADYBAEAIAXYQLAQECAAAAAAAAAAAAAAAAAAAAAAAAAAANgQBACAA1oQVAQIEAAAAAAAAAAAAAAAAAAAAAAAAAAANhAEAIAAXaCoCBAQAAAAAAAAAAAAAAAAAAAAAAAAAAA2QAgCAAAugsBAQIAAAAAAAAAAAAAAAAAAAAAAAAAW6qkSSwAgCAAAFtVAQIEAAAAAAAAAAAAAAAAAAAAAAAADWta1SgDlAQBAAAALdQEBBAAAAAAAAAAAAAAAAAAAAAAAAF1vdUFAHKCAIAAAAFqkBCAAAAAAAAAAAAAAAAAAAAAAAANem6CgoByiAEAAAAAKAQAAAAAAAAAAAAAAAAAAAAAAABdetFCgoByoAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABd+ihQUFAcgBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADfpSgoUFAcgEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANemgUKCgoHGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAu/QBQUFBQcYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAF9dAChQUFBxgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA160AKCgoKHGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG/SgAUKCgocYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA9NqABQUFBRxgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALvZQAFBQoKOMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC72FAAUKCgpxgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAemqFAAUFCgpxgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA3soUABQoKCuMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANegoUABQUKCuMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAX0oUKAAoUFBeMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAu6oUUABQUKByAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG9FChQAFCgoOQAAAAAAAAAAAAAAAAAAAAAAAAAAAAABrYUKKAAoKChyAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAXahRQoAChQUOQAAAAAAAAAAAAAAAAAAAAAAAAAAAAADdKKFCgAUFBRyAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAuxQooUABQoKOQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGtBRQoUACgoKcgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAXSihRQoACgoU5AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA2UKKFCgAUFBXIAAAAAAAAAAAAAAAAAAAAAAAAAAAAALtFFCihQAFBQrkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGtIoUUKFAAUKC8gAAAAAAAAAAAAAAAAAAAAAAAAAAAABdKiihRQoACgoXkAAAAAAAAAAAAAAAAAAAAAAAAAAAAALpSUKKFCgAKFBygAAAAAAAAAAAAAAAAAAAAAAAAAAAAGqVFFCihQAFBQ5QAAAAAAAAAAAAAAAAAAAAAAAAAAAADYpFFFChQAFChygAAAAAAAAAAAAAAAAAAAAAAAAAAAALaKihRQooACgo5QAAAAAAAAAAAAAAAAAAAAAAAAAAAAFtCoooUUKAAoUcoAAAAAAAAAAAAAAAAAAAAAAAAAAAADRRUUKKFCgAUFOUAAAAAAAAAAAAAAAAAAAAAAAAAAAAC0oVFFCihQAFCnKAAAAAAAAAAAAAAAAAAAAAAAAAAAABaKKihRQoUACgrlAAAAAAAAAAAAAAAAAAAAAAAAAAAAAtCioooUUKAAoLygAAAAAAAAAAAAAAAAAAAAAAAAAAAAVRRUUKKFCgAUF5QAAAAAAAAAAAAAAAAAAAAAAAAAAAAKUUVFFCihQAFBzAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUooqKFFChQAFDmAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoooqKKFFCgAKHMAAAAAAAAAAAAAAAAAAAAAAAAAAAABRRRSUKKFCgAKOYAAAAAAAAAAAAAAAAAAAAAAAAAAAABRRRUUUKKFAAUcwAAAAAAAAAAAAAAAAAAAAAAAAAAAACiiikUUUKFAAU5gAAAAAAAAAAAAAAAAAAAAAAAAAAAACiiioooUKKAApzAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFFFFIooUUKAArmAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFFFFRQooUKABXMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKKKFRRQooUABeYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKKKKihRQoUABzgAAAAAAAAAAAAAAAAAAAAAAAAAAAABRQoqKKFFCgAOcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFFFFRQooUKABzgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoUUVFFCihQAOcAAAAAAAAAAAAAAAAAAAAAAAAAAAAACiiiooUUKFABzgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUKKKiihRQoAOcAAAAAAAAAAAAAAAAAAAAAAAAAAAAABRRRSUKKFCgBzgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFFFFRRQooUAOcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAooopFFFChQBzgAAAAAAAAAAAAAAAAAAAAAAAAAAAAACiiioooUKKAOcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUUUUiihRQoBzgAAAAAAAAAAAAAAAAAAAAAAAAAAAAABRRRUUKKFCgOcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKKKFRRQooUBzgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoooqKFFChQOcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFFCioooUUKBzgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUUUVFCihQoOcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAChRRUUUKKFBzgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKKKKihRQoUOcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoooqKKFFChzgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFFFFJQooUKOcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUUUBQBQKH/xAAXAQEBAQEAAAAAAAAAAAAAAAAAAQID/9oACAECEAAAAOoCAASAAAAAAAAAAAAAAANgQAAyAAAAAAAAAAAAAAA2EAACQAAAAAAAAAAAAAADZAAAJAAAAAAAAAAAAAAANwAAAZAAAAAAAAAAAAAAA0AAAJAAAAAAAAAAAAAAANAAAIQAAAAAAAAAAAAAADQAAIEAAAAAAAAAAAAAAA0AAIBAAAAAAAAAAAAAAANAAIAQAAAAAAAAAAAAAADQAIAEAAAAAAAAAAAAAAA0AIAAIAAAAAAAAAAAAAANAIABSBAAAAAAAAAAAAAANAQAFEsBAAAAAAAAAAAAAA0EABNBAIAAAAAAAAAAAAADRAARoJYEAAAAAAAAAAAAAAoAELqBAQAAAAAAAAAAAAACgAgtCAgAAAAAAAAAAAAACgCLDQICAAAAAAAAAAAAAAKAiwNBAQAAAAAAAAAAAAAAoIsA0ECAAAAAAAAAAAAAACiLADQgIAAAAAAAAAAAAAAKiwANEBAAAAAAAAAAAAAAAAAC1AgAAAAAAAAAAAAAAAAAtgIAAAAAAAAAAAAAAAAAFBAAAAAAAAAAAAAAAAAAKEAAAAAAAAAAAAAAAAAAUgAAAAAAAAAAAAAAAAAAsAAAAAAAAAAAAAAtKMAAAAAAAAAAAAAAAAAaoFOYAAAAAAAAAAAAAAAAtoBTmAAAAAAAAAAAAAAAAaFAK5gAAAAAAAAAAAAAAAWgoBeYAAAAAAAAAAAAAAALQKAXmAAAAAAAAAAAAAAAFoBQDAAAAAAAAAAAAAAAAtAFAMAAAAAAAAAAAAAAAFUAKAwAAAAAAAAAAAAAAAUoAoDAAAAAAAAAAAAAAACigBQMAAAAAAAAAAAAAAAUFAFAwAAAAAAAAAAAAAABQUAKDAAAAAAAAAAAAAAACgoAoMAAAAAAAAAAAAAAAKCgBQwAAAAAAAAAAAAAAAUFAFDAAAAAAAAAAAAAAABQUAKMAAAAAAAAAAAAAAACgoAUwAAAAAAAAAAAAAAAFBQBTAAAAAAAAAAAAAAAAUFACsAAAAAAAAAAAAAAAAoKAKwAAAAAAAAAAAAAAACgoAXAAAAAAAAAAAAAAAAWUFAFwAAAAAAAAAAAAAAABQUAMgAAAAAAAAAAAAAAAsoKAMgAAAAAAAAAAAAAAAKCgDIAAAAAAAAAAAAAAABQUAyAAAAAAAAAAAAAAAAUFAMgAAAAAAAAAAAAAAACgoDIAAAAAAAAAAAAAAAAoKAyAAAAAAAAAAAAAAAAFBQMgAAAAAAAAAAAAAAAAoKDIAAAAAAAAAAAAAAAAKCgyAAAAAAAAAAAAAAAABQUMgAAAAAAAAAAAAAAAAUFDIAAAAAAAAAAAAAAAAAoD//EABYBAQEBAAAAAAAAAAAAAAAAAAABAv/aAAgBAxAAAADAAoigoAAAAAAAAAAAAAADIBSKAoAAAAAAAAAAAAAADIFIoAoAAAAAAAAAAAAAADIUigAUAAAAAAAAAAAAAADJSKAAUAAAAAAAAAAAAAADNIoAAoAAAAAAAAAAAAAACIUAAoAAAAAAAAAAAAAAAyUAApKAAAAAAAAAAAAAAAzQABUUAAAAAAAAAAAAAAAgABUUAAAAAAAAAAAAAAAIABUUAAAAAAAAAAAAAAACABUUAAAAAAAAAAAAAAAAgBUUBAoAAAAAAAAAAAAAAgFJQEBQAAAAAAAAAAAAAAgUlAJKFAAAAAAAAAAAAAACCooBIooAAAAAAAAAAAAAAIqKAGVCgAAAAAAAAAAAAAAIoAIBQAAAAAAAAAAAAAAIoACAoAAAAAAAAAAAAAAAAAM0KAAAAAAAAAAAAAAAAACBQAAAAAAAAAAAAAAAAAIKAAAAAAAAAAAAAAAAAAgoAAAAAAAAAAAAAAAAACFAAAAAAAAAAAAAAAAAAEUAAAAAAAAAAAAAAAAAASgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAloAAAAAAAAAAAAAAAAEQA0AAAAAAAAAAAAAAAAEgANAAAAAAAAAAAAAAAAElgANAAAAAAAAAAAAAAAAIlQANAAAAAAAAAAAAAAAAgSwANAAAAAAAAAAAAAAABASoANAAAAAAAAAAAAAAACAJYANAAAAAAAAAAAAAAABAIsANAAAAAAAAAAAAAAAEsASoA0AAAAAAAAAAAAAAAJYAlgDQAAAAAAAAAAAAAAAIAlQDQAAAAAAAAAAAAAAASwBLANAAAAAAAAAAAAAAAAQBKgNAAAAAAAAAAAAAAAAlgCWA0AAAAAAAAAAAAAAAAQCVA0AAAAAAAAAAAAAAABLAEsDQAAAAAAAAAAAAAAAAgEqDQAAAAAAAAAAAAAAACWAJYNAAAAAAAAAAAAAAAAEsAlQ0AAAAAAAAAAAAAAAASwBLDQAAAAAAAAAAAAAAAAlgEWNAAAAAAAAAAAAAAAACWAJU0AAAAAAAAAAAAAAAAEsASzQAAAAAAAAAAAAAAAAEASqAAAAAAAAAAAAAAAACWAJaAAAAAAAAAAAAAAAAAgCWgAAAAAAAAAAAAAAAASwBNAAAAAAAAAAAAAAAAACATQAAAAAAAAAAAAAAAACWAKAAAAAAAAAAAAAAAAAEAoAAAAAAAAAAAAAAAABLAKAAAAAAAAAAAAAAAAAJYCgAAAAAAAAAAAAAAAACWAoAAAAAAAAAAAAAAAAASwKAAAAAAAAAAAAAAAAAAg//EACgQAAEEAQIFBAMBAAAAAAAAAAEAAhFwMTBREhNAQYADECBQIWBh0P/aAAgBAQABPwD5QPeAoC/HURoOEi5SINyPFyOEi5Tcjs3I+5HYPmScm5HZuR1yOuR2Lkdi5Di5Di5Di5Di5Di5DchuR3vBUFQbdgrhRAnQgKFBtYNUAe51ItINJQAHRxZ4b8j0JFlgSgI+Z6IiyQJQEaB6MiyAI60ixgI0TbTRpHpjYY+iNhNGkbkPUmwG3IMaR8vRnSNtNzcjc3I3NyNzcjc3IM+ZIxcjbkFyi5AYuVpuWZuQGLlBuUG5QVNYQdlwO2XLcuU5co7rlHdcr+rlHdco7rlO3C5blwO2XC7Y/UzVQBPZD0yh6Q3QY3ZQB2+4BqUMcUPTHcoNA7ffypp8NJQYO6AA/RZUqVKlTSwYSg0C4Qw90ABcIYSgALhAJQaBcQZvcQEoNi4g2UBFxNbvcYbvcbWxcbRFxgXG0XGBcYE3IBFxgXGB5jgXGLkFxi5B5jjzHFyDzHFyD/AKp0pUqVKlSpUqVKlSpUqVK//EAB0RAAMAAgIDAAAAAAAAAAAAAAABEWBwEpCAoLD/2gAIAQIBAT8A30/QDhCeJ8zFLca7Hl0RQhCIiIjijjk8Jl8JuCfXf//EABoRAAICAwAAAAAAAAAAAAAAAAARAaAQYLD/2gAIAQMBAT8AtfzYjYxjyx7Q+5f/AP/Z";
var POSTER_OPTIONS = {
    poster: DEFAULT_POSTER
};
/**
 * 封面控件
 * @category Control
 */ var Poster = /*#__PURE__*/ function(Control) {
    _inherits$p(Poster, Control);
    function Poster(options) {
        if (options === void 0) options = {};
        var _this;
        _this = Control.call(this, Object.assign({}, POSTER_OPTIONS, _extends$p({}, options, {
            tagName: 'div',
            controlType: 'block',
            classNameSuffix: 'poster'
        }))) || this;
        _this._options = Object.assign({}, POSTER_OPTIONS, options);
        _this.$container.classList.add("" + PREFIX_CLASS + "-poster", "" + PREFIX_CLASS + "-hide");
        _this._imgLoadErrorEvent = _this._imgLoadErrorEvent.bind(_this);
        if (_this._options.poster) {
            _this.setPoster(_this._options.poster);
        }
        return _this;
    }
    var _proto = Poster.prototype;
    /**
   * 封面图片加载失败
   * @param error
   */ _proto._imgLoadErrorEvent = function _imgLoadErrorEvent(error) {
        var _error_target;
        // 封面加载失败， 一般只有自定义封面会出现这种情况
        // 这里不做img src重置处理  防止无限循环
        this._options.onLoadImgError == null ? void 0 : this._options.onLoadImgError.call(this._options, ((_error_target = error.target) == null ? void 0 : _error_target.getAttribute('src')) || '');
    };
    /**
   * 设置封面 这里不对 poster 进行缓存，如果有值优先使用，如果没有值优先使用 初始化传入的值
   * @param {string} poster 封面地址或 base64 数据
   */ _proto.setPoster = function setPoster(poster) {
        var // eslint-disable-next-line @typescript-eslint/unbound-method
        // prettier-ignore
        _this_$container_querySelector;
        poster = poster != null ? poster : this._options.poster;
        if (poster === '') {
            this.$container.innerHTML = '';
            return;
        }
        this.$container.innerHTML = '<img class="' + PREFIX_CLASS + '-poster-img" src="' + poster + '" />';
        (_this_$container_querySelector = this.$container.querySelector("." + PREFIX_CLASS + "-poster-img")) == null ? void 0 : _this_$container_querySelector.addEventListener("error", this._imgLoadErrorEvent);
    };
    /**
   * 展示封面 这里不对 poster 进行缓存， 如果有值优先使用， 如果没有值优先使用 初始化传入的值
   */ _proto.show = function show() {
        if (this.$container) {
            this.$container.style.display = 'flex';
            this.$container.classList.remove("" + PREFIX_CLASS + "-hide");
        }
    };
    /**
   * 隐藏封面
   */ _proto.hide = function hide() {
        var // eslint-disable-next-line @typescript-eslint/unbound-method
        _this_$container_querySelector, _this_$container;
        Control.prototype.hide.call(this);
        (_this_$container = this.$container) == null ? void 0 : (_this_$container_querySelector = _this_$container.querySelector("." + PREFIX_CLASS + "-poster-img")) == null ? void 0 : _this_$container_querySelector.removeEventListener('error', this._imgLoadErrorEvent);
    };
    /**
   * 销毁
   */ _proto.destroy = function destroy() {
        this.hide();
        Control.prototype.destroy.call(this);
    };
    return Poster;
}(Control);

var Icons = {
    /** 播放 */ play: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" focusable="false" aria-hidden="true" data-icon="play">\n      <rect x="6.5" y="5.5" rx="1.25" width="2.5" height="13"/>\n      <rect x="15" y="5.5" rx="1.25" width="2.5" height="13"/>\n    </svg>',
    /** 暂停 */ pause: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"  focusable="false" aria-hidden="true" data-icon="pause"> <path d="M17.5 13.66L9.1 19.26C7.78 20.14 6 19.19 6 17.59L6 6.4C6 4.8 7.78 3.85 9.1 4.73L17.5 10.33C18.69 11.12 18.69 12.87 17.5 13.66Z" /></svg>',
    /** 音量 */ volume: function(prefix) {
        return '<svg  width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" fill="none" focusable="false" aria-hidden="true" data-icon="volume">\n     	<path class="' + prefix + '-icon-volume-muted" d="M20.57 9.69L16.07 14.19" stroke-width="1.500000" stroke-linejoin="round" stroke-linecap="round"/>\n     	<path class="' + prefix + '-icon-volume-muted" d="M20.57 14.19L16.07 9.69" stroke-width="1.500000" stroke-linejoin="round" stroke-linecap="round"/>\n      <!-- 音低 -->\n      <path class="' + prefix + '-icon-volume-low" d="M15.53 15.97C16.69 15.25 17.49 13.75 17.49 12C17.49 10.25 16.69 8.75 15.53 8.02" stroke-width="1.500000" stroke-linejoin="round" stroke-linecap="round"/>\n     	<!-- 音高 -->\n      <path class="' + prefix + '-icon-volume-high" d="M18.5 19.06C20.31 17.5 21.49 14.93 21.49 12C21.49 9.07 20.31 6.48 18.49 4.93" stroke-width="1.500000" stroke-linejoin="round" stroke-linecap="round"/>\n     	<path d="M5.87 8.62L9.85 5.25C10.5 4.7 11.49 5.16 11.49 6.01L11.49 17.98C11.49 18.83 10.5 19.29 9.85 18.74L5.87 15.37" stroke-width="1.500000" stroke-linejoin="round" stroke-linecap="round"/>\n     	<path d="M5.87 15.37L3.49 15.37C2.94 15.37 2.49 14.92 2.49 14.37L2.49 9.62C2.49 9.07 2.94 8.62 3.49 8.62L5.87 8.62" stroke-width="1.500000" stroke-linejoin="round" stroke-linecap="round"/>\n    </svg>';
    },
    /** 全屏 */ mobileFullscreen: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" focusable="false" aria-hidden="true" data-icon="mobile-fullscreen">\n      <path d="M4 2.9082L11 2.9082C12.5188 2.9082 13.75 4.1394 13.75 5.6582L13.75 17.6582C13.75 19.177 12.5188 20.4082 11 20.4082L4 20.4082C2.4812 20.4082 1.25 19.177 1.25 17.6582L1.25 5.6582C1.25 4.1394 2.4812 2.9082 4 2.9082ZM4 4.4082L11 4.4082C11.6903 4.4082 12.25 4.9679 12.25 5.6582L12.25 17.6582C12.25 18.3485 11.6903 18.9082 11 18.9082L4 18.9082C3.30969 18.9082 2.75 18.3485 2.75 17.6582L2.75 5.6582C2.75 4.9679 3.30969 4.4082 4 4.4082ZM22.1511 18.3113C22.1511 19.3595 21.2467 20.1652 20.1509 20.2362L19.993 20.2413L15.2939 20.2413C14.8798 20.2413 14.5439 19.9055 14.5439 19.4913C14.5439 19.1116 14.8262 18.7979 15.1921 18.7482L15.2939 18.7413L19.993 18.7413C20.344 18.7413 20.5962 18.5592 20.6432 18.3732L20.6511 18.3113L20.6511 12.4895C20.6511 12.3048 20.4338 12.1042 20.1062 12.066L19.993 12.0594L15.2939 12.0594C14.8798 12.0594 14.5439 11.7238 14.5439 11.3094C14.5439 10.9298 14.8262 10.616 15.1921 10.5663L15.2939 10.5594L19.993 10.5594C21.1055 10.5594 22.0605 11.3175 22.145 12.3416L22.1511 12.4895L22.1511 18.3113ZM10.3225 16.1035C10.3225 15.6893 9.98669 15.3535 9.57251 15.3535L5.84644 15.3535L5.74463 15.3604C5.37854 15.41 5.09644 15.7239 5.09644 16.1035C5.09644 16.5177 5.43225 16.8535 5.84644 16.8535L9.57251 16.8535L9.67432 16.8467C10.0404 16.797 10.3225 16.4832 10.3225 16.1035Z" clip-rule="evenodd" fill-rule="evenodd"/>\n    </svg>',
    fullscreen: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" focusable="false" aria-hidden="true" data-icon="webFullscreen">\n  	<path d="M18.4009 2.40125L5.59972 2.40125C4.74849 2.39276 3.9297 2.72729 3.32788 3.32935C2.72607 3.9314 2.39188 4.75031 2.40062 5.6015L2.40062 18.4015C2.3922 19.2527 2.7267 20.0715 3.32874 20.6733C3.93079 21.2751 4.74969 21.6093 5.60091 21.6006L18.4009 21.6006C19.2519 21.609 20.0705 21.2747 20.6723 20.6729C21.2741 20.0711 21.6084 19.2525 21.6 18.4015L21.6 5.60034C21.6084 4.74933 21.2741 3.93073 20.6723 3.32892C20.0705 2.72711 19.2519 2.39282 18.4009 2.40125ZM18.401 20.3213C19.4246 20.3213 20.321 19.4249 20.321 18.4014L20.321 5.60022C20.321 4.5766 19.4246 3.68024 18.401 3.68024L5.59987 3.68024C4.57631 3.68024 3.67993 4.5766 3.67993 5.60022L3.67993 18.4014C3.67993 19.4249 4.57631 20.3213 5.59987 20.3213L18.401 20.3213ZM14.5599 5.27087L18.3997 5.27087L18.3997 5.27209C18.7849 5.27087 19.0405 5.52527 19.0405 5.91168L19.0405 9.75153C19.0405 10.1331 18.7849 10.3887 18.401 10.3911C18.0158 10.3887 17.7602 10.1331 17.7602 9.75153L17.7602 7.44763L14.0487 11.1591C13.9313 11.2808 13.7695 11.3494 13.6005 11.3494C13.4315 11.3494 13.2697 11.2808 13.1523 11.1591C13.0292 11.0428 12.9594 10.8809 12.9594 10.7115C12.9594 10.5421 13.0292 10.3802 13.1523 10.2639L16.8638 6.55005L14.5599 6.55005C14.1735 6.54883 13.9179 6.29443 13.9203 5.91046C13.9179 5.52411 14.1735 5.26971 14.5599 5.27087ZM10.594 12.6625L6.88254 16.3751L6.88254 14.0712C6.88254 13.686 6.62695 13.4304 6.24297 13.4304C5.85898 13.4304 5.60338 13.686 5.60219 14.0712L5.60219 17.9111C5.60219 18.2939 5.85898 18.5483 6.24297 18.5507L10.0828 18.5507C10.4668 18.5483 10.7224 18.2939 10.7224 17.9099C10.7224 17.5247 10.4668 17.2691 10.0816 17.2703L7.77771 17.2703L11.4904 13.5588C11.6133 13.4421 11.6829 13.2801 11.6829 13.1107C11.6829 12.9412 11.6133 12.7791 11.4904 12.6625C11.3737 12.5396 11.2117 12.47 11.0422 12.47C10.8727 12.47 10.7107 12.5396 10.594 12.6625Z" clip-rule="evenodd" fill-rule="evenodd"/>\n   </svg>',
    exitFullscreen: '\n  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" focusable="false" aria-hidden="true" data-icon="exitWebFullscreen">\n  	<path  d="M18.4009 2.40125L5.59978 2.40125C4.74855 2.39276 3.92976 2.72729 3.32794 3.32935C2.72614 3.9314 2.39194 4.75031 2.40068 5.6015L2.40068 18.4015C2.39226 19.2527 2.72676 20.0715 3.3288 20.6733C3.93085 21.2751 4.74976 21.6093 5.60097 21.6006L18.4009 21.6006C19.252 21.609 20.0706 21.2747 20.6723 20.6729C21.2741 20.0711 21.6085 19.2525 21.6 18.4015L21.6 5.60034C21.6085 4.74933 21.2741 3.93073 20.6723 3.32892C20.0706 2.72711 19.252 2.39282 18.4009 2.40125ZM18.4012 20.3212C19.4247 20.3212 20.3211 19.4248 20.3211 18.4012L20.3211 5.6001C20.3211 4.57648 19.4247 3.68011 18.4012 3.68011L5.59999 3.68011C4.57643 3.68011 3.68005 4.57648 3.68005 5.6001L3.68005 18.4012C3.68005 19.4248 4.57643 20.3212 5.59999 20.3212L18.4012 20.3212ZM17.4401 11.3494L13.6002 11.3494L13.6002 11.3483C13.215 11.3494 12.9594 11.095 12.9594 10.7087L12.9594 6.86877C12.9594 6.48718 13.215 6.23163 13.599 6.22925C13.9842 6.23163 14.2398 6.48718 14.2398 6.86877L14.2398 9.17273L17.9512 5.46124C18.0686 5.3396 18.2304 5.27087 18.3994 5.27087C18.5685 5.27087 18.7303 5.3396 18.8476 5.46124C18.9708 5.57751 19.0406 5.73944 19.0406 5.90881C19.0406 6.07825 18.9708 6.24011 18.8476 6.35645L15.1362 10.0703L17.4401 10.0703C17.8265 10.0715 18.082 10.3259 18.0797 10.7099C18.082 11.0963 17.8265 11.3506 17.4401 11.3494ZM6.69115 18.358L10.4026 14.6454L10.4026 16.9493C10.4026 17.3345 10.6582 17.5901 11.0422 17.5901C11.4262 17.5901 11.6818 17.3345 11.683 16.9493L11.683 13.1094C11.683 12.7266 11.4262 12.4722 11.0422 12.4698L7.20233 12.4698C6.81834 12.4722 6.56276 12.7266 6.56276 13.1106C6.56276 13.4958 6.81834 13.7514 7.20354 13.7502L9.50746 13.7502L5.79478 17.4617C5.67188 17.5784 5.60228 17.7404 5.60228 17.9099C5.60228 18.0793 5.67188 18.2413 5.79478 18.358C5.91145 18.481 6.07349 18.5505 6.24297 18.5505C6.41243 18.5505 6.57446 18.481 6.69115 18.358Z" clip-rule="evenodd" fill-rule="evenodd"/>\n</svg>',
    /** 全屏 */ globalFullscreen: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" focusable="false" aria-hidden="true" data-icon="fullscreen">\n      <path d="M8 4L6 4C4.89 4 4 4.89 4 6L4 8" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>\n     	<path d="M4 16L4 18C4 19.1 4.89 20 6 20L8 20" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>\n     	<path d="M16 20L18 20C19.1 20 20 19.1 20 18L20 16" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>\n     	<path d="M20 8L20 6C20 4.89 19.1 4 18 4L16 4" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>\n    </svg>',
    /** 退出全屏 */ exitGlobalFullscreen: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" focusable="false" aria-hidden="true" data-icon="exitFullscreen">\n        <path d="M4 8L6 8C7.1 8 8 7.1 8 6L8 4"  stroke-width="1.488819" stroke-linejoin="round" stroke-linecap="round"/>\n     	<path d="M8 20L8 18C8 16.89 7.1 16 6 16L4 16"  stroke-width="1.488819" stroke-linejoin="round" stroke-linecap="round"/>\n     	<path d="M20 16L18 16C16.89 16 16 16.89 16 18L16 20"  stroke-width="1.488819" stroke-linejoin="round" stroke-linecap="round"/>\n     	<path d="M16 4L16 6C16 7.1 16.89 8 18 8L20 8"  stroke-width="1.488819" stroke-linejoin="round" stroke-linecap="round"/>\n    </svg>',
    /** 关闭 */ close: '<svg width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" focusable="false" aria-hidden="true" data-icon="close"><path d="M6.34 6.34L17.65 17.65" stroke-width="1.5" stroke-linecap="round"/><path d="M6.34 17.65L17.65 6.34" stroke-width="1.5" stroke-linecap="round"/></svg>',
    closeCircleOutLined: '<svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" focusable="false" aria-hidden="true" data-icon="close-circle">\n  <path d="M8 1C11.866 1 15 4.13401 15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8C1 4.13401 4.13401 1 8 1ZM8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2ZM10.5844 5.40312C10.6531 5.40312 10.7094 5.45937 10.7094 5.52812C10.7094 5.55781 10.7 5.5875 10.6812 5.60938L8.64844 8.03125L10.6781 10.4516C10.6969 10.475 10.7078 10.5031 10.7078 10.5328C10.7078 10.6031 10.6516 10.6578 10.5828 10.6578L9.55156 10.6531L8 8.80312L6.44844 10.6547L5.41563 10.6594C5.34688 10.6594 5.29063 10.6031 5.29063 10.5344C5.29063 10.5047 5.30156 10.4766 5.32031 10.4531L7.35313 8.03281L5.32031 5.61094C5.30156 5.5875 5.29063 5.55937 5.29063 5.52969C5.29063 5.45937 5.34688 5.40469 5.41563 5.40469L6.44844 5.40937L8 7.25937L9.55313 5.40781L10.5844 5.40312Z" fill-rule="evenodd" />\n  </svg>',
    /** 云台 */ ptz: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" focusable="false" aria-hidden="true" data-icon="ptz">\n      <circle cx="12" cy="12" r="2.771739" stroke-width="1.5"/>\n      <path d="M9.06 5.14L10.76 3.8C11.48 3.23 12.51 3.23 13.23 3.8L14.93 5.14" stroke-width="1.5" stroke-linecap="round"/>\n      <path d="M4.87 14.93L3.54 13.23C2.97 12.51 2.97 11.48 3.54 10.76L4.87 9.06" stroke-width="1.5" stroke-linecap="round"/>\n      <path d="M18.91 14.93L20.24 13.23C20.81 12.51 20.81 11.48 20.24 10.76L18.91 9.06" stroke-width="1.5" stroke-linecap="round"/>\n      <path d="M9.06 18.69L10.76 20.02C11.48 20.59 12.51 20.59 13.23 20.02L14.93 18.69" stroke-width="1.5" stroke-linecap="round"/>\n    </svg>',
    /** 下载 */ download: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"  stroke="currentColor" focusable="false" aria-hidden="true" data-icon="download">\n      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m20,14.83l0,3.67c0,0.55 -0.45,1 -1,1l-14,0c-0.56,0 -1,-0.45 -1,-1l0,-3.67"/>\n      <path fill="currentColor" d="m11.125,9.66357l-2.59094,0c-0.44544,0 -0.66846,0.53853 -0.35352,0.85353l3.45956,3.4595c0.1952,0.1953 0.5119,0.1953 0.7071,0l3.4596,-3.4595c0.3149,-0.315 0.0919,-0.85353 -0.3536,-0.85353l-2.5782,0l0,-5.95654c0,-0.48315 -0.3917,-0.875 -0.875,-0.875c-0.4833,0 -0.875,0.39185 -0.875,0.875l0,5.95654z"/>\n    </svg>',
    /** sdk 卡 */ sdk: '<svg width="1em" height="1em" viewBox="0 0 20 20" fill="currentColor" focusable="false" aria-hidden="true" data-icon="sdk">\n      <path d="M6.20253 2.50012L11.6496 2.50012C12.2335 2.50012 12.7939 2.72827 13.2069 3.13391L15.3547 5.24329C15.7677 5.64893 16 6.19934 16 6.77271L16 15.1062C16 16.3011 15.0142 17.2694 13.7975 17.2694L6.20253 17.2694C4.98578 17.2694 4 16.3011 4 15.1062L4 4.66333C4 3.46826 4.98578 2.50012 6.20253 2.50012ZM8.07051 6.09814C8.02467 5.76025 7.73502 5.49976 7.38452 5.49976C7.00217 5.49976 6.69221 5.80969 6.69221 6.19202L6.69221 8.49976L6.69853 8.59375C6.74437 8.93164 7.03403 9.19202 7.38452 9.19202C7.76688 9.19202 8.07683 8.88208 8.07683 8.49976L8.07683 6.19202L8.07051 6.09814ZM9.69238 5.49976C10.0429 5.49976 10.3325 5.76025 10.3784 6.09814L10.3847 6.19202L10.3847 8.49976C10.3847 8.88208 10.0747 9.19202 9.69238 9.19202C9.34189 9.19202 9.05223 8.93164 9.00639 8.59375L9.00008 8.49976L9.00008 6.19202C9.00008 5.80969 9.31003 5.49976 9.69238 5.49976ZM12.686 6.09814C12.6402 5.76025 12.3505 5.49976 12 5.49976C11.6176 5.49976 11.3077 5.80969 11.3077 6.19202L11.3077 8.49976L11.314 8.59375C11.3598 8.93164 11.6495 9.19202 12 9.19202C12.3824 9.19202 12.6923 8.88208 12.6923 8.49976L12.6923 6.19202L12.686 6.09814Z" clip-rule="evenodd" fill-rule="evenodd"/>\n    </svg>',
    /** 云存储 */ cloudRec: '<svg width="1em" height="1em" viewBox="0 0 20 20" fill="currentColor" focusable="false" aria-hidden="true" data-icon="cloud">\n      <path d="M9.76489 4.00439C7.65723 4.08447 5.79883 5.23486 4.89697 6.94995L4.78638 7.17236C2.60205 7.62524 1 9.40649 1 11.5239C1 14.0032 3.17749 16 5.84619 16L9.32983 16L9.32983 13.3784L7.66479 13.3784C7.21924 13.3784 6.99634 12.8398 7.31128 12.5249L9.63892 10.197C9.83423 10.002 10.1509 10.002 10.3462 10.197L12.6738 12.5249C12.9888 12.8398 12.7659 13.3784 12.3203 13.3784L10.6553 13.3784L10.6553 16L14.9846 16C17.1948 16 19 14.3445 19 12.2856L18.9954 12.1052C18.9058 10.3704 17.533 8.95557 15.7456 8.63818L15.6372 8.62036L15.6152 8.4624C15.2087 5.93188 12.8438 4 10 4L9.76489 4.00439Z" clip-rule="evenodd" fill-rule="evenodd"/>\n    </svg>',
    /** 云录制 */ cloudRecord: '<svg width="1em" height="1em" viewBox="0 0 20 20" fill="currentColor" focusable="false" aria-hidden="true" data-icon="cloud-record">\n      <path d="M9.76489 4.00439C7.65723 4.08447 5.79883 5.23486 4.89697 6.94995L4.78638 7.17236C2.60205 7.62524 1 9.40649 1 11.5239C1 14.0032 3.17749 16 5.84619 16L14.9846 16C17.1948 16 19 14.3445 19 12.2856L18.9954 12.1052C18.9058 10.3704 17.533 8.95557 15.7456 8.63818L15.6372 8.62036L15.6152 8.4624C15.2087 5.93188 12.8438 4 10 4L9.76489 4.00439ZM10.8674 13.9116L6.89038 13.9116C6.26294 13.9116 5.75391 13.3889 5.75391 12.7449L5.75391 9.24487C5.75391 8.60034 6.26294 8.07812 6.89038 8.07812L10.8674 8.07812C11.4954 8.07812 12.0039 8.60034 12.0039 9.24487L12.0039 10.2937C12.2932 10.0627 12.9229 9.63184 13.4836 9.271C13.8145 9.05811 14.2461 9.24219 14.2461 9.63599L14.2461 12.3655C14.2461 12.759 13.8142 12.9434 13.4836 12.7307C12.9321 12.3755 12.303 11.9438 12.0039 11.707L12.0039 12.7449C12.0039 13.3889 11.4954 13.9116 10.8674 13.9116Z" clip-rule="evenodd" fill-rule="evenodd"/>\n    </svg>',
    /** 回退 */ playBack: '<svg width="1em" height="1em" viewBox="0 0 26.8701 26.8701" fill="none" stroke="currentColor" focusable="false" aria-hidden="true" data-icon="play-back">\n      <path d="M8.48 4.24C8.48 4.24 7.39 8.16 7.77 7.77C11.29 4.26 16.99 4.26 20.5 7.77C24.02 11.29 24.02 16.99 20.5 20.5C16.99 24.02 11.29 24.02 7.77 20.5C6.03 18.76 5.16 16.49 5.14 14.21" stroke-width="1.5" stroke-linecap="round"/>\n    </svg>',
    /** 前进 */ playForward: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" focusable="false" aria-hidden="true" data-icon="play-forward">\n      <path d="M19.58 7.28C18.01 4.71 15.18 2.99 11.95 2.99C7 2.99 3 7 3 11.95C3 16.89 7 20.9 11.95 20.9C16.51 20.9 20.27 17.48 20.82 13.07" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>\n      <path d="M19.56 4.22L19.56 7.29" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>\n      <path d="M16.5 7.29L19.56 7.29" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>\n    </svg>',
    /** 过滤 */ filter: '<svg width="1em" height="1em" viewBox="0 0 20 20" fill="currentColor" focusable="false" aria-hidden="true" data-icon="filter">\n      <path d="M12.57 9.92L16.31 5.76C16.55 5.49 16.69 5.15 16.69 4.79C16.69 3.98 16.03 3.33 15.23 3.33L4.79 3.33C4.43 3.33 4.09 3.46 3.82 3.7L3.72 3.79C3.21 4.33 3.19 5.18 3.7 5.75L7.38 9.91L7.38 15.66C7.38 16.11 7.7 16.51 8.14 16.63L11.32 17.43C11.95 17.59 12.57 17.11 12.57 16.46L12.57 9.92ZM4.88 4.83L8.88 9.35L8.88 15.27L11.07 15.82L11.07 9.34L15.13 4.83L4.88 4.83Z" fill-rule="evenodd"/>\n    </svg>',
    /** 箭头 */ arrow: '<svg width="1em" height="1em" viewBox="0 0 30 30" fill="none" stroke="currentColor" focusable="false" aria-hidden="true" data-icon="arrow">\n        <path d="M23 19L15 12L7 19" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>\n    </svg>',
    /** 更多 */ more: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" focusable="false" aria-hidden="true" data-icon="more">\n      <path d="M4 6.8L20.8 6.8" stroke-width="1.5" stroke-linecap="round"/>\n      <path d="M4 12.39L12.4 12.39" stroke-width="1.5" stroke-linecap="round"/>\n      <path d="M4 18L8.19 18" stroke-width="1.5" stroke-linecap="round"/>\n    </svg>',
    moreDot: '<svg width="1em" height="1em" viewBox="0 0 20 20" fill="currentColor" focusable="false" aria-hidden="true" data-icon="more-dot">\n        <path d="M8.75 3.75C8.75 3.05964 9.30964 2.5 10 2.5C10.6904 2.5 11.25 3.05964 11.25 3.75C11.25 4.44036 10.6904 5 10 5C9.30964 5 8.75 4.44036 8.75 3.75ZM8.75 10C8.75 9.30964 9.30964 8.75 10 8.75C10.6904 8.75 11.25 9.30964 11.25 10C11.25 10.6904 10.6904 11.25 10 11.25C9.30964 11.25 8.75 10.6904 8.75 10ZM10 15C9.30964 15 8.75 15.5596 8.75 16.25C8.75 16.9404 9.30964 17.5 10 17.5C10.6904 17.5 11.25 16.9404 11.25 16.25C11.25 15.5596 10.6904 15 10 15Z" fill-rule="evenodd" />\n    </svg>',
    minusCircle: '<svg width="1em" height="1em" viewBox="0 0 20 20"  focusable="false" aria-hidden="true" data-icon="minus-circle">\n        		<path fill="currentColor" d="M10 3.75C13.4518 3.75 16.25 6.54822 16.25 10C16.25 13.4518 13.4518 16.25 10 16.25C6.54822 16.25 3.75 13.4518 3.75 10C3.75 6.54822 6.54822 3.75 10 3.75ZM10 5C7.23857 5 5 7.23858 5 10C5 12.7614 7.23857 15 10 15C12.7614 15 15 12.7614 15 10C15 7.23858 12.7614 5 10 5Z" fill-rule="evenodd" />\n		        <path stroke="currentColor" d="M7.46729 10.0588L12.4673 10.0588" stroke-linecap="round" stroke-width="1.25" />\n    </svg>',
    plusCircle: '<svg width="1em" height="1em" viewBox="0 0 20 20"  focusable="false" aria-hidden="true" data-icon="plus-circle">\n      <path fill="currentColor" d="M10 3.75C13.4518 3.75 16.25 6.54822 16.25 10C16.25 13.4518 13.4518 16.25 10 16.25C6.54822 16.25 3.75 13.4518 3.75 10C3.75 6.54822 6.54822 3.75 10 3.75ZM10 5C7.23857 5 5 7.23858 5 10C5 12.7614 7.23857 15 10 15C12.7614 15 15 12.7614 15 10C15 7.23858 12.7614 5 10 5Z" fill-rule="evenodd" />\n      <path stroke="currentColor" d="M7.46729 10.0588L12.4673 10.0588" stroke-linecap="round" stroke-width="1.25" />\n      <path stroke="currentColor" d="M0 0L5 0" stroke-linecap="round" stroke-width="1.25" transform="matrix(0,1,-1,0,9.96729,7.55884)" />\n    </svg>',
    /** 录制/摄像机 */ record: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" focusable="false" aria-hidden="true" data-icon="record">\n      <path d="M4.53 19C3.03 19 1.8 17.74 1.8 16.2L1.8 7.8C1.8 6.25 3.03 5 4.53 5L14.08 5C15.58 5 16.8 6.25 16.8 7.8L16.8 16.2C16.8 17.74 15.58 19 14.08 19L4.53 19Z" stroke-width="1.5" stroke-linejoin="round"/>\n      <path d="M17.25 13.64C17.94 14.2 18.97 15.03 20.36 16.15C21.09 16.74 22.19 16.21 22.19 15.27L22.19 8.72C22.19 7.78 21.09 7.25 20.36 7.84C18.99 8.94 17.96 9.77 17.28 10.32" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>\n    </svg>',
    recordCircle: '<svg width="1em" height="1em" viewBox="0 0 14 14" fill="currentColor" stroke="none" focusable="false" aria-hidden="true" data-icon="record-circle">\n		<path d="M7.00044 2.5C9.70278 2.5 11.8935 4.69068 11.8935 7.39302C11.8935 10.0954 9.70278 12.286 7.00044 12.286C4.2981 12.286 2.10742 10.0954 2.10742 7.39302C2.10742 4.69068 4.2981 2.5 7.00044 2.5ZM7.00044 3.5C4.85039 3.5 3.10742 5.24296 3.10742 7.39302C3.10742 9.54307 4.85039 11.286 7.00044 11.286C9.15049 11.286 10.8935 9.54307 10.8935 7.39302C10.8935 5.24296 9.15049 3.5 7.00044 3.5ZM9.50049 7.39252C9.50049 6.01181 8.3812 4.89252 7.00049 4.89252C5.61978 4.89252 4.50049 6.01181 4.50049 7.39252C4.50049 8.77323 5.61978 9.89252 7.00049 9.89252C8.3812 9.89252 9.50049 8.77323 9.50049 7.39252Z" fill-rule="evenodd" />\n  </svg>\n  ',
    /** 对讲 */ talk: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" focusable="false" aria-hidden="true" data-icon="talk">\n      	<path stroke="none" d="M12.22 18.95C12.65 18.95 13.01 19.21 13.07 19.54L13.08 19.64L13.08 21.78C13.08 22.16 12.69 22.47 12.22 22.47C11.78 22.47 11.42 22.21 11.37 21.87L11.36 21.78L11.36 19.64C11.36 19.26 11.74 18.95 12.22 18.95Z" fill-rule="evenodd"/>\n        <path d="M19.53 11.37L19.53 11.58C19.53 15.74 16.15 19.11 11.99 19.11C7.83 19.11 4.46 15.74 4.46 11.58L4.46 11.43" fill="none" stroke-width="1.5" stroke-linecap="round"/>\n        <path stroke="none" d="M12.05 1.52C9.3 1.52 7.07 3.58 7.07 6.12L7.07 12.07C7.07 14.61 9.3 16.67 12.05 16.67C14.79 16.67 17.02 14.61 17.02 12.07L17.02 6.12C17.02 3.58 14.79 1.52 12.05 1.52ZM8.57 12.07L8.57 6.12C8.57 5.94 8.59 5.75 8.63 5.57C8.67 5.36 8.74 5.16 8.83 4.96C8.86 4.89 8.9 4.82 8.93 4.75C9.09 4.46 9.3 4.21 9.55 3.97C9.64 3.89 9.73 3.81 9.83 3.74C10.08 3.55 10.35 3.4 10.66 3.28C10.79 3.23 10.93 3.19 11.06 3.15C11.38 3.07 11.71 3.02 12.05 3.02C12.38 3.02 12.71 3.07 13.03 3.15C13.17 3.19 13.3 3.23 13.43 3.28C13.74 3.4 14.02 3.55 14.27 3.74C14.36 3.81 14.45 3.89 14.54 3.97C14.79 4.21 15 4.46 15.16 4.75C15.2 4.82 15.23 4.89 15.26 4.96C15.35 5.16 15.42 5.36 15.46 5.57C15.5 5.75 15.52 5.94 15.52 6.12L15.52 12.07C15.52 12.26 15.5 12.44 15.46 12.63C15.42 12.83 15.35 13.04 15.26 13.24C15.23 13.31 15.2 13.38 15.16 13.45C15 13.73 14.79 13.99 14.54 14.22C14.45 14.3 14.36 14.38 14.27 14.45C14.02 14.64 13.74 14.79 13.43 14.91C13.3 14.96 13.17 15.01 13.03 15.05C12.71 15.13 12.38 15.17 12.05 15.17C11.71 15.17 11.38 15.13 11.06 15.05C10.93 15.01 10.79 14.96 10.66 14.91C10.35 14.79 10.08 14.64 9.83 14.45C9.73 14.38 9.64 14.3 9.55 14.22C9.3 13.99 9.09 13.73 8.93 13.45C8.9 13.38 8.86 13.31 8.83 13.24C8.74 13.04 8.67 12.83 8.63 12.63C8.59 12.44 8.57 12.26 8.57 12.07Z" fill-rule="evenodd"/>\n      </svg>',
    talkGrowth: function(prefix) {
        return '<svg width="1em" height="1em" viewBox="0 0 24 24" focusable="false" aria-hidden="true" data-icon="talk-growth">\n      		<g fill="currentColor" stroke="currentColor">\n            <path stroke="none" d="M9.22313 18.9543C9.6588 18.9543 10.0189 19.2133 10.0759 19.5494L10.0837 19.6428L10.0837 21.7847C10.0837 22.1649 9.69841 22.4732 9.22313 22.4732C8.78745 22.4732 8.42739 22.2142 8.37041 21.8781L8.36255 21.7847L8.36255 19.6428C8.36255 19.2626 8.74784 18.9543 9.22313 18.9543Z" fill-rule="evenodd" />\n            <path d="M16.5323 11.3779L16.5323 11.5872C16.5323 15.7472 13.1599 19.1197 8.99981 19.1197C4.83971 19.1197 1.46729 15.7472 1.46729 11.5872L1.46729 11.4335" fill-rule="evenodd" fill="none" stroke-width="1.5" />\n            <path stroke="none" d="M4.07861 6.12978C4.07861 3.589 6.30476 1.5293 9.05085 1.5293C11.7969 1.5293 14.0231 3.589 14.0231 6.12978L14.0231 12.075C14.0231 14.6158 11.7969 16.6755 9.05085 16.6755C6.30476 16.6755 4.07861 14.6158 4.07861 12.075L4.07861 6.12978ZM5.57861 12.075L5.57861 6.12978C5.57861 5.94083 5.597 5.75561 5.63376 5.57412C5.67605 5.36539 5.74265 5.16158 5.83357 4.9627C5.86625 4.8912 5.90164 4.82121 5.93974 4.75272C6.09781 4.4685 6.30245 4.21019 6.55365 3.97777C6.64206 3.89597 6.73424 3.81921 6.83019 3.7475C7.0816 3.55959 7.3589 3.40632 7.66207 3.28767C7.79552 3.23545 7.93107 3.19114 8.06871 3.15475C8.38503 3.07111 8.71241 3.0293 9.05085 3.0293C9.38929 3.0293 9.71668 3.07112 10.033 3.15475C10.1706 3.19114 10.3062 3.23545 10.4396 3.28767C10.7428 3.40632 11.0201 3.55959 11.2715 3.74749C11.3675 3.81921 11.4596 3.89596 11.548 3.97777C11.7993 4.2102 12.0039 4.46853 12.162 4.75276C12.2001 4.82124 12.2354 4.89122 12.2681 4.9627C12.359 5.16157 12.4256 5.36536 12.4679 5.57407C12.5047 5.75558 12.5231 5.94082 12.5231 6.12978L12.5231 12.075C12.5231 12.264 12.5047 12.4492 12.4679 12.6307C12.4256 12.8394 12.359 13.0432 12.2681 13.2421C12.2355 13.3136 12.2001 13.3835 12.162 13.452C12.0039 13.7362 11.7993 13.9946 11.548 14.227C11.4596 14.3088 11.3675 14.3856 11.2715 14.4573C11.0201 14.6452 10.7428 14.7985 10.4396 14.9171C10.3062 14.9693 10.1706 15.0136 10.033 15.05C9.71667 15.1337 9.38929 15.1755 9.05085 15.1755C8.71241 15.1755 8.38503 15.1337 8.06871 15.05C7.93107 15.0136 7.79552 14.9693 7.66207 14.9171C7.3589 14.7985 7.0816 14.6452 6.83019 14.4573C6.73424 14.3856 6.64206 14.3088 6.55365 14.227C6.30244 13.9946 6.09779 13.7363 5.93972 13.452C5.90163 13.3836 5.86625 13.3136 5.83357 13.2421C5.74265 13.0432 5.67605 12.8394 5.63377 12.6307C5.597 12.4492 5.57861 12.264 5.57861 12.075Z" fill-rule="evenodd" />\n          </g>\n          <g class="' + prefix + '-icon-talk-growth-dot">\n            <path class="' + prefix + '-icon-talk-growth-dot1" d="M19.1333 6.40039L22.8667 6.40039" stroke="currentColor" stroke-linecap="round" stroke-width="1.86666667" />\n            <path class="' + prefix + '-icon-talk-growth-dot2" d="M19.1333 10.1338L21.9331 10.1338" stroke="currentColor" stroke-linecap="round" stroke-width="1.86666667" />\n            <path class="' + prefix + '-icon-talk-growth-dot3" d="M19.1333 13.8672L20.9995 13.8672" stroke="currentColor" stroke-linecap="round" stroke-width="1.86666667" />\n            <path class="' + prefix + '-icon-talk-growth-dot4" d="M19.1333 17.6001L20.0669 17.6001" stroke="currentColor" stroke-linecap="round" stroke-width="1.86666667" />\n          </g>\n      </svg>';
    },
    /** 相机/截图 */ capturePicture: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" focusable="false" aria-hidden="true" data-icon="capture-picture">\n      	<path d="M6.94 7.51C7.34 7.51 7.7 7.28 7.86 6.91L8.43 5.6C8.59 5.23 8.95 5 9.35 5L14.69 5C15.04 5 15.37 5.18 15.55 5.49L16.45 7.02C16.63 7.33 16.96 7.51 17.31 7.51L18.5 7.51C19.6 7.51 20.5 8.41 20.5 9.51L20.5 17C20.5 18.1 19.6 19 18.5 19L5.5 19C4.39 19 3.5 18.1 3.5 17L3.5 9.51C3.5 8.41 4.39 7.51 5.5 7.51L6.94 7.51Z" stroke-width="1.5"/>\n	      <circle cx="12" cy="12.525146" r="3.068097" stroke-width="1.5"/>\n    </svg>',
    /** 电子放大 */ zoom: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" focusable="false" aria-hidden="true" data-icon="zoom">\n      <ellipse cx="10.914795" cy="11.25" rx="8.004043" ry="8.25" stroke-width="1.5"/>\n      <path d="M14.31 11.04L8.05 11.14" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>\n      <path d="M11.13 14.22L11.23 7.95" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>\n      <path d="M16.45 17.83L19.36 20.83" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>\n    </svg>',
    /** 隐私遮蔽 */ privacyMasking: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" focusable="false" aria-hidden="true" data-icon="privacy-masking">\n      <path d="M12 19C11.15 19 10.31 18.82 9.49 18.5" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>\n      <path d="M20.88 12.46C18.98 15.96 15.49 19 11.99 19" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>\n      <path d="M19.07 8.92C19.76 9.72 20.38 10.61 20.88 11.53C21.03 11.82 21.03 12.17 20.88 12.46" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>\n      <path d="M5 19L19 5" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>\n      <path d="M9.77 14.22C8.54 12.99 8.54 11 9.77 9.77C11 8.54 12.99 8.54 14.22 9.77" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>\n      <path d="M17.04 6.95C15.49 5.75 13.74 5 12 5C8.5 5 5.01 8.03 3.11 11.53C2.96 11.82 2.96 12.17 3.11 12.46C4.06 14.21 5.41 15.84 6.95 17.04" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>\n    </svg>',
    info: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" focusable="false" aria-hidden="true" data-icon="info">\n      <path d="M12 1.5C6.20154 1.5 1.5 6.20156 1.5 12C1.5 17.7984 6.20154 22.5 12 22.5C17.7985 22.5 22.5 17.7984 22.5 12C22.5 6.20156 17.7985 1.5 12 1.5ZM10.875 7.875C10.875 8.49609 11.3789 9 12 9C12.6211 9 13.125 8.49609 13.125 7.875C13.125 7.25391 12.6211 6.75 12 6.75C11.3789 6.75 10.875 7.25391 10.875 7.875ZM12.75 17.0625C12.75 17.1656 12.6656 17.25 12.5625 17.25L11.4375 17.25C11.3344 17.25 11.25 17.1656 11.25 17.0625L11.25 10.6875C11.25 10.5844 11.3344 10.5 11.4375 10.5L12.5625 10.5C12.6656 10.5 12.75 10.5844 12.75 10.6875L12.75 17.0625Z" clip-rule="evenodd" fill-rule="evenodd"/>\n    </svg>',
    error: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" focusable="false" aria-hidden="true" data-icon="error">\n        <path d="M1.5 12C1.5 6.20156 6.20157 1.5 12 1.5C17.7984 1.5 22.5 6.20156 22.5 12C22.5 17.7984 17.7984 22.5 12 22.5C6.20157 22.5 1.5 17.7984 1.5 12ZM14.3297 15.982L15.8766 15.9891C15.9797 15.9891 16.0641 15.9047 16.0641 15.8016C16.0641 15.757 16.0477 15.7148 16.0195 15.6797L12.9727 12.0469L16.0172 8.4164C16.0453 8.38125 16.0617 8.33906 16.0617 8.29453C16.0617 8.18906 15.9774 8.10703 15.8742 8.10703L14.3273 8.11406L12 10.8891L9.67267 8.11172L8.12344 8.10469C8.02032 8.10469 7.93594 8.18906 7.93594 8.29219C7.93594 8.33672 7.95233 8.37891 7.98047 8.41406L11.0297 12.0445L7.98047 15.6773C7.95233 15.7125 7.93594 15.7547 7.93594 15.7992C7.93594 15.9047 8.02032 15.9867 8.12344 15.9867L9.67267 15.9797L12 13.2047L14.3297 15.982Z" clip-rule="evenodd"  fill-rule="evenodd"/>\n      </svg>',
    infoCircleOutLined: '<svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" focusable="false" aria-hidden="true" data-icon="info-circle">\n  <path d="M8 1C11.866 1 15 4.13401 15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8C1 4.13401 4.13401 1 8 1ZM8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2ZM7.25 5.25C7.25 5.66421 7.58579 6 8 6C8.41421 6 8.75 5.66421 8.75 5.25C8.75 4.83579 8.41421 4.5 8 4.5C7.58579 4.5 7.25 4.83579 7.25 5.25ZM8.5 7.125C8.5 7.05625 8.44375 7 8.375 7L7.625 7C7.55625 7 7.5 7.05625 7.5 7.125L7.5 11.375C7.5 11.4438 7.55625 11.5 7.625 11.5L8.375 11.5C8.44375 11.5 8.5 11.4438 8.5 11.375L8.5 7.125Z" fill-rule="evenodd"/>\n      </svg>',
    warnCircleOutLined: '<svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" focusable="false" aria-hidden="true" data-icon="info-circle">\n  <path d="M8 1C11.866 1 15 4.13401 15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8C1 4.13401 4.13401 1 8 1ZM8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2ZM7.5 8.875C7.5 8.94375 7.55625 9 7.625 9L8.375 9C8.44375 9 8.5 8.94375 8.5 8.875L8.5 4.625C8.5 4.55625 8.44375 4.5 8.375 4.5L7.625 4.5C7.55625 4.5 7.5 4.55625 7.5 4.625L7.5 8.875ZM7.25 10.75C7.25 11.1642 7.58579 11.5 8 11.5C8.41421 11.5 8.75 11.1642 8.75 10.75C8.75 10.3358 8.41421 10 8 10C7.58579 10 7.25 10.3358 7.25 10.75Z" fill-rule="evenodd" />\n          </svg>',
    date: '<svg width="1em" height="1em" viewBox="0 0 20 20" fill="currentColor" focusable="false" aria-hidden="true" data-icon="date">\n    <g>\n    <path d="m13.35,5.9c-0.3,0 -0.5,-0.2 -0.5,-0.5l0,-3.3c0,-0.3 0.2,-0.5 0.5,-0.5s0.5,0.2 0.5,0.5l0,3.3c0,0.3 -0.3,0.5 -0.5,0.5z" />\n    <path d="m6.65,5.9c-0.3,0 -0.5,-0.2 -0.5,-0.5l0,-3.3c0,-0.3 0.2,-0.5 0.5,-0.5s0.5,0.2 0.5,0.5l0,3.3c0,0.3 -0.2,0.5 -0.5,0.5z" />\n    <path d="m17.45,8.4l-15,0c-0.3,0 -0.5,-0.2 -0.5,-0.5s0.2,-0.5 0.5,-0.5l15,0c0.3,0 0.5,0.2 0.5,0.5s-0.2,0.5 -0.5,0.5z" />\n    <path d="m15.85,18.4l-11.7,0c-1.2,0 -2.2,-1 -2.2,-2.2l0,-10.8c0,-1.2 1,-2.2 2.2,-2.2l11.7,0c1.2,0 2.2,1 2.2,2.2l0,10.8c-0.1,1.3 -1,2.2 -2.2,2.2zm-11.7,-14.1c-0.6,0 -1.2,0.5 -1.2,1.2l0,10.8c0,0.6 0.5,1.2 1.2,1.2l11.7,0c0.6,0 1.2,-0.5 1.2,-1.2l0,-10.9c0,-0.6 -0.5,-1.2 -1.2,-1.2l-11.7,0l0,0.1z" />\n    <path d="m9.95,12c-0.4,0 -0.7,-0.3 -0.7,-0.7c0,-0.2 0.1,-0.4 0.2,-0.5s0.3,-0.2 0.5,-0.2l0,0l0,0c0.4,0 0.7,0.3 0.7,0.7s-0.3,0.7 -0.7,0.7z" />\n    <path d="m14.15,12c-0.4,0 -0.7,-0.3 -0.7,-0.7c0,-0.2 0.1,-0.4 0.2,-0.5c0.1,-0.1 0.3,-0.2 0.5,-0.2c0.4,0 0.7,0.3 0.7,0.7s-0.3,0.7 -0.7,0.7zm0,-1c-0.2,0 -0.3,0.1 -0.3,0.3c0,0.2 0.3,0.4 0.5,0.2c0.1,-0.1 0.1,-0.1 0.1,-0.2c0,-0.2 -0.1,-0.3 -0.3,-0.3z" />\n    <path d="m5.85,15.3c-0.4,0 -0.7,-0.3 -0.7,-0.7c0,-0.2 0.1,-0.4 0.2,-0.5c0.1,-0.1 0.3,-0.2 0.5,-0.2l0,0l0,0c0.4,0 0.7,0.3 0.7,0.7c0,0.4 -0.3,0.7 -0.7,0.7z" />\n    <path d="m9.95,15.3c-0.4,0 -0.7,-0.3 -0.7,-0.7c0,-0.2 0.1,-0.4 0.2,-0.5c0.1,-0.1 0.3,-0.2 0.5,-0.2l0,0l0,0c0.4,0 0.7,0.3 0.7,0.7c0.1,0.4 -0.3,0.7 -0.7,0.7z" />\n    </g>\n  </svg>',
    add: '<svg fill="currentColor" width="1em" height="1em" viewBox="0 0 20 20" focusable="false" aria-hidden="true" data-icon="add">\n  <path d="M10.5859 2.96875L9.41406 2.96875C9.3099 2.96875 9.25781 3.02083 9.25781 3.125L9.25781 9.25781L3.4375 9.25781C3.38542 9.25781 3.34635 9.27083 3.32031 9.29688C3.29427 9.32292 3.28125 9.36198 3.28125 9.41406L3.28125 10.5859C3.28125 10.6901 3.33333 10.7422 3.4375 10.7422L9.25781 10.7422L9.25781 16.875C9.25781 16.9792 9.3099 17.0312 9.41406 17.0312L10.5859 17.0312C10.6901 17.0312 10.7422 16.9792 10.7422 16.875L10.7422 10.7422L16.5625 10.7422C16.6667 10.7422 16.7188 10.6901 16.7188 10.5859L16.7188 9.41406C16.7188 9.3099 16.6667 9.25781 16.5625 9.25781L10.7422 9.25781L10.7422 3.125C10.7422 3.07292 10.7292 3.03385 10.7031 3.00781C10.6771 2.98177 10.638 2.96875 10.5859 2.96875Z" fill-rule="evenodd" /></svg>',
    reduce: '<svg fill="currentColor" width="1em" height="1em" viewBox="0 0 20 20" focusable="false" aria-hidden="true" data-icon="reduce">\n   	<path  d="M3.4375 9.25781L16.5625 9.25781C16.6667 9.25781 16.7188 9.3099 16.7188 9.41406L16.7188 10.5859C16.7188 10.6901 16.6667 10.7422 16.5625 10.7422L3.4375 10.7422C3.33333 10.7422 3.28125 10.6901 3.28125 10.5859L3.28125 9.41406C3.28125 9.3099 3.33333 9.25781 3.4375 9.25781Z" fill-rule="evenodd" />\n  </svg>'
};

/**
 * 创建 icon 组件
 * @param svg - svg 字符串
 * @param type - icon 类型
 * @returns icon 组件
 * @example
 * ```ts
 * createIcon('<svg>....</svg>', 'logo') // <span class="ezplayer-icon ezplayer-icon-logo"><svg>....</svg></span>
 * ```
 */ function createIcon(svg, type, attr) {
    if (attr === void 0) attr = {};
    var attrStr = '';
    if (attr) {
        Object.keys(attr).forEach(function(key) {
            if (!(attr[key] === undefined || attr[key] === null)) attrStr += key + '="' + attr[key] + '"';
        });
    }
    return '<span class="' + PREFIX_CLASS + "-icon " + PREFIX_CLASS + "-icon-" + type + '" ' + attrStr + ">" + svg + "</span>";
}
var IconComponents = {
    /** 播放 */ play: function(attr) {
        if (attr === void 0) attr = {};
        return createIcon(Icons.play, 'play', attr);
    },
    /** 暂停 */ pause: function(attr) {
        if (attr === void 0) attr = {};
        return createIcon(Icons.pause, 'pause', attr);
    },
    volume: function(attr) {
        if (attr === void 0) attr = {};
        return createIcon(Icons.volume(PREFIX_CLASS), 'volume', attr);
    },
    mobileFullscreen: function(attr) {
        if (attr === void 0) attr = {};
        return createIcon(Icons.mobileFullscreen, 'mobile-fullscreen', attr);
    },
    exitFullscreen: function(attr) {
        if (attr === void 0) attr = {};
        return createIcon(Icons.exitFullscreen, 'exit-fullscreen', attr);
    },
    fullscreen: function(attr) {
        if (attr === void 0) attr = {};
        return createIcon(Icons.fullscreen, 'fullscreen', attr);
    },
    exitGlobalFullscreen: function(attr) {
        if (attr === void 0) attr = {};
        return createIcon(Icons.exitGlobalFullscreen, 'exit-global-fullscreen', attr);
    },
    globalFullscreen: function(attr) {
        if (attr === void 0) attr = {};
        return createIcon(Icons.globalFullscreen, 'global-fullscreen', attr);
    },
    capturePicture: function(attr) {
        if (attr === void 0) attr = {};
        return createIcon(Icons.capturePicture, 'capture-picture', attr);
    },
    ptz: function(attr) {
        if (attr === void 0) attr = {};
        return createIcon(Icons.ptz, 'ptz', attr);
    },
    record: function(attr) {
        if (attr === void 0) attr = {};
        return createIcon(Icons.record, 'record', attr);
    },
    recordCircle: function(attr) {
        if (attr === void 0) attr = {};
        return createIcon(Icons.recordCircle, 'record-circle', attr);
    },
    talk: function(attr) {
        if (attr === void 0) attr = {};
        return createIcon(Icons.talk, 'talk', attr);
    },
    talkGrowth: function(attr) {
        if (attr === void 0) attr = {};
        return createIcon(Icons.talkGrowth(PREFIX_CLASS), 'talk-growth', attr);
    },
    zoom: function(attr) {
        if (attr === void 0) attr = {};
        return createIcon(Icons.zoom, 'zoom', attr);
    },
    more: function(attr) {
        if (attr === void 0) attr = {};
        return createIcon(Icons.more, 'more', attr);
    },
    moreDot: function(attr) {
        if (attr === void 0) attr = {};
        return createIcon(Icons.moreDot, 'more-dot', attr);
    },
    minusCircle: function(attr) {
        if (attr === void 0) attr = {};
        return createIcon(Icons.minusCircle, 'minus-circle', attr);
    },
    plusCircle: function(attr) {
        if (attr === void 0) attr = {};
        return createIcon(Icons.plusCircle, 'plus-circle', attr);
    },
    sdk: function(attr) {
        if (attr === void 0) attr = {};
        return createIcon(Icons.sdk, 'sdk', attr);
    },
    cloudRec: function(attr) {
        if (attr === void 0) attr = {};
        return createIcon(Icons.cloudRec, 'cloud-rec', attr);
    },
    cloudRecord: function(attr) {
        if (attr === void 0) attr = {};
        return createIcon(Icons.cloudRecord, 'cloud-record', attr);
    },
    error: function(attr) {
        if (attr === void 0) attr = {};
        return createIcon(Icons.error, 'error', attr);
    },
    info: function(attr) {
        if (attr === void 0) attr = {};
        return createIcon(Icons.info, 'info', attr);
    },
    close: function(attr) {
        if (attr === void 0) attr = {};
        return createIcon(Icons.close, 'close', attr);
    },
    closeCircleOutLined: function(attr) {
        if (attr === void 0) attr = {};
        return createIcon(Icons.closeCircleOutLined, 'close-circle', attr);
    },
    warnCircleOutLined: function(attr) {
        if (attr === void 0) attr = {};
        return createIcon(Icons.warnCircleOutLined, 'warn-circle', attr);
    },
    infoCircleOutLined: function(attr) {
        if (attr === void 0) attr = {};
        return createIcon(Icons.infoCircleOutLined, 'info-circle', attr);
    },
    date: function(attr) {
        if (attr === void 0) attr = {};
        return createIcon(Icons.date, 'date', attr);
    },
    filter: function(attr) {
        if (attr === void 0) attr = {};
        return createIcon(Icons.filter, 'filter', attr);
    },
    add: function(attr) {
        if (attr === void 0) attr = {};
        return createIcon(Icons.add, 'add', attr);
    },
    reduce: function(attr) {
        if (attr === void 0) attr = {};
        return createIcon(Icons.reduce, 'reduce', attr);
    }
};

function _extends$o() {
    _extends$o = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends$o.apply(this, arguments);
}
function _inherits$o(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            writable: true,
            configurable: true
        }
    });
    if (superClass) _set_prototype_of$o(subClass, superClass);
}
function _set_prototype_of$o(o, p) {
    _set_prototype_of$o = Object.setPrototypeOf || function setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
    };
    return _set_prototype_of$o(o, p);
}
var MESSAGE_DEFAULT_OPTIONS = {};
/**
 * 消息控件
 * @category Control
 */ var Message = /*#__PURE__*/ function(Control) {
    _inherits$o(Message, Control);
    function Message(options) {
        if (options === void 0) options = {};
        var _this;
        _this = Control.call(this, Object.assign({}, MESSAGE_DEFAULT_OPTIONS, _extends$o({}, options, {
            tagName: 'div',
            controlType: 'block'
        }))) || this;
        _this.options = Object.assign({}, MESSAGE_DEFAULT_OPTIONS, options);
        _this.$container.classList.add("" + PREFIX_CLASS + "-message", "" + PREFIX_CLASS + "-hide"); // 默认隐藏   `${PREFIX_CLASS}-hide`
        return _this;
    }
    var _proto = Message.prototype;
    /**
   * info 普通消息， 内容默认字体白色
   * @param {string} msg 消息内容
   * @param {number} duration 认自动关闭延时，单位秒， 默认 2s后 关闭， 需手动 调用 hide()
   */ _proto.info = function info(msg, duration) {
        if (duration === void 0) duration = 2;
        this._toast(msg, 'info', duration);
    };
    /**
   * warn 警告消息， 内容默认字体黄色
   * @param {string} msg 消息内容
   * @param {number} duration 认自动关闭延时，单位秒， 默认 2s后 关闭， 需手动 调用 hide()
   */ _proto.warn = function warn(msg, duration) {
        if (duration === void 0) duration = 2;
        this._toast(msg, 'warn', duration);
    };
    _proto.toastError = function toastError(msg, duration) {
        if (duration === void 0) duration = 2;
        this._toast(msg, 'error', duration);
    };
    /**
   * error 错误消息， 内容默认字体红色
   * @param {string} msg 消息内容
   * @param {number=} duration 认自动关闭延时，单位秒， 默认 0 不关闭， 需手动 调用 hide()
   */ _proto.error = function error(msg, duration) {
        if (duration === void 0) duration = 0;
        this._show(this._getIcon('error') + '<div class="' + PREFIX_CLASS + '-message-msg">' + (msg || '') + "</div>", duration, 'error');
    };
    _proto._toast = function _toast(msg, type, duration) {
        var _this = this;
        if (type === void 0) type = 'info';
        if (duration === void 0) duration = 2;
        if (this._toastTimer) clearTimeout(this._toastTimer);
        this._toastTimer = null;
        if (this.options.rootContainer) {
            if (!this._$toast) {
                this._$toast = document.createElement('div');
                this._$toast.classList.add("" + PREFIX_CLASS + "-toast");
            }
            this._$toast.innerHTML = '<div class="' + PREFIX_CLASS + '-toast-content">' + this._getIcon(type) + '<span class="' + PREFIX_CLASS + "-toast-msg " + PREFIX_CLASS + "-toast-" + type + '">' + (msg || '') + "</span></div>";
            this.options.rootContainer.appendChild(this._$toast);
            if (duration > 0) {
                this._toastTimer = setTimeout(function() {
                    var _this__$toast;
                    (_this__$toast = _this._$toast) == null ? void 0 : _this__$toast.remove();
                    _this._$toast = null;
                    if (_this._toastTimer) clearTimeout(_this._toastTimer);
                    _this._toastTimer = null;
                }, duration * 1000);
            }
        }
    };
    /**
   * 展示消息，如果同时调用多次只展示最后一次的消息
   * @param  {string} msg 消息内容， 支持 html dom 字符串
   * @param  {number} duration 认自动关闭延时，单位秒， 默认 0 不关闭 需手动 调用 hide()
   * @param  {MessageType} type 消息类型
   */ _proto._show = function _show(msg, duration, type) {
        var _this = this;
        if (duration === void 0) duration = 0;
        if (type === void 0) type = 'info';
        if (this._timer) {
            // 清除上一次的定时器
            clearTimeout(this._timer);
            this._timer = null;
        }
        this.$popupContainer.classList.add("" + PREFIX_CLASS + "-has-message", PREFIX_CLASS + "-has-message-" + type);
        if (typeof this.options.render === 'function') {
            //
            this.$container.innerHTML = this.options.render(msg, duration, type);
        } else {
            this.$container.innerHTML = '<div class="' + PREFIX_CLASS + "-message-content " + PREFIX_CLASS + "-message-" + type + '">' + (msg || '') + "</div>";
        }
        //
        this.$container.style.display = 'flex';
        this.$container.classList.remove("" + PREFIX_CLASS + "-hide");
        if (duration > 0) {
            this._timer = setTimeout(function() {
                _this.hide();
                if (_this._timer) clearTimeout(_this._timer);
                _this._timer = null;
            }, duration * 1000);
        }
    };
    /**
   * 销毁
   */ _proto.destroy = function destroy() {
        var _this__$toast;
        if (this._timer) {
            // 清除上一次的定时器
            clearTimeout(this._timer);
            this._timer = null;
        }
        if (this._toastTimer) clearTimeout(this._toastTimer);
        this._toastTimer = null;
        (_this__$toast = this._$toast) == null ? void 0 : _this__$toast.remove();
        this._$toast = null;
        this.hide();
        Control.prototype.destroy.call(this);
    };
    /**
   * 隐藏消息， 并清空消息内容
   */ _proto.hide = function hide() {
        var _this = this;
        // 每次隐藏都清空内 消息内容
        this.$container.innerHTML = '';
        Array.from(this.$popupContainer.classList).forEach(function(className) {
            var regex = new RegExp("^" + PREFIX_CLASS + "-has-message", 'ig');
            if (regex.test(className)) {
                _this.$popupContainer.classList.remove(className);
            }
        });
        Control.prototype.hide.call(this);
    };
    _proto._getIcon = function _getIcon(type) {
        var icon = IconComponents.infoCircleOutLined();
        switch(type){
            case 'warn':
                icon = IconComponents.warnCircleOutLined();
                break;
            case 'error':
                icon = IconComponents.closeCircleOutLined();
                break;
            default:
                icon = IconComponents.infoCircleOutLined();
        }
        return icon;
    };
    return Message;
}(Control);

function _defineProperties$8(target, props) {
    for(var i = 0; i < props.length; i++){
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
    }
}
function _create_class$8(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties$8(Constructor.prototype, protoProps);
    return Constructor;
}
function _extends$n() {
    _extends$n = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends$n.apply(this, arguments);
}
function _inherits$n(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            writable: true,
            configurable: true
        }
    });
    if (superClass) _set_prototype_of$n(subClass, superClass);
}
function _set_prototype_of$n(o, p) {
    _set_prototype_of$n = Object.setPrototypeOf || function setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
    };
    return _set_prototype_of$n(o, p);
}
/**
 * 播放/暂停控件
 * @category Control
 */ var Play = /*#__PURE__*/ function(Control) {
    _inherits$n(Play, Control);
    function Play(options) {
        var _this;
        _this = Control.call(this, _extends$n({}, options, {
            tagName: 'span',
            controlType: 'button',
            classNameSuffix: 'play'
        })) || this, _this._playing = false;
        _this._options = options;
        _this._playing = !!options.props.playing;
        _this.on(EVENTS.play, function(playing) {
            if (_this._playing !== playing) {
                _this._playing = playing;
                _this._render();
            }
        });
        _this._render();
        return _this;
    }
    var _proto = Play.prototype;
    /**
   * 点击 Control 会触发
   */ _proto._onControlClick = function _onControlClick(e) {
        this._playing = !this._playing;
        this.emit(EVENTS.control.play, this._playing);
        this._options.onClick == null ? void 0 : this._options.onClick.call(this._options, e, this._playing);
        this._render();
    };
    _proto._render = function _render() {
        if (this._playing) {
            var _this_locale;
            this.$container.innerHTML = IconComponents.play({
                title: (_this_locale = this.locale) == null ? void 0 : _this_locale.BTN_PLAY
            });
        } else {
            var _this_locale1;
            this.$container.innerHTML = IconComponents.pause({
                title: (_this_locale1 = this.locale) == null ? void 0 : _this_locale1.BTN_PAUSE
            });
        }
    };
    _create_class$8(Play, [
        {
            key: "playing",
            get: /**
   * 播放状态
   */ function get() {
                return this._playing;
            }
        }
    ]);
    return Play;
}(Control);

/**
 * 节流函数
 * @param {Function} func
 * @param {number} wait
 * @typeParam T - 函数类型
 * @returns {Function}
 */ // eslint-disable-next-line @typescript-eslint/ban-types
function throttle(func, wait) {
    var timeout = null;
    var lastCall = 0;
    return function() {
        var _this = this;
        for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
            args[_key] = arguments[_key];
        }
        var now = Date.now();
        var remaining = wait - (now - lastCall);
        if (remaining <= 0) {
            lastCall = now;
            func.apply(this, args);
        } else if (!timeout) {
            timeout = setTimeout(function() {
                lastCall = Date.now();
                timeout = null;
                func.apply(_this, args);
            }, remaining);
        }
    };
}

function _array_like_to_array$2(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _unsupported_iterable_to_array$2(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _array_like_to_array$2(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array$2(o, minLen);
}
function _create_for_of_iterator_helper_loose$2(o, allowArrayLike) {
    var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
    if (it) return (it = it.call(o)).next.bind(it);
    if (Array.isArray(o) || (it = _unsupported_iterable_to_array$2(o)) || allowArrayLike) {
        if (it) o = it;
        var i = 0;
        return function() {
            if (i >= o.length) {
                return {
                    done: true
                };
            }
            return {
                done: false,
                value: o[i++]
            };
        };
    }
    throw new TypeError("Invalid attempt to iterate non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
/**
 * 工具类
 * @category Util
 */ var Utils = /*#__PURE__*/ function() {
    function Utils() {}
    // /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone|Opera Mini)/i.test(navigator?.userAgent) ||
    // (/Macintosh/i.test(navigator?.userAgent) && navigator?.maxTouchPoints > 1); // iPad 支持多点触控;
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
   */ // prettier-ignore
    Utils.orientationEventListener = function orientationEventListener(change) {
        var _orientationTimer = null;
        var getOrientation = function() {
            var _screen, _window;
            // 现代浏览器方案
            if ((_screen = screen) == null ? void 0 : _screen.orientation) {
                // https://developer.mozilla.org/zh-CN/docs/Web/API/Screen/orientation
                return {
                    angle: screen.orientation.angle,
                    type: screen.orientation.type || screen.mozOrientation || screen.msOrientation
                };
            }
            // 旧版浏览器回退方案
            if (typeof ((_window = window) == null ? void 0 : _window.orientation) !== "undefined") {
                // window.orientation 的值：
                // 0：竖屏
                // 90：向左旋转到横屏
                // -90：向右旋转到横屏
                // 180：倒立竖屏（部分设备不支持）
                var angle = window.orientation; // -90, 0, 90
                return {
                    angle: angle >= 0 ? angle : 360 + angle,
                    type: Math.abs(angle) === 90 ? "landscape" : "portrait"
                };
            }
            if (Utils.isMobile) {
                // 最终回退方案
                return {
                    angle: window.innerWidth > window.innerHeight ? 90 : 0,
                    type: window.innerWidth > window.innerHeight ? "landscape" : "portrait"
                };
            }
            return {
                angle: 0,
                type: "unknow"
            };
        };
        var orientation = getOrientation();
        // 监听变化（兼容写法）
        var onOrientationChange = function() {
            var newOrientation = getOrientation == null ? void 0 : getOrientation();
            // console.log("onOrientationChange", newOrientation, orientation)
            // prettier-ignore
            if (newOrientation.angle !== orientation.angle || newOrientation.type !== orientation.type) {
                change == null ? void 0 : change(newOrientation);
                orientation = newOrientation;
            }
        };
        var onResize = function() {
            // 防抖处理
            if (_orientationTimer) clearTimeout(_orientationTimer);
            if (onOrientationChange) _orientationTimer = setTimeout(onOrientationChange, 200);
        };
        // 现代浏览器：优先使用 screen.orientation API
        if (screen.orientation) {
            screen.orientation.addEventListener("change", onOrientationChange);
        } else if ("onorientationchange" in window) {
            // iOS/旧Android：使用 window.orientation + orientationchange 事件
            window.addEventListener("orientationchange", onOrientationChange);
        } else if (Utils.isMobile) {
            // 优先判断是否是移动端
            // 桌面端：通过 resize 事件 + 宽高比判断
            window.addEventListener("resize", onResize);
        }
        // 极端兼容：结合 CSS 媒体查询 window.matchMedia('(orientation: portrait)')
        return [
            orientation,
            function() {
                // 现代浏览器：优先使用 screen.orientation API
                if (screen.orientation && onOrientationChange) {
                    screen.orientation.removeEventListener("change", onOrientationChange);
                } else if ("onorientationchange" in window && onOrientationChange) {
                    // iOS/旧Android：使用 window.orientation + orientationchange 事件
                    window.removeEventListener("orientationchange", onOrientationChange);
                } else if (Utils.isMobile) {
                    // 优先判断是否是移动端
                    window.removeEventListener("resize", onResize);
                }
                onOrientationChange = null;
                onResize = null;
                getOrientation = null;
                if (_orientationTimer) {
                    clearTimeout(_orientationTimer);
                    _orientationTimer = null;
                }
            }
        ];
    };
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
   */ // prettier-ignore
    Utils.resizeObserver = function resizeObserver(node, callback) {
        // prettier-ignore
        var observerFn = function(entries, observer) {
            for(var _iterator = _create_for_of_iterator_helper_loose$2(entries), _step; !(_step = _iterator()).done;){
                var entry = _step.value;
                if (entry.target === node) {
                    if (callback) callback(entries, observer);
                }
            }
        };
        var observer = new ResizeObserver(throttle(observerFn, 50));
        observer.observe(node);
        return {
            unobserve: function unobserve() {
                try {
                    // Proxy 代理的对象执行会报错
                    observer == null ? void 0 : observer.unobserve(node);
                } catch (error) {
                }
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                observerFn = null;
            },
            disconnect: function disconnect() {
                observer == null ? void 0 : observer.disconnect();
                observer = null;
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                observerFn = null;
            }
        };
    };
    return Utils;
}();
// 不要使用 window, 如果在 worker 中会报错
/**
   * 判断是否是移动端, (iPadOS 13+ 移除了 "iPad" 标识)
   * @example
   * ```ts
   * Utils.isMobile  // true | false
   * ```
   */ Utils.isMobile = require$$1.isMobile();

function _defineProperties$7(target, props) {
    for(var i = 0; i < props.length; i++){
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
    }
}
function _create_class$7(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties$7(Constructor.prototype, protoProps);
    return Constructor;
}
var PROGRESS_DEFAULT_OPTIONS = {
    step: 0.01,
    range: [
        0,
        1
    ],
    draggable: true,
    disabled: false,
    showPercent: false,
    showPlus: false,
    showMinus: false,
    isRotated: false,
    onChange: function() {
    /* no-op */ },
    renderText: function(_, percent) {
        return (percent * 100).toFixed(0);
    }
};
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
 */ var Progress = /*#__PURE__*/ function() {
    function Progress(options) {
        var _this_options_range;
        this._percent = 0;
        this._value = 0;
        this._disabled = false;
        this._delegateSliderMouseDown = null;
        this._delegateSliderHandleMouseDown = null;
        this._delegateProgressMouseDown = null;
        this._delegatePlusClick = null;
        this._delegateMinusClick = null;
        this._isRotated = false;
        this.options = Object.assign({}, PROGRESS_DEFAULT_OPTIONS, options);
        if (((_this_options_range = this.options.range) == null ? void 0 : _this_options_range.length) !== 2) {
            throw new Error('Progress range must be an array with two elements.');
        }
        if (this.options.range[0] >= this.options.range[1]) {
            throw new Error('Progress range first element must be less than the second element.');
        }
        this._isRotated = this.options.isRotated || false;
        this.$container = options.container;
        this._render();
        this._eventListeners();
        var _this_options_defaultValue;
        var value = (_this_options_defaultValue = this.options.defaultValue) != null ? _this_options_defaultValue : this.options.range[0]; // 设置默认值
        this._value = +value.toFixed(2); // 保留两位小数
        // prettier-ignore
        this._percent = +((value - this.options.range[0]) / (this.options.range[1] - this.options.range[0])).toFixed(2);
        this._updateUI();
        this.disabled = this.options.disabled;
    }
    var _proto = Progress.prototype;
    /**
   * 是否旋转了
   * @param rotated
   */ _proto.isRotate = function isRotate(rotated) {
        this._isRotated = rotated;
    };
    /**
   * 销毁 Progress 实例，移除事件监听器
   * @returns {void}
   * @memberof Progress
   * @example
   * ```ts
   * progress.destroy();
   * ```
   */ _proto.destroy = function destroy() {
        var _this__delegateSliderMouseDown_destroy, _this__delegateSliderMouseDown, _this__delegateSliderHandleMouseDown_destroy, _this__delegateSliderHandleMouseDown, _this__delegateProgressMouseDown_destroy, _this__delegateProgressMouseDown, _this__delegatePlusClick_destroy, _this__delegatePlusClick, _this__delegateMinusClick_destroy, _this__delegateMinusClick;
        (_this__delegateSliderMouseDown = this._delegateSliderMouseDown) == null ? void 0 : (_this__delegateSliderMouseDown_destroy = _this__delegateSliderMouseDown.destroy) == null ? void 0 : _this__delegateSliderMouseDown_destroy.call(_this__delegateSliderMouseDown);
        this._delegateSliderMouseDown = null;
        (_this__delegateSliderHandleMouseDown = this._delegateSliderHandleMouseDown) == null ? void 0 : (_this__delegateSliderHandleMouseDown_destroy = _this__delegateSliderHandleMouseDown.destroy) == null ? void 0 : _this__delegateSliderHandleMouseDown_destroy.call(_this__delegateSliderHandleMouseDown);
        this._delegateSliderHandleMouseDown = null;
        (_this__delegateProgressMouseDown = this._delegateProgressMouseDown) == null ? void 0 : (_this__delegateProgressMouseDown_destroy = _this__delegateProgressMouseDown.destroy) == null ? void 0 : _this__delegateProgressMouseDown_destroy.call(_this__delegateProgressMouseDown);
        this._delegateProgressMouseDown = null;
        (_this__delegatePlusClick = this._delegatePlusClick) == null ? void 0 : (_this__delegatePlusClick_destroy = _this__delegatePlusClick.destroy) == null ? void 0 : _this__delegatePlusClick_destroy.call(_this__delegatePlusClick);
        this._delegatePlusClick = null;
        (_this__delegateMinusClick = this._delegateMinusClick) == null ? void 0 : (_this__delegateMinusClick_destroy = _this__delegateMinusClick.destroy) == null ? void 0 : _this__delegateMinusClick_destroy.call(_this__delegateMinusClick);
        this._delegateMinusClick = null;
        if (this.$content) this.$container.removeChild(this.$content);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.$content = null;
    };
    _proto._updateValuePercent = function _updateValuePercent(type, value) {
        if (type === 'percent') {
            if (value < 0 || value > 1) {
                return;
            }
            if (this._percent !== value) {
                this._percent = +value.toFixed(2);
                // this._value = +(this.options.range[0] + (this.options.range[1] - this.options.range[0]) * this._percent).toFixed(2);
                this._convertPercentToValue(this._percent);
                // 更新进度条的值和百分比
                this.options.onChange == null ? void 0 : this.options.onChange.call(this.options, this._value, this._percent, this.options.range);
                this._updateUI();
            }
        } else if (type === 'value') {
            if (value < this.options.range[0] || value > this.options.range[1]) {
                return;
            }
            if (this._value !== value) {
                this._value = +value.toFixed(2); // 保留两位小数
                // prettier-ignore
                this._convertValueToPercent(this._value);
                // 更新进度条的值和百分比
                this.options.onChange == null ? void 0 : this.options.onChange.call(this.options, this._value, this._percent, this.options.range);
                this._updateUI();
            }
        }
    };
    _proto._convertPercentToValue = function _convertPercentToValue(percent) {
        this._value = +(this.options.range[0] + (this.options.range[1] - this.options.range[0]) * percent).toFixed(2);
    };
    _proto._convertValueToPercent = function _convertValueToPercent(value) {
        this._percent = +((value - this.options.range[0]) / (this.options.range[1] - this.options.range[0])).toFixed(2);
    };
    _proto._render = function _render() {
        this.$content = document.createElement('div');
        var _this_options_className;
        this.$content.className = PREFIX_CLASS + "-progress " + ((_this_options_className = this.options.className) != null ? _this_options_className : '');
        this.$content.innerHTML = (this.options.showPercent ? '<div class="' + PREFIX_CLASS + '-progress-text">' + (this.options.renderText == null ? void 0 : this.options.renderText.call(this.options, this._value, this._percent, this.options.range)) + "</div>" : '') + "\n            " + (this.options.showPlus ? '<div class="' + PREFIX_CLASS + '-progress-plus">\n              ' + IconComponents.plusCircle() + "\n            </div>" : '') + '\n            <div class="' + PREFIX_CLASS + '-progress-slider">\n                <div class="' + PREFIX_CLASS + '-progress-slider-fill"></div>\n                <div class="' + PREFIX_CLASS + '-progress-slider-handle" style="top: 100%"></div>\n            </div>\n            ' + (this.options.showMinus ? '<div class="' + PREFIX_CLASS + '-progress-minus">\n            ' + IconComponents.minusCircle() + "\n            </div>" : '');
        this.$container.appendChild(this.$content);
    };
    _proto._updateUI = function _updateUI() {
        var $progress = this.$content;
        $progress == null ? void 0 : $progress.setAttribute('data-value', this._value + '');
        // prettier-ignore
        if ($progress.querySelector("." + PREFIX_CLASS + "-progress-slider-fill")) {
            var percent = +(this._percent * 100).toFixed(0);
            if (this.options.showPercent) {
                $progress.querySelector("." + PREFIX_CLASS + "-progress-text").innerHTML = this.options.renderText == null ? void 0 : this.options.renderText.call(this.options, this._value, this._percent, this.options.range);
            }
            $progress.querySelector("." + PREFIX_CLASS + "-progress-slider-fill").style.height = percent + '%';
            $progress.querySelector("." + PREFIX_CLASS + "-progress-slider-handle").style.top = 100 - percent + '%';
        }
    };
    _proto._eventListeners = function _eventListeners() {
        var _this = this;
        var mousedownName = window.PointerEvent ? 'pointerdown' : 'mousedown';
        // prettier-ignore
        this._delegateSliderMouseDown = delegate(this.$content, "." + PREFIX_CLASS + "-progress-slider", mousedownName, function(e) {
            var // 垂直方向Y轴是反的，所以用高度减去点击位置
            _this_options_onProgressClick, _this_options;
            e.stopPropagation();
            if (e.delegateTarget.classList.contains("" + PREFIX_CLASS + "-disabled") || _this._disabled) {
                return;
            }
            // prettier-ignore
            var rect = _this.$content.querySelector("." + PREFIX_CLASS + "-progress-slider").getBoundingClientRect();
            var percent = 0;
            // 兼容移动端节点旋转 90度角
            if (Utils.isMobile && _this._isRotated) {
                var positionToBottomLen = Math.max(0, Math.min(e.clientX - rect.x, rect.width));
                // 注意：分母是宽
                percent = +(positionToBottomLen / rect.width).toFixed(2);
            } else {
                var positionToBottomLen1 = Math.max(0, Math.min(rect.height - (e.clientY - rect.y), rect.height));
                percent = +(positionToBottomLen1 / rect.height).toFixed(2);
            }
            _this._convertPercentToValue(percent);
            (_this_options = _this.options) == null ? void 0 : (_this_options_onProgressClick = _this_options.onProgressClick) == null ? void 0 : _this_options_onProgressClick.call(_this_options, _this._value, percent, _this.options.range);
            // prettier-ignore
            _this.percent = percent;
        });
        // prettier-ignore
        this._delegateSliderHandleMouseDown = delegate(this.$content, "." + PREFIX_CLASS + "-progress-slider-handle", mousedownName, function(e) {
            e.stopPropagation();
            if (!_this.options.draggable) {
                return;
            }
            if (e.delegateTarget.classList.contains("" + PREFIX_CLASS + "-disabled") || _this._disabled) {
                return;
            }
            var startY = _this._isRotated ? e.clientX : e.clientY;
            var startHeight = _this.$content.querySelector("." + PREFIX_CLASS + "-progress-slider-fill").offsetHeight;
            var sliderHeight = _this.$content.querySelector("." + PREFIX_CLASS + "-progress-slider").offsetHeight;
            var handleMouseMove = throttle(function(e) {
                e.stopPropagation();
                if (!_this.options.draggable || _this._disabled) {
                    return;
                }
                var deltaY = startY - (_this._isRotated ? e.clientX : e.clientY); // 注意垂直方向Y轴是反的
                var newHeight = startHeight + (_this._isRotated ? -deltaY : deltaY);
                newHeight = Math.max(0, Math.min(newHeight, sliderHeight));
                // prettier-ignore
                _this.percent = +(newHeight / sliderHeight).toFixed(2);
            }, 20);
            var $container = _this.$content;
            var mousemoveName = window.PointerEvent ? 'pointermove' : 'mousemove';
            var mouseupName = window.PointerEvent ? 'pointerup' : 'mouseup';
            var mouseleaveName = window.PointerEvent ? 'pointerleave' : 'mouseleave';
            function handleMouseUp() {
                $container.removeEventListener(mousemoveName, handleMouseMove);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                handleMouseMove = null;
                $container.removeEventListener(mouseupName, handleMouseUp);
                $container.removeEventListener(mouseleaveName, handleMouseUp);
            }
            $container.addEventListener(mousemoveName, handleMouseMove);
            $container.addEventListener(mouseupName, handleMouseUp);
            $container.addEventListener(mouseleaveName, handleMouseUp);
        });
        // plug
        if (this.options.showPlus) {
            var clickName = window.PointerEvent ? 'pointerdown' : 'click';
            this._delegatePlusClick = delegate(this.$content, "." + PREFIX_CLASS + "-progress-plus", clickName, function(e) {
                e.stopPropagation();
                if (e.delegateTarget.classList.contains("" + PREFIX_CLASS + "-disabled") || _this._disabled) {
                    return;
                }
                var value = _this._value + _this.options.step;
                if (value <= _this.options.range[1]) {
                    _this.value = value;
                } else {
                    _this.value = _this.options.range[1];
                }
                _this.options.onPlusClick == null ? void 0 : _this.options.onPlusClick.call(_this.options, _this.value, _this.percent, _this.options.range);
            });
        }
        // minus
        if (this.options.showMinus) {
            var clickName1 = window.PointerEvent ? 'pointerdown' : 'click';
            // prettier-ignore
            this._delegateMinusClick = delegate(this.$content, "." + PREFIX_CLASS + "-progress-minus", clickName1, function(e) {
                e.stopPropagation();
                if (e.delegateTarget.classList.contains("" + PREFIX_CLASS + "-disabled") || _this._disabled) {
                    return;
                }
                var value = _this._value - _this.options.step;
                if (value >= _this.options.range[0]) {
                    _this.value = value;
                } else {
                    _this.value = _this.options.range[0];
                }
                _this.options.onMinusClick == null ? void 0 : _this.options.onMinusClick.call(_this.options, _this.value, _this.percent, _this.options.range);
            }, true);
        }
        [
            'mousedown',
            'touchstart',
            'touchmove',
            'dblclick'
        ].forEach(function(name) {
            delegate(_this.$container, "." + PREFIX_CLASS + "-progress", name, function(e) {
                e.stopPropagation();
                e.preventDefault(); // 阻止默认的触摸行为
            });
        });
    };
    _create_class$7(Progress, [
        {
            key: "disabled",
            get: function get() {
                return this._disabled;
            },
            set: function set(disabled) {
                this._disabled = disabled;
            }
        },
        {
            key: "value",
            get: /**
   * 获取进度条值
   * @returns {number} 当前进度条值
   * @example
   * ```ts
   * const value = progress.value; // 获取当前进度条值
   * console.log(value); // 输出值
   * ```
   */ function get() {
                return this._value; //
            },
            set: function set(value) {
                this._updateValuePercent('value', value);
            }
        },
        {
            key: "percent",
            get: /**
   * 获取进度百分比
   * @returns {number}   当前进度条百分比
   * @example
   * ```ts
   * const percent = progress.percent; // 获取当前进度条百分比
   * console.log(percent); // 输出百分比
   * ```
   */ function get() {
                return this._percent;
            },
            set: function set(percent) {
                this._updateValuePercent('percent', percent);
            }
        }
    ]);
    return Progress;
}();

function _defineProperties$6(target, props) {
    for(var i = 0; i < props.length; i++){
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
    }
}
function _create_class$6(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties$6(Constructor.prototype, protoProps);
    return Constructor;
}
function _extends$m() {
    _extends$m = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends$m.apply(this, arguments);
}
function _inherits$m(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            writable: true,
            configurable: true
        }
    });
    if (superClass) _set_prototype_of$m(subClass, superClass);
}
function _set_prototype_of$m(o, p) {
    _set_prototype_of$m = Object.setPrototypeOf || function setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
    };
    return _set_prototype_of$m(o, p);
}
var VOLUME_DEFAULT_OPTIONS = {
    volume: 0.8,
    muted: false,
    open: false,
    trigger: 'hover',
    onOpenChange: function() {},
    onChange: function() {}
};
/**
 * 音量调节控件
 * @category Control
 */ var Volume = /*#__PURE__*/ function(Control) {
    _inherits$m(Volume, Control);
    function Volume(options) {
        if (options === void 0) options = {};
        var _this;
        var _this__options_props, _this__options_props1, _this__options_props2, _this__options_props3;
        _this = Control.call(this, _extends$m({}, options, {
            tagName: 'span',
            classNameSuffix: 'volume',
            controlType: 'button'
        })) || this, _this._muted = false, _this._volume = 0, /** 用来记录静音前的音量 */ _this._lastVolume = 0, _this._progress = null;
        _this._options = deepmerge(VOLUME_DEFAULT_OPTIONS, options, {
            clone: false
        });
        _this._render();
        // prettier-ignore
        _this._volume = ((_this__options_props = _this._options.props) == null ? void 0 : _this__options_props.volume) >= 1 ? 1 : ((_this__options_props1 = _this._options.props) == null ? void 0 : _this__options_props1.volume) <= 0 ? 0 : +((_this__options_props2 = _this._options.props) == null ? void 0 : _this__options_props2.volume.toFixed(2)); // 音量范围 [0-1]
        _this._lastVolume = _this._volume;
        _this._muted = !!((_this__options_props3 = _this._options.props) == null ? void 0 : _this__options_props3.muted) || false;
        // 轻应用私有暂时不支持调节音量
        if (!(Utils.isMobile || _this._options.PLAY_TYPE === 'ezopen')) {
            var _this__options_props4, _this__options_props5;
            _this.picker = new Picker(_this.$container, {
                getPopupContainer: function() {
                    return _this.$container;
                },
                trigger: _this._options.trigger,
                // trigger: "click",
                open: _this._options.open,
                offset: [
                    0,
                    -10
                ],
                placement: 'top',
                onOpenChange: function(open) {
                    _this._options.onOpenChange == null ? void 0 : _this._options.onOpenChange.call(_this._options, open, _this._muted ? _this._lastVolume : _this.volume, _this._muted);
                    // prettier-ignore
                    _this.emit(EVENTS.control.volumePanelOpenChange, open, _this._lastVolume, _this._muted);
                }
            });
            _this._progress = new Progress({
                container: _this.picker.$body,
                defaultValue: ((_this__options_props4 = _this._options.props) == null ? void 0 : _this__options_props4.muted) ? 0 : (_this__options_props5 = _this._options.props) == null ? void 0 : _this__options_props5.volume,
                range: [
                    0,
                    1
                ],
                step: 0.1,
                showPercent: true,
                className: "" + PREFIX_CLASS + "-volume-progress",
                // 为了解决点击进度调取消静音
                onProgressClick: function() {
                    _this.muted = false;
                },
                onChange: function(value) {
                    if (value !== _this._volume) _this.volume = value;
                }
            });
        }
        _this._updateUI();
        _this._addEventListener();
        _this.on(EVENTS.audioCodecUnsupported, function() {
            _this.disabled = true;
        });
        _this.on(EVENTS.volumechange, function(volume, muted) {
            // 接收
            if (_this._muted !== muted) _this.muted = muted;
            if (_this._lastVolume !== volume) _this.volume = volume;
        });
        return _this;
    }
    var _proto = Volume.prototype;
    /**
   * 销毁
   */ _proto.destroy = function destroy() {
        var _this__progress_destroy, _this__progress, _this_picker;
        (_this__progress = this._progress) == null ? void 0 : (_this__progress_destroy = _this__progress.destroy) == null ? void 0 : _this__progress_destroy.call(_this__progress);
        this._progress = null;
        (_this_picker = this.picker) == null ? void 0 : _this_picker.destroy();
        this.picker = null;
        Control.prototype.destroy.call(this);
    };
    _proto._toggleMute = function _toggleMute() {
        if (this.disabled) return;
        // 如果当前音量为 0， 再次点击时候，恢复音量 为初始化设置的值， 如果值为 0 ，默认设置为 0.5
        if (this._lastVolume === 0) {
            var _this__options_props;
            this.volume = ((_this__options_props = this._options.props) == null ? void 0 : _this__options_props.volume) || 0.5;
            // 取消静音
            this.muted = false;
            return;
        }
        if (this.muted) {
            // 取消静音
            this.muted = false;
        } else {
            // 静音
            this.muted = true;
        }
    };
    _proto._updateUI = function _updateUI() {
        this._$content.classList.remove(PREFIX_CLASS + '-icon-volume-muted');
        this._$content.classList.remove(PREFIX_CLASS + '-icon-volume-zero');
        this._$content.classList.remove(PREFIX_CLASS + '-icon-volume-low');
        this._$content.classList.remove(PREFIX_CLASS + '-icon-volume-high');
        if (this._muted) {
            var // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            _this_locale, _this;
            this._volume = 0;
            this._$content.classList.add(PREFIX_CLASS + '-icon-volume-muted');
            this._$content.setAttribute('title', ((_this = this) == null ? void 0 : (_this_locale = _this.locale) == null ? void 0 : _this_locale.BTN_MUTED) || 'muted');
        } else {
            var // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            _this_locale1, _this1;
            this._$content.classList.remove(PREFIX_CLASS + '-icon-volume-muted');
            if (this._volume === 0) {
                this._$content.classList.add(PREFIX_CLASS + '-icon-volume-zero');
            } else if (this._volume <= 0.5) {
                this._$content.classList.add(PREFIX_CLASS + '-icon-volume-low');
            } else {
                this._$content.classList.add(PREFIX_CLASS + '-icon-volume-high');
            }
            this._$content.setAttribute('title', ((_this1 = this) == null ? void 0 : (_this_locale1 = _this1.locale) == null ? void 0 : _this_locale1.BTN_VOLUME) || 'volume');
        }
    };
    _proto._render = function _render() {
        var _this_locale;
        this.$container.innerHTML = IconComponents.volume({
            title: (_this_locale = this.locale) == null ? void 0 : _this_locale.BTN_VOLUME
        });
    };
    /**
   * 点击 Control 会触发
   */ _proto._onControlClick = function _onControlClick() {
    // this._options.onClick?.(e);
    };
    _proto._addEventListener = function _addEventListener() {
        var _this = this;
        // 这里不要用 click 事件，因为拖动音量大小时鼠标移动到图标上会触发 click
        // prettier-ignore
        delegate(this.$container, "." + PREFIX_CLASS + "-control-volume", "mousedown", function() {
            if (!_this.$container.classList.contains("" + PREFIX_CLASS + "-disabled")) {
                _this._toggleMute();
            }
        });
    };
    _create_class$6(Volume, [
        {
            key: "muted",
            get: /**
   * 是否静音
   */ function get() {
                return this._muted;
            },
            set: function set(muted) {
                if (this._muted !== muted) {
                    if (muted) {
                        // 取消静音恢复UI
                        this._volume = 0;
                        if (this._progress) this._progress.value = 0;
                    } else {
                        // 取消静音恢复UI
                        this._volume = this._lastVolume;
                        if (this._progress) this._progress.value = this._lastVolume;
                    }
                    this._muted = muted;
                    this._options.onChange == null ? void 0 : this._options.onChange.call(this._options, this.volume, muted);
                    this.emit(EVENTS.control.volumechange, this.volume, muted);
                }
                this._updateUI();
            }
        },
        {
            key: "volume",
            get: /**
   * 当前音量值（真实值 即使静音）
   */ function get() {
                return this._lastVolume;
            },
            set: function set(volume) {
                if (volume >= 0 && volume <= 1) {
                    var _volume = +volume.toFixed(2);
                    if (this._lastVolume !== _volume) {
                        this._volume = _volume;
                        this._lastVolume = this._volume;
                        if (this._progress) {
                            // 静音时进度条为 0
                            this._progress.value = this._muted ? 0 : _volume;
                        }
                        this._options.onChange == null ? void 0 : this._options.onChange.call(this._options, _volume, this._muted);
                        this.emit(EVENTS.control.volumechange, _volume, this._muted);
                    }
                    this._updateUI();
                }
            }
        },
        {
            key: "disabled",
            get: /**
   * 是否禁用
   */ function get() {
                return this._disabled;
            },
            set: function set(disabled) {
                this._disabled = disabled;
                if (this.picker) {
                    this.picker.disabled = disabled;
                }
                this._updateDisabledState(disabled);
            }
        },
        {
            key: "_$content",
            get: function get() {
                // prettier-ignore
                return this.$container.querySelector("." + PREFIX_CLASS + "-icon-volume");
            }
        }
    ]);
    return Volume;
}(Control);

function asyncGeneratorStep$5(gen, resolve, reject, _next, _throw, key, arg) {
    try {
        var info = gen[key](arg);
        var value = info.value;
    } catch (error) {
        reject(error);
        return;
    }
    if (info.done) {
        resolve(value);
    } else {
        Promise.resolve(value).then(_next, _throw);
    }
}
function _async_to_generator$5(fn) {
    return function() {
        var self = this, args = arguments;
        return new Promise(function(resolve, reject) {
            var gen = fn.apply(self, args);
            function _next(value) {
                asyncGeneratorStep$5(gen, resolve, reject, _next, _throw, "next", value);
            }
            function _throw(err) {
                asyncGeneratorStep$5(gen, resolve, reject, _next, _throw, "throw", err);
            }
            _next(undefined);
        });
    };
}
function _ts_generator$5(thisArg, body) {
    var f, y, t, _ = {
        label: 0,
        sent: function() {
            if (t[0] & 1) throw t[1];
            return t[1];
        },
        trys: [],
        ops: []
    }, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
    }), g;
    function verb(n) {
        return function(v) {
            return step([
                n,
                v
            ]);
        };
    }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while(g && (g = 0, op[0] && (_ = 0)), _)try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [
                op[0] & 2,
                t.value
            ];
            switch(op[0]){
                case 0:
                case 1:
                    t = op;
                    break;
                case 4:
                    _.label++;
                    return {
                        value: op[1],
                        done: false
                    };
                case 5:
                    _.label++;
                    y = op[1];
                    op = [
                        0
                    ];
                    continue;
                case 7:
                    op = _.ops.pop();
                    _.trys.pop();
                    continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                        _ = 0;
                        continue;
                    }
                    if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                        _.label = op[1];
                        break;
                    }
                    if (op[0] === 6 && _.label < t[1]) {
                        _.label = t[1];
                        t = op;
                        break;
                    }
                    if (t && _.label < t[2]) {
                        _.label = t[2];
                        _.ops.push(op);
                        break;
                    }
                    if (t[2]) _.ops.pop();
                    _.trys.pop();
                    continue;
            }
            op = body.call(thisArg, _);
        } catch (e) {
            op = [
                6,
                e
            ];
            y = 0;
        } finally{
            f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return {
            value: op[0] ? op[1] : void 0,
            done: true
        };
    }
}
var FULLSCREEN_DEFAULT = {
    prefix: 'ezplayer'
};
var Provider = /*#__PURE__*/ function() {
    function Provider() {
        this.fullscreens = [];
    }
    var _proto = Provider.prototype;
    _proto.add = function add(element, onChange) {
        if (element) {
            var index = this.fullscreens.findIndex(function(item) {
                return item.element === element;
            });
            if (index >= 0) {
                if (!this.fullscreens[index].onChange) {
                    this.fullscreens[index].onChange = [];
                    this.fullscreens[index].onChange.push(onChange);
                } else {
                    this.fullscreens[index].onChange.push(onChange);
                }
            } else {
                this.fullscreens.push({
                    element: element,
                    onChange: [
                        onChange
                    ]
                });
            }
        }
    };
    _proto.getChanges = function getChanges(element) {
        var item = this.fullscreens.find(function(item) {
            return item.element === element;
        });
        if (item) {
            return (item == null ? void 0 : item.onChange) || [];
        }
        return [];
    };
    _proto.remove = function remove(element, onChange) {
        var index = this.fullscreens.findIndex(function(item) {
            return item.element === element;
        });
        if (index >= 0) {
            var _this_fullscreens_index_onChange;
            var targetItem = (_this_fullscreens_index_onChange = this.fullscreens[index].onChange) == null ? void 0 : _this_fullscreens_index_onChange.find(function(item) {
                return item === onChange;
            });
            if (targetItem) {
                var _this_fullscreens_index_onChange1;
                var changes = (_this_fullscreens_index_onChange1 = this.fullscreens[index].onChange) == null ? void 0 : _this_fullscreens_index_onChange1.filter(function(change) {
                    return change !== targetItem;
                });
                this.fullscreens[index].onChange = changes;
            }
            if (!this.fullscreens[index].onChange || this.fullscreens[index].onChange && this.fullscreens[index].onChange.length === 0) {
                this.fullscreens.splice(index, 1);
            }
        }
    };
    Provider.getInstance = function getInstance() {
        if (!Provider.instance) {
            Provider.instance = new Provider();
        }
        return Provider.instance;
    };
    return Provider;
}();
// eslint-disable-next-line @typescript-eslint/naming-convention
var __fullscreenProvider__ = Provider.getInstance();
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
 */ var Fullscreen$1 = /*#__PURE__*/ function() {
    function Fullscreen(container, options) {
        if (options === void 0) options = {};
        this._isCurrentFullscreen = false;
        this._isFullscreen = false;
        /** safari 浏览器在全屏状态下 再次调用全屏 screenfull.element 为 undefined, 记录上一次的全屏节点， 避免同一个节点多次调用全屏操作 */ this._currentFullscreenElementList = [];
        this.$container = container;
        this._options = Object.assign({}, FULLSCREEN_DEFAULT, options);
        if (this._options.onChange && Utils.isMobile) {
            __fullscreenProvider__.add(this.$container, this._options.onChange);
        }
        this._isFullscreen = !!this._options.isFullscreen;
        this._fullscreenchange2 = this._fullscreenchange2.bind(this);
        if (screenfull.isEnabled) {
            screenfull.on('change', this._fullscreenchange2);
        }
    }
    var _proto = Fullscreen.prototype;
    /**
   * 全屏
   * @returns Promise<void>
   */ _proto.fullscreen = function fullscreen() {
        return _async_to_generator$5(function() {
            return _ts_generator$5(this, function(_state) {
                switch(_state.label){
                    case 0:
                        if (!Utils.isMobile) return [
                            3,
                            1
                        ];
                        this._fullscreenchange(this.$container, true);
                        return [
                            3,
                            3
                        ];
                    case 1:
                        return [
                            4,
                            screenfull.request(this.$container)
                        ];
                    case 2:
                        // eslint-disable-next-line @typescript-eslint/return-await
                        return [
                            2,
                            _state.sent()
                        ];
                    case 3:
                        return [
                            2
                        ];
                }
            });
        }).call(this);
    };
    /**
   * 退出全屏
   * @returns Promise<void>
   */ _proto.exitFullscreen = function exitFullscreen() {
        return _async_to_generator$5(function() {
            return _ts_generator$5(this, function(_state) {
                switch(_state.label){
                    case 0:
                        if (!Utils.isMobile) return [
                            3,
                            1
                        ];
                        this._fullscreenchange(this.$container, false);
                        return [
                            3,
                            3
                        ];
                    case 1:
                        if (!this._isFullscreen) return [
                            3,
                            3
                        ];
                        return [
                            4,
                            screenfull.exit()
                        ];
                    case 2:
                        // eslint-disable-next-line @typescript-eslint/return-await
                        return [
                            2,
                            _state.sent()
                        ];
                    case 3:
                        return [
                            2
                        ];
                }
            });
        }).call(this);
    };
    /**
   * 全屏切换
   * @returns Promise<void>
   */ _proto.toggle = function toggle() {
        return _async_to_generator$5(function() {
            return _ts_generator$5(this, function(_state) {
                switch(_state.label){
                    case 0:
                        if (!Utils.isMobile) return [
                            3,
                            1
                        ];
                        this._fullscreenchange(this.$container, !this._isCurrentFullscreen);
                        return [
                            3,
                            3
                        ];
                    case 1:
                        return [
                            4,
                            screenfull.toggle(this.$container)
                        ];
                    case 2:
                        // eslint-disable-next-line @typescript-eslint/return-await
                        return [
                            2,
                            _state.sent()
                        ];
                    case 3:
                        return [
                            2
                        ];
                }
            });
        }).call(this);
    };
    /**
   * 全屏监听销毁
   */ _proto.destroy = function destroy() {
        if (screenfull.isEnabled) {
            screenfull.off('change', this._fullscreenchange2);
        }
        if (Utils.isMobile && this._options.onChange) {
            __fullscreenProvider__.remove(this.$container, this._options.onChange);
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this._fullscreenchange2 = null;
    };
    /**
   * screenfull change event
   */ _proto._fullscreenchange2 = function _fullscreenchange2() {
        this._fullscreenchange();
    };
    // prettier-ignore
    _proto._fullscreenchange = function _fullscreenchange(element, isFullscreen) {
        var _this = this;
        // 全屏状态 `screenfull.isFullscreen === true`, 并且 `screenfull?.element === 当前节点` 才可以确定的当前节点是全屏状态 （Safari同一个节点多次全屏 screenfull?.element === null）
        // 退出全屏状态 screenfull.isFullscreen === false 全部退出（没有节点处于全屏状态）
        this._isFullscreen = screenfull.isFullscreen;
        if (element) {
            // 移动端 模拟全屏
            this._isCurrentFullscreen = !!isFullscreen;
            this._currentFullscreenElementList = [];
        } else if (this._isFullscreen) {
            // 浏览器标准 api 触发, 获取当前全屏元素
            var targetElement = screenfull.element;
            var index1 = this._currentFullscreenElementList.indexOf(targetElement);
            if (targetElement && index1 === -1) {
                this._currentFullscreenElementList.unshift(targetElement);
            } else if (targetElement && index1 >= 1) {
                // FIXME:当已经全屏的节点 不在第一个位置，然后调用全屏api使其在第一个位置, 这里的处理就会有问题，因为多个节点同时处于全屏状态，已经全屏的节点（不是最上层）再次全屏获取的
                // 第一个位置节点退出全屏 （退出只能从第一个位置一次退出或 ESC 全部退出）
                this._currentFullscreenElementList.shift();
            } else ;
            var containerIndex = this._currentFullscreenElementList.indexOf(this.$container);
            // 当 $container 已经全屏，但是不在最上层时， this._isCurrentFullscreen 可能会为false
            this._isCurrentFullscreen = containerIndex >= 0;
        } else {
            this._isCurrentFullscreen = false;
            this._currentFullscreenElementList = [];
        }
        if (this._isCurrentFullscreen) {
            var _this_$container;
            (_this_$container = this.$container) == null ? void 0 : _this_$container.classList.add("" + this._options.prefix + "-fullscreen");
        } else {
            var _this_$container1, // 全局全屏
            _this_$container2;
            (_this_$container1 = this.$container) == null ? void 0 : _this_$container1.classList.remove("" + this._options.prefix + "-fullscreen");
            (_this_$container2 = this.$container) == null ? void 0 : _this_$container2.classList.remove("" + this._options.prefix + "-global-fullscreen");
        }
        if (Utils.isMobile) {
            // 移动端的全屏是模拟的
            // 全屏或退出全屏都会触发 change
            __fullscreenProvider__.getChanges(this.$container).forEach(function(change) {
                change({
                    // safari 浏览器在全屏状态下 再次调用全屏 screenfull.element 为 undefined
                    // element 和 isFullscreen 为了兼容给移动端 （移动端一般不采用浏览器系统全屏， 其实就是旋转90度）
                    isCurrentFullscreen: _this._isCurrentFullscreen,
                    /** 记录浏览器系统全屏与否 */ isFullscreen: _this._isFullscreen,
                    isMobile: Utils.isMobile
                });
            });
        } else {
            // 非移动端 默认监听浏览器系统全屏change事件
            this._options.onChange == null ? void 0 : this._options.onChange.call(this._options, {
                // safari 浏览器在全屏状态下 再次调用全屏 screenfull.element 为 undefined
                // element 和 isFullscreen 为了兼容给移动端 （移动端一般不采用浏览器系统全屏， 其实就是旋转90度）
                isCurrentFullscreen: this._isCurrentFullscreen,
                /** 记录浏览器系统全屏与否 */ isFullscreen: this._isFullscreen,
                isMobile: Utils.isMobile
            });
        }
        // $__FULLSCREEN_ELEMENT_CHANGE__$.forEach((item) => {
        //   if (item.element === this.$container) {
        //   }
        // })
        if (Utils.isMobile) {
            // 移动端全屏在body 上添加 ezplayer-body-overflow-hide 类， 但是 sdk 不提供样式
            if (this._isCurrentFullscreen) {
                document.body.classList.add("" + this._options.prefix + "-body-mobile-noscroll");
            } else {
                document.body.classList.remove("" + this._options.prefix + "-body-mobile-noscroll");
            }
        }
    };
    return Fullscreen;
}();

function _extends$l() {
    _extends$l = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends$l.apply(this, arguments);
}
function _inherits$l(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            writable: true,
            configurable: true
        }
    });
    if (superClass) _set_prototype_of$l(subClass, superClass);
}
function _set_prototype_of$l(o, p) {
    _set_prototype_of$l = Object.setPrototypeOf || function setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
    };
    return _set_prototype_of$l(o, p);
}
/**
 * 全屏控件
 * @category Control
 */ var Fullscreen = /*#__PURE__*/ function(Control) {
    _inherits$l(Fullscreen, Control);
    function Fullscreen(options) {
        var _this;
        var _options_props, _this_options;
        _this = Control.call(this, _extends$l({
            tagName: 'span',
            classNameSuffix: 'fullscreen',
            controlType: 'button'
        }, options)) || this, _this.isCurrentFullscreen = false;
        _this.options = options;
        _this.isCurrentFullscreen = !!((_options_props = options.props) == null ? void 0 : _options_props.isCurrentFullscreen);
        _this._$rootContainer = (_this_options = _this.options) == null ? void 0 : _this_options.rootContainer;
        if (!_this._$rootContainer) {
            throw new Error('Fullscreen option fullscreenContainer is required!');
        }
        _this._fullscreenChange = _this._fullscreenChange.bind(_this);
        _this._fullscreenUtil = new Fullscreen$1(_this._$rootContainer, {
            onChange: _this._fullscreenChange,
            isFullscreen: _this.isCurrentFullscreen
        });
        _this._render();
        _this._event();
        return _this;
    }
    var _proto = Fullscreen.prototype;
    /**
   * 销毁
   */ _proto.destroy = function destroy() {
        var _this__fullscreenUtil;
        this.$container.innerHTML = '';
        (_this__fullscreenUtil = this._fullscreenUtil) == null ? void 0 : _this__fullscreenUtil.destroy();
        this._fullscreenUtil = null;
        Control.prototype.destroy.call(this);
    };
    _proto._render = function _render() {
        if (Utils.isMobile) {
            var _this_locale;
            this.$container.innerHTML = IconComponents.mobileFullscreen({
                title: (_this_locale = this.locale) == null ? void 0 : _this_locale.BTN_FULLSCREEN
            });
        } else {
            var _this_locale1, _this_locale2;
            this.$container.innerHTML = IconComponents.exitFullscreen({
                title: (_this_locale1 = this.locale) == null ? void 0 : _this_locale1.BTN_EXIT_FULLSCREEN
            }) + IconComponents.fullscreen({
                title: (_this_locale2 = this.locale) == null ? void 0 : _this_locale2.BTN_FULLSCREEN
            });
        }
    };
    _proto._fullscreenChange = function _fullscreenChange(info) {
        this.isCurrentFullscreen = info.isCurrentFullscreen;
        this._render();
        this.options.onChange == null ? void 0 : this.options.onChange.call(this.options, info);
    };
    /**
   * 点击 Control 会触发
   */ _proto._onControlClick = function _onControlClick() {
        if (this.isCurrentFullscreen) {
            var _this__fullscreenUtil;
            (_this__fullscreenUtil = this._fullscreenUtil) == null ? void 0 : _this__fullscreenUtil.exitFullscreen();
        } else {
            var _this__fullscreenUtil1;
            (_this__fullscreenUtil1 = this._fullscreenUtil) == null ? void 0 : _this__fullscreenUtil1.fullscreen();
        }
    };
    _proto._event = function _event() {};
    return Fullscreen;
}(Control);

function _extends$k() {
    _extends$k = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends$k.apply(this, arguments);
}
function _inherits$k(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            writable: true,
            configurable: true
        }
    });
    if (superClass) _set_prototype_of$k(subClass, superClass);
}
function _set_prototype_of$k(o, p) {
    _set_prototype_of$k = Object.setPrototypeOf || function setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
    };
    return _set_prototype_of$k(o, p);
}
/**
 * 回放类型切换（本地回放(sdk 卡)， 云存储回放， 云录制回放）控件
 * @category Control
 */ var Rec = /*#__PURE__*/ function(Control) {
    _inherits$k(Rec, Control);
    function Rec(options) {
        var _this;
        var _options_props;
        _this = Control.call(this, _extends$k({}, options, {
            tagName: 'div',
            controlType: 'block',
            classNameSuffix: 'rec'
        })) || this;
        _this._options = options;
        _this.recType = ((_options_props = options.props) == null ? void 0 : _options_props.recType) || 'rec';
        _this._onClickIcon();
        _this._onDBlClick = _this._onDBlClick.bind(_this);
        _this.$container.addEventListener('dblclick', _this._onDBlClick);
        return _this;
    }
    var _proto = Rec.prototype;
    _proto.destroy = function destroy() {
        var _this__delegation;
        this.$container.removeEventListener('dblclick', this._onDBlClick);
        (_this__delegation = this._delegation) == null ? void 0 : _this__delegation.destroy();
        this._delegation = null;
        Control.prototype.destroy.call(this);
    };
    _proto.addRecType = function addRecType(id) {
        var spanIcon = '';
        switch(id){
            case 'rec':
                var _this_locale;
                spanIcon = IconComponents.sdk({
                    title: (_this_locale = this.locale) == null ? void 0 : _this_locale.BTN_REC,
                    'data-type': 'rec'
                });
                break;
            case 'cloudRec':
                var _this_locale1;
                spanIcon = IconComponents.cloudRec({
                    title: (_this_locale1 = this.locale) == null ? void 0 : _this_locale1.BTN_CLOUDREC,
                    'data-type': 'cloudRec'
                });
                break;
            case 'cloudRecord':
                var _this_locale2;
                spanIcon = IconComponents.cloudRecord({
                    title: (_this_locale2 = this.locale) == null ? void 0 : _this_locale2.BTN_CLOUDRECORD,
                    'data-type': 'cloudRecord'
                });
                break;
        }
        if (spanIcon) {
            var innerHTML = this.$container.innerHTML;
            this.$container.innerHTML = innerHTML + spanIcon;
            this._activeIcon(this.recType);
        }
    };
    _proto._activeIcon = function _activeIcon(type) {
        var $list = this.$container.querySelectorAll("." + PREFIX_CLASS + "-icon");
        $list.forEach(function($item) {
            $item.classList.remove("" + PREFIX_CLASS + "-active");
        });
        switch(type){
            case 'rec':
                var _this_$container_querySelector;
                (_this_$container_querySelector = this.$container.querySelector("." + PREFIX_CLASS + "-icon-sdk")) == null ? void 0 : _this_$container_querySelector.classList.add("" + PREFIX_CLASS + "-active");
                break;
            case 'cloudRec':
                var _this_$container_querySelector1;
                (_this_$container_querySelector1 = this.$container.querySelector("." + PREFIX_CLASS + "-icon-cloud-rec")) == null ? void 0 : _this_$container_querySelector1.classList.add("" + PREFIX_CLASS + "-active");
                break;
            case 'cloudRecord':
                var _this_$container_querySelector2;
                (_this_$container_querySelector2 = this.$container.querySelector("." + PREFIX_CLASS + "-icon-cloud-record")) == null ? void 0 : _this_$container_querySelector2.classList.add("" + PREFIX_CLASS + "-active");
                break;
        }
    };
    _proto._onClickIcon = function _onClickIcon() {
        var _this = this;
        this._delegation = delegate(this.$container, "." + PREFIX_CLASS + "-icon", 'click', function(e) {
            var target = e.delegateTarget;
            if (!target.classList.contains("" + PREFIX_CLASS + "-disabled")) {
                var type = target.getAttribute('data-type');
                if (_this.recType !== type) {
                    _this.recType = type;
                    _this._activeIcon(type);
                    _this.emit(EVENTS.control.recTypeChange, type);
                    _this._options.onChange == null ? void 0 : _this._options.onChange.call(_this._options, type);
                }
            }
        });
    };
    /**
   * 点击 Control 会触发
   */ _proto._onControlClick = function _onControlClick(e) {};
    return Rec;
}(Control);

var zh = {
    391001: '取流地址或端口非法',
    395000: '服务内部异常，请稍后重试',
    395400: '预览取流参数异常',
    395402: '设备当前时段无录像，请选择其他时间段',
    395403: '服务异常，请重试或联系客服',
    395404: '设备不在线，请优化网络后重启设备再试',
    395405: '设备侧网络问题，请检查优化网络后重启设备再试',
    395406: 'token过期，请重试',
    395407: '客户端的URL格式错误',
    395409: '预览开启隐私保护',
    395410: '服务异常，请重试或联系客服',
    395411: '无权查看当前设备',
    395412: '服务异常，请重试或联系客服',
    395413: '服务异常，请重试或联系客服',
    395415: '设备通道错误',
    395416: '当前观看路数达到设备最大限制，请重启设备或联系设备售后处理',
    395451: '设备不支持该码流类型，请检查设备通道支持情况或联系硬件售后',
    395452: '设备侧网络较差，请检查优化网络后重启设备再试',
    395454: '设备侧网络较差，请检查优化网络后重启设备再试',
    395455: '设备通道异常，请检查通道配置后重试',
    395456: '设备通道异常，请检查通道配置后重试',
    395457: '服务异常，请重试或联系客服',
    395458: '服务异常，请重试或联系客服',
    395459: '服务异常，请重试或联系客服',
    395460: '服务异常，请重试或联系客服',
    395492: '服务异常，请重试或联系客服',
    395500: '服务异常，请重试或联系客服',
    395501: '服务异常，请重试或联系客服',
    395503: '服务异常，请重试或联系客服',
    395504: '服务异常，请重试或联系客服',
    395505: '服务异常，请重试或联系客服',
    395506: '暂不支持该设备直接取流，请连接NVR后重试或联系客服',
    395507: '设备4G无限流量套餐仅支持萤石云视频APP使用，请联系APP客服更换套餐',
    395530: '服务异常，请重试或联系客服',
    395544: '视频源不存在，请检查设备配置',
    395545: '服务异常，请重试或联系客服',
    395546: '同时观看人数达到账号最大限制，请联系客服',
    395547: '同时观看人数达到账号最大限制，请联系客服',
    395556: '服务异常，请重试或联系客服',
    395557: '设备取流失败，请联系硬件售后',
    395558: '查找录像开始时间错误',
    395560: '服务异常，请重试或联系客服',
    395561: '服务异常，请重试或联系客服',
    395562: '服务异常，请重试或联系客服',
    395563: '服务异常，请重试或联系客服',
    395564: '服务异常，请重试或联系客服',
    395566: '服务异常，请重试或联系客服',
    395567: '服务异常，请重试或联系客服',
    395568: '服务异常，请重试或联系客服',
    395569: '服务异常，请重试或联系客服',
    395600: '服务异常，请重试或联系客服',
    395601: '服务异常，请重试或联系客服',
    395602: '服务异常，请重试或联系客服',
    395610: '服务异常，请重试或联系客服',
    395620: '服务异常，请重试或联系客服',
    395701: '服务异常，请重试或联系客服',
    395702: '服务异常，请重试或联系客服',
    395703: '服务异常，请重试或联系客服',
    396001: '服务异常，请重试或联系客服',
    396099: '服务异常，请重试或联系客服',
    396101: '服务异常，请重试或联系客服',
    396102: '服务异常，请重试或联系客服',
    396103: '服务异常，请重试或联系客服',
    396104: '服务异常，请重试或联系客服',
    396105: '设备异常，请重试或联系客服',
    396106: '设备通道异常，请检查通道配置后重试',
    396107: '设备异常，请重试或联系客服',
    396108: '服务异常，请重试或联系客服',
    396109: '服务异常，请重试或联系客服',
    396110: '设备异常，请重试或联系客服',
    396501: '设备异常，请重试或联系客服',
    396502: '设备异常，请重试或联系客服',
    396503: '设备异常，请重试或联系客服',
    396504: '设备异常，请重试或联系客服',
    396505: '设备异常，请重试或联系客服',
    396506: '设备异常，请重试或联系客服',
    396508: '设备异常，请重试或联系客服',
    396509: '设备异常，请重试或联系客服',
    396510: '设备异常，请重试或联系客服',
    396511: '设备异常，请重试或联系客服',
    396512: '设备异常，请重试或联系客服',
    396513: '设备异常，请重试或联系客服',
    396514: '设备异常，请重试或联系客服',
    396515: '设备异常，请重试或联系客服',
    396516: '设备异常，请重试或联系客服',
    396517: '设备异常，请重试或联系客服',
    396518: '设备异常，请重试或联系客服',
    396519: '设备网络异常，请检查优化网络后重启设备再试',
    396520: '设备网络异常，请检查优化网络后重启设备再试',
    396700: '服务异常，请重试或联系客服',
    396701: '回放结束',
    397001: '服务异常，请重试或联系客服',
    397002: '服务异常，请重试或联系客服',
    397003: '服务异常，请重试或联系客服',
    397004: '服务异常，请重试或联系客服',
    397005: '设备取流连接断开，请检查网络后重试',
    397006: '服务异常，请重试或联系客服',
    397007: '服务异常，请重试或联系客服',
    399000: '服务异常，请重试或联系客服',
    399001: '客户端网络超时',
    399002: '服务异常，请重试或联系客服',
    399016: 'token失效，请更新并重试',
    399048: '同时观看人数达到账号最大限制，请联系客服',
    399049: '免费版并发数达到上限，请升级企业版使用多并发能力',
    399030: '取流失败，请重试',
    3810001: '操作失败',
    3810002: '账号异常，操作失败',
    3810005: '账号异常，操作失败',
    3820002: '设备不存在，请检查设备连接情况',
    3820006: '操作失败，请检查设备网络情况',
    3820007: '操作失败，请检查设备网络情况',
    3820008: '操作过于频繁，稍后再试',
    3820014: '操作失败',
    3820032: '通道不存在请检查设备连接情况',
    3849999: '操作失败，请重试',
    3860000: '操作失败，设备不支持该操作',
    3860001: '操作失败，用户无权限',
    3860002: '设备已旋转到上限位',
    3860003: '设备已旋转到下限位',
    3860004: '设备已旋转到左限位',
    3860005: '设备已旋转到右限位',
    3860006: '操作失败，请重试',
    3860009: '设备正在操作中',
    3860020: '操作失败',
    BTN_RETRY: '重试',
    BTN_RELOAD: '重新加载',
    LOADING: '加载中，请稍等...',
    TIMEFORMAT_ERROR: '时间格式有误，请确认',
    USE_MULTITHREADING_WARING: '您当前浏览器可以开启谷歌实验室多线程特性，获取更好播放体验，避免浏览器卡顿及崩溃,详见',
    OPEN_INSTRUCTIONS: '开启说明',
    INIT_FINSHED: '初始化播放器完成',
    INIT_SUCCESS: '初始化播放器成功',
    GET_PLAYURL_FAILED: '获取播放地址失败',
    VIDEO_LOADING: '视频加载中',
    DISCONNECT: '连接断开，请重试',
    DEVICE_ENCRYPTED: '设备已加密',
    NO_RECORD: '未找到录像片段',
    PLAY_FAILED: '播放失败，请检查设备及客户端网络',
    PLAY_SUCCESS: '播放成功',
    STOP_SUCCESS: '停止成功',
    CHANGE_PLAYURL_SUCCESS: '切换播放地址成功',
    CHANGE_PLAYURL_FAILED: '切换播放地址失败',
    GET_OSD_TIME: '获取OSD时间',
    GET_OSD_TIME_FAILED: '获取OSD时间失败',
    SET_POSTER: '设置播放器封面',
    RESIZE: '调整播放器尺寸',
    SPEED: '倍速',
    SPEED_RATE: '倍',
    SPEED_CANCEL: '取消',
    GET_SPEED: '获取当前播放速率',
    MAX_SPEED_LIMIT: '播放速度最大为4倍速度',
    MIN_SPEED_LIMIT: '播放速度最小为0.5倍速度',
    SEEK_CANNOT_CROSS_DAYS: 'seek时间不能跨日期',
    SEEK_TIMEFORMAT_ERROR: 'seek时间格式错误',
    PAUSE: '暂停',
    PAUSE_FAILED: '暂停失败',
    RESUME: '恢复播放',
    RESUME_FAILED: '恢复播放失败',
    CALL_END: '通话已结束',
    USER_DO_NOT_OWN_DEVICE: 'loadingSetTextWithBtn',
    NO_CLOUD_RECORD: '该设备在当天没有云录制的录像',
    CHANGE_VIDEO_LEVEL: '切换清晰度',
    CHANGE_VIDEO_LEVEL_FAIL: '切换清晰度失败',
    GET_VIDEO_LEVEL_LIST: '获取设备支持的清晰度列表',
    PLEASE_INPUT_RIGHT_VIDEO_LEVEL: '请输入正确的清度',
    VIDEO_LEVEL_NOT_SUPPORT: '当前设备不支持该清晰度',
    VIDEO_LEVEL_AUTO: '自动',
    VIDEO_LEVEL_FLUENT: '流畅',
    VIDEO_LEVEL_STANDARD: '标清',
    VIDEO_LEVEL_HEIGH: '高清',
    VIDEO_LEVEL_SUPER: '超清',
    VIDEO_LEVEL_EXTREME: '极清',
    VIDEO_LEVEL_3K: '3K',
    VIDEO_LEVEL_4k: '4K',
    RESET_THEME: '重置主题',
    BTN_PLAY: '播放',
    BTN_PAUSE: '结束播放',
    BTN_VOLUME: '声音',
    BTN_MUTED: '静音',
    BTN_RECORDVIDEO: '录屏',
    BTN_CAPTURE: '截图',
    BTN_TALK: '对讲',
    BTN_ZOOM: '电子放大',
    BTN_3D_ZOOM: '3D定位',
    BTN_PTZ: '云台控制',
    BTN_GLOBAL_FULLSCREEN: '全局全屏',
    BTN_EXIT_GLOBAL_FULLSCREEN: '退出全局全屏',
    BTN_FULLSCREEN: '全屏',
    BTN_EXIR_FULLSCREEN: '退出全屏',
    BTN_HD: '画面清晰度',
    BTN_SPEED: '回放倍速',
    BTN_CLOUDREC: '云存储回放',
    BTN_CLOUDRECORD: '云录制',
    BTN_REC: '本地存储',
    BTN_CALENDAR: '日历',
    BTN_MORE: '更多',
    DEVICE_NAME: '设备名称',
    DEVICE_ID: '设备序列号',
    CAPTURE_SUCCESS: '截图成功',
    CAPTURE_FAILED: '截图失败',
    START_RECORD_SUCCESS: '开始录制成功',
    START_RECORD_FAILED: '开始录制失败',
    STOP_RECORD_SUCCESS: '停止录制成功',
    STOP_RECORD_FAILED: '停止录制失败',
    RECORD_TIPS: '今日录像',
    RECORDS: '个录像',
    OPEN_SOUND: '开启声音',
    CLOSE_SOUND: '关闭声音',
    SOUND_OPENED: '当前已经有画面正在播放声音',
    ZOOM: '电子放大',
    START_ZOOM: '开启电子放大',
    CLOSE_ZOOM: '关闭电子放大',
    ZOOM_ADD: '+',
    ZOOM_SUB: '-',
    ZOOM_ADD_MAX: '已经放大到最大倍数{{zoom}}X',
    ZOOM_SUB_MIN: '已经缩小到最小倍数{{zoom}}X',
    ZOOM_LIMIT_MAX: '超出最大倍率{{zoom}}X',
    ZOOM_LIMIT_MIN: '超出最小倍率{{zoom}}X',
    ZOOM_NOT_ENABLED: '放大未开启',
    '3D_ZOOM': '3D定位',
    '3D_ZOOM_DISABLE': '未启用3D定位功能',
    '3D_ZOOM_FAILED': '3D定位失败，请重试',
    START_3D_ZOOM: '开启3D定位',
    CLOSE_3D_ZOOM: '关闭3D定位',
    DEVICE_NOT_SUPPORT_3D_ZOOM: '当前设备不支持3D定位功能',
    '3D_ZOOM_ACTIVED': '3D定位已处于开启状态',
    '3D_ZOOM_NOT_ACTIVED': '未启用3D定位功能',
    '3D_ZOOM_CLOSED': '3D定位已处于关闭状态',
    CHANGE_ZOOM_TYPE: '改变缩放模式',
    FULLSCREEN: '全局全屏',
    FULLSCREEN_EXIT: '退出全局全屏',
    GET_WEB_FULLSCREEN_STATUS: '获取浏览器网页全屏状态',
    WEB_FULLSCREEN: '开启网页全屏',
    WEB_FULLSCREEN_EXIT: '退出网页全屏',
    DESTROY: '销毁',
    GET_CAPACITY: '获取设备能力级',
    GET_PTZ_STATUS: '获取当前云台状态',
    GET_PTZ_STATUS_FAILED: '未加载Theme模块，无法获取云台状态',
    MOBILE_HIDE_PTZ: '移动端，非全屏状态不展示云台',
    OPTION_PTZ_FAILED: '未加载Theme模块，无法操作云台',
    MOBILE_PTZ_TIPS: '请通过操控云台来调整摄像机视角',
    PTZ_FAST: '快',
    PTZ_MID: '中',
    PTZ_SLOW: '慢',
    PTZ_SPEED: '调整云台转动速度',
    DEVICE_ZOOM: '控制设备放大/缩小画面',
    DEVICE_FOCUS: '调整设备焦距',
    NOT_SUPPORT_DEVICE_ZOOM: '当前设备不支持物理缩放',
    NOT_SUPPORT_FOCUS: '当前设备不支持变焦',
    MIRROR: '镜像翻转',
    MIRROR_TYPE_ERROR: '翻转参数类型错误',
    CHANGE_FEC_TYPE: '切换鱼眼矫正类型',
    DEVICE_NOT_SUPPORT: '设备不支持鱼眼模式',
    TYPE_NOT_SUPPORT: '鱼眼矫正类型暂时不支持',
    FEC_SUPPORT_VERSION: '当前只有V3软解支持鱼眼矫正',
    NO_CANVAS_ID: '鱼眼矫正类型需要分屏，但是没有传正确的分屏的canvas id',
    SET_FEC_PARAMS: '设置3D矫正视角参数',
    GET_FEC_PARAMS: '获取3D矫正视角参数',
    SET_FEC_PARAMS_FAILED: '该矫正类型不能设置3D矫正视角参数',
    GET_FEC_PARAMS_FAILED: '该矫正类型不能获取3D矫正视角参数',
    GET_FEC_PARAMS_SUPPORT_VERSION: '当前只有V3软解支持鱼眼矫正获取3D矫正视角参数',
    SET_WATERMARK: '设置水印',
    FETCH_THEME_FAILED: '获取主题模板失败',
    cancel: '取消',
    ok: '确定',
    close: '关闭'
};

// 不要出现多层的的数据, 数据铺平
var en = {
    391001: 'Illegal streaming address or port',
    395000: 'Internal service exception, please try again later',
    395400: 'Preview streaming parameter exception',
    395402: 'Device has no recording in the current time period, please select another time period',
    395403: 'Service exception, please try again or contact customer service',
    395404: 'The device is not online, Please optimize the network and restart the device to try again',
    395405: 'Device side network is poor, please check and optimize the network and restart the device to try again',
    395406: 'Token expired, please try again',
    395407: 'Client URL format error',
    395409: 'Service exception, please try again or contact customer service',
    395410: 'Service exception, please try again or contact customer service',
    395411: 'No permission to view the current device',
    395412: 'Service exception, please try again or contact customer service',
    395413: 'Service exception, please try again or contact customer service',
    395415: 'Device channel error',
    395416: 'The current number of viewing channels has reached the maximum limit of the device. Please restart the device or contact the device after-sales service',
    395451: 'The device does not support this bitstream type. Please check the device channel support or contact the hardware after-sales service',
    395452: 'The network on the device side is poor. Please check and optimize the network and restart the device to try again',
    395454: 'The network on the device side is poor. Please check and optimize the network and restart the device to try again',
    395455: 'The device channel is abnormal. Please check the channel configuration and try again',
    395456: 'The device channel is abnormal. Please check the channel configuration and try again',
    395457: 'Service exception, please try again or contact customer service',
    395458: 'Service exception, please try again or contact customer service',
    395459: 'Service exception, please try again or contact customer service',
    395460: 'Service exception, please try again or contact customer service',
    395492: 'Service exception, please try again or contact customer service',
    395500: 'Service exception, please try again or contact customer service',
    395501: 'Service exception, please try again or contact customer service',
    395503: 'Service exception, please try again or contact customer service',
    395504: 'Service exception, please try again or contact customer service',
    395505: 'Service exception, please try again or contact customer service',
    395506: 'Direct streaming of this device is not supported at present, please try again or contact customer service after connecting to NVR',
    395507: 'Device 4G unlimited traffic package only supports EZVIZ Cloud Video APP, please contact APP customer service to change the package',
    395530: 'Service exception, please try again or contact customer service',
    395544: 'Video source does not exist, please check device configuration',
    395545: 'Service exception, please try again or contact customer service',
    395546: 'The number of simultaneous viewers has reached the maximum limit of the account, please contact customer service',
    395547: 'The number of simultaneous viewers has reached the maximum limit of the account, please contact customer service',
    395556: 'Service exception, please try again or contact customer service',
    395557: 'Device streaming failed, please contact hardware after-sales',
    395558: 'Error in finding the start time of recording',
    395560: 'Service exception, please try again or contact customer service',
    395561: 'Service exception, please try again or contact customer service',
    395562: 'Service exception, please try again or contact customer service',
    395563: 'Service exception, please try again or contact customer service',
    395564: 'Service exception, please try again or contact customer service',
    395566: 'Service exception, please try again or contact customer service',
    395567: 'Service exception, please try again or contact customer service',
    395568: 'Service exception, please try again or contact customer service',
    395569: 'Service exception, please try again or contact customer service',
    395600: 'Service exception, please try again or contact customer service',
    395601: 'Service exception, please try again or contact customer service',
    395602: 'Service exception, please try again or contact customer service',
    395610: 'Service exception, please try again or contact customer service',
    395620: 'Service exception, please try again or contact customer service',
    395701: 'Service exception, please try again or contact customer service',
    395702: 'Service exception, please try again or contact customer service',
    395703: 'Service exception, please try again or contact customer service',
    396001: 'Service exception, please try again or contact customer service',
    396099: 'Service exception, please try again or contact customer service',
    396101: 'Service exception, please try again or contact customer service',
    396102: 'Service exception, please try again or contact customer service',
    396103: 'Service exception, please try again or contact customer service',
    396104: 'Service exception, please try again or contact customer service',
    396105: 'Device abnormality, please try again or contact customer service',
    396106: 'Device channel abnormality, please check the channel configuration and try again',
    396107: 'Device abnormality, please try again or contact customer service',
    396108: 'Service exception, please try again or contact customer service',
    396109: 'Service exception, please try again or contact customer service',
    396110: 'Device abnormality, please try again or contact customer service',
    396501: 'Device abnormality, please try again or contact customer service',
    396502: 'Device abnormality, please try again or contact customer service',
    396503: 'Device abnormality, please try again or contact customer service',
    396504: 'Device abnormality, please try again or contact customer service',
    396505: 'Device abnormality, please try again or contact customer service',
    396506: 'Device abnormality, please try again or contact customer service',
    396508: 'Device abnormality, please try again or contact customer service',
    396509: 'Device abnormality, please try again or contact customer service',
    396510: 'Device abnormality, please try again or contact customer service',
    396511: 'Device abnormality, please try again or contact customer service',
    396512: 'Device abnormality, please try again or contact customer service',
    396513: 'Device abnormality, please try again or contact customer service',
    396514: 'Device abnormality, please try again or contact customer service',
    396515: 'Device abnormality, please try again or contact customer service',
    396516: 'Device abnormality, please try again or contact customer service',
    396517: 'Device abnormality, please try again or contact customer service',
    396518: 'Device abnormality, please try again or contact customer service',
    396519: 'Device network abnormality, please check and optimize the network and restart the device to try again',
    396520: 'Device network abnormality, please check and optimize the network and restart the device to try again',
    396700: 'Service exception, please try again or contact customer service',
    396701: 'Playback ends',
    397001: 'Service exception, please try again or contact customer service',
    397002: 'Service exception, please try again or contact customer service',
    397003: 'Service exception, please try again or contact customer service',
    397004: 'Service exception, please try again or contact customer service',
    397005: 'Device streaming connection is disconnected, please check the network and try again',
    397006: 'Service exception, please try again or contact customer service',
    397007: 'Service exception, please try again or contact customer service',
    399000: 'Service exception, please try again or contact customer service',
    399001: 'Client network timeout',
    399002: 'Service exception, please try again or contact customer service',
    399016: 'Token invalid, please update and retry',
    399048: 'The number of simultaneous viewers has reached the maximum account limit, please contact customer service',
    399049: 'The number of simultaneous viewers has reached the maximum account limit, please contact customer service',
    399030: 'Stream retrieval failed, please try again',
    3810001: 'Operation failed',
    3810002: 'Account exception, operation failed',
    3810005: 'Account exception, operation failed',
    3820002: 'Device does not exist, please check the device connection status',
    3820006: 'Operation failed, please check the network condition of the device',
    3820007: 'Operation failed, please check the network condition of the device',
    3820008: 'The operation is too frequent, please try again later',
    3820014: 'Operation failed',
    3820032: 'The channel does not exist. Please check the device connection status',
    3849999: 'Operation failed, please try again',
    3860000: 'Operation failed, the device does not support this operation',
    3860001: 'Operation failed, user does not have permission',
    3860002: 'The device has been rotated to the upper limit position',
    3860003: 'The device has been rotated to the lower limit position',
    3860004: 'The device has rotated to the left limit position',
    3860005: 'The device has been rotated to the right limit position',
    3860006: 'Operation failed, please try again',
    3860009: 'The device is currently in operation',
    3860020: 'Operation failed',
    BTN_RETRY: 'Retry',
    BTN_RELOAD: 'Reload',
    LOADING: 'loading...',
    TIMEFORMAT_ERROR: 'The time format is wrong, please confirm',
    USE_MULTITHREADING_WARING: 'Your current browser can enable the multi-threaded feature of Google Labs to get a better playback experience and avoid browser freezes and crashes. For details, see:',
    OPEN_INSTRUCTIONS: 'Enablement instructions',
    INIT_FINSHED: 'Initialize the player completed',
    INIT_SUCCESS: 'Initialize the player successfully',
    GET_PLAYURL_FAILED: 'Failed to obtain the playback address',
    VIDEO_LOADING: 'Video loading',
    DISCONNECT: 'Connection disconnected, please try again',
    DEVICE_ENCRYPTED: 'Device encrypted',
    NO_RECORD: 'No video clips found',
    PLAY_FAILED: 'Play failed, please check the device and client network',
    PLAY_SUCCESS: 'Play successfully',
    STOP_SUCCESS: 'Stop successfully',
    CHANGE_PLAYURL_SUCCESS: 'Switch the playback address successfully',
    CHANGE_PLAYURL_FAILED: 'Switch the playback address failed',
    GET_OSD_TIME: 'Get OSD time',
    GET_OSD_TIME_FAILED: 'Failed to get OSD time',
    SET_POSTER: 'Set the player cover',
    RESIZE: 'Adjust the player size',
    SPEED: 'speeds',
    SPEED_RATE: 'X',
    SPEED_CANCEL: 'Cancel',
    GET_SPEED: 'Get the current playback rate',
    MAX_SPEED_LIMIT: 'The maximum playback speed is 4 times the speed',
    MIN_SPEED_LIMIT: 'The minimum playback speed is 0.5 times the speed',
    SEEK_CANNOT_CROSS_DAYS: 'The seek time cannot cross dates',
    SEEK_TIMEFORMAT_ERROR: 'The seek time format is wrong',
    PAUSE: 'Pause',
    PAUSE_FAILED: 'Pause failed',
    RESUME: 'Resume playback',
    RESUME_FAILED: 'Resume playback failed',
    CALL_END: 'Call ended',
    USER_DO_NOT_OWN_DEVICE: 'loadingSetTextWithBtn',
    NO_CLOUD_RECORD: 'The device has no cloud recorded video on that day',
    CHANGE_VIDEO_LEVEL: 'Switch definition',
    CHANGE_VIDEO_LEVEL_FAIL: 'Switch definition failed',
    GET_VIDEO_LEVEL_LIST: 'Get the definition list supported by the device',
    PLEASE_INPUT_RIGHT_VIDEO_LEVEL: 'Please enter the correct definition',
    VIDEO_LEVEL_NOT_SUPPORT: 'The current device does not support this definition',
    VIDEO_LEVEL_AUTO: 'Auto',
    VIDEO_LEVEL_FLUENT: 'Fluent',
    VIDEO_LEVEL_STANDARD: 'Standard',
    VIDEO_LEVEL_HEIGH: 'heigh',
    VIDEO_LEVEL_SUPER: 'Super',
    VIDEO_LEVEL_EXTREME: 'Extreme',
    VIDEO_LEVEL_3K: '3K',
    VIDEO_LEVEL_4k: '4K',
    RESET_THEME: 'Reset theme',
    BTN_PLAY: 'Play',
    BTN_PAUSE: 'Pause',
    BTN_VOLUME: 'Volume',
    BTN_MUTED: 'Muted',
    BTN_RECORDVIDEO: 'Screen recording',
    BTN_CAPTURE: 'Screenshot',
    BTN_TALK: 'Intercom',
    BTN_ZOOM: 'Electronic zoom',
    BTN_3D_ZOOM: '3D positioning',
    BTN_PTZ: 'PTZ control',
    BTN_GLOBAL_FULLSCREEN: 'Global fullscreen',
    BTN_EXIT_GLOBAL_FULLSCREEN: 'Exit global fullscreen',
    BTN_FULLSCREEN: 'Fullscreen',
    BTN_EXIR_FULLSCREEN: 'Exit fullscreen',
    BTN_EXPEND: 'Global full screen',
    BTN_WEBEXPEND: 'Web page full screen',
    BTN_HD: 'Image definition',
    BTN_SPEED: 'Playback speed',
    BTN_CLOUDREC: 'Cloud storage playback',
    BTN_CLOUDRECORD: 'Cloud recording',
    BTN_REC: 'Local storage',
    BTN_CALENDAR: 'Calendar',
    BTN_MORE: 'More',
    DEVICE_NAME: 'Device name',
    DEVICE_ID: 'Device serial number',
    CAPTURE_SUCCESS: 'Screenshot successful',
    CAPTURE_FAILED: 'Screenshot failed',
    START_RECORD_SUCCESS: 'Start recording successful',
    START_RECORD_FAILED: 'Screenshot failed',
    STOP_RECORD_SUCCESS: 'Stop recording successful',
    STOP_RECORD_FAILED: 'Stop recording failed',
    RECORD_TIPS: "Today's recording",
    RECORDS: ' in total',
    OPEN_SOUND: 'Turn on sound',
    CLOSE_SOUND: 'Turn off sound',
    SOUND_OPENED: 'There is already a picture playing sound at the moment',
    ZOOM: 'Electronic zoom',
    START_ZOOM: 'Turn on electronic zoom',
    CLOSE_ZOOM: 'Turn off electronic zoom',
    ZOOM_ADD: '+',
    ZOOM_SUB: '-',
    ZOOM_ADD_MAX: 'It has been enlarged to a maximum magnification of {{zoom}}X',
    ZOOM_SUB_MIN: 'It has been reduced to the minimum multiple of {{zoom}}X',
    ZOOM_LIMIT_MAX: 'Exceeding maximum magnification of {{zoom}}X',
    ZOOM_LIMIT_MIN: 'Exceeding the minimum magnification of {{zoom}}X',
    ZOOM_NOT_ENABLED: 'Zoom not enabled',
    '3D_ZOOM': '3D positioning',
    '3D_ZOOM_DISABLE': '3D positioning function not enabled',
    '3D_ZOOM_FAILED': '3D positioning failed, please try again',
    START_3D_ZOOM: 'Turn on 3D positioning',
    CLOSE_3D_ZOOM: 'Turn off 3D positioning',
    DEVICE_NOT_SUPPORT_3D_ZOOM: 'Current device does not support 3D positioning function',
    '3D_ZOOM_ACTIVED': '3D positioning is already enabled',
    '3D_ZOOM_NOT_ACTIVED': '3D positioning function is not enabled',
    '3D_ZOOM_CLOSED': '3D positioning is already disabled',
    CHANGE_ZOOM_TYPE: 'Change zoom mode',
    FULLSCREEN: 'Global full screen',
    FULLSCREEN_EXIT: 'Exit global full screen',
    GET_WEB_FULLSCREEN_STATUS: 'Get browser web page full screen status',
    WEB_FULLSCREEN: 'Turn on web page full screen',
    WEB_FULLSCREEN_EXIT: 'Exit full screen webpage',
    DESTROY: 'Destroy',
    GET_CAPACITY: 'Get device capability level',
    GET_PTZ_STATUS: 'Get current PTZ status',
    GET_PTZ_STATUS_FAILED: 'Theme module is not loaded, PTZ status cannot be obtained',
    MOBILE_HIDE_PTZ: 'Mobile terminal, PTZ is not displayed in non-full screen state',
    OPTION_PTZ_FAILED: 'Theme module is not loaded, PTZ cannot be operated',
    MOBILE_PTZ_TIPS: 'Adjust camera angle by manipulating gimbal',
    PTZ_FAST: 'F',
    PTZ_MID: 'M',
    PTZ_SLOW: 'S',
    PTZ_SPEED: 'Adjust the PTZ rotation speed',
    DEVICE_ZOOM: 'Control the device to zoom in/out of the screen',
    DEVICE_FOCUS: "Adjusting the device's focal length",
    NOT_SUPPORT_DEVICE_ZOOM: 'Device does not support physical zoom',
    NOT_SUPPORT_FOCUS: 'Device does not support adjusting the focal length',
    MIRROR: 'Mirror flip',
    MIRROR_TYPE_ERROR: 'Flip parameter type error',
    CHANGE_FEC_TYPE: 'Switch fisheye correction type',
    DEVICE_NOT_SUPPORT: 'Device does not support fisheye mode',
    TYPE_NOT_SUPPORT: 'Fisheye correction type is not supported temporarily',
    FEC_SUPPORT_VERSION: 'Currently only V3 software solution supports fisheye correction',
    NO_CANVAS_ID: 'Fisheye correction type requires split screen, but the correct split screen canvas id is not passed',
    SET_FEC_PARAMS: 'Set 3D correction perspective parameters',
    GET_FEC_PARAMS: 'Get 3D correction perspective parameters',
    SET_FEC_PARAMS_FAILED: 'This correction type cannot set 3D correction perspective parameters',
    GET_FEC_PARAMS_FAILED: 'This correction type cannot get 3D correction perspective parameters',
    GET_FEC_PARAMS_SUPPORT_VERSION: 'Currently only V3 software solution supports fisheye correction Get 3D correction perspective parameters',
    SET_WATERMARK: 'Set watermark',
    FETCH_THEME_FAILED: 'Failed to fetch theme template',
    cancel: 'Cancel',
    ok: 'Ok',
    close: 'Close'
};

/**
 * flv 预览
 */ var LiveTemplate = {
    autoFocus: 3,
    // poster:
    //   "https://img2.baidu.com/it/u=3209353042,356122753&fm=253&fmt=auto&app=138&f=JPEG?w=889&h=500",
    footer: {
        btnList: [
            {
                iconId: 'play',
                part: 'left',
                isrender: 1
            },
            {
                iconId: 'volume',
                part: 'left',
                defaultActive: 0,
                isrender: 1
            },
            {
                // flv 录制 2.1.0 新增
                iconId: 'record',
                part: 'left',
                defaultActive: 0,
                isrender: 1
            },
            {
                iconId: 'fullscreen',
                part: 'right',
                defaultActive: 0,
                isrender: 1
            },
            {
                iconId: 'globalFullscreen',
                part: 'right',
                defaultActive: 0,
                isrender: 1
            }
        ]
    }
};

/**
 * pc 预览
 */ var pcLive = {
    autoFocus: 3,
    header: {
        // color: "yellow",
        // activeColor: "green",
        // backgroundColor: "green",
        btnList: [
            {
                iconId: 'deviceID',
                part: 'left',
                isrender: 1
            },
            {
                iconId: 'deviceName',
                part: 'left',
                isrender: 1
            }
        ]
    },
    footer: {
        // color: "green",
        // // activeColor: "green",
        // backgroundColor: "pink",
        btnList: [
            {
                iconId: 'play',
                part: 'left',
                isrender: 1
            },
            {
                iconId: 'capturePicture',
                part: 'left',
                isrender: 1
            },
            {
                iconId: 'sound',
                part: 'left',
                isrender: 1
            },
            {
                iconId: 'pantile',
                part: 'left',
                isrender: 1
            },
            {
                iconId: 'recordvideo',
                part: 'left',
                isrender: 1
            },
            {
                iconId: 'talk',
                part: 'left',
                isrender: 1
            },
            {
                iconId: 'zoom',
                part: 'left',
                isrender: 1
            },
            {
                iconId: 'hd',
                part: 'right',
                isrender: 1
            },
            {
                iconId: 'webExpend',
                part: 'right',
                isrender: 1
            },
            {
                iconId: 'expend',
                part: 'right',
                isrender: 1
            }
        ]
    }
};

/**
 * pc 回放
 */ var pcRec = {
    header: {
        // color: DEFAULT_COLOR,
        // activeColor: DEFAULT_ACTIVE_COLOR,
        btnList: [
            {
                iconId: 'deviceID',
                part: 'left',
                defaultActive: 0,
                isrender: 1
            },
            {
                iconId: 'deviceName',
                part: 'left',
                defaultActive: 0,
                isrender: 1
            },
            {
                iconId: 'cloudRec',
                part: 'right',
                defaultActive: 0,
                isrender: 1
            },
            {
                iconId: 'cloudRecord',
                part: 'right',
                defaultActive: 0,
                isrender: 1
            },
            {
                iconId: 'rec',
                part: 'right',
                defaultActive: 0,
                isrender: 1
            }
        ]
    },
    footer: {
        // color: DEFAULT_COLOR,
        // activeColor: DEFAULT_ACTIVE_COLOR,
        btnList: [
            {
                iconId: 'play',
                part: 'left',
                defaultActive: 1,
                isrender: 1
            },
            {
                iconId: 'capturePicture',
                part: 'left',
                defaultActive: 0,
                isrender: 1
            },
            {
                iconId: 'sound',
                part: 'left',
                defaultActive: 1,
                isrender: 1
            },
            {
                iconId: 'pantile',
                part: 'left',
                defaultActive: 0,
                isrender: 0
            },
            {
                iconId: 'recordvideo',
                part: 'left',
                defaultActive: 0,
                isrender: 1
            },
            {
                iconId: 'zoom',
                part: 'left',
                defaultActive: 0,
                isrender: 1
            },
            {
                iconId: 'speed',
                part: 'right',
                defaultActive: 0,
                isrender: 1
            },
            {
                iconId: 'webExpend',
                part: 'right',
                defaultActive: 0,
                isrender: 1
            },
            {
                iconId: 'expend',
                part: 'right',
                defaultActive: 0,
                isrender: 1
            }
        ]
    }
};

/**
 * mobile 预览
 */ var mobileLive = {
    header: {
        // color: DEFAULT_COLOR,
        // activeColor: DEFAULT_ACTIVE_COLOR,
        btnList: [
            {
                iconId: 'deviceID',
                part: 'left',
                defaultActive: 0,
                isrender: 1
            },
            {
                iconId: 'deviceName',
                part: 'left',
                defaultActive: 0,
                isrender: 1
            }
        ]
    },
    footer: {
        // color: DEFAULT_COLOR,
        // activeColor: DEFAULT_ACTIVE_COLOR,
        btnList: [
            {
                iconId: 'play',
                part: 'left',
                defaultActive: 1,
                isrender: 1
            },
            {
                iconId: 'capturePicture',
                part: 'left',
                defaultActive: 0,
                isrender: 1
            },
            {
                iconId: 'sound',
                part: 'left',
                defaultActive: 1,
                isrender: 1
            },
            {
                iconId: 'pantile',
                part: 'left',
                defaultActive: 0,
                isrender: 1
            },
            {
                iconId: 'recordvideo',
                part: 'left',
                defaultActive: 0,
                isrender: 1
            },
            {
                iconId: 'talk',
                part: 'left',
                defaultActive: 0,
                isrender: 1
            },
            {
                iconId: 'zoom',
                part: 'left',
                defaultActive: 0,
                isrender: 1
            },
            {
                iconId: 'hd',
                part: 'right',
                defaultActive: 0,
                isrender: 1
            },
            {
                iconId: 'webExpend',
                part: 'right',
                defaultActive: 0,
                isrender: 1
            }
        ]
    }
};

/**
 * mobile 回放
 */ var mobileRec = {
    header: {
        // color: DEFAULT_COLOR,
        // activeColor: DEFAULT_ACTIVE_COLOR,
        btnList: [
            {
                iconId: 'deviceID',
                part: 'left',
                defaultActive: 0,
                isrender: 1
            },
            {
                iconId: 'deviceName',
                part: 'left',
                defaultActive: 0,
                isrender: 1
            },
            {
                iconId: 'rec',
                part: 'right',
                defaultActive: 0,
                isrender: 1
            },
            {
                iconId: 'cloudRec',
                part: 'right',
                defaultActive: 0,
                isrender: 1
            },
            {
                iconId: 'cloudRecord',
                part: 'right',
                defaultActive: 0,
                isrender: 1
            }
        ]
    },
    footer: {
        // color: DEFAULT_COLOR,
        // activeColor: DEFAULT_ACTIVE_COLOR,
        btnList: [
            {
                iconId: 'play',
                part: 'left',
                defaultActive: 1,
                isrender: 1
            },
            {
                iconId: 'capturePicture',
                part: 'left',
                defaultActive: 0,
                isrender: 1
            },
            {
                iconId: 'sound',
                part: 'left',
                defaultActive: 1,
                isrender: 1
            },
            {
                iconId: 'recordvideo',
                part: 'left',
                defaultActive: 0,
                isrender: 1
            },
            {
                iconId: 'zoom',
                part: 'left',
                defaultActive: 0,
                isrender: 1
            },
            {
                iconId: 'speed',
                part: 'right',
                defaultActive: 0,
                isrender: 1
            },
            {
                iconId: 'webExpend',
                part: 'right',
                defaultActive: 0,
                isrender: 1
            }
        ]
    }
};

/**
 * 安防版(预览/回放)
 */ var security = {
    header: {
        // color: DEFAULT_COLOR,
        // activeColor: DEFAULT_ACTIVE_COLOR,
        btnList: [
            {
                iconId: 'deviceID',
                part: 'left',
                defaultActive: 0,
                isrender: 1
            },
            {
                iconId: 'deviceName',
                part: 'left',
                defaultActive: 0,
                isrender: 1
            }
        ]
    },
    footer: {
        // color: DEFAULT_COLOR,
        // activeColor: DEFAULT_ACTIVE_COLOR,
        btnList: [
            {
                iconId: 'play',
                part: 'left',
                defaultActive: 1,
                isrender: 1
            },
            {
                iconId: 'talk',
                part: 'left',
                defaultActive: 0,
                isrender: 1
            },
            {
                iconId: 'sound',
                part: 'left',
                defaultActive: 1,
                isrender: 1
            },
            {
                iconId: 'capturePicture',
                part: 'left',
                defaultActive: 0,
                isrender: 1
            },
            {
                iconId: 'recordvideo',
                part: 'left',
                defaultActive: 0,
                isrender: 1
            },
            {
                iconId: 'zoom',
                part: 'left',
                defaultActive: 0,
                isrender: 1
            },
            {
                iconId: 'hd',
                part: 'right',
                defaultActive: 0,
                isrender: 1
            },
            {
                iconId: 'webExpend',
                part: 'right',
                defaultActive: 0,
                isrender: 1
            }
        ]
    }
};

/**
 * 语音版（预览）
 */ var voice = {
    header: {
        // color: DEFAULT_COLOR,
        // activeColor: DEFAULT_ACTIVE_COLOR,
        btnList: [
            {
                iconId: 'deviceID',
                part: 'left',
                defaultActive: 0,
                isrender: 1
            },
            {
                iconId: 'deviceName',
                part: 'left',
                defaultActive: 0,
                isrender: 1
            }
        ]
    },
    footer: {
        // color: DEFAULT_COLOR,
        // activeColor: DEFAULT_ACTIVE_COLOR,
        btnList: [
            {
                iconId: 'play',
                part: 'left',
                defaultActive: 1,
                isrender: 1
            },
            {
                iconId: 'talk',
                part: 'left',
                defaultActive: 0,
                isrender: 1
            },
            {
                iconId: 'sound',
                part: 'left',
                defaultActive: 1,
                isrender: 1
            },
            {
                iconId: 'webExpend',
                part: 'right',
                defaultActive: 0,
                isrender: 1
            }
        ]
    }
};

/**
 * standard 做特殊处理
 *
 * WARN： 除了 'deviceID', 'deviceName'， 'rec', 'cloudRec', 'cloudRecord' 做特殊处理, 只能放置在顶部， 其它不做处理，如果配置渲染的有问题需要开发者自行修改
 * FIXME: 暂时不去重， 让开发者自己去修改
 */ var TEMPLATES = {
    pcLive: pcLive,
    pcRec: pcRec,
    mobileLive: mobileLive,
    mobileRec: mobileRec,
    security: security,
    voice: voice
};

function _inherits$j(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            writable: true,
            configurable: true
        }
    });
    if (superClass) _set_prototype_of$j(subClass, superClass);
}
function _set_prototype_of$j(o, p) {
    _set_prototype_of$j = Object.setPrototypeOf || function setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
    };
    return _set_prototype_of$j(o, p);
}
/**
 * 截图控件
 * @category Content
 */ var Content = /*#__PURE__*/ function(EventEmitter) {
    _inherits$j(Content, EventEmitter);
    function Content(options) {
        var _this;
        _this = EventEmitter.call(this) || this, _this._scaleMode = 0, _this._originWidth = 0, _this._originHeight = 0, _this._width = 0, _this._height = 0;
        _this.options = options;
        _this._scaleMode = options.scaleMode || 0;
        _this.$wrapper = document.createElement('div');
        _this.$wrapper.className = "" + PREFIX_CLASS + "-content-wrapper";
        _this.$content = document.createElement('div');
        _this.$content.className = "" + PREFIX_CLASS + "-content";
        _this.$video = document.createElement('div');
        _this.$video.className = "" + PREFIX_CLASS + "-content-video";
        _this.$content.appendChild(_this.$video);
        _this.$wrapper.appendChild(_this.$content);
        if (typeof options.getContainer === 'function') {
            var $popupContainer = options.getContainer();
            $popupContainer.appendChild(_this.$wrapper);
        }
        _this.on(EVENTS.videoInfo, function(originWidth, originHeight) {
            _this._rerender(originWidth, originHeight);
        });
        _this.on(EVENTS.resize, function() {
            _this._rerender();
        });
        return _this;
    }
    var _proto = Content.prototype;
    /**
   * 重新画面区域
   * @param {number} originWidth 画面宽度
   * @param {number} originHeight 画面高度
   * @returns {void}
   */ _proto._rerender = function _rerender(originWidth, originHeight) {
        if (originWidth === void 0) originWidth = 0;
        if (originHeight === void 0) originHeight = 0;
        var width = this.$wrapper.clientWidth;
        var height = this.$wrapper.clientHeight;
        // 防止多次渲染
        if (this._width === width && this._height === height && this._originWidth === originWidth && this._originHeight === originHeight) return;
        this._width = width;
        this._height = height;
        if (originWidth > 0 && originHeight > 0) {
            this._originWidth = originWidth;
            this._originHeight = originHeight;
        }
        // 默认是1
        // 视频画面做等比缩放后,高或宽对齐canvas区域,画面不被拉伸,但有黑边
        var objectFill = 'contain';
        // 视频画面完全填充canvas区域,画面会被拉伸
        if (this._scaleMode === THEME_SCALE_MODE_TYPE.full) {
            objectFill = 'fill';
        }
        // 视频画面做等比缩放后,完全填充canvas区域,画面不被拉伸,没有黑边,但画面显示不全
        if (this._scaleMode === THEME_SCALE_MODE_TYPE.fullAuto) {
            objectFill = 'cover';
        }
        if (width > 0 && height > 0 && this._originWidth > 0 && this._originHeight > 0 && this.$video) {
            var left = (width - this._originWidth) / 2;
            var top = (height - this._originHeight) / 2;
            var wScale = width / this._originWidth;
            var hScale = height / this._originHeight;
            var scale = wScale > hScale ? hScale : wScale;
            //
            if (!(this._scaleMode === THEME_SCALE_MODE_TYPE.auto)) {
                if (wScale !== hScale) {
                    scale = wScale + ',' + hScale;
                }
            }
            //
            if (this._scaleMode === THEME_SCALE_MODE_TYPE.fullAuto) {
                scale = wScale > hScale ? wScale : hScale;
            }
            this.$video.style.cssText += "\n        width: " + this._originWidth + "px;\n        height: " + this._originHeight + "px;\n        position: absolute;\n        object-fit:" + objectFill + ";\n        left: " + left + "px;\n        top: " + top + "px;\n        transform-origin: 50% 50%;\n        transform: scale(" + scale + ");\n      ";
            this.emit(EVENTS.control.contentRerender, {
                scaleMode: this._scaleMode,
                objectFill: objectFill,
                scale: scale,
                width: this._originWidth,
                height: this._originHeight
            });
        }
    };
    _proto.setScaleMode = function setScaleMode(scaleMode) {
        if (scaleMode === void 0) scaleMode = 0;
        this._scaleMode = scaleMode;
        this._rerender();
    };
    _proto.destroy = function destroy() {
        var _this_$wrapper;
        if (this.$video) {
            this.$video.remove();
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.$video = null;
        }
        if (this.$content) {
            this.$content.remove();
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.$content = null;
        }
        (_this_$wrapper = this.$wrapper) == null ? void 0 : _this_$wrapper.remove();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.$wrapper = null;
        this.emit(EVENTS.control.contentDestroy);
        this.removeAllListeners();
    };
    return Content;
}(EventEmitter);

function _extends$j() {
    _extends$j = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends$j.apply(this, arguments);
}
function _inherits$i(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            writable: true,
            configurable: true
        }
    });
    if (superClass) _set_prototype_of$i(subClass, superClass);
}
function _set_prototype_of$i(o, p) {
    _set_prototype_of$i = Object.setPrototypeOf || function setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
    };
    return _set_prototype_of$i(o, p);
}
/**
 * 更多控件
 * @category Control
 */ var More = /*#__PURE__*/ function(Control) {
    _inherits$i(More, Control);
    function More(options) {
        var _this;
        _this = Control.call(this, _extends$j({}, options, {
            tagName: 'span',
            controlType: 'button',
            classNameSuffix: 'more'
        })) || this, _this.list = [];
        _this.options = options;
        _this._render();
        return _this;
    }
    var _proto = More.prototype;
    _proto._render = function _render() {
        var _this = this;
        var _this_locale, _this_locale1;
        this.$container.innerHTML = Utils.isMobile ? IconComponents.more({
            title: (_this_locale = this.locale) == null ? void 0 : _this_locale.BTN_MORE
        }) : IconComponents.moreDot({
            title: (_this_locale1 = this.locale) == null ? void 0 : _this_locale1.BTN_MORE
        });
        this.picker = new Picker(this.$container, {
            getPopupContainer: function() {
                return _this.$container;
            },
            trigger: Utils.isMobile ? 'click' : 'hover',
            wrapClassName: PREFIX_CLASS + "-more " + this.options.wrapClassName,
            open: !!this.options.open,
            isMobile: false,
            offset: this.options.offset || [
                0,
                0
            ],
            placement: this.options.placement || 'tr',
            onOpenChange: this.options.onOpenChange
        });
        if (this.picker.$body) {
            this.$panel = document.createElement('div');
            this.$panel.classList.add("" + PREFIX_CLASS + "-more-panel");
            this.picker.$body.appendChild(this.$panel);
            this.picker.$body.addEventListener('dblclick', this._onDBlClick);
        }
    // debug
    };
    /**
   * 添加
   * @param control
   */ _proto.add = function add(key, part, control) {
        this.list.unshift({
            part: part,
            key: key,
            control: control
        });
    };
    /**
   * 移除
   * @param control
   */ _proto.remove = function remove(control) {
        var index = this.list.findIndex(function(item) {
            return item.control === control;
        });
        if (index !== -1) {
            this.list.splice(index, 1);
        }
    };
    _proto.destroy = function destroy() {
        this.list = [];
        if (this.picker) {
            var _this_picker_$body;
            (_this_picker_$body = this.picker.$body) == null ? void 0 : _this_picker_$body.removeEventListener('dblclick', this._onDBlClick);
            this.picker.destroy();
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.picker = null;
        }
        Control.prototype.destroy.call(this);
    };
    /**
   * 点击 Control 会触发
   */ _proto._onControlClick = function _onControlClick(e) {
    // this._options.onClick?.(e);
    };
    return More;
}(Control);

/**
 * 函数防抖
 * @param {Function} func
 * @param {number} wait
 * @typeParam T - 函数类型
 * @returns {Function}
 */ // eslint-disable-next-line @typescript-eslint/ban-types
function debounce(func, wait) {
    var timeout;
    return function() {
        for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
            args[_key] = arguments[_key];
        }
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        var context = this;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            return func.apply(context, args);
        }, wait);
    };
}

/**
 * 事件监听
 * @param theme - Theme
 */ function _themeEventemitter(theme) {
    // prettier-ignore
    theme == null ? void 0 : theme.on(EVENTS.audioCodecUnsupported, function() {
        var _theme_controls;
        if ((_theme_controls = theme.controls) == null ? void 0 : _theme_controls.volumeControl) {
            theme.controls.volumeControl.emit(EVENTS.audioCodecUnsupported);
        }
    });
    // 处理信息提示 duration 单位秒
    theme == null ? void 0 : theme.on(EVENTS.message, function(message, type, duration) {
        if (/error$/gi.test(type) && [
            'ptzError',
            'talkError',
            'themeError',
            '3DZoomError'
        ].includes(type)) {
            var _theme_messageControl;
            (_theme_messageControl = theme.messageControl) == null ? void 0 : _theme_messageControl.toastError(message, duration);
        } else if (/error$/gi.test(type)) {
            var _theme_messageControl1;
            if ((duration || 0) === 0) {
                theme.playing = false;
            }
            (_theme_messageControl1 = theme.messageControl) == null ? void 0 : _theme_messageControl1.error(message, duration);
        } else if (type === 'warn') {
            var _theme_messageControl2;
            (_theme_messageControl2 = theme.messageControl) == null ? void 0 : _theme_messageControl2.warn(message, duration);
        } else if (type === 'info') {
            var _theme_messageControl3;
            (_theme_messageControl3 = theme.messageControl) == null ? void 0 : _theme_messageControl3.info(message, duration);
        }
    });
    theme == null ? void 0 : theme.on(EVENTS.audioInfo, function(info) {
        var _theme_controls;
        // audioFormatName 是私有流的字段
        if ((theme == null ? void 0 : (_theme_controls = theme.controls) == null ? void 0 : _theme_controls.volumeControl) && (info.audioFormatName || info.encType)) {
            theme.controls.volumeControl.disabled = false;
        }
    });
    theme == null ? void 0 : theme.on(EVENTS.videoInfo, function(info) {
        // 排除流信息回调触发的事件
        if (info) {
            var // rerender 画面
            _theme_contentControl_emit, _theme_contentControl;
            (_theme_contentControl = theme.contentControl) == null ? void 0 : (_theme_contentControl_emit = _theme_contentControl.emit) == null ? void 0 : _theme_contentControl_emit.call(_theme_contentControl, EVENTS.videoInfo, info.width, info.height);
        }
    });
    theme == null ? void 0 : theme.on(EVENTS.resize, function() {
        var // rerender 画面
        _theme_contentControl_emit, _theme_contentControl;
        (_theme_contentControl = theme.contentControl) == null ? void 0 : (_theme_contentControl_emit = _theme_contentControl.emit) == null ? void 0 : _theme_contentControl_emit.call(_theme_contentControl, EVENTS.resize);
    });
    theme == null ? void 0 : theme.on('getDeviceInfo', function(info) {
    });
    theme == null ? void 0 : theme.on(EVENTS.firstFrameDisplay, function() {
        theme._disabled(false);
    });
    //
    theme == null ? void 0 : theme.on(EVENTS.play, function(playing) {
        var _theme_controls;
        if (playing) {
            var _theme_messageControl;
            (_theme_messageControl = theme.messageControl) == null ? void 0 : _theme_messageControl.hide();
        }
        if (theme == null ? void 0 : (_theme_controls = theme.controls) == null ? void 0 : _theme_controls.globalFullscreenControl) {
            if (!playing) {
                theme.controls.globalFullscreenControl.disabled = true;
            } else {
                theme.controls.globalFullscreenControl.disabled = false;
            }
        }
    });
    // =======================================================
    // 对讲
    // =======================================================
    theme.on(EVENTS.talkingChange, function(talking) {
        var _theme_controls, _theme_controls_talkControl, _theme_controls1;
        theme._talking = talking;
        if (((_theme_controls = theme.controls) == null ? void 0 : _theme_controls.talkControl) && talking !== ((_theme_controls1 = theme.controls) == null ? void 0 : (_theme_controls_talkControl = _theme_controls1.talkControl) == null ? void 0 : _theme_controls_talkControl.active)) {
            var _theme_controls_talkControl1, _theme_controls2;
            (_theme_controls2 = theme.controls) == null ? void 0 : (_theme_controls_talkControl1 = _theme_controls2.talkControl) == null ? void 0 : _theme_controls_talkControl1.emit(EVENTS.talkingChange, talking);
        }
    });
    theme.on(EVENTS.talkVolumeChange, function(value) {
        var _theme_controls_talkControl_emit, _theme_controls_talkControl, _theme_controls;
        (_theme_controls = theme.controls) == null ? void 0 : (_theme_controls_talkControl = _theme_controls.talkControl) == null ? void 0 : (_theme_controls_talkControl_emit = _theme_controls_talkControl.emit) == null ? void 0 : _theme_controls_talkControl_emit.call(_theme_controls_talkControl, EVENTS.talkVolumeChange, value);
    });
    // =======================================================
    // 录制
    // =======================================================
    theme.on(EVENTS.recordingChange, function(recording) {
        var _theme_controls, _theme_controls_recordControl, _theme_controls1;
        theme._recording = recording;
        if (((_theme_controls = theme.controls) == null ? void 0 : _theme_controls.recordControl) && recording !== ((_theme_controls1 = theme.controls) == null ? void 0 : (_theme_controls_recordControl = _theme_controls1.recordControl) == null ? void 0 : _theme_controls_recordControl.active)) theme.controls.recordControl.active = recording;
    });
    // =======================================================
    // 清晰度
    // =======================================================
    theme.on(EVENTS.setVideoLevelList, function(list) {
        var _theme_controls_definitionControl_emit, _theme_controls_definitionControl, _theme_controls;
        (_theme_controls = theme.controls) == null ? void 0 : (_theme_controls_definitionControl = _theme_controls.definitionControl) == null ? void 0 : (_theme_controls_definitionControl_emit = _theme_controls_definitionControl.emit) == null ? void 0 : _theme_controls_definitionControl_emit.call(_theme_controls_definitionControl, EVENTS.setVideoLevelList, list || []);
    });
    theme.on(EVENTS.currentVideoLevel, function(item, level) {
        var _theme_controls_definitionControl_emit, _theme_controls_definitionControl, _theme_controls;
        (_theme_controls = theme.controls) == null ? void 0 : (_theme_controls_definitionControl = _theme_controls.definitionControl) == null ? void 0 : (_theme_controls_definitionControl_emit = _theme_controls_definitionControl.emit) == null ? void 0 : _theme_controls_definitionControl_emit.call(_theme_controls_definitionControl, EVENTS.currentVideoLevel, item, level);
    });
    // =======================================================
    // 放大
    // =======================================================
    theme.on(EVENTS.zoomingChange, function(zooming) {
        var _theme_controls1, _theme_controls_zoomControl1, _theme_controls2;
        if (((_theme_controls1 = theme.controls) == null ? void 0 : _theme_controls1.zoomControl) && ((_theme_controls2 = theme.controls) == null ? void 0 : (_theme_controls_zoomControl1 = _theme_controls2.zoomControl) == null ? void 0 : _theme_controls_zoomControl1.active) !== zooming) {
            theme.controls.zoomControl.active = zooming;
        }
    });
    theme.on(EVENTS.zoomChange, function(zoom) {
        var _theme_controls, _theme_controls_zoomControl, _theme_controls1;
        if (((_theme_controls = theme.controls) == null ? void 0 : _theme_controls.zoomControl) && ((_theme_controls1 = theme.controls) == null ? void 0 : (_theme_controls_zoomControl = _theme_controls1.zoomControl) == null ? void 0 : _theme_controls_zoomControl.value) !== zoom) {
            theme.controls.zoomControl.value = zoom;
        }
    });
    // =======================================================
    // 倍速
    // =======================================================
    theme.on(EVENTS.speedChange, function(speed) {
        var _theme_controls_speedControl_emit, _theme_controls_speedControl, _theme_controls;
        (_theme_controls = theme.controls) == null ? void 0 : (_theme_controls_speedControl = _theme_controls.speedControl) == null ? void 0 : (_theme_controls_speedControl_emit = _theme_controls_speedControl.emit) == null ? void 0 : _theme_controls_speedControl_emit.call(_theme_controls_speedControl, EVENTS.speedChange, speed);
    });
    // =======================================================
    // 回放片段
    // =======================================================
    theme.on(EVENTS.setAllDayRecTimes, function(list) {
        var _theme_controls_timeLineControl_emit, _theme_controls_timeLineControl, _theme_controls;
        (_theme_controls = theme.controls) == null ? void 0 : (_theme_controls_timeLineControl = _theme_controls.timeLineControl) == null ? void 0 : (_theme_controls_timeLineControl_emit = _theme_controls_timeLineControl.emit) == null ? void 0 : _theme_controls_timeLineControl_emit.call(_theme_controls_timeLineControl, EVENTS.setAllDayRecTimes, list.list);
    });
    theme.on(EVENTS.getOSDTime, function(time) {
        var _theme_controls_timeLineControl_emit, _theme_controls_timeLineControl, _theme_controls;
        (_theme_controls = theme.controls) == null ? void 0 : (_theme_controls_timeLineControl = _theme_controls.timeLineControl) == null ? void 0 : (_theme_controls_timeLineControl_emit = _theme_controls_timeLineControl.emit) == null ? void 0 : _theme_controls_timeLineControl_emit.call(_theme_controls_timeLineControl, EVENTS.getOSDTime, time.data);
    });
    // =======================================================
    // 全屏
    // =======================================================
    theme == null ? void 0 : theme.on(EVENTS.fullscreenChange, function(info) {
        if (theme.zoomUtil) {
            if ([
                0,
                180
            ].includes(theme.orientationAngle) && info.isMobile && info.isCurrentFullscreen) {
                var // 代表移动端播放内容节点被旋转了 90度
                _theme_zoomUtil_setTransform, _theme_zoomUtil;
                (_theme_zoomUtil = theme.zoomUtil) == null ? void 0 : (_theme_zoomUtil_setTransform = _theme_zoomUtil.setTransform) == null ? void 0 : _theme_zoomUtil_setTransform.call(_theme_zoomUtil, true);
            } else {
                var _theme_zoomUtil_setTransform1, _theme_zoomUtil1;
                (_theme_zoomUtil1 = theme.zoomUtil) == null ? void 0 : (_theme_zoomUtil_setTransform1 = _theme_zoomUtil1.setTransform) == null ? void 0 : _theme_zoomUtil_setTransform1.call(_theme_zoomUtil1, false);
            }
        }
    });
    theme == null ? void 0 : theme.on(EVENTS.orientationChange, function(angle) {
        if (theme.zoomUtil) {
            if ([
                0,
                180
            ].includes(angle) && Utils.isMobile && theme.isCurrentFullscreen) {
                var // 代表移动端播放内容节点被旋转了 90度
                _theme_zoomUtil_setTransform, _theme_zoomUtil;
                (_theme_zoomUtil = theme.zoomUtil) == null ? void 0 : (_theme_zoomUtil_setTransform = _theme_zoomUtil.setTransform) == null ? void 0 : _theme_zoomUtil_setTransform.call(_theme_zoomUtil, true);
            } else {
                var _theme_zoomUtil_setTransform1, _theme_zoomUtil1;
                (_theme_zoomUtil1 = theme.zoomUtil) == null ? void 0 : (_theme_zoomUtil_setTransform1 = _theme_zoomUtil1.setTransform) == null ? void 0 : _theme_zoomUtil_setTransform1.call(_theme_zoomUtil1, false);
            }
        }
    });
    // 日期选择器
    theme == null ? void 0 : theme.on(EVENTS.control.dateMonthChange, function(dates) {
        var _theme_controls_dateControl_emit, _theme_controls_dateControl, _theme_controls;
        (_theme_controls = theme.controls) == null ? void 0 : (_theme_controls_dateControl = _theme_controls.dateControl) == null ? void 0 : (_theme_controls_dateControl_emit = _theme_controls_dateControl.emit) == null ? void 0 : _theme_controls_dateControl_emit.call(_theme_controls_dateControl, EVENTS.control.dateMonthChange, dates);
    });
}
/**
 * 控件向主题发现通信消息 control.on -> theme.emit ,仅用来转发控件的事件
 *
 * @param theme - Theme
 */ function _controlEventemitter(theme) {
    var _theme_controls, _theme_controls1, _theme_controls2, _theme_controls3, _theme_controls4, _theme_controls5, _theme_controls6, _theme_controls7, _theme_controls8, _theme_controls9, _theme_controls10, _theme_controls11, _theme_controls12, _theme_controls13, _theme_controls14;
    // Controls
    if (theme._recFooter) {
        theme._recFooter.on(EVENTS.theme.recFooterDestroy, function() {
            theme.emit(EVENTS.theme.recFooterDestroy);
        });
    }
    if (theme._mobileExtend) {
        theme._mobileExtend.on(EVENTS.theme.mobileExtendDestroy, function() {
            theme.emit(EVENTS.theme.mobileExtendDestroy);
        });
    }
    // 主题和控件之间通过 事件监听进行通信， （不推荐回调，因为控件不能定义统一回调函数和控件间通信不好做）
    // controls => theme => 对外
    if (theme._pauseControl) {
        // 播放暂停控件
        theme._pauseControl.on(EVENTS.control.play, function(playing, form) {
            if (!theme.playing) {
                theme.playing = playing;
                theme.emit(EVENTS.control.play, playing, form);
            }
        });
    }
    // 播放暂停控件
    if ((_theme_controls = theme.controls) == null ? void 0 : _theme_controls.playControl) {
        // 播放暂停控件播放状态变化
        // prettier-ignore
        theme.controls.playControl.on(EVENTS.control.play, function(playing) {
            if (theme.playing !== playing) {
                theme.playing = playing;
                theme.emit(EVENTS.control.play, playing);
            }
        });
        theme.controls.playControl.on(EVENTS.control.playDestroy, function() {
            theme.emit(EVENTS.control.playDestroy);
        });
    }
    // 音量控件
    if ((_theme_controls1 = theme.controls) == null ? void 0 : _theme_controls1.volumeControl) {
        // 音量控件音量变化
        // prettier-ignore
        theme.controls.volumeControl.on(EVENTS.control.volumechange, function(volume, muted) {
            if (theme.muted !== muted) theme.muted = muted;
            if (theme.volume !== volume) theme.volume = volume;
            theme.emit(EVENTS.control.volumechange, volume, muted);
        });
        theme.controls.volumeControl.on(EVENTS.control.volumePanelOpenChange, function(open, volume, muted) {
            theme.emit(EVENTS.control.volumePanelOpenChange, open, volume, muted);
        });
        theme.controls.volumeControl.on(EVENTS.control.volumeDestroy, function() {
            theme.emit(EVENTS.control.volumeDestroy);
        });
    }
    // 云台控件
    if ((_theme_controls2 = theme.controls) == null ? void 0 : _theme_controls2.ptzControl) {
        theme.controls.ptzControl.on(EVENTS.control.ptzPanelOpenChange, function(open) {
            if (Utils.isMobile) theme.emit(CLEAR_TIMER_HEADER_FOOTER_ANIMATION, open);
            theme.emit(EVENTS.control.ptzPanelOpenChange, open);
        });
        theme.controls.ptzControl.on(EVENTS.control.ptzSpeedChange, function(speed) {
            theme.emit(EVENTS.control.ptzSpeedChange, speed);
            theme.emit(EVENTS.ptzSpeedChange, speed);
        });
        theme.controls.ptzControl.on(EVENTS.control.ptzError, function(info) {
            theme.emit(EVENTS.control.ptzError, info);
            var message = theme.i18n.t(info.localeKey);
            if (/^\[missing/.test(message)) {
                message = info.msg;
            }
            theme.emit(EVENTS.message, message + " [" + info.code + "]", 'ptzError', 2);
        });
        theme.controls.ptzControl.on(EVENTS.control.ptzDestroy, function() {
            theme.emit(EVENTS.control.ptzDestroy);
        });
    }
    // 录制控件
    if ((_theme_controls3 = theme.controls) == null ? void 0 : _theme_controls3.recordControl) {
        theme.controls.recordControl.on(EVENTS.control.recordingChange, function(recording) {
            if (theme.recording !== recording) theme.emit(EVENTS.control.recordingChange, recording);
        });
        theme.controls.recordControl.on(EVENTS.control.recordDestroy, function() {
            theme.emit(EVENTS.control.recordDestroy);
        });
    }
    // 对讲控件
    if ((_theme_controls4 = theme.controls) == null ? void 0 : _theme_controls4.talkControl) {
        theme.controls.talkControl.on(EVENTS.control.talkingChange, function(talking) {
            if (theme.talking !== talking) theme.emit(EVENTS.control.talkingChange, talking);
        });
        theme.controls.talkControl.on(EVENTS.control.talkDestroy, function() {
            theme.emit(EVENTS.control.talkDestroy);
        });
    }
    // 缩放控件
    if ((_theme_controls5 = theme.controls) == null ? void 0 : _theme_controls5.zoomControl) {
        theme.controls.zoomControl.on(EVENTS.control.zoomChange, function(value, _percent, _range) {
            if (theme.zoom !== value) {
                theme.zoom = value;
                theme.emit(EVENTS.control.zoomChange, value);
            }
        });
        theme.controls.zoomControl.on(EVENTS.control.zoomPanelOpenChange, function(open, _zoom) {
            if (theme.zooming !== open) {
                theme.zooming = open;
                theme.emit(EVENTS.control.zoomPanelOpenChange, open);
            }
        });
        theme.controls.zoomControl.on(EVENTS.control.zoomDestroy, function() {
            if (theme.zooming) {
                theme.zoom = 1;
                theme.zooming = false;
            }
            theme.emit(EVENTS.control.zoomDestroy);
        });
    }
    // 清晰度控件
    if ((_theme_controls6 = theme.controls) == null ? void 0 : _theme_controls6.definitionControl) {
        theme.controls.definitionControl.on(EVENTS.control.definitionPanelOpenChange, function(open, definition, item) {
            theme.emit(CLEAR_TIMER_HEADER_FOOTER_ANIMATION, open, definition);
            theme.emit(EVENTS.control.definitionPanelOpenChange, open, definition, item);
        });
        theme.controls.definitionControl.on(EVENTS.control.definitionChange, function(definition, item) {
            theme.emit(EVENTS.control.definitionChange, definition, item);
        });
        theme.controls.definitionControl.on(EVENTS.control.definitionDestroy, function() {
            theme.emit(EVENTS.control.definitionDestroy);
        });
    }
    // 倍速控件
    if ((_theme_controls7 = theme.controls) == null ? void 0 : _theme_controls7.speedControl) {
        theme.controls.speedControl.on(EVENTS.control.speedPanelOpenChange, function(open, speed, item) {
            theme.emit(CLEAR_TIMER_HEADER_FOOTER_ANIMATION, open, speed);
            theme.emit(EVENTS.control.speedPanelOpenChange, open, speed, item);
        });
        theme.controls.speedControl.on(EVENTS.control.speedChange, function(speed, item) {
            theme.emit(EVENTS.control.speedChange, speed, item);
        });
        theme.controls.speedControl.on(EVENTS.control.speedDestroy, function() {
            theme.emit(EVENTS.control.speedDestroy);
        });
    }
    // 截图控件
    if ((_theme_controls8 = theme.controls) == null ? void 0 : _theme_controls8.capturePictureControl) {
        theme.controls.capturePictureControl.on(EVENTS.control.capturePicture, function(options) {
            theme.emit(EVENTS.control.capturePicture, options);
        });
        theme.controls.capturePictureControl.on(EVENTS.control.capturePictureDestroy, function() {
            theme.emit(EVENTS.control.capturePictureDestroy);
        });
    }
    // 全屏控件
    if ((_theme_controls9 = theme.controls) == null ? void 0 : _theme_controls9.fullscreenControl) {
        theme.controls.fullscreenControl.on(EVENTS.control.fullscreenDestroy, function() {
            theme.emit(EVENTS.control.fullscreenDestroy);
        });
    }
    // 全局全屏控件
    if ((_theme_controls10 = theme.controls) == null ? void 0 : _theme_controls10.globalFullscreenControl) {
        theme.controls.globalFullscreenControl.on(EVENTS.control.globalFullscreenDestroy, function() {
            theme.emit(EVENTS.control.globalFullscreenDestroy);
        });
    }
    // 设备信息控件
    if ((_theme_controls11 = theme.controls) == null ? void 0 : _theme_controls11.deviceControl) {
        theme.controls.deviceControl.on(EVENTS.control.deviceDestroy, function() {
            theme.emit(EVENTS.control.deviceDestroy);
        });
    }
    // 回放类型切换控件
    if ((_theme_controls12 = theme.controls) == null ? void 0 : _theme_controls12.recControl) {
        // prettier-ignore
        theme.controls.recControl.on(EVENTS.control.recTypeChange, function(type) {
            if (theme.recType !== type) {
                var _theme__headerMoreControl, _theme_controls;
                theme.recType = type;
                theme.emit(EVENTS.control.recTypeChange, type);
                // theme.emit(EVENTS.recTypeChange, type);
                if ((_theme__headerMoreControl = theme._headerMoreControl) == null ? void 0 : _theme__headerMoreControl.picker) {
                    theme._headerMoreControl.picker.open = false;
                }
                if ((_theme_controls = theme.controls) == null ? void 0 : _theme_controls.speedControl) {
                    theme.controls.speedControl.emit(EVENTS.control.recTypeChange, type);
                }
            }
        });
        theme.controls.recControl.on(EVENTS.control.recDestroy, function() {
            theme.emit(EVENTS.control.recDestroy);
        });
    }
    // 时间轴控件
    if ((_theme_controls13 = theme.controls) == null ? void 0 : _theme_controls13.timeLineControl) {
        theme.controls.timeLineControl.on(EVENTS.control.timeLineChange, function(date) {
            theme.emit(EVENTS.control.timeLineChange, date);
        });
        theme.controls.timeLineControl.on(EVENTS.control.timeLinePanelOpenChange, function(open) {
            var _theme_controls_dateControl, _theme_controls;
            if ((_theme_controls = theme.controls) == null ? void 0 : (_theme_controls_dateControl = _theme_controls.dateControl) == null ? void 0 : _theme_controls_dateControl.datePicker) {
                var _theme_controls_dateControl_datePicker, _theme_controls_dateControl1, _theme_controls1;
                (_theme_controls1 = theme.controls) == null ? void 0 : (_theme_controls_dateControl1 = _theme_controls1.dateControl) == null ? void 0 : (_theme_controls_dateControl_datePicker = _theme_controls_dateControl1.datePicker) == null ? void 0 : _theme_controls_dateControl_datePicker.hide();
            }
            theme.emit(EVENTS.control.timeLinePanelOpenChange, open);
        });
        theme.controls.timeLineControl.on(EVENTS.control.timeLineDestroy, function() {
            theme.emit(EVENTS.control.timeLineDestroy);
        });
    }
    // 日历控件
    if ((_theme_controls14 = theme.controls) == null ? void 0 : _theme_controls14.dateControl) {
        theme.controls.dateControl.on(EVENTS.control.datePanelOpenChange, function(open, date) {
            theme.emit(EVENTS.control.datePanelOpenChange, open, date);
        });
        theme.controls.dateControl.on(EVENTS.control.dateChange, function(date) {
            theme.emit(EVENTS.control.dateChange, date);
        });
        theme.controls.dateControl.on(EVENTS.control.dateDestroy, function() {
            theme.emit(EVENTS.control.recDestroy);
        });
    }
    // content
    if (theme.contentControl) {
        theme.contentControl.on(EVENTS.control.contentRerender, function(info) {
            theme.emit(EVENTS.control.contentRerender, info);
        });
    }
}
var ignoreList = [
    EVENTS.getOSDTime,
    EVENTS.setAllDayRecTimes,
    EVENTS.talkVolumeChange
];
/**
 * 打印所有事件触发日志（仅主题层， 没有控件层因为已经透传到主题层了）
 * @param theme
 */ function _bindEventLogger(theme, events) {
    Object.values(events).forEach(function(eventName) {
        var typedEventName = eventName;
        if (ignoreList.includes(typedEventName)) {
            return;
        }
        if (typeof typedEventName === 'string') {
            theme.on(typedEventName, function() {
                for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
                    args[_key] = arguments[_key];
                }
                try {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    theme.logger.log('[Event]', typedEventName, JSON.stringify(args));
                } catch (error) {
                    var // 有些对象是不能序列化的， 请不要通过事件进行通信, 有些可能会有引用导致内存泄漏
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    _theme_logger;
                    (_theme_logger = theme.logger).warn.apply(_theme_logger, [].concat([
                        '[Event]',
                        typedEventName
                    ], args));
                }
            });
        } else if (Object.prototype.toString.call(typedEventName) === '[object Object]') {
            _bindEventLogger(theme, eventName);
        }
    });
}

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
 * @returns {void}
 */ function _resize(theme, width, height) {
    var cssText = '';
    if (/^\d+(\.\d+)?$/.test(width + '')) {
        cssText += "width: " + width + "px;";
    } else if (width) {
        cssText += "width: " + width + ";";
    }
    if (/^\d+(\.\d+)?$/.test(height + '')) {
        cssText += "height: " + height + "px;";
    } else if (height) {
        cssText += "height: " + height + ";";
    }
    if (theme.$container) theme.$container.style.cssText += cssText;
}

function _defineProperties$5(target, props) {
    for(var i = 0; i < props.length; i++){
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
    }
}
function _create_class$5(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties$5(Constructor.prototype, protoProps);
    return Constructor;
}
function _extends$i() {
    _extends$i = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends$i.apply(this, arguments);
}
function _inherits$h(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            writable: true,
            configurable: true
        }
    });
    if (superClass) _set_prototype_of$h(subClass, superClass);
}
function _set_prototype_of$h(o, p) {
    _set_prototype_of$h = Object.setPrototypeOf || function setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
    };
    return _set_prototype_of$h(o, p);
}
var ZOOM_DEFAULT_OPTIONS = {
    open: false,
    max: 8
};
/**
 * 电子放大控件
 * @category Control
 */ var Zoom$1 = /*#__PURE__*/ function(Control) {
    _inherits$h(Zoom, Control);
    function Zoom(options) {
        var _this;
        _this = Control.call(this, _extends$i({}, options, {
            tagName: 'span',
            controlType: 'button',
            classNameSuffix: 'zoom'
        })) || this, _this._value = 1, _this._isRotated = false;
        _this._options = Object.assign({}, ZOOM_DEFAULT_OPTIONS, options || {});
        _this._render();
        _this.emit(EVENTS.zoomChange, function(zoom) {
            if (_this._progress) {
                _this.value = zoom;
            }
        });
        return _this;
    }
    var _proto = Zoom.prototype;
    _proto._render = function _render() {
        var _this = this;
        var _this_locale, _this__options_rootContainer, _this__options_props, _this__options_props1;
        this.$container.innerHTML = IconComponents.zoom({
            title: (_this_locale = this.locale) == null ? void 0 : _this_locale.BTN_ZOOM
        });
        this._$zoomPanel = document.createElement('div');
        this._$zoomPanel.className = PREFIX_CLASS + "-zoom-panel " + PREFIX_CLASS + "-hide";
        (_this__options_rootContainer = this._options.rootContainer) == null ? void 0 : _this__options_rootContainer.appendChild(this._$zoomPanel);
        // 最大值小于1 默认为 8 倍数， 最大值向下取整
        var max = this._options.max <= 1 ? 8 : Math.floor(this._options.max);
        this._isRotated = !!((_this__options_props = this._options.props) == null ? void 0 : _this__options_props.isCurrentFullscreen) && [
            0,
            180
        ].includes((_this__options_props1 = this._options.props) == null ? void 0 : _this__options_props1.orientationAngle);
        this._progress = new Progress({
            container: this._$zoomPanel,
            defaultValue: 1,
            range: [
                1,
                max
            ],
            step: 1,
            showMinus: true,
            showPlus: true,
            showPercent: true,
            isRotated: this._isRotated,
            onChange: function(value, percent, range) {
                if (value !== _this._value) {
                    _this._value = value;
                    _this._options.onChange == null ? void 0 : _this._options.onChange.call(_this._options, value, percent, range);
                    _this.emit(EVENTS.control.zoomChange, value, percent, range);
                }
            },
            renderText: function(value) {
                return "" + value + "X";
            }
        });
    };
    _proto.reset = function reset(hide) {
        if (this.active) {
            var _this__$zoomPanel_classList, _this__$zoomPanel;
            (_this__$zoomPanel = this._$zoomPanel) == null ? void 0 : (_this__$zoomPanel_classList = _this__$zoomPanel.classList) == null ? void 0 : _this__$zoomPanel_classList.add("" + PREFIX_CLASS + "-hide");
            this._progress.value = 1;
            this.active = false;
            Control.prototype.reset.call(this, hide);
        }
    };
    _proto.destroy = function destroy() {
        if (this._options.rootContainer && this._$zoomPanel) {
            var _this__options_rootContainer;
            (_this__options_rootContainer = this._options.rootContainer) == null ? void 0 : _this__options_rootContainer.removeChild(this._$zoomPanel);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this._$zoomPanel = null;
        }
        Control.prototype.destroy.call(this);
    };
    /**
   * 点击 Control 会触发
   */ _proto._onControlClick = function _onControlClick(e) {
        this.active = !this.active;
        Control.prototype._onControlClick.call(this, e);
    };
    _create_class$5(Zoom, [
        {
            key: "value",
            get: function get() {
                return this._value;
            },
            set: function set(value) {
                if (this._progress && this._value !== value) {
                    this._progress.value = value;
                    this._value = value;
                }
            }
        },
        {
            key: "active",
            get: /**
   * 是否激活
   */ function get() {
                return this._active;
            },
            set: function set(active) {
                this._active = active;
                this._updateActiveState(active);
                if (this.active) {
                    var _this__$zoomPanel_classList, _this__$zoomPanel;
                    (_this__$zoomPanel = this._$zoomPanel) == null ? void 0 : (_this__$zoomPanel_classList = _this__$zoomPanel.classList) == null ? void 0 : _this__$zoomPanel_classList.remove("" + PREFIX_CLASS + "-hide");
                    this.emit(EVENTS.control.zoomPanelOpenChange, true);
                } else {
                    var _this__$zoomPanel_classList1, _this__$zoomPanel1;
                    (_this__$zoomPanel1 = this._$zoomPanel) == null ? void 0 : (_this__$zoomPanel_classList1 = _this__$zoomPanel1.classList) == null ? void 0 : _this__$zoomPanel_classList1.add("" + PREFIX_CLASS + "-hide");
                    this._progress.value = 1;
                    this.emit(EVENTS.control.zoomPanelOpenChange, false);
                }
            }
        },
        {
            key: "isRotated",
            get: function get() {
                return this._isRotated;
            },
            set: function set(rotated) {
                if (this._progress) {
                    this._progress.isRotate(rotated);
                }
            }
        }
    ]);
    return Zoom;
}(Control);

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

/*
* @ezuikit/control-zoom v0.0.2
* Copyright (c) 2025-11-12 Ezviz-OpenBiz
* Released under the MIT License.
*/

var dist$1;
var hasRequiredDist$1;

function requireDist$1 () {
	if (hasRequiredDist$1) return dist$1;
	hasRequiredDist$1 = 1;

	/**
	 * Zoom position
	 *
	 */ function _defineProperties(target, props) {
	    for(var i = 0; i < props.length; i++){
	        var descriptor = props[i];
	        descriptor.enumerable = descriptor.enumerable || false;
	        descriptor.configurable = true;
	        if ("value" in descriptor) descriptor.writable = true;
	        Object.defineProperty(target, descriptor.key, descriptor);
	    }
	}
	function _create_class(Constructor, protoProps, staticProps) {
	    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
	    return Constructor;
	}
	var ZOOM_DEFAULT_POSITION = [
	    0,
	    0
	];
	/**
	 * 默认值
	 */ var DefaultOptions = {
	    initialZoom: 1,
	    defaultCursor: 'pointer',
	    scrollVelocity: 0.1,
	    animDuration: 0.25,
	    allowZoom: true,
	    allowPan: true,
	    onChange: function() {},
	    onTranslateChange: function() {},
	    onTap: function() {},
	    max: 8,
	    min: 1,
	    zoomStep: 0.1,
	    allowTouchEvents: false,
	    allowWheel: true,
	    ignoredMouseButtons: [],
	    doubleTouchMaxDelay: 300,
	    decelerationDuration: 750
	};
	/**
	 * dom 节点放大和拖动
	 *
	 */ var Zoom = /*#__PURE__*/ function() {
	    function Zoom(container, options) {
	        var _this = this;
	        this._dragging = false;
	        /**
	   * 销毁
	   * destroy
	   */ this.destroy = function() {
	            _this.setAllowZoom(false);
	            _this.reset();
	            _this.removeEventListeners();
	        };
	        /**
	   * 设置是否旋转
	   * @param trans - 是否transform
	   */ this.setTransform = function(trans) {
	            _this.transform = trans;
	        };
	        /**
	   * 获取是否旋转
	   * @returns
	   */ this.getTransform = function() {
	            return _this.transform;
	        };
	        /**
	   * 更新x轴和Y轴平移值
	   */ this.updateTranslate = function() {
	            var translateX = 0;
	            var translateY = 0;
	            if (_this.percentPos[0] < 0) {
	                translateX = _this.percentPos[0] < -(0.5 * (_this.zoom - 1)) ? -(0.5 * (_this.zoom - 1)) : _this.percentPos[0];
	            } else {
	                translateX = _this.percentPos[0] > 0.5 * (_this.zoom - 1) ? 0.5 * (_this.zoom - 1) : _this.percentPos[0];
	            }
	            if (_this.percentPos[1] < 0) {
	                translateY = _this.percentPos[1] < -(0.5 * (_this.zoom - 1)) ? -(0.5 * (_this.zoom - 1)) : _this.percentPos[1];
	            } else {
	                translateY = _this.percentPos[1] > 0.5 * (_this.zoom - 1) ? 0.5 * (_this.zoom - 1) : _this.percentPos[1];
	            }
	            _this.percentPos = [
	                translateX,
	                translateY
	            ];
	        };
	        /**
	   * 更新容器样式
	   */ this.update = function() {
	            if (!_this.container) return;
	            _this.updateTranslate();
	            _this.container.style.transition = "transform ease-out " + _this.transition + "s";
	            _this.container.style.transform = "translate3d(" + _this.percentPos[0] * 100 + "%, " + _this.percentPos[1] * 100 + "%, 0) scale(" + _this.zoom + ")";
	        };
	        /**
	   * 设置支持缩放
	   * @param allow
	   */ this.setAllowZoom = function(allow) {
	            _this.options.allowZoom = allow;
	        };
	        /**
	   * 设置缩放值
	   * @param zoom - 缩放值
	   * @param reset - 是否重置
	   */ this.setZoom = function(zoom, reset) {
	            zoom = parseFloat(zoom.toFixed(_this.getPrecision(_this.options.zoomStep)));
	            if (_this.zoom !== zoom) {
	                _this.zoom = zoom;
	                _this.update();
	                _this.options.onChange == null ? void 0 : _this.options.onChange.call(_this.options, +_this.zoom.toFixed(_this.getPrecision(_this.options.zoomStep)), reset);
	            }
	        };
	        /**
	   * 获取缩放值
	   * @returns
	   */ this.getZoom = function() {
	            return _this.zoom;
	        };
	        /**
	   * 设置位置
	   * @param pos - 位置 [X轴坐标转换， Y轴坐标转换]
	   */ this.setPos = function(pos) {
	            var _this_container, _this_container1;
	            var containerWidth = (_this_container = _this.container) == null ? void 0 : _this_container.clientWidth;
	            var containerHeight = (_this_container1 = _this.container) == null ? void 0 : _this_container1.clientHeight;
	            if (+_this.pos[0] !== pos[0] || +_this.pos[1] !== pos[1]) {
	                _this.percentPos = [
	                    pos[0] / containerWidth,
	                    pos[1] / containerHeight
	                ];
	                _this.update();
	                _this.options.onTranslateChange == null ? void 0 : _this.options.onTranslateChange.call(_this.options, {
	                    posX: pos[0],
	                    posY: pos[1]
	                });
	            }
	        };
	        /**
	   * 设置过渡时间
	   * @param duration - 过渡时间, 单位秒
	   */ this.setTransitionDuration = function(duration) {
	            _this.transition = duration;
	            _this.update();
	        };
	        /**
	   * 设置鼠标样式
	   * @param cursor
	   * @returns
	   */ this.setCursor = function(cursor) {
	            if (!_this.container) return;
	            _this.container.style.cssText += "cursor:" + cursor + ";";
	            _this.cursor = cursor;
	        };
	        this.zoomIn = function(value) {
	            var newPosX = _this.pos[0];
	            var newPosY = _this.pos[1];
	            var prevZoom = _this.zoom;
	            var _this_options_max, _this_options_max1;
	            var newZoom = prevZoom + value < ((_this_options_max = _this.options.max) != null ? _this_options_max : 8) ? prevZoom + value : (_this_options_max1 = _this.options.max) != null ? _this_options_max1 : 8;
	            if (newZoom !== prevZoom) {
	                newPosX = newPosX * (newZoom - 1) / (prevZoom > 1 ? prevZoom - 1 : prevZoom);
	                newPosY = newPosY * (newZoom - 1) / (prevZoom > 1 ? prevZoom - 1 : prevZoom);
	            }
	            _this.setZoom(newZoom);
	            _this.setPos([
	                newPosX,
	                newPosY
	            ]);
	            _this.setTransitionDuration(_this.options.animDuration);
	        };
	        this.zoomOut = function(value) {
	            var newPosX = _this.pos[0];
	            var newPosY = _this.pos[1];
	            var prevZoom = _this.zoom;
	            var _this_options_min, _this_options_min1;
	            var newZoom = prevZoom - value > ((_this_options_min = _this.options.min) != null ? _this_options_min : 1) ? prevZoom - value : (_this_options_min1 = _this.options.min) != null ? _this_options_min1 : 1;
	            if (newZoom !== prevZoom) {
	                newPosX = newPosX * (newZoom - 1) / (prevZoom - 1);
	                newPosY = newPosY * (newZoom - 1) / (prevZoom - 1);
	            }
	            _this.setZoom(newZoom);
	            _this.setPos([
	                newPosX,
	                newPosY
	            ]);
	            _this.setTransitionDuration(_this.options.animDuration);
	        };
	        this.zoomToZone = function(relX, relY, relWidth, relHeight) {
	            var _this_container;
	            if (!_this.container) return;
	            var newPosX = _this.pos[0];
	            var newPosY = _this.pos[1];
	            var parentRect = ((_this_container = _this.container) == null ? void 0 : _this_container.parentNode).getBoundingClientRect();
	            var prevZoom = _this.zoom;
	            // Calculate zoom factor to scale the zone
	            var optimalZoomX = parentRect.width / relWidth;
	            var optimalZoomY = parentRect.height / relHeight;
	            var _this_options_max;
	            var newZoom = Math.min(optimalZoomX, optimalZoomY, (_this_options_max = _this.options.max) != null ? _this_options_max : 8);
	            // Calculate new position to center the zone
	            var rect = _this.container.getBoundingClientRect();
	            var _ref = [
	                rect.width / prevZoom / 2,
	                rect.height / prevZoom / 2
	            ], centerX = _ref[0], centerY = _ref[1];
	            var _ref1 = [
	                relX + relWidth / 2,
	                relY + relHeight / 2
	            ], zoneCenterX = _ref1[0], zoneCenterY = _ref1[1];
	            newPosX = (centerX - zoneCenterX) * newZoom;
	            newPosY = (centerY - zoneCenterY) * newZoom;
	            _this.setZoom(newZoom);
	            _this.setPos([
	                newPosX,
	                newPosY
	            ]);
	            _this.setTransitionDuration(_this.options.animDuration);
	        };
	        this.getNewPosition = function(x, y, newZoom) {
	            var _ref = [
	                _this.zoom,
	                _this.pos[0],
	                _this.pos[1]
	            ], prevZoom = _ref[0];
	            if (newZoom === 1 || !_this) return ZOOM_DEFAULT_POSITION;
	            var _ref1 = [
	                _this.container.clientWidth,
	                _this.container.clientHeight
	            ], clientWidth = _ref1[0], clientHeight = _ref1[1];
	            if (newZoom > prevZoom) {
	                return [
	                    0,
	                    0
	                ];
	            } else {
	                // 放到最大
	                var w = -((x - clientWidth / 2) / (clientWidth / 2)) * newZoom / 2;
	                var h = -((y - clientHeight / 2) / (clientHeight / 2)) * newZoom / 2;
	                if (w > newZoom / 2 - 0.5) {
	                    w = 3.5;
	                }
	                if (h > newZoom / 2 - 0.5) {
	                    h = 3.5;
	                }
	                return [
	                    clientWidth * w,
	                    clientHeight * h
	                ];
	            }
	        };
	        /**
	   * 缩放到最大
	   * @param x - 点击点X坐标
	   * @param y - 点击点Y坐标
	   */ this.fullZoomInOnPosition = function(x, y) {
	            var _this_options_max;
	            var zoom = (_this_options_max = _this.options.max) != null ? _this_options_max : DefaultOptions.max;
	            _this.setZoom(zoom != null ? zoom : DefaultOptions.max);
	            _this.setPos(_this.getNewPosition(x, y, zoom));
	            _this.setTransitionDuration(_this.options.animDuration);
	        };
	        this.getLimitedShift = function(shift, minLimit, maxLimit, minElement, maxElement) {
	            if (shift > 0) {
	                if (minElement > minLimit) {
	                    return 0;
	                } else if (minElement + shift > minLimit) {
	                    return minLimit - minElement;
	                }
	            } else if (shift < 0) {
	                if (maxElement < maxLimit) {
	                    return 0;
	                } else if (maxElement + shift < maxLimit) {
	                    return maxLimit - maxElement;
	                }
	            }
	            return shift;
	        };
	        this.getCursor = function(canMoveOnX, canMoveOnY) {
	            if (canMoveOnX && canMoveOnY) {
	                return 'move';
	            } else if (canMoveOnX) {
	                return 'ew-resize';
	            } else if (canMoveOnY) {
	                return 'ns-resize';
	            } else {
	                return 'auto';
	            }
	        };
	        this.move = function(shiftX, shiftY, transitionDuration) {
	            if (transitionDuration === void 0) transitionDuration = 0;
	            if (!_this.container) return;
	            var newPosX = _this.pos[0];
	            var newPosY = _this.pos[1];
	            // let canMoveOnX: boolean, canMoveOnY: boolean;
	            var rect = _this.container.getBoundingClientRect();
	            var parentRect = _this.container.parentNode.getBoundingClientRect();
	            // 根据是否进行了伪横屏旋转，决定是使用 shiftX 还是 shiftY 来对画面进行移动
	            var shiftHorizontal = _this.transform ? shiftY : shiftX;
	            var shiftVertical = _this.transform ? shiftX : shiftY;
	            var _ref = _this.transform ? [
	                rect.height > parentRect.bottom - parentRect.top,
	                shiftVertical > 0 && rect.top - parentRect.top < 0,
	                shiftVertical < 0 && rect.bottom - parentRect.bottom > 0
	            ] : [
	                rect.width > parentRect.right - parentRect.left,
	                shiftHorizontal > 0 && rect.left - parentRect.left < 0,
	                shiftHorizontal < 0 && rect.right - parentRect.right > 0
	            ], isLargerHor = _ref[0], isOutLeftBoundary = _ref[1], isOutRightBoundary = _ref[2];
	            var canMoveOnX = isLargerHor || isOutLeftBoundary || isOutRightBoundary;
	            if (canMoveOnX) {
	                if (_this.transform) {
	                    newPosX += _this.getLimitedShift(shiftVertical, parentRect.top, parentRect.bottom, rect.top, rect.bottom);
	                } else {
	                    newPosX += _this.getLimitedShift(shiftHorizontal, parentRect.left, parentRect.right, rect.left, rect.right);
	                }
	            }
	            var _ref1 = _this.transform ? [
	                rect.width > parentRect.right - parentRect.left,
	                shiftHorizontal > 0 && rect.right - parentRect.right < 0,
	                shiftHorizontal < 0 && rect.left - parentRect.left > 0
	            ] : [
	                rect.height > parentRect.bottom - parentRect.top,
	                shiftVertical > 0 && rect.top - parentRect.top < 0,
	                shiftVertical < 0 && rect.bottom - parentRect.bottom > 0
	            ], isLargerVer = _ref1[0], isOutTopBoundary = _ref1[1], isOutBottomBoundary = _ref1[2];
	            var canMoveOnY = isLargerVer || isOutTopBoundary || isOutBottomBoundary;
	            if (canMoveOnY) {
	                if (_this.transform) {
	                    var transformGetLimitedShift = function(shift, minLimit, maxLimit, minElement, maxElement) {
	                        // css伪横屏边界判断特殊处理
	                        if (shift > 0) {
	                            if (maxElement < maxLimit + 1) {
	                                return 0;
	                            } else if (maxElement + shift < maxLimit + 1) {
	                                return maxLimit - maxElement;
	                            }
	                        } else if (shift < 0) {
	                            if (minElement + 1 > minLimit) {
	                                return 0;
	                            } else if (minElement + 1 + shift > minLimit) {
	                                return minLimit - minElement;
	                            }
	                        }
	                        return shift;
	                    };
	                    newPosY += transformGetLimitedShift(shiftHorizontal, parentRect.left, parentRect.right, rect.left, rect.right);
	                } else {
	                    newPosY += _this.getLimitedShift(shiftVertical, parentRect.top, parentRect.bottom, rect.top, rect.bottom);
	                }
	            }
	            var cursor = _this.getCursor(canMoveOnX, canMoveOnY);
	            _this.setPos([
	                newPosX,
	                newPosY
	            ]);
	            _this.setCursor(cursor);
	            _this.setTransitionDuration(transitionDuration);
	        };
	        /**
	   * 移动端双击
	   * @returns
	   */ this.isDoubleTapping = function() {
	            var touchTime = new Date().getTime();
	            var _this_lastTouchTime, _this_options_doubleTouchMaxDelay, _this_lastDoubleTapTime, _this_options_doubleTouchMaxDelay1;
	            var isDoubleTap = touchTime - ((_this_lastTouchTime = _this.lastTouchTime) != null ? _this_lastTouchTime : 0) < ((_this_options_doubleTouchMaxDelay = _this.options.doubleTouchMaxDelay) != null ? _this_options_doubleTouchMaxDelay : 300) && touchTime - ((_this_lastDoubleTapTime = _this.lastDoubleTapTime) != null ? _this_lastDoubleTapTime : 0) > ((_this_options_doubleTouchMaxDelay1 = _this.options.doubleTouchMaxDelay) != null ? _this_options_doubleTouchMaxDelay1 : 750);
	            if (isDoubleTap) {
	                _this.lastDoubleTapTime = touchTime;
	                return true;
	            }
	            _this.lastTouchTime = touchTime;
	            return false;
	        };
	        this.startDeceleration = function(lastShiftOnX, lastShiftOnY) {
	            var startTimestamp = null;
	            var startDecelerationMove = function(timestamp) {
	                if (startTimestamp === null) startTimestamp = timestamp;
	                var progress = timestamp - startTimestamp;
	                var _this_options_decelerationDuration, _this_options_decelerationDuration1;
	                var ratio = (((_this_options_decelerationDuration = _this.options.decelerationDuration) != null ? _this_options_decelerationDuration : 750) - progress) / ((_this_options_decelerationDuration1 = _this.options.decelerationDuration) != null ? _this_options_decelerationDuration1 : 750);
	                var _ref = [
	                    lastShiftOnX * ratio,
	                    lastShiftOnY * ratio
	                ], shiftX = _ref[0], shiftY = _ref[1];
	                var _this_options_decelerationDuration2;
	                if (progress < ((_this_options_decelerationDuration2 = _this.options.decelerationDuration) != null ? _this_options_decelerationDuration2 : 750) && Math.max(Math.abs(shiftX), Math.abs(shiftY)) > 1) {
	                    _this.move(shiftX, shiftY, 0);
	                    _this.lastRequestAnimationId = requestAnimationFrame(startDecelerationMove);
	                } else {
	                    _this.lastRequestAnimationId = null;
	                }
	            };
	            _this.lastRequestAnimationId = requestAnimationFrame(startDecelerationMove);
	        };
	        this.reset = function() {
	            _this.setZoom(_this.options.initialZoom, true);
	            _this.cursor = _this.options.defaultCursor;
	            _this.setTransitionDuration(_this.options.animDuration);
	            _this.setPos(ZOOM_DEFAULT_POSITION);
	        };
	        // api向前兼容
	        this.addScale = function(scale) {
	            if (scale === void 0) scale = 1;
	            _this.handleZoomAdd(scale);
	        };
	        this.handleZoomAdd = function(scale) {
	            if (scale === void 0) scale = 1;
	            if (!_this.options.allowZoom || !_this.options.allowWheel) return;
	            var newZoom = parseFloat((_this.zoom + scale).toFixed(_this.getPrecision(_this.options.zoomStep)));
	            var _this_options_max;
	            if (newZoom > ((_this_options_max = _this.options.max) != null ? _this_options_max : 8)) {
	                newZoom = 8;
	            }
	            _this.setZoom(newZoom);
	            _this.setPos(_this.pos);
	            _this.setTransitionDuration(0.05);
	        };
	        // api向前兼容
	        this.subScale = function(scale) {
	            if (scale === void 0) scale = 1;
	            _this.handleZoomSub(scale);
	        };
	        this.handleZoomSub = function(scale) {
	            if (scale === void 0) scale = 1;
	            if (!_this.options.allowZoom || !_this.options.allowWheel) return;
	            var newZoom = parseFloat((_this.zoom - scale).toFixed(_this.getPrecision(_this.options.zoomStep)));
	            if (newZoom < 1) {
	                newZoom = 1;
	            }
	            _this.setZoom(newZoom);
	            _this.setPos(_this.pos);
	            _this.setTransitionDuration(0.05);
	        };
	        this.handleMouseWheel = function(event) {
	            event.preventDefault();
	            if (!_this.options.allowZoom || !_this.options.allowWheel) return;
	            var velocity = event.deltaY < 0 ? _this.options.scrollVelocity : 0 - _this.options.scrollVelocity;
	            var _this_options_max, _this_options_min;
	            var newZoom = parseFloat(Math.max(Math.min(_this.zoom + velocity, (_this_options_max = _this.options.max) != null ? _this_options_max : 8), (_this_options_min = _this.options.min) != null ? _this_options_min : 1).toFixed(_this.getPrecision(_this.options.zoomStep)));
	            _this.setZoom(newZoom);
	            // this.setPos(this.getNewPosition(posX, posY, newZoom));
	            _this.setTransitionDuration(0.05);
	        };
	        this.handleMouseStart = function(event) {
	            var _this_options_ignoredMouseButtons;
	            event.preventDefault();
	            if (!_this.options.allowPan || ((_this_options_ignoredMouseButtons = _this.options.ignoredMouseButtons) == null ? void 0 : _this_options_ignoredMouseButtons.includes(event.button))) return;
	            _this._dragging = true;
	            if (_this.lastRequestAnimationId) cancelAnimationFrame(_this.lastRequestAnimationId);
	            _this.lastCursor = _this.getCoordinates(event);
	        };
	        this.handleMouseMove = function(event) {
	            event.preventDefault();
	            if (!_this.options.allowPan || !_this.lastCursor || !_this._dragging) return;
	            _this._touchOrMouseDrag(event);
	        };
	        this.handleMouseStop = function(event) {
	            event.preventDefault();
	            if (_this.lastShift) {
	                _this.startDeceleration(_this.lastShift[0], _this.lastShift[1]);
	                _this.lastShift = null;
	            }
	            _this.lastCursor = null;
	            _this.setCursor('auto');
	            _this._dragging = false;
	        };
	        this.handleTouchStart = function(event) {
	            var isThisDoubleTapping = _this.isDoubleTapping();
	            _this.isMultiTouch = event.touches.length;
	            if (!_this.options.allowTouchEvents) event.preventDefault();
	            if (_this.lastRequestAnimationId) cancelAnimationFrame(_this.lastRequestAnimationId);
	            var _this_getCoordinates = _this.getCoordinates(event.touches[0]), posX = _this_getCoordinates[0], posY = _this_getCoordinates[1];
	            if (_this.isMultiTouch > 1) {
	                _this.lastCursor = [
	                    posX,
	                    posY
	                ];
	                return;
	            }
	            if (isThisDoubleTapping && _this.options.allowZoom) {
	                if (_this.zoom === 1) {
	                    var _this_container_getBoundingClientRect = _this.container.getBoundingClientRect(); _this_container_getBoundingClientRect.top; _this_container_getBoundingClientRect.left; var x = _this_container_getBoundingClientRect.x, y = _this_container_getBoundingClientRect.y;
	                    var ref;
	                    ref = _this.transform ? [
	                        y,
	                        x
	                    ] : [
	                        x,
	                        y
	                    ], x = ref[0], y = ref[1];
	                    var ref1;
	                    ref1 = [
	                        posX - x,
	                        posY - y
	                    ], posX = ref1[0], posY = ref1[1];
	                    // 双击放大到最大
	                    _this.fullZoomInOnPosition(posX, posY);
	                } else {
	                    _this.reset();
	                }
	                return;
	            }
	            _this._tapStartTime = new Date().getTime();
	            if (_this.options.allowPan) _this.lastCursor = [
	                posX,
	                posY
	            ];
	        };
	        this.handleTouchMove = function(event) {
	            if (!_this.options.allowTouchEvents) event.preventDefault();
	            if (!_this.lastCursor) return;
	            if (_this.isMultiTouch === 1) {
	                _this._touchOrMouseDrag(event.touches[0]);
	                _this.lastTouchDistance = null;
	            } else if (_this.isMultiTouch > 1) {
	                var newZoom = _this.zoom;
	                // If we detect two points, we shall zoom up or down
	                var _this_getCoordinates = _this.getCoordinates(event.touches[0]), pos1X = _this_getCoordinates[0], pos1Y = _this_getCoordinates[1];
	                var _this_getCoordinates1 = _this.getCoordinates(event.touches[1]), pos2X = _this_getCoordinates1[0], pos2Y = _this_getCoordinates1[1];
	                var distance = Math.sqrt(Math.pow(pos2X - pos1X, 2) + Math.pow(pos2Y - pos1Y, 2));
	                if (_this.lastTouchDistance && distance && distance !== _this.lastTouchDistance) {
	                    if (_this.options.allowZoom) {
	                        newZoom += (distance - _this.lastTouchDistance) / 100;
	                        var _this_options_max, _this_options_min;
	                        if (newZoom > ((_this_options_max = _this.options.max) != null ? _this_options_max : 8)) {
	                            var _this_options_max1;
	                            newZoom = (_this_options_max1 = _this.options.max) != null ? _this_options_max1 : 8;
	                        } else if (newZoom < ((_this_options_min = _this.options.min) != null ? _this_options_min : 1)) {
	                            var _this_options_min1;
	                            newZoom = (_this_options_min1 = _this.options.min) != null ? _this_options_min1 : 1;
	                        }
	                    }
	                    // 不要做移动，因为会有冲突
	                    _this.setZoom(newZoom);
	                    _this.setTransitionDuration(0);
	                }
	                // Save data for the next move
	                _this.lastCursor = [
	                    pos1X,
	                    pos1Y
	                ];
	                _this.lastTouchDistance = distance;
	            }
	        };
	        this.handleTouchStop = function() {
	            if (_this.lastShift) {
	                // Use the last shift to make a decelerating movement effect
	                _this.startDeceleration(_this.lastShift[0], _this.lastShift[1]);
	                _this.lastShift = null;
	            }
	            if (_this._tapStartTime && new Date().getTime() - _this._tapStartTime < 200) {
	                _this.options.onTap == null ? void 0 : _this.options.onTap.call(_this.options);
	            }
	            _this._tapStartTime = undefined;
	            _this.lastCursor = null;
	            _this.lastTouchDistance = null;
	            _this.isMultiTouch = 0;
	        };
	        this.container = container;
	        this.options = Object.assign({}, DefaultOptions, options || {});
	        this.percentPos = ZOOM_DEFAULT_POSITION;
	        this.transition = this.options.animDuration;
	        this.zoom = 1;
	        this.cursor = 'auto';
	        this.lastCursor = [
	            0,
	            0
	        ];
	        this.lastShift = null;
	        this.lastTouchDistance = null;
	        this.lastRequestAnimationId = null;
	        this.lastTouchTime = new Date().getTime();
	        this.lastDoubleTapTime = new Date().getTime();
	        this.transform = false; // 是否为横屏模式
	        this.isMultiTouch = 1;
	        this.handleMouseMove = this.handleMouseMove.bind(this);
	        this.handleMouseStart = this.handleMouseStart.bind(this);
	        this.handleMouseStop = this.handleMouseStop.bind(this);
	        this.handleMouseWheel = this.handleMouseWheel.bind(this);
	        this.handleTouchStart = this.handleTouchStart.bind(this);
	        this.handleTouchMove = this.handleTouchMove.bind(this);
	        this.handleTouchStop = this.handleTouchStop.bind(this);
	        this.getZoom = this.getZoom.bind(this);
	        this.setZoom = this.setZoom.bind(this);
	    }
	    var _proto = Zoom.prototype;
	    // 设置事件侦听器
	    _proto.setUpEventListeners = function setUpEventListeners() {
	        var refCurrentValue = this.container;
	        var hasMouseDevice = window.matchMedia('(pointer: fine)').matches;
	        if (hasMouseDevice) {
	            if (this.options.allowWheel) {
	                refCurrentValue == null ? void 0 : refCurrentValue.addEventListener('wheel', this.handleMouseWheel, {
	                    passive: false
	                });
	            }
	            // Apply mouse events only to devices which include an accurate pointing device
	            refCurrentValue == null ? void 0 : refCurrentValue.addEventListener('mousedown', this.handleMouseStart, {
	                passive: false
	            });
	            refCurrentValue == null ? void 0 : refCurrentValue.addEventListener('mousemove', this.handleMouseMove, {
	                passive: false
	            });
	            refCurrentValue == null ? void 0 : refCurrentValue.addEventListener('mouseup', this.handleMouseStop, {
	                passive: false
	            });
	            refCurrentValue == null ? void 0 : refCurrentValue.addEventListener('mouseleave', this.handleMouseStop, {
	                passive: false
	            });
	        } else {
	            // Apply touch events to all other devices
	            refCurrentValue == null ? void 0 : refCurrentValue.addEventListener('touchstart', this.handleTouchStart, {
	                passive: false
	            });
	            refCurrentValue == null ? void 0 : refCurrentValue.addEventListener('touchmove', this.handleTouchMove, {
	                passive: false
	            });
	            refCurrentValue == null ? void 0 : refCurrentValue.addEventListener('touchend', this.handleTouchStop, {
	                passive: false
	            });
	            refCurrentValue == null ? void 0 : refCurrentValue.addEventListener('touchcancel', this.handleTouchStop, {
	                passive: false
	            });
	        }
	    };
	    // 移除事件侦听器
	    _proto.removeEventListeners = function removeEventListeners() {
	        var refCurrentValue = this.container;
	        var hasMouseDevice = window.matchMedia('(pointer: fine)').matches;
	        if (hasMouseDevice) {
	            if (this.options.allowWheel) {
	                refCurrentValue == null ? void 0 : refCurrentValue.removeEventListener('wheel', this.handleMouseWheel);
	            }
	            refCurrentValue == null ? void 0 : refCurrentValue.removeEventListener('mousedown', this.handleMouseStart);
	            refCurrentValue == null ? void 0 : refCurrentValue.removeEventListener('mousemove', this.handleMouseMove);
	            refCurrentValue == null ? void 0 : refCurrentValue.removeEventListener('mouseup', this.handleMouseStop);
	            refCurrentValue == null ? void 0 : refCurrentValue.removeEventListener('mouseleave', this.handleMouseStop);
	        } else {
	            refCurrentValue == null ? void 0 : refCurrentValue.removeEventListener('touchstart', this.handleTouchStart);
	            refCurrentValue == null ? void 0 : refCurrentValue.removeEventListener('touchmove', this.handleTouchMove);
	            refCurrentValue == null ? void 0 : refCurrentValue.removeEventListener('touchend', this.handleTouchStop);
	            refCurrentValue == null ? void 0 : refCurrentValue.removeEventListener('touchcancel', this.handleTouchStop);
	        }
	    };
	    _proto.getPrecision = function getPrecision(value) {
	        if (value === void 0) value = 1;
	        var valueStr = value.toString();
	        if (valueStr.includes('.')) {
	            return valueStr.split('.')[1].length;
	        } else {
	            return 1;
	        }
	    };
	    /**
	   * 获取坐标 (伪横屏X、Y轴坐标转换, 相对值)
	   * @param event
	   * @returns
	   */ _proto.getCoordinates = function getCoordinates(event) {
	        var clientHeight = this.container.clientHeight;
	        var clientTop = this.container.clientTop;
	        var clientLeft = this.container.clientLeft;
	        var _ref = this.transform ? [
	            event.clientY,
	            clientHeight - event.clientX
	        ] : [
	            event.clientX - clientTop,
	            event.clientY - clientLeft
	        ], x1 = _ref[0], y1 = _ref[1];
	        return [
	            x1,
	            y1
	        ];
	    };
	    _proto._touchOrMouseDrag = function _touchOrMouseDrag(event) {
	        if (this.lastCursor) {
	            var _this_getCoordinates = this.getCoordinates(event), posX = _this_getCoordinates[0], posY = _this_getCoordinates[1];
	            var shiftX = posX - this.lastCursor[0];
	            var shiftY = posY - this.lastCursor[1];
	            this.move(shiftX, shiftY, 0);
	            this.lastCursor = [
	                posX,
	                posY
	            ];
	            this.lastShift = [
	                shiftX,
	                shiftY
	            ];
	        }
	    };
	    _create_class(Zoom, [
	        {
	            key: "pos",
	            get: function get() {
	                return [
	                    this.container.clientWidth * this.percentPos[0],
	                    this.container.clientHeight * this.percentPos[1]
	                ];
	            }
	        }
	    ]);
	    return Zoom;
	}();
	Zoom.VERSION = '0.0.2';

	dist$1 = Zoom;
	return dist$1;
}

var distExports$1 = requireDist$1();
var Zoom = /*@__PURE__*/getDefaultExportFromCjs(distExports$1);

function _extends$h() {
    _extends$h = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends$h.apply(this, arguments);
}
function __zoom(theme, container, options) {
    theme.zoomUtil = new Zoom(container, _extends$h({}, options || {}, {
        min: 1,
        onChange: function(zoom, reset) {
            if (zoom !== theme._zoom) {
                var _options_onChange;
                theme.zoom = zoom;
                options == null ? void 0 : (_options_onChange = options.onChange) == null ? void 0 : _options_onChange.call(options, zoom, reset);
            }
        },
        onTranslateChange: function(pos) {
            var _options_onTranslateChange;
            theme.emit(EVENTS.zoomTranslateChange, pos);
            options == null ? void 0 : (_options_onTranslateChange = options.onTranslateChange) == null ? void 0 : _options_onTranslateChange.call(options, pos);
        },
        onTap: options == null ? void 0 : options.onTap
    }));
}

function asyncGeneratorStep$4(gen, resolve, reject, _next, _throw, key, arg) {
    try {
        var info = gen[key](arg);
        var value = info.value;
    } catch (error) {
        reject(error);
        return;
    }
    if (info.done) {
        resolve(value);
    } else {
        Promise.resolve(value).then(_next, _throw);
    }
}
function _async_to_generator$4(fn) {
    return function() {
        var self = this, args = arguments;
        return new Promise(function(resolve, reject) {
            var gen = fn.apply(self, args);
            function _next(value) {
                asyncGeneratorStep$4(gen, resolve, reject, _next, _throw, "next", value);
            }
            function _throw(err) {
                asyncGeneratorStep$4(gen, resolve, reject, _next, _throw, "throw", err);
            }
            _next(undefined);
        });
    };
}
function _ts_generator$4(thisArg, body) {
    var f, y, t, _ = {
        label: 0,
        sent: function() {
            if (t[0] & 1) throw t[1];
            return t[1];
        },
        trys: [],
        ops: []
    }, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
    }), g;
    function verb(n) {
        return function(v) {
            return step([
                n,
                v
            ]);
        };
    }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while(g && (g = 0, op[0] && (_ = 0)), _)try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [
                op[0] & 2,
                t.value
            ];
            switch(op[0]){
                case 0:
                case 1:
                    t = op;
                    break;
                case 4:
                    _.label++;
                    return {
                        value: op[1],
                        done: false
                    };
                case 5:
                    _.label++;
                    y = op[1];
                    op = [
                        0
                    ];
                    continue;
                case 7:
                    op = _.ops.pop();
                    _.trys.pop();
                    continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                        _ = 0;
                        continue;
                    }
                    if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                        _.label = op[1];
                        break;
                    }
                    if (op[0] === 6 && _.label < t[1]) {
                        _.label = t[1];
                        t = op;
                        break;
                    }
                    if (t && _.label < t[2]) {
                        _.label = t[2];
                        _.ops.push(op);
                        break;
                    }
                    if (t[2]) _.ops.pop();
                    _.trys.pop();
                    continue;
            }
            op = body.call(thisArg, _);
        } catch (e) {
            op = [
                6,
                e
            ];
            y = 0;
        } finally{
            f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return {
            value: op[0] ? op[1] : void 0,
            done: true
        };
    }
}
function getThemeDataByTemplate(theme, id) {
    return _async_to_generator$4(function() {
        var _theme_options_token_httpToken, _theme_options_token, url;
        return _ts_generator$4(this, function(_state) {
            switch(_state.label){
                case 0:
                    url = theme.options.env.domain + "/api/service/media/template/getDetail?accessToken=" + (theme.options.accessToken || ((_theme_options_token = theme.options.token) == null ? void 0 : (_theme_options_token_httpToken = _theme_options_token.httpToken) == null ? void 0 : _theme_options_token_httpToken.url)) + "&id=" + id;
                    return [
                        4,
                        fetch(url, {
                            method: 'GET'
                        }).then(function(response) {
                            return _async_to_generator$4(function() {
                                return _ts_generator$4(this, function(_state) {
                                    switch(_state.label){
                                        case 0:
                                            return [
                                                4,
                                                response.json()
                                            ];
                                        case 1:
                                            return [
                                                2,
                                                _state.sent()
                                            ];
                                    }
                                });
                            })();
                        }).then(function(res) {
                            if (res.meta) {
                                var _res_data_footer, _res_data;
                                if (((_res_data = res.data) == null ? void 0 : (_res_data_footer = _res_data.footer) == null ? void 0 : _res_data_footer.btnList) && Utils.isMobile) {
                                    var // 兼容已经更新的新规范， 9.x 中不在支持
                                    _res_data_footer1, _res_data1;
                                    (_res_data1 = res.data) == null ? void 0 : (_res_data_footer1 = _res_data1.footer) == null ? void 0 : _res_data_footer1.btnList.forEach(function(btn, index) {
                                        if (btn.iconId === 'webExpend') {
                                            var _res_data_footer, _res_data;
                                            ((_res_data = res.data) == null ? void 0 : (_res_data_footer = _res_data.footer) == null ? void 0 : _res_data_footer.btnList)[index] = {};
                                        } else if (btn.iconId === 'expend') {
                                            btn.iconId = 'webExpend';
                                        }
                                    });
                                }
                                return res.data || null;
                            }
                            return null;
                        })
                    ];
                case 1:
                    return [
                        2,
                        _state.sent()
                    ];
            }
        });
    })();
}

function asyncGeneratorStep$3(gen, resolve, reject, _next, _throw, key, arg) {
    try {
        var info = gen[key](arg);
        var value = info.value;
    } catch (error) {
        reject(error);
        return;
    }
    if (info.done) {
        resolve(value);
    } else {
        Promise.resolve(value).then(_next, _throw);
    }
}
function _async_to_generator$3(fn) {
    return function() {
        var self = this, args = arguments;
        return new Promise(function(resolve, reject) {
            var gen = fn.apply(self, args);
            function _next(value) {
                asyncGeneratorStep$3(gen, resolve, reject, _next, _throw, "next", value);
            }
            function _throw(err) {
                asyncGeneratorStep$3(gen, resolve, reject, _next, _throw, "throw", err);
            }
            _next(undefined);
        });
    };
}
function _extends$g() {
    _extends$g = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends$g.apply(this, arguments);
}
function _ts_generator$3(thisArg, body) {
    var f, y, t, _ = {
        label: 0,
        sent: function() {
            if (t[0] & 1) throw t[1];
            return t[1];
        },
        trys: [],
        ops: []
    }, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
    }), g;
    function verb(n) {
        return function(v) {
            return step([
                n,
                v
            ]);
        };
    }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while(g && (g = 0, op[0] && (_ = 0)), _)try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [
                op[0] & 2,
                t.value
            ];
            switch(op[0]){
                case 0:
                case 1:
                    t = op;
                    break;
                case 4:
                    _.label++;
                    return {
                        value: op[1],
                        done: false
                    };
                case 5:
                    _.label++;
                    y = op[1];
                    op = [
                        0
                    ];
                    continue;
                case 7:
                    op = _.ops.pop();
                    _.trys.pop();
                    continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                        _ = 0;
                        continue;
                    }
                    if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                        _.label = op[1];
                        break;
                    }
                    if (op[0] === 6 && _.label < t[1]) {
                        _.label = t[1];
                        t = op;
                        break;
                    }
                    if (t && _.label < t[2]) {
                        _.label = t[2];
                        _.ops.push(op);
                        break;
                    }
                    if (t[2]) _.ops.pop();
                    _.trys.pop();
                    continue;
            }
            op = body.call(thisArg, _);
        } catch (e) {
            op = [
                6,
                e
            ];
            y = 0;
        } finally{
            f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return {
            value: op[0] ? op[1] : void 0,
            done: true
        };
    }
}
/** 兼容 themeData中不规范的 key */ var replaceKey = {
    sound: 'volume',
    webExpend: 'fullscreen',
    expend: 'globalFullscreen',
    pantile: 'ptz',
    recordvideo: 'record',
    hd: 'definition'
};
/**
 * 过滤控件
 * @param {IThemeData} themeData 主题数据
 * @returns
 */ function _filterControls(themeData) {
    var _themeData_header, _themeData_footer;
    var data = {};
    var _themeData_autoFocus;
    data.autoFocus = (_themeData_autoFocus = themeData == null ? void 0 : themeData.autoFocus) != null ? _themeData_autoFocus : 3; // 3s
    data.poster = (themeData == null ? void 0 : themeData.poster) || ''; //
    var deviceControls = [];
    var recControls = [];
    // WARN： 除了 'deviceID', 'deviceName'， 'rec', 'cloudRec', 'cloudRecord' 做特殊处理, 只能放置在顶部， 其它不做处理，如果配置渲染的有问题需要开发者自行修改
    // FIXME: 暂时不去重， 让开发者自己去修改
    // prettier-ignore
    var headerBtnList = ((themeData == null ? void 0 : (_themeData_header = themeData.header) == null ? void 0 : _themeData_header.btnList) || []).filter(function(item) {
        // TODO: 因为 'deviceID', 'deviceName'， 'rec', 'cloudRec', 'cloudRecord' 是两个组， 并且要在头部（移动端特殊处理）
        // prettier-ignore
        if (item.isrender === 1 && [
            "deviceID",
            "deviceName"
        ].includes(item.iconId)) {
            deviceControls.push(item);
            return false;
        }
        if (item.isrender === 1 && REC_GROUP.includes(item.iconId)) {
            // TODO: 因为回放是一组， 位置以第一个位置为准
            recControls.push(recControls[0] ? _extends$g({}, item, {
                part: recControls[0].part
            }) : item);
            return false;
        }
        return item.isrender === 1;
    }).map(function(item) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        if (replaceKey[item.iconId]) {
            item.iconId = replaceKey[item.iconId];
        }
        return item;
    });
    // prettier-ignore
    var footerBtnList = ((themeData == null ? void 0 : (_themeData_footer = themeData.footer) == null ? void 0 : _themeData_footer.btnList) || []).filter(function(item) {
        // TODO: 因为 'deviceID', 'deviceName'， 'rec', 'cloudRec', 'cloudRecord' 是两个组， 并且要在头部（移动端特殊处理）
        // prettier-ignore
        if (item.isrender === 1 && DEVICE_INFO_GROUP.includes(item.iconId)) {
            deviceControls.push(item);
            return false;
        }
        if (item.isrender === 1 && REC_GROUP.includes(item.iconId)) {
            // TODO: 因为回放是一组， 位置以第一个位置为准
            recControls.push(recControls[0] ? _extends$g({}, item, {
                part: recControls[0].part
            }) : item);
            return false;
        }
        return item.isrender === 1;
    }).map(function(item) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        if (replaceKey[item.iconId]) {
            item.iconId = replaceKey[item.iconId];
        }
        return item;
    });
    // prettier-ignore
    if (headerBtnList.length > 0 || deviceControls.length > 0 || recControls.length > 0) {
        var _themeData_header1, _themeData_header2, _themeData_header3;
        data.header = {};
        // 兼容老版本和平台配置的主题
        data.header.color = themeData == null ? void 0 : (_themeData_header1 = themeData.header) == null ? void 0 : _themeData_header1.color;
        data.header.backgroundColor = themeData == null ? void 0 : (_themeData_header2 = themeData.header) == null ? void 0 : _themeData_header2.backgroundColor; // 单独处理
        data.header.activeColor = themeData == null ? void 0 : (_themeData_header3 = themeData.header) == null ? void 0 : _themeData_header3.activeColor;
        // 这里顺序是 设备信息 > 回放 > 其他
        data.header.btnList = [].concat(deviceControls || [], recControls || [], headerBtnList || []);
    } else {
        data.header = undefined;
    }
    if (footerBtnList.length > 0) {
        var _themeData_footer1, _themeData_footer2, _themeData_footer3;
        data.footer = {};
        // 兼容老版本和平台配置的主题
        data.footer.color = themeData == null ? void 0 : (_themeData_footer1 = themeData.footer) == null ? void 0 : _themeData_footer1.color;
        data.footer.backgroundColor = themeData == null ? void 0 : (_themeData_footer2 = themeData.footer) == null ? void 0 : _themeData_footer2.backgroundColor;
        data.footer.activeColor = themeData == null ? void 0 : (_themeData_footer3 = themeData.footer) == null ? void 0 : _themeData_footer3.activeColor;
        data.footer.btnList = footerBtnList;
    } else {
        //
        data.footer = undefined;
    }
    return data;
}
/**
 * 过滤左右控件
 * @param btnList 控件列表
 * @returns
 */ // prettier-ignore
function _filterLeftRightControls(btnList) {
    var left = btnList.filter(function(item) {
        return item.part === "left";
    });
    var right = btnList.filter(function(item) {
        return item.part === "right";
    });
    return [
        left,
        right
    ];
}
/**
 * 获取主题数据 (主题优先级： template > themeDate)
 * @param data
 * @returns
 */ function getThemeData(theme, data) {
    return _async_to_generator$3(function() {
        var themeData, _theme_logger, template;
        return _ts_generator$3(this, function(_state) {
            switch(_state.label){
                case 0:
                    themeData = data;
                    if (!(typeof data === 'string' && data.length < 32)) return [
                        3,
                        1
                    ];
                    if (data === 'simple') {
                        return [
                            2,
                            null
                        ];
                    }
                    // 渲染主题模板
                    themeData = TEMPLATES[data];
                    if (!data) {
                        (_theme_logger = theme.logger) == null ? void 0 : _theme_logger.warn("Theme template " + data + " is not exist!");
                        themeData = null;
                    }
                    return [
                        2,
                        themeData
                    ];
                case 1:
                    if (!(typeof data === 'string' && data.length === 32)) return [
                        3,
                        6
                    ];
                    _state.label = 2;
                case 2:
                    _state.trys.push([
                        2,
                        4,
                        ,
                        5
                    ]);
                    return [
                        4,
                        getThemeDataByTemplate(theme, data)
                    ];
                case 3:
                    template = _state.sent();
                    if (template) {
                        return [
                            2,
                            template
                        ];
                    }
                    theme.emit(EVENTS.message, theme.i18n.t('FETCH_THEME_FAILED'), 'themeError');
                    return [
                        3,
                        5
                    ];
                case 4:
                    _state.sent();
                    theme.emit(EVENTS.message, theme.i18n.t('FETCH_THEME_FAILED'), 'themeError');
                    return [
                        3,
                        5
                    ];
                case 5:
                    return [
                        3,
                        7
                    ];
                case 6:
                    if (Object.prototype.toString.call(data) === '[object Object]') {
                        // 渲染主题数据
                        return [
                            2,
                            data
                        ];
                    } else {
                        // 当前主题数据为空，不渲染也不会继续执行
                        return [
                            2,
                            null
                        ];
                    }
                case 7:
                    return [
                        2
                    ];
            }
        });
    })();
}

function hexToRgbaWithOpacity(hex, opacity) {
    if (opacity === void 0) opacity = 0.8;
    // 移除#号
    hex = hex.replace(/^#/, '');
    // 处理3位和4位HEX
    if (hex.length === 3 || hex.length === 4) {
        hex = hex.split('').map(function(char) {
            return char + char;
        }).join('');
    }
    // 解析RGB值
    var r = parseInt(hex.substring(0, 2), 16);
    var g = parseInt(hex.substring(2, 4), 16);
    var b = parseInt(hex.substring(4, 6), 16);
    return "rgba(" + r + ", " + g + ", " + b + ", " + opacity + ")";
}
function rgbToRgbaWithOpacity(rgbString, opacity) {
    if (opacity === void 0) opacity = 0.8;
    // 提取RGB值
    var rgbMatch = rgbString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
        var r = rgbMatch[1];
        var g = rgbMatch[2];
        var b = rgbMatch[3];
        return "rgba(" + r + ", " + g + ", " + b + ", " + opacity + ")";
    }
    return '';
}
function rgbOrHexToRgbaWithOpacity(color, opacity) {
    if (opacity === void 0) opacity = 0.8;
    var hexRegex = /^#([A-Fa-f0-9]{3,4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/;
    var rgbRegex = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/;
    if (hexRegex.test(color)) {
        return hexToRgbaWithOpacity(color, opacity);
    } else if (rgbRegex.test(color)) {
        return rgbToRgbaWithOpacity(color, opacity);
    }
    return '';
}

/**
 * Header
 */ var Component = /*#__PURE__*/ function() {
    function Component(options) {
        if (options === void 0) options = {};
        this._options = options;
        this.$container = document.createElement('div');
        this._defaultClass = PREFIX_CLASS + "-" + this._options.cType;
        if (this._options.cType) {
            this.$container.classList.add(this._defaultClass);
        }
        if (options == null ? void 0 : options.className) {
            this.$container.classList.add(options.className);
        }
        // -------------------------------------
        // 兼容老版本和平台配置的主题
        // -------------------------------------
        if (options == null ? void 0 : options.color) {
            this.$container.style.cssText += "--" + PREFIX_CLASS + "-default-color: " + options.color + ";";
        }
        if (options == null ? void 0 : options.activeColor) {
            this.$container.style.cssText += "--" + PREFIX_CLASS + "-active-color: " + options.activeColor + ";";
        }
        //
        if (options == null ? void 0 : options.backgroundColor) {
            // 颜色转不透明度为 0.8, 仅支持 Hex 颜色、rgb颜色 和 rgba颜色
            var bgColor = rgbOrHexToRgbaWithOpacity(options == null ? void 0 : options.backgroundColor);
            if (bgColor) {
                if (this._options.cType === 'header') {
                    bgColor = "background: linear-gradient(0deg, transparent 0, " + bgColor + ");";
                } else if (this._options.cType === 'footer') {
                    bgColor = "background: linear-gradient(180deg, transparent 0, " + bgColor + ");";
                }
            } else {
                bgColor = "background: " + (options == null ? void 0 : options.backgroundColor) + ";";
            }
            this.$container.style.cssText += "" + bgColor + ";";
        }
        // ----------------------------
        if (options.getPopupContainer) {
            this.$popupContainer = options.getPopupContainer == null ? void 0 : options.getPopupContainer.call(options);
        } else {
            this.$popupContainer = document.body;
        }
        this.$left = document.createElement('div');
        this.$left.classList.add("" + this._defaultClass + "-left");
        this.$right = document.createElement('div');
        this.$right.classList.add("" + this._defaultClass + "-right");
        this.$container.appendChild(this.$left);
        this.$container.appendChild(this.$right);
        this.$popupContainer.appendChild(this.$container);
    }
    var _proto = Component.prototype;
    /**
   * 销毁 header
   */ _proto.destroy = function destroy() {
        var _this_$popupContainer;
        (_this_$popupContainer = this.$popupContainer) == null ? void 0 : _this_$popupContainer.removeChild(this.$container);
    };
    return Component;
}();

function _extends$f() {
    _extends$f = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends$f.apply(this, arguments);
}
function _inherits$g(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            writable: true,
            configurable: true
        }
    });
    if (superClass) _set_prototype_of$g(subClass, superClass);
}
function _set_prototype_of$g(o, p) {
    _set_prototype_of$g = Object.setPrototypeOf || function setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
    };
    return _set_prototype_of$g(o, p);
}
var Footer = /*#__PURE__*/ function(Component) {
    _inherits$g(Footer, Component);
    function Footer(options) {
        if (options === void 0) options = {};
        return Component.call(this, _extends$f({}, options, {
            cType: 'footer'
        })) || this;
    }
    return Footer;
}(Component);

function _extends$e() {
    _extends$e = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends$e.apply(this, arguments);
}
function _inherits$f(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            writable: true,
            configurable: true
        }
    });
    if (superClass) _set_prototype_of$f(subClass, superClass);
}
function _set_prototype_of$f(o, p) {
    _set_prototype_of$f = Object.setPrototypeOf || function setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
    };
    return _set_prototype_of$f(o, p);
}
var Header = /*#__PURE__*/ function(Component) {
    _inherits$f(Header, Component);
    function Header(options) {
        if (options === void 0) options = {};
        return Component.call(this, _extends$e({}, options, {
            cType: 'header'
        })) || this;
    }
    return Header;
}(Component);

/**
 * 监听鼠标移动或移动端点击改变 Header 和 Footer 的显示隐藏;
 * PC 中窗口鼠标在header footer 移动（mousemove）, 不允许消失及不要冒泡
 * Mobile 中窗口点击在header footer 上（pointerdown/touchstart）, 不允许消失及不要冒泡
 * @param {HTMLElement} $container 容器节点
 * @param {number} second 显示的时间（ms）默认 3000ms
 * @returns {ICleanupFunc}
 */ // prettier-ignore
function interactiveHF($container, second, callback) {
    if (second === void 0) second = 3000;
    var _timer = null;
    var _open = false;
    var _alwaysDisplay = false;
    var _$header = $container.querySelector("." + PREFIX_CLASS + "-header");
    var _$footer = $container.querySelector("." + PREFIX_CLASS + "-footer");
    var _clearTimeout = function() {
        if (_timer) {
            clearTimeout(_timer);
            _timer = null;
        }
    };
    var _show = function() {
        _clearTimeout == null ? void 0 : _clearTimeout();
        _$header == null ? void 0 : _$header.classList.remove("" + PREFIX_CLASS + "-hide-transition");
        _$footer == null ? void 0 : _$footer.classList.remove("" + PREFIX_CLASS + "-hide-transition");
        if (!_open) {
            // eslint-disable-next-line n/no-callback-literal
            callback(true);
        }
        _open = true;
    };
    var _hide = function() {
        if (_alwaysDisplay) {
            return;
        }
        _clearTimeout == null ? void 0 : _clearTimeout();
        // 暂停状态 footer 不隐藏
        if ($container.classList.contains("" + PREFIX_CLASS + "-player-pause")) return;
        _$header == null ? void 0 : _$header.classList.add("" + PREFIX_CLASS + "-hide-transition");
        _$footer == null ? void 0 : _$footer.classList.add("" + PREFIX_CLASS + "-hide-transition");
        if (_open) {
            // eslint-disable-next-line n/no-callback-literal
            callback(false);
        }
        _open = false;
    };
    var _setTimeoutShow = function() {
        _show == null ? void 0 : _show();
        _timer = setTimeout(function() {
            _clearTimeout == null ? void 0 : _clearTimeout();
            _hide == null ? void 0 : _hide();
        }, second);
    };
    var _headerFooterMousemove = function(e) {
        var // 鼠标在header footer 移动, 不允许消失及不要冒泡
        _e_stopPropagation;
        e == null ? void 0 : (_e_stopPropagation = e.stopPropagation) == null ? void 0 : _e_stopPropagation.call(e);
        _clearTimeout == null ? void 0 : _clearTimeout();
    };
    var _touchStart = function() {
        if (_open) {
            _hide == null ? void 0 : _hide();
        } else {
            _setTimeoutShow == null ? void 0 : _setTimeoutShow();
        }
    };
    var _headerFooterTouchStart = function(e) {
        var // 移动端特殊处理， 点击 header footer不允许消失及不要冒泡
        _e_stopPropagation;
        e == null ? void 0 : (_e_stopPropagation = e.stopPropagation) == null ? void 0 : _e_stopPropagation.call(e);
        _setTimeoutShow == null ? void 0 : _setTimeoutShow();
    };
    _setTimeoutShow();
    if (Utils.isMobile && _touchStart) {
        var eventName = "click";
        // 因为移动端 移动事件不好用，所以使用 touchstart 来控制显示隐藏
        $container.addEventListener(eventName, _touchStart);
        if (_$footer) {
            _$footer.addEventListener(eventName, _headerFooterTouchStart);
        }
        if (_$header) {
            _$header.addEventListener(eventName, _headerFooterTouchStart);
        }
    } else {
        // 兼容 PC 端和部分不兼容 click 事件
        // 点击窗口展示 Header 和 Footer, mouseleave 移出隐藏Header 和 Footer， 不支持 mouseleave 事件的需要定时器隐藏Header 和 Footer
        var eventName1 = window.PointerEvent ? "pointerdown" : "click";
        $container.addEventListener(eventName1, _setTimeoutShow);
        $container.addEventListener('mousemove', _setTimeoutShow);
        $container.addEventListener('mouseleave', _hide);
        if (_$footer) {
            var _$footer_addEventListener, _$footer_addEventListener1;
            _$footer == null ? void 0 : (_$footer_addEventListener = _$footer.addEventListener) == null ? void 0 : _$footer_addEventListener.call(_$footer, eventName1, _headerFooterMousemove);
            _$footer == null ? void 0 : (_$footer_addEventListener1 = _$footer.addEventListener) == null ? void 0 : _$footer_addEventListener1.call(_$footer, "mousemove", _headerFooterMousemove);
        }
        if (_$header) {
            var _$header_addEventListener, _$header_addEventListener1;
            _$header == null ? void 0 : (_$header_addEventListener = _$header.addEventListener) == null ? void 0 : _$header_addEventListener.call(_$header, eventName1, _headerFooterMousemove);
            _$header == null ? void 0 : (_$header_addEventListener1 = _$header.addEventListener) == null ? void 0 : _$header_addEventListener1.call(_$header, "mousemove", _headerFooterMousemove);
        }
    }
    /**
     * 销毁
     */ var cleanup = function() {
        if ($container) {
            if (Utils.isMobile && _touchStart) {
                var eventName = "click";
                $container.removeEventListener(eventName, _touchStart);
                if (_$footer && _setTimeoutShow) {
                    _$footer.removeEventListener(eventName, _headerFooterTouchStart);
                }
                if (_$header && _setTimeoutShow) {
                    _$header.removeEventListener(eventName, _headerFooterTouchStart);
                }
            }
            if (_setTimeoutShow) {
                var eventName1 = window.PointerEvent ? "pointerdown" : "click";
                $container.removeEventListener(eventName1, _setTimeoutShow);
                $container.removeEventListener('mousemove', _setTimeoutShow); // 不要被 header 和 footer 冒泡过来
                $container.removeEventListener('mouseleave', _hide);
                if (_$footer && _clearTimeout) {
                    var _$footer_removeEventListener, _$footer_removeEventListener1;
                    _$footer == null ? void 0 : (_$footer_removeEventListener = _$footer.removeEventListener) == null ? void 0 : _$footer_removeEventListener.call(_$footer, eventName1, _headerFooterMousemove);
                    _$footer == null ? void 0 : (_$footer_removeEventListener1 = _$footer.removeEventListener) == null ? void 0 : _$footer_removeEventListener1.call(_$footer, "mousemove", _headerFooterMousemove);
                }
                if (_$header && _clearTimeout) {
                    var _$header_removeEventListener, _$header_removeEventListener1;
                    _$header == null ? void 0 : (_$header_removeEventListener = _$header.removeEventListener) == null ? void 0 : _$header_removeEventListener.call(_$header, eventName1, _headerFooterMousemove);
                    _$header == null ? void 0 : (_$header_removeEventListener1 = _$header.removeEventListener) == null ? void 0 : _$header_removeEventListener1.call(_$header, "mousemove", _headerFooterMousemove);
                }
            }
            if (_hide) {
                $container.removeEventListener('mouseleave', _hide);
            }
            _touchStart = null;
            _setTimeoutShow = null;
            _hide = null;
            _show = null;
            _headerFooterTouchStart = null;
            _headerFooterMousemove = null;
            _clearTimeout == null ? void 0 : _clearTimeout();
            _clearTimeout = null;
            _alwaysDisplay = false;
        }
    };
    return {
        cleanup: cleanup,
        clearTimeout: function() {
            _clearTimeout == null ? void 0 : _clearTimeout();
            _alwaysDisplay = true;
        },
        setTimeoutShow: function() {
            _setTimeoutShow == null ? void 0 : _setTimeoutShow();
            _alwaysDisplay = false;
        },
        hide: _hide
    };
}

function _extends$d() {
    _extends$d = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends$d.apply(this, arguments);
}
function _inherits$e(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            writable: true,
            configurable: true
        }
    });
    if (superClass) _set_prototype_of$e(subClass, superClass);
}
function _set_prototype_of$e(o, p) {
    _set_prototype_of$e = Object.setPrototypeOf || function setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
    };
    return _set_prototype_of$e(o, p);
}
/**
 * 全局全屏
 * 主题和播放器不提供全局全屏的api， 如果开发者想要可以参考这个组件自己实现
 * @category Control
 */ var GlobalFullscreen = /*#__PURE__*/ function(Fullscreen) {
    _inherits$e(GlobalFullscreen, Fullscreen);
    function GlobalFullscreen(options) {
        return Fullscreen.call(this, _extends$d({}, options, {
            controlType: 'button',
            classNameSuffix: 'global-fullscreen'
        })) || this;
    }
    var _proto = GlobalFullscreen.prototype;
    _proto._render = function _render() {
        var _this_locale, _this_locale1;
        this.$container.innerHTML = IconComponents.exitGlobalFullscreen({
            title: (_this_locale = this.locale) == null ? void 0 : _this_locale.BTN_EXIT_GLOBAL_FULLSCREEN
        }) + IconComponents.globalFullscreen({
            title: (_this_locale1 = this.locale) == null ? void 0 : _this_locale1.BTN_GLOBAL_FULLSCREEN
        });
    };
    /**
   * 点击 Control 会触发
   */ _proto._onControlClick = function _onControlClick() {
        // 网页全屏的情况下 还可以执行全局全屏
        if (this.isCurrentFullscreen && this._$rootContainer.classList.contains("" + PREFIX_CLASS + "-global-fullscreen")) {
            var _this__fullscreenUtil;
            this._$rootContainer.classList.remove("" + PREFIX_CLASS + "-global-fullscreen");
            (_this__fullscreenUtil = this._fullscreenUtil) == null ? void 0 : _this__fullscreenUtil.exitFullscreen();
        } else {
            var _this__fullscreenUtil1;
            this._$rootContainer.classList.add("" + PREFIX_CLASS + "-global-fullscreen");
            (_this__fullscreenUtil1 = this._fullscreenUtil) == null ? void 0 : _this__fullscreenUtil1.fullscreen();
        }
    };
    return GlobalFullscreen;
}(Fullscreen);

function _extends$c() {
    _extends$c = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends$c.apply(this, arguments);
}
function _inherits$d(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            writable: true,
            configurable: true
        }
    });
    if (superClass) _set_prototype_of$d(subClass, superClass);
}
function _set_prototype_of$d(o, p) {
    _set_prototype_of$d = Object.setPrototypeOf || function setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
    };
    return _set_prototype_of$d(o, p);
}
/**
 * 截图控件，点击后会触发截图事件， 截图数据会通过 onCapture 回调函数返回
 * @category Control
 */ var CapturePicture = /*#__PURE__*/ function(Control) {
    _inherits$d(CapturePicture, Control);
    function CapturePicture(options) {
        var _this;
        _this = Control.call(this, _extends$c({}, options, {
            tagName: 'span',
            classNameSuffix: 'capture-picture'
        })) || this, _this._timer = null;
        _this.options = options;
        _this._render();
        if (typeof _this.options.onCapture === 'function') {
            // 监听截图结果事件
            _this.on(EVENTS.control.capturePictureResult, _this.options.onCapture);
        }
        return _this;
    }
    var _proto = CapturePicture.prototype;
    _proto.destroy = function destroy() {
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
        Control.prototype.destroy.call(this);
    };
    _proto._render = function _render() {
        var _this_locale;
        this.$container.innerHTML = IconComponents.capturePicture({
            title: (_this_locale = this.locale) == null ? void 0 : _this_locale.BTN_CAPTURE
        });
    };
    /**
   * 点击 Control 会触发
   */ _proto._onControlClick = function _onControlClick(e) {
        var _this = this;
        this.active = true;
        var _this_options_type, _this_options_cloudRecUpload;
        this.emit(EVENTS.control.capturePicture, {
            type: (_this_options_type = this.options.type) != null ? _this_options_type : 'download',
            quality: this.options.quality || 0.9,
            cloudRecUpload: (_this_options_cloudRecUpload = this.options.cloudRecUpload) != null ? _this_options_cloudRecUpload : true
        });
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
        this._timer = setTimeout(function() {
            if (_this._timer) {
                clearTimeout(_this._timer);
                _this._timer = null;
            }
            _this.active = false;
        }, 200);
        Control.prototype._onControlClick.call(this, e);
    };
    return CapturePicture;
}(Control);

var dist = {};

/*
* @ezuikit/control-ptz v0.0.1
* Copyright (c) 2025-11-12 Ezviz-OpenBiz
* Released under the MIT License.
*/

var hasRequiredDist;

function requireDist () {
	if (hasRequiredDist) return dist;
	hasRequiredDist = 1;

	var deepmerge$1 = deepmerge;
	var utilsTools = require$$1;

	var en_US = {
	    GET_PTZ_STATUS: 'Get current PTZ status',
	    GET_PTZ_STATUS_FAILED: 'Theme module is not loaded, PTZ status cannot be obtained',
	    MOBILE_HIDE_PTZ: 'Mobile terminal, PTZ is not displayed in non-full screen state',
	    OPTION_PTZ_FAILED: 'Theme module is not loaded, PTZ cannot be operated',
	    MOBILE_PTZ_TIPS: 'Adjust camera angle by manipulating gimbal',
	    PTZ_FAST: 'F',
	    PTZ_MID: 'M',
	    PTZ_SLOW: 'S',
	    PTZ_SPEED: 'Adjust the PTZ rotation speed',
	    DEVICE_ZOOM: 'Control the device to zoom in/out of the screen',
	    DEVICE_FOCUS: "Adjusting the device's focal length"
	};

	var zh_CN = {
	    GET_PTZ_STATUS: '获取当前云台状态',
	    GET_PTZ_STATUS_FAILED: '未加载Theme模块，无法获取云台状态',
	    MOBILE_HIDE_PTZ: '移动端，非全屏状态不展示云台',
	    OPTION_PTZ_FAILED: '未加载Theme模块，无法操作云台',
	    MOBILE_PTZ_TIPS: '请通过操控云台来调整摄像机视角',
	    PTZ_FAST: '快',
	    PTZ_MID: '中',
	    PTZ_SLOW: '慢',
	    PTZ_SPEED: '调整云台转动速度',
	    DEVICE_ZOOM: '控制设备放大/缩小画面',
	    DEVICE_FOCUS: '调整设备焦距'
	};

	var PTZ_DEFAULT_OPTIONS = {
	    language: 'zh',
	    env: {
	        domain: 'https://open.ys7.com'
	    },
	    accessToken: '',
	    speed: 2,
	    locales: {
	        zh: zh_CN,
	        en: en_US
	    }
	};
	var PTZ_SPEED = {
	    1: 1,
	    2: 3,
	    3: 7,
	    slow: 1,
	    mid: 3,
	    fast: 7
	};
	var PTZ_PREFIX = 'ez-ptz';
	var PTZ_MOBILE_PREFIX = 'ez-mobile-ptz';
	var PTZ_SPEED_ACTIVE_PREFIX = PTZ_PREFIX + '-speed-active';
	var PTZ_DIRECTION_PREFIX = PTZ_PREFIX + '-direction';

	var BasePtz = /*#__PURE__*/ function() {
	    function BasePtz(container, options) {
	        if (options === void 0) options = {};
	        var _this_options_locales;
	        if (!container) throw new Error('Ptz container is required');
	        this.options = deepmerge$1(PTZ_DEFAULT_OPTIONS, options, {
	            clone: false
	        });
	        if ((_this_options_locales = this.options.locales) == null ? void 0 : _this_options_locales[this.options.language]) {
	            var _this_options_locales1;
	            this.locale = (_this_options_locales1 = this.options.locales) == null ? void 0 : _this_options_locales1[this.options.language];
	        } else {
	            var _this_options_locales2;
	            this.locale = (_this_options_locales2 = this.options.locales) == null ? void 0 : _this_options_locales2['zh'];
	        }
	        this.$container = container;
	        this.speed = PTZ_SPEED[this.options.speed || 2];
	    }
	    var _proto = BasePtz.prototype;
	    _proto.updateOptions = function updateOptions(options) {
	        this.options = deepmerge$1(this.options, options, {
	            clone: false
	        });
	    };
	    _proto.destroy = function destroy() {};
	    return BasePtz;
	}();

	function _inherits$1(subClass, superClass) {
	    if (typeof superClass !== "function" && superClass !== null) {
	        throw new TypeError("Super expression must either be null or a function");
	    }
	    subClass.prototype = Object.create(superClass && superClass.prototype, {
	        constructor: {
	            value: subClass,
	            writable: true,
	            configurable: true
	        }
	    });
	    if (superClass) _set_prototype_of$1(subClass, superClass);
	}
	function _set_prototype_of$1(o, p) {
	    _set_prototype_of$1 = Object.setPrototypeOf || function setPrototypeOf(o, p) {
	        o.__proto__ = p;
	        return o;
	    };
	    return _set_prototype_of$1(o, p);
	}
	var MobilePtz = /*#__PURE__*/ function(BasePtz) {
	    _inherits$1(MobilePtz, BasePtz);
	    function MobilePtz(container, options) {
	        var _this;
	        _this = BasePtz.call(this, container, options) || this;
	        _this._touchstart = _this._touchstart.bind(_this);
	        _this._touchend = _this._touchend.bind(_this);
	        _this._render();
	        return _this;
	    }
	    var _proto = MobilePtz.prototype;
	    _proto.destroy = function destroy() {
	        this._removeEventListener();
	        if (this.$content) {
	            this.$content.remove();
	            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	            this.$content = null;
	        }
	        BasePtz.prototype.destroy.call(this);
	    };
	    _proto._render = function _render() {
	        this.$content = document.createElement('div');
	        this.$content.classList.add(PTZ_MOBILE_PREFIX + '-content');
	        this.$content.innerHTML = '\n      <div class="' + PTZ_MOBILE_PREFIX + '-wrap">\n        <div class="' + PTZ_MOBILE_PREFIX + '-container">\n          <div class="' + PTZ_MOBILE_PREFIX + "-center " + PTZ_MOBILE_PREFIX + '-center"></div>\n          <div class="' + PTZ_MOBILE_PREFIX + "-icon " + PTZ_MOBILE_PREFIX + "-top " + PTZ_MOBILE_PREFIX + '-default"></div>\n          <div class="' + PTZ_MOBILE_PREFIX + "-icon " + PTZ_MOBILE_PREFIX + "-left " + PTZ_MOBILE_PREFIX + '-default"></div>\n          <div class="' + PTZ_MOBILE_PREFIX + "-icon " + PTZ_MOBILE_PREFIX + "-bottom " + PTZ_MOBILE_PREFIX + '-default"></div>\n          <div class="' + PTZ_MOBILE_PREFIX + "-icon " + PTZ_MOBILE_PREFIX + "-right " + PTZ_MOBILE_PREFIX + '-default"></div>\n        </div>\n      </div>\n    ';
	        this.$container.appendChild(this.$content);
	        this._addEventListener();
	    };
	    _proto._addEventListener = function _addEventListener() {
	        // 云台控制事件绑定
	        var $warp = this.$content.querySelector("." + PTZ_MOBILE_PREFIX + "-wrap");
	        var touchstart = 'PointerEvent' in window ? 'pointerdown' : 'touchstart';
	        var touchend = 'PointerEvent' in window ? 'pointerup' : 'touchend';
	        if ($warp) {
	            $warp.addEventListener(touchstart, this._touchstart);
	            $warp.addEventListener(touchend, this._touchend);
	        }
	    };
	    _proto._touchstart = function _touchstart(e) {
	        e.preventDefault();
	        this._handlePtzTouch(e, 'start');
	    };
	    _proto._touchend = function _touchend(e) {
	        e.preventDefault();
	        this._handlePtzTouch(e, 'stop');
	    };
	    _proto._removeEventListener = function _removeEventListener() {
	        var $warp = this.$content.querySelector("." + PTZ_MOBILE_PREFIX + "-wrap");
	        var touchstart = 'PointerEvent' in window ? 'pointerdown' : 'touchstart';
	        var touchend = 'PointerEvent' in window ? 'pointerup' : 'touchend';
	        if ($warp) {
	            $warp.removeEventListener(touchstart, this._touchstart);
	            $warp.removeEventListener(touchend, this._touchend);
	        }
	    };
	    _proto._handlePtzTouch = function _handlePtzTouch(e, type) {
	        var _this_options_token_deviceToken, _this_options_token, _e_changedTouches_, _e_changedTouches_1, _this_options_env, _this_options_token_deviceToken1, _this_options_token1;
	        if (!(this.options.accessToken || ((_this_options_token = this.options.token) == null ? void 0 : (_this_options_token_deviceToken = _this_options_token.deviceToken) == null ? void 0 : _this_options_token_deviceToken.video))) throw new Error('Ptz accessToken or token.deviceToken.video is required');
	        var $warp = this.$content.querySelector("." + PTZ_MOBILE_PREFIX + "-wrap");
	        var rect = $warp.getBoundingClientRect();
	        var containerCenterX = rect.left + 130;
	        var containerCenterY = rect.top + 130;
	        var eventX = e.x || ((_e_changedTouches_ = e.changedTouches[0]) == null ? void 0 : _e_changedTouches_.clientX);
	        var eventY = e.y || ((_e_changedTouches_1 = e.changedTouches[0]) == null ? void 0 : _e_changedTouches_1.clientY);
	        var left = eventX - containerCenterX;
	        var top = eventY - containerCenterY;
	        var direction = 0; // 操作命令：0-上，1-下，2-左，3右，4-左上，5-左下，6-右上，7-右下，8-放大，9-缩小，10-近焦距，11-远焦距
	        var url = ((_this_options_env = this.options.env) == null ? void 0 : _this_options_env.domain) + '/api/lapp/device/ptz/start';
	        var token = this.options.accessToken || ((_this_options_token1 = this.options.token) == null ? void 0 : (_this_options_token_deviceToken1 = _this_options_token1.deviceToken) == null ? void 0 : _this_options_token_deviceToken1.video);
	        var $icons = $warp.querySelectorAll("." + PTZ_MOBILE_PREFIX + "-icon");
	        // 判读方位
	        if (Math.abs(left) > Math.abs(top)) {
	            if (left > 0) {
	                direction = 3;
	                $icons[3].className = $icons[3].className.replace("" + PTZ_MOBILE_PREFIX + "-default", "" + PTZ_MOBILE_PREFIX + "-active");
	            } else {
	                direction = 2;
	                $icons[1].className = $icons[1].className.replace("" + PTZ_MOBILE_PREFIX + "-default", "" + PTZ_MOBILE_PREFIX + "-active");
	            }
	        } else {
	            if (top > 0) {
	                direction = 1;
	                $icons[2].className = $icons[2].className.replace("" + PTZ_MOBILE_PREFIX + "-default", "" + PTZ_MOBILE_PREFIX + "-active");
	            } else {
	                direction = 0;
	                $icons[0].className = $icons[0].className.replace("" + PTZ_MOBILE_PREFIX + "-default", "" + PTZ_MOBILE_PREFIX + "-active");
	            }
	        }
	        $warp.style.cssText = "background-image:linear-gradient(" + (direction === 0 ? 180 : direction === 1 ? 0 : direction === 2 ? 90 : 270) + "deg, #c0ddf1 0%, rgba(100,143,252,0.00) 50%)";
	        if (type === 'stop') {
	            var _this_options_env1;
	            url = ((_this_options_env1 = this.options.env) == null ? void 0 : _this_options_env1.domain) + '/api/lapp/device/ptz/stop';
	            $warp.style.cssText = '';
	            $icons[3].className = $icons[3].className.replace("" + PTZ_MOBILE_PREFIX + "-active", "" + PTZ_MOBILE_PREFIX + "-default");
	            $icons[1].className = $icons[1].className.replace("" + PTZ_MOBILE_PREFIX + "-active", "" + PTZ_MOBILE_PREFIX + "-default");
	            $icons[2].className = $icons[2].className.replace("" + PTZ_MOBILE_PREFIX + "-active", "" + PTZ_MOBILE_PREFIX + "-default");
	            $icons[0].className = $icons[0].className.replace("" + PTZ_MOBILE_PREFIX + "-active", "" + PTZ_MOBILE_PREFIX + "-default");
	        }
	        // 这个控件暂时没有 ptzSpeed 和areaId 和backDeg 的值
	        // this.jSPlugin?.eventEmitter?.emit(EVENTS.ptz.ptzDirection, {
	        //   type,
	        //   direction,
	        //   isRotate: false,
	        //   ptzSpeed: 1,
	        // });
	        var operationResultCb = this.options.onDirection == null ? void 0 : this.options.onDirection.call(this.options, {
	            direction: direction,
	            speed: this.speed,
	            type: type
	        });
	        var data = new FormData();
	        data.append('deviceSerial', this.options.deviceSerial + '');
	        data.append('channelNo', this.options.channelNo + '');
	        data.append('speed', '1');
	        data.append('direction', direction + '');
	        data.append('accessToken', token);
	        // prettier-ignore
	        // eslint-disable-next-line @typescript-eslint/promise-function-async
	        fetch(url, {
	            method: 'POST',
	            body: data
	        }).then(function(response) {
	            return response.json();
	        }).then(function(rt) {
	            if (rt.code === 200) ; else {
	                // this.jSPlugin?.logger?.error('[errors]', this.jSPlugin.i18n.t('38' + rt.code) + `(${rt.code})`);
	                // const msg = this.jSPlugin.i18n.t('38' + rt.code) || rt.msg;
	                // this.pluginStatus.loadingSetText({
	                //   text: msg,
	                //   color: 'red',
	                //   delayClear: 2000,
	                // });
	                if ([
	                    60005,
	                    60002,
	                    60003,
	                    60004
	                ].includes(+rt.code)) {
	                    $warp.style.cssText = "background-image:linear-gradient(" + (direction === 0 ? 180 : direction === 1 ? 0 : direction === 2 ? 90 : 270) + "deg, #f45656 0%, rgba(100,143,252,0.00) 50%)";
	                }
	            }
	            operationResultCb == null ? void 0 : operationResultCb(rt);
	        }).catch(function(err) {
	        }).finally(function() {
	            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	            operationResultCb = null;
	        });
	    };
	    return MobilePtz;
	}(BasePtz);

	function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
	    try {
	        var info = gen[key](arg);
	        var value = info.value;
	    } catch (error) {
	        reject(error);
	        return;
	    }
	    if (info.done) {
	        resolve(value);
	    } else {
	        Promise.resolve(value).then(_next, _throw);
	    }
	}
	function _async_to_generator(fn) {
	    return function() {
	        var self = this, args = arguments;
	        return new Promise(function(resolve, reject) {
	            var gen = fn.apply(self, args);
	            function _next(value) {
	                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
	            }
	            function _throw(err) {
	                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
	            }
	            _next(undefined);
	        });
	    };
	}
	function _defineProperties(target, props) {
	    for(var i = 0; i < props.length; i++){
	        var descriptor = props[i];
	        descriptor.enumerable = descriptor.enumerable || false;
	        descriptor.configurable = true;
	        if ("value" in descriptor) descriptor.writable = true;
	        Object.defineProperty(target, descriptor.key, descriptor);
	    }
	}
	function _create_class(Constructor, protoProps, staticProps) {
	    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
	    return Constructor;
	}
	function _inherits(subClass, superClass) {
	    if (typeof superClass !== "function" && superClass !== null) {
	        throw new TypeError("Super expression must either be null or a function");
	    }
	    subClass.prototype = Object.create(superClass && superClass.prototype, {
	        constructor: {
	            value: subClass,
	            writable: true,
	            configurable: true
	        }
	    });
	    if (superClass) _set_prototype_of(subClass, superClass);
	}
	function _set_prototype_of(o, p) {
	    _set_prototype_of = Object.setPrototypeOf || function setPrototypeOf(o, p) {
	        o.__proto__ = p;
	        return o;
	    };
	    return _set_prototype_of(o, p);
	}
	function _ts_generator(thisArg, body) {
	    var f, y, t, _ = {
	        label: 0,
	        sent: function() {
	            if (t[0] & 1) throw t[1];
	            return t[1];
	        },
	        trys: [],
	        ops: []
	    }, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
	    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() {
	        return this;
	    }), g;
	    function verb(n) {
	        return function(v) {
	            return step([
	                n,
	                v
	            ]);
	        };
	    }
	    function step(op) {
	        if (f) throw new TypeError("Generator is already executing.");
	        while(g && (g = 0, op[0] && (_ = 0)), _)try {
	            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
	            if (y = 0, t) op = [
	                op[0] & 2,
	                t.value
	            ];
	            switch(op[0]){
	                case 0:
	                case 1:
	                    t = op;
	                    break;
	                case 4:
	                    _.label++;
	                    return {
	                        value: op[1],
	                        done: false
	                    };
	                case 5:
	                    _.label++;
	                    y = op[1];
	                    op = [
	                        0
	                    ];
	                    continue;
	                case 7:
	                    op = _.ops.pop();
	                    _.trys.pop();
	                    continue;
	                default:
	                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
	                        _ = 0;
	                        continue;
	                    }
	                    if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
	                        _.label = op[1];
	                        break;
	                    }
	                    if (op[0] === 6 && _.label < t[1]) {
	                        _.label = t[1];
	                        t = op;
	                        break;
	                    }
	                    if (t && _.label < t[2]) {
	                        _.label = t[2];
	                        _.ops.push(op);
	                        break;
	                    }
	                    if (t[2]) _.ops.pop();
	                    _.trys.pop();
	                    continue;
	            }
	            op = body.call(thisArg, _);
	        } catch (e) {
	            op = [
	                6,
	                e
	            ];
	            y = 0;
	        } finally{
	            f = t = 0;
	        }
	        if (op[0] & 5) throw op[1];
	        return {
	            value: op[0] ? op[1] : void 0,
	            done: true
	        };
	    }
	}
	/**
	 * @class Ptz
	 * @classdesc 云台控制
	 *
	 * @example
	 * // 初始化云台控制
	 * // 显示云台控制
	 * ptz.show()
	 * // 隐藏云台控制
	 * ptz.hide()
	 */ var Ptz = /*#__PURE__*/ function(BasePtz) {
	    _inherits(Ptz, BasePtz);
	    function Ptz(container, options) {
	        if (options === void 0) options = {};
	        var _this;
	        _this = BasePtz.call(this, container, options) || this, _this._isMobile = utilsTools.isMobile(), _this._isRotate = false, _this._clearTimer = null;
	        _this._$wrapper = document.createElement('div');
	        _this._$wrapper.className = PTZ_PREFIX + '-container-wrap';
	        _this._$directionCircleContainer = document.createElement('div');
	        _this._$directionCircleContainer.classList.add(PTZ_PREFIX + '-container');
	        _this._$directionCircleContainer.innerHTML = '\n        <div class="' + PTZ_PREFIX + "-main " + PTZ_DIRECTION_PREFIX + '-center"></div>\n        <div class="' + PTZ_PREFIX + "-icon " + PTZ_DIRECTION_PREFIX + '-top" data-direction="0"></div>\n        <div class="' + PTZ_PREFIX + "-icon " + PTZ_DIRECTION_PREFIX + '-top-left" data-direction="4"></div>\n        <div class="' + PTZ_PREFIX + "-icon " + PTZ_DIRECTION_PREFIX + '-left" data-direction="2"></div>\n        <div class="' + PTZ_PREFIX + "-icon " + PTZ_DIRECTION_PREFIX + '-left-bottom" data-direction="5"></div>\n        <div class="' + PTZ_PREFIX + "-icon " + PTZ_DIRECTION_PREFIX + '-bottom" data-direction="1"></div>\n        <div class="' + PTZ_PREFIX + "-icon " + PTZ_DIRECTION_PREFIX + '-bottom-right" data-direction="7"></div>\n        <div class="' + PTZ_PREFIX + "-icon " + PTZ_DIRECTION_PREFIX + '-right" data-direction="3"></div>\n        <div class="' + PTZ_PREFIX + "-icon " + PTZ_DIRECTION_PREFIX + '-right-top" data-direction="6"></div>\n    ';
	        _this._$wrapper.appendChild(_this._$directionCircleContainer);
	        _this._$speedContainer = document.createElement('div');
	        _this._$speedContainer.classList.add(PTZ_PREFIX + '-speed-container');
	        _this._$speedContainer.innerHTML = '\n        <div class="' + PTZ_PREFIX + '-speed-progress" title="' + _this.locale['PTZ_SPEED'] + '">\n          <div class="' + PTZ_PREFIX + '-speed-progress-line">\n            <div class="' + PTZ_PREFIX + "-speed-progress-line-dot " + (_this.speed === 1 ? PTZ_SPEED_ACTIVE_PREFIX : '') + '" data-id="slow" data-index="1" data-value="1"></div>\n            <div class="' + PTZ_PREFIX + "-speed-progress-line-dot " + (_this.speed === 3 ? PTZ_SPEED_ACTIVE_PREFIX : '') + '" data-id="mid" data-index="2" data-value="3"></div>\n            <div class="' + PTZ_PREFIX + "-speed-progress-line-dot " + (_this.speed === 7 ? PTZ_SPEED_ACTIVE_PREFIX : '') + '" data-id="fast" data-index="3" data-value="7"></div>\n          </div>\n          <div class="' + PTZ_PREFIX + '-speed-progress-points">\n            <div class="' + PTZ_PREFIX + '-speed-progress-points-slow">\n            ' + _this.locale['PTZ_SLOW'] + '\n            </div>\n            <div class="' + PTZ_PREFIX + '-speed-progress-points-mid">\n            ' + _this.locale['PTZ_MID'] + '\n            </div>\n            <div class="' + PTZ_PREFIX + '-speed-progress-points-fast">\n              ' + _this.locale['PTZ_FAST'] + "\n            </div>\n          </div>\n        </div>\n    ";
	        _this._$wrapper.appendChild(_this._$speedContainer);
	        _this._$btnContainer = document.createElement('div');
	        _this._$btnContainer.classList.add(PTZ_PREFIX + '-btn-container');
	        _this._$btnContainer.innerHTML = '\n        <div class="' + PTZ_PREFIX + '-btn-zoom" title="' + _this.locale['DEVICE_ZOOM'] + '" style="user-select: none;">\n          <div class="' + PTZ_PREFIX + '-btn-zoom-add" style="user-select: none;">\n            <svg viewBox="0 0 1088 1024" version="1.1" width="20" height="20">\n              <path d="M563.2 198.4c179.2 0 326.4 147.2 326.4 326.4s-147.2 326.4-326.4 326.4S230.4 704 230.4 524.8s147.2-326.4 332.8-326.4z m0 64c-147.2 0-262.4 115.2-262.4 262.4s115.2 262.4 262.4 262.4 262.4-115.2 262.4-262.4S704 262.4 563.2 262.4z" fill="#ffffff"></path>\n              <path d="M691.2 556.8H428.8c-19.2 0-32-12.8-32-32s12.8-32 32-32h262.4c19.2 0 32 12.8 32 32s-12.8 32-32 32z" fill="#ffffff">\n              </path>\n              <path d="M556.8 691.2c-19.2 0-32-12.8-32-32V396.8c0-19.2 12.8-32 32-32s32 12.8 32 32v262.4c0 19.2-12.8 32-32 32z" fill="#ffffff"></path>\n            </svg>\n          </div>\n          <div class="' + PTZ_PREFIX + '-btn-zoom-sub" style="user-select: none;">\n            <svg viewBox="0 0 1088 1024" version="1.1" width="20" height="20">\n              <path d="M569.6 838.4c-172.8 0-307.2-140.8-307.2-307.2s140.8-307.2 307.2-307.2 307.2 140.8 307.2 307.2-140.8 307.2-307.2 307.2z m0-64c134.4 0 249.6-108.8 249.6-249.6S704 281.6 569.6 281.6 320 396.8 320 531.2s108.8 243.2 249.6 243.2z" fill="#ffffff"></path>\n              <path d="M691.2 563.2H448c-19.2 0-32-12.8-32-32s12.8-38.4 32-38.4h249.6c19.2 0 32 12.8 32 32s-19.2 38.4-38.4 38.4z" fill="#ffffff"></path>\n            </svg>\n          </div>\n        </div>\n        <div class="' + PTZ_PREFIX + '-btn-focal" title="' + _this.locale['DEVICE_FOCUS'] + '" style="user-select: none;">\n          <div class="' + PTZ_PREFIX + '-btn-focal-add" style="user-select: none;">\n            <svg viewBox="0 0 1088 1024" version="1.1" width="20" height="20">\n              <path d="M646.4 825.6H320c-44.8 0-83.2-38.4-83.2-83.2V409.6c0-44.8 38.4-83.2 83.2-83.2h326.4c44.8 0 83.2 38.4 83.2 83.2v326.4c0 51.2-38.4 89.6-83.2 89.6zM320 390.4c-12.8 0-19.2 6.4-19.2 19.2v326.4c0 12.8 6.4 19.2 19.2 19.2h326.4c12.8 0 19.2-6.4 19.2-19.2V409.6c0-12.8-6.4-19.2-19.2-19.2H320z" fill="#ffffff"></path>\n              <path d="M396.8 358.4V281.6c0-25.6 25.6-51.2 51.2-51.2h326.4c25.6 0 51.2 25.6 51.2 51.2v326.4c0 25.6-25.6 51.2-51.2 51.2H704l-6.4-268.8" fill="#ffffff"></path>\n            </svg>\n          </div>\n          <div class="' + PTZ_PREFIX + '-btn-focal-sub" style="user-select: none;">\n            <svg viewBox="0 0 1088 1024" version="1.1" width="20" height="20">\n              <path d="M320 358.4h326.4c25.6 0 51.2 25.6 51.2 51.2v326.4c0 25.6-25.6 51.2-51.2 51.2H320c-25.6 0-51.2-25.6-51.2-51.2V409.6c0-25.6 25.6-51.2 51.2-51.2z" fill="#ffffff"></path>\n              <path d="M774.4 697.6H704c-19.2 0-32-12.8-32-32s12.8-32 32-32h70.4c12.8 0 19.2-6.4 19.2-19.2V281.6c0-12.8-6.4-19.2-19.2-19.2H448c-12.8 0-19.2 6.4-19.2 19.2v70.4c0 19.2-12.8 32-32 32s-32-12.8-32-25.6V281.6c0-44.8 38.4-83.2 83.2-83.2h326.4c44.8 0 83.2 38.4 83.2 83.2v326.4c0 51.2-38.4 89.6-83.2 89.6z" fill="#ffffff"></path>\n            </svg>\n          </div>\n        </div>\n      ';
	        _this._$wrapper.appendChild(_this._$btnContainer);
	        container.appendChild(_this._$wrapper);
	        // 云台控制事件绑定
	        // 云台控制
	        _this._$directionCircleContainer.onmousedown = function(e) {
	            e.preventDefault();
	            e.stopPropagation();
	            _this._handlePtzTouch(e, 'start');
	        };
	        _this._$directionCircleContainer.onmouseup = function(e) {
	            e.preventDefault();
	            e.stopPropagation();
	            _this._handlePtzTouch(e, 'stop');
	        };
	        _this._$directionCircleContainer.ontouchstart = function(e) {
	            e.preventDefault();
	            e.stopPropagation();
	            _this._handlePtzTouch(e, 'start');
	        };
	        _this._$directionCircleContainer.ontouchend = function(e) {
	            e.preventDefault();
	            e.stopPropagation();
	            _this._handlePtzTouch(e, 'stop');
	        };
	        _this._onSwitchSpeed = function(e) {
	            var list = Array.from(_this._$speedContainer.querySelectorAll("." + PTZ_PREFIX + "-speed-progress-line-dot"));
	            if (list.includes(e.target) && !e.target.classList.contains(PTZ_SPEED_ACTIVE_PREFIX)) {
	                list.forEach(function(item) {
	                    if (item === e.target) {
	                        item.classList.add(PTZ_SPEED_ACTIVE_PREFIX);
	                    } else {
	                        item.classList.remove(PTZ_SPEED_ACTIVE_PREFIX);
	                    }
	                });
	                var value = e.target.getAttribute('data-value');
	                var index = e.target.getAttribute('data-index');
	                _this.speed = +value;
	                _this.options.onSpeedChange == null ? void 0 : _this.options.onSpeedChange.call(_this.options, +index);
	            }
	        };
	        // mouse 事件绑定
	        // 云台速度变化事件绑定
	        _this._$speedContainer.onmouseup = _this._onSwitchSpeed;
	        if (_this._isMobile) {
	            _this._$speedContainer.ontouchend = _this._onSwitchSpeed;
	        }
	        if (_this._$btnContainer.querySelector("." + PTZ_PREFIX + "-btn-zoom-add")) {
	            // 物理缩放、变焦按钮事件监听
	            _this._$btnContainer.querySelector("." + PTZ_PREFIX + "-btn-zoom-add").onmousedown = function(e) {
	                e.preventDefault();
	                e.stopPropagation();
	                _this._handleBtnTouch('zoom', 'add', 'start');
	            };
	            _this._$btnContainer.querySelector("." + PTZ_PREFIX + "-btn-zoom-add").onmouseup = function(e) {
	                e.preventDefault();
	                e.stopPropagation();
	                _this._handleBtnTouch('zoom', 'add', 'stop');
	            };
	        }
	        if (_this._$btnContainer.querySelector("." + PTZ_PREFIX + "-btn-zoom-sub")) {
	            _this._$btnContainer.querySelector("." + PTZ_PREFIX + "-btn-zoom-sub").onmousedown = function(e) {
	                e.preventDefault();
	                e.stopPropagation();
	                _this._handleBtnTouch('zoom', 'sub', 'start');
	            };
	            _this._$btnContainer.querySelector("." + PTZ_PREFIX + "-btn-zoom-sub").onmouseup = function(e) {
	                e.preventDefault();
	                e.stopPropagation();
	                _this._handleBtnTouch('zoom', 'sub', 'stop');
	            };
	        }
	        if (_this._$btnContainer.querySelector("." + PTZ_PREFIX + "-btn-focal-add")) {
	            _this._$btnContainer.querySelector("." + PTZ_PREFIX + "-btn-focal-add").onmousedown = function(e) {
	                e.preventDefault();
	                e.stopPropagation();
	                _this._handleBtnTouch('focal', 'add', 'start');
	            };
	            _this._$btnContainer.querySelector("." + PTZ_PREFIX + "-btn-focal-add").onmouseup = function(e) {
	                e.preventDefault();
	                e.stopPropagation();
	                _this._handleBtnTouch('focal', 'add', 'stop');
	            };
	        }
	        if (_this._$btnContainer.querySelector("." + PTZ_PREFIX + "-btn-focal-sub")) {
	            _this._$btnContainer.querySelector("." + PTZ_PREFIX + "-btn-focal-sub").onmousedown = function(e) {
	                e.preventDefault();
	                e.stopPropagation();
	                _this._handleBtnTouch('focal', 'sub', 'start');
	            };
	            _this._$btnContainer.querySelector("." + PTZ_PREFIX + "-btn-focal-sub").onmouseup = function(e) {
	                e.preventDefault();
	                e.stopPropagation();
	                _this._handleBtnTouch('focal', 'sub', 'stop');
	            };
	        }
	        // mobile touch 事件监听
	        if (_this._isMobile) {
	            if (_this._$btnContainer.querySelector("." + PTZ_PREFIX + "-btn-zoom-add")) {
	                _this._$btnContainer.querySelector("." + PTZ_PREFIX + "-btn-zoom-add").ontouchstart = function(e) {
	                    e.preventDefault();
	                    e.stopPropagation();
	                    _this._handleBtnTouch('zoom', 'add', 'start');
	                };
	                _this._$btnContainer.querySelector("." + PTZ_PREFIX + "-btn-zoom-add").ontouchend = function(e) {
	                    e.preventDefault();
	                    e.stopPropagation();
	                    _this._handleBtnTouch('zoom', 'add', 'stop');
	                };
	            }
	            if (_this._$btnContainer.querySelector("." + PTZ_PREFIX + "-btn-zoom-sub")) {
	                _this._$btnContainer.querySelector("." + PTZ_PREFIX + "-btn-zoom-sub").ontouchstart = function(e) {
	                    e.preventDefault();
	                    e.stopPropagation();
	                    _this._handleBtnTouch('zoom', 'sub', 'start');
	                };
	                _this._$btnContainer.querySelector("." + PTZ_PREFIX + "-btn-zoom-sub").ontouchend = function(e) {
	                    e.preventDefault();
	                    e.stopPropagation();
	                    _this._handleBtnTouch('zoom', 'sub', 'stop');
	                };
	            }
	            if (_this._$btnContainer.querySelector("." + PTZ_PREFIX + "-btn-focal-add")) {
	                _this._$btnContainer.querySelector("." + PTZ_PREFIX + "-btn-focal-add").ontouchstart = function(e) {
	                    e.preventDefault();
	                    e.stopPropagation();
	                    _this._handleBtnTouch('focal', 'add', 'start');
	                };
	                _this._$btnContainer.querySelector("." + PTZ_PREFIX + "-btn-focal-add").ontouchend = function(e) {
	                    e.preventDefault();
	                    e.stopPropagation();
	                    _this._handleBtnTouch('focal', 'add', 'stop');
	                };
	            }
	            if (_this._$btnContainer.querySelector("." + PTZ_PREFIX + "-btn-focal-sub")) {
	                _this._$btnContainer.querySelector("." + PTZ_PREFIX + "-btn-focal-sub").ontouchstart = function(e) {
	                    e.preventDefault();
	                    e.stopPropagation();
	                    _this._handleBtnTouch('focal', 'sub', 'start');
	                };
	                _this._$btnContainer.querySelector("." + PTZ_PREFIX + "-btn-focal-sub").ontouchend = function(e) {
	                    e.preventDefault();
	                    e.stopPropagation();
	                    _this._handleBtnTouch('focal', 'sub', 'stop');
	                };
	            }
	        }
	        return _this;
	    }
	    var _proto = Ptz.prototype;
	    _proto.destroy = function destroy() {
	        if (this._clearTimer) {
	            clearTimeout(this._clearTimer);
	            this._clearTimer = null;
	        }
	        if (this._$directionCircleContainer) {
	            this._$directionCircleContainer.remove();
	            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	            this._$directionCircleContainer = null;
	        }
	        if (this._$speedContainer) {
	            this._onSwitchSpeed = null;
	            this._$speedContainer.remove();
	            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	            this._$speedContainer = null;
	        }
	        if (this._$btnContainer) {
	            this._$btnContainer.remove();
	            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	            this._$btnContainer = null;
	        }
	        if (this._$wrapper) {
	            this._$wrapper.remove();
	            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	            this._$wrapper = null;
	        }
	        BasePtz.prototype.destroy.call(this);
	    };
	    _proto._handlePtzTouch = function _handlePtzTouch(e, type) {
	        var _this = this;
	        var _this_options_token_deviceToken, _this_options_token, _this_options_env, _this_options_token_deviceToken1, _this_options_token1;
	        if (!(this.options.accessToken || ((_this_options_token = this.options.token) == null ? void 0 : (_this_options_token_deviceToken = _this_options_token.deviceToken) == null ? void 0 : _this_options_token_deviceToken.video))) throw new Error('Ptz accessToken or token.deviceToken.video is required');
	        // 初始化或获取当前PTZ操作队列
	        if (!this._ptzQueue) {
	            this._ptzQueue = Promise.resolve();
	        }
	        var container = this._$directionCircleContainer.getBoundingClientRect();
	        var containerCenterX = container.left + (this._$directionCircleContainer.clientWidth + 2) / 2;
	        var containerCenterY = container.top + (this._$directionCircleContainer.clientHeight + 2) / 2;
	        var eventX = e.x || e.changedTouches[0].clientX;
	        var eventY = e.y || e.changedTouches[0].clientY;
	        var direction = 0;
	        var url = ((_this_options_env = this.options.env) == null ? void 0 : _this_options_env.domain) + '/api/lapp/device/ptz/start';
	        var token = this.options.accessToken || ((_this_options_token1 = this.options.token) == null ? void 0 : (_this_options_token_deviceToken1 = _this_options_token1.deviceToken) == null ? void 0 : _this_options_token_deviceToken1.video);
	        var backDeg = 0;
	        function getAreaId(x, y) {
	            // 获取当前点击位置相对于圆心的角度
	            var rad = Math.atan2(y, x);
	            if (rad < 0) rad += 2 * Math.PI;
	            var deg = rad * (180 / Math.PI) - 225 - 12.5;
	            if (deg < 0) deg += 360;
	            return Math.floor(deg / 45) + 1;
	        }
	        // 兼容画面旋转90度
	        // const isRotate = false; // /^rotate\(90/.test(document.getElementById(`${this.jSPlugin.id}-wrap`).style.transform);
	        var left = eventX - containerCenterX;
	        var top = eventY - containerCenterY;
	        if (this.isRotate) {
	            switch(getAreaId(left, top)){
	                case 1:
	                    direction = 2;
	                    backDeg = 90;
	                    break;
	                case 2:
	                    direction = 4;
	                    backDeg = 135;
	                    break;
	                case 3:
	                    direction = 0;
	                    backDeg = 180;
	                    break;
	                case 4:
	                    direction = 6;
	                    backDeg = 225;
	                    break;
	                case 5:
	                    direction = 3;
	                    backDeg = 270;
	                    break;
	                case 6:
	                    direction = 7;
	                    backDeg = 315;
	                    break;
	                case 7:
	                    direction = 1;
	                    backDeg = 0;
	                    break;
	                case 8:
	                    direction = 5;
	                    backDeg = 45;
	                    break;
	            }
	        } else {
	            switch(getAreaId(left, top)){
	                case 1:
	                    direction = 0;
	                    backDeg = 180;
	                    break;
	                case 2:
	                    direction = 6;
	                    backDeg = 225;
	                    break;
	                case 3:
	                    direction = 3;
	                    backDeg = 270;
	                    break;
	                case 4:
	                    direction = 7;
	                    backDeg = 315;
	                    break;
	                case 5:
	                    direction = 1;
	                    backDeg = 0;
	                    break;
	                case 6:
	                    direction = 5;
	                    backDeg = 45;
	                    break;
	                case 7:
	                    direction = 2;
	                    backDeg = 90;
	                    break;
	                case 8:
	                    direction = 4;
	                    backDeg = 135;
	                    break;
	            }
	        }
	        if (this._clearTimer) {
	            clearTimeout(this._clearTimer);
	            this._clearTimer = null;
	        }
	        if (type === 'start') {
	            this._$directionCircleContainer.style.cssText = "background-image:linear-gradient(" + backDeg + "deg, #4277FF 0%, rgba(100,143,252,0.00) 30%)";
	        } else {
	            this._$directionCircleContainer.style.cssText = '';
	        }
	        if (type === 'stop') {
	            var _this_options_env1;
	            url = ((_this_options_env1 = this.options.env) == null ? void 0 : _this_options_env1.domain) + '/api/lapp/device/ptz/stop';
	        }
	        var operationResultCb = this.options.onDirection == null ? void 0 : this.options.onDirection.call(this.options, {
	            areaId: getAreaId(left, top),
	            direction: direction,
	            backDeg: backDeg,
	            isRotate: this.isRotate,
	            speed: this.speed,
	            type: type
	        });
	        var data = new FormData();
	        data.append('deviceSerial', this.options.deviceSerial + '');
	        data.append('channelNo', this.options.channelNo + '');
	        data.append('speed', this.speed + '');
	        data.append('direction', direction + '');
	        data.append('accessToken', token);
	        // 将操作加入队列
	        this._ptzQueue = this._ptzQueue.then(function() {
	            return _async_to_generator(function() {
	                var _this;
	                return _ts_generator(this, function(_state) {
	                    switch(_state.label){
	                        case 0:
	                            _this = this;
	                            return [
	                                4,
	                                fetch(url, {
	                                    method: 'POST',
	                                    body: data
	                                }).then(function(response) {
	                                    return _async_to_generator(function() {
	                                        return _ts_generator(this, function(_state) {
	                                            switch(_state.label){
	                                                case 0:
	                                                    return [
	                                                        4,
	                                                        response.json()
	                                                    ];
	                                                case 1:
	                                                    return [
	                                                        2,
	                                                        _state.sent()
	                                                    ];
	                                            }
	                                        });
	                                    })();
	                                }).then(function(rt) {
	                                    var _rt_result;
	                                    operationResultCb == null ? void 0 : operationResultCb(rt);
	                                    var code = rt.code || (rt == null ? void 0 : (_rt_result = rt.result) == null ? void 0 : _rt_result.code);
	                                    if ([
	                                        60000,
	                                        60001,
	                                        60002,
	                                        60003,
	                                        60004,
	                                        60005,
	                                        60006,
	                                        10002
	                                    ].includes(+code)) {
	                                        _this._$directionCircleContainer.style.cssText = "background-image:linear-gradient(" + backDeg + "deg, #f45656 0%, rgba(100,143,252,0.00) 30%)";
	                                    }
	                                    return rt;
	                                }).catch(function(err) {
	                                }).finally(function() {
	                                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	                                    operationResultCb = null;
	                                    if (type === 'stop') {
	                                        _this._clearTimer = setTimeout(function() {
	                                            _this._$directionCircleContainer.style.cssText = '';
	                                        }, 1000);
	                                    }
	                                })
	                            ];
	                        case 1:
	                            // prettier-ignore
	                            return [
	                                2,
	                                _state.sent()
	                            ];
	                    }
	                });
	            }).call(_this);
	        });
	        if (type === 'stop') {
	            this._ptzQueue = this._ptzQueue.finally(function() {});
	        }
	    // this.jSPlugin?.eventEmitter?.emit(EVENTS.ptzDirection, {
	    //   areaId: getAreaId(left, top),
	    //   direction,
	    //   backDeg,
	    //   isRotate,
	    //   ptzSpeed: this.jSPlugin.ptzSpeed,
	    //   type,
	    // });
	    };
	    _proto._handleBtnTouch = function _handleBtnTouch(btn, option, type) {
	        var _this = this;
	        var _this_options_token, _this_options_env, _this_options_token_deviceToken, _this_options_token1;
	        if (!(this.options.accessToken || ((_this_options_token = this.options.token) == null ? void 0 : _this_options_token.deviceToken.video))) throw new Error('Ptz accessToken or token.deviceToken.video is required');
	        // 使用Promise来跟踪当前操作状态
	        if (!this._ptzOperation) {
	            this._ptzOperation = Promise.resolve();
	        }
	        var direction = 8;
	        if (btn === 'zoom') {
	            direction = option === 'add' ? 8 : 9;
	        } else {
	            direction = option === 'add' ? 10 : 11;
	        }
	        var url = ((_this_options_env = this.options.env) == null ? void 0 : _this_options_env.domain) + '/api/lapp/device/ptz/start';
	        var token = this.options.accessToken || ((_this_options_token1 = this.options.token) == null ? void 0 : (_this_options_token_deviceToken = _this_options_token1.deviceToken) == null ? void 0 : _this_options_token_deviceToken.video);
	        if (type === 'stop') {
	            var _this_options_env1;
	            url = ((_this_options_env1 = this.options.env) == null ? void 0 : _this_options_env1.domain) + '/api/lapp/device/ptz/stop';
	        }
	        var operationResultCb = this.options.onDirection == null ? void 0 : this.options.onDirection.call(this.options, {
	            btn: btn,
	            option: option,
	            type: type
	        });
	        var data = new FormData();
	        data.append('deviceSerial', this.options.deviceSerial + '');
	        data.append('channelNo', this.options.channelNo + '');
	        data.append('speed', this.speed + '');
	        data.append('direction', direction + '');
	        data.append('accessToken', token);
	        // 将当前操作加入Promise链
	        this._ptzOperation = this._ptzOperation.then(function() {
	            return _async_to_generator(function() {
	                return _ts_generator(this, function(_state) {
	                    switch(_state.label){
	                        case 0:
	                            return [
	                                4,
	                                fetch(url, {
	                                    method: 'POST',
	                                    body: data
	                                }).then(function(response) {
	                                    return _async_to_generator(function() {
	                                        return _ts_generator(this, function(_state) {
	                                            switch(_state.label){
	                                                case 0:
	                                                    return [
	                                                        4,
	                                                        response.json()
	                                                    ];
	                                                case 1:
	                                                    return [
	                                                        2,
	                                                        _state.sent()
	                                                    ];
	                                            }
	                                        });
	                                    })();
	                                }).then(function(rt) {
	                                    operationResultCb == null ? void 0 : operationResultCb(rt);
	                                    return rt;
	                                }).catch(function(err) {
	                                }).finally(function() {
	                                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	                                    operationResultCb = null;
	                                })
	                            ];
	                        case 1:
	                            // prettier-ignore
	                            return [
	                                2,
	                                _state.sent()
	                            ];
	                    }
	                });
	            })();
	        });
	        // 如果是stop操作，添加一个清理操作
	        if (type === 'stop') {
	            this._ptzOperation = this._ptzOperation.finally(function() {
	                _this._ptzOperation = null; // 重置操作链
	            });
	        }
	    };
	    _create_class(Ptz, [
	        {
	            key: "isRotate",
	            get: function get() {
	                return this._isRotate;
	            },
	            set: /**
	   * 是否旋转了
	   */ function set(isRotate) {
	                this._isRotate = isRotate;
	            }
	        }
	    ]);
	    return Ptz;
	}(BasePtz);

	dist.BasePtz = BasePtz;
	dist.MobilePtz = MobilePtz;
	dist.Ptz = Ptz;
	return dist;
}

var distExports = requireDist();

function _defineProperties$4(target, props) {
    for(var i = 0; i < props.length; i++){
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
    }
}
function _create_class$4(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties$4(Constructor.prototype, protoProps);
    return Constructor;
}
function _extends$b() {
    _extends$b = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends$b.apply(this, arguments);
}
function _inherits$c(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            writable: true,
            configurable: true
        }
    });
    if (superClass) _set_prototype_of$c(subClass, superClass);
}
function _set_prototype_of$c(o, p) {
    _set_prototype_of$c = Object.setPrototypeOf || function setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
    };
    return _set_prototype_of$c(o, p);
}
/**
 * 云台控件
 * @category Control
 */ var Ptz = /*#__PURE__*/ function(Control) {
    _inherits$c(Ptz, Control);
    function Ptz(options) {
        var _this;
        _this = Control.call(this, _extends$b({}, options, {
            tagName: 'span',
            controlType: 'button',
            classNameSuffix: 'ptz'
        })) || this, _this._isRotated = false;
        _this._options = options;
        _this._render();
        _this._onDBlPanelClick = _this._onDBlPanelClick.bind(_this);
        return _this;
    }
    var _proto = Ptz.prototype;
    _proto.destroy = function destroy() {
        var _this_$panel, _this_$panel_remove, _this_$panel1;
        if (this._ptzControl) {
            this._ptzControl.destroy();
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this._ptzControl = null;
        }
        if (this._ptzControl1) {
            this._ptzControl1.destroy();
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this._ptzControl1 = null;
        }
        (_this_$panel = this.$panel) == null ? void 0 : _this_$panel.removeEventListener('dblclick', this._onDBlPanelClick);
        (_this_$panel1 = this.$panel) == null ? void 0 : (_this_$panel_remove = _this_$panel1.remove) == null ? void 0 : _this_$panel_remove.call(_this_$panel1);
        Control.prototype.destroy.call(this);
    };
    _proto._render = function _render() {
        var _this_locale;
        this.$container.innerHTML = IconComponents.ptz({
            title: (_this_locale = this.locale) == null ? void 0 : _this_locale.BTN_PTZ
        });
        this._renderPanel();
    };
    _proto._renderPanel = function _renderPanel() {
        if (this._options.rootContainer) {
            this.$panel = document.createElement('div');
            this.$panel.classList.add("" + PREFIX_CLASS + "-ptz-panel", "" + PREFIX_CLASS + "-hide");
            this._options.rootContainer.appendChild(this.$panel);
            this.$turntable = document.createElement('div');
            this.$turntable.classList.add("" + PREFIX_CLASS + "-ptz-turntable");
            this.$panel.appendChild(this.$turntable);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            this._ptzControl = new distExports.Ptz(this.$turntable, _extends$b({}, this._options, {
                onSpeedChange: this._onSpeedChange.bind(this),
                onDirection: this._onDirection.bind(this)
            }));
            this.$panel.addEventListener('dblclick', this._onDBlPanelClick);
        }
    };
    _proto.renderMobileExtend = function renderMobileExtend($container) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        if (!this._ptzControl1) this._ptzControl1 = new distExports.MobilePtz($container, _extends$b({}, this._options, {
            onSpeedChange: this._onSpeedChange.bind(this),
            onDirection: this._onDirection.bind(this)
        }));
    };
    _proto.updateOptions = function updateOptions(options) {
        if (this._ptzControl) {
            this._ptzControl.updateOptions(options);
        }
        if (this._ptzControl1) {
            this._ptzControl.updateOptions(options);
        }
    };
    _proto._onSpeedChange = function _onSpeedChange(speed) {
        this.emit(EVENTS.control.ptzSpeedChange, speed);
        this._options.onSpeedChange == null ? void 0 : this._options.onSpeedChange.call(this._options, speed);
    };
    _proto._onDirection = function _onDirection(requestData) {
        var _this = this;
        return function(responseResult) {
            var _responseResult_result;
            var code = +(responseResult.code || (responseResult == null ? void 0 : (_responseResult_result = responseResult.result) == null ? void 0 : _responseResult_result.code));
            if (requestData.type === 'start' && code !== 200) {
                _this.emit(EVENTS.control.ptzError, {
                    code: code,
                    // prettier-ignore
                    localeKey: requestData.btn === 'zoom' && code === 60000 ? 'NOT_SUPPORT_DEVICE_ZOOM' : requestData.btn === 'focal' && code === 60006 ? 'NOT_SUPPORT_FOCUS' : '38' + code,
                    msg: responseResult.msg
                });
            }
        };
    };
    /**
   * 点击 Control 会触发
   */ _proto._onControlClick = function _onControlClick(e) {
        Control.prototype._onControlClick.call(this, e);
        this.active = !this.active;
    };
    _proto._onDBlPanelClick = function _onDBlPanelClick(e) {
        e.stopPropagation();
        e.preventDefault();
    };
    _proto.reset = function reset(hide) {
        this.active = false;
    };
    _create_class$4(Ptz, [
        {
            key: "isRotated",
            get: function get() {
                return this._isRotated;
            },
            set: function set(rotated) {
                this._ptzControl.isRotate = rotated;
                this._isRotated = rotated;
            }
        },
        {
            key: "active",
            get: function get() {
                return this._active;
            },
            set: function set(active) {
                if (this._disabled && !this._active) {
                    // 不允许禁用情况下激活
                    return;
                }
                this._active = active;
                this._updateActiveState(active);
                if (this._active) {
                    this.$panel.classList.remove("" + PREFIX_CLASS + "-hide");
                } else {
                    this.$panel.classList.add("" + PREFIX_CLASS + "-hide");
                }
            }
        }
    ]);
    return Ptz;
}(Control);

function formatTime(seconds, format) {
    if (format === void 0) format = 'MM:SS';
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor(seconds % 3600 / 60);
    var secs = seconds % 60;
    var pad = function(num) {
        return num.toString().padStart(2, '0');
    };
    return format.replace('HH', pad(hours)).replace('MM', pad(minutes)).replace('SS', pad(secs));
}

function _defineProperties$3(target, props) {
    for(var i = 0; i < props.length; i++){
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
    }
}
function _create_class$3(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties$3(Constructor.prototype, protoProps);
    return Constructor;
}
function _extends$a() {
    _extends$a = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends$a.apply(this, arguments);
}
function _inherits$b(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            writable: true,
            configurable: true
        }
    });
    if (superClass) _set_prototype_of$b(subClass, superClass);
}
function _set_prototype_of$b(o, p) {
    _set_prototype_of$b = Object.setPrototypeOf || function setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
    };
    return _set_prototype_of$b(o, p);
}
var RECORD_DEFAULT_OPTIONS = {
    maxDuration: 3600
};
/**
 * 录制控件，点击开始录制，再次点击停止录制，
 * 录制开始到结束会依次触发 `startRecord` 和 `stopRecord` 事件
 *
 * 注意：
 *  1. 录制过程中会占用浏览器内存, 请根据实际情况进行配置
 *  2. 录制时间很短可能会因为浏览器的限制或没有I帧而无法生成有效的视频文件
 * @category Control
 */ var Record = /*#__PURE__*/ function(Control) {
    _inherits$b(Record, Control);
    function Record(options) {
        var _this;
        _this = Control.call(this, _extends$a({}, options, {
            tagName: 'span',
            controlType: 'button',
            classNameSuffix: 'record'
        })) || this, /** 计时秒 */ _this._seconds = 0;
        _this._options = Object.assign({}, RECORD_DEFAULT_OPTIONS, options);
        _this._render();
        return _this;
    }
    var _proto = Record.prototype;
    /**
   * 渲染图标
   */ _proto._render = function _render() {
        var _this_locale;
        this.$container.innerHTML = IconComponents.record({
            title: (_this_locale = this.locale) == null ? void 0 : _this_locale.BTN_RECORDVIDEO
        });
    };
    /**
   * 渲染计时器
   */ _proto._renderTimer = function _renderTimer() {
        var _this = this;
        var _this__options_rootContainer, _this__options;
        this._timerNode = document.createElement('span');
        this._timerNode.className = "" + PREFIX_CLASS + "-record-timer";
        (_this__options = this._options) == null ? void 0 : (_this__options_rootContainer = _this__options.rootContainer) == null ? void 0 : _this__options_rootContainer.appendChild(this._timerNode);
        this._timerNode.innerHTML = IconComponents.recordCircle() + '<span class="' + PREFIX_CLASS + '-record-timer-time">' + formatTime(this._seconds) + "<span>";
        var $time = this._timerNode.querySelector("." + PREFIX_CLASS + "-record-timer-time");
        this._timer = setInterval(function() {
            _this._seconds++;
            if (_this._seconds >= _this._options.maxDuration) {
                // 录制时长不能超过一个小时, 因为录制的数据需要占用浏览器内存
                _this._destroyTimer();
                return;
            }
            if ($time) $time.innerHTML = "" + formatTime(_this._seconds);
        }, 1000);
    };
    _proto.reset = function reset() {
        if (this.active) {
            this.active = false;
            Control.prototype.reset.call(this);
        }
    };
    _proto.destroy = function destroy() {
        this._destroyTimer();
        Control.prototype.destroy.call(this);
    };
    /**
   * 销毁定时器和销毁节点
   */ _proto._destroyTimer = function _destroyTimer() {
        this._seconds = 0;
        if (this._timer) {
            clearInterval(this._timer);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this._timer = null;
        }
        if (this._timerNode) {
            this._timerNode.remove();
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this._timerNode = null;
        }
        this._active = false;
    };
    /**
   * 点击 Control 会触发
   */ _proto._onControlClick = function _onControlClick(e) {
        this.active = !this.active;
        Control.prototype._onControlClick.call(this, e);
    };
    _create_class$3(Record, [
        {
            key: "active",
            get: /**
   * 是否激活
   */ function get() {
                return this._active;
            },
            set: function set(active) {
                if (this._disabled && !this._active) {
                    // 不允许禁用情况下激活
                    return;
                }
                if (this._active !== active) {
                    this._active = active;
                    this._updateActiveState(active);
                    if (this.active) {
                        this._renderTimer();
                    } else {
                        this._destroyTimer();
                    }
                    this.emit(EVENTS.control.recordingChange, this._active);
                }
            }
        }
    ]);
    return Record;
}(Control);

function asyncGeneratorStep$2(gen, resolve, reject, _next, _throw, key, arg) {
    try {
        var info = gen[key](arg);
        var value = info.value;
    } catch (error) {
        reject(error);
        return;
    }
    if (info.done) {
        resolve(value);
    } else {
        Promise.resolve(value).then(_next, _throw);
    }
}
function _async_to_generator$2(fn) {
    return function() {
        var self = this, args = arguments;
        return new Promise(function(resolve, reject) {
            var gen = fn.apply(self, args);
            function _next(value) {
                asyncGeneratorStep$2(gen, resolve, reject, _next, _throw, "next", value);
            }
            function _throw(err) {
                asyncGeneratorStep$2(gen, resolve, reject, _next, _throw, "throw", err);
            }
            _next(undefined);
        });
    };
}
function _defineProperties$2(target, props) {
    for(var i = 0; i < props.length; i++){
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
    }
}
function _create_class$2(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties$2(Constructor.prototype, protoProps);
    return Constructor;
}
function _extends$9() {
    _extends$9 = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends$9.apply(this, arguments);
}
function _inherits$a(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            writable: true,
            configurable: true
        }
    });
    if (superClass) _set_prototype_of$a(subClass, superClass);
}
function _set_prototype_of$a(o, p) {
    _set_prototype_of$a = Object.setPrototypeOf || function setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
    };
    return _set_prototype_of$a(o, p);
}
function _ts_generator$2(thisArg, body) {
    var f, y, t, _ = {
        label: 0,
        sent: function() {
            if (t[0] & 1) throw t[1];
            return t[1];
        },
        trys: [],
        ops: []
    }, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
    }), g;
    function verb(n) {
        return function(v) {
            return step([
                n,
                v
            ]);
        };
    }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while(g && (g = 0, op[0] && (_ = 0)), _)try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [
                op[0] & 2,
                t.value
            ];
            switch(op[0]){
                case 0:
                case 1:
                    t = op;
                    break;
                case 4:
                    _.label++;
                    return {
                        value: op[1],
                        done: false
                    };
                case 5:
                    _.label++;
                    y = op[1];
                    op = [
                        0
                    ];
                    continue;
                case 7:
                    op = _.ops.pop();
                    _.trys.pop();
                    continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                        _ = 0;
                        continue;
                    }
                    if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                        _.label = op[1];
                        break;
                    }
                    if (op[0] === 6 && _.label < t[1]) {
                        _.label = t[1];
                        t = op;
                        break;
                    }
                    if (t && _.label < t[2]) {
                        _.label = t[2];
                        _.ops.push(op);
                        break;
                    }
                    if (t[2]) _.ops.pop();
                    _.trys.pop();
                    continue;
            }
            op = body.call(thisArg, _);
        } catch (e) {
            op = [
                6,
                e
            ];
            y = 0;
        } finally{
            f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return {
            value: op[0] ? op[1] : void 0,
            done: true
        };
    }
}
/**
 * 对讲控件
 *
 * navigator.mediaDevices.getUserMedia {@link https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia} 返回一个 Promise 对象，
 * 成功后会resolve回调一个 MediaStream 对象。若用户拒绝了使用权限，或者需要的媒体源不可用，
 * promise会reject回调一个 PermissionDeniedError 或者 NotFoundError 。
 *
 * @category Control
 */ var Talk = /*#__PURE__*/ function(Control) {
    _inherits$a(Talk, Control);
    function Talk(options) {
        var _this;
        _this = Control.call(this, _extends$9({}, options, {
            tagName: 'span',
            controlType: 'button',
            classNameSuffix: 'talk'
        })) || this, _this._value = 0;
        _this._options = options;
        _this._render();
        _this.on(EVENTS.talkingChange, function(talking) {
            if (_this.active !== talking) {
                _this.active = talking;
                _this._render();
            }
        });
        _this.on(EVENTS.talkVolumeChange, function(value) {
            var _this__options_onChange, _this__options;
            _this.value = value;
            (_this__options = _this._options) == null ? void 0 : (_this__options_onChange = _this__options.onChange) == null ? void 0 : _this__options_onChange.call(_this__options, value);
        });
        return _this;
    }
    var _proto = Talk.prototype;
    _proto._render = function _render() {
        var _this_locale, _this_locale1;
        this.$container.innerHTML = this.active ? IconComponents.talkGrowth({
            title: (_this_locale = this.locale) == null ? void 0 : _this_locale.BTN_TALK
        }) : IconComponents.talk({
            title: (_this_locale1 = this.locale) == null ? void 0 : _this_locale1.BTN_TALK
        });
    };
    _proto.reset = function reset(hide) {
        if (this.active) {
            this._value = 0;
            this.active = false;
            this._render();
            this.emit(EVENTS.control.talkingChange, false);
            Control.prototype.reset.call(this, hide);
        }
    };
    /**
   * 销毁对讲
   */ _proto.destroy = function destroy() {
        if (this.active) {
            this.reset();
        }
        Control.prototype.destroy.call(this);
    };
    /**
   * 点击 Control 会触发
   */ _proto._onControlClick = function _onControlClick(e) {
        var _this = this, _superprop_get__onControlClick = function() {
            return Control.prototype._onControlClick;
        };
        return _async_to_generator$2(function() {
            return _ts_generator$2(this, function(_state) {
                _superprop_get__onControlClick().call(_this, e);
                this.active = !this.active;
                this.emit(EVENTS.control.talkingChange, this.active);
                this._render();
                return [
                    2
                ];
            });
        }).call(this);
    };
    _create_class$2(Talk, [
        {
            key: "value",
            get: /**
   * 获取当前值
   */ function get() {
                return this._value;
            },
            set: /**
   * 设置当前值 [0-1]
   */ function set(value) {
                // 没有激活状态，则不处理
                if (!this.active) {
                    return;
                }
                if (value < 0 || value > 1) {
                    return;
                }
                this._value = value;
                var gainType = 'silent';
                if (value > 0 && value < 0.25) {
                    gainType = 'low';
                } else if (value >= 0.25 && value < 0.5) {
                    gainType = 'normal';
                } else if (value >= 0.5 && value < 0.75) {
                    gainType = 'high';
                } else if (value >= 0.75) {
                    gainType = 'deafening';
                }
                var className = Array.from(this.$container.classList).find(function(className) {
                    return className.startsWith("" + PREFIX_CLASS + "-talk-gain-");
                });
                if (className) this.$container.classList.remove(className);
                this.$container.classList.add(PREFIX_CLASS + "-talk-gain-" + gainType);
            }
        }
    ]);
    return Talk;
}(Control);

function _defineProperties$1(target, props) {
    for(var i = 0; i < props.length; i++){
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
    }
}
function _create_class$1(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties$1(Constructor.prototype, protoProps);
    return Constructor;
}
function _extends$8() {
    _extends$8 = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends$8.apply(this, arguments);
}
function _inherits$9(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            writable: true,
            configurable: true
        }
    });
    if (superClass) _set_prototype_of$9(subClass, superClass);
}
function _set_prototype_of$9(o, p) {
    _set_prototype_of$9 = Object.setPrototypeOf || function setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
    };
    return _set_prototype_of$9(o, p);
}
var SELECT_DEFAULT_OPTIONS = {
    fieldNames: {
        label: 'label',
        value: 'value'
    },
    renderLabel: function(label) {
        return "<span>" + (label || '') + "</span>";
    },
    onChange: function() {},
    onOpenChange: function() {}
};
/**
 * 选择器切换 (支持PC/Mobile)
 * @category Control
 * @example
 * ```ts
 * new Select({
 *   title: '清晰度',
 *   list: [
 *     {
 *       label: '高清',
 *       value: 'hd',
 *       streamTypeIn: 1,
 *     },
 *     {
 *       label: '超清',
 *       value: 'super',
 *       streamTypeIn: 2,
 *     }
 *   ],
 *   value: 'hd',
 *   onChange: (value, item) => {
 *     console.log('选择了', value, item);
 *   }
 * })
 *
 * // 如果想扩展 Select 组件，可以继承 Select 组件
 * // 例如清晰度切换组件
 * class Definition extends Select {
 *    options: DefinitionOptions;
 *    constructor(options: DefinitionOptions) {
 *      super({
 *        ...options,
 *        fieldNames: {  label: 'name',  value: 'level',},
 *        title: options?.locale?.definition,
 *        controlType: 'button',
 *        classNameSuffix: 'definition',
 *        onChange: (value: SelectItem['value'], item) => {
 *            options?.onChange?.(value, item);
 *            this.emit(EVENTS.control.definitionChange, value, item);
 *        },
 *        onOpenChange: (open: boolean, value: SelectItem['value'], item) => {
 *          options?.onOpenChange?.(open, value, item);
 *         this.emit(EVENTS.control.definitionPanelOpenChange, open, value, item);
 *        }
 *      });
 *   }
 * }
 * ```
 */ var Select = /*#__PURE__*/ function(Control) {
    _inherits$9(Select, Control);
    function Select(options) {
        var _this;
        var _this__options_fieldNames, _this__picker_$body;
        _this = Control.call(this, _extends$8({
            tagName: 'span',
            type: 'button',
            controlType: 'button'
        }, SELECT_DEFAULT_OPTIONS, options)) || this;
        _this._options = deepmerge(SELECT_DEFAULT_OPTIONS, options, {
            clone: false
        });
        _this.list = options.list || [];
        if (options.value !== undefined || options.value !== null) {
            _this._value = options.value + '';
        }
        var _this__options_fieldNames_value;
        var valueKey = (_this__options_fieldNames_value = (_this__options_fieldNames = _this._options.fieldNames) == null ? void 0 : _this__options_fieldNames.value) != null ? _this__options_fieldNames_value : 'value';
        _this._picker = new Picker(_this.$container, {
            // 由于某些原因， 移动端强制渲染在 body 上
            getPopupContainer: function() {
                return Utils.isMobile ? options.rootContainer : _this.$container;
            },
            trigger: Utils.isMobile ? 'click' : 'hover',
            isMobile: Utils.isMobile,
            wrapClassName: PREFIX_CLASS + "-select-picker " + PREFIX_CLASS + "-select-" + options.classNameSuffix,
            open: _this._options.open,
            offset: [
                0,
                -10
            ],
            placement: 'top',
            // zIndex: 10000,
            onOpenChange: function(open) {
                var item = _this.list.find(function(item) {
                    return item[valueKey] + '' === _this.value;
                });
                _this._options.onOpenChange == null ? void 0 : _this._options.onOpenChange.call(_this._options, open, _this.value, item);
            }
        });
        if (_this.list) {
            _this.updateOptions(_this.list);
        }
        _this._onSelectChange();
        _this._activeOption();
        _this._onDBlPanelClick = _this._onDBlPanelClick.bind(_this);
        (_this__picker_$body = _this._picker.$body) == null ? void 0 : _this__picker_$body.addEventListener('dblclick', _this._onDBlPanelClick);
        return _this;
    }
    var _proto = Select.prototype;
    /**
   * 更新选项列表
   * @param list - 选项列表
   */ _proto.updateOptions = function updateOptions(list) {
        var _this = this;
        if (list === void 0) list = [];
        if ((list == null ? void 0 : list.length) > 0 && this._picker) {
            var _this__options_fieldNames, _this__options_fieldNames1, _this_locale, _this__picker;
            var _this__options_fieldNames_label;
            var labelKey = (_this__options_fieldNames_label = (_this__options_fieldNames = this._options.fieldNames) == null ? void 0 : _this__options_fieldNames.label) != null ? _this__options_fieldNames_label : 'label';
            var _this__options_fieldNames_value;
            var valueKey = (_this__options_fieldNames_value = (_this__options_fieldNames1 = this._options.fieldNames) == null ? void 0 : _this__options_fieldNames1.value) != null ? _this__options_fieldNames_value : 'value';
            (_this__picker = this._picker) == null ? void 0 : _this__picker.innerHTML('<div class="' + PREFIX_CLASS + '-select-panel">\n            <ul class="' + PREFIX_CLASS + '-select-list">\n              ' + list.map(function(item) {
                return '\n                    <li class="' + PREFIX_CLASS + "-select-option " + (+item[valueKey] === _this.value ? "" + PREFIX_CLASS + "-active" : '') + '" data-value="' + item[valueKey] + '">\n                      <span>' + item[labelKey] + "</span>\n                    </li>\n                  ";
            }).join('') + "\n            </ul>\n            " + (Utils.isMobile ? '<div class="' + PREFIX_CLASS + '-select-cancel">\n                  <span>' + (((_this_locale = this.locale) == null ? void 0 : _this_locale.cancel) || '取消') + "</span>\n                </div>" : '') + "\n            " + (Utils.isMobile ? '<span class="' + PREFIX_CLASS + '-select-close">' + IconComponents.close() + "</span>" : '') + "\n          <div>");
            this.list = list;
            this._activeOption();
        } else if ((list == null ? void 0 : list.length) === 0) {
            var _this__picker_innerHTML, _this__picker1;
            (_this__picker1 = this._picker) == null ? void 0 : (_this__picker_innerHTML = _this__picker1.innerHTML) == null ? void 0 : _this__picker_innerHTML.call(_this__picker1, '');
        }
    };
    _proto._render = function _render(item) {
        var _this__options_fieldNames;
        if (this.list.length === 0) {
            return;
        }
        var _this__options_fieldNames_label;
        var labelKey = (_this__options_fieldNames_label = (_this__options_fieldNames = this._options.fieldNames) == null ? void 0 : _this__options_fieldNames.label) != null ? _this__options_fieldNames_label : 'label';
        if (this.$container.querySelector("." + PREFIX_CLASS + "-select-btn")) {
            this.$container.querySelector("." + PREFIX_CLASS + "-select-btn").innerHTML = this._options.renderLabel == null ? void 0 : this._options.renderLabel.call(this._options, item == null ? void 0 : item[labelKey], item, this.list);
        } else {
            var $span = document.createElement('span');
            $span.classList.add("" + PREFIX_CLASS + "-btn", "" + PREFIX_CLASS + "-select-btn");
            $span.innerHTML = this._options.renderLabel == null ? void 0 : this._options.renderLabel.call(this._options, item == null ? void 0 : item[labelKey], item, this.list); // `<span>${item?.[labelKey] || ''}</span>` as string;
            this.$container.appendChild($span);
            if (this._options.title) {
                $span.setAttribute('title', this._options.title);
            }
        }
    };
    _proto._activeOption = function _activeOption() {
        var _this = this;
        if (this._picker) {
            var _this__options_fieldNames, _this__picker_$body, _this__picker_$body1;
            var _this__options_fieldNames_value;
            var valueKey = (_this__options_fieldNames_value = (_this__options_fieldNames = this._options.fieldNames) == null ? void 0 : _this__options_fieldNames.value) != null ? _this__options_fieldNames_value : 'value';
            var $active = (_this__picker_$body = this._picker.$body) == null ? void 0 : _this__picker_$body.querySelector("." + PREFIX_CLASS + "-active");
            $active == null ? void 0 : $active.classList.remove(PREFIX_CLASS + '-active');
            var $target = (_this__picker_$body1 = this._picker.$body) == null ? void 0 : _this__picker_$body1.querySelector("." + PREFIX_CLASS + '-select-option[data-value="' + this.value + '"]');
            $target == null ? void 0 : $target.classList.add(PREFIX_CLASS + '-active');
            var target = this.list.find(function(item) {
                return item[valueKey] + '' === _this.value;
            });
            this._render(target);
        }
    };
    _proto._onSelectChange = function _onSelectChange() {
        var _this = this;
        if (this._picker) {
            var _this__options_fieldNames;
            var _this__options_fieldNames_value;
            var valueKey = (_this__options_fieldNames_value = (_this__options_fieldNames = this._options.fieldNames) == null ? void 0 : _this__options_fieldNames.value) != null ? _this__options_fieldNames_value : 'value';
            this._delegationOption = delegate(this._picker.$body, "." + PREFIX_CLASS + "-select-option", 'click', function(e) {
                var target = e.delegateTarget;
                e.stopPropagation();
                if (!target.classList.contains("" + PREFIX_CLASS + "-disabled")) {
                    var value = target.getAttribute('data-value');
                    if (_this.value !== value) {
                        _this.value = value;
                        var item = _this.list.find(function(item) {
                            return item[valueKey] + '' === _this.value;
                        });
                        _this._options.onChange == null ? void 0 : _this._options.onChange.call(_this._options, _this.value, item);
                        _this._picker.open = false;
                    }
                }
            });
            this._delegationClose = delegate(this._picker.$body, "." + PREFIX_CLASS + "-select-close", 'click', function(e) {
                e.stopPropagation();
                _this._picker.open = false;
            });
            this._delegationCancel = delegate(this._picker.$body, "." + PREFIX_CLASS + "-select-cancel", 'click', function(e) {
                e.stopPropagation();
                _this._picker.open = false;
            });
        }
    };
    /**
   * 销毁
   */ _proto.destroy = function destroy() {
        var _this__delegationOption_destroy, _this__delegationOption, _this__delegationClose_destroy, _this__delegationClose, _this__delegationCancel_destroy, _this__delegationCancel;
        (_this__delegationOption = this._delegationOption) == null ? void 0 : (_this__delegationOption_destroy = _this__delegationOption.destroy) == null ? void 0 : _this__delegationOption_destroy.call(_this__delegationOption);
        this._delegationOption = null;
        (_this__delegationClose = this._delegationClose) == null ? void 0 : (_this__delegationClose_destroy = _this__delegationClose.destroy) == null ? void 0 : _this__delegationClose_destroy.call(_this__delegationClose);
        this._delegationClose = null;
        (_this__delegationCancel = this._delegationCancel) == null ? void 0 : (_this__delegationCancel_destroy = _this__delegationCancel.destroy) == null ? void 0 : _this__delegationCancel_destroy.call(_this__delegationCancel);
        this._delegationCancel = null;
        if (this._picker) {
            var _this__picker_$body, _this__picker;
            (_this__picker_$body = this._picker.$body) == null ? void 0 : _this__picker_$body.removeEventListener('dblclick', this._onDBlPanelClick);
            (_this__picker = this._picker) == null ? void 0 : _this__picker.destroy();
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this._picker = null;
        }
        Control.prototype.destroy.call(this);
    };
    _proto._onDBlPanelClick = function _onDBlPanelClick(e) {
        e.stopPropagation();
        e.preventDefault();
    };
    /**
   * 点击 Control 会触发
   */ _proto._onControlClick = function _onControlClick(e) {
        this._options.onClick == null ? void 0 : this._options.onClick.call(this._options, e);
    };
    _create_class$1(Select, [
        {
            key: "value",
            get: function get() {
                return this._value;
            },
            set: function set(value) {
                if (this.value !== value) {
                    this._value = value;
                    this._activeOption();
                }
            }
        },
        {
            key: "disabled",
            get: /**
   * 是否禁用
   */ function get() {
                return this._disabled;
            },
            set: function set(disabled) {
                this._disabled = disabled;
                this._picker.disabled = disabled;
                this._updateDisabledState(disabled);
            }
        }
    ]);
    return Select;
}(Control);

function _assert_this_initialized$1(self) {
    if (self === void 0) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }
    return self;
}
function _extends$7() {
    _extends$7 = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends$7.apply(this, arguments);
}
function _inherits$8(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            writable: true,
            configurable: true
        }
    });
    if (superClass) _set_prototype_of$8(subClass, superClass);
}
function _set_prototype_of$8(o, p) {
    _set_prototype_of$8 = Object.setPrototypeOf || function setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
    };
    return _set_prototype_of$8(o, p);
}
function _type_of(obj) {
    "@swc/helpers - typeof";
    return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
}
var DEFINITION_LEVELS_LOCALE = [
    'VIDEO_LEVEL_FLUENT',
    'VIDEO_LEVEL_STANDARD',
    'VIDEO_LEVEL_HEIGH',
    'VIDEO_LEVEL_SUPER',
    'VIDEO_LEVEL_EXTREME',
    'VIDEO_LEVEL_3K',
    'VIDEO_LEVEL_4k'
];
var DEFINITION_DEFAULT_OPTIONS = {
    value: 1,
    list: []
};
function __filter(list, locale) {
    if (locale === void 0) locale = {};
    return list.map(function(item) {
        var levelKey = +item.level;
        var name = item.name;
        if (!name) {
            name = locale == null ? void 0 : locale[DEFINITION_LEVELS_LOCALE[levelKey]];
        }
        if (name === 'VIDEO_LEVEL_AUTO') {
            name = locale == null ? void 0 : locale[name];
        } else if (DEFINITION_LEVELS_LOCALE.includes(name)) {
            name = locale == null ? void 0 : locale[DEFINITION_LEVELS_LOCALE[levelKey]];
        }
        return {
            name: name,
            level: item.level + '',
            streamTypeIn: item.streamTypeIn,
            type: item.type
        };
    });
}
/**
 * 清晰度切换控件
 *
 * 清晰度切换控件有三套UI
 * 1. PC 端默认UI，hover 展示清晰度切换面板
 * 2. 移动端 picker选择器清晰度切换面板  + 取消按钮
 * 3. 移动端全屏模式右侧菜单清晰度切换面板
 *
 * @category Control
 */ var Definition = /*#__PURE__*/ function(Select) {
    _inherits$8(Definition, Select);
    function Definition(options) {
        if (options === void 0) options = {};
        var _this;
        var _options_props, _options_props1, _options_locales_options_language;
        _this = Select.call(this, _extends$7({}, DEFINITION_DEFAULT_OPTIONS, {
            value: (_options_props = options.props) == null ? void 0 : _options_props.videoLevel
        }, options, {
            fieldNames: {
                label: 'name',
                value: 'level'
            },
            list: __filter((options == null ? void 0 : options.list) || ((_options_props1 = options.props) == null ? void 0 : _options_props1.videoLevelList) || [], (options == null ? void 0 : options.locales[options.language]) || {}),
            title: options == null ? void 0 : (_options_locales_options_language = options.locales[options.language]) == null ? void 0 : _options_locales_options_language.BTN_HD,
            controlType: 'button',
            classNameSuffix: 'definition',
            renderLabel: function(label, item, list) {
                var _list_;
                if ((item == null ? void 0 : item.level) === 'auto') {
                    var _options_locales_options_language;
                    var realItem = list.find(function(it) {
                        return it.level === _assert_this_initialized$1(_this)._level;
                    });
                    return "<span>" + (options == null ? void 0 : (_options_locales_options_language = options.locales[options.language]) == null ? void 0 : _options_locales_options_language.VIDEO_LEVEL_AUTO) + "(" + ((realItem == null ? void 0 : realItem.name) || '') + ")</span>";
                }
                // 如果 label 不存在，则不显示label，直接显示list的第一个label， 一般自定义清晰度列表可能会出现
                return "<span>" + (label || ((_list_ = list[0]) == null ? void 0 : _list_.name) || '') + "</span>";
            },
            onChange: function(value, item) {
                var _options_onChange;
                options == null ? void 0 : (_options_onChange = options.onChange) == null ? void 0 : _options_onChange.call(options, value, item);
                if (value === 'auto') {
                    _assert_this_initialized$1(_this).emit(EVENTS.control.definitionChange, 'auto', _assert_this_initialized$1(_this)._level);
                } else {
                    _assert_this_initialized$1(_this)._level = value;
                    _assert_this_initialized$1(_this).emit(EVENTS.control.definitionChange, value, item);
                }
            },
            onOpenChange: function(open, value, item) {
                var _options_onOpenChange;
                options == null ? void 0 : (_options_onOpenChange = options.onOpenChange) == null ? void 0 : _options_onOpenChange.call(options, open, value, item);
                _assert_this_initialized$1(_this).emit(EVENTS.control.definitionPanelOpenChange, open, value, item);
            }
        })) || this, _this._level = '';
        _this.options = options || {};
        _this.on(EVENTS.setVideoLevelList, function(list) {
            Select.prototype.updateOptions.call(_assert_this_initialized$1(_this), __filter(list, _this.locale));
        });
        _this.on(EVENTS.currentVideoLevel, function(item, realLevel) {
            var l = (typeof item === "undefined" ? "undefined" : _type_of(item)) === 'object' ? item.level : item;
            _this._level = realLevel + '';
            if (l === 'auto') {
                var _options_locales_options_language;
                var realItem = _this.list.find(function(it) {
                    return it.level === _this._level;
                });
                _this.$container.querySelector("." + PREFIX_CLASS + "-select-btn").innerHTML = "\n          <span>" + (options == null ? void 0 : (_options_locales_options_language = options.locales[options.language]) == null ? void 0 : _options_locales_options_language.VIDEO_LEVEL_AUTO) + "(" + ((realItem == null ? void 0 : realItem.name) || '') + ")</span>\n        ";
            } else {
                if (_this.value !== _this._level + '') _this.value = _this._level + '';
            }
        });
        return _this;
    }
    var _proto = Definition.prototype;
    /**
   * 重置，恢复默认值
   * @param hide 默认不隐藏
   */ _proto.reset = function reset(hide) {
        Select.prototype.reset.call(this, hide);
    };
    return Definition;
}(Select);

function _assert_this_initialized(self) {
    if (self === void 0) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }
    return self;
}
function _extends$6() {
    _extends$6 = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends$6.apply(this, arguments);
}
function _inherits$7(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            writable: true,
            configurable: true
        }
    });
    if (superClass) _set_prototype_of$7(subClass, superClass);
}
function _set_prototype_of$7(o, p) {
    _set_prototype_of$7 = Object.setPrototypeOf || function setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
    };
    return _set_prototype_of$7(o, p);
}
// 支持的倍速列表, 需要是 2 的指数，不能小于 0.5， 最大 16 倍
var SUPPORT_SPEED = [
    0.5,
    1,
    2,
    4,
    8,
    16
]; // 8, 16
var SPEED_DEFAULT_OPTIONS = {
    /**
   * 默认倍速 1, 如果传入的值不在列表中会使用 1 倍速，可能会没有选中
   * 暂时不支持初始化时设置倍速
   */ // value: 1, // 对应list 中的 value
    // 这里不要设置多语言， 比较麻烦
    /**
   * 倍速列表, 需要是 2 的指数，不能小于 0.5， 最大 16 倍
   */ list: SUPPORT_SPEED.reverse().map(function(speed) {
        return {
            label: "" + speed + "x",
            value: speed
        };
    })
};
/**
 * 倍速切换控件, 不支持动态切换倍速列表
 *
 * 注意：
 *   1. 本地回放倍速需要设备本身支持才可以， 如果不支持切换后的倍数不会生效， 云端回放（云存储，云录制）倍速都是支持， 需要是 2 的指数，不能小于 0.5， 最大 16 倍；
 *   2. 标准流不支持；
 * @category Control
 */ var Speed = /*#__PURE__*/ function(Select) {
    _inherits$7(Speed, Select);
    function Speed(options) {
        var _this;
        var _options_locales_options_language, _options_locales;
        _this = Select.call(this, _extends$6({}, SPEED_DEFAULT_OPTIONS, options, {
            value: (options.props.speed || 1) + '',
            classNameSuffix: 'speed',
            controlType: 'button',
            title: options == null ? void 0 : (_options_locales = options.locales) == null ? void 0 : (_options_locales_options_language = _options_locales[options.language]) == null ? void 0 : _options_locales_options_language.BTN_SPEED,
            onChange: function(value, item) {
                var _options_onChange;
                value = +value;
                options == null ? void 0 : (_options_onChange = options.onChange) == null ? void 0 : _options_onChange.call(options, value, item);
                _assert_this_initialized(_this).emit(EVENTS.control.speedChange, value, item);
            },
            onOpenChange: function(open, value, item) {
                var _options_onOpenChange;
                value = +value;
                options == null ? void 0 : (_options_onOpenChange = options.onOpenChange) == null ? void 0 : _options_onOpenChange.call(options, open, value, item);
                _assert_this_initialized(_this).emit(EVENTS.control.speedPanelOpenChange, open, value, item);
            }
        })) || this;
        _this._filterSpeedList(options.list, options.props.recType);
        _this.on(EVENTS.speedChange, function(speed) {
            if (_this.value !== speed + '') _this.value = speed + '';
        });
        _this.on(EVENTS.control.recTypeChange, function(type) {
            _this._filterSpeedList(options.list, type);
        });
        return _this;
    }
    var _proto = Speed.prototype;
    /**
   * 滤掉本地回放不支持的倍速
   * @param optionsList 初始化配置倍速列表
   * @param type 回放类型
   */ _proto._filterSpeedList = function _filterSpeedList(optionsList, type) {
        if (!optionsList) {
            // 非用户自定义
            if (type === 'rec') {
                // 本地回放 不支持 8 16 32 倍速
                var list = this.list.filter(function(item) {
                    return (item == null ? void 0 : item.value) && +item.value < 8;
                });
                this.updateOptions(list);
            } else {
                // 云端回放 支持 8 16 32 倍速
                this.updateOptions(SPEED_DEFAULT_OPTIONS.list);
            }
        }
    };
    _proto.reset = function reset(hide) {
        this.value = 1 + '';
        Select.prototype.reset.call(this, hide);
    };
    return Speed;
}(Select);

function _extends$5() {
    _extends$5 = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends$5.apply(this, arguments);
}
function _inherits$6(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            writable: true,
            configurable: true
        }
    });
    if (superClass) _set_prototype_of$6(subClass, superClass);
}
function _set_prototype_of$6(o, p) {
    _set_prototype_of$6 = Object.setPrototypeOf || function setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
    };
    return _set_prototype_of$6(o, p);
}
/**
 * 日历选择器控件
 * @category Control
 */ var DatePickerControl = /*#__PURE__*/ function(Control) {
    _inherits$6(DatePickerControl, Control);
    function DatePickerControl(options) {
        var _this;
        var _this_options_props_urlInfo_searchParams, _this_options_props_urlInfo, _this_options_props;
        _this = Control.call(this, _extends$5({
            maxDate: new Date()
        }, options, {
            tagName: 'span',
            controlType: 'button',
            classNameSuffix: 'date'
        })) || this;
        _this.options = options;
        _this._value = require$$1.DateTime.format(((_this_options_props = _this.options.props) == null ? void 0 : (_this_options_props_urlInfo = _this_options_props.urlInfo) == null ? void 0 : (_this_options_props_urlInfo_searchParams = _this_options_props_urlInfo.searchParams) == null ? void 0 : _this_options_props_urlInfo_searchParams.begin) || new Date(), 'YYYY-MM-DD');
        _this._render();
        // 日期上的点
        _this.on(EVENTS.control.dateMonthChange, function(dates) {
            var _this_datePicker_updateBadges, _this_datePicker;
            (_this_datePicker = _this.datePicker) == null ? void 0 : (_this_datePicker_updateBadges = _this_datePicker.updateBadges) == null ? void 0 : _this_datePicker_updateBadges.call(_this_datePicker, dates);
        });
        return _this;
    }
    var _proto = DatePickerControl.prototype;
    _proto._render = function _render() {
        var _this = this;
        var _this_options_props;
        var isMobile1 = require$$1.isMobile();
        if (isMobile1) {
            var _this_locale;
            this.$container.innerHTML = '\n        <span class="' + PREFIX_CLASS + '-mobile-date-filter" title="' + (((_this_locale = this.locale) == null ? void 0 : _this_locale.BTN_CALENDAR) || '') + '">\n          <span class="' + PREFIX_CLASS + '-mobile-date-filter-value">' + this._getDateStr() + "</span>\n          " + IconComponents.filter() + "\n        <span>";
        } else {
            var _this_locale1;
            this.$container.innerHTML = IconComponents.date({
                title: (_this_locale1 = this.locale) == null ? void 0 : _this_locale1.BTN_CALENDAR
            });
        }
        this.datePicker = new controlDatePicker.DatePicker(this.$container, {
            isMobile: isMobile1,
            getPopupContainer: function() {
                return _this.$container;
            },
            mode: 'date',
            offset: [
                0,
                -10
            ],
            badges: ((_this_options_props = this.options.props) == null ? void 0 : _this_options_props.recMonth) || [],
            language: this.options.language === 'zh' ? 'zh' : 'en',
            current: require$$1.DateTime.toDate(this._value),
            placement: 'tr',
            triggerClose: true,
            disabledDate: function(date) {
                return date.getTime() > (_this.options.maxDate || new Date()).getTime();
            },
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            onOk: function(date, _mode) {
                if (date && _this._value !== require$$1.DateTime.format(date, 'YYYY-MM-DD') && isMobile1) {
                    _this._value = require$$1.DateTime.format(date, 'YYYY-MM-DD');
                    _this.options.onOk == null ? void 0 : _this.options.onOk.call(_this.options, date);
                    _this.emit(EVENTS.control.dateChange, date);
                    if (date && _this.$container.querySelector("." + PREFIX_CLASS + "-mobile-date-filter-value")) {
                        _this.$container.querySelector("." + PREFIX_CLASS + "-mobile-date-filter-value").innerHTML = _this._getDateStr();
                    }
                }
            },
            onChange: function(date, mode) {
                if (date && _this._value !== require$$1.DateTime.format(date, 'YYYY-MM-DD') && !isMobile1 && mode === 'date') {
                    _this._value = require$$1.DateTime.format(date, 'YYYY-MM-DD');
                    _this.options.onChange == null ? void 0 : _this.options.onChange.call(_this.options, date);
                    _this.emit(EVENTS.control.dateChange, date);
                }
            },
            onOpenChange: function(open) {
                _this.options.onPanelChange == null ? void 0 : _this.options.onPanelChange.call(_this.options, open, _this.datePicker.current);
                _this.emit(EVENTS.control.datePanelOpenChange, open, _this.datePicker.current);
            }
        });
    };
    /**
   * 设置日期, change = true 时触发 onChange 事件
   * @param date 设置的日期
   * @param change 是否触发 onChange 事件
   */ _proto.setDate = function setDate(date, change) {
        if (change === void 0) change = true;
        var _this_datePicker;
        (_this_datePicker = this.datePicker) == null ? void 0 : _this_datePicker.setCurrent(date, change);
        if (date && !change && this._value !== require$$1.DateTime.format(date, 'YYYY-MM-DD')) {
            this._value = require$$1.DateTime.format(date, 'YYYY-MM-DD');
            if (date && this.$container.querySelector("." + PREFIX_CLASS + "-mobile-date-filter-value")) {
                this.$container.querySelector("." + PREFIX_CLASS + "-mobile-date-filter-value").innerHTML = this._getDateStr();
            }
        }
    };
    _proto.reset = function reset() {
        if (this.datePicker) this.datePicker.open = false;
        Control.prototype.reset.call(this);
    };
    /**
   * 销毁控件
   * @override
   */ _proto.destroy = function destroy() {
        if (this.datePicker) {
            this.datePicker.destroy();
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.datePicker = null;
        }
        Control.prototype.destroy.call(this);
    };
    _proto._getDateStr = function _getDateStr() {
        var arr = this._value.split('-');
        return arr[1] + "." + arr[2];
    };
    /**
   * 点击 Control 会触发
   * @overload super._onControlClick(e: Event)
   */ _proto._onControlClick = function _onControlClick(e) {
        Control.prototype._onControlClick.call(this, e);
    };
    return DatePickerControl;
}(Control);

function _extends$4() {
    _extends$4 = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends$4.apply(this, arguments);
}
function _inherits$5(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            writable: true,
            configurable: true
        }
    });
    if (superClass) _set_prototype_of$5(subClass, superClass);
}
function _set_prototype_of$5(o, p) {
    _set_prototype_of$5 = Object.setPrototypeOf || function setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
    };
    return _set_prototype_of$5(o, p);
}
/**
 * 回放时间轴控件
 */ var TimeLineControl = /*#__PURE__*/ function(Control) {
    _inherits$5(TimeLineControl, Control);
    function TimeLineControl(options) {
        var _this;
        var _this__options_props, _this__options;
        _this = Control.call(this, _extends$4({}, options, {
            tagName: 'div',
            controlType: 'block',
            classNameSuffix: 'time-line'
        })) || this, _this._$add = null, _this._$reduce = null, _this._currentTime = 0, _this.records = [];
        _this._currentTime = 0;
        _this._options = options;
        _this.records = ((_this__options = _this._options) == null ? void 0 : (_this__options_props = _this__options.props) == null ? void 0 : _this__options_props.recordList) || [];
        _this._render();
        _this.on(EVENTS.setAllDayRecTimes, function(records) {
            var // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            _this_timeLineUtil_updateTimeSections, _this_timeLineUtil;
            _this.records = records;
            (_this_timeLineUtil = _this.timeLineUtil) == null ? void 0 : (_this_timeLineUtil_updateTimeSections = _this_timeLineUtil.updateTimeSections) == null ? void 0 : _this_timeLineUtil_updateTimeSections.call(_this_timeLineUtil, records);
        });
        _this.on(EVENTS.getOSDTime, function(time) {
            if (time) {
                var // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                _this_timeLineUtil_update, _this_timeLineUtil;
                var date = new Date(time * 1000);
                _this._currentTime = date.getTime();
                (_this_timeLineUtil = _this.timeLineUtil) == null ? void 0 : (_this_timeLineUtil_update = _this_timeLineUtil.update) == null ? void 0 : _this_timeLineUtil_update.call(_this_timeLineUtil, date);
            }
        });
        return _this;
    }
    var _proto = TimeLineControl.prototype;
    _proto._render = function _render() {
        var _this = this;
        var _this_timeLineUtil_updateTimeSections, _this_timeLineUtil;
        var _this__options_showTimeWidthBtn, _this__options_showCoverFold;
        var _timeLineOptions = {
            language: this._options.language || 'zh',
            coverQuery: this._options.coverQuery || '',
            showTimeWidthBtn: (_this__options_showTimeWidthBtn = this._options.showTimeWidthBtn) != null ? _this__options_showTimeWidthBtn : true,
            showCoverFold: (_this__options_showCoverFold = this._options.showCoverFold) != null ? _this__options_showCoverFold : true,
            onChange: function(date) {
                if (_this._currentTime !== (date == null ? void 0 : date.getTime())) {
                    _this._options.onChange == null ? void 0 : _this._options.onChange.call(_this._options, date);
                    _this.emit(EVENTS.control.timeLineChange, date);
                }
            },
            onPickerOpenChange: function(open) {
                _this.emit(EVENTS.control.timeLinePanelOpenChange, open);
            },
            // 2025-10-27 仅移动端支持
            onPickerSelect: function(item) {
                var date = null;
                try {
                    if ((item.startTime + '').length === 10) date = new Date(item.startTime * 1000);
                    else if ((item.startTime + '').length === 13) date = new Date(item.startTime);
                    else date = new Date(item.startTime);
                    _this._options.onChange == null ? void 0 : _this._options.onChange.call(_this._options, date);
                    _this.emit(EVENTS.control.timeLineChange, date);
                } catch (error) {
                }
            }
        };
        if (require$$1.isMobile()) {
            this.timeLineUtil = new controlTimeLine.MobileTimeLine(this.$container, _timeLineOptions);
        } else {
            this.timeLineUtil = new controlTimeLine.TimeLine(this.$container, _timeLineOptions);
            this._renderAddReduce();
        }
        (_this_timeLineUtil = this.timeLineUtil) == null ? void 0 : (_this_timeLineUtil_updateTimeSections = _this_timeLineUtil.updateTimeSections) == null ? void 0 : _this_timeLineUtil_updateTimeSections.call(_this_timeLineUtil, this.records);
        this.timeLineUtil.update(new Date());
    };
    _proto.setWidth = function setWidth(width) {
        if (!require$$1.isMobile()) this.timeLineUtil.resize(width);
    };
    _proto._renderAddReduce = function _renderAddReduce() {
        var _this = this;
        this._$add = document.createElement('span');
        this._$add.classList.add("" + PREFIX_CLASS + "-time-line-scale-add");
        this._$add.innerHTML = IconComponents.add();
        this._$add.addEventListener('click', function() {
            if (_this.timeLineUtil) {
                var currentScale = Math.floor(_this.timeLineUtil.timeWidth);
                _this.timeLineUtil.setTimeWidth(currentScale + 1);
            }
        });
        this._$reduce = document.createElement('span');
        this._$reduce.classList.add("" + PREFIX_CLASS + "-time-line-scale-sub");
        this._$reduce.innerHTML = IconComponents.reduce();
        this._$reduce.addEventListener('click', function() {
            if (_this.timeLineUtil) {
                var currentScale = Math.floor(_this.timeLineUtil.timeWidth);
                _this.timeLineUtil.setTimeWidth(currentScale - 1);
            }
        });
        this.$container.appendChild(this._$add);
        this.$container.appendChild(this._$reduce);
    };
    _proto.destroy = function destroy() {
        if (this._$add) {
            this._$add.remove();
            this._$add = null;
        }
        if (this._$reduce) {
            this._$reduce.remove();
            this._$reduce = null;
        }
        if (this.timeLineUtil) {
            this.timeLineUtil.destroy();
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.timeLineUtil = null;
        }
        Control.prototype.destroy.call(this);
    };
    /**
   * 点击 Control 会触发
   */ _proto._onControlClick = function _onControlClick(e) {
        this._options.onClick == null ? void 0 : this._options.onClick.call(this._options, e);
    };
    return TimeLineControl;
}(Control);

function _extends$3() {
    _extends$3 = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends$3.apply(this, arguments);
}
function _inherits$4(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            writable: true,
            configurable: true
        }
    });
    if (superClass) _set_prototype_of$4(subClass, superClass);
}
function _set_prototype_of$4(o, p) {
    _set_prototype_of$4 = Object.setPrototypeOf || function setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
    };
    return _set_prototype_of$4(o, p);
}
/**
 * 展示设备序列号控件
 * @category Control
 */ var Device = /*#__PURE__*/ function(Control) {
    _inherits$4(Device, Control);
    function Device(options) {
        var _this;
        _this = Control.call(this, _extends$3({}, options, {
            tagName: 'span',
            controlType: 'text',
            classNameSuffix: 'device'
        })) || this;
        _this._render();
        return _this;
    }
    var _proto = Device.prototype;
    _proto._render = function _render() {
        var _this___options_props_urlInfo, _this___options_props;
        this.$container.innerHTML = '<span class="' + PREFIX_CLASS + "-text " + PREFIX_CLASS + '-text-device">' + this._splicingString(this.__options.deviceName, (_this___options_props = this.__options.props) == null ? void 0 : (_this___options_props_urlInfo = _this___options_props.urlInfo) == null ? void 0 : _this___options_props_urlInfo.deviceSerial) + "</span>";
    };
    /**
   * 更新设备序列号
   * @param deviceSerial - 设备序列号
   * @param deviceName - 设备名称
   */ _proto.update = function update(deviceName, deviceSerial) {
        if (this.$container.querySelector("." + PREFIX_CLASS + "-text-device")) {
            var $span = this.$container.querySelector("." + PREFIX_CLASS + "-text-device");
            var text = this._splicingString(deviceName, deviceSerial);
            $span == null ? void 0 : $span.setAttribute('title', text);
            $span.innerHTML = text;
        }
    };
    _proto._splicingString = function _splicingString(deviceName, deviceSerial) {
        return "" + (deviceName || '') + (deviceSerial ? deviceName ? '(' + deviceSerial + ')' : "" + deviceSerial : '');
    };
    return Device;
}(Control);

var Controls = {
    play: Play,
    volume: Volume,
    device: Device,
    capturePicture: CapturePicture,
    ptz: Ptz,
    record: Record,
    talk: Talk,
    zoom: Zoom$1,
    definition: Definition,
    fullscreen: Fullscreen,
    globalFullscreen: GlobalFullscreen,
    rec: Rec,
    speed: Speed,
    date: DatePickerControl,
    timeLine: TimeLineControl
};

/* eslint-disable @typescript-eslint/no-non-null-assertion */ function _inherits$3(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            writable: true,
            configurable: true
        }
    });
    if (superClass) _set_prototype_of$3(subClass, superClass);
}
function _set_prototype_of$3(o, p) {
    _set_prototype_of$3 = Object.setPrototypeOf || function setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
    };
    return _set_prototype_of$3(o, p);
}
var RecFooter = /*#__PURE__*/ function(EventEmitter) {
    _inherits$3(RecFooter, EventEmitter);
    function RecFooter(container, options) {
        if (options === void 0) options = {
            hasDatePicker: true
        };
        var _this;
        _this = EventEmitter.call(this) || this;
        _this.options = options;
        _this.$container = container;
        _this.$popupContainer = document.createElement('div');
        _this.$popupContainer.classList.add("" + PREFIX_CLASS + "-rec-footer");
        if (_this.options.hasDatePicker) {
            _this.$popupContainer.classList.add("" + PREFIX_CLASS + "-rec-footer-has-date-picker");
        }
        _this.$container.appendChild(_this.$popupContainer);
        _this.$timeLineContainer = document.createElement('div');
        _this.$timeLineContainer.classList.add("" + PREFIX_CLASS + "-rec-footer-time-line");
        if (_this.options.hasDatePicker) {
            _this.$popupContainer.appendChild(_this.$timeLineContainer);
            _this.$datePickerContainer = document.createElement('div');
            _this.$datePickerContainer.classList.add("" + PREFIX_CLASS + "-rec-footer-date-picker");
            _this.$popupContainer.appendChild(_this.$datePickerContainer);
        }
        _this.$popupContainer.addEventListener('dblclick', function(e) {
            e.preventDefault();
            e.stopPropagation();
        });
        return _this;
    }
    var _proto = RecFooter.prototype;
    _proto.destroy = function destroy() {
        if (this.$datePickerContainer) {
            this.$datePickerContainer.remove();
            this.$datePickerContainer = null;
        }
        if (this.$timeLineContainer) {
            var _this_$timeLineContainer_remove, _this_$timeLineContainer;
            (_this_$timeLineContainer = this.$timeLineContainer) == null ? void 0 : (_this_$timeLineContainer_remove = _this_$timeLineContainer.remove) == null ? void 0 : _this_$timeLineContainer_remove.call(_this_$timeLineContainer);
            this.$timeLineContainer = null;
        }
        if (this.$popupContainer) {
            var _this_$popupContainer_remove, _this_$popupContainer;
            (_this_$popupContainer = this.$popupContainer) == null ? void 0 : (_this_$popupContainer_remove = _this_$popupContainer.remove) == null ? void 0 : _this_$popupContainer_remove.call(_this_$popupContainer);
            this.$popupContainer = null;
        }
        this.emit(EVENTS.theme.recFooterDestroy);
    };
    return RecFooter;
}(EventEmitter);

function _inherits$2(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            writable: true,
            configurable: true
        }
    });
    if (superClass) _set_prototype_of$2(subClass, superClass);
}
function _set_prototype_of$2(o, p) {
    _set_prototype_of$2 = Object.setPrototypeOf || function setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
    };
    return _set_prototype_of$2(o, p);
}
// interface MobileExtendOptions {
//   isMobile?: boolean;
//   //
//   className?: string;
//   /** 移动端竖屏, 全屏情况下不展示扩张，放置在 footer 中 */
//   controls: string[];
// }
// const MobileExtend_DEFAULT_Options = {
//   controls: MOBILE_EXTENDS,
// };
/**
 * 移动端扩展
 */ var MobileExtend = /*#__PURE__*/ function(EventEmitter) {
    _inherits$2(MobileExtend, EventEmitter);
    function MobileExtend($siblingContainer) {
        var _this;
        _this = EventEmitter.call(this) || this;
        _this._$siblingContainer = $siblingContainer;
        _this.render();
        return _this;
    }
    var _proto = MobileExtend.prototype;
    _proto.render = function render() {
        if (!this.$container) {
            this.$container = document.createElement('div');
            this.$container.classList.add("" + PREFIX_CLASS + "-mobile-extend");
            this._$siblingContainer.insertAdjacentElement == null ? void 0 : this._$siblingContainer.insertAdjacentElement.call(this._$siblingContainer, 'afterend', this.$container);
            // 移动端扩展面板容器
            this.$controlPanel = document.createElement('div');
            this.$controlPanel.classList.add("" + PREFIX_CLASS + "-mobile-extend-control-panel");
            this.$container.appendChild(this.$controlPanel);
            this.$content = document.createElement('div');
            this.$content.classList.add("" + PREFIX_CLASS + "-mobile-extend-control-content");
            this.$controlPanel.appendChild(this.$content);
            this.$top = document.createElement('div');
            this.$top.classList.add("" + PREFIX_CLASS + "-mobile-extend-control-top");
            this.$content.appendChild(this.$top);
            this.$topLeft = document.createElement('div');
            this.$topLeft.classList.add("" + PREFIX_CLASS + "-mobile-extend-control-top-left");
            this.$top.appendChild(this.$topLeft);
            this.$topRight = document.createElement('div');
            this.$topRight.classList.add("" + PREFIX_CLASS + "-mobile-extend-control-top-right");
            this.$top.appendChild(this.$topRight);
        }
    };
    _proto.destroy = function destroy() {
        var _this_$container;
        (_this_$container = this.$container) == null ? void 0 : _this_$container.remove();
        this.emit(EVENTS.theme.mobileExtendDestroy);
    };
    return MobileExtend;
}(EventEmitter);

function _extends$2() {
    _extends$2 = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends$2.apply(this, arguments);
}
function _inherits$1(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            writable: true,
            configurable: true
        }
    });
    if (superClass) _set_prototype_of$1(subClass, superClass);
}
function _set_prototype_of$1(o, p) {
    _set_prototype_of$1 = Object.setPrototypeOf || function setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
    };
    return _set_prototype_of$1(o, p);
}
var PAUSE_DEFAULT_OPTIONS = {};
/**
 * 暂停控件（仅在第一次非自动播放时可以点击播放）, 防止和放大有冲突
 * @category Control
 */ var Pause = /*#__PURE__*/ function(Control) {
    _inherits$1(Pause, Control);
    function Pause(options) {
        if (options === void 0) options = {};
        var _this;
        _this = Control.call(this, Object.assign({}, PAUSE_DEFAULT_OPTIONS, _extends$2({}, options, {
            tagName: 'div',
            controlType: 'block',
            classNameSuffix: 'pause'
        }))) || this, _this._timer = null, _this._timer2 = null, _this._timer3 = null, _this._firstFlag = false;
        _this._options = Object.assign({}, PAUSE_DEFAULT_OPTIONS, options);
        _this.$container.classList.add("" + PREFIX_CLASS + "-pause", "" + PREFIX_CLASS + "-hide");
        return _this;
    }
    var _proto = Pause.prototype;
    /**
   * 展示封面 这里不对 poster 进行缓存， 如果有值优先使用， 如果没有值优先使用 初始化传入的值
   */ _proto.show = function show(playing, always) {
        var _this = this;
        var _this_$container_classList, _this_$container;
        if (!this.$container) return;
        if (!this._firstFlag) {
            this._firstFlag = true;
        } else {
            this.$container.style.cssText += "pointer-events: none;";
        }
        if (playing) {
            this.$container.innerHTML = '<div class="' + PREFIX_CLASS + '-pause-circle">' + IconComponents.play() + "</div>";
        } else {
            this.$container.innerHTML = '<div class="' + PREFIX_CLASS + '-pause-circle">' + IconComponents.pause() + "</div>";
        }
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
        if (this._timer2) {
            clearTimeout(this._timer2);
            this._timer2 = null;
        }
        (_this_$container = this.$container) == null ? void 0 : (_this_$container_classList = _this_$container.classList) == null ? void 0 : _this_$container_classList.remove("" + PREFIX_CLASS + "-hide");
        this._timer = setTimeout(function() {
            var _this_$container_classList, _this_$container;
            if (_this._timer) {
                clearTimeout(_this._timer);
                _this._timer = null;
            }
            if (always) {
                return;
            }
            (_this_$container = _this.$container) == null ? void 0 : (_this_$container_classList = _this_$container.classList) == null ? void 0 : _this_$container_classList.add("" + PREFIX_CLASS + "-pause-transform");
            _this._timer2 = setTimeout(function() {
                var _this_$container_classList, _this_$container, _this_$container_classList1, _this_$container1;
                if (_this._timer2) {
                    clearTimeout(_this._timer2);
                    _this._timer2 = null;
                }
                (_this_$container = _this.$container) == null ? void 0 : (_this_$container_classList = _this_$container.classList) == null ? void 0 : _this_$container_classList.add("" + PREFIX_CLASS + "-hide");
                (_this_$container1 = _this.$container) == null ? void 0 : (_this_$container_classList1 = _this_$container1.classList) == null ? void 0 : _this_$container_classList1.remove("" + PREFIX_CLASS + "-pause-transform");
            }, 300);
        }, 10);
    };
    /**
   * 销毁
   */ _proto.destroy = function destroy() {
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
        if (this._timer2) {
            clearTimeout(this._timer2);
            this._timer2 = null;
        }
        if (this._timer3) {
            clearTimeout(this._timer3);
            this._timer3 = null;
        }
        this.hide();
        Control.prototype.destroy.call(this);
    };
    _proto._onControlClick = function _onControlClick(e) {
        var _this = this;
        e.stopPropagation();
        e.preventDefault();
        // 250ms 内点击多次， 默认是双击， 不触发点击播放, 移动端双击不会触发 click
        if (this._firstFlag) {
            if (this._timer3) {
                clearTimeout(this._timer3);
                this._timer3 = null;
                return;
            }
            this._timer3 = setTimeout(function() {
                if (_this._timer3) {
                    clearTimeout(_this._timer3);
                    _this._timer3 = null;
                }
                _this.emit(EVENTS.control.play, true, 'pause');
            }, 250);
        }
    };
    return Pause;
}(Control);

var _unmountedControls = function(theme) {
    if (!theme.controls) {
        return;
    }
    // prettier-ignore
    var hasControls = Object.keys(theme.controls).length > 0 || theme._header || theme._footer;
    if (theme._interactiveResult) {
        // 清除 Header 和 Footer 的互动
        theme._interactiveResult.cleanup == null ? void 0 : theme._interactiveResult.cleanup.call(theme._interactiveResult);
        theme._interactiveResult = null;
    }
    if (hasControls) {
        theme.emit(EVENTS.control.beforeUnmountControls);
    }
    // unmounted Controls
    if (Object.keys(theme.controls).length > 0) {
        for(var key in theme.controls){
            var _theme_controls_key_destroy, _theme_controls_key;
            (_theme_controls_key_destroy = (_theme_controls_key = theme.controls[key]).destroy) == null ? void 0 : _theme_controls_key_destroy.call(_theme_controls_key);
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        theme.controls = null;
    }
    if (theme._pauseControl) {
        theme._pauseControl.destroy == null ? void 0 : theme._pauseControl.destroy.call(theme._pauseControl);
    }
    if (theme._loadingControl) {
        theme._loadingControl.destroy == null ? void 0 : theme._loadingControl.destroy.call(theme._loadingControl);
    }
    if (theme.messageControl) {
        theme.messageControl.destroy == null ? void 0 : theme.messageControl.destroy.call(theme.messageControl);
    }
    if (theme.posterControl) {
        theme.posterControl.destroy == null ? void 0 : theme.posterControl.destroy.call(theme.posterControl);
    }
    if (theme._headerMoreControl) {
        theme._headerMoreControl.destroy == null ? void 0 : theme._headerMoreControl.destroy.call(theme._headerMoreControl);
        theme._headerMoreControl = null;
    }
    if (theme._footerMoreControl) {
        theme._footerMoreControl.destroy == null ? void 0 : theme._footerMoreControl.destroy.call(theme._footerMoreControl);
        theme._footerMoreControl = null;
    }
    if (theme._recFooter) {
        theme._recFooter.destroy();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        theme._recFooter = null;
    }
    if (theme._mobileExtend) {
        theme._mobileExtend.destroy();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        theme._mobileExtend = null;
    }
    if (theme._header) {
        theme._header.destroy();
        theme._header = null;
    }
    if (theme._footer) {
        theme._footer.destroy();
        theme._footer = null;
    }
    if (theme._onPauseTimingFunc) {
        theme._onPauseTimingFunc = null;
    }
    if (hasControls) {
        theme.emit(EVENTS.control.unmountedControls);
    }
};

function _array_like_to_array$1(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function asyncGeneratorStep$1(gen, resolve, reject, _next, _throw, key, arg) {
    try {
        var info = gen[key](arg);
        var value = info.value;
    } catch (error) {
        reject(error);
        return;
    }
    if (info.done) {
        resolve(value);
    } else {
        Promise.resolve(value).then(_next, _throw);
    }
}
function _async_to_generator$1(fn) {
    return function() {
        var self = this, args = arguments;
        return new Promise(function(resolve, reject) {
            var gen = fn.apply(self, args);
            function _next(value) {
                asyncGeneratorStep$1(gen, resolve, reject, _next, _throw, "next", value);
            }
            function _throw(err) {
                asyncGeneratorStep$1(gen, resolve, reject, _next, _throw, "throw", err);
            }
            _next(undefined);
        });
    };
}
function _extends$1() {
    _extends$1 = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends$1.apply(this, arguments);
}
function _unsupported_iterable_to_array$1(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _array_like_to_array$1(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array$1(o, minLen);
}
function _create_for_of_iterator_helper_loose$1(o, allowArrayLike) {
    var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
    if (it) return (it = it.call(o)).next.bind(it);
    if (Array.isArray(o) || (it = _unsupported_iterable_to_array$1(o)) || allowArrayLike) {
        if (it) o = it;
        var i = 0;
        return function() {
            if (i >= o.length) {
                return {
                    done: true
                };
            }
            return {
                done: false,
                value: o[i++]
            };
        };
    }
    throw new TypeError("Invalid attempt to iterate non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _ts_generator$1(thisArg, body) {
    var f, y, t, _ = {
        label: 0,
        sent: function() {
            if (t[0] & 1) throw t[1];
            return t[1];
        },
        trys: [],
        ops: []
    }, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
    }), g;
    function verb(n) {
        return function(v) {
            return step([
                n,
                v
            ]);
        };
    }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while(g && (g = 0, op[0] && (_ = 0)), _)try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [
                op[0] & 2,
                t.value
            ];
            switch(op[0]){
                case 0:
                case 1:
                    t = op;
                    break;
                case 4:
                    _.label++;
                    return {
                        value: op[1],
                        done: false
                    };
                case 5:
                    _.label++;
                    y = op[1];
                    op = [
                        0
                    ];
                    continue;
                case 7:
                    op = _.ops.pop();
                    _.trys.pop();
                    continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                        _ = 0;
                        continue;
                    }
                    if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                        _.label = op[1];
                        break;
                    }
                    if (op[0] === 6 && _.label < t[1]) {
                        _.label = t[1];
                        t = op;
                        break;
                    }
                    if (t && _.label < t[2]) {
                        _.label = t[2];
                        _.ops.push(op);
                        break;
                    }
                    if (t[2]) _.ops.pop();
                    _.trys.pop();
                    continue;
            }
            op = body.call(thisArg, _);
        } catch (e) {
            op = [
                6,
                e
            ];
            y = 0;
        } finally{
            f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return {
            value: op[0] ? op[1] : void 0,
            done: true
        };
    }
}
// 需要权限的控件
var AUTH_KEY = [
    'ptz'
];
/**
 * 渲染控件
 * @param $container - 控件渲染节点
 * @param btnList - 控件按钮列表
 */ // prettier-ignore
function _renderControls(theme, $container, btnList, props) {
    if (props === void 0) props = {};
    if (theme.$container) {
        for(var _iterator = _create_for_of_iterator_helper_loose$1(btnList), _step; !(_step = _iterator()).done;){
            var item = _step.value;
            var _theme_options_mobileExtendOptions, // 在移动端支持扩展和窗口区域渲染
            _theme_options_mobileExtendOptions_controls, _theme_options_mobileExtendOptions1;
            if (((((_theme_options_mobileExtendOptions = theme.options.mobileExtendOptions) == null ? void 0 : _theme_options_mobileExtendOptions.controls) || []).includes(item.iconId) && item.iconId !== "ptz" || ((_theme_options_mobileExtendOptions1 = theme.options.mobileExtendOptions) == null ? void 0 : (_theme_options_mobileExtendOptions_controls = _theme_options_mobileExtendOptions1.controls) == null ? void 0 : _theme_options_mobileExtendOptions_controls.includes('rec')) && REC_GROUP.includes(item.iconId) // 移动端模式下，不渲染在header 中控件， 需要移动到mobileExtend中
            ) && Utils.isMobile) {
                continue;
            }
            if (REC_GROUP.includes(item.iconId) && theme._header) {
                _renderRecType(theme, theme._header.$right, item.iconId, props);
                continue;
            }
            if (DEVICE_INFO_GROUP.includes(item.iconId)) {
                if (theme.options.deviceOptions !== null) {
                    var _theme_controls;
                    if (!((_theme_controls = theme.controls) == null ? void 0 : _theme_controls["deviceControl"])) {
                        var _theme_options;
                        // eslint-disable-next-line @typescript-eslint/dot-notation, new-cap, @typescript-eslint/no-unsafe-argument
                        theme.controls["deviceControl"] = new Controls["device"](_extends$1({
                            rootContainer: theme.$container,
                            getPopupContainer: function() {
                                return $container;
                            },
                            recType: theme.recType,
                            language: theme.options.language,
                            locales: theme.i18n.translations,
                            type: theme.options.type,
                            deviceSerial: theme.urlInfo.deviceSerial,
                            channelNo: theme.urlInfo.channelNo
                        }, ((_theme_options = theme.options) == null ? void 0 : _theme_options["deviceOptions"]) || {}, {
                            props: props
                        }));
                    }
                }
                continue;
            }
            // footer
            if (Controls[item.iconId]) {
                if (theme.options["" + item.iconId + "Options"] !== null) {
                    var _theme_options1;
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    theme.controls["" + item.iconId + "Control"] = new Controls[item.iconId](_extends$1({
                        rootContainer: theme.$container,
                        getPopupContainer: function() {
                            return $container;
                        },
                        language: theme.options.language || "zh",
                        locales: theme.i18n.translations
                    }, AUTH_KEY.includes(item.iconId) ? {
                        env: theme.options.env,
                        accessToken: theme.options.accessToken,
                        token: theme.options.token,
                        deviceSerial: theme.urlInfo.deviceSerial,
                        channelNo: theme.urlInfo.channelNo
                    } : {}, {
                        PLAY_TYPE: theme.options.type
                    }, ((_theme_options1 = theme.options) == null ? void 0 : _theme_options1["" + item.iconId + "Options"]) || {}, {
                        props: props
                    }));
                }
            } else {
                theme.logger.warn("[" + item.iconId + "] control does not exist");
            }
        }
    }
}
function _renderTheme(theme, data) {
    return _async_to_generator$1(function() {
        var _theme_posterControl, _filterThemeData_header, _filterThemeData_footer, _theme_options_mobileExtendOptions_controls, _theme_options_mobileExtendOptions, themeData, filterThemeData, props, _$_filterLeftRightControls, leftBtns, rightBtns, _theme_controls, _theme_controls1, _$_filterLeftRightControls1, leftBtns1, rightBtns1, _filterThemeData_footer_btnList, list, _needTimeLine, hasPtz, _theme_options_mobileExtendOptions1, _theme_options_mobileExtendOptions2, _theme_options_mobileExtendOptions3, _theme_options_mobileExtendOptions_controls1, _theme_options_mobileExtendOptions4, _filterThemeData_header1, _filterThemeData_footer1, _filterThemeData_footer_btnList1;
        return _ts_generator$1(this, function(_state) {
            switch(_state.label){
                case 0:
                    return [
                        4,
                        getThemeData(theme, data)
                    ];
                case 1:
                    themeData = _state.sent();
                    _unmountedControls(theme);
                    if (Object.prototype.toString.call(themeData) !== '[object Object]') {
                        // 主题空
                        return [
                            2
                        ];
                    }
                    if (theme.options.loadingOptions !== null) {
                        theme._loadingControl = new Loading(_extends$1({
                            language: theme.options.language,
                            locales: theme.i18n.translations
                        }, theme.options.loadingOptions || {}, {
                            getPopupContainer: function() {
                                return theme.$container;
                            }
                        }));
                    }
                    if (theme.options.pauseOptions !== null) {
                        theme._pauseControl = new Pause(_extends$1({
                            language: theme.options.language,
                            locales: theme.i18n.translations
                        }, theme.options.pauseOptions || {}, {
                            getPopupContainer: function() {
                                return theme.contentControl.$wrapper;
                            }
                        }));
                        if (!theme.options.autoPlay) {
                            theme._pauseControl.show(false, true);
                        }
                    }
                    if (theme.options.messageOptions !== null) {
                        theme.messageControl = new Message(_extends$1({
                            rootContainer: theme.$container
                        }, theme.options.messageOptions || {}, {
                            getPopupContainer: function() {
                                return theme.contentControl.$wrapper;
                            }
                        }));
                    }
                    if (theme.options.posterOptions !== null) {
                        theme.posterControl = new Poster(_extends$1({}, theme.options.posterOptions || {}, {
                            getPopupContainer: function() {
                                return theme.contentControl.$video;
                            }
                        }));
                    }
                    theme.controls = {}; // 防止为 null
                    theme.emit(EVENTS.control.beforeMountControls);
                    filterThemeData = _filterControls(themeData);
                    theme._themeData = filterThemeData;
                    if (filterThemeData.poster) {
                        theme.setPoster(filterThemeData.poster);
                    }
                    if (!theme._playing) (_theme_posterControl = theme.posterControl) == null ? void 0 : _theme_posterControl.show();
                    props = THEME_PROPS.reduce(function(acc, cur) {
                        acc[cur] = theme[cur];
                        return acc;
                    }, {});
                    // 由于 resize 改变有延时（节流）， 第一次渲染时， 宽度高度可能为 0， 需要手动设置一下
                    if (props.width === 0) {
                        props.width = Math.floor(theme.$container.clientWidth);
                    }
                    if (props.height === 0) {
                        props.height = Math.floor(theme.$container.clientHeight);
                    }
                    if (filterThemeData.header) {
                        theme._header = new Header({
                            getPopupContainer: function() {
                                return theme.$container;
                            },
                            color: filterThemeData.header.color,
                            activeColor: filterThemeData.header.activeColor,
                            backgroundColor: filterThemeData.header.backgroundColor
                        });
                        // prettier-ignore
                        _$_filterLeftRightControls = _filterLeftRightControls(filterThemeData.header.btnList || []), leftBtns = _$_filterLeftRightControls[0], rightBtns = _$_filterLeftRightControls[1];
                        _renderControls(theme, theme._header.$left, leftBtns, props);
                        _renderControls(theme, theme._header.$right, rightBtns, props);
                    }
                    if (filterThemeData.footer) {
                        // prettier-ignore
                        theme._footer = new Footer({
                            getPopupContainer: function() {
                                return theme.$container;
                            },
                            color: filterThemeData.footer.color,
                            activeColor: filterThemeData.footer.activeColor,
                            backgroundColor: filterThemeData.footer.backgroundColor
                        });
                        // prettier-ignore
                        if ((theme._header || theme._footer) && (filterThemeData == null ? void 0 : filterThemeData.autoFocus) !== 0) {
                            // 监听鼠标移动 , header 和 footer 的交互和动画
                            // prettier-ignore
                            theme._interactiveResult = interactiveHF(theme.$container, ((themeData == null ? void 0 : themeData.autoFocus) || 3) * 1000, function(open) {
                                theme.emit(EVENTS.control.controlsBarOpenChange, open);
                            });
                            // 当移动端 picker 控件打开时需要关闭动画（定时器）
                            // 暂停 header footer 的动画(定时器)
                            if (theme._onPauseTimingFunc) {
                                theme.removeListener(CLEAR_TIMER_HEADER_FOOTER_ANIMATION, theme._onPauseTimingFunc);
                                theme._onPauseTimingFunc = null;
                            }
                            theme._onPauseTimingFunc = function(open) {
                                if (open) {
                                    var _theme__interactiveResult_clearTimeout, _theme__interactiveResult;
                                    (_theme__interactiveResult = theme._interactiveResult) == null ? void 0 : (_theme__interactiveResult_clearTimeout = _theme__interactiveResult.clearTimeout) == null ? void 0 : _theme__interactiveResult_clearTimeout.call(_theme__interactiveResult);
                                } else {
                                    if (theme._playing) {
                                        var _theme__interactiveResult_setTimeoutShow, _theme__interactiveResult1;
                                        (_theme__interactiveResult1 = theme._interactiveResult) == null ? void 0 : (_theme__interactiveResult_setTimeoutShow = _theme__interactiveResult1.setTimeoutShow) == null ? void 0 : _theme__interactiveResult_setTimeoutShow.call(_theme__interactiveResult1);
                                    }
                                }
                            };
                            theme.on(CLEAR_TIMER_HEADER_FOOTER_ANIMATION, theme._onPauseTimingFunc);
                            // 每次切换主题时， 重新设置一次, 因为主题可能是异步渲染的
                            theme._onPauseTimingFunc(!theme._playing);
                        }
                        // 一开始音量控件禁用（只有第一次， 再次切换主题不做变化）， 待收到音频信息（audioInfo）后取消禁用
                        if ((_theme_controls = theme.controls) == null ? void 0 : _theme_controls.volumeControl) {
                            theme.controls.volumeControl.disabled = true;
                        }
                        if (((_theme_controls1 = theme.controls) == null ? void 0 : _theme_controls1.globalFullscreenControl) && !theme.playing) {
                            theme.controls.globalFullscreenControl.disabled = true;
                        }
                        _$_filterLeftRightControls1 = _filterLeftRightControls(filterThemeData.footer.btnList || []), leftBtns1 = _$_filterLeftRightControls1[0], rightBtns1 = _$_filterLeftRightControls1[1];
                        _renderControls(theme, theme._footer.$left, leftBtns1, props);
                        _renderControls(theme, theme._footer.$right, rightBtns1, props);
                    }
                    list = [].concat(((_filterThemeData_header = filterThemeData.header) == null ? void 0 : _filterThemeData_header.btnList) || [], (_filterThemeData_footer_btnList = (_filterThemeData_footer = filterThemeData.footer) == null ? void 0 : _filterThemeData_footer.btnList) != null ? _filterThemeData_footer_btnList : []);
                    // FIXME: 这个逻辑实际上是有问题的
                    _needTimeLine = list.some(function(item) {
                        return REC_GROUP.includes(item.iconId);
                    });
                    // PC 单独渲染timeLine
                    if (!Utils.isMobile && !(theme.options.timeLineOptions === null || theme.options.disabledTimeLine) && _needTimeLine) {
                        theme._recFooter = new RecFooter(theme.$container, {
                            hasDatePicker: theme.options.dateOptions !== null
                        });
                        //
                        _renderTimeLine(theme, theme._recFooter.$timeLineContainer, props);
                        if (theme._footer) {
                            theme._footer.$container.style.cssText += "bottom: 36px;";
                        }
                        if (theme.options.dateOptions !== null) {
                            _renderDatePicker(theme, theme._recFooter.$datePickerContainer, props);
                        }
                    }
                    // 移动端扩展
                    if (Utils.isMobile && ((_theme_options_mobileExtendOptions = theme.options.mobileExtendOptions) == null ? void 0 : (_theme_options_mobileExtendOptions_controls = _theme_options_mobileExtendOptions.controls) == null ? void 0 : _theme_options_mobileExtendOptions_controls.length)) {
                        hasPtz = list.some(function(item) {
                            return item.iconId === 'ptz';
                        });
                        if (hasPtz || _needTimeLine) {
                            theme._mobileExtend = new MobileExtend(theme.$container);
                            if (theme.options.dateOptions !== null && ((_theme_options_mobileExtendOptions1 = theme.options.mobileExtendOptions) == null ? void 0 : _theme_options_mobileExtendOptions1.controls.includes('date')) && _needTimeLine) {
                                _renderDatePicker(theme, theme._mobileExtend.$topLeft, props);
                            }
                            if (theme.options.recOptions !== null && ((_theme_options_mobileExtendOptions2 = theme.options.mobileExtendOptions) == null ? void 0 : _theme_options_mobileExtendOptions2.controls.includes('rec')) && _needTimeLine) {
                                [].concat(((_filterThemeData_header1 = filterThemeData.header) == null ? void 0 : _filterThemeData_header1.btnList) || [], (_filterThemeData_footer_btnList1 = (_filterThemeData_footer1 = filterThemeData.footer) == null ? void 0 : _filterThemeData_footer1.btnList) != null ? _filterThemeData_footer_btnList1 : []).forEach(function(item) {
                                    var _theme__mobileExtend;
                                    if (REC_GROUP.includes(item.iconId)) _renderRecType(theme, (_theme__mobileExtend = theme._mobileExtend) == null ? void 0 : _theme__mobileExtend.$topRight, item.iconId, props);
                                });
                            }
                            if ((theme.options.timeLineOptions !== null || !theme.options.disabledTimeLine) && ((_theme_options_mobileExtendOptions3 = theme.options.mobileExtendOptions) == null ? void 0 : _theme_options_mobileExtendOptions3.controls.includes('timeLine')) && _needTimeLine) {
                                _renderTimeLine(theme, theme._mobileExtend.$content, props);
                            }
                            if (Utils.isMobile && ((_theme_options_mobileExtendOptions4 = theme.options.mobileExtendOptions) == null ? void 0 : (_theme_options_mobileExtendOptions_controls1 = _theme_options_mobileExtendOptions4.controls) == null ? void 0 : _theme_options_mobileExtendOptions_controls1.includes('ptz')) && hasPtz && theme.controls.ptzControl) {
                                theme.controls.ptzControl.renderMobileExtend(theme._mobileExtend.$content);
                            }
                        }
                    }
                    theme.emit(EVENTS.control.mountedControls);
                    if (!theme.playing) theme._disabled(true);
                    _controlEventemitter(theme);
                    return [
                        2
                    ];
            }
        });
    })();
}
var _renderTimeLine = function(theme, container, props) {
    if (props === void 0) props = {};
    if (!theme.controls.timeLineControl && theme.options.timeLineOptions !== null) {
        var _theme_urlInfo, _theme_options;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        theme.controls.timeLineControl = new Controls['timeLine'](_extends$1({
            getPopupContainer: function() {
                return container;
            },
            language: theme.options.language,
            locales: theme.i18n.translations,
            coverQuery: ((_theme_urlInfo = theme.urlInfo) == null ? void 0 : _theme_urlInfo.validateCode) ? "decodekey=" + theme.urlInfo.validateCode : ''
        }, ((_theme_options = theme.options) == null ? void 0 : _theme_options["timeLineOptions"]) || {}, {
            props: props
        }));
    }
};
var _renderDatePicker = function(theme, container, props) {
    if (props === void 0) props = {};
    if (!theme.controls.dateControl && theme.options.dateOptions !== null) {
        var _theme_options;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        theme.controls.dateControl = new Controls['date'](_extends$1({
            getPopupContainer: function() {
                return container;
            },
            language: theme.options.language,
            locales: theme.i18n.translations
        }, ((_theme_options = theme.options) == null ? void 0 : _theme_options["dateOptions"]) || {}, {
            props: props
        }));
    }
};
var _renderRecType = function(theme, container, recType, props) {
    if (props === void 0) props = {};
    var _theme_controls, _theme_controls1, _theme_controls2;
    if (!((_theme_controls = theme.controls) == null ? void 0 : _theme_controls['recControl']) && theme.options.recOptions !== null && container) {
        var _theme_options;
        // eslint-disable-next-line @typescript-eslint/dot-notation, new-cap, @typescript-eslint/no-unsafe-argument
        theme.controls['recControl'] = new Controls['rec'](_extends$1({
            getPopupContainer: function() {
                return container;
            },
            recType: theme.recType,
            language: theme.options.language,
            locales: theme.i18n.translations
        }, ((_theme_options = theme.options) == null ? void 0 : _theme_options["recOptions"]) || {}, {
            props: props
        }));
    }
    if ((_theme_controls1 = theme.controls) == null ? void 0 : _theme_controls1['recControl']) ((_theme_controls2 = theme.controls) == null ? void 0 : _theme_controls2['recControl']).addRecType(recType);
};

/* eslint-disable @typescript-eslint/no-non-null-assertion */ function _array_like_to_array(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
        var info = gen[key](arg);
        var value = info.value;
    } catch (error) {
        reject(error);
        return;
    }
    if (info.done) {
        resolve(value);
    } else {
        Promise.resolve(value).then(_next, _throw);
    }
}
function _async_to_generator(fn) {
    return function() {
        var self = this, args = arguments;
        return new Promise(function(resolve, reject) {
            var gen = fn.apply(self, args);
            function _next(value) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
            }
            function _throw(err) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
            }
            _next(undefined);
        });
    };
}
function _defineProperties(target, props) {
    for(var i = 0; i < props.length; i++){
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
    }
}
function _create_class(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    return Constructor;
}
function _extends() {
    _extends = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends.apply(this, arguments);
}
function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            writable: true,
            configurable: true
        }
    });
    if (superClass) _set_prototype_of(subClass, superClass);
}
function _set_prototype_of(o, p) {
    _set_prototype_of = Object.setPrototypeOf || function setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
    };
    return _set_prototype_of(o, p);
}
function _unsupported_iterable_to_array(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _array_like_to_array(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array(o, minLen);
}
function _create_for_of_iterator_helper_loose(o, allowArrayLike) {
    var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
    if (it) return (it = it.call(o)).next.bind(it);
    if (Array.isArray(o) || (it = _unsupported_iterable_to_array(o)) || allowArrayLike) {
        if (it) o = it;
        var i = 0;
        return function() {
            if (i >= o.length) {
                return {
                    done: true
                };
            }
            return {
                done: false,
                value: o[i++]
            };
        };
    }
    throw new TypeError("Invalid attempt to iterate non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _ts_generator(thisArg, body) {
    var f, y, t, _ = {
        label: 0,
        sent: function() {
            if (t[0] & 1) throw t[1];
            return t[1];
        },
        trys: [],
        ops: []
    }, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
    }), g;
    function verb(n) {
        return function(v) {
            return step([
                n,
                v
            ]);
        };
    }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while(g && (g = 0, op[0] && (_ = 0)), _)try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [
                op[0] & 2,
                t.value
            ];
            switch(op[0]){
                case 0:
                case 1:
                    t = op;
                    break;
                case 4:
                    _.label++;
                    return {
                        value: op[1],
                        done: false
                    };
                case 5:
                    _.label++;
                    y = op[1];
                    op = [
                        0
                    ];
                    continue;
                case 7:
                    op = _.ops.pop();
                    _.trys.pop();
                    continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                        _ = 0;
                        continue;
                    }
                    if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                        _.label = op[1];
                        break;
                    }
                    if (op[0] === 6 && _.label < t[1]) {
                        _.label = t[1];
                        t = op;
                        break;
                    }
                    if (t && _.label < t[2]) {
                        _.label = t[2];
                        _.ops.push(op);
                        break;
                    }
                    if (t[2]) _.ops.pop();
                    _.trys.pop();
                    continue;
            }
            op = body.call(thisArg, _);
        } catch (e) {
            op = [
                6,
                e
            ];
            y = 0;
        } finally{
            f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return {
            value: op[0] ? op[1] : void 0,
            done: true
        };
    }
}
var THEME_DEFAULT_OPTIONS = {
    dblClickFullscreen: true,
    language: 'zh',
    autoPlay: true,
    scaleMode: THEME_SCALE_MODE_TYPE.full,
    loggerOptions: {
        level: 'INFO',
        showTime: true
    },
    env: {
        domain: 'https://open.ys7.com'
    },
    /** 移动端竖屏, 全屏情况下不展示扩张，放置在 footer 中 */ mobileExtendOptions: {
        controls: MOBILE_EXTENDS
    }
};
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
 */ var Theme = /*#__PURE__*/ function(EventEmitter) {
    _inherits(Theme, EventEmitter);
    function Theme(options) {
        var _this;
        var _this_options_volumeOptions, _this_options_volumeOptions1, _this_options_speedOptions, _this_options, _this_options1;
        _this = EventEmitter.call(this) || this, /** 播放器配置项 */ _this.options = THEME_DEFAULT_OPTIONS, _this.staticPath = '', /** 所有控件列表, 所有控件名称规则（`${iconId}Control`）， 如音量控件 this.controls["volumeControl"]  @since 0.0.1 */ _this.controls = {}, /**
   * @since 0.0.1
   * @private
   */ _this._seekDate = null, /**
   * @type { "rec" | "cloudRec" | "cloudRecord" } recType 回放类型
   * ```ts
   * theme.recType // 回放类型
   * ```
   */ _this.recType = '', /**
   * 更多控件（header more）
   * @since 0.0.1
   * @private
   */ _this._headerMoreControl = null, /**
   * 更多控件（footer more）
   * @since 0.0.1
   * @private
   */ _this._footerMoreControl = null, /** 头部控件 @since 0.0.1 @private */ _this._header = null, /** 低部控件 @since 0.0.1 @private */ _this._footer = null, /** 回放底部时间轴 @since 0.0.1 @private */ _this._recFooter = null, /**
   * 移动端扩展容器, 扩展的控件渲染在指定容器以外， 仅只用端适用， 为了可以放置大的控件和方便开发接入
   * @private
   */ _this._mobileExtend = null, /**  @since 0.0.1 @private */ _this._interactiveResult = null, /**  @since 0.0.1 @private */ _this._themeData = null, _this._fullscreen = null, _this.zoomUtil = null, /** 清除屏幕旋转 */ _this._cleanupOrientation = null, /**  resizeObserver 监听销毁 */ _this._cleanUpResizeObserver = null, /** 容器的宽 */ _this._width = 0, /** 容器的高 */ _this._height = 0, /** 当前容器的全屏状态  true: 全屏， false: 非全屏 */ _this._isCurrentFullscreen = false, /** 屏幕旋转角度 0 ｜ 90 ｜ 180 ｜ 270 */ _this._orientationAngle = 0, /** 是否播放中 @private */ _this._playing = false, /** 加载中 */ _this._loading = false, /** 音量 */ _this._volume = 0, /** 静音 */ _this._muted = false, /** 电子放大倍数 @private */ _this._zoom = 1, /** 放大中  true: 可缩放状态，false: 禁止缩放状态(不能缩放) @private */ _this._zooming = false, /** 录制中 @private */ _this._recording = false, /** 对讲中 @private */ _this._talking = false, /** 倍速 @private */ _this._speed = 1, /** 自定清晰度 @private */ _this._videoLevelAuto = false, /** 清晰度列表 */ _this.videoLevelList = [], /** 回放片段列表 */ _this.recordList = [], /** 窗口尺寸变化时，设置窗口超出隐藏，防止出现滚动条 */ _this._resizeOverflowTimer = null, // /**
        //  * 记录回放的月份
        //  *
        //  * key: {序列号}_{通道号}_{rec | cloud | cloudRecord}   比如：BC7799091_1_rec  BC7799091_1_cloud BC7799091_1_cloudRecord
        //  *
        //  * value: 月份列表  比如 ["2025-12-01", "2025-12-02"]
        //  * @private
        //  */
        // _recMonthObj: Record<string, string[]> = {};
        /**
   * 录像回放的月份列表 @private
   */ _this.recMonth = [], /** 清理 header/footer 动画 定时器 @private */ _this._onPauseTimingFunc = null, /** 销毁标识  @readonly */ _this.destroyed = false, /** 播放地址信息 */ _this.urlInfo = null, _this.scaleMode = 0;
        _this._initOptions(options);
        if (_this.options.type === 'ezopen') {
            var _this_urlInfo_searchParams, _this_urlInfo;
            _this.urlInfo = require$$1.parseEzopenUrl(_this.options.url);
            if ((_this_urlInfo = _this.urlInfo) == null ? void 0 : (_this_urlInfo_searchParams = _this_urlInfo.searchParams) == null ? void 0 : _this_urlInfo_searchParams.spaceId) {
                _this.options.spaceId = _this.urlInfo.searchParams.spaceId;
            }
            if (_this.urlInfo.type === 'rec') {
                var _this_urlInfo_searchParams1, _this_urlInfo1, _this_urlInfo_searchParams2, _this_urlInfo2;
                _this._seekDate = ((_this_urlInfo1 = _this.urlInfo) == null ? void 0 : (_this_urlInfo_searchParams1 = _this_urlInfo1.searchParams) == null ? void 0 : _this_urlInfo_searchParams1.begin) ? require$$1.DateTime.toDate((_this_urlInfo2 = _this.urlInfo) == null ? void 0 : (_this_urlInfo_searchParams2 = _this_urlInfo2.searchParams) == null ? void 0 : _this_urlInfo_searchParams2.begin) : require$$1.DateTime.toDate(require$$1.DateTime.format(new Date(), 'YYYY/MM/DD') + ' 00:00:00');
            }
        }
        _this._getRecType(_this.options.url);
        _bindEventLogger(_this, EVENTS);
        options.onInitializing == null ? void 0 : options.onInitializing.call(options, _this); // 在初始化时，执行回调 支持 i18n logger
        if (_this.options.autoPlay) {
            _this.playing = true;
        }
        _this._initClassName();
        // 画布需要渲染在 this.contentControl.$container 内
        _this.contentControl = new Content({
            getContainer: function() {
                return _this.$container;
            },
            scaleMode: _this.scaleMode
        });
        //  zoom utils
        __zoom(_this, _this.contentControl.$content, _extends({}, _this.options.zoomOptions || {}, {
            onTap: function() {
                var _this__interactiveResult_setTimeoutShow, _this__interactiveResult;
                (_this__interactiveResult = _this._interactiveResult) == null ? void 0 : (_this__interactiveResult_setTimeoutShow = _this__interactiveResult.setTimeoutShow) == null ? void 0 : _this__interactiveResult_setTimeoutShow.call(_this__interactiveResult);
            }
        }));
        var _this_options_volumeOptions_volume, _ref;
        _this._volume = (_ref = (_this_options_volumeOptions_volume = (_this_options_volumeOptions = _this.options.volumeOptions) == null ? void 0 : _this_options_volumeOptions.volume) != null ? _this_options_volumeOptions_volume : _this.options.volume) != null ? _ref : 0.8;
        var _this_options_volumeOptions_muted, _ref1;
        _this._muted = (_ref1 = (_this_options_volumeOptions_muted = (_this_options_volumeOptions1 = _this.options.volumeOptions) == null ? void 0 : _this_options_volumeOptions1.muted) != null ? _this_options_volumeOptions_muted : _this.options.muted) != null ? _ref1 : false;
        var _this_options_speedOptions_value, _ref2;
        _this._speed = (_ref2 = (_this_options_speedOptions_value = (_this_options_speedOptions = _this.options.speedOptions) == null ? void 0 : _this_options_speedOptions.value) != null ? _this_options_speedOptions_value : _this.options.value) != null ? _ref2 : 1;
        _this._mobileInnerWidthHeight = _this._mobileInnerWidthHeight.bind(_this);
        _this._throttleMobileInnerWidthHeight = throttle(_this._mobileInnerWidthHeight, 20).bind(_this);
        _this._onDblClickFullscreen = debounce(_this._onDblClickFullscreen, 20).bind(_this);
        _this._headerMoreControlShow = debounce(_this._headerMoreControlShow.bind(_this), 200);
        _this._footerMoreControlShow = debounce(_this._footerMoreControlShow.bind(_this), 200);
        _this.destroyed = false;
        var _this_options_template, _ref3;
        // 标准流暂时仅支持 TEMPLATES 中的配置， 多余的的展示不生效（如电子放大是不支持的等等）， 待版本更新才能支持
        _this._renderTheme([
            'flv',
            'hls',
            'mp4'
        ].includes(options.type) ? LiveTemplate : (_ref3 = (_this_options_template = (_this_options = _this.options) == null ? void 0 : _this_options.template) != null ? _this_options_template : (_this_options1 = _this.options) == null ? void 0 : _this_options1.themeData) != null ? _ref3 : null);
        _this._addEventListener();
        _themeEventemitter(_this);
        return _this;
    }
    var _proto = Theme.prototype;
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
   */ _proto.resize = function resize(width, height) {
        _resize(this, width, height);
    };
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
   */ _proto.fullscreen = function fullscreen() {
        return _async_to_generator(function() {
            var _this__fullscreen;
            return _ts_generator(this, function(_state) {
                switch(_state.label){
                    case 0:
                        return [
                            4,
                            (_this__fullscreen = this._fullscreen) == null ? void 0 : _this__fullscreen.fullscreen()
                        ];
                    case 1:
                        // 这里不要做其他操作， 防止 UI 和 api 结果不一致
                        return [
                            2,
                            _state.sent()
                        ];
                }
            });
        }).call(this);
    };
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
   */ _proto.exitFullscreen = function exitFullscreen() {
        return _async_to_generator(function() {
            var _this__fullscreen;
            return _ts_generator(this, function(_state) {
                switch(_state.label){
                    case 0:
                        return [
                            4,
                            (_this__fullscreen = this._fullscreen) == null ? void 0 : _this__fullscreen.exitFullscreen()
                        ];
                    case 1:
                        // 这里不要做其他操作， 防止 UI 和 api 结果不一致
                        return [
                            2,
                            _state.sent()
                        ];
                }
            });
        }).call(this);
    };
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
   */ _proto.changeTheme = function changeTheme(themeData) {
        this._renderTheme(themeData);
        this.emit == null ? void 0 : this.emit.call(this, EVENTS.changeTheme, themeData);
    };
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
   */ _proto.setPoster = function setPoster(poster) {
        var _this_posterControl;
        (_this_posterControl = this.posterControl) == null ? void 0 : _this_posterControl.setPoster(poster);
    };
    /**
   * @description 设置日志配置
   * @since 0.0.1
   * @param {LoggerOptions} options - 日志配置
   */ _proto.setLoggerOptions = function setLoggerOptions(options) {
        if (options === void 0) options = {};
        var _this_logger, _this;
        (_this_logger = this.logger) == null ? void 0 : _this_logger.setOptions(options);
        (_this = this) == null ? void 0 : _this.emit(EVENTS.setLoggerOptions, options);
    };
    /**
   * 设置视频画面缩放模式
   * @since 1.0.1
   * @param {0 | 1 | 2} scaleMode - 缩放模式， 0: 窗口铺满， 1: 等比缩放大边铺满， 2: 等比缩放小边铺满
   */ _proto.setScaleMode = function setScaleMode(scaleMode) {
        if ([
            0,
            1,
            2
        ].includes(+scaleMode)) {
            var _this_contentControl_setScaleMode, _this_contentControl;
            this.scaleMode = +scaleMode;
            (_this_contentControl = this.contentControl) == null ? void 0 : (_this_contentControl_setScaleMode = _this_contentControl.setScaleMode) == null ? void 0 : _this_contentControl_setScaleMode.call(_this_contentControl, +scaleMode);
            var classList = this.$container.classList;
            for(var _iterator = _create_for_of_iterator_helper_loose(classList), _step; !(_step = _iterator()).done;){
                var item = _step.value;
                if (item.startsWith("" + PREFIX_CLASS + "-scale-mode-")) {
                    classList.remove(item);
                }
            }
            if (this.scaleMode === 0) {
                this.$container.classList.add("" + PREFIX_CLASS + "-scale-mode-full");
            } else if (this.scaleMode === 1) {
                this.$container.classList.add("" + PREFIX_CLASS + "-scale-mode-auto");
            } else if (this.scaleMode === 2) {
                this.$container.classList.add("" + PREFIX_CLASS + "-scale-mode-full-auto");
            }
        } else {
            var _this_logger;
            (_this_logger = this.logger) == null ? void 0 : _this_logger.warn('scaleMode must be 0 | 1 | 2');
        }
    };
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
   */ _proto.destroy = function destroy() {
        var _this = this;
        var _this_contentControl, _this_$container;
        if (!this.$container || this.destroyed) {
            // 防止多次销毁
            return;
        }
        this.emit(EVENTS.theme.beforeDestroy);
        this._removeEventListener();
        _unmountedControls(this);
        (_this_contentControl = this.contentControl) == null ? void 0 : _this_contentControl.destroy();
        this.contentControl = null;
        if (this._resizeOverflowTimer) {
            clearTimeout(this._resizeOverflowTimer);
            this._resizeOverflowTimer = null;
        }
        // 清除样式类名
        Array.from(((_this_$container = this.$container) == null ? void 0 : _this_$container.classList) || []).forEach(function(className) {
            var regex = new RegExp("^" + PREFIX_CLASS + "-", 'g');
            if (regex.test(className)) {
                _this.$container.classList.remove(className);
            }
        });
        this.$container.classList.remove("" + PREFIX_CLASS);
        this._themeData = null;
        if (this.i18n) this.i18n = null;
        this.recType = '';
        this.recMonth = []; // 清空数据
        this.emit(EVENTS.theme.destroyed);
        this.removeAllListeners();
        if (this.logger) this.logger = null;
        // 销毁后，将 destroyed 设置为 true
        this.destroyed = true;
    };
    // ==============================================================================================
    // 私有方法
    // ==============================================================================================
    /** 初始化配置项 */ _proto._initOptions = function _initOptions(options) {
        if (options === void 0) options = {};
        var _this_options_loggerOptions, _this_options_definitionOptions_list, _this_options_definitionOptions, _this_options_videoLevelList;
        this.options = deepmerge(THEME_DEFAULT_OPTIONS, options, {
            clone: false
        });
        // ⚠警告 （./utils/interactiveHF.ts）
        // PC 中窗口鼠标在header footer 移动（mousemove）, 不允许消失及不要冒泡
        // Mobile 中窗口点击在header footer 上（pointerdown/touchstart）, 不允许消失及不要冒泡
        if (typeof this.options.container === 'function') {
            this.$container = this.options.container();
        } else {
            this.$container = this.options.container;
        }
        if (!this.$container) throw new Error('container option is required!');
        if ([
            'VIDEO',
            'CANVAS'
        ].includes(this.$container.tagName)) {
            throw new Error('container node cannot be video or canvas!');
        }
        this.staticPath = this.options.staticPath;
        this.logger = Logger(_extends({}, this.options.loggerOptions || {}, {
            name: ((_this_options_loggerOptions = this.options.loggerOptions) == null ? void 0 : _this_options_loggerOptions.name) || this.options.type.toUpperCase()
        }));
        this.logger.log(navigator.userAgent || 'unknown');
        this.logger.log('[Theme Version] ', Theme.THEME_VERSION);
        if ('container' in this.options) {
            // JSON 不能序列化dom节点, 不要使用 this.options.container, 请使用 this.container
            delete this.options.container;
        }
        try {
            this.logger.log('[options] \n', JSON.stringify(this.options));
        } catch (error) {
            this.logger.log('[options] \n', this.options);
        }
        var language = this.options.language || 'zh';
        var locales = deepmerge({
            zh: zh,
            en: en
        }, this.options.locales || {}, {
            clone: false
        });
        // prettier-ignore
        this.i18n = new I18n(locales, {
            defaultLocale: language
        });
        // 默认清晰度列表
        if (((_this_options_definitionOptions = this.options.definitionOptions) == null ? void 0 : (_this_options_definitionOptions_list = _this_options_definitionOptions.list) == null ? void 0 : _this_options_definitionOptions_list.length) > 0 || ((_this_options_videoLevelList = this.options.videoLevelList) == null ? void 0 : _this_options_videoLevelList.length) > 0) {
            var _this_options_definitionOptions1;
            this.videoLevelList = ((_this_options_definitionOptions1 = this.options.definitionOptions) == null ? void 0 : _this_options_definitionOptions1.list) || this.options.videoLevelList;
        }
        this.setScaleMode(this.options.scaleMode);
    };
    /**
   * 初始化设置类名和设置宽高
   */ _proto._initClassName = function _initClassName() {
        var _this_options, _this_options1;
        // prettier-ignore
        this.$container.classList.add(PREFIX_CLASS, Utils.isMobile ? PREFIX_CLASS + "-mobile" : PREFIX_CLASS + "-pc");
        if ([
            'ezopen',
            'flv',
            'hls',
            'mp4'
        ].includes(this.options.type)) {
            this.$container.classList.add(PREFIX_CLASS + "-" + this.options.type);
        }
        if ([
            'en',
            'zh'
        ].includes(this.options.language || 'zh')) {
            this.$container.classList.add(PREFIX_CLASS + "-lang-" + (this.options.language || 'zh'));
        }
        if (typeof this.options.className === 'string') {
            this.$container.classList.add(this.options.className);
        }
        this.resize((_this_options = this.options) == null ? void 0 : _this_options.width, (_this_options1 = this.options) == null ? void 0 : _this_options1.height);
    };
    /**
   * 渲染主题
   * @param themeData - 主题数据
   * @returns
   */ _proto._renderTheme = function _renderTheme1(data) {
        return _async_to_generator(function() {
            return _ts_generator(this, function(_state) {
                _renderTheme(this, data);
                return [
                    2
                ];
            });
        }).call(this);
    };
    /**
   * 移动端resize 获取屏幕宽高(innerHeight 和 innerWidth)。
   *
   * 不做 dpr 的计算;
   * 不做 dpr 的计算;
   * 不做 dpr 的计算;
   */ _proto._mobileInnerWidthHeight = function _mobileInnerWidthHeight() {
        if (Utils.isMobile) {
            var // 这两个禁止自定义
            // prettier-ignore
            _this_$container_style, _this_$container, // prettier-ignore
            _this_$container_style1, _this_$container1;
            // WARN: meta 不要添加 viewport-fit=cover
            // 获取屏幕可视区域， 防止被窗口被覆盖
            var height = Math.floor(window.innerHeight);
            var width = Math.floor(window.innerWidth);
            (_this_$container = this.$container) == null ? void 0 : (_this_$container_style = _this_$container.style) == null ? void 0 : _this_$container_style.setProperty("--" + PREFIX_CLASS + "-mobile-inner-height", "" + height + "px");
            (_this_$container1 = this.$container) == null ? void 0 : (_this_$container_style1 = _this_$container1.style) == null ? void 0 : _this_$container_style1.setProperty("--" + PREFIX_CLASS + "-mobile-inner-width", "" + width + "px");
        }
    };
    /**
   * 添加事件监听 （全屏，旋转方向 ）
   */ _proto._addEventListener = function _addEventListener() {
        var _this = this;
        // ------------------------------  全屏 -----------------------------
        this._fullscreen = new Fullscreen$1(this.$container, {
            prefix: PREFIX_CLASS,
            // 全屏变化
            onChange: function(info) {
                if (info.isCurrentFullscreen) {
                    _this.emit(EVENTS.fullscreen);
                } else if (_this._isCurrentFullscreen) {
                    _this.emit(EVENTS.exitFullscreen);
                }
                _this._isCurrentFullscreen = info.isCurrentFullscreen;
                _this.emit(EVENTS.fullscreenChange, _extends({}, info, {
                    orientationAngle: _this._orientationAngle
                }));
                _this._isRotated();
                if (Utils.isMobile && !_this._isCurrentFullscreen) {
                    var _this_controls;
                    if ((_this_controls = _this.controls) == null ? void 0 : _this_controls.ptzControl) _this.controls.ptzControl.reset();
                }
            }
        });
        // ------------------------------  旋转方向 -----------------------------
        var rotateOrientation = function(orientation) {
            if (_this.$container) {
                var // 重置移除旋转角度
                _this_$container_classList;
                (_this_$container_classList = _this.$container.classList) == null ? void 0 : _this_$container_classList.remove("" + PREFIX_CLASS + "-angle-0", "" + PREFIX_CLASS + "-angle-90", "" + PREFIX_CLASS + "-angle-180", "" + PREFIX_CLASS + "-angle-270");
                // 屏幕旋转并是全屏的状态下
                // orientation.angle = 0 或 orientation.angle = 180  播放窗口旋转 90 度， 全屏充满
                // orientation.angle = 90 或 orientation.angle = 270 播放窗口旋转 0 度， 全屏充满
                switch(orientation.angle){
                    case 0:
                        _this.$container.classList.add("" + PREFIX_CLASS + "-angle-0");
                        break;
                    case 90:
                        _this.$container.classList.add("" + PREFIX_CLASS + "-angle-90");
                        break;
                    case 180:
                        _this.$container.classList.add("" + PREFIX_CLASS + "-angle-180");
                        break;
                    case 270:
                        _this.$container.classList.add("" + PREFIX_CLASS + "-angle-270");
                        break;
                }
                if (_this.orientationAngle !== orientation.angle) {
                    // 屏幕方向变换
                    _this.emit(EVENTS.orientationChange, orientation.angle);
                }
                _this._orientationAngle = orientation.angle;
                // 旋转过后获取可视内容区的高宽 （防止 window resize（已知 iPad Chrome 有这个问题） 可能获取的最终值不对， 需要旋转完成后再次获取一次）
                _this._mobileInnerWidthHeight();
                _this._isRotated();
            }
        };
        // 屏幕旋转方向
        // prettier-ignore
        var _Utils_orientationEventListener = Utils.orientationEventListener(rotateOrientation), orientation = _Utils_orientationEventListener[0], cleanupOrientation = _Utils_orientationEventListener[1];
        this._cleanupOrientation = cleanupOrientation;
        rotateOrientation(orientation);
        // 移动端resize 获取可视内容区的高宽(innerHeight 和 innerWidth)
        this._mobileInnerWidthHeight();
        window.addEventListener('resize', this._throttleMobileInnerWidthHeight);
        // ------------------------------  resize observer ----------------------------
        // prettier-ignore
        this._cleanUpResizeObserver = Utils.resizeObserver(this.$container, throttle(function() {
            var // 窗口尺寸变化时，设置窗口超出隐藏，防止出现滚动条
            _this_$container;
            // 全屏时 resize 会触发多次 只取整数
            // 这里不要使用 $containerWarp.getBoundingClientRect() 获取宽和高  因为会出现小数导致两次(设置后的值和设置后再次获取的值)的宽高不一致 (因为缩放后取整设置，再次获取还有可能是带小数的然后取整 对比两次不一致，一般在屏幕缩放百分比变化和浏览器页面缩放时出现)，致使一直触发 resize 事件
            var width = Math.floor(_this.$container.clientWidth);
            var height = Math.floor(_this.$container.clientHeight);
            if (width > 200 && width <= 375) {
                _this.$container.classList.add("" + PREFIX_CLASS + "-medium-width");
                _this.$container.classList.remove("" + PREFIX_CLASS + "-mini-width");
            } else {
                if (width <= 200) {
                    _this.$container.classList.add("" + PREFIX_CLASS + "-mini-width");
                } else {
                    _this.$container.classList.remove("" + PREFIX_CLASS + "-mini-width");
                }
                _this.$container.classList.remove("" + PREFIX_CLASS + "-medium-width");
            }
            if (height > 200 && height <= 375) {
                _this.$container.classList.add("" + PREFIX_CLASS + "-medium-height");
                _this.$container.classList.remove("" + PREFIX_CLASS + "-mini-height");
            } else {
                if (height <= 200) {
                    _this.$container.classList.add("" + PREFIX_CLASS + "-mini-height");
                } else {
                    _this.$container.classList.remove("" + PREFIX_CLASS + "-mini-height");
                }
                _this.$container.classList.remove("" + PREFIX_CLASS + "-medium-height");
            }
            //
            if (_this.width !== width || _this.height !== height) {
                var _this_controls;
                // prettier-ignore
                _this.emit(Theme.EVENTS.resize, {
                    width: width,
                    height: height,
                    isCurrentFullscreen: _this.isCurrentFullscreen,
                    orientationAngle: _this.orientationAngle
                });
                _this._width = width;
                _this._height = height;
                if ((_this_controls = _this.controls) == null ? void 0 : _this_controls.timeLineControl) {
                    _this.controls.timeLineControl.setWidth(width - 20 - DATE_PICKER_ICON_WIDTH);
                }
                // header 和 footer 使用防抖去实现， 避免频繁触发，
                _this._headerMoreControlShow();
                _this._footerMoreControlShow();
            }
            (_this_$container = _this.$container) == null ? void 0 : _this_$container.classList.add("" + PREFIX_CLASS + "-overflow-hidden");
            if (_this._resizeOverflowTimer) {
                clearTimeout(_this._resizeOverflowTimer);
                _this._resizeOverflowTimer = null;
            }
            // 窗口尺寸变化时，设置窗口超出隐藏，防止出现滚动条
            _this._resizeOverflowTimer = setTimeout(function() {
                var _this_$container;
                if (_this._resizeOverflowTimer) {
                    clearTimeout(_this._resizeOverflowTimer);
                    _this._resizeOverflowTimer = null;
                }
                (_this_$container = _this.$container) == null ? void 0 : _this_$container.classList.remove("" + PREFIX_CLASS + "-overflow-hidden");
            }, 200);
        }, 20));
        // dblClickFullscreen
        if (this.options.dblClickFullscreen && !Utils.isMobile) {
            // prettier-ignore
            this.$container.addEventListener('dblclick', this._onDblClickFullscreen);
        }
    };
    /**
   * 窗口尺寸变化判断头部是否需要隐藏控件展示在更多中
   * 尺寸变化结束时 进行判断，为了节省开销
   */ _proto._headerMoreControlShow = function _headerMoreControlShow() {
        var _this = this;
        if (this._header) {
            var _this__header_$left, _this__header, _this__header_$right, _this__header1;
            // 判断 header 的控件是否能放置的下， 否则隐藏暂时 more 按钮
            // prettier-ignore
            var leftWidth = ((_this__header = this._header) == null ? void 0 : (_this__header_$left = _this__header.$left) == null ? void 0 : _this__header_$left.clientWidth) || 0;
            // prettier-ignore
            var rightWidth = ((_this__header1 = this._header) == null ? void 0 : (_this__header_$right = _this__header1.$right) == null ? void 0 : _this__header_$right.clientWidth) || 0;
            // 当header 中 left 和 right 宽度之和大于 header 宽度，则 header more 显示
            // 如果 header more 存在，则偏移量量宽度为 150，否则为 100, 因为隐藏多个控件时 right 会变短
            var showHeaderMore = leftWidth + rightWidth + 30 > this._width;
            if (showHeaderMore) {
                var _this_controls;
                if (!this._headerMoreControl && ((_this_controls = this.controls) == null ? void 0 : _this_controls.recControl)) {
                    var _this_controls_recControl, _this_controls1;
                    this._headerMoreControl = new More({
                        language: this.options.language,
                        locales: this.i18n.translations,
                        rootContainer: this.$container,
                        getPopupContainer: function() {
                            var _this__header;
                            return (_this__header = _this._header) == null ? void 0 : _this__header.$right;
                        },
                        placement: 'br',
                        controls: this.controls,
                        open: false,
                        offset: [
                            0,
                            8
                        ],
                        wrapClassName: "" + PREFIX_CLASS + "-header-more",
                        onOpenChange: function(open) {
                            _this.emit(EVENTS.control.headerMorePanelOpenChange, open);
                        }
                    });
                    (_this_controls1 = this.controls) == null ? void 0 : (_this_controls_recControl = _this_controls1.recControl) == null ? void 0 : _this_controls_recControl.resetPopupContainer(this._headerMoreControl.$panel);
                }
                this.emit(Theme.EVENTS.control.headerMoreShowControlsChange, showHeaderMore);
            } else if (this._width - leftWidth - rightWidth > 100) {
                var _this_controls2;
                //
                if (this._headerMoreControl && ((_this_controls2 = this.controls) == null ? void 0 : _this_controls2.recControl)) {
                    var _this__header2, _this_controls_recControl1, _this_controls3, _this__headerMoreControl;
                    (_this_controls3 = this.controls) == null ? void 0 : (_this_controls_recControl1 = _this_controls3.recControl) == null ? void 0 : _this_controls_recControl1.resetPopupContainer((_this__header2 = this._header) == null ? void 0 : _this__header2.$right);
                    (_this__headerMoreControl = this._headerMoreControl) == null ? void 0 : _this__headerMoreControl.destroy();
                    this._headerMoreControl = null;
                    this.emit(Theme.EVENTS.control.headerMoreShowControlsChange, false);
                }
            }
        }
    };
    /**
   * 窗口尺寸变化判断底部是否需要隐藏控件展示在更多中（递归判断）
   * 尺寸变化结束时 进行判断，为了节省开销
   * @WARN：这里会闪一下， 原因：需要控件渲染后才知是否需要放置到 More 中，
   */ _proto._footerMoreControlShow = function _footerMoreControlShow() {
        var _this = this;
        var displayMore = function() {
            if (_this._footer) {
                var _this__footer_$left, _this__footer_$right;
                // 判断 footer 的控件是否能放置的下， 否则隐藏暂时 more 按钮
                var leftWidth = ((_this__footer_$left = _this._footer.$left) == null ? void 0 : _this__footer_$left.clientWidth) || 0;
                var rightWidth = ((_this__footer_$right = _this._footer.$right) == null ? void 0 : _this__footer_$right.clientWidth) || 0;
                // 当footer 中 left 和 right 宽度之和大于 footer 宽度，则 footer more 显示
                var collapseControl = leftWidth + rightWidth + 26 > _this._width; // 收拢控件到 More 中
                if (collapseControl) {
                    var _this__footer, _this__themeData_footer, _this__themeData, _this__footerMoreControl_list, _this__footerMoreControl, _this__footerMoreControl_list1, _this__footerMoreControl1;
                    if (!_this._footerMoreControl && ((_this__footer = _this._footer) == null ? void 0 : _this__footer.$right)) {
                        _this._footerMoreControl = new More({
                            language: _this.options.language,
                            locales: _this.i18n.translations,
                            rootContainer: _this.$container,
                            getPopupContainer: function() {
                                var _this__footer;
                                return (_this__footer = _this._footer) == null ? void 0 : _this__footer.$right;
                            },
                            placement: 'tr',
                            controls: _this.controls,
                            open: false,
                            offset: [
                                0,
                                -8
                            ],
                            wrapClassName: "" + PREFIX_CLASS + "-footer-more",
                            onOpenChange: function(open) {
                                _this.emit(EVENTS.control.footerMorePanelOpenChange, open);
                            }
                        });
                    }
                    //
                    var list = (((_this__themeData = _this._themeData) == null ? void 0 : (_this__themeData_footer = _this__themeData.footer) == null ? void 0 : _this__themeData_footer.btnList) || []).filter(function(item) {
                        var _this__footerMoreControl;
                        var index = (((_this__footerMoreControl = _this._footerMoreControl) == null ? void 0 : _this__footerMoreControl.list) || []).findIndex(function(item1) {
                            var _this_controls;
                            return item1.control === ((_this_controls = _this.controls) == null ? void 0 : _this_controls["" + item.iconId + "Control"]);
                        });
                        return index === -1;
                    });
                    if (list.length <= 0) {
                        return;
                    }
                    if (((_this__footerMoreControl = _this._footerMoreControl) == null ? void 0 : (_this__footerMoreControl_list = _this__footerMoreControl.list) == null ? void 0 : _this__footerMoreControl_list.length) === 0) {
                        // 为什么是两个， 因为More 也占用一个位置
                        var popList = [
                            list.pop(),
                            list.pop()
                        ];
                        for(var _iterator = _create_for_of_iterator_helper_loose(popList), _step; !(_step = _iterator()).done;){
                            var item = _step.value;
                            if (item) {
                                var _this_controls_key_resetPopupContainer, _this_controls_key, _this_controls, _this_controls1, _this__footerMoreControl2;
                                var key = "" + item.iconId + "Control";
                                (_this_controls = _this.controls) == null ? void 0 : (_this_controls_key = _this_controls[key]) == null ? void 0 : (_this_controls_key_resetPopupContainer = _this_controls_key.resetPopupContainer) == null ? void 0 : _this_controls_key_resetPopupContainer.call(_this_controls_key, _this._footerMoreControl.$panel, 'prepend');
                                (_this__footerMoreControl2 = _this._footerMoreControl) == null ? void 0 : _this__footerMoreControl2.add(key, item.part, (_this_controls1 = _this.controls) == null ? void 0 : _this_controls1[key]);
                            }
                        }
                    } else if (_this._footerMoreControl) {
                        var item1 = list.pop();
                        if (item1) {
                            var _this_controls_key_resetPopupContainer1, _this_controls_key1, _this_controls2, _this_controls3, _this__footerMoreControl3;
                            var key1 = "" + item1.iconId + "Control";
                            (_this_controls2 = _this.controls) == null ? void 0 : (_this_controls_key1 = _this_controls2[key1]) == null ? void 0 : (_this_controls_key_resetPopupContainer1 = _this_controls_key1.resetPopupContainer) == null ? void 0 : _this_controls_key_resetPopupContainer1.call(_this_controls_key1, _this._footerMoreControl.$panel, 'prepend');
                            (_this__footerMoreControl3 = _this._footerMoreControl) == null ? void 0 : _this__footerMoreControl3.add(key1, item1.part, (_this_controls3 = _this.controls) == null ? void 0 : _this_controls3[key1]);
                        } else {
                            return;
                        }
                    }
                    // prettier-ignore
                    _this.emit(Theme.EVENTS.control.footerMoreShowControlsChange, !!_this._footerMoreControl, (_this__footerMoreControl1 = _this._footerMoreControl) == null ? void 0 : (_this__footerMoreControl_list1 = _this__footerMoreControl1.list) == null ? void 0 : _this__footerMoreControl_list1.map(function(item) {
                        return item.key;
                    }));
                    if (_this._footerMoreControl) {
                        // 防止 More 不存在导致死循环
                        displayMore();
                    }
                } else if (_this._width - leftWidth - rightWidth > 110) {
                    var _this__footerMoreControl_list2, _this__footerMoreControl4;
                    // 110 是为了保住个别控件的宽度超出已知的值， 如英文下 按钮的宽度
                    // 从 More 中一次移除一个控件到 header/footer 中
                    if ((_this__footerMoreControl4 = _this._footerMoreControl) == null ? void 0 : (_this__footerMoreControl_list2 = _this__footerMoreControl4.list) == null ? void 0 : _this__footerMoreControl_list2.length) {
                        var _this__footerMoreControl5, _this__footerMoreControl_list3, _this__footerMoreControl6, _this__footerMoreControl_list4, _this__footerMoreControl7;
                        //
                        var item2 = (_this__footerMoreControl5 = _this._footerMoreControl) == null ? void 0 : _this__footerMoreControl5.list.shift();
                        if (item2) {
                            var _this__footerMoreControl8;
                            if (item2.part === 'left') {
                                var _item_control_resetPopupContainer, _item_control;
                                (_item_control = item2.control) == null ? void 0 : (_item_control_resetPopupContainer = _item_control.resetPopupContainer) == null ? void 0 : _item_control_resetPopupContainer.call(_item_control, _this._footer.$left, 'append');
                            } else if (item2.part === 'right') {
                                var _this__footerMoreControl_list5, _this__footerMoreControl9;
                                if (((_this__footerMoreControl9 = _this._footerMoreControl) == null ? void 0 : (_this__footerMoreControl_list5 = _this__footerMoreControl9.list) == null ? void 0 : _this__footerMoreControl_list5.length) === 0) {
                                    var _item_control_resetPopupContainer1, _item_control1;
                                    (_item_control1 = item2.control) == null ? void 0 : (_item_control_resetPopupContainer1 = _item_control1.resetPopupContainer) == null ? void 0 : _item_control_resetPopupContainer1.call(_item_control1, _this._footer.$right, 'append');
                                } else {
                                    var _item_control_resetPopupContainer2, _item_control2;
                                    (_item_control2 = item2.control) == null ? void 0 : (_item_control_resetPopupContainer2 = _item_control2.resetPopupContainer) == null ? void 0 : _item_control_resetPopupContainer2.call(_item_control2, _this._footer.$right, 'before', _this._footerMoreControl.$container);
                                }
                            }
                            (_this__footerMoreControl8 = _this._footerMoreControl) == null ? void 0 : _this__footerMoreControl8.remove(item2.control);
                        }
                        if (((_this__footerMoreControl6 = _this._footerMoreControl) == null ? void 0 : (_this__footerMoreControl_list3 = _this__footerMoreControl6.list) == null ? void 0 : _this__footerMoreControl_list3.length) === 1) {
                            var _this__footerMoreControl10, _this__footerMoreControl_destroy, _this__footerMoreControl11;
                            // 最后一个， 移除 More
                            var item11 = (_this__footerMoreControl10 = _this._footerMoreControl) == null ? void 0 : _this__footerMoreControl10.list.shift();
                            if (item11) {
                                var _this__footerMoreControl12;
                                if (item11.part === 'left') {
                                    var _item1_control_resetPopupContainer, _item1_control;
                                    (_item1_control = item11.control) == null ? void 0 : (_item1_control_resetPopupContainer = _item1_control.resetPopupContainer) == null ? void 0 : _item1_control_resetPopupContainer.call(_item1_control, _this._footer.$left, 'append');
                                } else if (item11.part === 'right') {
                                    var _item1_control_resetPopupContainer1, _item1_control1;
                                    (_item1_control1 = item11.control) == null ? void 0 : (_item1_control_resetPopupContainer1 = _item1_control1.resetPopupContainer) == null ? void 0 : _item1_control_resetPopupContainer1.call(_item1_control1, _this._footer.$right, 'append');
                                }
                                (_this__footerMoreControl12 = _this._footerMoreControl) == null ? void 0 : _this__footerMoreControl12.remove(item11.control);
                            }
                            (_this__footerMoreControl11 = _this._footerMoreControl) == null ? void 0 : (_this__footerMoreControl_destroy = _this__footerMoreControl11.destroy) == null ? void 0 : _this__footerMoreControl_destroy.call(_this__footerMoreControl11);
                            _this._footerMoreControl = null;
                        }
                        // prettier-ignore
                        _this.emit(Theme.EVENTS.control.footerMoreShowControlsChange, !!_this._footerMoreControl, (_this__footerMoreControl7 = _this._footerMoreControl) == null ? void 0 : (_this__footerMoreControl_list4 = _this__footerMoreControl7.list) == null ? void 0 : _this__footerMoreControl_list4.map(function(item) {
                            return item.key;
                        }));
                        displayMore();
                    }
                }
            }
        };
        displayMore();
    };
    /**
   * 移除事件
   */ _proto._removeEventListener = function _removeEventListener() {
        var _this__fullscreen, _this__cleanUpResizeObserver_unobserve, _this__cleanUpResizeObserver;
        if (this._isCurrentFullscreen) {
            var // 如果当前处于全屏状态，移除后需要退出全屏
            _this__fullscreen1;
            (_this__fullscreen1 = this._fullscreen) == null ? void 0 : _this__fullscreen1.exitFullscreen();
        }
        (_this__fullscreen = this._fullscreen) == null ? void 0 : _this__fullscreen.destroy();
        this._fullscreen = null;
        this._cleanupOrientation == null ? void 0 : this._cleanupOrientation.call(this);
        this._cleanupOrientation = null;
        (_this__cleanUpResizeObserver = this._cleanUpResizeObserver) == null ? void 0 : (_this__cleanUpResizeObserver_unobserve = _this__cleanUpResizeObserver.unobserve) == null ? void 0 : _this__cleanUpResizeObserver_unobserve.call(_this__cleanUpResizeObserver);
        this._cleanUpResizeObserver = null;
        window.removeEventListener('resize', this._throttleMobileInnerWidthHeight);
        this._throttleMobileInnerWidthHeight = null;
        // dblClickFullscreen
        if (this.options.dblClickFullscreen && !Utils.isMobile) {
            // prettier-ignore
            this.$container.removeEventListener('dblclick', this._onDblClickFullscreen);
        }
    };
    /**
   * 设置清晰度列表（临时方案，后期会有改动）
   */ _proto._setVideoLevelList = function _setVideoLevelList(list) {
        this.videoLevelList = list;
    };
    /**
   * 禁用按钮
   * @private
   */ _proto._disabled = function _disabled(disabled) {
        var _this = this;
        if (disabled === void 0) disabled = true;
        PAUSE_DISABLED_BTN.forEach(function(btn) {
            var _this_controls;
            if ((_this_controls = _this.controls) == null ? void 0 : _this_controls["" + btn + "Control"]) {
                _this.controls["" + btn + "Control"].disabled = disabled;
            }
        });
    };
    _proto._onDblClickFullscreen = function _onDblClickFullscreen() {
        if (this.isCurrentFullscreen) {
            this.exitFullscreen();
        } else {
            this.fullscreen();
        }
    };
    _proto._getRecType = function _getRecType(url) {
        if (this.options.type === 'ezopen' && /^ezopen:\/\//.test(url)) {
            var urlInfo = require$$1.parseEzopenUrl(url);
            if (urlInfo.type === 'rec') {
                var _urlInfo_searchParams;
                if (urlInfo.recType === 'cloud' && (urlInfo == null ? void 0 : (_urlInfo_searchParams = urlInfo.searchParams) == null ? void 0 : _urlInfo_searchParams.busType) === '7') {
                    this.recType = 'cloudRecord';
                    return 'cloudRecord';
                } else if (urlInfo.recType === 'cloud') {
                    this.recType = 'cloudRec';
                    return 'cloudRec';
                } else {
                    this.recType = 'rec';
                    return 'rec';
                }
            }
        }
        this.recType = '';
        return '';
    };
    _proto.resetControl = function resetControl() {
        var _this = this;
        if (this.zooming) {
            if (this.zoom !== 1) this.zoom = 1;
        }
        [
            'ptz',
            'talk',
            'record',
            'speed'
        ].forEach(function(key) {
            var _this_controls;
            if ((_this_controls = _this.controls) == null ? void 0 : _this_controls["" + key + "Control"]) {
                _this.controls["" + key + "Control"].reset();
            }
        });
    };
    /**
   * 窗口全屏后旋转 90度判断， 然后设置控件已经旋转 90度， 为了解决控件交互问题
   */ _proto._isRotated = function _isRotated() {
        if (Utils.isMobile) {
            if (this.isCurrentFullscreen && [
                0,
                180
            ].includes(this._orientationAngle)) {
                var _this_controls, _this_controls1;
                // 全屏后 dom 节点旋转了 90度
                if ((_this_controls = this.controls) == null ? void 0 : _this_controls.ptzControl) this.controls.ptzControl.isRotated = true;
                if ((_this_controls1 = this.controls) == null ? void 0 : _this_controls1.zoomControl) this.controls.zoomControl.isRotated = true;
            } else {
                var _this_controls2, _this_controls3;
                if ((_this_controls2 = this.controls) == null ? void 0 : _this_controls2.ptzControl) this.controls.ptzControl.isRotated = false;
                if ((_this_controls3 = this.controls) == null ? void 0 : _this_controls3.zoomControl) this.controls.zoomControl.isRotated = false;
            }
        }
    };
    _create_class(Theme, [
        {
            key: "width",
            get: /**
   * 容器的宽(单位 px)
   * ```ts
   * theme.width // number
   * ```
   */ function get() {
                return this._width;
            }
        },
        {
            key: "height",
            get: /**
   * 容器的高(单位 px)
   * ```ts
   * theme.height // number
   * ```
   */ function get() {
                return this._height;
            }
        },
        {
            key: "playing",
            get: /**
   * 当前播放状态
   * ```ts
   * theme.playing // boolean
   * ```
   */ function get() {
                return this._playing;
            },
            set: /**
   * 播放状态
   * ```ts
   * // 事件监听
   * theme.on(Theme.EVENTS.play, (playing: boolean) => {})
   * ```
   */ function set(playing) {
                var _this = this;
                if (this._playing !== playing) {
                    var _this_controls, _this__pauseControl_show, _this__pauseControl;
                    this._playing = playing;
                    if (!playing) {
                        this.loading = false;
                        [
                            'ptz',
                            'talk',
                            'record'
                        ].forEach(function(key) {
                            var _this_controls;
                            if ((_this_controls = _this.controls) == null ? void 0 : _this_controls["" + key + "Control"]) {
                                _this.controls["" + key + "Control"].reset();
                            }
                        });
                        this._disabled(true);
                    }
                    this.emit(EVENTS.play, playing);
                    if ((_this_controls = this.controls) == null ? void 0 : _this_controls.playControl) {
                        if (this.controls.playControl.playing !== playing) {
                            var _this_controls1;
                            (_this_controls1 = this.controls) == null ? void 0 : _this_controls1.playControl.emit(EVENTS.play, playing);
                        }
                    }
                    (_this__pauseControl = this._pauseControl) == null ? void 0 : (_this__pauseControl_show = _this__pauseControl.show) == null ? void 0 : _this__pauseControl_show.call(_this__pauseControl, playing);
                }
                if (this._playing) {
                    var _this_messageControl;
                    (_this_messageControl = this.messageControl) == null ? void 0 : _this_messageControl.hide();
                }
                if (!this._playing) {
                    var _this__interactiveResult_clearTimeout, _this__interactiveResult;
                    (_this__interactiveResult = this._interactiveResult) == null ? void 0 : (_this__interactiveResult_clearTimeout = _this__interactiveResult.clearTimeout) == null ? void 0 : _this__interactiveResult_clearTimeout.call(_this__interactiveResult);
                } else {
                    var _this__interactiveResult_setTimeoutShow, _this__interactiveResult1;
                    (_this__interactiveResult1 = this._interactiveResult) == null ? void 0 : (_this__interactiveResult_setTimeoutShow = _this__interactiveResult1.setTimeoutShow) == null ? void 0 : _this__interactiveResult_setTimeoutShow.call(_this__interactiveResult1);
                }
            }
        },
        {
            key: "loading",
            get: /**
   * 加载中
   * ```ts
   * theme.loading // boolean
   * ```
   */ function get() {
                return this._loading;
            },
            set: /**
   * 加载状态
   * ```ts
   * // 事件监听
   * theme.on(Theme.EVENTS.loading, (loading: boolean) => {})
   * ```
   */ function set(loading) {
                this._loading = loading;
                if (loading) {
                    var _this__loadingControl;
                    (_this__loadingControl = this._loadingControl) == null ? void 0 : _this__loadingControl.show();
                } else {
                    var _this__loadingControl1;
                    (_this__loadingControl1 = this._loadingControl) == null ? void 0 : _this__loadingControl1.hide();
                }
                if (this._loading !== loading) {
                    this.emit(EVENTS.loading, loading);
                }
            }
        },
        {
            key: "volume",
            get: /**
   * 音量值
   */ function get() {
                return this._volume;
            },
            set: /**
   * 音量值
   * ```ts
   * // 事件监听
   * theme.on(Theme.EVENTS.volumechange, (volume: number, muted: boolean) => {})
   * ```
   */ function set(volume) {
                if (volume >= 0 && volume <= 1) {
                    if (this._volume !== volume) {
                        var _this_controls;
                        this._volume = volume;
                        this.emit(EVENTS.volumechange, volume, this._muted);
                        // prettier-ignore
                        if ((_this_controls = this.controls) == null ? void 0 : _this_controls.volumeControl) {
                            var _this_controls_volumeControl, _this_controls1;
                            // 防止多次触发
                            if (((_this_controls1 = this.controls) == null ? void 0 : (_this_controls_volumeControl = _this_controls1.volumeControl) == null ? void 0 : _this_controls_volumeControl.volume) !== volume) {
                                // prettier-ignore
                                this.controls.volumeControl.emit(EVENTS.volumechange, volume, this._muted);
                            }
                        }
                    }
                }
            }
        },
        {
            key: "muted",
            get: /**
   * 静音
   *
   */ function get() {
                return this._muted;
            },
            set: /**
   * 静音
   * @example
   * ```ts
   * // 事件监听
   * theme.on(Theme.EVENTS.volumechange, (volume: number, muted: boolean) => {})
   * ```
   */ function set(muted) {
                if (this._muted !== muted) {
                    var _this_controls;
                    this._muted = muted;
                    this.emit(EVENTS.volumechange, this._volume, this._muted);
                    // 防止多次触发
                    // prettier-ignore
                    if ((_this_controls = this.controls) == null ? void 0 : _this_controls.volumeControl) {
                        var _this_controls_volumeControl, _this_controls1;
                        if (((_this_controls1 = this.controls) == null ? void 0 : (_this_controls_volumeControl = _this_controls1.volumeControl) == null ? void 0 : _this_controls_volumeControl.muted) !== muted) {
                            // prettier-ignore
                            this.controls.volumeControl.emit(EVENTS.volumechange, this._volume, muted);
                        }
                    }
                }
            }
        },
        {
            key: "zooming",
            get: /**
   * 是否在缩放中
   */ function get() {
                return this._zooming;
            },
            set: /**
   * 是否在缩放中
   */ function set(zooming) {
                if (this._zooming !== zooming) {
                    this._zooming = zooming;
                    this.emit(EVENTS.zoomingChange, zooming);
                    if (this.zoomUtil) {
                        if (zooming) {
                            var _this_zoomUtil_setUpEventListeners, _this_zoomUtil, _this_zoomUtil_setAllowZoom, _this_zoomUtil1;
                            (_this_zoomUtil = this.zoomUtil) == null ? void 0 : (_this_zoomUtil_setUpEventListeners = _this_zoomUtil.setUpEventListeners) == null ? void 0 : _this_zoomUtil_setUpEventListeners.call(_this_zoomUtil);
                            (_this_zoomUtil1 = this.zoomUtil) == null ? void 0 : (_this_zoomUtil_setAllowZoom = _this_zoomUtil1.setAllowZoom) == null ? void 0 : _this_zoomUtil_setAllowZoom.call(_this_zoomUtil1, true);
                        } else {
                            var _this_zoomUtil_reset, _this_zoomUtil2, _this_zoomUtil_removeEventListeners, _this_zoomUtil3, _this_zoomUtil_setAllowZoom1, _this_zoomUtil4;
                            (_this_zoomUtil2 = this.zoomUtil) == null ? void 0 : (_this_zoomUtil_reset = _this_zoomUtil2.reset) == null ? void 0 : _this_zoomUtil_reset.call(_this_zoomUtil2);
                            (_this_zoomUtil3 = this.zoomUtil) == null ? void 0 : (_this_zoomUtil_removeEventListeners = _this_zoomUtil3.removeEventListeners) == null ? void 0 : _this_zoomUtil_removeEventListeners.call(_this_zoomUtil3);
                            (_this_zoomUtil4 = this.zoomUtil) == null ? void 0 : (_this_zoomUtil_setAllowZoom1 = _this_zoomUtil4.setAllowZoom) == null ? void 0 : _this_zoomUtil_setAllowZoom1.call(_this_zoomUtil4, false);
                        }
                    }
                }
            }
        },
        {
            key: "zoom",
            get: /**
   * 电子放大倍数， 仅 ezopen 支持
   * @since 0.0.1
   * @example
   * ```ts
   * theme.zoom // 放大倍数
   * // 事件监听
   * theme.on(Theme.EVENTS.zoom, (zoom: number) => {})
   * ```
   */ function get() {
                return this._zoom;
            },
            set: /**
   * 电子放大倍数，最多保留一位小数 (需要 zooming = true 才能进行缩放)
   * @example
   * ```ts
   * theme.zoom = 2 // 放大倍数
   * theme.zoom = 2.5 // 放大倍数
   * // 事件监听
   * theme.on(Theme.EVENTS.zoomChange, (zoom: number) => {})
   * ```
   */ function set(zoom) {
                var _this_options_zoomOptions;
                if (!this._zooming) {
                    var _this_messageControl_info, _this_messageControl, _this_logger;
                    (_this_messageControl = this.messageControl) == null ? void 0 : (_this_messageControl_info = _this_messageControl.info) == null ? void 0 : _this_messageControl_info.call(_this_messageControl, this.i18n.t('ZOOM_NOT_ENABLED'));
                    (_this_logger = this.logger) == null ? void 0 : _this_logger.warn(this.i18n.t('ZOOM_NOT_ENABLED'));
                    return;
                }
                zoom = +zoom.toFixed(1);
                var _this_options_zoomOptions_max;
                var ZOOM_MAX = (_this_options_zoomOptions_max = (_this_options_zoomOptions = this.options.zoomOptions) == null ? void 0 : _this_options_zoomOptions.max) != null ? _this_options_zoomOptions_max : ZOOM_DEFAULT_OPTIONS.max;
                if (zoom > ZOOM_MAX) {
                    var _this_messageControl_info1, _this_messageControl1, _this_logger1;
                    (_this_messageControl1 = this.messageControl) == null ? void 0 : (_this_messageControl_info1 = _this_messageControl1.info) == null ? void 0 : _this_messageControl_info1.call(_this_messageControl1, this.i18n.t('ZOOM_LIMIT_MAX', {
                        zoom: ZOOM_MAX
                    }));
                    (_this_logger1 = this.logger) == null ? void 0 : _this_logger1.warn(this.i18n.t('ZOOM_LIMIT_MAX', {
                        zoom: ZOOM_MAX
                    }));
                    return;
                }
                if (zoom < 1) {
                    var _this_messageControl_info2, _this_messageControl2, _this_logger2;
                    (_this_messageControl2 = this.messageControl) == null ? void 0 : (_this_messageControl_info2 = _this_messageControl2.info) == null ? void 0 : _this_messageControl_info2.call(_this_messageControl2, this.i18n.t('ZOOM_LIMIT_MIN', {
                        zoom: '1'
                    }));
                    (_this_logger2 = this.logger) == null ? void 0 : _this_logger2.warn(this.i18n.t('ZOOM_LIMIT_MIN', {
                        zoom: '1'
                    }));
                    return;
                }
                if (zoom === ZOOM_MAX) {
                    var _this_messageControl_info3, _this_messageControl3;
                    (_this_messageControl3 = this.messageControl) == null ? void 0 : (_this_messageControl_info3 = _this_messageControl3.info) == null ? void 0 : _this_messageControl_info3.call(_this_messageControl3, this.i18n.t('ZOOM_ADD_MAX', {
                        zoom: ZOOM_MAX
                    }));
                } else if (zoom === 1) {
                    var _this_messageControl_info4, _this_messageControl4;
                    (_this_messageControl4 = this.messageControl) == null ? void 0 : (_this_messageControl_info4 = _this_messageControl4.info) == null ? void 0 : _this_messageControl_info4.call(_this_messageControl4, this.i18n.t('ZOOM_SUB_MIN', {
                        zoom: 1
                    }));
                }
                if (zoom !== this._zoom) {
                    var _this_zoomUtil_setZoom, _this_zoomUtil, _this;
                    this._zoom = zoom;
                    this.emit(EVENTS.zoomChange, zoom);
                    (_this = this) == null ? void 0 : (_this_zoomUtil = _this.zoomUtil) == null ? void 0 : (_this_zoomUtil_setZoom = _this_zoomUtil.setZoom) == null ? void 0 : _this_zoomUtil_setZoom.call(_this_zoomUtil, zoom);
                }
            }
        },
        {
            key: "talking",
            get: /**
   * 对讲中
   */ function get() {
                return this._talking;
            }
        },
        {
            key: "speed",
            get: function get() {
                return this._speed;
            },
            set: /**
   * 倍速
   */ function set(speed) {
                speed = +speed;
                if (speed !== this._speed) {
                    this._speed = speed;
                    this.emit(EVENTS.speedChange, speed);
                }
            }
        },
        {
            key: "talkGain",
            get: /**
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
   */ function get() {
                var _this_controls_talkControl, _this_controls;
                if ((_this_controls = this.controls) == null ? void 0 : (_this_controls_talkControl = _this_controls.talkControl) == null ? void 0 : _this_controls_talkControl.active) {
                    var _this_controls1;
                    return ((_this_controls1 = this.controls) == null ? void 0 : _this_controls1.talkControl).value;
                }
                return null;
            }
        },
        {
            key: "recording",
            get: /**
   * 录制中， 仅 ezopen 支持
   * @since 0.0.1
   */ function get() {
                return this._recording;
            }
        },
        {
            key: "ptzing",
            get: /**
   * 云台开启中
   */ function get() {
                var _this_controls_ptzControl, _this_controls;
                return (_this_controls = this.controls) == null ? void 0 : (_this_controls_ptzControl = _this_controls.ptzControl) == null ? void 0 : _this_controls_ptzControl.active;
            }
        },
        {
            key: "videoLevelAuto",
            get: /**
   * 清晰度自动
   */ function get() {
                return this._videoLevelAuto;
            }
        },
        {
            key: "isCurrentFullscreen",
            get: /**
   * 当前容器的全屏状态  true: 全屏， false: 非全屏 ， 如果想获取当前浏览器是否全屏，请使用 document.fullscreenElement 判断
   * @since 0.0.1
   * @example
   * ```ts
   * theme.isCurrentFullscreen // 当前容器的全屏状态
   * ```
   */ function get() {
                return this._isCurrentFullscreen;
            }
        },
        {
            key: "orientationAngle",
            get: /**
   * 屏幕旋转角度(0 | 90 | 180 | 270)
   * @example
   * ```ts
   * theme.orientationAngle // 0 | 90 | 180 | 270
   * // 事件监听
   * theme.on(Theme.EVENTS.orientationChange, (angle: 0 | 90 | 180 | 270) => {})
   * ```
   */ function get() {
                return this._orientationAngle;
            }
        },
        {
            key: "hasHeaderMoreControl",
            get: /**
   * 主题Header中展示更多按钮控件
   * @since 0.0.1
   * @example
   * ```ts
   * theme.hasHeaderMoreControl // boolean
   * ```
   */ function get() {
                return !!this._headerMoreControl;
            }
        },
        {
            key: "hasFooterMoreControl",
            get: /**
   * 主题Footer中展示更多按钮控件
   * @since 0.0.1
   * @example
   * ```ts
   * theme.hasFooterMoreControl // boolean
   * ```
   */ function get() {
                return !!this._footerMoreControl;
            }
        }
    ]);
    return Theme;
}(EventEmitter);
/** 所有私有流的模板 @since 0.0.1 */ Theme.TEMPLATES = TEMPLATES;
/** 事件名称 @since 0.0.1 */ Theme.EVENTS = EVENTS;
/** 语言包 @since 0.0.1 */ Theme.LOCALES = {
    zh: zh,
    en: en
};
/** 版本号 @since 0.0.1 */ Theme.THEME_VERSION = '2.1.0-beta.3';

exports.Control = Control;
exports.EVENTS = EVENTS;
exports.Fullscreen = Fullscreen;
exports.Loading = Loading;
exports.Message = Message;
exports.Play = Play;
exports.Poster = Poster;
exports.Rec = Rec;
exports.Theme = Theme;
exports.Utils = Utils;
exports.Volume = Volume;
