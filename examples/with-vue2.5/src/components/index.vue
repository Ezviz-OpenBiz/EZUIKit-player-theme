<template>
  <div style="padding-top: 100px">
    <div id="mobile-time-line"></div>
  </div>
</template>

<script>
import '@ezuikit/control-time-line/dist/style/style.css';
import { MobileTimeLine } from '@ezuikit/control-time-line';

let mobileTimeLine;

export default {
  name: 'TimeLine',
  mounted: () => {
    if (mobileTimeLine) {
      mobileTimeLine.destroy();
      mobileTimeLine = null;
    }

    mobileTimeLine = new MobileTimeLine(document.getElementById('mobile-time-line'), {
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
      width: '100%',
      timeWidth: 0,
      language: 'zh',
      onPickerOpenChange: function (open) {
        console.log('onPickerOpenChange', open);
      },
      onPickerSelect: function (item) {
        console.log('onPickerSelect', item);
      },
      onChange: function (current) {
        console.warn('onChange', current);
        // timeLine.update(current.getTime());
      },
      onDragStart: function (current) {
        console.log('onDragStart', current);
      },
      onDragging: function (current) {
        console.log('onDragging', current);
      },
      onDragEnd: function (current) {
        console.log('onDragEnd', current);
      },
    });

    // mobileTimeLine.updateTimeSections(DATA);
  },
  methods: {},
};
</script>
