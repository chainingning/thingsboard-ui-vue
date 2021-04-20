import Layout from '@/layout'

export default {
  path: '/home',
  index: 1,
  component: Layout,
  auth: ['TENANT_ADMIN'],
  children: [
    {
      path: '',
      meta: {
        title: '首页',
        icon: 'icon-home',
        breadcrumb: [{ title: '首页', path: '/' }],
        isBreadcrumb: false
      },
      component: () => import('@/views/home')
    },
    {
      path: 'alarm',
      meta: {
        title: '设备告警数',
        icon: 'icon-home',
        breadcrumb: [
          { title: '首页', path: '/home' },
          { title: '设备告警数', path: '/alarm' }
        ]
      },
      component: () => import('@/views/home/alarm')
    }
  ]
}
