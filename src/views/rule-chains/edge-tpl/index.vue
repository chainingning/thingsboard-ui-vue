<template>
  <icloud-dialog :title="title" :visible.sync="visible" @close="close">
    <el-form ref="form" :model="form" :rules="rules">
      <el-form-item prop="link">
        <el-select
          v-model="form.link"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="Link labels">
          <el-option
            v-for="item in linkList"
            :key="item.value"
            :label="item.label"
            :value="item.value">
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <div slot="footer" class="icloud-dialog-footer">
      <wx-button type="primary" @click="submit">确定</wx-button>
      <wx-button @click="close">取消</wx-button>
    </div>
  </icloud-dialog>
</template>

<script>
export default {
  data () {
    return {
      visible: false,
      linkList: [],
      form: {
        link: []
      },
      rules: {
        link: [{ required: true, message: '链接不能为空', trigger: 'change' }]
      },
      title: ''
    }
  },
  methods: {
    submit () {
      this.$refs.form.validate(valid => {
        if (!valid) return false
        this.$emit('submit', this.form)
        this.visible = false
      })
    },
    openDialog ({ link = [], linkList = [] }) {
      this.visible = true
      this.title = link.length ? '修改链接' : '添加链接'
      this.form.link = link
      this.linkList = linkList.map(ele => {
        return {
          label: ele,
          value: ele
        }
      })
    },
    close () {
      this.visible = false
      if (this.title === '添加链接') {
        this.$emit('cancel')
      }
    }
  }
}
</script>
