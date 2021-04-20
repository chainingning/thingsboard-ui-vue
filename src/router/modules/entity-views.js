import Layout from '@/layout'
import MainContainer from '@/layout/MainContainer'

export default {
  path: '/entity-views',
  index: 6,
  component: Layout,
  auth: ['TENANT_ADMIN', 'CUSTOMER_USER'],
  children: [
    {
      path: '',
      meta: { title: '实体视图', icon: 'icon-entity-views' },
      component: MainContainer,
      children: [
        {
          path: '',
          meta: {
            cashComponentName: 'Entityviews',
            breadcrumb: [{ title: '实体视图', path: '/entity-views' }]
          },
          component: () => import('@/views/entity-views')
        },
        {
          path: ':entityId',
          meta: {
            breadcrumb: [
              { title: '实体视图', path: '/entity-views' },
              { title: '', path: '/entity-views/:entityId' }
            ]
          },
          component: () => import('@/views/entity-views/details'),
          props: true
        }
      ]
    }
  ]
}
