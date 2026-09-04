import { db } from '../database';

export type Good = {
	id: number;
	name: string;
	type: string;
};

export const getGoods = async (): Promise<Good[]> => {
	return db.getAllAsync<Good>(
		'SELECT id, name, type FROM goods ORDER BY name;'
	);
};

export const requireGood = async (goodId: number): Promise<Good> => {
	const good = await db.getFirstAsync<Good>(
		'SELECT id, name, type FROM goods WHERE id = ?;',
		[goodId]
	);

	if (!good) {
		throw new Error(`Товар з ID ${goodId} не знайдено`);
	}

	return good;
};