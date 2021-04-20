<template>
  <div class="rule-chain-flow-chart-container" v-loading="loading">
    <div class="flow" ref="flow"
      @dragover="$event => $event.preventDefault()"
      @dragenter="$event => $event.preventDefault()"
      @drop="drop">
    </div>
    <div class="contextmenu" ref="contextmenu"
      style="position: absolute; z-index: 2;">
      <div data-status="node-selected" class="menu" style="display: none;">
        <ul>
          <li v-if="showNodeEdit" @click="clickContextmenu('node-copy')">复制</li>
          <li v-if="showNodeEdit" @click="clickContextmenu('node-edit')">修改</li>
          <li v-if="showNodeDelete" @click="clickContextmenu('node-delete')">删除</li>
        </ul>
      </div>
      <div data-status="edge-selected" class="menu" style="display: none;">
        <ul>
          <li v-if="showEdgeEdit" @click="clickContextmenu('edge-edit')">修改</li>
          <li @click="clickContextmenu('edge-delete')">删除</li>
        </ul>
      </div>
    </div>
    <div class="paste" style="position: absolute; z-index: 2;" :style="style">
      <ul>
        <li @click="paste">粘贴</li>
      </ul>
    </div>
    <node-tpl ref="ruleChainsTpl" @submit="nodeSubmit" :ruleChainsNodeData="ruleChainsNodeData"></node-tpl>
    <edge-tpl ref="edgeTpl" @submit="edgeSubmit" @cancel="edgeCancel"></edge-tpl>
    <div class="btn-icon">
      <wx-button :style="{opacity: showRestart ? 1 : 0.3}" title="重启选中节点" type="primary" icon="iconzhongqi" circle @click="restart"></wx-button>
      <wx-button :style="{opacity: showSave ? 1 : 0.3}" title="撤销" type="primary" icon="iconche-xiao" circle @click="undo"></wx-button>
      <wx-button :style="{opacity: showSave ? 1 : 0.3}" title="保存" type="primary" icon="icon-dui" circle @click="save"></wx-button>
    </div>
  </div>
</template>

