<template>
  <transition name="dialog-fade">
    <div class="icloud-dialog__wrapper" v-icloudDialogDrag="{isDrag}" v-if="visible">
      <div class="icloud-dialog" :class="isFullscreen ? 'is-fullscreen' : ''" ref="icloudDialog" :style="{ width, minWidth: width }" >
        <div class="icloud-dialog__header" ref="icloudDialogHeader">
          <span class="icloud-dialog__title">{{ title }}</span>
          <button type="button" class="icloud-dialog__headerbtn" @click="handleClose">
            <i class="icloud-dialog__close el-icon el-icon-close"></i>
          </button>
        </div>
        <div class="icloud-dialog__body" :class="$slots.footer ? '' : 'is-active'" ref="icloudDialogBody" :style="icloudDialogBodyStyle">
          <slot></slot>
        </div>
        <div v-if="$slots.footer" class="icloud-dialog__footer" ref="icloudDialogFooter">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'IcloudDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    },
    width: {
      type: String,
      default: '600px'
    },
    isFullscreen: {
      type: Boolean,
      default: false
    },
    isDrag: {
      type: Boolean,
      default: true
    }
  },
  data () {
    return {
      icloudDialogBodyStyle: {}
    }
  },
  methods: {
    handleClose () {
      this.$emit('update:visible', false)
      this.$emit('close')
    },
    init () {
      const clientHeight = document.documentElement.clientHeight || document.body.clientHeight
      const icloudDialogHeaderHeight = this.$refs.icloudDialogHeader.offsetHeight
      const icloudDialogFooterHeight = (this.$refs.icloudDialogFooter && this.$refs.icloudDialogFooter.offsetHeight) || 0
      const maxHeight = clientHeight - icloudDialogHeaderHeight - icloudDialogFooterHeight - 100
      if (this.isFullscreen) {
        this.icloudDialogBodyStyle.height = clientHeight - icloudDialogHeaderHeight - icloudDialogFooterHeight + 'px'
        this.icloudDialogBodyStyle = {
          height: maxHeight + 100 + 'px',
          maxHeight: maxHeight + 100 + 'px'
        }
      } else {
        this.icloudDialogBodyStyle = {
          maxHeight: maxHeight + 'px'
        }
      }
    }
  },
  watch: {
    visible (n, o) {
      if (n) {
        this.$nextTick(() => {
          this.init()
        })
        document.body.appendChild(this.$el)
      }
    }
  }
}
</script>

<style lang="scss" scope>
  .icloud-dialog__wrapper {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 1000;
    background-color: rgba(29, 29, 29, 0.27);
    display: flex;
    justify-content: center;
    align-items: center;
    overflow-x: auto;
    .icloud-dialog {
      position: relative;
      box-shadow: 0px 13px 61px 0px rgba(169, 169, 169, 0.37);
      .icloud-dialog__header {
        height: 77px;
        width: 100%;
        background-color: #fff;
        border-bottom: 1px solid #D5D5D5;
        border-radius: 18px 18px 0 0;
        .icloud-dialog__title {
          position: relative;
          display: inline-block;
          line-height: 30px;
          margin-top: 29px;
          font-size: 22px;
          font-family: PingFangSC-Medium;
          font-weight: bolder;
          color: #000;
          overflow: hidden;
          &:first-child {
            margin-left: 29px;
          }
          &.btn {
            cursor: pointer;
          }
        }
        .icloud-dialog__headerbtn {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background-color: #6993FF;
          position: absolute;
          right: 21px;
          top: 24px;
          cursor: pointer;
          .icloud-dialog__close {
            color: #fff;
            font-size: 18px;
            font-weight: bolder;
          }
        }
      }
      .icloud-dialog__body {
        width: 100%;
        padding: 30px 30px 39px 30px;
        background-color: #fff;
        overflow-y: auto;
        .el-form {
          @extend %el-form;
        }
        &.is-active {
          border-radius: 0 0 18px 18px;
        }
      }
      .icloud-dialog__footer {
        width: 100%;
        height: 97px;
        background-color: #fff;
        border-top: 1px solid #D5D5D5;
        border-radius: 0 0 18px 18px;
        .icloud-dialog-footer {
          height: 100%;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          .wx-button {
            margin-right: 19px;
            &:last-of-type {
              margin-right: 47px;
            }
          }
        }
      }
      &.is-fullscreen {
        width: 100% !important;
        height: 100%;
        .icloud-dialog__header {
          border-radius: 0;
        }
        .icloud-dialog__body {
          padding: 10px;
           border-radius: 0;
        }
        .icloud-dialog__footer {
          border-radius: 0;
        }
      }
    }
  }
</style>
