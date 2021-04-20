<template>
  <div class="details-container">
    <div class="button-container">
      <wx-button v-if="info.additionalInfo ? info.additionalInfo.userCredentialsEnabled === false : true" type="warning" @click="disableUser(true)">启用用户账户</wx-button>
      <wx-button v-if="info.additionalInfo && info.additionalInfo.userCredentialsEnabled !== false" type="warning" @click="disableUser(false)">禁用用户账户</wx-button>
      <wx-button type="warning" @click="showActiveLink">显示激活链接</wx-button>
      <wx-button type="warning" @click="sendEmail">重新发送激活</wx-button>
      <wx-button type="warning" @click="login">以用户身份登录</wx-button>
      <wx-button type="warning" @click="del">删除用户</wx-button>
    </div>
    <el-form ref="form" :model="form" :rules="formRules">
      <el-form-item label="电子邮件" prop="email">
        <el-input v-model="form.email"></el-input>
      </el-form-item>
      <el-form-item label="名字" prop="firstName">
        <el-input v-model="form.firstName"></el-input>
      </el-form-item>
      <el-form-item label="姓" prop="lastName">
        <el-input v-model="form.lastName"></el-input>
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input type="textarea" autosize v-model="form.description"></el-input>
      </el-form-item>
      <el-form-item>
        <wx-button type="primary" @click="submit">修改</wx-button>
      </el-form-item>
    </el-form>
    <icloud-dialog
      :visible.sync="visible"
      title="用户激活链接">
      <div class="link">
        <span>使用该链接<el-button type="text" class="active" @click="active">激活</el-button>激活用户</span>
      </div>
      <div class="link-address">
        <code>{{ link }}</code>
      </div>
    </icloud-dialog>
  </div>
</template>

<script>
import { setToken } from '@/utils/token'
export default {
  props: ['adminId', 'info'],
  data () {
    return {
      form: {
        email: '',
        firstName: '',
        lastName: '',
        description: ''
      },
      formRules: {
        email: [
          { required: true, message: '电子邮件必填', trigger: ['blur', 'change'] },
          { type: 'email', message: '请输入正确的电子邮件地址', trigger: 'change' }
        ]
      },
      link: '',
      visible: false
    }
  },
  methods: {
    active () {
      if (this.link) {
        const activateToken = this.link.split('?')[1].split('=')[1]
        window.open(`${this.$ip('BASE_URL')}/#/login/createPassword?activateToken=${activateToken}`)
      }
    },
    async login () {
      try {
        const result = await this.$api.getToken(this.info.id.id)
        setToken(result.data.token, result.data.refreshToken)
        const userInfo = await this.$api.getUserInfo(this.info.id.id)
        this.$store.commit('SET_USER_INFO', userInfo.data)
        this.$store.commit('SET_PERMISSION_ROUTER', userInfo.data.authority)
        this.$router.push({ path: '/home' })
      } catch (error) {
        this.$router.push({ path: '/login' })
      }
    },
    del () {
      this.$confirm('小心！确认后,账户和所有相关数据将不可恢复。', `您确定要删除账户 '${this.info.name}' 吗？`, {
        confirmButtonText: '是',
        cancelButtonText: '否',
        type: 'warning'
      }).then(async _ => {
        try {
          await this.$api.deleteUser(this.info.id.id)
          this.$message.success('删除成功')
          this.$router.push({ path: `/tenants/${this.$route.params.tenantId}/admins` })
        } catch (error) {
          this.$message.error(error.response.data.message)
        }
      }).catch(() => {})
    },
    async disableUser (userCredentialsEnabled) {
      const userId = this.info.id.id
      try {
        await this.$api.postUserCredentialsEnabled(userId, userCredentialsEnabled)
        this.$message.success(userCredentialsEnabled ? '用户已启用' : '用户已禁用')
        this.$emit('submit')
      } catch (error) {
        this.$message.error(error.response.data.message)
      }
    },
    async showActiveLink () {
      try {
        const result = await this.$api.getUserActivationLink(this.info.id.id)
        this.link = result.data
        this.visible = true
        this.$emit('submit')
      } catch (error) {
        this.$message.error(error.response.data.message)
      }
    },
    async sendEmail () {
      try {
        await this.$api.postSendActivationMail(this.info.email)
        this.$message.success('激活电子邮件已成功发送')
        this.$emit('submit')
      } catch (error) {
        this.$message.error(error.response.data.message)
      }
    },
    submit () {
      this.$refs.form.validate(async valid => {
        if (!valid) return false
        const params = {
          ...this.info,
          ...this.form,
          additionalInfo: {
            ...this.info.additionalInfo,
            description: this.form.description
          }
        }
        try {
          await this.$api.postUserSendActivationMail(params, false)
          this.$message.success('修改成功')
          this.$router.push({ path: `/tenants/${this.$route.params.tenantId}/admins/${this.adminId}?title=${this.form.email}` })
        } catch (error) {
          this.$message.error(error.response.data.message)
        }
      })
    },
    init () {
      for (const key in this.form) {
        this.form[key] = key === 'description' ? this.info.additionalInfo.description : this.info[key]
      }
    }
  },
  created () {
    this.init()
  },
  watch: {
    info: {
      deep: true,
      handler () {
        this.init()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.active {
  font-size: 20px;
  padding: 0 5px;
}
.link {
  font-size: 20px;
  color: rgba(0, 0, 0, 0.87);
}
.link-address {
  code {
    margin: 20px 0;
    padding: 15px;
    display: inline-block;
    line-height: 1;
    color: #303030;
    font-size: 16px;
    font-family: monospace;
    font-weight: 700;
    background-color: #f7f7f7;
  }
  .el-button {
    margin-left: 10px;
  }
}
</style>
