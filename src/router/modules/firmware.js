import Layout from '@/layout'
import MainContainer from '@/layout/MainContainer'

export default {
  path: '/firmware',
  index: 10,
  component: Layout,
  auth: ['TENANT_ADMIN'],
  children: [
    {
      path: '',
      meta: { title: '固件管理', icon: 'icon-assets' },
      component: MainContainer,
      children: [
        {
          path: '',
          meta: { breadcrumb: [{ title: '固件管理', path: '/firmware' }] },
          component: () => import('@/views/firmware')
        }
      ]
    }
  ]
}
