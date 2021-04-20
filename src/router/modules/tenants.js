import Layout from '@/layout'
import MainContainer from '@/layout/MainContainer'

export default {
  path: '/tenants',
  index: 3,
  component: Layout,
  auth: ['SYS_ADMIN'],
  children: [
    {
      path: '',
      meta: { title: '设备管理员', icon: 'icon-customers' },
      component: MainContainer,
      children: [
        {
          path: '',
          meta: {
            cashComponentName: 'Tenants',
            breadcrumb: [{ title: '设备管理员', path: '/tenants' }]
          },
          component: () => import('@/views/tenants/index/page')
        },
        {
          path: ':tenantId',
          meta: {
            breadcrumb: [
              { title: '设备管理员', path: '/tenants' },
              { title: '', path: '/tenants/:tenantId' }
            ]
          },
          component: () => import('@/views/tenants/index/page/details'),
          props: true
        },
        {
          path: ':tenantId/admins',
          meta: {
            cashComponentName: 'Admins',
            breadcrumb: [
              { title: '设备管理员', path: '/tenants' },
              { title: '设备管理员账号', path: '/tenants/:tenantId/admins' }
            ]
          },
          component: () => import('@/views/tenants/admins/page'),
          props: true
        },
        {
          path: ':tenantId/admins/:adminId',
          meta: {
            breadcrumb: [
              { title: '设备管理员', path: '/tenants' },
              { title: '设备管理员账号', path: '/tenants/:tenantId/admins' },
              { title: '', path: '/tenants/:tenantId/admins/:adminId' }
            ]
          },
          component: () => import('@/views/tenants/admins/page/details'),
          props: true
        }
      ]
    }
  ]
}
