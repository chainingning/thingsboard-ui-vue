import Layout from '@/layout'
import MainContainer from '@/layout/MainContainer'

export default {
  path: '/assets',
  index: 4,
  component: Layout,
  auth: ['TENANT_ADMIN', 'CUSTOMER_USER'],
  children: [
    {
      path: '',
      meta: { title: '资产', icon: 'icon-assets' },
      component: MainContainer,
      children: [
        {
          path: '',
          meta: {
            cashComponentName: 'Assets',
            breadcrumb: [{ title: '资产', path: '/assets' }]
          },
          component: () => import('@/views/assets')
        },
        {
          path: ':assetId',
          meta: {
            breadcrumb: [
              { title: '资产', path: '/assets' },
              { title: '', path: '/assets/:assetId' }
            ]
          },
          component: () => import('@/views/assets/details'),
          props: true
        }
      ]
    }
  ]
}
