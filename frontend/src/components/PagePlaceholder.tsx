type Props = {
  title: string;
  description: string;
};

// Temporary placeholder used by every module page until features are built.
export default function PagePlaceholder({ title, description }: Props) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-prose text-sm text-gray-500">{description}</p>
      <div className="mt-6 rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-400">
        Coming soon
      </div>
    </div>
  );
}
