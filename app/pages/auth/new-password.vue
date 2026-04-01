<script setup lang="ts">
import { getFirstFormError, hasFormValidationErrors } from '../../helpers/form'
import { getFirebaseAuthErrorKey } from '../../helpers/firebase-auth-error-key'
import { minLengthRule, requiredRule, sameAsRule } from '../../helpers/rules'
import { useAuthStore } from '../../stores/use-auth-store'
import { useSnackbarStore } from '../../stores/use-snackbar-store'

definePageMeta({
  middleware: 'guest',
})

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const authStore = useAuthStore()
const snackbarStore = useSnackbarStore()

const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const codeValidated = ref(false)
const resetEmail = ref('')

const resetCode = computed(() => {
  const oobCode = route.query.oobCode

  if (typeof oobCode === 'string') {
    return oobCode
  }

  return ''
})

const passwordRules = computed(() => [
  requiredRule(t('validation.required')),
  minLengthRule(6, t('validation.passwordMinLength')),
])

const confirmPasswordRules = computed(() => [
  requiredRule(t('validation.required')),
  sameAsRule(() => password.value, t('newPassword.passwordMismatch')),
])

const newPasswordFields = computed(() => [
  { value: password.value, rules: passwordRules.value },
  { value: confirmPassword.value, rules: confirmPasswordRules.value },
])

const hasInvalidLink = computed(() => !resetCode.value || !codeValidated.value)
const isSubmitDisabled = computed(() => hasFormValidationErrors(newPasswordFields.value) || hasInvalidLink.value)

onMounted(async () => {
  authStore.clearError()

  if (!resetCode.value) {
    snackbarStore.showError(t('errors.auth.invalidActionCode'))
    return
  }

  try {
    const email = await authStore.validatePasswordResetCode(resetCode.value)
    resetEmail.value = email
    codeValidated.value = true
  }
  catch (caughtError) {
    snackbarStore.showError(t(getFirebaseAuthErrorKey(caughtError)))
  }
})

const handleSetNewPassword = async () => {
  const firstError = getFirstFormError(newPasswordFields.value)

  if (firstError) {
    snackbarStore.showError(firstError)
    return
  }

  if (hasInvalidLink.value) {
    snackbarStore.showError(t('errors.auth.invalidActionCode'))
    return
  }

  try {
    await authStore.confirmResetPassword(resetCode.value, password.value)
    snackbarStore.showSuccess(t('newPassword.success'))
    await navigateTo(localePath('/auth/login'))
  }
  catch (caughtError) {
    snackbarStore.showError(t(getFirebaseAuthErrorKey(caughtError)))
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
            :rules="passwordRules"
            :type="showPassword ? 'text' : 'password'"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            variant="outlined"
            class="mb-3"
            :disabled="hasInvalidLink"
            @click:append-inner="showPassword = !showPassword"
          />

          <VTextField
            v-model="confirmPassword"
            :label="t('newPassword.confirmPassword')"
            :rules="confirmPasswordRules"
            :type="showConfirmPassword ? 'text' : 'password'"
            :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
            variant="outlined"
            :disabled="hasInvalidLink"
            @click:append-inner="showConfirmPassword = !showConfirmPassword"
          />
        </VCardText>

        <VCardActions class="justify-center pt-0">
          <VBtn
            color="primary"
            size="large"
            class="px-10"
            :loading="authStore.loading"
            :disabled="isSubmitDisabled"
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
