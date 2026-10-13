import type { FC } from 'react'

import type { FieldInput } from '../fields'
import {
  CatalogField,
  DateField,
  HeightField,
  ImageField,
  LongField,
  NameField,
  PlaysField,
  TextField,
  type FieldInputProps,
} from './FieldInputs'

export const FIELD_INPUTS: Record<FieldInput, FC<FieldInputProps>> = {
  name: NameField,
  text: TextField,
  long: LongField,
  date: DateField,
  height: HeightField,
  plays: PlaysField,
  image: ImageField,
  catalog: CatalogField,
}
