import Layout from '@/layout'
import MainContainer from '@/layout/MainContainer'

export default {
  path: '/rule-chains',
  index: 2,
  component: Layout,
  auth: ['TENANT_ADMIN'],
  children: [
    {
      path: '',
      meta: { title: '规则链库', icon: 'icon-rule-chain' },
      component: MainContainer,
      children: [
        {
          path: '',
          meta: {
            cashComponentName: 'RuleChains',
            breadcrumb: [{ title: '规则链库', path: '/rule-chains' }]
          },
          component: () => import('@/views/rule-chains')
        },
        {
          path: ':id',
          meta: {
            breadcrumb: [
              { title: '规则链库', path: '/rule-chains' },
              { title: '', path: '/rule-chains/:id' }
            ]
          },
          component: () => import('@/views/rule-chains/flow'),
          props: true
        },
        {
          path: ':id/details',
          meta: {
            breadcrumb: [
              { title: '规则链库', path: '/rule-chains' },
              { title: '', path: '/rule-chains/:id/details' }
            ]
          },
          component: () => import('@/views/rule-chains/details'),
          props: true
        }
      ]
    }
  ]
}
