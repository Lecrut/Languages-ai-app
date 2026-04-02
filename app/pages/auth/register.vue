<script setup lang="ts">
import { getFirstFormError, hasFormValidationErrors } from '../../helpers/form'
import { getFirebaseAuthErrorKey } from '../../helpers/firebase-auth-error-key'
import { emailRule, minLengthRule, requiredRule, sameAsRule } from '../../helpers/rules'
import { useAuthStore } from '../../stores/use-auth-store'
import { useSnackbarStore } from '../../stores/use-snackbar-store'

definePageMeta({
  middleware: 'guest',
})

const { t } = useI18n()
const localePath = useLocalePath()
const authStore = useAuthStore()
const snackbarStore = useSnackbarStore()
const router = useRouter()
const { setPageTitle } = usePageHead()

onMounted(() => {
  setPageTitle(t('register.title'))
})

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const usernameRules = computed(() => [requiredRule(t('validation.required'))])
const emailRules = computed(() => [
  requiredRule(t('validation.required')),
  emailRule(t('validation.email')),
])
const passwordRules = computed(() => [
  requiredRule(t('validation.required')),
  minLengthRule(6, t('validation.passwordMinLength')),
])
const confirmPasswordRules = computed(() => [
  requiredRule(t('validation.required')),
  sameAsRule(() => password.value, t('register.passwordMismatch')),
])

const registerFields = computed(() => [
  { value: username.value, rules: usernameRules.value },
  { value: email.value, rules: emailRules.value },
  { value: password.value, rules: passwordRules.value },
  { value: confirmPassword.value, rules: confirmPasswordRules.value },
])

const isRegisterDisabled = computed(() => hasFormValidationErrors(registerFields.value))

const handleRegister = async () => {
  const firstError = getFirstFormError(registerFields.value)

  if (firstError) {
    snackbarStore.showError(firstError)
    return
  }

  try {
    await authStore.register(email.value, password.value)
    snackbarStore.showSuccess(t('register.success') || 'Registration successful. Please check your email to verify your account.')
    await router.push(localePath('/auth/login'))
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
        <VCardTitle class="text-h5 text-center my-3">{{ t('register.title') }}</VCardTitle>
        <VCardText>
          <VTextField v-model="username" :label="t('register.username')" :rules="usernameRules" variant="outlined" class="mb-3" />
          <VTextField v-model="email" :label="t('register.email')" :rules="emailRules" type="email" variant="outlined" class="mb-3" />
          <VTextField
            v-model="password"
            :label="t('register.password')"
            :rules="passwordRules"
            :type="showPassword ? 'text' : 'password'"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            variant="outlined"
            class="mb-3"
            @click:append-inner="showPassword = !showPassword"
          />
          <VTextField
            v-model="confirmPassword"
            :label="t('register.confirmPassword')"
            :rules="confirmPasswordRules"
            :type="showConfirmPassword ? 'text' : 'password'"
            :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
            variant="outlined"
            @click:append-inner="showConfirmPassword = !showConfirmPassword"
          />
        </VCardText>

        <VCardActions class="justify-center pt-0">
          <VBtn
            color="primary"
            size="large"
            class="px-10"
            :loading="authStore.loading"
            :disabled="isRegisterDisabled"
            @click="handleRegister"
          >
            {{ t('register.submit') }}
          </VBtn>
        </VCardActions>

        <VCardText class="pt-2 pb-4 d-flex flex-column align-center text-center ga-1">
          <div class="text-body-2">{{ t('register.haveAccount') }}</div>
          <VBtn variant="text" size="small" color="secondary" :to="localePath('/auth/login')">
            {{ t('register.loginNow') }}
          </VBtn>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
