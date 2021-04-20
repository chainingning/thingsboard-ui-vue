<template>
  <div class="app-container">
    <el-button class="run" type="primary" :disabled="loading" @click="render" size="mini">run</el-button>
    <el-tabs type="border-card">
      <el-tab-pane label="HTML">
        <Editor
          language="html"
          :codes="htmlCodes"
          @onMounted="htmlOnMounted"
          @onCodeChange="htmlOnCodeChange" />
      </el-tab-pane>
    </el-tabs>
    <el-tabs type="border-card">
      <el-tab-pane label="CSS">
        <Editor
          language="scss"
          :codes="cssCodes"
          @onMounted="cssOnMounted"
          @onCodeChange="cssOnCodeChange" />
      </el-tab-pane>
    </el-tabs>
    <el-tabs type="border-card">
      <el-tab-pane label="JAVASCRIPT">
        <Editor
          language="javascript"
          :codes="javascriptCodes"
          @onMounted="javascriptOnMounted"
          @onCodeChange="javascriptOnCodeChange" />
      </el-tab-pane>
    </el-tabs>
    <el-tabs type="border-card">
      <el-tab-pane
        label="视图"
        v-loading="loading">
        <div ref="renderContainer" class="render-editor-container"></div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import Editor from '@/components/Editor'
import render from './render'
export default {
  components: { Editor },
  mixins: [render],
  data () {
    return {
      htmlCodes: `<div>
    <el-input v-model="value"></el-input>
    {{ value }}
    <el-button @click="click">点击</el-button>
    {{ changeValue }}
</div>`,
      javascriptCodes: `{
  data () {
      return {
          value: '',
          changeValue: ''
      }
  },
  methods: {
      click () {
          this.changeValue = this.value
      }
  }
}`,
      cssCodes: '',
      htmlEditor: null,
      jsEditor: null,
      cssEditor: null
    }
  },
  methods: {
    htmlOnMounted (edit) {
      this.htmlEditor = edit
    },
    cssOnMounted (edit) {
      this.cssEditor = edit
    },
    javascriptOnMounted (edit) {
      this.jsEditor = edit
    },
    htmlOnCodeChange (value) {
      this.htmlCodes = value
    },
    cssOnCodeChange (value) {
      this.cssCodes = value
    },
    javascriptOnCodeChange (value) {
      this.javascriptCodes = value
    }
  },
  mounted () {
    this.render()
  }
}
</script>

<style lang="scss" scoped>
.app-container {
  position: relative;
  > .run {
    position: absolute;
    right: 10px;
    top: -34px;
  }
  /deep/ .el-tabs {
    width: calc(50% - 10px);
    height: calc(50% - 10px);
    margin: 5px;
    float: left;
    .el-tabs__content {
      height: calc(100% - 39px);
      padding: 0;
      .el-tab-pane {
        height: 100%;
      }
    }
  }
}
</style>
