<template>
  <el-breadcrumb separator-class="el-icon-arrow-right">
    <el-breadcrumb-item
      v-for="(item, index) in breadcrumbList"
      :to="to(item, index)"
      :key="item.path">{{ item.title }}</el-breadcrumb-item>
  </el-breadcrumb>
</template>

<script>
import { deepCopy } from '@/utils'
export default {
  computed: {
    breadcrumbList () {
      const breadcrumb = deepCopy(this.$route.meta.breadcrumb)
      let title = this.$route.query.title
      if (!Array.isArray(title)) {
        title = [title]
      }
      const breadcrumbList = breadcrumb.map(ele => {
        let pathList = ele.path.split('/')
        pathList = pathList.map((item, index) => {
          if (item.indexOf(':') !== -1) {
            item = this.$route.path.split('/')[index]
          }
          return item
        }).join('/')
        if (!ele.title) {
          ele.title = title[0]
          title.splice(0, 1)
        }
        return { ...ele, path: pathList }
      })
      return breadcrumbList
    }
  },
  methods: {
    to (item, index) {
      return index + 1 === this.breadcrumbList.length ? '' : {
        path: item.path,
        query: index === 0 ? null : { title: item.title }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.el-breadcrumb {
  line-height: calc(#{$breadcrumb-height} - 1px);
  margin-left: 20px;
  /deep/ .el-breadcrumb__item {
    span, i {
      color: #000;
    }
    span {
      font-size: 16px;
      &:hover {
        color: #000;
      }
    }
  }
}
</style>
