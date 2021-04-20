import Layout from '@/layout'
import MainContainer from '@/layout/MainContainer'

export default {
  path: '/devices',
  index: 5,
  component: Layout,
  auth: ['TENANT_ADMIN', 'CUSTOMER_USER'],
  children: [
    {
      path: '',
      meta: { title: '设备', icon: 'icon-devices' },
      component: MainContainer,
      children: [
        {
          path: '',
          meta: {
            cashComponentName: 'Devices',
            breadcrumb: [{ title: '设备', path: '/devices' }]
          },
          component: () => import('@/views/devices')
        },
        {
          path: ':deviceId',
          meta: {
            breadcrumb: [
              { title: '设备', path: '/devices' },
              { title: '', path: '/devices/:deviceId' }
            ]
          },
          component: () => import('@/views/devices/details'),
          props: true
        }
      ]
    }
  ]
}
