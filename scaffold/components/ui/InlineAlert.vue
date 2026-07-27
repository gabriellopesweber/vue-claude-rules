<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** Alert type — controls icon, color and closable defaults */
  type: { type: String, default: 'info' },
  /** Optional bold title line */
  title: { type: String, default: '' },
  /** Custom icon — overrides type default */
  icon: { type: String, default: '' },
  /** Compact (single-line) mode */
  dense: { type: Boolean, default: false },
})

const TYPE_META = {
  success: { icon: 'mdi-check-circle-outline', color: 'success' },
  error:   { icon: 'mdi-alert-circle-outline', color: 'error'   },
  warning: { icon: 'mdi-alert-outline',         color: 'warning' },
  info:    { icon: 'mdi-information-outline',   color: 'info'    },
}

const meta  = computed(() => TYPE_META[props.type] ?? TYPE_META.info)
const resolvedIcon = computed(() => props.icon || meta.value.icon)
</script>

<template>
  <div
    class="inline-alert"
    :class="[`inline-alert--${type}`, { 'inline-alert--dense': dense }]"
  >
    <v-icon
      :icon="resolvedIcon"
      :color="meta.color"
      :size="dense ? 16 : 18"
      class="inline-alert__icon"
    />

    <div class="inline-alert__content">
      <span
        v-if="title"
        class="inline-alert__title"
      >{{ title }}</span>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.inline-alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 12px;
  border-left: 3px solid transparent;
  font-size: 0.8125rem;
  line-height: 1.5;
}

/* Colors */
.inline-alert--success {
  background: rgba(var(--v-theme-success), 0.08);
  border-left-color: rgb(var(--v-theme-success));
  color: rgb(var(--v-theme-on-surface));
}
.inline-alert--error {
  background: rgba(var(--v-theme-error), 0.08);
  border-left-color: rgb(var(--v-theme-error));
  color: rgb(var(--v-theme-on-surface));
}
.inline-alert--warning {
  background: rgba(var(--v-theme-warning), 0.1);
  border-left-color: rgb(var(--v-theme-warning));
  color: rgb(var(--v-theme-on-surface));
}
.inline-alert--info {
  background: rgba(var(--v-theme-info), 0.08);
  border-left-color: rgb(var(--v-theme-info));
  color: rgb(var(--v-theme-on-surface));
}

/* Icon */
.inline-alert__icon {
  flex-shrink: 0;
  margin-top: 1px;
}

/* Content */
.inline-alert__content {
  flex: 1;
  min-width: 0;
  opacity: 0.9;
}

.inline-alert__title {
  display: block;
  font-weight: 600;
  opacity: 1;
  margin-bottom: 2px;
}

/* Dense: title stays inline, separated from the body by a small gap */
.inline-alert--dense .inline-alert__title {
  display: inline;
  margin-bottom: 0;
  margin-right: 6px;
}

/* Dense: single-line, tighter padding */
.inline-alert--dense {
  padding: 7px 12px;
  align-items: center;
}

.inline-alert--dense .inline-alert__icon {
  margin-top: 0;
}
</style>
