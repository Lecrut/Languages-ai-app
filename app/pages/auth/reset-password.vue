<script setup lang="ts">
import { useAuthStore } from '../../stores/use-auth-store'

definePageMeta({
  middleware: 'guest',
})

const { t } = useI18n()
const localePath = useLocalePath()
const authStore = useAuthStore()

const email = ref('')
const success = ref(false)

const handleResetPassword = async () => {
  success.value = false

  try {
    const redirectUrl = import.meta.client
      ? new URL(localePath('/auth/new-password'), window.location.origin).toString()
      : undefined

    await authStore.resetPassword(email.value, redirectUrl)
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
      <VCard>
        <VCardTitle class="text-h5 text-center my-3">{{ t('resetPassword.title') }}</VCardTitle>

        <VCardText>
          <p class="text-body-2 mb-4 text-center">{{ t('resetPassword.subtitle') }}</p>

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

        <VCardActions class="justify-center pt-0">
          <VBtn
            color="primary"
            size="large"
            class="px-10"
            :loading="authStore.loading"
            :disabled="!email"
            @click="handleResetPassword"
          >
            {{ t('resetPassword.submit') }}
          </VBtn>
        </VCardActions>

        <VCardText class="pt-2 pb-4 d-flex flex-column align-center text-center ga-1">
          <div class="text-body-2">{{ t('resetPassword.haveAccount') }}</div>
          <VBtn variant="text" size="small" color="secondary" :to="localePath('/auth/login')">
            {{ t('resetPassword.backToLogin') }}
          </VBtn>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
