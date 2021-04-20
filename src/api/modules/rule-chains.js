/**
 * 规则链库
 */

import { request } from '@/utils/request'

export default {
  getRuleChainsList: params => request({ url: '/api/ruleChains', params }),
  getRuleChainMetadata: id => request({ url: `/api/ruleChain/${id}/metadata`, isLoop: true }),
  getComponents: types => request({ url: `/api/components?componentTypes=${types}` }),
  updateRuleChain: params => request({ url: '/api/ruleChain', method: 'post', params }),
  deleteRuleChains: id => request({ url: `/api/ruleChain/${id}`, method: 'delete' }),
  createRuleChainsRoot: id => request({ url: `/api/ruleChain/${id}/root`, method: 'post' }),
  getRuleChainsInfo: id => request({ url: `/api/ruleChain/${id}` }),
  postRuleChainMetadata: params => request({ url: '/api/ruleChain/metadata', method: 'post', params }),
  postRuleChain: params => request({ url: '/api/ruleChain', method: 'post', params }),
  postRuleChainTestScript: params => request({ url: '/api/ruleChain/testScript', method: 'post', params })
}
