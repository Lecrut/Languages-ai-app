<script setup lang="ts">
import { useAuthStore } from '../../stores/use-auth-store'

definePageMeta({
  middleware: 'guest',
})

const { t } = useI18n()
const authStore = useAuthStore()

const email = ref('')
const success = ref(false)

const handleResetPassword = async () => {
  success.value = false

  try {
    await authStore.resetPassword(email.value)
    success.value = true
  }
  catch {
    // Error message is handled in the store and shown in the alert.
  }
}
</script>

<template>
  <VRow class="justify-center">
    <VCol cols="12" sm="10" md="8" lg="5">
      <VCard elevation="6">
        <VCardTitle class="text-h5 d-flex align-center ga-2">
          <VIcon icon="mdi-lock-reset" color="primary" />
          {{ t('resetPassword.title') }}
        </VCardTitle>

        <VCardText>
          <p class="text-body-2 mb-4">{{ t('resetPassword.subtitle') }}</p>

          <VAlert
            v-if="authStore.error"
            type="error"
            variant="tonal"
            class="mb-3"
          >
            {{ authStore.error }}
          </VAlert>

          <VAlert
            v-if="success"
            type="success"
            variant="tonal"
            class="mb-3"
          >
            {{ t('resetPassword.success') }}
          </VAlert>

          <VTextField
            v-model="email"
            :label="t('resetPassword.email')"
            type="email"
            variant="outlined"
            prepend-inner-icon="mdi-email-outline"
          />
        </VCardText>

        <VCardActions class="d-flex flex-column ga-2">
          <VBtn
            color="primary"
            block
            :loading="authStore.loading"
            :disabled="!email"
            @click="handleResetPassword"
          >
            {{ t('resetPassword.submit') }}
          </VBtn>

          <VBtn variant="text" to="/auth/login">
            {{ t('resetPassword.backToLogin') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VCol>
  </VRow>
</template>
