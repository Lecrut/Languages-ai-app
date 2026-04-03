<script setup lang="ts">
import { getFirstFormError, hasFormValidationErrors } from '../../helpers/form'
import { getFirebaseAuthErrorKey } from '../../helpers/firebase-auth-error-key'
import { emailRule, requiredRule } from '../../helpers/rules'
import { useAuthStore } from '../../stores/use-auth-store'
import { useSnackbarStore } from '../../stores/use-snackbar-store'

definePageMeta({
  middleware: 'guest',
})

const { t } = useI18n()
const localePath = useLocalePath()
const authStore = useAuthStore()
const snackbarStore = useSnackbarStore()

const email = ref('')

const emailRules = computed(() => [
  requiredRule(t('validation.required')),
  emailRule(t('validation.email')),
])

const resetFields = computed(() => [
  {
    value: email.value,
    rules: emailRules.value,
  },
])

const isSubmitDisabled = computed(() => hasFormValidationErrors(resetFields.value))

const handleResetPassword = async () => {
  const firstError = getFirstFormError(resetFields.value)

  if (firstError) {
    snackbarStore.showError(firstError)
    return
  }

  try {
    const redirectUrl = import.meta.client
      ? new URL(localePath('/auth/new-password'), window.location.origin).toString()
      : undefined

    await authStore.resetPassword(email.value, redirectUrl)
    snackbarStore.showSuccess(t('resetPassword.success'))
  }
  catch (caughtError) {
    snackbarStore.showError(t(getFirebaseAuthErrorKey(caughtError)))
  }
}
</script>

<template>
  <VRow class="justify-center">
    <VCol
      cols="12"
      sm="10"
      md="8"
      lg="5">
      <VCard>
        <VCardTitle class="text-headline-large text-center my-3">{{ t('resetPassword.title') }}</VCardTitle>

        <VCardText>
          <p class="text-body-medium mb-4 text-center">{{ t('resetPassword.subtitle') }}</p>

          <VTextField
            v-model="email"
            :label="t('resetPassword.email')"
            :rules="emailRules"
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
            :disabled="isSubmitDisabled"
            @click="handleResetPassword"
          >
            {{ t('resetPassword.submit') }}
          </VBtn>
        </VCardActions>

        <VCardText class="pt-2 pb-4 d-flex flex-column align-center text-center ga-1">
          <div class="text-body-medium">{{ t('resetPassword.haveAccount') }}</div>
          <VBtn
            variant="text"
            size="small"
            color="secondary"
            :to="localePath('/auth/login')">
            {{ t('resetPassword.backToLogin') }}
          </VBtn>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
