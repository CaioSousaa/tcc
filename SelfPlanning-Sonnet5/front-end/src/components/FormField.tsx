interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function FormField({ label, id, ...inputProps }: FormFieldProps) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        {...inputProps}
      />
    </div>
  );
}
