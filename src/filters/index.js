import { getDate } from '@/utils'
// 格式化时间戳
export function formatTimestamp (timestamp, format = 'yyyy-MM-dd HH:mm:ss') {
  return getDate({ timestamp, format })
}
