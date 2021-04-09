export interface FormatMsgConfig {
  indent?: number
  star?: boolean
  nl?: boolean
}
export const formatMsg = (
  msg: string,
  config: FormatMsgConfig = {}
): string => {
  const { indent = 0, star, nl = true } = config

  if (star) msg = `* ${msg}`
  msg = '  '.repeat(indent) + msg
  if (nl) msg += '\n'

  return msg
}