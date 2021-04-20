<template>
  <icloud-dialog class="test-script-dialog" :title="title" :visible.sync="visible" isFullscreen :isDrag="false">
    <el-tabs type="border-card">
      <el-form class="msgForm" ref="msgForm" :model="msgForm" :rules="msgRules">
        <el-form-item label="消息类型" prop="msgType">
          <el-select v-model="msgForm.msgType">
            <el-option
              v-for="item in msgForm.msgTypeList"
              :key="item.value"
              :label="item.label"
              :value="item.value"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div class="desc">消息</div>
      <editor
        class="json-editor"
        language="json"
        :codes="msgForm.msg"
        @onCodeChange="$value => msgForm.msg = $value" />
    </el-tabs>
    <el-tabs type="border-card">
      <div class="desc">元数据</div>
      <el-form class="metaForm" ref="metaForm" :model="metaForm" :inline="true">
        <div v-for="(item, index) in metaForm.metaData" :key="index">
          <el-form-item
            v-for="(row, key) in item"
            :key="`metaData.${index}.${key}`"
            :prop="`metaData.${index}.${key}`"
            :rules="{
              required: true, message: `${key === 'key' ? '键名' : '值'}不能为空`, trigger: 'change'
            }">
            <el-input :placeholder="key === 'key' ? '键名' : '值'" v-model="item[key]"></el-input>
          </el-form-item>
          <i class="el-icon-delete" type="danger" @click="removeMetaData(index)"></i>
        </div>
        <el-button type="primary" size="medium" @click="addMetaData">添加</el-button>
      </el-form>
    </el-tabs>
    <el-tabs type="border-card">
      <div class="desc">function {{msgForm.funName}}(msg, metadata, msgType) {</div>
      <editor
        class="js-editor"
        language="javascript"
        :codes="msgForm.script"
        @onCodeChange="$value => msgForm.script = $value" />
      <div class="desc">}</div>
    </el-tabs>
    <el-tabs type="border-card">
      <div class="desc">输出</div>
      <editor
        ref="outputEditor"
        class="output-editor"
        language="javascript"
        readOnly />
    </el-tabs>
    <div class="test-btn">
      <el-button size="mini" type="primary" @click="submit">测试</el-button>
      <el-button size="mini" @click="visible = false">取消</el-button>
      <el-button size="mini" type="primary">保存</el-button>
    </div>
  </icloud-dialog>
</template>

<script>
import Editor from '@/components/Editor'
export default {
  components: { Editor },
  props: ['title'],
  data () {
    return {
      visible: false,
      msgForm: {
        msgType: 'POST_ATTRIBUTES_REQUEST',
        msgTypeList: [
          { label: 'Post attributes', value: 'POST_ATTRIBUTES_REQUEST' },
          { label: 'Post telemetry', value: 'POST_TELEMETRY_REQUEST' },
          { label: 'RPC Request from Device', value: 'TO_SERVER_RPC_REQUEST' },
          { label: 'RPC Request to Device', value: 'RPC_CALL_FROM_SERVER_TO_DEVICE' },
          { label: 'Activity Event', value: 'ACTIVITY_EVENT' },
          { label: 'Inactivity Event', value: 'INACTIVITY_EVENT' },
          { label: 'Connect Event', value: 'CONNECT_EVENT' },
          { label: 'Disconnect Event', value: 'DISCONNECT_EVENT' },
          { label: 'Entity Created', value: 'ENTITY_CREATED' },
          { label: 'Entity Updated', value: 'ENTITY_UPDATED' },
          { label: 'Entity Deleted', value: 'ENTITY_DELETED' },
          { label: 'Entity Assigned', value: 'ENTITY_ASSIGNED' },
          { label: 'Entity Unassigned', value: 'ENTITY_UNASSIGNED' },
          { label: 'Attributes Updated', value: 'ATTRIBUTES_UPDATED' },
          { label: 'Attributes Deleted', value: 'ATTRIBUTES_DELETED' }
        ],
        msg: '',
        script: '',
        scriptType: '',
        funName: ''
      },
      msgRules: {
        msgType: [{ required: true, message: '消息类型不能为空', trigger: 'change' }]
      },
      metaForm: {
        metaData: []
      }
    }
  },
  methods: {
    submit () {
      this.$refs.msgForm.validate(valid => {
        if (!valid) return false
        this.$refs.metaForm.validate(async v => {
          if (!v) return false
          const metadata = {}
          this.metaForm.metaData.forEach(item => {
            metadata[item.key] = item.value
          })
          const params = {
            argNames: ['msg', 'metadata', 'msgType'],
            scriptType: this.msgForm.scriptType,
            msgType: this.msgForm.msgType,
            msg: this.msgForm.msg,
            metadata,
            script: this.msgForm.script
          }
          try {
            const result = await this.$api.postRuleChainTestScript(params)
            this.msgForm.output = result.data.output
            if (result.data.error) {
              this.$message({
                type: 'error',
                message: result.data.error,
                duration: 0,
                showClose: true
              })
            }
            this.$refs.outputEditor.setValue(result.data.output)
          } catch (error) {
            this.$message.error(error.response.data.message)
          }
        })
      })
    },
    addMetaData () {
      this.metaForm.metaData.push({
        key: '',
        value: ''
      })
    },
    removeMetaData (index) {
      this.metaForm.metaData.splice(index, 1)
    },
    openDialog (params) {
      this.visible = true
      const { msg, script, metaData, scriptType, funName } = params
      this.msgForm.msg = msg
      this.msgForm.script = script
      this.msgForm.scriptType = scriptType
      this.msgForm.funName = funName
      this.metaForm.metaData = metaData
    }
  }
}
</script>

<style lang="scss" scoped>
  .test-script-dialog {
    /deep/ .icloud-dialog {
      .icloud-dialog__body {
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;
        .el-tabs {
          width: calc(50% - 5px);
          height: calc(50% - 5px - 20px);
          .el-tabs__header {
            display: none;
          }
          .el-tabs__content {
            height: 100%;
            .msgForm {
              width: 250px;
            }
            .metaForm {
              .el-form-item {
                width: 46%;
                margin-bottom: 20px;
                .el-form-item__content {
                  width: 100%;
                }
              }
              .el-icon-delete {
                color: #f56c6c;
                margin-top: 8px;
                cursor: pointer;
              }
            }
            .desc {
              font-size: 12px;
              color: #808080;
              margin: 5px 0;
            }
            .json-editor {
              height: 250px;
            }
            .js-editor, .output-editor {
              height: 300px;
            }
            .editor-container {
              .overflow-guard {
                border-radius: 4px;
                border: 1px solid #DCDFE6;
              }
            }
          }
          &:nth-child(2) {
            .el-tabs__content {
              overflow: auto;
            }
          }
        }
        .test-btn {
          width: 100%;
          .el-button {
            &:nth-child(2), &:nth-child(3) {
              float: right;
              margin-left: 10px;
            }
          }
        }
      }
    }
  }
</style>
