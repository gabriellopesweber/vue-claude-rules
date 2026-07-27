<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useDisplay } from 'vuetify'

import { useAlertManager } from '@/composables/core/useAlertManager'

import { useUiStore } from '@/stores/ui'

const { t } = useI18n()
const { mobile } = useDisplay()
const { alerts, dismiss } = useAlertManager()
const { alertPosition } = storeToRefs(useUiStore())

const handleAction = (alert) => {
  if (typeof alert.onAction === 'function') alert.onAction()
}

const TYPE_META = {
  success: { icon: 'mdi-check-circle-outline',  color: 'success' },
  error:   { icon: 'mdi-alert-circle-outline',  color: 'error'   },
  warning: { icon: 'mdi-alert-outline',          color: 'warning' },
  info:    { icon: 'mdi-information-outline',    color: 'info'    },
}

const getMeta = (type) => TYPE_META[type] ?? TYPE_META.info

const hasAlerts = computed(() => alerts.value.length > 0)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="hasAlerts"
      class="global-alert-stack"
      :class="mobile ? 'global-alert-stack--mobile' : `global-alert-stack--${alertPosition}`"
      role="region"
      :aria-label="t('common.alert.region')"
    >
      <TransitionGroup
        name="alert-stack"
        tag="div"
        class="global-alert-stack__list"
      >
        <div
          v-for="alert in alerts"
          :key="alert.id"
          class="global-alert-stack__item"
        >
          <v-card
            class="alert-card"
            :class="[`alert-card--${alert.type}`]"
            rounded="xl"
            elevation="0"
          >
            <div class="alert-card__body d-flex align-start ga-3">
              <v-avatar
                :color="getMeta(alert.type).color"
                size="36"
                variant="tonal"
                class="alert-card__avatar flex-shrink-0"
                rounded="lg"
              >
                <v-icon
                  :icon="getMeta(alert.type).icon"
                  :color="getMeta(alert.type).color"
                  size="18"
                />
              </v-avatar>

              <div class="flex-grow-1 min-width-0">
                <p
                  v-if="alert.title"
                  class="alert-card__title text-body-2 font-weight-bold mb-1"
                >
                  {{ alert.title }}
                </p>
                <p
                  v-if="alert.text"
                  class="alert-card__text text-body-2 text-medium-emphasis"
                >
                  {{ alert.text }}
                </p>
                <v-btn
                  v-if="alert.actionLabel"
                  variant="tonal"
                  size="small"
                  :color="getMeta(alert.type).color"
                  class="text-none font-weight-bold mt-2"
                  @click="handleAction(alert)"
                >
                  {{ alert.actionLabel }}
                </v-btn>
              </div>

              <v-btn
                v-if="alert.closable"
                icon
                variant="text"
                size="x-small"
                color="medium-emphasis"
                class="alert-card__close flex-shrink-0"
                :aria-label="t('common.close')"
                @click="dismiss(alert.id)"
              >
                <v-icon
                  icon="mdi-close"
                  size="15"
                />
              </v-btn>
            </div>

            <div
              v-if="alert.timeout"
              class="alert-card__progress"
              :style="{ animationDuration: `${alert.timeout}ms` }"
              :class="`alert-card__progress--${alert.type}`"
            />
          </v-card>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.global-alert-stack {
  position: fixed;
  z-index: 3000;
  width: 360px;
  max-width: calc(100vw - 48px);
  pointer-events: none;
}

.global-alert-stack--top-right    { top: 24px;    right: 24px; }
.global-alert-stack--top-left     { top: 24px;    left: 24px; }
.global-alert-stack--bottom-right { bottom: 24px; right: 24px; }
.global-alert-stack--bottom-left  { bottom: 24px; left: 24px; }

/* Mobile: barra inferior full-width, sem cobrir a barra de ações do topo */
.global-alert-stack--mobile {
  left: 12px;
  right: 12px;
  bottom: 12px;
  width: auto;
  max-width: none;
}

.global-alert-stack__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.global-alert-stack__item {
  pointer-events: all;
}

/* ── Card ── */
.alert-card {
  border: 1px solid rgba(var(--v-theme-outline-variant), 0.4);
  background: rgb(var(--v-theme-surface-container-lowest)) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  overflow: hidden;
  position: relative;
}

.alert-card__body {
  padding: 14px 14px 16px;
}

.alert-card__avatar {
  margin-top: 1px;
}

.alert-card__title {
  margin: 0;
  line-height: 1.3;
}

.alert-card__text {
  margin: 0;
  line-height: 1.5;
  word-break: break-word;
}

.alert-card__close {
  margin: -4px -4px 0 0;
  opacity: 0.7;
  transition: opacity 0.15s ease;
}

.alert-card__close:hover {
  opacity: 1;
}

/* ── Colored left border accent per type ── */
.alert-card--error {
  border-left: 3px solid rgb(var(--v-theme-error)) !important;
}

.alert-card--warning {
  border-left: 3px solid rgb(var(--v-theme-warning)) !important;
}

.alert-card--success {
  border-left: 3px solid rgb(var(--v-theme-success)) !important;
}

.alert-card--info {
  border-left: 3px solid rgb(var(--v-theme-info)) !important;
}

/* ── Progress bar (auto-dismiss countdown) ── */
.alert-card__progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  width: 100%;
  transform-origin: left;
  animation: progress-shrink linear forwards;
  border-radius: 0 0 0 0;
}

.alert-card__progress--success {
  background: rgb(var(--v-theme-success));
}

.alert-card__progress--info {
  background: rgb(var(--v-theme-info));
}

.alert-card__progress--warning {
  background: rgb(var(--v-theme-warning));
}

.alert-card__progress--error {
  background: rgb(var(--v-theme-error));
}

@keyframes progress-shrink {
  from { transform: scaleX(1); }
  to   { transform: scaleX(0); }
}

/* ── TransitionGroup animations ── */
.alert-stack-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.alert-stack-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  width: 100%;
}

.alert-stack-move {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.alert-stack-enter-from {
  opacity: 0;
  transform: translateX(40px) scale(0.96);
}

.alert-stack-leave-to {
  opacity: 0;
  transform: translateX(40px) scale(0.96);
}
</style>
