import { ref } from 'vue'
import { defineStore } from 'pinia'

const VALID_ALERT_POSITIONS = ['top-right', 'top-left', 'bottom-right', 'bottom-left']

export const useUiStore = defineStore('ui', () => {
  const theme = ref('light')
  const alertPosition = ref('bottom-right')

  const setTheme = (next) => {
    theme.value = next
  }

  const setAlertPosition = (position) => {
    if (VALID_ALERT_POSITIONS.includes(position)) alertPosition.value = position
  }

  return { theme, alertPosition, setTheme, setAlertPosition }
}, {
  persist: {
    key: 'CHANGEME_ui',
    pick: ['theme', 'alertPosition'],
  },
})
