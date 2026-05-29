/**
 * Centered animated CSS spinner.
 * @param {object} props
 * @param {'sm'|'md'|'lg'} [props.size='md']
 */
const Spinner = ({ size = 'md' }) => {
  const dimensions = { sm: 20, md: 36, lg: 52 };
  const px = dimensions[size] ?? dimensions.md;

  return (
    <div
      className="inline-block animate-spin rounded-full"
      style={{
        width: px,
        height: px,
        borderWidth: 2.5,
        borderStyle: 'solid',
        borderColor: 'var(--border)',
        borderTopColor: 'var(--primary)',
      }}
      role="status"
      aria-label="Loading"
    />
  );
};

export default Spinner;