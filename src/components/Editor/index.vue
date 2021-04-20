<template>
  <div class="editor-container" ref="editor"></div>
</template>

<script>
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js'
export default {
  name: 'Editor',
  props: {
    language: {
      type: String,
      default: 'html'
    },
    codes: {
      type: String,
      default: ''
    },
    readOnly: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      monacoEditor: null
    }
  },
  methods: {
    initEditor () {
      this.monacoEditor = monaco.editor.create(this.$refs.editor, {
        language: this.language,
        theme: 'vs',
        value: this.codes,
        readOnly: this.readOnly
      })
      this.$emit('onMounted', this.monacoEditor)
      this.monacoEditor.onDidChangeModelContent(evt => {
        this.$emit('onCodeChange', this.monacoEditor.getValue(), this.monacoEditor)
      })
    },
    setValue (value) {
      this.monacoEditor.setValue(value)
    }
  },
  mounted () {
    this.$nextTick(() => {
      this.initEditor()
    })
  },
  beforeDestroy () {
    this.monacoEditor = null
  }
}
</script>

<style lang="scss" scoped>
.editor-container {
  height: 100%;
  min-height: 200px;
}
</style>
