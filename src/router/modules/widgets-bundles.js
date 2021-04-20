import Layout from '@/layout'
import MainContainer from '@/layout/MainContainer'

export default {
  path: '/widgets-bundles',
  index: 7,
  component: Layout,
  auth: ['TENANT_ADMIN', 'SYS_ADMIN'],
  children: [
    {
      path: '',
      meta: { title: '部件库', icon: 'icon-widgets-bundles' },
      component: MainContainer,
      children: [
        {
          path: '',
          meta: {
            cashComponentName: 'WidgetsBundles',
            breadcrumb: [{ title: '部件库', path: '/widgets-bundles' }]
          },
          component: () => import('@/views/widgets-bundles')
        },
        {
          path: ':id',
          meta: {
            breadcrumb: [
              { title: '部件库', path: '/widgets-bundles' },
              { title: '', path: '/widgets-bundles/:id' }
            ]
          },
          component: () => import('@/views/widgets-bundles/widget-types'),
          props: true
        },
        {
          path: ':id/details',
          meta: {
            breadcrumb: [
              { title: '部件库', path: '/widgets-bundles' },
              { title: '', path: '/widgets-bundles/:id/details' }
            ]
          },
          component: () => import('@/views/widgets-bundles/details'),
          props: true
        },
        {
          path: ':id/:widgetsId',
          meta: {
            breadcrumb: [
              { title: '部件库', path: '/widgets-bundles' },
              { title: '', path: '/widgets-bundles/:id' },
              { title: '', path: '/widgets-bundles/:id/:widgetsId' }
            ]
          },
          component: () => import('@/views/widgets-bundles/widget-types/details'),
          props: true
        }
      ]
    }
  ]
}
