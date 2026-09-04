import { db } from '../database';

export type Ship = {
	id: number;
	game_id: number;
	hull: number;
	deck: number;
	hospital: number;
	caboose: number;
	cabin: number;
	bridge: number;
	last_action: number;
	page: number;
	location: string;
	meat: number;
	vegetables: number;
	grain: number;
	materials: number;
	artifacts: number;
	coins: number;
};

export type ShipUpdate = {
	hull?: number;
	deck?: number;
	hospital?: number;
	caboose?: number;
	cabin?: number;
	bridge?: number;
	lastAction?: number;
	page?: number;
	location?: string;
	meat?: number;
	vegetables?: number;
	grain?: number;
	materials?: number;
	artifacts?: number;
	coins?: number;
};

export const getShip = async (
	gameId: number
): Promise<Ship | null> => {
	return db.getFirstAsync<Ship>(
		`
      SELECT
        id,
        game_id,
        hull,
        deck,
        hospital,
        caboose,
        cabin,
        bridge,
        last_action,
        page,
        location,
        meat,
        vegetables,
        grain,
        materials,
        artifacts,
        coins
      FROM ships
      WHERE game_id = ?;
    `,
		[gameId]
	);
};

export const updateShip = async (
	gameId: number,
	input: ShipUpdate
): Promise<void> => {
	const assignments: string[] = [];
	const values: Array<string | number | null | Uint8Array> = [];

	const fields: Array<{
		key: keyof ShipUpdate;
		column: string;
	}> = [
			{ key: 'hull', column: 'hull' },
			{ key: 'deck', column: 'deck' },
			{ key: 'hospital', column: 'hospital' },
			{ key: 'caboose', column: 'caboose' },
			{ key: 'cabin', column: 'cabin' },
			{ key: 'bridge', column: 'bridge' },
			{ key: 'lastAction', column: 'last_action' },
			{ key: 'page', column: 'page' },
			{ key: 'location', column: 'location' },
			{ key: 'meat', column: 'meat' },
			{ key: 'vegetables', column: 'vegetables' },
			{ key: 'grain', column: 'grain' },
			{ key: 'materials', column: 'materials' },
			{ key: 'artifacts', column: 'artifacts' },
			{ key: 'coins', column: 'coins' },
		];

	for (const field of fields) {
		const value = input[field.key];

		if (value === undefined) {
			continue;
		}

		assignments.push(`${field.column} = ?`);
		values.push(value);
	}

	if (assignments.length === 0) {
		return;
	}

	const result = await db.runAsync(
		`
      UPDATE ships
      SET ${assignments.join(', ')}
      WHERE game_id = ?;
    `,
		...values,
		gameId
	);

	if (result.changes === 0) {
		throw new Error(
			`Корабель для гри ${gameId} не знайдений.`
		);
	}
};