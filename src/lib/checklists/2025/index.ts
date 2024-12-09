import AirTrajectory from './AirTrajectory.svelte';
import BungeeDrop from './BungeeDrop.svelte';
import ElectricVehicle from './ElectricVehicle.svelte';
import Helicopter from './Helicopter.svelte';
import MaterialScience from './MaterialScience.svelte';
import Tower from './Tower.svelte';

export default {
	'Air Trajectory': AirTrajectory,
	'Bungee Drop': BungeeDrop,
	'Electric Vehicle': ElectricVehicle,
	Helicopter,
	'Material Science': MaterialScience,
	Tower
} as const;
