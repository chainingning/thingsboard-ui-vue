import Layout from '@/layout'

export default {
  path: '/profile',
  index: 11,
  component: Layout,
  auth: ['TENANT_ADMIN', 'CUSTOMER_USER', 'SYS_ADMIN'],
  isShow: false,
  children: [
    {
      path: '',
      meta: { isBreadcrumb: false },
      component: () => import('@/views/profile')
    }
  ]
}
