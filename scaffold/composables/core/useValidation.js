import { useI18n } from 'vue-i18n'

import * as rulesHandlers from '@/validations'

export const useValidation = () => {
  const { t } = useI18n()

  const validate = (labelKey, rulesString) => {
    if (!rulesString) return []

    const rules = rulesString.split('|')
    const translatedLabel = t(labelKey)

    return rules.map(ruleStr => {
      // Parse arguments e.g: "min:6,2" => ruleName: "min", args: ["6", "2"]
      const [ruleName, ...rest] = ruleStr.split(':')
      const argsStr = rest.join(':')
      const args = argsStr ? argsStr.split(',') : []

      return (value) => {
        const handler = rulesHandlers[ruleName]
        if (!handler) {
          console.warn(`Validation rule '${ruleName}' not found.`)
          return true
        }

        const isValid = handler(value, args)
        if (isValid) return true

        // Build payload for i18n
        const params = { label: translatedLabel }
        args.forEach((arg, index) => {
          params[`arg${index}`] = arg
        })

        const message = t(`validation.${ruleName}`, params).toLowerCase()
        return message.charAt(0).toUpperCase() + message.slice(1)
      }
    })
  }

  return { validate }
}
