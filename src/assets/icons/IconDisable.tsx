import Svg, {Path} from "react-native-svg";

export default ({size}: {size: number}) => {
	return (
		<Svg viewBox="0 0 24 24" width={size} height={size} fill="none">
			<Path
				d="M3.5 12C3.5 13.0167 3.68333 13.9958 4.05 14.9375C4.41667 15.8792 4.90833 16.725 5.525 17.475L17.475 5.525C16.7083 4.875 15.8583 4.375 14.925 4.025C13.9917 3.675 13.0167 3.5 12 3.5C9.63333 3.5 7.625 4.325 5.975 5.975C4.325 7.625 3.5 9.63333 3.5 12ZM6.525 18.5C7.275 19.15 8.12083 19.6458 9.0625 19.9875C10.0042 20.3292 10.9833 20.5 12 20.5C14.3667 20.5 16.375 19.675 18.025 18.025C19.675 16.375 20.5 14.3667 20.5 12C20.5 10.9833 20.325 10.0083 19.975 9.075C19.625 8.14167 19.1333 7.29167 18.5 6.525L6.525 18.5ZM2 12C2 10.6167 2.2625 9.31667 2.7875 8.1C3.3125 6.88333 4.025 5.825 4.925 4.925C5.825 4.025 6.88333 3.3125 8.1 2.7875C9.31667 2.2625 10.6167 2 12 2C13.3833 2 14.6833 2.2625 15.9 2.7875C17.1167 3.3125 18.175 4.025 19.075 4.925C19.975 5.825 20.6875 6.88333 21.2125 8.1C21.7375 9.31667 22 10.6167 22 12C22 13.3833 21.7375 14.6833 21.2125 15.9C20.6875 17.1167 19.975 18.175 19.075 19.075C18.175 19.975 17.1167 20.6875 15.9 21.2125C14.6833 21.7375 13.3833 22 12 22C10.6167 22 9.31667 21.7375 8.1 21.2125C6.88333 20.6875 5.825 19.975 4.925 19.075C4.025 18.175 3.3125 17.1167 2.7875 15.9C2.2625 14.6833 2 13.3833 2 12Z"
				fill="#999999"
			/>
		</Svg>
	);
};
