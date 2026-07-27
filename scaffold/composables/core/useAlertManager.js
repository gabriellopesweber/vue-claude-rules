import { ref } from 'vue'

/**
 * Behavior per type:
 *   error   → fixed (never auto-dismiss, not closable by default)
 *   warning → closable, no auto-dismiss
 *   success → auto-dismiss after 4s
 *   info    → auto-dismiss after 5s
 */
const TYPE_CONFIG = {
  error:   { closable: false, timeout: null },
  warning: { closable: true,  timeout: null },
  success: { closable: true,  timeout: 4000 },
  info:    { closable: true,  timeout: 5000 },
}

let _uid = 0

const alerts = ref([])

const _scheduleRemoval = (id, timeout) => {
  if (!timeout) return
  setTimeout(() => dismiss(id), timeout)
}

const showAlert = (options) => {
  const type = options.type ?? 'info'
  const defaults = TYPE_CONFIG[type] ?? TYPE_CONFIG.info

  const id = ++_uid
  const alert = {
    id,
    type,
    title:    options.title   ?? '',
    text:     options.text    ?? '',
    closable: options.closable ?? defaults.closable,
    timeout:  options.timeout  ?? defaults.timeout,
    actionLabel: options.actionLabel ?? '',
    onAction:    options.onAction    ?? null,
  }

  alerts.value.push(alert)
  _scheduleRemoval(id, alert.timeout)
  return id
}

const updateAlert = (id, patch) => {
  const alert = alerts.value.find((a) => a.id === id)
  if (alert) Object.assign(alert, patch)
}

const dismiss = (id) => {
  const idx = alerts.value.findIndex((a) => a.id === id)
  if (idx !== -1) alerts.value.splice(idx, 1)
}

const dismissAll = () => {
  alerts.value = []
}

export function useAlertManager() {
  return {
    alerts,
    showAlert,
    updateAlert,
    dismiss,
    dismissAll,
  }
}
