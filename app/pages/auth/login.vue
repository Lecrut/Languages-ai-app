<script setup lang="ts">
import { getFirstFormError, hasFormValidationErrors } from '../../helpers/form'
import { getFirebaseAuthErrorKey } from '../../helpers/firebase-auth-error-key'
import { emailRule, minLengthRule, requiredRule } from '../../helpers/rules'
import { useAuthStore } from '../../stores/use-auth-store'
import { useSnackbarStore } from '../../stores/use-snackbar-store'
import { useUserProfileStore } from '../../stores/use-user-profile-store'

definePageMeta({
  middleware: 'guest',
})

const { t, setLocale } = useI18n()
const localePath = useLocalePath()
const authStore = useAuthStore()
const snackbarStore = useSnackbarStore()
const userProfileStore = useUserProfileStore()
const router = useRouter()
const { setPageTitle } = usePageHead()

onMounted(() => {
  setPageTitle(t('login.title'))
})

const email = ref('')
const password = ref('')
const showPassword = ref(false)

const emailRules = computed(() => [
  requiredRule(t('validation.required')),
  emailRule(t('validation.email')),
])

const passwordRules = computed(() => [
  requiredRule(t('validation.required')),
  minLengthRule(6, t('validation.passwordMinLength')),
])

const loginFields = computed(() => [
  {
    value: email.value,
    rules: emailRules.value,
  },
  {
    value: password.value,
    rules: passwordRules.value,
  },
])

const isSubmitDisabled = computed(() => hasFormValidationErrors(loginFields.value))

const handleLogin = async () => {
  const firstError = getFirstFormError(loginFields.value)

  if (firstError) {
    snackbarStore.showError(firstError)
    return
  }

  try {
    await authStore.login(email.value, password.value)

    const profileLanguage = userProfileStore.profile?.appLanguage
    if (profileLanguage === 'pl' || profileLanguage === 'en') {
      await setLocale(profileLanguage)
    }

    await router.push(localePath('/user'))
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
        <VCardTitle class="text-headline-large text-center my-3">{{ t('login.title') }}</VCardTitle>
        <VForm @submit.prevent="handleLogin">
          <VCardText>
            <VTextField
              v-model="email"
              :label="t('login.email')"
              :rules="emailRules"
              type="email"
              variant="outlined"
              class="mb-3" />
            <VTextField
              v-model="password"
              :label="t('login.password')"
              :rules="passwordRules"
              :type="showPassword ? 'text' : 'password'"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              variant="outlined"
              @click:append-inner="showPassword = !showPassword"
            />
          </VCardText>
          <VCardActions class="justify-center pt-0">
            <VBtn
              type="submit"
              color="primary"
              size="large"
              class="px-10"
              :loading="authStore.loading"
              :disabled="isSubmitDisabled"
            >
              {{ t('login.submit') }}
            </VBtn>
          </VCardActions>
        </VForm>

        <VCardText class="pt-2 pb-4 d-flex flex-column align-center text-center ga-1">
          <div class="text-body-medium">{{ t('login.noAccount') }}</div>
          <VBtn
            variant="text"
            size="small"
            color="secondary"
            :to="localePath('/auth/register')">
            {{ t('login.registerNow') }}
          </VBtn>

          <div class="text-body-medium mt-2">{{ t('login.forgotPasswordPrompt') }}</div>
          <VBtn
            variant="text"
            size="small"
            color="secondary"
            :to="localePath('/auth/reset-password')">
            {{ t('login.resetPassword') }}
          </VBtn>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
