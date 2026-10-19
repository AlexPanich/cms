"use client";

import { type Control, Controller, type FieldPath, type FieldValues } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "./rich-text-editor";

type BaseProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description?: string;
};

export function FormInput<T extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
  onBlur,
  ...inputProps
}: BaseProps<T> & Omit<React.ComponentProps<typeof Input>, "name" | "value" | "onChange">) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Input
            {...inputProps}
            {...field}
            // Свои disabled и onBlur объединяем с полями react-hook-form, а не затираем ими.
            disabled={disabled ?? field.disabled}
            onBlur={(event) => {
              field.onBlur();
              onBlur?.(event);
            }}
            value={field.value ?? ""}
            id={name}
            aria-invalid={fieldState.invalid}
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

export function FormTextarea<T extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
  onBlur,
  ...textareaProps
}: BaseProps<T> & Omit<React.ComponentProps<typeof Textarea>, "name" | "value" | "onChange">) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Textarea
            {...textareaProps}
            {...field}
            // Свои disabled и onBlur объединяем с полями react-hook-form, а не затираем ими.
            disabled={disabled ?? field.disabled}
            onBlur={(event) => {
              field.onBlur();
              onBlur?.(event);
            }}
            value={field.value ?? ""}
            id={name}
            aria-invalid={fieldState.invalid}
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

export function FormCheckbox<T extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
}: BaseProps<T> & { disabled?: boolean }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field orientation="horizontal" data-invalid={fieldState.invalid}>
          <Checkbox
            id={name}
            name={field.name}
            checked={Boolean(field.value)}
            onCheckedChange={field.onChange}
            disabled={disabled}
          />
          <FieldContent>
            <FieldLabel htmlFor={name}>{label}</FieldLabel>
            {description && <FieldDescription>{description}</FieldDescription>}
            <FieldError errors={[fieldState.error]} />
          </FieldContent>
        </Field>
      )}
    />
  );
}

// Набор флажков для поля-массива (роли пользователя, права роли).
export function FormCheckboxGroup<T extends FieldValues, V extends string | number>({
  control,
  name,
  label,
  description,
  options,
  disabled,
}: BaseProps<T> & {
  options: readonly { value: V; label: string; description?: string }[];
  disabled?: boolean;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const selected: V[] = field.value ?? [];
        const toggle = (value: V, checked: boolean) =>
          field.onChange(checked ? [...selected, value] : selected.filter((v) => v !== value));

        return (
          <FieldSet data-invalid={fieldState.invalid}>
            <FieldLegend variant="label">{label}</FieldLegend>
            {description && <FieldDescription>{description}</FieldDescription>}
            <div className="flex flex-col gap-3">
              {options.map((option) => {
                const id = `${name}-${option.value}`;
                return (
                  <Field key={option.value} orientation="horizontal">
                    <Checkbox
                      id={id}
                      checked={selected.includes(option.value)}
                      onCheckedChange={(checked) => toggle(option.value, checked)}
                      disabled={disabled}
                    />
                    <FieldContent>
                      <FieldLabel htmlFor={id} className="font-normal">
                        {option.label}
                      </FieldLabel>
                      {option.description && (
                        <FieldDescription>{option.description}</FieldDescription>
                      )}
                    </FieldContent>
                  </Field>
                );
              })}
            </div>
            <FieldError errors={[fieldState.error]} />
          </FieldSet>
        );
      }}
    />
  );
}

export function FormSelect<T extends FieldValues>({
  control,
  name,
  label,
  description,
  options,
}: BaseProps<T> & { options: readonly { value: string; label: string }[] }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Select
            items={options}
            value={field.value}
            onValueChange={(value) => field.onChange(value)}
          >
            <SelectTrigger id={name} className="w-full" aria-invalid={fieldState.invalid}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FieldDescription>{description}</FieldDescription>}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

export function FormRichText<T extends FieldValues>({
  control,
  name,
  label,
  description,
}: BaseProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          {/* contenteditable нельзя связать с label через htmlFor — используем aria-labelledby. */}
          <FieldLabel id={`${name}-label`}>{label}</FieldLabel>
          <RichTextEditor
            id={name}
            labelledBy={`${name}-label`}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            invalid={fieldState.invalid}
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
