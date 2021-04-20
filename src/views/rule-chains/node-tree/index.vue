<template>
  <div class="rule-chain-nodes-container">
    <div class="search-container">
      <el-input placeholder="搜索节点" v-model="searchNode"></el-input>
    </div>
    <el-collapse v-model="activeName">
      <el-collapse-item v-for="(item, key) in searchList" :class="key.toLowerCase()" :key="key" :title="item.title" :name="key">
        <el-popover width="400" trigger="hover" :open-delay="300" placement="right" v-for="i in item.list" v-show="i.name.indexOf(searchNode) > -1" :key="i.id.id">
          <p style="font-weight: bolder;">{{ i.name }}</p>
          <template v-if="i.name !== 'rule chain'">
            <p style="font-style: italic;" v-html="i.configurationDescriptor.nodeDefinition.description"></p>
            <br>
            <p v-html="i.configurationDescriptor.nodeDefinition.details"></p>
          </template>
          <p v-else>将传递的消息投递到指定规则引擎</p>
          <div
            slot="reference"
            draggable="true"
            class="getItem"
            @dragstart="dragstart"
            :style="{
              backgroundColor: ruleChainsTypes[key].color,
              color: ruleChainsTypes[key].labelColor
            }"
            :data-id="i.id.id"
            :data-label="i.name"
            :data-fill="ruleChainsTypes[key].color"
            :data-type="i.clazz ? i.clazz : i.type"
            :data-color="ruleChainsTypes[key].labelColor"
            >{{ i.name }}</div>
        </el-popover>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script>
export default {
  props: {
    ruleChainsTypes: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      searchNode: '',
      searchList: Object.assign({}, this.ruleChainsTypes),
      activeName: ['FILTER', 'ACTION', 'ENRICHMENT', 'TRANSFORMATION', 'EXTERNAL', 'RULECHAIN']
    }
  },
  methods: {
    dragstart (event) {
      this.$emit('dragstart', event)
    }
  }
}
</script>

<style lang="scss" scoped>
  .rule-chain-nodes-container {
    float: left;
    width: 224px;
    height: 100%;
    border-radius: 6px;
    border: 1px solid rgba(213, 213, 213, 1);
    background-color: #fff;
    overflow-x: hidden;
    overflow-y: auto;
    &::-webkit-scrollbar {
      width: 0 !important;
    }
    .search-container {
      height: 88px;
      /deep/ .el-input {
        width: 203px;
        margin-top: 26px;
        margin-left: 11px;
        position: relative;
        .el-input__inner {
          width: 203px;
          height: 41px;
          background-color: #DFE8FF;
          border-color: transparent;
          color: #6993FF;
          font-size: 16px;
          padding-right: 40px;
          position: relative;
          &::-webkit-input-placeholder {
            color: #6993FF;
          }
          &::-moz-input-placeholder {
            color: #6993FF;
          }
          &::-ms-input-placeholder {
            color: #6993FF;
          }
        }
        &:after {
          @extend %iconfont;
          content: '\e610';
          position: absolute;
          top: 11px;
          right: 14px;
          font-size: 19px;
          color: #6993FF;
        }
      }
    }
    /deep/ .el-collapse {
      border-top: none;
      .el-collapse-item {
        .el-collapse-item__header {
          height: 64px;
          line-height: 64px;
          color: #000;
          border-color: #BFBFBF;
          font-size: 16px;
          padding-left: 65px;
          position: relative;
          i {
            color: #000;
            font-weight: bolder;
            margin: 0 43px 0 auto;
          }
          &:before {
            @extend %iconfont;
            color: #5F5F5F;
            font-size: 18px;
            position: absolute;
            left: 30px;
          }
        }
        &.filter {
          .el-collapse-item__header:before {
            content: '\e615';
          }
        }
        &.enrichment {
          .el-collapse-item__header:before {
            content: '\e614';
          }
        }
        &.transformation {
          .el-collapse-item__header:before {
            content: '\e611';
          }
        }
        &.action {
          .el-collapse-item__header:before {
            content: '\e613';
          }
        }
        &.external {
          .el-collapse-item__header:before {
            content: '\e616';
          }
        }
        &.rulechain {
          .el-collapse-item__header:before {
            content: '\e612';
          }
        }
        .el-collapse-item__wrap {
          .el-collapse-item__content {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            border-top: 1px solid #EBEEF5;
            background-color: #ECF0FB;
            .getItem {
              @include ellipsis();
              width: 172px;
              height: 44px;
              border-radius: 4px;
              line-height: 44px;
              text-align: center;
              margin-top: 10px;
              border: 1px solid #CED4D9;
            }
          }
        }
      }
    }
  }
</style>
