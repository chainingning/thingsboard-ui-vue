<template>
  <div class="help-container">
    <div v-html="description"></div>
    <br>
    <div v-html="details"></div>
  </div>
</template>

<script>
export default {
  name: 'Help',
  props: ['configurationDescriptor'],
  data () {
    return {
      description: '',
      details: ''
    }
  },
  methods: {
    init () {
      const { description, details } = this.configurationDescriptor.nodeDefinition || {}
      this.description = description
      this.details = details
    }
  },
  created () {
    this.init()
  }
}
</script>
