import classes from './FieldInputs.module.css'

export const INPUT_CLASSES = { input: classes.input, label: classes.label }

export const DATE_FORMAT = 'YYYY-MM-DD'

export const FLOATING_PROPS = { hideDetached: false }

export const exportedIn = (ms: number) => `exported in ${(ms / 1000).toFixed(1)} s`
