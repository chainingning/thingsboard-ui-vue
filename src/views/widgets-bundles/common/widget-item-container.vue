<template>
  <transition name="dialog-fade">
    <div class="widget-item-container">
      <div class="header-container">
        <h3 class="title">{{ title }}</h3>
        <slot name="header-right"></slot>
      </div>
      <div class="render-component-container">
        <slot name="render-component"></slot>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  props: {
    title: {
      required: true
    }
  }
}
</script>

<style lang="scss" scoped>
  $widget-item-container-height: 400px;
  $header-container-height: 50px;
  .widget-item-container {
    border: 1px solid #EBEEF5;
    border-radius: 10px;
    box-shadow: 0 2px 12px 0 rgba(172, 75, 75, 0.1);
    height: $widget-item-container-height;
    min-width: 50px;
    min-height: 50px;
    margin-right: 20px;
    background-color: #fff;
    padding: 10px 20px 20px 20px;
    .header-container {
      height: $header-container-height;
      display: flex;
      justify-content: space-between;
      h3 {
        width: 200px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        line-height: $header-container-height;
      }
      /deep/ i {
        font-size: 20px;
        line-height: $header-container-height;
        margin-left: 10px;
        cursor: pointer;
        &:first-child {
          margin-left: 0;
        }
      }
    }
    .render-component-container {
      height: calc(100% - #{$header-container-height});
      overflow: auto;
      > div {
        height: 100%;
      }
    }
  }
</style>
