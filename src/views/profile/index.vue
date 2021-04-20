<template>
  <div class="app-container">
    <el-form class="filter-container-form" ref="form" label-position="top" size="medium" :inline="true" :model="form" :rules="rules">
      <div class="title">个人信息</div>
      <el-form-item label="电子邮件" prop="email">
        <el-input v-model="form.email"></el-input>
      </el-form-item>
      <el-form-item label="名字" prop="firstName">
        <el-input v-model="form.firstName"></el-input>
      </el-form-item>
      <el-form-item label="姓" prop="lastName">
        <el-input v-model="form.lastName"></el-input>
      </el-form-item>
      <el-form-item label="语言" prop="additionalInfo.lang">
        <el-select v-model="form.additionalInfo.lang">
          <el-option label="汉语" value="zh_CN"></el-option>
        </el-select>
      </el-form-item>
      <br>
      <el-form-item>
        <el-button type="primary" @click="openDialog('updateKey')">更改证书Key</el-button>
        <el-button type="primary" @click="openDialog('updatePass')">更改密码</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </el-form-item>
    </el-form>
    <icloud-dialog :title="title" :visible.sync="visible">
      <el-form v-if="formType === 'updatePass'" ref="dialogForm" :model="updatePass" :rules="updatePassRules">
        <el-form-item label="当前密码" prop="currentPassword">
          <el-input type="password" auto-complete="new-password" v-model="updatePass.currentPassword"></el-input>
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input type="password" auto-complete="new-password" v-model="updatePass.newPassword"></el-input>
        </el-form-item>
        <el-form-item label="再次输入新密码" prop="checkNewPassword">
          <el-input type="password" auto-complete="new-password" v-model="updatePass.checkNewPassword"></el-input>
        </el-form-item>
      </el-form>
      <el-form v-else ref="dialogForm" :model="updateKey" :rules="updateKeyRules" @submit.native.prevent>
        <el-form-item label="新证书Key" prop="certKey">
          <el-input v-model="updateKey.certKey"></el-input>
        </el-form-item>
      </el-form>
      <div class="icloud-dialog-footer" slot="footer">
        <wx-button type="primary" @click="submit">{{ formType === 'updatePass' ? '更改密码' : '更新证书' }}</wx-button>
        <wx-button @click="visible = false">取消</wx-button>
      </div>
    </icloud-dialog>
  </div>
</template>

<script>
export default {
  data () {
    const newPassword = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请输入密码'))
      } else {
        if (this.updatePass.checkNewPassword !== '') {
          this.$refs.dialogForm.validateField('checkNewPassword')
        }
        callback()
      }
    }
    const checkNewPassword = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请再次输入密码'))
      } else if (value !== this.updatePass.newPassword) {
        callback(new Error('两次输入密码不一致!'))
      } else {
        callback()
      }
    }
    return {
      form: {
        email: '',
        firstName: '',
        lastName: '',
        additionalInfo: {
          lang: ''
        }
      },
      rules: {
        email: [
          { required: true, message: '邮箱不能为空', trigger: 'change' },
          { type: 'email', message: '电子邮件格式不正确', trigger: 'change' }
        ]
      },
      info: {},
      visible: false,
      title: '',
      formType: '',
      updatePass: {
        currentPassword: '',
        newPassword: '',
        checkNewPassword: ''
      },
      updatePassRules: {
        currentPassword: [{ required: true, message: '当前密码不能为空', trigger: 'change' }],
        newPassword: { required: true, validator: newPassword, trigger: 'change' },
        checkNewPassword: { required: true, validator: checkNewPassword, trigger: 'change' }
      },
      updateKey: {
        certKey: ''
      },
      updateKeyRules: {
        certKey: { required: true, message: '新证书不能为空', trigger: 'change' }
      }
    }
  },
  methods: {
    openDialog (formType) {
      this.formType = formType
      this.title = formType === 'updatePass' ? '更改密码' : '更改证书Key'
      this.visible = true
    },
    submit () {
      this.$refs.dialogForm.validate(async valid => {
        if (!valid) return false
        if (this.formType === 'updatePass') {
          await this.$api.postChangePassword({
            currentPassword: this.updatePass.currentPassword,
            newPassword: this.updatePass.newPassword
          })
        } else {
          await this.$api.postChangeCertKey(this.updateKey)
        }
        this.$message.success('修改成功')
        this.visible = false
      })
    },
    save () {
      this.$refs.form.validate(async valid => {
        if (!valid) return false
        const params = {
          ...this.info,
          ...this.form,
          additionalInfo: {
            ...this.info.additionalInfo,
            ...this.form.additionalInfo
          }
        }
        const result = await this.$api.postUser(params)
        this.$store.commit('SET_USER_INFO', result.data)
        this.$message.success('保存成功')
      })
    },
    async init () {
      const result = await this.$api.getUserInfo(this.$store.getters.userInfo.id.id)
      this.info = result.data
      for (const key in this.form) {
        if (key === 'additionalInfo') {
          for (const _key in this.form[key]) {
            this.form[key][_key] = this.info[key][_key] || 'zh_CN'
          }
        } else {
          this.form[key] = this.info[key]
        }
      }
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
  margin: 20px 0;
  height: calc(100% - 40px) !important;
  /deep/ .filter-container-form {
    padding: 32px 30px;
    .title {
      font-size: 20px;
      color: #000;
      font-family: PingFangSC-Medium;
      line-height: 28px;
      margin-bottom: 34px;
    }
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
