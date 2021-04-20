<template>
  <div class="app-container">
    <el-form class="filter-container-form" size="medium" ref="form" :model="form" :rules="rules">
      <el-form-item label="基本URL" prop="baseUrl">
        <el-input placeholder="请输入基本URL" v-model="form.baseUrl"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="save()">保存</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
export default {
  data () {
    return {
      form: {
        baseUrl: ''
      },
      rules: {
        baseUrl: [{ required: true, message: '基本URL不能为空', trigger: 'change' }]
      },
      info: {}
    }
  },
  methods: {
    save () {
      this.$refs.form.validate(async valid => {
        if (!valid) return false
        const params = {
          ...this.info,
          jsonValue: {
            ...this.info.jsonValue,
            baseUrl: this.form.baseUrl
          }
        }
        await this.$api.postAdminSettings(params)
        this.$message.success('保存成功')
      })
    },
    async init () {
      const result = await this.$api.getAdminSettingsGeneral()
      this.info = result.data
      const { baseUrl } = result.data.jsonValue || {}
      this.form.baseUrl = baseUrl
    }
  },
  created () {
    this.init()
  }
}
</script>

<style lang="scss" scoped>
.app-container {
  overflow: scroll;
  /deep/ .filter-container-form {
    padding: 32px 30px;
    .el-form-item {
      margin-bottom: 31px;
      margin-right: 77px;
      .el-form-item__label {
        font-size: 14px;
        color: #000;
        line-height: 20px;
        padding: 0;
        margin-bottom: 13px;
      }
      .el-input__inner {
        width: 252px;
        background-color:#F5F6FA;
        color: #1C1C1C;
        font-family: PingFangSC-Medium;
        border: none;
      }
      input::-webkit-input-placeholder {
        color: #A6A6A6;
      }
      input::-moz-input-placeholder {
        color: #A6A6A6;
      }
      input::-ms-input-placeholder {
        color:#A6A6A6;
      }
    }
  }
}
</style>
