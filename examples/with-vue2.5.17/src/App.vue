<template>
  <div id="app">
    <TimeLine />
    <Theme />
  </div>
</template>

<script>
import TimeLine from './components/index.vue';
import Theme from './components/theme.vue';

export default {
  name: 'app',
  components: {
    TimeLine,
    Theme
  },
};
</script>
<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
  height: 150vh;
}
</style>
