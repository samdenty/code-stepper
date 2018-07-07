const hex = () =>
  Math.random()
    .toString(36)
    .substring(2)

export const random = () => hex() + hex()
