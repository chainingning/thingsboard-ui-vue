<template>
  <icloud-dialog
    :title="title"
    :width="isTplType ? '800px' : '1400px'"
    :visible.sync="visible"
    class="node-tpl-dialog">
    <el-tabs type="border-card">
      <el-tab-pane label="详情">
        <component
          ref="comp"
          :is="compName"
          :nodeInfo="nodeInfo"
          :configurationDescriptor="configurationDescriptor"
          @submit="save" />
      </el-tab-pane>
      <el-tab-pane label="事件" v-if="isEvent">
        <event :nodeInfo="nodeInfo" />
      </el-tab-pane>
      <el-tab-pane label="帮助">
        <help :configurationDescriptor="configurationDescriptor" />
      </el-tab-pane>
    </el-tabs>
    <div slot="footer" class="icloud-dialog-footer">
      <wx-button type="primary" @click="submit">确定</wx-button>
      <wx-button @click="visible = false">取消</wx-button>
    </div>
  </icloud-dialog>
</template>

<script>
import ruleChainsTypes from './rule-chains-types.json'
const importComponentsName = {}
const requireComponents = require.context('./', true, /\.vue/)
requireComponents.keys().forEach(fileName => {
  const reqCom = requireComponents(fileName)
  if (reqCom.default && reqCom.default.name) {
    importComponentsName[reqCom.default.name] = reqCom.default
  }
})

export default {
  components: {
    ...importComponentsName
  },
  props: ['ruleChainsNodeData'],
  data () {
    return {
      visible: false,
      compName: '',
      title: '',
      nodeInfo: {},
      configurationDescriptor: {},
      isTplType: false,
      isEvent: false
    }
  },
  methods: {
    openDialog ({ nodeTpl, nodeInfo = {}, configurationDescriptor }) {
      if (Object.prototype.hasOwnProperty.call(ruleChainsTypes, nodeTpl)) {
        this.nodeInfo = nodeInfo || {}
        this.isTplType = Object.is(JSON.stringify(this.nodeInfo), '{}')
        this.visible = true
        const itemInfo = this.ruleChainsNodeData.filter(item => nodeTpl === item.clazz)
        const name = itemInfo.length ? itemInfo[0].name : 'rule chain'
        this.title = (Object.is(JSON.stringify(nodeInfo), '{}') ? '添加规则节点' : '修改规则节点') + `(${name})`
        this.compName = ruleChainsTypes[nodeTpl]
        this.configurationDescriptor = configurationDescriptor
        if (!this.isTplType) {
          this.isEvent = this.nodeInfo.id && this.nodeInfo.id.entityType
        } else {
          this.isEvent = false
        }
      }
      if (nodeTpl === 'RULECHAIN') {
        this.configurationDescriptor = {
          ...this.configurationDescriptor,
          nodeDefinition: {
            ...this.configurationDescriptor.nodeDefinition,
            description: '将传入消息转发到指定的规则链',
            details: ''
          }
        }
      }
    },
    submit () {
      this.$refs.comp.submit()
    },
    save (form) {
      this.visible = false
      this.$emit('submit', form)
    }
  }
}
</script>

<style lang="scss" scoped>
  .node-tpl-dialog {
    /deep/ .icloud-dialog {
      height: calc(100% - 200px);
    }
    /deep/ .icloud-dialog__header {
      border-bottom: none;
    }
    /deep/ .icloud-dialog__footer {
      border-top: none;
    }
    /deep/ .icloud-dialog__body {
      padding: 0 30px 24px 30px;
      height: calc(100% - 174px);
      .el-tabs {
        border: 1px solid #D5D5D5;
        .el-tab-pane {
          &:first-child {
            .el-form {
              // width: 570px;
              .name-container {
                @include clearfix();
                .el-form-item {
                  float: left;
                  &:nth-of-type(1) {
                    width: 440px;
                  }
                  &:nth-of-type(2) {
                    margin-left: 10px;
                    margin-top: 35px;
                  }
                }
              }
              .relation-container {
                @include clearfix();
                .el-form-item {
                  float: left;
                  &:nth-of-type(1) {
                    width: 80px;
                  }
                  &:nth-of-type(2) {
                    margin-left: 20px;
                    width: 300px;
                  }
                }
              }
              .type-container {
                @include clearfix();
                .el-form-item {
                  float: left;
                  &:nth-of-type(1) {
                    width: 150px;
                  }
                  &:nth-of-type(2) {
                    margin-left: 20px;
                    width: calc(100% - 170px);
                  }
                }
              }
              .time-container, .circle-container {
                @include clearfix();
                .el-form-item {
                  float: left;
                  width: calc((100% - 10px) / 2);
                  margin-right: 10px;
                  &:nth-child(even) {
                    margin-right: 0;
                  }
                }
              }
              .desc {
                font-size: 12px;
                color: #808080;
              }
            }
          }
        }
      }
    }
    &.is-hidden {
      /deep/ .icloud-dialog__header {
        border-bottom: 1px solid #D5D5D5;
      }
      /deep/ .icloud-dialog__footer {
        border-top: 1px solid #D5D5D5;
      }
      /deep/ .el-tabs {
        border: none;
        box-shadow: none;
        .el-tabs__header {
          display: none;
        }
      }
    }
  }
</style>
