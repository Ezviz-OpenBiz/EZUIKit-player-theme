import { useEffect, useRef } from 'react';
import '@ezuikit/control-time-line/dist/style/style.css';
import { MobileTimeLine } from '@ezuikit/control-time-line';
// 录像片段示例数据（如需展示，传入下方 timeSections 或调用 updateTimeSections）
// import DATA from './data.js';

/**
 * 移动端时间轴控件示例
 *
 * `MobileTimeLine` 接收 (element, options)，销毁时调用 `destroy()`。
 */
export default function TimeLine() {
  const containerRef = useRef(null);
  const timeLineRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return undefined;

    const mobileTimeLine = new MobileTimeLine(containerRef.current, {
      height: 350,
      width: '100%',
      current: new Date(),
      // timeSections: DATA,
      currentTimeBgColor: 'red',
      currentTimeColor: '#ffffff',
      language: 'zh',
      readOnly: false,
      showTimeWidthBtn: true,
      timeAxisBgColor: '#bdcdff',
      timePointColor: '#648ffc',
      timeSectionColor: '#369fff',
      timeTextColor: '#666666',
      timeWidth: 0,
      onPickerOpenChange: (open) => {
        console.log('onPickerOpenChange', open);
      },
      onPickerSelect: (item) => {
        console.log('onPickerSelect', item);
      },
      onChange: (current) => {
        console.warn('onChange', current);
      },
      onDragStart: (current) => {
        console.log('onDragStart', current);
      },
      onDragging: (current) => {
        console.log('onDragging', current);
      },
      onDragEnd: (current) => {
        console.log('onDragEnd', current);
      },
    });

    timeLineRef.current = mobileTimeLine;
    // mobileTimeLine.updateTimeSections(DATA);

    return () => {
      mobileTimeLine.destroy();
      timeLineRef.current = null;
    };
  }, []);

  return (
    <div style={{ paddingTop: 24 }}>
      <div id="mobile-time-line" ref={containerRef}></div>
    </div>
  );
}
