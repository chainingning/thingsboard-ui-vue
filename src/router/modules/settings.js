import Layout from '@/layout'
import MainContainer from '@/layout/MainContainer'

export default {
  path: '/settings',
  index: 12,
  component: Layout,
  auth: ['SYS_ADMIN'],
  isChildren: true,
  children: [
    {
      path: '',
      meta: { title: '系统设置', icon: 'icon-customers' },
      component: MainContainer,
      redirect: '/settings/general',
      children: [
        {
          path: 'general',
          meta: {
            title: '常规设置',
            breadcrumb: [
              { title: '系统设置', path: '/settings' },
              { title: '常规设置', path: '/settings/general' }
            ]
          },
          component: () => import('@/views/settings/general')
        },
        {
          path: 'outgoing-mail',
          meta: {
            title: '发送邮件',
            breadcrumb: [
              { title: '系统设置', path: '/settings' },
              { title: '发送邮件', path: '/settings/outgoing-mail' }
            ]
          },
          component: () => import('@/views/settings/outgoing-mail')
        },
        {
          path: 'security-settings',
          meta: {
            title: '安全设置',
            breadcrumb: [
              { title: '系统设置', path: '/settings' },
              { title: '安全设置', path: '/settings/security-settings' }
            ]
          },
          component: () => import('@/views/settings/security-settings')
        }
      ]
    }
  ]
}
