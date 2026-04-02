export const usePageHead = () => {
  const appName = 'Languages AI'

  const buildFullTitle = (title: string) => `${title} | ${appName}`

  const setPageTitle = (title: string) => {
    useHead({
      title,
      meta: [
        {
          property: 'og:title',
          content: buildFullTitle(title),
        },
      ],
    })
  }

  const setPageDescription = (description: string) => {
    useHead({
      meta: [
        {
          name: 'description',
          content: description,
        },
        {
          property: 'og:description',
          content: description,
        },
      ],
    })
  }

  const setPageMeta = (title: string, description: string) => {
    useHead({
      title,
      meta: [
        {
          name: 'description',
          content: description,
        },
        {
          property: 'og:title',
          content: buildFullTitle(title),
        },
        {
          property: 'og:description',
          content: description,
        },
      ],
    })
  }

  return { setPageTitle, setPageDescription, setPageMeta, appName }
}
