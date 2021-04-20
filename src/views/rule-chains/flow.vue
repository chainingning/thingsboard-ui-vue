<template>
  <div class="app-container">
    <node-tree :ruleChainsTypes="ruleChainsTypes" @dragstart="dragstart"></node-tree>
    <flow-chart
      ref="ruleChainFlowChart"
      :dropRuleChainsNode="dropRuleChainsNode"
      :dropRuleChainsNodeMousePosition="dropRuleChainsNodeMousePosition"
      :ruleChainsFlowChartData="ruleChainsFlowChartData"
      :ruleChainsNodeData="ruleChainsNodeData"
      @reRender="initEditorData"
      v-loading="loading">
    </flow-chart>
  </div>
</template>

<script>
import NodeTree from './node-tree'
import FlowChart from './flow-chart'
import { ellipsis } from '@/utils'
export default {
  props: ['id'],
  components: { NodeTree, FlowChart },
  data () {
    return {
      ruleChainsTypes: {
        FILTER: { title: '过滤器', color: '#FBDBF2', labelColor: '#E951BF', list: [] },
        ENRICHMENT: { title: '属性集', color: '#DBE1FB', labelColor: '#516FE9', list: [] },
        TRANSFORMATION: { title: '变换', color: '#FFEBDC', labelColor: '#FF9E58', list: [] },
        ACTION: { title: '动作', color: '#CAF0EA', labelColor: '#00B69B', list: [] },
        EXTERNAL: { title: '外部的', color: '#FBD6D3', labelColor: '#EF3826', list: [] },
        RULECHAIN: { title: '规则链', color: '#DFD3FB', labelColor: '#6226EF', list: [] }
      },
      ruleChainsNodeData: [],
      ruleChainsFlowChartData: [],
      dropRuleChainsNode: '',
      dropRuleChainsNodeMousePosition: null,
      loading: false
    }
  },
  methods: {
    dragstart (event) {
      this.dropRuleChainsNode = event.toElement || event.srcElement
      this.dropRuleChainsNodeMousePosition = {
        x: event.offsetX,
        y: event.offsetY
      }
    },
    async getRuleChainsNodeData () {
      const res = await this.$api.getComponents('FILTER,ENRICHMENT,TRANSFORMATION,ACTION,EXTERNAL')
      this.ruleChainsNodeData = res.data
      res.data.forEach(item => {
        this.ruleChainsTypes[item.type].list.push(item)
      })
      this.ruleChainsTypes.RULECHAIN.list = [{
        type: 'RULECHAIN',
        id: 'RULECHAIN',
        name: 'rule chain'
      }]
      for (const key in this.ruleChainsTypes) {
        this.ruleChainsTypes[key].list = this.ruleChainsTypes[key].list.sort((a, b) => a.name.localeCompare(b.name))
      }
      this.initEditorData()
    },
    async initEditorData (type) {
      this.loading = true
      const res = await this.$api.getRuleChainMetadata(this.id)
      const { nodes, connections, ruleChainConnections } = res.data
      this.ruleChainsFlowChartData = {
        ...res.data,
        nodes: nodes || [],
        connections: connections || [],
        ruleChainConnections: ruleChainConnections || []
      }
      const _nodes = [
        ...res.data.nodes.map(ele => Object.assign({
          id: ele.id.id,
          x: ele.additionalInfo.layoutX,
          y: ele.additionalInfo.layoutY,
          style: {
            fill: this.ruleChainsTypes[this.ruleChainsNodeData.filter(item => item.clazz === ele.type)[0].type].color
          },
          size: '172*44',
          shape: 'custom-rect',
          label: {
            text: `${this.ruleChainsNodeData.filter(item => item.clazz === ele.type)[0].name}\n${ellipsis(ele.name)}`,
            fill: this.ruleChainsTypes[this.ruleChainsNodeData.filter(item => item.clazz === ele.type)[0].type].labelColor
          },
          lifeState: ele.lifeState,
          debugMode: ele.debugMode
        })),
        {
          id: 'input',
          x: 150,
          y: 150,
          style: {
            fill: '#a3eaa9'
          },
          size: '172*44',
          shape: 'root-rect',
          label: {
            text: 'Input',
            fill: '#444'
          }
        }
      ]
      const edgesIndex = {}
      res.data.connections && res.data.connections.forEach((ele, index) => {
        const isHasOwnProperty = Object.prototype.hasOwnProperty.call(edgesIndex, `${ele.fromIndex}-${ele.toIndex}`)
        edgesIndex[`${ele.fromIndex}-${ele.toIndex}`] = isHasOwnProperty ? `${edgesIndex[`${ele.fromIndex}-${ele.toIndex}`]} / ${ele.type}` : ele.type
      })
      const edges = []
      for (const key in edgesIndex) {
        edges.push({
          source: res.data.nodes[key.split('-')[0]].id.id,
          target: res.data.nodes[key.split('-')[1]].id.id,
          controlPoints: [{
            x: 100,
            y: 100
          }],
          label: edgesIndex[key],
          sourceAnchor: 1,
          targetAnchor: 3,
          style: {
            stroke: '#79838e'
          },
          labelRectStyle: {
            fill: '#fff',
            stroke: '#003a79',
            radius: 4,
            lineWidth: 2
          }
        })
      }
      const rulechain = {}
      const ruleChainNodeIdList = []
      res.data.ruleChainConnections && res.data.ruleChainConnections.forEach(item => {
        const key = `${item.fromIndex}-${item.targetRuleChainId.id}`
        const isHasOwnProperty = Object.prototype.hasOwnProperty.call(rulechain, key)
        rulechain[key] = isHasOwnProperty ? { ...item, type: `${rulechain[key].type} / ${item.type}` } : item
      })
      for (const key in rulechain) {
        const value = rulechain[key]
        let info = null
        try {
          info = await this.$api.getRuleChainsInfo(value.targetRuleChainId.id)
        } catch (error) {}
        edges.push({
          source: nodes[value.fromIndex].id.id,
          target: value.additionalInfo.ruleChainNodeId,
          controlPoints: [{
            x: 10,
            y: 10
          }],
          label: value.type,
          sourceAnchor: 1,
          targetAnchor: 3,
          style: {
            stroke: '#79838e'
          },
          labelRectStyle: {
            fill: '#fff',
            stroke: '#003a79',
            radius: 4,
            lineWidth: 2
          }
        })
        if (!ruleChainNodeIdList.includes(value.additionalInfo.ruleChainNodeId)) {
          _nodes.push({
            id: value.additionalInfo.ruleChainNodeId,
            x: value.additionalInfo.layoutX,
            y: value.additionalInfo.layoutY,
            style: {
              fill: info ? this.ruleChainsTypes.RULECHAIN.color : '#ED0D0D'
            },
            size: '172*44',
            shape: 'custom-rect',
            label: {
              text: `rule chain\n${info ? ellipsis(info.data.name) : '无法解析目标节点'}`,
              fill: this.ruleChainsTypes.RULECHAIN.labelColor
            },
            nodeType: 'RULECHAIN'
          })
          ruleChainNodeIdList.push(value.additionalInfo.ruleChainNodeId)
        }
      }
      if (res.data.firstNodeIndex !== null) {
        edges.push({
          source: 'input',
          target: nodes[res.data.firstNodeIndex].id.id,
          controlPoints: [{
            x: 10,
            y: 10
          }],
          sourceAnchor: 1,
          targetAnchor: 3,
          style: {
            stroke: '#79838e'
          },
          labelRectStyle: {
            fill: '#fff',
            stroke: '#003a79',
            radius: 4,
            lineWidth: 2
          }
        })
      }
      this.reRender({
        nodes: _nodes,
        edges
      })
      this.loading = false
    },
    reRender (data) {
      this.$refs.ruleChainFlowChart.reRender(data)
    }
  },
  async created () {
    this.loading = true
    await this.getRuleChainsNodeData()
    this.loading = false
  },
  beforeRouteLeave (to, from, next) {
    if (this.$refs.ruleChainFlowChart.getShowSave()) {
      this.$confirm('您有未保存的更改。确定要离开此页面吗', '未保存的更改', {
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }).then(_ => {
        next()
      }).catch(_ => {})
    } else {
      next()
    }
  },
  mounted () {
    if (window.history && window.history.pushState) {
      history.pushState(null, null, document.URL)
      window.addEventListener('popstate', () => {
        history.pushState(null, null, document.URL)
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.app-container {
  width: 100%;
  height: 100%;
  background-color: transparent;
  margin: 0;
  position: relative;
  border: none !important;
}
</style>
