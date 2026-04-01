<script setup lang="ts">
import { useAuthStore } from '../../stores/use-auth-store'

definePageMeta({
  middleware: 'guest',
})

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const authStore = useAuthStore()

const password = ref('')
const confirmPassword = ref('')
const codeValidated = ref(false)
const success = ref(false)
const resetEmail = ref('')

const resetCode = computed(() => {
  const oobCode = route.query.oobCode

  if (typeof oobCode === 'string') {
    return oobCode
  }

  return ''
})

const passwordMismatch = computed(() => Boolean(confirmPassword.value) && password.value !== confirmPassword.value)
const isSubmitDisabled = computed(() => !password.value || !confirmPassword.value || passwordMismatch.value || !resetCode.value)
const hasInvalidLink = computed(() => !resetCode.value || (!codeValidated.value && Boolean(authStore.error)))

onMounted(async () => {
  authStore.clearError()

  if (!resetCode.value) {
    return
  }

  try {
    const email = await authStore.validatePasswordResetCode(resetCode.value)
    resetEmail.value = email
    codeValidated.value = true
  }
  catch {
    // Error message is handled in the store and shown in the alert.
  }
})

const handleSetNewPassword = async () => {
  if (isSubmitDisabled.value) {
    return
  }

  try {
    await authStore.confirmResetPassword(resetCode.value, password.value)
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
        <VCardTitle class="text-h5 text-center my-3">{{ t('newPassword.title') }}</VCardTitle>

        <VCardText>
          <p class="text-body-2 mb-4 text-center">{{ t('newPassword.subtitle') }}</p>

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
            {{ t('newPassword.success') }}
          </VAlert>

          <VAlert
            v-if="passwordMismatch"
            type="warning"
            variant="tonal"
            class="mb-3"
          >
            {{ t('newPassword.passwordMismatch') }}
          </VAlert>

          <VTextField
            v-if="resetEmail"
            :model-value="resetEmail"
            :label="t('newPassword.email')"
            variant="outlined"
            readonly
            class="mb-3"
          />

          <VTextField
            v-model="password"
            :label="t('newPassword.password')"
            type="password"
            variant="outlined"
            class="mb-3"
            :disabled="hasInvalidLink || success"
          />

          <VTextField
            v-model="confirmPassword"
            :label="t('newPassword.confirmPassword')"
            type="password"
            variant="outlined"
            :disabled="hasInvalidLink || success"
          />
        </VCardText>

        <VCardActions class="justify-center pt-0">
          <VBtn
            color="primary"
            size="large"
            class="px-10"
            :loading="authStore.loading"
            :disabled="isSubmitDisabled || hasInvalidLink || success"
            @click="handleSetNewPassword"
          >
            {{ t('newPassword.submit') }}
          </VBtn>
        </VCardActions>

        <VCardText class="pt-2 pb-4 d-flex flex-column align-center text-center ga-1">
          <div class="text-body-2">{{ t('newPassword.backToLoginPrompt') }}</div>
          <VBtn variant="text" size="small" color="secondary" :to="localePath('/auth/login')">
            {{ t('newPassword.backToLogin') }}
          </VBtn>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
