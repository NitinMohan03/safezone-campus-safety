import PropTypes from 'prop-types';

function LocationSearchResult({ item, onClick }) {
  const title = item?.name || item?.text || item?.place_name || 'Unknown';
  const subtitle =
    item?.full_address ||
    item?.place_formatted ||
    item?.address ||
    item?.place_name ||
    item?.context ||
    '';

  return (
    <li
      onClick={() => onClick?.(item)}
      className="cursor-pointer border-b border-slate-200/60 px-3 py-2.5 last:border-b-0 hover:bg-primary-100/60"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 text-lg"
          title={item?.feature_type || item?.maki || 'location'}
        ></span>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-900">{title}</span>
          <span className="text-xs text-slate-600">{subtitle}</span>
        </div>
      </div>
    </li>
  );
}

LocationSearchResult.propTypes = {
  item: PropTypes.shape({
    mapbox_id: PropTypes.string,
    name: PropTypes.string,
    full_address: PropTypes.string,
    place_formatted: PropTypes.string,
    feature_type: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
    maki: PropTypes.string,
    place_name: PropTypes.string,
    text: PropTypes.string,
    address: PropTypes.string,
    context: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  }).isRequired,
  onClick: PropTypes.func,
};

LocationSearchResult.defaultProps = {
  onClick: null,
};

export default LocationSearchResult;