<script>
import G6Editor from '@antv/g6-editor'
import NodeTpl from '../node-tpl/index.vue'
import EdgeTpl from '../edge-tpl'
import { deepCopy, ellipsis } from '@/utils'
import './registerNode.js'
export default {
  props: ['dropRuleChainsNode', 'ruleChainsFlowChartData', 'ruleChainsNodeData', 'dropRuleChainsNodeMousePosition'],
  components: { NodeTpl, EdgeTpl },
  data () {
    return {
      flow: null,
      contextmenu: null,
      nodeId: '',
      nodeInfo: null,
      nodeType: '',
      nodeFormInfo: {},
      edgeInfo: {},
      showNodeEdit: true,
      showNodeDelete: true,
      showEdgeEdit: true,
      showRestart: false,
      loading: false,
      style: {
        top: 0,
        left: 0,
        display: 'none'
      },
      copyNodeId: null,
      copyNode: null,
      copyNodeInfo: null,
      nodeInfos: null,
      showSave: false,
      selectedNodeId: [],
      layout: {
        x: 0,
        y: 0
      }
    }
  },
  methods: {
    restart () {
      if (!this.showRestart) return
      this.$confirm('重启将保存当前规则链所有修改！', '注意！', {
        confirmButtonText: '是',
        cancelButtonText: '否'
      }).then(_ => {
        this.ruleChainsFlowChartData.nodes.forEach(item => {
          if (this.selectedNodeId.includes(item.id.id)) {
            delete item.id
          }
        })
        this.save(true)
      }).catch(() => {})
    },
    undo () {
      if (!this.showSave) return
      try {
        this.$emit('reRender')
        this.showSave = false
      } catch (error) {
        this.$message.error('撤销失败')
        this.showSave = true
      }
    },
    async save (isSave) {
      if (!this.showSave && !isSave) return
      this.loading = true
      const params = {
        ...this.ruleChainsFlowChartData,
        nodes: this.ruleChainsFlowChartData.nodes.map(ele => {
          const info = deepCopy(ele)
          if (ele.id && ele.id.type === 'add') {
            delete info.id
          }
          return info
        }),
        connections: this.ruleChainsFlowChartData.connections,
        ruleChainConnections: this.ruleChainsFlowChartData.ruleChainConnections.filter(item => {
          return Object.prototype.hasOwnProperty.call(item, 'fromIndex')
        })
      }
      try {
        await this.$api.postRuleChainMetadata(params)
        this.$emit('reRender')
        this.$message.success('保存成功')
        this.showSave = false
        this.showRestart = false
      } catch (error) {
        this.$message.success('保存失败')
      }
      this.loading = false
    },
    paste (evt) {
      if (this.nodeType === 'RULECHAIN') {
        const copyNodeInfo = this.ruleChainsFlowChartData.ruleChainConnections.filter(item => item.additionalInfo.ruleChainNodeId === this.copyNodeId)[0]
        this.nodeFormInfo = copyNodeInfo
        this.nodeFormInfo.nodeType = 'RULE_CHAIN'
        this.nodeInfo = Object.assign({}, this.copyNodeInfo, this.copyNode)
        delete this.nodeInfo.id
        this.flow.add('node', this.nodeInfo)
      } else {
        const copyNodeInfo = this.ruleChainsFlowChartData.nodes.filter(item => item.id.id === this.copyNodeId)[0]
        this.nodeFormInfo = copyNodeInfo
        this.nodeInfo = Object.assign({
          nodeType: copyNodeInfo.type
        }, this.copyNodeInfo, this.copyNode)
        delete this.nodeInfo.id
        this.flow.add('node', this.nodeInfo)
      }
      this.style = {
        top: 0,
        left: 0,
        display: 'none'
      }
    },
    edgeSubmit (form) {
      let fromIndex = ''
      let toIndex = ''
      const ruleChainConnections = this.ruleChainsFlowChartData.ruleChainConnections
      const ruleChainIdList = ruleChainConnections.map(item => item.additionalInfo.ruleChainNodeId)
      if (ruleChainIdList.includes(this.edgeInfo.target)) {
        let fromIndex = null
        const ruleChainNodeInfo = ruleChainConnections.filter(item => item.additionalInfo.ruleChainNodeId === this.edgeInfo.target)[0]
        this.ruleChainsFlowChartData.nodes.forEach((item, index) => {
          if (item.id.id === this.edgeInfo.source) {
            fromIndex = index
          }
        })
        for (let i = 0; i < ruleChainConnections.length; i++) {
          if (ruleChainConnections[i].fromIndex === fromIndex && ruleChainConnections[i].additionalInfo.ruleChainNodeId === this.edgeInfo.target) {
            this.ruleChainsFlowChartData.ruleChainConnections.splice(i--, 1)
          }
        }
        form.link.forEach(item => {
          this.ruleChainsFlowChartData.ruleChainConnections.push({
            ...ruleChainNodeInfo,
            type: item,
            fromIndex
          })
        })
      } else {
        this.ruleChainsFlowChartData.nodes.forEach((item, index) => {
          if (item.id.id === this.edgeInfo.source) {
            fromIndex = index
          }
          if (item.id.id === this.edgeInfo.target) {
            toIndex = index
          }
        })
        const connections = this.ruleChainsFlowChartData.connections
        for (let i = 0; i < connections.length; i++) {
          if (connections[i].fromIndex === fromIndex && connections[i].toIndex === toIndex) {
            this.ruleChainsFlowChartData.connections.splice(i--, 1)
          }
        }
        form.link.forEach(item => {
          this.ruleChainsFlowChartData.connections.push({
            fromIndex,
            toIndex,
            type: item
          })
        })
      }
      this.flow.update(this.edgeInfo.id, {
        label: form.link.join('/'),
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
    },
    edgeCancel () {
      this.flow.remove(this.edgeInfo.id)
    },
    nodeSubmit (form) {
      this.nodeFormInfo = form
      if (form.tplType === 'edit') {
        const selectedNodeInfo = this.flow.getSelected().filter(item => item.id === this.nodeId)[0]
        if (selectedNodeInfo.type === 'node') {
          if (selectedNodeInfo.model.nodeType === 'RULECHAIN') {
            selectedNodeInfo.model.style.fill = '#DFD3FB'
          } else if (selectedNodeInfo.model.id !== 'input') {
            selectedNodeInfo.model.debugMode = form.debugMode
          }
        }
        this.flow.update(this.nodeId, {
          label: {
            fill: selectedNodeInfo.model.label.fill,
            text: `${selectedNodeInfo.model.label.text.split('\n')[0]}\n${ellipsis(form.name)}`
          },
          x: selectedNodeInfo.model.x,
          y: selectedNodeInfo.model.y
        })
      } else {
        this.flow.add('node', {
          ...this.nodeInfo,
          label: {
            fill: this.nodeInfo.label.fill,
            text: `${this.nodeInfo.label.text}\n${ellipsis(form.name)}`
          }
        })
      }
    },
    drop (event) {
      const fill = this.dropRuleChainsNode.getAttribute('data-fill')
      const label = this.dropRuleChainsNode.getAttribute('data-label')
      const nodeId = this.dropRuleChainsNode.getAttribute('data-id')
      const nodeType = this.dropRuleChainsNode.getAttribute('data-type')
      const color = this.dropRuleChainsNode.getAttribute('data-color')
      this.nodeInfo = {
        x: event.offsetX - this.dropRuleChainsNodeMousePosition.x + this.layout.x,
        y: event.offsetY - this.dropRuleChainsNodeMousePosition.y + this.layout.y,
        style: { fill },
        size: '172*44',
        shape: 'custom-rect',
        label: {
          text: label,
          fill: color
        },
        nodeId,
        nodeType
      }
      let configurationDescriptor = {}
      if (nodeType !== 'RULECHAIN') {
        configurationDescriptor = this.ruleChainsNodeData.filter(item => item.clazz === nodeType)[0].configurationDescriptor
      }
      this.$refs.ruleChainsTpl.openDialog({
        nodeTpl: nodeType,
        configurationDescriptor
      })
    },
    clickContextmenu (type) {
      this.$refs.contextmenu.style.display = 'none'
      let nodeInfo = null
      let listName = 'nodes'
      let configurationDescriptor = {}
      switch (type) {
        case 'node-copy':
          this.copyNodeId = this.nodeId
          this.copyNodeInfo = this.nodeInfos
          break
        case 'node-edit':
          if (this.nodeType === 'RULECHAIN') {
            listName = 'ruleChainConnections'
          }
          nodeInfo = this.ruleChainsFlowChartData[listName].filter(item => {
            if (this.nodeType === 'RULECHAIN') {
              return item.additionalInfo.ruleChainNodeId === this.nodeId
            } else {
              return item.id.id === this.nodeId
            }
          })[0]
          if (this.nodeType !== 'RULECHAIN') {
            configurationDescriptor = this.ruleChainsNodeData.filter(item => item.clazz === nodeInfo.type)[0].configurationDescriptor
          }
          this.$refs.ruleChainsTpl.openDialog({
            nodeTpl: this.nodeType === 'RULECHAIN' ? this.nodeType : nodeInfo.type,
            nodeInfo,
            configurationDescriptor
          })
          break
        case 'edge-edit':
          this.$refs.edgeTpl.openDialog({
            link: this.edgeInfo.label.split('/'),
            linkList: this.ruleChainsNodeData.filter(item => {
              return item.clazz === this.ruleChainsFlowChartData.nodes.filter(row => row.id.id === this.edgeInfo.source)[0].type
            })[0].configurationDescriptor.nodeDefinition.relationTypes
          })
          break
        case 'node-delete':
          this.flow.remove(this.nodeId)
          break
        case 'edge-delete':
          this.flow.remove(this.edgeInfo.id)
          break
        default:
          break
      }
    },
    setSelectedNode (list) {
      list.forEach(item => {
        this.flow.setSelected(item, item !== 'input')
      })
    },
    initEditor () {
      const editor = new G6Editor()
      // 禁用命令(删除)
      G6Editor.Command.registerCommand('delete', {
        enable () {}
      })
      // 禁用命令(撤回)
      G6Editor.Command.registerCommand('undo', {
        enable () {}
      })
      // 基础流程图
      this.flow = new G6Editor.Flow({
        graph: {
          container: this.$refs.flow
        },
        grid: {
          type: 'line',
          cell: 20,
          line: {
            stroke: '#F5F8FF'
          }
        }
      })
      // // 右键菜单
      this.contextmenu = new G6Editor.Contextmenu({
        container: this.$refs.contextmenu
      })
      const graph = this.flow.getGraph()
      graph.on('node:dblclick', evt => {
        const { id, nodeType } = evt.item.model
        if (id === 'input') {
          return
        }
        this.nodeId = id
        let listName = 'nodes'
        if (nodeType === 'RULECHAIN') {
          listName = 'ruleChainConnections'
        }
        const nodeInfo = this.ruleChainsFlowChartData[listName].filter(item => {
          if (nodeType === 'RULECHAIN') {
            return item.additionalInfo.ruleChainNodeId === id
          } else {
            return item.id.id === id
          }
        })[0]
        let configurationDescriptor = {}
        if (nodeType !== 'RULECHAIN') {
          configurationDescriptor = this.ruleChainsNodeData.filter(item => item.clazz === nodeInfo.type)[0].configurationDescriptor
        }
        this.$refs.ruleChainsTpl.openDialog({
          nodeTpl: nodeType === 'RULECHAIN' ? nodeType : nodeInfo.type,
          nodeInfo,
          configurationDescriptor
        })
      })
      graph.on('edge:dblclick', evt => {
        const { label, source } = evt.item.model
        this.edgeInfo = evt.item.model
        this.$refs.edgeTpl.openDialog({
          link: label.split('/'),
          linkList: this.ruleChainsNodeData.filter(item => {
            return item.clazz === this.ruleChainsFlowChartData.nodes.filter(row => row.id.id === source)[0].type
          })[0].configurationDescriptor.nodeDefinition.relationTypes
        })
      })
      graph.on('drag', evt => {
        this.layout = {
          x: evt.x - evt.domX,
          y: evt.y - evt.domY
        }
      })
      this.flow.on('hoveranchor:beforeaddedge', evt => {
        const item = evt.item
        if (item.model.id === 'input') {
          Object.keys(item.dataMap).forEach(key => {
            if (item.dataMap[key].source === 'input') {
              evt.cancel = true
            }
          })
        }
      })
      this.flow.on('dragedge:beforeshowanchor', evt => {
        const flag = [
          evt.targetAnchor && evt.targetAnchor.index === 1,
          evt.target.id === 'input',
          evt.source.id === 'input' && evt.target.model.nodeType === 'RULECHAIN',
          evt.target.id === evt.source.id
        ]
        if (flag.includes(true)) {
          evt.cancel = true
        }
      })
      this.flow.on('hovernode:beforeshowanchor', evt => {
        if (evt.anchor.index === 0 && evt.item.id !== 'input') {
          evt.cancel = true
        }
        if (evt.item.model.nodeType === 'RULECHAIN') {
          evt.cancel = true
        }
      })
      this.flow.on('click', evt => {
        this.style = {
          top: 0,
          left: 0,
          display: 'none'
        }
        if (evt.item && evt.item.type === 'node' && evt.item.id !== 'input' && evt.item.model.nodeType !== 'RULECHAIN') {
          if (!this.selectedNodeId.includes(evt.item.id)) {
            this.selectedNodeId.push(evt.item.id)
          }
        } else {
          this.selectedNodeId = []
        }
      })
      // 监听右键被右击
      this.flow.on('contextmenu', evt => {
        if (!evt.item && this.copyNodeId) {
          this.style = {
            top: evt.domEvent.offsetY + 'px',
            left: evt.domEvent.offsetX + 'px',
            display: 'block'
          }
          this.copyNode = {
            x: evt.x,
            y: evt.y
          }
        } else {
          this.style = {
            top: 0,
            left: 0,
            display: 'none'
          }
        }
      })
      this.flow.on('node:contextmenu', evt => {
        this.showNodeEdit = evt.item.model.id !== 'input'
        this.showNodeDelete = evt.item.model.id !== 'input'
        this.nodeType = evt.item.model.nodeType
        this.nodeId = evt.item.id
        this.nodeInfos = evt.item.model
        this.selectedNodeId = []
      })
      this.flow.on('edge:contextmenu', evt => {
        this.showEdgeEdit = evt.item.model.source !== 'input'
        this.edgeInfo = evt.item.model
        this.selectedNodeId = []
      })
      this.flow.on('hoveranchor:beforeaddedge', evt => {
        if (evt.item.id === 'input') {
          if (evt.anchor.index !== 0) {
            evt.cancel = true
          }
        } else if (evt.anchor.index !== 1) {
          evt.cancel = true
        }
      })
      this.flow.on('afterchange', evt => {
        const nodes = this.ruleChainsFlowChartData.nodes
        let edges = this.ruleChainsFlowChartData.connections
        let ruleChainConnections = this.ruleChainsFlowChartData.ruleChainConnections
        // 不符合规范的操作
        if (evt.action !== 'changeData') {
          const model = evt.item.model
          // 如果拖线直接撤回到原来位置
          if (evt.action === 'update' && evt.item.type === 'edge') {
            const { source, target, label } = evt.updateModel
            if (source || target) {
              if (source !== evt.originModel.source && target !== evt.originModel.target) {
                this.flow.update(evt.item.id, {
                  source: evt.originModel.source,
                  target: evt.originModel.target
                })
              }
            }
            if (!label) {
              return
            }
          }
          let flag = []
          if (model.sourceAnchor !== undefined || model.targetAnchor !== undefined) {
            flag = [
              model.target ? typeof model.target === 'string' && model.target !== 'input' : true,
              model.source ? typeof model.source === 'string' : true
            ]
            if (flag.includes(false)) {
              this.flow.remove(evt.item.id)
            }
          }
          switch (evt.action) {
            case 'add':
              if (evt.item.type === 'node') {
                delete this.nodeFormInfo.tplType
                if (this.nodeFormInfo.nodeType === 'RULE_CHAIN') {
                  ruleChainConnections.push({
                    additionalInfo: {
                      ...this.nodeFormInfo.additionalInfo,
                      layoutX: this.nodeInfo.x,
                      layoutY: this.nodeInfo.y,
                      ruleChainNodeId: evt.item.id
                    },
                    targetRuleChainId: {
                      ...this.nodeFormInfo.targetRuleChainId
                    }
                  })
                } else {
                  nodes.push({
                    ...this.nodeFormInfo,
                    type: this.nodeInfo.nodeType,
                    additionalInfo: {
                      ...this.nodeFormInfo.additionalInfo,
                      layoutX: this.nodeInfo.x,
                      layoutY: this.nodeInfo.y
                    },
                    id: {
                      id: evt.item.id,
                      type: 'add'
                    }
                  })
                }
              } else if (evt.item.type === 'edge') {
                if (evt.model.source !== 'input') {
                  if (flag.includes(false)) return
                  const edgeList = []
                  ruleChainConnections.forEach(item => {
                    if (item.fromIndex !== undefined) {
                      edgeList.push(`${nodes[item.fromIndex].id.id}_${item.additionalInfo.ruleChainNodeId}`)
                    }
                  })
                  edges.forEach(item => {
                    edgeList.push(`${nodes[item.fromIndex].id.id}_${nodes[item.toIndex].id.id}`)
                  })
                  const { source, target, id } = evt.model
                  if (edgeList.includes(`${source}_${target}`)) {
                    this.flow.remove(id)
                    return
                  }
                  this.edgeInfo = evt.model
                  this.$refs.edgeTpl.openDialog({
                    linkList: this.ruleChainsNodeData.filter(item => {
                      return item.clazz === this.ruleChainsFlowChartData.nodes.filter(row => row.id.id === this.edgeInfo.source)[0].type
                    })[0].configurationDescriptor.nodeDefinition.relationTypes
                  })
                } else {
                  if (this.ruleChainsFlowChartData.firstNodeIndex !== null) {
                    this.flow.remove(evt.item.id)
                  } else {
                    this.ruleChainsFlowChartData.nodes.forEach((item, index) => {
                      if (item.id.id === evt.model.target) {
                        this.ruleChainsFlowChartData.firstNodeIndex = index
                      }
                    })
                  }
                }
              }
              break
            case 'update':
              delete this.nodeFormInfo.tplType
              if (evt.item.type === 'node') {
                const isRuleChain = this.ruleChainsFlowChartData.ruleChainConnections.map(ele => ele.additionalInfo.ruleChainNodeId)
                if (isRuleChain.includes(evt.item.id)) {
                  this.ruleChainsFlowChartData.ruleChainConnections = this.ruleChainsFlowChartData.ruleChainConnections.map(item => {
                    if (item.additionalInfo.ruleChainNodeId === evt.item.id) {
                      return {
                        ...item,
                        targetRuleChainId: {
                          ...item.targetRuleChainId,
                          ...this.nodeFormInfo.targetRuleChainId
                        },
                        additionalInfo: {
                          ...item.additionalInfo,
                          ...this.nodeFormInfo.additionalInfo,
                          layoutX: evt.updateModel.x,
                          layoutY: evt.updateModel.y
                        }
                      }
                    } else {
                      return item
                    }
                  })
                } else if (evt.item.id !== 'input') {
                  this.ruleChainsFlowChartData.nodes.forEach((item, index) => {
                    if (item.id.id === evt.item.id) {
                      this.ruleChainsFlowChartData.nodes.splice(index, 1, {
                        ...item,
                        ...this.nodeFormInfo,
                        configuration: {
                          ...item.configuration,
                          ...this.nodeFormInfo.configuration
                        },
                        additionalInfo: {
                          ...item.additionalInfo,
                          ...this.nodeFormInfo.additionalInfo,
                          layoutX: evt.updateModel.x,
                          layoutY: evt.updateModel.y
                        }
                      })
                    }
                  })
                }
              } else if (evt.item.type === 'edge') {
                console.log('updateEdge')
                // const { originModel, updateModel } = evt
                // if (originModel.source === 'input') {}
              }
              break
            case 'remove':
              if (evt.item.model.id === 'input' || evt.item.model.source === 'input') {
                const { dataMap } = evt.item
                for (const key in dataMap) {
                  if (dataMap[key].source === 'input' && dataMap[key].target) {
                    return
                  }
                }
                this.ruleChainsFlowChartData.firstNodeIndex = null
              } else if (evt.item.type === 'node') {
                if (this.ruleChainsFlowChartData.firstNodeIndex && nodes[this.ruleChainsFlowChartData.firstNodeIndex].id.id === evt.item.id) {
                  this.ruleChainsFlowChartData.firstNodeIndex = null
                }
                if (evt.item.model.nodeType === 'RULECHAIN') {
                  for (let i = 0; i < ruleChainConnections.length; i++) {
                    if (evt.item.id === ruleChainConnections[i].additionalInfo.ruleChainNodeId) {
                      ruleChainConnections.splice(i--, 1)
                    }
                  }
                } else {
                  for (let i = 0; i < ruleChainConnections.length; i++) {
                    if (ruleChainConnections[i].fromIndex !== undefined) {
                      if (evt.item.id === nodes[ruleChainConnections[i].fromIndex].id.id) {
                        ruleChainConnections.splice(i--, 1)
                      }
                    }
                  }
                  let removeIndex = ''
                  nodes.forEach((item, index) => {
                    if (evt.item.id === item.id.id) {
                      nodes.splice(index, 1)
                      removeIndex = index
                      if (index === this.ruleChainsFlowChartData.firstNodeIndex) {
                        this.ruleChainsFlowChartData.firstNodeIndex = null
                      }
                    }
                  })
                  for (let i = 0; i < edges.length; i++) {
                    if (edges[i].fromIndex === removeIndex || edges[i].toIndex === removeIndex) {
                      edges.splice(i--, 1)
                    }
                  }
                  edges = edges.map(ele => {
                    const fromIndex = ele.fromIndex > removeIndex ? ele.fromIndex-- : ele.fromIndex
                    const toIndex = ele.toIndex > removeIndex ? ele.toIndex-- : ele.toIndex
                    return {
                      ...ele,
                      fromIndex,
                      toIndex
                    }
                  })
                  ruleChainConnections = ruleChainConnections.map(ele => {
                    const fromIndex = ele.fromIndex > removeIndex ? ele.fromIndex-- : ele.fromIndex
                    return {
                      ...ele,
                      fromIndex
                    }
                  })
                  if (this.ruleChainsFlowChartData.firstNodeIndex > removeIndex) {
                    this.ruleChainsFlowChartData.firstNodeIndex--
                  }
                  if (nodes.length === 0) {
                    this.ruleChainsFlowChartData.firstNodeIndex = null
                  }
                }
              } else if (evt.item.type === 'edge') {
                const { dataMap, source, target } = evt.item
                for (const key in dataMap) {
                  if (dataMap[key].source === source.id && dataMap[key].target === target.id) {
                    return
                  }
                }
                for (let i = 0; i < ruleChainConnections.length; i++) {
                  const isSource = ruleChainConnections[i].fromIndex !== undefined && nodes[ruleChainConnections[i].fromIndex].id.id === evt.item.model.source
                  const isTarget = ruleChainConnections[i].additionalInfo.ruleChainNodeId === evt.item.model.target
                  if (isSource && isTarget) {
                    delete ruleChainConnections[i].fromIndex
                    // ruleChainConnections.splice(i--, 1)
                  }
                }
                for (let i = 0; i < this.ruleChainsFlowChartData.connections.length; i++) {
                  const fromIndex = this.ruleChainsFlowChartData.connections[i].fromIndex
                  const toIndex = this.ruleChainsFlowChartData.connections[i].toIndex
                  const isForm = this.ruleChainsFlowChartData.nodes[fromIndex].id.id === evt.item.model.source
                  const isTo = this.ruleChainsFlowChartData.nodes[toIndex].id.id === evt.item.model.target
                  if (isForm && isTo) {
                    this.ruleChainsFlowChartData.connections.splice(i--, 1)
                  }
                }
              }
              break
            default:
              break
          }
          this.showSave = true
        }
        this.nodeFormInfo = {}
      })
      // 通过editor添加关联
      editor.add(this.flow)
      editor.add(this.contextmenu)
    },
    reRender (data) {
      this.flow.read(data)
    },
    destroy () {
      this.flow.destroy()
    },
    getShowSave () {
      return this.showSave
    }
  },
  mounted () {
    this.initEditor()
  },
  watch: {
    selectedNodeId: {
      deep: true,
      handler (n) {
        this.showRestart = Boolean(this.selectedNodeId.length)
        this.setSelectedNode(n)
      }
    }
  },
  beforeDestroy () {
    this.destroy()
  }
}
</script>

<style lang="scss" scoped>
  .rule-chain-flow-chart-container {
    float: left;
    width: calc(100% - 224px - 19px);
    height: 100%;
    margin-left: 19px;
    background-color: #fff;
    position: relative;
    .flow {
      height: 100%;
      /deep/ .graph-container {
        height: 100%;
      }
    }
    .paste {
      margin: 0px;
      width: 100px;
      background: white;
      box-shadow: 0px 1px 4px rgba(0, 0, 0, 0.25);
      color: #000;
      font-size: 12px;
      ul {
        box-sizing: content-box;
        li {
          line-height: 20px;
          text-align: center;
          border-bottom: 1px solid #eee;
          &:hover {
            cursor: pointer;
            background: #e6f7ff;
          }
          &:last-child {
            border-bottom: none;
          }
        }
      }
    }
    .contextmenu {
      margin: 0px;
      width: 100px;
      background: white;
      box-shadow: 0px 1px 4px rgba(0, 0, 0, 0.25);
      color: #000;
      font-size: 12px;
      display: none;
      ul {
        box-sizing: content-box;
        li {
          line-height: 20px;
          text-align: center;
          border-bottom: 1px solid #eee;
          &:hover {
            cursor: pointer;
            background: #e6f7ff;
          }
          &:last-child {
            border-bottom: none;
          }
        }
      }
    }
    > .btn-icon {
      position: absolute;
      top: -40px;
      right: 0;
      .wx-button {
        margin-left: 10px;
      }
    }
  }
</style>
