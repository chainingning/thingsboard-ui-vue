import Layout from '@/layout'
import MainContainer from '@/layout/MainContainer'

export default {
  path: '/dashboards',
  index: 8,
  component: Layout,
  auth: ['TENANT_ADMIN', 'CUSTOMER_USER'],
  children: [
    {
      path: '',
      meta: { title: '应用库', icon: 'icon-dashboards' },
      component: MainContainer,
      children: [
        {
          path: '',
          meta: {
            cashComponentName: 'Dashboards',
            breadcrumb: [{ title: '应用库', path: '/dashboards' }]
          },
          component: () => import('@/views/dashboards')
        },
        {
          path: ':id',
          meta: {
            breadcrumb: [
              { title: '应用库', path: '/dashboards' },
              { title: '', path: '/dashboards/:id' }
            ]
          },
          component: () => import('@/views/dashboards/dashboard-detail'),
          props: true
        },
        {
          path: ':id/details',
          meta: {
            breadcrumb: [
              { title: '应用库', path: '/dashboards' },
              { title: '', path: '/dashboards/:id/details' }
            ]
          },
          component: () => import('@/views/dashboards/details'),
          props: true
        }
      ]
    }
  ]
}
